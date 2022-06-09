import { initMixpanel } from './mixpanel-service';
import { AuthType, EmbedConfig, EmbedEvent } from './types';
import { getRedirectUrl } from './utils';
// eslint-disable-next-line import/no-cycle
import {
    fetchSessionInfoService,
    fetchAuthTokenService,
    fetchAuthService,
    fetchBasicAuthService,
    fetchLogoutService,
} from './utils/authService';

// eslint-disable-next-line import/no-mutable-exports
export let loggedInStatus = false;
// eslint-disable-next-line import/no-mutable-exports
export let samlAuthWindow: Window = null;
// eslint-disable-next-line import/no-mutable-exports
export let samlCompletionPromise: Promise<void> = null;
let sessionInfo: any = null;
let releaseVersion = '';

export const SSO_REDIRECTION_MARKER_GUID =
    '5e16222e-ef02-43e9-9fbd-24226bf3ce5b';

export const EndPoints = {
    AUTH_VERIFICATION: '/callosum/v1/session/info',
    SAML_LOGIN_TEMPLATE: (targetUrl: string) =>
        `/callosum/v1/saml/login?targetURLPath=${targetUrl}`,
    OIDC_LOGIN_TEMPLATE: (targetUrl: string) =>
        `/callosum/v1/oidc/login?targetURLPath=${targetUrl}`,
    TOKEN_LOGIN: '/callosum/v1/session/login/token',
    BASIC_LOGIN: '/callosum/v1/session/login',
    LOGOUT: '/callosum/v1/session/logout',
};

export enum AuthFailureType {
    SDK = 'SDK',
    NO_COOKIE_ACCESS = 'NO_COOKIE_ACCESS',
    EXPIRY = 'EXPIRY',
    OTHER = 'OTHER',
}

export enum AuthStatus {
    FAILURE = 'FAILURE',
    SUCCESS = 'SUCCESS',
    LOGOUT = 'LOGOUT',
}

/**
 * Check if we are logged into the ThoughtSpot cluster
 * @param thoughtSpotHost The ThoughtSpot cluster hostname or IP
 */
async function isLoggedIn(thoughtSpotHost: string): Promise<boolean> {
    const authVerificationUrl = `${thoughtSpotHost}${EndPoints.AUTH_VERIFICATION}`;
    let response = null;
    try {
        response = await fetchSessionInfoService(authVerificationUrl);
        const sessionInfoResp = await response.json();
        releaseVersion = sessionInfoResp.releaseVersion;
    } catch (e) {
        return false;
    }
    return response.status === 200;
}

/**
 * Return releaseVersion if available
 */
export function getReleaseVersion() {
    return releaseVersion;
}

/**
 * Return sessionInfo if available else make a loggedIn check to fetch the sessionInfo
 */
export function getSessionInfo() {
    return sessionInfo;
}

export function initSession(sessionDetails: any) {
    sessionInfo = sessionDetails;
    initMixpanel(sessionInfo);
}

const DUPLICATE_TOKEN_ERR =
    'Duplicate token, please issue a new token every time getAuthToken callback is called.' +
    'See https://developers.thoughtspot.com/docs/?pageid=embed-auth#trusted-auth-embed for more details.';
let prevAuthToken: string = null;
function alertForDuplicateToken(authtoken: string) {
    if (prevAuthToken === authtoken) {
        // eslint-disable-next-line no-alert
        alert(DUPLICATE_TOKEN_ERR);
        throw new Error(DUPLICATE_TOKEN_ERR);
    }
    prevAuthToken = authtoken;
}

/**
 * Check if we are stuck at the SSO redirect URL
 */
function isAtSSORedirectUrl(): boolean {
    return window.location.href.indexOf(SSO_REDIRECTION_MARKER_GUID) >= 0;
}

/**
 * Remove the SSO redirect URL marker
 */
function removeSSORedirectUrlMarker(): void {
    // Note (sunny): This will leave a # around even if it was not in the URL
    // to begin with. Trying to remove the hash by changing window.location will reload
    // the page which we don't want. We'll live with adding an unnecessary hash to the
    // parent page URL until we find any use case where that creates an issue.
    window.location.hash = window.location.hash.replace(
        SSO_REDIRECTION_MARKER_GUID,
        '',
    );
}

/**
 * Perform token based authentication
 * @param embedConfig The embed configuration
 */
export const doTokenAuth = async (
    embedConfig: EmbedConfig,
): Promise<boolean> => {
    const {
        thoughtSpotHost,
        username,
        authEndpoint,
        getAuthToken,
    } = embedConfig;
    if (!authEndpoint && !getAuthToken) {
        throw new Error(
            'Either auth endpoint or getAuthToken function must be provided',
        );
    }
    loggedInStatus = await isLoggedIn(thoughtSpotHost);
    if (!loggedInStatus) {
        let authToken = null;
        if (getAuthToken) {
            authToken = await getAuthToken();
            alertForDuplicateToken(authToken);
        } else {
            const response = await fetchAuthTokenService(authEndpoint);
            authToken = await response.text();
        }
        const resp = await fetchAuthService(
            thoughtSpotHost,
            username,
            authToken,
        );
        // token login issues a 302 when successful
        loggedInStatus = resp.ok || resp.type === 'opaqueredirect';
        if (loggedInStatus && embedConfig.detectCookieAccessSlow) {
            // When 3rd party cookie access is blocked, this will fail because cookies will
            // not be sent with the call.
            loggedInStatus = await isLoggedIn(thoughtSpotHost);
        }
    }
    return loggedInStatus;
};

