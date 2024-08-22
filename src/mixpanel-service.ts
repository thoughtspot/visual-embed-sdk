import * as mixpanel from 'mixpanel-browser';
import { logger } from './utils/logger';
import { SessionInfo } from './utils/sessionInfoService';
import { ERROR_MESSAGE } from './errors';

export const EndPoints = {
    CONFIG: '/callosum/v1/system/config',
};

// Needed to avoid error in CJS builds on some bundlers.
const mixpanelLib = mixpanel.default || mixpanel;
let mixpanelInstance: mixpanel.Mixpanel;

/**
 * Enum of mixpanel events
 * @hidden
 */
export const MIXPANEL_EVENT = {
    VISUAL_SDK_RENDER_START: 'visual-sdk-render-start',
    VISUAL_SDK_CALLED_INIT: 'visual-sdk-called-init',
    VISUAL_SDK_RENDER_COMPLETE: 'visual-sdk-render-complete',
    VISUAL_SDK_RENDER_FAILED: 'visual-sdk-render-failed',
    VISUAL_SDK_TRIGGER: 'visual-sdk-trigger',
    VISUAL_SDK_ON: 'visual-sdk-on',
    VISUAL_SDK_IFRAME_LOAD_PERFORMANCE: 'visual-sdk-iframe-load-performance',
    VISUAL_SDK_EMBED_CREATE: 'visual-sdk-embed-create',
    VERCEL_INTEGRATION_COMPLETED: 'vercel-integration-completed',
};

let isMixpanelInitialized = false;
let eventQueue: { eventId: string; eventProps: any }[] = [];

/**
 * Pushes the event with its Property key-value map to mixpanel.
 * @param eventId
 * @param eventProps
 */
export function uploadMixpanelEvent(eventId: string, eventProps = {}): void {
    if (!isMixpanelInitialized) {
        eventQueue.push({ eventId, eventProps });
        return;
    }
    mixpanelInstance.track(eventId, eventProps);
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
export function initMixpanel(sessionInfo: SessionInfo): void {
    if (!sessionInfo || !sessionInfo.mixpanelToken) {
        logger.error(ERROR_MESSAGE.MIXPANEL_TOKEN_NOT_FOUND);
        return;
    }
    // On a public cluster the user is anonymous, so don't set the identify to
    // userGUID
    const isPublicCluster = !!sessionInfo.isPublicUser;
    const token = sessionInfo.mixpanelToken;
    try {
        if (token) {
            mixpanelInstance = mixpanelLib.init(token, undefined, 'tsEmbed');
            if (!isPublicCluster) {
                mixpanelInstance.identify(sessionInfo.userGUID);
            }
            mixpanelInstance.register_once({
                clusterId: sessionInfo.clusterId,
                clusterName: sessionInfo.clusterName,
                releaseVersion: sessionInfo.releaseVersion,
                hostAppUrl: window?.location?.host || '',
            });
            isMixpanelInitialized = true;
            emptyQueue();
        }
    } catch (e) {
        logger.error('Error initializing mixpanel', e);
    }
}

/**
 *
 */
export function testResetMixpanel() {
    isMixpanelInitialized = false;
    eventQueue = [];
}
