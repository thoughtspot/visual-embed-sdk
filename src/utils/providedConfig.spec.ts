import { resetValueFromWindow } from '../utils';
import { getProvidedInitConfig, sanitizeProvidedConfig, setProvidedInitConfig } from './providedConfig';

describe('sanitizeProvidedConfig', () => {
    test('removes top-level auth information and keeps everything else', () => {
        const customizations = { style: { customCSS: { variables: { '--a': '#fff' } } } };
        const input = {
            thoughtSpotHost: 'https://ts.example.com',
            authType: 'Basic',
            username: 'user',
            password: 'pass',
            authToken: 'tok',
            getAuthToken: (): Promise<string> => Promise.resolve('tok'),
            customizations,
        };
        expect(sanitizeProvidedConfig(input)).toEqual({
            thoughtSpotHost: 'https://ts.example.com',
            customizations,
        });
    });

    test('does not mutate the input', () => {
        const input = { password: 'p', a: 1 };
        sanitizeProvidedConfig(input);
        expect(input).toEqual({ password: 'p', a: 1 });
    });

    test('returns an empty object for a missing config', () => {
        expect(sanitizeProvidedConfig(undefined)).toEqual({});
    });
});

describe('raw init config store', () => {
    afterEach(() => resetValueFromWindow('providedInitConfig'));

    test('stores a sanitized copy', () => {
        setProvidedInitConfig({ thoughtSpotHost: 'h', password: 'p' });
        expect(getProvidedInitConfig()).toEqual({ thoughtSpotHost: 'h' });
    });

    test('clears the copy when set to undefined', () => {
        setProvidedInitConfig({ a: 1 });
        setProvidedInitConfig(undefined);
        expect(getProvidedInitConfig()).toBeUndefined();
    });
});
