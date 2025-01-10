/**
 * Copyright (c) 2022
 *
 * Base classes
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import { logger } from '../utils/logger';
import { getAuthenticationToken } from '../authToken';
import { AnswerService } from '../utils/graphql/answerService/answerService';
import {
    getEncodedQueryParamsString,
    getQueryParamString,
} from '../utils';
import {
    getThoughtSpotHost,
    getV2BasePath,
} from '../config';
import {
    AuthType,
    Action,
    Param,
    EmbedConfig,
    ViewConfig,
    ContextMenuTriggerOptions,
    EmbedEvent,
} from '../types';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';
import pkgInfo from '../../package.json';
import { getEmbedConfig } from './embedConfig';
import { ERROR_MESSAGE } from '../errors';
import { processAuthFailure } from 'src/utils/processData';
import { handleAuth, notifyAuthFailure } from './base';
import { AuthFailureType } from 'src/auth';

const { version } = pkgInfo;

/**
 * Global prefix for all Thoughtspot postHash Params.
 */
export const THOUGHTSPOT_PARAM_PREFIX = 'ts-';
const TS_EMBED_ID = '_thoughtspot-embed';

/**
 * The event id map from v2 event names to v1 event id
 * v1 events are the classic embed events implemented in Blink v1
 * We cannot rename v1 event types to maintain backward compatibility
 * @internal
 */
const V1EventMap = {};

/**
 * Base class for embedding v2 experience
 * Note: the v2 version of ThoughtSpot Blink is built on the new stack:
 * React+GraphQL
 */
export class BaseEmbed {


    protected isAppInitialized = false;


    protected viewConfig: ViewConfig;

    protected embedConfig: EmbedConfig;

    /**
     * The ThoughtSpot hostname or IP address
     */
    protected thoughtSpotHost: string;

    /*
     * This is the base to access ThoughtSpot V2.
     */
    protected thoughtSpotV2Base: string;

    /**
     * A flag to mark if an error has occurred.
     */
    protected isError: boolean;


    /**
     * Should we encode URL Query Params using base64 encoding which thoughtspot
     * will generate for embedding. This provides additional security to
     * thoughtspot clusters against Cross site scripting attacks.
     * @default false
     */
    protected shouldEncodeUrlQueryParams = false;

    private defaultHiddenActions = [Action.ReportError];

