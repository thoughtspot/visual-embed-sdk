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
import {
    TriggerPayload,
    TriggerResponse,
    UIPassthroughArrayResponse,
    UIPassthroughEvent,
    UIPassthroughRequest,
} from './hostEventClient/contracts';
import { logger } from '../utils/logger';
import { getAuthenticationToken } from '../authToken';
import { AnswerService } from '../utils/graphql/answerService/answerService';
import {
    getEncodedQueryParamsString,
    getCssDimension,
    getOffsetTop,
    embedEventStatus,
    setAttributes,
    getCustomisations,
    getRuntimeFilters,
    getDOMNode,
    getFilterQuery,
    getQueryParamString,
    getRuntimeParameters,
    setStyleProperties,
    removeStyleProperties,
    isUndefined,
} from '../utils';
import { getCustomActions } from '../utils/custom-actions';
import {
    getThoughtSpotHost,
    URL_MAX_LENGTH,
    DEFAULT_EMBED_WIDTH,
    DEFAULT_EMBED_HEIGHT,
    getV2BasePath,
} from '../config';
import {
    AuthType,
    DOMSelector,
    HostEvent,
    EmbedEvent,
    MessageCallback,
    Action,
    Param,
    EmbedConfig,
    MessageOptions,
    MessageCallbackObj,
    ContextMenuTriggerOptions,
    DefaultAppInitData,
    AllEmbedViewConfig as ViewConfig,
    EmbedErrorDetailsEvent,
    ErrorDetailsTypes,
    EmbedErrorCodes,
    MessagePayload,
    ContextType,
    ContextObject,
} from '../types';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';
import { processEventData, processAuthFailure } from '../utils/processData';
import pkgInfo from '../../package.json';
import {
    getAuthPromise, renderInQueue, handleAuth, notifyAuthFailure,
    getInitPromise,
    getIsInitCalled,
} from './base';
import { AuthFailureType } from '../auth';
import { getEmbedConfig } from './embedConfig';
import { ERROR_MESSAGE } from '../errors';
import { getPreauthInfo } from '../utils/sessionInfoService';
import { HostEventClient } from './hostEventClient/host-event-client';
import { getInterceptInitData, handleInterceptEvent, processApiInterceptResponse, processLegacyInterceptResponse } from '../api-intercept';
import { getHostEventsConfig } from '../utils';

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
const V1EventMap: Record<string, any> = {};

/**
 * Base class for embedding v2 experience
 * Note: the v2 version of ThoughtSpot Blink is built on the new stack:
 * React+GraphQL
 */
export class TsEmbed {
    /**
     * The DOM node which was inserted by the SDK to either
     * render the iframe or display an error message.
     * This is useful for removing the DOM node when the
     * embed instance is destroyed.
     */
    protected insertedDomEl: Node;

    /**
     * The DOM node where the ThoughtSpot app is to be embedded.
     */
    protected el: HTMLElement;

    /**
     * The key to store the embed instance in the DOM node
     */
    protected embedNodeKey = '__tsEmbed';

    protected isAppInitialized = false;

    /**
     * A reference to the iframe within which the ThoughtSpot app
     * will be rendered.
     */
    protected iFrame: HTMLIFrameElement;

    /**
     * Setter for the iframe element
     * @param {HTMLIFrameElement} iFrame HTMLIFrameElement
     */
    protected setIframeElement(iFrame: HTMLIFrameElement): void {
        this.iFrame = iFrame;
        this.hostEventClient.setIframeElement(iFrame);
    }

    protected viewConfig: ViewConfig & { visibleTabs?: string[], hiddenTabs?: string[], showAlerts?: boolean };

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
     * A map of event handlers for particular message types triggered
     * by the embedded app; multiple event handlers can be registered
     * against a particular message type.
     */
    private eventHandlerMap: Map<string, MessageCallbackObj[]>;

    /**
     * A flag that is set to true post render.
     */
    protected isRendered: boolean;

    /**
     * A flag to mark if an error has occurred.
     */
    private isError: boolean;

    /**
     * A flag that is set to true post preRender.
     */
    private isPreRendered: boolean;

    /**
     * Should we encode URL Query Params using base64 encoding which thoughtspot
     * will generate for embedding. This provides additional security to
     * thoughtspot clusters against Cross site scripting attacks.
     * @default false
     */
    private shouldEncodeUrlQueryParams = false;

    private defaultHiddenActions = [Action.ReportError];

    private resizeObserver: ResizeObserver;

    protected hostEventClient: HostEventClient;

    protected isReadyForRenderPromise;

    /**
     * Handler for fullscreen change events
     */
    private fullscreenChangeHandler: (() => void) | null = null;

    constructor(domSelector: DOMSelector, viewConfig?: ViewConfig) {
        this.el = getDOMNode(domSelector);
        this.eventHandlerMap = new Map();
        this.isError = false;
        this.viewConfig = {
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        };
        this.registerAppInit();
        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_EMBED_CREATE, {
            ...viewConfig,
        });
        const embedConfig = getEmbedConfig();
        this.embedConfig = embedConfig;

