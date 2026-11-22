import isPlainObject from 'lodash/isPlainObject';
import {
    Action,
    BaseViewConfig,
    ContextType,
    EmbedErrorCodes,
    EmbedErrorDetailsEvent,
    EmbedErrorSeverity,
    EmbedEvent,
    ErrorDetailsTypes,
    HostEvent,
    Param,
} from '../types';
import { DATA_APP_CONTROL_ERROR_MESSAGE, ERROR_MESSAGE } from '../errors';
import { setParamIfDefined } from '../utils';
import { logger } from '../utils/logger';
import { reportHostEvent } from '../utils/hostEventTelemetry';
import { TsEmbed } from './ts-embed';
import { DATA_APP_HOST_EVENTS, DataAppControlError } from './data-app-control-error';
import { HostEventRequest, TriggerData, TriggerResponse } from '../contracts/host-event-contracts';

/** The whole time of an App call: waiting for the App, then its reply. */
export const DATA_APP_CALL_BUDGET_MS = 30000;

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

// Inherited options an App cannot honor: a warning each, and the embed renders.
const IGNORED_OPTIONS = [
    'customActions',
    'linkOverride',
    'enableLinkOverridesV2',
    'disabledActions',
    'visibleActions',
] as const;

// Empty arrays and objects, null, undefined and false count as not set.
const isSet = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return value !== null && value !== undefined && value !== false;
};

// The Error payload of a check this embed makes on the host's own input.
const inputError = (
    code: EmbedErrorCodes,
    message: string,
    severity: EmbedErrorSeverity,
    option?: string,
): EmbedErrorDetailsEvent => ({
    errorType: ErrorDetailsTypes.VALIDATION_ERROR,
    message,
    code,
    severity,
    ...(option ? { option } : {}),
    error: message,
});

