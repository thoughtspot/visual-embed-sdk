import * as tokenizedFetchModule from '../../tokenizedFetch';
import { isActiveService, fetchSessionInfoService, fetchPreauthInfoService } from './tokenizedAuthService';
import { logger } from '../logger';
import { EndPoints } from './authService';

const thoughtspotHost = 'http://thoughtspotHost';

describe('tokenizedAuthService', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    test('isActiveService if fetch returns ok', async () => {
        jest.spyOn(tokenizedFetchModule, 'tokenizedFetch').mockResolvedValueOnce({
            ok: true,
        } as any);

        const isActiveResp = await isActiveService('http://thoughtspotHost');

        expect(isActiveResp).toEqual(true);
    });
    test('isActiveService if fetch returns not ok', async () => {
        jest.spyOn(tokenizedFetchModule, 'tokenizedFetch').mockResolvedValueOnce({
            ok: false,
        } as any);

        const isActiveResp = await isActiveService('http://thoughtspotHost');

        expect(isActiveResp).toEqual(false);
    });

    test('isActiveService if fetch fails', async () => {
        jest.spyOn(tokenizedFetchModule, 'tokenizedFetch').mockRejectedValueOnce({
            ok: false,
        });
        jest.spyOn(logger, 'warn');

        const isActiveResp = await isActiveService('http://thoughtspotHost');

        expect(isActiveResp).toEqual(false);
        expect(logger.warn).toHaveBeenCalled();
    });
});

describe('fetchPreauthInfoService', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test('fetchPreauthInfoService if fetch returns ok', async () => {
        const mockFetch = jest.spyOn(tokenizedFetchModule, 'tokenizedFetch');

        // Mock for fetchPreauthInfoService
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }), // Mock headers correctly
                status: 200,
                statusText: 'Ok',
                json: jest.fn().mockResolvedValue({
                    info: {
                        configInfo: {
                            mixpanelConfig: {
                                devSdkKey: 'devSdkKey',
                            },
                        },
                        userGUID: 'userGUID',
                    },
                }),
            } as any);

        const result = await fetchPreauthInfoService(thoughtspotHost);
        const response = await result.json();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenNthCalledWith(1, `${thoughtspotHost}${EndPoints.PREAUTH_INFO}`, {});
        expect(response).toHaveProperty('info');
    });
    it('fetchPreauthInfoService if fetch fails', async () => {
        const mockFetch = jest.spyOn(tokenizedFetchModule, 'tokenizedFetch');

        // Mock for fetchPreauthInfoService
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: jest.fn().mockResolvedValue({}),
            text: jest.fn().mockResolvedValue('Internal Server Error'),
        } as any);

        try {
            await fetchPreauthInfoService(thoughtspotHost);
        } catch (e) {
            expect(e.message).toContain(`Failed to fetch ${thoughtspotHost}${EndPoints.PREAUTH_INFO}`);
        }
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(`${thoughtspotHost}${EndPoints.PREAUTH_INFO}`, {});
    });
});
