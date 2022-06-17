import {
    init,
    AuthType,
    EmbedEvent,
    SearchEmbed,
    PinboardEmbed,
    LiveboardEmbed,
    AppEmbed,
    HostEvent,
} from '../index';
import {
    EVENT_WAIT_TIME,
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
    getRootEl2,
    mockMessageChannel,
    postMessageToParent,
} from '../test/test-utils';
import { LiveboardViewConfig } from './liveboard';

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
    spyOn(window, 'alert');
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

        executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
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
        mockMessageChannel();
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.render();
        setTimeout(() => {
            searchEmbed.trigger(HostEvent.Search, {
                body: PAYLOAD,
            });
        }, EVENT_WAIT_TIME);
        executeAfterWait(() => {
            const iframe = getIFrameEl();

            iframe.contentWindow.addEventListener('message', (e) => {
                expect(e.data.type).toBe(HostEvent.Search);
                expect(e.data.data.body).toBe(PAYLOAD);
                done();
            });
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

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
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
        const embedTwo = new PinboardEmbed(getRootEl2(), {
            ...defaultViewConfig,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        const spyThree = jest.fn();
        const embedThree = new LiveboardEmbed(getRootEl2(), {
            ...defaultViewConfig,
            liveboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        embedTwo.on(EmbedEvent.CustomAction, spyTwo).render();
        embedThree.on(EmbedEvent.CustomAction, spyThree).render();

        await executeAfterWait(() => {
            const iframeOne = getIFrameEl();
            postMessageToParent(iframeOne.contentWindow, {
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(spyOne).toHaveBeenCalled();
            expect(spyTwo).not.toHaveBeenCalled();
            expect(spyThree).not.toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('send getIframeCenter Event without eventPort', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        const spy1 = jest.spyOn(global.console, 'log');

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.EmbedIframeCenter,
                data: PAYLOAD,
            });
        });
        expect(spy1).toHaveBeenCalledWith('Event Port is not defined');
    });
    test('send getIframeCenter Event without eventPort - pinboard', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        const spy1 = jest.spyOn(global.console, 'log');

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.EmbedIframeCenter,
                data: PAYLOAD,
            });
        });
        expect(spy1).toHaveBeenCalledWith('Event Port is not defined');
    });

    test('send getIframeCenter Event with eventPort - pinboard', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        const mockPort: any = {
            postMessage: jest.fn(),
        };
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(
                iframe.contentWindow,
                {
                    type: EmbedEvent.EmbedIframeCenter,
                    data: PAYLOAD,
                },
                mockPort,
            );
        });
        const heightObj = {
            data: {
                iframeCenter: 0,
                iframeHeight: 0,
                iframeScrolled: 0,
                iframeVisibleViewPort: 0,
                viewPortHeight: 768,
            },
            type: EmbedEvent.EmbedIframeCenter,
        };
        expect(mockPort.postMessage).toHaveBeenCalledWith(heightObj);
    });
    test('send getIframeCenter Event with eventPort', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        const mockPort: any = {
            postMessage: jest.fn(),
        };
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(
                iframe.contentWindow,
                {
                    type: EmbedEvent.EmbedIframeCenter,
                    data: PAYLOAD,
                },
                mockPort,
            );
        });
        const heightObj = {
            data: {
                iframeCenter: 0,
                iframeHeight: 0,
                iframeScrolled: 0,
                iframeVisibleViewPort: 0,
                viewPortHeight: 768,
            },
            type: EmbedEvent.EmbedIframeCenter,
        };
        expect(mockPort.postMessage).toHaveBeenCalledWith(heightObj);
    });
    test('ALL event listener should fire for all events with the event type set correctly', async () => {
        const embed = new AppEmbed(getRootEl(), defaultViewConfig);
        const spy = jest.fn();
        embed.on(EmbedEvent.ALL, spy);
        embed.render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.DialogOpen,
            });
        });

        await executeAfterWait(() => {
            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy.mock.calls[0][0]).toMatchObject({
                type: EmbedEvent.Init,
            });
            expect(spy.mock.calls[1][0]).toMatchObject({
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
            expect(spy.mock.calls[2][0]).toMatchObject({
                type: EmbedEvent.DialogOpen,
            });
        }, EVENT_WAIT_TIME);
    });
});
