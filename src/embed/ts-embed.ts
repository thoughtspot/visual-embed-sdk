/**
 * Copyright (c) 2022
 *
 * Base classes
 *
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

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
} from '../types';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';
import { processEventData } from '../utils/processData';
import { processTrigger } from '../utils/processTrigger';
import pkgInfo from '../../package.json';
import {
    getAuthPromise,
    getEmbedConfig,
    renderInQueue,
    handleAuth,
    notifyAuthFailure,
} from './base';
import { AuthFailureType, getAuthenticaionToken } from '../auth';

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
 *
 * @internal
 */
const V1EventMap = {};

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
    private insertedDomEl: Node;

    /**
     * The DOM node where the ThoughtSpot app is to be embedded.
     */
    private el: Element;

    protected isAppInitialized = false;

    /**
     * A reference to the iframe within which the ThoughtSpot app
     * will be rendered.
     */
    protected iFrame: HTMLIFrameElement;

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
    private isRendered: boolean;

    /**
     * A flag to mark if an error has occurred.
     */
    private isError: boolean;

    /**
     * Should we encode URL Query Params using base64 encoding which thoughtspot
     * will generate for embedding. This provides additional security to
     * thoughtspot clusters against Cross site scripting attacks.
     *
     * @default false
     */
    private shouldEncodeUrlQueryParams = false;

    private defaultHiddenActions = [Action.ReportError];

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
        this.viewConfig = viewConfig;
        this.shouldEncodeUrlQueryParams = this.embedConfig.shouldEncodeUrlQueryParams;
        this.registerAppInit();
        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_EMBED_CREATE, {
            ...viewConfig,
        });
    }

    /**
     * Throws error encountered during initialization.
     */
    private throwInitError() {
        this.handleError('You need to init the ThoughtSpot SDK module first');
    }

    /**
     * Handles errors within the SDK
     *
     * @param error The error message or object
     */
    protected handleError(error: string | Record<string, unknown>) {
        this.isError = true;
        this.executeCallbacks(EmbedEvent.Error, {
            error,
        });
        // Log error
        console.error(error);
    }

    /**
     * Extracts the type field from the event payload
     *
     * @param event The window message event
     */
    private getEventType(event: MessageEvent) {
        // eslint-disable-next-line no-underscore-dangle
        return event.data?.type || event.data?.__type;
    }

    /**
     * Extracts the port field from the event payload
     *
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
     * fix for ts7.sep.cl
     * will be removed for ts7.oct.cl
     *
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

    /**
     * Adds a global event listener to window for "message" events.
     * ThoughtSpot detects if a particular event is targeted to this
     * embed instance through an identifier contained in the payload,
     * and executes the registered callbacks accordingly.
     */
    private subscribeToEvents() {
        window.addEventListener('message', (event) => {
            const eventType = this.getEventType(event);
            const eventPort = this.getEventPort(event);
            const eventData = this.formatEventData(event, eventType);
            if (event.source === this.iFrame.contentWindow) {
                this.executeCallbacks(
                    eventType,
                    processEventData(eventType, eventData, this.thoughtSpotHost, this.el),
                    eventPort,
                );
            }
        });
        window.addEventListener('online', (e) => {
            this.trigger(HostEvent.Reload);
        });
        window.addEventListener('offline', (e) => {
            const offlineWarning = 'Network not Detected. Embed is offline. Please reconnect and refresh';
            this.executeCallbacks(EmbedEvent.Error, {
                offlineWarning,
            });
            console.warn(offlineWarning);
        });
    }

    /**
     * Send Custom style as part of payload of APP_INIT
     *
     * @param _
     * @param responder
     */
    private appInitCb = async (_: any, responder: any) => {
        let authToken = '';
        if (this.embedConfig.authType === AuthType.TrustedAuthTokenCookieless) {
            authToken = await getAuthenticaionToken(this.embedConfig);
        }
        this.isAppInitialized = true;
        responder({
            type: EmbedEvent.APP_INIT,
            data: {
                customisations: getCustomisations(this.embedConfig, this.viewConfig),
                authToken,
                runtimeFilterParams: getRuntimeFilters(this.viewConfig.runtimeFilters),
                hiddenHomepageModules: this.viewConfig.hiddenHomepageModules || [],
                hostConfig: this.embedConfig.hostConfig,
                hiddenHomeLeftNavItems: this.viewConfig?.hiddenHomeLeftNavItems
                    ? this.viewConfig?.hiddenHomeLeftNavItems : [],
            },
        });
    };

    /**
     * Sends updated auth token to the iFrame to avoid user logout
     *
     * @param _
     * @param responder
     */
    private updateAuthToken = async (_: any, responder: any) => {
        const { autoLogin = false, authType } = this.embedConfig; // Set autoLogin default to false
        if (authType === AuthType.TrustedAuthTokenCookieless) {
            const authToken = await getAuthenticaionToken(this.embedConfig);
            responder({
                type: EmbedEvent.AuthExpire,
                data: { authToken },
            });
        } else if (autoLogin) {
            handleAuth();
        }
        notifyAuthFailure(AuthFailureType.EXPIRY);
    };

    /**
     * Register APP_INIT event and sendback init payload
     */
    private registerAppInit = () => {
        this.on(
            EmbedEvent.APP_INIT, this.appInitCb, { start: false }, true,
        );
        this.on(
            EmbedEvent.AuthExpire, this.updateAuthToken, { start: false }, true,
        );
    };

    /**
     * Constructs the base URL string to load the ThoughtSpot app.
     *
     * @param query
     */
    protected getEmbedBasePath(query: string): string {
        let queryString = query;
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
     *
     * @param queryParams
     * @returns queryParams
     */
    protected getBaseQueryParams(queryParams = {}) {
        let hostAppUrl = window?.location?.host || '';

        // The below check is needed because TS Cloud firewall, blocks
        // localhost/127.0.0.1 in any url param.
        if (hostAppUrl.includes('localhost') || hostAppUrl.includes('127.0.0.1')) {
            hostAppUrl = 'local-host';
        }
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

        const {
            disabledActions,
            disabledActionReason,
            hiddenActions,
            visibleActions,
            hiddenTabs,
            visibleTabs,
            showAlerts,
            additionalFlags,
            locale,
            customizations,
            contextMenuTrigger,
            linkOverride,
            insertInToSlide,
            hideLiveboardHeader,
            showLiveboardDescription,
            showLiveboardTitle,
        } = this.viewConfig;

        if (Array.isArray(visibleActions) && Array.isArray(hiddenActions)) {
            this.handleError('You cannot have both hidden actions and visible actions');
            return queryParams;
        }

        if (Array.isArray(visibleTabs) && Array.isArray(hiddenTabs)) {
            this.handleError('You cannot have both hidden Tabs and visible Tabs');
            return queryParams;
        }

        // TODO remove embedConfig.customCssUrl
        const cssUrlParam = customizations?.style?.customCSSUrl || this.embedConfig.customCssUrl;

        if (cssUrlParam) {
            queryParams[Param.CustomCSSUrl] = cssUrlParam;
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
        if (additionalFlags && additionalFlags.constructor.name === 'Object') {
            Object.assign(queryParams, additionalFlags);
        }
        if (linkOverride) {
            queryParams[Param.LinkOverride] = linkOverride;
        }
        if (insertInToSlide) {
            queryParams[Param.ShowInsertToSlide] = insertInToSlide;
        }
        if (hideLiveboardHeader) {
            queryParams[Param.HideLiveboardHeader] = hideLiveboardHeader;
        }
        if (showLiveboardDescription) {
            queryParams[Param.ShowLiveboardDescription] = showLiveboardDescription;
        }
        if (showLiveboardTitle) {
            queryParams[Param.ShowLiveboardTitle] = showLiveboardTitle;
        }

        return queryParams;
    }

    /**
     * Constructs the base URL string to load v1 of the ThoughtSpot app.
     * This is used for embedding Liveboards, visualizations, and full application.
     *
     * @param queryString The query string to append to the URL.
     * @param isAppEmbed A Boolean parameter to specify if you are embedding
     * the full application.
     */
    protected getV1EmbedBasePath(queryString: string): string {
        const queryParams = this.shouldEncodeUrlQueryParams
            ? `?base64UrlEncodedFlags=${getEncodedQueryParamsString(queryString)}`
            : `?${queryString}`;
        const path = `${this.thoughtSpotHost}/${queryParams}#`;
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
        iFrame.allow = 'clipboard-read; clipboard-write';

        const {
            height: frameHeight,
            width: frameWidth, ...restParams
        } = this.viewConfig.frameParams || {};
        const width = getCssDimension(frameWidth || DEFAULT_EMBED_WIDTH);
        const height = getCssDimension(frameHeight || DEFAULT_EMBED_HEIGHT);
        setAttributes(iFrame, restParams);

        iFrame.style.width = `${width}`;
        iFrame.style.height = `${height}`;
        iFrame.style.border = '0';
        iFrame.name = 'ThoughtSpot Embedded Analytics';
        return iFrame;
    }

    /**
     * Renders the embedded ThoughtSpot app in an iframe and sets up
     * event listeners.
     *
     * @param url
     * @param frameOptions
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
                        this.insertIntoDOM(this.embedConfig.loginFailedMessage);
                        return;
                    }

                    this.iFrame = this.iFrame || this.createIframeEl(url);
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
                    });
                    this.iFrame.addEventListener('error', () => {
                        nextInQueue();
                    });
                    this.insertIntoDOM(this.iFrame);
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
                    this.insertIntoDOM(this.embedConfig.loginFailedMessage);
                    this.handleError(error);
                });
        });
    }

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
     *
     * @param height The height in pixels
     */
    protected setIFrameHeight(height: number | string): void {
        this.iFrame.style.height = getCssDimension(height);
    }

    /**
     * Executes all registered event handlers for a particular event type
     *
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
     *
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
     *
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
     *
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
            this.handleError('Please register event handlers before calling render');
        }
        const callbacks = this.eventHandlerMap.get(messageType) || [];
        callbacks.push({ options, callback });
        this.eventHandlerMap.set(messageType, callbacks);
        return this;
    }

    /**
     * Removes an event listener for a particular event type.
     *
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
     *
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
                console.log(e);
            }
        } else {
            console.log('Event Port is not defined');
        }
    }

    /**
     * Triggers an event to the embedded app
     *
     * @param messageType The event type
     * @param data The payload to send with the message
     */
    public trigger(messageType: HostEvent, data: any = {}): Promise<any> {
        uploadMixpanelEvent(`${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${messageType}`);
        return processTrigger(this.iFrame, messageType, this.thoughtSpotHost, data);
    }

    /**
     * Marks the ThoughtSpot object to have been rendered
     * Needs to be overridden by subclasses to do the actual
     * rendering of the iframe.
     *
     * @param args
     */
    public render(): TsEmbed {
        this.isRendered = true;

        return this;
    }

    /**
     * Get the Post Url Params for THOUGHTSPOT from the current
     * host app URL.
     * THOUGHTSPOT URL params starts with a prefix "ts-"
     *
     * @version SDK: 1.14.0 | ThoughtSpot: 8.4.0.cl, 8.4.1-sw
     */
    public getThoughtSpotPostUrlParams(): string {
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

        let tsParams = params.toString();
        tsParams = tsParams ? `?${tsParams}` : '';

        return tsParams;
    }

    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     *
     * @version SDK: 1.19.1 | ThoughtSpot: *
     */
    public destroy(): void {
        try {
            this.insertedDomEl?.parentNode.removeChild(this.insertedDomEl);
        } catch (e) {
            console.log('Error destroying TS Embed', e);
        }
    }

    public getUnderlyingFrameElement(): HTMLIFrameElement {
        return this.iFrame;
    }

    /**
     * Prerenders a generic instance of the TS component.
     * This means without the path but with the flags already applied.
     * This is useful for prerendering the component in the background.
     *
     * @version SDK: 1.22.0
     * @returns
     */
    public async prerenderGeneric(): Promise<any> {
        const prerenderFrameSrc = this.getRootIframeSrc();
        return this.renderIFrame(prerenderFrameSrc);
    }
}

/**
 * Base class for embedding v1 experience
 * Note: The v1 version of ThoughtSpot Blink works on the AngularJS stack
 * which is currently under migration to v2
 *
 * @inheritdoc
 */
export class V1Embed extends TsEmbed {
    protected viewConfig: ViewConfig;

    constructor(domSelector: DOMSelector, viewConfig: ViewConfig) {
        super(domSelector, viewConfig);
        this.viewConfig = viewConfig;
    }

    /**
     * Render the app in an iframe and set up event handlers
     *
     * @param iframeSrc
     */
    protected renderV1Embed(iframeSrc: string): any {
        return this.renderIFrame(iframeSrc);
    }

    protected getRootIframeSrc(): string {
        const queryParams = this.getEmbedParams();
        let queryString = queryParams;
        if (!this.viewConfig.excludeRuntimeFiltersfromURL) {
            const runtimeFilters = this.viewConfig.runtimeFilters;
            const filterQuery = getFilterQuery(runtimeFilters || []);
            queryString = [filterQuery, queryParams].filter(Boolean).join('&');
        }
        return this.getV1EmbedBasePath(queryString);
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
}
