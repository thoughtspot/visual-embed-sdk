/**
 * Copyright (c) 2022
 *
 * Full application embedding
 * https://developers.thoughtspot.com/docs/?pageid=full-embed
 *
 * @summary Full app embed
 * @module
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { logger } from '../utils/logger';
import { getQueryParamString } from '../utils';
import {
    Param,
    DOMSelector,
    HostEvent,
    ViewConfig,
    EmbedEvent,
    MessagePayload,
} from '../types';
import { V1Embed } from './ts-embed';

/**
 * Pages within the ThoughtSpot app that can be embedded.
 */
// eslint-disable-next-line no-shadow
export enum Page {
    /**
     * Home page
     */
    Home = 'home',
    /**
     * Search page
     */
    Search = 'search',
    /**
     * Saved answers listing page
     */
    Answers = 'answers',
    /**
     * Liveboards listing page
     */
    Liveboards = 'liveboards',
    /**
     * @hidden
     */
    Pinboards = 'pinboards',
    /**
     * Data management page
     */
    Data = 'data',
    /**
     * SpotIQ listing page
     */
    SpotIQ = 'insights',
}

/**
 * The view configuration for full app embedding.
 *
 * @group Embed components
 */
export interface AppViewConfig extends Omit<ViewConfig, 'visibleTabs'> {
    /**
     * If true, the top navigation bar within the ThoughtSpot app
     * is displayed. By default, the navigation bar is hidden.
     * This flag also controls the homepage left navigation bar.
     *
     * @default true
     * @version SDK: 1.2.0 | Thoughtspot: 8.4.0.cl
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    showPrimaryNavbar:true,
     * })
     * ```
     */
    showPrimaryNavbar?: boolean;
    /**
     * Control the visibility of the left navigation bar on the Homepage.
     * If showPrimaryNavbar is true, that is, if the Global and Homepage
     * nav-bars are visible, this flag will only hide the homepage left nav-bar.
     * The showPrimaryNavbar flag takes precedence over the hideHomepageLeftNav.
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     *
     * @default false
     * @version SDK: 1.28.0 | Thoughtspot: 9.12.5.cl
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    hideHomepageLeftNav : true,
     * })
     * ```
     */
    hideHomepageLeftNav?: boolean;
    /**
     * Control the visibility of the help (?) and profile buttons on the
     * Global nav-bar. By default, these buttons are visible on the nav-bar.
     * @default false
     * @version SDK: 1.2.0 | Thoughtspot: 8.4.0.cl
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    disableProfileAndHelp: true,
     * })
     * ```
     */
    disableProfileAndHelp?: boolean;
    /**
     * Control the visibility of the application switcher button on the nav-bar.
     * By default, the application switcher is shown.
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     *
     * @version SDK: 1.28.0 | Thoughtspot: 9.12.5.cl
     * @default false
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    hideApplicationSwitcher : true,
     * })
     * ```
     */
    hideApplicationSwitcher?: boolean;
    /**
     * Control the visibility of the Org switcher button on the nav-bar.
     * By default, the Org switcher button is shown.
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     *
     * @version SDK: 1.28.0 | Thoughtspot: 9.12.5.cl
     * @default true
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    hideOrgSwitcher : true,
     * })
     * ```
     */
    hideOrgSwitcher?: boolean;
    /**
     * A URL path to the embedded application page
     * If both path and pageId attributes are defined, the path definition
     * takes precedence. This is the path post the `#/` in the URL of the standalone
     * ThoughtSpot app. Use this to open the embedded view to a specific path.
     *
     * For eg, if you want the component to open to a specific Liveboard
     * you could set the path to `pinboard/<liveboardId>/tab/<tabId>`.
     *
     * @version SDK: 1.1.0 | Thoughtspot: 9.4.0.cl
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    path:"pinboard/1234/tab/7464"
     * })
     * ```
     */
    path?: string;
    /**
     * The application page to set as the start page
     * in the embedded view.
     *
     * Use this to open to particular page in the app. To open to a specific
     * path within the app, use the `path` attribute which is more flexible.
     *
     * @version SDK: 1.1.0 | Thoughtspot: 9.4.0.cl
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    pageId : Page.Answers | Page.Data
     * })
     * ```
     */
    pageId?: Page;
    /**
     * This puts a filter tag on the application. All metadata lists in the
     * application, such as Liveboards and answers, would be filtered by this
     * tag.
     *
     * @version SDK: 1.1.0 | Thoughtspot: 9.4.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    tag:'value',
     * })
     * ```
     */
    tag?: string;
    /**
     * The array of GUIDs to be hidden
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    hideObjects: [
     *       '430496d6-6903-4601-937e-2c691821af3c',
     *       'f547ec54-2a37-4516-a222-2b06719af726'
     *     ]
     * })
     * ```
     */
    hideObjects?: string[];
    /**
     * Render liveboards using the new v2 rendering mode
     * This is a transient flag which is primarily meant for internal use
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     * @hidden
     */
    liveboardV2?: boolean;
    /**
     * If set to true, the Search Assist feature is enabled.
     * @default true
     *
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1-sw
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    enableSearchAssist: true,
     * })
     * ```
     */
    enableSearchAssist?: boolean;
    /**
     * If set to true, the embedded object container dynamically resizes
     * according to the height of the pages which support fullHeight mode.
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.4.0.cl, 9.4.0-sw
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    fullHeight: true,
     * })
     * ```
     */
    fullHeight?: boolean;
    /**
     * Flag to control Data panel experience
     *
     * @default false
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @hidden
     */
    dataPanelV2?: boolean;
    /**
     * Show or hide Liveboard header
     *
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    hideLiveboardHeader : true,
     * })
     * ```
     */
    hideLiveboardHeader?: boolean;
    /**
     * Show or hide Liveboard title
     *
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    showLiveboardTitle:true,
     * })
     * ```
     */
    showLiveboardTitle?: boolean;
    /**
     * Show or hide Liveboard description
     *
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    showLiveboardDescription:true,
     * })
     * ```
     */
    showLiveboardDescription?: boolean;
    /**
     * Flag to control new Modular Home experience.
     *
     * @default false
     * @version SDK: 1.28.0 | Thoughtspot: 9.12.5.cl
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    modularHomeExperience : true,
     * })
     * ```
     */
    modularHomeExperience?: boolean;
    /**
     * Boolean to control if Liveboard header is sticky or not.
     *
     * @example
     * ```js
     * const embed = new AppEmbed('#embed', {
     *   ... // other app view config
     *   isLiveboardHeaderSticky: true,
     * });
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    isLiveboardHeaderSticky?: boolean;
    /**
     * enable or disable ask sage
     *
     * @version SDK: 1.29.0 | Thoughtspot: 9.12.0.cl
     * @default false
     */
    enableAskSage?: boolean;
    /**
     * To set the initial state of the search bar in case of saved-answers.
     *
     * @version SDK: 1.32.0 | Thoughtspot: 10.0.0.cl
     * @default false
     */
    collapseSearchBarInitially?: boolean;
}

