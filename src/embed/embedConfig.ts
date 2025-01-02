import { WebViewConfig } from 'src/native/types';
import { EmbedConfig } from '../types';

let config = {} as EmbedConfig;
let nativeConfig = {} as WebViewConfig;

/**
 * Gets the configuration embed was initialized with.
 * @returns {@link EmbedConfig} The configuration embed was initialized with.
 * @version SDK: 1.19.0 | ThoughtSpot: *
 * @group Global methods
 */
export const getEmbedConfig = (): EmbedConfig => config;
export const getMobileEmbedConfig = (): WebViewConfig => nativeConfig;

/**
 * Sets the configuration embed was initialized with.
 * And returns the new configuration.
 * @param newConfig The configuration to set.
 * @version SDK: 1.27.0 | ThoughtSpot: *
 * @group Global methods
 */
export const setEmbedConfig = (newConfig: EmbedConfig) => {
    config = newConfig;
    return newConfig;
};

/**
 * Sets the configuration embed was initialized with.
 * And returns the new configuration.
 * @param newConfig The configuration to set.
 * @version SDK: 1.35.3 | ThoughtSpot: 10.6.0.cl
 * @group Global methods
 */
export const setMobileEmbedConfig = (newConfig: WebViewConfig) => {
    nativeConfig = newConfig;
    return newConfig;
};