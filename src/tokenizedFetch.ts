import { getAuthenticationToken } from './authToken';
import { getEmbedConfig } from './embed/base';

export const tokenizedFetch: typeof fetch = async (input, init) : Promise<Response> => {
    const req = new Request(input, init);
    const embedConfig = getEmbedConfig();
    const authToken = await getAuthenticationToken(embedConfig);
    if (authToken) {
        req.headers.append('Authorization', `Bearer ${authToken}`);
    }
    return fetch(req);
};
