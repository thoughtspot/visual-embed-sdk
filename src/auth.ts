import EventEmitter from 'eventemitter3';
import { getAuthenticationToken } from './authToken';
import { getEmbedConfig } from './embed/embedConfig';
import { initMixpanel } from './mixpanel-service';
import {
    AuthType, DOMSelector, EmbedConfig, EmbedEvent,
} from './types';
import { getDOMNode, getRedirectUrl, getSSOMarker } from './utils';
import {
    EndPoints,
    fetchAuthPostService,
    fetchAuthService,
    fetchBasicAuthService,
    fetchLogoutService,
} from './utils/authService';
import { isActiveService } from './utils/authService/tokenizedAuthService';
import { logger } from './utils/logger';
import { getSessionInfo, getPreauthInfo } from './utils/sessionInfoService';
import { ERROR_MESSAGE } from './errors';
import { resetAllCachedServices } from './utils/resetServices';

// eslint-disable-next-line import/no-mutable-exports
export let loggedInStatus = false;
// eslint-disable-next-line import/no-mutable-exports
export let samlAuthWindow: Window = null;
// eslint-disable-next-line import/no-mutable-exports
export let samlCompletionPromise: Promise<void> = null;

let releaseVersion = '';

export const SSO_REDIRECTION_MARKER_GUID = '5e16222e-ef02-43e9-9fbd-24226bf3ce5b';

/**
 * Enum for auth failure types. This is the parameter passed to the listner
 * of {@link AuthStatus.FAILURE}.
 * @group Authentication / Init
 */
export enum AuthFailureType {
    SDK = 'SDK',
    NO_COOKIE_ACCESS = 'NO_COOKIE_ACCESS',
    EXPIRY = 'EXPIRY',
    OTHER = 'OTHER',
    IDLE_SESSION_TIMEOUT = 'IDLE_SESSION_TIMEOUT',
    UNAUTHENTICATED_FAILURE = 'UNAUTHENTICATED_FAILURE',
}

/**
 * Enum for auth status emitted by the emitter returned from {@link init}.
 * @group Authentication / Init
 */
export enum AuthStatus {
    /**
     * Emits when the SDK fails to authenticate
     */
    FAILURE = 'FAILURE',
    /**
     * Emits when the SDK authenticates successfully
     */
    SDK_SUCCESS = 'SDK_SUCCESS',
    /**
     * @hidden
     * Emits when iframe is loaded and session info is available
     */
    SESSION_INFO_SUCCESS = 'SESSION_INFO_SUCCESS',
    /**
     * Emits when the app sends an authentication success message
     */
    SUCCESS = 'SUCCESS',
    /**
     * Emits when a user logs out
     */
    LOGOUT = 'LOGOUT',
    /**
     * Emitted when inPopup is true in the SAMLRedirect flow and the
     * popup is waiting to be triggered either programmatically
     * or by the trigger button.
     * @version SDK: 1.19.0
     */
    WAITING_FOR_POPUP = 'WAITING_FOR_POPUP',

    /**
     * Emitted when the SAML popup is closed without authentication
     */
    SAML_POPUP_CLOSED_NO_AUTH = 'SAML_POPUP_CLOSED_NO_AUTH',
}

/**
 * Event emitter returned from {@link init}.
 * @group Authentication / Init
 */
export interface AuthEventEmitter {
    /**
     * Register a listener on Auth failure.
     * @param event
     * @param listener
     */
    on(event: AuthStatus.FAILURE, listener: (failureType: AuthFailureType) => void): this;
    /**
     * Register a listener on Auth SDK success.
     * @param event
     * @param listener
     */
    on(
        event: AuthStatus.SDK_SUCCESS | AuthStatus.LOGOUT | AuthStatus.WAITING_FOR_POPUP | AuthStatus.SAML_POPUP_CLOSED_NO_AUTH,
        listener: () => void,
    ): this;
    on(event: AuthStatus.SUCCESS, listener: (sessionInfo: any) => void): this;
    once(event: AuthStatus.FAILURE, listener: (failureType: AuthFailureType) => void): this;
    once(
        event: AuthStatus.SDK_SUCCESS | AuthStatus.LOGOUT | AuthStatus.WAITING_FOR_POPUP | AuthStatus.SAML_POPUP_CLOSED_NO_AUTH,
        listener: () => void,
    ): this;
    once(event: AuthStatus.SUCCESS, listener: (sessionInfo: any) => void): this;
    /**
     * Trigger an event on the emitter returned from init.
     * @param {@link AuthEvent}
     */
    emit(event: AuthEvent, ...args: any[]): boolean;
    /**
     * Remove listener from the emitter returned from init.
     * @param event
     * @param listener
     * @param context
     * @param once
     */
    off(event: AuthStatus, listener: (...args: any[]) => void, context: any, once: boolean): this;
    /**
     * Remove all the event listeners
     * @param event
     */
    removeAllListeners(event: AuthStatus): this;
}

