import { getAuthenticationToken } from './authToken';
import { getEmbedConfig } from './embed/embedConfig';

import { AuthType } from './types';

/**
 * Fetch wrapper that adds the authentication token to the request.
 * Use this to call the ThoughtSpot APIs when using the visual embed sdk.
 * The interface for this method is the same as Web `Fetch`.
 * Learn more about the `Fetch` API [here](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
 * @param input
 * @param init
 * @example
 * ```js
 * tokenizedFetch("<TS_ORIGIN>/api/rest/2.0/auth/session/user", {
 *   // .. fetch options ..
 * });
 *```
 * 
 * @example 
 * ```js
 * // Example of a POST request to the ThoughtSpot API
 * 
 * const apiLink = tsHost + "/api/rest/2.0/metadata/search";
 * const apiResponse = await tokenizedFetch(apiLink, {
 *         method: "POST",
 *         // Add any other fetch options as needed
 *         headers: {
 *           "Content-type": "application/json",
 *         },
 *         // Add the body as needed
 *         body: JSON.stringify({
 *           metadata: [
 *             {
 *               identifier: pinboardId,
 *             },
 *           ],
 *         }),
 *       });
 *
 *       // Get the response as json
 *       const apiResult = await apiResponse.json();
 * 
 *       console.log(apiResult);
 * ```
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
    const authToken = await getAuthenticationToken(embedConfig);
    if (authToken) {
        req.headers.append('Authorization', `Bearer ${authToken}`);
    }
    return fetch(req);
};
