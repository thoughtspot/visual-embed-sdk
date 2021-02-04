/**
 * Copyright (c) 2021
 *
 * Base classes
 *
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import {
    getThoughtSpotHost,
    URL_MAX_LENGTH,
    DEFAULT_EMBED_WIDTH,
    DEFAULT_EMBED_HEIGHT,
} from '../config';
import {
    DOMSelector,
    EmbedConfig,
    EventType,
    EventTypeV1,
    GenericCallbackFn,
    MessageCallback,
} from '../types';
import { id } from '../utils';
import {
    getCurrentData,
    initialize,
    subscribeToAlerts,
    subscribeToData,
} from '../v1/api';

let config = {} as EmbedConfig;

/**
 * Initialize the ThoughtSpot embed settings globally
 * @param embedConfig The configuration object containing ThoughtSpot host,
 * authentication mecheanism etc.
 */
export const init = (embedConfig: EmbedConfig): void => {
    config = embedConfig;
};

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

/**
 * Base class for embedding v2 experience
 */
export class TsEmbed {
    /**
     * The identifier for the instance
     */
    private id: string;

    /**
     * The DOM node where the ThoughtSpot app is to be embedded
     */
    private el: Element;

    /**
     * A reference to the iframe within which the ThoughtSpot app
     * will be rendered
     */
    private iFrame: HTMLIFrameElement;

    /**
     * A map of event handlers for particular message types triggered
     * by the embdedded app; multiple event handlers can be registered
     * against a particular message type
     */
    private eventHandlerMap: Map<string, MessageCallback[]>;

    /**
     * The ThoughtSpot host name or IP address
     */
    private thoughtSpotHost: string;

    /**
     * A flag that is set to true post render
     */
    private isRendered: boolean;

    constructor(domSelector: DOMSelector) {
        this.el = this.getDOMNode(domSelector);
        this.id = id();
        // TODO: handle error
        this.thoughtSpotHost = getThoughtSpotHost(config);
        this.eventHandlerMap = new Map();
    }

    /**
     * Get a reference to the root DOM node where
     * the embedded content will appear
     * @param domSelector
     */
    private getDOMNode(domSelector: DOMSelector) {
        return typeof domSelector === 'string'
            ? document.querySelector(domSelector)
            : domSelector;
    }

    /**
     * Throw error encountered during initialization
     */
    private throwInitError() {
        throw new Error('You need to init the ThoughtSpot SDK module first');
    }

    /**
     * Add an global event listener to window for "message" events
     * We detect if a particular event is targeted to this particular
     * embed instance through an identifier contained in the payload,
     * and execute the registere callbacks accordingly
     */
    private subscribeToEvents() {
        window.addEventListener('message', (event) => {
            const eventType = event.data?.type;
            const embedId = event.data?.embedId;
            if (embedId === this.getId()) {
                this.executeCallbacks(eventType, event.data);
            }
        });
    }

    /**
     * Construct the base URL string to load the ThoughtSpot app
     */
    protected getEmbedBasePath(): string {
        return `${this.thoughtSpotHost}/v2/#/embed/${this.getId()}`;
    }

    /**
     * Construct the base URL string to load v1 of the ThoughtSpot app
     * This is used for pinboards, visualizations and full app embedding
     * @param queryString Query string to append to the URL
     * @param isAppEmbed A Boolean parameter to specify if we're embedding
     * the full app
     */
    protected getV1EmbedBasePath(
        queryString: string,
        isAppEmbed = false,
    ): string {
        const queryStringFrag = queryString ? `&${queryString}` : '';
        let path = `${this.thoughtSpotHost}/?embedApp=true${queryStringFrag}#`;
        if (!isAppEmbed) {
            path = `${path}/embed`;
        }

        return path;
    }

    /**
     * Renders the embedded ThoughtSpot app in an iframe and sets up
     * event listeners
     * @param url
     * @param frameOptions
     */
    protected renderIFrame(url: string, frameOptions: FrameParams): void {
        if (!this.thoughtSpotHost) {
            this.throwInitError();
        }
        if (url.length > URL_MAX_LENGTH) {
            // warn: URL too long
        }

        this.executeCallbacks(EventType.RenderInit, {
            data: {
                timestamp: Date.now(),
            },
        });
        this.iFrame = document.createElement('iframe');
        this.iFrame.src = url;
        this.iFrame.width = `${frameOptions?.width || DEFAULT_EMBED_WIDTH}`;
        this.iFrame.height = `${frameOptions?.height || DEFAULT_EMBED_HEIGHT}`;
        this.iFrame.style.border = '0';
        this.iFrame.name = 'ThoughtSpot Embedded Analytics';
        this.iFrame.addEventListener('load', () =>
            this.executeCallbacks(EventType.Load, {
                data: {
                    timestamp: Date.now(),
                },
            }),
        );
        this.el.appendChild(this.iFrame);

        this.subscribeToEvents();
    }

    /**
     * Execute all registered event handlers for a particular event type
     * @param eventType The event type
     * @param data The payload the event handler will be invoked with
     */
    protected executeCallbacks(
        eventType: EventType | EventTypeV1,
        data: any,
    ): void {
        const callbacks = this.eventHandlerMap.get(eventType) || [];
        callbacks.forEach((callback) => callback(data));
    }

    /**
     * Return the identifier for this instance
     */
    public getId(): string {
        return this.id;
    }

    /**
     * Return the ThoughtSpot host name or IP address
     */
    public getThoughtSpotHost(): string {
        return this.thoughtSpotHost;
    }

    /**
     * Register an event listener to be triggered when we receive
     * an event of a particular message type from the embedded app
     * @param messageType The message type
     * @param callback A callback function
     */
    public on(
        messageType: string,
        callback: MessageCallback,
    ): typeof TsEmbed.prototype {
        if (this.isRendered) {
            throw new Error(
                'Please register event handlers before calling render',
            );
        }

        const callbacks = this.eventHandlerMap.get(messageType) || [];
        callbacks.push(callback);
        this.eventHandlerMap.set(messageType, callbacks);

        return this;
    }

    /**
     * Trigger a message event to the embedded app
     * @param messageType The message type
     * @param data The payload to send with the message
     */
    public trigger(messageType: string, data: any): typeof TsEmbed.prototype {
        this.iFrame.contentWindow.postMessage(
            {
                type: messageType,
                data,
            },
            this.thoughtSpotHost,
        );

        return this;
    }

    public render(...args: any[]): void {
        this.isRendered = true;
    }
}

/**
 * Base class for embedding legacy v1 experience
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

        // Set up event handlers using v1 API
        const onInit = (isInitialized: boolean) =>
            this.executeCallbacks(EventType.Init, isInitialized);
        const onAuthExpire = () =>
            this.executeCallbacks(EventTypeV1.AuthExpire, null);

        initialize(onInit, onAuthExpire, this.getThoughtSpotHost());

        const onAlert = (data: any) =>
            this.executeCallbacks(EventTypeV1.Alert, data);
        subscribeToAlerts(this.getThoughtSpotHost(), onAlert);

        const onData = (data: any) =>
            this.executeCallbacks(EventTypeV1.Data, data);
        subscribeToData(onData);
    }

    /**
     * Fetch the current pinboard or answer data from the
     * embedded app asynchronously
     * @param callback A function to be executed with the
     * fetched as an argument
     */
    public getCurrentData(callback: GenericCallbackFn): void {
        getCurrentData(callback);
    }
}
