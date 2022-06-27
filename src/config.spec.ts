/**
 * @jest-environment node
 */

import { getThoughtSpotHost } from './config';
import { AuthType } from './types';

const embedConfig = {
    authType: AuthType.SSO,
};

describe('getThoughtSpotHost', () => {
    test('invalid config', () => {
        const testFn = () => {
            getThoughtSpotHost({
                ...embedConfig,
                thoughtSpotHost: null,
            });
        };

        expect(testFn).toThrow(TypeError);
    });

    test('IP address/hostname only', () => {
        expect(
            getThoughtSpotHost({
                ...embedConfig,
                thoughtSpotHost: '1.2.3.4',
            }),
        ).toBe('https://1.2.3.4');

        expect(
            getThoughtSpotHost({
                ...embedConfig,
                thoughtSpotHost: 'myhost',
            }),
        ).toBe('https://myhost');
    });

    test('host name and protocol', () => {
        expect(
            getThoughtSpotHost({
                ...embedConfig,
                thoughtSpotHost: 'http://myhost',
            }),
        ).toBe('http://myhost');
    });

    test('host name, protocol and port', () => {
        expect(
            getThoughtSpotHost({
                ...embedConfig,
                thoughtSpotHost: 'http://myhost:8088/',
            }),
        ).toBe('http://myhost:8088');
    });

    test('fully formed URL', () => {
        expect(
            getThoughtSpotHost({
                ...embedConfig,
                thoughtSpotHost:
                    'http://1.2.3.4:8088/v2/?foo=bar&baz=42#myhash',
            }),
        ).toBe('http://1.2.3.4:8088/v2');
    });

    test('when authtype SAML, fully formed URL with', () => {
        expect(
            getThoughtSpotHost({
                ...embedConfig,
                authType: AuthType.SAML,
                thoughtSpotHost:
                    'http://1.2.3.4:8088/v2/?foo=bar&baz=42#myhash',
            }),
        ).toBe('http://1.2.3.4:8088/v2');
    });
});
