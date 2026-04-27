import 'jest-fetch-mock';
import * as embedConfigModule from './embed/embedConfig';
import * as authTokenModule from './authToken';
import { AuthType } from './types';
import { tokenizedFetch } from './tokenizedFetch';

jest.mock('./embed/embedConfig');
jest.mock('./authToken');

const mockGetEmbedConfig = embedConfigModule.getEmbedConfig as jest.Mock;
const mockGetAuthenticationToken = authTokenModule.getAuthenticationToken as jest.Mock;
const mockGetCacheAuthToken = authTokenModule.getCacheAuthToken as jest.Mock;

describe('tokenizedFetch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock.resetMocks();
    });

    describe('non-cookieless auth', () => {
        beforeEach(() => {
            mockGetEmbedConfig.mockReturnValue({ authType: AuthType.TrustedAuthToken });
        });

        it('should add Authorization Bearer header when cachedAuthToken exists', async () => {
            mockGetCacheAuthToken.mockReturnValue('my-cached-token');
            fetchMock.mockResponseOnce(JSON.stringify({}));

            await tokenizedFetch('https://example.com/api', { method: 'GET' });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const request = fetchMock.mock.calls[0][0] as Request;
            expect(request).toBeInstanceOf(Request);
            expect(request.headers.get('Authorization')).toBe('Bearer my-cached-token');
        });

        it('should fetch with credentials include when no cachedAuthToken', async () => {
            mockGetCacheAuthToken.mockReturnValue(null);
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
