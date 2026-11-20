import {
    BaseViewConfig,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    ErrorDetailsTypes,
    Param,
} from '../types';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
import { TsEmbed } from './ts-embed';

/**
 * The view configuration for an embedded App.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
 * @group Embed components
 */
export interface DataAppEmbedViewConfig {
    /**
     * The ID of the App to embed. The App opens on its published version.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     * });
     * ```
     */
    dataAppId: string;
}

/**
 * Embed a single ThoughtSpot App by its ID.
 *
 * The App fills its container element: `fullHeight` is not supported. Apps
 * must be turned on for the ThoughtSpot instance.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
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
        super(container, config);
    }

    protected getEmbedParamsObject() {
        const params = this.getBaseQueryParams();
        // Embedding an App is the opt-in, so Apps are always on in this embed.
        params[Param.EnableDataApps] = true;
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
