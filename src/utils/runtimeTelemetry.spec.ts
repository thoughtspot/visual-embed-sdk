import {
    describeRuntimeFilters,
    describeRuntimeParameters,
    summarizeRuntimeDataForTelemetry,
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

describe('summarizeRuntimeDataForTelemetry', () => {
    test('never returns a column name, a parameter name or an operand', () => {
        const props = summarizeRuntimeDataForTelemetry({
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
            summarizeRuntimeDataForTelemetry({
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
            summarizeRuntimeDataForTelemetry({
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
        const props = summarizeRuntimeDataForTelemetry({ liveboardId: 'lb-guid' });
        expect(props).not.toHaveProperty('runtimeFilters');
        expect(props).not.toHaveProperty('runtimeParameters');
    });

    test('drops a non-array value rather than passing it through', () => {
        const props = summarizeRuntimeDataForTelemetry({
            runtimeFilters: { columnName: 'Patient SSN' } as any,
            runtimeParameters: 'Sales Region' as any,
        });
        expect(props).not.toHaveProperty('runtimeFilters');
        expect(props).not.toHaveProperty('runtimeParameters');
    });

    test('tolerates an undefined view config', () => {
        expect(summarizeRuntimeDataForTelemetry(undefined as any)).toEqual({});
    });
});

describe('summarizeRuntimeDataForTelemetry with dataAppControls', () => {
    const controls = [
        { id: 'zz_depot', value: { zzInner: ['ZZ-Austin'] } },
        { id: 'zz_route', value: null },
    ];

    test.each([
        ['a list', controls, { count: 2 }],
        ['an empty list', [], { count: 0 }],
        ['null', null, { type: 'null' }],
        ['a map', { zz_depot: { zzInner: ['ZZ-Austin'] } }, { type: 'object' }],
        ['a string', 'zz_depot', { type: 'string' }],
    ])('reports %s by its count or its type only', (_, dataAppControls, summary) => {
        const props = summarizeRuntimeDataForTelemetry({ dataAppId: 'a1b2', dataAppControls });

        expect(props).toEqual({ dataAppId: 'a1b2', dataAppControls: summary });
        ['zz_depot', 'zzInner', 'ZZ-Austin', 'zz_route'].forEach((text) => {
            expect(JSON.stringify(props)).not.toContain(text);
        });
    });

    test('keeps every other view config key, and summarises the runtime arrays as before', () => {
        expect(summarizeRuntimeDataForTelemetry({
            dataAppId: 'a1b2',
            hideDataAppHeader: true,
            dataAppControls: controls,
            runtimeFilters: customerFilters,
        })).toEqual({
            dataAppId: 'a1b2',
            hideDataAppHeader: true,
            dataAppControls: { count: 2 },
            runtimeFilters: { count: 2, operators: ['EQ', 'BW'] },
        });
    });

    test.each([
        ['absent', { liveboardId: 'lb-guid' }],
        ['undefined', { liveboardId: 'lb-guid', dataAppControls: undefined }],
    ])('adds no dataAppControls key when it is %s', (_, viewConfig) => {
        expect(summarizeRuntimeDataForTelemetry(viewConfig)).toEqual({ liveboardId: 'lb-guid' });
    });
});

describe('summarizeRuntimeDataForTelemetry with dataAppActions', () => {
    test.each([
        ['all', { off: 'all', display: 'disabled' }, { off: 'all' }],
        ['a list, by its unique ids', { off: ['zz_close', 'zz_reopen', 'zz_close'] }, { off: 2 }],
        ['an empty list', { off: [] }, { off: 0 }],
        ['null', null, null],
        ['a string', 'zz_close', false],
        ['an id as off', { off: 'zz_close' }, false],
        ['a getter that throws', Object.defineProperty({}, 'off', {
            enumerable: true,
            get() {
                throw new Error('zz_close');
            },
        }), false],
    ])('reports %s as all or a count, never an id', (_, dataAppActions, summary) => {
        const props = summarizeRuntimeDataForTelemetry({ dataAppId: 'a1b2', dataAppActions });

        expect(props).toEqual({ dataAppId: 'a1b2', dataAppActions: summary });
        expect(JSON.stringify(props)).not.toContain('zz_');
    });

    test('adds no dataAppActions key when it is absent', () => {
        expect(summarizeRuntimeDataForTelemetry({ dataAppId: 'a1b2' })).toEqual({ dataAppId: 'a1b2' });
    });
});
