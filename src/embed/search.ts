/**
 * Copyright (c) 2022
 *
 * Embed ThoughtSpot search or a saved answer
 *
 * @summary Search embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import {
    DataSourceVisualMode,
    DOMSelector,
    Param,
    Action,
    ViewConfig,
    RuntimeFilter,
    RuntimeParameter,
} from '../types';
import {
    getQueryParamString,
    checkReleaseVersionInBeta,
    getFilterQuery,
    getRuntimeParameters,
} from '../utils';
import { TsEmbed } from './ts-embed';
import { version } from '../../package.json';
import { ERROR_MESSAGE } from '../errors';
import { getAuthPromise, getEmbedConfig } from './base';
import { getReleaseVersion } from '../auth';

/**
 * Configuration for search options
 */
export interface SearchOptions {
    /**
     * The tml string to load the answer
     */
    searchTokenString: string;
    /**
     * Boolean to determine if the search should be executed or not.
     * if it is executed, put the focus on the results.
     * if it’s not executed, put the focus in the search bar - at the end of
     * the tokens
     */
    executeSearch?: boolean;
}

/**
 * The configuration attributes for the embedded search view.
 *
 * @group Embed components
 */
export interface SearchViewConfig
    extends Omit<
        ViewConfig,
        'hiddenHomepageModules' | 'hiddenHomeLeftNavItems' | 'hiddenTabs' | 'visibleTabs' | 'reorderedHomepageModules'
    > {
    /**
     * If set to true, the data sources panel is collapsed on load,
     * but can be expanded manually.
     */
    collapseDataSources?: boolean;
    /**
     * If set to true, hides the data sources panel.
     */
    hideDataSources?: boolean;
    /**
     * If set to true, hides the charts and tables in search answers.
     * This attribute can be used to create a custom visualization
     * using raw answer data.
     */
    hideResults?: boolean;
    /**
     * If set to true, the Search Assist feature is enabled.
     *
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1-sw
     */
    enableSearchAssist?: boolean;
    /**
     * If set to true, the tabular view is set as the default
     * format for presenting search data.
     */
    forceTable?: boolean;
    /**
     * The array of data source GUIDs to set on load.
     * Only a single dataSource supported currently.
     *
     * @deprecated Use dataSource instead
     */
    dataSources?: string[];
    /**
     * The array of data source GUIDs to set on load.
     *
     * @version: SDK: 1.19.0
     */
    dataSource?: string;
    /**
     * The initial search query to load the answer with.
     *
     * @deprecated Use {@link searchOptions} instead
     */
    searchQuery?: string;
    /**
     * Configuration for search options
     */
    searchOptions?: SearchOptions;
    /**
     * The GUID of a saved answer to load initially.
     */
    answerId?: string;
    /**
     * If set to true, search page will render without the Search Bar
     * The chart/table should still be visible.
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    hideSearchBar?: boolean;
    /**
     * Flag to control Data panel experience
     *
     * @default false
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    dataPanelV2?: boolean;
    /**
     * Flag to set if last selected dataSource should be used
     *
     * @version: SDK: 1.24.0
     */
    useLastSelectedSources?: boolean;
    /**
     * The list of parameter override to apply to a search answer.
     */
    runtimeParameters?: RuntimeParameter[];
}

export const HiddenActionItemByDefaultForSearchEmbed = [
    Action.EditACopy,
    Action.SaveAsView,
    Action.UpdateTML,
    Action.EditTML,
    Action.AnswerDelete,
];

/**
 * Embed ThoughtSpot search
 *
 * @group Embed components
 */
export class SearchEmbed extends TsEmbed {
    /**
     * The view configuration for the embedded ThoughtSpot search.
     */
    protected viewConfig: SearchViewConfig;

    protected embedComponentType = 'SearchEmbed';

    constructor(domSelector: DOMSelector, viewConfig: SearchViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
    }

    /**
     * Get the state of the data sources panel that the embedded
     * ThoughtSpot search will be initialized with.
     */
    private getDataSourceMode() {
        let dataSourceMode = DataSourceVisualMode.Expanded;
        if (this.viewConfig.collapseDataSources === true) {
            dataSourceMode = DataSourceVisualMode.Collapsed;
        }
        if (this.viewConfig.hideDataSources === true) {
            dataSourceMode = DataSourceVisualMode.Hidden;
        }

        return dataSourceMode;
    }

    protected getEmbedParams(): string {
        const {
            hideResults,
            enableSearchAssist,
            forceTable,
            searchOptions,
            runtimeFilters,
            dataSource,
            dataSources,
            excludeRuntimeFiltersfromURL,
            dataPanelV2 = false,
            useLastSelectedSources = false,
            runtimeParameters,
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
            queryParams[Param.searchTokenString] = encodeURIComponent(
                searchOptions.searchTokenString,
            );

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

        queryParams[Param.DataPanelV2Enabled] = dataPanelV2;
        queryParams[Param.DataSourceMode] = this.getDataSourceMode();

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

        const parameterQuery = getRuntimeParameters(runtimeParameters || []);
        if (parameterQuery) query += `&${parameterQuery}`;

        const filterQuery = getFilterQuery(runtimeFilters || []);
        if (filterQuery && !excludeRuntimeFiltersfromURL) {
            query += `&${filterQuery}`;
        }
        return query;
    }

    /**
     * Construct the URL of the embedded ThoughtSpot search to be
     * loaded in the iframe
     *
     * @param answerId The GUID of a saved answer
     * @param dataSources A list of data source GUIDs
     */
    private getIFrameSrc(answerId: string) {
        const answerPath = answerId ? `saved-answer/${answerId}` : 'answer';
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();

        return `${this.getRootIframeSrc()}/embed/${answerPath}${tsPostHashParams}`;
    }

    /**
     * Render the embedded ThoughtSpot search
     */
    public render(): SearchEmbed {
        super.render();
        const { answerId } = this.viewConfig;

        const src = this.getIFrameSrc(answerId);
        this.renderIFrame(src);
        getAuthPromise().then(() => {
            if (
                checkReleaseVersionInBeta(
                    getReleaseVersion(),
                    getEmbedConfig().suppressSearchEmbedBetaWarning,
                )
            ) {
                alert(ERROR_MESSAGE.SEARCHEMBED_BETA_WRANING_MESSAGE);
            }
        });
        return this;
    }
}
