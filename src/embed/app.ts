/**
 * Copyright (c) 2022
 *
 * Full application embedding
 * https://developers.thoughtspot.com/docs/?pageid=full-embed
 * @summary Full app embed
 * @module
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { logger } from '../utils/logger';
import { calculateVisibleElementData, getQueryParamString } from '../utils';
import {
    Param,
    DOMSelector,
    HostEvent,
    EmbedEvent,
    MessagePayload,
    AllEmbedViewConfig,
    FullHeightViewConfig,
} from '../types';
import { V1Embed } from './ts-embed';
import { FullHeight } from '../full-height';

/**
 * Pages within the ThoughtSpot app that can be embedded.
 */

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
    /**
     *  Monitor Alerts Page
     */
    Monitor = 'monitor'
}

/**
 * Define the initial state os column custom group accordions
 * in data panel v2.
 */
export enum DataPanelCustomColumnGroupsAccordionState {
    /**
     * Expand all the accordion initially in data panel v2.
     */
    EXPAND_ALL = 'EXPAND_ALL',
    /**
     * Collapse all the accordions initially in data panel v2.
     */
    COLLAPSE_ALL = 'COLLAPSE_ALL',
    /**
     * Expand the first accordion and collapse the rest.
     */
    EXPAND_FIRST = 'EXPAND_FIRST',
}

export enum HomePageSearchBarMode {
    OBJECT_SEARCH = 'objectSearch',
    AI_ANSWER = 'aiAnswer',
    NONE = 'none'
}

/**
 * Define the version of the primary navbar
 * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
 */
export enum PrimaryNavbarVersion {
    /**
     * Sliding (v3) introduces a new left-side navigation hub featuring a tab switcher,
     * along with updates to the top navigation bar.
     * It serves as the foundational version of the PrimaryNavBar.
     */
    Sliding = 'v3',
}

/**
 * Define the version of the home page
 * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
 */
export enum HomePage {
    /**
     * Modular (v2) introduces the updated Modular Home Experience.
     * It serves as the foundational version of the home page.
     */
    Modular = 'v2',
}

/**
 * Define the version of the list page
 * @version SDK: 1.40.0 | ThoughtSpot: 10.12.0.cl
 */
export enum ListPage {
    /**
     * List (v2) is the traditional List Experience.
     * It serves as the foundational version of the list page.
     */
    List = 'v2',
    /**
     * ListWithUXChanges (v3) introduces the new updated list page with UX changes.
     */
    ListWithUXChanges = 'v3',
}

/**
 * Define the discovery experience
 * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
 */
export interface DiscoveryExperience {
    /**
     * primaryNavbarVersion determines the version of the navigation version.
     */
    primaryNavbarVersion?: PrimaryNavbarVersion;
    /**
     * homePage determines the version of the home page.
     */
    homePage?: HomePage;
    /**
     * listPageVersion determines the version of the list page.
     */
    listPageVersion?: ListPage;
}

/**
 * The view configuration for full app embedding.
 * @group Embed components
 */
