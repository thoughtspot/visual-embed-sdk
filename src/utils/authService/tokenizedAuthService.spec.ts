import * as tokenizedFetchModule from '../../tokenizedFetch';
import { isActiveService, fetchSessionInfoService } from './tokenizedAuthService';
import { EndPoints } from './authService';
import { logger } from '../logger';

const thoughtspotHost = 'http://thoughtspotHost';

describe('tokenizedAuthService', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test('isActiveService if fetch returns ok', async () => {
        jest.spyOn(tokenizedFetchModule, 'tokenizedFetch').mockResolvedValueOnce({
            ok: true,
        });

        const isActiveResp = await isActiveService('http://thoughtspotHost');

        expect(isActiveResp).toEqual(true);
    });
    test('isActiveService if fetch returns not ok', async () => {
        jest.spyOn(tokenizedFetchModule, 'tokenizedFetch').mockResolvedValueOnce({
            ok: false,
        });

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

describe('fetchSessionInfoService', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test('fetchSessionInfoService should return a V2 info response containing the info key', async () => {
        jest.spyOn(tokenizedFetchModule, 'tokenizedFetch').mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }), // Mock headers correctly
            json: async () => ({
                info: {
                    configInfo: {
                        mixpanelConfig: {
                            devSdkKey: 'devSdkKey',
                        },
                    },
                    userGUID: 'userGUID',
                },
            }), // Mock JSON response
        });

        let sessionInfoResp;
        try {
            sessionInfoResp = await fetchSessionInfoService('http://thoughtspotHost');
        } catch (e) {
            //
        }

        // Check if the returned data contains the 'info' key
        expect(sessionInfoResp).toHaveProperty('info');
    });

    it('should handle a 404 error from fetchPreauthInfoService and call fetchV1InfoService', async () => {
        const mockFetch = jest.spyOn(tokenizedFetchModule, 'tokenizedFetch');

        // Mock for fetchPreauthInfoService
        mockFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                message: 'Not Found',
                json: jest.fn().mockResolvedValue({}),
                text: jest.fn().mockResolvedValue('Not Found'),
            })
            // Mock for fetchV1InfoService
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue({ data: 'mocked session info' }),
            });

        const result = await fetchSessionInfoService(thoughtspotHost);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(1, `${thoughtspotHost}${EndPoints.PREAUTH_INFO}`, {});
        expect(mockFetch).toHaveBeenNthCalledWith(2, `${thoughtspotHost}${EndPoints.SESSION_INFO}`, {});
        expect(result).toEqual({ data: 'mocked session info' });
    });

    it('should handle a error from both fetchPreauthInfoService and call fetchV1InfoService', async () => {
        const mockFetch = jest.spyOn(tokenizedFetchModule, 'tokenizedFetch');

        // Mock for fetchPreauthInfoService
        mockFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: jest.fn().mockResolvedValue({}),
                text: jest.fn().mockResolvedValue('Not Found'),
            })
            // Mock for fetchV1InfoService
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Something went wrong',
                text: jest.fn().mockResolvedValue('Internal Server Error'),
                json: jest.fn().mockResolvedValue({ data: 'mocked session info' }),
            });

        try {
            await fetchSessionInfoService(thoughtspotHost);
        } catch (e) {
            expect(e.message).toContain('Failed to fetch session info: Something went wrong');
        }

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(1, `${thoughtspotHost}${EndPoints.PREAUTH_INFO}`, {});
        expect(mockFetch).toHaveBeenNthCalledWith(2, `${thoughtspotHost}${EndPoints.SESSION_INFO}`, {});
    });

    it('should return an empty object if an error other than 404 occurs', async () => {
        const mockFetch = jest.spyOn(tokenizedFetchModule, 'tokenizedFetch');

        // Mock for fetchPreauthInfoService
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: jest.fn().mockResolvedValue({}),
            text: jest.fn().mockResolvedValue('Internal Server Error'),
        });

        const result = await fetchSessionInfoService(thoughtspotHost);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(`${thoughtspotHost}${EndPoints.PREAUTH_INFO}`, {});
        expect(result).toEqual({});
    });
});
