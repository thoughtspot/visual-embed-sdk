/**
 * Copyright (c) 2021
 *
 * Embed pinboard or visualization
 * https://docs.thoughtspot.com/5.2/app-integrate/embedding-viz/embed-a-viz.html
 *
 * @summary Pinboard & viz embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { ERROR_MESSAGE } from '../errors';
import { EmbedEvent, MessagePayload, Param, RuntimeFilter } from '../types';
import { getFilterQuery, getQueryParamString } from '../utils';
import { V1Embed, ViewConfig } from './base';

/**
 * The configuration for the embedded pinboard view
 */
export interface PinboardViewConfig extends ViewConfig {
    /**
     * If set to true, the iFrame will adjust to the full height
     * of the pinboard after loading
     */
    fullHeight?: boolean;
    /**
     * If set to true, context menu in visualizations will be enabled
     */
    enableVizTransformations?: boolean;
    /**
     * The pinboard to display in the embedded view
     */
    pinboardId: string;
    /**
     * The visualization within the pinboard to display
     */
    vizId?: string;
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

        if (disabledActions?.length) {
            params[Param.DisableActions] = disabledActions;
        }
        if (disabledActionReason) {
            params[Param.DisableActionReason] = disabledActionReason;
        }
        if (hiddenActions?.length) {
            params[Param.HideActions] = hiddenActions;
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
        let url = `${this.getV1EmbedBasePath(
            filterQuery,
            true,
            false,
        )}/viz/${pinboardId}`;
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
     * Set the iframe height as per the computed height received
     * from the ThoughtSpot app
     * @param data The event payload
     */
    private updateIFrameHeight = (data: MessagePayload) => {
        this.setIFrameHeight(data.data);
    };

    /**
     * Render an embedded ThoughtSpot pinboard or viz
     * @param renderOptions An object specifying the pinboard id,
     * viz id and the runtime filters
     */
    public render(): PinboardEmbed {
        const { pinboardId, vizId, runtimeFilters } = this.viewConfig;

        if (!pinboardId && !vizId) {
            this.handleError(ERROR_MESSAGE.PINBOARD_VIZ_ID_VALIDATION);
        }

        if (this.viewConfig.fullHeight === true) {
            this.on(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
        }

        super.render();

        const src = this.getIFrameSrc(pinboardId, vizId, runtimeFilters);
        this.renderV1Embed(src);

        return this;
    }
}
