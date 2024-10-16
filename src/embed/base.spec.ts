/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
import EventEmitter from 'eventemitter3';
import { EmbedConfig } from '../index';
import * as auth from '../auth';
import * as authService from '../utils/authService/authService';
import * as authTokenService from '../authToken';
import * as index from '../index';
import * as base from './base';
import * as embedConfigInstance from './embedConfig';

import {
    executeAfterWait,
    getAllIframeEl,
    getDocumentBody,
    getRootEl,
    getIFrameSrc,
} from '../test/test-utils';
import * as tokenizedFetchInstance from '../tokenizedFetch';
import { logger } from '../utils/logger';

const thoughtSpotHost = 'tshost';
let authEE: EventEmitter;

describe('Base TS Embed', () => {
    beforeAll(() => {
        authEE = index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
        }) as EventEmitter;
        jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve({}));
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

    test('Should ignore cookie blocked alert if ignoreNoCookieAccess is true', async (done) => {
        jest.spyOn(window, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
        });
        const authEE = index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            ignoreNoCookieAccess: true,
        });
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
            expect(window.alert).not.toHaveBeenCalled();
            done();
        });
    });

    test('should call the executeTML API and import TML', async () => {
        jest.spyOn(window, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
        });
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            autoLogin: true,
        });
        const data: base.executeTMLInput = {
            metadata_tmls: ['{"liveboard":{"name":"Parameters Liveboard"}}'],
            import_policy: 'PARTIAL',
            create_new: false,
        };
        await index.executeTML(data);
        expect(window.fetch).toHaveBeenCalledWith(
            `http://${thoughtSpotHost}${authService.EndPoints.EXECUTE_TML}`,
            {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-requested-by': 'ThoughtSpot',
                },
                body: JSON.stringify(data),
                method: 'POST',
            },
        );
    });

    test('should call the executeTML API and import TML for cookiless auth', async () => {
        jest.spyOn(authTokenService, 'getAuthenticationToken').mockResolvedValue('mockAuthToken');
        jest.spyOn(tokenizedFetchInstance, 'tokenizedFetch').mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
        });
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.TrustedAuthTokenCookieless,
            autoLogin: true,
        });
        const data: base.executeTMLInput = {
            metadata_tmls: ['{"liveboard":{"name":"Parameters Liveboard"}}'],
            import_policy: 'PARTIAL',
            create_new: false,
        };
        await index.executeTML(data);
        expect(tokenizedFetchInstance.tokenizedFetch).toHaveBeenCalledWith(
            `http://${thoughtSpotHost}${authService.EndPoints.EXECUTE_TML}`,
            {
                credentials: 'include',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'x-requested-by': 'ThoughtSpot',
                }),
                body: JSON.stringify(data),
                method: 'POST',
            },
        );
    });

    test('should log an error when executing TML fails', async () => {
        jest.spyOn(window, 'fetch').mockRejectedValue(new Error('Network error'));

        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            autoLogin: true,
        });
        const data: base.executeTMLInput = {
            metadata_tmls: ['{"liveboard":{"name":"Parameters Liveboard"}}'],
            import_policy: 'PARTIAL',
            create_new: false,
        };
        try {
            await index.executeTML(data);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Network error');
        }
    });

    test('should reject with an error when sanity check fails', async () => {
        const error = new Error('ThoughtSpot host not provided');

        const data: base.executeTMLInput = {
            metadata_tmls: ['{"liveboard":{"name":"Parameters Liveboard"}}'],
            import_policy: 'PARTIAL',
            create_new: false,
        };
        base.reset();

        try {
            await index.executeTML(data);
        } catch (err) {
            expect(err).toEqual(error);
        }
    });

    test('should call the exportTML API and export TML', async () => {
        jest.spyOn(tokenizedFetchInstance, 'tokenizedFetch').mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
        });
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            autoLogin: true,
        });
        const data: base.exportTMLInput = {
            metadata: [{ identifier: 'f5728369-cf02-4953-87ab-a6cac691e360' }],
            export_associated: false,
            export_fqn: false,
            edoc_format: 'YAML',
        };
        await index.exportTML(data);
        expect(tokenizedFetchInstance.tokenizedFetch).toHaveBeenCalledWith(
            `http://${thoughtSpotHost}${authService.EndPoints.EXPORT_TML}`,
            {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-requested-by': 'ThoughtSpot',
                },
                body: JSON.stringify(data),
                method: 'POST',
            },
        );
    });

    test('should log an error when exeporting TML fails', async () => {
        jest.spyOn(window, 'fetch').mockRejectedValue(new Error('Network error'));

        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            autoLogin: true,
        });
        const data: base.exportTMLInput = {
            metadata: [{ identifier: 'f5728369-cf02-4953-87ab-a6cac691e360' }],
            export_associated: false,
            export_fqn: false,
            edoc_format: 'YAML',
        };
        try {
            await index.exportTML(data);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Network error');
        }
    });

    test('Should add the prefetch iframe when prefetch is called. Should remove it once init is called.', async () => {
        const url = 'https://10.87.90.95/';
        index.init({
            thoughtSpotHost: url,
            authType: index.AuthType.None,
            callPrefetch: true,
        });
        expect(getAllIframeEl().length).toBe(1);
        const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>('.prefetchIframe');
        expect(prefetchIframe.length).toBe(1);
        const firstIframe = <HTMLIFrameElement>prefetchIframe[0];
        expect(firstIframe.src).toBe(url);
        expect(firstIframe.style.width).toBe('0px');
        expect(firstIframe.classList.contains('prefetchIframeNum-0')).toBe(true);
    });

    test('Should add the prefetch iframe when prefetch is called with multiple options', async () => {
        const url = 'https://10.87.90.95/';
        const searchUrl = `${url}v2/#/embed/answer`;
        const liveboardUrl = url;
        index.prefetch(url, [
            index.PrefetchFeatures.SearchEmbed,
            index.PrefetchFeatures.LiveboardEmbed,
        ]);
        expect(getAllIframeEl().length).toBe(2);
        const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>('.prefetchIframe');
        expect(prefetchIframe.length).toBe(2);
        const firstIframe = <HTMLIFrameElement>prefetchIframe[0];
        expect(firstIframe.src).toBe(searchUrl);
        const secondIframe = <HTMLIFrameElement>prefetchIframe[1];
        expect(secondIframe.src).toBe(liveboardUrl);
    });

    test('Should not generate a prefetch iframe when url is empty string', async () => {
        const url = '';
        index.prefetch(url);
        expect(getAllIframeEl().length).toBe(0);
        const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>('.prefetchIframe');
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
        authEmitter.on(auth.AuthStatus.SDK_SUCCESS, (...args) => {
            expect(failureCallback).not.toBeCalled();
            expect(args.length).toBe(0);
            done();
        });
    });

    test('Logout method should disable autoLogin', () => {
        jest.spyOn(window, 'fetch').mockResolvedValueOnce({
            type: 'opaque',
        });
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            autoLogin: true,
        });
        index.logout();
        expect(window.fetch).toHaveBeenCalledWith(
            `http://${thoughtSpotHost}${authService.EndPoints.LOGOUT}`,
            {
                credentials: 'include',
                headers: {
                    'x-requested-by': 'ThoughtSpot',
                },
                method: 'POST',
            },
        );
        expect(embedConfigInstance.getEmbedConfig().autoLogin).toBe(false);
    });

    test('config sanity, no ts host', () => {
        expect(() => {
            index.init({
                authType: index.AuthType.None,
            } as EmbedConfig);
        }).toThrowError();
    });

    test('config sanity, no username in trusted auth', () => {
        expect(() => {
            index.init({
                authType: index.AuthType.TrustedAuthToken,
                thoughtSpotHost,
            } as EmbedConfig);
        }).toThrowError();
    });

    test('config sanity, no authEndpoint and getAuthToken', () => {
        expect(() => {
            index.init({
                authType: index.AuthType.TrustedAuthToken,
                thoughtSpotHost,
                username: 'test',
            });
        }).toThrowError();
    });
    test('config backward compat, should assign inPopup when noRedirect is set', () => {
        index.init({
            authType: index.AuthType.None,
            thoughtSpotHost,
            noRedirect: true,
        });
        expect(embedConfigInstance.getEmbedConfig().inPopup).toBe(true);
    });
    test('config backward compat, should not override inPopup with noRedirect', () => {
        index.init({
            authType: index.AuthType.None,
            thoughtSpotHost,
            noRedirect: true,
            inPopup: false,
        });
        expect(embedConfigInstance.getEmbedConfig().inPopup).toBe(false);
    });
    test('@P0 @SCAL-226935 embedConfig should contain correct value of customCSSUrl when added in init ', async () => {
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            customizations: {
                style: {
                    customCSSUrl: 'test.com',
                },
            },
        });
        expect(embedConfigInstance.getEmbedConfig().customizations.style.customCSSUrl).toEqual('test.com');
    });
});

describe('Base without init', () => {
    test('notify should error when called without init', () => {
        base.reset();
        jest.spyOn(logger, 'error').mockImplementation(() => undefined);
        base.notifyAuthSuccess();
        base.notifyAuthFailure(auth.AuthFailureType.SDK);
        base.notifyLogout();
        base.notifyAuthSDKSuccess();
        expect(logger.error).toHaveBeenCalledTimes(4);
    });
});
