import { resetValueFromWindow } from '../utils';
import { getRawInitConfig, sanitizeRawConfig, setRawInitConfig } from './rawConfig';

describe('sanitizeRawConfig', () => {
    test('drops login information at every depth and keeps everything else', () => {
        const input = {
            thoughtSpotHost: 'https://ts.example.com',
            username: 'user',
            password: 'pass',
            authToken: 'tok',
            getAuthToken: () => Promise.resolve('tok'),
            customizations: { style: { customCSS: { variables: { '--a': '#fff' } } } },
            nested: { password: 'deep', keep: 1 },
            list: [{ authToken: 'x', id: 'a' }, 2, 'b', false, null],
        };
        expect(sanitizeRawConfig(input)).toEqual({
            thoughtSpotHost: 'https://ts.example.com',
            customizations: { style: { customCSS: { variables: { '--a': '#fff' } } } },
            nested: { keep: 1 },
            list: [{ id: 'a' }, 2, 'b', false, null],
        });
    });

    test('drops functions, DOM elements and cycles so the result can be postMessaged', () => {
        const cyclic: any = { a: 1 };
        cyclic.self = cyclic;
        const input = {
            onClick: (): void => undefined,
            authTriggerContainer: document.createElement('div'),
            customActions: [{ id: 'c1', callback: (): void => undefined }],
            cyclic,
        };
        const result = sanitizeRawConfig(input);
        expect(result).toEqual({ customActions: [{ id: 'c1' }], cyclic: { a: 1 } });
        expect(JSON.parse(JSON.stringify(result))).toStrictEqual(result);
    });

    test('does not mutate the input', () => {
        const input = { password: 'p', a: { username: 'u' } };
        sanitizeRawConfig(input);
        expect(input).toEqual({ password: 'p', a: { username: 'u' } });
    });
});

describe('raw init config store', () => {
    afterEach(() => resetValueFromWindow('rawInitConfig'));

    test('stores a sanitized snapshot that later mutations do not reach', () => {
        const config: any = { thoughtSpotHost: 'h', password: 'p', customizations: { a: 1 } };
        setRawInitConfig(config);
        config.customizations.a = 2;
        expect(getRawInitConfig()).toEqual({ thoughtSpotHost: 'h', customizations: { a: 1 } });
    });

    test('clears the snapshot when set to undefined', () => {
        setRawInitConfig({ a: 1 });
        setRawInitConfig(undefined);
        expect(getRawInitConfig()).toBeUndefined();
    });
});
