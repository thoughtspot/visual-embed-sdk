import { ContextType, HostEvent } from '../../types';
import { processTrigger as processTriggerService } from '../../utils/processTrigger';
import { getEmbedConfig } from '../embedConfig';
import {
    UIPassthroughArrayResponse,
    UIPassthroughEvent,
    HostEventRequest,
    HostEventResponse,
    UIPassthroughRequest,
    UIPassthroughResponse,
    TriggerPayload,
    TriggerResponse,
} from './contracts';

/** Host events that use getDataWithPassthroughFallback (getter-style APIs) */
const HOST_EVENT_PASSTHROUGH_MAP: Partial<Record<HostEvent, UIPassthroughEvent>> = {
    [HostEvent.GetAnswerSession]: UIPassthroughEvent.GetAnswerSession,
    [HostEvent.GetFilters]: UIPassthroughEvent.GetFilters,
    [HostEvent.GetIframeUrl]: UIPassthroughEvent.GetIframeUrl,
    [HostEvent.GetParameters]: UIPassthroughEvent.GetParameters,
    [HostEvent.GetTML]: UIPassthroughEvent.GetTML,
    [HostEvent.GetTabs]: UIPassthroughEvent.GetTabs,
    [HostEvent.getExportRequestForCurrentPinboard]: UIPassthroughEvent.GetExportRequestForCurrentPinboard,
};

export class HostEventClient {
  iFrame: HTMLIFrameElement;

  /** Host events with custom handlers 
   * (setters or special logic) - 
   * bound to instance for protected method access */
  private readonly customHandlers: Partial<
    Record<HostEvent, (payload: any, context?: ContextType) => Promise<any>>
  >;

  constructor(iFrame?: HTMLIFrameElement) {
      this.iFrame = iFrame;
      this.customHandlers = {
          [HostEvent.Pin]: (p, c) => this.handlePinEvent(p, c),
          [HostEvent.SaveAnswer]: (p, c) => this.handleSaveAnswerEvent(p, c),
          [HostEvent.UpdateFilters]: (p, c) => this.handleUpdateFiltersEvent(p, c),
          [HostEvent.DrillDown]: (p, c) => this.handleDrillDownEvent(p, c),
      };
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
          ?.find?.((r) => r.error || r.value);

      if (!response) {
          const error = `No answer found${parameters.vizId ? ` for vizId: ${parameters.vizId}` : ''}.`;
          throw { error };
      }

      const errors = response.error
        || (response.value as any)?.errors
        || (response.value as any)?.error;

      if (errors) {
          const message = typeof errors === 'string' ? errors : JSON.stringify(errors);
          throw { error: message };
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
      const matched = response?.find?.((r) => r.error || r.value);
      if (!matched) {
          return this.hostEventFallback(hostEvent, payload, context);
      }

      const errors = matched.error
          || (matched.value as any)?.errors
          || (matched.value as any)?.error;
      if (errors) {
          const message = typeof errors === 'string' ? errors : JSON.stringify(errors);
          throw new Error(message);
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

  protected handleUpdateFiltersEvent(
    payload: HostEventRequest<HostEvent.UpdateFilters>,
    context?: ContextType,
  ): Promise<any> {
    return this.handleHostEventWithParam(UIPassthroughEvent.UpdateFilters, payload, context as ContextType);
  }

  protected handleDrillDownEvent(
    payload: HostEventRequest<HostEvent.DrillDown>,
    context?: ContextType,
  ): Promise<any> {
    return this.handleHostEventWithParam(UIPassthroughEvent.Drilldown, payload, context as ContextType);
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

    const data = await this.triggerUIPassthroughApi(UIPassthroughEvent.GetAvailableUIPassthroughs, payload, context);
    const availableUIPassthroughs = data?.find?.((r) => r.error || r.value);
      const customHandler = this.customHandlers[hostEvent];
      if (customHandler) {
          return customHandler(payload, context as ContextType) as any;
      }

      const passthroughEvent = HOST_EVENT_PASSTHROUGH_MAP[hostEvent];
      if (passthroughEvent) {
          return this.getDataWithPassthroughFallback(
              passthroughEvent, hostEvent, payload, context as ContextType,
          ) as any;
      }

      return this.hostEventFallback(hostEvent, payload, context);
  }
}
