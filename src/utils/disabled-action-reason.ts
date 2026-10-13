import { Action, DisabledActionReasonMap, GENERIC_REASON } from '../types';
import { DISABLED_ACTION_REASON_WARNING } from '../errors';
import { logger } from './logger';

const VALID_REASON_KEYS: ReadonlySet<string> = new Set<string>([
    ...Object.values(Action),
    GENERIC_REASON,
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

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
    if (typeof reason === 'string') {
        return reason;
    }
    if (!isPlainObject(reason)) {
        const type = Array.isArray(reason) ? 'array' : typeof reason;
        logger.warn(DISABLED_ACTION_REASON_WARNING.INVALID_TYPE(type));
        return undefined;
    }

    const validReasons: Record<string, string> = {};
    Object.entries(reason).forEach(([key, value]) => {
        if (!VALID_REASON_KEYS.has(key)) {
            logger.warn(DISABLED_ACTION_REASON_WARNING.UNKNOWN_KEY(key));
            return;
        }
        if (typeof value !== 'string') {
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
