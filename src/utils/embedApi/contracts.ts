import { HostEvent } from '../../types';

export enum EmbedApiEvent {
  addVizToPinboard = 'addVizToPinboard',
  saveAnswer = 'saveAnswer',
  getA3AnalysisColumns = 'getA3AnalysisColumns',
  getPinboardTabInfo = 'getPinboardTabInfo',
  getDiscoverabilityStatus = 'getDiscoverabilityStatus',
  getAvailableEmbedApis = 'getAvailableEmbedApis',
  getAnswerPageConfig = 'getAnswerPageConfig',
  getPinboardPageConfig = 'getPinboardPageConfig',
  embedApiEventNotFound = 'embedApiEventNotFound',
}

export type EmbedApiContractBase = {
  [EmbedApiEvent.addVizToPinboard]: {
    request: {
      vizId?: string;
      newVizName: string;
      newVizDescription?: string;
      pinboardId?: string;
      tabId?: string;
      newPinboardName?: string;
      newTabName?: string;
      pinFromStore?: boolean;
    };
    response: {
      pinboardId: string extends string ? null : string;
      tabId: string;
      vizId: string;
      errors?: any;
    };
  };
  [EmbedApiEvent.saveAnswer]: {
    request: {
      name: string;
      description: string;
      vizId: string;
      isDiscoverable?: boolean;
    };
    response: any;
  };
  [EmbedApiEvent.getA3AnalysisColumns]: {
    request: {
      vizId: string;
    };
    response: {
      data?: any;
      errors?: any;
    };
  };
  [EmbedApiEvent.getPinboardTabInfo]: {
    request: any;
    response: any;
  };
  [EmbedApiEvent.getDiscoverabilityStatus]: {
    request: any;
    response: {
      shouldShowDiscoverability: boolean;
      isDiscoverabilityCheckboxUnselectedPerOrg: boolean;
    };
  };
  [EmbedApiEvent.getAvailableEmbedApis]: {
    request: any;
    response: {
      keys: string[];
    };
  };
  [EmbedApiEvent.getAnswerPageConfig]: {
    request: {
      vizId: string;
    };
    response: any;
  };
  [EmbedApiEvent.getPinboardPageConfig]: {
    request: any;
    response: any;
  };
  [EmbedApiEvent.embedApiEventNotFound]: {
    request: any;
    response: any;
  };
};

export type EmbedApiRequest<T extends keyof EmbedApiContractBase> = EmbedApiContractBase[T]['request'];
export type EmbedApiResponse<T extends keyof EmbedApiContractBase> = EmbedApiContractBase[T]['response'];

export type EmbedApiArrayResponse<ApiName extends keyof EmbedApiContractBase> =
  Promise<Array<{
    redId?: string;
    value?: EmbedApiResponse<ApiName>;
    error?: any;
  }>>

export type EmbedApiHostEventMapping = {
  [HostEvent.Pin]: EmbedApiEvent.addVizToPinboard;
  'hostEventNotMapped': EmbedApiEvent.embedApiEventNotFound;
}

export type FlattenType<T> = T extends infer R ? { [K in keyof R]: R[K] } : never;

export type HostEventRequest<HostEventT extends HostEvent> =
HostEventT extends keyof EmbedApiHostEventMapping ?
FlattenType<EmbedApiRequest<EmbedApiHostEventMapping[HostEventT]>> : any;

export type HostEventResponse<HostEventT extends HostEvent> =
  HostEventT extends keyof EmbedApiHostEventMapping ?
    {
      value?: EmbedApiResponse<EmbedApiHostEventMapping[HostEventT]>
      error?: any;
    }
   : any;
