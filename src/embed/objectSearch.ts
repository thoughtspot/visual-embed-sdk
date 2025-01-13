/**
 * Copyright (c) 2025
 *
 * Embed ThoughtSpot Object Search
 * @summary TS Object Search embed
 * @author Mourya Balabhadra <mourya.balabhadra@thoughtspot.com>
 */

import { DOMSelector, Param, ViewConfig } from '../types';
import { getQueryParamString } from '../utils';
import { V1Embed } from './ts-embed';

export enum ObjectType {
    ANSWER = 'ANSWER',
    PINBOARD = 'PINBOARD',
}

/**
 * Configuration for search options
 */
export interface SearchOptions {
    /**
     * The query string to pass for Object Search.
     * @version SDK: 1.35.1 | Thoughtspot: 10.4.0.cl
     */
    searchQuery: string;
    // /**
    //  * The object type filter for Object Search.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.4.0.cl
    //  */
    // objectType?: ObjectType;
    // /**
    //  * default search offset to be used in object search results.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.7.0.cl
    //  */
    // searchOffset?: number;
    // /**
    //  * default page number in the object search results.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.7.0.cl
    //  */
    // page?: number;
    // /**
    //  * set default author filter for Object Search.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.7.0.cl
    //  */
    // author?: string;
    // /**
    //  *  set default tag filter for Object Search.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.7.0.cl
    //  */
    // tag?: number;
    // /**
    //  * Boolean to define if the search should be executed or not.
    //  * If it is executed, the focus is placed on the results.
    //  * If it’s not executed, the focus is placed at the end of
    //  * the token string in the search bar.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.7.0.cl
    //  */
    // executeSearch?: boolean;
}

/**
 * The configuration attributes for the embedded Object Search view.
 * @version: SDK: 1.35.1 | ThoughtSpot: 10.7.0.cl
 * @group Embed components
 */
export interface ObjectSearchViewConfig
    extends Omit<
        ViewConfig,
        | 'hiddenHomepageModules'
        | 'hiddenHomeLeftNavItems'
        | 'hiddenTabs'
        | 'visibleTabs'
        | 'reorderedHomepageModules'
    > {
    // /**
    //  * Show or hide autocomplete suggestions for the search query string.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.7.0.cl
    //  */
    // hideAutocompleteSuggestions?: boolean;
    // /**
    //  * The data source GUID (Worksheet GUID) to set on load.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.7.0.cl
    //  */
    // dataSource?: string;
    // /**
    //  * The data source GUID (Worksheet GUID) array to set on load.
    //  * only first one will be used.
    //  * @version SDK: 1.35.1 | Thoughtspot: 10.7.0.cl
    //  */
    // dataSources?: string[];
    /**
     * Includes the following properties:
     *
     * `searchQuery`: The search query string to pass in the search bar.
     * @example
     * ```js
     * searchOptions: {
     *    searchQuery: 'average sales',
     * }
     * ```
     * @version SDK: 1.35.1 | Thoughtspot: 10.4.0.cl
     */
    searchOptions?: SearchOptions;
}
/**
 * Embed ThoughtSpot Object Search component.
 * @version: SDK: 1.35.1 | Thoughtspot: 10.4.0.cl
 * @group Embed components
 */
export class ObjectSearchEmbed extends V1Embed {
    /**
     * The view configuration for the embedded ThoughtSpot object search.
     *
     */
    protected viewConfig: ObjectSearchViewConfig;

    // eslint-disable-next-line no-useless-constructor
    constructor(domSelector: DOMSelector, viewConfig: ObjectSearchViewConfig) {
        viewConfig.embedComponentType = 'ObjectSearchEmbed';
        super(domSelector, viewConfig);
    }

    /**
     * Constructs a map of parameters to be passed on to the
     * embedded object search page.
     * @returns {string} query string
     */
    protected getEmbedParams(): string {
        const { dataPanelV2 } = this.viewConfig;

        const params = this.getBaseQueryParams();
        params[Param.DataPanelV2Enabled] = !!dataPanelV2;
        params[Param.IsObjectSearchEmbed] = true;

        return getQueryParamString(params, true);
    }

    /**
     * Construct the URL of the embedded ThoughtSpot object search to be
     * loaded in the iframe
     * @returns {string} iframe url
     */
    public getIFrameSrc(): string {
        const path = 'insights/eureka';
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();
        const { searchOptions } = this.viewConfig;
        let objectSearchPostHashParams = '';
        if (searchOptions?.searchQuery) {
            objectSearchPostHashParams += `${tsPostHashParams ? '&' : '?'}${[
                Param.Query,
            ]}=${encodeURIComponent(searchOptions.searchQuery)}`;
        }

        // use encodeURIComponent for query instead of URLSearchParams
        // as it adds + instead of %20 for spaces
        return `${this.getRootIframeSrc()}/embed/${path}${tsPostHashParams}${objectSearchPostHashParams}`;
    }

    /**
     * Render the embedded ThoughtSpot Object Search component
     * @returns {ObjectSearchEmbed}  Object Search  embed
     */
    public async render(): Promise<ObjectSearchEmbed> {
        super.render();

        const src = this.getIFrameSrc();
        await this.renderV1Embed(src);

        return this;
    }
}
