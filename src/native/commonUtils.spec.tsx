import { getWebViewUrl, setupWebViewMessageHandler } from './commonUtils'; // Adjust the import path
import { AuthType } from '../types';
import pkgInfo from '../../package.json';

jest.mock('../utils', () => ({
    getQueryParamString: jest.fn((params) => Object.keys(params).map((key: any) => `${key}=${params[key]}`).join('&')),
}));

describe('getWebViewUrl', () => {
    const mockGetAuthToken = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should construct the WebView URL correctly', async () => {
        mockGetAuthToken.mockResolvedValue('mock-token');
        const config = {
            host: 'https://example.com',
            authType: AuthType.TrustedAuthTokenCookieless,
            liveboardId: 'test-liveboard-id',
            getAuthToken: mockGetAuthToken,
        };

        const url = await getWebViewUrl(config);

        expect(mockGetAuthToken).toHaveBeenCalledTimes(1);
        expect(url).toContain('https://example.com/embed');
        expect(url).toContain(`authType=${AuthType.TrustedAuthTokenCookieless}`);
        expect(url).toContain(`test-liveboard-id`);
        expect(url).toContain(`sdkVersion=${pkgInfo.version}`);
    });

    it('should throw an error if getAuthToken is not a function', async () => {
        const config = {
            host: 'https://example.com',
            authType: AuthType.TrustedAuthTokenCookieless,
            liveboardId: 'test-liveboard-id',
            getAuthToken: undefined as any,
        };

        await expect(getWebViewUrl(config)).rejects.toThrow('`getAuthToken` must be a function that returns a Promise.');
    });

    it('should throw an error if `getAuthToken` resolves to a falsy value', async () => {
        mockGetAuthToken.mockResolvedValue(null);
        const config = {
            host: 'https://example.com',
            authType: AuthType.TrustedAuthTokenCookieless,
            liveboardId: 'test-liveboard-id',
            getAuthToken: mockGetAuthToken,
        };

        await expect(getWebViewUrl(config)).rejects.toThrow('Failed to fetch initial authentication token.');
    });

    it('should encode localhost URLs correctly', async () => {
        mockGetAuthToken.mockResolvedValue('mock-token');
        const config = {
            host: 'localhost',
            authType: AuthType.TrustedAuthTokenCookieless,
            liveboardId: 'test-liveboard-id',
            getAuthToken: mockGetAuthToken,
        };

        const url = await getWebViewUrl(config);

        expect(url).toContain('hostAppUrl=local-host');
    });
});
