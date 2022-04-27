/**
 Initialises fetch to the global object
*/
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => ({ mixpanelAccessToken: '' }),
    }),
);

export const getDocumentBody = () =>
    '<div id="embed"></div><div id="embed-2"></div>';

type DOMElement = HTMLElement | Document;

export const getRootEl = () => document.getElementById('embed');

export const getRootEl2 = () => document.getElementById('embed-2');

export const getIFrameEl = (container: DOMElement = document) =>
    container.querySelector('iframe');

export const getAllIframeEl = () => document.querySelectorAll('iframe');

export const getIFrameSrc = (container: DOMElement = document) =>
    getIFrameEl(container).src;

/**
 * jsdom does not set event source, therefore we do it
 * programmatically and use dispatchEvent instead of the
 * postMessage API
 * Reference: https://github.com/jsdom/jsdom/issues/2745
 * @param window
 * @param data
 */
export const postMessageToParent = (
    window: WindowProxy,
    data: any,
    port?: any,
) => {
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
) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const value = fn();
            resolve(value);
        }, waitTime);
    });
};

/**
 * Time (in milliseconds) to wait for async events to be triggered
 */
export const EVENT_WAIT_TIME = 1000;

export function fixedEncodeURI(str: string) {
    return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
}
