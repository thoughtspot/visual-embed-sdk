import {
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
    postMessageToParent,
} from '../test/test-utils';
import { PinboardEmbed, init, AuthType } from '../index';
import { EventType, EventTypeV1 } from '../types';

const thoughtSpotHost = 'tshost';
const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.SSO,
    });
});

afterAll(() => {
    jest.unmock('./api');
});

describe('tests for v1 API', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should fetch data', async () => {
        const onDataSpy = jest.fn();
        const embed = new PinboardEmbed(getRootEl(), defaultViewConfig);
        embed.on(EventType.Data, onDataSpy).render({
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        });

        const iframe = getIFrameEl();
        iframe.contentWindow.addEventListener('message', (e) => {
            // eslint-disable-next-line no-underscore-dangle
            expect(e.data.__type).toBe(EventTypeV1.GetData);
            postMessageToParent(iframe.contentWindow, {
                __type: EventTypeV1.ExportVizDataToParent,
                data: 'payload',
            });
        });

        embed.getCurrentData();

        await executeAfterWait(() => {
            expect(onDataSpy).toHaveBeenCalledWith({
                __type: EventTypeV1.ExportVizDataToParent,
                data: 'payload',
            });
        }, 2000);
    });
});
