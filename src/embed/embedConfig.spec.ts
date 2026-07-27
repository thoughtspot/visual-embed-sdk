import { getEmbedConfig, setEmbedConfig } from './embedConfig';
import { storeValueInWindow, resetValueFromWindow } from '../utils';

describe('embedConfig', () => {
    beforeEach(() => {
        // Ensure the SDK window namespace exists before resetting individual keys
        storeValueInWindow('embedConfig', undefined);
        resetValueFromWindow('embedConfig');
    });

    describe('getEmbedConfig', () => {
        test('returns empty object when no config has been set', () => {
            expect(getEmbedConfig()).toEqual({});
        });

        test('returns the config that was previously set', () => {
            const config: any = {
                thoughtSpotHost: 'https://myhost.thoughtspot.com',
                authType: 'None' as any,
            };
            setEmbedConfig(config);
            expect(getEmbedConfig()).toEqual(config);
        });

        test('returns the full config object including nested properties', () => {
            const config: any = {
                thoughtSpotHost: 'https://myhost.thoughtspot.com',
                authType: 'None' as any,
                customizations: {
                    style: {
                        customCSS: {
                            variables: { '--ts-var-root-background': '#fff' },
                        },
                    },
                },
            };
            setEmbedConfig(config);
            expect(getEmbedConfig()).toEqual(config);
        });
    });

    describe('setEmbedConfig', () => {
        test('stores the config and returns it', () => {
            const config: any = {
                thoughtSpotHost: 'https://myhost.thoughtspot.com',
                authType: 'None' as any,
            };
            const result = setEmbedConfig(config);
            expect(result).toEqual(config);
        });

        test('getEmbedConfig reflects the config after setEmbedConfig', () => {
            const config: any = {
                thoughtSpotHost: 'https://updated.thoughtspot.com',
                authType: 'TrustedAuthToken' as any,
            };
            setEmbedConfig(config);
            expect(getEmbedConfig()).toEqual(config);
        });

        test('overwrites a previously stored config', () => {
            const first: any = { thoughtSpotHost: 'https://first.com', authType: 'None' as any };
            const second: any = { thoughtSpotHost: 'https://second.com', authType: 'TrustedAuthToken' as any };
            setEmbedConfig(first);
            setEmbedConfig(second);
            expect(getEmbedConfig()).toEqual(second);
        });

        test('handles config with disableFullscreenPresentation flag', () => {
            const config: any = {
                thoughtSpotHost: 'https://myhost.thoughtspot.com',
                authType: 'None' as any,
                disableFullscreenPresentation: true,
            };
            setEmbedConfig(config);
            expect(getEmbedConfig().disableFullscreenPresentation).toBe(true);
        });
    });
});
