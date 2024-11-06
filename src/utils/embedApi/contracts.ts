import { HostEvent } from '../../types';

export type EmbedApiContractBase = {
  addVizToPinboard: (payload: {
      vizId: string;
      newVizName: string;
      newVizDescription?: string;
      pinboardId?: string;
      tabId?: string;
      newPinboardName?: string;
      newTabName?: string;
      pinFromStore?: boolean;
  }) => {
      pinboardId: string;
      tabId: string;
      vizId: string;
      errors?: any;
  };
  saveAnswer: (payload: {
      name: string;
      description: string;
      vizId: string;
      isDiscoverable?: boolean;
  }) => any;
  getA3AnalysisColumns: (
      payload: {
          vizId: string;
      } & any,
  ) => {
      data?: any;
      errors?: any;
  };
  getPinboardTabInfo: () => any;
  getDiscoverabilityStatus: () => {
      shouldShowDiscoverability: boolean;
      isDiscoverabilityCheckboxUnselectedPerOrg: boolean;
  };
  getAvailableEmbedApis: () => {
      keys: string[];
  };
  getAnswerPageConfig: (payload: { vizId: string }) => any;
  getPinboardPageConfig: () => any;
  _notFound: (payload: any) => any;
};

export type EmbedApiName = keyof EmbedApiContractBase;

export type EmbedApiArrayResponse<ApiName extends EmbedApiName> =
  Promise<Array<{
    redId?: string;
    value?: ReturnType<EmbedApiContractBase[ApiName]>;
    error?: any;
  }>>

export type EmbedApiHostEventMapping = {
  [key: string]: string;
  [HostEvent.Pin]: 'addVizToPinboard';
}

export type EmbedApiEventResponse<HostEventT extends HostEvent> = ReturnType<EmbedApiContractBase[EmbedApiHostEventMapping[HostEventT] extends keyof EmbedApiContractBase ? EmbedApiHostEventMapping[HostEventT] : '_notFound']>;
