/**
 * Copyright (c) 2026
 *
 * Typed contracts for {@link HostEvent} requests and responses.
 *
 * This module is the single source of truth for host event payload shapes.
 * It is published under the `@thoughtspot/visual-embed-sdk/contracts` subpath
 * so the ThoughtSpot app (host) can consume the exact same contract types the
 * SDK compiles against, preventing SDK <-> host contract drift.
 *
 * Contract evolution rules (enforced by contracts.spec.ts snapshot):
 * - Additive only: new events and new OPTIONAL fields may be added.
 * - Never remove or rename an event key, or change an existing field's type.
 * - An event absent from the maps below intentionally resolves to `any`
 *   (untyped, backward compatible) until it is audited and added.
 * @module contracts
 */
import type {
    ContextType,
    HostEvent,
    RuntimeFilter,
    RuntimeParameter,
} from '../types';
import type {
    Applicability,
    EmbedApiHostEventMapping,
    UIPassthroughContractBase,
    UIPassthroughRequest,
    UIPassthroughResponse,
} from '../embed/hostEventClient/contracts';

/**
 * Shorthand for a contract entry whose response shape is not formally
 * specified yet. Tightening a response later is additive for readers;
 * never loosen an already-typed response.
 */
type ContractEntryOf<RequestT> = { request: RequestT; response: any };

/**
 * Request for host events that MAY target a specific visualization.
 * Omitting vizId targets the current answer/liveboard as a whole.
 * (In some contexts, e.g. Spotter, the app requires vizId at runtime.)
 */
export interface VizScopedRequest {
    vizId?: string;
}

/**
 * Request for host events that MUST target a specific visualization.
 */
export interface RequiredVizRequest {
    vizId: string;
}

/**
 * Request for Spotter conversation-scoped host events.
 */
export interface ConversationScopedRequest {
    conversationId: string;
}

/**
 * Request payload for {@link HostEvent.OpenFilter}. Field requirements
 * vary by context (Search requires columnId/type/dataType/name); the
 * contract is the cross-context superset — the app validates per context
 * at runtime.
 */
export interface OpenFilterRequest {
    column: {
        columnId?: string;
        columnName?: string;
        type?: string;
        dataType?: string;
        name?: string;
        isStrictDateColumn?: boolean;
    };
    applicability?: Applicability;
    visualizationId?: string;
    liveboardId?: string;
}

/**
 * Request payload for {@link HostEvent.OpenParameter}. One of parameterId
 * or parameterName must be provided (validated at runtime).
 */
export interface OpenParameterRequest {
    parameter: {
        parameterId?: string;
        parameterName?: string;
    };
    applicability?: Applicability;
}

/**
 * Request payload for {@link HostEvent.Search}.
 */
export interface SearchRequest {
    searchQuery: string;
    dataSources: string[];
    execute?: boolean;
}

/**
 * Request payload for {@link HostEvent.SpotterSearch}.
 */
export interface SpotterSearchRequest {
    query: string;
    executeSearch: boolean;
}

/**
 * A single cross-filter condition for {@link HostEvent.UpdateCrossFilter}.
 */
export interface CrossFilterCondition {
    columnName?: string;
    operator?: string;
    values: Array<string | number | boolean>;
}

/**
 * Request payload for {@link HostEvent.UpdateCrossFilter}.
 */
export interface UpdateCrossFilterRequest {
    vizId: string;
    conditions: CrossFilterCondition[];
}

/**
 * A single filter entry for {@link HostEvent.UpdateFilters}. Supports both
 * the current (columnName/operator) and legacy (column/oper) field names.
 */
export interface HostFilterUpdate {
    columnName?: string;
    columnId?: string;
    operator?: string;
    values: Array<string | number | boolean>;
    type?: string;
    datePeriod?: string;
    negate?: boolean;
    /** Legacy field name for columnName. */
    column?: string;
    /** Legacy field name for operator. */
    oper?: string;
    applicability?: Applicability;
}

/**
 * Request payload for {@link HostEvent.UpdateFilters} (singular or plural
 * form).
 */
export interface UpdateFiltersRequest {
    filter?: HostFilterUpdate;
    filters?: HostFilterUpdate[];
}

/**
 * Request payload for personalised-view host events.
 */
export interface PersonalisedViewRequest {
    viewId?: string;
    viewName?: string;
}

/**
 * Request payload for schedule-email related host events.
 */
export interface ScheduleEmailRequest {
    sendToSelf?: boolean;
}

/**
 * Object form of the {@link HostEvent.Navigate} payload.
 */
