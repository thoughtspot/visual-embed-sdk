import * as tokenizedFetchModule from '../../tokenizedFetch';
import { isActiveService } from './tokenizedAuthService';
import { logger } from '../logger';

describe('tokenizedAuthService', () => {
    test('isActiveService is fetch returns ok', async () => {
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
