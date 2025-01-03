import { HostEvent } from '../../types';
import { processTrigger } from '../../utils/processTrigger';
import {
    UiPassthroughArrayResponse,
    UiPassthroughEvent, HostEventRequest, HostEventResponse,
    UiPassthroughRequest,
} from './contracts';

export class HostEventClient {
  thoughtSpotHost: string;

  constructor(iFrame: HTMLIFrameElement, thoughtSpotHost: string) {
      this.thoughtSpotHost = thoughtSpotHost;
  }

  async executeUiPassthroughApi(iFrame: HTMLIFrameElement, apiName: UiPassthroughEvent,
      parameters: UiPassthroughRequest<UiPassthroughEvent>):
    UiPassthroughArrayResponse<UiPassthroughEvent> {
      const res = await processTrigger(iFrame, HostEvent.UiPassthrough, this.thoughtSpotHost, {
          type: apiName,
          parameters,
      });

      return res;
  }

  async handleUiPassthroughForHostEvent(
      iFrame: HTMLIFrameElement,
      apiName: UiPassthroughEvent,
      parameters: UiPassthroughRequest<UiPassthroughEvent>,
  ):
    UiPassthroughArrayResponse<UiPassthroughEvent> {
      const response = (await this.executeUiPassthroughApi(iFrame, apiName, parameters))
          ?.filter?.((r) => r.error || r.value)[0];

      if (!response) {
          throw new Error('No answer found');
      }

      const errors = response.error || (response.value as any)?.errors;
      if (errors) {
          throw new Error(JSON.stringify({ errors: response.error }));
      }

      return { ...response.value };
  }

  async hostEventFallback(
      iFrame: HTMLIFrameElement, hostEvent: HostEvent, data: any,
  ): Promise<any> {
      return processTrigger(iFrame, hostEvent, this.thoughtSpotHost, data);
  }

  async executeHostEvent<T extends HostEvent>(
      iFrame:HTMLIFrameElement, hostEvent: HostEvent, payload?: HostEventRequest<T>,
  ):
    Promise<HostEventResponse<HostEvent>> {
      if (hostEvent === HostEvent.Pin && payload?.newVizName) {
          return this.handleUiPassthroughForHostEvent(
              iFrame,
              UiPassthroughEvent.addVizToPinboard, payload,
          );
      }

      if (hostEvent === HostEvent.SaveAnswer && payload?.name) {
          return this.handleUiPassthroughForHostEvent(iFrame,
              UiPassthroughEvent.saveAnswer, payload);
      }

      return this.hostEventFallback(iFrame, hostEvent, payload);
  }
}
