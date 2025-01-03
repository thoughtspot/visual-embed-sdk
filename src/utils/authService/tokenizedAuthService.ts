import { tokenizedFetch } from '../../tokenizedFetch';
import { logger } from '../logger';
import { EndPoints } from './authService';

/**
 *
 * @param url
 * @param options
 */
function tokenizedFailureLoggedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return tokenizedFetch(url, options).then(async (r) => {
        if (!r.ok && r.type !== 'opaqueredirect' && r.type !== 'opaque') {
            if (r.status === 404) {
                logger.warn(`Failed to fetch ${url}`, await r.text?.());
            } else {
                logger.error(`Failed to fetch ${url}`, await r.text?.());
            }
        }
        return r;
    });
}

/**
 * Fetches the session info from the ThoughtSpot server.
 * @param thoughtspotHost
 * @returns {Promise<any>}
 * @example
 * ```js
 *  const response = await sessionInfoService();
 * ```
 */
export async function fetchPreauthInfoService(thoughtspotHost: string): Promise<any> {
    const sessionInfoPath = `${thoughtspotHost}${EndPoints.PREAUTH_INFO}`;
    const response = await tokenizedFailureLoggedFetch(sessionInfoPath);
    if (!response.ok) {
        const error: any = new Error(`Failed to fetch auth info: ${response.statusText}`);
        error.status = response.status; // Attach the status code to the error object
        throw error;
    }

    return response;
}

/**
 * Fetches the session info from the ThoughtSpot server.
 * @param thoughtspotHost
 * @returns {Promise<any>}
 * @example
 * ```js
 *  const response = await sessionInfoService();
 * ```
 */
export async function fetchV1InfoService(thoughtspotHost: string): Promise<any> {
    const sessionInfoPath = `${thoughtspotHost}${EndPoints.SESSION_INFO}`;
    const response = await tokenizedFailureLoggedFetch(sessionInfoPath);
    if (!response.ok) {
        const error: any = new Error(`Failed to fetch session info: ${response.statusText}`);
        error.status = response.status; // Attach the status code to the error object
        throw error;
    }

    return response;
}

/**
 * Fetches the session info from the ThoughtSpot server.
 * @param thoughtspotHost
 * @returns {Promise<any>}
 * @example
 * ```js
 *  const response = await sessionInfoService();
 * ```
 */
export async function fetchSessionInfoService(thoughtspotHost: string): Promise<any> {
    try {
        const response = await fetchPreauthInfoService(thoughtspotHost);

        // Convert Headers to a plain object
        const headers: Record<string, string> = {};
        response?.headers?.forEach((value: string, key: string) => {
            headers[key] = value;
        });
        const data = await response.json();

        return {
            ...data,
            status: 200,
            headers,
        };
    } catch (error) {
        if (error.status === 404) {
            const response = await fetchV1InfoService(thoughtspotHost);
            const data = await response.json();

            return data;
        }

        return {};
    }
}

/**
 *
 * @param thoughtSpotHost
 */
export async function fetchLogoutService(thoughtSpotHost: string): Promise<any> {
    return tokenizedFailureLoggedFetch(`${thoughtSpotHost}${EndPoints.LOGOUT}`, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'x-requested-by': 'ThoughtSpot',
        },
    });
}

/**
 * Is active service to check if the user is logged in.
 * @param thoughtSpotHost
 * @version SDK: 1.28.4 | ThoughtSpot: *
 */
export async function isActiveService(thoughtSpotHost: string): Promise<boolean> {
    const isActiveUrl = `${thoughtSpotHost}${EndPoints.IS_ACTIVE}`;
    try {
        const res = await tokenizedFetch(isActiveUrl, {
            credentials: 'include',
        });
        return res.ok;
    } catch (e) {
        logger.warn(`Is Logged In Service failed : ${e.message}`);
    }

    return false;
}
