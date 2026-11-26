import {
    Action,
    BaseViewConfig,
    DisabledActionReasonMap,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    ErrorDetailsTypes,
    Param,
} from '../types';
import { ERROR_MESSAGE } from '../errors';
import { getQueryParamString, setParamIfDefined } from '../utils';
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
    /**
     * Hides the header above the App, with the App's name and its actions,
     * so that the App fills the frame.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    hideDataAppHeader: true,
     * });
     * ```
     */
    hideDataAppHeader?: boolean;
    /**
     * The actions to remove from the embedded App. Hidden actions are not
     * shown at all.
     *
     * The list applies to every action in the embedded App: in the App
     * header, `Action.Present` (the **Present** item of the **More** menu),
     * and elsewhere, such as the Spotter chat button.
     *
     * Use either this or {@link visibleActions}, not both. If both are set,
     * the App does not load, and {@link EmbedEvent.Error} is emitted with the
     * code `CONFLICTING_ACTIONS_CONFIG`.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    hiddenActions: [Action.Present],
     * });
     * ```
     */
    hiddenActions?: Action[];
    /**
     * The actions to disable in the embedded App. Disabled actions are grayed
     * out: still shown, but they cannot be clicked. The list applies to every
     * action in the embedded App, as {@link hiddenActions} describes.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    disabledActions: [Action.Present],
     *    disabledActionReason: 'Presenting is turned off for your account',
     * });
     * ```
     */
    disabledActions?: Action[];
    /**
     * The tooltip to show on the actions in {@link disabledActions}: one
     * string for every action, or a {@link DisabledActionReasonMap} to give
     * each action its own reason.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    disabledActions: [Action.Present],
     *    disabledActionReason: {
     *        [Action.Present]: 'Presenting is turned off for your account',
     *        GENERIC_REASON: 'Not available here',
     *    },
     * });
     * ```
     */
    disabledActionReason?: string | DisabledActionReasonMap;
    /**
     * The only actions to show in the embedded App: every action not listed
     * is hidden, anywhere in the App. That covers `Action.Present` in the App
     * header and the rest of the App, such as the Spotter chat button, as
     * {@link hiddenActions} describes.
     *
     * Use either this or {@link hiddenActions}, not both. If both are set, the
     * App does not load, and {@link EmbedEvent.Error} is emitted with the code
     * `CONFLICTING_ACTIONS_CONFIG`.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    visibleActions: [Action.Present],
     * });
     * ```
     */
    visibleActions?: Action[];
}

/**
 * Embed a single ThoughtSpot App by its ID.
 *
 * The App fills its container element: `fullHeight` is not supported. Apps
 * must be turned on for the ThoughtSpot instance.
 *
 * The header above the App shows the App's name and a **More** menu with
 * **Present**. Hide or disable **Present** (`Action.Present`), and actions
 * in the rest of the App such as the Spotter chat button and a tile's query
 * details, with `hiddenActions`, `disabledActions` (with
 * `disabledActionReason`) and `visibleActions`. Hide the whole header with
 * `hideDataAppHeader`, and set the name it shows with
 * `HostEvent.UpdateDataAppName`.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 26.12.0.cl
 * @group Embed components
 * @example
 * ```js
 * const embed = new DataAppEmbed('#tsEmbed', {
 *   dataAppId: '<app-id>',
 * });
 * embed.render();
 * ```
 * @example
 * ```js
 * // Configure the App header
 * const embed = new DataAppEmbed('#tsEmbed', {
 *   dataAppId: '<app-id>',
 *   disabledActions: [Action.Present],
 *   disabledActionReason: 'Presenting is turned off for your account',
 * });
 * embed.render();
 *
 * // Show another name in the header. The App is not renamed.
 * embed.trigger(HostEvent.UpdateDataAppName, { name: 'Regional sales' });
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

    /**
     * The URL of the App page, on the blink-v2 shell.
     */
    public getIframeSrc(): string {
        const path = `embed/insights/apps/${encodeURIComponent(this.viewConfig.dataAppId)}`;
        return `${this.getRootIframeSrc()}/${path}${this.getThoughtSpotPostUrlParams()}`;
    }

    /**
     * Host event validation errors always reach `EmbedEvent.Error`: the App
     * has no host events v1 behaviour to keep.
     */
    protected shouldSkipEvent(): boolean {
        return false;
    }

    // Serialized as AppEmbed does, so action lists reach the App page as JSON.
    protected getEmbedParams() {
        return getQueryParamString(this.getUrlQueryParamsObject(), true);
    }

    protected getEmbedParamsObject() {
        const params = this.getBaseQueryParams();
        setParamIfDefined(params, Param.HideDataAppHeader, this.viewConfig.hideDataAppHeader, true);
        return params;
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
