/**
 * Copyright (c) 2021
 *
 * Embed search or a saved answer
 *
 * @summary Search embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { DataSourceVisualMode, DOMSelector, Param } from '../types';
import { getQueryParamString } from '../utils';
import { ViewConfig, TsEmbed } from './base';

export interface SearchViewConfig extends ViewConfig {
    collapseDataSources?: boolean;
    hideDataSources?: boolean;
    hideResults?: boolean;
    enableSearchAssist?: boolean;
    disabledActions?: string[];
    disabledActionReason?: string;
}

export interface SearchRenderOptions {
    dataSources?: string[];
    searchQuery?: string;
    answerId?: string;
}

export class SearchEmbed extends TsEmbed {
    private viewConfig: SearchViewConfig;

    constructor(domSelector: DOMSelector, viewConfig: SearchViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
    }

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

    private getIFrameSrc(
        answerId: string,
        dataSources?: string[],
        searchQuery?: string,
    ) {
        const answerPath = answerId ? `saved-answer/${answerId}` : 'answer';
        const queryParams = {};
        if (dataSources && dataSources.length) {
            queryParams[Param.DataSources] = JSON.stringify(dataSources);
        }
        if (searchQuery) {
            queryParams[Param.SearchQuery] = searchQuery;
        }

        queryParams[Param.DataSourceMode] = this.getDataSourceMode();

        let query = '';
        const queryParamsString = getQueryParamString(queryParams);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }

        return `${this.getEmbedBasePath()}/${answerPath}${query}`;
    }

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
