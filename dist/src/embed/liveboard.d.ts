/**
 * Copyright (c) 2022
 *
 * Embed a ThoughtSpot Liveboard or visualization
 * https://developers.thoughtspot.com/docs/embed-liveboard
 * https://developers.thoughtspot.com/docs/embed-a-viz
 * @summary Liveboard & visualization embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import { DOMSelector, HostEvent, SearchLiveboardCommonViewConfig as LiveboardOtherViewConfig, BaseViewConfig, LiveboardAppEmbedViewConfig, ContextType, DefaultAppInitData } from '../types';
import { TsEmbed, V1Embed } from './ts-embed';
import { TriggerPayload, TriggerResponse } from './hostEventClient/contracts';
import { SpotterChatViewConfig } from './conversation';
import { SpotterVizConfig } from './spotter-viz-utils';
/**
 * APP_INIT data shape for LiveboardEmbed.
 * @internal
 */
export interface LiveboardEmbedAppInitData extends DefaultAppInitData {
    embedParams?: {
        spotterVizConfig?: SpotterVizConfig;
    };
}
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
     *
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 7.2.1
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
     * This is the minimum height (in pixels) for a full-height Liveboard.
     * Setting this height helps resolve issues with empty Liveboards and
     * other screens navigable from a Liveboard.
     *
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     * @deprecated Use `minimumHeight` instead.
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
     * This is the minimum height (in pixels) for a full-height Liveboard.
     * Setting this height helps resolve issues with empty Liveboards and
     * other screens navigable from a Liveboard.
     *
     * @version SDK: 1.44.2 | ThoughtSpot: 10.15.0.cl
     * @default 500
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   fullHeight: true,
     *   minimumHeight: 600,
     * });
     * ```
     */
    minimumHeight?: number;
    /**
     * If set to true, the context menu in visualizations will be enabled.
     * @version SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
     * @deprecated this option is deprecated.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    enableVizTransformations:true,
     * })
     * ```
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
     *    liveboardId:'id of liveboard',
     * })
     * ```
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
     * ```
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
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    activeTabId:'id-1234',
     * })
     * ```
     */
    activeTabId?: string;
    /**
     * The GUID of a saved personalized view to load.
     * A personalized view is a saved configuration of a Liveboard
     * that includes specific filter selections.
     *
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.46.0 | ThoughtSpot: 26.4.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    liveboardId: 'liveboard-guid',
     *    personalizedViewId: 'view-guid',
     *    activeTabId: 'tab-guid',
     * })
     * ```
     */
    personalizedViewId?: string;
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
     * Also, viz snapshot should be enabled in the ThoughtSpot instance.
     * Contact ThoughtSpot support to enable this feature.
     *
     * Since this will show preview images, be careful that it may show
     * undesired data to the user when using row level security.
     *
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *   liveboardId: 'liveboard-id',
     *   vizId: 'viz-id',
     *   showPreviewLoader: true,
     * });
     * embed.render();
     * ```
     */
    showPreviewLoader?: boolean;
    /**
     * The Liveboard to run on regular intervals to fetch the cdw token.
     *
     * Supported embed types: `LiveboardEmbed`
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot: 10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    oAuthPollingInterval: 30000,
     * })
     * ```
     */
    oAuthPollingInterval?: number;
    /**
     * The Liveboard is set to force a token fetch during the initial load.
     *
     * Supported embed types: `LiveboardEmbed`
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot: 10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    isForceRedirect: false,
     * })
     * ```
     */
    isForceRedirect?: boolean;
    /**
     * The source connection ID for authentication.
     *
     * Supported embed types: `LiveboardEmbed`
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot: 10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    dataSourceId: '',
     * })
     * ```
     */
    dataSourceId?: string;
    /**
     * The list of tab IDs to hide from the embedded Liveboard.
     * These tabs will be hidden from their respective Liveboards.
     * Use this to hide a tab ID.
     *
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
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
     * This flag is used to enable/disable the styling and grouping in a Liveboard. Use {@link isLiveboardMasterpiecesEnabled} instead.
     * @deprecated This flag is deprecated.
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
     * This flag is used to enable/disable the png embedding of liveboard in scheduled
     * mails
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @type {boolean}
     * @version SDK: 1.42.0 | ThoughtSpot: 10.14.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    isPNGInScheduledEmailsEnabled: true,
     * })
     * ```
     */
    isPNGInScheduledEmailsEnabled?: boolean;
    /**
     * Enables the 'what you see is what you get' PDF export for Liveboards. Each tab is rendered on a single page
     * following the exact UI layout, instead of splitting visualizations across multiple A4 pages.
     * This feature is GA from version 26.5.0.cl. It is disabled by default in embed deployments.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @type {boolean}
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    isContinuousLiveboardPDFEnabled: true,
     * })
     * ```
     */
    isContinuousLiveboardPDFEnabled?: boolean;
    /**
     * This flag is used to enable/disable the XLSX/CSV download option for Liveboards
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @type {boolean}
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    isLiveboardXLSXCSVDownloadEnabled: true,
     * })
     * ```
     */
    isLiveboardXLSXCSVDownloadEnabled?: boolean;
    /**
     * This flag is used to enable/disable the granular XLSX/CSV schedules feature
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @type {boolean}
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    isGranularXLSXCSVSchedulesEnabled: true,
     * })
     * ```
     */
    isGranularXLSXCSVSchedulesEnabled?: boolean;
    /**
     * This flag is used to enable the full height lazy load data.
     *
     * @type {boolean}
     * @version SDK: 1.40.0 | ThoughtSpot: 10.12.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    // ...other options
     *    fullHeight: true,
     *    lazyLoadingForFullHeight: true,
     * })
     * ```
     */
    lazyLoadingForFullHeight?: boolean;
    /**
     * The margin to be used for lazy loading.
     *
     * For example, if the margin is set to '10px',
     * the visualization will be loaded 10px before its top edge is visible in the
     * viewport.
     *
     * The format is similar to CSS margin.
     *
     * @type {string}
     * @version SDK: 1.40.0 | ThoughtSpot: 10.12.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    // ...other options
     *    fullHeight: true,
     *    lazyLoadingForFullHeight: true,
     *   // Using 0px, the visualization will be only loaded when it's visible in the viewport.
     *    lazyLoadingMargin: '0px',
     * })
     * ```
     */
    lazyLoadingMargin?: string;
    /**
     * showSpotterLimitations : show limitation text
     * of the spotter underneath the chat input.
     * default is false.
     *
     * @type {boolean}
     * @version SDK: 1.41.1 | ThoughtSpot: 10.5.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    // ...other options
     *    showSpotterLimitations: true,
     * })
     * ```
     */
    showSpotterLimitations?: boolean;
    /**
     * updatedSpotterChatPrompt : Controls the updated spotter chat prompt.
     *
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    updatedSpotterChatPrompt : true,
     * })
     * ```
     */
    updatedSpotterChatPrompt?: boolean;
    /**
     * Enables the stop answer generation button in the Spotter embed UI,
     * allowing users to interrupt an ongoing answer generation.
     *
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     * @default false
     */
    enableStopAnswerGenerationEmbed?: boolean;
    /**
     * Configuration for customizing Spotter chat UI
     * branding in tool response cards.
     *
     * Supported embed types: `LiveboardEmbed`
     * @version SDK: 1.46.0 | ThoughtSpot: 26.4.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    spotterChatConfig: {
     *        hideToolResponseCardBranding: true,
     *        toolResponseCardBrandingLabel: 'MyBrand',
     *    },
     * })
     * ```
     */
    spotterChatConfig?: SpotterChatViewConfig;
    /**
     * Configuration for the SpotterViz interface shown on the Liveboard.
     * Customize the brand name, description, chat input placeholder,
     * starter prompts, and visibility of starter prompts in the SpotterViz panel.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    spotterViz: {
     *        brandName: 'MyBrand',
     *        brandHeadline: 'Hi, there! I\'m',
     *        description: 'Ask questions about your data',
     *        inputChatPlaceholder: 'Ask a question...',
     *        hideStarterPrompts: false,
     *        customStarterPrompts: [{ id: '1', displayText: 'Top products', fullPrompt: 'What are the top products by revenue?' }],
     *    },
     * })
     * ```
     */
    spotterViz?: SpotterVizConfig;
    /**
     * If set to true, enables visualization data caching on the Liveboard.
     * @type {boolean}
     * @version SDK: 1.49.0 | ThoughtSpot: 26.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    enableLiveboardDataCache: true,
     * })
     * ```
     */
    enableLiveboardDataCache?: boolean;
}
/**
 * Embed a ThoughtSpot Liveboard or visualization. When rendered it already
 * waits for the authentication to complete, so you need not wait for
 * `AuthStatus.SUCCESS`.
 * @group Embed components
 * @example
 * ```js
 * import { .. } from '@thoughtspot/visual-embed-sdk';
 * init({ ... });
 * const embed = new LiveboardEmbed("#container", {
 *   liveboardId: <your-id-here>,
 * // .. other params here.
 * })
 * ```
 */
