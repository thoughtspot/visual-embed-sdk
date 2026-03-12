import { ContextType, HostEvent, RuntimeFilter } from '../../types';
import { SessionInterface } from '../../utils/graphql/answerService/answerService';

export interface LiveboardTab {
  id: string;
  name: string;
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
  GetExportRequestForCurrentPinboard = 'getExportRequestForCurrentPinboard',
}

// UI Passthrough Contract
export type UIPassthroughContractBase = {
  [UIPassthroughEvent.PinAnswerToLiveboard]: {
    request: {
      vizId?: string;
      newVizName: string;
      newVizDescription?: string;
      liveboardId?: string;
      tabId?: string;
      newLiveboardName?: string;
      newTabName?: string;
    };
    response: {
      liveboardId: string;
      tabId: string;
      vizId: string;
    };
  };
  [UIPassthroughEvent.SaveAnswer]: {
    request: {
      name: string;
      description: string;
      vizId?: string;
      isDiscoverable?: boolean;
    };
    response: {
      answerId: string,
      saveResponse?: any;
      shareResponse?: any;
    };
  };
  [UIPassthroughEvent.GetDiscoverabilityStatus]: {
    request: any;
    response: {
      shouldShowDiscoverability: boolean;
      isDiscoverabilityCheckboxUnselectedPerOrg: boolean;
    };
  };
  [UIPassthroughEvent.GetAvailableUIPassthroughs]: {
    request: any;
    response: {
      keys: string[];
    };
  };
  [UIPassthroughEvent.GetAnswerConfig]: {
    request: {
      vizId?: string;
    };
    response: any;
  };
  [UIPassthroughEvent.GetLiveboardConfig]: {
    request: any;
    response: any;
  };
  [UIPassthroughEvent.GetUnsavedAnswerTML]: {
    request: {
      sessionId?: string;
      vizId?: string;
    };
    response: {
      tml: string;
    };
  };
  [UIPassthroughEvent.UpdateFilters]: {
    request: {
      filter: any;
      filters: any;
    };
    response: any;
  };
  [UIPassthroughEvent.Drilldown]: {
    request: any;
    response: any;
  };
  [UIPassthroughEvent.GetAnswerSession]: {
    request: {
      vizId?: string;
    };
    response: {
      session: SessionInterface;
      embedAnswerData?: Record<string, any>;
    };
  };
  [UIPassthroughEvent.GetFilters]: {
    request: {
      vizId?: string;
    };
    response: {
      liveboardFilters: Record<string, any>[];
      runtimeFilters: RuntimeFilter[];
    };
  };
  [UIPassthroughEvent.GetIframeUrl]: {
    request: Record<string, never>;
    response: {
      iframeUrl: string;
    };
  };
  [UIPassthroughEvent.GetParameters]: {
    request: Record<string, never>;
    response: {
      parameters: Record<string, any>[];
    };
  };
  [UIPassthroughEvent.GetTML]: {
    request: {
      vizId?: string;
      includeNonExecutedSearchTokens?: boolean;
    };
    response: Record<string, any>;
  };
  [UIPassthroughEvent.GetTabs]: {
    request: Record<string, never>;
    response: {
      orderedTabIds: string[];
      numberOfTabs: number;
      Tabs: LiveboardTab[];
    };
  };
  [UIPassthroughEvent.GetExportRequestForCurrentPinboard]: {
    request: Record<string, never>;
    response: {
      v2Content: string;
    };
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
  [HostEvent.getExportRequestForCurrentPinboard]: UIPassthroughEvent.GetExportRequestForCurrentPinboard;
}

// Host Event Request and Response
export type HostEventRequest<HostEventT extends HostEvent> =
  HostEventT extends keyof EmbedApiHostEventMapping
    ? UIPassthroughRequest<EmbedApiHostEventMapping[HostEventT]>
    : any;

export type HostEventResponse<HostEventT extends HostEvent, ContextT extends ContextType> =
  HostEventT extends keyof EmbedApiHostEventMapping
    ? UIPassthroughResponse<EmbedApiHostEventMapping[HostEventT]>
    : any;

// trigger response and request
export type TriggerPayload<PayloadT, HostEventT extends HostEvent> =
  PayloadT | HostEventRequest<HostEventT>;
export type TriggerResponse<PayloadT, HostEventT extends HostEvent, ContextT extends ContextType> =
  PayloadT extends HostEventRequest<HostEventT> ? HostEventResponse<HostEventT, ContextT> : any;