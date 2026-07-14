import { RuntimeFilterOp } from '../types';
import { isValidUpdateFiltersPayload } from '../embed/hostEventClient/utils';
import { convertFilterChangedToUpdateFiltersPayload, FilterChangedPayload } from './filterConverter';

describe('convertFilterChangedToUpdateFiltersPayload', () => {
    test('returns an empty filters array for an empty payload', () => {
        expect(convertFilterChangedToUpdateFiltersPayload({})).toEqual({ filters: [] });
    });

    test('returns an empty filters array for null/undefined input', () => {
        expect(convertFilterChangedToUpdateFiltersPayload(null as any)).toEqual({ filters: [] });
        expect(convertFilterChangedToUpdateFiltersPayload(undefined as any)).toEqual({ filters: [] });
    });

    test('converts runtime filters as-is', () => {
        const payload: FilterChangedPayload = {
            runtimeFilters: [
                { columnName: 'state', operator: RuntimeFilterOp.EQ, values: ['california'] },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'state', operator: RuntimeFilterOp.EQ, values: ['california'] },
            ],
        });
    });

    test('converts a simple attribute filter (filterContent)', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'item type' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: 'IN',
                                    value: [{ key: 'bags' }, { key: 'shirts' }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'item type', operator: 'IN', values: ['bags', 'shirts'] },
            ],
        });
    });

    test('includes negate when set on a filterContent filter', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'region' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: 'EQ',
                                    negate: true,
                                    value: [{ key: 'west' }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'region', operator: 'EQ', values: ['west'], negate: true },
            ],
        });
    });

    test('skips a filter group with no columnInfo.name', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    filters: [
                        { filterContent: [{ filterType: 'EQ', value: [{ key: 'x' }] }] },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({ filters: [] });
    });

    test('skips a filter with neither filterContent nor dateFilterContent', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'region' },
                    filters: [{}],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({ filters: [] });
    });

    test('converts an EXACT_DATE filter using epoch', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        {
                            dateFilterContent: [
                                {
                                    dateFilter: { type: 'EXACT_DATE', op: 'EQ', epoch: '1690847400' },
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                {
                    columnName: 'date', operator: 'EQ', values: [1690847400], type: 'EXACT_DATE',
                },
            ],
        });
    });

    test('converts an EXACT_DATE_RANGE filter using dateRange epochs', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        {
                            dateFilterContent: [
                                {
                                    dateFilter: {
                                        type: 'EXACT_DATE_RANGE',
                                        op: 'BW_INC',
                                        dateRange: { lowEpoch: '100', highEpoch: '200' },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                {
                    columnName: 'date', operator: 'BW_INC', values: [100, 200], type: 'EXACT_DATE_RANGE',
                },
            ],
        });
    });

    test('converts a MONTH_YEAR filter', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        {
                            dateFilterContent: [
                                {
                                    dateFilter: {
                                        type: 'MONTH_YEAR', op: 'EQ', monthName: 'JULY', yearName: '2023',
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                {
                    columnName: 'date', operator: 'EQ', values: ['JULY', '2023'], type: 'MONTH_YEAR',
                },
            ],
        });
    });

    test('converts a QUARTER_YEAR filter', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        {
                            dateFilterContent: [
                                {
                                    dateFilter: {
                                        type: 'QUARTER_YEAR', op: 'EQ', quarterName: 'Q1', yearName: '2023',
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                {
                    columnName: 'date', operator: 'EQ', values: ['Q1', '2023'], type: 'QUARTER_YEAR',
                },
            ],
        });
    });

    test('converts a YEAR_ONLY filter', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        {
                            dateFilterContent: [
                                { dateFilter: { type: 'YEAR_ONLY', op: 'EQ', yearName: '2023' } },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'date', operator: 'EQ', values: ['2023'], type: 'YEAR_ONLY' },
            ],
        });
    });

    test('converts a LAST_N_PERIOD filter with datePeriod and includeCurrentPeriod', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        {
                            dateFilterContent: [
                                {
                                    negate: true,
                                    dateFilter: {
                                        type: 'LAST_N_PERIOD',
                                        op: 'EQ',
                                        number: 3,
                                        datePeriod: 'MONTH',
                                        includeCurrentPeriod: true,
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                {
                    columnName: 'date',
                    operator: 'EQ',
                    values: [3],
                    type: 'LAST_N_PERIOD',
                    datePeriod: 'MONTH',
                    includeCurrentPeriod: true,
                    negate: true,
                },
            ],
        });
    });

    test('converts a period-only date filter (e.g. TODAY) with empty values', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        {
                            dateFilterContent: [
                                { dateFilter: { type: 'TODAY', op: 'EQ' } },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'date', operator: 'EQ', values: [], type: 'TODAY' },
            ],
        });
    });

    test('skips a dateFilterContent entry with no type', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        { dateFilterContent: [{ dateFilter: {} }] },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({ filters: [] });
    });

    test('defaults operator to EQ when dateFilter.op is missing', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        { dateFilterContent: [{ dateFilter: { type: 'TODAY' } }] },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'date', operator: RuntimeFilterOp.EQ, values: [], type: 'TODAY' },
            ],
        });
    });

    test('converts every filterContent entry on a filter, not just the first', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'quantity' },
                    filters: [
                        {
                            filterContent: [
                                { filterType: 'GE', value: [{ key: 5 }] },
                                { filterType: 'LE', value: [{ key: 10 }] },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'quantity', operator: 'GE', values: [5] },
                { columnName: 'quantity', operator: 'LE', values: [10] },
            ],
        });
    });

    test('converts every Filter entry in a filter group, not just the first', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'region' },
                    filters: [
                        { filterContent: [{ filterType: 'EQ', value: [{ key: 'west' }] }] },
                        { filterContent: [{ filterType: 'EQ', value: [{ key: 'east' }] }] },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'region', operator: 'EQ', values: ['west'] },
                { columnName: 'region', operator: 'EQ', values: ['east'] },
            ],
        });
    });

    test('keeps falsy-but-defined filter values such as 0 and false', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'flag' },
                    filters: [
                        {
                            filterContent: [
                                { filterType: 'IN', value: [{ key: 0 }, { key: false }] },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'flag', operator: 'IN', values: [0, false] },
            ],
        });
    });

    test('skips an EXACT_DATE filter missing its epoch instead of emitting empty values', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        { dateFilterContent: [{ dateFilter: { type: 'EXACT_DATE', op: 'EQ' } }] },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({ filters: [] });
    });

    test('skips a MONTH_YEAR filter missing yearName instead of emitting empty values', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        {
                            dateFilterContent: [
                                { dateFilter: { type: 'MONTH_YEAR', op: 'EQ', monthName: 'JULY' } },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({ filters: [] });
    });

    test('skips an unrecognized date filter type rather than guessing', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'date' },
                    filters: [
                        { dateFilterContent: [{ dateFilter: { type: 'SOME_FUTURE_TYPE', op: 'EQ' } }] },
                    ],
                },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({ filters: [] });
    });

    test('output satisfies isValidUpdateFiltersPayload', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'item type' },
                    filters: [
                        { filterContent: [{ filterType: 'IN', value: [{ key: 'bags' }] }] },
                    ],
                },
            ],
            runtimeFilters: [
                { columnName: 'region', operator: RuntimeFilterOp.EQ, values: ['west'] },
            ],
        };

        const converted = convertFilterChangedToUpdateFiltersPayload(payload);
        expect(isValidUpdateFiltersPayload(converted as any)).toBe(true);
    });

    test('combines multiple liveboard filters and runtime filters', () => {
        const payload: FilterChangedPayload = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'item type' },
                    filters: [
                        { filterContent: [{ filterType: 'IN', value: [{ key: 'bags' }] }] },
                    ],
                },
            ],
            runtimeFilters: [
                { columnName: 'region', operator: RuntimeFilterOp.EQ, values: ['west'] },
            ],
        };

        expect(convertFilterChangedToUpdateFiltersPayload(payload)).toEqual({
            filters: [
                { columnName: 'item type', operator: 'IN', values: ['bags'] },
                { columnName: 'region', operator: RuntimeFilterOp.EQ, values: ['west'] },
            ],
        });
    });
});
