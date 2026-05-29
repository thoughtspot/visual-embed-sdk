import { getAuthenticationToken, getCacheAuthToken } from './authToken';
import { getEmbedConfig } from './embed/embedConfig';

import { AuthType } from './types';

/**
 * Fetch wrapper that adds the authentication token to the request.
 * Use this to call the ThoughtSpot APIs when using the visual embed sdk.
 * The interface for this method is the same as Web `Fetch`.
 * @param input
 * @param init
 * @example
 * ```js
 * tokenizedFetch("<TS_ORIGIN>/api/rest/2.0/auth/session/user", {
 *   // .. fetch options ..
 * });
 * ```
 * @version SDK: 1.28.0
 * @group Global methods
 */
export const tokenizedFetch: typeof fetch = async (input, init): Promise<Response> => {
    const embedConfig = getEmbedConfig();
    const options: RequestInit = { ...init };
    let token: string | undefined;
    if (embedConfig.authType !== AuthType.TrustedAuthTokenCookieless) {
        token = getCacheAuthToken();
        if (!token) {
            return fetch(input, { ...options, credentials: 'include' });
        }
    } else {
        token = await getAuthenticationToken(embedConfig);
    }
    const req = new Request(input, options);

    if (token) {
        req.headers.append('Authorization', `Bearer ${token}`);
    }

    return fetch(req);
};