import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import pickBy from 'lodash/pickBy';
import { Action, DisabledActionReasonMap } from '../types';
import { DISABLED_ACTION_REASON_WARNING } from '../errors';
import { logger } from './logger';

const VALID_REASON_KEYS: ReadonlySet<string> = new Set<string>([
    ...Object.values(Action),
    'GENERIC_REASON',
]);

/**
 * Builds the `disableHint` param value from `disabledActionReason`.
 *
 * A string is returned unchanged and goes on the iframe URL. A map keeps only the
 * keys that are an {@link Action} or `GENERIC_REASON` and have a string
 * value, and is returned as an object, which is sent in the APP_INIT payload
 * rather than the URL. Anything ignored is logged as a warning and never fails the
 * embed.
 * @param reason - The `disabledActionReason` view config value
 * @returns The param value, or `undefined` when there is nothing to send, which
 * is the same as leaving `disabledActionReason` unset.
 * @hidden
 */
export const getDisabledActionReasonParam = (
    reason: string | DisabledActionReasonMap | undefined,
): string | Record<string, string> | undefined => {
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

    const validReasons = pickBy(reason, (value, key) => {
        if (!VALID_REASON_KEYS.has(key)) {
            logger.warn(DISABLED_ACTION_REASON_WARNING.UNKNOWN_KEY(key));
            return false;
        }
        if (!isString(value)) {
            logger.warn(DISABLED_ACTION_REASON_WARNING.NON_STRING_REASON(key));
            return false;
        }
        // An empty reason sends nothing, the same as the string form.
        return value !== '';
    }) as Record<string, string>;

    return isEmpty(validReasons) ? undefined : validReasons;
};
