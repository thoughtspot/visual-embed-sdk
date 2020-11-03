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

export interface EmbedConfig {
    thoughtSpotHost: string;
    authType: AuthType;
    authEndpoint?: string;
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

export type QueryObject = any;

// eslint-disable-next-line no-shadow
export enum EventType {
    Init = 'init',
    Load = 'load',
}
