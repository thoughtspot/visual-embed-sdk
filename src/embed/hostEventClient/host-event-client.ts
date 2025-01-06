import { HostEvent } from '../../types';
import { processTrigger } from '../../utils/processTrigger';
import {
    UiPassthroughArrayResponse,
    UiPassthroughEvent, HostEventRequest, HostEventResponse,
    UiPassthroughRequest,
    UiPassthroughResponse,
} from './contracts';

export class HostEventClient {
  thoughtSpotHost: string;

  constructor(thoughtSpotHost: string) {
      this.thoughtSpotHost = thoughtSpotHost;
  }

  public async executeUiPassthroughApi<UiPassthroughEventT extends UiPassthroughEvent>(
      iFrame: HTMLIFrameElement,
      apiName: UiPassthroughEventT,
      parameters: UiPassthroughRequest<UiPassthroughEventT>,
  ): UiPassthroughArrayResponse<UiPassthroughEventT> {
      const res = await processTrigger(iFrame, HostEvent.UiPassthrough, this.thoughtSpotHost, {
          type: apiName,
          parameters,
      });

      return res;
  }

  public async handleUiPassthroughForHostEvent<UiPassthroughEventT extends UiPassthroughEvent>(
      iFrame: HTMLIFrameElement,
      apiName: UiPassthroughEventT,
      parameters: UiPassthroughRequest<UiPassthroughEventT>,
  ): Promise<UiPassthroughResponse<UiPassthroughEventT>> {
      const response = (await this.executeUiPassthroughApi(iFrame, apiName, parameters))
          ?.filter?.((r) => r.error || r.value)[0];

      if (!response) {
          const error = `No answer found${parameters.vizId ? ` for vizId: ${parameters.vizId}` : ''}.`;
          // eslint-disable-next-line no-throw-literal
          throw { error };
      }

      const errors = response.error || (response.value as any)?.errors;
      if (errors) {
      // eslint-disable-next-line no-throw-literal
          throw { error: response.error };
      }

      return { ...response.value };
  }

  public async hostEventFallback(
      iFrame: HTMLIFrameElement, hostEvent: HostEvent, data: any,
  ): Promise<any> {
      return processTrigger(iFrame, hostEvent, this.thoughtSpotHost, data);
  }

  public async executeHostEvent<T extends HostEvent>(
      iFrame: HTMLIFrameElement,
      hostEvent: HostEvent,
      payload?: HostEventRequest<T>,
  ): Promise<HostEventResponse<HostEvent>> {
      if (hostEvent === HostEvent.Pin && payload?.newVizName) {
          return this.handleUiPassthroughForHostEvent(
              iFrame, UiPassthroughEvent.addVizToPinboard, payload,
          );
      }
      if (hostEvent === HostEvent.SaveAnswer && payload?.name) {
          return this.handleUiPassthroughForHostEvent(
              iFrame, UiPassthroughEvent.saveAnswer, payload,
          );
      }
      // fallback for save answer is Save
      if (hostEvent === HostEvent.SaveAnswer) hostEvent = HostEvent.Save;
      return this.hostEventFallback(iFrame, hostEvent, payload);
  }
}
