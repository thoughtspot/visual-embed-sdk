/**
 * Copyright (c) 2022
 *
 * Base classes
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
import { TriggerPayload, TriggerResponse, UIPassthroughArrayResponse, UIPassthroughEvent, UIPassthroughRequest } from './hostEventClient/contracts';
import { AnswerService } from '../utils/graphql/answerService/answerService';
import { DOMSelector, HostEvent, EmbedEvent, MessageCallback, Action, EmbedConfig, MessageOptions, DefaultAppInitData, AllEmbedViewConfig as ViewConfig, EmbedErrorDetailsEvent, ContextType, ContextObject } from '../types';
import { HostEventClient } from './hostEventClient/host-event-client';
/**
 * Global prefix for all ThoughtSpot postHash Params.
 */
export declare const THOUGHTSPOT_PARAM_PREFIX = "ts-";
/**
 * Base class for embedding v2 experience
 * Note: the v2 version of ThoughtSpot Blink is built on the new stack:
 * React+GraphQL
 */
export declare class TsEmbed {
    /**
     * The DOM node which was inserted by the SDK to either
     * render the iframe or display an error message.
     * This is useful for removing the DOM node when the
     * embed instance is destroyed.
     */
    protected insertedDomEl: Node;
    /**
     * The DOM node where the ThoughtSpot app is to be embedded.
     */
    protected hostElement: HTMLElement;
    /**
     * The key to store the embed instance in the DOM node
     */
    protected embedNodeKey: string;
    protected isAppInitialized: boolean;
    /**
     * A reference to the iframe within which the ThoughtSpot app
     * will be rendered.
     */
    protected iFrame: HTMLIFrameElement;
    /**
     * Setter for the iframe element
     * @param {HTMLIFrameElement} iFrame HTMLIFrameElement
     */
    protected setIframeElement(iFrame: HTMLIFrameElement): void;
    protected viewConfig: ViewConfig & {
        visibleTabs?: string[];
        hiddenTabs?: string[];
        showAlerts?: boolean;
    };
    protected embedConfig: EmbedConfig;
    /**
     * The ThoughtSpot hostname or IP address
     */
    protected thoughtSpotHost: string;
    protected thoughtSpotV2Base: string;
    /**
     * A map of event handlers for particular message types triggered
     * by the embedded app; multiple event handlers can be registered
     * against a particular message type.
     */
    private eventHandlerMap;
    /**
     * A flag that is set to true post render.
     */
    protected isRendered: boolean;
    /**
     * A flag to mark if an error has occurred.
     */
    private isError;
    /**
     * A flag that is set to true post preRender.
     */
    private isPreRendered;
    /**
     * Should we encode URL Query Params using base64 encoding which ThoughtSpot
     * will generate for embedding. This provides additional security to
     * ThoughtSpot clusters against Cross site scripting attacks.
     * @default false
     */
    private shouldEncodeUrlQueryParams;
    private defaultHiddenActions;
    private resizeObserver;
    protected hostEventClient: HostEventClient;
    protected isReadyForRenderPromise: Promise<void>;
    protected shouldWaitForRenderPromise: boolean;
    /**
     * Handler for fullscreen change events
     */
    private fullscreenChangeHandler;
    constructor(domSelector: DOMSelector, viewConfig?: ViewConfig);
    /**
     * Throws error encountered during initialization.
     */
    private throwInitError;
    /**
     * Handles errors within the SDK
     * @param error The error message or object
     * @param errorDetails The error details
     */
    protected handleError(errorDetails: EmbedErrorDetailsEvent): void;
    /**
     * Extracts the type field from the event payload
     * @param event The window message event
     */
    private getEventType;
    /**
     * Extracts the port field from the event payload
     * @param event  The window message event
     * @returns
     */
    private getEventPort;
    /**
     * Checks if preauth cache is enabled
     * from the view config and embed config
     * @returns boolean
     */
    private isPreAuthCacheEnabled;
    /**
     * Checks if current embed is FullAppEmbed with visible primary navbar
     * @returns boolean
     */
    private isFullAppEmbedWithVisiblePrimaryNavbar;
    /**
     * fix for ts7.sep.cl
     * will be removed for ts7.oct.cl
     * @param event
     * @param eventType
     * @hidden
     */
    private formatEventData;
    private subscribedListeners;
    /**
     * Subscribe to network events (online/offline) that should
     * work regardless of auth status
     */
    private subscribeToNetworkEvents;
    private handleApiInterceptEvent;
    private messageEventListener;
    /**
     * Subscribe to message events that depend on successful iframe setup
     */
    private subscribeToMessageEvents;
    /**
     * Adds event listeners for both network and message events.
     * This maintains backward compatibility with the existing method.
     * Adds a global event listener to window for "message" events.
     * ThoughtSpot detects if a particular event is targeted to this
     * embed instance through an identifier contained in the payload,
     * and executes the registered callbacks accordingly.
     */
    private subscribeToEvents;
    private unsubscribeToNetworkEvents;
    private unsubscribeToMessageEvents;
    private unsubscribeToEvents;
    protected getAuthTokenForCookielessInit(): Promise<string>;
    protected getDefaultAppInitData(): Promise<DefaultAppInitData>;
    protected getAppInitData(): Promise<DefaultAppInitData>;
    /**
     * Send Custom style as part of payload of APP_INIT
     * @param _
     * @param responder
     */
    private appInitCb;
    /**
     * Helper method to refresh/update auth token for TrustedAuthTokenCookieless auth type
     * @param responder - Function to send response back
     * @param eventType - The embed event type to send
     * @param forceRefresh - Whether to force refresh the token
     * @returns Promise that resolves if token was refreshed, rejects otherwise
     */
    private refreshAuthTokenForCookieless;
    private handleAuthFailure;
    /**
     * Refresh the auth token if the autoLogin is true and the authType is TrustedAuthTokenCookieless
     * @param _
     * @param responder
     */
    private tokenRefresh;
    /**
     * Sends updated auth token to the iFrame to avoid user logout
     * @param _
     * @param responder
     */
    private updateAuthToken;
    /**
     * Auto Login and send updated authToken to the iFrame to avoid user session logout
     * @param _
     * @param responder
     */
    private idleSessionTimeout;
    /**
     * Register APP_INIT event and sendback init payload
     */
    private registerAppInit;
    /**
     * Constructs the base URL string to load the ThoughtSpot app.
     * @param query
     */
    protected getEmbedBasePath(query: string): string;
    protected getUpdateEmbedParamsObject(): Promise<Record<any, any>>;
    /**
     * Common query params set for all the embed modes.
     * @param queryParams
     * @returns queryParams
     */
    protected getBaseQueryParams(queryParams?: Record<any, any>): Record<any, any>;
    /**
     * Constructs the base URL string to load v1 of the ThoughtSpot app.
     * This is used for embedding Liveboards, visualizations, and full application.
     * @param queryString The query string to append to the URL.
     * @param isAppEmbed A Boolean parameter to specify if you are embedding
     * the full application.
     */
    protected getV1EmbedBasePath(queryString: string): string;
    protected getEmbedParams(): string;
    protected getEmbedParamsObject(): Record<any, any>;
    protected getRootIframeSrc(): string;
    protected createIframeEl(frameSrc: string): HTMLIFrameElement;
    /**
     * Returns true if this embed instance is configured for pre-rendering.
     */
    protected isPreRenderEmbed(): boolean;
    protected handleInsertionIntoDOM(child: string | Node): void;
    /**
     * Renders the embedded ThoughtSpot app in an iframe and sets up
     * event listeners.
     * @param url - The URL of the embedded ThoughtSpot app.
     */
    protected renderIFrame(url: string): Promise<any>;
    protected createPreRenderWrapper(): HTMLDivElement;
    protected preRenderWrapper: HTMLElement;
    protected preRenderChild: HTMLElement;
    /**
     * Checks for an existing pre-rendered component and connects to it.
     *
     * If a matching pre-rendered component is found in the DOM, this method
     * sets the internal properties of the embed object to reference it.
     *
     * @returns True if a connection was successfully established, false otherwise.
     */
    protected connectPreRendered(): boolean;
    protected isPreRenderConnected(): boolean;
    protected createPreRenderChild(child: string | Node): HTMLElement;
    /**
     * Creates the in-flow placeholder div inserted into the host element when
     * showPreRender() is called. The wrapper observes this element to stay
     * aligned with the host layout.
     */
    private createPreRenderPlaceholder;
    protected insertIntoDOMForPreRender(child: string | Node): void;
    private showPreRenderByDefault;
    protected insertIntoDOM(child: string | Node): void;
    /**
     * Sets the height of the iframe
     * @param height The height in pixels
     */
    protected setIFrameHeight(height: number | string): void;
    /**
     * We can process the customer given payload before sending it to the embed port
     * Embed event handler -> responder -> createEmbedEventResponder -> send response
     * @param eventPort The event port for a specific MessageChannel
     * @param eventType The event type
     * @returns
     */
    protected createEmbedEventResponder: (eventPort: MessagePort | void, eventType: EmbedEvent) => (payload: any) => void;
    private shouldSkipEvent;
    /**
     * Executes all registered event handlers for a particular event type
     * @param eventType The event type
     * @param data The payload invoked with the event handler
     * @param eventPort The event Port for a specific MessageChannel
     */
    protected executeCallbacks(eventType: EmbedEvent, data: any, eventPort?: MessagePort | void): void;
    /**
     * Returns the ThoughtSpot hostname or IP address.
     */
    protected getThoughtSpotHost(): string;
    /**
     * Gets the v1 event type (if applicable) for the EmbedEvent type
     * @param eventType The v2 event type
     * @returns The corresponding v1 event type if one exists
     * or else the v2 event type itself
     */
    protected getCompatibleEventType(eventType: EmbedEvent): EmbedEvent;
    /**
     * Calculates the iframe center for the current visible viewPort
     * of iframe using Scroll position of Host App, offsetTop for iframe
     * in Host app. ViewPort height of the tab.
     * @returns iframe Center in visible viewport,
     *  Iframe height,
     *  View port height.
     */
    protected getIframeCenter(): {
        iframeCenter: number;
        iframeScrolled: number;
        iframeHeight: number;
        viewPortHeight: number;
        iframeVisibleViewPort: number;
    };
    /**
     * Registers an event listener to trigger an alert when the ThoughtSpot app
     * sends an event of a particular message type to the host application.
     * @param messageType The message type
     * @param callback A callback as a function
     * @param options The message options
     * @param isSelf
     * @param isRegisteredBySDK
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Error, (data) => {
     *   console.error(data);
     * });
     * ```
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Save, (data) => {
     *   console.log("Answer save clicked", data);
     * }, {
     *   start: true // This will trigger the callback on start of save
     * });
     * ```
     */
    on(messageType: EmbedEvent, callback: MessageCallback, options?: MessageOptions, isRegisteredBySDK?: boolean): typeof TsEmbed.prototype;
    /**
     * Removes an event listener for a particular event type.
     * @param messageType The message type
     * @param callback The callback to remove
     * @example
     * ```js
     * const errorHandler = (data) => { console.error(data); };
     * tsEmbed.on(EmbedEvent.Error, errorHandler);
     * tsEmbed.off(EmbedEvent.Error, errorHandler);
     * ```
     */
    off(messageType: EmbedEvent, callback: MessageCallback): typeof TsEmbed.prototype;
    /**
     * Triggers an event on specific Port registered against
     * for the EmbedEvent
     * @param eventType The message type
     * @param data The payload to send
     * @param eventPort
     * @param payload
     */
    private triggerEventOnPort;
    /**
    * @hidden
    * Internal state to track if the embed container is loaded.
    * This is used to trigger events after the embed container is loaded.
    */
    isEmbedContainerLoaded: boolean;
    /**
     * @hidden
     * Internal state to track the callbacks to be executed after the embed container
     * is loaded.
     * This is used to trigger events after the embed container is loaded.
     */
    private embedContainerReadyCallbacks;
    protected getPreRenderObj<T extends TsEmbed>(): T;
    private checkEmbedContainerLoaded;
    private executeEmbedContainerReadyCallbacks;
    /**
     * Executes a callback after the embed container is loaded.
     * @param callback The callback to execute
     */
    protected executeAfterEmbedContainerLoaded(callback: () => void): void;
    protected createEmbedContainerHandler: (source: EmbedEvent.AuthInit | EmbedEvent.EmbedListenerReady) => () => void;
    /**
     * Triggers an event to the embedded app
     * @param {HostEvent} messageType The event type
     * @param {any} data The payload to send with the message
     * @param {ContextType} context Optional context type to specify the context from which the event is triggered.
     * Use ContextType.Search for search answer context, ContextType.Answer for answer/explore context,
     * ContextType.Liveboard for liveboard context, or ContextType.Spotter for spotter context.
     * Available from SDK version 1.45.2 | ThoughtSpot: 26.3.0.cl
     * @returns A promise that resolves with the response from the embedded app
     * @example
     * ```js
     * // Trigger Pin event with context (SDK: 1.45.2+)
     * import { HostEvent, ContextType } from '@thoughtspot/visual-embed-sdk';
     * embed.trigger(HostEvent.Pin, {
     *   vizId: "123",
     *   liveboardId: "456"
     * }, ContextType.Search);
     * ```
     * @version SDK: 1.45.2 | ThoughtSpot: 26.3.0.cl (for context parameter)
     */
    trigger<HostEventT extends HostEvent, PayloadT, ContextT extends ContextType>(messageType: HostEventT, data?: TriggerPayload<PayloadT, HostEventT>, context?: ContextT): Promise<TriggerResponse<PayloadT, HostEventT, ContextT>>;
    /**
     * Triggers an event to the embedded app, skipping the UI flow.
     * @param {UIPassthroughEvent} apiName - The name of the API to be triggered.
     * @param {UIPassthroughRequest} parameters - The parameters to be passed to the API.
     * @returns {Promise<UIPassthroughRequest>} - A promise that resolves with the response
     * from the embedded app.
     */
    triggerUIPassThrough<UIPassthroughEventT extends UIPassthroughEvent>(apiName: UIPassthroughEventT, parameters: UIPassthroughRequest<UIPassthroughEventT>): Promise<UIPassthroughArrayResponse<UIPassthroughEventT>>;
    /**
     * Marks the ThoughtSpot object to have been rendered
     * Needs to be overridden by subclasses to do the actual
     * rendering of the iframe.
     * @param args
     */
    render(): Promise<TsEmbed>;
    getIframeSrc(): string;
    protected handleRenderForPrerender(): Promise<TsEmbed>;
    /**
    * Context object for the embedded component.
    * @returns {ContextObject} The current context object containing the page type and object ids.
    * @example
    * ```js
    * const context = await embed.getCurrentContext();
    * console.log(context);
    *
    * // Example output
    * {
    *   stack: [
    *     {
    *       name: 'Liveboard',
    *       type: ContextType.Liveboard,
    *       objectIds: {
    *         liveboardId: '123',
    *       },
    *     },
    *   ],
    *   currentContext: {
    *     name: 'Liveboard',
    *     type: ContextType.Liveboard,
    *     objectIds: {
    *       liveboardId: '123',
    *     },
    *   },
    * }
    * ```
     * @version SDK: 1.45.2 | ThoughtSpot: 26.3.0.cl
     */
    getCurrentContext(): Promise<ContextObject>;
    /**
     * Generates the event name for a "Subscribed" embed event.
     *
     * This helper appends the "Subscribed" suffix to a given host or action event,
     * allowing you to listen for subscription lifecycle events in a consistent format.
     *
     * @param eventName - The host or action event to generate the subscribed event name for.
     * @returns The formatted event name (e.g., "Save Subscribed").
     *
     * @version SDK: 1.47.2 | ThoughtSpot: 26.3.0.cl
     */
    subscribedEvent(eventName: HostEvent | Action): string;
    /**
     * Creates the preRender shell
     * @param showPreRenderByDefault - Show the preRender after render, hidden by default
     */
    preRender(showPreRenderByDefault?: boolean, replaceExistingPreRender?: boolean): Promise<TsEmbed>;
    /**
     * Get the Post Url Params for THOUGHTSPOT from the current
     * host app URL.
     * THOUGHTSPOT URL params starts with a prefix "ts-"
     * @version SDK: 1.14.0 | ThoughtSpot: 8.4.0.cl, 8.4.1-sw
     */
    getThoughtSpotPostUrlParams(additionalParams?: {
        [key: string]: string | number;
    }): string;
    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.19.1 | ThoughtSpot: *
     */
    destroy(): void;
    getUnderlyingFrameElement(): HTMLIFrameElement;
    /**
     * Prerenders a generic instance of the TS component.
     * This means without the path but with the flags already applied.
     * This is useful for prerendering the component in the background.
     * @version SDK: 1.22.0
     * @returns
     */
    prerenderGeneric(): Promise<any>;
    protected beforePrerenderVisible(): void;
    /**
     * Displays the pre-rendered component inside the host element.
     * If the component has not been pre-rendered yet, it initiates rendering first.
     * Inserts a placeholder element into the host and positions the pre-render
     * wrapper to overlay it.
     */
    showPreRender(): Promise<TsEmbed>;
    protected getPreRenderPlaceHolderElement(): HTMLDivElement;
    /**
     * Synchronizes the style properties of the PreRender component with the embedding
     * element. This function adjusts the position, width, and height of the PreRender
     * component
     * to match the dimensions and position of the embedding element.
     * @throws {Error} Throws an error if the embedding element (passed as domSelector)
     * is not defined or not found.
     */
    syncPreRenderStyle(): void;
    /**
     * Hides the PreRender component if it is available.
     * If the component is not preRendered, it issues a warning.
     */
    hidePreRender(): void;
    /**
     * Retrieves unique HTML element IDs for PreRender-related elements.
     * These IDs are constructed based on the provided 'preRenderId' from 'viewConfig'.
     * @returns {object} An object containing the IDs for the PreRender elements.
     * @property {string} wrapper - The HTML element ID for the PreRender wrapper.
     * @property {string} child - The HTML element ID for the PreRender child.
     */
    getPreRenderIds(): {
        wrapper: string;
        child: string;
        placeHolder: string;
    };
    /**
     * Returns the answerService which can be used to make arbitrary graphql calls on top
     * session.
     * @param vizId [Optional] to get for a specific viz in case of a Liveboard.
     * @version SDK: 1.25.0 | ThoughtSpot: 9.10.0
     */
    getAnswerService(vizId?: string): Promise<AnswerService>;
    /**
     * Set up fullscreen change detection to automatically trigger ExitPresentMode
     * when user exits fullscreen mode
     */
    private setupFullscreenChangeHandler;
    /**
     * Remove fullscreen change handler
     */
    private removeFullscreenChangeHandler;
}
/**
 * Base class for embedding v1 experience
 * Note: The v1 version of ThoughtSpot Blink works on the AngularJS stack
 * which is currently under migration to v2
 * @inheritdoc
 */
export declare class V1Embed extends TsEmbed {
    protected viewConfig: ViewConfig;
    constructor(domSelector: DOMSelector, viewConfig: ViewConfig);
    /**
     * Render the app in an iframe and set up event handlers
     * @param iframeSrc
     */
    protected renderV1Embed(iframeSrc: string): Promise<any>;
    protected getRootIframeSrc(): string;
    /**
     * @inheritdoc
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Error, (data) => {
     *   console.error(data);
     * });
     * ```
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Save, (data) => {
     *   console.log("Answer save clicked", data);
     * }, {
     *   start: true // This will trigger the callback on start of save
     * });
     * ```
     */
    on(messageType: EmbedEvent, callback: MessageCallback, options?: MessageOptions): typeof TsEmbed.prototype;
    /**
     * Only for testing purposes.
     * @hidden
     */
    test__executeCallbacks: (eventType: EmbedEvent, data: any, eventPort?: void | MessagePort) => void;
}
//# sourceMappingURL=ts-embed.d.ts.map