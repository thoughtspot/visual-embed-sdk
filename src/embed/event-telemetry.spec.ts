import {
    init, AuthType, LiveboardEmbed, HostEvent, EmbedEvent, EmbedErrorCodes, RuntimeFilterOp,
} from '../index';
import { getDocumentBody, getRootEl } from '../test/test-utils';
import { ERROR_MESSAGE } from '../errors';
import { UIPassthroughEvent } from './hostEventClient/contracts';
import { logger } from '../utils/logger';
import * as authInstance from '../auth';
import * as mixpanelInstance from '../mixpanel-service';
import { MIXPANEL_EVENT } from '../mixpanel-service';
import * as processTriggerInstance from '../utils/processTrigger';
import { RESPONSE_WAIT_MS } from '../utils/eventTelemetry';

const flushTelemetry = () => new Promise((resolve) => setTimeout(resolve, 5));

const uploadsOf = (mock: jest.SpyInstance, eventId: string) => mock.mock.calls
    .filter(([id]) => id === eventId)
    .map(([, props]) => props as Record<string, any>);

const renderLiveboard = async (config: Record<string, any> = {}) => {
    init({
        thoughtSpotHost: 'https://tshost',
        authType: AuthType.None,
        ...config,
    });
    const embed = new LiveboardEmbed(getRootEl(), {
        frameParams: { width: '100%', height: '100%' },
        liveboardId: '4c8a1b2e-0000-0000-0000-000000000001',
    });
    await embed.render();
    return embed;
};

describe('Host event telemetry', () => {
    let mockUploadMixpanelEvent: jest.SpyInstance;
    let mockProcessTrigger: jest.SpyInstance;

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
        jest.spyOn(authInstance, 'postLoginService').mockImplementation(
            () => Promise.resolve(true as any),
        );
        mockUploadMixpanelEvent = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
        mockProcessTrigger = jest
            .spyOn(processTriggerInstance, 'processTrigger')
            .mockResolvedValue({ session: 'ok' });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const triggerProps = async () => {
        await flushTelemetry();
        const uploads = uploadsOf(mockUploadMixpanelEvent, MIXPANEL_EVENT.VISUAL_SDK_HOST_EVENT);
        expect(uploads).toHaveLength(1);
        return uploads[0];
    };

    const mockPassthroughApp = (
        keys: string[],
        passthroughResult: any = [{ value: { ok: true } }],
    ) => {
        mockProcessTrigger.mockImplementation(
            (_iFrame: any, messageType: any, _host: any, data: any) => {
                if (messageType !== HostEvent.UIPassthrough) {
                    return Promise.resolve({ session: 'ok' });
                }
                if (data?.type === UIPassthroughEvent.GetAvailableUIPassthroughs) {
                    return Promise.resolve([{ value: { keys } }]);
                }
                return Promise.resolve(passthroughResult);
            },
        );
    };

    test('tells the whole story of a trigger, including what came back', async () => {
        mockProcessTrigger.mockResolvedValue({ session: 'ok', answerId: 'a-1' });
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(await triggerProps()).toEqual(
            expect.objectContaining({
                hostEvent: HostEvent.DownloadAsCsv,
                embedComponentType: 'LiveboardEmbed',
                contextType: 'none',
                hasPayload: true,
                paramCount: 1,
                paramKeys: ['vizId'],
                paramShape: ['vizId:string'],
                status: 'success',
                route: 'legacy',
                durationMs: expect.any(Number),
                responded: true,
                responseType: 'object',
                responseKeys: ['answerId', 'session'],
                responseShape: ['answerId:string', 'session:string'],
            }),
        );
    });

    test('leaves the legacy per-event upload exactly as it was', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(mockUploadMixpanelEvent).toHaveBeenCalledWith(
            `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.DownloadAsCsv}`,
        );
    });

    test('never reports a response value', async () => {
        mockProcessTrigger.mockResolvedValue({ answerName: 'Quarterly revenue', rows: [['west']] });
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        const props = await triggerProps();
        expect(props.responseKeys).toEqual(['answerName', 'rows']);
        ['Quarterly revenue', 'west'].forEach((value) => {
            expect(JSON.stringify(props)).not.toContain(value);
        });
    });

    test('reports parameter names and enum members, never customer values', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.UpdateRuntimeFilters, [
            { columnName: 'Region', operator: RuntimeFilterOp.EQ, values: ['west'] },
        ]);
        await flushTelemetry();

        const serialized = JSON.stringify(mockUploadMixpanelEvent.mock.calls);
        ['Region', 'west'].forEach((value) => expect(serialized).not.toContain(value));

        const props = await triggerProps();
        expect(props.paramKeys).toEqual(['columnName', 'operator', 'values']);
        expect(props.paramShape).toEqual(
            expect.arrayContaining([
                'payload[].columnName:string',
                'payload[].operator:EQ',
                'payload[].values:array(1)',
            ]),
        );
    });

    test('records that the app never answered', async () => {
        mockProcessTrigger.mockResolvedValue(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(await triggerProps()).toEqual(
            expect.objectContaining({
                status: 'timed-out',
                responded: false,
                durationMs: expect.any(Number),
            }),
        );
    });

    test('reports a failed trigger without its error message', async () => {
        mockProcessTrigger.mockRejectedValue(new Error('Answer 4c8a1b2e not found'));
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await expect(embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' })).rejects.toThrow();
        await flushTelemetry();

        const props = await triggerProps();
        expect(props.status).toBe('error');
        expect(JSON.stringify(props)).not.toContain('4c8a1b2e');
    });

    test('reports the ui-passthrough route for a getter the app supports', async () => {
        mockPassthroughApp([UIPassthroughEvent.GetTabs]);
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.GetTabs, {});
        await flushTelemetry();

        expect((await triggerProps()).route).toBe('ui-passthrough');
    });

    test('reports the legacy route when the app lacks the passthrough key', async () => {
        mockPassthroughApp(['someUnrelatedPassthrough']);
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.GetTabs, {});
        await flushTelemetry();

        expect((await triggerProps()).route).toBe('legacy');
    });

    test('reports the custom-handler route for a setter with custom logic', async () => {
        mockPassthroughApp([UIPassthroughEvent.PinAnswerToLiveboard]);
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.Pin, {
            newVizName: 'Quarterly revenue',
            liveboardId: '4c8a1b2e-0000-0000-0000-000000000002',
        });
        await flushTelemetry();

        expect(await triggerProps()).toEqual(
            expect.objectContaining({
                route: 'custom-handler',
                paramKeys: ['liveboardId', 'newVizName'],
            }),
        );
    });

    test('reports a custom-handler trigger that the app never answered as timed out', async () => {
        mockPassthroughApp(
            [UIPassthroughEvent.PinAnswerToLiveboard],
            new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT),
        );
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await expect(
            embed.trigger(HostEvent.Pin, {
                newVizName: 'Quarterly revenue',
                liveboardId: '4c8a1b2e-0000-0000-0000-000000000002',
            }),
        ).rejects.toBeDefined();
        await flushTelemetry();

        const props = await triggerProps();
        expect(props.status).toBe('timed-out');
        expect(props.responded).toBe(false);
    });

    test('reports a trigger called before render', async () => {
        jest.spyOn(logger, 'error').mockImplementation(() => undefined);
        init({
            thoughtSpotHost: 'https://tshost',
            authType: AuthType.None,
        });
        const embed = new LiveboardEmbed(getRootEl(), {
            frameParams: { width: '100%', height: '100%' },
            liveboardId: '4c8a1b2e-0000-0000-0000-000000000001',
        });
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });
        await flushTelemetry();

        expect(await triggerProps()).toEqual(
            expect.objectContaining({
                status: 'render-not-called',
                errorCode: EmbedErrorCodes.RENDER_NOT_CALLED,
            }),
        );
    });

    test('builds no telemetry when the host application disabled tracking', async () => {
        const embed = await renderLiveboard({ disableSDKTracking: true });
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });
        await flushTelemetry();

        expect(
            uploadsOf(mockUploadMixpanelEvent, MIXPANEL_EVENT.VISUAL_SDK_HOST_EVENT),
        ).toHaveLength(0);
        expect(mockUploadMixpanelEvent.mock.calls.map(([id]) => id)).toEqual([
            `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.DownloadAsCsv}`,
        ]);
    });
});

