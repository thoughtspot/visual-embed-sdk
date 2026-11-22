import {
    BaseViewConfig,
    ContextType,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    ErrorDetailsTypes,
    HostEvent,
} from '../types';
import { DATA_APP_CONTROL_ERROR_MESSAGE, ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
import { TsEmbed } from './ts-embed';
import { HostEventRequest, TriggerData, TriggerResponse } from '../contracts/host-event-contracts';
import type {
    DataAppControlError as DataAppControlErrorContract,
    DataAppControlErrorCode,
} from '../contracts/data-app-contracts';

// Interim until runtime filters apply to Apps.
const REFUSED_OPTIONS = [
    'runtimeFilters',
    'runtimeParameters',
    'liveboardOverride',
    'liveboardOverrides',
] as const;

// Interim until runtime filters apply to Apps.
const REFUSED_HOST_EVENTS: ReadonlySet<HostEvent> = new Set([
    HostEvent.UpdateRuntimeFilters,
    HostEvent.UpdateParameters,
    HostEvent.UpdateFilters,
    HostEvent.GetFilters,
    HostEvent.GetParameters,
]);

// The App's id in the frame URL's route.
const APP_ROUTE_ID = /(\/embed\/insights\/apps\/)[^/?#]*/;

// Empty arrays and objects, null, undefined and false count as not set.
const isSet = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return value !== null && value !== undefined && value !== false;
};

// Only the interface is public; hosts check `name` and `code`.
class DataAppControlError extends Error implements DataAppControlErrorContract {
    public name = 'DataAppControlError';

    public code: DataAppControlErrorCode;

    constructor(code: DataAppControlErrorCode) {
        super(DATA_APP_CONTROL_ERROR_MESSAGE[code]);
        this.code = code;
    }
}

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
 *
 * `runtimeFilters`, `runtimeParameters`, `liveboardOverride` and
 * `liveboardOverrides` do not apply to an App. If any of them is set, the
 * embed raises an error with the code `DATA_APP_OPTION_NOT_SUPPORTED` for
 * each, and does not render.
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

    // One SEV1 error per set option, in list order; true if any.
    private refuseUnsupportedOptions(): boolean {
        const config = this.viewConfig as Partial<Record<typeof REFUSED_OPTIONS[number], unknown>>;
        const refused = REFUSED_OPTIONS.filter((option) => isSet(config[option]));
        refused.forEach((option) => {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED,
                code: EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
                severity: EmbedErrorSeverity.SEV1,
                option,
                error: ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED,
            });
        });
        return refused.length > 0;
    }

    // Reload reads iFrame.src, which still names the App first rendered.
    private pointFrameAtCurrentApp(): void {
        const src = this.iFrame?.src;
        const hashAt = src ? src.indexOf('#') : -1;
        if (!this.isRendered || hashAt < 0) return;
        const appId = encodeURIComponent(this.viewConfig.dataAppId);
        const route = src.slice(hashAt).replace(APP_ROUTE_ID, (_, prefix) => `${prefix}${appId}`);
        const next = `${src.slice(0, hashAt)}${route}`;
        if (next !== src) this.iFrame.src = next;
    }

    /**
     * The URL of the App page, on the blink-v2 shell.
     */
    public getIframeSrc(): string {
        const path = this.getDataAppPath(this.viewConfig.dataAppId);
        return `${this.getRootIframeSrc()}/${path}${this.getThoughtSpotPostUrlParams()}`;
    }

    public async render(): Promise<DataAppEmbed> {
        if (this.refuseUnsupportedOptions()) {
            return this;
        }
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

    public async showPreRender(): Promise<TsEmbed> {
        // A connected pre-render is shown without render(), so check here too.
        if (this.refuseUnsupportedOptions()) {
            return this;
        }
        return super.showPreRender();
    }

    /**
     * Triggers an event on the embedded App.
     *
     * `HostEvent.UpdateRuntimeFilters`, `HostEvent.UpdateParameters`,
     * `HostEvent.UpdateFilters`, `HostEvent.GetFilters` and
     * `HostEvent.GetParameters` do not apply to an App. They reject at once
     * with an `Error` named `DataAppControlError` whose `code` is
     * `NOT_SUPPORTED_IN_DATA_APP`, and nothing is sent.
     *
     * `HostEvent.Reload` reopens the App that is open, including one opened
     * with `navigateToDataApp()`.
     * @param messageType The event type
     * @param data The payload, typed against the event's contract
     * @param context The page context of the event
     * @returns A promise that resolves with the response from the embedded App
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     */
    public trigger<
        HostEventT extends HostEvent,
        // Mirrors TsEmbed.trigger, as LiveboardEmbed.trigger does.
        PayloadT = HostEventRequest<HostEventT>,
        ContextT extends ContextType = ContextType,
    >(
        messageType: HostEventT,
        data: TriggerData<HostEventT> = ({} as any),
        context?: ContextT,
    ): Promise<TriggerResponse<PayloadT, HostEventT, ContextT>> {
        if (REFUSED_HOST_EVENTS.has(messageType)) {
            return Promise.reject(new DataAppControlError('NOT_SUPPORTED_IN_DATA_APP'));
        }
        if (messageType === HostEvent.Reload) {
            this.pointFrameAtCurrentApp();
        }
        return super.trigger(messageType, data, context);
    }
}
