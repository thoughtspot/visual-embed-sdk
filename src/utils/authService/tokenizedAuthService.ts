import { tokenizedFetch } from '../../tokenizedFetch';
import { logger } from '../logger';
import { EndPoints } from './authService';

/**
 *
 * @param url
 * @param options
 */
function tokenisedFailureLoggedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return tokenizedFetch(url, options).then(async (r) => {
        if (!r.ok && r.type !== 'opaqueredirect' && r.type !== 'opaque') {
            logger.error('Failure', await r.text?.());
        }
        return r;
    });
}

/**
 *
 * @param authVerificationUrl
 */
export function fetchSessionInfoService(authVerificationUrl: string): Promise<any> {
    return tokenisedFailureLoggedFetch(authVerificationUrl, {
        credentials: 'include',
    });
}

/**
 *
 * @param thoughtSpotHost
 */
export async function fetchLogoutService(thoughtSpotHost: string): Promise<any> {
    return tokenisedFailureLoggedFetch(`${thoughtSpotHost}${EndPoints.LOGOUT}`, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'x-requested-by': 'ThoughtSpot',
        },
    });
}
