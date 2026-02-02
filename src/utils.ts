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
    RuntimeParameter,
    AllEmbedViewConfig,
    BaseViewConfig,
} from './types';
import { logger } from './utils/logger';
import { ERROR_MESSAGE } from './errors';

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

/**
 * Validates if a string is a valid CSS margin value.
 * @param value - The string to validate
 * @returns true if the value is a valid CSS margin value, false otherwise
 */
export const isValidCssMargin = (value: string): boolean => {
    if(isUndefined(value)) {
        return false;
    }
    if (typeof value !== 'string') {
        logger.error('Please provide a valid lazyLoadingMargin value (e.g., "10px")');
        return false;
    }

    // This pattern allows for an optional negative sign, and numbers
    // that can be integers or decimals (including leading dot).
    const cssUnitPattern = /^-?(\d+(\.\d*)?|\.\d+)(px|em|rem|%|vh|vw)$/i;
    const parts = value.trim().split(/\s+/);

    if (parts.length > 4) {
        logger.error('Please provide a valid lazyLoadingMargin value (e.g., "10px")');
        return false;
    }

    const isValid = parts.every(part => {
        const trimmedPart = part.trim();
        return trimmedPart.toLowerCase() === 'auto' || trimmedPart === '0' || cssUnitPattern.test(trimmedPart);
    });
    if (!isValid) {
        logger.error('Please provide a valid lazyLoadingMargin value (e.g., "10px")');
        return false;
    }
    return true;
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
    viewConfig: AllEmbedViewConfig,
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
        const styleKey = styleProperty as keyof CSSStyleDeclaration;
        const value = styleProperties[styleKey];
        if (value !== undefined) {
            (element.style as any)[styleKey] = value.toString();
        }
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
 * @param options - Additional options.
 * @param options.ignoreIfAlreadyExists - Does not set if value for key is set.
 *
 * @returns The stored value.
 *
 * @version SDK: 1.36.2 | ThoughtSpot: *
 */
export function storeValueInWindow<T>(
    key: string,
    value: T,
    options: { ignoreIfAlreadyExists?: boolean } = {},
): T {
    if (isWindowUndefined()) return value;
    if (!window[sdkWindowKey]) {
        (window as any)[sdkWindowKey] = {};
    }

    if (options.ignoreIfAlreadyExists && key in (window as any)[sdkWindowKey]) {
        return (window as any)[sdkWindowKey][key];
    }

    (window as any)[sdkWindowKey][key] = value;
    return value;
}

/**
 * Retrieves a stored value from the global 
 * `window` object under the `_tsEmbedSDK` namespace.
 * Returns undefined in SSR environment.
 */
export const getValueFromWindow = <T = any>(key: string): T | undefined => {
    if (isWindowUndefined()) return undefined;
    return (window as any)?.[sdkWindowKey]?.[key];
};
/**
 * Check if an array includes a string value
 * @param arr - The array to check
 * @param key - The string to search for
 * @returns boolean indicating if the string is found in the array
 */
export const arrayIncludesString = (arr: readonly unknown[], key: string): boolean => {
    return arr.some(item => typeof item === 'string' && item === key);
};

/**
 * Resets the key if it exists in the `window` object under the `_tsEmbedSDK` key.
 * Returns true if the key was reset, false otherwise.
 * @param key - Key to reset
 * @returns - boolean indicating if the key was reset
 */
export function resetValueFromWindow(key: string): boolean {
    if (isWindowUndefined()) return false;
    if (key in window[sdkWindowKey]) {
        delete (window as any)[sdkWindowKey][key];
        return true;
    }
    return false;
}

/**
 * Check if the document is currently in fullscreen mode
 */
const isInFullscreen = (): boolean => {
    return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
    );
};

/**
 * Handle Present HostEvent by entering fullscreen mode
 * @param iframe The iframe element to make fullscreen
 */
export const handlePresentEvent = async (iframe: HTMLIFrameElement): Promise<void> => {
    if (isInFullscreen()) {
        return; // Already in fullscreen
    }

    // Browser-specific methods to enter fullscreen mode
    const fullscreenMethods = [
        'requestFullscreen',      // Standard API
        'webkitRequestFullscreen', // WebKit browsers
        'mozRequestFullScreen',   // Firefox
        'msRequestFullscreen'     // IE/Edge
    ];

    for (const method of fullscreenMethods) {
        if (typeof (iframe as any)[method] === 'function') {
            try {
                const result = (iframe as any)[method]();
                await Promise.resolve(result);
                return;
            } catch (error) {
                logger.warn(`Failed to enter fullscreen using ${method}:`, error);
            }
        }
    }

    logger.error('Fullscreen API is not supported by this browser.');
};

