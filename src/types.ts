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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LayoutConfig {}
export interface FrameParams {
    width?: number;
    height?: number;
}

export interface ViewConfig {
    layoutConfig?: LayoutConfig;
    frameParams?: FrameParams;
    theme?: string;
    // eslint-disable-next-line camelcase
    styleSheet__unstable?: string;
}

export type MessagePayload = { type: string; data: any };
export type MessageCallback = (payload: MessagePayload) => void;

export type GenericCallbackFn = (...args: any[]) => any;

export type QueryObject = any;

// eslint-disable-next-line no-shadow
export enum EventType {
    RenderInit = 'renderInit',
    Init = 'init',
    Load = 'load',
}

// eslint-disable-next-line no-shadow
export enum EventTypeV1 {
    Alert = 'alert',
    Data = 'data',
    AuthExpire = 'authExpire',
}

// eslint-disable-next-line no-shadow
export enum Page {
    Home = 'home',
    Search = 'search',
    Answers = 'answers',
    Pinboards = 'pinboards',
    Data = 'data',
}
