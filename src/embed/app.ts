/**
 * Copyright (c) 2022
 *
 * Full application embedding
 * https://developers.thoughtspot.com/docs/?pageid=full-embed
 *
 * @summary Full app embed
 * @module
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { getFilterQuery, getQueryParamString } from '../utils';
import { Param, RuntimeFilter, DOMSelector, HostEvent } from '../types';
import { V1Embed, ViewConfig } from './ts-embed';

/**
 * Pages within the ThoughtSpot app that can be embedded.
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
     * Liveboards listing page
     */
    Liveboards = 'liveboards',
    /**
     * @hidden
     */
    Pinboards = 'pinboards',
    /**
     * Data management page
     */
    Data = 'data',
    /**
     * SpotIQ listing page
     */
    SpotIQ = 'spotiq',
}

/**
 * The view configuration for full app embedding.
 * @Category App Embed
 */
export interface AppViewConfig extends ViewConfig {
    /**
     * If true, the main navigation bar within the ThoughtSpot app
     * is displayed. By default, the navigation bar is hidden.
     */
    showPrimaryNavbar?: boolean;
    /**
     * If true, help and profile buttons will hide on NavBar. By default,
     * they are shown.
     */
    disableProfileAndHelp?: boolean;
    /**
     * A URL path within the app that is to be embedded.
     * If both path and pageId attributes are defined, the path definition
     * takes precedence.
     */
    path?: string;
    /**
     * The application page to set as the start page
     * in the embedded view.
     */
    pageId?: Page;
    /**
     * This puts a filter tag on the application. All metadata lists in the application, such as
     * Liveboards and answers, would be filtered by this tag.
     */
    tag?: string;
    /**
     * The array of GUIDs to be hidden
     */
    hideObjects?: string[];
    /**
     * Render liveboards using the new v2 rendering mode
     * This is a transient flag which is primarily meant for internal use
     * @default false
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     * @hidden
     */
    liveboardV2?: boolean;
    /**
     * If set to true, the Search Assist feature is enabled.
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1-sw
     */
    enableSearchAssist?: boolean;
}

/**
 * Embeds full ThoughtSpot experience in a host application.
 * @Category App Embed
 */
export class AppEmbed extends V1Embed {
    protected viewConfig: AppViewConfig;

    // eslint-disable-next-line no-useless-constructor
    constructor(domSelector: DOMSelector, viewConfig: AppViewConfig) {
        super(domSelector, viewConfig);
    }

    /**
     * Constructs a map of parameters to be passed on to the
     * embedded Liveboard or visualization.
     */
    private getEmbedParams() {
        const params = this.getBaseQueryParams();
        const { tag, hideObjects, liveboardV2 = false } = this.viewConfig;

        if (tag) {
            params[Param.Tag] = tag;
        }
        if (hideObjects && hideObjects.length) {
            params[Param.HideObjects] = JSON.stringify(hideObjects);
        }

        params[Param.LiveboardV2Enabled] = liveboardV2;
        const queryParams = getQueryParamString(params, true);

        return queryParams;
    }

    /**
     * Constructs the URL of the ThoughtSpot app page to be rendered.
     * @param pageId The ID of the page to be embedded.
     */
    private getIFrameSrc(pageId: string, runtimeFilters: RuntimeFilter[]) {
        const filterQuery = getFilterQuery(runtimeFilters || []);
        const queryParams = this.getEmbedParams();
        const queryString = [filterQuery, queryParams]
            .filter(Boolean)
            .join('&');
        let url = `${this.getV1EmbedBasePath(
            queryString,
            this.viewConfig.showPrimaryNavbar,
            this.viewConfig.disableProfileAndHelp,
            true,
            this.viewConfig.enableSearchAssist,
        )}/${pageId}`;

        const tsPostHashParams = this.getThoughtSpotPostUrlParams();
        url = `${url}${tsPostHashParams}`;

        return url;
    }

    /**
     * Gets the ThoughtSpot route of the page for a particular page ID.
     * @param pageId The identifier for a page in the ThoughtSpot app.
     */
    private getPageRoute(pageId: Page) {
        switch (pageId) {
            case Page.Search:
                return 'answer';
            case Page.Answers:
                return 'answers';
            case Page.Liveboards:
                return 'pinboards';
            case Page.Pinboards:
                return 'pinboards';
            case Page.Data:
                return 'data/tables';
            case Page.SpotIQ:
                return 'insights/results';
            case Page.Home:
            default:
                return 'home';
        }
    }

    /**
     * Formats the path provided by the user.
     * @param path The URL path.
     * @returns The URL path that the embedded app understands.
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
     * Navigate to particular page for app embed. eg:answers/pinboards/home
     * This is used for embedding answers, pinboards, visualizations and full application only.
     * @param path string | number The string, set to iframe src and navigate to new page
     * eg: appEmbed.navigateToPage('pinboards')
     * When used with `noReload` this can also be a number like 1/-1 to go forward/back.
     * @param noReload boolean Trigger the navigation without reloading the page
     * @version SDK: 1.12.0 | ThoughtSpot: 8.4.0.cl, 8.4.1-sw
     */
    public navigateToPage(path: string | number, noReload = false): void {
        if (!this.iFrame) {
            console.log('Please call render before invoking this method');
            return;
        }
        if (noReload) {
            this.trigger(HostEvent.Navigate, path);
        } else {
            if (typeof path !== 'string') {
                console.warn(
                    'Path can only by a string when triggered without noReload',
                );
                return;
            }
            const iframeSrc = this.iFrame.src;
            const embedPath = '#/embed';
            const currentPath = iframeSrc.includes(embedPath) ? embedPath : '#';
            this.iFrame.src = `${
                iframeSrc.split(currentPath)[0]
            }${currentPath}/${path.replace(/^\/?#?\//, '')}`;
        }
    }

    /**
     * Renders the embedded application pages in the ThoughtSpot app.
     * @param renderOptions An object containing the page ID
     * to be embedded.
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
