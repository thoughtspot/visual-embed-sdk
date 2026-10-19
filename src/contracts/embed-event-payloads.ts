/**
 * Copyright (c) 2026
 *
 * Typed payload contracts for {@link EmbedEvent}s (ThoughtSpot app -> SDK).
 *
 * The SDK delivers embed events to `embed.on()` callbacks wrapped in the
 * {@link MessagePayload} envelope `{ type, data, status? }`. {@link
 * EmbedEventDataExtension} types the `data` field per event; events absent from
 * it resolve to `any`. Shapes are composed from a few scope mixins so related
 * events share one definition, and each is loose: known fields are typed, and
 * the host may send more, so unknown keys stay `any` (a callback reading an
 * un-typed field keeps compiling).
 *
 * These mirror the host app's `embed-event-schema` (dispatch side). Codify what
 * the host actually sends, not what the docs say, and keep the two in sync.
 * Same additive-only evolution rules as host-event-contracts.ts.
 * @module contracts
 */
import type {
    CustomActionPayload, EmbedEvent, MessagePayload, RuntimeFilter,
} from '../types';
// Type-only: AnswerService is an SDK-side enrichment (see
// EmbedEventEnvelopeExtension). Type-only import keeps the contracts subpath
// free of any runtime dependency on the answer-service implementation.
import type { AnswerService } from '../utils/graphql/answerService/answerService';

export interface LiveboardRenderedTabInfo {
    id: string;
    name: string;
}

export interface LiveboardVizInfo {
    /** ID of the tile. It is not the ID of the answer. */
    vizId: string;
    vizName?: string;
    /** Type of the tile, for example `PINNED_ANSWER` or `NOTE_TILE`. */
    vizType?: string;
    /** For example `KPI`, `LINE`, or `NONE` for a table. Note tiles do not have it. */
    chartType?: string;
    /** Note tiles do not have it. */
    answerId?: string;
    dataSourceIds?: string[];
    isTimeSeries?: boolean;
    tabId?: string;
    /** Set when the tile is in a group from `groups`. */
    groupId?: string;
}

export interface LiveboardGroupInfo {
    groupId: string;
    name?: string;
    tabId?: string;
    vizIds: string[];
}

export interface LiveboardRenderedData {
    liveboardId?: string;
    name?: string;
    description?: string;
    activeTabId?: string;
    tabs?: LiveboardRenderedTabInfo[];
    /** Number of tiles in `visualizations`, including Note tiles. */
    vizCount?: number;
    /** The tiles in layout order. Tiles in a group are included. */
    visualizations?: LiveboardVizInfo[];
    groups?: LiveboardGroupInfo[];
    /** GUID of the Personalized View that is applied, if any. */
    activeViewId?: string;
    /** GUID of the default Personalized View, if any. */
    defaultViewId?: string;
    /**
     * Access level of the user to the Liveboard: `MODIFY`,
     * `MODIFY_METADATA_READ_CONTENT`, `READ_METADATA_MODIFY_CONTENT`, `READ_ONLY`,
     * or `NO_ACCESS`.
     */
    objectAccessLevel?: string;
    dataSourceNamesWithNoAccess?: string[];
    personalisedViews?: { viewId: string; viewName: string }[];
    /**
     * Number of filter groups in the Liveboard.
     * To get the filters, use {@link HostEvent.GetFilters}.
     */
    filterGroupCount?: number;
    /** To get the parameters, use {@link HostEvent.GetParameters}. */
    parameterCount?: number;
    [key: string]: any;
}

// ============================================================================
// Scope mixins — the field clusters events share.
// ============================================================================

/**
 * Base for every payload. Known fields are declared on the interfaces below;
 * additional fields the host may send stay `any`, so a callback reading one
 * keeps compiling.
 */
export interface EmbedEventPayloadBase {
    [key: string]: any;
}

/** Present on events raised from a Spotter conversation. */
export interface ConversationScope extends EmbedEventPayloadBase {
    convId?: string;
    messageId?: string;
}

/** Scoped to a single visualization (optionally within a conversation). */
export interface VizScope extends ConversationScope {
    vizId?: string;
}

/** Scoped to a Liveboard. */
export interface LiveboardScope extends EmbedEventPayloadBase {
    liveboardId?: string;
}

/** Scoped to an Answer. */
export interface AnswerScope extends EmbedEventPayloadBase {
    answerId?: string;
    vizId?: string;
}

