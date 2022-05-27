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

        return postIframeMessage(
            iFrame,
            { type: messageType, data },
            thoughtSpotHost,
            channel,
        );
    });
}
