import {
    BaseViewConfig,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    ErrorDetailsTypes,
    HostEvent,
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
        super(container, config);
    }

    private getDataAppPath(dataAppId: string): string {
        return `embed/insights/apps/${encodeURIComponent(dataAppId)}`;
    }

    private reportMissingDataAppId(): void {
        this.handleError({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.DATA_APP_ID_MISSING,
            code: EmbedErrorCodes.DATA_APP_ID_MISSING,
            severity: EmbedErrorSeverity.SEV1,
            error: ERROR_MESSAGE.DATA_APP_ID_MISSING,
        });
    }

    /**
     * The URL of the App page, on the blink-v2 shell.
     */
    public getIframeSrc(): string {
        const path = this.getDataAppPath(this.viewConfig.dataAppId);
        return `${this.getRootIframeSrc()}/${path}${this.getThoughtSpotPostUrlParams()}`;
    }

    public async render(): Promise<DataAppEmbed> {
        if (!this.viewConfig.dataAppId) {
            this.reportMissingDataAppId();
            return this;
        }

        await super.render();
        await this.renderIFrame(this.getIframeSrc());
        return this;
    }

    /**
     * Open another App in this embed, without reloading the frame. If the
     * embed is not rendered yet, it renders with that App.
     * @param dataAppId - ID of the App to open.
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * dataAppEmbed.navigateToDataApp('<app-id>');
     * ```
     */
    public async navigateToDataApp(dataAppId: string): Promise<void> {
        if (!dataAppId) {
            this.reportMissingDataAppId();
            return;
        }
        this.viewConfig.dataAppId = dataAppId;
        if (this.isRendered) {
            // Not awaited: the app never acknowledges Navigate.
            this.trigger(HostEvent.Navigate, this.getDataAppPath(dataAppId));
        } else if (this.getPreRenderConfig().id) {
            await this.preRender(true);
        } else {
            await this.render();
        }
    }

    protected beforePrerenderVisible(): void {
        super.beforePrerenderVisible();
        this.executeAfterEmbedContainerLoaded(async () => {
            // Open the App only once the shown config's params apply.
            await this.preRenderParamsApplied;
            this.navigateToDataApp(this.viewConfig.dataAppId);
        });
    }
}
