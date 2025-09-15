import { getAuthenticationToken } from './authToken';
import { getEmbedConfig } from './embed/embedConfig';

import { AuthType } from './types';

import { logger } from './utils/logger';

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
 *```
 * @version SDK: 1.28.0
 * @group Global methods
 */
export const tokenizedFetch: typeof fetch = async (input, init): Promise<Response> => {
    const embedConfig = getEmbedConfig();
    if (embedConfig.authType !== AuthType.TrustedAuthTokenCookieless) {
        return fetch(input, {
            // ensure cookies are included for the non cookie-less api calls.
            credentials: 'include',
            ...init,
        });
    }

    const req = new Request(input, init);
    logger.log('76.tokenizedFetch: getting authentication token');
    const authToken = await getAuthenticationToken(embedConfig);
    logger.log('77.tokenizedFetch: authentication token', authToken);
    if (authToken) {
        logger.log('78.tokenizedFetch: appending authentication token');
        req.headers.append('Authorization', `Bearer ${authToken}`);
    }
    logger.log('79.tokenizedFetch: fetching request');
    return fetch(req);
};
