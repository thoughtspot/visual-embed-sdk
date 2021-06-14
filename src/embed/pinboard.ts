/**
 * Copyright (c) 2021
 *
 * Embed a ThoughtSpot pinboard or visualization
 * https://docs.thoughtspot.com/visual-embed-sdk/release/en/?pageid=embed-a-viz
 *
 * @summary Pinboard & visualization embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { ERROR_MESSAGE } from '../errors';
import {
    EmbedEvent,
    MessagePayload,
    Param,
    RuntimeFilter,
    DOMSelector,
} from '../types';
import { getFilterQuery, getQueryParamString } from '../utils';
import { V1Embed, ViewConfig } from './base';

/**
 * The configuration for the embedded pinboard or visualization page view.
 * @Category Pinboards and Charts
 */
export interface PinboardViewConfig extends ViewConfig {
    /**
     * If set to true, the iFrame will adjust to the full height
     * of the pinboard after loading.
     */
    fullHeight?: boolean;
    /**
     * If set to true, the context menu in visualizations will be enabled.
     */
    enableVizTransformations?: boolean;
    /**
     * The pinboard to display in the embedded view.
     */
    pinboardId: string;
    /**
     * The visualization within the pinboard to display.
     */
    vizId?: string;
}

/**
 * Embed a ThoughtSpot pinboard or visualization
 * @Category Pinboards and Charts
 */
export class PinboardEmbed extends V1Embed {
    protected viewConfig: PinboardViewConfig;

    // eslint-disable-next-line no-useless-constructor
    constructor(domSelector: DOMSelector, viewConfig: PinboardViewConfig) {
        super(domSelector, viewConfig);
    }

    /**
     * Construct a map of params to be passed on to the
     * embedded pinboard or visualization.
     */
    private getEmbedParams() {
        const params = {};
        const {
            disabledActions,
            disabledActionReason,
            hiddenActions,
            enableVizTransformations,
            fullHeight,
        } = this.viewConfig;

        if (fullHeight === true) {
            params[Param.fullHeight] = true;
        }
        if (disabledActions?.length) {
            params[Param.DisableActions] = disabledActions;
        }
        if (disabledActionReason) {
            params[Param.DisableActionReason] = disabledActionReason;
        }
        if (hiddenActions?.length) {
            params[Param.HideActions] = hiddenActions;
        }
        if (enableVizTransformations !== undefined) {
            params[
                Param.EnableVizTransformations
            ] = enableVizTransformations.toString();
        }

        const queryParams = getQueryParamString(params, true);

        return queryParams;
    }

    /**
     * Construct the URL of the embedded ThoughtSpot pinboard or visualization
     * to be loaded within the iframe.
     * @param pinboardId The GUID of the pinboard.
     * @param vizId The optional GUID of a visualization within the pinboard.
     * @param runtimeFilters A list of runtime filters to be applied to
     * the pinboard or visualization on load.
     */
    private getIFrameSrc(
        pinboardId: string,
        vizId?: string,
        runtimeFilters?: RuntimeFilter[],
    ) {
        const filterQuery = getFilterQuery(runtimeFilters || []);
        const queryParams = this.getEmbedParams();
        const queryString = [filterQuery, queryParams]
            .filter(Boolean)
            .join('&');
        let url = `${this.getV1EmbedBasePath(
            queryString,
            true,
            false,
            false,
        )}/viz/${pinboardId}`;
        if (vizId) {
            url = `${url}/${vizId}`;
        }

        return url;
    }

    /**
     * Set the iframe height as per the computed height received
     * from the ThoughtSpot app.
     * @param data The event payload
     */
    private updateIFrameHeight = (data: MessagePayload) => {
        this.setIFrameHeight(data.data);
    };

    /**
     * Render an embedded ThoughtSpot pinboard or visualization
     * @param renderOptions An object specifying the pinboard ID,
     * visualization ID and the runtime filters.
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
