import {
    BaseViewConfig,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    ErrorDetailsTypes,
    RuntimeFilter,
    RuntimeParameter,
} from '../types';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
import { TsEmbed } from './ts-embed';

/**
 * The view configuration for an embedded App.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Embed components
 */
export interface DataAppEmbedViewConfig {
    /**
     * The ID of the App to embed. The App opens on its published version.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     * });
     * ```
     */
    dataAppId: string;
    /**
     * Runtime filters applied to every ThoughtSpot data step of the App, on
     * top of the filters the viewer picks in it. A filter names a column of
     * the step's Model; a step whose Model has no such column is not
     * filtered by it, as on a Liveboard. Filters are sent when the App opens,
     * never in the URL.
     *
     * Runtime filters do not reach the App's agent steps that ask Spotter,
     * or data from connectors. While any are set, the App's Spotter chat is
     * not shown.
     *
     * To change them after the App opens, use `HostEvent.UpdateRuntimeFilters`.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    runtimeFilters: [
     *        { columnName: 'Region', operator: RuntimeFilterOp.IN, values: ['West', 'East'] },
     *    ],
     * });
     * ```
     */
    runtimeFilters?: RuntimeFilter[];
    /**
     * Runtime parameter values applied to every ThoughtSpot data step of the
     * App whose Model defines the parameter. Sent when the App opens, never in
     * the URL.
     *
     * To change them after the App opens, use `HostEvent.UpdateParameters`.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    runtimeParameters: [{ name: 'Discount', value: 10 }],
     * });
     * ```
     */
    runtimeParameters?: RuntimeParameter[];
}

/**
 * Embed a single ThoughtSpot App by its ID.
 *
 * The App fills its container element: `fullHeight` is not supported. Apps
 * must be turned on for the ThoughtSpot instance.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Embed components
 * @example
 * ```js
 * const embed = new DataAppEmbed('#tsEmbed', {
 *   dataAppId: '<app-id>',
 * });
 * embed.render();
 * ```
 */
export class DataAppEmbed extends TsEmbed {
    protected viewConfig: DataAppEmbedViewConfig & BaseViewConfig;

    constructor(container: HTMLElement, viewConfig: DataAppEmbedViewConfig) {
        let config: DataAppEmbedViewConfig & BaseViewConfig = {
            embedComponentType: 'dataApp',
            ...viewConfig,
        };
        // Not in the view config type, but a JS caller can still pass it.
        if ((config as { fullHeight?: boolean }).fullHeight) {
            logger.warn('DataAppEmbed does not support fullHeight; it is ignored.');
            config = { ...config, fullHeight: false } as DataAppEmbedViewConfig;
        }
        // Runtime filters and parameters go in the init message only: a URL
        // would leave them in the browser history and the server logs.
        config = {
            ...config,
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
        } as DataAppEmbedViewConfig & BaseViewConfig;
        super(container, config);
    }

    /**
     * The URL of the App page, on the blink-v2 shell.
     */
    public getIframeSrc(): string {
        const path = `embed/insights/apps/${encodeURIComponent(this.viewConfig.dataAppId)}`;
        return `${this.getRootIframeSrc()}/${path}${this.getThoughtSpotPostUrlParams()}`;
    }

    public async render(): Promise<DataAppEmbed> {
        if (!this.viewConfig.dataAppId) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.DATA_APP_ID_MISSING,
                code: EmbedErrorCodes.DATA_APP_ID_MISSING,
                severity: EmbedErrorSeverity.SEV1,
                error: ERROR_MESSAGE.DATA_APP_ID_MISSING,
            });
            return this;
        }

        await super.render();
        await this.renderIFrame(this.getIframeSrc());
        return this;
    }
}
