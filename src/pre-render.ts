/**
 * Copyright (c) 2025
 *
 * Pre-render support for the embed classes.
 * @summary Pre-render
 */

import { FrameParams, PreRenderConfig } from './types';
import {
    getCssDimension,
    getScrollableAncestors,
    querySelectorAcrossShadowRoot,
    removeStyleProperties,
    setStyleProperties,
} from './utils';
import { logger } from './utils/logger';
import { ERROR_MESSAGE } from './errors';
import { DEFAULT_EMBED_HEIGHT, DEFAULT_EMBED_WIDTH } from './config';

/**
 * Dataset key used to stash a custom preRenderContainer's original inline
 * `position` while we override it to `relative`. Stored on the container (not
 * per-instance) so the override can be reverted on destroy even when multiple
 * pre-rendered embeds share the same container.
 */
export const PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY = 'tsEmbedOriginalPosition';

export const PRERENDER_WRAPPER_ID_PREFIX = 'tsEmbed-pre-render-wrapper-';

const PRERENDER_PARKED_TRANSFORM = 'translateY(-100%)';

/** The height createWrapper() seeds before anything is measured. */
const UNMEASURED_WRAPPER_HEIGHT = '100vh';

export interface PreRenderIds {
    wrapper: string;
    child: string;
    placeHolder: string;
}

export interface PreRenderEmbedHost {
    getConfig: () => PreRenderConfig;
    getHostElement: () => HTMLElement | undefined;
    getFrameParams: () => FrameParams | undefined;
    isFullHeight: () => boolean;
    getPlaceholder: () => HTMLElement | undefined;
    getOwner: () => PreRenderController | undefined;
    syncStyle: () => void;
    /**
     * The wrapper and child stay as fields on the embed, where subclasses
     * have always read and written them; the controller only borrows them.
     */
    getWrapper: () => HTMLElement | undefined;
    setWrapper: (wrapper: HTMLElement) => void;
    getChild: () => HTMLElement | undefined;
    setChild: (child: HTMLElement) => void;
}

export class PreRenderController {
    public isPreRendered = false;

    public showByDefault = false;

    private containerEl: HTMLElement = document.body;

    private resizeObserver: ResizeObserver | undefined;

    constructor(private readonly host: PreRenderEmbedHost) {}

    public get container(): HTMLElement {
        return this.containerEl;
    }

    public get wrapper(): HTMLElement | undefined {
        return this.host.getWrapper();
    }

    public set wrapper(wrapper: HTMLElement) {
        this.host.setWrapper(wrapper);
    }

    public get child(): HTMLElement | undefined {
        return this.host.getChild();
    }

    public set child(child: HTMLElement) {
        this.host.setChild(child);
    }

    public getIds(): PreRenderIds {
        const { id } = this.host.getConfig();
        return {
            wrapper: `${PRERENDER_WRAPPER_ID_PREFIX}${id}`,
            child: `tsEmbed-pre-render-child-${id}`,
            placeHolder: `tsEmbed-pre-render-placeholder-${id}`,
        };
    }

    public isConnected(): boolean {
        return Boolean(this.wrapper && this.child);
    }

    public connect(): boolean {
        const ids = this.getIds();
        this.wrapper = this.wrapper || document.getElementById(ids.wrapper);
        this.child = this.child || document.getElementById(ids.child);

        if (this.isConnected()) {
            this.isPreRendered = true;
            this.inheritContainer();
        }
        return this.isConnected();
    }

    public attachToContainer(): void {
        const targetContainer = this.resolveContainerTarget();
        this.containerEl = targetContainer;
        this.applyContainerPositioning();
        targetContainer.appendChild(this.wrapper);
    }

    public insertPlaceholder(): HTMLDivElement | undefined {
        const hostElement = this.host.getHostElement();
        if (!hostElement) {
            return undefined;
        }
        const placeholder = this.createPlaceholder();
        // Carry a height fullHeight has already measured onto the fresh
        // placeholder, so a re-show does not flash at frameParams height.
        // UNMEASURED_WRAPPER_HEIGHT is what createWrapper() seeds before
        // anything has been measured; treating that as a measurement is what
        // made a first reveal overshoot to a full viewport.
        const wrapperHeight = this.wrapper.style.height;
        if (
            this.host.isFullHeight()
            && wrapperHeight
            && wrapperHeight !== UNMEASURED_WRAPPER_HEIGHT
        ) {
            placeholder.style.height = wrapperHeight;
        }
        // Remove any stale placeholder from a previous cycle. It is located
        // via a subtree-wide querySelector, so it may be nested deeper than a
        // direct child (E.g.: with fullHeight the host app can wrap it). Use
        // Element.remove() — which detaches from whatever the real parent is —
        // rather than hostElement.removeChild(), which throws NotFoundError
        // when the match is not a direct child.
        hostElement.querySelector(`#${this.getIds().placeHolder}`)?.remove();
        hostElement.appendChild(placeholder);
        return placeholder;
    }

