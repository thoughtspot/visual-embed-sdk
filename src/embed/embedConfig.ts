import { getValueFromWindow, storeValueInWindow } from '../utils';
import { EmbedConfig } from '../types';

const configKey = 'embedConfig';

/**
 * Gets the configuration embed was initialized with.
 * @returns {@link EmbedConfig} The configuration embed was initialized with.
 * @version SDK: 1.19.0 | ThoughtSpot: *
 * @group Global methods
 */
export const getEmbedConfig = (): EmbedConfig => getValueFromWindow(configKey) || {};

/**
 * Sets the configuration embed was initialized with.
 * And returns the new configuration.
 * @param newConfig The configuration to set.
 * @version SDK: 1.27.0 | ThoughtSpot: *
 * @group Global methods
 */
export const setEmbedConfig = (newConfig: EmbedConfig) => {
    storeValueInWindow(configKey, newConfig);
    return getValueFromWindow(configKey);
};
