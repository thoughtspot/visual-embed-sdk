import {
    describeParams,
    getHostEventTelemetryProps,
    MAX_ARRAY_TYPES,
} from './hostEventTelemetry';
import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { ApplicabilityLevel } from '../embed/hostEventClient/contracts';
import { version } from './sdk-version';

describe('describeParams', () => {
    test('dumps each parameter as its type, never its value', () => {
        expect(describeParams({
            newVizName: 'Quarterly revenue',
            rowCount: 10,
            runRuntimeFilters: true,
            tabId: null,
            columns: ['Region', 'Revenue'],
            points: [{ x: 1 }, null, 7],
            empty: [],
        })).toEqual({
            newVizName: 'string',
            rowCount: 'number',
            runRuntimeFilters: 'boolean',
            tabId: 'null',
            columns: ['string', 'string'],
            points: [{ x: 'number' }, 'null', 'number'],
            empty: [],
        });
    });

    test('describes nested objects all the way down', () => {
        expect(describeParams({
            filter: {
                column: 'Region',
                applicability: { level: ApplicabilityLevel.Tab, targetId: 'tab-1' },
            },
        })).toEqual({
            filter: {
                column: 'string',
                applicability: { level: 'TAB', targetId: 'string' },
            },
        });
    });

    test('caps how many element types it reports for a long array', () => {
        const values = Array.from({ length: MAX_ARRAY_TYPES + 5 }, (_v, i) => `value-${i}`);
        expect(describeParams({ values }).values).toHaveLength(MAX_ARRAY_TYPES);
    });

    test('keeps the member of an enum parameter, by either spelling', () => {
        expect(describeParams({ operator: RuntimeFilterOp.EQ })).toEqual({ operator: 'EQ' });
        expect(describeParams({ oper: RuntimeFilterOp.IN })).toEqual({ oper: 'IN' });
    });

    test('falls back to the type when an enum parameter holds something else', () => {
        expect(describeParams({ operator: 'Total Sales > 500' })).toEqual({ operator: 'string' });
    });

    test('reads the parameters of an array payload from its first element', () => {
        expect(describeParams([
            { columnName: 'Region', operator: RuntimeFilterOp.EQ, values: ['west'] },
        ])).toEqual({
            columnName: 'string',
            operator: 'EQ',
            values: ['string'],
        });
    });

    test('reports a bigint parameter as its type instead of losing the payload', () => {
        expect(describeParams([
            {
                columnName: 'Revenue',
                operator: RuntimeFilterOp.EQ,
                values: [BigInt(10), 'west'],
            },
        ])).toEqual({
            columnName: 'string',
            operator: 'EQ',
            values: ['bigint', 'string'],
        });
    });

    test('reports nothing for a payload it cannot serialise', () => {
        const circular: any = { vizId: 'd0a1' };
        circular.self = circular;
        expect(describeParams(circular)).toEqual({});

        const loop: any[] = ['west'];
        loop.push(loop);
        expect(describeParams({ values: loop })).toEqual({});

        const throwing = {
            get vizId(): string {
                throw new Error('nope');
            },
        };
        expect(describeParams(throwing)).toEqual({});
    });

    test('drops a function or undefined parameter instead of choking on it', () => {
        expect(describeParams({
            vizId: 'd0a1',
            callback: (): void => undefined,
            missing: undefined,
            handlers: [(): void => undefined, 'x'],
        })).toEqual({
            vizId: 'string',
            handlers: ['null', 'string'],
        });
    });

    test('reports nothing for a payload with no parameters', () => {
        [undefined, null, {}, [], 'answer-guid', 42].forEach((payload) => {
            expect(describeParams(payload)).toEqual({});
        });
    });

    test('never reports a payload value', () => {
        const serialized = JSON.stringify(describeParams({
            name: 'Quarterly revenue',
            token: 'secret-token-abc',
            columns: ['Region'],
        }));
        ['Quarterly revenue', 'secret-token-abc', 'Region'].forEach((secret) => {
            expect(serialized).not.toContain(secret);
        });
    });
});

describe('getHostEventTelemetryProps', () => {
    test('reports the host event, context, embed component and SDK version', () => {
        expect(getHostEventTelemetryProps({
            hostEvent: HostEvent.Pin,
            payload: { vizId: 'd0a1' },
            context: ContextType.Liveboard,
            embedComponentType: 'LiveboardEmbed',
        })).toEqual({
            hostEvent: HostEvent.Pin,
            contextType: ContextType.Liveboard,
            embedComponentType: 'LiveboardEmbed',
            sdkVersion: version,
            params: { vizId: 'string' },
            paramKeys: ['vizId'],
        });
    });

    test('falls back when context and embed component are unknown', () => {
        expect(getHostEventTelemetryProps({ hostEvent: HostEvent.Reload })).toEqual(
            expect.objectContaining({
                contextType: 'none',
                embedComponentType: 'unknown',
                params: {},
                paramKeys: [],
            }),
        );
    });
});
