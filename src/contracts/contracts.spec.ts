/**
 * Contract drift guardrails.
 *
 * These tests are the CI gate for the additive-only contract policy:
 * - The explicit wire-value lists below record which events have TYPED
 *   contracts. Removing an event from the typed maps (or renaming its wire
 *   value) fails the equality check and must be treated as a breaking change,
 *   not a refactor.
 * - Type-level assertions verify the request/response resolution helpers
 *   keep resolving typed events to their contracts and unknown events to
 *   `any` (backward compatibility).
 *
 * When a list check fails: if you ADDED an event, add its wire value to the
 * expected list here. If an existing entry disappeared or changed value,
 * stop — that breaks published SDK consumers and the host runtime validation
 * derived from these contracts.
 */
import { HostEvent, EmbedEvent } from '../types';
import { UIPassthroughEvent } from './ui-passthrough-contracts';
import type {
    HostEventRequest,
    HostEventResponse,
    NavigateRequest,
    SetActiveTabRequest,
} from './host-event-contracts';
import type { CustomActionPayload, RuntimeFilter } from '../types';
import type {
    CustomActionEventPayload,
    EmbedEventData,
    EmbedEventPayload,
} from './embed-event-payloads';

// Events with explicitly typed contracts in HostEventContractExtension.
// Keep in sync with the interface — this list is what the snapshot locks.
const TYPED_HOST_EVENTS: HostEvent[] = [
    // Filters and parameters
    HostEvent.UpdateRuntimeFilters,
    HostEvent.UpdateParameters,
    HostEvent.UpdateFilters,
    HostEvent.UpdateCrossFilter,
    HostEvent.OpenFilter,
    HostEvent.OpenParameter,
    // Tabs and vizs
    HostEvent.SetVisibleVizs,
    HostEvent.SetVisibleTabs,
    HostEvent.SetHiddenTabs,
    HostEvent.SetActiveTab,
    // Navigation
    HostEvent.Navigate,
    // Search and columns
    HostEvent.Search,
    HostEvent.ResetSearch,
    HostEvent.AddColumns,
    HostEvent.RemoveColumn,
    // Viz-scoped actions
    HostEvent.Edit,
    HostEvent.Save,
    HostEvent.Delete,
    HostEvent.Share,
    HostEvent.Present,
    HostEvent.CopyLink,
    HostEvent.ExportTML,
    HostEvent.EditTML,
    HostEvent.UpdateTML,
    HostEvent.SchedulesList,
    HostEvent.Schedule,
    HostEvent.SpotIQAnalyze,
    HostEvent.ShowUnderlyingData,
    HostEvent.CreateMonitor,
    HostEvent.ManageMonitor,
    HostEvent.SyncToSheets,
    HostEvent.SyncToOtherApps,
    HostEvent.ManagePipelines,
    HostEvent.DownloadAsPng,
    HostEvent.DownloadAsCsv,
    HostEvent.DownloadAsXlsx,
    HostEvent.DownloadAsPdf,
    HostEvent.Explore,
    HostEvent.AskSage,
    HostEvent.AskSpotter,
    HostEvent.AnswerChartSwitcher,
    // Liveboard
    HostEvent.UpdatePersonalisedView,
    HostEvent.SelectPersonalizedView,
    HostEvent.ResetLiveboardPersonalisedView,
    HostEvent.AIHighlights,
    HostEvent.SendTestScheduleEmail,
    HostEvent.RefreshLiveboardBrowserCache,
    // Spotter
    HostEvent.SpotterSearch,
    HostEvent.ResetSpotterConversation,
    HostEvent.ShareSpotterConversation,
    HostEvent.CloseSpotterShareConversation,
    HostEvent.ExitSpotterSharedConversation,
    HostEvent.PinSpotterConversation,
    HostEvent.UnpinSpotterConversation,
    HostEvent.EditLastPrompt,
    HostEvent.DeleteLastPrompt,
    HostEvent.PreviewSpotterData,
    HostEvent.SpotterVizSendUserMessage,
    HostEvent.InitSpotterVizConversation,
    HostEvent.OpenSpotterVizPanel,
    HostEvent.CloseSpotterVizPanel,
];

// Type-level assertions: compile failures here mean contract resolution
// regressed. `expectType` is erased at runtime.
const expectType = <T>(value: T): T => value;

