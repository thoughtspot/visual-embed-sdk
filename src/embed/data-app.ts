import {
    BaseViewConfig,
    ContextType,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    EmbedEvent,
    ErrorDetailsTypes,
    HostEvent,
} from '../types';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
import { reportHostEvent } from '../utils/hostEventTelemetry';
import { TsEmbed } from './ts-embed';
import { DataAppControlError } from './data-app-control-error';
import { HostEventRequest, TriggerData, TriggerResponse } from '../contracts/host-event-contracts';

// Interim until runtime filters apply to Apps.
const REFUSED_OPTIONS = [
    'runtimeFilters',
    'runtimeParameters',
    'liveboardOverride',
    'liveboardOverrides',
] as const;

// Interim until runtime filters apply to Apps: col1, val1, param1 and so on.
const RUNTIME_FILTER_FLAG = /^(col|op|val|param|paramVal)\d+$/i;

// Interim until runtime filters apply to Apps.
const REFUSED_HOST_EVENTS: ReadonlySet<HostEvent> = new Set([
    HostEvent.UpdateRuntimeFilters,
    HostEvent.UpdateParameters,
    HostEvent.UpdateFilters,
    HostEvent.GetFilters,
    HostEvent.GetParameters,
]);

// Empty arrays and objects, null, undefined and false count as not set.
const isSet = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return value !== null && value !== undefined && value !== false;
};

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
 * `liveboardOverrides` do not apply to an App, and neither do runtime filter
 * or parameter keys in `additionalFlags` (`col1`, `op1`, `val1`, `param1`,
 * `paramVal1` and so on). If any of them is set, the embed raises an error
 * with the code `DATA_APP_OPTION_NOT_SUPPORTED` for each, and does not render
 * or pre-render.
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

    // Set when render() found no App ID: the base then never creates a frame.
    private stoppedByMissingId = false;

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

    private hasRuntimeFilterFlags(): boolean {
        const flags = {
            ...this.embedConfig?.additionalFlags,
            ...this.viewConfig.additionalFlags,
        };
        return Object.keys(flags).some((key) => RUNTIME_FILTER_FLAG.test(key));
    }

    // One SEV1 error per set option, in list order; true if any.
    private refuseUnsupportedOptions(): boolean {
        const config = this.viewConfig as Partial<Record<typeof REFUSED_OPTIONS[number], unknown>>;
        const refused: string[] = REFUSED_OPTIONS.filter((option) => isSet(config[option]));
        if (this.hasRuntimeFilterFlags()) refused.push('additionalFlags');
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

    // The one check before this embed creates or adopts a frame.
    private refuseFrame(): boolean {
        if (this.refuseUnsupportedOptions()) return true;
        if (!this.stoppedByMissingId) return false;
        this.handleError({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.DATA_APP_EMBED_STOPPED,
            code: EmbedErrorCodes.DATA_APP_ID_MISSING,
            severity: EmbedErrorSeverity.SEV1,
            error: ERROR_MESSAGE.DATA_APP_EMBED_STOPPED,
        });
        return true;
    }

    // Reload reads iFrame.src: point its route at the App open now.
    private pointFrameAtCurrentApp(): void {
        const src = this.iFrame?.src;
        const hashAt = src ? src.indexOf('#') : -1;
        if (!this.isRendered || hashAt < 0) return;
        const route = src.slice(hashAt + 1);
        const queryAt = route.indexOf('?');
        const tsParams = queryAt < 0 ? '' : route.slice(queryAt);
        const path = this.getDataAppPath(this.viewConfig.dataAppId);
        const next = `${src.slice(0, hashAt)}#/${path}${tsParams}`;
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
        if (this.refuseFrame()) {
            return this;
        }
        if (!this.viewConfig.dataAppId) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.DATA_APP_ID_MISSING,
                code: EmbedErrorCodes.DATA_APP_ID_MISSING,
                severity: EmbedErrorSeverity.SEV1,
                error: ERROR_MESSAGE.DATA_APP_ID_MISSING,
            });
            this.stoppedByMissingId = true;
            return this;
        }

        await super.render();
        await this.renderIFrame(this.getIframeSrc());
        return this;
    }

    // Every new frame starts here: refuse a refused config or a stopped embed.
    protected async renderIFrame(url: string): Promise<any> {
        if (this.refuseFrame()) {
            // super.render() already set it; with no frame, it is not rendered.
            if (!this.iFrame) this.isRendered = false;
            return null;
        }
        return super.renderIFrame(url);
    }

    // The only path that adopts an existing pre-rendered frame.
    public async preRender(
        showPreRenderByDefault = false,
        replaceExistingPreRender = false,
    ): Promise<TsEmbed> {
        if (this.refuseFrame()) {
            return this;
        }
        return super.preRender(showPreRenderByDefault, replaceExistingPreRender);
    }

    public async prerenderGeneric(): Promise<any> {
        if (this.refuseFrame()) {
            return null;
        }
        return super.prerenderGeneric();
    }

    /**
     * Open another App in this embed, without reloading the frame. If the
     * embed is not rendered yet, it renders with that App, and raises the
     * same errors as `render()`.
     *
     * An empty ID raises an error with the code `DATA_APP_ID_MISSING` and
     * changes nothing. An embed that was rendered without an App ID cannot
     * render: create a new `DataAppEmbed`. To reload the App open now, use
     * `trigger(HostEvent.Reload)`.
     * @param dataAppId - ID of the App to open.
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * dataAppEmbed.navigateToDataApp('<app-id>');
     * ```
     */
    public async navigateToDataApp(dataAppId: string): Promise<void> {
        if (!dataAppId) {
            // A bad argument: the embed stays usable.
            const details = {
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.DATA_APP_ID_MISSING,
                code: EmbedErrorCodes.DATA_APP_ID_MISSING,
                severity: EmbedErrorSeverity.SEV3,
                error: ERROR_MESSAGE.DATA_APP_ID_MISSING,
            };
            this.executeCallbacks(EmbedEvent.Error, details);
            logger.warn(details);
            return;
        }
        const path = this.getDataAppPath(dataAppId);
        this.viewConfig.dataAppId = dataAppId;
        if (this.isRendered) {
            // Not awaited: the app never acknowledges Navigate.
            this.trigger(HostEvent.Navigate, path);
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
        if (this.refuseFrame()) {
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
     * with a {@link DataAppControlError} whose `code` is
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
    public async trigger<
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
            // Reported as TsEmbed.trigger reports every call.
            reportHostEvent({
                hostEvent: messageType,
                payload: data,
                context,
                embedComponentType: this.viewConfig?.embedComponentType,
            });
            throw new DataAppControlError('NOT_SUPPORTED_IN_DATA_APP');
        }
        if (messageType === HostEvent.Reload) {
            this.pointFrameAtCurrentApp();
        }
        return super.trigger(messageType, data, context);
    }
}
