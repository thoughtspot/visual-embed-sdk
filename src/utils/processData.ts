import {
    disableAutoLogin,
    getEmbedConfig,
    notifyAuthFailure,
    notifyAuthSuccess,
    notifyLogout,
} from '../embed/base';
import { AuthFailureType, initSession } from '../auth';
import { AuthType, EmbedEvent, OperationType } from '../types';
import { getAnswerServiceInstance } from './answerService';

/**
 *
 * @param e
 * @param thoughtSpotHost
 */
export function processCustomAction(e: any, thoughtSpotHost: string) {
    if (
        [OperationType.GetChartWithData, OperationType.GetTableWithHeadlineData].includes(
            e.data?.operation,
        )
    ) {
        const { session, query, operation } = e.data;
        const answerService = getAnswerServiceInstance(session, query, operation, thoughtSpotHost);
        return {
            ...e,
            answerService,
        };
    }
    return e;
}

/**
 *
 * @param e
 */
function processAuthInit(e: any) {
    // Store user session details sent by app.
    initSession(e.data);
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
    } = getEmbedConfig();
    if (!ignoreNoCookieAccess) {
        if (!suppressNoCookieAccessAlert) {
            // eslint-disable-next-line no-alert
            alert(
                'Third party cookie access is blocked on this browser, please allow third party cookies for this to work properly. \nYou can use `suppressNoCookieAccessAlert` to suppress this message.',
            );
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
function processAuthFailure(e: any, containerEl: Element) {
    const { loginFailedMessage, authType } = getEmbedConfig();
    if (authType !== AuthType.None) {
        // eslint-disable-next-line no-param-reassign
        containerEl.innerHTML = loginFailedMessage;
        notifyAuthFailure(AuthFailureType.OTHER);
    }
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
