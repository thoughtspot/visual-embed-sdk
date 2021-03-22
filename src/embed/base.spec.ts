import { AuthType, init, SearchEmbed } from '../index';
import {
    executeAfterWait,
    getAllIframeEl,
    getDocumentBody,
    getRootEl,
} from '../test/test-utils';

const thoughtSpotHost = 'tshost';
beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('Base TS Embed', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should clear previous content from the container node when rendering iframe', async () => {
        const tsEmbed = new SearchEmbed(getRootEl(), {});
        tsEmbed.render();

        const tsEmbed2 = new SearchEmbed(getRootEl(), {});
        tsEmbed2.render();

        await executeAfterWait(() => {
            expect(getAllIframeEl().length).toBe(1);
        });
    });
});
