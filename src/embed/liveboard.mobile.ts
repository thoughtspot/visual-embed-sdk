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
    ViewConfig,
} from '../types';
import { getQueryParamString, isMobile, isUndefined } from '../utils';
import { getAuthPromise } from './base';
import { V1Embed } from './ts-embed';
import { addPreviewStylesIfNotPresent } from '../utils/global-styles';
import { HostEventRequest, HostEventResponse } from './hostEventClient/contracts';
import { MobileEmbed } from './ts-mobile';

/**
 * The configuration for the embedded Liveboard or visualization page view.
 * @group Embed components
 */
export interface LiveboardViewConfig
    extends Omit<
        ViewConfig,
        'hiddenHomepageModules' | 'hiddenHomeLeftNavItems' | 'reorderedHomepageModules'
    > {
    /**
     * If set to true, the embedded object container dynamically resizes
     * according to the height of the Liveboard.
     * **Note**:  Using fullHeight loads all visualizations on the
     * Liveboard simultaneously, which results in multiple warehouse
     * queries and potentially a longer wait for the topmost
     * visualizations to display on the screen.
     * Setting `fullHeight` to `false` fetches visualizations
     * incrementally as users scroll the page to view the charts and tables.
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
     * This is the minimum height(in pixels) for a full-height Liveboard.
     * Setting this height helps resolve issues with empty Liveboards and
     * other screens navigable from a Liveboard.
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
     *    ... // other options
     *    enableVizTransformations:true,
     * })
     * ```
     * @version: SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
     */
    enableVizTransformations?: boolean;
    /**
     * The Liveboard to display in the embedded view.
     * Use either liveboardId or pinboardId to reference the Liveboard to embed.
     * @version SDK: 1.3.0 | ThoughtSpot ts7.aug.cl, 7.2.1
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
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
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    vizId:'430496d6-6903-4601-937e-2c691821af3c',
     * })
     * ```
     */
    vizId?: string;
    /**
     * If set to true, all filter chips from a
     * Liveboard page will be read-only (no X buttons)
     * @version SDK: 1.3.0 | ThoughtSpot ts7.aug.cl, 7.2.1.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    preventLiveboardFilterRemoval:true,
     * })
     * ```
     */
    preventLiveboardFilterRemoval?: boolean;
    /**
     * Array of visualization IDs which should be visible when the Liveboard
     * renders. This can be changed by triggering the `SetVisibleVizs`
     * event.
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
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
     * @version SDK: 1.14.0 | ThoughtSpot: 8.6.0.cl, 8.8.1-sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    liveboardV2:true,
     * })
     * ```
     */
    liveboardV2?: boolean;
    /**
     * Set a Liveboard tab as an active tab.
     * Specify the tab ID.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... // other options
     *    activeTabId:'id-1234',
     * })
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    activeTabId?: string;
    /**
     * Show or hide the tab panel of the embedded Liveboard.
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl, 9.8.0.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    hideTabPanel:true,
     * })
     * ```
     */
    hideTabPanel?: boolean;
    /**
     * Show or hide the Liveboard header.
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     * @default false
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   hideLiveboardHeader:true,
     * });
     * ```
     */
    hideLiveboardHeader?: boolean;
    /**
     * Show or hide the Liveboard title.
     * @default false
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    showLiveboardTitle:true,
     * })
     * ```
     */
    showLiveboardTitle?: boolean;
    /**
     * Show or hide the Liveboard description.
     * @default false
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    showLiveboardDescription:true,
     * })
     * ```
     */
    showLiveboardDescription?: boolean;
    /**
     * Control the position and visibility of
     * the Liveboard header as the users scroll down the
     * embedded Liveboard page.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other Liveboard view config
     *   isLiveboardHeaderSticky: true,
     * });
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     */
    isLiveboardHeaderSticky?: boolean;
    /**
     * enable or disable ask sage
     * @default false
     * @version SDK: 1.29.0 | Thoughtspot: 9.12.0.cl
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other options
     *    enableAskSage:true,
     * })
     * ```
     */
    enableAskSage?: boolean;
    /**
     * This flag is used to enable the 2 column layout on a Liveboard
     * @type {boolean}
     * @default false
     * @version SDK: 1.32.0 | ThoughtSpot:10.1.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    enable2ColumnLayout: true,
     * })
     * ```
     */
    enable2ColumnLayout?: boolean;
    /**
     * Show a preview image of the visualization before the visualization loads.
     * Only works for visualizations embeds with a viz id.
     *
     * Also, viz snashot should be enabled in the ThoughtSpot instance.
     * Contact ThoughtSpot support to enable this feature.
     *
     * Since, this will show preview images, be careful that it may show
     * undesired data to the user when using row level security.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
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
     * This flag is used to enable the compact header on a Liveboard
     * @type {boolean}
     * @default false
     * @version SDK: 1.35.0 | ThoughtSpot:10.3.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    isLiveboardCompactHeaderEnabled: true,
     * })
     * ```
     */
    isLiveboardCompactHeaderEnabled?: boolean;
    /**
     * This flag is used to show/hide verified icon in the Liveboard compact header
     * @type {boolean}
     * @default true
     * @version SDK: 1.35.0 | ThoughtSpot:10.4.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    showLiveboardVerifiedBadge: true,
     * })
     * ```
     */
    showLiveboardVerifiedBadge?: boolean;
    /**
     * This flag is used to show/hide the re-verify banner
     * in Liveboard compact header
     * @type {boolean}
     * @default true
     * @version SDK: 1.35.0 | ThoughtSpot:10.4.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    showLiveboardReverifyBanner: true,
     * })
     * ```
     */
    showLiveboardReverifyBanner?: boolean;
    /**
     * This flag is used to enable/disable hide irrelevant filters in a Liveboard tab
     * @type {boolean}
     * @default false
     * @version SDK: 1.36.0 | ThoughtSpot:10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    hideIrrelevantChipsInLiveboardTabs: true,
     * })
     * ```
     */
    hideIrrelevantChipsInLiveboardTabs?: boolean;

    /**
     * The Liveboard to run on regular intervals to fetch the cdw token.
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot:10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    oAuthPollingInterval: value in milliseconds,
     * })
     */
    oAuthPollingInterval?: number;

    /**
     * The Liveboard is set to force a token fetch during the initial load.
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot:10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    isForceRedirect: false,
     * })
     */
    isForceRedirect?: boolean;

    /**
     * The source connection ID for authentication.
     * @hidden
     * @version SDK: 1.35.0 | ThoughtSpot:10.6.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    dataSourceId: '',
     * })
     */
    dataSourceId?: string;
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
export class LiveboardEmbed extends MobileEmbed {
    protected viewConfig: LiveboardViewConfig;

    private defaultHeight = 500;

    // eslint-disable-next-line no-useless-constructor
    constructor(viewConfig: LiveboardViewConfig, webViewRef : any) {
        viewConfig.embedComponentType = 'LiveboardEmbed';
        super(viewConfig, webViewRef);
    }

    /**
     * Construct a map of params to be passed on to the
     * embedded Liveboard or visualization.
     */
    protected getEmbedParams() {
        let params: Record<any, any> = {};
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
        } = this.viewConfig;

        const preventLiveboardFilterRemoval = this.viewConfig.preventLiveboardFilterRemoval
            || this.viewConfig.preventPinboardFilterRemoval;

        if (fullHeight === true) {
            params[Param.fullHeight] = true;
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

        params[Param.LiveboardHeaderSticky] = isLiveboardHeaderSticky;
        params[Param.LiveboardHeaderV2] = isLiveboardCompactHeaderEnabled;
        params[Param.ShowLiveboardVerifiedBadge] = showLiveboardVerifiedBadge;
        params[Param.ShowLiveboardReverifyBanner] = showLiveboardReverifyBanner;
        params[Param.HideIrrelevantFiltersInTab] = hideIrrelevantChipsInLiveboardTabs;

        params[Param.DataPanelV2Enabled] = dataPanelV2;
        params[Param.EnableCustomColumnGroups] = enableCustomColumnGroups;
        const queryParams = getQueryParamString(params, true);

        return queryParams;
    }

    private getWebViewSuffixSrc(liveboardId: string, vizId: string, activeTabId: string) {
        let suffix = `/embed/viz/${liveboardId}`;
        if (activeTabId) {
            suffix = `${suffix}/tab/${activeTabId} `;
        }
        if (vizId) {
            suffix = `${suffix}/${vizId}`;
        }
        if(!isMobile()) {
            const tsPostHashParams = this.getThoughtSpotPostUrlParams();
            suffix = `${suffix}${tsPostHashParams}`;
        }
        return suffix;
    }

    /**
     * Construct the URL of the embedded ThoughtSpot Liveboard or visualization
     * to be loaded within the iFrame.
     */
    private getWebViewSrc(): string {
        const { vizId, activeTabId } = this.viewConfig;
        const liveboardId = this.viewConfig.liveboardId ?? this.viewConfig.pinboardId;

        if (!liveboardId) {
            this.handleError(ERROR_MESSAGE.LIVEBOARD_VIZ_ID_VALIDATION);
        }
        return `${this.getRootIframeSrc()}${this.getWebViewSuffixSrc(
            liveboardId,
            vizId,
            activeTabId,
        )}`;
    }

    // private setActiveTab(data: { tabId: string }) {
    //     if (!this.viewConfig.vizId) {
    // const prefixPath = this.iFrame.src.split('#/')[1].split('/tab')[0];
    // const path = `${prefixPath}/tab/${data.tabId}`;
    // super.trigger(HostEvent.Navigate, path); } }

    /**
     * Render an embedded ThoughtSpot Liveboard or visualization
     * @param renderOptions An object specifying the Liveboard ID,
     * visualization ID and the runtime filters.
     */
    public async getWebViewUrl(): Promise<string> {

        const src = this.getWebViewSrc();

        return src;
    }

    // public navigateToLiveboard(liveboardId: string, vizId?: string,
    // activeTabId?: string) { const path =
    // this.getWebViewSuffixSrc(liveboardId, vizId, activeTabId);
    // this.viewConfig.liveboardId = liveboardId; this.viewConfig.activeTabId =
    // activeTabId; this.viewConfig.vizId = vizId; if (this.isRendered) {
    // this.trigger(HostEvent.Navigate, path.substring(1)); } else if
    // (this.viewConfig.preRenderId) { this.preRender(true); } else {
    // this.render(); } }

    /**
     * Returns the full url of the Liveboard/visualization which can be used to open
     * this Liveboard inside the full Thoughtspot application in a new tab.
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
