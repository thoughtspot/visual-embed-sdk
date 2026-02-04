import { getAuthenticationToken, resetCachedAuthToken, validateAuthToken } from './authToken';
import * as authTokenModule from './authToken';
import * as authServiceInstance from './utils/authService/authService';
import { EmbedConfig, AuthType } from './types';
import { formatTemplate, storeValueInWindow } from './utils';
import { logger } from './utils/logger';
import { ERROR_MESSAGE } from './errors';

describe('AuthToken Unit tests', () => {
    test('getAuthenticationToken: When verification is disabled', async () => {
        jest.spyOn(authServiceInstance, 'verifyTokenService');

        const token = await getAuthenticationToken({
            getAuthToken: async () => 'abc3',
            disableTokenVerification: true,
        } as EmbedConfig);

        expect(token).toBe('abc3');
        expect(authServiceInstance.verifyTokenService).not.toHaveBeenCalled();
    });

    test('getAuthenticationToken: When verification is enabled', async () => {
        resetCachedAuthToken();
        jest.clearAllMocks();
        jest.spyOn(authServiceInstance, 'verifyTokenService').mockImplementation(() => Promise.resolve(true));
        const token = await getAuthenticationToken({
            thoughtSpotHost: 'test',
            getAuthToken: async () => 'abc2',
            disableTokenVerification: false,
        } as EmbedConfig);

        expect(token).toBe('abc2');
        expect(authServiceInstance.verifyTokenService).toHaveBeenCalledWith('test', 'abc2');
    });

    test('validateAuthToken : When token is invalid by type number', async () => {
        jest.spyOn(logger, 'error').mockImplementation(() => {});
        const loggerSpy = jest.spyOn(logger, 'error');

        const authToken = (123 as unknown) as string;
        const errorMessage = formatTemplate(ERROR_MESSAGE.INVALID_TOKEN_TYPE_ERROR, {
            invalidType: typeof authToken,
        });

        await expect(
            validateAuthToken(
                {
                    thoughtSpotHost: 'test',
                } as EmbedConfig,
                authToken,
            ),
        ).rejects.toThrow(errorMessage);
        expect(loggerSpy).toHaveBeenCalledWith(errorMessage);

        loggerSpy.mockRestore();
    });

    test('validateAuthToken : When token is invalid by type object', async () => {
        jest.spyOn(logger, 'error').mockImplementation(() => {});
        const loggerSpy = jest.spyOn(logger, 'error');

        const authToken = ({} as unknown) as string;
        const errorMessage = formatTemplate(ERROR_MESSAGE.INVALID_TOKEN_TYPE_ERROR, {
            invalidType: typeof authToken,
        });

        await expect(
            validateAuthToken(
                {
                    thoughtSpotHost: 'test',
                } as EmbedConfig,
                authToken,
            ),
        ).rejects.toThrow(errorMessage);
        expect(loggerSpy).toHaveBeenCalledWith(errorMessage);

        loggerSpy.mockRestore();
    });

    describe('getAuthenticationToken: cached token skip validation condition', () => {
        beforeEach(() => {
            resetCachedAuthToken();
            jest.clearAllMocks();
        });

        test('should validate cached token when validation is not skipped', async () => {
            const cachedToken = 'cached-token-123';
            storeValueInWindow('cachedAuthToken', cachedToken);
            
            const validateAuthTokenSpy = jest.spyOn(authTokenModule, 'validateAuthToken')
                .mockImplementation(() => Promise.resolve(true));

            const getAuthTokenMock = jest.fn().mockResolvedValue('new-token-456');
            const config: EmbedConfig = {
                thoughtSpotHost: 'test',
                authType: AuthType.TrustedAuthToken,
                getAuthToken: getAuthTokenMock,
                disableTokenVerification: false,
            };

            const token = await getAuthenticationToken(config, false);

            expect(token).toBe(cachedToken);
            // Should validate cached token (condition at line 23 is true)
            expect(validateAuthTokenSpy).toHaveBeenCalledWith(config, cachedToken, true);
            expect(getAuthTokenMock).not.toHaveBeenCalled();

            validateAuthTokenSpy.mockReset();
        });

        test('should skip cached token validation when disableTokenVerification is true', async () => {
            const cachedToken = 'cached-token-123';
            storeValueInWindow('cachedAuthToken', cachedToken);
            
            const validateAuthTokenSpy = jest.spyOn(authTokenModule, 'validateAuthToken')
                .mockImplementation(() => Promise.resolve(true));

            const newToken = 'new-token-456';
            const getAuthTokenMock = jest.fn().mockResolvedValue(newToken);
            const config: EmbedConfig = {
                thoughtSpotHost: 'test',
                authType: AuthType.TrustedAuthToken,
                getAuthToken: getAuthTokenMock,
                disableTokenVerification: true,
            };

            const token = await getAuthenticationToken(config, false);

            expect(token).toBe(newToken);
            // Should not validate cached token (condition at line 23 is false)
            expect(validateAuthTokenSpy).not.toHaveBeenCalledWith(config, cachedToken, true);
            // But should validate new token (though it returns early when disableTokenVerification is true)
            expect(validateAuthTokenSpy).toHaveBeenCalledWith(config, newToken);
            expect(getAuthTokenMock).toHaveBeenCalled();

            validateAuthTokenSpy.mockReset();
        });

        test('should skip cached token validation when skipvalidation is true', async () => {
            const cachedToken = 'cached-token-123';
            storeValueInWindow('cachedAuthToken', cachedToken);
            
            const validateAuthTokenSpy = jest.spyOn(authTokenModule, 'validateAuthToken')
                .mockImplementation(() => Promise.resolve(true));

            const newToken = 'new-token-456';
            const getAuthTokenMock = jest.fn().mockResolvedValue(newToken);
            const config: EmbedConfig = {
                thoughtSpotHost: 'test',
                authType: AuthType.TrustedAuthToken,
                getAuthToken: getAuthTokenMock,
                disableTokenVerification: false,
            };

            const token = await getAuthenticationToken(config, true);

            expect(token).toBe(newToken);
            // Should not validate cached token (condition at line 23 is false)
            expect(validateAuthTokenSpy).not.toHaveBeenCalledWith(config, cachedToken, true);
            // But should validate new token
            expect(validateAuthTokenSpy).toHaveBeenCalledWith(config, newToken);
            expect(getAuthTokenMock).toHaveBeenCalled();

            validateAuthTokenSpy.mockReset();
        });
    });
});
