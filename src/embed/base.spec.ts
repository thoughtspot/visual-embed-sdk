import EventEmitter from 'eventemitter3';
import * as auth from '../auth';
import * as index from '../index';
import * as base from './base';
import {
    executeAfterWait,
    getAllIframeEl,
    getDocumentBody,
    getRootEl,
    getRootEl2,
    getIFrameSrc,
} from '../test/test-utils';

const thoughtSpotHost = 'tshost';
let authEE: EventEmitter;

describe('Base TS Embed', () => {
    beforeAll(() => {
        authEE = index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
        });
    });

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('Should show an alert when third party cookie access is blocked', (done) => {
        const tsEmbed = new index.SearchEmbed(getRootEl(), {});
        const iFrame: any = document.createElement('div');
        iFrame.contentWindow = null;
        /* This will return a div instead of HTMLIframeElement in ts-embed.ts
         * so that the promise doesn't fail on url assigment
         */
        jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);
        tsEmbed.render();

        window.postMessage(
            {
                __type: index.EmbedEvent.NoCookieAccess,
            },
            '*',
        );
        jest.spyOn(window, 'alert').mockReset();
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        authEE.on(auth.AuthStatus.FAILURE, (reason) => {
            expect(reason).toEqual(auth.AuthFailureType.NO_COOKIE_ACCESS);
            expect(window.alert).toBeCalledWith(
                'Third party cookie access is blocked on this browser, please allow third party cookies for this to work properly. \nYou can use `suppressNoCookieAccessAlert` to suppress this message.',
            );
            done();
        });
    });

    test('Should add the prefetch iframe when prefetch is called. Should remove it once init is called.', async () => {
        const url = 'https://10.87.90.95/';
        index.prefetch(url);
        expect(getAllIframeEl().length).toBe(1);
        const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>(
            '.prefetchIframe',
        );
        expect(prefetchIframe.length).toBe(1);
        const firstIframe = <HTMLIFrameElement>prefetchIframe[0];
        expect(firstIframe.src).toBe(url);
    });

    test('Should not generate a prefetch iframe when url is empty string', async () => {
        const url = '';
        index.prefetch(url);
        expect(getAllIframeEl().length).toBe(0);
        const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>(
            '.prefetchIframe',
        );
        expect(prefetchIframe.length).toBe(0);
    });

    test('Should not call prefetch inside init when callPrefetch is set to false', async () => {
        const prefetch = jest.spyOn(index, 'prefetch');
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            callPrefetch: false,
        });

        expect(prefetch).toHaveBeenCalledTimes(0);
    });

    test('Sets the disableLoginRedirect param when autoLogin is true', async () => {
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            autoLogin: true,
        });
        const tsEmbed = new index.AppEmbed(getRootEl(), {});
        await tsEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toContain('disableLoginRedirect=true');
        });
    });

    test('handleAuth notifies for SDK auth failure', (done) => {
        jest.spyOn(auth, 'authenticate').mockResolvedValue(false);
        const authEmitter = index.init({
            thoughtSpotHost,
            authType: index.AuthType.Basic,
            username: 'test',
            password: 'test',
        });
        authEmitter.on(auth.AuthStatus.FAILURE, (reason) => {
            expect(reason).toBe(auth.AuthFailureType.SDK);
            done();
        });
    });

    test('handleAuth notifies for SDK auth success', (done) => {
        jest.spyOn(auth, 'authenticate').mockResolvedValue(true);
        const failureCallback = jest.fn();
        const authEmitter = index.init({
            thoughtSpotHost,
            authType: index.AuthType.Basic,
            username: 'test',
            password: 'test',
        });

        authEmitter.on(auth.AuthStatus.FAILURE, failureCallback);
        authEmitter.on(auth.AuthStatus.SDK_SUCCESS, (reason) => {
            expect(failureCallback).not.toBeCalled();
            expect(reason).toBe(undefined);
            done();
        });
    });

    test('Logout method should disable autoLogin', () => {
        jest.spyOn(window, 'fetch').mockResolvedValue({
            type: 'opaque',
        });
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            autoLogin: true,
        });
        index.logout();
        expect(window.fetch).toHaveBeenCalledWith(
            `http://${thoughtSpotHost}${auth.EndPoints.LOGOUT}`,
            {
                credentials: 'include',
                headers: {
                    'x-requested-by': 'ThoughtSpot',
                },
                method: 'POST',
            },
        );
        expect(base.getEmbedConfig().autoLogin).toBe(false);
    });
});

describe('Base without init', () => {
    test('notify should error when called without init', () => {
        base.reset();
        jest.spyOn(global.console, 'error').mockImplementation(() => undefined);
        base.notifyAuthSuccess();
        base.notifyAuthFailure(auth.AuthFailureType.SDK);
        base.notifyLogout();
        expect(global.console.error).toHaveBeenCalledTimes(3);
    });
});
