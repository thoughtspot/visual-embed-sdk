/**
 * Copyright (c) 2023
 *
 * Common utility functions for ThoughtSpot Visual Embed SDK
 * @summary Utils
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import { EmbedConfig, QueryParams, RuntimeFilter, CustomisationsInterface, DOMSelector, RuntimeParameter, AllEmbedViewConfig, BaseViewConfig } from './types';
/**
 * Construct a runtime filters query string from the given filters.
 * Refer to the following docs for more details on runtime filter syntax:
 * https://cloud-docs.thoughtspot.com/admin/ts-cloud/apply-runtime-filter.html
 * https://cloud-docs.thoughtspot.com/admin/ts-cloud/runtime-filter-operators.html
 * @param runtimeFilters
 */
export declare const getFilterQuery: (runtimeFilters: RuntimeFilter[]) => string | null;
/**
 * Construct a runtime parameter override query string from the given option.
 * @param runtimeParameters
 */
export declare const getRuntimeParameters: (runtimeParameters: RuntimeParameter[]) => string;
/**
 * Return a query param string composed from the given params object
 * @param queryParams
 * @param shouldSerializeParamValues
 */
export declare const getQueryParamString: (queryParams: QueryParams, shouldSerializeParamValues?: boolean) => string;
/**
 * Get a string representation of a dimension value in CSS
 * If numeric, it is considered in pixels.
 * @param value
 */
export declare const getCssDimension: (value: number | string) => string;
/**
 * Validates if a string is a valid CSS margin value.
 * @param value - The string to validate
 * @returns true if the value is a valid CSS margin value, false otherwise
 */
export declare const isValidCssMargin: (value: string) => boolean;
export declare const getSSOMarker: (markerId: string) => string;
/**
 * Append a string to a URL's hash fragment
 * @param url A URL
 * @param stringToAppend The string to append to the URL hash
 */
export declare const appendToUrlHash: (url: string, stringToAppend: string) => string;
/**
 *
 * @param url
 * @param stringToAppend
 * @param path
 */
export declare function getRedirectUrl(url: string, stringToAppend: string, path?: string): string;
export declare const getEncodedQueryParamsString: (queryString: string) => string;
export declare const getOffsetTop: (element: any) => any;
export declare const embedEventStatus: {
    START: string;
    END: string;
};
export declare const setAttributes: (element: HTMLElement, attributes: {
    [key: string]: string | number | boolean;
}) => void;
export declare const checkReleaseVersionInBeta: (releaseVersion: string, suppressBetaWarning: boolean) => boolean;
export declare const getCustomisations: (embedConfig: EmbedConfig, viewConfig: AllEmbedViewConfig) => CustomisationsInterface;
export declare const getRuntimeFilters: (runtimefilters: any) => string;
/**
 * Gets a reference to the DOM node given
 * a selector.
 * @param domSelector
 */
export declare function getDOMNode(domSelector: DOMSelector): HTMLElement;
export declare const deepMerge: (target: any, source: any) => {
    [x: string]: any;
};
export declare const getOperationNameFromQuery: (query: string) => string;
/**
 *
 * @param obj
 */
export declare function removeTypename(obj: any): any;
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
export declare const setStyleProperties: (element: HTMLElement, styleProperties: Partial<CSSStyleDeclaration>) => void;
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
export declare const removeStyleProperties: (element: HTMLElement, styleProperties: string[]) => void;
export declare const isUndefined: (value: any) => boolean;
export declare const getTypeFromValue: (value: any) => [string, string];
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
export declare function storeValueInWindow<T>(key: string, value: T, options?: {
    ignoreIfAlreadyExists?: boolean;
}): T;
/**
 * Retrieves a stored value from the global
 * `window` object under the `_tsEmbedSDK` namespace.
 * Returns undefined in SSR environment.
 */
export declare const getValueFromWindow: <T = any>(key: string) => T;
/**
 * Check if an array includes a string value
 * @param arr - The array to check
 * @param key - The string to search for
 * @returns boolean indicating if the string is found in the array
 */
export declare const arrayIncludesString: (arr: readonly unknown[], key: string) => boolean;
/**
 * Resets the key if it exists in the `window` object under the `_tsEmbedSDK` key.
 * Returns true if the key was reset, false otherwise.
 * @param key - Key to reset
 * @returns - boolean indicating if the key was reset
 */
export declare function resetValueFromWindow(key: string): boolean;
/**
 * Handle Present HostEvent by entering fullscreen mode
 * @param iframe The iframe element to make fullscreen
 */
export declare const handlePresentEvent: (iframe: HTMLIFrameElement) => Promise<void>;
/**
 * Handle ExitPresentMode EmbedEvent by exiting fullscreen mode
 */
export declare const handleExitPresentMode: () => Promise<void>;
export declare const calculateVisibleElementData: (element: HTMLElement) => {
    top: number;
    height: number;
    left: number;
    width: number;
};
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
export declare const formatTemplate: (template: string, values: Record<string, any>) => string;
export declare const getHostEventsConfig: (viewConfig: BaseViewConfig) => {
    shouldBypassPayloadValidation: boolean;
    useHostEventsV2: boolean;
};
/**
 * Check if the window is undefined
 * If the window is undefined, it means the code is running in a SSR environment.
 * @returns true if the window is undefined, false otherwise
 *
 */
export declare const isWindowUndefined: () => boolean;
/**
 * Validates that a URL uses only http: or https: protocols.
 * Returns a tuple of [isValid, error] so the caller can handle validation errors.
 * @param url - The URL string to validate
 * @returns [true, null] if valid, [false, Error] if invalid
 */
export declare const validateHttpUrl: (url: string) => [boolean, Error | null];
/**
 * Sets a query parameter if the value is defined.
 * @param queryParams - The query params object to modify
 * @param param - The parameter key
 * @param value - The value to set
 * @param asBoolean - If true, coerces value to boolean
 */
export declare const setParamIfDefined: <T>(queryParams: Record<string, unknown>, param: string, value: T, asBoolean?: boolean) => void;
//# sourceMappingURL=utils.d.ts.map