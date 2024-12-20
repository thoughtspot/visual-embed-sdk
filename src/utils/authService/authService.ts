import { logger } from '../logger';

export const EndPoints = {
    AUTH_VERIFICATION: '/callosum/v1/session/info',
    SESSION_INFO: '/callosum/v1/session/info',
    PREAUTH_INFO: '/prism/preauth/info',
    SAML_LOGIN_TEMPLATE: (targetUrl: string) => `/callosum/v1/saml/login?targetURLPath=${targetUrl}`,
    OIDC_LOGIN_TEMPLATE: (targetUrl: string) => `/callosum/v1/oidc/login?targetURLPath=${targetUrl}`,
    TOKEN_LOGIN: '/callosum/v1/session/login/token',
    BASIC_LOGIN: '/callosum/v1/session/login',
    LOGOUT: '/callosum/v1/session/logout',
    EXECUTE_TML: '/api/rest/2.0/metadata/tml/import',
    EXPORT_TML: '/api/rest/2.0/metadata/tml/export',
    IS_ACTIVE: '/callosum/v1/session/isactive',
};

/**
 *
 * @param url
 * @param options
 */
function failureLoggedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, options).then(async (r) => {
        if (!r.ok && r.type !== 'opaqueredirect' && r.type !== 'opaque') {
            logger.error('Failure', await r.text?.());
        }
        return r;
    });
}

/**
 * Service to validate a auth token against a ThoughtSpot host.
 * @param thoughtSpotHost : ThoughtSpot host to verify the token against.
 * @param authToken : Auth token to verify.
 */
export async function verifyTokenService(
    thoughtSpotHost: string,
    authToken: string,
): Promise<boolean> {
    const authVerificationUrl = `${thoughtSpotHost}${EndPoints.IS_ACTIVE}`;
    try {
        const res = await fetch(authVerificationUrl, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'x-requested-by': 'ThoughtSpot',
            },
            credentials: 'omit',
        });
        return res.ok;
    } catch (e) {
        logger.warn(`Token Verification Service failed : ${e.message}`);
    }

    return false;
}

/**
 *
 * @param authEndpoint
 */
export async function fetchAuthTokenService(authEndpoint: string): Promise<any> {
    return fetch(authEndpoint);
}

/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param authToken
 */
export async function fetchAuthService(
    thoughtSpotHost: string,
    username: string,
    authToken: string,
): Promise<any> {
    const fetchUrlParams = username
        ? `username=${username}&auth_token=${authToken}`
        : `auth_token=${authToken}`;
    return failureLoggedFetch(`${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}?${fetchUrlParams}`, {
        credentials: 'include',
        // We do not want to follow the redirect, as it starts giving a CORS
        // error
        redirect: 'manual',
    });
}

/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param authToken
 */
export async function fetchAuthPostService(
    thoughtSpotHost: string,
    username: string,
    authToken: string,
): Promise<any> {
    const bodyPrams = username
        ? `username=${encodeURIComponent(username)}&auth_token=${encodeURIComponent(authToken)}`
        : `auth_token=${encodeURIComponent(authToken)}`;
    return failureLoggedFetch(`${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-requested-by': 'ThoughtSpot',
        },
        body: bodyPrams,
        credentials: 'include',
        // We do not want to follow the redirect, as it starts giving a CORS
        // error
        redirect: 'manual',
    });
}

/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param password
 */
export async function fetchBasicAuthService(
    thoughtSpotHost: string,
    username: string,
    password: string,
): Promise<any> {
    return failureLoggedFetch(`${thoughtSpotHost}${EndPoints.BASIC_LOGIN}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-requested-by': 'ThoughtSpot',
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        credentials: 'include',
    });
}
