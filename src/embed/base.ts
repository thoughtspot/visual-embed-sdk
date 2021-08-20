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

let authPromise: Promise<void>;

/**
 * Perform authentication on the ThoughtSpot app as applicable.
 */
export const handleAuth = () => {
    const authConfig = {
        ...config,
        thoughtSpotHost: getThoughtSpotHost(config),
    };
    authPromise = authenticate(authConfig);
};

export const getEmbedConfig = (): EmbedConfig => config;

export const getAuthPromise = () => authPromise;

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
};
