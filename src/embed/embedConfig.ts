import { EmbedConfig } from '../types';

let config = {} as EmbedConfig;

/**
 * Gets the configuration embed was initialized with.
 *
 * @returns {@link EmbedConfig} The configuration embed was initialized with.
 * @version SDK: 1.19.0 | ThoughtSpot: *
 * @group Global methods
 */
export const getEmbedConfig = (): EmbedConfig => config;

/**
 * Sets the configuration embed was initialized with.
 * And returns the new configuration.
 *
 * @param newConfig The configuration to set.
 * @version SDK: 1.27.0 | ThoughtSpot: *
 * @group Global methods
 */
export const setEmbedConfig = (newConfig: EmbedConfig) => {
    config = newConfig;
    return newConfig;
};
