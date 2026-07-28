import {
    isValidUpdateFiltersPayload,
    isValidUpdateParametersPayload,
    isValidDrillDownPayload,
    createValidationError,
    throwUpdateFiltersValidationError,
    throwUpdateParametersValidationError,
    throwDrillDownValidationError,
} from './utils';
import { ERROR_MESSAGE } from '../../errors';
import { EmbedEvent } from '../../types';
import { embedEventStatus } from '../../utils';

describe('hostEventClient utils', () => {

    // =========================
    // UpdateFilters Validation
    // =========================
    describe('isValidUpdateFiltersPayload', () => {
        it('returns false for undefined', () => {
            expect(isValidUpdateFiltersPayload(undefined)).toBe(false);
        });

        it('returns false for empty payload', () => {
            expect(isValidUpdateFiltersPayload({})).toBe(false);
        });

        it('returns true for valid filter with column', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'region', oper: 'EQ', values: ['North'] },
            } as any)).toBe(true);
        });

        it('returns true for valid filter with columnName', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { columnName: 'region', oper: 'EQ', values: ['North'] },
            } as any)).toBe(true);
        });

        it('returns true for filter with operator instead of oper', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'region', operator: 'EQ', values: ['North'] },
            } as any)).toBe(true);
        });

        it('returns true for valid filters array', () => {
            expect(isValidUpdateFiltersPayload({
                filters: [
                    { column: 'x', oper: 'IN', values: ['a', 'b'] },
                    { column: 'y', oper: 'EQ', values: ['c'] },
                ],
            } as any)).toBe(true);
        });

        it('returns true for valid filters array with columnName', () => {
            expect(isValidUpdateFiltersPayload({
                filters: [
                    { columnName: 'x', oper: 'IN', values: ['a', 'b'] },
                    { columnName: 'y', oper: 'EQ', values: ['c'] },
                ],
            } as any)).toBe(true);
        });

        it('returns false if one filter in filters array is invalid', () => {
            expect(isValidUpdateFiltersPayload({
                filters: [
                    { column: 'x', oper: 'EQ', values: ['a'] },
                    { column: 'y', values: ['b'] }, // invalid
                ],
            } as any)).toBe(false);
        });

        it('returns false for filter with missing column/columnName', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { oper: 'EQ', values: ['a'] },
            } as any)).toBe(false);
        });

        it('returns false for filter with missing operator', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'x', values: ['a'] },
            } as any)).toBe(false);
        });

        it('returns false for filter with non-array values', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'x', oper: 'EQ', values: 'a' },
            } as any)).toBe(false);
        });

        it('returns false for filter with non-string type', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'x', oper: 'EQ', values: ['a'], type: 123 },
            } as any)).toBe(false);
        });

        it('returns true for filter with valid string type', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'x', oper: 'EQ', values: ['a'], type: 'STRING' },
            } as any)).toBe(true);
        });

        it('returns false for empty filters array', () => {
            expect(isValidUpdateFiltersPayload({ filters: [] } as any)).toBe(false);
        });

        it('returns false if filters is not an array', () => {
            expect(isValidUpdateFiltersPayload({
                filters: 'invalid',
            } as any)).toBe(false);
        });

        it('returns true if filter is valid even when filters is invalid', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'x', oper: 'EQ', values: ['a'] },
                filters: [{ column: 'y' }], // invalid
            } as any)).toBe(true);
        });

        it('returns true for filter without applicability', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'x', oper: 'EQ', values: ['a'] },
            } as any)).toBe(true);
        });

        it('returns true for filter with valid applicability', () => {
            expect(isValidUpdateFiltersPayload({
                filter: {
                    column: 'x',
                    oper: 'EQ',
                    values: ['a'],
                    applicability: { level: 'TAB', targetId: 'tab-guid-1' },
                },
            } as any)).toBe(true);
        });

        it('returns true for filters array with applicability on some filters', () => {
            expect(isValidUpdateFiltersPayload({
                filters: [
                    {
                        column: 'x',
                        oper: 'IN',
                        values: ['a', 'b'],
                        applicability: { level: 'TAB', targetId: 'tab-guid-1' },
                    },
                    { column: 'y', oper: 'EQ', values: ['c'] },
                ],
            } as any)).toBe(true);
        });

        it('returns false for applicability missing targetId', () => {
            expect(isValidUpdateFiltersPayload({
                filter: {
                    column: 'x',
                    oper: 'EQ',
                    values: ['a'],
                    applicability: { level: 'TAB' },
                },
            } as any)).toBe(false);
        });

        it('returns false for applicability with empty targetId', () => {
            expect(isValidUpdateFiltersPayload({
                filter: {
                    column: 'x',
                    oper: 'EQ',
                    values: ['a'],
                    applicability: { level: 'TAB', targetId: '' },
                },
            } as any)).toBe(false);
        });

        it('returns false for null applicability', () => {
            expect(isValidUpdateFiltersPayload({
                filter: {
                    column: 'x',
                    oper: 'EQ',
                    values: ['a'],
                    applicability: null,
                },
            } as any)).toBe(false);
        });

        it('returns false for non-object applicability', () => {
            expect(isValidUpdateFiltersPayload({
                filter: {
                    column: 'x',
                    oper: 'EQ',
                    values: ['a'],
                    applicability: 'TAB',
                },
            } as any)).toBe(false);
        });

        it('returns true for LIVEBOARD level applicability without targetId', () => {
            expect(isValidUpdateFiltersPayload({
                filter: {
                    column: 'x',
                    oper: 'EQ',
                    values: ['a'],
                    applicability: { level: 'LIVEBOARD' },
                },
            } as any)).toBe(true);
        });

        it('returns false for applicability missing level', () => {
            expect(isValidUpdateFiltersPayload({
                filter: {
                    column: 'x',
                    oper: 'EQ',
                    values: ['a'],
                    applicability: { targetId: 'tab-guid-1' },
                },
            } as any)).toBe(false);
        });

        it('returns false for applicability with non-string level', () => {
            expect(isValidUpdateFiltersPayload({
                filter: {
                    column: 'x',
                    oper: 'EQ',
                    values: ['a'],
                    applicability: { level: 123, targetId: 'tab-guid-1' },
                },
            } as any)).toBe(false);
        });

        it('returns false if one filter in filters array has invalid applicability', () => {
            expect(isValidUpdateFiltersPayload({
                filters: [
                    { column: 'x', oper: 'EQ', values: ['a'] },
                    {
                        column: 'y',
                        oper: 'EQ',
                        values: ['b'],
                        applicability: { level: 'TAB' }, // missing targetId
                    },
                ],
            } as any)).toBe(false);
        });
    });

    // =========================
    // UpdateParameters Validation
    // =========================
    describe('isValidUpdateParametersPayload', () => {
        it('returns true for undefined payload', () => {
            expect(isValidUpdateParametersPayload(undefined)).toBe(true);
        });

        it('returns true for non-array payload', () => {
            expect(isValidUpdateParametersPayload({ name: 'p', value: 1 })).toBe(true);
        });

        it('returns true for parameters without applicability', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p1', value: 1 },
                { name: 'p2', value: 'a' },
            ])).toBe(true);
        });

        it('returns true for null applicability', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p', value: 1, applicability: null },
            ])).toBe(true);
        });

        it('returns true for valid TAB applicability with targetId', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p', value: 1, applicability: { level: 'TAB', targetId: 'tab-guid-1' } },
            ])).toBe(true);
        });

        it('returns true for LIVEBOARD level applicability without targetId', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p', value: 1, applicability: { level: 'LIVEBOARD' } },
            ])).toBe(true);
        });

        it('returns false for applicability missing targetId', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p', value: 1, applicability: { level: 'TAB' } },
            ])).toBe(false);
        });

        it('returns false for applicability with empty targetId', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p', value: 1, applicability: { level: 'GROUP', targetId: ' ' } },
            ])).toBe(false);
        });

        it('returns false for applicability with invalid level', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p', value: 1, applicability: { level: 'VIZ', targetId: 'guid-1' } },
            ])).toBe(false);
        });

        it('returns false for non-object applicability', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p', value: 1, applicability: 'TAB' },
            ])).toBe(false);
        });

        it('returns false if one parameter has invalid applicability', () => {
            expect(isValidUpdateParametersPayload([
                { name: 'p1', value: 1 },
                { name: 'p2', value: 2, applicability: { level: 'GROUP' } }, // missing targetId
            ])).toBe(false);
        });

        it('returns true for non-object entries', () => {
            expect(isValidUpdateParametersPayload(['p', 1, null])).toBe(true);
        });
    });

    // =========================
    // DrillDown Validation
    // =========================
    describe('isValidDrillDownPayload', () => {
        it('returns false for undefined', () => {
            expect(isValidDrillDownPayload(undefined)).toBe(false);
        });

        it('returns false for empty payload', () => {
            expect(isValidDrillDownPayload({})).toBe(false);
        });

        it('returns false for empty points object', () => {
            expect(isValidDrillDownPayload({ points: {} } as any)).toBe(false);
        });

        it('returns false for non-object points', () => {
            expect(isValidDrillDownPayload({ points: 'invalid' } as any)).toBe(false);
        });

        it('returns true for clickedPoint', () => {
            expect(isValidDrillDownPayload({
                points: { clickedPoint: 'point-1' },
            } as any)).toBe(true);
        });

        it('returns true for selectedPoints', () => {
            expect(isValidDrillDownPayload({
                points: { selectedPoints: ['p1', 'p2'] },
            } as any)).toBe(true);
        });

        it('returns true for both clickedPoint and selectedPoints', () => {
            expect(isValidDrillDownPayload({
                points: { clickedPoint: 'p1', selectedPoints: ['p2'] },
            } as any)).toBe(true);
        });

        it('returns false for selectedPoints empty array', () => {
            expect(isValidDrillDownPayload({
                points: { selectedPoints: [] },
            } as any)).toBe(false);
        });

        it('returns false if clickedPoint is null', () => {
            expect(isValidDrillDownPayload({
                points: { clickedPoint: null },
            } as any)).toBe(false);
        });

        it('returns false if selectedPoints is not an array', () => {
            expect(isValidDrillDownPayload({
                points: { selectedPoints: 'invalid' },
            } as any)).toBe(false);
        });

        it('returns false if both clickedPoint and selectedPoints are invalid', () => {
            expect(isValidDrillDownPayload({
                points: { clickedPoint: null, selectedPoints: [] },
            } as any)).toBe(false);
        });
    });

    // =========================
    // Error Handling
    // =========================
    describe('createValidationError', () => {
        it('throws with message', () => {
            expect(() => createValidationError('test error')).toThrow('test error');
        });

        it('throws Error instance with metadata', () => {
            try {
                createValidationError('custom msg');
            } catch (err: any) {
                expect(err).toBeInstanceOf(Error);
                expect(err.isValidationError).toBe(true);
                expect(err.embedErrorDetails).toBeDefined();

                expect(err.embedErrorDetails).toMatchObject({
                    type: EmbedEvent.Error,
                    data: {
                        errorType: 'VALIDATION_ERROR',
                        message: 'custom msg',
                        code: 'HOST_EVENT_VALIDATION',
                        error: 'custom msg',
                    },
                    status: embedEventStatus.END,
                });
            }
        });
    });

    describe('throwUpdateFiltersValidationError', () => {
        it('throws with UPDATEFILTERS_INVALID_PAYLOAD message', () => {
            expect(() => throwUpdateFiltersValidationError())
                .toThrow(ERROR_MESSAGE.UPDATEFILTERS_INVALID_PAYLOAD);
        });
    });

    describe('throwUpdateParametersValidationError', () => {
        it('throws with UPDATEPARAMETERS_INVALID_PAYLOAD message', () => {
            expect(() => throwUpdateParametersValidationError())
                .toThrow(ERROR_MESSAGE.UPDATEPARAMETERS_INVALID_PAYLOAD);
        });
    });

    describe('throwDrillDownValidationError', () => {
        it('throws with DRILLDOWN_INVALID_PAYLOAD message', () => {
            expect(() => throwDrillDownValidationError())
                .toThrow(ERROR_MESSAGE.DRILLDOWN_INVALID_PAYLOAD);
        });
    });
});