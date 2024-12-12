import { getWebViewUrl, setupWebViewMessageHandler } from './commonUtils'; // Adjust the import path
import { AuthType } from '../types';
import pkgInfo from '../../package.json';

jest.mock('../utils', () => ({
    getQueryParamString: jest.fn((params) => Object.keys(params).map(key => `${key}=${params[key]}`).join('&')),
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

    it('should throw an error if `getAuthToken` is not a function', async () => {
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

//describe('setupWebViewMessageHandler', () => {
//    const mockInjectJavaScript = jest.fn();
//     const mockGetAuthToken = jest.fn();

//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it('should handle `appInit` message correctly', async () => {
//         mockGetAuthToken.mockResolvedValue('mock-token');
//         const config = {
//             host: 'https://example.com',
//             authType: AuthType.TrustedAuthTokenCookieless,
//             liveboardId: 'test-liveboard-id',
//             getAuthToken: mockGetAuthToken,
//         };

//         const event = {
//             nativeEvent: {
//                 data: JSON.stringify({ type: 'appInit' }),
//             },
//         };

//         setupWebViewMessageHandler(config, event, mockInjectJavaScript);

//         expect(mockGetAuthToken).toHaveBeenCalledTimes(1);
//         expect(mockInjectJavaScript).toHaveBeenCalledWith(
//             `window.postMessage(${JSON.stringify({
//                 type: 'appInit',
//                 data: {
//                     host: config.host,
//                     authToken: 'mock-token',
//                 },
//             })}, '*');`
//         );
//     });

//     it('should handle `ThoughtspotAuthExpired` message correctly', async () => {
//         mockGetAuthToken.mockResolvedValue('new-token');
//         const config = {
//             host: 'https://example.com',
//             authType: AuthType.TrustedAuthTokenCookieless,
//             liveboardId: 'test-liveboard-id',
//             getAuthToken: mockGetAuthToken,
//         };

//         const event = {
//             nativeEvent: {
//                 data: JSON.stringify({ type: 'ThoughtspotAuthExpired' }),
//             },
//         };

//         await setupWebViewMessageHandler(config, event, mockInjectJavaScript);

//         expect(mockGetAuthToken).toHaveBeenCalledTimes(1);
//         expect(mockInjectJavaScript).toHaveBeenCalledWith(
//             `window.postMessage(${JSON.stringify({
//                 type: 'ThoughtspotAuthExpired',
//                 data: { authToken: 'new-token' },
//             })}, '*');`
//         );
//     });

//     it('should handle `ThoughtspotAuthFailure` message correctly', async () => {
//         mockGetAuthToken.mockResolvedValue('new-token');
//         const config = {
//             host: 'https://example.com',
//             authType: AuthType.TrustedAuthTokenCookieless,
//             liveboardId: 'test-liveboard-id',
//             getAuthToken: mockGetAuthToken,
//         };

//         const event = {
//             nativeEvent: {
//                 data: JSON.stringify({ type: 'ThoughtspotAuthFailure' }),
//             },
//         };

//         await setupWebViewMessageHandler(config, event, mockInjectJavaScript);

//         expect(mockGetAuthToken).toHaveBeenCalledTimes(1);
//         expect(mockInjectJavaScript).toHaveBeenCalledWith(
//             `window.postMessage(${JSON.stringify({
//                 type: 'ThoughtspotAuthFailure',
//                 data: { authToken: 'new-token' },
//             })}, '*');`
//         );
//     });

//     it('should warn for unhandled message types', async () => {
//         console.warn = jest.fn();

//         const config = {
//             host: 'https://example.com',
//             authType: AuthType.TrustedAuthTokenCookieless,
//             liveboardId: 'test-liveboard-id',
//             getAuthToken: mockGetAuthToken,
//         };

//         const event = {
//             nativeEvent: {
//                 data: JSON.stringify({ type: 'UnknownMessageType' }),
//             },
//         };

//         await setupWebViewMessageHandler(config, event, mockInjectJavaScript);

//         expect(console.warn).toHaveBeenCalledWith('Unhandled message type:', 'UnknownMessageType');
//     });

//     it('should use custom `handleMessage` if provided', async () => {
//         const mockHandleMessage = jest.fn();
//         const config = {
//             host: 'https://example.com',
//             authType: AuthType.TrustedAuthTokenCookieless,
//             liveboardId: 'test-liveboard-id',
//             getAuthToken: mockGetAuthToken,
//             handleMessage: mockHandleMessage,
//         };

//         const event = {
//             nativeEvent: {
//                 data: JSON.stringify({ type: 'appInit' }),
//             },
//         };

//         await setupWebViewMessageHandler(config, event, mockInjectJavaScript);

//         expect(mockHandleMessage).toHaveBeenCalledWith(event, mockInjectJavaScript);
//         expect(mockGetAuthToken).not.toHaveBeenCalled(); // Ensure default handler is not called
//         expect(mockInjectJavaScript).not.toHaveBeenCalled(); // Ensure no injection happens
//     });
// });

