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
import * as fs from 'fs';
import * as path from 'path';
import { HostEvent, EmbedEvent, RuntimeFilterOp } from '../types';
import { UIPassthroughEvent } from './ui-passthrough-contracts';
import type {
    HostEventRequest,
    HostEventResponse,
    NavigateRequest,
    SetActiveTabRequest,
    TriggerData,
    OpenFilterRequest,
    OpenFilterSpotterRequest,
    OpenFilterSearchRequest,
} from './host-event-contracts';
import type { CustomActionPayload, RuntimeFilter } from '../types';
import type {
    CustomActionEventPayload,
    EmbedEventData,
    EmbedEventPayload,
} from './embed-event-payloads';
import * as contractsBarrel from './index';

// Events with explicitly typed requests in HostEventRequestMap.
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
    // Appearance
    HostEvent.UpdateTheme,
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
            'UpdateTheme',
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

    test('typed embed event wire values are stable (additive-only)', () => {
        expect(
            [
                EmbedEvent.AIHighlights,
                EmbedEvent.AddRemoveColumns,
                EmbedEvent.AddToCoaching,
                EmbedEvent.AddToFavorites,
                EmbedEvent.AnswerChartSwitcher,
                EmbedEvent.AnswerDelete,
                EmbedEvent.AuthInit,
                EmbedEvent.Cancel,
                EmbedEvent.CopyLink,
                EmbedEvent.CopyToClipboard,
                EmbedEvent.CrossFilterChanged,
                EmbedEvent.CustomAction,
                EmbedEvent.Data,
                EmbedEvent.DataSourceSelected,
                EmbedEvent.Delete,
                EmbedEvent.DialogClose,
                EmbedEvent.DialogOpen,
                EmbedEvent.Download,
                EmbedEvent.DownloadAsCsv,
                EmbedEvent.DownloadAsPdf,
                EmbedEvent.DownloadAsPng,
                EmbedEvent.DownloadAsXlsx,
                EmbedEvent.DownloadLiveboardAsContinuousPDF,
                EmbedEvent.Drilldown,
                EmbedEvent.Edit,
                EmbedEvent.EditTML,
                EmbedEvent.EmbedIframeCenter,
                EmbedEvent.EmbedListenerReady,
                EmbedEvent.Error,
                EmbedEvent.ExitPresentMode,
                EmbedEvent.Explore,
                EmbedEvent.ExportTML,
                EmbedEvent.FilterChanged,
                EmbedEvent.LiveboardInfo,
                EmbedEvent.LiveboardHeaderLoaded,
                EmbedEvent.LiveboardRendered,
                EmbedEvent.MakeACopy,
                EmbedEvent.ParameterChanged,
                EmbedEvent.Pin,
                EmbedEvent.Present,
                EmbedEvent.QueryChanged,
                EmbedEvent.Rename,
                EmbedEvent.RequestVisibleEmbedCoordinates,
                EmbedEvent.Save,
                EmbedEvent.SavePersonalisedView,
                EmbedEvent.Schedule,
                EmbedEvent.SchedulesList,
                EmbedEvent.SendTestScheduleEmail,
                EmbedEvent.ShowUnderlyingData,
                EmbedEvent.SpotIQAnalyze,
                EmbedEvent.TableVizRendered,
                EmbedEvent.UpdatePersonalisedView,
                EmbedEvent.UpdateTML,
                EmbedEvent.VizPointClick,
                EmbedEvent.VizPointDoubleClick,
                EmbedEvent.VizPointRightClick,
            ].map((e) => `${e}`).sort(),
        ).toEqual([
            'AIHighlights',
            'EmbedIframeCenter',
            'EmbedListenerReady',
            'Error',
            'LiveboardHeaderLoaded',
            'PinboardRendered',
            'TableVizRendered',
            'addRemoveColumns',
            'addToCoaching',
            'addToFavorites',
            'answerChartSwitcher',
            'answerDelete',
            'authInit',
            'cancel',
            'context-menu-item-copy-to-clipboard',
            'cross-filter-changed',
            'customAction',
            'data',
            'dataSourceSelected',
            'delete',
            'dialog-close',
            'dialog-open',
            'download',
            'downloadAsCsv',
            'downloadAsPdf',
            'downloadAsPng',
            'downloadAsXlsx',
            'downloadLiveboardAsContinuousPDF',
            'drillDown',
            'edit',
            'editTSL',
            'embedDocument',
            'exitPresentMode',
            'explore',
            'exportTSL',
            'filterChanged',
            'makeACopy',
            'parameterChanged',
            'pin',
            'pinboardInfo',
            'present',
            'queryChanged',
            'rename',
            'requestVisibleEmbedCoordinates',
            'save',
            'savePersonalisedView',
            'schedule-list',
            'sendTestScheduleEmail',
            'showUnderlyingData',
            'spotIQAnalyze',
            'subscription',
            'updatePersonalisedView',
            'updateTSL',
            'vizPointClick',
            'vizPointDoubleClick',
            'vizPointRightClick',
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
        const untyped: EmbedEventData<EmbedEvent.RouteChange> = { anything: 'goes' };
        expect(untyped).toBeDefined();
    });

    test('HostEvent doc examples compile against TriggerData (docs and types must agree)', () => {
        // Payloads copied verbatim from the HostEvent enum @example blocks.
        // If one stops compiling, the docs or the contract is wrong; fix that.
        const trigger = <H extends HostEvent>(_event: H, _data: TriggerData<H>) => true;
        const ok = [
            trigger(HostEvent.UpdateParameters, [{ name: 'Integer Range Param', value: 10, isVisibleToUser: false }]),
            trigger(HostEvent.UpdateParameters, [{
                name: 'Integer Range Param',
                value: 10,
                applicability: { level: 'TAB', targetId: 'e0836cad-4fdf-42d4-bd97-567a6b2a6058' },
            }]),
            trigger(HostEvent.UpdateRuntimeFilters, [
                { columnName: 'state', operator: RuntimeFilterOp.EQ, values: ['michigan'] },
                { columnName: 'product', operator: RuntimeFilterOp.IN, values: ['shoes', 'boots'] },
            ]),
            trigger(HostEvent.UpdateFilters, { filter: { column: 'item type', oper: 'IN', values: ['bags', 'shirts'] } }),
            trigger(HostEvent.UpdateFilters, {
                filter: { column: 'date', oper: 'EQ', values: ['JULY', '2023'], type: 'MONTH_YEAR' },
            }),
            trigger(HostEvent.OpenFilter, {
                column: { columnId: '<column-GUID>', name: 'column name', type: 'ATTRIBUTE', dataType: 'INT64' },
            }),
            trigger(HostEvent.OpenFilter, { column: { columnId: '<column-GUID>' } }),
            trigger(HostEvent.OpenParameter, { parameter: { parameterId: '<parameter-GUID>' } }),
            trigger(HostEvent.OpenParameter, {
                parameter: { parameterId: '<parameter-GUID>' },
                applicability: { level: 'GROUP', targetId: '<group-GUID>' },
            }),
            trigger(HostEvent.UpdateFilters, {
                filter: {
                    column: 'item type',
                    oper: 'IN',
                    values: ['bags', 'shirts'],
                    applicability: { level: 'TAB', targetId: 'e0836cad-4fdf-42d4-bd97-567a6b2a6058' },
                },
            }),
            trigger(HostEvent.OpenFilter, {
                column: { columnId: '<column-GUID>' },
                applicability: { level: 'TAB', targetId: '<tab-GUID>' },
            }),
            trigger(HostEvent.Navigate, -1),
            trigger(HostEvent.Navigate, 'home'),
            trigger(HostEvent.Navigate, { path: 'home', replace: true }),
            trigger(HostEvent.Search, {
                searchQuery: '[sales] by [item type]',
                dataSources: ['cd252e5c-b552-49a8-821d-3eadaa049cca'],
                execute: true,
            }),
            trigger(HostEvent.SetActiveTab, { tabId: '730496d6-6903-4601-937e-2c691821af3c' }),
            trigger(HostEvent.UpdateCrossFilter, {
                vizId: 'b535c760-8bbe-4e6f-bb26-af56b4129a1e',
                conditions: [
                    { columnName: 'Category', values: ['mfgr#12', 'mfgr#14'] },
                    { columnName: 'color', values: ['mint', 'hot'] },
                ],
            }),
            trigger(HostEvent.SpotterSearch, { query: 'revenue per year', executeSearch: true }),
            trigger(HostEvent.UpdateTheme, { isDarkMode: true }),
        ];
        expect(ok.every(Boolean)).toBe(true);
    });

    // Per-context request interfaces are documentation-only today: exported and
    // linked from docs, but trigger() still accepts the cross-context superset.
    test('per-context request interfaces are exported and shaped as documented', () => {
        expectType<OpenFilterSpotterRequest>({ column: { columnId: 'c' } });
        expectType<OpenFilterSearchRequest>(
            { column: { columnId: 'c', dataType: 'INT64' } },
        );
        // The default request stays the cross-context superset.
        expectType<OpenFilterRequest>({} as HostEventRequest<HostEvent.OpenFilter>);
    });

    test('the /contracts barrel re-exports the public runtime surface', () => {
        // Importing the barrel executes its re-exports; assert the runtime
        // values consumers rely on from the /contracts entry point.
        expect(contractsBarrel.UIPassthroughEvent).toBeDefined();
        expect(contractsBarrel.CustomActionsPosition).toBeDefined();
        expect(contractsBarrel.CustomActionTarget).toBeDefined();
        expect(contractsBarrel.ApplicabilityLevel).toBeDefined();
    });

    test('trigger data (TriggerData) autocompletes and flags unknown fields', () => {
        // Contract shape is the contextual type (autocomplete). Unknown fields
        // on object literals fail; omission and non-literal extras do not.
        type UpdateFiltersPayload = TriggerData<HostEvent.UpdateFilters>;

        // Known fields resolve (drives autocomplete + hover).
        const valid: UpdateFiltersPayload = {
            filters: [{ columnName: 'Region', values: ['East'] }],
        };
        // Omitting fields still compiles (all fields optional).
        const empty: UpdateFiltersPayload = {};
        // Extra fields via a variable still compile (no excess check).
        const viaVariable = {
            filters: [{ columnName: 'Region', values: ['East'] }],
            someExtra: 1,
        };
        const loose: UpdateFiltersPayload = viaVariable;
        // Unknown fields on an object literal are flagged — at the top level...
        const topExtra: UpdateFiltersPayload = {
            filters: [],
            // @ts-expect-error — `topLevelExtra` is not on the contract
            topLevelExtra: 1,
        };
        // ...and at any depth.
        const nestedExtra: UpdateFiltersPayload = {
            // @ts-expect-error — `legacyField` is not on the filter contract
            filters: [{ columnName: 'Region', values: ['East'], legacyField: true }],
        };
        // A non-literal sharing no field is flagged (TS weak-type check).
        const unrelated = { totallyDifferent: true };
        // @ts-expect-error — no overlap with the UpdateFilters contract
        const zeroOverlap: UpdateFiltersPayload = unrelated;
        // A wrong TYPE on a known field is flagged.
        const bad: UpdateFiltersPayload = {
            // @ts-expect-error — values must be an array, not a number
            filters: [{ values: 123 }],
        };
        // `{}` is accepted for void events (AIHighlights requires it).
        const voidEmpty: TriggerData<HostEvent.ResetSearch> = {};
        // Unmapped events keep a fully permissive payload.
        const unmapped: TriggerData<HostEvent.Reload> = { anything: 'goes' };

        const all = [valid, empty, loose, topExtra, nestedExtra, zeroOverlap, bad];
        expect([...all, voidEmpty, unmapped].every(Boolean)).toBe(true);
    });

    // Doc <-> type drift guard. Event enum members document their payload with a
    // `Payload: {@link XxxRequest}` / `{@link XxxPayload}` TypeDoc link. TypeScript
    // does NOT validate {@link} targets, so documenting an event's payload without
    // declaring the type ships a dangling doc link and an untyped event. This test
    // fails in exactly that case: every payload link in types.ts must resolve to a
    // real declared contract type.
    test('event doc payload links resolve to a declared type (docs and types must agree)', () => {
        const contractsDir = __dirname;
        const sources = [
            fs.readFileSync(path.join(contractsDir, '../types.ts'), 'utf8'),
            ...fs
                .readdirSync(contractsDir)
                .filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
                .map((f) => fs.readFileSync(path.join(contractsDir, f), 'utf8')),
        ];

        // Every type/interface/enum/class declared across types.ts + contracts.
        const declared = new Set<string>();
        const declRe = /(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?(?:interface|type|enum|class)\s+(\w+)/g;
        for (const src of sources) {
            for (const m of src.matchAll(declRe)) declared.add(m[1]);
        }

        // Payload-shaped {@link} references in the event docs (types.ts).
        const typesSrc = sources[0];
        const linkRe = /\{@link\s+(\w+(?:Request|Payload|Scope))\b[^}]*\}/g;
        const dangling = new Set<string>();
        for (const m of typesSrc.matchAll(linkRe)) {
            if (!declared.has(m[1])) dangling.add(m[1]);
        }

        // If this fails, a doc links a payload type that does not exist — add the
        // type (and map it), or fix the link.
        expect([...dangling]).toEqual([]);
    });

    // Doc drives the type: if an event's TypeDoc documents a payload with a
    // `Payload: {@link X}` link, that event MUST be typed in EmbedEventDataExtension.
    // Otherwise the published doc promises a payload type while `on()` still hands
    // back `any`. Adding the doc link is the trigger; this fails until the event is
    // added to the map.
    test('every embed event with a Payload {@link} is typed in the map', () => {
        const typesSrc = fs.readFileSync(
            path.join(__dirname, '..', 'types.ts'), 'utf8',
        );
        const payloadsSrc = fs.readFileSync(
            path.join(__dirname, 'embed-event-payloads.ts'), 'utf8',
        );

        // Events typed in the map.
        const mapBody = payloadsSrc.match(
            /EmbedEventDataExtension\s*\{([\s\S]*?)\n\}/,
        )?.[1] ?? '';
        const typedMembers = new Set(
            [...mapBody.matchAll(/\[EmbedEvent\.(\w+)\]/g)].map((m) => m[1]),
        );

        // EmbedEvent members whose doc carries a `Payload: {@link ...}` link.
        const enumBody = typesSrc.match(
            /export enum EmbedEvent\s*\{([\s\S]*?)\n\}/,
        )?.[1] ?? '';
        const documentedWithLink: string[] = [];
        for (const m of enumBody.matchAll(/\/\*\*([\s\S]*?)\*\/\s*(\w+)\s*=/g)) {
            if (/Payload:\s*\{@link/.test(m[1])) documentedWithLink.push(m[2]);
        }

        // Documented a payload type but not mapped -> on() still returns `any`.
        const documentedButUntyped = documentedWithLink.filter(
            (name) => !typedMembers.has(name),
        );
        expect(documentedButUntyped).toEqual([]);
    });
});