/**
 * Embeds full ThoughtSpot experience in a host application.
 *
 * @group Embed components
 */
export class AppEmbed extends V1Embed {
    protected viewConfig: AppViewConfig;

    private defaultHeight = '100%';

    // eslint-disable-next-line no-useless-constructor
    constructor(domSelector: DOMSelector, viewConfig: AppViewConfig) {
        viewConfig.embedComponentType = 'AppEmbed';
        super(domSelector, viewConfig);
        if (this.viewConfig.fullHeight === true) {
            this.on(EmbedEvent.RouteChange, this.setIframeHeightForNonEmbedLiveboard);
            this.on(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
            this.on(EmbedEvent.EmbedIframeCenter, this.embedIframeCenter);
        }
    }

    /**
     * Constructs a map of parameters to be passed on to the
     * embedded Liveboard or visualization.
     */
    protected getEmbedParams() {
        const {
            tag,
            hideObjects,
            liveboardV2,
            showPrimaryNavbar,
            disableProfileAndHelp,
            hideApplicationSwitcher,
            hideOrgSwitcher,
            enableSearchAssist,
            fullHeight,
            dataPanelV2 = false,
            hideLiveboardHeader = false,
            showLiveboardTitle = true,
            showLiveboardDescription = true,
            hideHomepageLeftNav = false,
            modularHomeExperience = false,
            isLiveboardHeaderSticky = true,
            enableAskSage,
            collapseSearchBarInitially = false,
        } = this.viewConfig;

        let params = {};
        params[Param.EmbedApp] = true;
        params[Param.PrimaryNavHidden] = !showPrimaryNavbar;
        params[Param.HideProfleAndHelp] = !!disableProfileAndHelp;
        params[Param.HideApplicationSwitcher] = !!hideApplicationSwitcher;
        params[Param.HideOrgSwitcher] = !!hideOrgSwitcher;
        params[Param.HideLiveboardHeader] = hideLiveboardHeader;
        params[Param.ShowLiveboardTitle] = showLiveboardTitle;
        params[Param.ShowLiveboardDescription] = !!showLiveboardDescription;
        params[Param.LiveboardHeaderSticky] = isLiveboardHeaderSticky;
        params[Param.IsFullAppEmbed] = true;

        params = this.getBaseQueryParams(params);

        if (fullHeight === true) {
            params[Param.fullHeight] = true;
        }

        if (tag) {
            params[Param.Tag] = tag;
        }
        if (hideObjects && hideObjects.length) {
            params[Param.HideObjects] = JSON.stringify(hideObjects);
        }
        if (liveboardV2 !== undefined) {
            params[Param.LiveboardV2Enabled] = liveboardV2;
        }

        if (enableSearchAssist !== undefined) {
            params[Param.EnableSearchAssist] = enableSearchAssist;
        }

        if (enableAskSage) {
            params[Param.enableAskSage] = enableAskSage;
        }

        params[Param.DataPanelV2Enabled] = dataPanelV2;
        params[Param.HideHomepageLeftNav] = hideHomepageLeftNav;
        params[Param.ModularHomeExperienceEnabled] = modularHomeExperience;
        params[Param.CollapseSearchBarInitially] = collapseSearchBarInitially;
        const queryParams = getQueryParamString(params, true);

        return queryParams;
    }

    /**
     * Constructs the URL of the ThoughtSpot app page to be rendered.
     *
     * @param pageId The ID of the page to be embedded.
     */
    public getIFrameSrc(): string {
        const { pageId, path, modularHomeExperience } = this.viewConfig;
        const pageRoute = this.formatPath(path) || this.getPageRoute(pageId, modularHomeExperience);
        let url = `${this.getRootIframeSrc()}/${pageRoute}`;

        const tsPostHashParams = this.getThoughtSpotPostUrlParams();
        url = `${url}${tsPostHashParams}`;

        return url;
    }

    /**
     * Set the iframe height as per the computed height received
     * from the ThoughtSpot app.
     *
     * @param data The event payload
     */
    protected updateIFrameHeight = (data: MessagePayload) => {
        this.setIFrameHeight(Math.max(data.data, this.iFrame?.scrollHeight));
    };

    private embedIframeCenter = (data: MessagePayload, responder: any) => {
        const obj = this.getIframeCenter();
        responder({ type: EmbedEvent.EmbedIframeCenter, data: obj });
    };

    private setIframeHeightForNonEmbedLiveboard = (data: MessagePayload) => {
        const { height: frameHeight, ...restParams } = this.viewConfig.frameParams || {};
        if (!data.data.currentPath.startsWith('/pinboard/')) {
            this.setIFrameHeight(frameHeight || this.defaultHeight);
        }
    };

    /**
     * Gets the ThoughtSpot route of the page for a particular page ID.
     *
     * @param pageId The identifier for a page in the ThoughtSpot app.
     * @param modularHomeExperience
     */
    private getPageRoute(pageId: Page, modularHomeExperience = false) {
        switch (pageId) {
            case Page.Search:
                return 'answer';
            case Page.Answers:
                return modularHomeExperience ? 'home/answers' : 'answers';
            case Page.Liveboards:
                return modularHomeExperience ? 'home/liveboards' : 'pinboards';
            case Page.Pinboards:
                return modularHomeExperience ? 'home/liveboards' : 'pinboards';
            case Page.Data:
                return 'data/tables';
            case Page.SpotIQ:
                return modularHomeExperience ? 'home/spotiq-analysis' : 'insights/results';
            case Page.Home:
            default:
                return 'home';
        }
    }

    /**
     * Formats the path provided by the user.
     *
     * @param path The URL path.
     * @returns The URL path that the embedded app understands.
     */
    private formatPath(path: string) {
        if (!path) {
            return null;
        }

        // remove leading slash
        if (path.indexOf('/') === 0) {
            return path.substring(1);
        }

        return path;
    }

    /**
     * Navigate to particular page for app embed. eg:answers/pinboards/home
     * This is used for embedding answers, pinboards, visualizations and full application
     * only.
     *
     * @param path string | number The string, set to iframe src and navigate to new page
     * eg: appEmbed.navigateToPage('pinboards')
     * When used with `noReload` (default: true) this can also be a number
     * like 1/-1 to go forward/back.
     * @param noReload boolean Trigger the navigation without reloading the page
     * @version SDK: 1.12.0 | ThoughtSpot: 8.4.0.cl, 8.4.1-sw
     */
    public navigateToPage(path: string | number, noReload = false): void {
        if (!this.iFrame) {
            logger.log('Please call render before invoking this method');
            return;
        }
        if (noReload) {
            this.trigger(HostEvent.Navigate, path);
        } else {
            if (typeof path !== 'string') {
                logger.warn('Path can only by a string when triggered without noReload');
                return;
            }
            const iframeSrc = this.iFrame.src;
            const embedPath = '#/embed';
            const currentPath = iframeSrc.includes(embedPath) ? embedPath : '#';
            this.iFrame.src = `${iframeSrc.split(currentPath)[0]}${currentPath}/${path.replace(
                /^\/?#?\//,
                '',
            )}`;
        }
    }

    /**
     * Renders the embedded application pages in the ThoughtSpot app.
     *
     * @param renderOptions An object containing the page ID
     * to be embedded.
     */
    public async render(): Promise<AppEmbed> {
        super.render();
        const src = this.getIFrameSrc();
        await this.renderV1Embed(src);

        return this;
    }
}
