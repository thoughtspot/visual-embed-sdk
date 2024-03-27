import { getAuthenticationToken } from './authToken';
import { getEmbedConfig } from './embed/embedConfig';

import { AuthType } from './types';

/**
 * Fetch wrapper that adds the authentication token to the request.
 * Use this to call the ThoughtSpot APIs when using the visual embed sdk.
 *
 * @param input
 * @param init
 */
export const tokenizedFetch: typeof fetch = async (input, init): Promise<Response> => {
    const embedConfig = getEmbedConfig();
    if (embedConfig.authType !== AuthType.TrustedAuthTokenCookieless) {
        return fetch(input, init);
    }

    const req = new Request(input, init);
    const authToken = await getAuthenticationToken(embedConfig);
    if (authToken) {
        req.headers.append('Authorization', `Bearer ${authToken}`);
    }
    return fetch(req);
};
