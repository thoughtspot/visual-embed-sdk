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
 * The column to filter on. Supply `columnName`; `column` is a deprecated
 * alias. One of the two is required - supplying neither is a type error,
 * because a filter with no column is rejected at runtime.
 *
 * When several columns share a name, qualify it as
 * `WORKSHEET_NAME::COLUMN_NAME`, for example
 * `"(Sample) Retail - Apparel::city"`.
 */
export type FilterUpdateColumn =
  | {
    /**
     * Name of the column to filter on, optionally qualified as
     * `WORKSHEET_NAME::COLUMN_NAME`.
     */
    columnName: string;
    /**
     * @deprecated Use `columnName`, which matches {@link RuntimeFilter} and
     * the rest of the SDK. Still accepted.
     */
    column?: string;
  }
  | {
    /**
     * @deprecated Use `columnName`, which matches {@link RuntimeFilter} and
     * the rest of the SDK. Still accepted.
     */
    column: string;
    /**
     * Name of the column to filter on, optionally qualified as
     * `WORKSHEET_NAME::COLUMN_NAME`.
     */
    columnName?: string;
  };

/**
 * The filter operator. Supply `operator`; `oper` is a deprecated alias.
 * One of the two is required - supplying neither is a type error, because a
 * filter with no operator is rejected at runtime.
 */
export type FilterUpdateOperator =
  | {
    /**
     * Filter operator, for example EQ, IN, CONTAINS.
     */
    operator: string;
    /**
     * @deprecated Use `operator`, which matches {@link RuntimeFilter} and
     * the rest of the SDK. Still accepted.
     */
    oper?: string;
  }
  | {
    /**
     * @deprecated Use `operator`, which matches {@link RuntimeFilter} and
     * the rest of the SDK. Still accepted.
     */
    oper: string;
    /**
     * Filter operator, for example EQ, IN, CONTAINS.
     */
    operator?: string;
  };

/**
 * One filter in a {@link HostEvent.UpdateFilters} payload.
 *
 * Use `columnName` and `operator` - the spelling used by
 * {@link RuntimeFilter} and by the payload
 * `convertFilterChangedToUpdateFiltersPayload` produces. The older
 * `column` and `oper` spellings are deprecated but still accepted, so
 * existing code keeps working.
 */
export type FilterUpdate = FilterUpdateColumn & FilterUpdateOperator & {
  /**
   * One or more filter values. The accepted types depend on the data type of
   * the column being filtered.
   */
  values: (string | number | boolean | bigint)[];
  /**
   * Date format type, for date filters - for example `EXACT_DATE`,
   * `MONTH_YEAR`.
   */
  type?: string;
  /**
   * Optional. Scopes the filter to a specific target, for example a single
   * Liveboard tab.
   */
  applicability?: Applicability;
};

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