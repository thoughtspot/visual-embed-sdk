import { AuthType, EmbedConfig, EmbedEvent } from './types';
import { appendToUrlHash } from './utils';

let loggedInStatus = false;
let samlAuthWindow: Window = null;
let samlCompletionPromise: Promise<void> = null;

const SSO_REDIRECTION_MARKER_GUID = '5e16222e-ef02-43e9-9fbd-24226bf3ce5b';

const EndPoints = {
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
    const response = await fetch(authVerificationUrl, {
        credentials: 'include',
    });

    return response.status === 200;
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
    // Note (sunny): this will leave a # around even if it was not in the URL to
    // being with, trying to remove the hash by changing window.location will reload
    // the page which we don't want. We'll live with adding an unnecessary hash to the
    // parent page's URL until we find any use case where that creates an issue
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
            authToken = await fetch(authEndpoint).then((response) =>
                response.text(),
            );
        }
        await fetch(
            `${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}?username=${username}&auth_token=${authToken}`,
            {
                credentials: 'include',
            },
        );
        loggedInStatus = false;
    }

    loggedInStatus = true;
};

/**
 * Perform basic authentication to the ThoughtSpot cluster using the cluster
 * credentials.
 * Warning: This feature is primarily intended for developer testing and it is
 * strongly advised not to use this in production
 * @param embedConfig The embed configuration
 */
export const doBasicAuth = async (embedConfig: EmbedConfig): Promise<void> => {
    const { thoughtSpotHost, username, password } = embedConfig;
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (!loggedIn) {
        const response = await fetch(
            `${thoughtSpotHost}${EndPoints.BASIC_LOGIN}`,
            {
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-requested-by': 'ThoughtSpot',
                },
                body: `username=${encodeURIComponent(
                    username,
                )}&password=${encodeURIComponent(password)}`,
                credentials: 'include',
            },
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
    // the current url to the original one and call the callback
    if (isAtSSORedirectUrl()) {
        removeSSORedirectUrlMarker();
        loggedInStatus = false;
        return;
    }

    // redirect for SSO, when SSO is done this page will be loaded
    // again and the same JS will execute again
    const ssoRedirectUrl = embedConfig.noRedirect
        ? `${thoughtSpotHost}/v2/#/embed/saml-complete`
        : appendToUrlHash(window.location.href, SSO_REDIRECTION_MARKER_GUID);

    // bring back the page to the same url
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
 * @param embedConfig The embed config
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
