import { SessionInfo } from './utils/sessionInfoService';
export declare const EndPoints: {
    CONFIG: string;
};
/**
 * Enum of mixpanel events
 * @hidden
 */
export declare const MIXPANEL_EVENT: {
    VISUAL_SDK_RENDER_START: string;
    VISUAL_SDK_CALLED_INIT: string;
    VISUAL_SDK_RENDER_COMPLETE: string;
    VISUAL_SDK_RENDER_FAILED: string;
    VISUAL_SDK_TRIGGER: string;
    VISUAL_SDK_ON: string;
    VISUAL_SDK_IFRAME_LOAD_PERFORMANCE: string;
    VISUAL_SDK_EMBED_CREATE: string;
    VERCEL_INTEGRATION_COMPLETED: string;
};
/**
 * Pushes the event with its Property key-value map to mixpanel.
 * @param eventId
 * @param eventProps
 */
export declare function uploadMixpanelEvent(eventId: string, eventProps?: {}): void;
/**
 *
 * @param sessionInfo
 */
export declare function initMixpanel(sessionInfo: SessionInfo): void;
/**
 *
 */
export declare function testResetMixpanel(): void;
//# sourceMappingURL=mixpanel-service.d.ts.map