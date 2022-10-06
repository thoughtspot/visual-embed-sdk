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
} from '../utils';
import {
    getThoughtSpotHost,
    URL_MAX_LENGTH,
    DEFAULT_EMBED_WIDTH,
    DEFAULT_EMBED_HEIGHT,
    getV2BasePath,
} from '../config';
import {
    DOMSelector,
    HostEvent,
    EmbedEvent,
    MessageCallback,
    Action,
    RuntimeFilter,
    Param,
    EmbedConfig,
    MessageOptions,
    MessagePayload,
    MessageCallbackObj,
} from '../types';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';
import { processEventData } from '../utils/processData';
import { processTrigger } from '../utils/processTrigger';
import pkgInfo from '../../package.json';
import { getAuthPromise, getEmbedConfig, renderInQueue } from './base';

const { version } = pkgInfo;

/**
 * Global prefix for all Thoughtspot postHash Params.
 */
export const THOUGHTSPOT_PARAM_PREFIX = 'ts-';

/**
 * The event id map from v2 event names to v1 event id
 * v1 events are the classic embed events implemented in Blink v1
 * We cannot rename v1 event types to maintain backward compatibility
 * @internal
 */
const V1EventMap = {
    [EmbedEvent.Data]: [EmbedEvent.V1Data],
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LayoutConfig {}

/**
 * Embedded iFrame configuration
 */
export interface FrameParams {
    /**
     * The width of the iFrame (unit is pixels if numeric).
     */
    width?: number | string;
    /**
     * The height of the iFrame (unit is pixels if numeric).
     */
    height?: number | string;
    /**
     * This parameters will be passed on the iframe
     * as is.
     */
    [key: string]: string | number | boolean | undefined;
}

/**
 * The configuration object for an embedded view.
 */
export interface ViewConfig {
    /**
     * @hidden
     */
    layoutConfig?: LayoutConfig;
    /**
     * The <b>width</b> and <b>height</b> dimensions to render an embedded object inside your app.  Specify the values in pixels or percentage.
     */
    frameParams?: FrameParams;
    /**
     * @hidden
     */
    theme?: string;
    /**
     * @hidden
     */
    // eslint-disable-next-line camelcase
    styleSheet__unstable?: string;
    /**
     * The list of actions to disable from the primary menu, more menu
     * (...), and the contextual menu.
     */
    disabledActions?: Action[];
    /**
     * The tooltip to display for disabled actions.
     */
    disabledActionReason?: string;
    /**
     * The list of actions to hide from the primary menu, more menu
     * (...), and the contextual menu.
     */
    hiddenActions?: Action[];
    /**
     * The list of actions to display from the primary menu, more menu
     * (...), and the contextual menu.
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1-sw
     */
    visibleActions?: Action[];
    /**
     * Show alert messages and toast messages in the embedded view.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    showAlerts?: boolean;
    /**
     * The list of runtime filters to apply to a search answer,
     * visualization, or Liveboard.
     */
    runtimeFilters?: RuntimeFilter[];
    /**
     * The locale/language to use for the embedded view.
     * @version SDK: 1.9.4 | ThoughtSpot 8.1.0.cl, 8.4.1-sw
     */
    locale?: string;
    /**
     * This is an object (key/val) of override flags which will be applied
     * to the internal embedded object. This can be used to add any
     * URL flag.
     * Warning: This option is for advanced use only and is used internally
     * to control embed behavior in non-regular ways. We do not publish the
     * list of supported keys and values associated with each.
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     */
    additionalFlags?: { [key: string]: string | number | boolean };
}

/**
 * Base class for embedding v2 experience
 * Note: the v2 version of ThoughtSpot Blink is built on the new stack:
 * React+GraphQL
 */
export class TsEmbed {
    /**
     * The DOM node where the ThoughtSpot app is to be embedded.
     */
    private el: Element;

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
     * @default false
     */
    private shouldEncodeUrlQueryParams = false;

    private defaultHiddenActions = [Action.ReportError];

    constructor(domSelector: DOMSelector, viewConfig?: ViewConfig) {
        this.el = this.getDOMNode(domSelector);
        // TODO: handle error
        this.embedConfig = getEmbedConfig();
        this.thoughtSpotHost = getThoughtSpotHost(this.embedConfig);
        this.thoughtSpotV2Base = getV2BasePath(this.embedConfig);
        this.eventHandlerMap = new Map();
        this.isError = false;
        this.viewConfig = viewConfig;
        this.shouldEncodeUrlQueryParams = this.embedConfig.shouldEncodeUrlQueryParams;
        this.registerAppInit();
    }

    /**
     * Gets a reference to the root DOM node where
     * the embedded content will appear.
     * @param domSelector
     */
    private getDOMNode(domSelector: DOMSelector) {
        return typeof domSelector === 'string'
            ? document.querySelector(domSelector)
            : domSelector;
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
        console.error(error);
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
     * fix for ts7.sep.cl
     * will be removed for ts7.oct.cl
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
                    processEventData(
                        eventType,
                        eventData,
                        this.thoughtSpotHost,
                        this.el,
                    ),
                    eventPort,
                );
            }
        });
    }

    /**
     * Send Custom style as part of payload of APP_INIT
     */
    private appInitCb = (_: any, responder: any) => {
        responder({
            type: EmbedEvent.APP_INIT,
            data: { customisations: getCustomisations(this.embedConfig) },
        });
    };

    /**
     * Register APP_INIT event and sendback init payload
     */
    private registerAppInit = () => {
        this.on(EmbedEvent.APP_INIT, this.appInitCb);
    };

    /**
     * Constructs the base URL string to load the ThoughtSpot app.
     */
    protected getEmbedBasePath(query: string): string {
        let queryString = query;
        if (this.shouldEncodeUrlQueryParams) {
            queryString = `?base64UrlEncodedFlags=${getEncodedQueryParamsString(
                queryString.substr(1),
            )}`;
        }
        const basePath = [
            this.thoughtSpotHost,
            this.thoughtSpotV2Base,
            queryString,
        ]
            .filter((x) => x.length > 0)
            .join('/');

        return `${basePath}#/embed`;
    }

    /**
     * Common query params set for all the embed modes.
     * @returns queryParams
     */
    protected getBaseQueryParams() {
        const queryParams = {};
        let hostAppUrl = window?.location?.host || '';

        // The below check is needed because TS Cloud firewall, blocks localhost/127.0.0.1
        // in any url param.
        if (
            hostAppUrl.includes('localhost') ||
            hostAppUrl.includes('127.0.0.1')
        ) {
            hostAppUrl = 'local-host';
        }
        queryParams[Param.HostAppUrl] = encodeURIComponent(hostAppUrl);
        queryParams[Param.ViewPortHeight] = window.innerHeight;
        queryParams[Param.ViewPortWidth] = window.innerWidth;
        queryParams[Param.Version] = version;
        if (
            this.embedConfig.disableLoginRedirect === true ||
            this.embedConfig.autoLogin === true
        ) {
            queryParams[Param.DisableLoginRedirect] = true;
        }
        // TODO remove this
        if (this.embedConfig.customCssUrl) {
            queryParams[Param.CustomCSSUrl] = this.embedConfig.customCssUrl;
        }

        const {
            disabledActions,
            disabledActionReason,
            hiddenActions,
            visibleActions,
            showAlerts,
            additionalFlags,
            locale,
        } = this.viewConfig;

        if (Array.isArray(visibleActions) && Array.isArray(hiddenActions)) {
            this.handleError(
                'You cannot have both hidden actions and visible actions',
            );
            return queryParams;
        }

        if (disabledActions?.length) {
            queryParams[Param.DisableActions] = disabledActions;
        }
        if (disabledActionReason) {
            queryParams[Param.DisableActionReason] = disabledActionReason;
        }
        queryParams[Param.HideActions] = [
            ...this.defaultHiddenActions,
            ...(hiddenActions ?? []),
        ];
        if (Array.isArray(visibleActions)) {
            queryParams[Param.VisibleActions] = visibleActions;
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
        return queryParams;
    }

    /**
     * Constructs the base URL string to load v1 of the ThoughtSpot app.
     * This is used for embedding Liveboards, visualizations, and full application.
     * @param queryString The query string to append to the URL.
     * @param isAppEmbed A Boolean parameter to specify if you are embedding
     * the full application.
     */
    protected getV1EmbedBasePath(
        queryString: string,
        showPrimaryNavbar = false,
        disableProfileAndHelp = false,
        isAppEmbed = false,
        enableSearchAssist = false,
    ): string {
        const queryStringFrag = queryString ? `&${queryString}` : '';
        const primaryNavParam = `&primaryNavHidden=${!showPrimaryNavbar}`;
        const disableProfileAndHelpParam = `&profileAndHelpInNavBarHidden=${disableProfileAndHelp}`;
        const enableSearchAssistParam = `&${Param.EnableSearchAssist}=${enableSearchAssist}`;
        let queryParams = `?embedApp=true${isAppEmbed ? primaryNavParam : ''}${
            isAppEmbed ? disableProfileAndHelpParam : ''
        }${
            enableSearchAssist ? enableSearchAssistParam : ''
        }${queryStringFrag}`;
        if (this.shouldEncodeUrlQueryParams) {
            queryParams = `?base64UrlEncodedFlags=${getEncodedQueryParamsString(
                queryParams.substr(1),
            )}`;
        }
        let path = `${this.thoughtSpotHost}/${queryParams}#`;
        if (!isAppEmbed) {
            path = `${path}/embed`;
        }
        return path;
    }

    /**
     * Renders the embedded ThoughtSpot app in an iframe and sets up
     * event listeners.
     * @param url
     * @param frameOptions
     */
    protected renderIFrame(url: string, frameOptions: FrameParams = {}): void {
        if (this.isError) {
            return;
        }
        if (!this.thoughtSpotHost) {
            this.throwInitError();
        }
        if (url.length > URL_MAX_LENGTH) {
            // warn: The URL is too long
        }

        renderInQueue((nextInQueue) => {
            const initTimestamp = Date.now();

            this.executeCallbacks(EmbedEvent.Init, {
                data: {
                    timestamp: initTimestamp,
                },
                type: EmbedEvent.Init,
            });

            uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_START);
            getAuthPromise()
                ?.then((isLoggedIn: boolean) => {
                    if (!isLoggedIn) {
                        this.el.innerHTML = this.embedConfig.loginFailedMessage;
                        return;
                    }

                    uploadMixpanelEvent(
                        MIXPANEL_EVENT.VISUAL_SDK_RENDER_COMPLETE,
                    );

                    this.iFrame =
                        this.iFrame || document.createElement('iframe');

                    this.iFrame.src = url;

                    // according to screenfull.js documentation
                    // allowFullscreen, webkitallowfullscreen and mozallowfullscreen must be true
                    this.iFrame.allowFullscreen = true;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    this.iFrame.webkitallowfullscreen = true;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    this.iFrame.mozallowfullscreen = true;
                    const {
                        height: frameHeight,
                        width: frameWidth,
                        ...restParams
                    } = frameOptions;
                    const width = getCssDimension(
                        frameWidth || DEFAULT_EMBED_WIDTH,
                    );
                    const height = getCssDimension(
                        frameHeight || DEFAULT_EMBED_HEIGHT,
                    );
                    setAttributes(this.iFrame, restParams);

                    this.iFrame.style.width = `${width}`;
                    this.iFrame.style.height = `${height}`;
                    this.iFrame.style.border = '0';
                    this.iFrame.name = 'ThoughtSpot Embedded Analytics';
                    this.iFrame.addEventListener('load', () => {
                        nextInQueue();
                        const loadTimestamp = Date.now();
                        this.executeCallbacks(EmbedEvent.Load, {
                            data: {
                                timestamp: loadTimestamp,
                            },
                            type: EmbedEvent.Load,
                        });
                        uploadMixpanelEvent(
                            MIXPANEL_EVENT.VISUAL_SDK_IFRAME_LOAD_PERFORMANCE,
                            {
                                timeTookToLoad: loadTimestamp - initTimestamp,
                            },
                        );
                    });
                    this.iFrame.addEventListener('error', () => {
                        nextInQueue();
                    });
                    this.el.innerHTML = '';
                    this.el.appendChild(this.iFrame);
                    const prefetchIframe = document.querySelectorAll(
                        '.prefetchIframe',
                    );
                    if (prefetchIframe.length) {
                        prefetchIframe.forEach((el) => {
                            el.remove();
                        });
                    }
                    this.subscribeToEvents();
                })
                .catch((error) => {
                    nextInQueue();
                    uploadMixpanelEvent(
                        MIXPANEL_EVENT.VISUAL_SDK_RENDER_FAILED,
                    );
                    this.el.innerHTML = this.embedConfig.loginFailedMessage;
                    this.handleError(error);
                });
        });
    }

    /**
     * Sets the height of the iframe
     * @param height The height in pixels
     */
    protected setIFrameHeight(height: number): void {
        this.iFrame.style.height = `${height}px`;
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
        const callbacks = this.eventHandlerMap.get(eventType) || [];
        const allHandlers = this.eventHandlerMap.get(EmbedEvent.ALL) || [];
        callbacks.push(...allHandlers);
        const dataStatus = data?.status || embedEventStatus.END;
        callbacks.forEach((callbackObj) => {
            if (
                (callbackObj.options.start &&
                    dataStatus === embedEventStatus.START) || // When start status is true it trigger only start releated payload
                (!callbackObj.options.start &&
                    dataStatus === embedEventStatus.END) // When start status is false it trigger only end releated payload
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
            iframeVisibleViewPort =
                viewPortHeight - (offsetTopClient - scrollTopClient);
            iframeVisibleViewPort = Math.min(
                iframeHeight,
                iframeVisibleViewPort,
            );
            iframeOffset = 0;
        } else {
            iframeVisibleViewPort = Math.min(
                iframeHeight - iframeScrolled,
                viewPortHeight,
            );
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
     */
    public on(
        messageType: EmbedEvent,
        callback: MessageCallback,
        options: MessageOptions = { start: false },
    ): typeof TsEmbed.prototype {
        if (this.isRendered) {
            this.handleError(
                'Please register event handlers before calling render',
            );
        }
        const callbacks = this.eventHandlerMap.get(messageType) || [];
        callbacks.push({ options, callback });
        this.eventHandlerMap.set(messageType, callbacks);
        return this;
    }

    /**
     * Triggers an event on specific Port registered against
     * for the EmbedEvent
     * @param eventType The message type
     * @param data The payload to send
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
     * @param messageType The event type
     * @param data The payload to send with the message
     */
    public trigger(messageType: HostEvent, data: any): Promise<any> {
        uploadMixpanelEvent(
            `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${messageType}`,
        );
        return processTrigger(
            this.iFrame,
            messageType,
            this.thoughtSpotHost,
            data,
        );
    }

    /**
     * Marks the ThoughtSpot object to have been rendered
     * Needs to be overridden by subclasses to do the actual
     * rendering of the iframe.
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
}

/**
 * Base class for embedding v1 experience
 * Note: The v1 version of ThoughtSpot Blink works on the AngularJS stack
 * which is currently under migration to v2
 */
export class V1Embed extends TsEmbed {
    protected viewConfig: ViewConfig;

    constructor(domSelector: DOMSelector, viewConfig: ViewConfig) {
        super(domSelector, viewConfig);
        this.viewConfig = viewConfig;
    }

    /**
     * Render the app in an iframe and set up event handlers
     * @param iframeSrc
     */
    protected renderV1Embed(iframeSrc: string): void {
        this.renderIFrame(iframeSrc, this.viewConfig.frameParams);
    }

    // @override
    public on(
        messageType: EmbedEvent,
        callback: MessageCallback,
        options: MessageOptions = { start: false },
    ): typeof TsEmbed.prototype {
        const eventType = this.getCompatibleEventType(messageType);

        return super.on(eventType, callback, options);
    }
}
