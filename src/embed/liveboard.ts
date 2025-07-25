/**
 * Copyright (c) 2022
 *
 * Embed a ThoughtSpot Liveboard or visualization
 * https://developers.thoughtspot.com/docs/?pageid=embed-pinboard
 * https://developers.thoughtspot.com/docs/?pageid=embed-a-viz
 * @summary Liveboard & visualization embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { getPreview } from '../utils/graphql/preview-service';
import { ERROR_MESSAGE } from '../errors';
import {
    EmbedEvent,
    MessagePayload,
    Param,
    RuntimeFilter,
    DOMSelector,
    HostEvent,
    SearchLiveboardCommonViewConfig as LiveboardOtherViewConfig,
    BaseViewConfig,
    LiveboardAppEmbedViewConfig,
} from '../types';
import { calculateVisibleElementData, getQueryParamString, isUndefined } from '../utils';
import { getAuthPromise } from './base';
import { TsEmbed, V1Embed } from './ts-embed';
import { addPreviewStylesIfNotPresent } from '../utils/global-styles';
import { TriggerPayload, TriggerResponse } from './hostEventClient/contracts';
import { logger } from '../utils/logger';


/**
 * The configuration for the embedded Liveboard or visualization page view.
 * @group Embed components
 */
export interface LiveboardViewConfig extends BaseViewConfig, LiveboardOtherViewConfig, LiveboardAppEmbedViewConfig {
    /**
     * If set to true, the embedded object container dynamically resizes
     * according to the height of the Liveboard.
     *
     * **Note**:  Using fullHeight loads all visualizations on the
     * Liveboard simultaneously, which results in multiple warehouse
     * queries and potentially a longer wait for the topmost
     * visualizations to display on the screen.
     * Setting `fullHeight` to `false` fetches visualizations
     * incrementally as users scroll the page to view the charts and tables.
     *
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 7.2.1
     * 
     * Supported embed types: `LiveboardEmbed`
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *  fullHeight: true,
     * });
     * ```
     */
    fullHeight?: boolean;
    /**
     * This is the minimum height(in pixels) for a full-height Liveboard.
     * Setting this height helps resolve issues with empty Liveboards and
     * other screens navigable from a Liveboard.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     * @default 500
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   fullHeight: true,
     *   defaultHeight: 600,
     * });
     * ```
     */
    defaultHeight?: number;
    /**
     * @Deprecated If set to true, the context menu in visualizations will be enabled.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    enableVizTransformations:true,
     * })
     * ```
     * @version: SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
     */
    enableVizTransformations?: boolean;
    /**
     * The Liveboard to display in the embedded view.
     * Use either liveboardId or pinboardId to reference the Liveboard to embed.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.3.0 | ThoughtSpot ts7.aug.cl, 7.2.1
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    liveboardId:id of liveboard,
     * })
     */
    liveboardId?: string;
    /**
     * To support backward compatibility
     * @hidden
     */
    pinboardId?: string;
    /**
     * The visualization within the Liveboard to display.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    vizId:'430496d6-6903-4601-937e-2c691821af3c',
     * })
     * ```
     */
    vizId?: string;
    /**
     * If set to true, all filter chips from a
     * Liveboard page will be read-only (no X buttons)
     * 
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.3.0 | ThoughtSpot ts7.aug.cl, 7.2.1.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    preventLiveboardFilterRemoval:true,
     * })
     * ```
     */
    preventLiveboardFilterRemoval?: boolean;
    /**
     * Array of visualization IDs which should be visible when the Liveboard
     * renders. This can be changed by triggering the `SetVisibleVizs`
     * event.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    visibleVizs: [
     *       '430496d6-6903-4601-937e-2c691821af3c',
     *       'f547ec54-2a37-4516-a222-2b06719af726'
     *     ]
     * })
     */
    visibleVizs?: string[];
    /**
     * To support backward compatibility
     * @hidden
     */
    preventPinboardFilterRemoval?: boolean;
    /**
     * Render embedded Liveboards and visualizations in the
     * new Liveboard experience mode.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.14.0 | ThoughtSpot: 8.6.0.cl, 8.8.1-sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    liveboardV2:true,
     * })
     * ```
     */
    liveboardV2?: boolean;
    /**
     * Set a Liveboard tab as an active tab.
     * Specify the tab ID.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    activeTabId:'id-1234',
     * })
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    activeTabId?: string;
    /**
     * Show or hide the tab panel of the embedded Liveboard.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl, 9.8.0.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    hideTabPanel:true,
     * })
     * ```
     */
    hideTabPanel?: boolean;
    /**
     * Show a preview image of the visualization before the visualization loads.
     * Only works for visualizations embeds with a viz id.
     *
     * Also, viz snashot should be enabled in the ThoughtSpot instance.
     * Contact ThoughtSpot support to enable this feature.
     *
     * Since, this will show preview images, be careful that it may show
     * undesired data to the user when using row level security.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *   liveboardId: 'liveboard-id',
     *   vizId: 'viz-id',
     *   showPreviewLoader: true,
     * });
     * embed.render();
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     */
    showPreviewLoader?: boolean;
    /**
     * The Liveboard to run on regular intervals to fetch the cdw token.
     * 
     * Supported embed types: `LiveboardEmbed`  
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot:10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    oAuthPollingInterval: value in milliseconds,
     * })
     */
    oAuthPollingInterval?: number;

