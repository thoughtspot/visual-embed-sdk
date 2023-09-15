import { Param, ViewConfig } from '../types';
import { getQueryParamString } from '../utils';
import { TsEmbed } from './ts-embed';
import { SearchOptions } from './search';

/**
 * @group Embed components
 */
export interface SearchBarViewConfig
    extends Omit<ViewConfig, 'runtimeFilters' | 'showAlerts' | 'dataPanelV2'> {
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
     * Flag to set if last selected dataSource should be used
     *
     * @version: SDK: 1.24.0
     */
    useLastSelectedSources?: boolean;
    /**
     * Configuration for search options
     */
    searchOptions?: SearchOptions;
}

/**
 * Embed ThoughtSpot search bar
 *
 * @version: SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1-sw
 * @group Embed components
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
     *
     * @param dataSources A list of data source GUIDs
     */
    private getIFrameSrc() {
        const {
            searchOptions,
            dataSource,
            dataSources,
            useLastSelectedSources = false,
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
        if (searchOptions?.searchTokenString) {
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
    public render(): SearchBarEmbed {
        super.render();

        const src = this.getIFrameSrc();
        this.renderIFrame(src);
        return this;
    }
}
