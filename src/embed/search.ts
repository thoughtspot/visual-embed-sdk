/**
 * Copyright (c) 2022
 *
 * Embed ThoughtSpot search or a saved answer
 * @summary Search embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import {
    DataSourceVisualMode,
    DOMSelector,
    Param,
    Action,
    SearchLiveboardCommonViewConfig,
    DefaultAppInitData,
    BaseViewConfig,
} from '../types';
import {
    getQueryParamString,
    checkReleaseVersionInBeta,
    getFilterQuery,
    getRuntimeParameters,
} from '../utils';
import { TsEmbed } from './ts-embed';
import { ERROR_MESSAGE } from '../errors';
import { getAuthPromise } from './base';
import { getReleaseVersion } from '../auth';
import { getEmbedConfig } from './embedConfig';
import { getInterceptInitData } from '../api-intercept';

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
 * Define the initial state os column custom group accordions
 * in data panel v2.
 */
export enum DataPanelCustomColumnGroupsAccordionState {
    /**
     * Expand all the accordion initially in data panel v2.
     */
    EXPAND_ALL = 'EXPAND_ALL',
    /**
     * Collapse all the accordions initially in data panel v2.
     */
    COLLAPSE_ALL = 'COLLAPSE_ALL',
    /**
     * Expand the first accordion and collapse the rest.
     */
    EXPAND_FIRST = 'EXPAND_FIRST',
}

/**
 * The configuration attributes for the embedded search view.
 * @group Embed components
 */