    constructor(viewConfig?: ViewConfig) {

        // TODO: handle error
        this.embedConfig = getEmbedConfig();
        this.thoughtSpotHost = getThoughtSpotHost(this.embedConfig);
        this.thoughtSpotV2Base = getV2BasePath(this.embedConfig);

        this.isError = false;
        this.viewConfig = {
            excludeRuntimeFiltersfromURL: false,
            excludeRuntimeParametersfromURL: false,
            ...viewConfig,
        };
        this.shouldEncodeUrlQueryParams = this.embedConfig.shouldEncodeUrlQueryParams;
        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_EMBED_CREATE, {
            ...viewConfig,
        });
    }

    /**
     * Throws error encountered during initialization.
     */
    protected throwInitError() {
        this.handleError('You need to init the ThoughtSpot SDK module first');
    }

    /**
     * Handles errors within the SDK
     * @param error The error message or object
     */
    protected handleError(error: string | Record<string, unknown>) {
        this.isError = true;
    }

    /**
     * Sends updated auth token to the iFrame to avoid user logout
     * @param _
     * @param responder
     */
    protected updateAuthToken = async (_: any, responder: any) => {
        const { autoLogin = false, authType } = this.embedConfig; // Set autoLogin default to false
        if (authType === AuthType.TrustedAuthTokenCookieless) {
            let authToken = '';
            try {
                authToken = await getAuthenticationToken(this.embedConfig);
                responder({
                    type: EmbedEvent.AuthExpire,
                    data: { authToken },
                });
            } catch (e) {
                logger.error(`${ERROR_MESSAGE.INVALID_TOKEN_ERROR} Error : ${e?.message}`);
            }
        } else if (autoLogin) {
            handleAuth();
        }
        notifyAuthFailure(AuthFailureType.EXPIRY);
    };    

    /**
     * Constructs the base URL string to load the ThoughtSpot app.
     * @param query
     */
    protected getEmbedBasePath(query: string): string {
        let queryString = (query.startsWith('?')) ? query : `?${query}`;
        if (this.shouldEncodeUrlQueryParams) {
            queryString = `?base64UrlEncodedFlags=${getEncodedQueryParamsString(
                queryString.substr(1),
            )}`;
        }
        const basePath = [this.thoughtSpotHost, this.thoughtSpotV2Base, queryString]
            .filter((x) => x.length > 0)
            .join('/');

        return `${basePath}#`;
    }

    /**
     * Common query params set for all the embed modes.
     * @param queryParams
     * @returns queryParams
     */
    protected getBaseQueryParams(
        queryParams: Record<any, any> = {},
    ) {
        let hostAppUrl = window?.location?.host || '';

        // The below check is needed because TS Cloud firewall, blocks
        // localhost/127.0.0.1 in any url param.
        if (hostAppUrl.includes('localhost') || hostAppUrl.includes('127.0.0.1')) {
            hostAppUrl = 'local-host';
        }
        queryParams[Param.EmbedApp] = true;
        queryParams[Param.HostAppUrl] = encodeURIComponent(hostAppUrl);
        queryParams[Param.ViewPortHeight] = window.innerHeight;
        queryParams[Param.ViewPortWidth] = window.innerWidth;
        queryParams[Param.Version] = version;
        queryParams[Param.AuthType] = this.embedConfig.authType;
        queryParams[Param.blockNonEmbedFullAppAccess] = this.embedConfig.blockNonEmbedFullAppAccess
            ?? true;
        if (this.embedConfig.disableLoginRedirect === true || this.embedConfig.autoLogin === true) {
            queryParams[Param.DisableLoginRedirect] = true;
        }
        if (this.embedConfig.authType === AuthType.EmbeddedSSO) {
            queryParams[Param.ForceSAMLAutoRedirect] = true;
        }
        if (this.embedConfig.authType === AuthType.TrustedAuthTokenCookieless) {
            queryParams[Param.cookieless] = true;
        }
        if (this.embedConfig.pendoTrackingKey) {
            queryParams[Param.PendoTrackingKey] = this.embedConfig.pendoTrackingKey;
        }
        if (this.embedConfig.numberFormatLocale) {
            queryParams[Param.NumberFormatLocale] = this.embedConfig.numberFormatLocale;
        }
        if (this.embedConfig.dateFormatLocale) {
            queryParams[Param.DateFormatLocale] = this.embedConfig.dateFormatLocale;
        }
        if (this.embedConfig.currencyFormat) {
            queryParams[Param.CurrencyFormat] = this.embedConfig.currencyFormat;
        }

        const {
            disabledActions,
            disabledActionReason,
            hiddenActions,
            visibleActions,
            hiddenTabs,
            visibleTabs,
            showAlerts,
            additionalFlags: additionalFlagsFromView,
            locale,
            customizations,
            contextMenuTrigger,
            linkOverride,
            insertInToSlide,
            disableRedirectionLinksInNewTab,
            overrideOrgId,
            enableFlipTooltipToContextMenu = false,
        } = this.viewConfig;

        const { additionalFlags: additionalFlagsFromInit } = this.embedConfig;

        const additionalFlags = {
            ...additionalFlagsFromInit,
            ...additionalFlagsFromView,
        };

        if (enableFlipTooltipToContextMenu) {
            queryParams[Param.EnableFlipTooltipToContextMenu] = enableFlipTooltipToContextMenu;
        }

        if (Array.isArray(visibleActions) && Array.isArray(hiddenActions)) {
            this.handleError('You cannot have both hidden actions and visible actions');
            return queryParams;
        }

        if (Array.isArray(visibleTabs) && Array.isArray(hiddenTabs)) {
            this.handleError('You cannot have both hidden Tabs and visible Tabs');
            return queryParams;
        }

        if (disabledActions?.length) {
            queryParams[Param.DisableActions] = disabledActions;
        }
        if (disabledActionReason) {
            queryParams[Param.DisableActionReason] = disabledActionReason;
        }
        queryParams[Param.HideActions] = [...this.defaultHiddenActions, ...(hiddenActions ?? [])];
        if (Array.isArray(visibleActions)) {
            queryParams[Param.VisibleActions] = visibleActions;
        }
        if (Array.isArray(hiddenTabs)) {
            queryParams[Param.HiddenTabs] = hiddenTabs;
        }
        if (Array.isArray(visibleTabs)) {
            queryParams[Param.VisibleTabs] = visibleTabs;
        }
        /**
         * Default behavior for context menu will be left-click
         *  from version 9.2.0.cl the user have an option to override context
         *  menu click
         */
        if (contextMenuTrigger === ContextMenuTriggerOptions.LEFT_CLICK) {
            queryParams[Param.ContextMenuTrigger] = true;
        } else if (contextMenuTrigger === ContextMenuTriggerOptions.RIGHT_CLICK) {
            queryParams[Param.ContextMenuTrigger] = false;
        }

        const spriteUrl = customizations?.iconSpriteUrl
            || this.embedConfig.customizations?.iconSpriteUrl;
        if (spriteUrl) {
            queryParams[Param.IconSpriteUrl] = spriteUrl.replace('https://', '');
        }

        if (showAlerts !== undefined) {
            queryParams[Param.ShowAlerts] = showAlerts;
        }
        if (locale !== undefined) {
            queryParams[Param.Locale] = locale;
        }

        if (linkOverride) {
            queryParams[Param.LinkOverride] = linkOverride;
        }
        if (insertInToSlide) {
            queryParams[Param.ShowInsertToSlide] = insertInToSlide;
        }
        if (disableRedirectionLinksInNewTab) {
            queryParams[Param.DisableRedirectionLinksInNewTab] = disableRedirectionLinksInNewTab;
        }
        if (overrideOrgId !== undefined) {
            queryParams[Param.OverrideOrgId] = overrideOrgId;
        }

        queryParams[Param.OverrideNativeConsole] = true;
        queryParams[Param.ClientLogLevel] = this.embedConfig.logLevel;

        if (isObject(additionalFlags) && !isEmpty(additionalFlags)) {
            Object.assign(queryParams, additionalFlags);
        }

        // Do not add any flags below this, as we want additional flags to
        // override other flags

        return queryParams;
    }

    /**
     * Constructs the base URL string to load v1 of the ThoughtSpot app.
     * This is used for embedding Liveboards, visualizations, and full application.
     * @param queryString The query string to append to the URL.
     * @param isAppEmbed A Boolean parameter to specify if you are embedding
     * the full application.
     */
    protected getV1EmbedBasePath(queryString: string): string {
        const queryParams = this.shouldEncodeUrlQueryParams
            ? `?base64UrlEncodedFlags=${getEncodedQueryParamsString(queryString)}`
            : `?${queryString}`;
        const host = this.thoughtSpotHost;
        const path = `${host}/${queryParams}#`;
        return path;
    }

    protected getEmbedParams() {
        const queryParams = this.getBaseQueryParams();
        return getQueryParamString(queryParams);
    }

    protected getRootIframeSrc() {
        const query = this.getEmbedParams();
        return this.getEmbedBasePath(query);
    }

    /**
     * Returns the ThoughtSpot hostname or IP address.
     */
    protected getThoughtSpotHost(): string {
        return this.thoughtSpotHost;
    }

    public getIframeSrc(): string {
        return '';
    }

    /**
     * Get the Post Url Params for THOUGHTSPOT from the current
     * host app URL.
     * THOUGHTSPOT URL params starts with a prefix "ts-"
     * @version SDK: 1.14.0 | ThoughtSpot: 8.4.0.cl, 8.4.1-sw
     */
    public getThoughtSpotPostUrlParams(
        additionalParams: { [key: string]: string | number } = {},
    ): string {
        const urlHash = window.location.hash;
        const queryParams = window.location.search;
        const postHashParams = urlHash.split('?');
        const postURLParams = postHashParams[postHashParams.length - 1];
        const queryParamsObj = new URLSearchParams(queryParams);
        const postURLParamsObj = new URLSearchParams(postURLParams);
        const params = new URLSearchParams();

        const addKeyValuePairCb = (value: string, key: string): void => {
            if (key.startsWith(THOUGHTSPOT_PARAM_PREFIX)) {
                params.append(key, value);
            }
        };
        queryParamsObj.forEach(addKeyValuePairCb);
        postURLParamsObj.forEach(addKeyValuePairCb);
        Object.entries(additionalParams).forEach(([k, v]) => params.append(k, v as string));

        let tsParams = params.toString();
        tsParams = tsParams ? `?${tsParams}` : '';

        return tsParams;
    }

    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.19.1 | ThoughtSpot: *
     */
    public destroy(): void {
        //no-op
    }

}
