import 'url-search-params-polyfill';

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