/** Actions available on a viz within a Liveboard. */
export interface LiveboardVizScope extends LiveboardScope, VizScope {}

/** An empty payload — the event carries no data. */
export type EmptyPayload = Record<string, never>;

// ============================================================================
// Event payloads — one interface per distinct shape.
// ============================================================================

/** The answer data backing the embed, delivered with {@link EmbedEvent.Data}. */
export interface DataEventPayload extends VizScope {
    embedAnswerData?: any;
}

/** {@link EmbedEvent.Error}. `message` may be a single string or a list. */
export interface EmbedErrorPayload extends EmbedEventPayloadBase {
    errorType?: any;
    message?: string | string[];
    code?: any;
    error?: { message?: string };
    errors?: string[];
}

export interface FilterChangedPayload extends EmbedEventPayloadBase {
    liveboardFilters?: any[];
    runtimeFilters?: RuntimeFilter[];
}

export interface CrossFilterChangedPayload extends EmbedEventPayloadBase {
    action?: string;
    filterContentList?: any;
    filterRemoved?: string[];
    removableColumnsFilterContent?: any;
}

export interface ParameterChangedPayload extends ConversationScope {
    parameters?: any[];
}

export interface QueryChangedPayload extends VizScope {
    search?: string;
}

/**
 * Data-source(s) chosen in the picker. The host sends an object; older hosts may
 * send a bare list of worksheet ids, so {@link EmbedEvent.DataSourceSelected}
 * resolves to `string[] | DataSourceSelectedPayload`.
 */
export interface DataSourceSelectedPayload extends EmbedEventPayloadBase {
    worksheetId?: string;
    worksheetName?: string;
    worksheetIds?: string[];
}

/** Shared by {@link EmbedEvent.VizPointClick} and its siblings. */
export interface VizInteractionPayload extends VizScope {
    clickedPoint?: any;
    selectedPoints?: any[];
    embedAnswerData?: any;
}

export interface DrilldownPayload extends ConversationScope {
    drillColumn?: any;
    clickedPoint?: any;
    selectedPoints?: any[];
}

export interface TableVizRenderedPayload extends VizScope {
    id?: string;
    data?: any;
}

export interface SaveEventPayload extends LiveboardVizScope {
    answerId?: string;
}

export interface MakeACopyPayload extends LiveboardVizScope {
    newLiveboardId?: string;
}

/** Downloads, either viz/answer scoped or Liveboard scoped. */
export interface DownloadEventPayload extends VizScope {
    answerId?: string;
    liveboardId?: string;
}

/** TML export/edit/update — answer or Liveboard scoped. */
export interface TmlEventPayload extends EmbedEventPayloadBase {
    answerId?: string;
    liveboardId?: string;
    vizId?: string;
}

export interface AnswerChartSwitcherPayload extends ConversationScope {
    answerId?: string;
    /** The mode switched to (chart or table). */
    chartType?: string;
}

export interface CopyToClipboardPayload extends ConversationScope {
    answerId?: string;
}

export interface PinEventPayload extends VizScope {
    liveboardId?: string;
    containerId?: string;
    answerId?: string;
}

export interface CopyLinkPayload extends LiveboardScope {
    vizId?: string;
    metricId?: any;
}

export interface FavoritePayload extends LiveboardScope {
    isFavorite?: boolean;
}

export interface TestScheduleEmailPayload extends LiveboardScope {
    sendToSelf?: boolean;
}

/** Note: the app sends `liveboardID` (capital ID) for this event. */
export interface RenamePayload extends EmbedEventPayloadBase {
    liveboardID?: string;
    vizId?: string;
    title?: string;
    description?: string;
}

export interface PersonalisedViewPayload extends LiveboardScope {
    viewName?: string;
    viewId?: string;
    isPublic?: boolean;
}

export interface ExitPresentModePayload extends EmbedEventPayloadBase {
    type?: string;
    data?: any;
}

/** Tab metadata within a Liveboard header. */
export interface LiveboardTabInfo {
    id?: string;
    name?: string;
    vizCount?: number;
    filters?: LiveboardFilterInfo[];
}

/** Ordered tab reference within a Liveboard header. */
export interface LiveboardOrderedTab {
    tabId?: string;
    tabName?: string;
}

/** Individual filter condition within a Liveboard filter. */
export interface LiveboardFilterContent {
    filterType?: string;
    isNegated?: boolean;
    values?: string[];
}

