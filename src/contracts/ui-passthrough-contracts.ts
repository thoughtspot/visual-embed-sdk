import { HostEvent, RuntimeFilter } from '../types';
import { SessionInterface } from '../utils/graphql/answerService/answerService';

export interface LiveboardTab {
  id: string;
  name: string;
  [key: string]: any;
}

export interface LiveboardGroup {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Levels at which a filter or parameter can be applied.
 */
export enum ApplicabilityLevel {
  Liveboard = 'LIVEBOARD',
  Tab = 'TAB',
  Group = 'GROUP',
}

/**
 * Scopes a filter or parameter to a specific target.
 * At `LIVEBOARD` level the filter applies to the whole Liveboard, so `targetId`
 * is not required.
 */
export interface Applicability {
  level: ApplicabilityLevel;
  targetId?: string;
}

export interface FilterUpdate {
  column: string;
  oper: string;
  values: string[];
  type?: string;
  applicability?: Applicability;
}

export interface LiveboardFilter {
  applicability?: Applicability;
  [key: string]: any;
}

export interface LiveboardParameter {
  applicability?: Applicability;
  [key: string]: any;
}

export enum UIPassthroughEvent {
  PinAnswerToLiveboard = 'addVizToPinboard',
  SaveAnswer = 'saveAnswer',
  GetDiscoverabilityStatus = 'getDiscoverabilityStatus',
  GetAvailableUIPassthroughs = 'getAvailableUiPassthroughs',
  GetAnswerConfig = 'getAnswerPageConfig',
  GetLiveboardConfig = 'getPinboardPageConfig',
  GetUnsavedAnswerTML = 'getUnsavedAnswerTML',
  UpdateFilters = 'updateFilters',
  Drilldown = 'drillDown',
  GetAnswerSession = 'getAnswerSession',
  GetFilters = 'getFilters',
  GetIframeUrl = 'getIframeUrl',
  GetParameters = 'getParameters',
  GetTML = 'getTML',
  GetTabs = 'getTabs',
  GetGroups = 'getGroups',
  GetExportRequestForCurrentPinboard = 'getExportRequestForCurrentPinboard',
}

/**
 * UI passthrough contract. Each event's request/response is a named interface so it
 * documents and imports cleanly; `UIPassthroughContractBase` maps events to the pairs.
 */

/** Request for {@link UIPassthroughEvent.PinAnswerToLiveboard}. */
export interface PinAnswerToLiveboardRequest {
  vizId?: string;
  newVizName: string;
  newVizDescription?: string;
  liveboardId?: string;
  tabId?: string;
  newLiveboardName?: string;
  newTabName?: string;
}
/** Response for {@link UIPassthroughEvent.PinAnswerToLiveboard}. */
export interface PinAnswerToLiveboardResponse {
  liveboardId: string;
  tabId: string;
  vizId: string;
}
/** Request for {@link UIPassthroughEvent.SaveAnswer}. */
export interface SaveAnswerRequest {
  name: string;
  description: string;
  vizId?: string;
  isDiscoverable?: boolean;
}
/** Response for {@link UIPassthroughEvent.SaveAnswer}. */
export interface SaveAnswerResponse {
  answerId: string;
  saveResponse?: any;
  shareResponse?: any;
}
/** Response for {@link UIPassthroughEvent.GetDiscoverabilityStatus}. */
export interface GetDiscoverabilityStatusResponse {
  shouldShowDiscoverability: boolean;
  isDiscoverabilityCheckboxUnselectedPerOrg: boolean;
}
/** Response for {@link UIPassthroughEvent.GetAvailableUIPassthroughs}. */
export interface GetAvailableUIPassthroughsResponse {
  keys: string[];
}
/** Request for {@link UIPassthroughEvent.GetAnswerConfig}. */
export interface GetAnswerConfigRequest {
  vizId?: string;
}
/** Request for {@link UIPassthroughEvent.GetUnsavedAnswerTML}. */
export interface GetUnsavedAnswerTMLRequest {
  sessionId?: string;
  vizId?: string;
}
/** Response for {@link UIPassthroughEvent.GetUnsavedAnswerTML}. */
export interface GetUnsavedAnswerTMLResponse {
  tml: string;
}
/** Request for {@link UIPassthroughEvent.GetAnswerSession}. */
export interface GetAnswerSessionRequest {
  vizId?: string;
}
/** Response for {@link UIPassthroughEvent.GetAnswerSession}. */
export interface GetAnswerSessionResponse {
  session: SessionInterface;
  embedAnswerData?: Record<string, any>;
}
/** Request for {@link UIPassthroughEvent.GetFilters}. */
export interface GetFiltersRequest {
  vizId?: string;
}
/** Response for {@link UIPassthroughEvent.GetFilters}. */
export interface GetFiltersResponse {
  liveboardFilters: LiveboardFilter[];
  runtimeFilters: RuntimeFilter[];
}
/** Response for {@link UIPassthroughEvent.GetIframeUrl}. */
export interface GetIframeUrlResponse {
  iframeUrl: string;
}
/** Response for {@link UIPassthroughEvent.GetParameters}. */
export interface GetParametersResponse {
  parameters: LiveboardParameter[];
}
/** Request for {@link UIPassthroughEvent.GetTML}. */
export interface GetTMLRequest {
  vizId?: string;
  includeNonExecutedSearchTokens?: boolean;
}
/** Response for {@link UIPassthroughEvent.GetTabs}. */
export interface GetTabsResponse {
  orderedTabIds: string[];
  numberOfTabs: number;
  Tabs: LiveboardTab[];
}
/** Response for {@link UIPassthroughEvent.GetGroups}. */
export interface GetGroupsResponse {
  orderedGroupIds: string[];
  numberOfGroups: number;
  Groups: LiveboardGroup[];
}
/** Response for {@link UIPassthroughEvent.GetExportRequestForCurrentPinboard}. */
export interface GetExportRequestForCurrentPinboardResponse {
  data: { v2Content: string };
  type: UIPassthroughEvent.GetExportRequestForCurrentPinboard;
}
/**
 * Request for {@link UIPassthroughEvent.UpdateFilters}. Not the host-event
 * `UpdateFiltersRequest` (host-event-contracts.ts), which has a different shape.
 */
export interface UpdateFiltersPassthroughRequest {
  filter?: FilterUpdate;
  filters?: FilterUpdate[];
}
/** Request for {@link UIPassthroughEvent.Drilldown}. */
export interface DrilldownRequest {
  points: {
    selectedPoints?: string[];
    clickedPoint?: string;
  };
  columnGuid?: string;
  autoDrillDown?: boolean;
  vizId?: string;
}

/** Maps each UI passthrough event to its request/response pair. */
export type UIPassthroughContractBase = {
  [UIPassthroughEvent.PinAnswerToLiveboard]: {
    request: PinAnswerToLiveboardRequest;
    response: PinAnswerToLiveboardResponse;
  };
  [UIPassthroughEvent.SaveAnswer]: {
    request: SaveAnswerRequest;
    response: SaveAnswerResponse;
  };
  [UIPassthroughEvent.GetDiscoverabilityStatus]: {
    request: any;
    response: GetDiscoverabilityStatusResponse;
  };
  [UIPassthroughEvent.GetAvailableUIPassthroughs]: {
    request: any;
    response: GetAvailableUIPassthroughsResponse;
  };
  [UIPassthroughEvent.GetAnswerConfig]: {
    request: GetAnswerConfigRequest;
    response: any;
  };
  [UIPassthroughEvent.GetLiveboardConfig]: {
    request: any;
    response: any;
  };
  [UIPassthroughEvent.GetUnsavedAnswerTML]: {
    request: GetUnsavedAnswerTMLRequest;
    response: GetUnsavedAnswerTMLResponse;
  };
  [UIPassthroughEvent.GetAnswerSession]: {
    request: GetAnswerSessionRequest;
    response: GetAnswerSessionResponse;
  };
  [UIPassthroughEvent.GetFilters]: {
    request: GetFiltersRequest;
    response: GetFiltersResponse;
  };
  [UIPassthroughEvent.GetIframeUrl]: {
    request: Record<string, never>;
    response: GetIframeUrlResponse;
  };
  [UIPassthroughEvent.GetParameters]: {
    request: Record<string, never>;
    response: GetParametersResponse;
  };
  [UIPassthroughEvent.GetTML]: {
    request: GetTMLRequest;
    response: Record<string, any>;
  };
  [UIPassthroughEvent.GetTabs]: {
    request: Record<string, never>;
    response: GetTabsResponse;
  };
  [UIPassthroughEvent.GetGroups]: {
    request: Record<string, never>;
    response: GetGroupsResponse;
  };
  [UIPassthroughEvent.GetExportRequestForCurrentPinboard]: {
    request: Record<string, never>;
    response: GetExportRequestForCurrentPinboardResponse;
  };
  [UIPassthroughEvent.UpdateFilters]: {
    request: UpdateFiltersPassthroughRequest;
    response: unknown;
  };
  [UIPassthroughEvent.Drilldown]: {
    request: DrilldownRequest;
    response: unknown;
  };
};

// UI Passthrough Request and Response
export type UIPassthroughRequest<T
  extends keyof UIPassthroughContractBase
> = UIPassthroughContractBase[T]['request'];

export type UIPassthroughResponse<
  T extends keyof UIPassthroughContractBase
> = UIPassthroughContractBase[T]['response'];

export type UIPassthroughArrayResponse<ApiName extends keyof UIPassthroughContractBase> =
  Array<{
    refId?: string;
    value?: UIPassthroughResponse<ApiName>;
    error?: any;
  }>

// Host event and UI Passthrough Event Mapping
export type EmbedApiHostEventMapping = {
  [HostEvent.Pin]: UIPassthroughEvent.PinAnswerToLiveboard;
  [HostEvent.SaveAnswer]: UIPassthroughEvent.SaveAnswer;
  [HostEvent.GetAnswerSession]: UIPassthroughEvent.GetAnswerSession;
  [HostEvent.GetFilters]: UIPassthroughEvent.GetFilters;
  [HostEvent.GetIframeUrl]: UIPassthroughEvent.GetIframeUrl;
  [HostEvent.GetParameters]: UIPassthroughEvent.GetParameters;
  [HostEvent.GetTML]: UIPassthroughEvent.GetTML;
  [HostEvent.GetTabs]: UIPassthroughEvent.GetTabs;
  [HostEvent.GetGroups]: UIPassthroughEvent.GetGroups;
  [HostEvent.getExportRequestForCurrentPinboard]: UIPassthroughEvent.GetExportRequestForCurrentPinboard;
}

// NOTE: HostEventRequest / HostEventResponse / TriggerPayload / TriggerResponse
// live in the sibling ./host-event-contracts, which layers the
// HostEventRequestMap on top of the UI-passthrough mapping above.
// The former 2-tier definitions that lived here were superseded and removed.