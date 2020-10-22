export enum AuthType {
    SSO = 'SSO',
    AuthServer = 'AuthServer',
}

export interface EmbedConfig {
    thoughtSpotHost: string;
    authType: AuthType;
    authEndpoint?: string;
}

export interface LayoutConfig {}
export interface FrameParams {
    width?: number;
    height?: number;
}

export interface ViewConfig {
    layoutConfig?: LayoutConfig;
    frameParams?: FrameParams;
    theme?: string;
    styleSheet__unstable?: string;
}

export type MessagePayload = { data: any };
export type MessageCallback = (event: MessagePayload) => void;

export type QueryObject = any;

let config = {};

const init = (embedConfig: EmbedConfig) => {
    config = embedConfig;
};

class TsEmbed {
    private el: Element;

    constructor(domSelector: string) {
        this.el = document.querySelector(domSelector);
    }

    public on(messageType: string, callback: MessageCallback) {
        // TODO: implement
        return this;
    }

    public trigger(messageType: string, data: MessagePayload) {
        // TODO: implement
        return this;
    }
}

class SearchEmbed extends TsEmbed {
    private viewConfig: ViewConfig;
    private id: string;

    constructor(domSelector: string, viewConfig: ViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
        this.id = `${Math.random()}`; // TODO: generate GUID instead
    }

    public getId() {
        return this.id;
    }

    public render(dataSources: string[], query: QueryObject, answerId: string) {
        // TODO: implement
        return this;
    }
}

export { init, SearchEmbed };
