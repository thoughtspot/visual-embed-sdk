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
import _ from 'lodash';
import { getThoughtSpotHost } from '../config';
import { AuthType, EmbedConfig, PrefetchFeatures } from '../types';
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

export function notifyAuthSDKSuccess(): void {
    if (!authEE) {
        console.error('SDK not initialized');
        return;
    }
    authEE.emit(AuthStatus.SDK_SUCCESS);
}

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
            } else {
                notifyAuthSDKSuccess();
            }
        },
        () => {
            notifyAuthFailure(AuthFailureType.SDK);
        },
    );
    return authPromise;
};

const hostUrlToFeatureUrl = {
    [PrefetchFeatures.SearchEmbed]: (url: string) => `${url}v2/#/embed/answer`,
    [PrefetchFeatures.LiveboardEmbed]: (url: string) => url,
    [PrefetchFeatures.FullApp]: (url: string) => url,
    [PrefetchFeatures.VizEmbed]: (url: string) => url,
};

/**
 * Prefetches static resources from the specified URL. Web browsers can then cache the prefetched resources and serve them from the user's local disk to provide faster access to your app.
 * @param url The URL provided for prefetch
 * @param prefetchFeatures Specify features which needs to be prefetched.
 * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 7.2.1
 */
export const prefetch = (
    url?: string,
    prefetchFeatures?: PrefetchFeatures[],
): void => {
    if (url === '') {
        // eslint-disable-next-line no-console
        console.warn('The prefetch method does not have a valid URL');
    } else {
        const features = prefetchFeatures || [PrefetchFeatures.FullApp];
        let hostUrl = url || config.thoughtSpotHost;
        hostUrl = hostUrl[hostUrl.length - 1] === '/' ? hostUrl : `${hostUrl}/`;
        _.uniq(
            features.map((feature) => hostUrlToFeatureUrl[feature](hostUrl)),
        ).forEach((prefetchUrl, index) => {
            const iFrame = document.createElement('iframe');
            iFrame.src = prefetchUrl;
            iFrame.style.width = '0';
            iFrame.style.height = '0';
            iFrame.style.border = '0';
            iFrame.classList.add('prefetchIframe');
            iFrame.classList.add(`prefetchIframeNum-${index}`);
            document.body.appendChild(iFrame);
        });
    }
};

/**
 * Initializes the Visual Embed SDK globally and perform
 * authentication if applicable.
 * @param embedConfig The configuration object containing ThoughtSpot host,
 * authentication mechanism and so on.
 * example: authStatus = init(config);
 * authStatus.on(AuthStatus.FAILURE, (reason) => { // do something here });
 * @returns event emitter which emits events on authentication success, failure and logout. See {@link AuthStatus}
 * @version SDK: 1.0.0 | ThoughtSpot ts7.april.cl, 7.2.1
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
        usedCustomizationSheet:
            embedConfig.customisations?.style?.customCSSUrl != null,
        usedCustomizationVariables:
            embedConfig.customisations?.style?.customCss?.variables != null,
        usedCustomizationRules:
            embedConfig.customisations?.style?.customCss?.rules_UNSTABLE !=
            null,
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
 * Logs out from ThoughtSpot. This also sets the autoLogin flag to false, to prevent
 * the SDK from automatically logging in again.
 *
 * You can call the `init` method again to re login, if autoLogin is set to true in this
 * second call it will be honored.
 *
 * @param doNotDisableAutoLogin This flag when passed will not disable autoLogin
 * @returns Promise which resolves when logout completes.
 * @version SDK: 1.10.1 | ThoughtSpot: 8.2.0.cl, 8.4.1-sw
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