export interface NavigateRequest {
    /**
     * Route to navigate to, or a history delta such as `1` or `-1`.
     */
    path: string | number;
    /**
     * When `true`, replaces the current history entry instead of pushing.
     */
    replace?: boolean;
}

/**
 * Request payload for {@link HostEvent.SetActiveTab}.
 */
export interface SetActiveTabRequest {
    /**
     * Id of the liveboard tab to make active.
     */
    tabId: string;
}

/**
 * Typed request/response contracts for host events that do not go through
 * the UI passthrough pipeline.
 *
 * Request shapes are transcribed from the host's runtime validation
 * schemas (embed-util HostEventContract) — the shapes the ThoughtSpot app
 * actually enforces — flattened across contexts to the permissive
 * superset (context-specific requirements are validated at runtime).
 *
 * NOTE: `response` is typed `any` for events whose host-side response
 * shape is not formally specified yet. Tightening a response type later
 * is additive for consumers reading properties off it, but do not LOOSEN
 * an already-typed response.
 *
 * Deliberately absent (do not add without an audit):
 * - DrillDown: the runtime schema (object-shaped points) and the UI
 *   passthrough contract (string-shaped points) disagree — resolve the
 *   drift first.
 * - GetAnswerSession/GetParameters/GetTML: typed via the UI passthrough
 *   mapping; their Spotter-context vizId requirement is runtime-only.
 */
export interface HostEventContractExtension {
    // ==================== FILTERS AND PARAMETERS ====================
    [HostEvent.UpdateRuntimeFilters]: ContractEntryOf<RuntimeFilter[]>;
    [HostEvent.UpdateParameters]: ContractEntryOf<RuntimeParameter[]>;
    [HostEvent.UpdateFilters]: ContractEntryOf<UpdateFiltersRequest>;
    [HostEvent.UpdateCrossFilter]: ContractEntryOf<UpdateCrossFilterRequest>;
    [HostEvent.OpenFilter]: ContractEntryOf<OpenFilterRequest>;
    [HostEvent.OpenParameter]: ContractEntryOf<OpenParameterRequest>;

    // ==================== TABS AND VIZS ====================
    [HostEvent.SetVisibleVizs]: ContractEntryOf<string[]>;
    [HostEvent.SetVisibleTabs]: ContractEntryOf<string[]>;
    [HostEvent.SetHiddenTabs]: ContractEntryOf<string[]>;
    [HostEvent.SetActiveTab]: ContractEntryOf<SetActiveTabRequest>;

    // ==================== NAVIGATION ====================
    [HostEvent.Navigate]: ContractEntryOf<string | number | NavigateRequest>;

    // ==================== SEARCH AND COLUMNS ====================
    [HostEvent.Search]: ContractEntryOf<SearchRequest>;
    [HostEvent.ResetSearch]: ContractEntryOf<void>;
    [HostEvent.AddColumns]: ContractEntryOf<{ columnIds: string[] }>;
    [HostEvent.RemoveColumn]: ContractEntryOf<{ columnId: string }>;

    // ==================== VIZ-SCOPED ACTIONS ====================
    // vizId optional in most contexts; some contexts require it at runtime.
    [HostEvent.Edit]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.Save]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.Delete]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.Share]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.Present]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.CopyLink]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.ExportTML]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.EditTML]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.UpdateTML]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.SchedulesList]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.Schedule]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.SpotIQAnalyze]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.ShowUnderlyingData]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.CreateMonitor]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.ManageMonitor]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.SyncToSheets]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.SyncToOtherApps]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.ManagePipelines]: ContractEntryOf<VizScopedRequest>;
    // Download shares the downloadAsPng wire value with DownloadAsPng.
    [HostEvent.DownloadAsPng]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.DownloadAsCsv]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.DownloadAsXlsx]: ContractEntryOf<VizScopedRequest>;
    [HostEvent.DownloadAsPdf]: ContractEntryOf<VizScopedRequest & { liveboardId?: string }>;

    // Viz id required in every context.
    [HostEvent.Explore]: ContractEntryOf<RequiredVizRequest>;
    [HostEvent.AskSage]: ContractEntryOf<RequiredVizRequest>;
    [HostEvent.AskSpotter]: ContractEntryOf<RequiredVizRequest>;
    [HostEvent.AnswerChartSwitcher]: ContractEntryOf<RequiredVizRequest>;

    // ==================== LIVEBOARD ====================
    [HostEvent.UpdatePersonalisedView]: ContractEntryOf<Pick<PersonalisedViewRequest, 'viewId'>>;
    [HostEvent.SelectPersonalizedView]: ContractEntryOf<PersonalisedViewRequest>;
    [HostEvent.ResetLiveboardPersonalisedView]: ContractEntryOf<void>;
    [HostEvent.AIHighlights]: ContractEntryOf<void>;
    [HostEvent.SendTestScheduleEmail]: ContractEntryOf<ScheduleEmailRequest>;
    [HostEvent.RefreshLiveboardBrowserCache]: ContractEntryOf<ScheduleEmailRequest>;

    // ==================== SPOTTER ====================
    [HostEvent.SpotterSearch]: ContractEntryOf<SpotterSearchRequest>;
    [HostEvent.ResetSpotterConversation]: ContractEntryOf<void>;
    [HostEvent.ShareSpotterConversation]: ContractEntryOf<ConversationScopedRequest>;
    [HostEvent.CloseSpotterShareConversation]: ContractEntryOf<void>;
    [HostEvent.ExitSpotterSharedConversation]: ContractEntryOf<void>;
    [HostEvent.PinSpotterConversation]: ContractEntryOf<ConversationScopedRequest>;
    [HostEvent.UnpinSpotterConversation]: ContractEntryOf<ConversationScopedRequest>;
    [HostEvent.EditLastPrompt]: ContractEntryOf<string>;
    [HostEvent.DeleteLastPrompt]: ContractEntryOf<void>;
    [HostEvent.PreviewSpotterData]: ContractEntryOf<void>;
    [HostEvent.SpotterVizSendUserMessage]: ContractEntryOf<{ query: string }>;
    [HostEvent.InitSpotterVizConversation]: ContractEntryOf<void>;
    [HostEvent.OpenSpotterVizPanel]: ContractEntryOf<void>;
    [HostEvent.CloseSpotterVizPanel]: ContractEntryOf<void>;
}

