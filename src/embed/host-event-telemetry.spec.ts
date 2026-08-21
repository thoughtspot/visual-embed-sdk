import {
    init, AuthType, LiveboardEmbed, HostEvent, RuntimeFilterOp,
} from '../index';
import { getDocumentBody, getRootEl } from '../test/test-utils';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
import {
    PENDING_FLUSH_MS,
    testResetHostEventTelemetry,
} from '../utils/hostEventTelemetry';
import * as authInstance from '../auth';
import * as mixpanelInstance from '../mixpanel-service';
import { MIXPANEL_EVENT } from '../mixpanel-service';
import * as processTriggerInstance from '../utils/processTrigger';

describe('Host event parameter telemetry', () => {
    let mockUploadMixpanelEvent: jest.SpyInstance;
    let mockProcessTrigger: jest.SpyInstance;

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
        jest.spyOn(authInstance, 'postLoginService').mockImplementation(
            () => Promise.resolve(true as any),
        );
        testResetHostEventTelemetry();
        mockProcessTrigger = jest
            .spyOn(processTriggerInstance, 'processTrigger')
            .mockResolvedValue({ session: 'ok' });
        mockUploadMixpanelEvent = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const renderLiveboard = async () => {
        init({ thoughtSpotHost: 'https://tshost', authType: AuthType.None });
        const embed = new LiveboardEmbed(getRootEl(), {
            frameParams: { width: '100%', height: '100%' },
            liveboardId: '4c8a1b2e-0000-0000-0000-000000000001',
        });
        await embed.render();
        return embed;
    };

    const triggerProps = (hostEvent: HostEvent) => {
        const uploads = mockUploadMixpanelEvent.mock.calls.filter(
            ([id]) => id === `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${hostEvent}`,
        );
        expect(uploads).toHaveLength(1);
        return uploads[0][1] as Record<string, any>;
    };

    test('reports which host event was triggered and which parameters it used', async () => {
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(triggerProps(HostEvent.DownloadAsCsv)).toEqual(
            expect.objectContaining({
                hostEvent: HostEvent.DownloadAsCsv,
                embedComponentType: 'LiveboardEmbed',
                contextType: 'none',
                params: { vizId: 'string' },
                paramKeys: ['vizId'],
                status: 'success',
                durationMs: expect.any(Number),
                hostEventId: expect.stringMatching(/^he-\d+$/),
            }),
        );
    });

    test('gives every trigger its own id', async () => {
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'a' });
        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'b' });

        const ids = mockUploadMixpanelEvent.mock.calls
            .filter(([id]) => String(id).startsWith(MIXPANEL_EVENT.VISUAL_SDK_TRIGGER))
            .map(([, props]) => props.hostEventId);
        expect(ids).toHaveLength(2);
        expect(new Set(ids).size).toBe(2);
    });

    test('uploads nothing until the trigger settles', async () => {
        let settle: (value: unknown) => void = () => undefined;
        mockProcessTrigger.mockImplementation(() => new Promise((resolve) => {
            settle = resolve;
        }));
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        const triggered = embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });
        expect(mockUploadMixpanelEvent).not.toHaveBeenCalled();

        settle({ session: 'ok' });
        await triggered;
        expect(triggerProps(HostEvent.DownloadAsCsv).status).toBe('success');
    });

    test('pushes a queued trigger that never settles', async () => {
        mockProcessTrigger.mockImplementation(() => new Promise(() => undefined));
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        jest.useFakeTimers();
        try {
            embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });
            await Promise.resolve();
            jest.advanceTimersByTime(PENDING_FLUSH_MS + 100);
            await Promise.resolve();

            expect(triggerProps(HostEvent.DownloadAsCsv)).toEqual(
                expect.objectContaining({
                    status: 'no-outcome',
                    params: { vizId: 'string' },
                }),
            );
        } finally {
            jest.useRealTimers();
        }
    });

    test('reports a trigger the embedded app never answered as timed out', async () => {
        mockProcessTrigger.mockResolvedValue(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(triggerProps(HostEvent.DownloadAsCsv).status).toBe('timed-out');
    });

    test('reports a failed trigger without its error message', async () => {
        mockProcessTrigger.mockRejectedValue(new Error('Answer 4c8a1b2e not found'));
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await expect(embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' })).rejects.toThrow();

        const props = triggerProps(HostEvent.DownloadAsCsv);
        expect(props.status).toBe('error');
        expect(JSON.stringify(props)).not.toContain('4c8a1b2e');
    });

    test('reports a trigger called before render', async () => {
        jest.spyOn(logger, 'error').mockImplementation(() => undefined);
        init({ thoughtSpotHost: 'https://tshost', authType: AuthType.None });
        const embed = new LiveboardEmbed(getRootEl(), {
            frameParams: { width: '100%', height: '100%' },
            liveboardId: '4c8a1b2e-0000-0000-0000-000000000001',
        });
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(triggerProps(HostEvent.DownloadAsCsv).status).toBe('render-not-called');
    });

    test('keeps the existing event name, so existing reports still work', async () => {
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(mockUploadMixpanelEvent.mock.calls.map(([id]) => id)).toEqual([
            `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.DownloadAsCsv}`,
        ]);
    });

    test('a payload it cannot describe never breaks the trigger', async () => {
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();
        const hostile = {
            get vizId() {
                throw new Error('no telemetry for you');
            },
        };

        await expect(embed.trigger(HostEvent.DownloadAsCsv, hostile)).resolves.toEqual(
            { session: 'ok' },
        );
    });

    test('a failing upload never breaks the trigger', async () => {
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();
        mockUploadMixpanelEvent.mockImplementation(() => {
            throw new Error('mixpanel is down');
        });

        await expect(
            embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' }),
        ).resolves.toEqual({ session: 'ok' });
    });

    test('reports parameter names and enum members, never customer values', async () => {
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.UpdateRuntimeFilters, [
            { columnName: 'Region', operator: RuntimeFilterOp.EQ, values: ['west'] },
        ]);

        const serialized = JSON.stringify(mockUploadMixpanelEvent.mock.calls);
        ['Region', 'west'].forEach((value) => expect(serialized).not.toContain(value));

        expect(triggerProps(HostEvent.UpdateRuntimeFilters).params).toEqual({
            columnName: 'string',
            operator: 'EQ',
            values: 'array(1)',
        });
    });
});
