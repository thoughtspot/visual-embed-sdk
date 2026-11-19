import { getValueFromWindow, storeValueInWindow } from '../utils';

const rawInitConfigKey = 'rawInitConfig';

/**
 * Login information that must never leave the host page.
 */
export const RAW_CONFIG_STRIPPED_KEYS: readonly string[] = [
    'username',
    'password',
    'authToken',
    'getAuthToken',
];

/**
 * Returns a shallow copy of a config with the top-level login information
 * keys removed.
 * @param config - The config to copy.
 */
export const sanitizeRawConfig = (config?: Record<string, any>): Record<string, any> => {
    const copy = { ...(config || {}) };
    RAW_CONFIG_STRIPPED_KEYS.forEach((key) => {
        delete copy[key];
    });
    return copy;
};

/**
 * Stores a sanitized copy of the config passed to `init()`, before any
 * defaults are merged in.
 * @param config - The config exactly as the developer passed it.
 */
export const setRawInitConfig = (config?: Record<string, any>): void => {
    storeValueInWindow(rawInitConfigKey, config === undefined ? undefined : sanitizeRawConfig(config));
};

/**
 * Returns the sanitized copy stored by {@link setRawInitConfig}.
 */
export const getRawInitConfig = (): Record<string, any> | undefined =>
    getValueFromWindow(rawInitConfigKey);
