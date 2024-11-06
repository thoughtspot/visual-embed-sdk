import { HostEvent } from 'src/types';
import { processTrigger } from '../processTrigger';
import { EmbedApiArrayResponse, EmbedApiContractBase } from './contracts';

export class EmbedApiClient {
  iFrame: HTMLIFrameElement;

  thoughtSpotHost: string;

  constructor(iFrame: HTMLIFrameElement, thoughtSpotHost: string) {
      this.iFrame = iFrame;
      this.thoughtSpotHost = thoughtSpotHost;
  }

  async executeEmbedApi<ApiName extends keyof EmbedApiContractBase>(apiName: ApiName,
      parameters: Parameters<EmbedApiContractBase[ApiName]>[0]):
    EmbedApiArrayResponse<ApiName> {
      const res = await processTrigger(this.iFrame, HostEvent.EmbedApi, this.thoughtSpotHost, {
          type: apiName,
          parameters,
      });

      return res;
  }
}
