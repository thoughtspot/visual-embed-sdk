import { ERROR_MESSAGE } from '../errors';
import { ContextType, HostEvent, MessagePayload } from '../types';
import { logger } from '../utils/logger';
import { handlePresentEvent } from '../utils';
import { getEmbedConfig } from '../embed/embedConfig';

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
 * @param message.context
 * @param thoughtSpotHost
 * @param channel
 */
function postIframeMessage(
    iFrame: HTMLIFrameElement,
    message: { type: HostEvent; data: any, context?: any },
    thoughtSpotHost: string,
    channel?: MessageChannel,
) {
    return iFrame.contentWindow?.postMessage(message, thoughtSpotHost, [channel?.port2]);
}

export const TRIGGER_TIMEOUT = 30000;

/**
 *
 * @param iFrame
 * @param messageType
 * @param thoughtSpotHost
 * @param data
 * @param context
 */
export function processTrigger(
    iFrame: HTMLIFrameElement,
    messageType: HostEvent,
    thoughtSpotHost: string,
    data: any,
    context?: ContextType,
): Promise<any> {
    return new Promise<any>((res, rej) => {
        if (messageType === HostEvent.Reload) {
            reload(iFrame);
            return res(null);
        }
        
        if (messageType === HostEvent.Present) {
            const embedConfig = getEmbedConfig();
            const disableFullscreenPresentation = embedConfig?.disableFullscreenPresentation ?? true;
            
            if (!disableFullscreenPresentation) {
                handlePresentEvent(iFrame);
            } else {
                logger.warn('Fullscreen presentation mode is disabled. Set disableFullscreenPresentation: false to enable this feature.');
            }
        }
        
        const channel = new MessageChannel();
        channel.port1.onmessage = ({ data: responseData }) => {
            channel.port1.close();
            const error = responseData?.error || responseData?.data?.error;
            if (error) {
                rej(error);
            } else {
                res(responseData);
            }
        };

        // Close the messageChannel and resolve the promise if timeout.
        setTimeout(() => {
            channel.port1.close();
            res(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        }, TRIGGER_TIMEOUT);

        return postIframeMessage(iFrame, { type: messageType, data, context }, thoughtSpotHost, channel);
    });
}
