import {
    MESSAGE_RESPONSE_TIMEOUT,
    resolveMessageOrigin,
    isMessageFromIframe,
    postMessageToIframe,
    sendMessageWithResponse,
} from './iframe-transport';
import { logger } from '../logger';
import { ERROR_MESSAGE } from '../../errors';

describe('iframe-transport', () => {
    describe('resolveMessageOrigin', () => {
        it('returns the origin (scheme://host[:port]) for a valid host URL', () => {
            expect(resolveMessageOrigin('https://my.thoughtspot.com')).toBe(
                'https://my.thoughtspot.com',
            );
            expect(
                resolveMessageOrigin('https://host.example.com:8443/some/path'),
            ).toBe('https://host.example.com:8443');
        });

        it('returns null when the host cannot be parsed', () => {
            expect(resolveMessageOrigin('not-a-url')).toBeNull();
            expect(resolveMessageOrigin('')).toBeNull();
        });
    });

    describe('isMessageFromIframe', () => {
        const host = 'https://ts.example.com';
        const contentWindow = {} as Window;
        const iFrame = { contentWindow } as HTMLIFrameElement;

        it('rejects a message whose source is not the iframe window', () => {
            const event = { source: {}, origin: host } as unknown as MessageEvent;
            expect(isMessageFromIframe(event, iFrame, host)).toBe(false);
        });

        it('accepts a message from the iframe window with a matching origin', () => {
            const event = { source: contentWindow, origin: host } as unknown as MessageEvent;
            expect(isMessageFromIframe(event, iFrame, host)).toBe(true);
        });

        it('rejects (and warns) when the origin does not match the expected host', () => {
            const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
            const event = {
                source: contentWindow,
                origin: 'https://evil.example.com',
            } as unknown as MessageEvent;

            expect(isMessageFromIframe(event, iFrame, host)).toBe(false);
            expect(warnSpy).toHaveBeenCalledTimes(1);
            warnSpy.mockRestore();
        });

        it('fails open (accepts) when the expected origin cannot be resolved', () => {
            const event = {
                source: contentWindow,
                origin: 'https://anything.example.com',
            } as unknown as MessageEvent;
            // 'garbage-host' is unparseable → origin check is skipped.
            expect(isMessageFromIframe(event, iFrame, 'garbage-host')).toBe(true);
        });

        it('accepts when the message origin is empty', () => {
            const event = { source: contentWindow, origin: '' } as unknown as MessageEvent;
            expect(isMessageFromIframe(event, iFrame, host)).toBe(true);
        });

        it('rejects when the iframe is not set', () => {
            const event = { source: contentWindow, origin: host } as unknown as MessageEvent;
            expect(
                isMessageFromIframe(event, null as unknown as HTMLIFrameElement, host),
            ).toBe(false);
        });
    });

    describe('postMessageToIframe', () => {
        const host = 'https://ts.example.com';
        const message = { type: 'someEvent', data: { a: 1 } };

        it('posts with no transferables when no channel is provided', () => {
            const postMessage = jest.fn();
            const iFrame = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;

            postMessageToIframe(iFrame, message, host);

            expect(postMessage).toHaveBeenCalledWith(message, host, []);
        });

        it('transfers the channel port2 when a channel is provided', () => {
            const postMessage = jest.fn();
            const iFrame = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
            const port2 = {} as MessagePort;
            const channel = { port2 } as MessageChannel;

            postMessageToIframe(iFrame, message, host, channel);

            expect(postMessage).toHaveBeenCalledWith(message, host, [port2]);
        });

        it('is a no-op when the iframe has no contentWindow', () => {
            const iFrame = { contentWindow: null } as unknown as HTMLIFrameElement;
            expect(() => postMessageToIframe(iFrame, message, host)).not.toThrow();
        });
    });

    describe('sendMessageWithResponse', () => {
        const host = 'https://ts.example.com';
        const message = { type: 'trigger', data: {} };
        let port1: { onmessage: ((e: { data: any }) => void) | null; close: jest.Mock };
        let port2: MessagePort;
        let postMessage: jest.Mock;
        let iFrame: HTMLIFrameElement;
        let OriginalMessageChannel: typeof MessageChannel;

        beforeEach(() => {
            port1 = { onmessage: null, close: jest.fn() };
            port2 = {} as MessagePort;
            OriginalMessageChannel = global.MessageChannel;
            (global as any).MessageChannel = jest.fn(() => ({ port1, port2 }));
            postMessage = jest.fn();
            iFrame = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
        });

        afterEach(() => {
            global.MessageChannel = OriginalMessageChannel;
        });

        it('exposes the default response timeout', () => {
            expect(MESSAGE_RESPONSE_TIMEOUT).toBe(30000);
        });

        it('posts the message with the channel port and resolves with the response', async () => {
            const promise = sendMessageWithResponse(iFrame, message, host);

            expect(postMessage).toHaveBeenCalledWith(message, host, [port2]);

            // Simulate the app posting a response back on the channel — the
            // handler resolves with the event's `data` payload.
            port1.onmessage?.({ data: { value: 'ok' } });

            await expect(promise).resolves.toEqual({ value: 'ok' });
            expect(port1.close).toHaveBeenCalled();
        });

        it('rejects when the response carries a top-level error', async () => {
            const promise = sendMessageWithResponse(iFrame, message, host);
            port1.onmessage?.({ data: { error: 'boom' } });
            await expect(promise).rejects.toBe('boom');
        });

        it('rejects when the error is nested under data', async () => {
            const promise = sendMessageWithResponse(iFrame, message, host);
            port1.onmessage?.({ data: { data: { error: 'nested-boom' } } });
            await expect(promise).rejects.toBe('nested-boom');
        });

        it('resolves with an empty response when no data is returned', async () => {
            const promise = sendMessageWithResponse(iFrame, message, host);
            port1.onmessage?.({ data: undefined });
            await expect(promise).resolves.toBeUndefined();
        });

        it('resolves with a timeout Error when no response arrives in time', async () => {
            jest.useFakeTimers();
            const promise = sendMessageWithResponse(iFrame, message, host, 100);

            jest.advanceTimersByTime(100);

            const result = await promise;
            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe(ERROR_MESSAGE.TRIGGER_TIMED_OUT);
            expect(port1.close).toHaveBeenCalled();
            jest.useRealTimers();
        });
    });
});