        this.hostEventClient = new HostEventClient(this.iFrame);
        this.isReadyForRenderPromise = getInitPromise().then(async () => {
            if (!embedConfig.authTriggerContainer && !embedConfig.useEventForSAMLPopup) {
                this.embedConfig.authTriggerContainer = domSelector;
            }
            this.thoughtSpotHost = getThoughtSpotHost(embedConfig);
            this.thoughtSpotV2Base = getV2BasePath(embedConfig);
            this.shouldEncodeUrlQueryParams = embedConfig.shouldEncodeUrlQueryParams;
        });
    }

    /**
     * Throws error encountered during initialization.
     */
    private throwInitError() {
        this.handleError({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.INIT_SDK_REQUIRED,
            code: EmbedErrorCodes.INIT_ERROR,
            error : ERROR_MESSAGE.INIT_SDK_REQUIRED,
        });
    }

    /**
     * Handles errors within the SDK
     * @param error The error message or object
     * @param errorDetails The error details
     */
    protected handleError(errorDetails: EmbedErrorDetailsEvent) {
        this.isError = true;
        this.executeCallbacks(EmbedEvent.Error, errorDetails);
        // Log error
        logger.error(errorDetails);
    }

    /**
     * Extracts the type field from the event payload
     * @param event The window message event
     */
    private getEventType(event: MessageEvent) {

        return event.data?.type || event.data?.__type;
    }

    /**
     * Extracts the port field from the event payload
     * @param event  The window message event
     * @returns
     */
    private getEventPort(event: MessageEvent) {
        if (event.ports.length && event.ports[0]) {
            return event.ports[0];
        }
        return null;
    }

    /**
     * Checks if preauth cache is enabled
     * from the view config and embed config
     * @returns boolean
     */
    private isPreAuthCacheEnabled() {
        // Disable preauth cache when:
        // 1. overrideOrgId is present since:
        //    - cached auth info would be for wrong org
        //    - info call response changes for each different overrideOrgId
        // 2. disablePreauthCache is explicitly set to true
        // 3. FullAppEmbed has primary navbar visible since:
        //    - primary navbar requires fresh auth state for navigation
        //    - cached auth may not reflect current user permissions
        const isDisabled = (
            this.viewConfig.overrideOrgId !== undefined
            || this.embedConfig.disablePreauthCache === true
            || this.isFullAppEmbedWithVisiblePrimaryNavbar()
        );
        return !isDisabled;
    }

    /**
     * Checks if current embed is FullAppEmbed with visible primary navbar
     * @returns boolean
     */
    private isFullAppEmbedWithVisiblePrimaryNavbar(): boolean {
        const appViewConfig = this.viewConfig as any;

        // Check if this is a FullAppEmbed (AppEmbed)
        // showPrimaryNavbar defaults to true if not explicitly set to false
        return (
            appViewConfig.embedComponentType === 'AppEmbed'
            && appViewConfig.showPrimaryNavbar === true
        );
    }

    /**
     * fix for ts7.sep.cl
     * will be removed for ts7.oct.cl
     * @param event
     * @param eventType
     * @hidden
     */
    private formatEventData(event: MessageEvent, eventType: string) {
        const eventData = {
            ...event.data,
            type: eventType,
        };
        if (!eventData.data) {
            eventData.data = event.data.payload;
        }
        return eventData;
    }

    private subscribedListeners: Record<string, any> = {};

    /**
     * Subscribe to network events (online/offline) that should
     * work regardless of auth status
     */
    private subscribeToNetworkEvents() {
        this.unsubscribeToNetworkEvents();

        const onlineEventListener = (e: Event) => {
            this.trigger(HostEvent.Reload);
        };
        window.addEventListener('online', onlineEventListener);

        const offlineEventListener = (e: Event) => {
            const errorDetails = {
                errorType: ErrorDetailsTypes.NETWORK,
                message: ERROR_MESSAGE.OFFLINE_WARNING,
                code: EmbedErrorCodes.NETWORK_ERROR,
                offlineWarning : ERROR_MESSAGE.OFFLINE_WARNING,
            };
            this.executeCallbacks(EmbedEvent.Error, errorDetails);
            logger.warn(errorDetails);
        };
        window.addEventListener('offline', offlineEventListener);

        this.subscribedListeners.online = onlineEventListener;
        this.subscribedListeners.offline = offlineEventListener;
    }

    private handleApiInterceptEvent({ eventData, eventPort }: { eventData: any, eventPort: MessagePort | void }) {
        const executeEvent = (_eventType: EmbedEvent, data: any) => {
            this.executeCallbacks(_eventType, data, eventPort);
        }
        const getUnsavedAnswerTml = async (props: { sessionId?: string, vizId?: string }) => {
            const response = await this.triggerUIPassThrough(UIPassthroughEvent.GetUnsavedAnswerTML, props);
            return response.filter((item) => item.value)?.[0]?.value;
        }
        handleInterceptEvent({ eventData, executeEvent, viewConfig: this.viewConfig, getUnsavedAnswerTml });
    }

    private messageEventListener = (event: MessageEvent<any>) => {
        const eventType = this.getEventType(event);
        const eventPort = this.getEventPort(event);
        const eventData = this.formatEventData(event, eventType);
        if (event.source === this.iFrame.contentWindow) {
            const processedEventData = processEventData(
                eventType,
                eventData,
                this.thoughtSpotHost,
                this.isPreRendered ? this.preRenderWrapper : this.el,
            );

            if (eventType === EmbedEvent.ApiIntercept) {
                this.handleApiInterceptEvent({ eventData, eventPort });
                return;
            }

            this.executeCallbacks(
                eventType,
                processedEventData,
                eventPort,
            );
        }
    };
    /**
     * Subscribe to message events that depend on successful iframe setup
     */
    private subscribeToMessageEvents() {
        this.unsubscribeToMessageEvents();

        window.addEventListener('message', this.messageEventListener);

        this.subscribedListeners.message = this.messageEventListener;
    }
   

    /**
     * Adds event listeners for both network and message events.
     * This maintains backward compatibility with the existing method.
     * Adds a global event listener to window for "message" events.
     * ThoughtSpot detects if a particular event is targeted to this
     * embed instance through an identifier contained in the payload,
     * and executes the registered callbacks accordingly.
     */
    private subscribeToEvents() {
        this.subscribeToNetworkEvents();
        this.subscribeToMessageEvents();
    }


    private unsubscribeToNetworkEvents() {
        if (this.subscribedListeners.online) {
            window.removeEventListener('online', this.subscribedListeners.online);
            delete this.subscribedListeners.online;
        }
        if (this.subscribedListeners.offline) {
            window.removeEventListener('offline', this.subscribedListeners.offline);
            delete this.subscribedListeners.offline;
        }
    }

    private unsubscribeToMessageEvents() {
        if (this.subscribedListeners.message) {
            window.removeEventListener('message', this.subscribedListeners.message);
            delete this.subscribedListeners.message;
        }
    }

    private unsubscribeToEvents() {
        Object.keys(this.subscribedListeners).forEach((key) => {
            window.removeEventListener(key, this.subscribedListeners[key]);
        });
    }

    protected async getAuthTokenForCookielessInit() {
        let authToken = '';
        if (this.embedConfig.authType !== AuthType.TrustedAuthTokenCookieless) return authToken;

        try {
            authToken = await getAuthenticationToken(this.embedConfig);
        } catch (e) {
            processAuthFailure(e, this.isPreRendered ? this.preRenderWrapper : this.el);
            throw e;
        }

        return authToken;
    }

    protected async getDefaultAppInitData(): Promise<DefaultAppInitData> {
        const authToken = await this.getAuthTokenForCookielessInit();
        const customActionsResult = getCustomActions([
            ...(this.viewConfig.customActions || []),
            ...(this.embedConfig.customActions || [])
        ]);
        if (customActionsResult.errors.length > 0) {
            this.handleError({
                    errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                    message: customActionsResult.errors,
                    code: EmbedErrorCodes.CUSTOM_ACTION_VALIDATION,
                    error : { type: EmbedErrorCodes.CUSTOM_ACTION_VALIDATION, message: customActionsResult.errors }
                });
        }
        const baseInitData = {
            customisations: getCustomisations(this.embedConfig, this.viewConfig),
            authToken,
            runtimeFilterParams: this.viewConfig.excludeRuntimeFiltersfromURL
                ? getRuntimeFilters(this.viewConfig.runtimeFilters)
                : null,
            runtimeParameterParams: this.viewConfig.excludeRuntimeParametersfromURL
                ? getRuntimeParameters(this.viewConfig.runtimeParameters || [])
                : null,
            hiddenHomepageModules: this.viewConfig.hiddenHomepageModules || [],
            reorderedHomepageModules: this.viewConfig.reorderedHomepageModules || [],
            hostConfig: this.embedConfig.hostConfig,
            hiddenHomeLeftNavItems: this.viewConfig?.hiddenHomeLeftNavItems
                ? this.viewConfig?.hiddenHomeLeftNavItems
                : [],
            customVariablesForThirdPartyTools:
                this.embedConfig.customVariablesForThirdPartyTools || {},
            hiddenListColumns: this.viewConfig.hiddenListColumns || [],
            customActions: customActionsResult.actions,
            embedExpiryInAuthToken: this.viewConfig.refreshAuthTokenOnNearExpiry,
            ...getInterceptInitData(this.viewConfig),
            ...getHostEventsConfig(this.viewConfig),
        };

        return baseInitData;
    }

    protected async getAppInitData() {
        return this.getDefaultAppInitData();
    }

    /**
     * Send Custom style as part of payload of APP_INIT
     * @param _
     * @param responder
     */
    private appInitCb = async (_: any, responder: any) => {
        try {
            const appInitData = await this.getAppInitData();
            this.isAppInitialized = true;
            responder({
                type: EmbedEvent.APP_INIT,
                data: appInitData,
            });
        } catch (e) {
            logger.error(`AppInit failed, Error : ${e?.message}`);
        }
    };

    /**
     * Helper method to refresh/update auth token for TrustedAuthTokenCookieless auth type
     * @param responder - Function to send response back
     * @param eventType - The embed event type to send
     * @param forceRefresh - Whether to force refresh the token
     * @returns Promise that resolves if token was refreshed, rejects otherwise
     */
    private async refreshAuthTokenForCookieless(
        responder: (data: any) => void,
        eventType: EmbedEvent,
        forceRefresh: boolean = false
    ): Promise<void> {
        const { authType, autoLogin } = this.embedConfig;
        const isAutoLoginTrue = autoLogin ?? (authType === AuthType.TrustedAuthTokenCookieless);
        
        if (isAutoLoginTrue && authType === AuthType.TrustedAuthTokenCookieless) {
            const authToken = await getAuthenticationToken(this.embedConfig, forceRefresh);
            responder({
                type: eventType,
                data: { authToken },
            });
        }
    }

    private handleAuthFailure = (error: Error) => {
        logger.error(`${ERROR_MESSAGE.INVALID_TOKEN_ERROR} Error : ${error?.message}`);
        processAuthFailure(error, this.isPreRendered ? this.preRenderWrapper : this.el);
    }

    /**
     * Refresh the auth token if the autoLogin is true and the authType is TrustedAuthTokenCookieless
     * @param _
     * @param responder
     */
    private tokenRefresh = async (_: MessagePayload, responder: (data: {type: EmbedEvent, data: {authToken: string}}) => void) => {
        try {
            await this.refreshAuthTokenForCookieless(responder, EmbedEvent.RefreshAuthToken, true);
        } catch (e) {
            this.handleAuthFailure(e);
        }
    }

    /**
     * Sends updated auth token to the iFrame to avoid user logout
     * @param _
     * @param responder
     */
    private updateAuthToken = async (_: MessagePayload, responder: any) => {
        const { authType, autoLogin: autoLoginConfig } = this.embedConfig;
        // Default autoLogin: true for cookieless if undefined/null, otherwise false
        const autoLogin = autoLoginConfig ?? (authType === AuthType.TrustedAuthTokenCookieless);
        
        try {
            await this.refreshAuthTokenForCookieless(responder, EmbedEvent.AuthExpire, false);
        } catch (e) {
            this.handleAuthFailure(e);
        }
        
        if (autoLogin && authType !== AuthType.TrustedAuthTokenCookieless) {
            handleAuth();
        }
        notifyAuthFailure(AuthFailureType.EXPIRY);
    };

    /**
     * Auto Login and send updated authToken to the iFrame to avoid user session logout
     * @param _
     * @param responder
     */
    private idleSessionTimeout = (_: any, responder: any) => {
        handleAuth().then(async () => {
            let authToken = '';
            try {
                authToken = await getAuthenticationToken(this.embedConfig);
                responder({
                    type: EmbedEvent.IdleSessionTimeout,
                    data: { authToken },
                });
            } catch (e) {
                this.handleAuthFailure(e);
            }
        }).catch((e) => {
            logger.error(`Auto Login failed, Error : ${e?.message}`);
        });
        notifyAuthFailure(AuthFailureType.IDLE_SESSION_TIMEOUT);
    };

    /**
     * Register APP_INIT event and sendback init payload
     */
    private registerAppInit = () => {
        this.on(EmbedEvent.APP_INIT, this.appInitCb, { start: false }, true);
        this.on(EmbedEvent.AuthExpire, this.updateAuthToken, { start: false }, true);
        this.on(EmbedEvent.IdleSessionTimeout, this.idleSessionTimeout, { start: false }, true);

        const embedListenerReadyHandler = this.createEmbedContainerHandler(EmbedEvent.EmbedListenerReady);
        this.on(EmbedEvent.EmbedListenerReady, embedListenerReadyHandler, { start: false }, true);
        
        const authInitHandler = this.createEmbedContainerHandler(EmbedEvent.AuthInit);
        this.on(EmbedEvent.AuthInit, authInitHandler, { start: false }, true);
        this.on(EmbedEvent.RefreshAuthToken, this.tokenRefresh, { start: false }, true);
    };

    /**
     * Constructs the base URL string to load the ThoughtSpot app.
     * @param query
     */
    protected getEmbedBasePath(query: string): string {
        let queryString = query.startsWith('?') ? query : `?${query}`;
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

    protected async getUpdateEmbedParamsObject() {
        let queryParams = this.getEmbedParamsObject();
        const appInitData = await this.getAppInitData();
        queryParams = { ...this.viewConfig, ...queryParams, ...appInitData };
        
        return queryParams;
    }

    /**
     * Common query params set for all the embed modes.
     * @param queryParams
     * @returns queryParams
     */
    protected getBaseQueryParams(queryParams: Record<any, any> = {}) {
        let hostAppUrl = window?.location?.host || '';

        // The below check is needed because TS Cloud firewall, blocks
        // localhost/127.0.0.1 in any url param.
        if (hostAppUrl.includes('localhost') || hostAppUrl.includes('127.0.0.1')) {
            hostAppUrl = 'local-host';
        }
        const blockNonEmbedFullAppAccess = this.embedConfig.blockNonEmbedFullAppAccess ?? true;
        queryParams[Param.EmbedApp] = true;
        queryParams[Param.HostAppUrl] = encodeURIComponent(hostAppUrl);
        queryParams[Param.ViewPortHeight] = window.innerHeight;
        queryParams[Param.ViewPortWidth] = window.innerWidth;
        queryParams[Param.Version] = version;
        queryParams[Param.AuthType] = this.embedConfig.authType;
        queryParams[Param.blockNonEmbedFullAppAccess] = blockNonEmbedFullAppAccess;
        queryParams[Param.AutoLogin] = this.embedConfig.autoLogin;
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
            exposeTranslationIDs,
            primaryAction,
        } = this.viewConfig;

        const { additionalFlags: additionalFlagsFromInit } = this.embedConfig;

        const additionalFlags = {
            ...additionalFlagsFromInit,
            ...additionalFlagsFromView,
        };

        if (Array.isArray(visibleActions) && Array.isArray(hiddenActions)) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.CONFLICTING_ACTIONS_CONFIG,
                code: EmbedErrorCodes.CONFLICTING_ACTIONS_CONFIG,
                error : ERROR_MESSAGE.CONFLICTING_ACTIONS_CONFIG,
            });
            return queryParams;
        }

        if (Array.isArray(visibleTabs) && Array.isArray(hiddenTabs)) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.CONFLICTING_TABS_CONFIG,
                code: EmbedErrorCodes.CONFLICTING_TABS_CONFIG,
                error : ERROR_MESSAGE.CONFLICTING_TABS_CONFIG,
            });
            return queryParams;
        }
        if (primaryAction) {
            queryParams[Param.PrimaryAction] = primaryAction;
        }

        if (disabledActions?.length) {
            queryParams[Param.DisableActions] = disabledActions;
        }
        if (disabledActionReason) {
            queryParams[Param.DisableActionReason] = disabledActionReason;
        }
        if (exposeTranslationIDs) {
            queryParams[Param.ExposeTranslationIDs] = exposeTranslationIDs;
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
            queryParams[Param.ContextMenuTrigger] = 'left';
        } else if (contextMenuTrigger === ContextMenuTriggerOptions.RIGHT_CLICK) {
            queryParams[Param.ContextMenuTrigger] = 'right';
        } else if (contextMenuTrigger === ContextMenuTriggerOptions.BOTH_CLICKS) {
            queryParams[Param.ContextMenuTrigger] = 'both';
        }

        const embedCustomizations = this.embedConfig.customizations;
        const spriteUrl = customizations?.iconSpriteUrl || embedCustomizations?.iconSpriteUrl;
        if (spriteUrl) {
            queryParams[Param.IconSpriteUrl] = spriteUrl.replace('https://', '');
        }

        const stringIDsUrl = customizations?.content?.stringIDsUrl
            || embedCustomizations?.content?.stringIDsUrl;
        if (stringIDsUrl) {
            queryParams[Param.StringIDsUrl] = stringIDsUrl;
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

        if (this.isPreAuthCacheEnabled()) {
            queryParams[Param.preAuthCache] = true;
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
        const queryParams = this.getEmbedParamsObject();
        return getQueryParamString(queryParams);
    }

    protected getEmbedParamsObject() {
        const params = this.getBaseQueryParams();
        return params;
    }

    protected getRootIframeSrc() {
        const query = this.getEmbedParams();
        return this.getEmbedBasePath(query);
    }

    protected createIframeEl(frameSrc: string): HTMLIFrameElement {
        const iFrame = document.createElement('iframe');

        iFrame.src = frameSrc;
        iFrame.id = TS_EMBED_ID;
        iFrame.setAttribute('data-ts-iframe', 'true');

        // according to screenfull.js documentation
        // allowFullscreen, webkitallowfullscreen and mozallowfullscreen must be
        // true
        iFrame.allowFullscreen = true;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        iFrame.webkitallowfullscreen = true;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        iFrame.mozallowfullscreen = true;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        iFrame.allow = 'clipboard-read; clipboard-write; fullscreen;';

        const frameParams = this.viewConfig.frameParams;
        const { height: frameHeight, width: frameWidth, ...restParams } = frameParams || {};
        const width = getCssDimension(frameWidth || DEFAULT_EMBED_WIDTH);
        const height = getCssDimension(frameHeight || DEFAULT_EMBED_HEIGHT);
        setAttributes(iFrame, restParams);

        iFrame.style.width = `${width}`;
        iFrame.style.height = `${height}`;
        // Set minimum height to the frame so that,
        // scaling down on the fullheight doesn't make it too small.
        iFrame.style.minHeight = `${height}`;
        iFrame.style.border = '0';
        iFrame.name = 'ThoughtSpot Embedded Analytics';
        return iFrame;
    }

    protected handleInsertionIntoDOM(child: string | Node): void {
        if (this.isPreRendered) {
            this.insertIntoDOMForPreRender(child);
        } else {
            this.insertIntoDOM(child);
        }
        if (this.insertedDomEl instanceof Node) {
            (this.insertedDomEl as any)[this.embedNodeKey] = this;
        }
    }

    /**
     * Renders the embedded ThoughtSpot app in an iframe and sets up
     * event listeners.
     * @param url - The URL of the embedded ThoughtSpot app.
     */
    protected async renderIFrame(url: string): Promise<any> {
        if (this.isError) {
            return null;
        }
        if (!this.thoughtSpotHost) {
            this.throwInitError();
        }
        if (url.length > URL_MAX_LENGTH) {
            // warn: The URL is too long
        }

        return renderInQueue((nextInQueue) => {
            const initTimestamp = Date.now();

            this.executeCallbacks(EmbedEvent.Init, {
                data: {
                    timestamp: initTimestamp,
                },
                type: EmbedEvent.Init,
            });

            uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_START);

            // Always subscribe to network events, regardless of auth status
            this.subscribeToNetworkEvents();

            return getAuthPromise()
                ?.then((isLoggedIn: boolean) => {
                    if (!isLoggedIn) {
                        this.handleInsertionIntoDOM(this.embedConfig.loginFailedMessage);
                        return;
                    }

                    this.setIframeElement(this.iFrame || this.createIframeEl(url));
                    this.iFrame.addEventListener('load', () => {
                        nextInQueue();
                        const loadTimestamp = Date.now();
                        this.executeCallbacks(EmbedEvent.Load, {
                            data: {
                                timestamp: loadTimestamp,
                            },
                            type: EmbedEvent.Load,
                        });
                        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_COMPLETE, {
                            elWidth: this.iFrame.clientWidth,
                            elHeight: this.iFrame.clientHeight,
                            timeTookToLoad: loadTimestamp - initTimestamp,
                        });
                        // Send info event  if preauth cache is enabled
                        if (this.isPreAuthCacheEnabled()) {
                            getPreauthInfo().then((data) => {
                                if (data?.info) {
                                    this.trigger(HostEvent.InfoSuccess, data);
                                }
                            });
                        }

                        // Setup fullscreen change handler after iframe is
                        // loaded and ready
                        this.setupFullscreenChangeHandler();
                    });
                    this.iFrame.addEventListener('error', () => {
                        nextInQueue();
                    });
                    this.handleInsertionIntoDOM(this.iFrame);
                    const prefetchIframe = document.querySelectorAll('.prefetchIframe');
                    if (prefetchIframe.length) {
                        prefetchIframe.forEach((el) => {
                            el.remove();
                        });
                    }
                    // Subscribe to message events only after successful
                    // auth and iframe setup
                    this.subscribeToMessageEvents();
                })
                .catch((error) => {
                    nextInQueue();
                    uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_FAILED, {
                        error: JSON.stringify(error),
                    });
                    this.handleInsertionIntoDOM(this.embedConfig.loginFailedMessage);
                    this.handleError({
                        errorType: ErrorDetailsTypes.API,
                        message: error.message || ERROR_MESSAGE.LOGIN_FAILED,
                        code: EmbedErrorCodes.LOGIN_FAILED,
                        error : error,
                    });
                });
        });
    }

    protected createPreRenderWrapper(): HTMLDivElement {
        const preRenderIds = this.getPreRenderIds();

        document.getElementById(preRenderIds.wrapper)?.remove();

        const preRenderWrapper = document.createElement('div');
        preRenderWrapper.id = preRenderIds.wrapper;
        const initialPreRenderWrapperStyle = {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
        };
        setStyleProperties(preRenderWrapper, initialPreRenderWrapperStyle);

        return preRenderWrapper;
    }

    protected preRenderWrapper: HTMLElement;

    protected preRenderChild: HTMLElement;

    protected connectPreRendered(): boolean {
        const preRenderIds = this.getPreRenderIds();
        const preRenderWrapperElement = document.getElementById(preRenderIds.wrapper);
        this.preRenderWrapper = this.preRenderWrapper || preRenderWrapperElement;

        this.preRenderChild = this.preRenderChild || document.getElementById(preRenderIds.child);

        if (this.preRenderWrapper && this.preRenderChild) {
            this.isPreRendered = true;
            if (this.preRenderChild instanceof HTMLIFrameElement) {
                this.setIframeElement(this.preRenderChild);
            }
            this.insertedDomEl = this.preRenderWrapper;
            this.isRendered = true;
        }

        return this.isPreRenderAvailable();
    }

    protected isPreRenderAvailable(): boolean {
        return (
            this.isRendered
            && this.isPreRendered
            && Boolean(this.preRenderWrapper && this.preRenderChild)
        );
    }

    protected createPreRenderChild(child: string | Node): HTMLElement {
        const preRenderIds = this.getPreRenderIds();

        document.getElementById(preRenderIds.child)?.remove();

        if (child instanceof HTMLElement) {
            child.id = preRenderIds.child;
            return child;
        }

        const divChildNode = document.createElement('div');
        setStyleProperties(divChildNode, { width: '100%', height: '100%' });
        divChildNode.id = preRenderIds.child;

        if (typeof child === 'string') {
            divChildNode.innerHTML = child;
        } else {
            divChildNode.appendChild(child);
        }

        return divChildNode;
    }

    protected insertIntoDOMForPreRender(child: string | Node): void {
        const preRenderChild = this.createPreRenderChild(child);
        const preRenderWrapper = this.createPreRenderWrapper();
        preRenderWrapper.appendChild(preRenderChild);

        this.preRenderChild = preRenderChild;
        this.preRenderWrapper = preRenderWrapper;

        if (preRenderChild instanceof HTMLIFrameElement) {
            this.setIframeElement(preRenderChild);
        }
        this.insertedDomEl = preRenderWrapper;

        if (this.showPreRenderByDefault) {
            this.showPreRender();
        } else {
            this.hidePreRender();
        }

        document.body.appendChild(preRenderWrapper);
    }

    private showPreRenderByDefault = false;

    protected insertIntoDOM(child: string | Node): void {
        if (this.viewConfig.insertAsSibling) {
            if (typeof child === 'string') {
                const div = document.createElement('div');
                div.innerHTML = child;
                div.id = TS_EMBED_ID;

                child = div;
            }
            if (this.el.nextElementSibling?.id === TS_EMBED_ID) {
                this.el.nextElementSibling.remove();
            }
            this.el.parentElement.insertBefore(child, this.el.nextSibling);
            this.insertedDomEl = child;
        } else if (typeof child === 'string') {
            this.el.innerHTML = child;
            this.insertedDomEl = this.el.children[0];
        } else {
            this.el.innerHTML = '';
            this.el.appendChild(child);
            this.insertedDomEl = child;
        }
    }

    /**
     * Sets the height of the iframe
     * @param height The height in pixels
     */
    protected setIFrameHeight(height: number | string): void {
        this.iFrame.style.height = getCssDimension(height);
    }

    /**
     * We can process the customer given payload before sending it to the embed port
     * Embed event handler -> responder -> createEmbedEventResponder -> send response
     * @param eventPort The event port for a specific MessageChannel
     * @param eventType The event type
     * @returns 
     */
    protected createEmbedEventResponder = (eventPort: MessagePort | void, eventType: EmbedEvent) => {

        const getPayloadToSend = (payload: any) => {
            if (eventType === EmbedEvent.OnBeforeGetVizDataIntercept) {
                return processLegacyInterceptResponse(payload);
            }
            if (eventType === EmbedEvent.ApiIntercept) {
                return processApiInterceptResponse(payload);
            }
            return payload;
        }   
        return (payload: any) => {
            const payloadToSend = getPayloadToSend(payload);
            this.triggerEventOnPort(eventPort, payloadToSend);
        }
    }

    /**
     * Executes all registered event handlers for a particular event type
     * @param eventType The event type
     * @param data The payload invoked with the event handler
     * @param eventPort The event Port for a specific MessageChannel
     */
    protected executeCallbacks(
        eventType: EmbedEvent,
        data: any,
        eventPort?: MessagePort | void,
    ): void {
        const eventHandlers = this.eventHandlerMap.get(eventType) || [];
        const allHandlers = this.eventHandlerMap.get(EmbedEvent.ALL) || [];
        const callbacks = [...eventHandlers, ...allHandlers];
        const dataStatus = data?.status || embedEventStatus.END;
        callbacks.forEach((callbackObj) => {
            if (
                // When start status is true it trigger only start releated
                // payload
                (callbackObj.options.start && dataStatus === embedEventStatus.START)
                // When start status is false it trigger only end releated
                // payload
                || (!callbackObj.options.start && dataStatus === embedEventStatus.END)
            ) {
                const responder = this.createEmbedEventResponder(eventPort, eventType);
                callbackObj.callback(data, responder);
            }
        });
    }

    /**
     * Returns the ThoughtSpot hostname or IP address.
     */
    protected getThoughtSpotHost(): string {
        return this.thoughtSpotHost;
    }

    /**
     * Gets the v1 event type (if applicable) for the EmbedEvent type
     * @param eventType The v2 event type
     * @returns The corresponding v1 event type if one exists
     * or else the v2 event type itself
     */
    protected getCompatibleEventType(eventType: EmbedEvent): EmbedEvent {
        return V1EventMap[eventType] || eventType;
    }

    /**
     * Calculates the iframe center for the current visible viewPort
     * of iframe using Scroll position of Host App, offsetTop for iframe
     * in Host app. ViewPort height of the tab.
     * @returns iframe Center in visible viewport,
     *  Iframe height,
     *  View port height.
     */
    protected getIframeCenter() {
        const offsetTopClient = getOffsetTop(this.iFrame);
        const scrollTopClient = window.scrollY;
        const viewPortHeight = window.innerHeight;
        const iframeHeight = this.iFrame.offsetHeight;
        const iframeScrolled = scrollTopClient - offsetTopClient;
        let iframeVisibleViewPort;
        let iframeOffset;

        if (iframeScrolled < 0) {
            iframeVisibleViewPort = viewPortHeight - (offsetTopClient - scrollTopClient);
            iframeVisibleViewPort = Math.min(iframeHeight, iframeVisibleViewPort);
            iframeOffset = 0;
        } else {
            iframeVisibleViewPort = Math.min(iframeHeight - iframeScrolled, viewPortHeight);
            iframeOffset = iframeScrolled;
        }
        const iframeCenter = iframeOffset + iframeVisibleViewPort / 2;
        return {
            iframeCenter,
            iframeScrolled,
            iframeHeight,
            viewPortHeight,
            iframeVisibleViewPort,
        };
    }

    /**
     * Registers an event listener to trigger an alert when the ThoughtSpot app
     * sends an event of a particular message type to the host application.
     * @param messageType The message type
     * @param callback A callback as a function
     * @param options The message options
     * @param isSelf
     * @param isRegisteredBySDK
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Error, (data) => {
     *   console.error(data);
     * });
     * ```
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Save, (data) => {
     *   console.log("Answer save clicked", data);
     * }, {
     *   start: true // This will trigger the callback on start of save
     * });
     * ```
     */
    public on(
        messageType: EmbedEvent,
        callback: MessageCallback,
        options: MessageOptions = { start: false },
        isRegisteredBySDK = false,
    ): typeof TsEmbed.prototype {
        uploadMixpanelEvent(`${MIXPANEL_EVENT.VISUAL_SDK_ON}-${messageType}`, {
            isRegisteredBySDK,
        });
        if (this.isRendered) {
            logger.warn('Please register event handlers before calling render');
        }
        const callbacks = this.eventHandlerMap.get(messageType) || [];
        callbacks.push({ options, callback });
        this.eventHandlerMap.set(messageType, callbacks);
        return this;
    }

    /**
     * Removes an event listener for a particular event type.
     * @param messageType The message type
     * @param callback The callback to remove
     * @example
     * ```js
     * const errorHandler = (data) => { console.error(data); };
     * tsEmbed.on(EmbedEvent.Error, errorHandler);
     * tsEmbed.off(EmbedEvent.Error, errorHandler);
     * ```
     */
    public off(messageType: EmbedEvent, callback: MessageCallback): typeof TsEmbed.prototype {
        const callbacks = this.eventHandlerMap.get(messageType) || [];
        const index = callbacks.findIndex((cb) => cb.callback === callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
        return this;
    }

    /**
     * Triggers an event on specific Port registered against
     * for the EmbedEvent
     * @param eventType The message type
     * @param data The payload to send
     * @param eventPort
     * @param payload
     */
    private triggerEventOnPort(eventPort: MessagePort | void, payload: any) {
        if (eventPort) {
            try {
                eventPort.postMessage({
                    type: payload.type,
                    data: payload.data,
                });
            } catch (e) {
                eventPort.postMessage({ error: e });
                logger.log(e);
            }
        } else {
            logger.log('Event Port is not defined');
        }
    }

    /**
    * @hidden
    * Internal state to track if the embed container is loaded.
    * This is used to trigger events after the embed container is loaded.
    */
    public isEmbedContainerLoaded = false;

    /**
     * @hidden
     * Internal state to track the callbacks to be executed after the embed container 
     * is loaded.
     * This is used to trigger events after the embed container is loaded.
     */
    private embedContainerReadyCallbacks: Array<() => void> = [];

    protected getPreRenderObj<T extends TsEmbed>(): T {
        const embedObj = (this.insertedDomEl as any)?.[this.embedNodeKey] as T;
        if (embedObj === (this as any)) {
            logger.info('embedObj is same as this');
        }
        return embedObj;
    }

    private checkEmbedContainerLoaded() {
        if (this.isEmbedContainerLoaded) return true;

        const preRenderObj = this.getPreRenderObj<TsEmbed>();
        if (preRenderObj && preRenderObj.isEmbedContainerLoaded) {
            this.isEmbedContainerLoaded = true;
        }

        return this.isEmbedContainerLoaded;
    }
    private executeEmbedContainerReadyCallbacks() {
        logger.debug('executePendingEvents', this.embedContainerReadyCallbacks);
        this.embedContainerReadyCallbacks.forEach((callback) => {
            callback?.();
        });
        this.embedContainerReadyCallbacks = [];
    }

    /**
     * Executes a callback after the embed container is loaded.
     * @param callback The callback to execute
     */
    protected executeAfterEmbedContainerLoaded(callback: () => void) {
        if (this.checkEmbedContainerLoaded()) {
            callback?.();
        } else {
            logger.debug('pushing callback to embedContainerReadyCallbacks', callback);
            this.embedContainerReadyCallbacks.push(callback);
        }
    }

    protected createEmbedContainerHandler = (source: EmbedEvent.AuthInit | EmbedEvent.EmbedListenerReady) => () => {
        const processEmbedContainerReady = () => {
            logger.debug('processEmbedContainerReady');
            this.isEmbedContainerLoaded = true;
            this.executeEmbedContainerReadyCallbacks();
        }
        if (source === EmbedEvent.AuthInit) {
            const AUTH_INIT_FALLBACK_DELAY = 1000;
            // Wait for 1 second to ensure the embed container is loaded
            // This is a workaround to ensure the embed container is loaded
            // this is needed until all clusters have EmbedListenerReady event
            setTimeout(processEmbedContainerReady, AUTH_INIT_FALLBACK_DELAY);
        } else if (source === EmbedEvent.EmbedListenerReady) {
            processEmbedContainerReady();
        }
    }

    /**
     * Triggers an event to the embedded app
     * @param {HostEvent} messageType The event type
     * @param {any} data The payload to send with the message
     * @returns A promise that resolves with the response from the embedded app
     */
    public async trigger<HostEventT extends HostEvent, PayloadT, ContextT extends ContextType>(
        messageType: HostEventT,
        data: TriggerPayload<PayloadT, HostEventT> = {} as any,
        context?: ContextT,
    ): Promise<TriggerResponse<PayloadT, HostEventT, ContextT>> {
        uploadMixpanelEvent(`${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${messageType}`);

        if (!this.isRendered) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.RENDER_BEFORE_EVENTS_REQUIRED,
                code: EmbedErrorCodes.RENDER_NOT_CALLED,
                error: ERROR_MESSAGE.RENDER_BEFORE_EVENTS_REQUIRED,
            });
            return null;
        }

        if (!messageType) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.HOST_EVENT_TYPE_UNDEFINED,
                code: EmbedErrorCodes.HOST_EVENT_TYPE_UNDEFINED,
                error: ERROR_MESSAGE.HOST_EVENT_TYPE_UNDEFINED,
            });
            return null;
        }

        // Check if iframe exists before triggering - 
        // this prevents the error when auth fails
        if (!this.iFrame) {
            logger.debug(
                `Cannot trigger ${messageType} - iframe not available (likely due to auth failure)`,
            );
            return null;
        }

        // send an empty object, this is needed for liveboard default handlers
        return this.hostEventClient.triggerHostEvent(messageType, data, context);
    }

    /**
     * Triggers an event to the embedded app, skipping the UI flow.
     * @param {UIPassthroughEvent} apiName - The name of the API to be triggered.
     * @param {UIPassthroughRequest} parameters - The parameters to be passed to the API.
     * @returns {Promise<UIPassthroughRequest>} - A promise that resolves with the response
     * from the embedded app.
     */
    public async triggerUIPassThrough<UIPassthroughEventT extends UIPassthroughEvent>(
        apiName: UIPassthroughEventT,
        parameters: UIPassthroughRequest<UIPassthroughEventT>,
    ): Promise<UIPassthroughArrayResponse<UIPassthroughEventT>> {
        const response = this.hostEventClient.triggerUIPassthroughApi(apiName, parameters);
        return response;
    }

    /**
     * Marks the ThoughtSpot object to have been rendered
     * Needs to be overridden by subclasses to do the actual
     * rendering of the iframe.
     * @param args
     */
    public async render(): Promise<TsEmbed> {
        if (!getIsInitCalled()) {
            logger.error(ERROR_MESSAGE.RENDER_CALLED_BEFORE_INIT);
        }
        await this.isReadyForRenderPromise;
        this.isRendered = true;

        return this;
    }

    public getIframeSrc(): string {
        return '';
    }

    protected handleRenderForPrerender() {
        return this.render();
    }

    /**
     * Get the current context of the embedded TS component.
     * @returns The current context object containing the page type and object ids.
     * @version SDK: 1.45.2 | ThoughtSpot: 26.3.0.cl
     */
    public async getCurrentContext(): Promise<ContextObject> {
        return new Promise((resolve) => {
            this.executeAfterEmbedContainerLoaded(async () => {
                const context = await this.trigger(HostEvent.GetPageContext, {});
                resolve(context);
            });
        });
    }

    /**
     * Creates the preRender shell
     * @param showPreRenderByDefault - Show the preRender after render, hidden by default
     */

    public async preRender(showPreRenderByDefault = false, replaceExistingPreRender = false): Promise<TsEmbed> {
        if (!this.viewConfig.preRenderId) {
            logger.error(ERROR_MESSAGE.PRERENDER_ID_MISSING);
            return this;
        }
        this.isPreRendered = true;
        this.showPreRenderByDefault = showPreRenderByDefault;

        const isAlreadyRendered = this.connectPreRendered();
        if (isAlreadyRendered && !replaceExistingPreRender) {
            return this;
        }

        return this.handleRenderForPrerender();
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
        try {
            this.removeFullscreenChangeHandler();
            this.unsubscribeToEvents();
            if (!getEmbedConfig().waitForCleanupOnDestroy) {
                this.trigger(HostEvent.DestroyEmbed)
                this.insertedDomEl?.parentNode?.removeChild(this.insertedDomEl);
            } else {
                const cleanupTimeout = getEmbedConfig().cleanupTimeout;
                Promise.race([
                    this.trigger(HostEvent.DestroyEmbed),
                    new Promise((resolve) => setTimeout(resolve, cleanupTimeout)),
                ]).then(() => {
                    this.insertedDomEl?.parentNode?.removeChild(this.insertedDomEl);
                }).catch((e) => {
                    logger.log('Error destroying TS Embed', e);
                });
            }
        } catch (e) {
            logger.log('Error destroying TS Embed', e);
        }
    }

    public getUnderlyingFrameElement(): HTMLIFrameElement {
        return this.iFrame;
    }

    /**
     * Prerenders a generic instance of the TS component.
     * This means without the path but with the flags already applied.
     * This is useful for prerendering the component in the background.
     * @version SDK: 1.22.0
     * @returns
     */
    public async prerenderGeneric(): Promise<any> {
        if (!getIsInitCalled()) {
            logger.error(ERROR_MESSAGE.RENDER_CALLED_BEFORE_INIT);
        }
        await this.isReadyForRenderPromise;

        const prerenderFrameSrc = this.getRootIframeSrc();
        this.isRendered = true;
        return this.renderIFrame(prerenderFrameSrc);
    }

    protected beforePrerenderVisible(): void {
        // Override in subclass
    }

    private validatePreRenderViewConfig = (viewConfig: ViewConfig) => {
        const preRenderAllowedKeys = ['preRenderId', 'vizId', 'liveboardId'];
        const preRenderedObject = (this.insertedDomEl as any)?.[this.embedNodeKey] as TsEmbed;
        if (!preRenderedObject) return;
        if (viewConfig.preRenderId) {
            const allOtherKeys = Object.keys(viewConfig).filter(
                (key) => !preRenderAllowedKeys.includes(key) && !key.startsWith('on'),
            );

            allOtherKeys.forEach((key: keyof ViewConfig) => {
                if (
                    !isUndefined(viewConfig[key])
                    && !isEqual(viewConfig[key], preRenderedObject.viewConfig[key])
                ) {
                    logger.warn(
                        `${viewConfig.embedComponentType || 'Component'} was pre-rendered with `
                        + `"${key}" as "${JSON.stringify(preRenderedObject.viewConfig[key])}" `
                        + `but a different value "${JSON.stringify(viewConfig[key])}" `
                        + 'was passed to the Embed component. '
                        + 'The new value provided is ignored, the value provided during '
                        + 'preRender is used.',
                    );
                }
            });
        }
    };

    /**
     * Displays the PreRender component.
     * If the component is not preRendered, it attempts to create and render it.
     * Also, synchronizes the style of the PreRender component with the embedding
     * element.
     */
    public async showPreRender(): Promise<TsEmbed> {
        if (!this.viewConfig.preRenderId) {
            logger.error(ERROR_MESSAGE.PRERENDER_ID_MISSING);
            return this;
        }
        if (!this.isPreRenderAvailable()) {
            const isAvailable = this.connectPreRendered();

            if (!isAvailable) {
                // if the Embed component is not preRendered , Render it now and
                return this.preRender(true);
            }
            this.validatePreRenderViewConfig(this.viewConfig);
            logger.debug('triggering UpdateEmbedParams', this.viewConfig);
            this.executeAfterEmbedContainerLoaded(async () => {
                try {
                    const params = await this.getUpdateEmbedParamsObject();
                    this.trigger(HostEvent.UpdateEmbedParams, params);
                } catch (error) {
                    logger.error(ERROR_MESSAGE.UPDATE_PARAMS_FAILED, error);
                    this.handleError({
                        errorType: ErrorDetailsTypes.API,
                        message: error?.message || ERROR_MESSAGE.UPDATE_PARAMS_FAILED,
                        code: EmbedErrorCodes.UPDATE_PARAMS_FAILED,
                        error: error?.message || error,
                    });
                }
            });
        }

        this.beforePrerenderVisible();

        if (this.el) {
            this.syncPreRenderStyle();
            if (!this.viewConfig.doNotTrackPreRenderSize) {
                this.resizeObserver = new ResizeObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.contentRect && entry.target === this.el) {
                            setStyleProperties(this.preRenderWrapper, {
                                width: `${entry.contentRect.width}px`,
                                height: `${entry.contentRect.height}px`,
                            });
                        }
                    });
                });
                this.resizeObserver.observe(this.el);
            }
        }

        removeStyleProperties(this.preRenderWrapper, ['z-index', 'opacity', 'pointer-events', 'overflow']);

        this.subscribeToEvents();

        // Setup fullscreen change handler for prerendered components
        if (this.iFrame) {
            this.setupFullscreenChangeHandler();
        }

        return this;
    }

    /**
     * Synchronizes the style properties of the PreRender component with the embedding
     * element. This function adjusts the position, width, and height of the PreRender
     * component
     * to match the dimensions and position of the embedding element.
     * @throws {Error} Throws an error if the embedding element (passed as domSelector)
     * is not defined or not found.
     */
    public syncPreRenderStyle(): void {
        if (!this.isPreRenderAvailable() || !this.el) {
            logger.error(ERROR_MESSAGE.SYNC_STYLE_CALLED_BEFORE_RENDER);
            return;
        }
        const elBoundingClient = this.el.getBoundingClientRect();

        setStyleProperties(this.preRenderWrapper, {
            top: `${elBoundingClient.y + window.scrollY}px`,
            left: `${elBoundingClient.x + window.scrollX}px`,
            width: `${elBoundingClient.width}px`,
            height: `${elBoundingClient.height}px`,
        });
    }

    /**
     * Hides the PreRender component if it is available.
     * If the component is not preRendered, it issues a warning.
     */
    public hidePreRender(): void {
        if (!this.isPreRenderAvailable()) {
            // if the embed component is not preRendered , nothing to hide
            logger.warn('PreRender should be called before hiding it using hidePreRender.');
            return;
        }
        const preRenderHideStyles = {
            opacity: '0',
            pointerEvents: 'none',
            zIndex: '-1000',
            position: 'absolute',
            top: '0',
            left: '0',
            overflow: 'hidden',
        };
        setStyleProperties(this.preRenderWrapper, preRenderHideStyles);

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        this.unsubscribeToEvents();
    }

    /**
     * Retrieves unique HTML element IDs for PreRender-related elements.
     * These IDs are constructed based on the provided 'preRenderId' from 'viewConfig'.
     * @returns {object} An object containing the IDs for the PreRender elements.
     * @property {string} wrapper - The HTML element ID for the PreRender wrapper.
     * @property {string} child - The HTML element ID for the PreRender child.
     */
    public getPreRenderIds() {
        return {
            wrapper: `tsEmbed-pre-render-wrapper-${this.viewConfig.preRenderId}`,
            child: `tsEmbed-pre-render-child-${this.viewConfig.preRenderId}`,
        };
    }

    /**
     * Returns the answerService which can be used to make arbitrary graphql calls on top
     * session.
     * @param vizId [Optional] to get for a specific viz in case of a Liveboard.
     * @version SDK: 1.25.0 / ThoughtSpot 9.10.0
     */
    public async getAnswerService(vizId?: string): Promise<AnswerService> {
        const { session } = await this.trigger(HostEvent.GetAnswerSession, vizId ? { vizId } : {});
        return new AnswerService(session, null, this.embedConfig.thoughtSpotHost);
    }

    /**
     * Set up fullscreen change detection to automatically trigger ExitPresentMode
     * when user exits fullscreen mode
     */
    private setupFullscreenChangeHandler() {
        const embedConfig = getEmbedConfig();
        const disableFullscreenPresentation = embedConfig?.disableFullscreenPresentation ?? true;

        if (disableFullscreenPresentation) {
            return;
        }

        if (this.fullscreenChangeHandler) {
            document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
        }

        this.fullscreenChangeHandler = () => {
            const isFullscreen = !!document.fullscreenElement;
            if (!isFullscreen) {
                logger.info('Exited fullscreen mode - triggering ExitPresentMode');
                // Only trigger if iframe is available and contentWindow is
                // accessible
                if (this.iFrame && this.iFrame.contentWindow) {
                    this.trigger(HostEvent.ExitPresentMode);
                } else {
                    logger.debug('Skipping ExitPresentMode - iframe contentWindow not available');
                }
            }
        };

        document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    }

    /**
     * Remove fullscreen change handler
     */
    private removeFullscreenChangeHandler() {
        if (this.fullscreenChangeHandler) {
            document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
            this.fullscreenChangeHandler = null;
        }
    }
}

