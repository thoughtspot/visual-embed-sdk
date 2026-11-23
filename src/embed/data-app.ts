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
import { canonicalJson, packInitialControls } from '../utils/data-app-controls';
import { TsEmbed, UPDATE_EMBED_PARAMS_SETTLE_MS } from './ts-embed';
import { DATA_APP_HOST_EVENTS, DataAppControlError } from './data-app-control-error';
import { HostEventRequest, TriggerData, TriggerResponse } from '../contracts/host-event-contracts';
import type { DataAppControl } from '../contracts/data-app-contracts';

/** The whole time of an App call: waiting for the App, then its reply. */
export const DATA_APP_CALL_BUDGET_MS = 30000;

/** How long an open with values waits for DataAppReady before the watchdog warns. */
export const DATA_APP_OPEN_CONFIRM_TIMEOUT_MS = 30000;

/** A held UpdateDataAppControls is sent only with this much of its budget left. */
export const DATA_APP_MIN_UPDATE_BUDGET_MS = 2000;

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

const sleep = (ms: number) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

// The payload of an Error event this embed raises itself.
const errorEvent = (
    errorType: ErrorDetailsTypes,
    code: EmbedErrorCodes,
    message: string,
    severity: EmbedErrorSeverity,
    extra?: object,
): EmbedErrorDetailsEvent => ({
    errorType,
    message,
    code,
    severity,
    error: message,
    ...extra,
});

