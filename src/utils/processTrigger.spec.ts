import * as _processTriggerInstance from './processTrigger';
import { HostEvent } from '../types';
import { messageChannelMock, mockMessageChannel } from '../test/test-utils';
import { logger } from './logger';
import * as utilsModule from '../utils';
import * as embedConfigModule from '../embed/embedConfig';

describe('Unit test for processTrigger', () => {
    const iFrame: any = {
        contentWindow: {
            postMessage: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

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

    describe('Present event with fullscreen presentation flag', () => {
        let mockHandlePresentEvent: any;
        let mockLoggerWarn: any;
        let mockGetEmbedConfig: any;

        beforeEach(() => {
            mockHandlePresentEvent = jest.spyOn(utilsModule, 'handlePresentEvent').mockImplementation(() => {});
            mockLoggerWarn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
            mockGetEmbedConfig = jest.spyOn(embedConfigModule, 'getEmbedConfig').mockImplementation(() => ({}));
        });

        afterEach(() => {
            mockHandlePresentEvent.mockReset();
            mockLoggerWarn.mockReset();
            mockGetEmbedConfig.mockReset();
        });

        test('should handle Present event when enableFullscreenPresentation is true', () => {
            mockGetEmbedConfig.mockReturnValue({
                enableFullscreenPresentation: true,
            });

            mockMessageChannel();

            _processTriggerInstance.processTrigger(
                iFrame,
                HostEvent.Present,
                'https://test.thoughtspot.com',
                {},
            );

            expect(mockHandlePresentEvent).toHaveBeenCalledWith(iFrame);
        });

        test('should warn and not handle Present event when enableFullscreenPresentation is false', () => {
            mockGetEmbedConfig.mockReturnValue({
                enableFullscreenPresentation: false,
            });

            mockMessageChannel();

            _processTriggerInstance.processTrigger(
                iFrame,
                HostEvent.Present,
                'https://test.thoughtspot.com',
                {},
            );

            expect(mockHandlePresentEvent).not.toHaveBeenCalled();
            expect(mockLoggerWarn).toHaveBeenCalledWith(
                'Fullscreen presentation mode is disabled. Set enableFullscreenPresentation: true to enable this feature.',
            );
        });

        test('should default to disabled when enableFullscreenPresentation is not provided', () => {
            mockGetEmbedConfig.mockReturnValue({});

            mockMessageChannel();

            _processTriggerInstance.processTrigger(
                iFrame,
                HostEvent.Present,
                'https://test.thoughtspot.com',
                {},
            );

            expect(mockHandlePresentEvent).not.toHaveBeenCalled();
            expect(mockLoggerWarn).toHaveBeenCalledWith(
                'Fullscreen presentation mode is disabled. Set enableFullscreenPresentation: true to enable this feature.',
            );
        });
    });
});
