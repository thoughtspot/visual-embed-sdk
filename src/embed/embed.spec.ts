import { init, AuthType, SearchEmbed, EventType } from '../index';
import { getDocumentBody, getIFrameEl, getRootEl } from '../test/test-utils';

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
        expect(iframe.width).toBe(`${width}`);
        expect(iframe.height).toBe(`${height}`);
    });

    test('trying to register event handler after render should throw error', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        expect(() => {
            searchEmbed.render().on(EventType.Load, () => null);
        }).toThrowError();
    });
});
