/**
 * Copyright (c) 2022
 *
 * Common utility functions for ThoughtSpot Visual Embed SDK
 *
 * @summary Utils
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { QueryParams, RuntimeFilter } from './types';

/**
 * Construct a runtime filters query string from the given filters.
 * Refer to the following docs for more details on runtime filter syntax:
 * https://cloud-docs.thoughtspot.com/admin/ts-cloud/apply-runtime-filter.html
 * https://cloud-docs.thoughtspot.com/admin/ts-cloud/runtime-filter-operators.html
 * @param runtimeFilters
 */
export const getFilterQuery = (runtimeFilters: RuntimeFilter[]): string => {
    if (runtimeFilters && runtimeFilters.length) {
        const filters = runtimeFilters.map((filter, valueIndex) => {
            const index = valueIndex + 1;
            const filterExpr = [];
            filterExpr.push(`col${index}=${filter.columnName}`);
            filterExpr.push(`op${index}=${filter.operator}`);
            filterExpr.push(
                filter.values.map((value) => `val${index}=${value}`).join('&'),
            );

            return filterExpr.join('&');
        });

        return `${filters.join('&')}`;
    }

    return null;
};

/**
 * Convert a value to a string representation to be sent as a query
 * parameter to the ThoughtSpot app.
 * @param value Any parameter value
 */
const serializeParam = (value: any) => {
    // do not serialize primitive types
    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        return value;
    }

    return JSON.stringify(value);
};

/**
 * Convert a value to a string:
 * in case of an array, we convert it to CSV.
 * in case of any other type, we directly return the value.
 * @param value
 */
const paramToString = (value: any) =>
    Array.isArray(value) ? value.join(',') : value;

/**
 * Return a query param string composed from the given params object
 * @param queryParams
 */
export const getQueryParamString = (
    queryParams: QueryParams,
    shouldSerializeParamValues = false,
): string => {
    const qp: string[] = [];
    const params = Object.keys(queryParams);
    params.forEach((key) => {
        const val = queryParams[key];
        if (val !== undefined) {
            const serializedValue = shouldSerializeParamValues
                ? serializeParam(val)
                : paramToString(val);
            qp.push(`${key}=${serializedValue}`);
        }
    });

    if (qp.length) {
        return qp.join('&');
    }

    return null;
};

/**
 * Get a string representation of a dimension value in CSS
 * If numeric, it is considered in pixels.
 * @param value
 */
export const getCssDimension = (value: number | string): string => {
    if (typeof value === 'number') {
        return `${value}px`;
    }

    return value;
};

/**
 * Append a string to a URL's hash fragment
 * @param url A URL
 * @param stringToAppend The string to append to the URL hash
 */
export const appendToUrlHash = (url: string, stringToAppend: string) => {
    let outputUrl = url;
    const encStringToAppend = encodeURIComponent(stringToAppend);

    if (url.indexOf('#') >= 0) {
        outputUrl = `${outputUrl}${encStringToAppend}`;
    } else {
        outputUrl = `${outputUrl}#${encStringToAppend}`;
    }

    return outputUrl;
};

export function getRedirectUrl(url: string, stringToAppend: string, path = '') {
    const targetUrl = path ? new URL(path, window.location.origin).href : url;
    return appendToUrlHash(targetUrl, stringToAppend);
}

export const getEncodedQueryParamsString = (queryString: string) => {
    if (!queryString) {
        return queryString;
    }
    return btoa(queryString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export const getOffsetTop = (element: any) => {
    const rect = element.getBoundingClientRect();
    return rect.top + window.scrollY;
};

export const embedEventStatus = {
    START: 'start',
    END: 'end',
};

export const setAttributes = (
    element: HTMLElement,
    attributes: { [key: string]: string | number | boolean },
): void => {
    Object.keys(attributes).forEach((key) => {
        element.setAttribute(key, attributes[key].toString());
    });
};

/* For Search Embed: ReleaseVersionInBeta */
export const checkReleaseVersionInBeta = (
    releaseVersion: string,
    suppressBetaWarning: boolean,
): boolean => {
    const splittedReleaseVersion = releaseVersion.split('.'); // splitting releasonversion
    const majorVersion = Number(splittedReleaseVersion[0]);
    const minorVersion = Number(splittedReleaseVersion[1]);
    const isBetaVersion =
        majorVersion < 8 || (majorVersion === 8 && minorVersion < 4);
    return !suppressBetaWarning && isBetaVersion;
};
