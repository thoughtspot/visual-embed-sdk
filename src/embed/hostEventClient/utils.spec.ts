import {
    isValidUpdateFiltersPayload,
    isValidDrillDownPayload,
    createValidationError,
    throwUpdateFiltersValidationError,
    throwDrillDownValidationError,
} from './utils';
import { ERROR_MESSAGE } from '../../errors';
import { EmbedEvent } from '../../types';
import { embedEventStatus } from '../../utils';

describe('hostEventClient utils', () => {
    describe('isValidUpdateFiltersPayload', () => {
        it('returns false for undefined', () => {
            expect(isValidUpdateFiltersPayload(undefined)).toBe(false);
        });

        it('returns false for empty payload', () => {
            expect(isValidUpdateFiltersPayload({})).toBe(false);
        });

        it('returns true for valid filter', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'region', oper: 'EQ', values: ['North'] },
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

        it('returns false for filter with missing column', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { oper: 'EQ', values: ['a'] },
            } as any)).toBe(false);
        });

        it('returns false for filter with missing oper', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'x', values: ['a'] },
            } as any)).toBe(false);
        });

        it('returns false for filter with non-array values', () => {
            expect(isValidUpdateFiltersPayload({
                filter: { column: 'x', oper: 'EQ', values: 'a' },
            } as any)).toBe(false);
        });

        it('returns false for empty filters array', () => {
            expect(isValidUpdateFiltersPayload({ filters: [] } as any)).toBe(false);
        });
    });

    describe('isValidDrillDownPayload', () => {
        it('returns false for undefined', () => {
            expect(isValidDrillDownPayload(undefined)).toBe(false);
        });

        it('returns false for empty payload', () => {
            expect(isValidDrillDownPayload({})).toBe(false);
        });

        it('returns false for empty points', () => {
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
    });

    describe('createValidationError', () => {
        it('throws with message and embedErrorDetails', () => {
            expect(() => createValidationError('test error')).toThrow('test error');

            try {
                createValidationError('custom msg');
            } catch (err: any) {
                expect(err.isValidationError).toBe(true);
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

    describe('throwDrillDownValidationError', () => {
        it('throws with DRILLDOWN_INVALID_PAYLOAD message', () => {
            expect(() => throwDrillDownValidationError())
                .toThrow(ERROR_MESSAGE.DRILLDOWN_INVALID_PAYLOAD);
        });
    });
});
