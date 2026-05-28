import { ContextType, HostEvent } from '../../types';
import { UIPassthroughArrayResponse, UIPassthroughEvent, HostEventRequest, HostEventResponse, UIPassthroughRequest, UIPassthroughResponse, TriggerPayload, TriggerResponse } from './contracts';
export declare class HostEventClient {
    iFrame: HTMLIFrameElement;
    /** Cached list of available UI passthrough keys from the embedded app */
    private availablePassthroughKeysCache;
    /** Host events with custom handlers
     * (setters or special logic) -
     * bound to instance for protected method access */
    private readonly customHandlers;
    constructor(iFrame?: HTMLIFrameElement);
    /**
     * A wrapper over process trigger to
     * @param {HostEvent} message Host event to send
     * @param {any} data Data to send with the host event
     * @returns {Promise<any>} - the response from the process trigger
     */
    protected processTrigger(message: HostEvent, data: any, context?: ContextType): Promise<any>;
    handleHostEventWithParam<UIPassthroughEventT extends UIPassthroughEvent>(apiName: UIPassthroughEventT, parameters: UIPassthroughRequest<UIPassthroughEventT>, context?: ContextType): Promise<UIPassthroughResponse<UIPassthroughEventT>>;
    hostEventFallback(hostEvent: HostEvent, data: any, context?: ContextType): Promise<any>;
    /**
     * For getter events that return data. Tries UI passthrough first;
     * if the app doesn't support it (no response data), falls back to
     * the legacy host event channel. Real errors are thrown as-is.
     */
    private getDataWithPassthroughFallback;
    /**
     * Setter for the iframe element used for host events
     * @param {HTMLIFrameElement} iFrame - the iframe element to set
     */
    setIframeElement(iFrame: HTMLIFrameElement): void;
    /**
     * Fetches the list of available UI passthrough keys from the embedded app.
     * Result is cached for the session. Returns empty array on failure.
     */
    private getAvailableUIPassthroughKeys;
    triggerUIPassthroughApi<UIPassthroughEventT extends UIPassthroughEvent>(apiName: UIPassthroughEventT, parameters: UIPassthroughRequest<UIPassthroughEventT>, context?: ContextType): Promise<UIPassthroughArrayResponse<UIPassthroughEventT>>;
    protected handlePinEvent(payload: HostEventRequest<HostEvent.Pin>, context?: ContextType): Promise<HostEventResponse<HostEvent.Pin, ContextType>>;
    protected handleSaveAnswerEvent(payload: HostEventRequest<HostEvent.SaveAnswer>, context?: ContextType): Promise<any>;
    protected handleUpdateFiltersEvent(payload: HostEventRequest<HostEvent.UpdateFilters>, context?: ContextType): Promise<any>;
    protected handleDrillDownEvent(payload: HostEventRequest<HostEvent.DrillDown>, context?: ContextType): Promise<any>;
    /**
     * Dispatches a host event using the appropriate channel:
     * 1. If the embedded app supports UI passthrough for this event, use it (custom handler or getter).
     * 2. Otherwise fall back to the legacy host event channel.
     *
     * @param hostEvent - The host event to trigger
     * @param payload - Optional payload for the event
     * @param context - Optional context (e.g. vizId) for scoped operations
     */
    triggerHostEvent<HostEventT extends HostEvent, PayloadT, ContextT extends ContextType>(hostEvent: HostEventT, payload?: TriggerPayload<PayloadT, HostEventT>, context?: ContextT): Promise<TriggerResponse<PayloadT, HostEventT, ContextType>>;
}
//# sourceMappingURL=host-event-client.d.ts.map