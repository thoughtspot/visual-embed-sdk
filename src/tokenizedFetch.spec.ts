import 'jest-fetch-mock';
import * as embedConfigModule from './embed/embedConfig';
import * as authTokenModule from './authToken';
import { AuthType } from './types';
import { storeValueInWindow } from './utils';
import { tokenizedFetch } from './tokenizedFetch';

jest.mock('./embed/embedConfig');
jest.mock('./authToken');

const mockGetEmbedConfig = embedConfigModule.getEmbedConfig as jest.Mock;
const mockGetAuthenticationToken = authTokenModule.getAuthenticationToken as jest.Mock;

describe('tokenizedFetch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock.resetMocks();
        // Clean up any cached token stored during tests
        if ((window as any)._tsEmbedSDK) {
            delete (window as any)._tsEmbedSDK.cachedAuthToken;
        }
    });

    describe('non-cookieless auth', () => {
        beforeEach(() => {
            mockGetEmbedConfig.mockReturnValue({ authType: AuthType.TrustedAuthToken });
        });

        it('should add Authorization Bearer header when cachedAuthToken exists in window', async () => {
            storeValueInWindow('cachedAuthToken', 'my-cached-token');
            fetchMock.mockResponseOnce(JSON.stringify({}));

            await tokenizedFetch('https://example.com/api', { method: 'GET' });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const request = fetchMock.mock.calls[0][0] as Request;
            expect(request).toBeInstanceOf(Request);
            expect(request.headers.get('Authorization')).toBe('Bearer my-cached-token');
        });

        it('should fetch with credentials include when no cachedAuthToken in window', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({}));

            await tokenizedFetch('https://example.com/api', { method: 'GET' });

            expect(fetchMock).toHaveBeenCalledWith('https://example.com/api', {
                credentials: 'include',
                method: 'GET',
            });
        });
    });

    describe('cookieless auth (TrustedAuthTokenCookieless)', () => {
        beforeEach(() => {
            mockGetEmbedConfig.mockReturnValue({
                authType: AuthType.TrustedAuthTokenCookieless,
                thoughtSpotHost: 'https://example.com',
            });
        });

        it('should add Authorization Bearer header from getAuthenticationToken', async () => {
            mockGetAuthenticationToken.mockResolvedValue('cookieless-token');
            fetchMock.mockResponseOnce(JSON.stringify({}));

            await tokenizedFetch('https://example.com/api', { method: 'POST' });

            expect(mockGetAuthenticationToken).toHaveBeenCalled();
            const request = fetchMock.mock.calls[0][0] as Request;
            expect(request).toBeInstanceOf(Request);
            expect(request.headers.get('Authorization')).toBe('Bearer cookieless-token');
        });

        it('should not add Authorization header when getAuthenticationToken returns null', async () => {
            mockGetAuthenticationToken.mockResolvedValue(null);
            fetchMock.mockResponseOnce(JSON.stringify({}));

            await tokenizedFetch('https://example.com/api', { method: 'POST' });

            const request = fetchMock.mock.calls[0][0] as Request;
            expect(request).toBeInstanceOf(Request);
            expect(request.headers.get('Authorization')).toBeNull();
        });
    });
});
