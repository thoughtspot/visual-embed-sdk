import {
    init, AuthType, LiveboardEmbed, HostEvent, RuntimeFilterOp,
} from '../index';
import { getDocumentBody, getRootEl } from '../test/test-utils';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
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
            }),
        );
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
