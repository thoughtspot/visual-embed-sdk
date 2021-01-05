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
} from 'src/config';
import {
    DOMSelector,
    EmbedConfig,
    EventType,
    EventTypeV1,
    GenericCallbackFn,
    MessageCallback,
} from 'src/types';
import { id } from 'src/utils';
import {
    getCurrentData,
    initialize,
    subscribeToAlerts,
    subscribeToData,
} from '../v1/api';

let config = {} as EmbedConfig;

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
 * For embedding v2 experience
 */
export class TsEmbed {
    private id: string;

    private el: Element;

    private iFrame: HTMLIFrameElement;

    private eventHandlerMap: Map<string, MessageCallback[]>;

    private thoughtSpotHost: string;

    private isRendered: boolean;

    constructor(domSelector: DOMSelector) {
        this.el = this.getDOMNode(domSelector);
        this.id = id();
        // TODO: handle error
        this.thoughtSpotHost = getThoughtSpotHost(config);
        this.eventHandlerMap = new Map();
    }

    private getDOMNode(domSelector: DOMSelector) {
        return typeof domSelector === 'string'
            ? document.querySelector(domSelector)
            : domSelector;
    }

    private throwInitError() {
        throw new Error('You need to init the ThoughtSpot SDK module first');
    }

    private subscribeToEvents() {
        window.addEventListener('message', (event) => {
            const eventType = event.data?.type;
            const embedId = event.data?.embedId;
            if (embedId === this.getId()) {
                this.executeCallbacks(eventType, event.data);
            }
        });
    }

    protected getEmbedBasePath(): string {
        return `${this.thoughtSpotHost}/#/embed/${this.getId()}`;
    }

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
        this.iFrame.width = `${frameOptions.width || DEFAULT_EMBED_WIDTH}`;
        this.iFrame.height = `${frameOptions.height || DEFAULT_EMBED_HEIGHT}`;
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

    protected executeCallbacks(
        eventType: EventType | EventTypeV1,
        data: any,
    ): void {
        const callbacks = this.eventHandlerMap.get(eventType) || [];
        callbacks.forEach((callback) => callback(data));
    }

    public getId(): string {
        return this.id;
    }

    public getThoughtSpotHost(): string {
        return this.thoughtSpotHost;
    }

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
 * For embedding legacy v1 experience
 */
export class V1Embed extends TsEmbed {
    private viewConfig: ViewConfig;

    constructor(domSelector: DOMSelector, viewConfig: ViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
    }

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

    public getCurrentData(callback: GenericCallbackFn): void {
        getCurrentData(callback);
    }
}
