import { Param, ViewConfig } from '../types';
import { getQueryParamString } from '../utils';
import { TsEmbed } from './ts-embed';
import { SearchOptions } from './search';

/**
 * @group Embed components
 */
export interface SearchBarViewConfig
    extends Omit<
        ViewConfig,
        | 'runtimeFilters'
        | 'showAlerts'
        | 'dataPanelV2'
        | 'hiddenHomepageModules'
        | 'hiddenHomeLeftNavItems'
        | 'hiddenTabs'
        | 'visibleTabs'
        | 'reorderedHomepageModules'
    > {
    /**
     * The array of data source GUIDs to set on load.
     * Only a single data source is supported currently.
     * @deprecated Use `dataSource` instead
     * @version: SDK: 1.1.0 | ThoughtSpot: 8.1.1-sw
     * @example
     * ```js
     * const embed = new SearchBarEmbed('#tsEmbed', {
     *    ... // other options
     *    dataSources:['id-2345','id-2345'],
     * })
     * ```
     */
    dataSources?: string[];
    /**
     * Pass the ID of the source to be selected.
     * @version: SDK: 1.19.0, ThoughtSpot 9.0.0.cl, 9.0.1.sw
     * @example
     * ```js
     * const embed = new SearchBarEmbed('#tsEmbed', {
     *    ... // other options
     *    dataSource:'id-2345',
     * })
     * ```
     */
    dataSource?: string;
    /**
     * Boolean to define if the last selected data source should be used
     * @version: SDK: 1.24.0, ThoughtSpot 9.5.0.cl, 9.5.0.sw
     * @example
     * ```js
     * const embed = new SearchBarEmbed('#tsEmbed', {
     *    ... // other options
     *    useLastSelectedSources:false,
     * })
     * ```
     */
    useLastSelectedSources?: boolean;
    /**
     * Configuration for search options.
     * Includes the following properties:
     *
     * `searchTokenString`: Search tokens to pass in the query.
     *
     * `executeSearch`: Boolean to define if the search should be executed or not.
     * If it is executed, the focus is placed on the results.
     * If it’s not executed, the focus is placed at the end of
     * the token string in the search bar.
     * @version: SDK: 1.2.0 | ThoughtSpot: 9.4.0.sw
     * @example
     * ```js
     * const embed = new SearchBarEmbed('#tsEmbed', {
     *    ... // other options
     *    searchOptions: {
     *        searchTokenString: '[quantity purchased] [region]',
     *        executeSearch: true,
     *    }
     * })
     * ```
     */
    searchOptions?: SearchOptions;
    /**
     * Exclude the search token string from the URL.
     * If set to true, the search token string is not appended to the URL.
     * @version: SDK: 1.35.7 | ThoughtSpot: 10.7.0.cl
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *  searchOptions: {
     *    searchTokenString: '[quantity purchased] [region]',
     *    executeSearch: true,
     *  },
     *  excludeSearchTokenStringFromURL: true,
     * });
     * ```
     */
    excludeSearchTokenStringFromURL?: boolean;
}

/**
 * Embed ThoughtSpot search bar
 * @version: SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1-sw
 * @group Embed components
 */
export class SearchBarEmbed extends TsEmbed {
    /**
     * The view configuration for the embedded ThoughtSpot search bar.
     */
    protected viewConfig: SearchBarViewConfig;

    protected embedComponentType = 'SearchBarEmbed';

    constructor(domSelector: string, viewConfig: SearchBarViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
    }

    /**
     * Construct the URL of the embedded ThoughtSpot search to be
     * loaded in the iframe
     * @param dataSources A list of data source GUIDs
     */
    private getIFrameSrc() {
        const {
            searchOptions,
            dataSource,
            dataSources,
            useLastSelectedSources = false,
            excludeSearchTokenStringFromURL,
        } = this.viewConfig;
        const path = 'search-bar-embed';
        const queryParams = this.getBaseQueryParams();

        queryParams[Param.HideActions] = [...(queryParams[Param.HideActions] ?? [])];

        if (dataSources && dataSources.length) {
            queryParams[Param.DataSources] = JSON.stringify(dataSources);
        }
        if (dataSource) {
            queryParams[Param.DataSources] = `["${dataSource}"]`;
        }
        if (searchOptions?.searchTokenString && !excludeSearchTokenStringFromURL) {
            queryParams[Param.searchTokenString] = encodeURIComponent(
                searchOptions.searchTokenString,
            );

            if (searchOptions.executeSearch) {
                queryParams[Param.executeSearch] = true;
            }
        }

        queryParams[Param.UseLastSelectedDataSource] = useLastSelectedSources;
        if (dataSource || dataSources) {
            queryParams[Param.UseLastSelectedDataSource] = false;
        }
        queryParams[Param.searchEmbed] = true;
        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();

        return `${this.getEmbedBasePath(query)}/embed/${path}${tsPostHashParams}`;
    }

    /**
     * Render the embedded ThoughtSpot search
     */
    public async render(): Promise<SearchBarEmbed> {
        super.render();

        const src = this.getIFrameSrc();
        await this.renderIFrame(src);
        return this;
    }
}
