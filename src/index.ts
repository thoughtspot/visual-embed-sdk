import {
    DEFAULT_EMBED_HEIGHT,
    DEFAULT_EMBED_WIDTH,
    getThoughtSpotHost,
    URL_MAX_LENGTH,
} from './config';
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
    DOMSelector,
    EmbedConfig,
    EventType,
    EventTypeV1,
    FrameParams,
    GenericCallbackFn,
    MessageCallback,
    Page,
    AppRenderOptions,
    PinboardRenderOptions,
    PinboardViewConfig,
    SearchRenderOptions,
    SearchViewConfig,
    QueryObject,
    QueryParams,
    ViewConfig,
} from './types';

import { id } from './utils';
import {
    getCurrentData,
    initialize,
    subscribeToAlerts,
    subscribeToData,
} from './v1/api';

// eslint-disable-next-line no-shadow
enum QueryParam {
    DataSources = 'dataSources',
    HideDataSources = 'hideDataSources',
    CollapseDataSources = 'collapseDataSources',
}

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

    protected getQueryParams(queryParams: QueryParams) {
        const qp: string[] = [];
        const params = Object.keys(queryParams);
        params.forEach((key) => {
            const val = queryParams[key];
            qp.push(`${key}=${val}`);
        });

        if (qp.length) {
            return qp.join('&');
        }

        return null;
    }

    protected getEmbedBasePath() {
        return `${this.thoughtSpotHost}/#/embed/${this.getId()}`;
    }

    protected getV1EmbedBasePath(isAppEmbed = false) {
        let path = `${this.thoughtSpotHost}/?embedApp=true#`;
        if (!isAppEmbed) {
            path = `${path}/embed`;
        }

        return path;
    }

    protected renderIFrame(url: string, frameOptions: FrameParams) {
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

    protected executeCallbacks(eventType: EventType | EventTypeV1, data: any) {
        const callbacks = this.eventHandlerMap.get(eventType) || [];
        callbacks.forEach((callback) => callback(data));
    }

    public getId() {
        return this.id;
    }

    public getThoughtSpotHost() {
        return this.thoughtSpotHost;
    }

    public on(messageType: string, callback: MessageCallback) {
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

    public render(...args: any[]) {
        this.isRendered = true;
    }
}

/**
 * Embed search or a saved answer
 */
class SearchEmbed extends TsEmbed {
    private viewConfig: SearchViewConfig;

    constructor(domSelector: string, viewConfig: SearchViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
    }

    private getIFrameSrc(
        answerId: string,
        collapseDataSources: boolean,
        hideDataSources: boolean,
        dataSources?: string[],
    ) {
        const answerPath = answerId ? `saved-answer/${answerId}` : 'answer';
        const queryParams = {};
        if (dataSources && dataSources.length) {
            queryParams[QueryParam.DataSources] = JSON.stringify(dataSources);
        }
        if (collapseDataSources === true) {
            queryParams[QueryParam.CollapseDataSources] = 'true';
        }
        if (hideDataSources === true) {
            queryParams[QueryParam.HideDataSources] = 'true';
        }

        let query = '';
        const queryParamsString = this.getQueryParams(queryParams);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }

        return `${this.getEmbedBasePath()}/${answerPath}${query}`;
    }

    public render({
        dataSources,
        query,
        answerId,
    }: SearchRenderOptions): SearchEmbed {
        super.render();

        const src = this.getIFrameSrc(
            answerId,
            this.viewConfig.collapseDataSources === true,
            this.viewConfig.hideDataSources === true,
            dataSources,
        );
        this.renderIFrame(src, this.viewConfig.frameParams);

        return this;
    }
}

// Embed v1

const V1EmbedMixin = (superclass: typeof TsEmbed) =>
    class extends superclass {
        private viewConfig: PinboardViewConfig;

        constructor(domSelector: DOMSelector, viewConfig: PinboardViewConfig) {
            super(domSelector);
            this.viewConfig = viewConfig;
        }

        protected renderV1Embed(iframeSrc: string) {
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

        public getCurrentData(callback: GenericCallbackFn) {
            getCurrentData(callback);
        }
    };

/**
 * Embed pinboard or visualization
 * https://docs.thoughtspot.com/5.2/app-integrate/embedding-viz/embed-a-viz.html
 */
class PinboardEmbed extends V1EmbedMixin(TsEmbed) {
    private getIFrameSrc(pinboardId: string, vizId?: string) {
        let url = `${this.getV1EmbedBasePath()}/viz/${pinboardId}`;
        if (vizId) {
            url = `${url}/${vizId}`;
        }

        return url;
    }

    public render({ pinboardId, vizId }: PinboardRenderOptions): PinboardEmbed {
        super.render();

        const src = this.getIFrameSrc(pinboardId, vizId);
        this.renderV1Embed(src);

        return this;
    }
}

/**
 * Full application embedding
 * https://docs.thoughtspot.com/5.2/app-integrate/embedding-viz/about-full-embed.html
 */
class AppEmbed extends V1EmbedMixin(TsEmbed) {
    private getIFrameSrc(pageId: string) {
        return `${this.getV1EmbedBasePath(true)}/${pageId}`;
    }

    private getPageRoute(pageId: Page) {
        switch (pageId) {
            case Page.Search:
                return 'answer';
            case Page.Answers:
                return 'answers';
            case Page.Pinboards:
                return 'pinboards';
            case Page.Data:
                return 'data/tables';
            case Page.Home:
            default:
                return 'home';
        }
    }

    public render({ pageId }: AppRenderOptions): AppEmbed {
        super.render();

        const pageRoute = this.getPageRoute(pageId);
        const src = this.getIFrameSrc(pageRoute);
        this.renderV1Embed(src);

        return this;
    }
}

export { init, SearchEmbed, PinboardEmbed, AppEmbed };
