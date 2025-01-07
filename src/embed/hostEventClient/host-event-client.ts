import { HostEvent } from '../../types';
import { processTrigger } from '../../utils/processTrigger';
import {
    UIPassthroughArrayResponse,
    UIPassthroughEvent, HostEventRequest, HostEventResponse,
    UIPassthroughRequest,
    UIPassthroughResponse,
} from './contracts';

export class HostEventClient {
  thoughtSpotHost: string;

  constructor(thoughtSpotHost: string) {
      this.thoughtSpotHost = thoughtSpotHost;
  }

  public async executeUIPassthroughApi<UIPassthroughEventT extends UIPassthroughEvent>(
      iFrame: HTMLIFrameElement,
      apiName: UIPassthroughEventT,
      parameters: UIPassthroughRequest<UIPassthroughEventT>,
  ): UIPassthroughArrayResponse<UIPassthroughEventT> {
      const res = await processTrigger(iFrame, HostEvent.UIPassthrough, this.thoughtSpotHost, {
          type: apiName,
          parameters,
      });

      return res;
  }

  public async handleHostEventWithParam<UIPassthroughEventT extends UIPassthroughEvent>(
      iFrame: HTMLIFrameElement,
      apiName: UIPassthroughEventT,
      parameters: UIPassthroughRequest<UIPassthroughEventT>,
  ): Promise<UIPassthroughResponse<UIPassthroughEventT>> {
      const response = (await this.executeUIPassthroughApi(iFrame, apiName, parameters))
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
          return this.handleHostEventWithParam(
              iFrame, UIPassthroughEvent.addVizToPinboard, payload,
          );
      }
      if (hostEvent === HostEvent.SaveAnswer && payload?.name) {
          const data = await this.handleHostEventWithParam(
              iFrame, UIPassthroughEvent.saveAnswer, payload,
          );
          return {
              ...data,
              answerId: data?.saveResponse?.data?.Answer__save?.answer?.id,
          };
      }
      // fallback for save answer is Save
      if (hostEvent === HostEvent.SaveAnswer) hostEvent = HostEvent.Save;
      return this.hostEventFallback(iFrame, hostEvent, payload);
  }
}
