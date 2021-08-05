import * as mixpanel from 'mixpanel-browser';

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

export function initMixpanel(sessionInfo: any): void {
    if (!sessionInfo || !sessionInfo.mixpanelToken) {
        return;
    }
    // On a public cluster the user is anonymous, so don't set the identify to userGUID
    const isPublicCluster = !!sessionInfo.isPublicUser;
    const token = sessionInfo.mixpanelToken;
    if (token) {
        mixpanel.init(token);
        if (!isPublicCluster) {
            mixpanel.identify(sessionInfo.userGUID);
        }
        setEventCollectorOn();
        emptyQueue();
    }
}