    public trackPlaceholder(): void {
        this.host.syncStyle();
        this.observeSize();
    }

    public reveal(): void {
        removeStyleProperties(this.wrapper, ['z-index', 'opacity', 'overflow', 'transform']);
        // Set rather than removed: a container that carries `pointer-events:
        // none` — the usual styling for a parking root that must not swallow
        // clicks — passes it down, and dropping the property here would leave
        // the inherited `none` in force and the frame dead to input.
        setStyleProperties(this.wrapper, { pointerEvents: 'auto' });
    }

    public conceal(): void {
        const { zIndex } = this.host.getConfig();
        // A hidden pre-render frame must add no scroll space to the host page.
        setStyleProperties(this.wrapper, {
            opacity: '0',
            pointerEvents: 'none',
            zIndex: zIndex !== undefined ? String(zIndex) : '-1000',
            // Resolves to the viewport, so the hidden frame belongs to no
            // scroll container's overflow; syncStyle restores absolute on show.
            position: 'fixed',
            top: '0',
            left: '0',
            overflow: 'hidden',
            // The one exception: a transformed or contained ancestor captures
            // `fixed`; parking above the top edge keeps it out of that
            // overflow.
            transform: PRERENDER_PARKED_TRANSFORM,
        });
        this.disconnectResizeObserver();
        this.host.getPlaceholder()?.remove();
    }

    public syncStyle(): void {
        const placeholder = this.host.getPlaceholder();
        if (!this.isConnected() || !placeholder) {
            logger.error(ERROR_MESSAGE.SYNC_STYLE_CALLED_BEFORE_RENDER);
            return;
        }
        if (!placeholder.isConnected) {
            logger.debug('syncPreRenderStyle skipped: placeholder is detached');
            return;
        }
        // Self-heal if the resolved container was remounted/detached, so we
        // never measure a stale node (which would collapse the wrapper).
        this.reconcileContainer();
        const elBoundingClient = placeholder.getBoundingClientRect();

        const containerEl = this.getCustomContainer();
        const containerRect = containerEl?.getBoundingClientRect() ?? { x: 0, y: 0 };
        const scrollX = containerEl ? containerEl.scrollLeft : window.scrollX;
        const scrollY = containerEl ? containerEl.scrollTop : window.scrollY;

        setStyleProperties(this.wrapper, {
            top: `${elBoundingClient.y - containerRect.y + scrollY}px`,
            left: `${elBoundingClient.x - containerRect.x + scrollX}px`,
            width: `${elBoundingClient.width}px`,
            height: `${elBoundingClient.height}px`,
            position: 'absolute',
        });
    }

    public destroy(): void {
        this.disconnectResizeObserver();
        this.wrapper?.remove();
        this.restoreContainerPosition();
    }

