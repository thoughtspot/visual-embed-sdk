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
) {
    return iFrame.contentWindow.postMessage(message, thoughtSpotHost);
}

export function processTrigger(
    iFrame: HTMLIFrameElement,
    messageType: HostEvent,
    thoughtSpotHost: string,
    data: any,
) {
    switch (messageType) {
        case HostEvent.Reload:
            return reload(iFrame);
        default:
            return postIframeMessage(
                iFrame,
                { type: messageType, data },
                thoughtSpotHost,
            );
    }
}