    /**
     * The Liveboard is set to force a token fetch during the initial load.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot:10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    isForceRedirect: false,
     * })
     */
    isForceRedirect?: boolean;

    /**
     * The source connection ID for authentication.
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot:10.6.0.cl
     * 
     * Supported embed types: `LiveboardEmbed`
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    dataSourceId: '',
     * })
     */
    dataSourceId?: string;
    /**
     * The list of tab IDs to hide from the embedded.
     * This Tabs will be hidden from their respective LBs.
     * Use this to hide an tabID.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... // other embed view config
     *   hiddenTabs: [
     *    '430496d6-6903-4601-937e-2c691821af3c',
     *    'f547ec54-2a37-4516-a222-2b06719af726'
     *   ]
     * });
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
     */
    hiddenTabs?: string[];
    /**
     * The list of tab IDs to show in the embedded Liveboard.
     * Only the tabs specified in the array will be shown in the Liveboard.
     *
     * Use either `visibleTabs` or `hiddenTabs`.
     * 
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    visibleTabs: [
     *       '430496d6-6903-4601-937e-2c691821af3c',
     *       'f547ec54-2a37-4516-a222-2b06719af726'
     *     ]
     * })
     * ```
     */
    visibleTabs?: string[];
    /**
     * This flag is used to enable/disable the styling and grouping in a Liveboard
     * 
     * Supported embed types: `LiveboardEmbed`, `AppEmbed`
     * @type {boolean}
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    isLiveboardStylingAndGroupingEnabled: true,
     * })
     * ```
     */
    isLiveboardStylingAndGroupingEnabled?: boolean;
    /**
     * This flag is used to enable the full height lazy load data.
     * 
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    // ...other options
     *    fullHeight: true,
     *    lazyLoadingForFullHeight: true,
     * })
     * ```
     * 
     * @type {boolean}
     * @default false
     * @version SDK: 1.40.0 | ThoughtSpot:10.12.0.cl
     */
    lazyLoadingForFullHeight?: boolean;
    /**
     * The margin to be used for lazy loading.
     * 
     * For example, if the margin is set to '10px',
     * the visualization will be loaded 10px before the its top edge is visible in the
     * viewport.
     * 
     * The format is similar to CSS margin.
     * 
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    // ...other options
     *    fullHeight: true,
     *    lazyLoadingForFullHeight: true,
     *   // Using 0px, the visualization will be only loaded when its visible in the viewport.
     *    lazyLoadingMargin: '0px',
     * })
     * ```
     * @type {string}
     * @version SDK: 1.40.0 | ThoughtSpot:10.12.0.cl
     */
    lazyLoadingMargin?: string;
}

/**
 * Embed a ThoughtSpot Liveboard or visualization. When rendered it already
 * waits for the authentication to complete, so you need not wait for
 * `AuthStatus.SUCCESS`.
 * @example
 * ```js
 * import { .. } from '@thoughtspot/visual-embed-sdk';
 * init({ ... });
 * const embed = new LiveboardEmbed("#container", {
 *   liveboardId: <your-id-here>,
 * // .. other params here.
 * })
 * ```
 * @group Embed components
 */
export class LiveboardEmbed extends V1Embed {
    protected viewConfig: LiveboardViewConfig;

    private defaultHeight = 500;


