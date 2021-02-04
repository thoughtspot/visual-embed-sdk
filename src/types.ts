/**
 * Copyright (c) 2020
 *
 * TypeScript type definitions for ThoughtSpot Embed UI SDK
 *
 * @summary Type definitions for Embed SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

// eslint-disable-next-line no-shadow
export enum AuthType {
    None = 'None',
    SSO = 'SSO',
    AuthServer = 'AuthServer',
}

export type DOMSelector = string | HTMLElement;

export interface EmbedConfig {
    thoughtSpotHost: string;
    authType: AuthType;
    authEndpoint?: string;
    v1?: boolean;
}

export type MessagePayload = { type: string; data: any };
export type MessageCallback = (payload: MessagePayload) => void;

export type GenericCallbackFn = (...args: any[]) => any;

export type QueryParams = {
    [key: string]: string;
};

// eslint-disable-next-line no-shadow
export enum RuntimeFilterOp {
    EQ = 'EQ', // equals
    NE = 'NE', // does not equal
    LT = 'LT', // less than
    LE = 'LE', // less than or equal to
    GT = 'GT', // greater than
    GE = 'GE', // greater than or equal to
    CONTAINS = 'CONTAINS', // contains
    BEGINS_WITH = 'BEGINS_WITH', // begins with
    ENDS_WITH = 'ENDS_WITH', // ends with
    BW_INC_MAX = 'BW_INC_MAX', // between inclusive of higher value
    BW_INC_MIN = 'BW_INC_MIN', // between inclusive of lower value
    BW_INC = 'BW_INC', // between inclusive
    BW = 'BW', // between non-inclusive
    IN = 'IN', // is included in this list of values
}

export interface RuntimeFilter {
    columnName: string;
    operator: RuntimeFilterOp;
    values: (number | boolean | string)[];
}

// eslint-disable-next-line no-shadow
export enum EventType {
    // Events emitted by TS app
    RenderInit = 'renderInit',
    Init = 'init',
    Load = 'load',
    Data = 'data',
    FiltersChanged = 'filtersChanged',
    QueryChanged = 'queryChanged',
    Drilldown = 'drillDown',
    DataSourceSelected = 'dataSourceSelected',
    CustomAction = 'customAction',

    // Triggerable events
    Search = 'search',
    Filter = 'filter',
    Reload = 'reload',
}

// eslint-disable-next-line no-shadow
export enum EventTypeV1 {
    Alert = 'alert',
    Data = 'data',
    AuthExpire = 'authExpire',
}

// eslint-disable-next-line no-shadow
export enum DataSourceVisualMode {
    Hidden = 'hide',
    Collapsed = 'collapse',
    Expanded = 'expand',
}

// eslint-disable-next-line no-shadow
export enum Param {
    DataSources = 'dataSources',
    DataSourceMode = 'dataSourceMode',
    DisableActions = 'disableAction',
    DisableActionReason = 'disableHint',
    SearchQuery = 'searchQuery',
    HideActions = 'hideAction',
}

// eslint-disable-next-line no-shadow
export enum Action {
    Save = 'save',
    Update = 'update',
    SaveUntitled = 'saveUntitled',
    SaveAsView = 'saveAsView',
    MakeACopy = 'makeACopy',
    EditACopy = 'editACopy',
    CopyLink = 'embedDocument',
    PinboardSnapshot = 'pinboardSnapshot',
    ResetLayout = 'resetLayout',
    Schedule = 'schedule',
    SchedulesList = 'schedule-list',
    Share = 'share',
    AddFilter = 'addFilter',
    ConfigureFilter = 'configureFilter',
    AddFormula = 'addFormula',
    SearchOnTop = 'searchOnTop',
    SpotIQAnalyze = 'spotIQAnalyze',
    ExplainInsight = 'explainInsight',
    SpotIQFollow = 'spotIQFollow',
    ShareViz = 'shareViz',
    ReplaySearch = 'replaySearch',
    ShowUnderlyingData = 'showUnderlyingData',
    Download = 'download',
    DownloadAsPdf = 'downloadAsPdf',
    DownloadAsCsv = 'downloadAsCSV',
    DownloadAsXlsx = 'downloadAsXLSX',
    DownloadTrace = 'downloadTrace',
    ExportTSL = 'exportTSL',
    ImportTSL = 'importTSL',
    UpdateTSL = 'updateTSL',
    EditTSL = 'editTSL',
    Presentation = 'present',
    ToggleSize = 'toggleSize',
    Edit = 'edit',
    EditTitle = 'editTitle',
    Remove = 'delete',
    Ungroup = 'ungroup',
    Describe = 'describe',
    Relate = 'relate',
    CustomizeHeadlines = 'customizeHeadlines',
    PinboardInfo = 'pinboardInfo',
    SendAnswerFeedback = 'sendFeedback',
    CustomAction = 'customAction',
    DownloadEmbraceQueries = 'downloadEmbraceQueries',
    Pin = 'pin',
    AnalysisInfo = 'analysisInfo',
    Subscription = 'subscription',
    Explore = 'explore',
}
