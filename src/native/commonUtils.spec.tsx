import { getWebViewUrl, setupWebViewMessageHandler } from './commonUtils'; // Adjust the import path
import { AuthType } from '../types';
import pkgInfo from '../../package.json';

jest.mock('../utils', () => ({
    getQueryParamString: jest.fn((params) => Object.keys(params).map((key: any) => `${key}=${params[key]}`).join('&')),
    getCustomisationsMobileEmbed: jest.fn(() => ({ customKey: 'customValue' })),
}));

describe('getWebViewUrl', () => {
    const mockGetAuthToken = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should construct the WebView URL correctly', async () => {
        mockGetAuthToken.mockResolvedValue('mock-token');
        const config = {
            host: 'https://lookat-webview.com',
            authType: AuthType.TrustedAuthTokenCookieless,
            liveboardId: 'test-liveboard-id',
            getAuthToken: mockGetAuthToken,
        };

        const url = await getWebViewUrl(config);

        expect(mockGetAuthToken).toHaveBeenCalledTimes(1);
        expect(url).toContain('https://lookat-webview.com/embed');
        expect(url).toContain(`authType=${AuthType.TrustedAuthTokenCookieless}`);
        expect(url).toContain('test-liveboard-id');
        expect(url).toContain(`sdkVersion=${pkgInfo.version}`);
    });

    it('should throw an error if getAuthToken is not a function', async () => {
        const config = {
            host: 'https://lookat-webview.com',
            authType: AuthType.TrustedAuthTokenCookieless,
            liveboardId: 'test-liveboard-id',
            getAuthToken: undefined as any,
        };

        await expect(getWebViewUrl(config)).rejects.toThrow('`getAuthToken` must be a function that returns a Promise.');
    });

    it('should throw an error if `getAuthToken` resolves to a falsy value', async () => {
        mockGetAuthToken.mockResolvedValue(null);
        const config = {
            host: 'https://lookat-webview.com',
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

describe('WebView Utilities', () => {
    const mockConfig = {
        host: 'https://example.com',
        authType: AuthType.TrustedAuthTokenCookieless,
        liveboardId: '1234',
        getAuthToken: jest.fn(),
    };

    const mockWebViewRef = {
        current: {
            injectJavaScript: jest.fn(),
        },
    };

    let mockEvent: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockEvent = {
            nativeEvent: {
                data: JSON.stringify({ type: 'appInit' }),
            },
        };
    });

    describe('setupWebViewMessageHandler', () => {
        it('should reply to and call injectJavaScript with appInit payload', async () => {
            mockConfig.getAuthToken.mockResolvedValue('mockAuthToken');
    
            await setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef);
    
            expect(mockConfig.getAuthToken).toHaveBeenCalled();
            expect(mockWebViewRef.current.injectJavaScript).toHaveBeenCalledWith(
                expect.stringContaining('"type":"appInit"'),
            );
        });
    
        it('should handle ThoughtspotAuthExpired and refresh the token', async () => {
            mockEvent.nativeEvent.data = JSON.stringify({ type: 'ThoughtspotAuthExpired' });
            mockConfig.getAuthToken.mockResolvedValue('bearer-token');
    
            await setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef);
    
            expect(mockConfig.getAuthToken).toHaveBeenCalled();
            expect(mockWebViewRef.current.injectJavaScript).toHaveBeenCalledWith(
                expect.stringContaining('"type":"ThoughtspotAuthExpired"'),
            );
        });

        it('should handle ThoughtspotAuthFailure and refresh the token', async () => {
            mockEvent.nativeEvent.data = JSON.stringify({ type: 'ThoughtspotAuthFailure' });
            mockConfig.getAuthToken.mockResolvedValue('bearer-token');
    
            await setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef);
    
            expect(mockConfig.getAuthToken).toHaveBeenCalled();
            expect(mockWebViewRef.current.injectJavaScript).toHaveBeenCalledWith(
                expect.stringContaining('"type":"ThoughtspotAuthFailure"'),
            );
        });
    
        it('should warn for unhandled message types', async () => {
            mockEvent.nativeEvent.data = JSON.stringify({ type: 'unknownType' });
    
            await setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef);    
            expect(mockWebViewRef.current.injectJavaScript).not.toHaveBeenCalled();
        });
    });
});