/**
 * Handle ExitPresentMode EmbedEvent by exiting fullscreen mode
 */
export const handleExitPresentMode = async (): Promise<void> => {
    if (!isInFullscreen()) {
        return; // Not in fullscreen
    }

    const exitFullscreenMethods = [
        'exitFullscreen',        // Standard API
        'webkitExitFullscreen',  // WebKit browsers
        'mozCancelFullScreen',   // Firefox
        'msExitFullscreen'       // IE/Edge
    ];

    // Try each method until one works
    for (const method of exitFullscreenMethods) {
        if (typeof (document as any)[method] === 'function') {
            try {
                const result = (document as any)[method]();
                await Promise.resolve(result);
                return;
            } catch (error) {
                logger.warn(`Failed to exit fullscreen using ${method}:`, error);
            }
        }
    }

    logger.warn('Exit fullscreen API is not supported by this browser.');
};

export const calculateVisibleElementData = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const frameRelativeTop = Math.max(rect.top, 0);
    const frameRelativeLeft = Math.max(rect.left, 0);

    const frameRelativeBottom = Math.min(windowHeight, rect.bottom);
    const frameRelativeRight = Math.min(windowWidth, rect.right);

    const data = {
        top: Math.max(0, rect.top * -1),
        height: Math.max(0, frameRelativeBottom - frameRelativeTop),
        left: Math.max(0, rect.left * -1),
        width: Math.max(0, frameRelativeRight - frameRelativeLeft),
    };

    return data;
}

/**
 * Replaces placeholders in a template string with provided values.
 * Placeholders should be in the format {key}.
 * @param template - The template string with placeholders
 * @param values - An object containing key-value pairs to replace placeholders
 * @returns The template string with placeholders replaced
 * @example
 * formatTemplate('Hello {name}, you are {age} years old', { name: 'John', age: 30 })
 * // Returns: 'Hello John, you are 30 years old'
 *
 * formatTemplate('Expected {type}, but received {actual}', { type: 'string', actual: 'number' })
 * // Returns: 'Expected string, but received number'
 */
export const formatTemplate = (template: string, values: Record<string, any>): string => {
    // This regex /\{(\w+)\}/g finds all placeholders in the format {word} 
    // and captures the word inside the braces for replacement.
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return values[key] !== undefined ? String(values[key]) : match;
    });
};

export const getHostEventsConfig = (viewConfig: BaseViewConfig) => {
    return {
        shouldBypassPayloadValidation: viewConfig.shouldBypassPayloadValidation,
        useHostEventsV2: viewConfig.useHostEventsV2,
    };
}

/**
 * Check if the window is undefined
 * If the window is undefined, it means the code is running in a SSR environment.
 * @returns true if the window is undefined, false otherwise
 * 
 */
export const isWindowUndefined = (): boolean => {
    if(typeof window === 'undefined') {
        logger.error(ERROR_MESSAGE.SSR_ENVIRONMENT_ERROR);
        return true;
    }
    return false;
}

/**
 * Validates that a URL uses only http: or https: protocols.
 * Returns a tuple of [isValid, error] so the caller can handle validation errors.
 * @param url - The URL string to validate
 * @returns [true, null] if valid, [false, Error] if invalid
 */
export const validateHttpUrl = (url: string): [boolean, Error | null] => {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return [false, new Error(`Invalid protocol: ${parsedUrl.protocol}. Only http: and https: are allowed.`)];
        }
        return [true, null];
    } catch (error) {
        return [false, error instanceof Error ? error : new Error(String(error))];
    }
};

/**
 * Sets a query parameter if the value is defined.
 * @param queryParams - The query params object to modify
 * @param param - The parameter key
 * @param value - The value to set
 * @param asBoolean - If true, coerces value to boolean
 */
export const setParamIfDefined = <T>(
    queryParams: Record<string, unknown>,
    param: string,
    value: T | undefined,
    asBoolean = false,
): void => {
    if (value !== undefined) {
        queryParams[param] = asBoolean ? !!value : value;
    }
};
