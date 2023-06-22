import * as mixpanel from 'mixpanel-browser';

export const EndPoints = {
    CONFIG: '/callosum/v1/system/config',
};

// Needed to avoid error in CJS builds on some bundlers.
const mixpanelLib = mixpanel.default || mixpanel;

export const MIXPANEL_EVENT = {
    VISUAL_SDK_RENDER_START: 'visual-sdk-render-start',
    VISUAL_SDK_CALLED_INIT: 'visual-sdk-called-init',
    VISUAL_SDK_RENDER_COMPLETE: 'visual-sdk-render-complete',
    VISUAL_SDK_RENDER_FAILED: 'visual-sdk-render-failed',
    VISUAL_SDK_TRIGGER: 'visual-sdk-trigger',
    VISUAL_SDK_ON: 'visual-sdk-on',
    VISUAL_SDK_IFRAME_LOAD_PERFORMANCE: 'visual-sdk-iframe-load-performance',
};

let isMixpanelInitialized = false;
let eventQueue: { eventId: string; eventProps: any }[] = [];

/**
 * Pushes the event with its Property key-value map to mixpanel.
 *
 * @param eventId
 * @param eventProps
 */
export function uploadMixpanelEvent(eventId: string, eventProps = {}): void {
    if (!isMixpanelInitialized) {
        eventQueue.push({ eventId, eventProps });
        return;
    }
    mixpanelLib.track(eventId, eventProps);
}

/**
 *
 */
function emptyQueue() {
    if (!isMixpanelInitialized) {
        return;
    }
    eventQueue.forEach((event) => {
        uploadMixpanelEvent(event.eventId, event.eventProps);
    });
    eventQueue = [];
}

/**
 *
 * @param sessionInfo
 */
export function initMixpanel(sessionInfo: any): void {
    if (!sessionInfo || !sessionInfo.mixpanelToken) {
        return;
    }
    // On a public cluster the user is anonymous, so don't set the identify to
    // userGUID
    const isPublicCluster = !!sessionInfo.isPublicUser;
    const token = sessionInfo.mixpanelToken;
    try {
        if (token) {
            mixpanelLib.init(token);
            if (!isPublicCluster) {
                mixpanelLib.identify(sessionInfo.userGUID);
            }
            isMixpanelInitialized = true;
            emptyQueue();
        }
    } catch (e) {
        console.error('Error initializing mixpanel', e);
    }
}

/**
 *
 */
export function testResetMixpanel() {
    isMixpanelInitialized = false;
    eventQueue = [];
}
