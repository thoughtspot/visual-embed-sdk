import { HostEvent } from '../../types';
import { processTrigger as processTriggerService } from '../../utils/processTrigger';
import { getEmbedConfig } from '../embedConfig';
import {
    UIPassthroughArrayResponse,
    UIPassthroughEvent, HostEventRequest, HostEventResponse,
    UIPassthroughRequest,
    UIPassthroughResponse,
    TriggerPayload,
    TriggerResponse,
} from './contracts';

export class HostEventClient {
  iFrame: HTMLIFrameElement;

  constructor(iFrame?: HTMLIFrameElement) {
      this.iFrame = iFrame;
  }

  /**
   * A wrapper over process trigger to
   * @param {HostEvent} message Host event to send
   * @param {any} data Data to send with the host event
   * @returns {Promise<any>} - the response from the process trigger
   */
  protected async processTrigger(message: HostEvent, data: any): Promise<any> {
      if (!this.iFrame) {
          throw new Error('Iframe element is not set');
      }

      const thoughtspotHost = getEmbedConfig().thoughtSpotHost;
      return processTriggerService(
          this.iFrame,
          message,
          thoughtspotHost,
          data,
      );
  }

  public async handleHostEventWithParam<UIPassthroughEventT extends UIPassthroughEvent>(
      apiName: UIPassthroughEventT,
      parameters: UIPassthroughRequest<UIPassthroughEventT>,
  ): Promise<UIPassthroughResponse<UIPassthroughEventT>> {
      const response = (await this.triggerUIPassthroughApi(apiName, parameters))
          ?.filter?.((r) => r.error || r.value)[0];

      if (!response) {
          const error = `No answer found${parameters.vizId ? ` for vizId: ${parameters.vizId}` : ''}.`;
          // eslint-disable-next-line no-throw-literal
          throw { error };
      }

      const errors = response.error
        || (response.value as any)?.errors
        || (response.value as any)?.error;

      if (errors) {
      // eslint-disable-next-line no-throw-literal
          throw { error: response.error };
      }

      return { ...response.value };
  }

  public async hostEventFallback(
      hostEvent: HostEvent,
      data: any,
  ): Promise<any> {
      return this.processTrigger(hostEvent, data);
  }

  /**
   * Setter for the iframe element used for host events
   * @param {HTMLIFrameElement} iFrame - the iframe element to set
   */
  public setIframeElement(iFrame: HTMLIFrameElement): void {
      this.iFrame = iFrame;
  }

  public async triggerUIPassthroughApi<UIPassthroughEventT extends UIPassthroughEvent>(
      apiName: UIPassthroughEventT,
      parameters: UIPassthroughRequest<UIPassthroughEventT>,
  ): Promise<UIPassthroughArrayResponse<UIPassthroughEventT>> {
      const res = await this.processTrigger(HostEvent.UIPassthrough, {
          type: apiName,
          parameters,
      });

      return res;
  }

  protected async handlePinEvent(
      payload: HostEventRequest<HostEvent.Pin>,
  ): Promise<HostEventResponse<HostEvent.Pin>> {
      if (!payload || !('newVizName' in payload)) {
          return this.hostEventFallback(HostEvent.Pin, payload);
      }

      return this.handleHostEventWithParam(
          UIPassthroughEvent.PinAnswerToLiveboard, payload,
      );
  }

  protected async handleSaveAnswerEvent(
      payload: HostEventRequest<HostEvent.SaveAnswer>,
  ): Promise<any> {
      if (!payload || !('name' in payload) || !('description' in payload)) {
          // Save is the fallback for SaveAnswer
          return this.hostEventFallback(HostEvent.Save, payload);
      }

      const data = await this.handleHostEventWithParam(
          UIPassthroughEvent.SaveAnswer, payload,
      );
      return {
          ...data,
          answerId: data?.saveResponse?.data?.Answer__save?.answer?.id,
      };
  }

  public async triggerHostEvent<
    HostEventT extends HostEvent,
    PayloadT,
  >(
      hostEvent: HostEventT,
      payload?: TriggerPayload<PayloadT, HostEventT>,
  ): Promise<TriggerResponse<PayloadT, HostEventT>> {
      switch (hostEvent) {
          case HostEvent.Pin:
              return this.handlePinEvent(payload as HostEventRequest<HostEvent.Pin>) as any;
          case HostEvent.SaveAnswer:
              return this.handleSaveAnswerEvent(
                  payload as HostEventRequest<HostEvent.SaveAnswer>,
              ) as any;
          default:
              return this.hostEventFallback(hostEvent, payload);
      }
  }
}
