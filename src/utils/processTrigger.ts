import { ERROR_MESSAGE } from '../errors';
import { HostEvent } from '../types';

/**
 * Reloads the ThoughtSpot iframe.
 */
function reload(iFrame: HTMLIFrameElement) {
    const oldFrame = iFrame.cloneNode();
    const parent = iFrame.parentNode;
    parent.removeChild(iFrame);
    parent.appendChild(oldFrame);
}

/**
 * Post Iframe message.
 */
function postIframeMessage(
    iFrame: HTMLIFrameElement,
    message: { type: HostEvent; data: any },
    thoughtSpotHost: string,
    channel?: MessageChannel,
) {
    return iFrame.contentWindow.postMessage(message, thoughtSpotHost, [
        channel?.port2,
    ]);
}

const TRIGGER_TIMEOUT = 30000;

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

        return postIframeMessage(
            iFrame,
            { type: messageType, data },
            thoughtSpotHost,
            channel,
        );
    });
}
