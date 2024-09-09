import { ERROR_MESSAGE } from '../errors';
import { HostEvent } from '../types';

/**
 * Reloads the ThoughtSpot iframe.
 * @param iFrame
 */
export const reload = (iFrame: HTMLIFrameElement) => {
    const src = iFrame.src;
    iFrame.src = '';
    setTimeout(() => {
        iFrame.src = src;
    }, 100);
};

/**
 * Post iframe message.
 * @param iFrame
 * @param message
 * @param message.type
 * @param message.data
 * @param thoughtSpotHost
 * @param channel
 */
function postIframeMessage(
    iFrame: HTMLIFrameElement,
    message: { type: HostEvent; data: any },
    thoughtSpotHost: string,
    channel?: MessageChannel,
) {
    return iFrame.contentWindow.postMessage(message, thoughtSpotHost, [channel?.port2]);
}

const TRIGGER_TIMEOUT = 30000;

/**
 *
 * @param iFrame
 * @param messageType
 * @param thoughtSpotHost
 * @param data
 */
export function processTrigger(
    iFrame: HTMLIFrameElement,
    messageType: HostEvent,
    thoughtSpotHost: string,
    data: any,
): Promise<any> {
    return new Promise<any>((res, rej) => {
        if (messageType === HostEvent.Reload) {
            reload(iFrame);
            return res(null);
        }
        const channel = new MessageChannel();
        channel.port1.onmessage = ({ data: responseData }) => {
            channel.port1.close();
            if (responseData.error) {
                rej(responseData.error);
            } else {
                res(responseData);
            }
        };

        // Close the messageChannel and resolve the promise if timeout.
        setTimeout(() => {
            channel.port1.close();
            res(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        }, TRIGGER_TIMEOUT);

        return postIframeMessage(iFrame, { type: messageType, data }, thoughtSpotHost, channel);
    });
}
