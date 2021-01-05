/**
 * Copyright (c) 2021
 *
 * Embed pinboard or visualization
 * https://docs.thoughtspot.com/5.2/app-integrate/embedding-viz/embed-a-viz.html
 *
 * @summary Pinboard & viz embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { RuntimeFilter } from 'src/types';
import { getFilterQuery } from 'src/utils';
import { V1Embed, ViewConfig } from './base';

export interface PinboardViewConfig extends ViewConfig {
    fullHeight?: boolean;
    disabledActions?: string[];
    disabledActionReason: string;
}

export interface PinboardRenderOptions {
    pinboardId: string;
    vizId?: string;
    runtimeFilters?: RuntimeFilter[];
}

export class PinboardEmbed extends V1Embed {
    private getIFrameSrc(
        pinboardId: string,
        vizId?: string,
        runtimeFilters?: RuntimeFilter[],
    ) {
        const filterQuery = getFilterQuery(runtimeFilters);
        let url = `${this.getV1EmbedBasePath(filterQuery)}/viz/${pinboardId}`;
        if (vizId) {
            url = `${url}/${vizId}`;
        }

        return url;
    }

    public render({
        pinboardId,
        vizId,
        runtimeFilters,
    }: PinboardRenderOptions): PinboardEmbed {
        super.render();

        const src = this.getIFrameSrc(pinboardId, vizId, runtimeFilters);
        this.renderV1Embed(src);

        return this;
    }
}
