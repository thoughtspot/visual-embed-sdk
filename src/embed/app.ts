/**
 * Copyright (c) 2021
 *
 * Full application embedding
 * https://docs.thoughtspot.com/5.2/app-integrate/embedding-viz/about-full-embed.html
 *
 * @summary Full app embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { V1Embed } from './base';

// eslint-disable-next-line no-shadow
export enum Page {
    Home = 'home',
    Search = 'search',
    Answers = 'answers',
    Pinboards = 'pinboards',
    Data = 'data',
}

export interface AppRenderOptions {
    pageId: Page;
}

export class AppEmbed extends V1Embed {
    private getIFrameSrc(pageId: string) {
        return `${this.getV1EmbedBasePath(null, true)}/${pageId}`;
    }

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

    public render({ pageId }: AppRenderOptions): AppEmbed {
        super.render();

        const pageRoute = this.getPageRoute(pageId);
        const src = this.getIFrameSrc(pageRoute);
        this.renderV1Embed(src);

        return this;
    }
}
