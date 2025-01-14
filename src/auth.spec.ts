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

describe.skip('Unit test for auth', () => {
    test('endpoints, SAML_LOGIN_TEMPLATE', () => {
        expect(true);
    });
});
