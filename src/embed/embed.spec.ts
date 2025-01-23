import { logger } from '../utils/logger';
import {
    init, AuthType, SearchEmbed, EmbedEvent,
} from '../index';
import {
    EVENT_WAIT_TIME,
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
} from '../test/test-utils';
import * as authInstance from '../auth';

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
    spyOn(window, 'alert');
    jest.spyOn(authInstance, 'postLoginService').mockResolvedValue(true);
});

describe.skip('test view config', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should apply width and height to the iframe', async () => {
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

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            expect(iframe.style.width).toBe(`${width}px`);
            expect(iframe.style.height).toBe(`${height}px`);
        });
    });
});
