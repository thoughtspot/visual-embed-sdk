/**
 * Copyright (c) 2022
 *
 * Embed ThoughtSpot search or a saved answer.
 * https://developers.thoughtspot.com/docs/search-embed
 * @summary Search embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import { DOMSelector, Action, SearchLiveboardCommonViewConfig, DefaultAppInitData, BaseViewConfig, VisualizationOverrides } from '../types';
import { TsEmbed } from './ts-embed';
/**
 * Configuration for search options.
 *
 */
export interface SearchOptions {
    /**
     * Search tokens to pass in the query.
     */
    searchTokenString: string;
    /**
     * Boolean to define if the search should be executed or not.
     * If it is executed, the focus is placed on the results.
     * If it’s not executed, the focus is placed at the end of
     * the token string in the search bar.
     */
    executeSearch?: boolean;
}
/**
 * Define the initial state of column custom group accordions
 * in data panel v2.
 */
export declare enum DataPanelCustomColumnGroupsAccordionState {
    /**
     * Expand all the accordion initially in data panel v2.
     */
    EXPAND_ALL = "EXPAND_ALL",
    /**
     * Collapse all the accordions initially in data panel v2.
     */
    COLLAPSE_ALL = "COLLAPSE_ALL",
    /**
     * Expand the first accordion and collapse the rest.
     */
    EXPAND_FIRST = "EXPAND_FIRST"
}
/**
 * The configuration attributes for the embedded search view.
 * @group Embed components
 */
export interface SearchViewConfig extends SearchLiveboardCommonViewConfig, Omit<BaseViewConfig, 'primaryAction'> {
    /**
     * If set to true, the data sources panel is collapsed on load,
     * but can be expanded manually.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    collapseDataSources:true,
     * })
     * ```
     */
    collapseDataSources?: boolean;
    /**
     * If set to true, the data panel is collapsed on load,
     * but can be expanded manually.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    collapseDataPanel:true,
     * })
     * ```
     */
    collapseDataPanel?: boolean;
    /**
     * Show or hide the data sources panel.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.2.0 | ThoughtSpot: 9.1.0.sw
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    hideDataSources:true,
     * })
     * ```
     */
    hideDataSources?: boolean;
    /**
     * Show or hide the charts and tables in search answers.
     * This attribute can be used to create a custom visualization
     * using raw answer data.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.2.0 | ThoughtSpot: 9.1.0.sw
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    hideResults:true,
     * })
     * ```
     */
    hideResults?: boolean;
    /**
     * If set to true, the Search Assist feature is enabled.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1-sw
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    enableSearchAssist:true,
     * })
     * ```
     */
    enableSearchAssist?: boolean;
    /**
     * If set to true, the tabular view is set as the default
     * format for presenting search data.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    forceTable:true,
     * })
     * ```
     */
    forceTable?: boolean;
    /**
     * The array of data source GUIDs to set on load.
     * Only a single data source is supported currently.
     * Use {@link dataSource} instead.
     * @deprecated Use `dataSource` instead.
     *
     * Supported embed types: `SearchEmbed`
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    dataSources:['id-234','id-456'],
     * })
     * ```
     */
    dataSources?: string[];
    /**
     * The data source GUID to set on load.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.19.0
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    dataSource:'id-234',
     * })
     * ```
     */
    dataSource?: string;
    /**
     * The initial search query to load the answer with.
     * Use {@link searchOptions} instead.
     * @deprecated
     *
     */
    searchQuery?: string;
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
     *
     * Supported embed types: `SearchEmbed`
     * @example
     * ```js
     * searchOptions: {
     *    searchTokenString: '[quantity purchased] [region]',
     *    executeSearch: true,
     * }
     * ```
     */
    searchOptions?: SearchOptions;
    /**
     * Exclude the search token string from the URL.
     * If set to true, the search token string is not appended to the URL.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.35.7 | ThoughtSpot: 10.8.0.cl
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
    /**
     * The GUID of a saved answer to load initially.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    answerId:'sed-1234',
     * })
     * ```
     */
    answerId?: string;
    /**
     * If set to true, the search page will render without the Search Bar
     * The chart/table should still be visible.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    hideSearchBar:true,
     * })
     * ```
     */
    hideSearchBar?: boolean;
    /**
     * Flag to set if last selected dataSource should be used
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.24.0
     */
    useLastSelectedSources?: boolean;
    /**
     * To set the initial state of the search bar in case of saved-answers.
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     * @deprecated Use {@link collapseSearchBar} instead
     * @default false
     */
    collapseSearchBarInitially?: boolean;
    /**
     * This controls the initial behaviour of custom column groups accordion.
     * It takes DataPanelCustomColumnGroupsAccordionState enum values as input.
     * List of different enum values:-
     * - EXPAND_ALL: Expand all the accordion initially in data panel v2.
     * - COLLAPSE_ALL: Collapse all the accordions initially in data panel v2.
     * - EXPAND_FIRST: Expand the first accordion and collapse the rest.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     * @default DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *   ... // other embed view config
     *   dataPanelCustomGroupsAccordionInitialState:
     *      DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL,
     * });
     * ```
     */
    dataPanelCustomGroupsAccordionInitialState?: DataPanelCustomColumnGroupsAccordionState;
    /**
     * Flag to remove focus from search bar initially when user
     * lands on search embed page.
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.32.0 | ThoughtSpot: 10.3.0.cl
     * @default true
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *  ... // other embed view config
     * focusSearchBarOnRender: false,
     * });
     * ```
     */
    focusSearchBarOnRender?: boolean;
    /**
     * Enable or disable Muze chart phase 1 GA
     *
     * Supported embed types: `SearchEmbed`
     * @version SDK: 1.49.0 | ThoughtSpot Cloud: 26.6.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new SearchEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    newChartsLibrary: true,
     * })
     * ```
     */
    newChartsLibrary?: boolean;
    /**
     * Visual overrides to customize the chart or table properties.
     * @version SDK: 1.49.0 | ThoughtSpot: 26.6.0.cl
     */
    visualOverrides?: VisualizationOverrides;
}
export declare const HiddenActionItemByDefaultForSearchEmbed: Action[];
export interface SearchAppInitData extends DefaultAppInitData {
    searchOptions?: SearchOptions;
    embedParams?: {
        visualOverridesParams?: VisualizationOverrides | null;
    };
}
/**
 * Embed ThoughtSpot search
 * @group Embed components
 */
export declare class SearchEmbed extends TsEmbed {
    /**
     * The view configuration for the embedded ThoughtSpot search.
     */
    protected viewConfig: SearchViewConfig;
    constructor(domSelector: DOMSelector, viewConfig: SearchViewConfig);
    /**
     * Get the state of the data sources panel that the embedded
     * ThoughtSpot search will be initialized with.
     */
    private getDataSourceMode;
    protected getSearchInitData(): {
        searchOptions?: {
            searchTokenString: string;
        };
    };
    protected getAppInitData(): Promise<SearchAppInitData>;
    protected getEmbedParamsObject(): Record<any, any>;
    protected getEmbedParams(): string;
    /**
     * Construct the URL of the embedded ThoughtSpot search to be
     * loaded in the iframe
     * @param answerId The GUID of a saved answer
     * @param dataSources A list of data source GUIDs
     */
    getIFrameSrc(): string;
    /**
     * Render the embedded ThoughtSpot search
     */
    render(): Promise<SearchEmbed>;
}
//# sourceMappingURL=search.d.ts.map