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
    disabledActionReason?: string;
    hiddenActions?: Action[];
    enableVizTransformations?: boolean;
}

export interface PinboardRenderOptions {
    pinboardId: string;
    vizId?: string;
    runtimeFilters?: RuntimeFilter[];
}

/**
 * Embed a ThoughtSpot pinboard or visualization
 */
export class PinboardEmbed extends V1Embed {
    protected viewConfig: PinboardViewConfig;

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
            enableVizTransformations,
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
        if (enableVizTransformations) {
            params[Param.EnableVizTransformations] = true;
        }

        const queryParams = getQueryParamString(params);

        return queryParams;
    }

    /**
     * Construct the URL of the embedded ThoughtSpot pinboard or viz
     * to be loaded within the iframe
     * @param pinboardId The GUID of the pinboard
     * @param vizId The optional GUID of a visualization within the pinboard
     * @param runtimeFilters A list of runtime filters to be applied to
     * the pinboard or viz on load
     */
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

    /**
     * Render an embedded ThoughtSpot pinboard or viz
     * @param renderOptions An object specifying the pinboard id,
     * viz id and the runtime filters
     */
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
