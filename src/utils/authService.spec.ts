import {
    fetchSessionInfoService,
    fetchAuthTokenService,
    fetchAuthService,
    fetchBasicAuthService,
    fetchAuthPostService,
} from './authService';
import { EndPoints } from '../auth';

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
                ok: true,
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
                ok: true,
            }),
        );
        const response = await fetchAuthTokenService(authEndpoint);
        expect(response.text()).toStrictEqual({ success: true });
        expect(fetch).toBeCalled();
    });

    test('fetchAuthService', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({ success: true, ok: true }),
        );
        await fetchAuthService(thoughtSpotHost, username, authToken);
        expect(fetch).toBeCalledWith(
            `${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}?username=${username}&auth_token=${authToken}`,
            {
                credentials: 'include',
                redirect: 'manual',
            },
        );
    });

    test('fetchAuthPostService', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({ success: true, ok: true }),
        );
        await fetchAuthPostService(thoughtSpotHost, username, authToken);
        expect(fetch).toBeCalledWith(
            `${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}`,
            {
                method: 'POST',
                credentials: 'include',
                redirect: 'manual',
                body: 'username=tsuser&auth_token=token',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-requested-by': 'ThoughtSpot',
                },
            },
        );
    });

    test('fetchBasicAuthService called with manual redirect', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({ success: true, ok: true }),
        );
        await fetchBasicAuthService(thoughtSpotHost, username, password);
        expect(fetch).toBeCalled();
    });

    test('log error on API failures', async () => {
        jest.spyOn(global.console, 'error').mockImplementation(() => undefined);
        global.fetch = jest.fn(() =>
            Promise.resolve({
                text: () => Promise.resolve('error'),
                status: 500,
                ok: false,
            }),
        );
        await fetchSessionInfoService(authVerificationUrl);
        expect(global.console.error).toHaveBeenCalledWith('Failure', 'error');
    });
});
