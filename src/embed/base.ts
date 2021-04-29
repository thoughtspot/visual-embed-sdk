/**
 * Copyright (c) 2021
 *
 * Base classes
 *
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { getCssDimension } from '../utils';
import {
    getThoughtSpotHost,
    URL_MAX_LENGTH,
    DEFAULT_EMBED_WIDTH,
    DEFAULT_EMBED_HEIGHT,
    getV2BasePath,
} from '../config';
import {
    DOMSelector,
    EmbedConfig,
    HostEvent,
    EmbedEvent,
    MessageCallback,
    AuthType,
    Action,
    RuntimeFilter,
} from '../types';
import { authenticate, isAuthenticated } from '../auth';
import {
    initMixpanel,
    uploadMixpanelEvent,
    MIXPANEL_EVENT,
} from '../mixpanel-service';

let config = {} as EmbedConfig;

let authPromise: Promise<void>;

/**
 * The event id map from v2 event names to v1 event id
 * v1 events are the classic embed events implemented in Blink v1
 * We cannot rename v1 event types to maintain backward compatibility
 * @internal
 */
const V1EventMap = {
    [EmbedEvent.Data]: [EmbedEvent.V1Data],
};

/**
 * Perform authentication on the ThoughtSpot app as applicable.
 */
const handleAuth = () => {
    const authConfig = {
        ...config,
        thoughtSpotHost: getThoughtSpotHost(config),
    };
    authPromise = authenticate(authConfig);
};

/**
 * Initialize the ThoughtSpot embed settings globally and perform
 * authentication if applicable.
 * @param embedConfig The configuration object containing ThoughtSpot host,
 * authentication mechanism and so on.
 */
export const init = (embedConfig: EmbedConfig): void => {
    config = embedConfig;
    handleAuth();
    initMixpanel(embedConfig);
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
     * The height and width of the iFrame.
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
     * The list of runtime filters to apply to a search answer,
     * visualization, or pinboard.
     */
    runtimeFilters?: RuntimeFilter[];
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
    private eventHandlerMap: Map<string, MessageCallback[]>;

    /**
     * A flag that is set to true post render.
     */
    private isRendered: boolean;

    /**
     * A flag to mark if an error has occurred.
     */
    private isError: boolean;

    constructor(domSelector: DOMSelector) {
        this.el = this.getDOMNode(domSelector);
        // TODO: handle error
        this.thoughtSpotHost = getThoughtSpotHost(config);
        this.thoughtSpotV2Base = getV2BasePath(config);
        this.eventHandlerMap = new Map();
        this.isError = false;
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
        console.log(error);
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
     * Adds a global event listener to window for "message" events.
     * ThoughtSpot detects if a particular event is targeted to this
     * embed instance through an identifier contained in the payload,
     * and executes the registered callbacks accordingly.
     */
    private subscribeToEvents() {
        window.addEventListener('message', (event) => {
            const eventType = this.getEventType(event);
            if (event.source === this.iFrame.contentWindow) {
                this.executeCallbacks(eventType, event.data);
            }
        });
    }

    /**
     * Constructs the base URL string to load the ThoughtSpot app.
     */
    protected getEmbedBasePath(queryString: string): string {
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
     * Constructs the base URL string to load v1 of the ThoughtSpot app.
     * This is used for embedding pinboards, visualizations, and full application.
     * @param queryString The query string to append to the URL.
     * @param isAppEmbed A Boolean parameter to specify if you are embedding
     * the full application.
     */
    protected getV1EmbedBasePath(
        queryString: string,
        showPrimaryNavbar = false,
        isAppEmbed = false,
    ): string {
        const queryStringFrag = queryString ? `&${queryString}` : '';
        const primaryNavParam = `&primaryNavHidden=${!showPrimaryNavbar}`;
        const queryParams = `?embedApp=true${
            isAppEmbed ? primaryNavParam : ''
        }${queryStringFrag}`;
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
    protected renderIFrame(url: string, frameOptions: FrameParams): void {
        if (this.isError) {
            return;
        }
        if (!this.thoughtSpotHost) {
            this.throwInitError();
        }
        if (url.length > URL_MAX_LENGTH) {
            // warn: The URL is too long
        }

        const initTimestamp = Date.now();

        this.executeCallbacks(EmbedEvent.Init, {
            data: {
                timestamp: initTimestamp,
            },
        });

        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_START);

        authPromise
            ?.then(() => {
                this.executeCallbacks(EmbedEvent.AuthInit, {
                    data: { isLoggedIn: isAuthenticated() },
                });

                this.iFrame = this.iFrame || document.createElement('iframe');
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
                const width = getCssDimension(
                    frameOptions?.width || DEFAULT_EMBED_WIDTH,
                );
                const height = getCssDimension(
                    frameOptions?.height || DEFAULT_EMBED_HEIGHT,
                );
                this.iFrame.style.width = `${width}`;
                this.iFrame.style.height = `${height}`;
                this.iFrame.style.border = '0';
                this.iFrame.name = 'ThoughtSpot Embedded Analytics';
                this.iFrame.addEventListener('load', () => {
                    const loadTimestamp = Date.now();
                    this.executeCallbacks(EmbedEvent.Load, {
                        data: {
                            timestamp: loadTimestamp,
                        },
                    });
                    uploadMixpanelEvent(
                        MIXPANEL_EVENT.VISUAL_SDK_IFRAME_LOAD_PERFORMANCE,
                        {
                            timeTookToLoad: loadTimestamp - initTimestamp,
                        },
                    );
                });
                this.el.innerHTML = '';
                this.el.appendChild(this.iFrame);
                this.subscribeToEvents();
            })
            .catch((error) => {
                this.handleError(error);
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
     */
    protected executeCallbacks(eventType: EmbedEvent, data: any): void {
        const callbacks = this.eventHandlerMap.get(eventType) || [];
        callbacks.forEach((callback) => callback(data));
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
     * Registers an event listener to trigger an alert when the ThoughtSpot app
     * sends an event of a particular message type to the host application.
     *
     * @param messageType The message type
     * @param callback A callback function
     */
    public on(
        messageType: EmbedEvent,
        callback: MessageCallback,
    ): typeof TsEmbed.prototype {
        if (this.isRendered) {
            this.handleError(
                'Please register event handlers before calling render',
            );
        }

        const callbacks = this.eventHandlerMap.get(messageType) || [];
        callbacks.push(callback);
        this.eventHandlerMap.set(messageType, callbacks);

        return this;
    }

    /**
     * Triggers an event to the embedded app
     * @param messageType The event type
     * @param data The payload to send with the message
     */
    public trigger(
        messageType: HostEvent,
        data: any,
    ): typeof TsEmbed.prototype {
        this.iFrame.contentWindow.postMessage(
            {
                type: messageType,
                data,
            },
            this.thoughtSpotHost,
        );

        return this;
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
}

/**
 * Base class for embedding v1 experience
 * Note: The v1 version of ThoughtSpot Blink works on the AngularJS stack
 * which is currently under migration to v2
 */
export class V1Embed extends TsEmbed {
    protected viewConfig: ViewConfig;

    constructor(domSelector: DOMSelector, viewConfig: ViewConfig) {
        super(domSelector);
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
    ): typeof TsEmbed.prototype {
        const eventType = this.getCompatibleEventType(messageType);

        return super.on(eventType, callback);
    }
}
