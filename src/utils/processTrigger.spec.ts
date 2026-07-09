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

    test('should clear the timeout when response arrives before TRIGGER_TIMEOUT', async () => {
        const messageType = HostEvent.Search;
        const thoughtSpotHost = 'http://localhost:3000';
        const data = {};
        mockMessageChannel();
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        const triggerPromise = _processTriggerInstance.processTrigger(
            iFrame,
            messageType,
            thoughtSpotHost,
            data,
        );

        const res = { data: { test: '123' } };
        messageChannelMock.port1.onmessage(res);

        expect(clearTimeoutSpy).toHaveBeenCalled();
        await expect(triggerPromise).resolves.toEqual(res.data);

        clearTimeoutSpy.mockRestore();
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

        test('postMessage is called with type=present when disableFullscreenPresentation is false', () => {
            mockGetEmbedConfig.mockReturnValue({ disableFullscreenPresentation: false });
            const thoughtSpotHost = 'https://example.thoughtspot.com';
            _processTriggerInstance.processTrigger(iFrame, HostEvent.Present, thoughtSpotHost, {});
            expect(iFrame.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: HostEvent.Present }),
                thoughtSpotHost,
                expect.anything(),
            );
        });

        test('postMessage is still called with type=present when disableFullscreenPresentation is true', () => {
            mockGetEmbedConfig.mockReturnValue({ disableFullscreenPresentation: true });
            const thoughtSpotHost = 'https://example.thoughtspot.com';
            _processTriggerInstance.processTrigger(iFrame, HostEvent.Present, thoughtSpotHost, {});
            expect(iFrame.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: HostEvent.Present }),
                thoughtSpotHost,
                expect.anything(),
            );
        });

        test('handlePresentEvent receives the exact iFrame reference passed to processTrigger', () => {
            mockGetEmbedConfig.mockReturnValue({ disableFullscreenPresentation: false });
            _processTriggerInstance.processTrigger(
                iFrame, HostEvent.Present, 'https://example.thoughtspot.com', {},
            );
            expect(mockHandlePresentEvent).toHaveBeenCalledWith(iFrame);
        });
    });

    test('nested responseData.data.error causes promise rejection', async () => {
        const messageType = HostEvent.Search;
        const thoughtSpotHost = 'http://localhost:3000';
        mockMessageChannel();
        const triggerPromise = _processTriggerInstance.processTrigger(
            iFrame, messageType, thoughtSpotHost, {},
        );
        messageChannelMock.port1.onmessage({ data: { data: { error: 'nested-error' } } });
        await expect(triggerPromise).rejects.toEqual('nested-error');
    });

    test('context parameter is forwarded as context field in the postMessage payload', async () => {
        const messageType = HostEvent.Search;
        const thoughtSpotHost = 'http://localhost:3000';
        const context = 'Liveboard' as any;
        mockMessageChannel();
        _processTriggerInstance.processTrigger(iFrame, messageType, thoughtSpotHost, {}, context);
        expect(iFrame.contentWindow.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({ context }),
            thoughtSpotHost,
            expect.anything(),
        );
    });

    describe('Reload timing and side-effects', () => {
        test('src is cleared immediately but not restored until exactly 100ms', () => {
            jest.useFakeTimers();
            const iFrameElement = document.createElement('iframe');
            iFrameElement.src = 'http://localhost:3000';
            const originalSrc = iFrameElement.src; // normalized by jsdom

            _processTriggerInstance.reload(iFrameElement);

            expect(iFrameElement.src).not.toBe(originalSrc); // cleared
            jest.advanceTimersByTime(99);
            expect(iFrameElement.src).not.toBe(originalSrc); // not yet restored
            jest.advanceTimersByTime(1);
            expect(iFrameElement.src).toBe(originalSrc); // restored at 100ms
            jest.useRealTimers();
        });

        test('processTrigger(Reload) does not call iFrame.contentWindow.postMessage', () => {
            jest.useFakeTimers();
            // Use the outer iFrame mock which has a mockable contentWindow
            jest.clearAllMocks();
            _processTriggerInstance.processTrigger(
                iFrame, HostEvent.Reload, 'http://localhost:3000', {},
            );
            jest.advanceTimersByTime(200);
            expect(iFrame.contentWindow.postMessage).not.toHaveBeenCalled();
            jest.useRealTimers();
        });

        test('processTrigger(Reload) resolves with null', async () => {
            const result = await _processTriggerInstance.processTrigger(
                iFrame, HostEvent.Reload, 'http://localhost:3000', {},
            );
            expect(result).toBeNull();
        });
    });
});
