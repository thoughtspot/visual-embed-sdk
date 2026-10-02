import { Param } from '../types';
import { BOOT_URL_PARAMS, BOOTSTRAP_URL_PARAMS } from './bootstrap-url-params';

describe('BOOTSTRAP_URL_PARAMS', () => {
    test('is the boot params', () => {
        expect([...BOOTSTRAP_URL_PARAMS].sort()).toEqual([...BOOT_URL_PARAMS].sort());
    });

    test('has no duplicates', () => {
        expect(new Set(BOOT_URL_PARAMS).size).toBe(BOOT_URL_PARAMS.length);
    });

    test('keeps the auth and origin params', () => {
        expect(BOOT_URL_PARAMS).toEqual(
            expect.arrayContaining([
                Param.EmbedApp,
                Param.HostAppUrl,
                Param.Version,
                Param.AuthType,
            ]),
        );
    });

    test('leaves the layout flags to the APP_INIT payload', () => {
        [
            Param.LiveboardV2Enabled,
            Param.PrimaryNavHidden,
            Param.HideSearchBar,
            Param.SpotterExperienceVersion,
        ].forEach((param) => {
            expect(BOOTSTRAP_URL_PARAMS.has(param)).toBe(false);
        });
    });
});