export interface AppViewConfig extends AllEmbedViewConfig, FullHeightViewConfig {
    /**
     * If true, the top navigation bar within the ThoughtSpot app
     * is displayed. By default, the navigation bar is hidden.
     * This flag also controls the homepage left navigation bar.
     * 
     * Supported embed types: `AppEmbed`
     * @default true
     * @version SDK: 1.2.0 | ThoughtSpot: 8.4.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
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
     * Supported embed types: `AppEmbed`
     * @default false
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    hideHomepageLeftNav : true,
     * })
     * ```
     */
    hideHomepageLeftNav?: boolean;
    /**
     * Control the visibility of the help (?) and profile buttons on the
     * Global nav-bar. By default, these buttons are visible on the nav-bar.
     * 
     * Supported embed types: `AppEmbed`
     * @default false
     * @version SDK: 1.2.0 | ThoughtSpot: 8.4.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    disableProfileAndHelp: true,
     * })
     * ```
     */
    disableProfileAndHelp?: boolean;
    /**
     * @version SDK: 1.36.3 | ThoughtSpot: 10.1.0.cl
     * @default true
     * Whether the help menu in the top nav bar should be served
     * from Pendo or ThoughtSpot's internal help items.
     * 
     * Supported embed types: `AppEmbed`
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *   ... // other embed view config
     *  enablePendoHelp: false,
     * });
     * ```
     */
    enablePendoHelp?: boolean
    /**
     * Control the visibility of the hamburger icon on the top nav bar
     * available when new navigation V3 is enabled.
     *
     * Supported embed types: `AppEmbed`
     * @default false
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    hideHamburger : true,
     * })
     * ```
     */
    hideHamburger?: boolean;
    /**
     * Control the visibility of the Eureka search on the top nav bar
     * this will control for both new V2 and new navigation V3.
     *
     * Supported embed types: `AppEmbed`
     * @default true
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    hideObjectSearch: false,
     * })
     * ```
     */
    hideObjectSearch?: boolean;
    /**
     * Control the visibility of the notification on the top nav bar V3,
     * available when new navigation V3 is enabled.
     *
     * Supported embed types: `AppEmbed`
     * @default true
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    hideNotification: false,
     * })
     * ```
     */
    hideNotification?: boolean;
    /**
     * Control the visibility of the application switcher button on the nav-bar.
     * By default, the application switcher is shown.
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     * @default false
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
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
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     * @default true
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
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
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.1.0 | ThoughtSpot: 9.4.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    path:"pinboard/1234/tab/7464",
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
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.1.0 | ThoughtSpot: 9.4.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    pageId : Page.Answers | Page.Data,
     * })
     * ```
     */
    pageId?: Page;
    /**
     * This puts a filter tag on the application. All metadata lists in the
     * application, such as Liveboards and answers, would be filtered by this
     * tag.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.1.0 | ThoughtSpot: 9.4.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    tag:'value',
     * })
     * ```
     */
    tag?: string;
    /**
     * The array of GUIDs to be hidden
     * 
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
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
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     * @hidden
     */
    liveboardV2?: boolean;
    /**
     * If set to true, the Search Assist feature is enabled.
     * 
     * Supported embed types: `AppEmbed`
     * @default true
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1-sw
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    enableSearchAssist: true,
     * })
     * ```
     */
    enableSearchAssist?: boolean;
    /**
     * Flag to control new Modular Home experience.
     * 
     * Supported embed types: `AppEmbed`
     * @default false
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    modularHomeExperience : true,
     * })
     * ```
     */
    modularHomeExperience?: boolean;
    /**
     * To configure the top-left navigation and home page experience
     *
     * Supported embed types: `AppEmbed`
     * @default false
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    discoveryExperience : {
     *      primaryNavbarVersion: PrimaryNavbarVersion.Sliding,
     *      homePage: HomePage.Modular,
     *    },
     * })
     * ```
     */
    discoveryExperience?: DiscoveryExperience;
    /**
     * To set the initial state of the search bar in case of saved-answers.
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     * @default false
     * @deprecated Use {@link collapseSearchBar} instead
     */
    collapseSearchBarInitially?: boolean;
    /**
     * This controls the initial behaviour of custom column groups accordion.
     * It takes DataPanelCustomColumnGroupsAccordionState enum values as input.
     * List of different enum values:-
     * - EXPAND_ALL: Expand all the accordion initially in data panel v2.
     * - COLLAPSE_ALL: Collapse all the accordions initially in data panel v2.
     * - EXPAND_FIRST: Expand the first accordion and collapse the rest.
     * 
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     * @default DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL    
     * @example
     * ```js
     * const embed = new AppEmbed('#embed', {
     *   ... // other app view config
     *   dataPanelCustomGroupsAccordionInitialState:
     *      DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL,
     * });
     * ```
     */
    dataPanelCustomGroupsAccordionInitialState?: DataPanelCustomColumnGroupsAccordionState;
    /**
     * Flag that allows using `EmbedEvent.OnBeforeGetVizDataIntercept`.
     * @version SDK : 1.29.0 | ThoughtSpot: 10.1.0.cl
     */
    isOnBeforeGetVizDataInterceptEnabled?: boolean;
    /**
     * Flag to use home page search bar mode
     * 
     * Supported embed types: `AppEmbed`
     * @version SDK : 1.33.0 | ThoughtSpot: 10.3.0.cl
     */
    homePageSearchBarMode?: HomePageSearchBarMode;
    /**
     * This flag is used to enable unified search experience for full app embed.
     * 
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.34.0 | ThoughtSpot:10.5.0.cl
     * @default true
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    isUnifiedSearchExperienceEnabled: true,
     * })
     * ```
     */
    isUnifiedSearchExperienceEnabled?: boolean;

