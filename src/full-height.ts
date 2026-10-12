/**
 * Copyright (c) 2025
 *
 * Full-height support for the Liveboard and app embeds.
 * @summary Full height
 */

import {
    BaseViewConfig,
    EmbedEvent,
    FullHeightViewConfig,
    HostEvent,
    MessageCallback,
    MessagePayload,
    Param,
    QueryParams,
} from './types';
import {
    calculateElementCenter,
    calculateVisibleElementData,
    getEffectiveClippingAncestors,
    getScrollableAncestors,
    isValidCssMargin,
} from './utils';
import { logger } from './utils/logger';
import { DEFAULT_LAZY_LOADING_MARGIN } from './config';

/**
 * The height the embed falls back to when the host app has not configured
 * `minimumHeight` or `defaultHeight`.
 */
const DEFAULT_MINIMUM_HEIGHT = 500;

/**
 * Routes that are part of the Liveboard experience itself. Navigating between
 * these does not reset the frame height, because the ThoughtSpot app keeps
 * reporting a height of its own for them.
 */
const LIVEBOARD_RELATED_ROUTES = [
    '/pinboard/',
    '/insights/pinboard/',
    '/schedules/',
    '/embed/viz/',
    '/embed/insights/viz/',
    '/liveboard/',
    '/insights/liveboard/',
    '/tsl-editor/PINBOARD_ANSWER_BOOK/',
    '/import-tsl/PINBOARD_ANSWER_BOOK/',
];

/**
 * The slice of an embed's view config the full-height controller reads.
 */
export type FullHeightControllerViewConfig = FullHeightViewConfig &
    Pick<BaseViewConfig, 'frameParams'>;

/**
 * The subset of the embed the full-height controller drives. Keeping this
 * narrow lets the controller stay independent of the embed class hierarchy.
 */
export interface FullHeightEmbedHost {
    /**
     * Returns the embedded iframe. The iframe only exists once the embed has
     * rendered, so this is a callback rather than a value.
     */
    getIframe: () => HTMLIFrameElement;
    /**
     * Sets the height of the embed container.
     */
    setFrameHeight: (height: number | string) => void;
    /**
     * Registers an SDK-owned handler for an embed event.
     */
    on: (eventType: EmbedEvent, callback: MessageCallback) => void;
    /**
     * Sends a host event to the embedded ThoughtSpot app.
     */
    trigger: (hostEvent: HostEvent, data: unknown) => void;
}

/**
 * Owns every piece of full-height behavior for an embed: the height
 * negotiation with the ThoughtSpot app, the query parameters that switch the
 * feature on, and the viewport listeners that drive lazy loading.
 *
 * The controller is inert unless `fullHeight` is enabled, so embeds can create
 * one unconditionally.
 */
export class FullHeightController {
    private scrollContainers: HTMLElement[] = [];

    private resizeObserver: ResizeObserver | undefined;

    private config: FullHeightControllerViewConfig;

    constructor(
        viewConfig: FullHeightControllerViewConfig,
        private readonly host: FullHeightEmbedHost,
    ) {
        this.config = FullHeightController.withLazyLoadingDefaults(viewConfig);
        this.registerEventHandlers();
    }

    /**
     * The view config the controller runs on: the host app's own config with
     * the lazy-loading defaults filled in. Read-only, so the only way to change
     * it is through the setter, which re-resolves the defaults.
     */
    public get viewConfig(): Readonly<FullHeightControllerViewConfig> {
        return this.config;
    }

    /**
     * Replaces the view config the controller runs on and re-resolves the
     * lazy-loading defaults against it. The config the caller passes is never
     * written to; the controller keeps a copy of its own.
     */
    public set viewConfig(viewConfig: Readonly<FullHeightControllerViewConfig>) {
        this.config = FullHeightController.withLazyLoadingDefaults(viewConfig);
    }