/**
 * Resolves the typed request payload for a host event.
 * Resolution order:
 * 1. Explicitly typed contract in {@link HostEventContractExtension}
 * 2. UI passthrough backed contract ({@link EmbedApiHostEventMapping})
 * 3. `any` (event not audited/typed yet — backward compatible)
 */
export type HostEventRequest<HostEventT extends HostEvent> =
    HostEventT extends keyof HostEventContractExtension
        ? HostEventContractExtension[HostEventT]['request']
        : HostEventT extends keyof EmbedApiHostEventMapping
            ? UIPassthroughRequest<EmbedApiHostEventMapping[HostEventT]>
            : any;

/**
 * Resolves the typed response payload for a host event.
 * Same resolution order as {@link HostEventRequest}.
 */
export type HostEventResponse<
    HostEventT extends HostEvent,
    // Reserved for context-dependent response shapes (additive change later).
    ContextT extends ContextType = ContextType,
> = HostEventT extends keyof HostEventContractExtension
    ? HostEventContractExtension[HostEventT]['response']
    : HostEventT extends keyof EmbedApiHostEventMapping
        ? UIPassthroughResponse<EmbedApiHostEventMapping[HostEventT]>
        : any;

/**
 * Payload type accepted by `embed.trigger()`. Keeps the historical
 * `PayloadT` escape hatch so untyped existing call sites keep compiling.
 */
export type TriggerPayload<PayloadT, HostEventT extends HostEvent> =
    PayloadT | HostEventRequest<HostEventT>;

/**
 * Response type returned by `embed.trigger()`.
 */
export type TriggerResponse<
    PayloadT,
    HostEventT extends HostEvent,
    ContextT extends ContextType = ContextType,
> = PayloadT extends HostEventRequest<HostEventT>
    ? HostEventResponse<HostEventT, ContextT>
    : any;

/**
 * String-name keyed views of the contracts, for the host (ThoughtSpot app)
 * side, which addresses events by their wire value (e.g.
 * 'UpdateRuntimeFilters') rather than the {@link HostEvent} enum member.
 */
export type HostEventName = `${HostEvent}`;

/**
 * Resolves a host event's request type from its wire name.
 */
export type HostEventRequestByName<NameT extends string> = {
    [EventT in HostEvent]: `${EventT}` extends NameT
        ? HostEventRequest<EventT>
        : never;
}[HostEvent] extends never
    ? any
    : {
        [EventT in HostEvent]: `${EventT}` extends NameT
            ? HostEventRequest<EventT>
            : never;
    }[HostEvent];

/**
 * Resolves a host event's response type from its wire name.
 */
export type HostEventResponseByName<NameT extends string> = {
    [EventT in HostEvent]: `${EventT}` extends NameT
        ? HostEventResponse<EventT>
        : never;
}[HostEvent] extends never
    ? any
    : {
        [EventT in HostEvent]: `${EventT}` extends NameT
            ? HostEventResponse<EventT>
            : never;
    }[HostEvent];

export type { UIPassthroughContractBase, EmbedApiHostEventMapping };
