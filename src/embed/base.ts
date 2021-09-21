/* eslint-disable import/no-mutable-exports */
/**
 * Copyright (c) 2021
 *
 * Base classes
 *
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import { getThoughtSpotHost } from '../config';
import { EmbedConfig } from '../types';
import { authenticate } from '../auth';
import { uploadMixpanelEvent, MIXPANEL_EVENT } from '../mixpanel-service';

let config = {} as EmbedConfig;

export let authPromise: Promise<void>;

/**
 * Perform authentication on the ThoughtSpot app as applicable.
 */
export const handleAuth = (): void => {
    const authConfig = {
        ...config,
        thoughtSpotHost: getThoughtSpotHost(config),
    };
    authPromise = authenticate(authConfig);
};

export const getEmbedConfig = (): EmbedConfig => config;

export const getAuthPromise = (): Promise<void> => authPromise;

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
 * Initialize the ThoughtSpot embed settings globally and perform
 * authentication if applicable.
 * @param embedConfig The configuration object containing ThoughtSpot host,
 * authentication mechanism and so on.
 */
export const init = (embedConfig: EmbedConfig): void => {
    config = embedConfig;
    handleAuth();

    uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_CALLED_INIT, {
        authType: config.authType,
        host: config.thoughtSpotHost,
    });

    if (config.callPrefetch) {
        prefetch(config.thoughtSpotHost);
    }
};