describe('Embed event telemetry', () => {
    let mockUploadMixpanelEvent: jest.SpyInstance;

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
        jest.spyOn(authInstance, 'postLoginService').mockImplementation(
            () => Promise.resolve(true as any),
        );
        jest.spyOn(processTriggerInstance, 'processTrigger').mockResolvedValue({ session: 'ok' });
        mockUploadMixpanelEvent = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const embedEventUploads = async () => {
        await flushTelemetry();
        return uploadsOf(mockUploadMixpanelEvent, MIXPANEL_EVENT.VISUAL_SDK_EMBED_EVENT);
    };

    test('reports an embed event the app sent, with types only', async () => {
        const embed = await renderLiveboard();
        const handler = jest.fn();
        embed.on(EmbedEvent.Data, handler);
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        (embed as any).executeCallbacks(EmbedEvent.Data, {
            status: 'end',
            data: { columnNames: ['Region'], rows: [['west', 100]] },
            answerName: 'Quarterly revenue',
        });

        const uploads = await embedEventUploads();
        expect(uploads).toHaveLength(1);
        expect(uploads[0]).toEqual(
            expect.objectContaining({
                embedEvent: EmbedEvent.Data,
                embedComponentType: 'LiveboardEmbed',
                eventStatus: 'end',
                handlerCount: 1,
            }),
        );
        expect(uploads[0].paramKeys).toEqual(['answerName', 'data', 'status']);
        ['Region', 'west', 'Quarterly revenue'].forEach((value) => {
            expect(JSON.stringify(uploads[0])).not.toContain(value);
        });
    });

    test('counts only the handlers this dispatch actually ran', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        embed.on(EmbedEvent.Data, jest.fn(), { start: true });
        embed.on(EmbedEvent.Data, jest.fn());
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        (embed as any).executeCallbacks(EmbedEvent.Data, { status: 'end' });
        const endUploads = await embedEventUploads();
        expect(endUploads[0].handlerCount).toBe(1);

        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();
        (embed as any).executeCallbacks(EmbedEvent.Data, { status: 'start' });
        const startUploads = await embedEventUploads();
        expect(startUploads[0].handlerCount).toBe(1);
    });

    test('tells the whole story when the host application responds', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        embed.on(EmbedEvent.ApiIntercept, (_data: any, responder: any) => {
            responder({ allow: true, answerName: 'Quarterly revenue' });
        });
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        (embed as any).executeCallbacks(
            EmbedEvent.ApiIntercept,
            { status: 'end', url: '/api/rest/2.0/metadata/search' },
            { postMessage: jest.fn() },
        );

        const uploads = await embedEventUploads();
        expect(uploads).toHaveLength(1);
        expect(uploads[0]).toEqual(
            expect.objectContaining({
                embedEvent: EmbedEvent.ApiIntercept,
                canRespond: true,
                responded: true,
                handlerCount: 1,
                responseTimeMs: expect.any(Number),
            }),
        );
        expect(uploads[0].responseKeys).toEqual(['allow', 'answerName']);
        expect(JSON.stringify(uploads[0])).not.toContain('Quarterly revenue');
    });

    test('records that the host application never responded', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        embed.on(EmbedEvent.ApiIntercept, jest.fn());
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        jest.useFakeTimers();
        try {
            (embed as any).executeCallbacks(
                EmbedEvent.ApiIntercept,
                { status: 'end' },
                { postMessage: jest.fn() },
            );
            jest.advanceTimersByTime(1000);
            expect(
                uploadsOf(mockUploadMixpanelEvent, MIXPANEL_EVENT.VISUAL_SDK_EMBED_EVENT),
            ).toHaveLength(0);

            jest.advanceTimersByTime(RESPONSE_WAIT_MS + 100);
            const uploads = uploadsOf(
                mockUploadMixpanelEvent, MIXPANEL_EVENT.VISUAL_SDK_EMBED_EVENT,
            );
            expect(uploads).toHaveLength(1);
            expect(uploads[0]).toEqual(
                expect.objectContaining({ canRespond: true, responded: false }),
            );
        } finally {
            jest.useRealTimers();
        }
    });

    test('does not wait for a response an event cannot receive', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        (embed as any).executeCallbacks(EmbedEvent.Data, { status: 'end' });

        const uploads = await embedEventUploads();
        expect(uploads).toHaveLength(1);
        expect(uploads[0]).toEqual(
            expect.objectContaining({ canRespond: false, responded: false }),
        );
        expect('responseTimeMs' in uploads[0]).toBe(false);
    });

    test('reports an embed event nobody is listening for', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        (embed as any).executeCallbacks(EmbedEvent.Error, { status: 'end', error: 'boom' });

        const uploads = await embedEventUploads();
        expect(uploads).toHaveLength(1);
        expect(uploads[0].handlerCount).toBe(0);
        expect(uploads[0].embedEvent).toBe(EmbedEvent.Error);
    });

    test('does not block the host application handler', async () => {
        const embed = await renderLiveboard();
        const order: string[] = [];
        embed.on(EmbedEvent.Data, () => order.push('handler'));
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();
        mockUploadMixpanelEvent.mockImplementation(() => order.push('telemetry'));

        (embed as any).executeCallbacks(EmbedEvent.Data, { status: 'end' });

        expect(order).toEqual(['handler']);
        await flushTelemetry();
        expect(order).toEqual(['handler', 'telemetry']);
    });

    test('uploads nothing at all when the host application disabled tracking', async () => {
        const embed = await renderLiveboard({ disableSDKTracking: true });
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        (embed as any).executeCallbacks(EmbedEvent.Data, { status: 'end' });

        expect(await embedEventUploads()).toHaveLength(0);
    });

    test('reports a registration the host application made', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        embed.on(EmbedEvent.Data, jest.fn());
        await flushTelemetry();

        const uploads = uploadsOf(
            mockUploadMixpanelEvent, `${MIXPANEL_EVENT.VISUAL_SDK_ON}-${EmbedEvent.Data}`,
        );
        expect(uploads).toHaveLength(1);
        expect(uploads[0]).toEqual(
            expect.objectContaining({
                embedEvent: EmbedEvent.Data,
                embedComponentType: 'LiveboardEmbed',
            }),
        );
    });

    test('ignores the SDK registering its own handlers', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        (embed as any).on(EmbedEvent.Data, jest.fn(), { start: false }, true);
        await flushTelemetry();

        expect(mockUploadMixpanelEvent).not.toHaveBeenCalled();
    });
});
