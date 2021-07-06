import * as mixpanel from 'mixpanel-browser';
import { getSessionInfo } from './auth';
import { EmbedConfig } from './types';

export const EndPoints = {
    CONFIG: '/callosum/v1/system/config',
};

export const MIXPANEL_EVENT = {
    VISUAL_SDK_RENDER_START: 'visual-sdk-render-start',
    VISUAL_SDK_CALLED_INIT: 'visual-sdk-called-init',
    VISUAL_SDK_RENDER_COMPLETE: 'visual-sdk-render-complete',
    VISUAL_SDK_RENDER_FAILED: 'visual-sdk-render-failed',
    VISUAL_SDK_TRIGGER: 'visual-sdk-trigger',
    VISUAL_SDK_IFRAME_LOAD_PERFORMANCE: 'visual-sdk-iframe-load-performance',
};

let isEventCollectorOn = false;
const eventCollectorQueue: { eventId: string; eventProps: any }[] = [];

function setEventCollectorOn() {
    isEventCollectorOn = true;
}

function getEventCollectorOnValue() {
    return isEventCollectorOn;
}

/**
 * Pushes the event with its Property key-value map to mixpanel.
 * @param eventId
 * @param eventProps
 */
export async function uploadMixpanelEvent(
    eventId: string,
    eventProps = {},
): Promise<any> {
    if (!getEventCollectorOnValue()) {
        eventCollectorQueue.push({ eventId, eventProps });
        return Promise.resolve();
    }
    return new Promise(() => mixpanel.track(eventId, eventProps));
}

function emptyQueue() {
    eventCollectorQueue.forEach((event) => {
        uploadMixpanelEvent(event.eventId, event.eventProps);
    });
}

export async function initMixpanel(authPromise: Promise<void>, config: EmbedConfig): Promise<any> {
    const { thoughtSpotHost } = config;
    // Wait auth to complete
    await authPromise;
    // Fetch sessionInfo if not fetched yet.
    const sessionInfo = await getSessionInfo(thoughtSpotHost);
    // On a public cluster the user is anonymous, so don't set the identify to userGUID
    const isPublicCluster = !!sessionInfo.configInfo.isPublicUser;
    const token = sessionInfo.configInfo.mixpanelAccessToken;
    if (token) {
        mixpanel.init(token);
        if (!isPublicCluster) {
            mixpanel.identify(sessionInfo.userGUID);
        }
        setEventCollectorOn();
        emptyQueue();
    }
}
