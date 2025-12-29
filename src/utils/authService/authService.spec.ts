import {
    fetchSessionInfoService,
    fetchAuthTokenService,
    fetchAuthService,
    fetchBasicAuthService,
    fetchAuthPostService,
    verifyTokenService,
    EndPoints,
} from '.';
import { logger } from '../logger';

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
        global.fetch = jest.fn(() => Promise.resolve({
            json: () => ({ success: true }),
            status: 200,
            ok: true,
        } as any));
        const response = await fetchSessionInfoService(thoughtSpotHost);
        expect(response.success).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`${thoughtSpotHost}${EndPoints.SESSION_INFO}`, {
            credentials: 'include',
        });
    });

    test('fetchAuthTokenService', async () => {
        global.fetch = jest.fn(() => Promise.resolve({
            text: () => ({ success: true }),
            ok: true,
        } as any));
        const response = await fetchAuthTokenService(authEndpoint);
        expect(response.text()).toStrictEqual({ success: true });
        expect(fetch).toHaveBeenCalled();
    });

    test('fetchAuthService', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ success: true, ok: true } as any));
        await fetchAuthService(thoughtSpotHost, username, authToken);
        expect(fetch).toHaveBeenCalledWith(
            `${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}?username=${username}&auth_token=${authToken}`,
            {
                credentials: 'include',
                redirect: 'manual',
            },
        );
    });

    test('fetchAuthService without username', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ success: true, ok: true } as any));
        await fetchAuthService(thoughtSpotHost, undefined, authToken);
        expect(fetch).toHaveBeenCalledWith(
            `${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}?auth_token=${authToken}`,
            {
                credentials: 'include',
                redirect: 'manual',
            },
        );
    });

    test('fetchAuthPostService', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ success: true, ok: true } as any));
        await fetchAuthPostService(thoughtSpotHost, username, authToken);
        expect(fetch).toHaveBeenCalledWith(`${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}`, {
            method: 'POST',
            credentials: 'include',
            redirect: 'manual',
            body: 'username=tsuser&auth_token=token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'x-requested-by': 'ThoughtSpot',
            },
        });
    });

    test('fetchAuthPostService without username', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ success: true, ok: true } as any));
        await fetchAuthPostService(thoughtSpotHost, undefined, authToken);
        expect(fetch).toHaveBeenCalledWith(`${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}`, {
            method: 'POST',
            credentials: 'include',
            redirect: 'manual',
            body: 'auth_token=token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'x-requested-by': 'ThoughtSpot',
            },
        });
    });

    test('fetchBasicAuthService called with manual redirect', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ success: true, ok: true } as any));
        await fetchBasicAuthService(thoughtSpotHost, username, password);
        expect(fetch).toHaveBeenCalled();
    });

    test('log error on API failures', async () => {
        jest.spyOn(logger, 'error').mockImplementation(() => undefined);
        global.fetch = jest.fn(() => Promise.resolve({
            text: () => Promise.resolve('error'),
            status: 500,
            ok: false,
        } as any));
        try {
            await fetchSessionInfoService(authVerificationUrl);
        } catch (e) {
            //
        }
        expect(logger.error).toHaveBeenCalledWith('Failed to fetch http://localhost:3000/callosum/v1/session/info', 'error');

        try {
            await fetchBasicAuthService(thoughtSpotHost, username, password);
        } catch (e) {
            expect(e.message).toContain('Failed to fetch session info');
        }
        expect(logger.error).toHaveBeenCalledWith('Failure', 'error');
    });

    test('verifyTokenService if token api works', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ success: true, ok: true } as any));
        await verifyTokenService(thoughtSpotHost, authToken);
        expect(fetch).toHaveBeenCalledWith(`${thoughtSpotHost}${EndPoints.IS_ACTIVE}`, {
            credentials: 'omit',
            headers: {
                Authorization: `Bearer ${authToken}`,
                'x-requested-by': 'ThoughtSpot',
            },
        });
    });

    test('verifyTokenService if token api fails', async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error('error')));
        jest.spyOn(logger, 'warn');
        const status = await verifyTokenService(thoughtSpotHost, authToken);
        expect(status).toBe(false);
        expect(logger.warn).toHaveBeenCalledWith('Token Verification Service failed : error');
    });
});