/**
 * Perform basic authentication to the ThoughtSpot cluster using the cluster
 * credentials.
 *
 * Warning: This feature is primarily intended for developer testing. It is
 * strongly advised not to use this authentication method in production.
 * @param embedConfig The embed configuration
 */
export const doBasicAuth = async (
    embedConfig: EmbedConfig,
): Promise<boolean> => {
    const { thoughtSpotHost, username, password } = embedConfig;
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (!loggedIn) {
        const response = await fetchBasicAuthService(
            thoughtSpotHost,
            username,
            password,
        );
        loggedInStatus = response.ok;
        if (embedConfig.detectCookieAccessSlow) {
            loggedInStatus = await isLoggedIn(thoughtSpotHost);
        }
    } else {
        loggedInStatus = true;
    }
    return loggedInStatus;
};

async function samlPopupFlow(ssoURL: string) {
    document.body.insertAdjacentHTML(
        'beforeend',
        '<div id="ts-saml-auth"></div>',
    );
    const authElem = document.getElementById('ts-saml-auth');
    samlCompletionPromise =
        samlCompletionPromise ||
        new Promise<void>((resolve, reject) => {
            window.addEventListener('message', (e) => {
                if (e.data.type === EmbedEvent.SAMLComplete) {
                    (e.source as Window).close();
                    resolve();
                }
            });
        });
    authElem.addEventListener(
        'click',
        () => {
            if (samlAuthWindow === null || samlAuthWindow.closed) {
                samlAuthWindow = window.open(
                    ssoURL,
                    '_blank',
                    'location=no,height=570,width=520,scrollbars=yes,status=yes',
                );
            } else {
                samlAuthWindow.focus();
            }
        },
        { once: true },
    );
    authElem.click();
    return samlCompletionPromise;
}

/**
 * Perform SAML authentication
 * @param embedConfig The embed configuration
 */
const doSSOAuth = async (
    embedConfig: EmbedConfig,
    ssoEndPoint: string,
): Promise<void> => {
    const { thoughtSpotHost } = embedConfig;
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (loggedIn) {
        if (isAtSSORedirectUrl()) {
            removeSSORedirectUrlMarker();
        }
        loggedInStatus = true;
        return;
    }

    // we have already tried authentication and it did not succeed, restore
    // the current URL to the original one and invoke the callback.
    if (isAtSSORedirectUrl()) {
        removeSSORedirectUrlMarker();
        loggedInStatus = false;
        return;
    }

    const ssoURL = `${thoughtSpotHost}${ssoEndPoint}`;
    if (embedConfig.noRedirect) {
        await samlPopupFlow(ssoURL);
        loggedInStatus = true;
        return;
    }

    window.location.href = ssoURL;
};

export const doSamlAuth = async (embedConfig: EmbedConfig) => {
    const { thoughtSpotHost } = embedConfig;
    // redirect for SSO, when the SSO authentication is done, this page will be loaded
    // again and the same JS will execute again.
    const ssoRedirectUrl = embedConfig.noRedirect
        ? `${thoughtSpotHost}/v2/#/embed/saml-complete`
        : getRedirectUrl(
              window.location.href,
              SSO_REDIRECTION_MARKER_GUID,
              embedConfig.redirectPath,
          );

    // bring back the page to the same URL
    const ssoEndPoint = `${EndPoints.SAML_LOGIN_TEMPLATE(
        encodeURIComponent(ssoRedirectUrl),
    )}`;

    await doSSOAuth(embedConfig, ssoEndPoint);
    return loggedInStatus;
};

export const doOIDCAuth = async (embedConfig: EmbedConfig) => {
    const { thoughtSpotHost } = embedConfig;
    // redirect for SSO, when the SSO authentication is done, this page will be loaded
    // again and the same JS will execute again.
    const ssoRedirectUrl = embedConfig.noRedirect
        ? `${thoughtSpotHost}/v2/#/embed/saml-complete`
        : getRedirectUrl(
              window.location.href,
              SSO_REDIRECTION_MARKER_GUID,
              embedConfig.redirectPath,
          );

    // bring back the page to the same URL
    const ssoEndPoint = `${EndPoints.OIDC_LOGIN_TEMPLATE(
        encodeURIComponent(ssoRedirectUrl),
    )}`;

    await doSSOAuth(embedConfig, ssoEndPoint);
    return loggedInStatus;
};

export const logout = async (embedConfig: EmbedConfig): Promise<boolean> => {
    const { thoughtSpotHost } = embedConfig;
    const response = await fetchLogoutService(thoughtSpotHost);
    loggedInStatus = false;
    return loggedInStatus;
};

/**
 * Perform authentication on the ThoughtSpot cluster
 * @param embedConfig The embed configuration
 */
export const authenticate = async (
    embedConfig: EmbedConfig,
): Promise<boolean> => {
    const { authType } = embedConfig;
    switch (authType) {
        case AuthType.SSO:
            return doSamlAuth(embedConfig);
        case AuthType.OIDC:
            return doOIDCAuth(embedConfig);
        case AuthType.AuthServer:
            return doTokenAuth(embedConfig);
        case AuthType.Basic:
            return doBasicAuth(embedConfig);
        default:
            return Promise.resolve(true);
    }
};

/**
 * Check if we are authenticated to the ThoughtSpot cluster
 */
export const isAuthenticated = (): boolean => loggedInStatus;
