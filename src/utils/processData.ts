import { getEmbedConfig } from '../embed/embedConfig';
import {
    disableAutoLogin,
    notifyAuthFailure,
    notifyAuthSuccess,
    notifyLogout,
} from '../embed/base';
import { AuthFailureType } from '../auth';
import { AuthType, CustomActionPayload, EmbedEvent } from '../types';
import { AnswerService } from './graphql/answerService/answerService';
import { resetCachedAuthToken } from '../authToken';
import { ERROR_MESSAGE } from '../errors';
import { handleExitPresentMode } from '../utils';
import { resetCachedPreauthInfo, resetCachedSessionInfo } from './sessionInfoService';

/**
 * Process the ExitPresentMode event and handle default fullscreen exit
 * @param e - The event data
 */
function processExitPresentMode(e: any) {
    const embedConfig = getEmbedConfig();
    const disableFullscreenPresentation = embedConfig?.disableFullscreenPresentation ?? true;

    if (!disableFullscreenPresentation) {
        handleExitPresentMode();
    }
}

/**
 * Clears the cached preauth and session info.
 */
function processClearInfoCache() {
    resetCachedPreauthInfo();
    resetCachedSessionInfo();
}
/**
 *
 * @param e
 * @param thoughtSpotHost
 */
export function processCustomAction(e: any, thoughtSpotHost: string) {
    const { session, embedAnswerData, contextMenuPoints } = e.data as CustomActionPayload;
    const answerService = new AnswerService(
        session,
        embedAnswerData || {},
        thoughtSpotHost,
        contextMenuPoints?.selectedPoints,
    );
    return {
        ...e,
        answerService,
    };
}

/**
 * Responds to AuthInit sent from host signifying successful authentication in host.
 * @param e
 * @returns {any}
 */
function processAuthInit(e: any) {
    notifyAuthSuccess();

    // Expose only allowed details (eg: userGUID) back to SDK users.
    return {
        ...e,
        data: {
            userGUID: e.data?.userGUID || e.payload?.userGUID,
        },
    };
}

/**
 *
 * @param e
 * @param containerEl
 */
function processNoCookieAccess(e: any, containerEl: Element) {
    const {
        loginFailedMessage,
        suppressNoCookieAccessAlert,
        ignoreNoCookieAccess,
        suppressErrorAlerts,
    } = getEmbedConfig();
    if (!ignoreNoCookieAccess) {
        if (!suppressNoCookieAccessAlert && !suppressErrorAlerts) {
            // eslint-disable-next-line no-alert
            alert(ERROR_MESSAGE.THIRD_PARTY_COOKIE_BLOCKED_ALERT);
        }
        // eslint-disable-next-line no-param-reassign
        containerEl.innerHTML = loginFailedMessage;
    }
    notifyAuthFailure(AuthFailureType.NO_COOKIE_ACCESS);
    return e;
}

/**
 *
 * @param e
 * @param containerEl
 */
export function processAuthFailure(e: any, containerEl: Element) {
    const {
        loginFailedMessage, authType, disableLoginFailurePage, autoLogin,
    } = getEmbedConfig();

    const isEmbeddedSSO = authType === AuthType.EmbeddedSSO;
    const isTrustedAuth = authType === AuthType.TrustedAuthToken || authType === AuthType.TrustedAuthTokenCookieless;
    const isEmbeddedSSOInfoFailure = isEmbeddedSSO && e?.data?.type === AuthFailureType.UNAUTHENTICATED_FAILURE;
    if (autoLogin && isTrustedAuth) {
        // eslint-disable-next-line no-param-reassign
        containerEl.innerHTML = loginFailedMessage;
        notifyAuthFailure(AuthFailureType.IDLE_SESSION_TIMEOUT);
    } else if (authType !== AuthType.None && !disableLoginFailurePage && !isEmbeddedSSOInfoFailure) {
        // eslint-disable-next-line no-param-reassign
        containerEl.innerHTML = loginFailedMessage;
        notifyAuthFailure(AuthFailureType.OTHER);
    }
    resetCachedAuthToken();
    return e;
}

/**
 *
 * @param e
 * @param containerEl
 */
function processAuthLogout(e: any, containerEl: Element) {
    const { loginFailedMessage } = getEmbedConfig();
    // eslint-disable-next-line no-param-reassign
    containerEl.innerHTML = loginFailedMessage;
    resetCachedAuthToken();
    disableAutoLogin();
    notifyLogout();
    return e;
}

/**
 *
 * @param type
 * @param e
 * @param thoughtSpotHost
 * @param containerEl
 */
export function processEventData(
    type: EmbedEvent,
    eventData: any,
    thoughtSpotHost: string,
    containerEl: Element,
): any {
    switch (type) {
        case EmbedEvent.CustomAction:
            return processCustomAction(eventData, thoughtSpotHost);
        case EmbedEvent.AuthInit:
            return processAuthInit(eventData);
        case EmbedEvent.NoCookieAccess:
            return processNoCookieAccess(eventData, containerEl);
        case EmbedEvent.AuthFailure:
            return processAuthFailure(eventData, containerEl);
        case EmbedEvent.AuthLogout:
            return processAuthLogout(eventData, containerEl);
        case EmbedEvent.ExitPresentMode:
            return processExitPresentMode(eventData);
        case EmbedEvent.CLEAR_INFO_CACHE:
            return processClearInfoCache();
        default:
    }
    return eventData;
}
