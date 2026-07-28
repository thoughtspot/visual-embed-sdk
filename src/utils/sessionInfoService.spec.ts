import * as authServiceModule from './authService';
import * as embedConfigModule from '../embed/embedConfig';
import {
    formatPreauthInfo,
    getPreauthInfo,
    getSessionInfo,
    resetCachedPreauthInfo,
    resetCachedSessionInfo,
    getCachedSessionInfo,
    getSessionDetails,
} from './sessionInfoService';

describe('sessionInfoService', () => {
    beforeEach(() => {
        resetCachedPreauthInfo();
        resetCachedSessionInfo();
        jest.clearAllMocks();
    });

    describe('formatPreauthInfo', () => {
        it('parses headers and JSON body from a response', async () => {
            const headers = new Headers({ 'content-type': 'application/json' });
            const mockResp = {
                headers,
                json: jest.fn().mockResolvedValue({ info: { userGUID: 'u1' } }),
            };
            const result = await formatPreauthInfo(mockResp);
            expect(result.info.userGUID).toBe('u1');
            expect(result.status).toBe(200);
            expect(result.headers['content-type']).toBe('application/json');
        });

        it('returns null when response.json() throws (covers catch block)', async () => {
            const mockResp = {
                headers: null as any,
                json: jest.fn().mockRejectedValue(new Error('parse error')),
            };
            const result = await formatPreauthInfo(mockResp);
            expect(result).toBeNull();
        });

        it('handles response where headers is null (covers headers?.forEach branch)', async () => {
            const mockResp = {
                headers: null as any,
                json: jest.fn().mockResolvedValue({ info: {} }),
            };
            const result = await formatPreauthInfo(mockResp);
            expect(result.headers).toEqual({});
        });
    });

    describe('getPreauthInfo', () => {
        it('fetches and caches preauthInfo on first call', async () => {
            const mockResp = {
                headers: new Headers({ 'x-caller': 'test' }),
                json: jest.fn().mockResolvedValue({ info: { userGUID: 'u1' } }),
            };
            jest.spyOn(embedConfigModule, 'getEmbedConfig').mockReturnValue({ thoughtSpotHost: 'https://ts' } as any);
            jest.spyOn(authServiceModule, 'fetchPreauthInfoService').mockResolvedValue(mockResp as any);

            const result = await getPreauthInfo();
            expect(result.info.userGUID).toBe('u1');
        });

        it('returns cached preauthInfo on subsequent calls (covers allowCache=true && preauthInfo cached branch)', async () => {
            const mockResp = {
                headers: new Headers(),
                json: jest.fn().mockResolvedValue({ info: { userGUID: 'cached-user' } }),
            };
            jest.spyOn(embedConfigModule, 'getEmbedConfig').mockReturnValue({ thoughtSpotHost: 'https://ts' } as any);
            const fetchSpy = jest.spyOn(authServiceModule, 'fetchPreauthInfoService').mockResolvedValue(mockResp as any);

            await getPreauthInfo(); // first call — fetches and caches
            await getPreauthInfo(); // second call — should use cache

            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });

        it('returns null when fetch throws (covers catch block)', async () => {
            jest.spyOn(embedConfigModule, 'getEmbedConfig').mockReturnValue({ thoughtSpotHost: 'https://ts' } as any);
            jest.spyOn(authServiceModule, 'fetchPreauthInfoService').mockRejectedValue(new Error('network error'));

            const result = await getPreauthInfo();
            expect(result).toBeNull();
        });
    });

    describe('getSessionInfo', () => {
        it('fetches and returns session info', async () => {
            const sessionInfoResp = {
                userGUID: 'u1',
                releaseVersion: '1.0',
                configInfo: {
                    mixpanelConfig: { devSdkKey: 'dev', prodSdkKey: 'prod', production: false },
                    isPublicUser: false,
                    selfClusterId: 'c1',
                    selfClusterName: 'cluster1',
                },
            };
            jest.spyOn(embedConfigModule, 'getEmbedConfig').mockReturnValue({ thoughtSpotHost: 'https://ts' } as any);
            jest.spyOn(authServiceModule, 'fetchSessionInfoService').mockResolvedValue(sessionInfoResp as any);

            const result = await getSessionInfo();
            expect(result.userGUID).toBe('u1');
            expect(result.mixpanelToken).toBe('dev');
        });

        it('returns cached session info on second call', async () => {
            const sessionInfoResp = {
                userGUID: 'u2',
                releaseVersion: '2.0',
                configInfo: {
                    mixpanelConfig: { devSdkKey: 'dev2', prodSdkKey: 'prod2', production: true },
                    isPublicUser: false,
                    selfClusterId: 'c2',
                    selfClusterName: 'cluster2',
                },
            };
            jest.spyOn(embedConfigModule, 'getEmbedConfig').mockReturnValue({ thoughtSpotHost: 'https://ts' } as any);
            const fetchSpy = jest.spyOn(authServiceModule, 'fetchSessionInfoService').mockResolvedValue(sessionInfoResp as any);

            await getSessionInfo();
            await getSessionInfo();
            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('getCachedSessionInfo', () => {
        it('returns null before any fetch', () => {
            expect(getCachedSessionInfo()).toBeNull();
        });
    });

    describe('getSessionDetails', () => {
        it('uses prodSdkKey when production flag is true', () => {
            const resp = {
                userGUID: 'u3',
                releaseVersion: '3.0',
                configInfo: {
                    mixpanelConfig: { devSdkKey: 'dev', prodSdkKey: 'prod', production: true },
                    isPublicUser: true,
                    selfClusterId: 'c3',
                    selfClusterName: 'cluster3',
                },
            };
            const result = getSessionDetails(resp);
            expect(result.mixpanelToken).toBe('prod');
            expect(result.isPublicUser).toBe(true);
        });
    });
});
