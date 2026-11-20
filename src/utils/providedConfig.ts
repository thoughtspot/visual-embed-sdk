import { getValueFromWindow, storeValueInWindow } from '../utils';

const providedInitConfigKey = 'providedInitConfig';

/**
 * Login and auth information that must never leave the host page.
 */
export const RAW_CONFIG_STRIPPED_KEYS: readonly string[] = [
    'authType',
    'username',
    'password',
    'authToken',
    'getAuthToken',
];

/**
 * Returns a shallow copy of a config with the top-level auth information
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
 * defaults are merged in. Kept on `window`, like the embed config, so it is
 * reachable when `init()` runs in a different SDK instance than the embed
 * (for example, separate micro-frontends).
 * @param config - The config exactly as the developer passed it.
 */
export const setProvidedInitConfig = (config?: Record<string, any>): void => {
    storeValueInWindow(providedInitConfigKey, config === undefined ? undefined : sanitizeRawConfig(config));
};

/**
 * Returns the sanitized copy stored by {@link setProvidedInitConfig}.
 */
export const getProvidedInitConfig = (): Record<string, any> | undefined =>
    getValueFromWindow(providedInitConfigKey);
