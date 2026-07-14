import { RuntimeFilterOp } from '../types';
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