/**
 * Events which can be triggered on the emitter returned from {@link init}.
 * @group Authentication / Init
 */
export enum AuthEvent {
    /**
     * Manually trigger the SSO popup. This is useful when
     * authStatus is SAMLRedirect/OIDCRedirect and inPopup is set to true
     */
    TRIGGER_SSO_POPUP = 'TRIGGER_SSO_POPUP',
}

let authEE: EventEmitter<AuthStatus | AuthEvent>;

/**
 *
 */
export function getAuthEE(): EventEmitter<AuthStatus | AuthEvent> {
    return authEE;
}

/**
 *
 * @param eventEmitter
 */
export function setAuthEE(eventEmitter: EventEmitter<AuthStatus | AuthEvent>): void {
    authEE = eventEmitter;
}

/**
 *
 */
export function notifyAuthSDKSuccess(): void {
    if (!authEE) {
        logger.error(ERROR_MESSAGE.SDK_NOT_INITIALIZED);
        return;
    }
    authEE.emit(AuthStatus.SDK_SUCCESS);
}

/**
 *
 */
export async function notifyAuthSuccess(): Promise<void> {
    if (!authEE) {
        logger.error(ERROR_MESSAGE.SDK_NOT_INITIALIZED);
        return;
    }
    try {
        getPreauthInfo();
        const sessionInfo = await getSessionInfo();
        authEE.emit(AuthStatus.SUCCESS, sessionInfo);
    } catch (e) {
        logger.error(ERROR_MESSAGE.SESSION_INFO_FAILED);
    }
}

/**
 *
 * @param failureType
 */
export function notifyAuthFailure(failureType: AuthFailureType): void {
    if (!authEE) {
        logger.error(ERROR_MESSAGE.SDK_NOT_INITIALIZED);
        return;
    }
    authEE.emit(AuthStatus.FAILURE, failureType);
}

/**
 *
 */
export function notifyLogout(): void {
    if (!authEE) {
        logger.error(ERROR_MESSAGE.SDK_NOT_INITIALIZED);
        return;
    }
    authEE.emit(AuthStatus.LOGOUT);
}

/**
 * Check if we are logged into the ThoughtSpot cluster
 * @param thoughtSpotHost The ThoughtSpot cluster hostname or IP
 */
async function isLoggedIn(thoughtSpotHost: string): Promise<boolean> {
    try {
        const response = await isActiveService(thoughtSpotHost);
        return response;
    } catch (e) {
        return false;
    }
}

/**
 * Services to be called after the login is successful,
 * This should be called after the cookie is set for cookie auth or
 * after the token is set for cookieless.
 * @return {Promise<void>}
 * @example
 * ```js
 * await postLoginService();
 * ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 */
export async function postLoginService(): Promise<void> {
    try {
        getPreauthInfo();
        const sessionInfo = await getSessionInfo();
        releaseVersion = sessionInfo.releaseVersion;
        const embedConfig = getEmbedConfig();
        if (!embedConfig.disableSDKTracking) {
            initMixpanel(sessionInfo);
        }
    } catch (e) {
        logger.error('Post login services failed.', e.message, e);
    }
}

/**
 * Return releaseVersion if available
 */
export function getReleaseVersion() {
    return releaseVersion;
}

/**
 * Check if we are stuck at the SSO redirect URL
 */
function isAtSSORedirectUrl(): boolean {
    return window.location.href.indexOf(getSSOMarker(SSO_REDIRECTION_MARKER_GUID)) >= 0;
}

/**
 * Remove the SSO redirect URL marker
 */
function removeSSORedirectUrlMarker(): void {
    // Note (sunny): This will leave a # around even if it was not in the URL
    // to begin with. Trying to remove the hash by changing window.location will
    // reload the page which we don't want. We'll live with adding an
    // unnecessary hash to the parent page URL until we find any use case where
    // that creates an issue.

    // Replace any occurences of ?ssoMarker=guid or &ssoMarker=guid.
    let updatedHash = window.location.hash.replace(`?${getSSOMarker(SSO_REDIRECTION_MARKER_GUID)}`, '');
    updatedHash = updatedHash.replace(`&${getSSOMarker(SSO_REDIRECTION_MARKER_GUID)}`, '');
    window.location.hash = updatedHash;
}

