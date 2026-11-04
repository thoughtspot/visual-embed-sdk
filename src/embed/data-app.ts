import {
    BaseViewConfig,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    ErrorDetailsTypes,
} from '../types';
import { ERROR_MESSAGE } from '../errors';
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
        };
        // Not in the view config type, but a JS caller can still pass it.
        if ((viewConfig as { fullHeight?: boolean }).fullHeight) {
            logger.warn('DataAppEmbed does not support fullHeight; it is ignored.');
            viewConfig = { ...viewConfig, fullHeight: false } as DataAppEmbedViewConfig;
        }
        super(container, viewConfig);
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
