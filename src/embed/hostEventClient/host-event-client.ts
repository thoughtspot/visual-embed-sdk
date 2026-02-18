import { ContextType, HostEvent } from '../../types';
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
  protected async processTrigger(message: HostEvent, data: any, context?: ContextType): Promise<any> {
      if (!this.iFrame) {
          throw new Error('Iframe element is not set');
      }

      const thoughtspotHost = getEmbedConfig().thoughtSpotHost;
      return processTriggerService(
          this.iFrame,
          message,
          thoughtspotHost,
          data,
          context,
      );
  }

  public async handleHostEventWithParam<UIPassthroughEventT extends UIPassthroughEvent>(
      apiName: UIPassthroughEventT,
      parameters: UIPassthroughRequest<UIPassthroughEventT>,
      context?: ContextType,
  ): Promise<UIPassthroughResponse<UIPassthroughEventT>> {
      const response = (await this.triggerUIPassthroughApi(apiName, parameters, context))
          ?.filter?.((r) => r.error || r.value)[0];

      if (!response) {
          const error = `No answer found${parameters.vizId ? ` for vizId: ${parameters.vizId}` : ''}.`;
          throw { error };
      }

      const errors = response.error
        || (response.value as any)?.errors
        || (response.value as any)?.error;

      if (errors) {
          throw { error: response.error };
      }

      return { ...response.value };
  }

  public async hostEventFallback(
      hostEvent: HostEvent,
      data: any,
      context?: ContextType,
  ): Promise<any> {
      return this.processTrigger(hostEvent, data, context);
  }

  /**
   * For getter events that return data. Tries UI passthrough first;
   * if the app doesn't support it (no response data), falls back to
   * the legacy host event channel. Real errors are thrown as-is.
   */
  private async getDataWithPassthroughFallback<UIPassthroughEventT extends UIPassthroughEvent>(
      passthroughEvent: UIPassthroughEventT,
      hostEvent: HostEvent,
      payload: any,
      context?: ContextType,
  ): Promise<UIPassthroughResponse<UIPassthroughEventT>> {
      const response = await this.triggerUIPassthroughApi(
          passthroughEvent, payload || {}, context,
      );
      const matched = response?.filter?.((r) => r.error || r.value)[0];
      if (!matched) {
          return this.hostEventFallback(hostEvent, payload, context);
      }

      const errors = matched.error
          || (matched.value as any)?.errors
          || (matched.value as any)?.error;
      if (errors) {
          throw new Error(matched.error || errors);
      }

      return { ...matched.value };
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
      context?: ContextType,
  ): Promise<UIPassthroughArrayResponse<UIPassthroughEventT>> {
      const res = await this.processTrigger(HostEvent.UIPassthrough, {
          type: apiName,
          parameters,
      }, context);

      return res;
  }

  protected async handlePinEvent(
      payload: HostEventRequest<HostEvent.Pin>,
      context?: ContextType,
  ): Promise<HostEventResponse<HostEvent.Pin, ContextType>> {
      if (!payload || !('newVizName' in payload)) {
          return this.hostEventFallback(HostEvent.Pin, payload, context);
      }

      const formattedPayload = {
          ...payload,
          pinboardId: payload.liveboardId ?? (payload as any).pinboardId,
          newPinboardName: payload.newLiveboardName ?? (payload as any).newPinboardName,
      };

      const data = await this.handleHostEventWithParam(
          UIPassthroughEvent.PinAnswerToLiveboard, formattedPayload,
          context as ContextType,
      );

      return {
          ...data,
          liveboardId: (data as any).pinboardId,
      };
  }

  protected async handleSaveAnswerEvent(
      payload: HostEventRequest<HostEvent.SaveAnswer>,
      context?: ContextType,
  ): Promise<any> {
      if (!payload || !('name' in payload) || !('description' in payload)) {
          // Save is the fallback for SaveAnswer
          return this.hostEventFallback(HostEvent.Save, payload, context);
      }

      const data = await this.handleHostEventWithParam(
          UIPassthroughEvent.SaveAnswer, payload,
          context as ContextType,
      );
      return {
          ...data,
          answerId: data?.saveResponse?.data?.Answer__save?.answer?.id,
      };
  }

  public async triggerHostEvent<
    HostEventT extends HostEvent,
    PayloadT,
    ContextT extends ContextType,
  >(
      hostEvent: HostEventT,
      payload?: TriggerPayload<PayloadT, HostEventT>,
      context?: ContextT,
  ): Promise<TriggerResponse<PayloadT, HostEventT, ContextType>> {
      switch (hostEvent) {
          case HostEvent.Pin:
              return this.handlePinEvent(payload as HostEventRequest<HostEvent.Pin>, context as ContextType) as any;
          case HostEvent.SaveAnswer:
              return this.handleSaveAnswerEvent(
                  payload as HostEventRequest<HostEvent.SaveAnswer>,
                  context as ContextType,
              ) as any;
          case HostEvent.GetAnswerSession:
              return this.getDataWithPassthroughFallback(
                  UIPassthroughEvent.GetAnswerSession, hostEvent, payload, context as ContextType,
              ) as any;
          case HostEvent.GetFilters:
              return this.getDataWithPassthroughFallback(
                  UIPassthroughEvent.GetFilters, hostEvent, payload, context as ContextType,
              ) as any;
          case HostEvent.GetIframeUrl:
              return this.getDataWithPassthroughFallback(
                  UIPassthroughEvent.GetIframeUrl, hostEvent, payload, context as ContextType,
              ) as any;
          case HostEvent.GetParameters:
              return this.getDataWithPassthroughFallback(
                  UIPassthroughEvent.GetParameters, hostEvent, payload, context as ContextType,
              ) as any;
          case HostEvent.GetTML:
              return this.getDataWithPassthroughFallback(
                  UIPassthroughEvent.GetTML, hostEvent, payload, context as ContextType,
              ) as any;
          case HostEvent.GetTabs:
              return this.getDataWithPassthroughFallback(
                  UIPassthroughEvent.GetTabs, hostEvent, payload, context as ContextType,
              ) as any;
          case HostEvent.getExportRequestForCurrentPinboard:
              return this.getDataWithPassthroughFallback(
                  UIPassthroughEvent.GetExportRequestForCurrentPinboard, hostEvent, payload, context as ContextType,
              ) as any;
          default:
              return this.hostEventFallback(hostEvent, payload, context);
      }
  }
}
