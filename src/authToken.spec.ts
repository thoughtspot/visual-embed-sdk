import { getAuthenticationToken, resetCachedAuthToken, validateAuthToken } from './authToken';
import * as authServiceInstance from './utils/authService/authService';
import { EmbedConfig } from './types';
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
        expect(authServiceInstance.verifyTokenService).not.toBeCalled();
    });

    test('getAuthenticationToken: When verification is enabled', async () => {
        resetCachedAuthToken();
        jest.clearAllMocks();
        jest.spyOn(authServiceInstance, 'verifyTokenService').mockImplementation(() => true);
        const token = await getAuthenticationToken({
            thoughtSpotHost: 'test',
            getAuthToken: async () => 'abc2',
            disableTokenVerification: false,
        } as EmbedConfig);

        expect(token).toBe('abc2');
        expect(authServiceInstance.verifyTokenService).toBeCalledWith('test', 'abc2');
    });

    test('validateAuthToken : When token is invalid by type number', async () => {
        jest.spyOn(logger, 'error').mockImplementation(() => {});
        const loggerSpy = jest.spyOn(logger, 'error');

        const authToken = (123 as unknown) as string;
        await expect(
            validateAuthToken(
                {
                    thoughtSpotHost: 'test',
                } as EmbedConfig,
                authToken,
            ),
        ).rejects.toThrow(`${ERROR_MESSAGE.INVALID_TOKEN_TYPE_ERROR} ${typeof authToken}.`);
        expect(loggerSpy).toHaveBeenCalledWith(
            `${ERROR_MESSAGE.INVALID_TOKEN_TYPE_ERROR} ${typeof authToken}.`,
        );

        loggerSpy.mockRestore();
    });

    test('validateAuthToken : When token is invalid by type object', async () => {
        jest.spyOn(logger, 'error').mockImplementation(() => {});
        const loggerSpy = jest.spyOn(logger, 'error');

        const authToken = ({} as unknown) as string;
        await expect(
            validateAuthToken(
                {
                    thoughtSpotHost: 'test',
                } as EmbedConfig,
                authToken,
            ),
        ).rejects.toThrow(`${ERROR_MESSAGE.INVALID_TOKEN_TYPE_ERROR} ${typeof authToken}.`);
        expect(loggerSpy).toHaveBeenCalledWith(
            `${ERROR_MESSAGE.INVALID_TOKEN_TYPE_ERROR} ${typeof authToken}.`,
        );

        loggerSpy.mockRestore();
    });
});
