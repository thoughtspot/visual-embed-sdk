import { PinboardEmbed, PinboardViewConfig } from './pinboard';
import { init } from '../index';
import { Action, AuthType, EventTypeV1 } from '../types';
import { getDocumentBody, getIFrameSrc, getRootEl } from '../test/test-utils';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const pinboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const vizId = '6e73f724-660e-11eb-ae93-0242ac130002';
const thoughtSpotHost = 'tshost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('Pinboard/viz embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render pinboard', () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), defaultViewConfig);
        pinboardEmbed.render({
            pinboardId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/embed/viz/${pinboardId}`,
        );
    });

    test('should set disabled actions', () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            disabledActions: [
                Action.DownloadAsCsv,
                Action.DownloadAsPdf,
                Action.DownloadAsXlsx,
            ],
            disabledActionReason: 'Action denied',
            ...defaultViewConfig,
        } as PinboardViewConfig);
        pinboardEmbed.render({
            pinboardId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/embed/viz/${pinboardId}?disableAction=${Action.DownloadAsCsv},${Action.DownloadAsPdf},${Action.DownloadAsXlsx}&disableHint=Action%20denied`,
        );
    });

    test('should set hidden actions', () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            hiddenActions: [
                Action.DownloadAsCsv,
                Action.DownloadAsPdf,
                Action.DownloadAsXlsx,
            ],
            ...defaultViewConfig,
        } as PinboardViewConfig);
        pinboardEmbed.render({
            pinboardId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/embed/viz/${pinboardId}?hideAction=${Action.DownloadAsCsv},${Action.DownloadAsPdf},${Action.DownloadAsXlsx}`,
        );
    });

    test('should enable viz transformations', () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            enableVizTransformations: true,
            ...defaultViewConfig,
        } as PinboardViewConfig);
        pinboardEmbed.render({
            pinboardId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/embed/viz/${pinboardId}?enableVizTransform=true`,
        );
    });

    test('should render viz', () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), defaultViewConfig);
        pinboardEmbed.render({
            pinboardId,
            vizId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/embed/viz/${pinboardId}/${vizId}`,
        );
    });

    test('should register event handler to adjust iframe height', () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
        } as PinboardViewConfig);
        const onSpy = jest.spyOn(pinboardEmbed, 'on');

        pinboardEmbed.render({
            pinboardId,
            vizId,
        });
        expect(onSpy).toHaveBeenCalledWith(
            EventTypeV1.EmbedHeight,
            expect.anything(),
        );
    });
});