// The Error payload of a check this embed makes on the host's own input.
const inputError = (
    code: EmbedErrorCodes,
    message: string,
    severity: EmbedErrorSeverity,
    option?: string,
): EmbedErrorDetailsEvent => errorEvent(
    ErrorDetailsTypes.VALIDATION_ERROR,
    code,
    message,
    severity,
    option ? { option } : undefined,
);

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
    /**
     * Values for the App's controls, in force before the first tile loads.
     * The viewer sees them in the App's own widgets and can change them. This
     * is not a security feature: to restrict what a viewer can see, use
     * row-level security.
     *
     * If any value cannot be put in force, the App does not open, and the
     * embed raises an error with the code `DATA_APP_OPEN_FAILED`. If nothing
     * confirms the values within 30 seconds, it raises
     * `DATA_APP_OPEN_NOT_CONFIRMED`. The values are sent in the app init
     * payload, never in the URL. An empty array, or `null`, is the same as none.
     *
     * The values are a starting state: each open, and `HostEvent.Reload`,
     * starts the App from the author's defaults with them laid on. Pass values
     * read from the App, as they are, in plain objects and arrays: values the
     * browser cannot copy, such as a framework's reactive proxy, fail the open.
     * To change values once the App is open, use
     * `HostEvent.UpdateDataAppControls`.
     *
     * Supported embed types: `DataAppEmbed`
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * // Controls saved from an earlier EmbedEvent.DataAppControlsChanged
     * const embed = new DataAppEmbed('#tsEmbed', {
     *    dataAppId: '<app-id>',
     *    dataAppControls: savedControls,
     * });
     * ```
     */
    dataAppControls?: DataAppControl[] | null;
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
 * Open the App with values for its controls with `dataAppControls`. Read and
 * set the App's controls with `HostEvent.GetDataAppControls` and
 * `HostEvent.UpdateDataAppControls`, and follow the App with
 * `EmbedEvent.DataAppReady`, `EmbedEvent.DataAppLoad` and
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

    // Counts Reloads, so a call released in the tick of one is not sent.
    private reloads = 0;

    // App calls held for DataAppReady: an App ID releases, none rejects.
    private heldCalls = new Set<(appId?: string) => void>();

    // App calls sent and not answered yet.
    private sentCalls = new Set<(error: DataAppControlError) => void>();

    // Settles once the last call made is posted or has failed: calls are
    // posted in the order made, at once, and none waits for another's reply.
    private lastPosted: Promise<void> = Promise.resolve();

    // The frame has signed in (AuthInit): the watchdog's clock can run.
    private authInitSeen = false;

    // An open with values waits for DataAppReady to confirm them.
    private watchArmed = false;

    private watchTimer: ReturnType<typeof setTimeout>;

    // The packed values the last DataAppReady of the App confirmed.
    private confirmedKey: string;

    // The packed values the frame last received; none at first.
    private givenKey = canonicalJson(undefined);

    // A hidden pre-render hears nothing from its frame.
    private hidden = false;

    // destroy() ran: nothing opens, arms or is posted again.
    private destroyed = false;

    // A Reload asked for while hidden, run on the next show.
    private reloadOnShow = false;

    // The last show sends values the frame does not have.
    private showChanges = false;

    // The params of the last open were built and posted.
    private paramsPosted = false;

    // Settles once values posted for an in-place restart can apply.
    private valuesApplied: Promise<unknown> = Promise.resolve();

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
        this.on(EmbedEvent.AuthInit, () => {
            this.authInitSeen = true;
            this.startWatchdog();
        }, { start: false }, true);
    }

    private onAppReady(appId: string | undefined): void {
        if (!appId || appId !== this.viewConfig.dataAppId) return;
        this.confirmedKey = this.packedKey();
        this.disarmWatchdog();
        this.markReady(appId);
    }

    private markReady(appId: string): void {
        this.readyAppId = appId;
        this.openFailed = false;
        this.heldCalls.forEach((release) => release(appId));
    }

    // Errors the SDK raises itself have no data; the frame's do.
    private onAppError(payload: any): void {
        const error = payload?.data;
        if (!`${error?.code}`.startsWith('DATA_APP_')) return;
        if (error.appId !== undefined && error.appId !== this.viewConfig.dataAppId) return;
        this.disarmWatchdog();
        if (error.code === EmbedErrorCodes.DATA_APP_OPEN_FAILED) this.resetAppState(true);
    }

    // The load-time values as sent, or undefined for none.
    private packedControls() {
        return packInitialControls(this.viewConfig.dataAppId, this.viewConfig.dataAppControls);
    }

    private packedKey(): string {
        return canonicalJson(this.packedControls());
    }

    // An open with values: DataAppReady must confirm them within the timeout.
    private armWatchdog(): void {
        this.disarmWatchdog();
        // Hidden or destroyed, it cannot hear the DataAppReady to settle it.
        this.watchArmed = !this.hidden && !this.destroyed && !!this.packedControls();
        this.startWatchdog();
    }

    // The clock starts once the frame has signed in.
    private startWatchdog(): void {
        if (!this.watchArmed || !this.authInitSeen || this.watchTimer) return;
        const appId = this.viewConfig.dataAppId;
        this.watchTimer = setTimeout(() => {
            this.disarmWatchdog();
            // Unknown, not failed: nothing is retried or held.
            this.raiseWarning(errorEvent(
                ErrorDetailsTypes.API,
                EmbedErrorCodes.DATA_APP_OPEN_NOT_CONFIRMED,
                ERROR_MESSAGE.DATA_APP_OPEN_NOT_CONFIRMED,
                EmbedErrorSeverity.SEV2,
                { appId },
            ));
        }, DATA_APP_OPEN_CONFIRM_TIMEOUT_MS);
    }

    private disarmWatchdog(): void {
        clearTimeout(this.watchTimer);
        this.watchTimer = undefined;
        this.watchArmed = false;
    }

    // Held calls reject; later ones wait, or reject at once if openFailed.
    private resetAppState(openFailed: boolean): void {
        this.readyAppId = null;
        // After destroy() no App answers, whatever resets it.
        this.openFailed = openFailed || this.destroyed;
        this.confirmedKey = undefined;
        this.heldCalls.forEach((release) => release());
    }

    // Calls wait for an in-place restart's values, at most 2 s of their budget.
    private waitForValues(applied: Promise<unknown>): void {
        this.valuesApplied = Promise.race([applied, sleep(DATA_APP_MIN_UPDATE_BUDGET_MS)]);
    }

    // The values did not reach the frame, so this App is not opened.
    private refuseOpen(): void {
        this.resetAppState(true);
        this.disarmWatchdog();
        this.raiseWarning(errorEvent(
            ErrorDetailsTypes.API,
            EmbedErrorCodes.DATA_APP_OPEN_FAILED,
            ERROR_MESSAGE.DATA_APP_OPEN_FAILED,
            EmbedErrorSeverity.SEV1,
            { appId: this.viewConfig.dataAppId, reason: 'FAILED' },
        ));
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
        const { reloads } = this;
        const previous = this.lastPosted;
        let posted: () => void;
        this.lastPosted = new Promise((resolve) => {
            posted = resolve;
        });
        let timer: ReturnType<typeof setTimeout>;
        let stop: (error: DataAppControlError) => void;
        let reply: unknown;
        try {
            const appId = this.readyAppId ?? await this.holdUntilReady(deadline);
            // Values just posted for an in-place restart apply first.
            await this.valuesApplied;
            // A call made earlier, such as a held one, is posted first.
            await previous;
            // A destroy(), failed open or Reload in the tick of the release.
            if (this.openFailed || reloads !== this.reloads) {
                throw new DataAppControlError('APP_NOT_READY');
            }
            // An update is sent only with time left for the App page to answer.
            const budgetMs = deadline - Date.now();
            const isUpdate = messageType === HostEvent.UpdateDataAppControls;
            if (isUpdate && budgetMs < DATA_APP_MIN_UPDATE_BUDGET_MS) {
                throw new DataAppControlError('APP_NOT_READY');
            }
            const stopped = new Promise<never>((resolve, reject) => {
                stop = reject;
                timer = setTimeout(() => reject(new DataAppControlError('TIMEOUT')), deadline - Date.now());
            });
            this.sentCalls.add(stop);
            let payload: any = data;
            if (isPlainObject(data)) {
                if (payload.appId === undefined) payload = { ...payload, appId };
                // Internal: an update's budget left, never the host's.
                if (isUpdate) {
                    payload = { ...payload, budgetMs };
                } else if ('budgetMs' in payload) {
                    // Never on a read: the App page refuses the field there.
                    payload = { ...payload };
                    delete payload.budgetMs;
                }
            }
            // The App's handler is registered under the dataApp page context.
            const sent = this.hostEventClient.triggerHostEvent(messageType, payload, ContextType.DataApp);
            posted();
            reply = await Promise.race([sent, stopped]);
        } catch (error) {
            throw toControlError(error);
        } finally {
            posted();
            clearTimeout(timer);
            this.sentCalls.delete(stop);
        }
        // The transport resolves with an Error when no reply came in time.
        if (reply instanceof Error) throw new DataAppControlError('TIMEOUT');
        return reply;
    }

    // An Error event that leaves the embed usable, and a log line.
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

    // APP_INIT carries the load-time values; the URL never does.
    protected async getAppInitData() {
        const base = await super.getAppInitData();
        const packed = this.packedControls();
        this.givenKey = canonicalJson(packed);
        return packed
            ? { ...base, embedParams: { ...(base as any).embedParams, dataAppInitialControls: packed } }
            : base;
    }

    // One copy of the values, at the top level: absent means none.
    protected async getUpdateEmbedParamsObject() {
        const params: any = await super.getUpdateEmbedParamsObject();
        delete params.dataAppControls;
        delete params.embedParams;
        const packed = this.packedControls();
        if (packed) params.dataAppInitialControls = packed;
        return params;
    }

    // As the base's, but a post the browser refuses is caught, and either
    // failure leaves paramsPosted false: the open that needs them is refused.
    protected async triggerUpdateEmbedParams(): Promise<void> {
        this.paramsPosted = false;
        // The frame keeps the values it had unless these are posted.
        const { givenKey } = this;
        const notPosted = (error: unknown) => {
            this.paramsPosted = false;
            this.givenKey = givenKey;
            logger.warn(error);
        };
        try {
            const params = await this.getUpdateEmbedParamsObject();
            this.paramsPosted = true;
            this.trigger(HostEvent.UpdateEmbedParams, params).catch(notPosted);
        } catch (error) {
            notPosted(error);
        }
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
        refused.forEach((option) => this.handleError(inputError(
            EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
            ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED,
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
        // A new frame opens the App with the values.
        if (!this.isRendered) this.armWatchdog();

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
     * Open another App in this embed, or open this one again with other
     * values, without reloading the frame. If the embed is not rendered yet,
     * it renders with that App, and raises the same errors as `render()`.
     *
     * `options.controls` replaces `dataAppControls`: values for the App's
     * controls, in force before its first tile loads. Left out, the App opens
     * with none: values given for one App never reach another. To the App
     * already open, values that differ from the last ones given restart it in
     * place, from the author's defaults, and the same values change nothing.
     * A control a host may not set keeps the viewer's value on such a restart.
     * If the values cannot be sent to the App, it is not opened, and the embed
     * raises an error with the code `DATA_APP_OPEN_FAILED`.
     *
     * An empty ID raises an error with the code `DATA_APP_ID_MISSING` and
     * changes nothing. An embed that was rendered without an App ID cannot
     * render: create a new `DataAppEmbed`. To reload the App open now, use
     * `trigger(HostEvent.Reload)`.
     *
     * Opening another App rejects the App calls still waiting with
     * `APP_NOT_READY`. After the App failed to open, navigating to it with
     * other values tries again; with the same values it does not, and
     * `trigger(HostEvent.Reload)` does.
     * @param dataAppId - ID of the App to open.
     * @param options - `controls`: the values to open the App with.
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     * @example
     * ```js
     * dataAppEmbed.navigateToDataApp('<app-id>');
     * // With values saved from an earlier EmbedEvent.DataAppControlsChanged
     * dataAppEmbed.navigateToDataApp('<app-id>', { controls: savedControls });
     * ```
     */
    public async navigateToDataApp(
        dataAppId: string,
        options?: { controls?: DataAppControl[] | null },
    ): Promise<void> {
        if (this.destroyed) return;
        // Bad arguments: nothing changes and the embed stays usable.
        if (!dataAppId) {
            this.raiseWarning(inputError(
                EmbedErrorCodes.DATA_APP_ID_MISSING,
                ERROR_MESSAGE.DATA_APP_ID_MISSING,
                EmbedErrorSeverity.SEV3,
            ));
            return;
        }
        // An ID that cannot be encoded throws here, before anything changes.
        this.getDataAppPath(dataAppId);
        const switching = dataAppId !== this.viewConfig.dataAppId;
        this.viewConfig.dataAppId = dataAppId;
        this.viewConfig.dataAppControls = options?.controls;
        // Compared with what the frame received, so a retry after values that
        // were never sent is an open attempt.
        const changed = this.packedKey() !== this.givenKey;
        if (switching) this.resetAppState(false);
        // New values reopen the App, after a failed open too; the same do not.
        else if (changed) this.openFailed = false;
        if (!this.isRendered) {
            await (this.getPreRenderConfig().id ? this.preRender(true) : this.render());
            return;
        }
        if (switching || changed) this.armWatchdog();
        if (changed) {
            // The App page reads the values before it opens the App.
            const applied = this.triggerUpdateEmbedParams()
                .then(() => sleep(UPDATE_EMBED_PARAMS_SETTLE_MS));
            if (!switching && this.readyAppId) this.waitForValues(applied);
            await applied;
            if (this.destroyed) return;
            // Never open the App without the values the host asked for.
            if (!this.paramsPosted) {
                this.refuseOpen();
                return;
            }
        }
        this.openCurrentApp();
    }

    private openCurrentApp(): void {
        // Not awaited: the app never acknowledges Navigate.
        this.trigger(HostEvent.Navigate, this.getDataAppPath(this.viewConfig.dataAppId))
            .catch((error) => logger.warn(error));
    }

    // A hidden instance hears no DataAppReady: ask the App page. A reply with
    // this App's state counts as one for held calls, and also confirms the
    // values when this show sent none the frame did not have. Never reported.
    private probeReadiness(confirm: boolean): void {
        const appId = this.viewConfig.dataAppId;
        const key = this.packedKey();
        const { reloads } = this;
        if (this.openFailed || !this.iFrame || (!confirm && this.readyAppId)) return;
        this.hostEventClient
            .triggerHostEvent(HostEvent.GetDataAppControls, { appId }, ContextType.DataApp)
            .then((state) => {
                if (state?.appId !== appId || appId !== this.viewConfig.dataAppId
                    || reloads !== this.reloads || this.openFailed) return;
                if (confirm && key === this.packedKey()) {
                    this.confirmedKey = key;
                    this.disarmWatchdog();
                }
                this.markReady(appId);
            }, () => undefined);
    }

    protected beforePrerenderVisible(): void {
        super.beforePrerenderVisible();
        const confirm = !this.showChanges && this.packedKey() !== this.confirmedKey;
        // An in-place restart: calls wait for its values.
        if (this.showChanges && this.readyAppId) {
            this.waitForValues(this.preRenderParamsApplied);
        }
        // Calls held before this instance adopted the owner's readiness.
        const { readyAppId } = this;
        if (readyAppId) this.heldCalls.forEach((release) => release(readyAppId));
        this.executeAfterEmbedContainerLoaded(async () => {
            // Open the App only once the shown config's params apply.
            await this.preRenderParamsApplied;
            if (this.destroyed) return;
            if (!this.paramsPosted) {
                this.refuseOpen();
                return;
            }
            this.openCurrentApp();
            this.probeReadiness(confirm);
        });
    }

    public async showPreRender(): Promise<TsEmbed> {
        // A connected pre-render is shown without render(), so check here too.
        if (this.destroyed || this.refuseFrame()) {
            return this;
        }
        // With no id the base shows nothing: calls keep rejecting at once.
        if (this.getPreRenderConfig().id) this.renderRequested = true;
        this.adoptOwnerAppState();
        this.hidden = false;
        const key = this.packedKey();
        // Values the frame does not have restart the App, a failed open too.
        // The same values change nothing: a failure stands.
        this.showChanges = key !== this.givenKey;
        if (this.showChanges) this.openFailed = false;
        if (!this.openFailed && key !== this.confirmedKey) this.armWatchdog();
        await super.showPreRender();
        // Listening again, the embed answers the reloaded frame's APP_INIT.
        if (this.reloadOnShow) {
            this.reloadOnShow = false;
            this.pointFrameAtCurrentApp();
            super.trigger(HostEvent.Reload).catch((error) => logger.warn(error));
        }
        return this;
    }

    // The frame's last owner saw its events: same App, take its state; another
    // App, showing moves the frame, so start over.
    private adoptOwnerAppState(): void {
        const owner = this.getPreRenderObj<DataAppEmbed>();
        if (!owner || owner === this) return;
        // The frame has signed in, unless its owner knows it has not.
        this.authInitSeen = owner.authInitSeen !== false;
        this.confirmedKey = owner.confirmedKey;
        this.givenKey = owner.givenKey;
        if (owner.viewConfig?.dataAppId !== this.viewConfig.dataAppId) {
            this.resetAppState(false);
            return;
        }
        this.readyAppId = owner.readyAppId;
        this.openFailed = owner.openFailed;
    }

    /**
     * Hides the pre-rendered App. Hidden, the embed hears nothing from the
     * App, so no `DATA_APP_OPEN_NOT_CONFIRMED` is raised until it is shown
     * again.
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     */
    public hidePreRender(): void {
        this.hidden = true;
        this.disarmWatchdog();
        super.hidePreRender();
    }

    /**
     * Raises `DATA_APP_UPDATE_FAILED` for a change of the React
     * `dataAppControls` prop that fails.
     * @param error - The {@link DataAppControlError} of the change.
     * @hidden
     */
    public reportUpdateFailed(error: unknown): void {
        this.raiseWarning(errorEvent(
            ErrorDetailsTypes.API,
            EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
            ERROR_MESSAGE.DATA_APP_UPDATE_FAILED,
            EmbedErrorSeverity.SEV3,
            error === undefined ? undefined : { error },
        ));
    }

    /**
     * Destroys the embed. App calls still waiting for the App reject with
     * `APP_NOT_READY`, and calls sent and not answered with `SESSION_LOST`.
     * @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot Cloud: 27.2.0.cl
     */
    public destroy(): void {
        this.destroyed = true;
        this.disarmWatchdog();
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
     * `HostEvent.GetDataAppControls` and `HostEvent.UpdateDataAppControls`
     * wait for the App to be ready, within 30 seconds, and reject every
     * failure with a {@link DataAppControlError}.
     *
     * `HostEvent.Reload` reopens the App that is open, including one opened
     * with `navigateToDataApp()` and one that failed to open, with its
     * `dataAppControls`. App calls still waiting reject with `APP_NOT_READY`,
     * and calls sent and not answered with `SESSION_LOST`. On a hidden
     * pre-render, the frame reloads when it is shown again.
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
            this.reloads += 1;
            this.resetAppState(false);
            this.endSentCalls();
            // The reloaded frame asks for the values and signs in again.
            this.givenKey = canonicalJson(undefined);
            this.authInitSeen = false;
            // Hidden, the frame's APP_INIT would go unanswered: reload on show.
            if (this.hidden) {
                this.reloadOnShow = true;
                return null;
            }
            this.armWatchdog();
            this.pointFrameAtCurrentApp();
        }
        return super.trigger(messageType, data, context);
    }
}
