import {
    fetchSessionInfoService,
    fetchAuthTokenService,
    fetchAuthService,
    fetchBasicAuthService,
} from './authService';

const thoughtSpotHost = 'http://10.79.135.124:3000';

const authVerificationUrl = 'http://localhost:3000';
const authEndpoint = '';
const username = 'tsuser';
const password = 'password';
const authToken = 'token';
describe('Unit test for authService', () => {
    beforeEach(() => {
        global.fetch = window.fetch;
    });
    test('fetchSessionInfoService', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => ({ success: true }),
                status: 200,
            }),
        );
        const response = await fetchSessionInfoService(authVerificationUrl);
        expect(response.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('fetchAuthTokenService', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                text: () => ({ success: true }),
            }),
        );
        const response = await fetchAuthTokenService(authEndpoint);
        expect(response.text()).toStrictEqual({ success: true });
        expect(fetch).toBeCalled();
    });

    test('fetchAuthService', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ success: true }));
        await fetchAuthService(authVerificationUrl, username, authToken);
        expect(fetch).toBeCalled();
    });

    test('fetchBasicAuthService', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ success: true }));
        await fetchBasicAuthService(thoughtSpotHost, username, password);
        expect(fetch).toBeCalled();
    });
});
