import { ContextType, HostEvent } from '../types';
import { logger } from '../utils/logger';
import { handlePresentEvent } from '../utils';
import { getEmbedConfig } from '../embed/embedConfig';
import {
    MESSAGE_RESPONSE_TIMEOUT,
    sendMessageWithResponse,
} from './transport/iframe-transport';

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

export const TRIGGER_TIMEOUT = MESSAGE_RESPONSE_TIMEOUT;

/**
 * Processes a host event trigger: handles SDK-local events (Reload,
 * Present) and forwards everything else to the embedded app over the
 * iframe transport.
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
    if (messageType === HostEvent.Reload) {
        reload(iFrame);
        return Promise.resolve(null);
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

    return sendMessageWithResponse(
        iFrame,
        { type: messageType, data, context },
        thoughtSpotHost,
        TRIGGER_TIMEOUT,
    );
}
