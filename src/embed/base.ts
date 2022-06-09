/* eslint-disable import/no-mutable-exports */
/**
 * Copyright (c) 2022
 *
 * Base classes
 *
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import EventEmitter from 'eventemitter3';
import { getThoughtSpotHost } from '../config';
import { AuthType, EmbedConfig } from '../types';
import {
    authenticate,
    logout as _logout,
    AuthFailureType,
    AuthStatus,
} from '../auth';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';

let config = {} as EmbedConfig;
const CONFIG_DEFAULTS: Partial<EmbedConfig> = {
    loginFailedMessage: 'Not logged in',
    authType: AuthType.None,
};

export let authPromise: Promise<boolean>;

export const getEmbedConfig = (): EmbedConfig => config;

export const getAuthPromise = (): Promise<boolean> => authPromise;

let authEE: EventEmitter;

export function notifyAuthSuccess(): void {
    if (!authEE) {
        console.error('SDK not initialized');
        return;
    }
    authEE.emit(AuthStatus.SUCCESS);
}

export function notifyAuthFailure(failureType: AuthFailureType): void {
    if (!authEE) {
        console.error('SDK not initialized');
        return;
    }
    authEE.emit(AuthStatus.FAILURE, failureType);
}

export function notifyLogout(): void {
    if (!authEE) {
        console.error('SDK not initialized');
        return;
    }
    authEE.emit(AuthStatus.LOGOUT);
}
/**
 * Perform authentication on the ThoughtSpot app as applicable.
 */
export const handleAuth = (): Promise<boolean> => {
    authPromise = authenticate(config);
    authPromise.then(
        (isLoggedIn) => {
            if (!isLoggedIn) {
                notifyAuthFailure(AuthFailureType.SDK);
            }
        },
        () => {
            notifyAuthFailure(AuthFailureType.SDK);
        },
    );
    return authPromise;
};

/**
 * Prefetches static resources from the specified URL. Web browsers can then cache the prefetched resources and serve them from the user's local disk to provide faster access to your app.
 * @param url The URL provided for prefetch
 */
export const prefetch = (url?: string): void => {
    if (url === '') {
        // eslint-disable-next-line no-console
        console.warn('The prefetch method does not have a valid URL');
    } else {
        const iFrame = document.createElement('iframe');
        iFrame.src = url || config.thoughtSpotHost;
        iFrame.style.width = '0';
        iFrame.style.height = '0';
        iFrame.style.border = '0';
        iFrame.classList.add('prefetchIframe');
        document.body.appendChild(iFrame);
    }
};

/**
 * Initialize the ThoughtSpot embed SDK globally and perform
 * authentication if applicable.
 * @param embedConfig The configuration object containing ThoughtSpot host,
 * authentication mechanism and so on.
 *
 * eg: authStatus = init(config);
 * authStatus.on(AuthStatus.FAILURE, (reason) => { // do something here });
 *
 * @returns event emitter which emits events on authentication success, failure and logout. {@link AuthStatus}
 */
export const init = (embedConfig: EmbedConfig): EventEmitter => {
    config = {
        ...CONFIG_DEFAULTS,
        ...embedConfig,
        thoughtSpotHost: getThoughtSpotHost(embedConfig),
    };
    authEE = new EventEmitter();
    handleAuth();

    uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_CALLED_INIT, {
        authType: config.authType,
        host: config.thoughtSpotHost,
    });

    if (config.callPrefetch) {
        prefetch(config.thoughtSpotHost);
    }
    return authEE;
};

export function disableAutoLogin(): void {
    config.autoLogin = false;
}

/**
 * Logout from ThoughtSpot. This also sets the autoLogin flag to false, to prevent
 * the SDK from automatically logging in again.
 *
 * You can call the `init` method again to re login, if autoLogin is set to true in this
 * second call it will be honored.
 *
 * @param doNotDisableAutoLogin This flag when passed will not disable autoLogin
 * @returns Promise which resolves when logout completes.
 * @version SDK: 1.10.1 | ThoughtSpot: *
 */
export const logout = (doNotDisableAutoLogin = false): Promise<boolean> => {
    if (!doNotDisableAutoLogin) {
        disableAutoLogin();
    }
    return _logout(config).then((isLoggedIn) => {
        notifyLogout();
        return isLoggedIn;
    });
};

let renderQueue: Promise<any> = Promise.resolve();

/**
 * Renders functions in a queue, resolves to next function only after the callback next is called
 * @param fn The function being registered
 */
export const renderInQueue = (fn: (next?: (val?: any) => void) => void) => {
    const { queueMultiRenders = false } = config;
    if (queueMultiRenders) {
        renderQueue = renderQueue.then(() => new Promise((res) => fn(res)));
    } else {
        // Sending an empty function to keep it consistent with the above usage.
        fn(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
    }
};

// For testing purposes only
export function reset(): void {
    config = {} as any;
    authEE = null;
    authPromise = null;
}
