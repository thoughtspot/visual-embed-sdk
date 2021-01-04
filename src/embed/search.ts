/**
 * Copyright (c) 2021
 *
 * Embed search or a saved answer
 *
 * @summary Search embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import {
    DataSourceVisualMode,
    SearchRenderOptions,
    SearchViewConfig,
    VisualConfigParam,
} from 'src/types';
import { getQueryParamString } from 'src/utils';
import { TsEmbed } from './base';

export class SearchEmbed extends TsEmbed {
    private viewConfig: SearchViewConfig;

    constructor(domSelector: string, viewConfig: SearchViewConfig) {
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

    private getIFrameSrc(answerId: string, dataSources?: string[]) {
        const answerPath = answerId ? `saved-answer/${answerId}` : 'answer';
        const queryParams = {};
        if (dataSources && dataSources.length) {
            queryParams[VisualConfigParam.DataSources] = JSON.stringify(
                dataSources,
            );
        }

        queryParams[
            VisualConfigParam.DataSourceMode
        ] = this.getDataSourceMode();

        let query = '';
        const queryParamsString = getQueryParamString(queryParams);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }

        return `${this.getEmbedBasePath()}/${answerPath}${query}`;
    }

    public render({
        dataSources,
        query,
        answerId,
    }: SearchRenderOptions): SearchEmbed {
        super.render();

        const src = this.getIFrameSrc(answerId, dataSources);
        this.renderIFrame(src, this.viewConfig.frameParams);

        return this;
    }
}
