import 'jest-fetch-mock';
import * as authInstance from './auth';
import * as authTokenService from './authToken';
import * as EmbedConfig from './embed/embedConfig';
import * as mixPanelService from './mixpanel-service';
import { executeAfterWait, mockSessionInfo } from './test/test-utils';
import { AuthType, EmbedEvent } from './types';
import * as checkReleaseVersionInBetaInstance from './utils';
import * as authService from './utils/authService/authService';
import * as tokenAuthService from './utils/authService/tokenizedAuthService';
import { logger } from './utils/logger';
import * as SessionService from './utils/sessionInfoService';

const thoughtSpotHost = 'http://localhost:3000';
const username = 'tsuser';
const password = '12345678';
const samalLoginUrl = `${thoughtSpotHost}/callosum/v1/saml/login?targetURLPath=%23%3FtsSSOMarker%3D5e16222e-ef02-43e9-9fbd-24226bf3ce5b`;

export const embedConfig: any = {
    doTokenAuthSuccess: (token: string) => ({
        thoughtSpotHost,
        username,
        authEndpoint: 'auth',
        authType: AuthType.TrustedAuthToken,
        getAuthToken: jest.fn(() => Promise.resolve(token)),
    }),
    doTokenAuthWithCookieDetect: {
        thoughtSpotHost,
        username,
        authEndpoint: 'auth',
        detectCookieAccessSlow: true,
    },
    doTokenAuthFailureWithoutAuthEndPoint: {
        thoughtSpotHost,
        username,
        authEndpoint: '',
        getAuthToken: null,
    },
    doTokenAuthFailureWithoutGetAuthToken: {
        thoughtSpotHost,
        username,
        authEndpoint: 'auth',
        getAuthToken: null,
    },
    doBasicAuth: {
        thoughtSpotHost,
        username,
        password,
    },
    doSamlAuth: {
        thoughtSpotHost,
    },
    doSamlAuthNoRedirect: {
        thoughtSpotHost,
        inPopup: true,
        authTriggerContainer: document.body,
        authTriggerText: 'auth',
    },
    doOidcAuth: {
        thoughtSpotHost,
    },
    SSOAuth: {
        authType: AuthType.SSO,
    },
    SAMLAuth: {
        authType: AuthType.SAML,
    },
    OIDCAuth: {
        authType: AuthType.OIDC,
    },
    authServerFailure: {
        thoughtSpotHost,
        username,
        authEndpoint: '',
        getAuthToken: null,
        authType: AuthType.AuthServer,
    },
    authServerCookielessFailure: {
        thoughtSpotHost,
        username,
        authEndpoint: '',
        getAuthToken: null,
        authType: AuthType.TrustedAuthTokenCookieless,
    },
    basicAuthSuccess: {
        thoughtSpotHost,
        username,
        password,
        authType: AuthType.Basic,
    },
    nonAuthSucess: {
        thoughtSpotHost,
        username,
        password,
        authType: AuthType.None,
    },
    doCookielessAuth: (token: string) => ({
        thoughtSpotHost,
        username,
        authType: AuthType.TrustedAuthTokenCookieless,
        getAuthToken: jest.fn(() => Promise.resolve(token)),
    }),
};

const originalWindow = window;

export const mockSessionInfoApiResponse = {
    userGUID: '1234',
    releaseVersion: 'test',
    configInfo: {
        isPublicUser: false,
        mixpanelConfig: {
            production: true,
            devSdkKey: 'devKey',
            prodSdkKey: 'prodKey',
        },
    },
};

