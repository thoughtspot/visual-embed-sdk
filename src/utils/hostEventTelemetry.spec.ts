import { describeParams, getHostEventTelemetryProps, REDACTED_KEY } from './hostEventTelemetry';
import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { version } from './sdk-version';

describe('describeParams', () => {
    test('dumps each parameter as its type, never its value', () => {
        expect(describeParams({
            newVizName: 'Quarterly revenue',
            rowCount: 10,
            runRuntimeFilters: true,
            tabId: null,
            columns: ['Region', 'Revenue'],
        })).toEqual({
            newVizName: 'string',
            rowCount: 'number',
            runRuntimeFilters: 'boolean',
            tabId: 'null',
            columns: 'array(2)',
        });
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
            values: 'array(1)',
        });
    });

    test('redacts a key name that could be customer data', () => {
        expect(describeParams({ 'Total Sales': 1, vizId: 'd0a1' })).toEqual({
            [REDACTED_KEY]: 'number',
            vizId: 'string',
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
