import { EmbedConfig } from './types';
/**
 * Parse and construct the ThoughtSpot hostname or IP address
 * from the embed configuration object.
 * @param config
 */
export declare const getThoughtSpotHost: (config: EmbedConfig) => string;
export declare const getV2BasePath: (config: EmbedConfig) => string;
/**
 * It is a good idea to keep URLs under 2000 chars.
 * If this is ever breached, since we pass view configuration through
 * URL params, we would like to log a warning.
 * Reference: https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
 */
export declare const URL_MAX_LENGTH = 2000;
/**
 * The default CSS dimensions of the embedded app
 */
export declare const DEFAULT_EMBED_WIDTH = "100%";
export declare const DEFAULT_EMBED_HEIGHT = "100%";
//# sourceMappingURL=config.d.ts.map