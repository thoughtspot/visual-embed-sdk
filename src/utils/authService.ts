// eslint-disable-next-line import/no-cycle
import { EndPoints } from '../auth';

/**
 *
 * @param url
 * @param options
 */
function failureLoggedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, options).then(async (r) => {
        if (!r.ok && r.type !== 'opaqueredirect' && r.type !== 'opaque') {
            console.error('Failure', await r.text?.());
        }
        return r;
    });
}

/**
 *
 * @param authVerificationUrl
 */
export function fetchSessionInfoService(authVerificationUrl: string): Promise<any> {
    return failureLoggedFetch(authVerificationUrl, {
        credentials: 'include',
    });
}

/**
 * Service to validate a auth token against a ThoughtSpot host.
 *
 * @param thoughtSpotHost : ThoughtSpot host to verify the token against.
 * @param authToken : Auth token to verify.
 */
export function verifyTokenService(thoughtSpotHost: string, authToken: string): Promise<Response> {
    const authVerificationUrl = `${thoughtSpotHost}${EndPoints.IS_ACTIVE}`;
    return fetch(authVerificationUrl, {
        headers: {
            Authorization: `Bearer ${authToken}`,
            'x-requested-by': 'ThoughtSpot',
        },
        credentials: 'omit',
    });
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
    return failureLoggedFetch(
        `${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}?username=${username}&auth_token=${authToken}`,
        {
            credentials: 'include',
            // We do not want to follow the redirect, as it starts giving a CORS
            // error
            redirect: 'manual',
        },
    );
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
    return failureLoggedFetch(`${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-requested-by': 'ThoughtSpot',
        },
        body: `username=${encodeURIComponent(username)}&auth_token=${encodeURIComponent(
            authToken,
        )}`,
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

/**
 *
 * @param thoughtSpotHost
 */
export async function fetchLogoutService(thoughtSpotHost: string): Promise<any> {
    return failureLoggedFetch(`${thoughtSpotHost}${EndPoints.LOGOUT}`, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'x-requested-by': 'ThoughtSpot',
        },
    });
}
