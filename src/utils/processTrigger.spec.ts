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
        expect(spyReload).toHaveBeenCalledWith(iFrameElement);
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
        expect(iFrame.contentWindow.postMessage).toHaveBeenCalled();
        const res = {
            data: {
                test: '123',
            },
        };
        messageChannelMock.port1.onmessage(res);
        expect(messageChannelMock.port1.close).toHaveBeenCalled();
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
        expect(iFrame.contentWindow.postMessage).toHaveBeenCalled();
        const res = {
            data: {
                error: 'error',
            },
        };
        messageChannelMock.port1.onmessage(res);
        expect(messageChannelMock.port1.close).toHaveBeenCalled();
        expect(triggerPromise).rejects.toEqual(res.data.error);
    });

    test('should handle null/undefined responseData without throwing', async () => {
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
        expect(iFrame.contentWindow.postMessage).toHaveBeenCalled();
        // Simulate a message with null responseData
        messageChannelMock.port1.onmessage({ data: null });
        expect(messageChannelMock.port1.close).toHaveBeenCalled();
        await expect(triggerPromise).resolves.toEqual(null);
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

        expect(messageChannelMock.port1.close).toHaveBeenCalled();
        await expect(triggerPromise).resolves.toBeInstanceOf(Error);
    });

    describe('Present event with fullscreen presentation flag', () => {
        let mockHandlePresentEvent: any;
        let mockLoggerWarn: any;
        let mockGetEmbedConfig: any;

        beforeEach(() => {
            mockHandlePresentEvent = jest.spyOn(utilsModule, 'handlePresentEvent').mockImplementation(() => Promise.resolve(undefined));
            mockLoggerWarn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
            mockGetEmbedConfig = jest.spyOn(embedConfigModule, 'getEmbedConfig').mockImplementation(() => ({ disableFullscreenPresentation: false } as any));
        });

        afterEach(() => {
            mockHandlePresentEvent.mockReset();
            mockLoggerWarn.mockReset();
            mockGetEmbedConfig.mockReset();
        });

        test('should handle Present event when disableFullscreenPresentation is false (enabled)', () => {
            const mockConfig = {
                disableFullscreenPresentation: false,
            };
            mockGetEmbedConfig.mockReturnValue(mockConfig);

            const messageType = HostEvent.Present;
            const thoughtSpotHost = 'https://example.thoughtspot.com';
            const data = {};

            _processTriggerInstance.processTrigger(
                iFrame,
                messageType,
                thoughtSpotHost,
                data,
            );

            expect(mockHandlePresentEvent).toHaveBeenCalledWith(iFrame);
        });

        test('should warn and not handle Present event when disableFullscreenPresentation is true (disabled)', () => {
            const mockConfig = {
                disableFullscreenPresentation: true,
            };
            mockGetEmbedConfig.mockReturnValue(mockConfig);

            const messageType = HostEvent.Present;
            const thoughtSpotHost = 'https://example.thoughtspot.com';
            const data = {};

            _processTriggerInstance.processTrigger(
                iFrame,
                messageType,
                thoughtSpotHost,
                data,
            );

            expect(mockHandlePresentEvent).not.toHaveBeenCalled();
            expect(mockLoggerWarn).toHaveBeenCalledWith(
                'Fullscreen presentation mode is disabled. Set disableFullscreenPresentation: false to enable this feature.',
            );
        });

        test('should default to disabled when disableFullscreenPresentation is not provided', () => {
            const mockConfig = {};
            mockGetEmbedConfig.mockReturnValue(mockConfig);

            const messageType = HostEvent.Present;
            const thoughtSpotHost = 'https://example.thoughtspot.com';
            const data = {};

            _processTriggerInstance.processTrigger(
                iFrame,
                messageType,
                thoughtSpotHost,
                data,
            );

            expect(mockHandlePresentEvent).not.toHaveBeenCalled();
            expect(mockLoggerWarn).toHaveBeenCalledWith(
                'Fullscreen presentation mode is disabled. Set disableFullscreenPresentation: false to enable this feature.',
            );
        });
    });
});
