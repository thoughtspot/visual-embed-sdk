import { ERROR_MESSAGE } from './errors';
import { EmbedConfig } from './types';
import { fetchAuthTokenService, verifyTokenService } from './utils/authService/authService';
import { logger } from './utils/logger';

let cachedAuthToken: string | null = null;

// This method can be used to get the authToken using the embedConfig
/**
 *
 * @param embedConfig
 */
export async function getAuthenticationToken(embedConfig: EmbedConfig): Promise<string> {
    // Since we don't have token validation enabled , we cannot tell if the
    // cached token is valid or not. So we will always fetch a new token.
    if (cachedAuthToken && !embedConfig.disableTokenVerification) {
        let isCachedTokenStillValid;
        try {
            isCachedTokenStillValid = await validateAuthToken(embedConfig, cachedAuthToken, true);
        } catch {
            isCachedTokenStillValid = false;
        }

        if (isCachedTokenStillValid) return cachedAuthToken;
    }

    const { authEndpoint, getAuthToken } = embedConfig;

    let authToken = null;
    if (getAuthToken) {
        authToken = await getAuthToken();
    } else {
        const response = await fetchAuthTokenService(authEndpoint);
        authToken = await response.text();
    }

    try {
        // this will throw error if the token is not valid
        await validateAuthToken(embedConfig, authToken);
    } catch (e) {
        logger.error(`${ERROR_MESSAGE.INVALID_TOKEN_ERROR} Error : ${e.message}`);
        throw e;
    }

    cachedAuthToken = authToken;
    return authToken;
}

const validateAuthToken = async (
    embedConfig: EmbedConfig,
    authToken: string,
    suppressAlert?: boolean,
): Promise<boolean> => {
    if (embedConfig.disableTokenVerification) {
        logger.info('Token verification is disabled. Assuming token is valid.');
        return true;
    }
    try {
        const isTokenValid = await verifyTokenService(embedConfig.thoughtSpotHost, authToken);
        if (isTokenValid) return true;
    } catch {
        return false;
    }

    if (cachedAuthToken && cachedAuthToken === authToken) {
        if (!embedConfig.suppressErrorAlerts && !suppressAlert) {
            // eslint-disable-next-line no-alert
            alert(ERROR_MESSAGE.DUPLICATE_TOKEN_ERR);
        }
        throw new Error(ERROR_MESSAGE.DUPLICATE_TOKEN_ERR);
    } else {
        throw new Error(ERROR_MESSAGE.INVALID_TOKEN_ERROR);
    }
};

/**
 * Resets the auth token and a new token will be fetched on the next request.
 * @example
 * ```js
 * resetCachedAuthToken();
 * ```
 * @version SDK: 1.28.0 | ThoughtSpot: *
 * @group Authentication / Init
 */
export const resetCachedAuthToken = (): void => {
    cachedAuthToken = null;
};
