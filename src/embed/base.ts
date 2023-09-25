/* eslint-disable camelcase */
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
import uniq from 'lodash/uniq';
import { getThoughtSpotHost } from '../config';
import { AuthType, EmbedConfig, PrefetchFeatures } from '../types';
import {
    authenticate,
    logout as _logout,
    AuthFailureType,
    AuthStatus,
    AuthEvent,
    notifyAuthFailure,
    notifyAuthSDKSuccess,
    notifyAuthSuccess,
    notifyLogout,
    setAuthEE,
    AuthEventEmitter,
    EndPoints,
    getAuthenticaionToken,
} from '../auth';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';

let config = {} as EmbedConfig;
const CONFIG_DEFAULTS: Partial<EmbedConfig> = {
    loginFailedMessage: 'Not logged in',
    authTriggerText: 'Authorize',
    authType: AuthType.None,
};

export interface executeTMLInput {
    metadata_tmls: string[];
    import_policy?: 'PARTIAL' | 'ALL_OR_NONE' | 'VALIDATE_ONLY';
    create_new?: boolean;
}

export interface exportTMLInput {
    metadata: {
        identifier: string;
        type?: 'LIVEBOARD' | 'ANSWER' | 'LOGICAL_TABLE' | 'CONNECTION';
    }[];
    export_associated?: boolean;
    export_fqn?: boolean;
    edoc_format?: 'YAML' | 'JSON';
}

export let authPromise: Promise<boolean>;
/**
 * Gets the configuration embed was initialized with.
 *
 * @returns {@link EmbedConfig} The configuration embed was initialized with.
 * @version SDK: 1.19.0 | ThoughtSpot: *
 * @group Global methods
 */
export const getEmbedConfig = (): EmbedConfig => config;

export const getAuthPromise = (): Promise<boolean> => authPromise;

export {
    notifyAuthFailure, notifyAuthSDKSuccess, notifyAuthSuccess, notifyLogout,
};

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
 * Prefetches static resources from the specified URL. Web browsers can then cache the
 * prefetched resources and serve them from the user's local disk to provide faster access
 * to your app.
 *
 * @param url The URL provided for prefetch
 * @param prefetchFeatures Specify features which needs to be prefetched.
 * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 7.2.1
 * @group Global methods
 */
export const prefetch = (url?: string, prefetchFeatures?: PrefetchFeatures[]): void => {
    if (url === '') {
        // eslint-disable-next-line no-console
        console.warn('The prefetch method does not have a valid URL');
    } else {
        const features = prefetchFeatures || [PrefetchFeatures.FullApp];
        let hostUrl = url || config.thoughtSpotHost;
        hostUrl = hostUrl[hostUrl.length - 1] === '/' ? hostUrl : `${hostUrl}/`;
        uniq(features.map((feature) => hostUrlToFeatureUrl[feature](hostUrl))).forEach(
            (prefetchUrl, index) => {
                const iFrame = document.createElement('iframe');
                iFrame.src = prefetchUrl;
                iFrame.style.width = '0';
                iFrame.style.height = '0';
                iFrame.style.border = '0';
                iFrame.classList.add('prefetchIframe');
                iFrame.classList.add(`prefetchIframeNum-${index}`);
                document.body.appendChild(iFrame);
            },
        );
    }
};

/**
 *
 * @param embedConfig
 */
function sanity(embedConfig: EmbedConfig) {
    if (embedConfig.thoughtSpotHost === undefined) {
        throw new Error('ThoughtSpot host not provided');
    }
    if (embedConfig.authType === AuthType.TrustedAuthToken) {
        if (!embedConfig.username) {
            throw new Error('Username not provided with Trusted auth');
        }

        if (!embedConfig.authEndpoint && typeof embedConfig.getAuthToken !== 'function') {
            throw new Error('Trusted auth should provide either authEndpoint or getAuthToken');
        }
    }
}

/**
 *
 * @param embedConfig
 */
function backwardCompat(embedConfig: EmbedConfig): EmbedConfig {
    const newConfig = { ...embedConfig };
    if (embedConfig.noRedirect !== undefined && embedConfig.inPopup === undefined) {
        newConfig.inPopup = embedConfig.noRedirect;
    }
    return newConfig;
}

/**
 * Initializes the Visual Embed SDK globally and perform
 * authentication if applicable. This function needs to be called before any ThoughtSpot
 * component like liveboard etc can be embedded. But need not wait for AuthEvent.SUCCESS
 * to actually embed. That is handled internally.
 *
 * @param embedConfig The configuration object containing ThoughtSpot host,
 * authentication mechanism and so on.
 * @example
 * ```js
 *   const authStatus = init({
 *     thoughtSpotHost: 'https://my.thoughtspot.cloud',
 *     authType: AuthType.None,
 *   });
 *   authStatus.on(AuthStatus.FAILURE, (reason) => { // do something here });
 * ```
 * @returns {@link AuthEventEmitter} event emitter which emits events on authentication success,
 *      failure and logout. See {@link AuthStatus}
 * @version SDK: 1.0.0 | ThoughtSpot ts7.april.cl, 7.2.1
 * @group Authentication / Init
 */
