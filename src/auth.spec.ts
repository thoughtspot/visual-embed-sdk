import {
    EndPoints,
    getSessionInfo,
    doTokenAuth,
    loggedInStatus,
    doBasicAuth,
    doSamlAuth,
    authenticate,
    isAuthenticated,
    samlCompletionPromise,
    SSO_REDIRECTION_MARKER_GUID,
} from './auth';
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

    test('endpoints, SSO_LOGIN_TEMPLATE', () => {
        const ssoTemplateUrl = EndPoints.SSO_LOGIN_TEMPLATE(thoughtSpotHost);
        expect(ssoTemplateUrl).toBe(
            `/callosum/v1/saml/login?targetURLPath=${thoughtSpotHost}`,
        );
    });

    test('when session info giving response', async () => {
        jest.spyOn(authService, 'fetchSessionInfoService').mockImplementation(
            async () => ({
                json: () => mockSessionInfo,
                status: 200,
            }),
        );
        expect(await getSessionInfo(thoughtSpotHost)).toStrictEqual(
            mockSessionInfo,
        );
        expect(authService.fetchSessionInfoService).toBeCalled();
    });

    test('when session info giving error', async () => {
        jest.spyOn(
            authService,
            'fetchSessionInfoService',
        ).mockImplementation(() => Promise.reject());
        expect(await getSessionInfo(thoughtSpotHost)).toStrictEqual(
            mockSessionInfo,
        );
        expect(authService.fetchSessionInfoService).toBeCalled();
    });

    test('doTokenAuth: when authEndpoint and getAuthToken are not there, it throw error', async () => {
        try {
            await doTokenAuth(
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
        await doTokenAuth(embedConfig.doTokenAuthSuccess);
        expect(authService.fetchSessionInfoService).toBeCalled();
        expect(loggedInStatus).toBe(true);
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
        await doTokenAuth(embedConfig.doTokenAuthSuccess);
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
        executeAfterWait(async () => {
            await doTokenAuth(
                embedConfig.doTokenAuthFailureWithoutGetAuthToken,
            );
            expect(loggedInStatus).toBe(true);
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
            await doBasicAuth(embedConfig.doBasicAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
            expect(loggedInStatus).toBe(true);
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

            await doBasicAuth(embedConfig.doBasicAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
            expect(authService.fetchBasicAuthService).toBeCalled();
            expect(loggedInStatus).toBe(true);
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
                    href: SSO_REDIRECTION_MARKER_GUID,
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
            await doSamlAuth(embedConfig.doSamlAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
            expect(window.location.hash).toBe('');
            expect(loggedInStatus).toBe(true);
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            jest.spyOn(
                authService,
                'fetchSessionInfoService',
            ).mockImplementation(() => Promise.reject());
            await doSamlAuth(embedConfig.doSamlAuth);
            expect(authService.fetchSessionInfoService).toBeCalled();
            expect(window.location.hash).toBe('');
            expect(loggedInStatus).toBe(false);
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
            await doSamlAuth(embedConfig.doSamlAuth);
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
            expect(await samlCompletionPromise).not.toBe(null);
            expect(
                await doSamlAuth({
                    ...embedConfig.doSamlAuth,
                    noRedirect: true,
                }),
            ).toBe(undefined);
            expect(authService.fetchSessionInfoService).toBeCalled();
        });
    });

    it('authenticate: when authType is SSO', async () => {
        jest.spyOn(authInstance, 'doSamlAuth');
        await authenticate(embedConfig.SSOAuth);
        expect(window.location.hash).toBe('');
        expect(authInstance.doSamlAuth).toBeCalled();
    });

    it('authenticate: when authType is AuthServer', async () => {
        spyOn(authInstance, 'doTokenAuth');
        await authenticate(embedConfig.authServerFailure);
        expect(window.location.hash).toBe('');
        expect(authInstance.doTokenAuth).toBeCalled();
    });

    it('authenticate: when authType is Basic', async () => {
        jest.spyOn(authInstance, 'doBasicAuth');
        await authenticate(embedConfig.basicAuthSuccess);
        expect(authInstance.doBasicAuth).toBeCalled();
        expect(loggedInStatus).toBe(true);
    });

    it('authenticate: when authType is None', async () => {
        expect(
            await authenticate(embedConfig.nonAuthSucess),
        ).not.toBeInstanceOf(Error);
    });

    it('user is authenticated when loggedInStatus is true', () => {
        expect(isAuthenticated()).toBe(loggedInStatus);
    });
});