export declare class LiveboardEmbed extends V1Embed {
    protected viewConfig: LiveboardViewConfig;
    private defaultHeight;
    constructor(domSelector: DOMSelector, viewConfig: LiveboardViewConfig);
    protected getAppInitData(): Promise<LiveboardEmbedAppInitData>;
    /**
     * Construct a map of params to be passed on to the
     * embedded Liveboard or visualization.
     */
    protected getEmbedParams(): string;
    protected getEmbedParamsObject(): any;
    private getIframeSuffixSrc;
    private sendFullHeightLazyLoadData;
    /**
     * This is a handler for the RequestVisibleEmbedCoordinates event.
     * It is used to send the visible coordinates data to the host application.
     * @param data The event payload
     * @param responder The responder function
     */
    private requestVisibleEmbedCoordinatesHandler;
    /**
     * Construct the URL of the embedded ThoughtSpot Liveboard or visualization
     * to be loaded within the iFrame.
     */
    private getIFrameSrc;
    /**
     * Set the iframe height as per the computed height received
     * from the ThoughtSpot app.
     * @param data The event payload
     */
    private updateIFrameHeight;
    private embedIframeCenter;
    private setIframeHeightForNonEmbedLiveboard;
    private setActiveTab;
    private showPreviewLoader;
    /**
     * @hidden
     * Internal state to track the current liveboard id.
     * This is used to navigate to the correct liveboard when the prerender is visible.
     */
    currentLiveboardState: {
        liveboardId: string;
        vizId: string;
        activeTabId: string;
        personalizedViewId: string;
    };
    protected beforePrerenderVisible(): void;
    protected handleRenderForPrerender(): Promise<TsEmbed>;
    /**
     * Triggers an event to the embedded app
     * @param {HostEvent} messageType The event type
     * @param {any} data The payload to send with the message
     * @returns A promise that resolves with the response from the embedded app
     */
    trigger<HostEventT extends HostEvent, PayloadT, ContextT extends ContextType>(messageType: HostEventT, data?: TriggerPayload<PayloadT, HostEventT>, context?: ContextT): Promise<TriggerResponse<PayloadT, HostEventT, ContextT>>;
    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    destroy(): void;
    private postRender;
    private registerLazyLoadEvents;
    private unregisterLazyLoadEvents;
    /**
     * Render an embedded ThoughtSpot Liveboard or visualization
     * @param renderOptions An object specifying the Liveboard ID,
     * visualization ID and the runtime filters.
     */
    render(): Promise<LiveboardEmbed>;
    navigateToLiveboard(liveboardId: string, vizId?: string, activeTabId?: string, personalizedViewId?: string): void;
    /**
     * Returns the full url of the Liveboard/visualization which can be used to open
     * this Liveboard inside the full ThoughtSpot application in a new tab.
     * @returns url string
     */
    getLiveboardUrl(): string;
}
/**
 * @hidden
 */
export declare class PinboardEmbed extends LiveboardEmbed {
}
//# sourceMappingURL=liveboard.d.ts.map