    public createWrapper(): HTMLDivElement {
        const ids = this.getIds();
        document.getElementById(ids.wrapper)?.remove();

        const preRenderWrapper = document.createElement('div');
        preRenderWrapper.id = ids.wrapper;
        setStyleProperties(preRenderWrapper, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100vw',
            height: UNMEASURED_WRAPPER_HEIGHT,
        });
        return preRenderWrapper;
    }

    public createChild(child: string | Node): HTMLElement {
        const ids = this.getIds();
        document.getElementById(ids.child)?.remove();

        if (child instanceof HTMLElement) {
            child.id = ids.child;
            return child;
        }

        const divChildNode = document.createElement('div');
        setStyleProperties(divChildNode, { width: '100%', height: '100%' });
        divChildNode.id = ids.child;

        if (typeof child === 'string') {
            divChildNode.innerHTML = child;
        } else {
            divChildNode.appendChild(child);
        }
        return divChildNode;
    }

    private createPlaceholder(): HTMLDivElement {
        const placeholder = document.createElement('div');
        const { width: frameWidth, height: frameHeight } = this.host.getFrameParams() || {};
        placeholder.style.width = getCssDimension(frameWidth || DEFAULT_EMBED_WIDTH);
        placeholder.style.height = getCssDimension(frameHeight || DEFAULT_EMBED_HEIGHT);
        placeholder.id = this.getIds().placeHolder;
        return placeholder;
    }

    /**
     * Resolves the configured preRenderContainer, or defaults to the host's
     * nearest scrolling ancestor (document.body if none). The absolutely
     * positioned wrapper only follows the page while it sits inside what
     * scrolls, so body is right only when the document itself scrolls — an inner
     * scroller left the frame pinned to the viewport (SCAL-338563). A string
     * selector is re-queried each call so a remounted container resolves fresh.
     */
    private resolveContainerTarget(): HTMLElement {
        const containerConfig = this.host.getConfig().containerSelector;
        let container: Element | null = null;
        if (typeof containerConfig === 'string') {
            try {
                // Resolve against the host's shadow root too, so a selector can
                // target a container inside the same shadow DOM as the embed —
                // document.querySelector alone cannot pierce shadow boundaries.
                container = querySelectorAcrossShadowRoot(
                    containerConfig,
                    this.host.getHostElement(),
                );
            } catch (e) {
                logger.error(`Invalid CSS selector for preRenderContainer: ${containerConfig}`, e);
            }
        } else if (containerConfig) {
            container = containerConfig;
        }
        if (container) {
            return container as HTMLElement;
        }
        const hostElement = this.host.getHostElement();
        if (!hostElement) {
            return document.body;
        }
        return getScrollableAncestors(hostElement)[0] ?? document.body;
    }

    private inheritContainer(): void {
        const owner = this.host.getOwner();
        if (!owner || owner === this) {
            return;
        }
        const ownerContainer = owner.containerEl ?? document.body;
        if (
            this.host.getConfig().containerSelector
            && this.resolveContainerTarget() !== ownerContainer
        ) {
            logger.warn(
                'preRenderContainer is applied only by the component that creates the preRender; '
                    + 'the one passed here is ignored. Set it on the PreRender component instead.',
            );
        }
        this.containerEl = ownerContainer;
        this.applyContainerPositioning();
    }

    private getCustomContainer(): HTMLElement | null {
        const container = this.containerEl;
        return container && container !== document.body ? container : null;
    }

    /**
     * Makes the resolved container a positioning context for the absolutely
     * positioned wrapper, stashing the original inline `position` on the element
     * (once) so destroy() can restore it exactly, leaving no trace. Recording it
     * on the element rather than per-instance lets the override be reverted even
     * when embeds share the same container.
     */
    private applyContainerPositioning(): void {
        const container = this.getCustomContainer();
        if (!container) {
            return;
        }
        if (window.getComputedStyle(container).position !== 'static') {
            return;
        }
        if (container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY] === undefined) {
            container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY] = container.style.position;
        }
        container.style.position = 'relative';
    }

    /**
     * Re-attaches the wrapper to a live container when the previously resolved
     * one has been detached or no longer holds the wrapper — e.g. the host app
     * remounted a custom preRenderContainer, which would otherwise leave a stale
     * reference and collapse the wrapper. Selectors and the auto-resolved
     * scrolling ancestor are both re-resolved; a container passed as an element
     * is left untouched, as there is nothing to re-query.
     */
    private reconcileContainer(): void {
        const { wrapper } = this;
        const stored = this.containerEl;
        // Nothing to reconcile until this instance resolved its container.
        if (!wrapper || !stored) {
            return;
        }
        const storedIsLive = stored === document.body || document.contains(stored);
        if (storedIsLive && stored.contains(wrapper)) {
            return;
        }
        const resolved = this.resolveContainerTarget();
        // Re-resolution yielded the same (still stale) element — nothing we can
        // do, e.g. a detached container passed as an HTMLElement.
        if (resolved === stored && stored.contains(wrapper)) {
            return;
        }
        this.containerEl = resolved;
        this.applyContainerPositioning();
        if (wrapper.parentNode !== resolved) {
            resolved.appendChild(wrapper);
        }
    }

    /**
     * Reverts the custom container's `position` to the value it had before
     * we overrode it to `relative` (see applyContainerPositioning).
     *
     * We restore the original inline value rather than forcing `static`, and we
     * skip the restore if another pre-render wrapper is still mounted inside the
     * same container — a shared container still needs the positioning context.
     */
    private restoreContainerPosition(): void {
        const container = this.containerEl;
        if (!container || container === document.body) {
            return;
        }
        // Drop our reference up front so a destroyed embed never pins a
        // detached container in memory; restoration uses the local handle.
        this.containerEl = document.body;
        const originalPosition = container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY];
        if (originalPosition === undefined) {
            // We never overrode this container's position; nothing to restore.
            return;
        }
        // This instance's own wrapper has already been removed by now, so any
        // match here belongs to another embed still sharing the container — it
        // continues to rely on the positioning context, so leave it in place.
        const hasOtherWrapper = container.querySelector(`[id^="${PRERENDER_WRAPPER_ID_PREFIX}"]`);
        if (hasOtherWrapper) {
            return;
        }
        container.style.position = originalPosition;
        delete container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY];
    }

    /**
     * Re-sizes the wrapper when its placeholder changes size.
     *
     * Position deliberately has no equivalent. An absolutely positioned wrapper
     * follows its containing block for free, so a correctly placed frame is the
     * browser's job and costs nothing; repositioning it on scroll would mean a
     * layout read and a style write per frame to compensate for placing it in
     * the wrong box. Size is the one thing the browser will not do for us: the
     * placeholder grows when the embedded app reports a new height, and the
     * wrapper has to be told.
     */
    private observeSize(): void {
        if (this.host.getConfig().doNotTrackSize || typeof ResizeObserver === 'undefined') {
            return;
        }
        const placeholder = this.host.getPlaceholder();
        if (!placeholder) {
            return;
        }
        this.disconnectResizeObserver();
        this.resizeObserver = new ResizeObserver(() => this.host.syncStyle());
        this.resizeObserver.observe(placeholder);
    }

    private disconnectResizeObserver(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
    }
}
