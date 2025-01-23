import {
    init, AuthType, LiveboardEmbed, HostEvent,
} from '../index';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
} from '../test/test-utils';

import * as authInstance from '../auth';

describe.skip('Trigger', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
        jest.spyOn(authInstance, 'postLoginService').mockResolvedValue(true);
    });
    test('should trigger the event', async (done) => {
        init({
            thoughtSpotHost: 'https://tshost',
            authType: AuthType.None,
        });
        const lb = new LiveboardEmbed(getRootEl(), {
            frameParams: {
                width: '100%',
                height: '100%',
            },
            liveboardId: '123',
        });
        const val = await lb.render();
        const iframe = getIFrameEl();
        jest.spyOn(iframe.contentWindow, 'postMessage');
        executeAfterWait(() => {
            lb.trigger(HostEvent.DownloadAsCsv, { vizId: 'testId' });
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: HostEvent.DownloadAsCsv,
                data: { vizId: 'testId' },
            }), 'https://tshost', expect.anything());
            done();
        });
    });
});
