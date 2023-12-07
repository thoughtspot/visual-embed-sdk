import * as authInstance from './auth';
import * as authService from './utils/authService/authService';
import * as tokenAuthService from './utils/authService/tokenizedAuthService';
import * as checkReleaseVersionInBetaInstance from './utils';
import * as mixPanelService from './mixpanel-service';
import { AuthType, EmbedEvent } from './types';
import { executeAfterWait } from './test/test-utils';
import { resetCachedAuthToken } from './authToken';

const thoughtSpotHost = 'http://localhost:3000';
const username = 'tsuser';
const password = '12345678';
const samalLoginUrl = `${thoughtSpotHost}/callosum/v1/saml/login?targetURLPath=%235e16222e-ef02-43e9-9fbd-24226bf3ce5b`;

export const embedConfig: any = {
    doTokenAuthSuccess: (token: string) => ({
        thoughtSpotHost,
        username,
        authEndpoint: 'auth',
        authType: AuthType.AuthServer,
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

describe('Unit test for auth', () => {
    beforeEach(() => {
        global.fetch = window.fetch;
    });
    afterEach(() => {
        resetCachedAuthToken();
    });
    test('endpoints, SAML_LOGIN_TEMPLATE', () => {
        const ssoTemplateUrl = authService.EndPoints.SAML_LOGIN_TEMPLATE(thoughtSpotHost);
        expect(ssoTemplateUrl).toBe(`/callosum/v1/saml/login?targetURLPath=${thoughtSpotHost}`);
    });

    test('when session info giving response', async () => {
        jest.spyOn(mixPanelService, 'initMixpanel').mockImplementation(() => Promise.resolve());
        authInstance.initSession(mockSessionInfo);
        const sessionInfo = await authInstance.getSessionInfo();
        expect(sessionInfo).toStrictEqual(mockSessionInfo);
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
        jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(async () => ({
            json: () => mockSessionInfo,
            status: 200,
        }));
        jest.spyOn(authInstance, 'getSessionDetails').mockReturnValue(mockSessionInfo);
        jest.spyOn(authInstance, 'initSession').mockReturnValue(null);
        await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess('authToken'));
        expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
        expect(authInstance.loggedInStatus).toBe(true);
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken have response', async () => {
        jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => false);
        jest.spyOn(authService, 'fetchAuthTokenService').mockImplementation(() => ({
            text: () => Promise.resolve('abc'),
        }));
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() => Promise.resolve({
            status: 200,
        }));
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
        await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess('authToken2'));
        expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
        expect(authService.fetchAuthService).toBeCalledWith(
            thoughtSpotHost,
            username,
            'authToken2',
        );
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken not present, isLoggedIn should called', async () => {
        jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => false);
        jest.spyOn(authService, 'fetchAuthTokenService').mockImplementation(() => Promise.resolve({ text: () => Promise.resolve('abc') }));
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() => Promise.resolve({
            status: 200,
            ok: true,
        }));
        jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
        await authInstance.doTokenAuth(embedConfig.doTokenAuthFailureWithoutGetAuthToken);
        await executeAfterWait(() => {
            expect(authInstance.loggedInStatus).toBe(true);
            expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
            expect(authService.fetchAuthService).toBeCalledWith(
                thoughtSpotHost,
                username,
                'authToken2',
            );
        });
    });

    test('doTokenAuth: Should raise error when duplicate token is used', async () => {
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
        const isLoggedIn = await authInstance.doTokenAuth(embedConfig.doTokenAuthWithCookieDetect);
        expect(tokenAuthService.fetchSessionInfoService).toHaveBeenCalledTimes(2);
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
        expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
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
            spyOn(checkReleaseVersionInBetaInstance, 'checkReleaseVersionInBeta');
            jest.spyOn(authInstance, 'getSessionDetails').mockReturnValue(mockSessionInfo);
            jest.spyOn(authInstance, 'initSession').mockReturnValue(null);
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(
                async () => ({
                    json: () => mockSessionInfo,
                    status: 200,
                }),
            );
            await authInstance.doBasicAuth(embedConfig.doBasicAuth);
            expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
            expect(authInstance.loggedInStatus).toBe(true);
            expect(authInstance.getSessionDetails).toBeCalled();
            expect(authInstance.initSession).toBeCalled();
        });

        it('when user is not loggedIn', async () => {
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => Promise.reject());
            jest.spyOn(authService, 'fetchBasicAuthService').mockImplementation(() => ({
                status: 200,
                ok: true,
            }));

            await authInstance.doBasicAuth(embedConfig.doBasicAuth);
            expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
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
            jest.spyOn(authInstance, 'getSessionDetails').mockReturnValue(mockSessionInfo);
            jest.spyOn(authInstance, 'initSession').mockReturnValue(null);
            await authInstance.doSamlAuth(embedConfig.doSamlAuth);
            expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
            expect(window.location.hash).toBe('');
            expect(authInstance.loggedInStatus).toBe(true);
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => Promise.reject());
            await authInstance.doSamlAuth(embedConfig.doSamlAuth);
            expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
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
            expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
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
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService')
                .mockImplementationOnce(() => Promise.reject())
                .mockImplementationOnce(async () => ({
                    json: () => mockSessionInfo,
                    status: 200,
                }));
            jest.spyOn(authInstance, 'getSessionDetails').mockReturnValue(mockSessionInfo);
            jest.spyOn(authInstance, 'initSession').mockReturnValue(null);
            expect(await authInstance.samlCompletionPromise).not.toBe(null);
            expect(
                await authInstance.doSamlAuth({
                    ...embedConfig.doSamlAuthNoRedirect,
                }),
            ).toBe(true);
            document.getElementById('ts-auth-btn').click();
            window.postMessage({ type: EmbedEvent.SAMLComplete }, '*');
            await authInstance.samlCompletionPromise;
            expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
            expect(authInstance.getSessionDetails).toBeCalled();
            expect(authInstance.initSession).toBeCalled();
        });
    });

    describe('doOIDCAuth', () => {
        afterEach(() => {
            resetCachedAuthToken();
            delete global.window;
            global.window = Object.create(originalWindow);
            global.window.open = jest.fn();
            global.fetch = window.fetch;
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            jest.spyOn(tokenAuthService, 'fetchSessionInfoService').mockImplementation(() => Promise.reject());
            await authInstance.doOIDCAuth(embedConfig.doOidcAuth);
            expect(tokenAuthService.fetchSessionInfoService).toBeCalled();
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
    it('getSessionDetails returns the correct details given sessionInfo', () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();

        const details = authInstance.getSessionDetails({
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
        expect(details).toEqual(
            expect.objectContaining({
                mixpanelToken: 'devKey',
            }),
        );

        const details2 = authInstance.getSessionDetails({
            configInfo: {
                mixpanelConfig: {
                    devSdkKey: 'devKey',
                    prodSdkKey: 'prodKey',
                    production: true,
                },
            },
        });
        expect(details2).toEqual(
            expect.objectContaining({
                mixpanelToken: 'prodKey',
            }),
        );
    });
});
