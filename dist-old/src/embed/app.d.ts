/**
 * Copyright (c) 2022
 *
 * Full application embedding
 * https://developers.thoughtspot.com/docs/?pageid=full-embed
 * @summary Full app embed
 * @module
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import { DOMSelector, MessagePayload, AllEmbedViewConfig, DefaultAppInitData, VisualizationOverrides } from '../types';
import { V1Embed } from './ts-embed';
import { SpotterChatViewConfig, SpotterSidebarViewConfig } from './conversation';
import { SpotterVizConfig } from './spotter-viz-utils';
/**
 * Pages within the ThoughtSpot app that can be embedded.
 */
export declare enum Page {
    /**
     * Home page
     */
    Home = "home",
    /**
     * Search page
     */
    Search = "search",
    /**
     * Saved answers listing page
     */
    Answers = "answers",
    /**
     * Liveboards listing page
     */
    Liveboards = "liveboards",
    /**
     * @hidden
     */
    Pinboards = "pinboards",
    /**
     * Data management page
     */
    Data = "data",
    /**
     * SpotIQ listing page
     */
    SpotIQ = "insights",
    /**
     *  Monitor Alerts Page
     */
    Monitor = "monitor"
}
/**
 * Define the initial state of column custom group accordions
 * in data panel v2.
 */
export declare enum DataPanelCustomColumnGroupsAccordionState {
    /**
     * Expand all the accordion initially in data panel v2.
     */
    EXPAND_ALL = "EXPAND_ALL",
    /**
     * Collapse all the accordions initially in data panel v2.
     */
    COLLAPSE_ALL = "COLLAPSE_ALL",
    /**
     * Expand the first accordion and collapse the rest.
     */
    EXPAND_FIRST = "EXPAND_FIRST"
}
export declare enum HomePageSearchBarMode {
    OBJECT_SEARCH = "objectSearch",
    AI_ANSWER = "aiAnswer",
    NONE = "none"
}
/**
 * Define the version of the primary navbar
 * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
 */
export declare enum PrimaryNavbarVersion {
    /**
     * Sliding (v3) introduces a new left-side navigation hub featuring a tab switcher,
     * along with updates to the top navigation bar.
     * It serves as the foundational version of the PrimaryNavBar.
     */
    Sliding = "v3"
}
/**
 * Define the version of the home page
 * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
 */
