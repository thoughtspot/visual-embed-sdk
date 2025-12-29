/* eslint-disable camelcase */
/* eslint-disable import/no-mutable-exports */
/**
 * Copyright (c) 2022
 *
 * Base classes
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import EventEmitter from 'eventemitter3';
import { registerReportingObserver } from '../utils/reporting';
import { logger, setGlobalLogLevelOverride } from '../utils/logger';
import { tokenizedFetch } from '../tokenizedFetch';
import { EndPoints } from '../utils/authService/authService';
import { getThoughtSpotHost } from '../config';
import {
    AuthType, EmbedConfig, LogLevel, Param, PrefetchFeatures,
} from '../types';
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
    postLoginService,
} from '../auth';
import '../utils/with-resolvers-polyfill';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';
import { getEmbedConfig, setEmbedConfig } from './embedConfig';
import { getQueryParamString, getValueFromWindow, isWindowUndefined, storeValueInWindow } from '../utils';
import { resetAllCachedServices } from '../utils/resetServices';
import { reload } from '../utils/processTrigger';
import { ERROR_MESSAGE } from '../errors';

const CONFIG_DEFAULTS: Partial<EmbedConfig> = {
    loginFailedMessage: 'Not logged in',
    authTriggerText: 'Authorize',
    authType: AuthType.None,
    logLevel: LogLevel.ERROR,
    waitForCleanupOnDestroy: false,
    cleanupTimeout: 5000,
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

export const getAuthPromise = (): Promise<boolean> => authPromise;

export {
    notifyAuthFailure, notifyAuthSDKSuccess, notifyAuthSuccess, notifyLogout,
};

/**
 * Perform authentication on the ThoughtSpot app as applicable.
 */
