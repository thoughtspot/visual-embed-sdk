import * as authInstance from './auth';
import * as authService from './utils/authService';
import { AuthType } from './types';
import { executeAfterWait } from './test/test-utils';

const thoughtSpotHost = 'http://localhost:3000';
const username = 'tsuser';
const password = '12345678';
const samalLoginUrl = `${thoughtSpotHost}/callosum/v1/saml/login?targetURLPath=%235e16222e-ef02-43e9-9fbd-24226bf3ce5b`;

const embedConfig: any = {
    doTokenAuthSuccess: {
        thoughtSpotHost,
        username,
        authEndpoint: 'auth',
        getAuthToken: jest.fn(() => Promise.resolve('authToken')),
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
    SSOAuth: {
        authType: AuthType.SSO,
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
        await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess);
        expect(authService.fetchSessionInfoService).toBeCalled();
        expect(authInstance.loggedInStatus).toBe(true);
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken have response, isLoggedIn should called', async () => {
        jest.spyOn(authService, 'fetchSessionInfoService').mockImplementation(
            () => false,
        );
        jest.spyOn(
            authService,
            'fetchAuthTokenService',
        ).mockImplementation(() => ({ text: () => true }));
        jest.spyOn(authService, 'fetchAuthService');
        await authInstance.doTokenAuth(embedConfig.doTokenAuthSuccess);
        expect(authService.fetchSessionInfoService).toBeCalled();
        expect(authService.fetchAuthService).toBeCalled();
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken not present, isLoggedIn should called', async () => {
        jest.spyOn(authService, 'fetchSessionInfoService').mockImplementation(
            () => false,
        );
        jest.spyOn(
            authService,
            'fetchAuthTokenService',
        ).mockImplementation(() => ({ text: () => true }));
        jest.spyOn(authService, 'fetchAuthService');
        await authInstance.doTokenAuth(
            embedConfig.doTokenAuthFailureWithoutGetAuthToken,
        );
        executeAfterWait(() => {
            expect(authInstance.loggedInStatus).toBe(true);
            expect(authService.fetchSessionInfoService).toBeCalled();
            expect(authService.fetchAuthService).toBeCalled();
        });
    });

    describe('doBasicAuth', () => {
        beforeEach(() => {
            global.fetch = window.fetch;
        });

        it('when user is loggedIn', async () => {
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
            ).mockImplementation(() => ({ status: 200 }));

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
            ).toBe(undefined);
            expect(authService.fetchSessionInfoService).toBeCalled();
        });
    });

    it('authenticate: when authType is SSO', async () => {
        jest.spyOn(authInstance, 'doSamlAuth');
        await authInstance.authenticate(embedConfig.SSOAuth);
        expect(window.location.hash).toBe('');
        expect(authInstance.doSamlAuth).toBeCalled();
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
