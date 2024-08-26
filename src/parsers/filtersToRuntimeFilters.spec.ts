import { ValidationError, convertFiltersToRuntimeFilters } from './filtersToRuntimeFilters';
import { RuntimeFilter, RuntimeFilterOp } from '../types';

describe('convertFiltersToRuntimeFilters', () => {
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

    test('should throw ValidationError if liveboardFilters is undefined', () => {
        const liveboardFiltersData: any = {
            liveboardFilters: undefined,
        };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should throw ValidationError if values is null', () => {
        const liveboardFiltersData: any = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'column1' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: RuntimeFilterOp.EQ,
                                    value: null,
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should throw ValidationError if value array with non-key property', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'column1' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: RuntimeFilterOp.EQ,
                                    value: [{ wrongKey: 'value1' }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should handle empty objects in liveboardFilters array correctly', () => {
        const liveboardFiltersData = {
            liveboardFilters: [{}],
        };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should throw ValidationError if multiple properties are invalid', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: {},
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: 'INVALID_OP',
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

    test('should throw ValidationError if value contains nested wrong objects', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'column1' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: RuntimeFilterOp.EQ,
                                    value: [{ key: 'value1', extra: { nested: 'object' } }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });

    test('should handle multiple values in the value property', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'columan_one' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: RuntimeFilterOp.IN,
                                    value: [{ key: 21 }, { key: 36 }],
                                },
                            ],
                        },
                    ],
                },
                {
                    columnInfo: { name: 'column_two' },
                    filters: [
                        {
                            filterContent: [
                                {
                                    filterType: RuntimeFilterOp.IN,
                                    value: [{ key: 'VAL1' }, { key: 'VAL2' }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const expected: RuntimeFilter[] = [
            {
                columnName: 'columan_one',
                operator: RuntimeFilterOp.IN,
                values: [21, 36],
            },
            {
                columnName: 'column_two',
                operator: RuntimeFilterOp.IN,
                values: ['VAL1', 'VAL2'],
            },
        ];

        expect(convertFiltersToRuntimeFilters(liveboardFiltersData)).toEqual(expected);
    });
    test('should throw ValidationError if filters property is missing', () => {
        const liveboardFiltersData = {
            liveboardFilters: [
                {
                    columnInfo: { name: 'column1' },
                },
            ],
        };
        expect(() => convertFiltersToRuntimeFilters(liveboardFiltersData)).toThrow(ValidationError);
    });
    
});
