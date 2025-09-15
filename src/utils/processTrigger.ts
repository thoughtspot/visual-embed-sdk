import { ERROR_MESSAGE } from '../errors';
import { HostEvent, MessagePayload } from '../types';
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
 * @param thoughtSpotHost
 * @param channel
 */
function postIframeMessage(
    iFrame: HTMLIFrameElement,
    message: { type: HostEvent; data: any },
    thoughtSpotHost: string,
    channel?: MessageChannel,
) {
    logger.log("21. Post iframe message");
    return iFrame.contentWindow?.postMessage(message, thoughtSpotHost, [channel?.port2]);
}

export const TRIGGER_TIMEOUT = 30000;

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
        logger.log("11. Processing trigger");
        if (messageType === HostEvent.Reload) {
            logger.info('12. reload event listener is coming here');
            reload(iFrame);
            return res(null);
        }
        
        if (messageType === HostEvent.Present) {
            logger.log("13. Present event listener is coming here");
            const embedConfig = getEmbedConfig();
            const disableFullscreenPresentation = embedConfig?.disableFullscreenPresentation ?? true;
            
            if (!disableFullscreenPresentation) {
                logger.log("14. Present event listener is coming here");
                handlePresentEvent(iFrame);
            } else {
                logger.log("15. Present event listener is coming here");
                logger.warn('Fullscreen presentation mode is disabled. Set disableFullscreenPresentation: false to enable this feature.');
            }
        }
        
        const channel = new MessageChannel();
        channel.port1.onmessage = ({ data: responseData }) => {
            logger.log("16. Present event listener is coming here");
            channel.port1.close();
            const error = responseData.error || responseData?.data?.error;
            if (error) {
                logger.log("17. Present event listener is coming here");
                rej(error);
            } else {
                logger.log("18. Present event listener is coming here");
                res(responseData);
            }
        };

        // Close the messageChannel and resolve the promise if timeout.
        setTimeout(() => {
            channel.port1.close();
            logger.log("19. Present event listener is coming here");
            res(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        }, TRIGGER_TIMEOUT);

        logger.log("20. Present event listener is coming here");
        return postIframeMessage(iFrame, { type: messageType, data }, thoughtSpotHost, channel);
    });
}
