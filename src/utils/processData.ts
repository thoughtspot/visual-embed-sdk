import {
    disableAutoLogin,
    getEmbedConfig,
    handleAuth,
    notifyAuthFailure,
    notifyAuthSuccess,
    notifyLogout,
} from '../embed/base';
import { AuthFailureType, initSession } from '../auth';
import { AuthType, EmbedEvent, OperationType } from '../types';
import { getAnswerServiceInstance } from './answerService';

export function processCustomAction(e: any, thoughtSpotHost: string) {
    if (
        [
            OperationType.GetChartWithData,
            OperationType.GetTableWithHeadlineData,
        ].includes(e.data?.operation)
    ) {
        const { session, query, operation } = e.data;
        const answerService = getAnswerServiceInstance(
            session,
            query,
            operation,
            thoughtSpotHost,
        );
        return {
            ...e,
            answerService,
        };
    }
    return e;
}

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

function processAuthExpire(e: any) {
    const { autoLogin = false } = getEmbedConfig(); // Set default to false
    if (autoLogin) {
        handleAuth();
    }
    notifyAuthFailure(AuthFailureType.EXPIRY);
    return e;
}

function processNoCookieAccess(e: any, containerEl: Element) {
    const {
        loginFailedMessage,
        suppressNoCookieAccessAlert,
    } = getEmbedConfig();
    if (!suppressNoCookieAccessAlert) {
        // eslint-disable-next-line no-alert
        alert(
            'Third party cookie access is blocked on this browser, please allow third party cookies for this to work properly. \nYou can use `suppressNoCookieAccessAlert` to suppress this message.',
        );
    }
    // eslint-disable-next-line no-param-reassign
    containerEl.innerHTML = loginFailedMessage;
    notifyAuthFailure(AuthFailureType.NO_COOKIE_ACCESS);
    return e;
}

function processAuthFailure(e: any, containerEl: Element) {
    const { loginFailedMessage, authType } = getEmbedConfig();
    if (authType !== AuthType.None) {
        // eslint-disable-next-line no-param-reassign
        containerEl.innerHTML = loginFailedMessage;
        notifyAuthFailure(AuthFailureType.OTHER);
    }
    return e;
}

function processAuthLogout(e: any, containerEl: Element) {
    const { loginFailedMessage } = getEmbedConfig();
    // eslint-disable-next-line no-param-reassign
    containerEl.innerHTML = loginFailedMessage;
    disableAutoLogin();
    notifyLogout();
    return e;
}

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
        case EmbedEvent.AuthExpire:
            return processAuthExpire(e);
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
