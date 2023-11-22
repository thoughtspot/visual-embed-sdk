import { getAuthenticationToken } from './authToken';
import { getEmbedConfig } from './embed/embedConfig';

import { AuthType } from './types';

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
