import { HostEvent } from '../../types';
import { processTrigger } from '../processTrigger';
import {
    EmbedApiArrayResponse,
    EmbedApiContractBase,
    EmbedApiEvent, EmbedApiRequest, HostEventRequest, HostEventResponse,
} from './contracts';

export class HostEventClient {
  iFrame: HTMLIFrameElement;

  thoughtSpotHost: string;

  constructor(iFrame: HTMLIFrameElement, thoughtSpotHost: string) {
      this.iFrame = iFrame;
      this.thoughtSpotHost = thoughtSpotHost;
  }

  async executeEmbedApi<ApiName extends keyof EmbedApiContractBase>(apiName: ApiName,
      parameters: EmbedApiRequest<ApiName>):
    EmbedApiArrayResponse<ApiName> {
      const res = await processTrigger(this.iFrame, HostEvent.EmbedApi, this.thoughtSpotHost, {
          type: apiName,
          parameters,
      });

      return res;
  }

  async hostEventFallback(hostEvent: HostEvent, data: any): Promise<any> {
      return processTrigger(this.iFrame, hostEvent, this.thoughtSpotHost, data);
  }

  async handlePinEvent(
      payload: HostEventRequest<HostEvent.Pin>,
  ): Promise<HostEventResponse<HostEvent.Pin>> {
      const res = (await this.executeEmbedApi(EmbedApiEvent.addVizToPinboard, payload))
          .filter((r) => r.error || r.value)[0];

      if (!res) {
          const noVizFoundError = `No viz found${payload.vizId ? ` with id ${payload.vizId}` : ''}`;
          return { error: noVizFoundError } as HostEventResponse<HostEvent.Pin>;
      }

      if (res.error) {
          return { error: res?.error?.message };
      }
      if (res.value?.errors?.message) {
          return { error: res?.value.errors?.message };
      }

      return { value: res.value };
  }

  async executeHostEvent<T extends HostEvent>(hostEvent: HostEvent, payload: HostEventRequest<T>):
    Promise<HostEventResponse<HostEvent>> {
      if (hostEvent === HostEvent.Pin && typeof payload === 'object') {
          return this.handlePinEvent(payload as HostEventRequest<HostEvent.Pin>);
      }

      return this.hostEventFallback(hostEvent, payload);
  }
}
