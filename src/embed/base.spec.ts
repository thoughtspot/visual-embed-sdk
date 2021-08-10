import { AuthType, init, SearchEmbed, EmbedEvent } from '../index';
import {
    executeAfterWait,
    getAllIframeEl,
    getDocumentBody,
    getRootEl,
    getRootEl2,
} from '../test/test-utils';

const thoughtSpotHost = 'tshost';

describe('Base TS Embed', () => {
    beforeAll(() => {
        init({
            thoughtSpotHost,
            authType: AuthType.None,
        });
    });

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

    test('Should show an alert when third party cookie access is blocked', (done) => {
        const tsEmbed = new SearchEmbed(getRootEl(), {});
        const iFrame: any = document.createElement('div');
        iFrame.contentWindow = null;
        tsEmbed.test_setIframe(iFrame);
        tsEmbed.render();

        window.postMessage(
            {
                __type: EmbedEvent.NoCookieAccess,
            },
            '*',
        );
        jest.spyOn(window, 'alert').mockImplementation(() => {
            done();
        });
    });
});
