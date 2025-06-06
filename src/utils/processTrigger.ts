import { ERROR_MESSAGE } from '../errors';
import { HostEvent } from '../types';

/**
 * Handle the Present event locally before forwarding
 * @param iFrame - The iframe element to make fullscreen
 */
function handlePresentEvent(iFrame: HTMLIFrameElement) {
    const iframe = iFrame;
    
    if (!iframe) {
        console.warn('No iframe found on the page');
        return;
    }

    // Check if already in fullscreen mode
    const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
    );

    if (isInFullscreen) {
        // Already in fullscreen, nothing to do
        return;
    }

    // Try to request fullscreen with vendor prefixes and error handling
    const fullscreenMethods = [
        'requestFullscreen',
        'webkitRequestFullscreen', 
        'mozRequestFullScreen',
        'msRequestFullscreen'
    ];

    let fullscreenRequested = false;
    
    for (const method of fullscreenMethods) {
        if (typeof (iframe as any)[method] === 'function') {
            try {
                const result = (iframe as any)[method]();
                if (result && typeof result.catch === 'function') {
                    result.catch((error: any) => {
                        console.warn(`Failed to enter fullscreen using ${method}:`, error);
                    });
                }
                fullscreenRequested = true;
                break;
            } catch (error) {
                console.warn(`Failed to enter fullscreen using ${method}:`, error);
            }
        }
    }

    if (!fullscreenRequested) {
        console.error('Fullscreen API is not supported by this browser.');
    }
}

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
        if (messageType === HostEvent.Reload) {
            reload(iFrame);
            return res(null);
        }
        
        if (messageType === HostEvent.Present) {
            handlePresentEvent(iFrame);
        }
        
        const channel = new MessageChannel();
        channel.port1.onmessage = ({ data: responseData }) => {
            channel.port1.close();
            const error = responseData.error || responseData?.data?.error;
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

        return postIframeMessage(iFrame, { type: messageType, data }, thoughtSpotHost, channel);
    });
}
