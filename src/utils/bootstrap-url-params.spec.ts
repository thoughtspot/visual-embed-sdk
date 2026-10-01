import { Param } from '../types';
import {
    BOOT_URL_PARAMS,
    BOOTSTRAP_URL_PARAMS,
    FIRST_RENDER_URL_PARAMS,
} from './bootstrap-url-params';

describe('BOOTSTRAP_URL_PARAMS', () => {
    test('is the boot params and the first-render params together', () => {
        expect([...BOOTSTRAP_URL_PARAMS].sort()).toEqual(
            [...BOOT_URL_PARAMS, ...FIRST_RENDER_URL_PARAMS].sort(),
        );
    });

    test('lists each param in only one of the two groups', () => {
        const overlap = BOOT_URL_PARAMS.filter((param) => FIRST_RENDER_URL_PARAMS.includes(param));

        expect(overlap).toEqual([]);
    });

    test('has no duplicates within a group', () => {
        expect(new Set(BOOT_URL_PARAMS).size).toBe(BOOT_URL_PARAMS.length);
        expect(new Set(FIRST_RENDER_URL_PARAMS).size).toBe(FIRST_RENDER_URL_PARAMS.length);
    });

    test('keeps the auth and origin params in the boot group', () => {
        expect(BOOT_URL_PARAMS).toEqual(
            expect.arrayContaining([
                Param.EmbedApp,
                Param.HostAppUrl,
                Param.Version,
                Param.AuthType,
            ]),
        );
    });

    test('keeps the layout flags in the first-render group', () => {
        expect(FIRST_RENDER_URL_PARAMS).toEqual(
            expect.arrayContaining([
                Param.LiveboardV2Enabled,
                Param.PrimaryNavHidden,
                Param.HideSearchBar,
                Param.SpotterExperienceVersion,
            ]),
        );
    });
});
