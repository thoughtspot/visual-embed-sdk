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
 *
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
    const { loginFailedMessage, authType } = getEmbedConfig();
    if (authType !== AuthType.None) {
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
    e: any,
    thoughtSpotHost: string,
    containerEl: Element,
): any {
    switch (type) {
        case EmbedEvent.CustomAction:
            return processCustomAction(e, thoughtSpotHost);
        case EmbedEvent.AuthInit:
            return processAuthInit(e);
        case EmbedEvent.NoCookieAccess:
            return processNoCookieAccess(e, containerEl);
        case EmbedEvent.AuthFailure:
            return processAuthFailure(e, containerEl);
        case EmbedEvent.AuthLogout:
            return processAuthLogout(e, containerEl);
        default:
    }
    return e;
}
