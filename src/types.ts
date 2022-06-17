/**
 * Copyright (c) 2022
 *
 * TypeScript type definitions for ThoughtSpot Visual Embed SDK
 *
 * @summary Type definitions for Embed SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

/**
 * The authentication mechanism for allowing access to the
 * the embedded app
 */
// eslint-disable-next-line no-shadow
export enum AuthType {
    /**
     * No authentication. Use this only for testing purposes.
     */
    None = 'None',
    /**
     * SSO using SAML
     */
    SSO = 'SSO_SAML',
    /**
     * SSO using OIDC
     */
    OIDC = 'SSO_OIDC',
    /**
     * Trusted authentication server
     */
    AuthServer = 'AuthServer',
    /**
     * Use the ThoughtSpot login API to authenticate to the cluster directly.
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
    Basic = 'Basic',
}

export type DOMSelector = string | HTMLElement;

/**
 * The configuration object for embedding ThoughtSpot content.
 * It includes the ThoughtSpot hostname or IP address,
 * the type of authentication, and the authentication endpoint
 * if a trusted authentication server is used.
 */
export interface EmbedConfig {
    /**
     * The ThoughtSpot cluster hostname or IP address.
     */
    thoughtSpotHost: string;
    /**
     * The authentication mechanism to use.
     */
    authType: AuthType;
    /**
     * [AuthServer] The trusted authentication endpoint to use to get the
     * authentication token. A GET request is made to the
     * authentication API endpoint, which  returns the token
     * as a plaintext response. For trusted authentication,
     * the `authEndpoint` or `getAuthToken` attribute is required.
     */
    authEndpoint?: string;
    /**
     * [AuthServer] A function that invokes the trusted authentication endpoint
     * and returns a Promise that resolves to the `auth token` string.
     * For trusted authentication, the `authEndpoint` or `getAuthToken`
     * attribute is required.
     *
     * It is advisable to fetch a new token inside this method and not
     * reuse and older issued token, as because when auth expires this is
     * called again and if it is called with an older token the authentication
     * will not succeed.
     */
    getAuthToken?: () => Promise<string>;
    /**
     * [AuthServer / Basic] The user name of the ThoughtSpot user. This attribute is
     * required for trusted authentication.
     */
    username?: string;

    /**
     * [Basic] The ThoughtSpot login password corresponding to the user name
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
    password?: string;

    /**
     * [SSO] For SSO Authentication, if `noRedirect` is set to true, it will open the SAML auth
     * flow in a popup, instead of redirecting browser in place.
     *
     * @default false
     */
    noRedirect?: boolean;

    /**
     * [SSO] For SSO Authentication, one can supply an optional path param,
     * this will be the path on the host origin where the SAML flow will be
     * terminated.
     *
     * Eg: "/dashboard", "#/foo" [Do not include the host]
     * @version SDK: 1.10.2 | ThoughtSpot: *
     */
    redirectPath?: string;

    /** @internal */
    basepath?: string;

    /**
     * Should we encode URL Query Params using base64 encoding which thoughtspot
     * will generate for embedding. This provides additional security to
     * thoughtspot clusters against Cross site scripting attacks.
     * @default false
     */
    shouldEncodeUrlQueryParams?: boolean;

    /**
     * Suppress cookie access alert when third party cookies are blocked by the user's browser.
     * Third party cookie blocking is the default behaviour on Safari and opt-in for Firefox/Chrome.
     * If you set this to `true`, you are encouraged to handle `noCookieAccess` event, to show your own treatment
     * in this case.
     * @default false
     */
    suppressNoCookieAccessAlert?: boolean;

    /**
     * Re-login when session expires with the previous login options
     * @default false
     */
    autoLogin?: boolean;

    /**
     * Disable redirection to the login page when the embedded session expires
     * This flag is typically used alongside the combination of auth modes such as {@link AuthType.AuthServer} and auto login behavior {@link EmbedConfig.autoLogin}
     * @version SDK: 1.9.3 | ThoughtSpot: 8.1.0.cl
     * @default false
     */
    disableLoginRedirect?: boolean;

