import { resetValueFromWindow } from '../utils';
import { getRawInitConfig, sanitizeRawConfig, setRawInitConfig } from './rawConfig';

describe('sanitizeRawConfig', () => {
    test('removes top-level login information and keeps everything else', () => {
        const customizations = { style: { customCSS: { variables: { '--a': '#fff' } } } };
        const input = {
            thoughtSpotHost: 'https://ts.example.com',
            username: 'user',
            password: 'pass',
            authToken: 'tok',
            getAuthToken: (): Promise<string> => Promise.resolve('tok'),
            customizations,
        };
        expect(sanitizeRawConfig(input)).toEqual({
            thoughtSpotHost: 'https://ts.example.com',
            customizations,
        });
    });

    test('does not mutate the input', () => {
        const input = { password: 'p', a: 1 };
        sanitizeRawConfig(input);
        expect(input).toEqual({ password: 'p', a: 1 });
    });

    test('returns an empty object for a missing config', () => {
        expect(sanitizeRawConfig(undefined)).toEqual({});
    });
});

describe('raw init config store', () => {
    afterEach(() => resetValueFromWindow('rawInitConfig'));

    test('stores a sanitized copy', () => {
        setRawInitConfig({ thoughtSpotHost: 'h', password: 'p' });
        expect(getRawInitConfig()).toEqual({ thoughtSpotHost: 'h' });
    });

    test('clears the copy when set to undefined', () => {
        setRawInitConfig({ a: 1 });
        setRawInitConfig(undefined);
        expect(getRawInitConfig()).toBeUndefined();
    });
});
