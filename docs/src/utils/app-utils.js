import 'url-search-params-polyfill';

/**
 * Parse query string into json object. (Polyfill by 'url-search-params-polyfill' npm package)
 * @param {string} queryParamStr - query string from location.search
 * @returns {object} which contains query params 'key: value' pairs
 */
export const queryStringParser = (queryParamStr) => {
    const queryParamObj = {};
    if (!queryParamStr) return queryParamObj;

    const entries = new URLSearchParams(queryParamStr).entries();
    for (const [key, value] of entries) {
        queryParamObj[key] = value;
    }
    return queryParamObj;
};

export default queryStringParser;
