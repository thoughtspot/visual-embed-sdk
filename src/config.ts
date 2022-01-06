import { ERROR_MESSAGE } from './errors';
import { EmbedConfig } from './types';

/**
 * Copyright (c) 2022
 *
 * Utilities related to reading configuration objects
 *
 * @summary Config-related utils
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

const urlRegex = new RegExp(
    [
        '(^(https?:)//)?', // protocol
        '(([^:/?#]*)(?::([0-9]+))?)', // host (hostname and port)
        '(/{0,1}[^?#]*)', // pathname
        '(\\?[^#]*|)', // search
        '(#.*|)$', // hash
    ].join(''),
);

/**
 * Parse and construct the ThoughtSpot hostname or IP address
 * from the embed configuration object.
 * @param config
 */
export const getThoughtSpotHost = (config: EmbedConfig): string => {
    const urlParts = config.thoughtSpotHost.match(urlRegex);
    if (!urlParts) {
        throw new Error(ERROR_MESSAGE.INVALID_THOUGHTSPOT_HOST);
    }

    const protocol = urlParts[2] || window.location.protocol;
    const host = urlParts[3];
    let path = urlParts[6];
    // Lose the trailing / if any
    if (path.charAt(path.length - 1) === '/') {
        path = path.substring(0, path.length - 1);
    }
    // const urlParams = urlParts[7];
    // const hash = urlParts[8];

    return `${protocol}//${host}${path}`;
};

export const getV2BasePath = (config: EmbedConfig): string => {
    if (config.basepath) {
        return config.basepath;
    }

    const tsHost = getThoughtSpotHost(config);

    // This is to handle when e2e's. Search is run on pods for comp-blink-test-pipeline
    // with baseUrl=https://localhost:8443.
    // This is to handle when the developer is developing in their local environment.
    if (tsHost.includes('://localhost') && !tsHost.includes(':8443')) {
        return '';
    }

    return 'v2';
};

/**
 * It is a good idea to keep URLs under 2000 chars.
 * If this is ever breached, since we pass view configuration through
 * URL params, we would like to log a warning.
 * Reference: https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
 */
export const URL_MAX_LENGTH = 2000;

/**
 * The default CSS dimensions of the embedded app
 */
export const DEFAULT_EMBED_WIDTH = '100%';
export const DEFAULT_EMBED_HEIGHT = '100%';
