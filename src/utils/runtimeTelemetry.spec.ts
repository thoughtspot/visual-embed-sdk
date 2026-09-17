import {
    describeRuntimeFilters,
    describeRuntimeParameters,
    removeRuntimeDataForTelemetry,
} from './runtimeTelemetry';
import { RuntimeFilter, RuntimeFilterOp, RuntimeParameter } from '../types';
import { ApplicabilityLevel } from '../contracts/ui-passthrough-contracts';

const customerFilters: RuntimeFilter[] = [
    {
        columnName: 'Patient SSN',
        operator: RuntimeFilterOp.EQ,
        values: ['123-45-6789'],
    },
    {
        columnName: 'Revenue',
        operator: RuntimeFilterOp.BW,
        values: [1000, 5000],
    },
];

const customerParameters: RuntimeParameter[] = [
    {
        name: 'Sales Region',
        value: 'EMEA',
        applicability: { level: ApplicabilityLevel.Tab, targetId: 'tab-guid' },
    },
];

describe('describeRuntimeFilters', () => {
    test('reports the count and the operators used', () => {
        expect(describeRuntimeFilters(customerFilters)).toEqual({
            count: 2,
            operators: ['EQ', 'BW'],
        });
    });

    test('de-duplicates repeated operators', () => {
        const filters = [
            { columnName: 'a', operator: RuntimeFilterOp.EQ, values: ['x'] },
            { columnName: 'b', operator: RuntimeFilterOp.EQ, values: ['y'] },
        ];
        expect(describeRuntimeFilters(filters).operators).toEqual(['EQ']);
    });

    test('drops an operator that is not a RuntimeFilterOp member', () => {
        const filters = [
            { columnName: 'a', operator: 'a-customer-value' as any, values: ['x'] },
        ];
        expect(describeRuntimeFilters(filters)).toEqual({ count: 1, operators: [] });
    });

    test('tolerates a filter with no operator', () => {
        expect(describeRuntimeFilters([undefined as any, {} as any])).toEqual({
            count: 2,
            operators: [],
        });
    });

    test('reports an empty list', () => {
        expect(describeRuntimeFilters([])).toEqual({ count: 0, operators: [] });
    });
});

describe('describeRuntimeParameters', () => {
    test('reports the count and the applicability levels used', () => {
        expect(describeRuntimeParameters(customerParameters)).toEqual({
            count: 1,
            applicabilityLevels: ['TAB'],
        });
    });

    test('reports no level when the parameter has no applicability', () => {
        expect(describeRuntimeParameters([{ name: 'Region', value: 'EMEA' }])).toEqual({
            count: 1,
            applicabilityLevels: [],
        });
    });

    test('drops a level that is not an ApplicabilityLevel member', () => {
        const parameters = [
            { name: 'Region', value: 'EMEA', applicability: { level: 'EVERYWHERE' as any } },
        ];
        expect(describeRuntimeParameters(parameters).applicabilityLevels).toEqual([]);
    });
});

describe('removeRuntimeDataForTelemetry', () => {
    test('never returns a column name, a parameter name or an operand', () => {
        const props = removeRuntimeDataForTelemetry({
            liveboardId: 'lb-guid',
            runtimeFilters: customerFilters,
            runtimeParameters: customerParameters,
        });

        const serialised = JSON.stringify(props);
        ['Patient SSN', '123-45-6789', 'Revenue', '1000', '5000', 'Sales Region', 'EMEA', 'tab-guid'].forEach(
            (customerValue) => {
                expect(serialised).not.toContain(customerValue);
            },
        );
    });

    test('replaces both arrays with their summaries', () => {
        expect(
            removeRuntimeDataForTelemetry({
                runtimeFilters: customerFilters,
                runtimeParameters: customerParameters,
            }),
        ).toEqual({
            runtimeFilters: { count: 2, operators: ['EQ', 'BW'] },
            runtimeParameters: { count: 1, applicabilityLevels: ['TAB'] },
        });
    });

    test('leaves every other view config property untouched', () => {
        expect(
            removeRuntimeDataForTelemetry({
                liveboardId: 'lb-guid',
                fullHeight: true,
                hiddenActions: ['download'],
            }),
        ).toEqual({
            liveboardId: 'lb-guid',
            fullHeight: true,
            hiddenActions: ['download'],
        });
    });

    test('omits the keys entirely when they are absent', () => {
        const props = removeRuntimeDataForTelemetry({ liveboardId: 'lb-guid' });
        expect(props).not.toHaveProperty('runtimeFilters');
        expect(props).not.toHaveProperty('runtimeParameters');
    });

    test('drops a non-array value rather than passing it through', () => {
        const props = removeRuntimeDataForTelemetry({
            runtimeFilters: { columnName: 'Patient SSN' } as any,
            runtimeParameters: 'Sales Region' as any,
        });
        expect(props).not.toHaveProperty('runtimeFilters');
        expect(props).not.toHaveProperty('runtimeParameters');
    });

    test('tolerates an undefined view config', () => {
        expect(removeRuntimeDataForTelemetry(undefined as any)).toEqual({});
    });
});
