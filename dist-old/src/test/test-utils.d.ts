export declare const defaultParamsWithoutHiddenActions: string;
export declare const defaultParams: string;
export declare const defaultParamsForPinboardEmbed: string;
export declare const getDocumentBody: () => string;
type DOMElement = HTMLElement | Document;
export declare const getRootEl: () => HTMLElement;
export declare const getRootEl2: () => HTMLElement;
export declare const getIFrameEl: (container?: DOMElement) => HTMLIFrameElement;
export declare const getAllIframeEl: () => NodeListOf<HTMLIFrameElement>;
export declare const getIFrameSrc: (container?: DOMElement) => string;
export declare const waitFor: (fn: () => boolean) => Promise<void>;
/**
 * jsdom does not set event source, therefore we do it
 * programmatically and use dispatchEvent instead of the
 * postMessage API
 * Reference: https://github.com/jsdom/jsdom/issues/2745
 * @param window
 * @param data
 * @param port
 */
export declare const postMessageToParent: (window: WindowProxy, data: any, port?: any) => void;
/**
 * Execute a given function after a certain time has elapsed
 * @param fn The function to be executed after the wait period
 * @param waitTime The wait period in milliseconds
 */
export declare const executeAfterWait: (fn: (...args: any[]) => void, waitTime?: number) => Promise<unknown>;
/**
 * Time (in milliseconds) to wait for async events to be triggered
 */
export declare const EVENT_WAIT_TIME = 1000;
/**
 *
 * @param str
 */
export declare function fixedEncodeURI(str: string): string;
/**
 * MessageChannel is available in Node > 15.0.0. Since the current node
 * environment's used for github actions is not above 14, we are mocking this
 * for the current unit tests.
 */
export declare const messageChannelMock: any;
export declare const mockMessageChannel: () => void;
export declare const expectUrlMatchesWithParams: (source: string, target: string) => void;
export declare const expectUrlToHaveParamsWithValues: (url: string, paramsWithValues: Record<string, any>) => void;
export declare const expectUrlMatch: (source: string, target: string) => void;
export declare const createRootEleForEmbed: () => void;
export declare const getHashQueryParams: (hash: string) => any;
export declare const mockSessionInfo: {
    userGUID: string;
    mixpanelToken: string;
    isPublicUser: boolean;
    sessionId: string;
    genNo: number;
    acSession: {
        sessionId: string;
        genNo: number;
    };
};
export declare const testVisualOverridesInEmbed: (embed: any, visualOverrides: any) => Promise<void>;
export {};
//# sourceMappingURL=test-utils.d.ts.map