import { getAuthenticationToken, resetCachedAuthToken } from './authToken';
import * as authServiceInstance from './utils/authService/authService';
import { EmbedConfig } from './types';

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

    test.only('getAuthenticationToken: When verification is enabled', async () => {
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
});
