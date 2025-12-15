/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
import EventEmitter from 'eventemitter3';
import { EmbedConfig } from '../index';
import * as auth from '../auth';
import * as authService from '../utils/authService/authService';
import * as tokenAuthServices from '../utils/authService/tokenizedAuthService';
import * as authTokenService from '../authToken';
import * as index from '../index';
import * as base from './base';
import * as embedConfigInstance from './embedConfig';
import * as resetService from '../utils/resetServices';
import * as processTrigger from '../utils/processTrigger';
import { createAndSetInitPromise, getInitPromise, getIsInitCalled, reloadIframe } from './base';

import {
    executeAfterWait,
    getAllIframeEl,
    getDocumentBody,
    getRootEl,
    getIFrameSrc,
} from '../test/test-utils';
import * as tokenizedFetchInstance from '../tokenizedFetch';
import { logger } from '../utils/logger';
import { ERROR_MESSAGE } from '../errors';

const thoughtSpotHost = 'tshost';
let authEE: EventEmitter;

describe('Base TS Embed', () => {
    beforeAll(() => {
        authEE = index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
        }) as EventEmitter;
        jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
    });

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('Should show an alert when third party cookie access is blocked', () => {
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
            expect(window.alert).toHaveBeenCalledWith(
                'Third-party cookie access is blocked on this browser. Please allow third-party cookies for this to work properly. \nYou can use `suppressNoCookieAccessAlert` to suppress this message.',
            );
        });
    });

    test('Should ignore cookie blocked alert if ignoreNoCookieAccess is true', async () => {
        jest.spyOn(window, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
        } as any);
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
        });
    });

    test('should call the executeTML API and import TML', async () => {
        jest.spyOn(window, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
        } as any);
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

    test('should call reload with the provided iframe', () => {
        // Arrange
        const iFrameElement = document.createElement('iframe');
        const html = '<body>Foo</body>';
        iFrameElement.src = `data:text/html;charset=utf-8,${encodeURI(html)}`;
        const spyReload = jest.spyOn(processTrigger, 'reload');

        // Act
        reloadIframe(iFrameElement);

        // Assert
        expect(spyReload).toHaveBeenCalledWith(iFrameElement);
    });

    test('should warn when called without an iframe element', () => {
        // Arrange
        const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

        // Act
        (reloadIframe as any)(undefined);

        // Assert
        expect(warnSpy).toHaveBeenCalledWith('reloadIframe called with no iFrame element.');
    });
    

    test('should call the executeTML API and import TML for cookiless auth', async () => {
        jest.spyOn(authTokenService, 'getAuthenticationToken').mockResolvedValue('mockAuthToken');
        jest.spyOn(tokenizedFetchInstance, 'tokenizedFetch').mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
        } as any);
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
        } as any);
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
        const url = 'https://10.87.90.95/?embedApp=true';
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
        const searchUrl = `${url}v2/?embedApp=true#/embed/answer`;
        const liveboardUrl = `${url}?embedApp=true`;
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

    test('Should add the prefetch iframe with additionalFlags', async () => {
        const url = 'https://10.87.90.95/';
        const searchUrl = `${url}v2/?embedApp=true&flag2=bool&flag3=block&flag1=true#/embed/answer`;
        const liveboardUrl = `${url}?embedApp=true&flag2=bool&flag3=block&flag1=true`;
        base.init({
            thoughtSpotHost: url,
            authType: index.AuthType.None,
            additionalFlags: {
                flag2: 'bar',
                flag3: 'block',
            },
        });
        index.prefetch(url, [
            index.PrefetchFeatures.SearchEmbed,
            index.PrefetchFeatures.LiveboardEmbed,
        ],
        { flag1: true, flag2: 'bool' });
        expect(getAllIframeEl().length).toBe(2);
        const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>('.prefetchIframe');
        expect(prefetchIframe.length).toBe(2);
        const firstIframe = <HTMLIFrameElement>prefetchIframe[0];
        expect(firstIframe.src).toBe(searchUrl);
        const secondIframe = <HTMLIFrameElement>prefetchIframe[1];
        expect(secondIframe.src).toBe(liveboardUrl);
    });

    test('Should add the prefetch iframe with additionalFlags for prefetch from init', async () => {
        const url = 'https://10.87.90.95/';
        const prefetchUrl = `${url}?embedApp=true&flag2=bar&flag3=block`;
        base.init({
            thoughtSpotHost: url,
            authType: index.AuthType.None,
            additionalFlags: {
                flag2: 'bar',
                flag3: 'block',
            },
            callPrefetch: true,
        });
        expect(getAllIframeEl().length).toBe(1);
        const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>('.prefetchIframe');
        expect(prefetchIframe.length).toBe(1);
        const firstIframe = <HTMLIFrameElement>prefetchIframe[0];
        expect(firstIframe.src).toBe(prefetchUrl);
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

    test('handleAuth notifies for SDK auth failure', () => {
        jest.spyOn(auth, 'authenticate').mockResolvedValue(false);
        const authEmitter = index.init({
            thoughtSpotHost,
            authType: index.AuthType.Basic,
            username: 'test',
            password: 'test',
        });
        authEmitter.on(auth.AuthStatus.FAILURE, (reason) => {
            expect(reason).toBe(auth.AuthFailureType.SDK);
        });
    });

    test('handleAuth notifies for SDK auth success', () => {
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
            expect(failureCallback).not.toHaveBeenCalled();
            expect(args.length).toBe(0);
        });
    });

    test('Logout method should disable autoLogin', () => {
        jest.spyOn(window, 'fetch').mockResolvedValueOnce({
            type: 'opaque',
        } as any);
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

    test('Logout method should reset caches', async () => {
        jest.spyOn(tokenAuthServices, 'fetchLogoutService').mockResolvedValueOnce({});
        jest.spyOn(resetService, 'resetAllCachedServices');
        index.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
            autoLogin: true,
        });
        expect(resetService.resetAllCachedServices).toHaveBeenCalledTimes(1);
        await index.logout();
        expect(resetService.resetAllCachedServices).toHaveBeenCalledTimes(2);
    });

    test('config sanity, no ts host', () => {
        expect(() => {
            index.init({
                authType: index.AuthType.None,
            } as EmbedConfig);
        }).toThrow();
    });

    test('config sanity, no username in trusted auth', () => {
        expect(() => {
            index.init({
                authType: index.AuthType.TrustedAuthToken,
                thoughtSpotHost,
            } as EmbedConfig);
        }).toThrow();
    });

    test('config sanity, no authEndpoint and getAuthToken', () => {
        expect(() => {
            index.init({
                authType: index.AuthType.TrustedAuthToken,
                thoughtSpotHost,
                username: 'test',
            });
        }).toThrow();
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

describe('Init tests', () => {
    test('clear caches on init', () => {
        jest.spyOn(resetService, 'resetAllCachedServices');
        base.init({
            thoughtSpotHost,
            authType: index.AuthType.None,
        });
        expect(resetService.resetAllCachedServices).toHaveBeenCalled();
    });
});

describe('Init Promise Functions', () => {
    describe('SSR environment handling', () => {
        let originalWindow: typeof globalThis.window;

        beforeEach(() => {
            originalWindow = global.window;
            });

        afterEach(() => {
            global.window = originalWindow;
        });

        test('createAndSetInitPromise should log error in SSR environment', () => {
            delete global.window;
            
            createAndSetInitPromise();
            
            expect(logger.error).toHaveBeenCalledWith(
                ERROR_MESSAGE.SSR_ENVIRONMENT_ERROR
            );
        });

        test('init should log error and return null in SSR environment', () => {
            delete global.window;
            
            const result = base.init({
                thoughtSpotHost: 'tshost',
                authType: index.AuthType.None,
            });
            
            expect(logger.error).toHaveBeenCalledWith(
                ERROR_MESSAGE.SSR_ENVIRONMENT_ERROR
            );
            expect(result).toBeNull();
        });
    });
    beforeEach(() => {
        base.reset();
        (window as any)._tsEmbedSDK = {};
        createAndSetInitPromise();
    });

    test('getIsInitCalled should return false before init is called', () => {
        expect(getIsInitCalled()).toBe(false);
    });

    test('getIsInitCalled should return true after init is called', () => {
        base.init({
            thoughtSpotHost: 'tshost',
            authType: index.AuthType.None,
        });
        expect(getIsInitCalled()).toBe(true);
    });

    test('getInitPromise should return a promise', () => {
        const promise = getInitPromise();
        expect(promise).toBeInstanceOf(Promise);
    });

    test('getInitPromise should resolve with authEE after init is called', async () => {
        const initPromise = getInitPromise();
        const authEE = base.init({
            thoughtSpotHost: 'tshost',
            authType: index.AuthType.None,
        });
        const resolvedValue = await initPromise;
        expect(resolvedValue).toBe(authEE);
    });

    test('createAndSetInitPromise should not override existing promise if ignoreIfAlreadyExists', () => {
        const firstPromise = getInitPromise();
        createAndSetInitPromise();
        const secondPromise = getInitPromise();
        expect(firstPromise).toBe(secondPromise);
    });
});