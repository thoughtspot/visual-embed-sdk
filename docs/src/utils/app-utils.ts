import 'url-search-params-polyfill';
import {
    NAV_PREFIX,
    PREVIEW_PREFIX,
    TS_HOST_PARAM,
    TS_ORIGIN_PARAM,
    TS_APP_ROOT_PARAM,
    TS_PAGE_ID_PARAM,
    DEFAULT_HOST,
    DEFAULT_PREVIEW_HOST,
    DEFAULT_APP_ROOT,
} from '../configs/doc-configs';

/**
 * Parse query string into json object. (Polyfill by 'url-search-params-polyfill' npm package)
 * @param {string} queryParamStr - query string from location.search
 * @returns {object} which contains query params 'key: value' pairs
 */
export const queryStringParser = (queryParamStr: string) => {
    const queryParamObj: { [key: string]: string } = {};

    const entries = new URLSearchParams(queryParamStr).entries();
    let navPrefix = '?';
    let tsHostUrl = DEFAULT_PREVIEW_HOST;

    for (const [key, value] of entries) {
        queryParamObj[key] = value;
        if (key === TS_HOST_PARAM) {
            navPrefix += `${TS_HOST_PARAM}=${value}&`;
        }
        if (key === TS_ORIGIN_PARAM) {
            if (value) {
                navPrefix += `${TS_ORIGIN_PARAM}=${encodeURIComponent(value)}&`;
                tsHostUrl = removeTrailingSlash(value.split('#')[0]);
            }
        }
        if (key === TS_APP_ROOT_PARAM) {
            navPrefix += `${TS_APP_ROOT_PARAM}=${value}&`;
        }
    }

    // check required params and add default if value is not available
    queryParamObj[TS_HOST_PARAM] = removeTrailingSlash(
        queryParamObj[TS_HOST_PARAM] || DEFAULT_HOST,
    );
    queryParamObj[TS_APP_ROOT_PARAM] = removeTrailingSlash(
        queryParamObj[TS_APP_ROOT_PARAM] || DEFAULT_APP_ROOT,
    );

    // prepare and set 'Main Navigation' links URL prefix
    navPrefix += TS_PAGE_ID_PARAM;
    queryParamObj[NAV_PREFIX] = navPrefix;

    // prepare and set 'Preview in Playground' button URL prefix
    queryParamObj[
        PREVIEW_PREFIX
    ] = `${tsHostUrl}/#${queryParamObj[TS_APP_ROOT_PARAM]}`;

    return queryParamObj;
};

export const removeTrailingSlash = (url: string) => {
    return url.replace(/\/$/, '');
};

export default queryStringParser;
