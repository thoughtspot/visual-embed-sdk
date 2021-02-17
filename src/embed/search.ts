/**
 * Copyright (c) 2021
 *
 * Embed search or a saved answer
 *
 * @summary Search embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { Action, DataSourceVisualMode, DOMSelector, Param } from '../types';
import { getQueryParamString } from '../utils';
import { ViewConfig, TsEmbed } from './base';

export interface SearchViewConfig extends ViewConfig {
    collapseDataSources?: boolean;
    hideDataSources?: boolean;
    hideResults?: boolean;
    enableSearchAssist?: boolean;
    disabledActions?: Action[];
    disabledActionReason?: string;
    hiddenActions?: Action[];
}

export interface SearchRenderOptions {
    dataSources?: string[];
    searchQuery?: string;
    answerId?: string;
}

/**
 * Embed ThoughtSpot search
 */
export class SearchEmbed extends TsEmbed {
    /**
     * The view configuration for the embedded ThoughtSpot search
     */
    private viewConfig: SearchViewConfig;

    constructor(domSelector: DOMSelector, viewConfig: SearchViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
    }

    /**
     * Get the state of the data sources panel that the embedded
     * ThoughtSpot search will be initialized with
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

    /**
     * Construct the URL of the embedded ThoughtSpot search to be
     * loaded in the iframe
     * @param answerId The GUID of a saved answer
     * @param dataSources A list of data source GUIDs
     * @param searchQuery A search query to be fired on load
     */
    private getIFrameSrc(
        answerId: string,
        dataSources?: string[],
        searchQuery?: string,
    ) {
        const {
            disabledActions,
            disabledActionReason,
            hiddenActions,
            hideResults,
            enableSearchAssist,
        } = this.viewConfig;
        const answerPath = answerId ? `saved-answer/${answerId}` : 'answer';
        const queryParams = {};
        if (dataSources && dataSources.length) {
            queryParams[Param.DataSources] = JSON.stringify(dataSources);
        }
        if (searchQuery) {
            queryParams[Param.SearchQuery] = searchQuery;
        }
        if (enableSearchAssist) {
            queryParams[Param.EnableSearchAssist] = true;
        }
        if (hideResults) {
            queryParams[Param.HideResult] = true;
        }
        if (disabledActions?.length) {
            queryParams[Param.DisableActions] = disabledActions;
        }
        if (disabledActionReason) {
            queryParams[Param.DisableActionReason] = disabledActionReason;
        }
        if (hiddenActions?.length) {
            queryParams[Param.HideActions] = hiddenActions;
        }

        queryParams[Param.DataSourceMode] = this.getDataSourceMode();

        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }

        return `${this.getEmbedBasePath()}/${answerPath}${query}`;
    }

    /**
     * Render ThoughtSpot search
     * @param renderOptions An object specifying the list of dataSources,
     * searchQuery and answerId (for loading a saved answer)
     */
    public render({
        dataSources,
        searchQuery,
        answerId,
    }: SearchRenderOptions = {}): SearchEmbed {
        super.render();

        const src = this.getIFrameSrc(answerId, dataSources, searchQuery);
        this.renderIFrame(src, this.viewConfig.frameParams);

        return this;
    }
}
