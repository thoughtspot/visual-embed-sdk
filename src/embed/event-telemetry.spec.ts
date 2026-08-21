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

    const triggerProps = async (hostEvent: HostEvent) => {
        await flushTelemetry();
        const uploads = uploadsOf(
            mockUploadMixpanelEvent,
            `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${hostEvent}`,
        );
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

    test('enriches the existing per-event upload instead of adding another', async () => {
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });
        await flushTelemetry();

        expect(await triggerProps(HostEvent.DownloadAsCsv)).toEqual(
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
            }),
        );
        expect(mockUploadMixpanelEvent.mock.calls.map(([id]) => id)).toEqual([
            `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.DownloadAsCsv}`,
        ]);
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

        const props = await triggerProps(HostEvent.UpdateRuntimeFilters);
        expect(props.paramKeys).toEqual(['columnName', 'operator', 'values']);
        expect(props.paramShape).toEqual(
            expect.arrayContaining([
                'payload[].columnName:string',
                'payload[].operator:EQ',
                'payload[].values:array(1)',
            ]),
        );
    });

    test('sends a no-response event when the app never answers', async () => {
        mockProcessTrigger.mockResolvedValue(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });
        await flushTelemetry();

        expect((await triggerProps(HostEvent.DownloadAsCsv)).status).toBe('timed-out');
        const noResponse = uploadsOf(
            mockUploadMixpanelEvent, MIXPANEL_EVENT.VISUAL_SDK_HOST_EVENT_NO_RESPONSE,
        );
        expect(noResponse).toHaveLength(1);
        expect(noResponse[0]).toEqual(
            expect.objectContaining({
                hostEvent: HostEvent.DownloadAsCsv,
                status: 'timed-out',
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

        const props = await triggerProps(HostEvent.DownloadAsCsv);
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

        expect((await triggerProps(HostEvent.GetTabs)).route).toBe('ui-passthrough');
    });

    test('reports the legacy route when the app lacks the passthrough key', async () => {
        mockPassthroughApp(['someUnrelatedPassthrough']);
        const embed = await renderLiveboard();
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.GetTabs, {});
        await flushTelemetry();

        expect((await triggerProps(HostEvent.GetTabs)).route).toBe('legacy');
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

        expect(await triggerProps(HostEvent.Pin)).toEqual(
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

        expect((await triggerProps(HostEvent.Pin)).status).toBe('timed-out');
        expect(
            uploadsOf(mockUploadMixpanelEvent, MIXPANEL_EVENT.VISUAL_SDK_HOST_EVENT_NO_RESPONSE),
        ).toHaveLength(1);
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

        expect(await triggerProps(HostEvent.DownloadAsCsv)).toEqual(
            expect.objectContaining({
                status: 'render-not-called',
                errorCode: EmbedErrorCodes.RENDER_NOT_CALLED,
            }),
        );
    });

    test('uploads nothing at all when the host application disabled tracking', async () => {
        const embed = await renderLiveboard({ disableSDKTracking: true });
        await flushTelemetry();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });
        await flushTelemetry();

        expect(mockUploadMixpanelEvent).not.toHaveBeenCalled();
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