describe('Unit test for auth', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        global.fetch = window.fetch;
    });
    afterEach(() => {
        authTokenService.resetCachedAuthToken();
        SessionService.resetCachedSessionInfo();
    });
    test('endpoints, SAML_LOGIN_TEMPLATE', () => {
        const ssoTemplateUrl = authService.EndPoints.SAML_LOGIN_TEMPLATE(thoughtSpotHost);
        expect(ssoTemplateUrl).toBe(`/callosum/v1/saml/login?targetURLPath=${thoughtSpotHost}`);
    });

    test('when session info giving response, it is cached', async () => {
        jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockResolvedValueOnce(mockSessionInfoApiResponse);
        const sessionInfo = await SessionService.getSessionInfo();
        expect(sessionInfo.mixpanelToken).toEqual('prodKey');
        expect(sessionInfo.isPublicUser).toEqual(false);
        await SessionService.getSessionInfo();
        expect(tokenAuthService.fetchSessionInfoService).toHaveBeenCalledTimes(1);
    });

    test('Disable mixpanel when disableSDKTracking flag is set', () => {
        jest.spyOn(mixPanelService, 'initMixpanel');
        jest.spyOn(SessionService, 'getSessionInfo').mockReturnValue(mockSessionInfo);
        jest.spyOn(EmbedConfig, 'getEmbedConfig').mockReturnValue({ disableSDKTracking: true });
        authInstance.postLoginService();
        expect(mixPanelService.initMixpanel).not.toBeCalled();
    });

    test('doCookielessTokenAuth: when authEndpoint and getAuthToken are not there, it throw error', async () => {
        try {
            await authInstance.doCookielessTokenAuth(
                embedConfig.doTokenAuthFailureWithoutAuthEndPoint,
            );
        } catch (e) {
            expect(e.message).toBe(
                'Either auth endpoint or getAuthToken function must be provided',
            );
        }
    });

    test('doTokenAuth: when authEndpoint and getAuthToken are not there, it throw error', async () => {
        try {
            await authInstance.doTokenAuth(embedConfig.doTokenAuthFailureWithoutAuthEndPoint);
        } catch (e) {
            expect(e.message).toBe(
                'Either auth endpoint or getAuthToken function must be provided',
            );
        }
    });

    test('doTokenAuth: when user is loggedIn', async () => {
        const getAuthenticationTokenMock = jest.spyOn(authTokenService, 'getAuthenticationToken');
        jest.spyOn(tokenAuthService, 'isActiveService').mockImplementation(async () => true);
        await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess('authToken'));
        expect(authTokenService.getAuthenticationToken).not.toBeCalled();
        expect(authInstance.loggedInStatus).toBe(true);
        getAuthenticationTokenMock.mockRestore();
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken have response', async () => {
        jest.spyOn(tokenAuthService, 'isActiveService').mockImplementation(async () => false);
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() => Promise.resolve({
            status: 200,
            ok: true,
        }));
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
        await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess('authToken2'));
        expect(authService.fetchAuthService).toBeCalledWith(
            thoughtSpotHost,
            username,
            'authToken2',
        );
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken not present, isLoggedIn should called', async () => {
        fetchMock.mockResponse(JSON.stringify({ mixpanelAccessToken: '' }));
        jest.spyOn(tokenAuthService, 'isActiveService').mockImplementation(async () => false);
        jest.spyOn(authService, 'fetchAuthTokenService').mockImplementation(() => ({
            text: () => Promise.resolve('abc'),
        }));
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() => Promise.resolve({
            status: 200,
            ok: true,
        }));
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
        await authInstance.doTokenAuth(embedConfig.doTokenAuthFailureWithoutGetAuthToken);
        expect(authService.fetchAuthTokenService).toBeCalledWith('auth');
        await executeAfterWait(() => {
            expect(authInstance.loggedInStatus).toBe(true);
            expect(authService.fetchAuthService).toBeCalledWith(thoughtSpotHost, username, 'abc');
        });
    });

    test('doTokenAuth: Should raise error when duplicate token is used', async () => {
        jest.spyOn(tokenAuthService, 'isActiveService').mockImplementation(async () => false);
        jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockResolvedValue({
            status: 401,
        });
        jest.spyOn(window, 'alert').mockClear();
        jest.spyOn(window, 'alert').mockReturnValue(undefined);
        jest.spyOn(authService, 'fetchAuthService').mockReset();
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() => Promise.resolve({
            status: 200,
            ok: true,
        }));
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
        await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess('authToken3'));

        try {
            jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(false);
            await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess('authToken3'));
            expect(false).toBe(true);
        } catch (e) {
            expect(e.message).toContain('Duplicate token');
        }
        await executeAfterWait(() => {
            expect(authInstance.loggedInStatus).toBe(false);
            expect(window.alert).toBeCalled();
            expect(authService.fetchAuthService).toHaveBeenCalledTimes(1);
        });
    });

    test('doTokenAuth: Should set loggedInStatus if detectThirdPartyCookieAccess is true and the second info call fails', async () => {
        jest.spyOn(tokenAuthService, 'fetchSessionInfoService')
            .mockResolvedValue({
                status: 401,
            })
            .mockClear();
        jest.spyOn(authService, 'fetchAuthTokenService').mockImplementation(() => ({
            text: () => Promise.resolve('abc'),
        }));
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() => Promise.resolve({
            status: 200,
            ok: true,
        }));
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
        jest.spyOn(tokenAuthService, 'isActiveService').mockResolvedValueOnce(false);
        jest.spyOn(tokenAuthService, 'isActiveService').mockResolvedValueOnce(false);
        const isLoggedIn = await authInstance.doTokenAuth(embedConfig.doTokenAuthWithCookieDetect);
        expect(tokenAuthService.isActiveService).toHaveBeenCalledTimes(2);
        expect(isLoggedIn).toBe(false);
    });

    test('doTokenAuth: when user is not loggedIn & fetchAuthPostService failed than fetchAuthService should call', async () => {
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => false);
        jest.spyOn(authService, 'fetchAuthTokenService').mockImplementation(() => ({
            text: () => Promise.resolve('abc'),
        }));
        jest.spyOn(authService, 'fetchAuthPostService').mockImplementation(() =>
            // eslint-disable-next-line prefer-promise-reject-errors, implicit-arrow-linebreak
            Promise.reject({
                status: 500,
            }));
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() => Promise.resolve({
            status: 200,
            type: 'opaqueredirect',
        }));
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
        expect(await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess('authToken2'))).toBe(
            true,
        );
        expect(authService.fetchAuthPostService).toBeCalledWith(
            thoughtSpotHost,
            username,
            'authToken2',
        );
        expect(authService.fetchAuthService).toBeCalledWith(
            thoughtSpotHost,
            username,
            'authToken2',
        );
    });

    describe('doBasicAuth', () => {
        beforeEach(() => {
            global.fetch = window.fetch;
        });

        it('when user is loggedIn', async () => {
            jest.spyOn(tokenAuthService, 'isActiveService').mockResolvedValueOnce(true);
            await authInstance.doBasicAuth(embedConfig.doBasicAuth);
            expect(authInstance.loggedInStatus).toBe(true);
        });

        it('when user is not loggedIn', async () => {
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => Promise.reject());
            jest.spyOn(authService, 'fetchBasicAuthService').mockImplementation(() => ({
                status: 200,
                ok: true,
            }));

            await authInstance.doBasicAuth(embedConfig.doBasicAuth);
            // expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
            expect(authService.fetchBasicAuthService).toBeCalled();
            expect(authInstance.loggedInStatus).toBe(true);
        });
    });

    describe('doSamlAuth', () => {
        afterEach(() => {
            delete global.window;
            global.window = Object.create(originalWindow);
            global.window.open = jest.fn();
            global.fetch = window.fetch;
        });

        it('when user is loggedIn & isAtSSORedirectUrl is true', async () => {
            spyOn(checkReleaseVersionInBetaInstance, 'checkReleaseVersionInBeta');
            Object.defineProperty(window, 'location', {
                value: {
                    href: authInstance.SSO_REDIRECTION_MARKER_GUID,
                    hash: '',
                },
            });
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(
                async () => ({
                    json: () => mockSessionInfo,
                    status: 200,
                }),
            );
            jest.spyOn(tokenAuthService, 'isActiveService').mockReturnValue(true);
            await authInstance.doSamlAuth(embedConfig.doSamlAuth);
            expect(window.location.hash).toBe('');
            expect(authInstance.loggedInStatus).toBe(true);
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    href: 'asd.com#?tsSSOMarker=' + authInstance.SSO_REDIRECTION_MARKER_GUID,
                    hash: '?tsSSOMarker=' + authInstance.SSO_REDIRECTION_MARKER_GUID,
                },
            });
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => Promise.reject());
            await authInstance.doSamlAuth(embedConfig.doSamlAuth);
            expect(window.location.hash).toBe('');
            expect(authInstance.loggedInStatus).toBe(false);
        });

        it('when user is not loggedIn, in config noRedirect is false and isAtSSORedirectUrl is false', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    href: '',
                    hash: '',
                },
            });
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => Promise.reject());
            await authInstance.doSamlAuth(embedConfig.doSamlAuth);
            expect(global.window.location.href).toBe(samalLoginUrl);
        });

        it('when user is not loggedIn, in config noRedirect is true and isAtSSORedirectUrl is false', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    href: '',
                    hash: '',
                },
            });
            spyOn(authInstance, 'samlCompletionPromise');
            global.window.open = jest.fn();
            jest.spyOn(tokenAuthService, 'isActiveService')
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);
            expect(await authInstance.samlCompletionPromise).not.toBe(null);
            expect(
                await authInstance.doSamlAuth({
                    ...embedConfig.doSamlAuthNoRedirect,
                }),
            ).toBe(true);
            document.getElementById('ts-auth-btn').click();
            window.postMessage({ type: EmbedEvent.SAMLComplete }, '*');
            await authInstance.samlCompletionPromise;
            expect(authInstance.loggedInStatus).toBe(true);
        });
    });

    describe('doOIDCAuth', () => {
        afterEach(() => {
            authTokenService.resetCachedAuthToken();
            delete global.window;
            global.window = Object.create(originalWindow);
            global.window.open = jest.fn();
            global.fetch = window.fetch;
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    href: 'asd.com#?tsSSOMarker=' + authInstance.SSO_REDIRECTION_MARKER_GUID,
                    hash: '?tsSSOMarker=' + authInstance.SSO_REDIRECTION_MARKER_GUID,
                },
            });
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => Promise.reject());
            await authInstance.doOIDCAuth(embedConfig.doOidcAuth);
            expect(window.location.hash).toBe('');
            expect(authInstance.loggedInStatus).toBe(false);
        });
    });

    it('authenticate: when authType is SSO', async () => {
        jest.spyOn(authInstance, 'doSamlAuth');
        await authInstance.authenticate(embedConfig.SSOAuth);
        expect(window.location.hash).toBe('');
        expect(authInstance.doSamlAuth).toBeCalled();
    });

    it('authenticate: when authType is SMAL', async () => {
        jest.spyOn(authInstance, 'doSamlAuth');
        await authInstance.authenticate(embedConfig.SAMLAuth);
        expect(window.location.hash).toBe('');
        expect(authInstance.doSamlAuth).toBeCalled();
    });

    it('authenticate: when authType is OIDC', async () => {
        jest.spyOn(authInstance, 'doOIDCAuth');
        await authInstance.authenticate(embedConfig.OIDCAuth);
        expect(window.location.hash).toBe('');
        expect(authInstance.doOIDCAuth).toBeCalled();
    });

    it('authenticate: when authType is AuthServer', async () => {
        spyOn(authInstance, 'doTokenAuth');
        await authInstance.authenticate(embedConfig.authServerFailure);
        expect(window.location.hash).toBe('');
        expect(authInstance.doTokenAuth).toBeCalled();
    });

    it('authenticate: when authType is AuthServerCookieless', async () => {
        spyOn(authInstance, 'doCookielessTokenAuth');
        await authInstance.authenticate(embedConfig.authServerCookielessFailure);
        expect(window.location.hash).toBe('');
        expect(authInstance.doCookielessTokenAuth).toBeCalled();
    });

    it('authenticate: when authType is Basic', async () => {
        jest.spyOn(authInstance, 'doBasicAuth');
        jest.spyOn(authService, 'fetchBasicAuthService').mockImplementation(() => Promise.resolve({ status: 200, ok: true }));
        await authInstance.authenticate(embedConfig.basicAuthSuccess);
        expect(authInstance.doBasicAuth).toBeCalled();
        expect(authInstance.loggedInStatus).toBe(true);
    });

    it('authenticate: when authType is None', async () => {
        expect(await authInstance.authenticate(embedConfig.nonAuthSucess)).not.toBeInstanceOf(
            Error,
        );
    });

    it('user is authenticated when loggedInStatus is true', () => {
        expect(authInstance.isAuthenticated()).toBe(authInstance.loggedInStatus);
    });

    it('doCookielessTokenAuth should resolve to true if valid token is passed', async () => {
        jest.clearAllMocks();
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
        const isLoggedIn = await authInstance.doCookielessTokenAuth(
            embedConfig.doCookielessAuth('testToken'),
        );
        expect(isLoggedIn).toBe(true);
    });

    it('doCookielessTokenAuth should resolve to false if valid token is not passed', async () => {
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(false);
        const isLoggedIn = await authInstance.doCookielessTokenAuth(
            embedConfig.doCookielessAuth('testToken'),
        );
        expect(isLoggedIn).toBe(false);
    });
    it('get AuthEE should return proper value', () => {
        const testObject = { test: 'true' };
        authInstance.setAuthEE(testObject as any);
        expect(authInstance.getAuthEE()).toBe(testObject);
    });
    it('getSessionDetails returns the correct details given sessionInfo', async () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();

        jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockReturnValue({
            userGUID: '1234',
            releaseVersion: '1',
            configInfo: {
                mixpanelConfig: {
                    devSdkKey: 'devKey',
                    prodSdkKey: 'prodKey',
                    production: false,
                },
            },
        });
        const details = await SessionService.getSessionInfo();
        expect(details).toEqual(
            expect.objectContaining({
                mixpanelToken: 'devKey',
            }),
        );

        jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockReturnValue({
            configInfo: {
                mixpanelConfig: {
                    devSdkKey: 'devKey',
                    prodSdkKey: 'prodKey',
                    production: true,
                },
            },
        });

        SessionService.resetCachedSessionInfo();
        const details2 = await SessionService.getSessionInfo();
        expect(details2).toEqual(
            expect.objectContaining({
                mixpanelToken: 'prodKey',
            }),
        );
    });

    test('notifyAuthSuccess if getSessionInfo returns data', async () => {
        const dummyInfo = { test: 'dummy' };
        jest.spyOn(SessionService, 'getSessionInfo').mockResolvedValueOnce(dummyInfo);
        jest.spyOn(logger, 'error').mockResolvedValueOnce(true);
        const emitSpy = jest.fn();
        authInstance.setAuthEE({ emit: emitSpy } as any);
        await authInstance.notifyAuthSuccess();
        expect(logger.error).not.toBeCalled();
        expect(emitSpy).toBeCalledWith(authInstance.AuthStatus.SUCCESS, dummyInfo);
        authInstance.setAuthEE(null);
    });

    test('notifyAuthSuccess if getSessionInfo fails', async () => {
        jest.spyOn(SessionService, 'getSessionInfo').mockImplementation(() => {
            throw new Error('error');
        });
        jest.spyOn(logger, 'error');
        const emitSpy = jest.fn();
        authInstance.setAuthEE({ emit: emitSpy } as any);
        await authInstance.notifyAuthSuccess();
        expect(logger.error).toBeCalled();
        expect(emitSpy).not.toBeCalled();
        authInstance.setAuthEE(null);
    });
});
