import { AuthType, EmbedConfig } from './types';
import { appendToUrlHash } from './utils';

let loggedInStatus = false;

const SSO_REDIRECTION_MARKER_GUID = '5e16222e-ef02-43e9-9fbd-24226bf3ce5b';

const EndPoints = {
    AUTH_VERIFICATION: '/callosum/v1/session/info',
    SSO_LOGIN_TEMPLATE: (targetUrl: string) =>
        `/callosum/v1/saml/login?targetURLPath=${targetUrl}`,
    TOKEN_LOGIN: '/callosum/v1/session/login/token',
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
        window.location.href = `${thoughtSpotHost}${
            EndPoints.TOKEN_LOGIN
        }?username=${username}&auth_token=${authToken}&redirect_url=${encodeURIComponent(
            window.location.href,
        )}`;

        loggedInStatus = false;
    }

    loggedInStatus = true;
};

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
    const ssoRedirectUrl = appendToUrlHash(
        window.location.href,
        SSO_REDIRECTION_MARKER_GUID,
    );

    // bring back the page to the same url
    const ssoEndPoint = `${EndPoints.SSO_LOGIN_TEMPLATE(
        encodeURIComponent(ssoRedirectUrl),
    )}`;

    const ssoURL = `${thoughtSpotHost}${ssoEndPoint}`;
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
            doSamlAuth(embedConfig);
            break;
        case AuthType.AuthServer:
            doTokenAuth(embedConfig);
            break;
        default:
            break;
    }
};

/**
 * Check if we are authenticated to the ThoughtSpot cluster
 */
export const isAuthenticated = (): boolean => loggedInStatus;