describe('event contracts (drift guardrails)', () => {
    // The lists below LOCK the set of typed events. Adding an event is an
    // intentional, additive edit here; a removed/renamed wire value fails this
    // test — which is the signal that it is a breaking change, not a refactor.
    test('typed host event wire values are stable (additive-only)', () => {
        expect(TYPED_HOST_EVENTS.map((event) => `${event}`).sort()).toEqual([
            'AIHighlights',
            'AskSage',
            'AskSpotter',
            'CloseSpotterShareConversation',
            'CloseSpotterVizPanel',
            'DeleteLastPrompt',
            'EditLastPrompt',
            'ExitSpotterSharedConversation',
            'InitSpotterVizConversation',
            'Navigate',
            'OpenSpotterVizPanel',
            'PinSpotterConversation',
            'PreviewSpotterData',
            'ResetLiveboardPersonalisedView',
            'ResetSpotterConversation',
            'SelectPersonalisedView',
            'SetActiveTab',
            'SetPinboardHiddenTabs',
            'SetPinboardVisibleTabs',
            'SetPinboardVisibleVizs',
            'ShareSpotterConversation',
            'SpotterSearch',
            'SpotterVizSendUserMessage',
            'UnpinSpotterConversation',
            'UpdateCrossFilter',
            'UpdateParameters',
            'UpdatePersonalisedView',
            'UpdateRuntimeFilters',
            'addColumns',
            'answerChartSwitcher',
            'createMonitor',
            'downloadAsCSV',
            'downloadAsPdf',
            'downloadAsPng',
            'downloadAsXLSX',
            'edit',
            'editTSL',
            'embedDocument',
            'explore',
            'exportTSL',
            'manage-pipeline',
            'manageMonitor',
            'onDeleteAnswer',
            'openFilter',
            'openParameter',
            'present',
            'refreshLiveboardBrowserCache',
            'removeColumn',
            'resetSearch',
            'save',
            'schedule-list',
            'search',
            'sendTestScheduleEmail',
            'share',
            'showUnderlyingData',
            'spotIQAnalyze',
            'subscription',
            'sync-to-other-apps',
            'sync-to-sheets',
            'updateFilters',
            'updateTSL',
        ]);
    });

    test('UI passthrough wire values are stable (additive-only)', () => {
        expect(Object.values(UIPassthroughEvent).sort()).toEqual([
            'addVizToPinboard',
            'drillDown',
            'getAnswerPageConfig',
            'getAnswerSession',
            'getAvailableUiPassthroughs',
            'getDiscoverabilityStatus',
            'getExportRequestForCurrentPinboard',
            'getFilters',
            'getGroups',
            'getIframeUrl',
            'getParameters',
            'getPinboardPageConfig',
            'getTML',
            'getTabs',
            'getUnsavedAnswerTML',
            'saveAnswer',
            'updateFilters',
        ]);
    });

    test('every typed host event is a real HostEvent member', () => {
        const allHostEventValues = new Set<string>(Object.values(HostEvent));
        TYPED_HOST_EVENTS.forEach((event) => {
            expect(allHostEventValues.has(event)).toBe(true);
        });
    });

    test('contract resolution helpers compile against the typed map', () => {
        // Typed event resolves to its contract type.
        expectType<RuntimeFilter[]>(
            (undefined as unknown) as HostEventRequest<HostEvent.UpdateRuntimeFilters>,
        );
        expectType<SetActiveTabRequest>(
            (undefined as unknown) as HostEventRequest<HostEvent.SetActiveTab>,
        );
        expectType<string | number | NavigateRequest>(
            (undefined as unknown) as HostEventRequest<HostEvent.Navigate>,
        );
        // Untyped event stays `any` (backward compatible).
        const untyped: HostEventRequest<HostEvent.LiveboardInfo> = { anything: 'goes' };
        expect(untyped).toBeDefined();
        // Response helper resolves for UI-passthrough-backed events.
        expectType<HostEventResponse<HostEvent.GetTabs>>(
            (undefined as unknown) as HostEventResponse<HostEvent.GetTabs>,
        );
    });

    test('embed event enum wire values referenced by typed payloads are stable', () => {
        expect(
            [
                EmbedEvent.AuthInit,
                EmbedEvent.EmbedListenerReady,
                EmbedEvent.CustomAction,
            ].map((e) => `${e}`).sort(),
        ).toEqual([
            'EmbedListenerReady',
            'authInit',
            'customAction',
        ]);
    });

    test('CustomAction resolves to its typed payload; answerService on the dedicated type', () => {
        // Wire data resolves to CustomActionPayload.
        expectType<CustomActionPayload>(
            (undefined as unknown) as EmbedEventData<EmbedEvent.CustomAction>,
        );
        // payload.data.id is a typed string (type-level indexed access).
        expectType<string>(
            (undefined as unknown) as EmbedEventPayload<EmbedEvent.CustomAction>['data']['id'],
        );
        // The dedicated type carries the SDK-added answerService (optional).
        type AnswerServiceField = CustomActionEventPayload['answerService'];
        const svc: AnswerServiceField = undefined;
        expect(svc).toBeUndefined();
        // Untyped embed event stays `any` (backward compatible).
        const untyped: EmbedEventData<EmbedEvent.Data> = { anything: 'goes' };
        expect(untyped).toBeDefined();
    });
});