    /**
     * This flag is used to enable/disable the styling and grouping in a Liveboard
     * 
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
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
}

/**
 * Embeds full ThoughtSpot experience in a host application.
 * @group Embed components
 */
export class AppEmbed extends V1Embed {
    protected viewConfig: AppViewConfig;

    private fullHeightClient: FullHeight | null = null;

    constructor(domSelector: DOMSelector, viewConfig: AppViewConfig) {
        viewConfig.embedComponentType = 'AppEmbed';
        super(domSelector, viewConfig);
        if (this.viewConfig.fullHeight === true) {
            this.fullHeightClient = new FullHeight({
                getIframe: () => this.iFrame,
                onEmbedEvent: (event, callback) => this.on(event, callback),
                getViewConfig: () => this.viewConfig,
                triggerHostEvent: (event, data) => this.trigger(event, data),
            });
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
            hideHamburger,
            hideObjectSearch,
            hideNotification,
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
            enable2ColumnLayout,
            enableCustomColumnGroups = false,
            isOnBeforeGetVizDataInterceptEnabled = false,

            dataPanelCustomGroupsAccordionInitialState = DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL,
            collapseSearchBar = true,
            isLiveboardCompactHeaderEnabled = false,
            showLiveboardVerifiedBadge = true,
            showLiveboardReverifyBanner = true,
            hideIrrelevantChipsInLiveboardTabs = false,
            homePageSearchBarMode,
            isUnifiedSearchExperienceEnabled = true,
            enablePendoHelp = true,
            discoveryExperience,
            coverAndFilterOptionInPDF = false,
            isLiveboardStylingAndGroupingEnabled,
        } = this.viewConfig;

        let params: any = {};
        params[Param.PrimaryNavHidden] = !showPrimaryNavbar;
        params[Param.HideProfleAndHelp] = !!disableProfileAndHelp;
        params[Param.HideApplicationSwitcher] = !!hideApplicationSwitcher;
        params[Param.HideOrgSwitcher] = !!hideOrgSwitcher;
        params[Param.HideLiveboardHeader] = hideLiveboardHeader;
        params[Param.ShowLiveboardTitle] = showLiveboardTitle;
        params[Param.ShowLiveboardDescription] = !!showLiveboardDescription;
        params[Param.LiveboardHeaderSticky] = isLiveboardHeaderSticky;
        params[Param.IsFullAppEmbed] = true;
        params[Param.LiveboardHeaderV2] = isLiveboardCompactHeaderEnabled;
        params[Param.ShowLiveboardVerifiedBadge] = showLiveboardVerifiedBadge;
        params[Param.ShowLiveboardReverifyBanner] = showLiveboardReverifyBanner;
        params[Param.HideIrrelevantFiltersInTab] = hideIrrelevantChipsInLiveboardTabs;
        params[Param.IsUnifiedSearchExperienceEnabled] = isUnifiedSearchExperienceEnabled;
        params[Param.CoverAndFilterOptionInPDF] = !!coverAndFilterOptionInPDF;

        params = this.getBaseQueryParams(params);

        if (hideObjectSearch) {
            params[Param.HideObjectSearch] = !!hideObjectSearch;
        }

        if (hideHamburger) {
            params[Param.HideHamburger] = !!hideHamburger;
        }

        if (hideNotification) {
            params[Param.HideNotification] = !!hideNotification;
        }

        if (fullHeight === true) {
            params[Param.fullHeight] = true;
            if (this.viewConfig.lazyLoadingForFullHeight) {
                params[Param.IsLazyLoadingForEmbedEnabled] = true;
                params[Param.RootMarginForLazyLoad] = this.viewConfig.lazyLoadingMargin;
            }
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

        if (enable2ColumnLayout !== undefined) {
            params[Param.Enable2ColumnLayout] = enable2ColumnLayout;
        }

        if (enableAskSage) {
            params[Param.enableAskSage] = enableAskSage;
        }

        if (isOnBeforeGetVizDataInterceptEnabled) {

            params[
                Param.IsOnBeforeGetVizDataInterceptEnabled
            ] = isOnBeforeGetVizDataInterceptEnabled;
        }

        if (homePageSearchBarMode) {
            params[Param.HomePageSearchBarMode] = homePageSearchBarMode;
        }

        if (enablePendoHelp !== undefined) {
            params[Param.EnablePendoHelp] = enablePendoHelp;
        }

        if (isLiveboardStylingAndGroupingEnabled !== undefined) {
            params[Param.IsLiveboardStylingAndGroupingEnabled] = isLiveboardStylingAndGroupingEnabled;
        }

        params[Param.DataPanelV2Enabled] = dataPanelV2;
        params[Param.HideHomepageLeftNav] = hideHomepageLeftNav;
        params[Param.ModularHomeExperienceEnabled] = modularHomeExperience;
        params[Param.CollapseSearchBarInitially] = collapseSearchBarInitially || collapseSearchBar;
        params[Param.EnableCustomColumnGroups] = enableCustomColumnGroups;
        if (dataPanelCustomGroupsAccordionInitialState
            === DataPanelCustomColumnGroupsAccordionState.COLLAPSE_ALL
            || dataPanelCustomGroupsAccordionInitialState
            === DataPanelCustomColumnGroupsAccordionState.EXPAND_FIRST
        ) {

            params[
                Param.DataPanelCustomGroupsAccordionInitialState
            ] = dataPanelCustomGroupsAccordionInitialState;
        } else {

            params[Param.DataPanelCustomGroupsAccordionInitialState] = DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL;
        }

        if (discoveryExperience) {
            // primaryNavbarVersion v3 will enabled the new left navigation
            if (discoveryExperience.primaryNavbarVersion === PrimaryNavbarVersion.Sliding) {
                params[Param.NavigationVersion] = discoveryExperience.primaryNavbarVersion;
            }

            // homePage v2 will enable the modular home page
            // and it will override the modularHomeExperience value
            if (discoveryExperience.homePage === HomePage.Modular) {
                params[Param.ModularHomeExperienceEnabled] = true;
            }
            // listPageVersion v3 will enable the new list page
            if (discoveryExperience.listPageVersion === ListPage.ListWithUXChanges) {
                params[Param.ListPageVersion] = discoveryExperience.listPageVersion;
            }
        }

        const queryParams = getQueryParamString(params, true);

        return queryParams;
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
     * Constructs the URL of the ThoughtSpot app page to be rendered.
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
     * Gets the ThoughtSpot route of the page for a particular page ID.
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
            case Page.Monitor:
                return modularHomeExperience ? 'home/monitor-alerts' : 'insights/monitor-alerts';
            case Page.Home:
            default:
                return 'home';
        }
    }

    /**
     * Formats the path provided by the user.
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
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    public destroy() {
        super.destroy();
        this.fullHeightClient?.cleanup();
    }

    private postRender() {
        this.fullHeightClient?.init();
    }

    /**
     * Renders the embedded application pages in the ThoughtSpot app.
     * @param renderOptions An object containing the page ID
     * to be embedded.
     */
    public async render(): Promise<AppEmbed> {
        await super.render();

        const src = this.getIFrameSrc();
        await this.renderV1Embed(src);

        this.postRender();
        return this;
    }
}
