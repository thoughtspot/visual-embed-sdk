import * as _processTriggerInstance from './processTrigger';
import { HostEvent } from '../types';
import { messageChannelMock, mockMessageChannel } from '../test/test-utils';

describe('Unit test for processTrigger', () => {
    const iFrame: any = {
        contentWindow: {
            postMessage: jest.fn(),
        },
    };
    test('when hostevent is reload, reload function should be called with iFrame', async () => {
        jest.useFakeTimers();
        const iFrameElement = document.createElement('iframe');
        const html = '<body>Foo</body>';
        iFrameElement.src = `data:text/html;charset=utf-8,${encodeURI(html)}`;
        const divFrame = document.createElement('div');
        divFrame.appendChild(iFrameElement);
        const messageType = HostEvent.Reload;
        const thoughtSpotHost = 'http://localhost:3000';
        const spyReload = jest.spyOn(_processTriggerInstance, 'reload');
        const data = {};
        _processTriggerInstance.processTrigger(iFrameElement, messageType, thoughtSpotHost, data);
        jest.advanceTimersByTime(200);
        expect(spyReload).toBeCalledWith(iFrameElement);
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

    test('Reject promise if error returned', async () => {
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
                error: 'error',
            },
        };
        messageChannelMock.port1.onmessage(res);
        expect(messageChannelMock.port1.close).toBeCalled();
        expect(triggerPromise).rejects.toEqual(res.data.error);
    });

    test('should close channel.port1 when timeout exceeds TRIGGER_TIMEOUT', async () => {
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

        jest.advanceTimersByTime(_processTriggerInstance.TRIGGER_TIMEOUT);

        expect(messageChannelMock.port1.close).toBeCalled();
        await expect(triggerPromise).resolves.toBeInstanceOf(Error);
    });
});