export interface SearchViewConfig
    extends SearchLiveboardCommonViewConfig, Omit<BaseViewConfig, 'primaryAction'> {
    /**
     * If set to true, the data sources panel is collapsed on load,
     * but can be expanded manually.
     * 
     * Supported embed types: `SearchEmbed`
     * @version: SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
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
     * @version: SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
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
     * @version: SDK: 1.2.0 | ThoughtSpot: 9.1.0.sw
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
     * @version: SDK: 1.2.0 | ThoughtSpot: 9.1.0.sw
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
     * @version: SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
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
     * The array of data source GUIDs to set on load.
     * 
     * Supported embed types: `SearchEmbed`
     * @version: SDK: 1.19.0
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
     * @deprecated
     *
     * Use {@link searchOptions} instead.
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
     * @version: SDK: 1.35.7 | ThoughtSpot: 10.8.0.cl
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
     * @version: SDK: 1.1.0 | ThoughtSpot: 8.1.0.sw
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
     * @version: SDK: 1.24.0
     */
    useLastSelectedSources?: boolean;
    /**
     * To set the initial state of the search bar in case of saved-answers.
     * @default false
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     * @deprecated Use {@link collapseSearchBar} instead
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
}

export const HiddenActionItemByDefaultForSearchEmbed = [
    Action.EditACopy,
    Action.SaveAsView,
    Action.UpdateTML,
    Action.EditTML,
    Action.AnswerDelete,
];

export interface SearchAppInitData extends DefaultAppInitData {
    searchOptions?: SearchOptions;
}

/**
 * Embed ThoughtSpot search
 * @group Embed components
 */
export class SearchEmbed extends TsEmbed {
    /**
     * The view configuration for the embedded ThoughtSpot search.
     */
    protected viewConfig: SearchViewConfig;

    constructor(domSelector: DOMSelector, viewConfig: SearchViewConfig) {
        viewConfig = {
            embedComponentType: 'SearchEmbed',
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        }
        super(domSelector, viewConfig);
    }

    /**
     * Get the state of the data sources panel that the embedded
     * ThoughtSpot search will be initialized with.
     */
    private getDataSourceMode() {
        let dataSourceMode = DataSourceVisualMode.Expanded;
        if (this.viewConfig.collapseDataSources === true
            || this.viewConfig.collapseDataPanel === true) {
            dataSourceMode = DataSourceVisualMode.Collapsed;
        }
        if (this.viewConfig.hideDataSources === true) {
            dataSourceMode = DataSourceVisualMode.Hidden;
        }

        return dataSourceMode;
    }

    protected getSearchInitData() {
        return {
            ...(this.viewConfig.excludeSearchTokenStringFromURL ? {
                searchOptions: {
                    searchTokenString: this.viewConfig.searchOptions?.searchTokenString,
                },
            } : {}),
        };
    }

    protected async getAppInitData(): Promise<SearchAppInitData> {
        const defaultAppInitData = await super.getAppInitData();
        return { ...defaultAppInitData, ...this.getSearchInitData() };
    }

    protected getEmbedParamsObject() {
        const {
            hideResults,
            enableSearchAssist,
            forceTable,
            searchOptions,
            runtimeFilters,
            dataSource,
            dataSources,
            excludeRuntimeFiltersfromURL,
            hideSearchBar,
            dataPanelV2 = true,
            useLastSelectedSources = false,
            runtimeParameters,
            collapseSearchBarInitially = false,
            enableCustomColumnGroups = false,
            dataPanelCustomGroupsAccordionInitialState = DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL,
            focusSearchBarOnRender = true,
            excludeRuntimeParametersfromURL,
            excludeSearchTokenStringFromURL,
            collapseSearchBar = true,
            isThisPeriodInDateFiltersEnabled,
        } = this.viewConfig;
        const queryParams = this.getBaseQueryParams();

        queryParams[Param.HideActions] = [
            ...(queryParams[Param.HideActions] ?? []),
            ...HiddenActionItemByDefaultForSearchEmbed,
        ];

        if (dataSources && dataSources.length) {
            queryParams[Param.DataSources] = JSON.stringify(dataSources);
        }
        if (dataSource) {
            queryParams[Param.DataSources] = `["${dataSource}"]`;
        }
        if (searchOptions?.searchTokenString) {
            if (!excludeSearchTokenStringFromURL) {
                queryParams[Param.searchTokenString] = encodeURIComponent(
                    searchOptions.searchTokenString,
                );
            }
            if (searchOptions.executeSearch) {
                queryParams[Param.executeSearch] = true;
            }
        }
        if (enableSearchAssist) {
            queryParams[Param.EnableSearchAssist] = true;
        }
        if (hideResults) {
            queryParams[Param.HideResult] = true;
        }
        if (forceTable) {
            queryParams[Param.ForceTable] = true;
        }

        if (hideSearchBar) {
            queryParams[Param.HideSearchBar] = true;
        }

        if (!focusSearchBarOnRender) {
            queryParams[Param.FocusSearchBarOnRender] = focusSearchBarOnRender;
        }

        if (isThisPeriodInDateFiltersEnabled !== undefined) {
            queryParams[Param.IsThisPeriodInDateFiltersEnabled] = isThisPeriodInDateFiltersEnabled;
        }

        queryParams[Param.DataPanelV2Enabled] = dataPanelV2;
        queryParams[Param.DataSourceMode] = this.getDataSourceMode();

        queryParams[Param.UseLastSelectedDataSource] = useLastSelectedSources;
        if (dataSource || dataSources) {
            queryParams[Param.UseLastSelectedDataSource] = false;
        }

        queryParams[Param.searchEmbed] = true;

        queryParams[Param.CollapseSearchBarInitially] = collapseSearchBarInitially || collapseSearchBar;
        queryParams[Param.EnableCustomColumnGroups] = enableCustomColumnGroups;
        if (dataPanelCustomGroupsAccordionInitialState
            === DataPanelCustomColumnGroupsAccordionState.COLLAPSE_ALL
            || dataPanelCustomGroupsAccordionInitialState
            === DataPanelCustomColumnGroupsAccordionState.EXPAND_FIRST
        ) {

            queryParams[Param.DataPanelCustomGroupsAccordionInitialState] = dataPanelCustomGroupsAccordionInitialState;
        } else {

            queryParams[Param.DataPanelCustomGroupsAccordionInitialState] = DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL;
        }
        return queryParams;
    }

    protected getEmbedParams() {
        const {
            runtimeParameters,
            runtimeFilters,
            excludeRuntimeParametersfromURL,
            excludeRuntimeFiltersfromURL,
        } = this.viewConfig;
        const queryParams = this.getEmbedParamsObject();
        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }

        const parameterQuery = getRuntimeParameters(runtimeParameters || []);
        if (parameterQuery && !excludeRuntimeParametersfromURL) query += `&${parameterQuery}`;

        const filterQuery = getFilterQuery(runtimeFilters || []);
        if (filterQuery && !excludeRuntimeFiltersfromURL) {
            query += `&${filterQuery}`;
        }
        return query;
    }

    /**
     * Construct the URL of the embedded ThoughtSpot search to be
     * loaded in the iframe
     * @param answerId The GUID of a saved answer
     * @param dataSources A list of data source GUIDs
     */
    public getIFrameSrc(): string {
        const { answerId } = this.viewConfig;
        const answerPath = answerId ? `saved-answer/${answerId}` : 'answer';
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();

        return `${this.getRootIframeSrc()}/embed/${answerPath}${tsPostHashParams}`;
    }

    /**
     * Render the embedded ThoughtSpot search
     */
    public async render(): Promise<SearchEmbed> {
        await super.render();
        const { answerId } = this.viewConfig;
        const src = this.getIFrameSrc();
        await this.renderIFrame(src);
        getAuthPromise().then(() => {
            if (
                checkReleaseVersionInBeta(
                    getReleaseVersion(),
                    getEmbedConfig().suppressSearchEmbedBetaWarning
                    || getEmbedConfig().suppressErrorAlerts,
                )
            ) {
                alert(ERROR_MESSAGE.SEARCHEMBED_BETA_WRANING_MESSAGE);
            }
        });
        return this;
    }
}
