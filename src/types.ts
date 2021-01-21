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
    Drilldown = 'drilldown',
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
}