    constructor(domSelector: DOMSelector, viewConfig: LiveboardViewConfig) {
        viewConfig.embedComponentType = 'LiveboardEmbed';
        super(domSelector, viewConfig);
        if (this.viewConfig.fullHeight === true) {
            if (this.viewConfig.vizId) {
                logger.warn('Full height is currently only supported for Liveboard embeds.' +
                    'Using full height with vizId might lead to unexpected behavior.');
            }

            this.on(EmbedEvent.RouteChange, this.setIframeHeightForNonEmbedLiveboard);
            this.on(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
            this.on(EmbedEvent.EmbedIframeCenter, this.embedIframeCenter);
            this.on(EmbedEvent.RequestVisibleEmbedCoordinates, this.requestVisibleEmbedCoordinatesHandler);
        }
    }

    /**
     * Construct a map of params to be passed on to the
     * embedded Liveboard or visualization.
     */
    protected getEmbedParams() {
        let params: any = {};
        params = this.getBaseQueryParams(params);
        const {
            enableVizTransformations,
            fullHeight,
            defaultHeight,
            visibleVizs,
            liveboardV2,
            vizId,
            hideTabPanel,
            activeTabId,
            hideLiveboardHeader,
            showLiveboardDescription,
            showLiveboardTitle,
            isLiveboardHeaderSticky = true,
            isLiveboardCompactHeaderEnabled = false,
            showLiveboardVerifiedBadge = true,
            showLiveboardReverifyBanner = true,
            hideIrrelevantChipsInLiveboardTabs = false,
            enableAskSage,
            enable2ColumnLayout,
            dataPanelV2 = false,
            enableCustomColumnGroups = false,
            oAuthPollingInterval,
            isForceRedirect,
            dataSourceId,
            coverAndFilterOptionInPDF = false,
            isLiveboardStylingAndGroupingEnabled,
        } = this.viewConfig;

        const preventLiveboardFilterRemoval = this.viewConfig.preventLiveboardFilterRemoval
            || this.viewConfig.preventPinboardFilterRemoval;

        if (fullHeight === true) {
            params[Param.fullHeight] = true;
            if (this.viewConfig.lazyLoadingForFullHeight) {
                params[Param.IsLazyLoadingForEmbedEnabled] = true;
                params[Param.RootMarginForLazyLoad] = this.viewConfig.lazyLoadingMargin;
            }
        }
        if (defaultHeight) {
            this.defaultHeight = defaultHeight;
        }
        if (enableVizTransformations !== undefined) {
            params[Param.EnableVizTransformations] = enableVizTransformations.toString();
        }
        if (preventLiveboardFilterRemoval) {
            params[Param.preventLiveboardFilterRemoval] = true;
        }
        if (visibleVizs) {
            params[Param.visibleVizs] = visibleVizs;
        }
        params[Param.livedBoardEmbed] = true;
        if (vizId) {
            params[Param.vizEmbed] = true;
        }
        if (liveboardV2 !== undefined) {
            params[Param.LiveboardV2Enabled] = liveboardV2;
        }
        if (enable2ColumnLayout !== undefined) {
            params[Param.Enable2ColumnLayout] = enable2ColumnLayout;
        }
        if (hideTabPanel) {
            params[Param.HideTabPanel] = hideTabPanel;
        }
        if (hideLiveboardHeader) {
            params[Param.HideLiveboardHeader] = hideLiveboardHeader;
        }
        if (showLiveboardDescription) {
            params[Param.ShowLiveboardDescription] = showLiveboardDescription;
        }
        if (showLiveboardTitle) {
            params[Param.ShowLiveboardTitle] = showLiveboardTitle;
        }
        if (enableAskSage) {
            params[Param.enableAskSage] = enableAskSage;
        }

        if (oAuthPollingInterval !== undefined) {
            params[Param.OauthPollingInterval] = oAuthPollingInterval;
        }

        if (isForceRedirect) {
            params[Param.IsForceRedirect] = isForceRedirect;
        }

        if (dataSourceId !== undefined) {
            params[Param.DataSourceId] = dataSourceId;
        }


        if (isLiveboardStylingAndGroupingEnabled !== undefined) {
            params[Param.IsLiveboardStylingAndGroupingEnabled] = isLiveboardStylingAndGroupingEnabled;
        }

        params[Param.LiveboardHeaderSticky] = isLiveboardHeaderSticky;
        params[Param.LiveboardHeaderV2] = isLiveboardCompactHeaderEnabled;
        params[Param.ShowLiveboardVerifiedBadge] = showLiveboardVerifiedBadge;
        params[Param.ShowLiveboardReverifyBanner] = showLiveboardReverifyBanner;
        params[Param.HideIrrelevantFiltersInTab] = hideIrrelevantChipsInLiveboardTabs;
        params[Param.DataPanelV2Enabled] = dataPanelV2;
        params[Param.EnableCustomColumnGroups] = enableCustomColumnGroups;
        params[Param.CoverAndFilterOptionInPDF] = coverAndFilterOptionInPDF;
        const queryParams = getQueryParamString(params, true);

        return queryParams;
    }

    private getIframeSuffixSrc(liveboardId: string, vizId: string, activeTabId: string) {
        let suffix = `/embed/viz/${liveboardId}`;
        if (activeTabId) {
            suffix = `${suffix}/tab/${activeTabId} `;
        }
        if (vizId) {
            suffix = `${suffix}/${vizId}`;
        }
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();
        suffix = `${suffix}${tsPostHashParams}`;
        return suffix;
    }

    private sendFullHeightLazyLoadData = () => {
        const data = calculateVisibleElementData(this.iFrame);
        this.trigger(HostEvent.VisibleEmbedCoordinates, data);
    }

    /**
     * This is a handler for the RequestVisibleEmbedCoordinates event.
     * It is used to send the visible coordinates data to the host application.
     * @param data The event payload
     * @param responder The responder function
     */
    private requestVisibleEmbedCoordinatesHandler = (data: MessagePayload, responder: any) => {
        logger.info('Sending RequestVisibleEmbedCoordinates', data);
        const visibleCoordinatesData = calculateVisibleElementData(this.iFrame);
        responder({ type: EmbedEvent.RequestVisibleEmbedCoordinates, data: visibleCoordinatesData });
    }

    /**
     * Construct the URL of the embedded ThoughtSpot Liveboard or visualization
     * to be loaded within the iFrame.
     */
    private getIFrameSrc(): string {
        const { vizId, activeTabId } = this.viewConfig;
        const liveboardId = this.viewConfig.liveboardId ?? this.viewConfig.pinboardId;

        if (!liveboardId) {
            this.handleError(ERROR_MESSAGE.LIVEBOARD_VIZ_ID_VALIDATION);
        }
        return `${this.getRootIframeSrc()}${this.getIframeSuffixSrc(
            liveboardId,
            vizId,
            activeTabId,
        )}`;
    }

    /**
     * Set the iframe height as per the computed height received
     * from the ThoughtSpot app.
     * @param data The event payload
     */
    private updateIFrameHeight = (data: MessagePayload) => {
        this.setIFrameHeight(Math.max(data.data, this.defaultHeight));
        this.sendFullHeightLazyLoadData();
    };

    private embedIframeCenter = (data: MessagePayload, responder: any) => {
        const obj = this.getIframeCenter();
        responder({ type: EmbedEvent.EmbedIframeCenter, data: obj });
    };

    private setIframeHeightForNonEmbedLiveboard = (data: MessagePayload) => {
        const { height: frameHeight } = this.viewConfig.frameParams || {};

        const liveboardRelatedRoutes = [
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

        if (liveboardRelatedRoutes.some((path) => data.data.currentPath.startsWith(path))) {
            // Ignore the height reset of the frame, if the navigation is
            // only within the liveboard page.
            return;
        }
        this.setIFrameHeight(frameHeight || this.defaultHeight);
    };

    private setActiveTab(data: { tabId: string }) {
        if (!this.viewConfig.vizId) {
            const prefixPath = this.iFrame.src.split('#/')[1].split('/tab')[0];
            const path = `${prefixPath}/tab/${data.tabId}`;
            super.trigger(HostEvent.Navigate, path);
        }
    }

    private async showPreviewLoader() {
        if (!this.viewConfig.showPreviewLoader || !this.viewConfig.vizId) {
            return;
        }

        try {
            const preview = await getPreview(
                this.thoughtSpotHost,
                this.viewConfig.vizId,
                this.viewConfig.liveboardId,
            );

            if (!preview.vizContent) {
                return;
            }
            addPreviewStylesIfNotPresent();

            const div = document.createElement('div');
            div.innerHTML = `
                <div class=ts-viz-preview-loader>
                    ${preview.vizContent}
                </div>
                `;
            const previewDiv = div.firstElementChild as HTMLElement;
            this.el.appendChild(previewDiv);
            this.el.style.position = 'relative';
            this.on(EmbedEvent.Data, () => {
                previewDiv.remove();
            });
        } catch (error) {
            console.error('Error fetching preview', error);
        }
    }

    protected beforePrerenderVisible(): void {
        const embedObj = (this.insertedDomEl as any)?.[this.embedNodeKey] as LiveboardEmbed;

        if (isUndefined(embedObj)) return;

        const showDifferentLib = this.viewConfig.liveboardId
            && embedObj.viewConfig.liveboardId !== this.viewConfig.liveboardId;

        if (showDifferentLib) {
            const libId = this.viewConfig.liveboardId;
            this.navigateToLiveboard(libId);
        }
    }

    protected async handleRenderForPrerender(): Promise<TsEmbed> {
        if (isUndefined(this.viewConfig.liveboardId)) {
            return this.prerenderGeneric();
        }
        return super.handleRenderForPrerender();
    }

    /**
     * Triggers an event to the embedded app
     * @param {HostEvent} messageType The event type
     * @param {any} data The payload to send with the message
     * @returns A promise that resolves with the response from the embedded app
     */
    public trigger<HostEventT extends HostEvent, PayloadT>(
        messageType: HostEventT,
        data: TriggerPayload<PayloadT, HostEventT> = ({} as any),
    ): Promise<TriggerResponse<PayloadT, HostEventT>> {
        const dataWithVizId: any = data;
        if (messageType === HostEvent.SetActiveTab) {
            this.setActiveTab(data as { tabId: string });
            return Promise.resolve(null);
        }
        if (typeof dataWithVizId === 'object' && this.viewConfig.vizId) {
            dataWithVizId.vizId = this.viewConfig.vizId;
        }
        return super.trigger(messageType, dataWithVizId);
    }
    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    public destroy() {
        super.destroy();
        this.unregisterLazyLoadEvents();
    }

    private postRender() {
        this.registerLazyLoadEvents();
    }

    private registerLazyLoadEvents() {
        if (this.viewConfig.fullHeight && this.viewConfig.lazyLoadingForFullHeight) {
            // TODO: Use passive: true, install modernizr to check for passive
            window.addEventListener('resize', this.sendFullHeightLazyLoadData);
            window.addEventListener('scroll', this.sendFullHeightLazyLoadData, true);
        }
    }

    private unregisterLazyLoadEvents() {
        if (this.viewConfig.fullHeight && this.viewConfig.lazyLoadingForFullHeight) {
            window.removeEventListener('resize', this.sendFullHeightLazyLoadData);
            window.removeEventListener('scroll', this.sendFullHeightLazyLoadData);
        }
    }

    /**
     * Render an embedded ThoughtSpot Liveboard or visualization
     * @param renderOptions An object specifying the Liveboard ID,
     * visualization ID and the runtime filters.
     */
    public async render(): Promise<LiveboardEmbed> {
        await super.render();

        const src = this.getIFrameSrc();
        await this.renderV1Embed(src);
        this.showPreviewLoader();

        this.postRender();
        return this;
    }

    public navigateToLiveboard(liveboardId: string, vizId?: string, activeTabId?: string) {
        const path = this.getIframeSuffixSrc(liveboardId, vizId, activeTabId);
        this.viewConfig.liveboardId = liveboardId;
        this.viewConfig.activeTabId = activeTabId;
        this.viewConfig.vizId = vizId;
        if (this.isRendered) {
            this.trigger(HostEvent.Navigate, path.substring(1));
        } else if (this.viewConfig.preRenderId) {
            this.preRender(true);
        } else {
            this.render();
        }
    }

    /**
     * Returns the full url of the Liveboard/visualization which can be used to open
     * this Liveboard inside the full ThoughtSpot application in a new tab.
     * @returns url string
     */
    public getLiveboardUrl(): string {
        let url = `${this.thoughtSpotHost}/#/pinboard/${this.viewConfig.liveboardId}`;
        if (this.viewConfig.activeTabId) {
            url = `${url}/tab/${this.viewConfig.activeTabId}`;
        }

        if (this.viewConfig.vizId) {
            url = `${url}/${this.viewConfig.vizId}`;
        }

        return url;
    }
}

/**
 * @hidden
 */
export class PinboardEmbed extends LiveboardEmbed { }
