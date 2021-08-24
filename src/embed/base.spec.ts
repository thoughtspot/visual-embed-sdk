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
            expect(window.alert).toBeCalledWith(
                'Third party cookie access is blocked on this browser, please allow third party cookies for ThoughtSpot to work properly',
            );
            done();
        });
    });
});
