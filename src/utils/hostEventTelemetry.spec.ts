import {
    describeParams,
    getHostEventTelemetryProps,
    MAX_ARRAY_TYPES,
} from './hostEventTelemetry';
import { ContextType, HostEvent, RuntimeFilterOp } from '../types';
import { ApplicabilityLevel } from '../contracts/ui-passthrough-contracts';
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

describe('App control lists', () => {
    const secret = [{ id: 'zz_depot', value: { zzInner: ['ZZ-Austin'], operator: RuntimeFilterOp.BW, level: 'TAB' } }];

    test('reports a controls or dataAppControls list as the type of each entry, at any depth', () => {
        expect(describeParams({
            controls: [...secret, null, 'zz_route'],
            nested: { dataAppControls: secret },
        })).toEqual({
            controls: ['object', 'null', 'string'],
            nested: { dataAppControls: ['object'] },
        });
    });

    test('caps the entry types it reports', () => {
        const controls = Array.from({ length: MAX_ARRAY_TYPES + 1 }, () => secret[0]);

        expect(describeParams({ controls }).controls).toHaveLength(MAX_ARRAY_TYPES);
    });

    test('reports a list that is not an array as its type, never reading its keys', () => {
        expect(describeParams({ controls: { zz_depot: secret[0].value } })).toEqual({ controls: 'object' });
        expect(describeParams({ dataAppControls: 'zz_depot' })).toEqual({ dataAppControls: 'string' });
        expect(describeParams({ controls: null })).toEqual({ controls: 'null' });
    });

    test('describes the packed load-time values of UpdateEmbedParams by type', () => {
        expect(getHostEventTelemetryProps({
            hostEvent: HostEvent.UpdateEmbedParams,
            payload: { dataAppId: 'a1b2', dataAppInitialControls: { appId: 'a1b2', controls: secret } },
        }).params).toEqual({
            dataAppId: 'string',
            dataAppInitialControls: { appId: 'string', controls: ['object'] },
        });
    });

    test('never reports an id, a value or a key from inside a value', () => {
        const serialized = JSON.stringify(describeParams({ controls: secret, dataAppControls: secret }));

        ['zz_depot', 'zzInner', 'ZZ-Austin', 'BW', 'TAB'].forEach((text) => {
            expect(serialized).not.toContain(text);
        });
    });
});

describe('getHostEventTelemetryProps for App calls', () => {
    const entry = { id: 'zz_depot', value: { zzInner: ['ZZ-Austin'], operator: RuntimeFilterOp.EQ, level: 'TAB' } };
    const appCalls = [HostEvent.GetDataAppControls, HostEvent.UpdateDataAppControls];
    const paramsOf = (hostEvent: HostEvent, payload: unknown) => getHostEventTelemetryProps({
        hostEvent,
        payload,
        context: ContextType.DataApp,
        embedComponentType: 'dataApp',
    });

    describe.each(appCalls)('%s', (hostEvent) => {
        test.each([
            ['a well-formed payload', { controls: [entry, entry], reset: 'defaults', appId: 'a1b2' }, {
                controls: ['object', 'object'],
                reset: 'string',
                appId: 'string',
            }],
            ['a field it does not know, such as budgetMs', { controls: [entry], budgetMs: 1, zz_route: 'x' }, {
                controls: ['object'],
            }],
            ['an array at the top level', [entry], {}],
            ['a map at the top level', { zz_depot: entry.value }, {}],
            ['known keys of the wrong type', { controls: { zz_depot: {} }, reset: { level: 'TAB' }, appId: { zz: 1 } }, {
                controls: 'object',
                reset: 'object',
                appId: 'object',
            }],
            ['appId: null', { appId: null }, { appId: 'null' }],
            ['keys left undefined', { controls: undefined, appId: undefined }, {}],
            ['a string', 'zz_depot', {}],
            ['no payload', undefined, {}],
        ])('reports only controls, reset and appId, by type, for %s', (_, payload, params) => {
            const props = paramsOf(hostEvent, payload);

            expect(props).toEqual({
                hostEvent,
                contextType: ContextType.DataApp,
                embedComponentType: 'dataApp',
                sdkVersion: version,
                params,
                paramKeys: Object.keys(params),
            });
            ['zz_depot', 'zzInner', 'ZZ-Austin', 'EQ', 'TAB', 'budgetMs'].forEach((text) => {
                expect(JSON.stringify(props)).not.toContain(text);
            });
        });
    });

    test.each([
        [HostEvent.UpdateRuntimeFilters, [{ columnName: 'Region', operator: RuntimeFilterOp.EQ, values: ['west'] }]],
        [HostEvent.UpdateFilters, { filter: { column: 'Region', oper: RuntimeFilterOp.IN, values: ['west'] } }],
        [HostEvent.Pin, { vizId: 'd0a1', newVizName: 'Revenue' }],
        [HostEvent.Navigate, 'embed/insights/apps/a1b2'],
        [HostEvent.Reload, undefined],
    ])('describes %s as before', (hostEvent, payload) => {
        expect(getHostEventTelemetryProps({ hostEvent, payload }).params).toEqual(describeParams(payload));
    });
});
