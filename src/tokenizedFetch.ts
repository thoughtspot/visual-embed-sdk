import { getAuthenticationToken } from './authToken';
// eslint-disable-next-line import/no-cycle
import { getEmbedConfig } from './embed/base';
import { AuthType } from './types';

export const tokenizedFetch: typeof fetch = async (input, init) : Promise<Response> => {
    const req = new Request(input, init);
    const embedConfig = getEmbedConfig();
    if (embedConfig.authType !== AuthType.TrustedAuthTokenCookieless) {
        return fetch(req);
    }
    const authToken = await getAuthenticationToken(embedConfig);
    if (authToken) {
        req.headers.append('Authorization', `Bearer ${authToken}`);
    }
    return fetch(req);
};
