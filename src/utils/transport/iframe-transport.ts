/**
 * Copyright (c) 2026
 *
 * Dedicated transport layer for SDK <-> ThoughtSpot iframe messaging.
 *
 * Owns the postMessage/MessageChannel mechanics and origin resolution so
 * that embed/business logic (ts-embed.ts, hostEventClient) never touches
 * the wire directly. The wire format is unchanged from the historical
 * implementation — this layer is a pure structural extraction.
 */
import { ERROR_MESSAGE } from '../../errors';
import { logger } from '../logger';

/**
 * Default time to wait for the app to respond to a request-response
 * message before giving up and reclaiming the channel.
 */
export const MESSAGE_RESPONSE_TIMEOUT = 30000;

/**
 * Single implementation of origin resolution for the embedded app.
 * Returns the origin (scheme://host[:port]) for a ThoughtSpot host URL,
 * or null when it cannot be parsed.
 * @param thoughtSpotHost
 */
export const resolveMessageOrigin = (thoughtSpotHost: string): string | null => {
    try {
        return new URL(thoughtSpotHost).origin;
    } catch (e) {
        return null;
    }
};

/**
 * Validates that an inbound window message came from the embedded
 * ThoughtSpot app: the source window must be the embed iframe's window and,
 * when the expected origin is resolvable, the message origin must match it.
 *
 * Fails open (returns true) on the origin check when the expected origin
 * cannot be resolved, to avoid breaking unconventional-but-working setups;
 * a warning is logged on mismatch either way.
 * @param event The message event received on window.
 * @param iFrame The embed iframe the message should originate from.
 * @param thoughtSpotHost The configured ThoughtSpot host.
 */
export const isMessageFromIframe = (
    event: MessageEvent,
    iFrame: HTMLIFrameElement,
    thoughtSpotHost: string,
): boolean => {
    if (event.source !== iFrame?.contentWindow) {
        return false;
    }
    const expectedOrigin = resolveMessageOrigin(thoughtSpotHost);
    if (expectedOrigin && event.origin && event.origin !== expectedOrigin) {
        logger.warn(
            `Dropped message from unexpected origin ${event.origin}; expected ${expectedOrigin}`,
        );
        return false;
    }
    return true;
};

/**
 * Posts a one-way message to the embedded app's iframe, optionally
 * transferring a MessageChannel port for the response.
 * @param iFrame
 * @param message
 * @param thoughtSpotHost Used as the postMessage targetOrigin.
 * @param channel
 */
export const postMessageToIframe = (
    iFrame: HTMLIFrameElement,
    message: { type: string; data: any; context?: any },
    thoughtSpotHost: string,
    channel?: MessageChannel,
): void => iFrame.contentWindow?.postMessage(
    message,
    thoughtSpotHost,
    channel ? [channel.port2] : [],
);

/**
 * Sends a request-response message to the embedded app over a dedicated
 * MessageChannel. Resolves with the response payload; rejects when the app
 * responds with an error; resolves with a timeout Error object when no
 * response arrives in time (historical behavior, preserved for backward
 * compatibility).
 * @param iFrame
 * @param message
 * @param thoughtSpotHost
 * @param timeoutMs
 */
export function sendMessageWithResponse(
    iFrame: HTMLIFrameElement,
    message: { type: string; data: any; context?: any },
    thoughtSpotHost: string,
    timeoutMs: number = MESSAGE_RESPONSE_TIMEOUT,
): Promise<any> {
    return new Promise<any>((res, rej) => {
        const channel = new MessageChannel();

        // Close the messageChannel and resolve the promise if timeout.
        const timeoutId = setTimeout(() => {
            channel.port1.close();
            res(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        }, timeoutMs);

        channel.port1.onmessage = ({ data: responseData }) => {
            clearTimeout(timeoutId);
            channel.port1.close();
            const error = responseData?.error || responseData?.data?.error;
            if (error) {
                rej(error);
            } else {
                res(responseData);
            }
        };

        postMessageToIframe(iFrame, message, thoughtSpotHost, channel);
    });
}
