import { init, AuthType, SearchEmbed, EmbedEvent } from '../index';
import {
    EVENT_WAIT_TIME,
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
} from '../test/test-utils';

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
        authType: AuthType.None,
    });
});

describe('test view config', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should apply width and height to the iframe', () => {
        const width = 800;
        const height = 600;

        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            frameParams: {
                width,
                height,
            },
        });
        searchEmbed.render();

        const iframe = getIFrameEl();
        expect(iframe.style.width).toBe(`${width}px`);
        expect(iframe.style.height).toBe(`${height}px`);
    });

    test('trying to register event handler after render should throw error', async () => {
        const onErrorSpy = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed
            .on(EmbedEvent.Error, onErrorSpy)
            .render()
            .on(EmbedEvent.Load, () => null);
        await executeAfterWait(() => {
            expect(onErrorSpy).toHaveBeenCalledWith({
                error: 'Please register event handlers before calling render',
            });
        }, EVENT_WAIT_TIME);
    });
});