    /**
     * The view config with the lazy-loading settings the embed falls back to
     * when the host app has not chosen its own.
     *
     * Pure by design: it returns a new config rather than writing to the one it
     * is given, so the host app's object is left untouched.
     * @param viewConfig The embed's view config
     * @returns A copy with the defaults filled in, host app choices preserved
     */
    private static withLazyLoadingDefaults(
        viewConfig: Readonly<FullHeightControllerViewConfig>,
    ): FullHeightControllerViewConfig {
        return {
            ...viewConfig,
            lazyLoadingForFullHeight:
                viewConfig.lazyLoadingForFullHeight === undefined
                    ? true
                    : viewConfig.lazyLoadingForFullHeight,
            enableScrollableContainerLazyLoading:
                viewConfig.enableScrollableContainerLazyLoading === undefined
                    ? true
                    : viewConfig.enableScrollableContainerLazyLoading,
            lazyLoadingMargin:
                viewConfig.lazyLoadingMargin === undefined
                    ? DEFAULT_LAZY_LOADING_MARGIN
                    : viewConfig.lazyLoadingMargin,
        };
    }

    /**
     * Whether the host app asked for a full-height embed.
     */
    private get isEnabled(): boolean {
        return this.config.fullHeight === true;
    }

    /**
     * Whether visualizations should load as they scroll into view, which
     * requires the SDK to report the visible region of the embed.
     */
    private get isLazyLoadEnabled(): boolean {
        return this.isEnabled && !!this.config.lazyLoadingForFullHeight;
    }

    /**
     * The floor for the frame height. `defaultHeight` is the deprecated
     * spelling of `minimumHeight` and is still honored for compatibility.
     */
    public get minimumHeight(): number {
        const { minimumHeight, defaultHeight } = this.config;
        return minimumHeight || defaultHeight || DEFAULT_MINIMUM_HEIGHT;
    }

    /**
     * Registers the embed event handlers the feature depends on. Called from
     * the constructor, so the handlers are in place before `render`.
     */
    private registerEventHandlers(): void {
        if (!this.isEnabled) {
            return;
        }
        this.host.on(EmbedEvent.RouteChange, this.handleRouteChange);
        this.host.on(EmbedEvent.EmbedHeight, this.handleEmbedHeight);
        this.host.on(EmbedEvent.EmbedIframeCenter, this.handleEmbedIframeCenter);
        this.host.on(
            EmbedEvent.RequestVisibleEmbedCoordinates,
            this.handleRequestVisibleCoordinates,
        );
    }

    /**
     * Adds the full-height query parameters to the embed URL params.
     * @param params The query parameters being built by the embed
     */
    public addQueryParams(params: QueryParams): void {
        if (!this.isEnabled) {
            return;
        }
        params[Param.fullHeight] = true;
        if (!this.config.lazyLoadingForFullHeight) {
            return;
        }
        params[Param.IsLazyLoadingForEmbedEnabled] = true;
        if (isValidCssMargin(this.config.lazyLoadingMargin)) {
            params[Param.RootMarginForLazyLoad] = this.config.lazyLoadingMargin;
        }
    }

    /**
     * Attaches the viewport listeners that keep lazy loading in sync. Call this
     * once the embed has rendered and the iframe exists.
     */
    public onRender(): void {
        this.registerLazyLoadListeners();
    }

    /**
     * Detaches every listener and observer owned by the controller.
     */
    public destroy(): void {
        this.unregisterLazyLoadListeners();
    }

    /**
     * Sets the frame height to the height reported by the ThoughtSpot app,
     * never going below the configured minimum.
     */
    private handleEmbedHeight = (payload: MessagePayload): void => {
        const height = Number(payload?.data);
        if (!isNaN(height)) {
            this.host.setFrameHeight(Math.max(height, this.minimumHeight));
        }
        this.sendVisibleCoordinates();
    };

