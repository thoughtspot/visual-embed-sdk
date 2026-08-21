import {
    init, AuthType, LiveboardEmbed, HostEvent, RuntimeFilterOp,
} from '../index';
import { getDocumentBody, getRootEl } from '../test/test-utils';
import * as authInstance from '../auth';
import * as mixpanelInstance from '../mixpanel-service';
import { MIXPANEL_EVENT } from '../mixpanel-service';
import * as processTriggerInstance from '../utils/processTrigger';

describe('Host event parameter telemetry', () => {
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
                hasPayload: true,
                paramCount: 1,
                paramKeys: ['vizId'],
                paramShape: ['vizId:string'],
            }),
        );
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

        const props = triggerProps(HostEvent.UpdateRuntimeFilters);
        expect(props.paramKeys).toEqual(['columnName', 'operator', 'values']);
        expect(props.paramShape).toEqual(
            expect.arrayContaining([
                'payload[].columnName:string',
                'payload[].operator:EQ',
                'payload[].values:array(1)',
            ]),
        );
    });
});
