import { DOMSelector, Param, Action } from '../types';
import { getQueryParamString } from '../utils';
import { TsEmbed, ViewConfig } from './ts-embed';
import { SearchOptions } from './search';

export interface SearchBarViewConfig extends ViewConfig {
    /**
     * If set to true, hides the data sources panel.
     */
    hideDataSources?: boolean;
    /**
     * The array of data source GUIDs to set on load.
     */
    dataSources?: string[];
    /**
     * Configuration for search options
     */
    searchOptions?: SearchOptions;
}

/**
 * Embed ThoughtSpot search bar
 *
 * @Category Search Embed
 * @version: unreleased version
 * @hidden
 */
export class SearchBarEmbed extends TsEmbed {
    /**
     * The view configuration for the embedded ThoughtSpot search bar.
     */
    protected viewConfig: SearchBarViewConfig;

    constructor(domSelector: string, viewConfig: SearchBarViewConfig) {
        super(domSelector);
        this.viewConfig = viewConfig;
    }

    /**
     * Construct the URL of the embedded ThoughtSpot search to be
     * loaded in the iframe
     * @param dataSources A list of data source GUIDs
     */
    private getIFrameSrc(dataSources?: string[]) {
        const { searchOptions } = this.viewConfig;
        const path = 'search-bar-embed';
        const queryParams = this.getBaseQueryParams();

        queryParams[Param.HideActions] = [
            ...(queryParams[Param.HideActions] ?? []),
        ];

        if (dataSources && dataSources.length) {
            queryParams[Param.DataSources] = JSON.stringify(dataSources);
        }
        if (searchOptions?.searchTokenString) {
            queryParams[Param.searchTokenString] = encodeURIComponent(
                searchOptions.searchTokenString,
            );

            if (searchOptions.executeSearch) {
                queryParams[Param.executeSearch] = true;
            }
        }

        queryParams[Param.UseLastSelectedDataSource] = false;
        queryParams[Param.searchEmbed] = true;
        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();

        return `${this.getEmbedBasePath(query)}/${path}${tsPostHashParams}`;
    }

    /**
     * Render the embedded ThoughtSpot search
     */
    public render(): SearchBarEmbed {
        super.render();
        const { dataSources } = this.viewConfig;

        const src = this.getIFrameSrc(dataSources);
        this.renderIFrame(src, this.viewConfig.frameParams);
        return this;
    }
}
