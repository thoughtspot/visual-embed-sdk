import { HostEvent } from '../../types';

export enum UIPassthroughEvent {
  addVizToPinboard = 'addVizToPinboard',
  saveAnswer = 'saveAnswer',
  getDiscoverabilityStatus = 'getDiscoverabilityStatus',
  getAvailableUIPassthroughs = 'getAvailableUIPassthroughs',
  getAnswerPageConfig = 'getAnswerPageConfig',
  getPinboardPageConfig = 'getPinboardPageConfig',
}

export type UIPassthroughContractBase = {
  [UIPassthroughEvent.addVizToPinboard]: {
    request: {
      vizId?: string;
      newVizName: string;
      newVizDescription?: string;
      pinboardId?: string;
      tabId?: string;
      newPinboardName?: string;
      newTabName?: string;
    };
    response: {
      pinboardId: string;
      tabId: string;
      vizId: string;
    };
  };
  [UIPassthroughEvent.saveAnswer]: {
    request: {
      name: string;
      description: string;
      vizId?: string;
      isDiscoverable?: boolean;
    };
    response: {
      answerId: string,
      saveResponse: any;
      shareResponse?: any;
      errors?: any;
    };
  };
  [UIPassthroughEvent.getDiscoverabilityStatus]: {
    request: any;
    response: {
      shouldShowDiscoverability: boolean;
      isDiscoverabilityCheckboxUnselectedPerOrg: boolean;
    };
  };
  [UIPassthroughEvent.getAvailableUIPassthroughs]: {
    request: any;
    response: {
      keys: string[];
    };
  };
  [UIPassthroughEvent.getAnswerPageConfig]: {
    request: {
      vizId?: string;
    };
    response: any;
  };
  [UIPassthroughEvent.getPinboardPageConfig]: {
    request: any;
    response: any;
  };
};

export type FlattenType<T> = T extends infer R ? { [K in keyof R]: R[K] } : never;

export type UIPassthroughRequest<T extends keyof UIPassthroughContractBase> = FlattenType<UIPassthroughContractBase[T]['request']>;
export type UIPassthroughResponse<T extends keyof UIPassthroughContractBase> = FlattenType<UIPassthroughContractBase[T]['response']>;

export type UIPassthroughArrayResponse<ApiName extends keyof UIPassthroughContractBase> =
  Promise<Array<{
    redId?: string;
    value?: UIPassthroughResponse<ApiName>;
    error?: any;
  }>>

export type EmbedApiHostEventMapping = {
  [HostEvent.Pin]: UIPassthroughEvent.addVizToPinboard;
  [HostEvent.SaveAnswer]: UIPassthroughEvent.saveAnswer;
}

export type HostEventRequest<HostEventT extends HostEvent> =
  HostEventT extends keyof EmbedApiHostEventMapping ?
  FlattenType<UIPassthroughRequest<EmbedApiHostEventMapping[HostEventT]>> : any;

export type HostEventResponse<HostEventT extends HostEvent> =
  HostEventT extends keyof EmbedApiHostEventMapping ?
  {
    value?: UIPassthroughResponse<EmbedApiHostEventMapping[HostEventT]>
  }
  : any;
