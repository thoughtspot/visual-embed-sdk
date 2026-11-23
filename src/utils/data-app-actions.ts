import isPlainObject from 'lodash/isPlainObject';
import type { DataAppActions } from '../contracts/data-app-contracts';

// An action ID as the App spec declares it.
const ACTION_ID = /^[a-z][a-z0-9_]{0,63}$/;

const RULE_KEYS = ['off', 'display'];

const DISPLAYS = ['hidden', 'disabled'];

/**
 * Reads a dataAppActions option. Returns undefined for none (undefined or
 * null), the rule with `off` as 'all' or unique sorted IDs, or false when
 * the value is malformed. Nothing of the host's value is kept.
 */
export const readActionsRule = (value: unknown): DataAppActions | undefined | false => {
    if (value === undefined || value === null) return undefined;
    try {
        if (!isPlainObject(value)) return false;
        const { off, display } = value as Record<string, unknown>;
        // A sparse slot reads as undefined, which is not an ID.
        const ids = Array.isArray(off) ? Array.from(off as unknown[]) : [];
        if (Object.keys(value).some((key) => !RULE_KEYS.includes(key))
            || (off !== 'all' && !(Array.isArray(off)
                && ids.every((id) => typeof id === 'string' && ACTION_ID.test(id))))
            || (display !== undefined && !DISPLAYS.includes(display as string))) {
            return false;
        }
        const rule: DataAppActions = {
            off: off === 'all' ? 'all' : Array.from(new Set(ids as string[])).sort(),
        };
        if (display !== undefined) rule.display = display as DataAppActions['display'];
        return rule;
    } catch (e) {
        // A getter or a Proxy that throws.
        return false;
    }
};

/** True when the rule switches at least one action off. */
export const switchesOff = (rule: DataAppActions | undefined): boolean => !!rule
    && (rule.off === 'all' || rule.off.length > 0);

/**
 * True when an App's `actionsOff` names the same actions as `off`, compared
 * as a set. `off` is a rule's normalised value.
 */
export const sameActionsOff = (off: DataAppActions['off'], echo: unknown): boolean => {
    if (off === 'all' || echo === 'all') return off === echo;
    if (!Array.isArray(echo) || !echo.every((id) => typeof id === 'string')) return false;
    const echoed = new Set(echo);
    return echoed.size === off.length && off.every((id) => echoed.has(id));
};
