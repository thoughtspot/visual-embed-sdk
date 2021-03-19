/**
 * Copyright (c) 2021
 *
 * Full application embedding
 * https://docs.thoughtspot.com/5.2/app-integrate/embedding-viz/about-full-embed.html
 *
 * @summary Full app embed
 * @module
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { getFilterQuery, getQueryParamString } from '../utils';
import { Param, RuntimeFilter, DOMSelector } from '../types';
import { V1Embed, ViewConfig } from './base';

/**
 * Pages within the ThoughtSpot app that can be embedded
 */
// eslint-disable-next-line no-shadow
export enum Page {
    /**
     * Home page
     */
    Home = 'home',
    /**
     * Search page
     */
    Search = 'search',
    /**
     * Saved answers listing page
     */
    Answers = 'answers',
    /**
     * Pinboards listing page
     */
    Pinboards = 'pinboards',
    /**
     * Data management page
     */
    Data = 'data',
}

/**
 * The view configuration for full app embedding
 * @Category App Embed
 */
export interface AppViewConfig extends ViewConfig {
    /**
     * If true, the main navigation bar within the ThoughtSpot app
     * is displayed (hidden by default)
     */
    showPrimaryNavbar?: boolean;
    /**
     * An URL path within the app that is to be embedded
     */
    path?: string;
    /**
     * The page to load initially in the embedded view
     */
    pageId?: Page;
}

/**
 * Embed a page within the ThoughtSpot app
 * @Category App Embed
 */
export class AppEmbed extends V1Embed {
    protected viewConfig: AppViewConfig;

    // eslint-disable-next-line no-useless-constructor
    constructor(domSelector: DOMSelector, viewConfig: AppViewConfig) {
        super(domSelector, viewConfig);
    }

    /**
     * Construct a map of params to be passed on to the
     * embedded pinboard or viz
     */
    private getEmbedParams() {
        const params = {};
        const {
            disabledActions,
            disabledActionReason,
            hiddenActions,
        } = this.viewConfig;

        if (disabledActions?.length) {
            params[Param.DisableActions] = disabledActions;
        }
        if (disabledActionReason) {
            params[Param.DisableActionReason] = disabledActionReason;
        }
        if (hiddenActions?.length) {
            params[Param.HideActions] = hiddenActions;
        }

        const queryParams = getQueryParamString(params);

        return queryParams;
    }

    /**
     * Construct the URL of the ThoughtSpot app page to be rendered
     * @param pageId The id of the page to be embedded
     */
    private getIFrameSrc(pageId: string, runtimeFilters: RuntimeFilter[]) {
        const filterQuery = getFilterQuery(runtimeFilters || []);
        let url = `${this.getV1EmbedBasePath(
            filterQuery,
            this.viewConfig.showPrimaryNavbar,
            true,
        )}/${pageId}`;

        const postHashQueryParams = this.getEmbedParams();
        if (postHashQueryParams) {
            url = `${url}?${postHashQueryParams}`;
        }

        return url;
    }

    /**
     * Get the ThoughtSpot route of the page for a particular page id
     * @param pageId The identifier for a page in the ThoughtSpot app
     */
    private getPageRoute(pageId: Page) {
        switch (pageId) {
            case Page.Search:
                return 'answer';
            case Page.Answers:
                return 'answers';
            case Page.Pinboards:
                return 'pinboards';
            case Page.Data:
                return 'data/tables';
            case Page.Home:
            default:
                return 'home';
        }
    }

    /**
     * Format the path provided by the user
     * @param path The URL path
     * @returns The URL path that the embedded app understands
     */
    private formatPath(path: string) {
        if (!path) {
            return null;
        }

        // remove leading slash
        if (path.indexOf('/') === 0) {
            return path.substring(1);
        }

        return path;
    }

    /**
     * Render an embedded app in the ThoughtSpot app
     * @param renderOptions An object containing the page id
     * to be embedded
     */
    public render(): AppEmbed {
        super.render();

        const { pageId, runtimeFilters, path } = this.viewConfig;
        const pageRoute = this.formatPath(path) || this.getPageRoute(pageId);
        const src = this.getIFrameSrc(pageRoute, runtimeFilters);
        this.renderV1Embed(src);

        return this;
    }
}
