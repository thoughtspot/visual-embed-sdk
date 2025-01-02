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

    test('should construct the WebView URL correctly', async () => {
        mockGetAuthToken.mockResolvedValue('mock-token');
        const config = {
            thoughtSpotHost: 'https://lookat-webview.com',
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

    test('should throw an error if getAuthToken is not a function', async () => {
        const config = {
            thoughtSpotHost: 'https://lookat-webview.com',
            authType: AuthType.TrustedAuthTokenCookieless,
            liveboardId: 'test-liveboard-id',
            getAuthToken: undefined as any,
        };

        await expect(getWebViewUrl(config)).rejects.toThrow('`getAuthToken` must be a function that returns a Promise.');
    });

    test('should throw an error if `getAuthToken` resolves to a falsy value', async () => {
        mockGetAuthToken.mockResolvedValue(null);
        const config = {
            thoughtSpotHost: 'https://lookat-webview.com',
            authType: AuthType.TrustedAuthTokenCookieless,
            liveboardId: 'test-liveboard-id',
            getAuthToken: mockGetAuthToken,
        };

        await expect(getWebViewUrl(config)).rejects.toThrow('Failed to fetch initial authentication token.');
    });

    test('should encode localhost URLs correctly', async () => {
        mockGetAuthToken.mockResolvedValue('mock-token');
        const config = {
            thoughtSpotHost: 'localhost',
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
        thoughtSpotHost: 'https://example.com',
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
        test('should reply to and call injectJavaScript with appInit payload', async () => {
            mockConfig.getAuthToken.mockResolvedValue('mockAuthToken');
            await setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef);

            expect(mockConfig.getAuthToken).toHaveBeenCalled();
            expect(mockWebViewRef.current.injectJavaScript).toHaveBeenCalledWith(
                expect.stringContaining('"type":"appInit"'),
            );
        });

        test('should handle ThoughtspotAuthExpired and refresh the token', async () => {
            mockEvent.nativeEvent.data = JSON.stringify({ type: 'ThoughtspotAuthExpired' });
            mockConfig.getAuthToken.mockResolvedValue('bearer-token');

            await setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef);

            expect(mockConfig.getAuthToken).toHaveBeenCalled();
            expect(mockWebViewRef.current.injectJavaScript).toHaveBeenCalledWith(
                expect.stringContaining('"type":"ThoughtspotAuthExpired"'),
            );
        });

        test('should handle ThoughtspotAuthFailure and refresh the token', async () => {
            mockEvent.nativeEvent.data = JSON.stringify({ type: 'ThoughtspotAuthFailure' });
            mockConfig.getAuthToken.mockResolvedValue('bearer-token');

            await setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef);

            expect(mockConfig.getAuthToken).toHaveBeenCalled();
            expect(mockWebViewRef.current.injectJavaScript).toHaveBeenCalledWith(
                expect.stringContaining('"type":"ThoughtspotAuthFailure"'),
            );
        });

        test('should warn for unhandled message types', async () => {
            mockEvent.nativeEvent.data = JSON.stringify({ type: 'unknownType' });

            await setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef);
            expect(mockWebViewRef.current.injectJavaScript).not.toHaveBeenCalled();
        });

        test('should throw if getAuthToken fails during appInit', async () => {
            mockEvent.nativeEvent.data = JSON.stringify({ type: 'appInit' });
            mockConfig.getAuthToken.mockRejectedValue(new Error('Token fetch error'));

            await expect(setupWebViewMessageHandler(mockConfig, mockEvent, mockWebViewRef))
                .rejects
                .toThrow('Error handling appInit:');
        });

        test('should call config.handleMessage instead of default handler', async () => {
            const handleMessageSpy = jest.fn();
            const localConfig = { ...mockConfig, handleMessage: handleMessageSpy };
            mockEvent.nativeEvent.data = JSON.stringify({ type: 'appInit' });

            await setupWebViewMessageHandler(localConfig, mockEvent, mockWebViewRef);

            expect(handleMessageSpy).toHaveBeenCalledWith(mockEvent);
            // default logic never called
            expect(mockWebViewRef.current.injectJavaScript).not.toHaveBeenCalled();
        });
    });
});