/**
 * Perform token based authentication
 * @param embedConfig The embed configuration
 */
export const doTokenAuth = async (embedConfig: EmbedConfig): Promise<boolean> => {
    const {
        thoughtSpotHost, username, authEndpoint, getAuthToken,
    } = embedConfig;
    if (!authEndpoint && !getAuthToken) {
        throw new Error('Either auth endpoint or getAuthToken function must be provided');
    }
    loggedInStatus = await isLoggedIn(thoughtSpotHost);

    if (!loggedInStatus) {
        let authToken: string;
        try {
            authToken = await getAuthenticationToken(embedConfig);
        } catch (e) {
            loggedInStatus = false;
            throw e;
        }
        let resp;
        try {
            resp = await fetchAuthPostService(thoughtSpotHost, username, authToken);
        } catch (e) {
            resp = await fetchAuthService(thoughtSpotHost, username, authToken);
        }
        // token login issues a 302 when successful
        loggedInStatus = resp.ok || resp.type === 'opaqueredirect';
        if (loggedInStatus && embedConfig.detectCookieAccessSlow) {
            // When 3rd party cookie access is blocked, this will fail because
            // cookies will not be sent with the call.
            loggedInStatus = await isLoggedIn(thoughtSpotHost);
        }
    }
    return loggedInStatus;
};

/**
 * Validate embedConfig parameters required for cookielessTokenAuth
 * @param embedConfig The embed configuration
 */
export const doCookielessTokenAuth = async (embedConfig: EmbedConfig): Promise<boolean> => {
    const { authEndpoint, getAuthToken } = embedConfig;
    if (!authEndpoint && !getAuthToken) {
        throw new Error('Either auth endpoint or getAuthToken function must be provided');
    }
    let authSuccess = false;
    try {
        const authToken = await getAuthenticationToken(embedConfig);
        if (authToken) {
            authSuccess = true;
        }
    } catch {
        authSuccess = false;
    }

    return authSuccess;
};

/**
 * Perform basic authentication to the ThoughtSpot cluster using the cluster
 * credentials.
 *
 * Warning: This feature is primarily intended for developer testing. It is
 * strongly advised not to use this authentication method in production.
 * @param embedConfig The embed configuration
 */
export const doBasicAuth = async (embedConfig: EmbedConfig): Promise<boolean> => {
    const { thoughtSpotHost, username, password } = embedConfig;
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (!loggedIn) {
        const response = await fetchBasicAuthService(thoughtSpotHost, username, password);
        loggedInStatus = response.ok;
        if (embedConfig.detectCookieAccessSlow) {
            loggedInStatus = await isLoggedIn(thoughtSpotHost);
        }
    } else {
        loggedInStatus = true;
    }
    return loggedInStatus;
};

/**
 *
 * @param ssoURL
 * @param triggerContainer
 * @param triggerText
 */
async function samlPopupFlow(ssoURL: string, triggerContainer: DOMSelector, triggerText: string) {
    let popupClosedCheck: NodeJS.Timeout;
    const openPopup = () => {
        if (samlAuthWindow === null || samlAuthWindow.closed) {
            samlAuthWindow = window.open(
                ssoURL,
                '_blank',
                'location=no,height=570,width=520,scrollbars=yes,status=yes',
            );
            if (samlAuthWindow) {
                popupClosedCheck = setInterval(() => {
                    if (samlAuthWindow.closed) {
                        clearInterval(popupClosedCheck);
                        if (samlCompletionPromise && !samlCompletionResolved) {
                            authEE?.emit(AuthStatus.SAML_POPUP_CLOSED_NO_AUTH);
                        }
                    }
                }, 500);
            }
        } else {
            samlAuthWindow.focus();
        }
    };
    let samlCompletionResolved = false;
    authEE?.emit(AuthStatus.WAITING_FOR_POPUP);
    const containerEl = getDOMNode(triggerContainer);
    if (containerEl) {
        containerEl.innerHTML = '<button id="ts-auth-btn" class="ts-auth-btn" style="margin: auto;"></button>';
        const authElem = document.getElementById('ts-auth-btn');
        authElem.textContent = triggerText;
        authElem.addEventListener('click', openPopup, { once: true });
    }
    samlCompletionPromise = samlCompletionPromise || new Promise<void>((resolve, reject) => {
        window.addEventListener('message', (e) => {
            if (e.data.type === EmbedEvent.SAMLComplete) {
                samlCompletionResolved = true;
                if (popupClosedCheck) {
                    clearInterval(popupClosedCheck);
                }
                (e.source as Window).close();
                resolve();
            }
        });
    });

    authEE?.once(AuthEvent.TRIGGER_SSO_POPUP, openPopup);
    return samlCompletionPromise;
}

