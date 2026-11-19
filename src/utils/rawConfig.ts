import { getValueFromWindow, storeValueInWindow } from '../utils';

const rawInitConfigKey = 'rawInitConfig';

/**
 * Login information that must never leave the host page. Matched at every
 * depth, so a nested credential is dropped too.
 */
export const RAW_CONFIG_STRIPPED_KEYS: ReadonlySet<string> = new Set([
    'username',
    'password',
    'authToken',
    'getAuthToken',
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (value === null || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
};

/**
 * Deep-copies a config into a shape that is safe to postMessage: login
 * information and functions are dropped, and so is anything that is not a
 * primitive, an array or a plain object (for example a DOM element), since
 * structured cloning would throw on it.
 * @param value - The config, or a part of it, to copy.
 * @param seen - Objects already on the current path, to break cycles.
 */
export const sanitizeRawConfig = (value: unknown, seen: WeakSet<object> = new WeakSet()): any => {
    if (value === null) return null;
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') return value;
    if (type !== 'object') return undefined;
    if (!Array.isArray(value) && !isPlainObject(value)) return undefined;
    if (seen.has(value as object)) return undefined;
    seen.add(value as object);

    let copy: any;
    if (Array.isArray(value)) {
        copy = value
            .map((item) => sanitizeRawConfig(item, seen))
            .filter((item) => item !== undefined);
    } else {
        copy = {};
        Object.keys(value).forEach((key) => {
            if (RAW_CONFIG_STRIPPED_KEYS.has(key)) return;
            const sanitized = sanitizeRawConfig((value as Record<string, unknown>)[key], seen);
            if (sanitized !== undefined) copy[key] = sanitized;
        });
    }
    seen.delete(value as object);
    return copy;
};

/**
 * Stores a sanitized snapshot of the config passed to `init()`, before any
 * defaults are merged in.
 * @param config - The config exactly as the developer passed it.
 */
export const setRawInitConfig = (config: unknown): void => {
    storeValueInWindow(rawInitConfigKey, config === undefined ? undefined : sanitizeRawConfig(config));
};

/**
 * Returns the sanitized snapshot stored by {@link setRawInitConfig}.
 */
export const getRawInitConfig = (): Record<string, any> | undefined =>
    getValueFromWindow(rawInitConfigKey);
