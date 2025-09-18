import { ERROR_MESSAGE } from './errors';
import { EmbedConfig } from './types';
import { getValueFromWindow, storeValueInWindow } from './utils';
import { fetchAuthTokenService, verifyTokenService } from './utils/authService/authService';
import { logger } from './utils/logger';

const cacheAuthTokenKey = 'cachedAuthToken';

const getCacheAuthToken = (): string | null => getValueFromWindow(cacheAuthTokenKey);
const storeAuthTokenInCache = (token: string): void => {
    storeValueInWindow(cacheAuthTokenKey, token);
};

// This method can be used to get the authToken using the embedConfig
/**
 *
 * @param embedConfig
 */
export async function getAuthenticationToken(embedConfig: EmbedConfig): Promise<string> {
    logger.log('40.getAuthenticationToken: getting authentication token');
    const cachedAuthToken = getCacheAuthToken();
    // Since we don't have token validation enabled , we cannot tell if the
    // cached token is valid or not. So we will always fetch a new token.
    if (cachedAuthToken && !embedConfig.disableTokenVerification) {
        logger.log('41.getAuthenticationToken: cached authentication token');
        let isCachedTokenStillValid;
        try {
            logger.log('42.getAuthenticationToken: validating cached authentication token');
            isCachedTokenStillValid = await validateAuthToken(embedConfig, cachedAuthToken, true);
        } catch {
            logger.log('43.getAuthenticationToken: error validating cached authentication token');
            isCachedTokenStillValid = false;
        }

        if (isCachedTokenStillValid) return cachedAuthToken;
    }

    const { authEndpoint, getAuthToken } = embedConfig;

    let authToken = null;
    logger.log('44.getAuthenticationToken: getting authentication token');
    if (getAuthToken) {
        logger.log('45.getAuthenticationToken: getting authentication token');
        logger.log("555" , getAuthToken);
        const _typeOfGetAuthToken = typeof (getAuthToken)
        logger.log("93. type of _typeOfGetAuthToken" , _typeOfGetAuthToken);
        authToken = await getAuthToken();
        logger.log("98. authToken" , typeof authToken);
    } else {
        logger.log('46.getAuthenticationToken: getting authentication token');
        const response = await fetchAuthTokenService(authEndpoint);
        authToken = await response.text();
    }

    try {
        // this will throw error if the token is not valid
        logger.log('56.getAuthenticationToken: validating authentication token');
        await validateAuthToken(embedConfig, authToken);
        logger.log('47.getAuthenticationToken: validating authentication token');
    } catch (e) {
        logger.log('48.getAuthenticationToken: error validating authentication token');
        logger.error(`${ERROR_MESSAGE.INVALID_TOKEN_ERROR} Error : ${e.message}`);
        throw e;
    }

    storeAuthTokenInCache(authToken);
    logger.log('49.getAuthenticationToken: storing authentication token');
    return authToken;
}

const validateAuthToken = async (
    embedConfig: EmbedConfig,
    authToken: string,
    suppressAlert?: boolean,
): Promise<boolean> => {
    logger.log('57.validateAuthToken: validating authentication token');
    const cachedAuthToken = getCacheAuthToken();
    logger.log('58.validateAuthToken: cached authentication token', cachedAuthToken);
    if (embedConfig.disableTokenVerification) {
        logger.log('59.validateAuthToken: token verification is disabled');
        logger.info('Token verification is disabled. Assuming token is valid.');
        return true;
    }
    try {
        logger.log('60.validateAuthToken: verifying authentication token');
        const isTokenValid = await verifyTokenService(embedConfig.thoughtSpotHost, authToken);
        logger.log('61.validateAuthToken: isTokenValid', isTokenValid);
        if (isTokenValid) return true;
    } catch {
        logger.log('62.validateAuthToken: error verifying authentication token');
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
    storeAuthTokenInCache(null);
};
