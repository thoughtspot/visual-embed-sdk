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
    HostEvent,
} from '../types';
import { getFilterQuery, getQueryParamString } from '../utils';
import { V1Embed, ViewConfig } from './ts-embed';

/**
 * The configuration for the embedded pinboard or visualization page view.
 * @Category Pinboards and Charts
 */
export interface PinboardViewConfig extends ViewConfig {
    /**
     * If set to true, the embedded object container dynamically resizes
     * according to the height of the pinboard.
     */
    fullHeight?: boolean;
    /**
     * This is the minimum height(in pixels) for a full height pinboard.
     * Setting this height helps resolves issues with empty pinboards and
     * other screens navigable from a pinboard.
     * @default 500
     * _since 1.5.0_
     */
    defaultHeight?: number;
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
    /**
     * If set to true, all filter chips from a
     * pinboard page will be read-only (no X buttons)
     */
    preventPinboardFilterRemoval?: boolean;
}

/**
 * Embed a ThoughtSpot pinboard or visualization
 * @Category Pinboards and Charts
 */
export class PinboardEmbed extends V1Embed {
    protected viewConfig: PinboardViewConfig;

    private defaultHeight = 500;

    // eslint-disable-next-line no-useless-constructor
    constructor(domSelector: DOMSelector, viewConfig: PinboardViewConfig) {
        super(domSelector, viewConfig);
    }

    /**
     * Construct a map of params to be passed on to the
     * embedded pinboard or visualization.
     */
    private getEmbedParams() {
        const params = this.getBaseQueryParams();
        const {
            enableVizTransformations,
            fullHeight,
            preventPinboardFilterRemoval,
            defaultHeight,
        } = this.viewConfig;

        if (fullHeight === true) {
            params[Param.fullHeight] = true;
        }
        if (defaultHeight) {
            this.defaultHeight = defaultHeight;
        }
        if (enableVizTransformations !== undefined) {
            params[
                Param.EnableVizTransformations
            ] = enableVizTransformations.toString();
        }
        if (preventPinboardFilterRemoval) {
            params[Param.preventPinboardFilterRemoval] = true;
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
        this.setIFrameHeight(Math.max(data.data, this.defaultHeight));
    };

    private embedIframeCenter = (data: MessagePayload, responder: any) => {
        const obj = this.getIframeCenter();
        responder({ type: EmbedEvent.EmbedIframeCenter, data: obj });
    };

    private handleRouteChangeFullHeightPinboard = (data: MessagePayload) => {
        if (
            data.data.canvasState !== 'EMBED' &&
            data.data.canvasState !== 'pinboard'
        ) {
            this.setIFrameHeight(this.defaultHeight);
        }
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
            this.on(
                EmbedEvent.RouteChange,
                this.handleRouteChangeFullHeightPinboard,
            );
            this.on(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
            this.on(EmbedEvent.EmbedIframeCenter, this.embedIframeCenter);
        }

        super.render();

        const src = this.getIFrameSrc(pinboardId, vizId, runtimeFilters);
        this.renderV1Embed(src);

        return this;
    }
}
