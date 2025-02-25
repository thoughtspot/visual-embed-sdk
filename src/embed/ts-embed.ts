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
    MessagePayload,
    MessageCallbackObj,
    ViewConfig,
    FrameParams,
    ContextMenuTriggerOptions,
    RuntimeFilter,
    DefaultAppInitData,
} from '../types';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';
import { processEventData, processAuthFailure } from '../utils/processData';
import { processTrigger } from '../utils/processTrigger';
import pkgInfo from '../../package.json';
import {
    getAuthPromise, renderInQueue, handleAuth, notifyAuthFailure,
} from './base';
import { AuthFailureType } from '../auth';
import { getEmbedConfig } from './embedConfig';
import { ERROR_MESSAGE } from '../errors';
import { getPreauthInfo } from '../utils/sessionInfoService';
import { HostEventClient } from './hostEventClient/host-event-client';

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

    constructor(domSelector: DOMSelector, viewConfig?: ViewConfig) {
        this.el = getDOMNode(domSelector);
        // TODO: handle error
        this.embedConfig = getEmbedConfig();
        if (!this.embedConfig.authTriggerContainer && !this.embedConfig.useEventForSAMLPopup) {
            this.embedConfig.authTriggerContainer = domSelector;
        }
        this.thoughtSpotHost = getThoughtSpotHost(this.embedConfig);
        this.thoughtSpotV2Base = getV2BasePath(this.embedConfig);
        this.eventHandlerMap = new Map();
        this.isError = false;
        this.viewConfig = {
            excludeRuntimeFiltersfromURL: false,
            excludeRuntimeParametersfromURL: false,
            ...viewConfig,
        };
        this.shouldEncodeUrlQueryParams = this.embedConfig.shouldEncodeUrlQueryParams;
        this.registerAppInit();
        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_EMBED_CREATE, {
            ...viewConfig,
        });
        this.hostEventClient = new HostEventClient(this.iFrame);
    }

    /**
     * Throws error encountered during initialization.
     */
    private throwInitError() {
        this.handleError('You need to init the ThoughtSpot SDK module first');
    }

    /**
     * Handles errors within the SDK
     * @param error The error message or object
     */
    protected handleError(error: string | Record<string, unknown>) {
        this.isError = true;
        this.executeCallbacks(EmbedEvent.Error, {
            error,
        });
        // Log error
        logger.error(error);
    }

    /**
     * Extracts the type field from the event payload
     * @param event The window message event
     */
    private getEventType(event: MessageEvent) {
        // eslint-disable-next-line no-underscore-dangle
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
        const isDisabled = (
            this.viewConfig.overrideOrgId !== undefined
            || this.embedConfig.disablePreauthCache === true
        );
        return !isDisabled;
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
     * Adds a global event listener to window for "message" events.
     * ThoughtSpot detects if a particular event is targeted to this
     * embed instance through an identifier contained in the payload,
     * and executes the registered callbacks accordingly.
     */
    private subscribeToEvents() {
        this.unsubscribeToEvents();
        const messageEventListener = (event: MessageEvent<any>) => {
            const eventType = this.getEventType(event);
            const eventPort = this.getEventPort(event);
            const eventData = this.formatEventData(event, eventType);
            if (event.source === this.iFrame.contentWindow) {
                this.executeCallbacks(
                    eventType,
                    processEventData(
                        eventType,
                        eventData,
                        this.thoughtSpotHost,
                        this.isPreRendered ? this.preRenderWrapper : this.el,
                    ),
                    eventPort,
                );
            }
        };
        window.addEventListener('message', messageEventListener);

        const onlineEventListener = (e: Event) => {
            this.trigger(HostEvent.Reload);
        };
        window.addEventListener('online', onlineEventListener);

        const offlineEventListener = (e: Event) => {
            const offlineWarning = 'Network not Detected. Embed is offline. Please reconnect and refresh';
            this.executeCallbacks(EmbedEvent.Error, {
                offlineWarning,
            });
            logger.warn(offlineWarning);
        };
        window.addEventListener('offline', offlineEventListener);

        this.subscribedListeners = {
            message: messageEventListener,
            online: onlineEventListener,
            offline: offlineEventListener,
        };
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
        return {
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
        };
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
     * Sends updated auth token to the iFrame to avoid user logout
     * @param _
     * @param responder
     */
    private updateAuthToken = async (_: any, responder: any) => {
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
                processAuthFailure(e, this.isPreRendered ? this.preRenderWrapper : this.el);
            }
        } else if (autoLogin) {
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
                logger.error(`${ERROR_MESSAGE.INVALID_TOKEN_ERROR} Error : ${e?.message}`);
                processAuthFailure(e, this.isPreRendered ? this.preRenderWrapper : this.el);
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
        } = this.viewConfig;

        const { additionalFlags: additionalFlagsFromInit } = this.embedConfig;

        const additionalFlags = {
            ...additionalFlagsFromInit,
            ...additionalFlagsFromView,
        };

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
        const queryParams = this.getBaseQueryParams();
        return getQueryParamString(queryParams);
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
                    this.subscribeToEvents();
                })
                .catch((error) => {
                    nextInQueue();
                    uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_FAILED, {
                        error: JSON.stringify(error),
                    });
                    this.handleInsertionIntoDOM(this.embedConfig.loginFailedMessage);
                    this.handleError(error);
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
                // eslint-disable-next-line no-param-reassign
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
                callbackObj.callback(data, (payload) => {
                    this.triggerEventOnPort(eventPort, payload);
                });
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
     * Triggers an event to the embedded app
     * @param {HostEvent} messageType The event type
     * @param {any} data The payload to send with the message
     * @returns A promise that resolves with the response from the embedded app
     */
    public async trigger<HostEventT extends HostEvent, PayloadT>(
        messageType: HostEventT,
        data: TriggerPayload<PayloadT, HostEventT> = {} as any,
    ): Promise<TriggerResponse<PayloadT, HostEventT>> {
        uploadMixpanelEvent(`${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${messageType}`);

        if (!this.isRendered) {
            this.handleError('Please call render before triggering events');
            return null;
        }

        if (!messageType) {
            this.handleError('Host event type is undefined');
            return null;
        }
        // send an empty object, this is needed for liveboard default handlers
        return this.hostEventClient.triggerHostEvent(messageType, data);
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
        this.isRendered = true;

        return this;
    }

    public getIframeSrc(): string {
        return '';
    }

    protected handleRenderForPrerender() {
        this.render();
    }

    /**
     * Creates the preRender shell
     * @param showPreRenderByDefault - Show the preRender after render, hidden by default
     */
    public preRender(showPreRenderByDefault = false): TsEmbed {
        if (!this.viewConfig.preRenderId) {
            logger.error(ERROR_MESSAGE.PRERENDER_ID_MISSING);
            return this;
        }
        this.isPreRendered = true;
        this.showPreRenderByDefault = showPreRenderByDefault;
        this.handleRenderForPrerender();
        return this;
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
            this.insertedDomEl?.parentNode.removeChild(this.insertedDomEl);
            this.unsubscribeToEvents();
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
    public showPreRender(): void {
        if (!this.viewConfig.preRenderId) {
            logger.error(ERROR_MESSAGE.PRERENDER_ID_MISSING);
            return;
        }
        if (!this.isPreRenderAvailable()) {
            const isAvailable = this.connectPreRendered();

            if (!isAvailable) {
                // if the Embed component is not preRendered , Render it now and
                this.preRender(true);
                return;
            }
            this.validatePreRenderViewConfig(this.viewConfig);
        }

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

        this.beforePrerenderVisible();

        removeStyleProperties(this.preRenderWrapper, ['z-index', 'opacity', 'pointer-events']);

        this.subscribeToEvents();
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
            position: 'absolute ',
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
        this.viewConfig = { excludeRuntimeFiltersfromURL: false, ...viewConfig };
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
    // eslint-disable-next-line camelcase
    public test__executeCallbacks = this.executeCallbacks;
}