    /**
     * Answers the app's request for the center of the visible embed region.
     */
    private handleEmbedIframeCenter = (
        payload: MessagePayload,
        responder?: (data: any) => void,
    ): void => {
        const iframe = this.host.getIframe();
        if (!iframe) {
            return;
        }
        responder?.({
            type: EmbedEvent.EmbedIframeCenter,
            data: calculateElementCenter(iframe),
        });
    };

    /**
     * Answers the app's request for the currently visible embed coordinates.
     */
    private handleRequestVisibleCoordinates = (
        payload: MessagePayload,
        responder?: (data: any) => void,
    ): void => {
        logger.info('Sending RequestVisibleEmbedCoordinates', payload);
        responder?.({
            type: EmbedEvent.RequestVisibleEmbedCoordinates,
            data: this.getVisibleCoordinates(),
        });
    };

    /**
     * Resets the frame height when the app navigates away from a Liveboard,
     * since only Liveboard routes report a height of their own.
     */
    private handleRouteChange = (payload: MessagePayload): void => {
        const currentPath: string = payload?.data?.currentPath;
        if (!currentPath) {
            return;
        }
        if (LIVEBOARD_RELATED_ROUTES.some((route) => currentPath.startsWith(route))) {
            return;
        }
        this.host.setFrameHeight(this.config.frameParams?.height || this.minimumHeight);
    };

    /**
     * Pushes the visible embed region to the app so it can decide which
     * visualizations to load.
     */
    private sendVisibleCoordinates = (): void => {
        if (!this.isLazyLoadEnabled) {
            return;
        }
        const coordinates = this.getVisibleCoordinates();
        if (coordinates) {
            this.host.trigger(HostEvent.VisibleEmbedCoordinates, coordinates);
        }
    };

    private getVisibleCoordinates() {
        const iframe = this.host.getIframe();
        if (!iframe) {
            return null;
        }
        return calculateVisibleElementData(
            iframe,
            this.config.enableScrollableContainerLazyLoading,
        );
    }

    private registerLazyLoadListeners(): void {
        if (!this.isLazyLoadEnabled || !this.host.getIframe()) {
            return;
        }
        // Re-registering is safe: drop whatever a previous render attached.
        this.unregisterLazyLoadListeners();
        // TODO: Use passive: true, install modernizr to check for passive
        window.addEventListener('resize', this.sendVisibleCoordinates);
        window.addEventListener('scroll', this.sendVisibleCoordinates, true);
        if (!this.config.enableScrollableContainerLazyLoading) {
            return;
        }
        this.observeScrollableContainers();
    }

    /**
     * Tracks the ancestors that can scroll or clip the embed, so the visible
     * region stays correct when the embed lives inside its own scroll
     * container rather than the page.
     */
    private observeScrollableContainers(): void {
        const iFrame = this.host.getIframe();
        this.scrollContainers = getScrollableAncestors(iFrame);
        this.scrollContainers.forEach((scrollContainer) => {
            scrollContainer.addEventListener('scroll', this.sendVisibleCoordinates);
        });
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        const resizeTargets = new Set(
            [iFrame.parentElement, ...getEffectiveClippingAncestors(iFrame)].filter(
                Boolean,
            ) as HTMLElement[],
        );
        this.resizeObserver = new ResizeObserver(this.sendVisibleCoordinates);
        resizeTargets.forEach((resizeTarget) => {
            this.resizeObserver.observe(resizeTarget);
        });
    }

    private unregisterLazyLoadListeners(): void {
        if (!this.isLazyLoadEnabled) {
            return;
        }
        window.removeEventListener('resize', this.sendVisibleCoordinates);
        window.removeEventListener('scroll', this.sendVisibleCoordinates, true);
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.scrollContainers.forEach((scrollContainer) => {
            scrollContainer.removeEventListener('scroll', this.sendVisibleCoordinates);
        });
        this.scrollContainers = [];
    }
}
