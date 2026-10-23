import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import { Action, DisabledActionReasonMap, GENERIC_REASON } from '../types';
import { DISABLED_ACTION_REASON_WARNING } from '../errors';
import { logger } from './logger';

const VALID_REASON_KEYS: ReadonlySet<string> = new Set<string>([
    ...Object.values(Action),
    GENERIC_REASON,
]);

/**
 * Builds the `disableHint` query param value from `disabledActionReason`.
 *
 * A string is returned unchanged. A map keeps only the keys that are an
 * {@link Action} or {@link GENERIC_REASON} and have a string value, and is
 * returned JSON-encoded, the same way `disableAction` carries its array. Anything
 * ignored is logged as a warning and never fails the embed.
 * @param reason - The `disabledActionReason` view config value
 * @returns The param value, or `undefined` when there is nothing to send, which
 * is the same as leaving `disabledActionReason` unset.
 * @hidden
 */
export const getDisabledActionReasonParam = (
    reason: string | DisabledActionReasonMap | undefined,
): string | undefined => {
    if (!reason) {
        return undefined;
    }
    if (isString(reason)) {
        return reason;
    }
    // False for arrays, Maps, Dates and other built-ins.
    if (!isPlainObject(reason)) {
        logger.warn(DISABLED_ACTION_REASON_WARNING.INVALID_TYPE);
        return undefined;
    }

    const validReasons: Record<string, string> = {};
    Object.entries(reason).forEach(([key, value]) => {
        if (!VALID_REASON_KEYS.has(key)) {
            logger.warn(DISABLED_ACTION_REASON_WARNING.UNKNOWN_KEY(key));
            return;
        }
        if (!isString(value)) {
            logger.warn(DISABLED_ACTION_REASON_WARNING.NON_STRING_REASON(key));
            return;
        }
        // An empty reason sends nothing, the same as the string form.
        if (value) {
            validReasons[key] = value;
        }
    });

    return Object.keys(validReasons).length ? JSON.stringify(validReasons) : undefined;
};