export const handleAuth = (): Promise<boolean> => {
    authPromise = authenticate(getEmbedConfig());
    authPromise.then(
        (isLoggedIn) => {
            if (!isLoggedIn) {
                notifyAuthFailure(AuthFailureType.SDK);
            } else {
                // Post login service is called after successful login.
                postLoginService();
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
    [PrefetchFeatures.SearchEmbed]: (url: string, flags: string) => `${url}v2/?${flags}#/embed/answer`,
    [PrefetchFeatures.LiveboardEmbed]: (url: string, flags: string) => `${url}?${flags}`,
    [PrefetchFeatures.FullApp]: (url: string, flags: string) => `${url}?${flags}`,
    [PrefetchFeatures.VizEmbed]: (url: string, flags: string) => `${url}?${flags}`,
};

/**
 * Prefetches static resources from the specified URL. Web browsers can then cache the
 * prefetched resources and serve them from the user's local disk to provide faster access
 * to your app.
 * @param url The URL provided for prefetch
 * @param prefetchFeatures Specify features which needs to be prefetched.
 * @param additionalFlags This can be used to add any URL flag.
 * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 7.2.1
 * @group Global methods
 */
export const prefetch = (
    url?: string,
    prefetchFeatures?: PrefetchFeatures[],
    additionalFlags?: { [key: string]: string | number | boolean },
): void => {
    if (url === '') {
        // eslint-disable-next-line no-console
        logger.warn('The prefetch method does not have a valid URL');
    } else {
        const features = prefetchFeatures || [PrefetchFeatures.FullApp];
        let hostUrl = url || getEmbedConfig().thoughtSpotHost;
        const prefetchFlags = {
            [Param.EmbedApp]: true,
            ...getEmbedConfig()?.additionalFlags,
            ...additionalFlags,
        };
        hostUrl = hostUrl[hostUrl.length - 1] === '/' ? hostUrl : `${hostUrl}/`;
        Array.from(
            new Set(features
                .map((feature) => hostUrlToFeatureUrl[feature](
                    hostUrl,
                    getQueryParamString(prefetchFlags),
                ))),
        )
            .forEach(
                (prefetchUrl, index) => {
                    const iFrame = document.createElement('iframe');
                    iFrame.src = prefetchUrl;
                    iFrame.style.width = '0';
                    iFrame.style.height = '0';
                    iFrame.style.border = '0';

                    // Make it 'fixed' to keep it in a different stacking context.
                    //   This should solve the focus behaviours inside the iframe from
                    //   interfering with main body.
                    iFrame.style.position = 'fixed';
                    // Push it out of viewport.
                    iFrame.style.top = '100vh';
                    iFrame.style.left = '100vw';

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

type InitFlagStore = {
  initPromise: Promise<ReturnType<typeof init>>;
  isInitCalled: boolean;
  initPromiseResolve: (value: ReturnType<typeof init>) => void;
}
const initFlagKey = 'initFlagKey';

export const createAndSetInitPromise = (): void => {
    if (isWindowUndefined()) return;
    const {
        promise: initPromise,
        resolve: initPromiseResolve,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
    } = Promise.withResolvers<AuthEventEmitter>();
    const initFlagStore: InitFlagStore = {
        initPromise,
        isInitCalled: false,
        initPromiseResolve,
    };
    storeValueInWindow(initFlagKey, initFlagStore, {
        // In case of diff imports the promise might be already set
        ignoreIfAlreadyExists: true,
    });
};

createAndSetInitPromise();

export const getInitPromise = ():
    Promise<
      ReturnType<typeof init>
    > => getValueFromWindow<InitFlagStore>(initFlagKey)?.initPromise;

export const getIsInitCalled = (): boolean => !!getValueFromWindow(initFlagKey)?.isInitCalled;

/**
 * Initializes the Visual Embed SDK globally and perform
 * authentication if applicable. This function needs to be called before any ThoughtSpot
 * component like Liveboard etc can be embedded. But need not wait for AuthEvent.SUCCESS
 * to actually embed. That is handled internally.
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
export const init = (embedConfig: EmbedConfig): AuthEventEmitter | null => {
    if (isWindowUndefined()) return null;
    sanity(embedConfig);
    resetAllCachedServices();
    embedConfig = setEmbedConfig(
        backwardCompat({
            ...CONFIG_DEFAULTS,
            ...embedConfig,
            thoughtSpotHost: getThoughtSpotHost(embedConfig),
        }),
    );

    setGlobalLogLevelOverride(embedConfig.logLevel);
    registerReportingObserver();

    const authEE = new EventEmitter<AuthStatus | AuthEvent>();
    setAuthEE(authEE);
    handleAuth();

    const { password, ...configToTrack } = getEmbedConfig();
    uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_CALLED_INIT, {
        ...configToTrack,
        usedCustomizationSheet: embedConfig.customizations?.style?.customCSSUrl != null,
        usedCustomizationVariables: embedConfig.customizations?.style?.customCSS?.variables != null,
        usedCustomizationRules:
            embedConfig.customizations?.style?.customCSS?.rules_UNSTABLE != null,
        usedCustomizationStrings: !!embedConfig.customizations?.content?.strings,
        usedCustomizationIconSprite: !!embedConfig.customizations?.iconSpriteUrl,
    });

    if (getEmbedConfig().callPrefetch) {
        prefetch(getEmbedConfig().thoughtSpotHost);
    }

    // Resolves the promise created in the initPromiseKey
    getValueFromWindow<InitFlagStore>(initFlagKey).initPromiseResolve(authEE);
    getValueFromWindow<InitFlagStore>(initFlagKey).isInitCalled = true;

    return authEE as AuthEventEmitter;
};

/**
 *
 */
export function disableAutoLogin(): void {
    getEmbedConfig().autoLogin = false;
}

/**
 * Logs out from ThoughtSpot. This also sets the autoLogin flag to false, to
 * prevent the SDK from automatically logging in again.
 *
 * You can call the `init` method again to re login, if autoLogin is set to
 * true in this second call it will be honored.
 * @param doNotDisableAutoLogin This flag when passed will not disable autoLogin
 * @returns Promise which resolves when logout completes.
 * @version SDK: 1.10.1 | ThoughtSpot: 8.2.0.cl, 8.4.1-sw
 * @group Global methods
 */
export const logout = (doNotDisableAutoLogin = false): Promise<boolean> => {
    if (!doNotDisableAutoLogin) {
        disableAutoLogin();
    }
    return _logout(getEmbedConfig()).then((isLoggedIn) => {
        notifyLogout();
        return isLoggedIn;
    });
};

let renderQueue: Promise<any> = Promise.resolve();

/**
 * Renders functions in a queue, resolves to next function only after the callback next
 * is called
 * @param fn The function being registered
 */
export const renderInQueue = (fn: (next?: (val?: any) => void) => Promise<any>): Promise<any> => {
    const { queueMultiRenders = false } = getEmbedConfig();
    if (queueMultiRenders) {
        renderQueue = renderQueue.then(() => new Promise((res) => fn(res)));
        return renderQueue;
    }
    // Sending an empty function to keep it consistent with the above usage.
    return fn(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
};

/**
 * Imports TML representation of the metadata objects into ThoughtSpot.
 * @param data
 * @returns imports TML data into ThoughtSpot
 * @example
 * ```js
 *  executeTML({
 * //Array of metadata Tmls in string format
 *      metadata_tmls: [
 *          "'\''{\"guid\":\"9bd202f5-d431-44bf-9a07-b4f7be372125\",
 *          \"liveboard\":{\"name\":\"Parameters Liveboard\"}}'\''"
 *      ],
 *      import_policy: 'PARTIAL', // Specifies the import policy for the TML import.
 *      create_new: false, // If selected, creates TML objects with new GUIDs.
 *  }).then(result => {
 *      console.log(result);
 *  }).catch(error => {
 *      console.error(error);
 *  });
 *```
 * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
 * @group Global methods
 */
export const executeTML = async (data: executeTMLInput): Promise<any> => {
    try {
        sanity(getEmbedConfig());
    } catch (err) {
        return Promise.reject(err);
    }

    const { thoughtSpotHost, authType } = getEmbedConfig();
    const headers: Record<string, string | undefined> = {
        'Content-Type': 'application/json',
        'x-requested-by': 'ThoughtSpot',
    };

    const payload = {
        metadata_tmls: data.metadata_tmls,
        import_policy: data.import_policy || 'PARTIAL',
        create_new: data.create_new || false,
    };
    return tokenizedFetch(`${thoughtSpotHost}${EndPoints.EXECUTE_TML}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to import TML data: ${response.status} - ${response.statusText}`,
                );
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
 * @param data
 * @returns exports TML data
 * @example
 * ```js
 * exportTML({
 *   metadata: [
 *     {
 *       type: "LIVEBOARD", //Metadata Type
 *       identifier: "9bd202f5-d431-44bf-9a07-b4f7be372125" //Metadata Id
 *     }
 *   ],
 *   export_associated: false,//indicates whether to export associated metadata objects
 *   export_fqn: false, //Adds FQNs of the referenced objects.For example, if you are
 *                      //exporting a Liveboard and its associated objects, the API
 *                      //returns the Liveboard TML data with the FQNs of the referenced
 *                      //worksheet. If the exported TML data includes FQNs, you don't need
 *                      //to manually add FQNs of the referenced objects during TML import.
 *   edoc_format: "JSON" //It takes JSON or YAML value
 * }).then(result => {
 *   console.log(result);
 * }).catch(error => {
 *   console.error(error);
 * });
 * ```
 * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
 * @group Global methods
 */
export const exportTML = async (data: exportTMLInput): Promise<any> => {
    const { thoughtSpotHost, authType } = getEmbedConfig();
    try {
        sanity(getEmbedConfig());
    } catch (err) {
        return Promise.reject(err);
    }
    const payload = {
        metadata: data.metadata,
        export_associated: data.export_associated || false,
        export_fqn: data.export_fqn || false,
        edoc_format: data.edoc_format || 'YAML',
    };

    const headers: Record<string, string | undefined> = {
        'Content-Type': 'application/json',
        'x-requested-by': 'ThoughtSpot',
    };

    return tokenizedFetch(`${thoughtSpotHost}${EndPoints.EXPORT_TML}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to export TML: ${response.status} - ${response.statusText}`,
                );
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
    setEmbedConfig({} as any);
    setAuthEE(null);
    authPromise = null;
}

/**
 * Reloads the ThoughtSpot iframe.
 * @param iFrame
 * @group Global methods
 * @version SDK: 1.43.1
 */
export const reloadIframe = (iFrame: HTMLIFrameElement) => {
    if (!iFrame) {
        logger.warn('reloadIframe called with no iFrame element.');
        return;
    }
    reload(iFrame);
};
