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
import { calculateVisibleElementData, getQueryParamString, isUndefined, isValidCssMargin, setParamIfDefined, validateHttpUrl } from '../utils';
import {
    Param,
    DOMSelector,
    HostEvent,
    EmbedEvent,
    MessagePayload,
    AllEmbedViewConfig,
    ErrorDetailsTypes,
    EmbedErrorCodes,
} from '../types';
import { V1Embed } from './ts-embed';
import { SpotterChatViewConfig, SpotterSidebarViewConfig } from './conversation';
import { ERROR_MESSAGE } from '../errors';

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
    /**
     * ModularWithStylingChanges (v3) introduces Modular Home Experience
     * with styling changes.
     */
    ModularWithStylingChanges = 'v3',
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
export interface AppViewConfig extends AllEmbedViewConfig {
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
     * Control the visibility of the left navigation panel on the home page
     * in the V2 and V3 navigation and home page experience.
     * If `showPrimaryNavbar` is true, that is, if the Global and Homepage
     * navigation bars are visible, this flag will only hide the left navigation bar
     * on the home page.
     * The `showPrimaryNavbar` flag takes precedence over the `hideHomepageLeftNav`.
     *
     * **Note**: This attribute is not supported in the classic (V1) experience.
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
     * Control the visibility of the help (?) and profile
     * buttons on the top navigation bar.
     * These buttons are visible if the
     * navigation bar is not hidden via `showPrimaryNavbar`.
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
     * Whether the help menu in the top navigation bar should be served
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
     * Control the visibility of the hamburger icon on
     * the top navigation bar in the V3 navigation experience.
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
     * Control the visibility of the object search
     * on the top navigation bar in the
     * V2 and V3 navigation experience.
     *
     * **Note**: This attribute is not supported
     * in the classic (V1) experience.
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
     * Control the visibility of the notification icon
     * on the top navigation bar in V3 navigation experience.
     *
     * **Note**: This attribute is not supported
     * in the classic (V1) and V2 experience modes.
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
     * Control the visibility of the application selection menu
     * in the top navigation bar in the V2 experience.
     * In the V3 experience, it shows or hides application selection
     * icons on the left navigation panel.
     * By default, the application selection menu and icons are
     * shown in the UI
     *
     * **Note**: This attribute is not supported in the classic (V1) experience.
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
     * **Note**: This attribute is not supported in the classic (V1) experience.
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
     *    pageId: Page.Answers, // or Page.Data
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
     * Hide tag filter chips that appear when content is filtered by tags.
     * When enabled, this automatically:
     * - Hides tag filter indicators/chips from the UI
     *
     * This provides a clean interface without tag-related UI elements.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.44.0 | ThoughtSpot: 10.15.0.cl
     * @example
     * ```js
     * // Simple usage - automatically hides all tag-related UI
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    tag: 'Some Tag',
     *    hideTagFilterChips: true, // This is all you need!
     * });
     * ```
     */
    hideTagFilterChips?: boolean;
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
     * If set to true, the Liveboard container dynamically resizes
     * according to the height of the Liveboard.
     *
     * **Note**: Using fullHeight loads all visualizations
     * on the Liveboard simultaneously, which results in
     * multiple warehouse queries and potentially a
     * longer wait for the topmost visualizations to
     * display on the screen. Setting fullHeight to
     * `false` fetches visualizations incrementally as
     * users scroll the page to view the charts and tables.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.21.0 | ThoughtSpot: 9.4.0.cl, 9.4.0-sw
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    fullHeight: true,
     * })
     * ```
     */
    fullHeight?: boolean;
    /**
     * Enables the V2 navigation and modular home page experience.
     * For more information,
     * see link:https://developers.thoughtspot.com/docs/full-app-customize[full app embed documentation].
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
     * Configures the V3 navigation and home page experience.
     * For more information, see
     * link:https://developers.thoughtspot.com/docs/full-app-customize[full app embed documentation].
     * Supported embed types: `AppEmbed`
     * @default false
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    // Enable V3 navigation and home page experience
     *    discoveryExperience : {
     *      primaryNavbarVersion: PrimaryNavbarVersion.Sliding, // Enable V3 navigation
     *      homePage: HomePage.ModularWithStylingChanges, // Enable V3 modular home page
     *      ... // other embed view config
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

    /**
     * This flag is used to enable/disable the png embedding of liveboard in scheduled mails
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
     * @example
     * ```js
     * const embed = new AppEmbed('#embed-container', {
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
     * const embed = new AppEmbed('#embed-container', {
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

    /**
     * updatedSpotterChatPrompt : Controls the updated spotter chat prompt.
     *
     * Supported embed types: `AppEmbed`
     * @default false
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    updatedSpotterChatPrompt : true,
     * })
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     */
    updatedSpotterChatPrompt?: boolean;
    /**
     * Configuration for the Spotter sidebar UI customization.
     * Only applicable when navigating to Spotter within the app.
     *
     * Supported embed types: `AppEmbed`
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    spotterSidebarConfig: {
     *        enablePastConversationsSidebar: true,
     *        spotterSidebarTitle: 'My Conversations',
     *    },
     * })
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    /**
     * Configuration for customizing Spotter chat UI
     * branding in tool response cards.
     *
     * Supported embed types: `AppEmbed`
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    spotterChatConfig: {
     *        hideToolResponseCardBranding: true,
     *        toolResponseCardBrandingLabel: 'MyBrand',
     *    },
     * })
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterChatConfig?: SpotterChatViewConfig;
    /**
     * This is the minimum height (in pixels) for a full-height App.
     * Setting this height helps resolve issues with empty Apps and
     * other screens navigable from an App.
     *
     * @version SDK: 1.44.2 | ThoughtSpot: 10.15.0.cl
     * @default 500
     * @example
     * ```js
     * const embed = new AppEmbed('#embed', {
     *   ... // other app view config
     *   fullHeight: true,
     *   minimumHeight: 600,
     * });
     * ```
     */
    minimumHeight?: number;
}

/**
 * Embeds full ThoughtSpot experience in a host application.
 * @group Embed components
 */
export class AppEmbed extends V1Embed {
    protected viewConfig: AppViewConfig;

    private defaultHeight = 500;


    constructor(domSelector: DOMSelector, viewConfig: AppViewConfig) {
        viewConfig.embedComponentType = 'AppEmbed';
        super(domSelector, viewConfig);
        if (this.viewConfig.fullHeight === true) {
            this.on(EmbedEvent.RouteChange, this.setIframeHeightForNonEmbedLiveboard);
            this.on(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
            this.on(EmbedEvent.EmbedIframeCenter, this.embedIframeCenter);
            this.on(EmbedEvent.RequestVisibleEmbedCoordinates, this.requestVisibleEmbedCoordinatesHandler);
        }
    }

    /**
     * Constructs a map of parameters to be passed on to the
     * embedded Liveboard or visualization.
     */
    protected getEmbedParams() {
        const {
            tag,
            hideTagFilterChips,
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
            dataPanelV2 = true,
            hideLiveboardHeader = false,
            showLiveboardTitle = true,
            showLiveboardDescription = true,
            showMaskedFilterChip = false,
            isLiveboardMasterpiecesEnabled = false,
            hideHomepageLeftNav = false,
            modularHomeExperience = false,
            isLiveboardHeaderSticky = true,
            enableAskSage,
            collapseSearchBarInitially = false,
            enable2ColumnLayout,
            enableCustomColumnGroups = false,
            dataPanelCustomGroupsAccordionInitialState = DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL,
            collapseSearchBar = true,
            isLiveboardCompactHeaderEnabled = false,
            showLiveboardVerifiedBadge = true,
            showLiveboardReverifyBanner = true,
            hideIrrelevantChipsInLiveboardTabs = false,
            isEnhancedFilterInteractivityEnabled = false,
            homePageSearchBarMode,
            isUnifiedSearchExperienceEnabled = true,
            enablePendoHelp = true,
            discoveryExperience,
            coverAndFilterOptionInPDF = false,
            isLiveboardStylingAndGroupingEnabled,
            isPNGInScheduledEmailsEnabled = false,
            isLiveboardXLSXCSVDownloadEnabled = false,
            isGranularXLSXCSVSchedulesEnabled = false,
            isCentralizedLiveboardFilterUXEnabled = false,
            isLinkParametersEnabled,
            updatedSpotterChatPrompt,
            spotterSidebarConfig,
            spotterChatConfig,
            minimumHeight,
            isThisPeriodInDateFiltersEnabled,
        } = this.viewConfig;

        let params: any = {};
        params[Param.PrimaryNavHidden] = !showPrimaryNavbar;
        params[Param.HideProfleAndHelp] = !!disableProfileAndHelp;
        params[Param.HideApplicationSwitcher] = !!hideApplicationSwitcher;
        params[Param.HideOrgSwitcher] = !!hideOrgSwitcher;
        params[Param.HideLiveboardHeader] = hideLiveboardHeader;
        params[Param.ShowLiveboardTitle] = showLiveboardTitle;
        params[Param.ShowLiveboardDescription] = !!showLiveboardDescription;
        params[Param.ShowMaskedFilterChip] = showMaskedFilterChip;
        params[Param.IsLiveboardMasterpiecesEnabled] = isLiveboardMasterpiecesEnabled;
        params[Param.LiveboardHeaderSticky] = isLiveboardHeaderSticky;
        params[Param.IsFullAppEmbed] = true;
        params[Param.LiveboardHeaderV2] = isLiveboardCompactHeaderEnabled;
        params[Param.IsEnhancedFilterInteractivityEnabled] = isEnhancedFilterInteractivityEnabled;
        params[Param.ShowLiveboardVerifiedBadge] = showLiveboardVerifiedBadge;
        params[Param.ShowLiveboardReverifyBanner] = showLiveboardReverifyBanner;
        params[Param.HideIrrelevantFiltersInTab] = hideIrrelevantChipsInLiveboardTabs;
        params[Param.IsUnifiedSearchExperienceEnabled] = isUnifiedSearchExperienceEnabled;
        params[Param.CoverAndFilterOptionInPDF] = !!coverAndFilterOptionInPDF;

        params = this.getBaseQueryParams(params);

        if (!isUndefined(updatedSpotterChatPrompt)) {
            params[Param.UpdatedSpotterChatPrompt] = !!updatedSpotterChatPrompt;
        }

        // Handle spotterSidebarConfig params
        if (spotterSidebarConfig) {
            const {
                enablePastConversationsSidebar,
                spotterSidebarTitle,
                spotterSidebarDefaultExpanded,
                spotterChatRenameLabel,
                spotterChatDeleteLabel,
                spotterDeleteConversationModalTitle,
                spotterPastConversationAlertMessage,
                spotterDocumentationUrl,
                spotterBestPracticesLabel,
                spotterConversationsBatchSize,
                spotterNewChatButtonTitle,
            } = spotterSidebarConfig;

            setParamIfDefined(params, Param.EnablePastConversationsSidebar, enablePastConversationsSidebar, true);
            setParamIfDefined(params, Param.SpotterSidebarDefaultExpanded, spotterSidebarDefaultExpanded, true);
            setParamIfDefined(params, Param.SpotterSidebarTitle, spotterSidebarTitle);
            setParamIfDefined(params, Param.SpotterChatRenameLabel, spotterChatRenameLabel);
            setParamIfDefined(params, Param.SpotterChatDeleteLabel, spotterChatDeleteLabel);
            setParamIfDefined(params, Param.SpotterDeleteConversationModalTitle, spotterDeleteConversationModalTitle);
            setParamIfDefined(params, Param.SpotterPastConversationAlertMessage, spotterPastConversationAlertMessage);
            setParamIfDefined(params, Param.SpotterBestPracticesLabel, spotterBestPracticesLabel);
            setParamIfDefined(params, Param.SpotterConversationsBatchSize, spotterConversationsBatchSize);
            setParamIfDefined(params, Param.SpotterNewChatButtonTitle, spotterNewChatButtonTitle);

            // URL param with validation
            if (spotterDocumentationUrl !== undefined) {
                const [isValid, validationError] = validateHttpUrl(spotterDocumentationUrl);
                if (isValid) {
                    params[Param.SpotterDocumentationUrl] = spotterDocumentationUrl;
                } else {
                    this.handleError({
                        errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                        message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                        code: EmbedErrorCodes.INVALID_URL,
                        error: validationError?.message || ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                    });
                }
            }
        }

        // Handle spotterChatConfig params
        if (spotterChatConfig) {
            const {
                hideToolResponseCardBranding,
                toolResponseCardBrandingLabel,
            } = spotterChatConfig;

            setParamIfDefined(params, Param.HideToolResponseCardBranding, hideToolResponseCardBranding, true);
            setParamIfDefined(params, Param.ToolResponseCardBrandingLabel, toolResponseCardBrandingLabel);
        }

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
                if (isValidCssMargin(this.viewConfig.lazyLoadingMargin)) {
                    params[Param.RootMarginForLazyLoad] = this.viewConfig.lazyLoadingMargin;
                }
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

        if (homePageSearchBarMode) {
            params[Param.HomePageSearchBarMode] = homePageSearchBarMode;
        }

        if (enablePendoHelp !== undefined) {
            params[Param.EnablePendoHelp] = enablePendoHelp;
        }

        if (isLiveboardStylingAndGroupingEnabled !== undefined) {
            params[Param.IsLiveboardStylingAndGroupingEnabled] = isLiveboardStylingAndGroupingEnabled;
        }

        if (isPNGInScheduledEmailsEnabled !== undefined) {
            params[Param.isPNGInScheduledEmailsEnabled] = isPNGInScheduledEmailsEnabled;
        }

        if (isLiveboardXLSXCSVDownloadEnabled !== undefined) {
            params[Param.isLiveboardXLSXCSVDownloadEnabled] = isLiveboardXLSXCSVDownloadEnabled;
        }

        if (isGranularXLSXCSVSchedulesEnabled !== undefined) {
            params[Param.isGranularXLSXCSVSchedulesEnabled] = isGranularXLSXCSVSchedulesEnabled;
        }

        if (hideTagFilterChips !== undefined) {
            params[Param.HideTagFilterChips] = hideTagFilterChips;
        }

        if (isLinkParametersEnabled !== undefined) {
            params[Param.isLinkParametersEnabled] = isLinkParametersEnabled;
        }

        if (isCentralizedLiveboardFilterUXEnabled != undefined) {
            params[
                Param.isCentralizedLiveboardFilterUXEnabled
            ] = isCentralizedLiveboardFilterUXEnabled;
        }

        if (isThisPeriodInDateFiltersEnabled !== undefined) {
            params[Param.IsThisPeriodInDateFiltersEnabled] = isThisPeriodInDateFiltersEnabled;
        }

        this.defaultHeight = minimumHeight || this.defaultHeight;

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

        // Set navigation to v2 by default to avoid problems like the app
        // switcher (9-dot menu) not showing when v3 navigation is turned on
        // at the cluster level.
        // To use v3 navigation, we must manually set the discoveryExperience
        // settings.
        params[Param.NavigationVersion] = 'v2';
        // Set homePageVersion to v2 by default to reset the LD flag value
        // for the homepageVersion.
        params[Param.HomepageVersion] = 'v2';
        // Set listpageVersion to v2 by default to reset the LD flag value
        // for the listpageVersion.
        params[Param.ListPageVersion] = ListPage.List;
        if (discoveryExperience) {
            // primaryNavbarVersion v3 will enabled the new left navigation
            if (discoveryExperience.primaryNavbarVersion === PrimaryNavbarVersion.Sliding) {
                params[Param.NavigationVersion] = discoveryExperience.primaryNavbarVersion;
                // Enable the modularHomeExperience when Sliding is enabled.
                params[Param.ModularHomeExperienceEnabled] = true;
            }

            // homePage v2 will enable the modular home page
            // and it will override the modularHomeExperience value
            if (discoveryExperience.homePage === HomePage.Modular) {
                params[Param.ModularHomeExperienceEnabled] = true;
            }

            // ModularWithStylingChanges (v3) introduces the styling changes
            // to the Modular Homepage.
            // v3 will be the base version of homePageVersion.
            if (discoveryExperience.homePage === HomePage.ModularWithStylingChanges) {
                params[Param.HomepageVersion] = HomePage.ModularWithStylingChanges;
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
     * Set the iframe height as per the computed height received
     * from the ThoughtSpot app.
     * @param data The event payload
     */
    protected updateIFrameHeight = (data: MessagePayload) => {
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