/**
 * Base class for embedding v1 experience
 * Note: The v1 version of ThoughtSpot Blink works on the AngularJS stack
 * which is currently under migration to v2
 * @inheritdoc
 */
export class V1Embed extends TsEmbed {
    protected viewConfig: ViewConfig;

    constructor(domSelector: DOMSelector, viewConfig: ViewConfig) {
        super(domSelector, viewConfig);
        this.viewConfig = {
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        };
    }

    /**
     * Render the app in an iframe and set up event handlers
     * @param iframeSrc
     */
    protected renderV1Embed(iframeSrc: string): Promise<any> {
        return this.renderIFrame(iframeSrc);
    }

    protected getRootIframeSrc(): string {
        const queryParams = this.getEmbedParams();
        let queryString = queryParams;

        if (!this.viewConfig.excludeRuntimeParametersfromURL) {
            const runtimeParameters = this.viewConfig.runtimeParameters;
            const parameterQuery = getRuntimeParameters(runtimeParameters || []);
            queryString = [parameterQuery, queryParams].filter(Boolean).join('&');
        }

        if (!this.viewConfig.excludeRuntimeFiltersfromURL) {
            const runtimeFilters = this.viewConfig.runtimeFilters;

            const filterQuery = getFilterQuery(runtimeFilters || []);
            queryString = [filterQuery, queryString].filter(Boolean).join('&');
        }
        return this.viewConfig.enableV2Shell_experimental
            ? this.getEmbedBasePath(queryString)
            : this.getV1EmbedBasePath(queryString);
    }

    /**
     * @inheritdoc
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Error, (data) => {
     *   console.error(data);
     * });
     * ```
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Save, (data) => {
     *   console.log("Answer save clicked", data);
     * }, {
     *   start: true // This will trigger the callback on start of save
     * });
     * ```
     */
    public on(
        messageType: EmbedEvent,
        callback: MessageCallback,
        options: MessageOptions = { start: false },
    ): typeof TsEmbed.prototype {
        const eventType = this.getCompatibleEventType(messageType);
        return super.on(eventType, callback, options);
    }

    /**
     * Only for testing purposes.
     * @hidden
     */

    public test__executeCallbacks = this.executeCallbacks;
}
