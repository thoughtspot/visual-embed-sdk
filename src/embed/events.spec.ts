import {
    init,
    AuthType,
    EmbedEvent,
    SearchEmbed,
    PinboardEmbed,
    HostEvent,
} from '../index';
import {
    EVENT_WAIT_TIME,
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
    postMessageToParent,
} from '../test/test-utils';

const thoughtSpotHost = 'tshost';
const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const PAYLOAD = 'Sample payload';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('test communication between host app and ThoughtSpot', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should capture event from ThoughtSpot app', (done) => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed
            .on(EmbedEvent.CustomAction, (data) => {
                expect(data.data).toBe(PAYLOAD);
                done();
            })
            .render();

        const iframe = getIFrameEl();
        postMessageToParent(iframe.contentWindow, {
            type: EmbedEvent.CustomAction,
            data: PAYLOAD,
        });
    });

    // TODO: enable test once we are actually able to load stuff in the iframe
    xtest('should trigger iframe load event', async () => {
        const onLoadSpy = jest.fn();

        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.on(EmbedEvent.Load, onLoadSpy).render();
        await executeAfterWait(() => {
            expect(onLoadSpy).toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('should trigger event to ThoughtSpot app', (done) => {
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.render();
        setTimeout(() => {
            searchEmbed.trigger(HostEvent.Search, {
                body: PAYLOAD,
            });
        }, EVENT_WAIT_TIME);
        const iframe = getIFrameEl();

        iframe.contentWindow.addEventListener('message', (e) => {
            expect(e.data.type).toBe(HostEvent.Search);
            expect(e.data.data.body).toBe(PAYLOAD);
            done();
        });
    });

    test('should execute multiple event handlers if registered', async () => {
        const handlerOne = jest.fn();
        const handlerTwo = jest.fn();

        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed
            .on(EmbedEvent.CustomAction, handlerOne)
            .on(EmbedEvent.CustomAction, handlerTwo)
            .render();

        const iframe = getIFrameEl();
        postMessageToParent(iframe.contentWindow, {
            type: EmbedEvent.CustomAction,
            data: PAYLOAD,
        });

        await executeAfterWait(() => {
            expect(handlerOne).toHaveBeenCalled();
            expect(handlerTwo).toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('should capture event from correct iframe', async () => {
        const spyOne = jest.fn();
        const embedOne = new SearchEmbed(getRootEl(), defaultViewConfig);
        embedOne.on(EmbedEvent.CustomAction, spyOne).render();

        const spyTwo = jest.fn();
        const embedTwo = new PinboardEmbed(getRootEl(), defaultViewConfig);
        embedTwo.on(EmbedEvent.CustomAction, spyTwo).render({
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        });

        const iframeOne = getIFrameEl();
        postMessageToParent(iframeOne.contentWindow, {
            type: EmbedEvent.CustomAction,
            data: PAYLOAD,
        });

        await executeAfterWait(() => {
            expect(spyOne).toHaveBeenCalled();
            expect(spyTwo).not.toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });
});