// Any rejection of an App call, as a DataAppControlError.
const toControlError = (error: any): DataAppControlError => {
    if (error instanceof DataAppControlError) return error;
    // The browser could not copy the payload, so nothing was sent.
    if (error?.name === 'DataCloneError') return new DataAppControlError('INVALID_REQUEST');
    // The Apps page sends every call code but NOT_SUPPORTED_IN_DATA_APP.
    // Anything else, such as the shell's HOST_EVENT_VALIDATION, is FAILED.
    const { code, results } = error ?? {};
    if (code === 'NOT_SUPPORTED_IN_DATA_APP'
        || !Object.prototype.hasOwnProperty.call(DATA_APP_CONTROL_ERROR_MESSAGE, code)) {
        return new DataAppControlError('FAILED');
    }
    // Only id, status and code of each entry, and no empty key.
    const kept = Array.isArray(results) && results.length
        ? results.map((entry) => {
            const result: any = {};
            ['id', 'status', 'code'].forEach((key) => {
                if (entry?.[key] != null) result[key] = entry[key];
            });
            return result;
        })
        : undefined;
    return new DataAppControlError(code, kept);
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
    /**
     * Hides the ThoughtSpot header above the App, with its name and actions,
     * so the App fills the frame.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
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
     * Actions to hide in the App. Only `Action.QueryDetailsButtons` applies:
     * the App then cannot show the query details of a tile. Any other action
     * is ignored, and raises a warning with the code
     * `DATA_APP_OPTION_NOT_SUPPORTED`.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    hiddenActions: [Action.QueryDetailsButtons],
     * });
     * ```
     */
    hiddenActions?: Action[];
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
 * or pre-render. `customActions`, `linkOverride`, `enableLinkOverridesV2`,
 * `disabledActions` and `visibleActions` are ignored, with a warning that has
 * the same code.
 *
 * Read the App's controls with `HostEvent.GetDataAppControls`, and follow the
 * App with `EmbedEvent.DataAppReady`, `EmbedEvent.DataAppLoad` and
 * `EmbedEvent.DataAppControlsChanged`.
 * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
 * @group Embed components
 * @example
 * ```js
 * const embed = new DataAppEmbed('#tsEmbed', {
 *   dataAppId: '<app-id>',
 * });
 * embed.on(EmbedEvent.DataAppReady, (payload) => {
 *   console.log(payload.data.controls);
 * });
 * embed.render();
 * ```
 */
export class DataAppEmbed extends TsEmbed {
    protected viewConfig: DataAppEmbedViewConfig & BaseViewConfig;

    // Set when render() found no App ID: the base then never creates a frame.
    private stoppedByMissingId = false;

    // The App of the last DataAppReady, while that App is the one open.
    private readyAppId: string | null = null;

    // No App will answer: its open failed, or the embed was destroyed.
    private openFailed = false;

    // render() or showPreRender() passed its checks; init may still be pending.
    private renderRequested = false;

    // App calls held for DataAppReady: an App ID releases, none rejects.
    private heldCalls = new Set<(appId?: string) => void>();

    // App calls sent and not answered yet.
    private sentCalls = new Set<(error: DataAppControlError) => void>();

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
        this.on(EmbedEvent.DataAppReady, (payload) => this.onAppReady(payload.data?.appId), { start: false }, true);
        this.on(EmbedEvent.Error, (payload) => this.onAppError(payload), { start: false }, true);
    }

    private onAppReady(appId: string | undefined): void {
        if (!appId || appId !== this.viewConfig.dataAppId) return;
        this.readyAppId = appId;
        this.openFailed = false;
        this.heldCalls.forEach((release) => release(appId));
    }

    // Errors the SDK raises itself have no data; the frame's do.
    private onAppError(payload: any): void {
        const error = payload?.data;
        if (error?.code !== EmbedErrorCodes.DATA_APP_OPEN_FAILED) return;
        if (error.appId !== undefined && error.appId !== this.viewConfig.dataAppId) return;
        this.resetAppState(true);
    }

    // Held calls reject; later ones wait, or reject at once if openFailed.
    private resetAppState(openFailed: boolean): void {
        this.readyAppId = null;
        this.openFailed = openFailed;
        this.heldCalls.forEach((release) => release());
    }

    // Calls sent to a frame that is going away: no reply can come.
    private endSentCalls(): void {
        this.sentCalls.forEach((stop) => stop(new DataAppControlError('SESSION_LOST')));
    }

    // Resolves with the App's ID on DataAppReady; rejects at the deadline.
    private holdUntilReady(deadline: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const release = (appId?: string) => {
                clearTimeout(timer);
                this.heldCalls.delete(release);
                if (appId) resolve(appId);
                else reject(new DataAppControlError('APP_NOT_READY'));
            };
            const timer = setTimeout(release, deadline - Date.now());
            this.heldCalls.add(release);
        });
    }

    // One 30 s budget, held and sent; every failure a DataAppControlError.
    // Posts through hostEventClient, not TsEmbed.trigger: a check added to that
    // method's post path must be mirrored here.
    private async sendAppEvent(messageType: HostEvent, data: unknown): Promise<any> {
        const deadline = Date.now() + DATA_APP_CALL_BUDGET_MS;
        reportHostEvent({
            hostEvent: messageType,
            payload: data,
            context: ContextType.DataApp,
            embedComponentType: this.viewConfig.embedComponentType,
        });
        if (this.openFailed || !(this.isRendered || this.renderRequested)) {
            throw new DataAppControlError('APP_NOT_READY');
        }
        const appId = this.readyAppId ?? await this.holdUntilReady(deadline);
        // A destroy() or failed open in the tick that released the call.
        if (this.openFailed) throw new DataAppControlError('APP_NOT_READY');
        let timer: ReturnType<typeof setTimeout>;
        let stop: (error: DataAppControlError) => void;
        const stopped = new Promise<never>((resolve, reject) => {
            stop = reject;
            timer = setTimeout(() => reject(new DataAppControlError('TIMEOUT')), deadline - Date.now());
        });
        this.sentCalls.add(stop);
        let reply: unknown;
        try {
            const payload: any = isPlainObject(data) && (data as any).appId === undefined
                ? { ...(data as object), appId }
                : data;
            // The App's handler is registered under the dataApp page context.
            const sent = this.hostEventClient.triggerHostEvent(messageType, payload, ContextType.DataApp);
            reply = await Promise.race([sent, stopped]);
        } catch (error) {
            throw toControlError(error);
        } finally {
            clearTimeout(timer);
            this.sentCalls.delete(stop);
        }
        // The transport resolves with an Error when no reply came in time.
        if (reply instanceof Error) throw new DataAppControlError('TIMEOUT');
        return reply;
    }

    // A problem with the host's input that leaves the embed usable.
    private raiseWarning(details: EmbedErrorDetailsEvent): void {
        this.executeCallbacks(EmbedEvent.Error, details);
        logger.warn(details);
    }

    // Inherited options an App ignores: one warning each, as an Error event.
    private warnIgnoredOptions(): void {
        const config = this.viewConfig as Partial<Record<typeof IGNORED_OPTIONS[number], unknown>>;
        const ignored: string[] = IGNORED_OPTIONS.filter((option) => isSet(config[option]));
        const hidden: unknown = this.viewConfig.hiddenActions;
        const honored = (action: unknown) => action === Action.QueryDetailsButtons;
        if (isSet(hidden) && !([] as unknown[]).concat(hidden).every(honored)) {
            ignored.push('hiddenActions');
        }
        ignored.forEach((option) => this.raiseWarning(inputError(
            EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
            ERROR_MESSAGE.DATA_APP_OPTION_IGNORED,
            EmbedErrorSeverity.SEV3,
            option,
        )));
    }

    protected getEmbedParamsObject() {
        const params = this.getBaseQueryParams();
        setParamIfDefined(params, Param.HideDataAppHeader, this.viewConfig.hideDataAppHeader, true);
        return params;
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
        const config = this.viewConfig as unknown as Partial<Record<string, unknown>>;
        const refused: string[] = REFUSED_OPTIONS.filter((option) => isSet(config[option]));
        if (this.hasRuntimeFilterFlags()) refused.push('additionalFlags');
        // Interim: the change that adds host-set values removes this.
        if (isSet(config.dataAppControls)) refused.push('dataAppControls');
        refused.forEach((option) => this.handleError(inputError(
            EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
            option === 'dataAppControls'
                ? ERROR_MESSAGE.DATA_APP_CONTROLS_NOT_SUPPORTED
                : ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED,
            EmbedErrorSeverity.SEV1,
            option,
        )));
        return refused.length > 0;
    }

    // The one check before this embed creates or adopts a frame.
    private refuseFrame(): boolean {
        if (this.refuseUnsupportedOptions()) return true;
        if (!this.stoppedByMissingId) return false;
        this.handleError(inputError(
            EmbedErrorCodes.DATA_APP_ID_MISSING,
            ERROR_MESSAGE.DATA_APP_EMBED_STOPPED,
            EmbedErrorSeverity.SEV1,
        ));
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
            this.handleError(inputError(
                EmbedErrorCodes.DATA_APP_ID_MISSING,
                ERROR_MESSAGE.DATA_APP_ID_MISSING,
                EmbedErrorSeverity.SEV1,
            ));
            this.stoppedByMissingId = true;
            return this;
        }
        this.renderRequested = true;
        this.warnIgnoredOptions();

        await super.render();
        await this.renderIFrame(this.getIframeSrc());
        return this;
    }

    // Every new frame starts here: refuse a refused config or a stopped embed.
    protected async renderIFrame(url: string): Promise<any> {
        if (this.refuseFrame()) {
            // super.render() set it; with no frame, nothing is rendered.
            if (!this.iFrame) {
                this.isRendered = false;
                this.resetAppState(true);
            }
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
     *
     * Opening another App rejects the App calls still waiting with
     * `APP_NOT_READY`. Navigating to the App already open does not open it
     * again, even after it failed to open: to retry it, use
     * `trigger(HostEvent.Reload)`.
     * @param dataAppId - ID of the App to open.
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * dataAppEmbed.navigateToDataApp('<app-id>');
     * ```
     */
    public async navigateToDataApp(dataAppId: string): Promise<void> {
        // Bad arguments: nothing changes and the embed stays usable.
        if (!dataAppId) {
            this.raiseWarning(inputError(
                EmbedErrorCodes.DATA_APP_ID_MISSING,
                ERROR_MESSAGE.DATA_APP_ID_MISSING,
                EmbedErrorSeverity.SEV3,
            ));
            return;
        }
        // Interim, as the dataAppControls refusal: options from JavaScript.
        // eslint-disable-next-line prefer-rest-params
        if (isSet(arguments[1]?.controls)) {
            this.raiseWarning(inputError(
                EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
                ERROR_MESSAGE.DATA_APP_CONTROLS_NOT_SUPPORTED,
                EmbedErrorSeverity.SEV3,
                'controls',
            ));
            return;
        }
        const path = this.getDataAppPath(dataAppId);
        // The same App keeps its state, a failed open included.
        if (dataAppId !== this.viewConfig.dataAppId) this.resetAppState(false);
        this.viewConfig.dataAppId = dataAppId;
        if (this.isRendered) {
            // Not awaited: the app never acknowledges Navigate.
            this.trigger(HostEvent.Navigate, path).catch((error) => logger.warn(error));
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
            this.navigateToDataApp(this.viewConfig.dataAppId).catch((error) => logger.warn(error));
        });
    }

    public async showPreRender(): Promise<TsEmbed> {
        // A connected pre-render is shown without render(), so check here too.
        if (this.refuseFrame()) {
            return this;
        }
        this.renderRequested = true;
        this.adoptOwnerAppState();
        return super.showPreRender();
    }

    // The frame's last owner saw its events: same App, take its state; another
    // App, showing moves the frame, so start over.
    private adoptOwnerAppState(): void {
        const owner = this.getPreRenderObj<DataAppEmbed>();
        if (!owner || owner === this) return;
        if (owner.viewConfig?.dataAppId !== this.viewConfig.dataAppId) {
            this.resetAppState(false);
            return;
        }
        this.readyAppId = owner.readyAppId;
        this.openFailed = owner.openFailed;
    }

    /**
     * Destroys the embed. App calls still waiting for the App reject with
     * `APP_NOT_READY`, and calls sent and not answered with `SESSION_LOST`.
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     */
    public destroy(): void {
        this.resetAppState(true);
        this.endSentCalls();
        super.destroy();
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
     * `HostEvent.GetDataAppControls` waits for the App to be ready, within
     * 30 seconds, and rejects every failure with a {@link DataAppControlError}.
     *
     * `HostEvent.Reload` reopens the App that is open, including one opened
     * with `navigateToDataApp()` and one that failed to open. App calls still
     * waiting reject with `APP_NOT_READY`, and calls sent and not answered
     * with `SESSION_LOST`.
     * @param messageType The event type
     * @param data The payload, typed against the event's contract
     * @param context The page context of the event. App calls are always sent
     * with `ContextType.DataApp`.
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
        if (DATA_APP_HOST_EVENTS.has(messageType)) {
            return this.sendAppEvent(messageType, data);
        }
        if (messageType === HostEvent.Reload) {
            this.pointFrameAtCurrentApp();
            this.resetAppState(false);
            this.endSentCalls();
        }
        return super.trigger(messageType, data, context);
    }
}
