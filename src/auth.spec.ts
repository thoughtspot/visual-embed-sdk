import * as authInstance from './auth';
import * as authService from './utils/authService';
import * as checkReleaseVersionInBetaInstance from './utils';
import { AuthType, EmbedConfig } from './types';
import { executeAfterWait } from './test/test-utils';

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
    doOidcAuth: {
        thoughtSpotHost,
    },
    SSOAuth: {
        authType: AuthType.SSO,
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
};

const originalWindow = window;
export const mockSessionInfo = {
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

    test('endpoints, SAML_LOGIN_TEMPLATE', () => {
        const ssoTemplateUrl = authInstance.EndPoints.SAML_LOGIN_TEMPLATE(
            thoughtSpotHost,
        );
        expect(ssoTemplateUrl).toBe(
            `/callosum/v1/saml/login?targetURLPath=${thoughtSpotHost}`,
        );
    });

    test('when session info giving response', async () => {
        authInstance.initSession(mockSessionInfo);
        expect(authInstance.getSessionInfo()).toStrictEqual(mockSessionInfo);
    });

    test('doTokenAuth: when authEndpoint and getAuthToken are not there, it throw error', async () => {
        try {
            await authInstance.doTokenAuth(
                embedConfig.doTokenAuthFailureWithoutAuthEndPoint,
            );
        } catch (e) {
            expect(e.message).toBe(
                'Either auth endpoint or getAuthToken function must be provided',
            );
        }
    });

    test('doTokenAuth: when user is loggedIn', async () => {
        jest.spyOn(authService, 'fetchSessionInfoService').mockImplementation(
            async () => ({
                json: () => mockSessionInfo,
                status: 200,
            }),
        );
        await authInstance.doTokenAuth(
            embedConfig.doTokenAuthSuccess('authToken'),
        );
        expect(authService.fetchSessionInfoService).toBeCalled();
        expect(authInstance.loggedInStatus).toBe(true);
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken have response', async () => {
        jest.spyOn(authService, 'fetchSessionInfoService').mockImplementation(
            () => false,
        );
        jest.spyOn(
            authService,
            'fetchAuthTokenService',
        ).mockImplementation(() => ({ text: () => Promise.resolve('abc') }));
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() =>
            Promise.resolve({
                status: 200,
            }),
        );
        await authInstance.doTokenAuth(
            embedConfig.doTokenAuthSuccess('authToken2'),
        );
        expect(authService.fetchSessionInfoService).toBeCalled();
        expect(authService.fetchAuthService).toBeCalledWith(
            thoughtSpotHost,
            username,
            'authToken2',
        );
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken not present, isLoggedIn should called', async () => {
        jest.spyOn(authService, 'fetchSessionInfoService').mockImplementation(
            () => false,
        );
        jest.spyOn(
            authService,
            'fetchAuthTokenService',
        ).mockImplementation(() =>
            Promise.resolve({ text: () => Promise.resolve('abc') }),
        );
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() =>
            Promise.resolve({
                status: 200,
                ok: true,
            }),
        );
        await authInstance.doTokenAuth(
            embedConfig.doTokenAuthFailureWithoutGetAuthToken,
        );
        await executeAfterWait(() => {
            expect(authInstance.loggedInStatus).toBe(true);
            expect(authService.fetchSessionInfoService).toBeCalled();
            expect(authService.fetchAuthService).toBeCalledWith(
                thoughtSpotHost,
                username,
                'abc',
            );
        });
    });

    test('doTokenAuth: Should raise error when duplicate token is used', async () => {
        jest.spyOn(authService, 'fetchSessionInfoService').mockResolvedValue({
            status: 401,
        });
        jest.spyOn(window, 'alert').mockClear();
        jest.spyOn(window, 'alert').mockReturnValue(undefined);
        jest.spyOn(authService, 'fetchAuthService').mockReset();
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() =>
            Promise.resolve({
                status: 200,
                ok: true,
            }),
        );
        await authInstance.doTokenAuth(
            embedConfig.doTokenAuthSuccess('authToken3'),
        );

        try {
            await authInstance.doTokenAuth(
                embedConfig.doTokenAuthSuccess('authToken3'),
            );
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
        jest.spyOn(authService, 'fetchSessionInfoService')
            .mockResolvedValue({
                status: 401,
            })
            .mockClear();
        jest.spyOn(
            authService,
            'fetchAuthTokenService',
        ).mockImplementation(() => ({ text: () => Promise.resolve('abc') }));
        jest.spyOn(authService, 'fetchAuthService').mockImplementation(() =>
            Promise.resolve({
                status: 200,
                ok: true,
            }),
        );
        const isLoggedIn = await authInstance.doTokenAuth(
            embedConfig.doTokenAuthWithCookieDetect,
        );
        expect(authService.fetchSessionInfoService).toHaveBeenCalledTimes(2);
        expect(isLoggedIn).toBe(false);
    });

    describe('doBasicAuth', () => {
        beforeEach(() => {
            global.fetch = window.fetch;
        });

        it('when user is loggedIn', async () => {
            spyOn(
                checkReleaseVersionInBetaInstance,
                'checkReleaseVersionInBeta',
            );
            jest.spyOn(
                authService,
                'fetchSessionInfoService',
            ).mockImplementation(async () => ({
                json: () => mockSessionInfo,
                status: 200,
            }));
            await authInstance.doBasicAuth(embedConfig.doBasicAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
            expect(authInstance.loggedInStatus).toBe(true);
        });

        it('when user is not loggedIn', async () => {
            jest.spyOn(
                authService,
                'fetchSessionInfoService',
            ).mockImplementation(() => Promise.reject());
            jest.spyOn(
                authService,
                'fetchBasicAuthService',
            ).mockImplementation(() => ({ status: 200, ok: true }));

            await authInstance.doBasicAuth(embedConfig.doBasicAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
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
            spyOn(
                checkReleaseVersionInBetaInstance,
                'checkReleaseVersionInBeta',
            );
            Object.defineProperty(window, 'location', {
                value: {
                    href: authInstance.SSO_REDIRECTION_MARKER_GUID,
                    hash: '',
                },
            });
            jest.spyOn(
                authService,
                'fetchSessionInfoService',
            ).mockImplementation(async () => ({
                json: () => mockSessionInfo,
                status: 200,
            }));
            await authInstance.doSamlAuth(embedConfig.doSamlAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
            expect(window.location.hash).toBe('');
            expect(authInstance.loggedInStatus).toBe(true);
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            jest.spyOn(
                authService,
                'fetchSessionInfoService',
            ).mockImplementation(() => Promise.reject());
            await authInstance.doSamlAuth(embedConfig.doSamlAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
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
            jest.spyOn(
                authService,
                'fetchSessionInfoService',
            ).mockImplementation(() => Promise.reject());
            await authInstance.doSamlAuth(embedConfig.doSamlAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
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
            jest.spyOn(
                authService,
                'fetchSessionInfoService',
            ).mockImplementation(() => Promise.reject());
            expect(await authInstance.samlCompletionPromise).not.toBe(null);
            expect(
                await authInstance.doSamlAuth({
                    ...embedConfig.doSamlAuth,
                    noRedirect: true,
                }),
            ).toBe(true);
            expect(authService.fetchSessionInfoService).toBeCalled();
        });
    });

    describe('doOIDCAuth', () => {
        afterEach(() => {
            delete global.window;
            global.window = Object.create(originalWindow);
            global.window.open = jest.fn();
            global.fetch = window.fetch;
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            jest.spyOn(
                authService,
                'fetchSessionInfoService',
            ).mockImplementation(() => Promise.reject());
            await authInstance.doOIDCAuth(embedConfig.doOidcAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
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

    it('authenticate: when authType is Basic', async () => {
        jest.spyOn(authInstance, 'doBasicAuth');
        await authInstance.authenticate(embedConfig.basicAuthSuccess);
        expect(authInstance.doBasicAuth).toBeCalled();
        expect(authInstance.loggedInStatus).toBe(true);
    });

    it('authenticate: when authType is None', async () => {
        expect(
            await authInstance.authenticate(embedConfig.nonAuthSucess),
        ).not.toBeInstanceOf(Error);
    });

    it('user is authenticated when loggedInStatus is true', () => {
        expect(authInstance.isAuthenticated()).toBe(
            authInstance.loggedInStatus,
        );
    });
});
