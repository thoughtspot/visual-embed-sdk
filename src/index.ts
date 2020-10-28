import { getThoughtSpotHost } from './config';
/**
 * Copyright (c) 2020
 *
 * ThoughtSpot Embed UI SDK for embedding ThoughtSpot analytics
 * in other web applications.
 *
 * @summary ThoughtSpot Embed UI SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import {
    EmbedConfig,
    EventType,
    FrameParams,
    MessageCallback,
    QueryObject,
    ViewConfig,
} from './types';

import { id } from './utils';

const DEFAULT_EMBED_WIDTH = 500;
const DEFAULT_EMBED_HEIGHT = 500;

let config = {} as EmbedConfig;

const init = (embedConfig: EmbedConfig): void => {
    config = embedConfig;
};

class TsEmbed {
    private id: string;

    private el: Element;

    private iFrame: HTMLIFrameElement;

    private eventHandlerMap: Map<string, MessageCallback[]>;

    private thoughtSpotHost: string;

    constructor(domSelector: string) {
        this.el = document.querySelector(domSelector);
        this.id = id();
        // TODO: handle error
        this.thoughtSpotHost = getThoughtSpotHost(config);
        this.eventHandlerMap = new Map();
    }

    private executeCallbacks(eventType: EventType, data: any) {
        const callbacks = this.eventHandlerMap.get(eventType) || [];
        callbacks.forEach((callback) => callback(data));
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

    protected getEmbedBasePath() {
        return `${this.thoughtSpotHost}/#/embed/${this.getId()}`;
    }

    protected renderIFrame(url: string, frameOptions: FrameParams) {
        if (!this.thoughtSpotHost) {
            this.throwInitError();
        }

        this.executeCallbacks(EventType.Init, {
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

    public getId() {
        return this.id;
    }

    public getThoughtSpotHost() {
        return this.thoughtSpotHost;
    }

    public on(messageType: string, callback: MessageCallback) {
        const callbacks = this.eventHandlerMap.get(messageType) || [];
        callbacks.push(callback);
        this.eventHandlerMap.set(messageType, callbacks);

        return this;
    }

    public trigger(messageType: string, data: any) {
        this.iFrame.contentWindow.postMessage(
            {
                type: messageType,
                data,
            },
            this.thoughtSpotHost,
        );

        return this;
    }
}

class SearchEmbed extends TsEmbed {
    private viewConfig: ViewConfig;

    constructor(domSelector: string, viewConfig: ViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
    }

    private getIFrameSrc(answerId?: string) {
        const answerPath = answerId ? `saved-answer/${answerId}` : 'answer';
        return `${this.getEmbedBasePath()}/${answerPath}`;
    }

    public render(
        dataSources: string[],
        query: QueryObject,
        answerId: string,
    ): SearchEmbed {
        const src = this.getIFrameSrc(answerId);
        this.renderIFrame(src, this.viewConfig.frameParams);

        return this;
    }
}

export { init, SearchEmbed };
