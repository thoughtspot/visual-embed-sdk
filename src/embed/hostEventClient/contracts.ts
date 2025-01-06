import { HostEvent } from '../../types';

export enum UiPassthroughEvent {
  addVizToPinboard = 'addVizToPinboard',
  saveAnswer = 'saveAnswer',
  getDiscoverabilityStatus = 'getDiscoverabilityStatus',
  getAvailableUiPassthroughs = 'getAvailableUiPassthroughs',
  getAnswerPageConfig = 'getAnswerPageConfig',
  getPinboardPageConfig = 'getPinboardPageConfig',
}

export type UiPassthroughContractBase = {
  [UiPassthroughEvent.addVizToPinboard]: {
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
  [UiPassthroughEvent.saveAnswer]: {
    request: {
      name: string;
      description: string;
      vizId: string;
      isDiscoverable?: boolean;
    };
    response: {
      answerId: string,
      saveResponse: any;
      shareResponse?: any;
      errors?: any;
    };
  };
  [UiPassthroughEvent.getDiscoverabilityStatus]: {
    request: any;
    response: {
      shouldShowDiscoverability: boolean;
      isDiscoverabilityCheckboxUnselectedPerOrg: boolean;
    };
  };
  [UiPassthroughEvent.getAvailableUiPassthroughs]: {
    request: any;
    response: {
      keys: string[];
    };
  };
  [UiPassthroughEvent.getAnswerPageConfig]: {
    request: {
      vizId?: string;
    };
    response: any;
  };
  [UiPassthroughEvent.getPinboardPageConfig]: {
    request: any;
    response: any;
  };
};

export type FlattenType<T> = T extends infer R ? { [K in keyof R]: R[K] } : never;

export type UiPassthroughRequest<T extends keyof UiPassthroughContractBase> = FlattenType<UiPassthroughContractBase[T]['request']>;
export type UiPassthroughResponse<T extends keyof UiPassthroughContractBase> = FlattenType<UiPassthroughContractBase[T]['response']>;

export type UiPassthroughArrayResponse<ApiName extends keyof UiPassthroughContractBase> =
  Promise<Array<{
    redId?: string;
    value?: UiPassthroughResponse<ApiName>;
    error?: any;
  }>>

export type EmbedApiHostEventMapping = {
  [HostEvent.Pin]: UiPassthroughEvent.addVizToPinboard;
  [HostEvent.SaveAnswer]: UiPassthroughEvent.saveAnswer;
}

export type HostEventRequest<HostEventT extends HostEvent> =
  HostEventT extends keyof EmbedApiHostEventMapping ?
  FlattenType<UiPassthroughRequest<EmbedApiHostEventMapping[HostEventT]>> : any;

export type HostEventResponse<HostEventT extends HostEvent> =
  HostEventT extends keyof EmbedApiHostEventMapping ?
  {
    value?: UiPassthroughResponse<EmbedApiHostEventMapping[HostEventT]>
  }
  : any;
