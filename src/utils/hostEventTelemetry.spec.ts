import {
    describeHostEventPayload,
    getHostEventTelemetryProps,
    MAX_SHAPE_PATHS,
    REDACTED_KEY,
} from './hostEventTelemetry';
import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { ApplicabilityLevel } from '../embed/hostEventClient/contracts';
import { version } from './sdk-version';

describe('describeHostEventPayload', () => {
    test('reports no payload for undefined and null', () => {
        [undefined, null].forEach((payload) => {
            expect(describeHostEventPayload(payload)).toEqual({
                hasPayload: false,
                payloadType: 'none',
                paramCount: 0,
                paramKeys: [],
                paramShape: [],
                shapeTruncated: false,
            });
        });
    });

    test('reports an empty object as a payload with no parameters', () => {
        const shape = describeHostEventPayload({});
        expect(shape.hasPayload).toBe(false);
        expect(shape.payloadType).toBe('object');
        expect(shape.paramCount).toBe(0);
        expect(shape.paramKeys).toEqual([]);
    });

    test('reports which parameters of an object payload are used', () => {
        const shape = describeHostEventPayload({
            newVizName: 'Quarterly revenue',
            liveboardId: '4c8a1b2e-0000-0000-0000-000000000001',
            vizId: 'd0a1',
        });
        expect(shape.paramCount).toBe(3);
        expect(shape.paramKeys).toEqual(['liveboardId', 'newVizName', 'vizId']);
        expect(shape.paramShape).toEqual([
            'liveboardId:string',
            'newVizName:string',
            'vizId:string',
        ]);
    });

    test('reports a boolean by its type, not its value', () => {
        const shape = describeHostEventPayload({ runRuntimeFilters: true, isPublic: false });
        expect(shape.paramShape).toEqual(['isPublic:boolean', 'runRuntimeFilters:boolean']);
    });

    test('reports array length and the shape of the first element', () => {
        const shape = describeHostEventPayload({
            runtimeFilters: [
                { columnName: 'Region', operator: RuntimeFilterOp.EQ, values: ['west', 'east'] },
                { columnName: 'Revenue', operator: RuntimeFilterOp.GT, values: [100] },
            ],
        });
        expect(shape.paramKeys).toEqual(['runtimeFilters']);
        expect(shape.paramShape).toEqual([
            'runtimeFilters:array(2)',
            'runtimeFilters[]:object(3)',
            'runtimeFilters[].columnName:string',
            // `operator` is an SDK enum, so the member is reported.
            'runtimeFilters[].operator:EQ',
            'runtimeFilters[].values:array(2)',
        ]);
    });

    test('reports the member of an enum parameter, by either spelling', () => {
        expect(
            describeHostEventPayload({
                filters: [{ column: 'Region', oper: RuntimeFilterOp.IN, values: ['west'] }],
            }).paramShape,
        ).toContain('filters[].oper:IN');

        expect(
            describeHostEventPayload({
                filter: {
                    column: 'Region',
                    operator: RuntimeFilterOp.BW,
                    applicability: { level: ApplicabilityLevel.Tab, targetId: 'tab-1' },
                },
            }).paramShape,
        ).toEqual(
            expect.arrayContaining(['filter.operator:BW', 'filter.applicability.level:TAB']),
        );
    });

    test('falls back to the type when an enum parameter holds something else', () => {
        const shape = describeHostEventPayload({
            filters: [{ column: 'Region', oper: 'Total Sales > 500', values: ['west'] }],
        });
        expect(shape.paramShape).toContain('filters[].oper:string');
        expect(JSON.stringify(shape)).not.toContain('Total Sales');
    });

    test('does not treat a customer value as an enum just because a sibling key does', () => {
        // `values` is never an enum parameter, so an
        // operator-shaped value in it stays a type.
        const shape = describeHostEventPayload({
            oper: RuntimeFilterOp.EQ,
            values: ['EQ'],
        });
        expect(shape.paramShape).toEqual(['oper:EQ', 'values:array(1)', 'values[]:string']);
    });

    test('reports empty containers and nulls without walking into them', () => {
        const shape = describeHostEventPayload({
            runtimeFilters: [],
            parameters: {},
            vizId: null,
        });
        expect(shape.paramShape).toEqual([
            'parameters:object(0)',
            'runtimeFilters:array(0)',
            'vizId:null',
        ]);
        expect(shape.shapeTruncated).toBe(false);
    });

    test('treats a top-level array payload as the parameter list', () => {
        const shape = describeHostEventPayload([
            { columnName: 'Region', values: ['west'] },
        ]);
        expect(shape.payloadType).toBe('array');
        expect(shape.paramCount).toBe(1);
        expect(shape.paramKeys).toEqual(['columnName', 'values']);
        expect(shape.paramShape[0]).toBe('payload:array(1)');
    });

    test('reports a primitive payload as its type only', () => {
        expect(describeHostEventPayload('answer-guid')).toEqual(
            expect.objectContaining({
                hasPayload: true,
                payloadType: 'primitive',
                paramKeys: [],
                paramShape: ['payload:string'],
            }),
        );
    });

    test('never reports a payload value', () => {
        const secrets = ['Region', 'west', 'super-secret-token', 'Quarterly revenue'];
        const shape = describeHostEventPayload({
            name: 'Quarterly revenue',
            token: 'super-secret-token',
            filters: [{ columnName: 'Region', values: ['west'] }],
        });
        const serialized = JSON.stringify(shape);
        secrets.forEach((secret) => {
            expect(serialized).not.toContain(secret);
        });
    });

    test('redacts key names that could be customer data', () => {
        const shape = describeHostEventPayload({
            'Total Sales': 100,
            région: 'west',
            [`${'a'.repeat(41)}`]: 1,
            vizId: 'd0a1',
        });
        expect(shape.paramKeys.filter((key) => key !== 'vizId')).toEqual([
            REDACTED_KEY,
            REDACTED_KEY,
            REDACTED_KEY,
        ]);
        expect(shape.paramShape).toContain('vizId:string');
        expect(shape.paramShape).not.toContain('Total Sales:number');
    });

    test('summarizes below the depth limit instead of walking the whole payload', () => {
        const shape = describeHostEventPayload({
            a: { b: { c: { d: { e: 'deep' } } } },
        });
        expect(shape.shapeTruncated).toBe(true);
        expect(shape.paramShape).toEqual([
            'a:object(1)',
            'a.b:object(1)',
            'a.b.c:object(1)',
        ]);
    });

    test('caps the number of reported key paths', () => {
        const wide: Record<string, number> = {};
        for (let i = 0; i < MAX_SHAPE_PATHS + 10; i += 1) {
            wide[`param${i}`] = i;
        }
        const shape = describeHostEventPayload(wide);
        expect(shape.paramCount).toBe(MAX_SHAPE_PATHS + 10);
        expect(shape.paramShape).toHaveLength(MAX_SHAPE_PATHS);
        expect(shape.shapeTruncated).toBe(true);
    });

    test('survives a cyclic payload', () => {
        const cyclic: any = { vizId: 'd0a1' };
        cyclic.self = cyclic;
        expect(() => describeHostEventPayload(cyclic)).not.toThrow();
        expect(describeHostEventPayload(cyclic).paramKeys).toEqual(['self', 'vizId']);
    });

    test('survives a payload with a throwing getter', () => {
        const hostile = {
            get vizId() {
                throw new Error('nope');
            },
        };
        expect(describeHostEventPayload(hostile)).toEqual(
            expect.objectContaining({ payloadType: 'unknown' }),
        );
    });
});

describe('getHostEventTelemetryProps', () => {
    test('reports the host event, context, embed component and SDK version', () => {
        expect(
            getHostEventTelemetryProps({
                hostEvent: HostEvent.Pin,
                payload: { vizId: 'd0a1' },
                context: ContextType.Liveboard,
                embedComponentType: 'LiveboardEmbed',
            }),
        ).toEqual(
            expect.objectContaining({
                hostEvent: HostEvent.Pin,
                contextType: ContextType.Liveboard,
                embedComponentType: 'LiveboardEmbed',
                sdkVersion: version,
                paramKeys: ['vizId'],
            }),
        );
    });

    test('falls back when context and embed component are unknown', () => {
        const props = getHostEventTelemetryProps({ hostEvent: HostEvent.Reload });
        expect(props.contextType).toBe('none');
        expect(props.embedComponentType).toBe('unknown');
        expect(props.hasPayload).toBe(false);
    });
});
