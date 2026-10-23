import { Action, DisabledActionReasonMap, GENERIC_REASON } from '../types';
import { DISABLED_ACTION_REASON_WARNING } from '../errors';
import { getDisabledActionReasonParam } from './disabled-action-reason';
import { logger } from './logger';

describe('getDisabledActionReasonParam', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    test('returns a string reason unchanged', () => {
        expect(getDisabledActionReasonParam('Action denied')).toBe('Action denied');
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test('returns undefined when the reason is unset or an empty string', () => {
        expect(getDisabledActionReasonParam(undefined)).toBeUndefined();
        expect(getDisabledActionReasonParam('')).toBeUndefined();
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test('JSON-encodes a full map', () => {
        const reason = {
            [Action.Download]: 'Downloads require a Pro license',
            [Action.Save]: 'You have read-only access',
        };
        expect(JSON.parse(getDisabledActionReasonParam(reason))).toEqual(reason);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test('keeps GENERIC_REASON alongside a partial map', () => {
        const reason = {
            [Action.Download]: 'Downloads require a Pro license',
            [GENERIC_REASON]: 'Not available for your account',
        };
        expect(JSON.parse(getDisabledActionReasonParam(reason))).toEqual(reason);
    });

    test('sends a partial map without GENERIC_REASON as is', () => {
        const reason = { [Action.Download]: 'Downloads require a Pro license' };
        expect(JSON.parse(getDisabledActionReasonParam(reason))).toEqual(reason);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test('sends a map with only GENERIC_REASON', () => {
        const reason = { [GENERIC_REASON]: 'Not available for your account' };
        expect(JSON.parse(getDisabledActionReasonParam(reason))).toEqual(reason);
    });

    test('treats an empty map the same as an unset reason', () => {
        expect(getDisabledActionReasonParam({})).toBeUndefined();
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test('ignores unknown keys with a warning and keeps the valid ones', () => {
        const reason = {
            [Action.Save]: 'You have read-only access',
            notAnAction: 'dropped',
        } as DisabledActionReasonMap;
        expect(JSON.parse(getDisabledActionReasonParam(reason))).toEqual({
            [Action.Save]: 'You have read-only access',
        });
        expect(warnSpy).toHaveBeenCalledWith(
            DISABLED_ACTION_REASON_WARNING.UNKNOWN_KEY('notAnAction'),
        );
    });

    test('does not accept prototype keys', () => {
        const reason = JSON.parse('{"__proto__":"x","constructor":"y"}');
        expect(getDisabledActionReasonParam(reason)).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
            DISABLED_ACTION_REASON_WARNING.UNKNOWN_KEY('__proto__'),
        );
        expect(warnSpy).toHaveBeenCalledWith(
            DISABLED_ACTION_REASON_WARNING.UNKNOWN_KEY('constructor'),
        );
    });

    test('ignores non-string values with a warning', () => {
        const reason = {
            [Action.Save]: 42,
            [Action.Download]: 'Downloads require a Pro license',
        } as unknown as DisabledActionReasonMap;
        expect(JSON.parse(getDisabledActionReasonParam(reason))).toEqual({
            [Action.Download]: 'Downloads require a Pro license',
        });
        expect(warnSpy).toHaveBeenCalledWith(
            DISABLED_ACTION_REASON_WARNING.NON_STRING_REASON(Action.Save),
        );
    });

    test('drops empty-string values without a warning', () => {
        const reason = { [Action.Save]: '' };
        expect(getDisabledActionReasonParam(reason)).toBeUndefined();
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test.each([
        ['array', ['Action denied']],
        ['number', 42],
        ['boolean', true],
        ['map', new Map([[Action.Save, 'Read-only']])],
        ['date', new Date()],
    ])('ignores a %s with a warning', (_type, value) => {
        expect(getDisabledActionReasonParam(value as any)).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(DISABLED_ACTION_REASON_WARNING.INVALID_TYPE);
    });
});
