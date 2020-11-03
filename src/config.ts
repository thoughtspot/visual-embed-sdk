import { EmbedConfig } from './types';

/**
 * Copyright (c) 2020
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

// TODO: add a unit test for this
export const getThoughtSpotHost = (config: EmbedConfig): string => {
    const urlParts = config.thoughtSpotHost.match(urlRegex);
    if (!urlParts) {
        throw new Error(
            `Error parsing ThoughtSpot host: ${config.thoughtSpotHost}. Please provide a valid URL`,
        );
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
