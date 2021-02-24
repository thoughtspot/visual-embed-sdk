import 'url-search-params-polyfill';
import { NAV_PREFIX, TS_HOST_PARAM, TS_ORIGIN_PARAM, TS_PAGE_ID_PARAM } from '../configs/doc-configs';

/**
 * Parse query string into json object. (Polyfill by 'url-search-params-polyfill' npm package)
 * @param {string} queryParamStr - query string from location.search
 * @returns {object} which contains query params 'key: value' pairs
 */
export const queryStringParser = (queryParamStr: string) => {
    const queryParamObj = {};

    const entries = new URLSearchParams(queryParamStr).entries();
    let navPrefix = '?';
    for (const [key, value] of entries) {
        queryParamObj[key] = value;
        if (key === TS_HOST_PARAM) {
            navPrefix += `${TS_HOST_PARAM}=${value}&`;
        }
        if (key === TS_ORIGIN_PARAM) {
            navPrefix += `${TS_ORIGIN_PARAM}=${encodeURIComponent(value)}&`;
        }
    }
    navPrefix += TS_PAGE_ID_PARAM;
    queryParamObj[NAV_PREFIX] = navPrefix;

    return queryParamObj;
};

export default queryStringParser;