/** Filter applied to a Liveboard or tab. */
export interface LiveboardFilterInfo {
    columnName?: string;
    dataType?: string;
    columnType?: string;
    isEditable?: boolean;
    isMandatory?: boolean;
    dataSource?: string;
    filterContent?: LiveboardFilterContent[];
}

/** Parameter defined on a Liveboard. */
export interface LiveboardParameterInfo {
    id?: string;
    name?: string;
    description?: string;
    dataType?: string;
    defaultValue?: string;
    overrideValue?: string;
    valueType?: string;
}

/** {@link EmbedEvent.LiveboardHeaderLoaded}. */
export interface LiveboardHeaderLoadedPayload extends LiveboardScope {
    name?: string;
    description?: string;
    author?: { id?: string; displayName?: string };
    dateCreated?: number;
    dateModified?: number;
    modifiedBy?: string;
    isFavorite?: boolean;
    isDiscoverable?: boolean;
    permission?: string;
    dataSourceAccessLevel?: string;
    orderedTabs?: LiveboardOrderedTab[];
    tabs?: LiveboardTabInfo[];
    liveboardFilters?: LiveboardFilterInfo[];
    parameters?: LiveboardParameterInfo[];
}

export interface LiveboardTopUser {
    id?: string;
    displayName?: string;
}

/**
 * {@link EmbedEvent.LiveboardTopUsersLoaded}. containing the top users info for the
 * Liveboard.
 */
export interface LiveboardTopUsersLoadedPayload extends LiveboardScope {
    topUsers?: LiveboardTopUser[];
}

/** {@link EmbedEvent.AuthInit}. */
export interface AuthInitPayload extends EmbedEventPayloadBase {
    /** Whether authentication was successful. */
    isLoggedIn?: boolean;
}

// ============================================================================
// The map — every typed embed event, grouped by domain.
// ============================================================================

/**
 * Typed `data` field per embed event. Events not listed resolve to `any`.
 */
export interface EmbedEventDataExtension {
    // --- Lifecycle and auth ---
    [EmbedEvent.AuthInit]: AuthInitPayload;
    [EmbedEvent.EmbedListenerReady]: Record<string, any>;
    [EmbedEvent.Error]: EmbedErrorPayload | string;

    // --- Custom actions ---
    /**
     * Fired when a callback-type custom action is triggered. Use
     * `payload.data.id` to identify which action fired; see also
     * {@link CustomActionEventPayload} for the `answerService` enrichment.
     */
    [EmbedEvent.CustomAction]: CustomActionPayload;

    // --- Filters and parameters ---
    [EmbedEvent.FilterChanged]: FilterChangedPayload;
    [EmbedEvent.CrossFilterChanged]: CrossFilterChangedPayload;
    [EmbedEvent.ParameterChanged]: ParameterChangedPayload;

    // --- Visualization interactions ---
    [EmbedEvent.VizPointClick]: VizInteractionPayload;
    [EmbedEvent.VizPointDoubleClick]: VizInteractionPayload;
    [EmbedEvent.VizPointRightClick]: VizInteractionPayload;
    [EmbedEvent.Drilldown]: DrilldownPayload;
    [EmbedEvent.TableVizRendered]: TableVizRenderedPayload;

    // --- Data and query ---
    [EmbedEvent.Data]: DataEventPayload;
    [EmbedEvent.QueryChanged]: string | QueryChangedPayload;

    // --- Answer and viz actions ---
    [EmbedEvent.Save]: SaveEventPayload;
    [EmbedEvent.Edit]: LiveboardVizScope;
    [EmbedEvent.Present]: LiveboardVizScope;
    [EmbedEvent.Explore]: LiveboardVizScope;
    [EmbedEvent.MakeACopy]: MakeACopyPayload;
    [EmbedEvent.AnswerDelete]: AnswerScope;
    [EmbedEvent.AnswerChartSwitcher]: AnswerChartSwitcherPayload;
    [EmbedEvent.CopyToClipboard]: CopyToClipboardPayload;
    [EmbedEvent.SpotIQAnalyze]: AnswerScope;
    [EmbedEvent.ShowUnderlyingData]: AnswerScope;
    [EmbedEvent.AddToCoaching]: VizScope;
    [EmbedEvent.Pin]: PinEventPayload;