/**
 * Perform SAML authentication
 * @param embedConfig The embed configuration
 * @param ssoEndPoint
 */
const doSSOAuth = async (embedConfig: EmbedConfig, ssoEndPoint: string): Promise<void> => {
    const { thoughtSpotHost } = embedConfig;
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (loggedIn) {
        if (isAtSSORedirectUrl()) {
            removeSSORedirectUrlMarker();
        }
        loggedInStatus = true;
        return;
    }

    // we have already tried authentication and it did not succeed, restore
    // the current URL to the original one and invoke the callback.
    if (isAtSSORedirectUrl()) {
        removeSSORedirectUrlMarker();
        loggedInStatus = false;
        return;
    }

    const ssoURL = `${thoughtSpotHost}${ssoEndPoint}`;
    if (embedConfig.inPopup) {
        await samlPopupFlow(ssoURL, embedConfig.authTriggerContainer, embedConfig.authTriggerText);
        loggedInStatus = await isLoggedIn(thoughtSpotHost);
        return;
    }

    window.location.href = ssoURL;
};

export const doSamlAuth = async (embedConfig: EmbedConfig) => {
    const { thoughtSpotHost } = embedConfig;
    // redirect for SSO, when the SSO authentication is done, this page will be
    // loaded again and the same JS will execute again.
    const ssoRedirectUrl = embedConfig.inPopup
        ? `${thoughtSpotHost}/v2/#/embed/saml-complete`
        : getRedirectUrl(
            window.location.href,
            SSO_REDIRECTION_MARKER_GUID,
            embedConfig.redirectPath,
        );

    // bring back the page to the same URL
    const ssoEndPoint = `${EndPoints.SAML_LOGIN_TEMPLATE(encodeURIComponent(ssoRedirectUrl))}`;

    await doSSOAuth(embedConfig, ssoEndPoint);
    return loggedInStatus;
};

export const doOIDCAuth = async (embedConfig: EmbedConfig) => {
    const { thoughtSpotHost } = embedConfig;
    // redirect for SSO, when the SSO authentication is done, this page will be
    // loaded again and the same JS will execute again.
    const ssoRedirectUrl = embedConfig.noRedirect || embedConfig.inPopup
        ? `${thoughtSpotHost}/v2/#/embed/saml-complete`
        : getRedirectUrl(
            window.location.href,
            SSO_REDIRECTION_MARKER_GUID,
            embedConfig.redirectPath,
        );

    // bring back the page to the same URL
    const baseEndpoint = `${EndPoints.OIDC_LOGIN_TEMPLATE(encodeURIComponent(ssoRedirectUrl))}`;
    const ssoEndPoint = `${baseEndpoint}${baseEndpoint.includes('?') ? '&' : '?'}forceSAMLAutoRedirect=true`;

    await doSSOAuth(embedConfig, ssoEndPoint);
    return loggedInStatus;
};

export const logout = async (embedConfig: EmbedConfig): Promise<boolean> => {
    const { thoughtSpotHost } = embedConfig;
    await fetchLogoutService(thoughtSpotHost);
    resetAllCachedServices();
    const thoughtspotIframes = document.querySelectorAll("[data-ts-iframe='true']");
    if (thoughtspotIframes?.length) {
        thoughtspotIframes.forEach((el) => {
            el.parentElement.innerHTML = embedConfig.loginFailedMessage;
        });
    }
    loggedInStatus = false;
    return loggedInStatus;
};

/**
 * Perform authentication on the ThoughtSpot cluster
 * @param embedConfig The embed configuration
 */
export const authenticate = async (embedConfig: EmbedConfig): Promise<boolean> => {
    const { authType } = embedConfig;
    switch (authType) {
        case AuthType.SSO:
        case AuthType.SAMLRedirect:
        case AuthType.SAML:
            return doSamlAuth(embedConfig);
        case AuthType.OIDC:
        case AuthType.OIDCRedirect:
            return doOIDCAuth(embedConfig);
        case AuthType.AuthServer:
        case AuthType.TrustedAuthToken:
            return doTokenAuth(embedConfig);
        case AuthType.TrustedAuthTokenCookieless:
            return doCookielessTokenAuth(embedConfig);
        case AuthType.Basic:
            return doBasicAuth(embedConfig);
        default:
            return Promise.resolve(true);
    }
};

/**
 * Check if we are authenticated to the ThoughtSpot cluster
 */
export const isAuthenticated = (): boolean => loggedInStatus;
