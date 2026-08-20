import {
    init, AuthType, LiveboardEmbed, HostEvent, EmbedErrorCodes, RuntimeFilterOp,
} from '../index';
import { getDocumentBody, getRootEl } from '../test/test-utils';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
import * as authInstance from '../auth';
import * as mixpanelInstance from '../mixpanel-service';
import { MIXPANEL_EVENT } from '../mixpanel-service';
import * as processTriggerInstance from '../utils/processTrigger';

/**
 * Returns the properties of the single `visual-sdk-host-event` upload.
 * @param mock The spy on `uploadMixpanelEvent`
 */
const getHostEventProps = (mock: jest.SpyInstance) => {
    const calls = mock.mock.calls.filter(
        ([eventId]) => eventId === MIXPANEL_EVENT.VISUAL_SDK_HOST_EVENT,
    );
    expect(calls).toHaveLength(1);
    return calls[0][1] as Record<string, any>;
};

/**
 * Renders a Liveboard embed, so that `trigger` runs its normal path.
 */
const renderLiveboard = async () => {
    init({
        thoughtSpotHost: 'https://tshost',
        authType: AuthType.None,
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

    test('reports the host event, its parameters and a successful outcome', async () => {
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        // The per-event upload is kept for the existing dashboards, and now
        // carries the same properties.
        expect(mockUploadMixpanelEvent).toHaveBeenCalledWith(
            `${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.DownloadAsCsv}`,
            expect.objectContaining({
                hostEvent: HostEvent.DownloadAsCsv,
                paramKeys: ['vizId'],
            }),
        );

        expect(getHostEventProps(mockUploadMixpanelEvent)).toEqual(
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
    });

    test('reports parameter names and enum members, never customer values', async () => {
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.UpdateRuntimeFilters, [
            { columnName: 'Region', operator: RuntimeFilterOp.EQ, values: ['west'] },
        ]);

        const serialized = JSON.stringify(mockUploadMixpanelEvent.mock.calls);
        ['Region', 'west'].forEach((value) => expect(serialized).not.toContain(value));

        const props = getHostEventProps(mockUploadMixpanelEvent);
        expect(props.paramKeys).toEqual(['columnName', 'operator', 'values']);
        expect(props.paramShape).toEqual(
            expect.arrayContaining([
                'payload[].columnName:string',
                'payload[].operator:EQ',
                'payload[].values:array(1)',
            ]),
        );
    });

    test('reports a trigger that the embedded app never answered', async () => {
        // processTrigger resolves, rather than rejects, when it times out.
        mockProcessTrigger.mockResolvedValue(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(getHostEventProps(mockUploadMixpanelEvent).status).toBe('timed-out');
    });

    test('reports a failed trigger without its error message', async () => {
        mockProcessTrigger.mockRejectedValue(new Error('Answer 4c8a1b2e not found'));
        const embed = await renderLiveboard();
        mockUploadMixpanelEvent.mockClear();

        await expect(embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' })).rejects.toThrow();

        const props = getHostEventProps(mockUploadMixpanelEvent);
        expect(props.status).toBe('error');
        expect(JSON.stringify(props)).not.toContain('4c8a1b2e');
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
        mockUploadMixpanelEvent.mockClear();

        await embed.trigger(HostEvent.DownloadAsCsv, { vizId: 'd0a1' });

        expect(getHostEventProps(mockUploadMixpanelEvent)).toEqual(
            expect.objectContaining({
                status: 'render-not-called',
                errorCode: EmbedErrorCodes.RENDER_NOT_CALLED,
            }),
        );
    });
});
