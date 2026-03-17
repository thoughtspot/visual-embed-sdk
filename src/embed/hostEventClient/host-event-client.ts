import { ContextType, EmbedErrorCodes, ErrorDetailsTypes, HostEvent } from '../../types';
import { processTrigger as processTriggerService } from '../../utils/processTrigger';
import { ERROR_MESSAGE } from '../../errors';
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

/** Custom handler events and their corresponding UI passthrough event */
const CUSTOM_HANDLER_PASSTHROUGH_MAP: Partial<Record<HostEvent, UIPassthroughEvent>> = {
    [HostEvent.Pin]: UIPassthroughEvent.PinAnswerToLiveboard,
    [HostEvent.SaveAnswer]: UIPassthroughEvent.SaveAnswer,
    [HostEvent.UpdateFilters]: UIPassthroughEvent.UpdateFilters,
    [HostEvent.DrillDown]: UIPassthroughEvent.Drilldown,
};

export class HostEventClient {
  iFrame: HTMLIFrameElement;

  /** Cached list of available UI passthrough keys from the embedded app */
  private availablePassthroughKeysCache: string[] | null = null;

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

  /**
   * Fetches the list of available UI passthrough keys from the embedded app.
   * Result is cached for the session. Returns empty array on failure.
   */
  private async getAvailableUIPassthroughKeys(context?: ContextType): Promise<string[]> {
      if (this.availablePassthroughKeysCache !== null) {
          return this.availablePassthroughKeysCache;
      }
      try {
          const response = await this.triggerUIPassthroughApi(
              UIPassthroughEvent.GetAvailableUIPassthroughs, {}, context,
          );
          const matched = response?.find?.((r) => r.value && !r.error);
          const keys = matched?.value?.keys;
          this.availablePassthroughKeysCache = Array.isArray(keys) ? keys : [];
          return this.availablePassthroughKeysCache;
      } catch {
          return [];
      }
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

  private static isValidUpdateFiltersPayload(
    payload: HostEventRequest<HostEvent.UpdateFilters> | undefined,
  ): boolean {
    if (!payload) return false;

    const isValidFilter = (f: { column?: string; oper?: string; values?: unknown[] }) =>
      !!f && typeof f.column === 'string' && typeof f.oper === 'string' && Array.isArray(f.values);

    const hasValidFilter = payload.filter && isValidFilter(payload.filter);
    const hasValidFilters = Array.isArray(payload.filters) && payload.filters.length > 0 && payload.filters.every(isValidFilter);

    return !!(hasValidFilter || hasValidFilters);
  }

  private static throwUpdateFiltersValidationError(): never {
    const message = ERROR_MESSAGE.UPDATEFILTERS_INVALID_PAYLOAD;
    const err = new Error(message) as Error & {
      isValidationError?: boolean;
      embedErrorDetails?: {
        errorType: ErrorDetailsTypes;
        message: string;
        code: EmbedErrorCodes;
        error: string;
      };
    };
    err.isValidationError = true;
    err.embedErrorDetails = {
      errorType: ErrorDetailsTypes.VALIDATION_ERROR,
      message,
      code: EmbedErrorCodes.HOST_EVENT_VALIDATION,
      error: message,
    };
    throw err;
  }

  protected handleUpdateFiltersEvent(
    payload: HostEventRequest<HostEvent.UpdateFilters>,
    context?: ContextType,
  ): Promise<any> {
    if (!HostEventClient.isValidUpdateFiltersPayload(payload)) {
      HostEventClient.throwUpdateFiltersValidationError();
    }

    return this.handleHostEventWithParam(UIPassthroughEvent.UpdateFilters, payload, context as ContextType);
  }

  private static isValidDrillDownPayload(
    payload: HostEventRequest<HostEvent.DrillDown> | undefined,
  ): boolean {
    if (!payload) return false;

    const points = payload.points;
    if (!points || typeof points !== 'object') return false;

    const hasClickedPoint = 'clickedPoint' in points && points.clickedPoint != null;
    const hasSelectedPoints = Array.isArray(points.selectedPoints) && points.selectedPoints.length > 0;

    return hasClickedPoint || hasSelectedPoints;
  }

  private static throwDrillDownValidationError(): never {
    const message = ERROR_MESSAGE.DRILLDOWN_INVALID_PAYLOAD;
    const err = new Error(message) as Error & {
      isValidationError?: boolean;
      embedErrorDetails?: { errorType: ErrorDetailsTypes; message: string; code: EmbedErrorCodes; error: string };
    };
    err.isValidationError = true;
    err.embedErrorDetails = {
      errorType: ErrorDetailsTypes.VALIDATION_ERROR,
      message,
      code: EmbedErrorCodes.HOST_EVENT_VALIDATION,
      error: message,
    };
    throw err;
  }

  protected handleDrillDownEvent(
    payload: HostEventRequest<HostEvent.DrillDown>,
    context?: ContextType,
  ): Promise<any> {
    if (!HostEventClient.isValidDrillDownPayload(payload)) {
      HostEventClient.throwDrillDownValidationError();
    }

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
      const customHandler = this.customHandlers[hostEvent];
      if (customHandler) {
          const passthroughEvent = CUSTOM_HANDLER_PASSTHROUGH_MAP[hostEvent];
          if (passthroughEvent) {
              const availableKeys = await this.getAvailableUIPassthroughKeys(context as ContextType);
              if (availableKeys.length > 0 && !availableKeys.includes(passthroughEvent)) {
                  return this.hostEventFallback(hostEvent, payload, context) as any;
              }
          }
          return customHandler(payload, context as ContextType) as any;
      }

      const passthroughEvent = HOST_EVENT_PASSTHROUGH_MAP[hostEvent];
      if (passthroughEvent) {
          const availableKeys = await this.getAvailableUIPassthroughKeys(context as ContextType);
          if (availableKeys.length > 0 && !availableKeys.includes(passthroughEvent)) {
              return this.hostEventFallback(hostEvent, payload, context) as any;
          }
          return this.getDataWithPassthroughFallback(
              passthroughEvent, hostEvent, payload, context as ContextType,
          ) as any;
      }

      return this.hostEventFallback(hostEvent, payload, context);
  }
}
