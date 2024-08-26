import { ValidationError, convertFiltersToRuntimeFilters } from './filtersToRuntimeFilters';
import { RuntimeFilter, RuntimeFilterOp } from '../types';

describe('convertFiltersToRuntimeFilters', () => {
    test('should convert valid filters to runtime filters', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'column1' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: RuntimeFilterOp.EQ,
                                    value: [{ key: 'value1' }, { key: 'value2' }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const expected: RuntimeFilter[] = [
            {
                columnName: 'column1',
                operator: RuntimeFilterOp.EQ,
                values: ['value1', 'value2'],
            },
        ];

        expect(convertFiltersToRuntimeFilters(liveboardFiltersData)).toEqual(expected);
    });

    test('should throw ValidationError if liveboardFilters is not an array', () => {
        const liveboardFiltersData = { liveboardFilters: {} };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should throw ValidationError if columnName is missing', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: {},
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: RuntimeFilterOp.EQ,
                                    value: [{ key: 'value1' }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should throw ValidationError if operator is invalid', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'column1' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: 'INVALID_OPERATOR',
                                    value: [{ key: 'value1' }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should throw ValidationError if values are missing or invalid', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'column1' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: RuntimeFilterOp.EQ,
                                    value: 'invalid_value',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should handle empty filters array correctly', () => {
        const liveboardFiltersData: any = {
            liveboardFilters: [],
        };

        const expected: RuntimeFilter[] = [];
        expect(convertFiltersToRuntimeFilters(liveboardFiltersData)).toEqual(expected);
    });
});
