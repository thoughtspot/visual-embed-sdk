import { AuthType, EmbedConfig, EmbedEvent } from './types';
import { appendToUrlHash } from './utils';
// eslint-disable-next-line import/no-cycle
import {
    fetchSessionInfoService,
    fetchAuthTokenService,
    fetchAuthService,
    fetchBasicAuthService,
} from './utils/authService';

// eslint-disable-next-line import/no-mutable-exports
export let loggedInStatus = false;
// eslint-disable-next-line import/no-mutable-exports
export let samlAuthWindow: Window = null;
// eslint-disable-next-line import/no-mutable-exports
export let samlCompletionPromise: Promise<void> = null;
// eslint-disable-next-line import/no-mutable-exports
export let sessionInfo: any = null;

export const SSO_REDIRECTION_MARKER_GUID =
    '5e16222e-ef02-43e9-9fbd-24226bf3ce5b';

export const EndPoints = {
    AUTH_VERIFICATION: '/callosum/v1/session/info',
    SSO_LOGIN_TEMPLATE: (targetUrl: string) =>
        `/callosum/v1/saml/login?targetURLPath=${targetUrl}`,
    TOKEN_LOGIN: '/callosum/v1/session/login/token',
    BASIC_LOGIN: '/callosum/v1/session/login',
};

/**
 * Check if we are logged into the ThoughtSpot cluster
 * @param thoughtSpotHost The ThoughtSpot cluster hostname or IP
 */
async function isLoggedIn(thoughtSpotHost: string): Promise<boolean> {
    const authVerificationUrl = `${thoughtSpotHost}${EndPoints.AUTH_VERIFICATION}`;
    sessionInfo = null;
    try {
        const response = await fetchSessionInfoService(authVerificationUrl);
        if (response.status === 200) {
            sessionInfo = response.json();
        }
    } catch (e) {
        sessionInfo = null;
    }
    return !!sessionInfo;
}

/**
 * Return sessionInfo if available else make a loggedIn check to fetch the sessionInfo
 */
export async function getSessionInfo(thoughtSpotHost: string) {
    if (!sessionInfo) {
        await isLoggedIn(thoughtSpotHost);
    }
    return sessionInfo;
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
export const doTokenAuth = async (embedConfig: EmbedConfig): Promise<void> => {
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
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (!loggedIn) {
        let authToken = null;
        if (getAuthToken) {
            authToken = await getAuthToken();
        } else {
            const response = await fetchAuthTokenService(authEndpoint);
            authToken = response.text();
        }
        await fetchAuthService(thoughtSpotHost, username, authToken);
        loggedInStatus = false;
    }

    loggedInStatus = true;
};

/**
 * Perform basic authentication to the ThoughtSpot cluster using the cluster
 * credentials.
 *
 * Warning: This feature is primarily intended for developer testing. It is
 * strongly advised not to use this authentication method in production.
 * @param embedConfig The embed configuration
 */
export const doBasicAuth = async (embedConfig: EmbedConfig): Promise<void> => {
    const { thoughtSpotHost, username, password } = embedConfig;
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (!loggedIn) {
        const response = await fetchBasicAuthService(
            thoughtSpotHost,
            username,
            password,
        );
        loggedInStatus = response.status === 200;
    }

    loggedInStatus = true;
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
export const doSamlAuth = async (embedConfig: EmbedConfig): Promise<void> => {
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

    // redirect for SSO, when the SSO authentication is done, this page will be loaded
    // again and the same JS will execute again.
    const ssoRedirectUrl = embedConfig.noRedirect
        ? `${thoughtSpotHost}/v2/#/embed/saml-complete`
        : appendToUrlHash(window.location.href, SSO_REDIRECTION_MARKER_GUID);

    // bring back the page to the same URL
    const ssoEndPoint = `${EndPoints.SSO_LOGIN_TEMPLATE(
        encodeURIComponent(ssoRedirectUrl),
    )}`;

    const ssoURL = `${thoughtSpotHost}${ssoEndPoint}`;
    if (embedConfig.noRedirect) {
        await samlPopupFlow(ssoURL);
        return;
    }

    window.location.href = ssoURL;
};

/**
 * Perform authentication on the ThoughtSpot cluster
 * @param embedConfig The embed configuration
 */
export const authenticate = async (embedConfig: EmbedConfig): Promise<void> => {
    const { authType } = embedConfig;
    switch (authType) {
        case AuthType.SSO:
            return doSamlAuth(embedConfig);
        case AuthType.AuthServer:
            return doTokenAuth(embedConfig);
        case AuthType.Basic:
            return doBasicAuth(embedConfig);
        default:
            return Promise.resolve();
    }
};

/**
 * Check if we are authenticated to the ThoughtSpot cluster
 */
export const isAuthenticated = (): boolean => loggedInStatus;
