import { EmbedConfig } from './types';
import { fetchAuthTokenService, verifyTokenService } from './utils/authService/authService';
import { logger } from './utils/logger';

const DUPLICATE_TOKEN_ERR = 'Duplicate token, please issue a new token every time getAuthToken callback is called.'
    + 'See https://developers.thoughtspot.com/docs/?pageid=embed-auth#trusted-auth-embed for more details.';

const INVALID_TOKEN_ERR = 'Invalid token received form token callback or authToken endpoint.';

let cachedAuthToken: string | null = null;

// This method can be used to get the authToken using the embedConfig
export const getAuthenticationToken = async (embedConfig: EmbedConfig): Promise<string> => {
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

    // this will throw error if the token is not valid
    await validateAuthToken(embedConfig, authToken);

    cachedAuthToken = authToken;
    return authToken;
};

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
            alert(DUPLICATE_TOKEN_ERR);
        }
        throw new Error(DUPLICATE_TOKEN_ERR);
    } else {
        throw new Error(INVALID_TOKEN_ERR);
    }
};

/**
 * Resets the auth token and a new token will be fetched on the next request.
 *
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
