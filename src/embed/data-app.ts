import {
    BaseViewConfig,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    ErrorDetailsTypes,
    Param,
    RuntimeFilter,
    RuntimeParameter,
} from '../types';
import { ERROR_MESSAGE } from '../errors';
import { setParamIfDefined } from '../utils';
import { logger } from '../utils/logger';
import { TsEmbed } from './ts-embed';

/**
 * The view configuration for an embedded App.
 * @version SDK: <TBD> | ThoughtSpot Cloud: 26.12.0.cl
 * @group Embed components
 */
export interface DataAppEmbedViewConfig extends Omit<BaseViewConfig, 'primaryAction'> {
    /**
     * The ID of the App to embed. The App opens on its published version.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: <TBD> | ThoughtSpot Cloud: 26.12.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    ... // other options
     *    dataAppId: '<app-id>',
     * });
     * ```
     */
    dataAppId: string;
    /**
     * Turns Apps on in the embed. Until it is `true`, the frame shows a
     * not-available message instead of the App. Apps must also be turned on
     * for the ThoughtSpot instance; this flag cannot turn them on by itself.
     *
     * Supported embed types: `AppEmbed`, `DataAppEmbed`
     * @version SDK: <TBD> | ThoughtSpot Cloud: 26.12.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    ... // other options
     *    dataAppId: '<app-id>',
     *    enableDataApps: true,
     * });
     * ```
     */
    enableDataApps?: boolean;
    /**
     * Runtime filters for the App, in the Liveboard shape. They apply from
     * the App's first load; change them later with
     * `HostEvent.UpdateRuntimeFilters` or `HostEvent.DataAppInit`.
     * They are sent in the app init payload, never in the URL.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: <TBD> | ThoughtSpot Cloud: 26.12.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    ... // other options
     *    dataAppId: '<app-id>',
     *    runtimeFilters: [
     *        { columnName: 'Region', operator: RuntimeFilterOp.EQ, values: ['West'] },
     *    ],
     * });
     * ```
     */
    runtimeFilters?: RuntimeFilter[];
    /**
     * Runtime parameters for the App. They apply from the App's first load;
     * change them later with `HostEvent.UpdateParameters` or
     * `HostEvent.DataAppInit`. They are sent in the app init payload,
     * never in the URL.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: <TBD> | ThoughtSpot Cloud: 26.12.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    ... // other options
     *    dataAppId: '<app-id>',
     *    runtimeParameters: [{ name: 'Target', value: 1000 }],
     * });
     * ```
     */
    runtimeParameters?: RuntimeParameter[];
    /**
     * Hides the ThoughtSpot header above the App, with its name and
     * actions, so the App fills the frame.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: <TBD> | ThoughtSpot Cloud: 26.12.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    ... // other options
     *    dataAppId: '<app-id>',
     *    hideDataAppHeader: true,
     * });
     * ```
     */
    hideDataAppHeader?: boolean;
}

/**
 * Embed a single ThoughtSpot App by its ID.
 *
 * The App renders at a fixed height: `fullHeight` is not supported.
 * @version SDK: <TBD> | ThoughtSpot Cloud: 26.12.0.cl
 * @group Embed components
 * @example
 * ```js
 * const embed = new DataAppEmbed('#tsEmbed', {
 *   dataAppId: '<app-id>',
 *   enableDataApps: true,
 *   frameParams: { height: '800px' },
 * });
 * embed.render();
 * ```
 */
export class DataAppEmbed extends TsEmbed {
    constructor(container: HTMLElement, protected viewConfig: DataAppEmbedViewConfig) {
        viewConfig = {
            embedComponentType: 'dataApp',
            ...viewConfig,
            // Filters and parameters go in the app init payload, never the URL.
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
        } as DataAppEmbedViewConfig;
        // Not in the view config type, but a JS caller can still pass it.
        if ((viewConfig as { fullHeight?: boolean }).fullHeight) {
            logger.warn('DataAppEmbed does not support fullHeight; it is ignored.');
            viewConfig = { ...viewConfig, fullHeight: false } as DataAppEmbedViewConfig;
        }
        super(container, viewConfig);
    }

    protected getEmbedParamsObject() {
        const params = this.getBaseQueryParams();
        setParamIfDefined(params, Param.EnableDataApps, this.viewConfig.enableDataApps, true);
        setParamIfDefined(
            params,
            Param.HideDataAppHeader,
            this.viewConfig.hideDataAppHeader,
            true,
        );
        return params;
    }

    /**
     * The URL of the App page, on the blink-v2 shell.
     */
    public getIframeSrc(): string {
        const path = `embed/insights/apps/${encodeURIComponent(this.viewConfig.dataAppId)}`;
        return `${this.getRootIframeSrc()}/${path}${this.getThoughtSpotPostUrlParams()}`;
    }

    public async render(): Promise<DataAppEmbed> {
        await super.render();

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

        await this.renderIFrame(this.getIframeSrc());
        return this;
    }
}
