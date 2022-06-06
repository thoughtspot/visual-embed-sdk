import * as _processTriggerInstance from './processTrigger';
import { HostEvent } from '../types';
import { messageChannelMock, mockMessageChannel } from '../test/test-utils';

describe('Unit test for processTrigger', () => {
    const iFrame: any = {
        contentWindow: {
            postMessage: jest.fn(),
        },
    };
    test('when hostevent is reload, childNode should not be the same as iFrame', async () => {
        const iFrameElement = document.createElement('iframe');
        const html = '<body>Foo</body>';
        iFrameElement.src = `data:text/html;charset=utf-8,${encodeURI(html)}`;
        const divFrame = document.createElement('div');
        divFrame.appendChild(iFrameElement);
        const messageType = HostEvent.Reload;
        const thoughtSpotHost = 'http://localhost:3000';
        const data = {};
        _processTriggerInstance.processTrigger(
            iFrameElement,
            messageType,
            thoughtSpotHost,
            data,
        );
        expect(divFrame.childNodes[0]).not.toBe(iFrameElement);
    });

    test('when hostevent is search, postMessage should be called', async () => {
        const messageType = HostEvent.Search;
        const thoughtSpotHost = 'http://localhost:3000';
        const data = {};
        mockMessageChannel();
        const triggerPromise = _processTriggerInstance.processTrigger(
            iFrame,
            messageType,
            thoughtSpotHost,
            data,
        );
        expect(iFrame.contentWindow.postMessage).toBeCalled();
        const res = {
            data: {
                test: '123',
            },
        };
        messageChannelMock.port1.onmessage(res);
        expect(messageChannelMock.port1.close).toBeCalled();
        expect(triggerPromise).resolves.toEqual(res.data);
    });
});
