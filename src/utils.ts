/**
 * Copyright (c) 2023
 *
 * Common utility functions for ThoughtSpot Visual Embed SDK
 * @summary Utils
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import merge from 'ts-deepmerge';
import {
    EmbedConfig,
    QueryParams,
    RuntimeFilter,
    CustomisationsInterface,
    DOMSelector,
    ViewConfig,
    RuntimeParameter,
} from './types';

/**
 * Construct a runtime filters query string from the given filters.
 * Refer to the following docs for more details on runtime filter syntax:
 * https://cloud-docs.thoughtspot.com/admin/ts-cloud/apply-runtime-filter.html
 * https://cloud-docs.thoughtspot.com/admin/ts-cloud/runtime-filter-operators.html
 * @param runtimeFilters
 */
export const getFilterQuery = (runtimeFilters: RuntimeFilter[]): string | null => {
    if (runtimeFilters && runtimeFilters.length) {
        const filters = runtimeFilters.map((filter, valueIndex) => {
            const index = valueIndex + 1;
            const filterExpr = [];
            filterExpr.push(`col${index}=${encodeURIComponent(filter.columnName)}`);
            filterExpr.push(`op${index}=${filter.operator}`);
            filterExpr.push(
                filter.values.map((value) => {
                    const encodedValue = typeof value === 'bigint' ? value.toString() : value;
                    return `val${index}=${encodeURIComponent(String(encodedValue))}`;
                }).join('&'),
            );

            return filterExpr.join('&');
        });

        return `${filters.join('&')}`;
    }

    return null;
};

/**
 * Construct a runtime parameter override query string from the given option.
 * @param runtimeParameters
 */