    // --- Downloads ---
    [EmbedEvent.Download]: VizScope;
    [EmbedEvent.DownloadAsPng]: DownloadEventPayload;
    [EmbedEvent.DownloadAsCsv]: DownloadEventPayload;
    [EmbedEvent.DownloadAsXlsx]: DownloadEventPayload;
    [EmbedEvent.DownloadAsPdf]: DownloadEventPayload;
    [EmbedEvent.DownloadLiveboardAsContinuousPDF]: LiveboardScope;

    // --- TML ---
    [EmbedEvent.ExportTML]: TmlEventPayload;
    [EmbedEvent.EditTML]: TmlEventPayload;
    [EmbedEvent.UpdateTML]: TmlEventPayload;

    // --- Liveboard actions ---
    [EmbedEvent.Cancel]: LiveboardScope;
    [EmbedEvent.Delete]: LiveboardScope;
    [EmbedEvent.Schedule]: LiveboardScope;
    [EmbedEvent.SchedulesList]: LiveboardScope;
    [EmbedEvent.SendTestScheduleEmail]: TestScheduleEmailPayload;
    [EmbedEvent.LiveboardInfo]: LiveboardScope;
    [EmbedEvent.AIHighlights]: LiveboardScope;
    [EmbedEvent.Rename]: RenamePayload;
    [EmbedEvent.AddToFavorites]: FavoritePayload;
    [EmbedEvent.CopyLink]: CopyLinkPayload;
    [EmbedEvent.ExitPresentMode]: ExitPresentModePayload;

    // --- Personalised views ---
    [EmbedEvent.SavePersonalisedView]: PersonalisedViewPayload;
    [EmbedEvent.UpdatePersonalisedView]: PersonalisedViewPayload;

    // --- Columns and sources ---
    [EmbedEvent.AddRemoveColumns]: string[];
    [EmbedEvent.DataSourceSelected]: string[] | DataSourceSelectedPayload;

    // --- Dialogs and lifecycle ---
    [EmbedEvent.DialogOpen]: EmptyPayload;
    [EmbedEvent.DialogClose]: EmptyPayload;
    [EmbedEvent.LiveboardHeaderLoaded]: LiveboardHeaderLoadedPayload;
    [EmbedEvent.LiveboardTopUsersLoaded]: LiveboardTopUsersLoadedPayload;
    [EmbedEvent.LiveboardRendered]: LiveboardRenderedData;
    [EmbedEvent.RequestVisibleEmbedCoordinates]: EmptyPayload;
    [EmbedEvent.EmbedIframeCenter]: EmptyPayload;
}

// ============================================================================
// Resolvers — what `on()` delivers and how to annotate a callback.
// ============================================================================

/**
 * Resolves the typed `data` payload for an embed event; `any` when the
 * event has not been audited/typed yet.
 */
export type EmbedEventData<EmbedEventT extends EmbedEvent> =
    EmbedEventT extends keyof EmbedEventDataExtension
        ? EmbedEventDataExtension[EmbedEventT]
        : any;

/**
 * Full envelope delivered to `embed.on()` callbacks for a given event:
 * the wire fields (`type`, `status`) plus the typed `data`.
 */
export type EmbedEventPayload<EmbedEventT extends EmbedEvent> =
    Omit<MessagePayload, 'data'> & {
        data: EmbedEventData<EmbedEventT>;
    };

/**
 * Payload delivered to `on(EmbedEvent.CustomAction)`. Beyond the wire fields,
 * the SDK attaches an {@link AnswerService} built from the event's session and
 * answer data (see utils/processData.ts `processCustomAction`) — annotate your
 * callback with this type to access it:
 *
 * ```ts
 * embed.on(EmbedEvent.CustomAction, (payload: CustomActionEventPayload) => {
 *   if (payload.data.id === 'my-action') {
 *     payload.answerService?.getUnderlyingDataForPoint([]);
 *   }
 * });
 * ```
 *
 * It is a dedicated type rather than folded into `on()`'s generic callback
 * because the SDK's event registry types callbacks as the plain
 * {@link MessagePayload}, which the enrichment cannot be intersected into
 * without restructuring that registry.
 */
export type CustomActionEventPayload =
    EmbedEventPayload<EmbedEvent.CustomAction> & { answerService?: AnswerService };

/**
 * String-name keyed view for the host side (addresses events by wire value).
 */
export type EmbedEventName = `${EmbedEvent}`;
