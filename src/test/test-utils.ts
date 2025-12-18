import { has } from 'lodash';
import { version } from '../../package.json';
import { Action, AuthType } from '../types';

/**
 Initialises fetch to the global object
 */
if (!(global.fetch as any).mockResponse) {
    console.log('mocking fetch');
    global.fetch = jest.fn(() => Promise.resolve({
        json: () => Promise.resolve({ mixpanelAccessToken: '' }),
    } as Response));
}

export const defaultParamsWithoutHiddenActions = `hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=${AuthType.None}&blockNonEmbedFullAppAccess=true`;
export const defaultParams = `&${defaultParamsWithoutHiddenActions}&hideAction=[%22${Action.ReportError}%22]`;
export const defaultParamsForPinboardEmbed = `hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=None&blockNonEmbedFullAppAccess=true&hideAction=[%22${Action.ReportError}%22]`;
export const getDocumentBody = () => '<div id="embed"></div><div id="embed-2"></div>';

type DOMElement = HTMLElement | Document;

export const getRootEl = () => document.getElementById('embed');

export const getRootEl2 = () => document.getElementById('embed-2');

export const getIFrameEl = (container: DOMElement = document) => container.querySelector('iframe');

export const getAllIframeEl = () => document.querySelectorAll('iframe');

export const getIFrameSrc = (container: DOMElement = document) => getIFrameEl(container).src;

export const waitFor = (fn: () => boolean): Promise<void> => new Promise((resolve) => {
    const interval = setInterval(() => {
        const value = fn();
        if (value) {
            clearInterval(interval);
            resolve();
        }
    }, 100);
});

/**
 * jsdom does not set event source, therefore we do it
 * programmatically and use dispatchEvent instead of the
 * postMessage API
 * Reference: https://github.com/jsdom/jsdom/issues/2745
 * @param window
 * @param data
 * @param port
 */
export const postMessageToParent = (window: WindowProxy, data: any, port?: any) => {
    const message = new MessageEvent('message', {
        data,
        source: window,
        ports: [port],
    });
    window.parent.dispatchEvent(message);
};

/**
 * Execute a given function after a certain time has elapsed
 * @param fn The function to be executed after the wait period
 * @param waitTime The wait period in milliseconds
 */
export const executeAfterWait = (
    fn: (...args: any[]) => void,
    waitTime = 0,
) => new Promise((resolve, reject) => {
    setTimeout(() => {
        const value = fn();
        resolve(value);
    }, waitTime);
});

/**
 * Time (in milliseconds) to wait for async events to be triggered
 */
export const EVENT_WAIT_TIME = 1000;

/**
 *
 * @param str
 */
export function fixedEncodeURI(str: string) {
    return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
}

/**
 * MessageChannel is available in Node > 15.0.0. Since the current node
 * environment's used for github actions is not above 14, we are mocking this
 * for the current unit tests.
 */
export const messageChannelMock: any = {
    port1: {},
    port2: {},
};
export const mockMessageChannel = () => {
    messageChannelMock.port1.close = jest.fn();
    messageChannelMock.port2.onmessage = jest.fn();
    window.MessageChannel = function MessageChannelMock() {
        return messageChannelMock;
    } as any;
};

export const expectUrlMatchesWithParams = (source: string, target: string) => {
    const sourceUrl = new URL(source);
    const targetUrl = new URL(target);
    expect(sourceUrl.origin).toBe(targetUrl.origin);
    expect(sourceUrl.pathname).toBe(targetUrl.pathname);
    const sourceParamsObj = Object.fromEntries(sourceUrl.searchParams);
    const targetParamsObj = Object.fromEntries(targetUrl.searchParams);
    expect(sourceParamsObj).toMatchObject(targetParamsObj);

    const sourceHashParams = getHashQueryParams(sourceUrl.hash);
    const targetHashParams = getHashQueryParams(targetUrl.hash);
    expect(sourceHashParams).toMatchObject(targetHashParams);
};

export const expectUrlToHaveParamsWithValues = (
    url: string, paramsWithValues: Record<string, any>,
) => {
    const urlObj = new URL(url);
    const urlParams = Object.fromEntries(urlObj.searchParams);

    const sourceHashParams = getHashQueryParams(urlObj.hash);
    const sourceParams = {
        ...urlParams, ...sourceHashParams,
    };

    Object.entries(paramsWithValues).forEach(([key, value]) => {
        expect(has(sourceParams, key)).toBeTruthy();
        expect(`${sourceParams[key]}`).toBe(`${value}`);
    });
};

export const expectUrlMatch = (source: string, target: string) => {
    expectUrlMatchesWithParams(source, target);
    const sourceUrl = new URL(source);
    const targetUrl = new URL(target);
    expect(sourceUrl.hash).toBe(targetUrl.hash);
};

export const createRootEleForEmbed = () => {
    const rootEle = document.createElement('div');
    rootEle.id = 'myRoot';
    const tsEmbedDiv = document.createElement('div');
    tsEmbedDiv.id = 'tsEmbedDiv';
    rootEle.appendChild(tsEmbedDiv);
    document.body.appendChild(rootEle);
};

export const getHashQueryParams = (hash: string): any => {
    const params = hash.split('?')[1];
    const hashParams = new URLSearchParams(params);
    return Object.fromEntries(hashParams);
};

export const mockSessionInfo = {
    userGUID: '1234',
    mixpanelToken: 'abc123',
    isPublicUser: false,
    sessionId: '6588e7d9-710c-453e-a7b4-535fb3a8cbb2',
    genNo: 3,
    acSession: {
        sessionId: 'cb202c48-b14b-4466-8a70-899ea666d46q',
        genNo: 5,
    },
};
