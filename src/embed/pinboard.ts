/**
 * Copyright (c) 2021
 *
 * Embed pinboard or visualization
 * https://docs.thoughtspot.com/5.2/app-integrate/embedding-viz/embed-a-viz.html
 *
 * @summary Pinboard & viz embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { Action, Param, RuntimeFilter } from '../types';
import { getFilterQuery, getQueryParamString } from '../utils';
import { V1Embed, ViewConfig } from './base';

export interface PinboardViewConfig extends ViewConfig {
    fullHeight?: boolean;
    disabledActions?: Action[];
    disabledActionReason: string;
    hiddenActions?: Action[];
}

export interface PinboardRenderOptions {
    pinboardId: string;
    vizId?: string;
    runtimeFilters?: RuntimeFilter[];
}

export class PinboardEmbed extends V1Embed {
    protected viewConfig: PinboardViewConfig;

    private getEmbedParams() {
        const params = {};
        const {
            disabledActions,
            disabledActionReason,
            hiddenActions,
        } = this.viewConfig;
        if (disabledActions && disabledActions.length) {
            const disabledActionsString = disabledActions.join(',');
            params[Param.DisableActions] = disabledActionsString;
        }
        if (disabledActionReason) {
            params[Param.DisableActionReason] = disabledActionReason;
        }
        if (hiddenActions && hiddenActions.length) {
            params[Param.HideActions] = hiddenActions.join(',');
        }

        const queryParams = getQueryParamString(params);

        return queryParams;
    }

    private getIFrameSrc(
        pinboardId: string,
        vizId?: string,
        runtimeFilters?: RuntimeFilter[],
    ) {
        const filterQuery = getFilterQuery(runtimeFilters || []);
        let url = `${this.getV1EmbedBasePath(filterQuery)}/viz/${pinboardId}`;
        if (vizId) {
            url = `${url}/${vizId}`;
        }
        const postHashQueryParams = this.getEmbedParams();
        if (postHashQueryParams) {
            url = `${url}?${postHashQueryParams}`;
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
