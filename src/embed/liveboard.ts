/**
 * Copyright (c) 2022
 *
 * Embed a ThoughtSpot Liveboard or visualization
 * https://developers.thoughtspot.com/docs/?pageid=embed-pinboard
 * https://developers.thoughtspot.com/docs/?pageid=embed-a-viz
 *
 * @summary Liveboard & visualization embed
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
 * The configuration for the embedded Liveboard or visualization page view.
 * @Category Liveboards and Charts
 */
export interface LiveboardViewConfig extends ViewConfig {
    /**
     * If set to true, the embedded object container dynamically resizes
     * according to the height of the Liveboard.
     */
    fullHeight?: boolean;
    /**
     * This is the minimum height(in pixels) for a full height Liveboard.
     * Setting this height helps resolves issues with empty Liveboards and
     * other screens navigable from a Liveboard.
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     * @default 500
     */
    defaultHeight?: number;
    /**
     * If set to true, the context menu in visualizations will be enabled.
     */
    enableVizTransformations?: boolean;
    /**
     * The Liveboard to display in the embedded view.
     * Use either of liveboardId or pinboardId to reference the Liveboard to embed.
     */
    liveboardId?: string;
    /**
     * To support backward compatibility
     * @hidden
     */
    pinboardId?: string;
    /**
     * The visualization within the Liveboard to display.
     */
    vizId?: string;
    /**
     * If set to true, all filter chips from a
     * Liveboard page will be read-only (no X buttons)
     */
    preventLiveboardFilterRemoval?: boolean;
    /**
     * Array of viz ids which should be visible when the liveboard
     * first renders. This can be changed by triggering the "SetVisibleVizs"
     * event.
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     */
    visibleVizs?: string[];
    /**
     * To support backward compatibilty
     * @hidden
     */
    preventPinboardFilterRemoval?: boolean;
    /**
     * Render embedded Liveboards and visualizations in the new Liveboard experience mode
     * @default false
     * @version SDK: 1.14.0 | ThoughtSpot: 8.6.0.cl, 8.8.1-sw
     */
    liveboardV2?: boolean;
    /**
     * Tab Id of the Liveboard that is supposed to be active
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    activeTabId?: string;
}

/**
 * Embed a ThoughtSpot Liveboard or visualization
 * @Category Liveboards and Charts
 */
export class LiveboardEmbed extends V1Embed {
    protected viewConfig: LiveboardViewConfig;

    private defaultHeight = 500;

    // eslint-disable-next-line no-useless-constructor
    constructor(domSelector: DOMSelector, viewConfig: LiveboardViewConfig) {
        super(domSelector, viewConfig);
    }

    /**
     * Construct a map of params to be passed on to the
     * embedded Liveboard or visualization.
     */
    private getEmbedParams() {
        const params = this.getBaseQueryParams();
        const {
            enableVizTransformations,
            fullHeight,
            defaultHeight,
            visibleVizs,
            liveboardV2 = false,
            vizId,
            activeTabId,
        } = this.viewConfig;

        const preventLiveboardFilterRemoval =
            this.viewConfig.preventLiveboardFilterRemoval ||
            this.viewConfig.preventPinboardFilterRemoval;

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
        if (preventLiveboardFilterRemoval) {
            params[Param.preventLiveboardFilterRemoval] = true;
        }
        if (visibleVizs) {
            params[Param.visibleVizs] = visibleVizs;
        }
        params[Param.livedBoardEmbed] = true;
        if (vizId) {
            params[Param.vizEmbed] = true;
        }
        params[Param.LiveboardV2Enabled] = liveboardV2;
        const queryParams = getQueryParamString(params, true);

        return queryParams;
    }

    /**
     * Construct the URL of the embedded ThoughtSpot Liveboard or visualization
     * to be loaded within the iframe.
     * @param liveboardId The GUID of the Liveboard.
     * @param vizId The optional GUID of a visualization within the Liveboard.
     * @param runtimeFilters A list of runtime filters to be applied to
     * the Liveboard or visualization on load.
     */
    private getIFrameSrc(
        liveboardId: string,
        vizId?: string,
        runtimeFilters?: RuntimeFilter[],
        activeTabId?: string,
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
        )}/viz/${liveboardId}`;
        if (activeTabId) {
            url = `${url}/tab/${activeTabId}`;
        }
        if (vizId) {
            url = `${url}/${vizId}`;
        }

        const tsPostHashParams = this.getThoughtSpotPostUrlParams();
        url = `${url}${tsPostHashParams}`;

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

    private setIframeHeightForNonEmbedLiveboard = (data: MessagePayload) => {
        if (!data.data.currentPath.startsWith('/embed/viz/')) {
            this.setIFrameHeight(this.defaultHeight);
        }
    };

    /**
     * Triggers an event to the embedded app
     * @param messageType The event type
     * @param data The payload to send with the message
     */
    public trigger(messageType: HostEvent, data: any = {}): Promise<any> {
        const dataWithVizId = data;
        if (this.viewConfig.vizId) {
            dataWithVizId.vizId = this.viewConfig.vizId;
        }
        return super.trigger(messageType, dataWithVizId);
    }

    /**
     * Render an embedded ThoughtSpot Liveboard or visualization
     * @param renderOptions An object specifying the Liveboard ID,
     * visualization ID and the runtime filters.
     */
    public render(): LiveboardEmbed {
        const { vizId, activeTabId, runtimeFilters } = this.viewConfig;
        const liveboardId =
            this.viewConfig.liveboardId ?? this.viewConfig.pinboardId;

        if (!liveboardId) {
            this.handleError(ERROR_MESSAGE.LIVEBOARD_VIZ_ID_VALIDATION);
        }

        if (this.viewConfig.fullHeight === true) {
            this.on(
                EmbedEvent.RouteChange,
                this.setIframeHeightForNonEmbedLiveboard,
            );
            this.on(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
            this.on(EmbedEvent.EmbedIframeCenter, this.embedIframeCenter);
        }

        super.render();

        const src = this.getIFrameSrc(
            liveboardId,
            vizId,
            runtimeFilters,
            activeTabId,
        );
        this.renderV1Embed(src);

        return this;
    }
}

/**
 * @hidden
 */
export class PinboardEmbed extends LiveboardEmbed {}