export const getRuntimeParameters = (runtimeParameters: RuntimeParameter[]): string => {
    if (runtimeParameters && runtimeParameters.length) {
        const params = runtimeParameters.map((param, valueIndex) => {
            const index = valueIndex + 1;
            const filterExpr = [];
            filterExpr.push(`param${index}=${encodeURIComponent(param.name)}`);
            filterExpr.push(`paramVal${index}=${encodeURIComponent(param.value)}`);

            return filterExpr.join('&');
        });

        return `${params.join('&')}`;
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
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
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
const paramToString = (value: any) => (Array.isArray(value) ? value.join(',') : value);

/**
 * Return a query param string composed from the given params object
 * @param queryParams
 * @param shouldSerializeParamValues
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

export const getSSOMarker = (markerId: string) => {
    const encStringToAppend = encodeURIComponent(markerId);
    return `tsSSOMarker=${encStringToAppend}`;
};

/**
 * Append a string to a URL's hash fragment
 * @param url A URL
 * @param stringToAppend The string to append to the URL hash
 */
export const appendToUrlHash = (url: string, stringToAppend: string) => {
    let outputUrl = url;
    const encStringToAppend = encodeURIComponent(stringToAppend);

    const marker = `tsSSOMarker=${encStringToAppend}`;

    let splitAdder = '';

    if (url.indexOf('#') >= 0) {
        // If second half of hash contains a '?' already add a '&' instead of
        // '?' which appends to query params.
        splitAdder = url.split('#')[1].indexOf('?') >= 0 ? '&' : '?';
    } else {
        splitAdder = '#?';
    }
    outputUrl = `${outputUrl}${splitAdder}${marker}`;

    return outputUrl;
};

/**
 *
 * @param url
 * @param stringToAppend
 * @param path
 */
export function getRedirectUrl(url: string, stringToAppend: string, path = '') {
    const targetUrl = path ? new URL(path, window.location.origin).href : url;
    return appendToUrlHash(targetUrl, stringToAppend);
}

export const getEncodedQueryParamsString = (queryString: string) => {
    if (!queryString) {
        return queryString;
    }
    return btoa(queryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

const isCloudRelease = (version: string) => version.endsWith('.cl');

/* For Search Embed: ReleaseVersionInBeta */
export const checkReleaseVersionInBeta = (
    releaseVersion: string,
    suppressBetaWarning: boolean,
): boolean => {
    if (releaseVersion !== '' && !isCloudRelease(releaseVersion)) {
        const splittedReleaseVersion = releaseVersion.split('.');
        const majorVersion = Number(splittedReleaseVersion[0]);
        const isBetaVersion = majorVersion < 8;
        return !suppressBetaWarning && isBetaVersion;
    }
    return false;
};

export const getCustomisations = (
    embedConfig: EmbedConfig,
    viewConfig: ViewConfig,
): CustomisationsInterface => {
    const customizationsFromViewConfig = viewConfig.customizations;
    const customizationsFromEmbedConfig = embedConfig.customizations
        || ((embedConfig as any).customisations as CustomisationsInterface);

    const customizations: CustomisationsInterface = {
        style: {
            ...customizationsFromEmbedConfig?.style,
            ...customizationsFromViewConfig?.style,
            customCSS: {
                ...customizationsFromEmbedConfig?.style?.customCSS,
                ...customizationsFromViewConfig?.style?.customCSS,
            },
            customCSSUrl:
                customizationsFromViewConfig?.style?.customCSSUrl
                || customizationsFromEmbedConfig?.style?.customCSSUrl,
        },
        content: {
            ...customizationsFromEmbedConfig?.content,
            ...customizationsFromViewConfig?.content,
        },
    };
    return customizations;
};

export const getRuntimeFilters = (runtimefilters: any) => getFilterQuery(runtimefilters || []);

/**
 * Gets a reference to the DOM node given
 * a selector.
 * @param domSelector
 */
export function getDOMNode(domSelector: DOMSelector): HTMLElement {
    return typeof domSelector === 'string' ? document.querySelector(domSelector) : domSelector;
}

export const deepMerge = (target: any, source: any) => merge(target, source);

export const getOperationNameFromQuery = (query: string) => {
    const regex = /(?:query|mutation)\s+(\w+)/;
    const matches = query.match(regex);
    return matches?.[1];
};

/**
 *
 * @param obj
 */
export function removeTypename(obj: any) {
    if (!obj || typeof obj !== 'object') return obj;

    // eslint-disable-next-line no-restricted-syntax
    for (const key in obj) {
        if (key === '__typename') {
            delete obj[key];
        } else if (typeof obj[key] === 'object') {
            removeTypename(obj[key]);
        }
    }
    return obj;
}

/**
 * Sets the specified style properties on an HTML element.
 * @param {HTMLElement} element - The HTML element to which the styles should be applied.
 * @param {Partial<CSSStyleDeclaration>} styleProperties - An object containing style
 * property names and their values.
 * @example
 * // Apply styles to an element
 * const element = document.getElementById('myElement');
 * const styles = {
 *   backgroundColor: 'red',
 *   fontSize: '16px',
 * };
 * setStyleProperties(element, styles);
 */
export const setStyleProperties = (
    element: HTMLElement,
    styleProperties: Partial<CSSStyleDeclaration>,
): void => {
    if (!element?.style) return;
    Object.keys(styleProperties).forEach((styleProperty) => {
        element.style[styleProperty] = styleProperties[styleProperty].toString();
    });
};
/**
 * Removes specified style properties from an HTML element.
 * @param {HTMLElement} element - The HTML element from which the styles should be removed.
 * @param {string[]} styleProperties - An array of style property names to be removed.
 * @example
 * // Remove styles from an element
 * const element = document.getElementById('myElement');
 * element.style.backgroundColor = 'red';
 * const propertiesToRemove = ['backgroundColor'];
 * removeStyleProperties(element, propertiesToRemove);
 */
export const removeStyleProperties = (element: HTMLElement, styleProperties: string[]): void => {
    if (!element?.style) return;
    styleProperties.forEach((styleProperty) => {
        element.style.removeProperty(styleProperty);
    });
};

export const isUndefined = (value: any): boolean => value === undefined;

// Return if the value is a string, double or boolean.
export const getTypeFromValue = (value: any): [string, string] => {
    if (typeof value === 'string') {
        return ['char', 'string'];
    }
    if (typeof value === 'number') {
        return ['double', 'double'];
    }
    if (typeof value === 'boolean') {
        return ['boolean', 'boolean'];
    }
    return ['', ''];
};

const sdkWindowKey = '_tsEmbedSDK' as any;

/**
 * Stores a value in the global `window` object under the `_tsEmbedSDK` namespace.
 * @param key - The key under which the value will be stored.
 * @param value - The value to store.
 */
export const storeValueInWindow = (key: string, value: any) => {
    if (!window[sdkWindowKey]) {
        (window as any)[sdkWindowKey] = {};
    }
    window[sdkWindowKey][key as any] = value;
};

/**
 * Retrieves a stored value from the global `window` object under the `_tsEmbedSDK` namespace.
 * @param key - The key whose value needs to be retrieved.
 * @returns The stored value or `undefined` if the key is not found.
 */
export const getValueFromWindow = (key: string): any => window?.[sdkWindowKey]?.[key as any];