export const init = (embedConfig: EmbedConfig): AuthEventEmitter => {
    sanity(embedConfig);
    config = {
        ...CONFIG_DEFAULTS,
        ...embedConfig,
        thoughtSpotHost: getThoughtSpotHost(embedConfig),
    };
    config = backwardCompat(config);
    const authEE = new EventEmitter<AuthStatus | AuthEvent>();
    setAuthEE(authEE);
    handleAuth();

    const { password, ...configToTrack } = config;
    uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_CALLED_INIT, {
        ...configToTrack,
        usedCustomizationSheet: embedConfig.customizations?.style?.customCSSUrl != null,
        usedCustomizationVariables: embedConfig.customizations?.style?.customCSS?.variables != null,
        usedCustomizationRules:
            embedConfig.customizations?.style?.customCSS?.rules_UNSTABLE != null,
        usedCustomizationStrings: !!embedConfig.customizations?.content?.strings,
        usedCustomizationIconSprite: !!embedConfig.customizations?.iconSpriteUrl,
    });

    if (config.callPrefetch) {
        prefetch(config.thoughtSpotHost);
    }
    return authEE as AuthEventEmitter;
};

/**
 *
 */
export function disableAutoLogin(): void {
    config.autoLogin = false;
}

/**
 * Logs out from ThoughtSpot. This also sets the autoLogin flag to false, to
 * prevent the SDK from automatically logging in again.
 *
 * You can call the `init` method again to re login, if autoLogin is set to
 * true in this second call it will be honored.
 *
 * @param doNotDisableAutoLogin This flag when passed will not disable autoLogin
 * @returns Promise which resolves when logout completes.
 * @version SDK: 1.10.1 | ThoughtSpot: 8.2.0.cl, 8.4.1-sw
 * @group Global methods
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
 * Renders functions in a queue, resolves to next function only after the callback next
 * is called
 *
 * @param fn The function being registered
 */
export const renderInQueue = (fn: (next?: (val?: any) => void) => Promise<any>): Promise<any> => {
    const { queueMultiRenders = false } = config;
    if (queueMultiRenders) {
        renderQueue = renderQueue.then(() => new Promise((res) => fn(res)));
        return renderQueue;
    }
    // Sending an empty function to keep it consistent with the above usage.
    return fn(() => { }); // eslint-disable-line @typescript-eslint/no-empty-function
};

/**
 * Imports TML representation of the metadata objects into ThoughtSpot.
 *
 * @param data
 * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
 * @group Global methods
 */
export const executeTML = async (data: executeTMLInput): Promise<any> => {
    const { thoughtSpotHost, authType } = config;
    try {
        sanity(config);
    } catch (err) {
        return Promise.reject(err);
    }
    let authToken = '';
    if (authType === AuthType.TrustedAuthTokenCookieless) {
        authToken = await getAuthenticaionToken(config);
    }

    const headers: Record<string, string | undefined> = {
        'Content-Type': 'application/json',
        'x-requested-by': 'ThoughtSpot',
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    const payload = {
        metadata_tmls: data.metadata_tmls,
        import_policy: data.import_policy || 'PARTIAL',
        create_new: data.create_new || false,
    };
    return fetch(`${thoughtSpotHost}${EndPoints.EXECUTE_TML}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to import TML data: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .catch((error) => {
            throw error;
        });
};

/**
 * Exports TML representation of the metadata objects from ThoughtSpot in JSON or YAML
 * format.
 *
 * @param data
 * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
 * @group Global methods
 */
export const exportTML = async (data: exportTMLInput): Promise<any> => {
    const { thoughtSpotHost, authType } = config;
    try {
        sanity(config);
    } catch (err) {
        return Promise.reject(err);
    }
    const payload = {
        metadata: data.metadata,
        export_associated: data.export_associated || false,
        export_fqn: data.export_fqn || false,
        edoc_format: data.edoc_format || 'YAML',
    };

    let authToken = '';
    if (authType === AuthType.TrustedAuthTokenCookieless) {
        authToken = await getAuthenticaionToken(config);
    }

    const headers: Record<string, string | undefined> = {
        'Content-Type': 'application/json',
        'x-requested-by': 'ThoughtSpot',
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    return fetch(`${thoughtSpotHost}${EndPoints.EXPORT_TML}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to export TML: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .catch((error) => {
            throw error;
        });
};

// For testing purposes only
/**
 *
 */
export function reset(): void {
    config = {} as any;
    setAuthEE(null);
    authPromise = null;
}
