/**
 * Copyright (c) 2021
 *
 * Full application embedding
 * https://docs.thoughtspot.com/5.2/app-integrate/embedding-viz/about-full-embed.html
 *
 * @summary Full app embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { V1Embed, ViewConfig } from './base';

// eslint-disable-next-line no-shadow
export enum Page {
    Home = 'home',
    Search = 'search',
    Answers = 'answers',
    Pinboards = 'pinboards',
    Data = 'data',
}

export interface AppViewConfig extends ViewConfig {
    hidePrimaryNavbar?: boolean;
}

export interface AppRenderOptions {
    pageId?: Page;
}

/**
 * Embed a page within the ThoughtSpot app
 */
export class AppEmbed extends V1Embed {
    protected viewConfig: AppViewConfig;

    /**
     * Construct the URL of the ThoughtSpot app page to be rendered
     * @param pageId The id of the page to be embedded
     */
    private getIFrameSrc(pageId: string) {
        return `${this.getV1EmbedBasePath(
            null,
            this.viewConfig.hidePrimaryNavbar,
            true,
        )}/${pageId}`;
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
     * Render an embedded app in the ThoughtSpot app
     * @param renderOptions An object containing the page id
     * to be embedded
     */
    public render({ pageId }: AppRenderOptions): AppEmbed {
        super.render();

        const pageRoute = this.getPageRoute(pageId);
        const src = this.getIFrameSrc(pageRoute);
        this.renderV1Embed(src);

        return this;
    }
}