export declare enum HomePage {
    /**
     * Modular (v2) introduces the updated Modular Home Experience.
     * It serves as the foundational version of the home page.
     */
    Modular = "v2",
    /**
     * ModularWithStylingChanges (v3) introduces Modular Home Experience
     * with styling changes.
     */
    ModularWithStylingChanges = "v3",
    /**
     * Focused (v4) introduces the V4 homepage experience
     * in which Watchlist and recents and incorporated together
     * to form a more focused homepage.
     * Pre-requisite : spotter enablement
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    Focused = "v4"
}
/**
 * Define the version of the list page
 * @version SDK: 1.40.0 | ThoughtSpot: 10.12.0.cl
 */
export declare enum ListPage {
    /**
     * List (v2) is the traditional List Experience.
     * It serves as the foundational version of the list page.
     */
    List = "v2",
    /**
     * ListWithUXChanges (v3) introduces the new updated list page with UX changes.
     */
    ListWithUXChanges = "v3"
}
/**
 * Define the discovery experience
 * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
 */
export interface DiscoveryExperience {
    /**
     * primaryNavbarVersion determines the version of the primary navigation bar.
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
     * @version SDK: 1.2.0 | ThoughtSpot: 8.4.0.cl
     * @default true
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
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     * @default false
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
     * @version SDK: 1.2.0 | ThoughtSpot: 8.4.0.cl
     * @default false
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
     * Whether the help menu in the top navigation bar should be served
     * from Pendo or ThoughtSpot's internal help items.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.36.3 | ThoughtSpot: 10.1.0.cl
     * @default true
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *   ... // other embed view config
     *  enablePendoHelp: false,
     * });
     * ```
     */
    enablePendoHelp?: boolean;
    /**
     * Control the visibility of the hamburger icon on
     * the top navigation bar in the V3 navigation experience.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @default false
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
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @default true
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
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @default true
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
     * shown in the UI.
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
     * For example, if you want the component to open to a specific Liveboard
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
     * Use this to open to a particular page in the app. To open to a specific
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
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1-sw
     * @default true
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
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     * @default false
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
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @default false
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
     * To set the initial state of the search bar in case of saved-answers. Use {@link collapseSearchBar} instead.
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     * @deprecated This flag is deprecated.
     * @default false
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
     * @version SDK: 1.33.0 | ThoughtSpot: 10.3.0.cl
     */
    homePageSearchBarMode?: HomePageSearchBarMode;
    /**
     * This flag is used to enable unified search experience for full app embed.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.34.0 | ThoughtSpot: 10.5.0.cl
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
     * This flag is used to enable the new connection experience for AppEmbed.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.8.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    newConnectionsExperience: true,
     * })
     * ```
     */
    newConnectionsExperience?: boolean;
    /**
     * This flag is used to enable/disable the styling and grouping in a Liveboard. Use {@link isLiveboardMasterpiecesEnabled} instead.
     * @deprecated This flag is deprecated.
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
     * const embed = new AppEmbed('#embed-container', {
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
     * const embed = new AppEmbed('#embed-container', {
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
     * updatedSpotterChatPrompt : Controls the updated spotter chat prompt.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    updatedSpotterChatPrompt : true,
     * })
     * ```
     */
    updatedSpotterChatPrompt?: boolean;
    /**
     * Controls the visibility of the past conversations sidebar.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     * @deprecated from SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     * Use `spotterSidebarConfig.enablePastConversationsSidebar`.
     * @default false
     */
    enablePastConversationsSidebar?: boolean;
    /**
     * Configuration for the Spotter sidebar UI customization.
     * Only applicable when navigating to Spotter within the app.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    // Deprecated standalone flag (backward compatibility)
     *    enablePastConversationsSidebar: false,
     *    // Recommended config; this value takes precedence
     *    spotterSidebarConfig: {
     *        enablePastConversationsSidebar: true,
     *        spotterSidebarTitle: 'My Conversations',
     *    },
     * })
     * ```
     */
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    /**
     * Configuration for customizing Spotter chat UI
     * branding in tool response cards.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.46.0 | ThoughtSpot: 26.4.0.cl
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
     * const embed = new AppEmbed('#embed-container', {
     *    ... // other options
     *    spotterViz: {
     *        brandName: 'MyBrand',
     *        brandHeadline: 'Hi, there! I\'m',
     *        description: 'Ask questions about your data',
     *        inputChatPlaceholder: 'Ask a question...',
     *        hideStarterPrompts: false,
     *        customStarterPrompts: [{ id: '1', displayText: 'Top products', fullPrompt: 'What are the top products by revenue?' }]
     *    },
     * })
     * ```
     */
    spotterViz?: SpotterVizConfig;
    /**
     * Enables the stop answer generation button in the Spotter embed UI,
     * allowing users to interrupt an ongoing answer generation.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     * @default false
     */
    enableStopAnswerGenerationEmbed?: boolean;
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
    /**
     * To enable the homepage announcement banner.
     * Controls the visibility of the announcement section
     * on the homepage.
     *
     * Supported embed types: `AppEmbed`
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    enableHomepageAnnouncement: true,
     * })
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    enableHomepageAnnouncement?: boolean;
    /**
     * If set to true, enables visualization data caching on the Liveboard.
     * @type {boolean}
     * @version SDK: 1.49.0 | ThoughtSpot: 26.6.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    enableLiveboardDataCache: true,
     * })
     * ```
     */
    enableLiveboardDataCache?: boolean;
    /**
     * Visual overrides to customize the chart or table properties.
     * @version SDK: 1.49.0 | ThoughtSpot: 26.6.0.cl
     */
    visualOverrides?: VisualizationOverrides;
}
/**
 * APP_INIT data shape for AppEmbed.
 * @internal
 */
export interface AppEmbedAppInitData extends DefaultAppInitData {
    embedParams?: {
        spotterSidebarConfig?: SpotterSidebarViewConfig;
        spotterVizConfig?: SpotterVizConfig;
    };
}
/**
 * Embeds full ThoughtSpot experience in a host application.
 * @group Embed components
 */
export declare class AppEmbed extends V1Embed {
    protected viewConfig: AppViewConfig;
    private defaultHeight;
    constructor(domSelector: DOMSelector, viewConfig: AppViewConfig);
    /**
     * Extends the default APP_INIT payload with `embedParams.spotterSidebarConfig`
     * so the conv-assist app can read sidebar configuration on initialisation.
     *
     * Precedence for `enablePastConversationsSidebar`:
     * `spotterSidebarConfig.enablePastConversationsSidebar` wins over the
     * deprecated top-level `enablePastConversationsSidebar` flag; if the former
     * is absent the latter is used as a fallback.
     *
     * An invalid `spotterDocumentationUrl` triggers a validation error and is
     * excluded from the payload rather than forwarded to the app.
     */
    protected getAppInitData(): Promise<AppEmbedAppInitData>;
    /**
     * Constructs a map of parameters to be passed on to the
     * embedded Liveboard or visualization.
     */
    protected getEmbedParams(): string;
    private sendFullHeightLazyLoadData;
    /**
     * This is a handler for the RequestVisibleEmbedCoordinates event.
     * It is used to send the visible coordinates data to the host application.
     * @param data The event payload
     * @param responder The responder function
     */
    private requestVisibleEmbedCoordinatesHandler;
    /**
     * Constructs the URL of the ThoughtSpot app page to be rendered.
     * @param pageId The ID of the page to be embedded.
     */
    getIFrameSrc(): string;
    /**
     * Set the iframe height as per the computed height received
     * from the ThoughtSpot app.
     * @param data The event payload
     */
    protected updateIFrameHeight: (data: MessagePayload) => void;
    private embedIframeCenter;
    private setIframeHeightForNonEmbedLiveboard;
    /**
     * Gets the ThoughtSpot route of the page for a particular page ID.
     * @param pageId The identifier for a page in the ThoughtSpot app.
     * @param modularHomeExperience
     */
    private getPageRoute;
    /**
     * Formats the path provided by the user.
     * @param path The URL path.
     * @returns The URL path that the embedded app understands.
     */
    private formatPath;
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
    navigateToPage(path: string | number, noReload?: boolean): void;
    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    destroy(): void;
    private postRender;
    private registerLazyLoadEvents;
    private unregisterLazyLoadEvents;
    /**
     * Renders the embedded application pages in the ThoughtSpot app.
     * @param renderOptions An object containing the page ID
     * to be embedded.
     */
    render(): Promise<AppEmbed>;
}
//# sourceMappingURL=app.d.ts.map