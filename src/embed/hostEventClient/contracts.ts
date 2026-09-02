import { ContextType, HostEvent, RuntimeFilter } from '../../types';
import { SessionInterface } from '../../utils/graphql/answerService/answerService';

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

/**
 * The attributes of a Liveboard filter update other than the column and
 * operator it applies with.
 */
export interface FilterUpdateBase {
  /**
   * The list of operands. Accepts the same types as the `values` of a
   * {@link RuntimeFilter}, widened from `string[]`.
   * @version SDK: 1.53.0 | ThoughtSpot Cloud: 26.10.0.cl
   */
  values: (number | boolean | string | bigint)[];
  type?: string;
  applicability?: Applicability;
}

/**
 * A filter passed to {@link HostEvent.UpdateFilters}.
 *
 * The column is named with `column` and the operator with `operator`, matching
 * {@link RuntimeFilter}, so a filter read back from
 * {@link HostEvent.GetFilters} can be passed to either event without renaming.
 *
 * The older `columnName` and `oper` still work; `column` and `operator` win
 * when both are given.
 * @version SDK: 1.53.0 | ThoughtSpot Cloud: 26.10.0.cl
 */
export type FilterUpdate = FilterUpdateBase
  & (
    | {
      /**
       * The name of the column to filter on (case-sensitive)
       */
      column: string;
      /**
       * @deprecated Use `column` instead.
       */
      columnName?: string;
    }
    | {
      /**
       * @deprecated Use `column` instead.
       */
      columnName: string;
      /**
       * The name of the column to filter on (case-sensitive)
       */
      column?: string;
    }
  )
  & (
    | {
      /**
       * The operator to apply
       */
      operator: string;
      /**
       * @deprecated Use `operator` instead.
       */
      oper?: string;
    }
    | {
      /**
       * @deprecated Use `operator` instead.
       */
      oper: string;
      /**
       * The operator to apply
       */
      operator?: string;
    }
  );

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
      liveboardFilters: LiveboardFilter[];
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
      parameters: LiveboardParameter[];
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
  [UIPassthroughEvent.GetGroups]: {
    request: Record<string, never>;
    response: {
      orderedGroupIds: string[];
      numberOfGroups: number;
      Groups: LiveboardGroup[];
    };
  };
  [UIPassthroughEvent.GetExportRequestForCurrentPinboard]: {
    request: Record<string, never>;
    response: {
      data: { v2Content: string };
      type: UIPassthroughEvent.GetExportRequestForCurrentPinboard;
    };
  };
  [UIPassthroughEvent.UpdateFilters]: {
    request: {
      filter?: FilterUpdate;
      filters?: FilterUpdate[];
    };
    response: unknown;
  };
  [UIPassthroughEvent.Drilldown]: {
    request: {
      points: {
        selectedPoints?: string[];
        clickedPoint?: string;
      };
      columnGuid?: string;
      autoDrillDown?: boolean;
      vizId?: string;
    };
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