    /**
     * This message is displayed on the embed view when the login fails.
     * @version 1.10.1 | ThoughtSpot: *
     */
    loginFailedMessage?: string;

    /**
     * Calls the prefetch method internally when set to true
     * @default false
     */
    callPrefetch?: boolean;

    /**
     * When there are multiple embeds, queue the render of embed to start
     *  after the previous embed's render is complete. This helps in the load performance
     *  by decreasing the load on the browser.
     * @version 1.5.0 or later
     * @default false
     */
    queueMultiRenders?: boolean;

    /**
     * Dynamic CSS Url to be injected in the loaded application.
     * You would also need to set `style-src` in the CSP settings.
     * @version 1.6.0 or later
     * @default ''
     */
    customCssUrl?: string;
    /**
     * [AuthServer|Basic] Detect if 3rd party cookies are enabled by doing an additional call. This is slower
     * and should be avoided. Listen to the NO_COOKIE_ACCESS event to handle the situation.
     *
     * This is slightly slower than letting the browser handle the cookie check, as it involves an extra network call.
     * @version SDK: 1.10.4 | ThoughtSpot: *
     */
    detectCookieAccessSlow?: boolean;
    /**
     * Hide beta alert warning message for SearchEmbed.
     *
     * @version SDK: 1.12.0 | ThoughtSpot: *
     */
    suppressSearchEmbedBetaWarning?: boolean;
}

/**
 * MessagePayload: Embed event payload: message type, data and status (start/end)
 */
export type MessagePayload = {
    /* type: message type eg: 'save' */
    type: string;
    /* data: message payload data eg: { answerId: '123' } */
    data: any;
    /* status: message payload status - start or end */
    status?: string;
};
/**
 * MessageOptions: By Providing options, getting specific event start / end based on option
 */
export type MessageOptions = {
    /* A boolean value indicating that start status events of this type will be dispatched */
    start?: boolean;
};
/**
 * MessageCallback: Embed event message callback
 */
export type MessageCallback = (
    /* payload: Message payload contain type, data and status */
    payload: MessagePayload,
    /* responder: Messsage callback function triggered when embed event initiated */
    responder?: (data: any) => void,
) => void;
/**
 * MessageCallbackObj: contains message options & callback function
 */
export type MessageCallbackObj = {
    /* options: It contains start, A boolean value indicating that start status events of this type will be dispatched */
    /* callback: Embed event message callback */
    options: MessageOptions;
    callback: MessageCallback;
};

export type GenericCallbackFn = (...args: any[]) => any;

export type QueryParams = {
    [key: string]: string;
};

/**
 * A map of the supported runtime filter operations
 */
// eslint-disable-next-line no-shadow
export enum RuntimeFilterOp {
    /**
     * Equals
     */
    EQ = 'EQ',
    /**
     * Does not equal
     */
    NE = 'NE',
    /**
     * Less than
     */
    LT = 'LT',
    /**
     * Less than or equal to
     */
    LE = 'LE',
    /**
     * Greater than
     */
    GT = 'GT',
    /**
     * Greater than or equal to
     */
    GE = 'GE',
    /**
     * Contains
     */
    CONTAINS = 'CONTAINS',
    /**
     * Begins with
     */
    BEGINS_WITH = 'BEGINS_WITH',
    /**
     * Ends with
     */
    ENDS_WITH = 'ENDS_WITH',
    /**
     * Between, inclusive of higher value
     */
    BW_INC_MAX = 'BW_INC_MAX',
    /**
     * Between, inclusive of lower value
     */
    BW_INC_MIN = 'BW_INC_MIN',
    /**
     * Between, inclusive of both higher and lower value
     */
    BW_INC = 'BW_INC',
    /**
     * Between, non-inclusive
     */
    BW = 'BW',
    /**
     * Is included in this list of values
     */
    IN = 'IN',
}

/**
 * A filter that can be applied to ThoughtSpot answers, Liveboards, or
 * visualizations at runtime.
 */
export interface RuntimeFilter {
    /**
     * The name of the column to filter on (case-sensitive)
     */
    columnName: string;
    /**
     * The operator to apply
     */
    operator: RuntimeFilterOp;
    /**
     * The list of operands. Some operators like EQ, LE accept
     * a single operand, whereas other operators like BW and IN accept multiple operands.
     */
    values: (number | boolean | string)[];
}

/**
 * Event types emitted by the embedded ThoughtSpot application.
 */
// eslint-disable-next-line no-shadow
export enum EmbedEvent {
    /**
     * Rendering has initialized.
     * @return timestamp - The timestamp when the event was generated.
     */
    Init = 'init',
    /**
     * Authentication has either succeeded or failed.
     * @return isLoggedIn - A Boolean specifying whether authentication was successful.
     */
    AuthInit = 'authInit',
    /**
     * The embed object container has loaded.
     * @return timestamp - The timestamp when the event was generated.
     */
    Load = 'load',
    /**
     * Data pertaining to answer or Liveboard is received
     * @return data - The answer or Liveboard data
     */
    Data = 'data',
    /**
     * Search/answer/Liveboard filters have been applied/updated
     * @hidden
     */
    FiltersChanged = 'filtersChanged',
    /**
     * Search query has been updated
     */
    QueryChanged = 'queryChanged',
    /**
     * A drill down operation has been performed.
     * @return additionalFilters - Any additional filters applied
     * @return drillDownColumns - The columns on which drill down was performed
     * @return nonFilteredColumns - The columns that were not filtered
     */
    Drilldown = 'drillDown',
    /**
     * One or more data sources have been selected.
     * @return dataSourceIds - the list of data sources
     */
    DataSourceSelected = 'dataSourceSelected',
    /**
     * One or more data columns have been selected.
     * @return columnIds - the list of columns
     * @version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl
     */
    AddRemoveColumns = 'addRemoveColumns',
    /**
     * A custom action has been triggered
     * @return actionId - The id of the custom action
     * @return data - The answer or Liveboard data
     */
    CustomAction = 'customAction',
    /**
     * A double click has been triggered on table/chart
     * @return ContextMenuInputPoints - data point that is double clicked
     * @version 1.5.0 or later
     */
    VizPointDoubleClick = 'vizPointDoubleClick',
    /**
     * A click has been triggered on table/chart
     * @return ContextMenuInputPoints - data point that is clicked
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    VizPointClick = 'vizPointClick',
    /**
     * An error has occurred.
     * @return error - An error object or message
     */
    Error = 'Error',
    /**
     * The embedded object has sent an alert
     * @return alert - An alert object
     */
    Alert = 'alert',
    /**
     * The ThoughtSpot auth session has expired.
     */
    AuthExpire = 'ThoughtspotAuthExpired',
    /**
     * ThoughtSpot failed to validate the auth session.
     * @hidden
     */
    AuthFailure = 'ThoughtspotAuthFailure',
    /**
     * ThoughtSpot failed to validate the auth session.
     * @hidden
     */
    AuthLogout = 'ThoughtspotAuthLogout',
    /**
     * The height of the embedded Liveboard or visualization has been computed.
     * @return data - The height of the embedded Liveboard or visualization
     * @hidden
     */
    EmbedHeight = 'EMBED_HEIGHT',
    /**
     * The center of visible iframe viewport is calculated.
     * @return data - The center of the visible Iframe viewport.
     * @hidden
     */
    EmbedIframeCenter = 'EmbedIframeCenter',
    /**
     * Detects the route change.
     */
    RouteChange = 'ROUTE_CHANGE',
    /**
     * The v1 event type for Data
     * @hidden
     */
    V1Data = 'exportVizDataToParent',
    /**
     * Emitted when the embed does not have cookie access. This
     * happens on Safari where third-party cookies are blocked by default.
     *
     * @version 1.1.0 or later
     */
    NoCookieAccess = 'noCookieAccess',
    /**
     * Emitted when SAML is complete
     * @private
     * @hidden
     */
    SAMLComplete = 'samlComplete',
    /**
     * Emitted when any modal is opened in the app
     * @version 1.6.0 or later
     */
    DialogOpen = 'dialog-open',
    /**
     * Emitted when any modal is closed in the app
     * @version 1.6.0 or later
     */
    DialogClose = 'dialog-close',
    /**
     * Emitted when a liveboard has completed rendering,
     * this event can be used as a hook to trigger events on the
     * rendered liveboard
     * @version 1.9.1 or later
     */
    LiveboardRendered = 'PinboardRendered',
    /**
     * This can be used to register an event listener which
     * is triggered on all events.
     * @version SDK: 1.10.0 | ThoughtSpot: any
     */
    ALL = '*',
    /**
     * Emitted when answer is saved in the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    Save = 'save',
    /**
     * Emitted when the download action is triggered on an answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    Download = 'download',
    /**
     * Emitted when the Download as PDF action is triggered on an answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * Emitted when the Download as CSV action is triggered on an answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    DownloadAsCsv = 'downloadAsCsv',
    /**
     * Emitted when the Download as XLSX action is triggered on an answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    DownloadAsXlsx = 'downloadAsXlsx',
    /**
     * Emitted when an answer is deleted in the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    AnswerDelete = 'answerDelete',
    /**
     * Emitted when an answer is pinned to a Liveboard
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    Pin = 'pin',
    /**
     * Emitted when SpotIQ analysis is triggered
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    SpotIQAnalyze = 'spotIQAnalyze',
    /**
     * Emitted when a user shares an object with another user or group
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    Share = 'share',
    /**
     * Emitted when a user clicks the Include action to include a specific value or data on a chart or table
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    DrillInclude = 'context-menu-item-include',
    /**
     * Emitted when a user clicks the Exclude action to exclude a specific value or data on a chart or table
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    DrillExclude = 'context-menu-item-exclude',
    /**
     * Emitted when copied column value on the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    CopyToClipboard = 'context-menu-item-copy-to-clipboard',
    /**
     * Emitted when a user clicks the Update TML action
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    UpdateTML = 'updateTSL',
    /**
     * Emitted when a user clicks the Edit TML action
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    EditTML = 'editTSL',
    /**
     * Emitted when ExportTML trigger in answer on the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    ExportTML = 'exportTSL',
    /**
     * Emitted when an answer is saved as a view
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    SaveAsView = 'saveAsView',
    /**
     * Emitted when copy of existing answer on the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    CopyAEdit = 'copyAEdit',
    /**
     * Emitted when a user clicks Show underlying data on an answe
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    ShowUnderlyingData = 'showUnderlyingData',
    /**
     * Emitted when an answer is switched to a chart or table view
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
}

/**
 * Event types that can be triggered by the host application
 * to the embedded ThoughtSpot app
 *
 * To trigger an event use the corresponding
 * {@link LiveboardEmbed.trigger} or {@link AppEmbed.trigger} or {@link SearchEmbed.trigger} method.
 */
// eslint-disable-next-line no-shadow
export enum HostEvent {
    /**
     * Trigger a search
     * @param dataSourceIds - The list of data source GUIDs
     * @param searchQuery - The search query
     */
    Search = 'search',
    /**
     * Trigger a drill on certain points by certain column
     * @param points - an object containing selectedPoints/clickedPoints
     *              eg. { selectedPoints: []}
     * @param columnGuid - a string guid of the column to drill by. This is optional,
     *                     if not provided it will auto drill by the configured column. \
     * @version 1.5.0 or later
     */
    DrillDown = 'triggerDrillDown',
    /**
     * Apply filters
     * @hidden
     */
    Filter = 'filter',
    /**
     * Reload the answer or visualization
     * @hidden
     */
    Reload = 'reload',
    /**
     * Set the visible visualizations on a Liveboard.
     * @param - an array of ids of visualizations to show, the ids not passed
     *          will be hidden.
     * @version 1.6.0 or later
     */
    SetVisibleVizs = 'SetPinboardVisibleVizs',
    /**
     * Update the runtime filters. The runtime filters passed here are extended
     * on to the existing runtime filters if they exist.
     * @param - {@link RuntimeFilter}[] an array of {@link RuntimeFilter} Types.
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl
     */
    UpdateRuntimeFilters = 'UpdateRuntimeFilters',
    /**
     * Navigate to a specific page in App embed without any reload.
     * This is the same as calling `appEmbed.navigateToPage(path, true)`
     * @param path - the path to navigate to (can be a number[1/-1] to go forward/back)
     * @version SDK: 1.12.0 | ThoughtSpot: 8.4.0.cl
     */
    Navigate = 'Navigate',
    /**
     * Gets the current pinboard content.
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl
     */
    getExportRequestForCurrentPinboard = 'getExportRequestForCurrentPinboard',
    /**
     * Fires the pin action on an embedded object
     * @param - incase of liveboard embed, takes in an object with vizId as a key
     * can be left empty for search and viz embeds
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl
     */
    Pin = 'pin',
}

/**
 * The different visual modes that the data sources panel within
 * search could appear in, i.e., hidden, collapsed, or expanded.
 */
// eslint-disable-next-line no-shadow
export enum DataSourceVisualMode {
    /**
     * Data source panel is hidden.
     */
    Hidden = 'hide',
    /**
     * Data source panel is collapsed, but the user can manually expand it.
     */
    Collapsed = 'collapse',
    /**
     * Data source panel is expanded, but the user can manually collapse it.
     */
    Expanded = 'expand',
}

/**
 * The query params passed down to the embedded ThoughtSpot app
 * containing configuration and/or visual information.
 */
// eslint-disable-next-line no-shadow
export enum Param {
    DataSources = 'dataSources',
    DataSourceMode = 'dataSourceMode',
    DisableActions = 'disableAction',
    DisableActionReason = 'disableHint',
    ForceTable = 'forceTable',
    preventLiveboardFilterRemoval = 'preventPinboardFilterRemoval', // update-TSCB
    SearchQuery = 'searchQuery',
    HideActions = 'hideAction',
    HideObjects = 'hideObjects',
    HostAppUrl = 'hostAppUrl',
    EnableVizTransformations = 'enableVizTransform',
    EnableSearchAssist = 'enableSearchAssist',
    HideResult = 'hideResult',
    UseLastSelectedDataSource = 'useLastSelectedSources',
    Tag = 'tag',
    searchTokenString = 'searchTokenString',
    executeSearch = 'executeSearch',
    fullHeight = 'isFullHeightPinboard',
    livedBoardEmbed = 'isLiveboardEmbed',
    searchEmbed = 'isSearchEmbed',
    Version = 'sdkVersion',
    ViewPortHeight = 'viewPortHeight',
    ViewPortWidth = 'viewPortWidth',
    VisibleActions = 'visibleAction',
    CustomCSSUrl = 'customCssUrl',
    DisableLoginRedirect = 'disableLoginRedirect',
    visibleVizs = 'pinboardVisibleVizs',
    LiveboardV2Enabled = 'isPinboardV2Enabled',
    ShowAlerts = 'showAlerts',
    Locale = 'locale',
}

/**
 * The list of actions that can be performed on visual ThoughtSpot
 * entities, such as answers and Liveboards.
 */
// eslint-disable-next-line no-shadow
export enum Action {
    Save = 'save',
    /**
     * @hidden
     */
    Update = 'update',
    /**
     * @hidden
     */
    SaveUntitled = 'saveUntitled',
    SaveAsView = 'saveAsView',
    MakeACopy = 'makeACopy',
    EditACopy = 'editACopy',
    CopyLink = 'embedDocument',
    /**
     * @hidden
     */
    ResetLayout = 'resetLayout',
    Schedule = 'subscription',
    SchedulesList = 'schedule-list',
    Share = 'share',
    AddFilter = 'addFilter',
    ConfigureFilter = 'configureFilter',
    /**
     * @hidden
     */
    AddFormula = 'addFormula',
    /**
     * @hidden
     */
    SearchOnTop = 'searchOnTop',
    SpotIQAnalyze = 'spotIQAnalyze',
    /**
     * @hidden
     */
    ExplainInsight = 'explainInsight',
    /**
     * @hidden
     */
    SpotIQFollow = 'spotIQFollow',
    ShareViz = 'shareViz',
    /**
     * @hidden
     */
    ReplaySearch = 'replaySearch',
    ShowUnderlyingData = 'showUnderlyingData',
    Download = 'download',
    DownloadAsPdf = 'downloadAsPdf',
    DownloadAsCsv = 'downloadAsCSV',
    DownloadAsXlsx = 'downloadAsXLSX',
    /**
     * @hidden
     */
    DownloadTrace = 'downloadTrace',
    ExportTML = 'exportTSL',
    ImportTML = 'importTSL',
    UpdateTML = 'updateTSL',
    EditTML = 'editTSL',
    Present = 'present',
    ToggleSize = 'toggleSize',
    Edit = 'edit',
    EditTitle = 'editTitle',
    Remove = 'delete',
    /**
     * @hidden
     */
    Ungroup = 'ungroup',
    /**
     * @hidden
     */
    Describe = 'describe',
    /**
     * @hidden
     */
    Relate = 'relate',
    /**
     * @hidden
     */
    CustomizeHeadlines = 'customizeHeadlines',
    /**
     * @hidden
     */
    PinboardInfo = 'pinboardInfo',
    LiveboardInfo = 'pinboardInfo',
    /**
     * @hidden
     */
    SendAnswerFeedback = 'sendFeedback',
    /**
     * @hidden
     */
    DownloadEmbraceQueries = 'downloadEmbraceQueries',
    Pin = 'pin',
    /**
     * @hidden
     */
    AnalysisInfo = 'analysisInfo',
    Subscription = 'subscription',
    Explore = 'explore',
    DrillInclude = 'context-menu-item-include',
    DrillExclude = 'context-menu-item-exclude',
    CopyToClipboard = 'context-menu-item-copy-to-clipboard',
    CopyAndEdit = 'context-menu-item-copy-and-edit',
    /**
     * @hidden
     */
    DrillEdit = 'context-menu-item-edit',
    EditMeasure = 'context-menu-item-edit-measure',
    Separator = 'context-menu-item-separator',
    /**
     * @hidden
     */
    DrillDown = 'DRILL',
    RequestAccess = 'requestAccess',
    QueryDetailsButtons = 'queryDetailsButtons',
    /**
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl
     */
    AnswerDelete = 'onDeleteAnswer',
    /**
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
    /**
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl
     */
    AddToFavorites = 'addToFavorites',
    /**
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl
     */
    EditDetails = 'editDetails',
    /**
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl
     */
    CreateMonitor = 'createMonitor',
    /**
     * @version SDK: 1.11.1 | ThoughtSpot: 8.3.0.cl
     */
    ReportError = 'reportError',
}

export interface SessionInterface {
    sessionId: string;
    genNo: number;
    acSession: { sessionId: string; genNo: number };
}

// eslint-disable-next-line no-shadow
export enum OperationType {
    GetChartWithData = 'GetChartWithData',
    GetTableWithHeadlineData = 'GetTableWithHeadlineData',
}

export interface AnswerServiceType {
    getAnswer?: (offset: number, batchSize: number) => any;
}
