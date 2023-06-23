/**
 * Copyright (c) 2023
 *
 * TypeScript type definitions for ThoughtSpot Visual Embed SDK
 *
 * @summary Type definitions for Embed SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { CustomCssVariables } from './css-variables';

/**
 * The authentication mechanism for allowing access to the
 * the embedded app
 *
 * @group Authentication / Init
 */
// eslint-disable-next-line no-shadow
export enum AuthType {
    /**
     * No authentication on the SDK. Passthrough to the embedded App. Alias for
     * `Passthrough`.
     *
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.None,
     *  });
     * ```
     */
    None = 'None',
    /**
     * Passthrough SSO to the embedded App within the iframe. Requires least
     * configuration, but may not be supported by all IDPs. This will behave like `None`
     * if SSO is not configured on ThoughtSpot.
     *
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.EmbeddedSSO,
     *  });
     * ```
     * Set authentication type as Embedded SSO.
     *
     * To use this:
     * Your SAML or OpenID provider must allow iframe redirects.
     * eg. If you are using okta as IdP, you can enable iFrame embedding.
     * @version: SDK: 1.15.0 | ThouhgtSpot: 8.8.0.cl
     */
    EmbeddedSSO = 'EmbeddedSSO',
    /**
     * SSO using SAML
     *
     * @deprecated Use {@link SAMLRedirect} instead
     * @hidden
     */
    SSO = 'SSO_SAML',
    /**
     * SSO using SAML
     *
     * @deprecated Use {@link SAMLRedirect} instead
     * @hidden
     */
    SAML = 'SSO_SAML',
    /**
     * SSO using SAML
     * Will make the host application redirect to the SAML Idp. Use this
     * when the idp does not allow itself to be embedded.
     *
     * This redirects the host application to the SAML Idp. The host application
     * will be redirected back to the ThoughtSpot app after authentication.
     *
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.SAMLRedirect,
     *  });
     * ```
     *
     * This opens the SAML Idp in a popup window. The popup is triggered
     * when the user clicks the trigger button. The popup window will be
     * closed automatically after authentication.
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.SAMLRedirect,
     *   authTriggerText: 'Login with SAML',
     *   authTriggerContainer: '#embed-container',
     *   inPopup: true,
     * });
     * ```
     *
     * Can also use event to trigger the popup flow. Works the same
     * as above example.
     * @example
     * ```js
     * const authEE = init({
     *  // ...
     *  authType: AuthType.SAMLRedirect,
     *  inPopup: true,
     * });
     *
     * someButtonOnYourPage.addEventListener('click', () => {
     *  authEE.emit(AuthEvent.TRIGGER_SSO_POPUP);
     * });
     * ```
     */
    SAMLRedirect = 'SSO_SAML',
    /**
     * SSO using OIDC
     *
     * @hidden
     * @deprecated Use {@link OIDCRedirect} instead
     */
    OIDC = 'SSO_OIDC',
    /**
     * SSO using OIDC
     * Will make the host application redirect to the OIDC Idp.
     * See code samples in {@link SAMLRedirect}.
     */
    OIDCRedirect = 'SSO_OIDC',
    /**
     * Trusted authentication server
     *
     * @hidden
     * @deprecated Use {@link TrustedAuth} instead
     */
    AuthServer = 'AuthServer',
    /**
     * Trusted authentication server, Use your own authentication server
     * which returns a bearer token, generated using the secret_key obtained
     * from ThoughtSpot.
     *
     * @example
     * ```js
     * init({
     *  // ...
     *  authType: AuthType.TrustedAuthToken,
     *  getAuthToken: () => {
     *    return fetch('https://my-backend.app/ts-token')
     *      .then((response) => response.json())
     *      .then((data) => data.token);
     *  }
     * ```
     */
    TrustedAuthToken = 'AuthServer',
    /**
     * Trusted authentication server Cookieless, Use you own authentication
     * server which returns a bearer token, generated using the secret_key
     * obtained from ThoughtSpot. This uses a cookieless authentication
     * approach, recommended to by pass third-party cookie-blocking restriction
     * implemented by some browsers
     *
     * @example
     * ```js
     * init({
     *  // ...
     *  authType: AuthType.TrustedAuthTokenCookieless,
     *  getAuthToken: () => {
     *    return fetch('https://my-backend.app/ts-token')
     *      .then((response) => response.json())
     *      .then((data) => data.token);
     *  }
     * ```
     * @version SDK: 1.22.0| ThouhgtSpot: 9.3.0.cl, 9.5.1-sw
     */
    TrustedAuthTokenCookieless = 'AuthServerCookieless',
    /**
     * Use the ThoughtSpot login API to authenticate to the cluster directly.
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
    Basic = 'Basic',
}

export type DOMSelector = string | HTMLElement;

/**
 * inline customCSS within the {@link CustomisationsInterface}.
 * Use {@link CustomCssVariables} or css rules.
 */
export interface customCssInterface {
    /**
     * The custom css variables, which can be set.
     * The allowed list is in the CustomCssVariables
     * interface.
     * Or here: https://try-everywhere.thoughtspot.cloud/resources/static/css/custom_variables.css
     */
    variables?: CustomCssVariables;
    /**
     * Can be used to define a custom font face
     * like:
     *
     * @example
     * ```js
     * rules_UNSTABLE?: {
     *     "@font-face": {
     *         "font-family": "custom-font",
     *         "src": url("/path/")
     *     };
     *   };
     * ```
     *
     * Also, custom css rules outside of variables.
     * @example
     * ```js
     * rules_UNSTABLE?: {
     *     ".thoughtspot_class_name": {
     *         "border-radius": "10px",
     *         margin: "20px"
     *     };
     *   };
     * ```
     */
    // eslint-disable-next-line camelcase
    rules_UNSTABLE?: {
        [selector: string]: {
            [declaration: string]: string;
        };
    };
}
/**
 * Styles within the {@link CustomisationsInterface}.
 */
export interface CustomStyles {
    customCSSUrl?: string;
    customCSS?: customCssInterface;
}

/**
 * Configuration to define the customization on the Embedded
 * Thoughtspot components.
 *
 * @example
 * ```js
 *  init({
 *    // ...
 *    customizations: {
 *     style: {
 *       customCSS: {
 *         variables: {},
 *         rules_UNSTABLE: {}
 *       }
 *     },
 *     content: {
 *      strings: {
 *        'LIVEBOARDS': 'Dashboards'
 *      }
 *     },
 *     iconSpriteUrl: 'https://my-custom-icon-sprite.svg'
 *    }
 *  })
 * ```
 */
export interface CustomisationsInterface {
    style?: CustomStyles;
    content?: {
        strings?: Record<string, any>;
        [key: string]: any;
    };
    iconSpriteUrl?: string;
}

/**
 * The configuration object for embedding ThoughtSpot content.
 * It includes the ThoughtSpot hostname or IP address,
 * the type of authentication, and the authentication endpoint
 * if a trusted authentication server is used.
 *
 * @group Authentication / Init
 */
export interface EmbedConfig {
    /**
     * The ThoughtSpot cluster hostname or IP address.
     */
    thoughtSpotHost: string;
    /**
     * The authentication mechanism to use.
     */
    authType: AuthType;
    /**
     * [AuthServer] The trusted authentication endpoint to use to get the
     * authentication token. A GET request is made to the
     * authentication API endpoint, which  returns the token
     * as a plaintext response. For trusted authentication,
     * the `authEndpoint` or `getAuthToken` attribute is required.
     */
    authEndpoint?: string;
    /**
     * [AuthServer] A function that invokes the trusted authentication endpoint
     * and returns a Promise that resolves to the `auth token` string.
     * For trusted authentication, the `authEndpoint` or `getAuthToken`
     * attribute is required.
     *
     * It is advisable to fetch a new token inside this method and not
     * reuse and older issued token, as because when auth expires this is
     * called again and if it is called with an older token the authentication
     * will not succeed.
     */
    getAuthToken?: () => Promise<string>;
    /**
     * [AuthServer / Basic] The user name of the ThoughtSpot user. This
     * attribute is required for trusted authentication.
     */
    username?: string;

    /**
     * [Basic] The ThoughtSpot login password corresponding to the user name
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
    password?: string;

    /**
     * [SSO] For SSO Authentication, if `noRedirect` is set to true, it will
     * open the SAML auth flow in a popup, instead of redirecting browser in
     * place.
     *
     * @default false
     * @deprecated
     */
    noRedirect?: boolean;

    /**
     * [SSO] For SSO Authentication, if `inPopup` is set to true, it will open
     * the SAML auth flow in a popup, instead of redirecting browser in place.
     *
     * Need to use this with authTriggerContainer. Or manually trigger
     * the AuthEvent.TRIGGER_SSO_POPUP event on a user interaction.
     *
     * @default false
     * @version SDK: 1.18.0
     */
    inPopup?: boolean;

    /**
     * [SSO] For SSO Authentication, one can supply an optional path param,
     * this will be the path on the host origin where the SAML flow will be
     * terminated.
     *
     * Eg: "/dashboard", "#/foo" [Do not include the host]
     *
     * @version SDK: 1.10.2 | 8.2.0.cl, 8.4.1-sw
     */
    redirectPath?: string;

    /** @internal */
    basepath?: string;

    /**
     * Should we encode URL Query Params using base64 encoding which thoughtspot
     * will generate for embedding. This provides additional security to
     * thoughtspot clusters against Cross site scripting attacks.
     *
     * @default false
     */
    shouldEncodeUrlQueryParams?: boolean;

    /**
     * Suppress cookie access alert when third party cookies are blocked by the
     * user's browser. Third party cookie blocking is the default behaviour on
     * Safari and opt-in for Firefox/Chrome. If you set this to `true`, you are
     * encouraged to handle `noCookieAccess` event, to show your own treatment
     * in this case.
     *
     * @default false
     */
    suppressNoCookieAccessAlert?: boolean;

    /**
     * Ignore cookie access alert when third party cookies are blocked by the
     * user's browser. If you set this to `true`, the embedded iframe behaviour
     * persist even in case of non logged in user.
     *
     * @default false
     */
    ignoreNoCookieAccess?: boolean;

    /**
     * Re-login when session expires with the previous login options
     *
     * @default false
     */
    autoLogin?: boolean;

    /**
     * Disable redirection to the login page when the embedded session expires
     * This flag is typically used alongside the combination of auth modes such as {@link
     * AuthType.AuthServer} and auto login behavior {@link EmbedConfig.autoLogin}
     *
     * @version SDK: 1.9.3 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     * @default false
     */
    disableLoginRedirect?: boolean;

    /**
     * This message is displayed on the embed view when the login fails.
     *
     * @version SDK: 1.10.1 | ThoughtSpot: 8.2.0.cl, 8.4.1-sw
     */
    loginFailedMessage?: string;

    /**
     * Calls the prefetch method internally when set to true
     *
     * @default false
     */
    callPrefetch?: boolean;

    /**
     * When there are multiple embeds, queue the render of embed to start
     *  after the previous embed's render is complete. This helps in the load
     *  performance by decreasing the load on the browser.
     *
     *  @Version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     * @default false
     */
    queueMultiRenders?: boolean;

    /**
     * Dynamic CSS Url to be injected in the loaded application.
     * You would also need to set `style-src` in the CSP settings.
     *
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1-sw
     * @default ''
     */
    customCssUrl?: string;
    /**
     * [AuthServer|Basic] Detect if 3rd party cookies are enabled by doing an
     * additional call. This is slower and should be avoided. Listen to the
     * NO_COOKIE_ACCESS event to handle the situation.
     *
     * This is slightly slower than letting the browser handle the cookie check, as it
     * involves an extra network call.
     *
     * @version SDK: 1.10.4 | ThoughtSpot: 8.2.0.cl, 8.4.1-sw
     */
    detectCookieAccessSlow?: boolean;
    /**
     * Hide beta alert warning message for SearchEmbed.
     *
     * @version SDK: 1.12.0 | ThoughtSpot: 8.4.0.cl, 8.4.1-sw*
     */
    suppressSearchEmbedBetaWarning?: boolean;
    /**
     * Hide beta alert warning message for SageEmbed.
     *
     */
    suppressSageEmbedBetaWarning?: boolean;
    /**
     * Custom style params for embed Config.
     *
     * @version SDK: 1.17.0 | ThoughtSpot: 8.9.0.cl
     */
    customizations?: CustomisationsInterface;
    /**
     * For inPopup SAMLRedirect or OIDCRedirect Auth, we need a button which the user
     * click to trigger the flow. This is the containing element
     * for that button.
     *
     * @example
     * ```js
     * init({
     *   authType: AuthType.SAMLRedirect,
     *   inPopup: true,
     *   authTriggerContainer: '#auth-trigger-container'
     * })
     * ```
     * @version SDK: 1.17.0 | ThoughtSpot: *
     */
    authTriggerContainer?: string | HTMLElement;
    /**
     * Specify that we want to use the AuthEvent.TRIGGER_SSO_POPUP event to trigger
     * SAML popup. This is useful when you want to trigger the popup on a custom user
     * action.
     *
     */
    useEventForSAMLPopup?: boolean;
    /**
     * Text to show in the button which triggers the popup auth flow.
     * Default: "Authorize".
     *
     * @version SDK: 1.17.0 | ThoughtSpot: *
     */
    authTriggerText?: string;
    /**
     * Disable Full App access of Embedded app outside of the iFrame.
     *
     * @default true
     * @version SDK: 1.22.0 | ThoughtSpot: 9.3.0.cl, 9.5.1-sw
     */
    blockNonEmbedFullAppAccess?: boolean;

    /**
     * Host config incase embedded app is inside TS app itself
     */
    hostConfig?: {
        hostUserGuid: string;
        hostClusterId: string;
        hostClusterName: string;
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LayoutConfig { }

/**
 * Embedded iFrame configuration
 *
 * @group Embed components
 */
export interface FrameParams {
    /**
     * The width of the iFrame (unit is pixels if numeric).
     */
    width?: number | string;
    /**
     * The height of the iFrame (unit is pixels if numeric).
     */
    height?: number | string;
    /**
     * Set to 'lazy' to enable lazy loading of the embedded TS frame.
     * This will defer loading of the frame until it comes into the
     * viewport. This is useful for performance optimization.
     */
    loading?: 'lazy' | 'eager' | 'auto';
    /**
     * This parameters will be passed on the iframe
     * as is.
     */
    [key: string]: string | number | boolean | undefined;
}

/**
 * The configuration object for an embedded view.
 */
export interface ViewConfig {
    /**
     * @hidden
     */
    layoutConfig?: LayoutConfig;
    /**
     * The <b>width</b> and <b>height</b> dimensions to render an embedded
     * object inside your app.  Specify the values in pixels or percentage.
     */
    frameParams?: FrameParams;
    /**
     * @hidden
     */
    theme?: string;
    /**
     * @hidden
     */
    // eslint-disable-next-line camelcase
    styleSheet__unstable?: string;
    /**
     * The list of actions to disable from the primary menu, more menu
     * (...), and the contextual menu. These actions will be disabled
     * for the user.
     * Use this to disable actions.
     *
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   disabledActions: [Action.Download, Action.Save]
     * });
     * ```
     */
    disabledActions?: Action[];
    /**
     * The tooltip to display for disabled actions.
     */
    disabledActionReason?: string;
    /**
     * The list of actions to hide from the embedded.
     * This actions will be hidden from the user.
     * Use this to hide an action.
     *
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   hiddenActions: [Action.Download, Action.Export]
     * });
     * ```
     * @important
     */
    hiddenActions?: Action[];
    /**
     * The list of actions to display from the primary menu, more menu
     * (...), and the contextual menu. These will be only actions that
     * are visible to the user.
     * Use this to hide all actions except the ones you want to show.
     *
     * Use either this or hiddenActions.
     *
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1-sw
     * @important
     */
    visibleActions?: Action[];
    /**
     * Show alert messages and toast messages in the embedded view.
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    showAlerts?: boolean;
    /**
     * The list of runtime filters to apply to a search answer,
     * visualization, or Liveboard.
     */
    runtimeFilters?: RuntimeFilter[];
    /**
     * The locale/language to use for the embedded view.
     *
     * @version SDK: 1.9.4 | ThoughtSpot 8.1.0.cl, 8.4.1-sw
     */
    locale?: string;
    /**
     * This is an object (key/val) of override flags which will be applied
     * to the internal embedded object. This can be used to add any
     * URL flag.
     * Warning: This option is for advanced use only and is used internally
     * to control embed behavior in non-regular ways. We do not publish the
     * list of supported keys and values associated with each.
     *
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     */
    additionalFlags?: { [key: string]: string | number | boolean };
    /**
     * Dynamic CSSUrl and customCSS to be injected in the loaded application.
     * You would also need to set `style-src` in the CSP settings.
     *
     * @version SDK: 1.17.2 | ThoughtSpot: 8.4.1-sw, 8.4.0.cl
     * @default ''
     */
    customizations?: CustomisationsInterface;
    /**
     * Insert as a sibling of the target container, instead of appending to a
     * child inside it.
     */
    insertAsSibling?: boolean;
    /**
     * flag to set ContextMenu Trigger to either left or right click.
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    contextMenuTrigger?: ContextMenuTriggerOptions;
    /**
     * flag to override openNew tab context menu link
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    linkOverride?: boolean;
    /**
     * flag to enable insert into slides action
     *
     * @hidden
     * @private
     */
    insertInToSlide?: boolean;
    /**
     * Use a pre-rendered iframe from a pool of pre-rendered iframes
     * if available and matches the configuration.
     *
     * @version SDK: 1.22.0
     * @hidden
     *
     * See [docs]() on how to create a prerender pool.
     */
    usePrerenderedIfAvailable?: boolean;
    /**
     * Boolean to exclude runtimeFilters in the URL
     *
     * @default false
     * @hidden
     */
    excludeRuntimeFiltersfromURL?: boolean;
}

/**
 * MessagePayload: Embed event payload: message type, data and status (start/end)
 *
 * @group Events
 */
export type MessagePayload = {
    /* type: message type eg: 'save' */
    type: string;
    /* data: message payload data eg: { answerId: '123' } */
    data: any;
    /* status: message payload status - start or end */
    status?: string;
};
/**
 * MessageOptions: By Providing options, getting specific event start / end based on
 * option
 *
 * @group Events
 */
export type MessageOptions = {
    /**
     *  A boolean value indicating that start status events of this type
     *  will be dispatched
     */
    start?: boolean;
};
/**
 * MessageCallback: Embed event message callback
 *
 * @group Events
 */
export type MessageCallback = (
    /* payload: Message payload contain type, data and status */
    payload: MessagePayload,
    /**
     *  responder: Message callback function triggered when embed event
     *  initiated
     */
    responder?: (data: any) => void,
) => void;
/**
 * MessageCallbackObj: contains message options & callback function
 */
export type MessageCallbackObj = {
    /**
     *  options: It contains start, A boolean value indicating that start
     *  status events of this type will be dispatched
     */
    /* callback: Embed event message callback */
    options: MessageOptions;
    callback: MessageCallback;
};

export type GenericCallbackFn = (...args: any[]) => any;

export type QueryParams = {
    [key: string]: string;
};

/**
 * A map of the supported runtime filter operations
 */
// eslint-disable-next-line no-shadow
export enum RuntimeFilterOp {
    /**
     * Equals
     */
    EQ = 'EQ',
    /**
     * Does not equal
     */
    NE = 'NE',
    /**
     * Less than
     */
    LT = 'LT',
    /**
     * Less than or equal to
     */
    LE = 'LE',
    /**
     * Greater than
     */
    GT = 'GT',
    /**
     * Greater than or equal to
     */
    GE = 'GE',
    /**
     * Contains
     */
    CONTAINS = 'CONTAINS',
    /**
     * Begins with
     */
    BEGINS_WITH = 'BEGINS_WITH',
    /**
     * Ends with
     */
    ENDS_WITH = 'ENDS_WITH',
    /**
     * Between, inclusive of higher value
     */
    BW_INC_MAX = 'BW_INC_MAX',
    /**
     * Between, inclusive of lower value
     */
    BW_INC_MIN = 'BW_INC_MIN',
    /**
     * Between, inclusive of both higher and lower value
     */
    BW_INC = 'BW_INC',
    /**
     * Between, non-inclusive
     */
    BW = 'BW',
    /**
     * Is included in this list of values
     */
    IN = 'IN',
}

/**
 * A filter that can be applied to ThoughtSpot answers, Liveboards, or
 * visualizations at runtime.
 */
export interface RuntimeFilter {
    /**
     * The name of the column to filter on (case-sensitive)
     */
    columnName: string;
    /**
     * The operator to apply
     */
    operator: RuntimeFilterOp;
    /**
     * The list of operands. Some operators like EQ, LE accept
     * a single operand, whereas other operators like BW and IN accept multiple
     * operands.
     */
    values: (number | boolean | string)[];
}

/**
 * Event types emitted by the embedded ThoughtSpot application.
 *
 * To add an event listener use the corresponding
 * {@link LiveboardEmbed.on} or {@link AppEmbed.on} or {@link SearchEmbed.on} method.
 *
 *  @example
 * ```js
 * import { EmbedEvent } from '@thoughtspot/visual-embed-sdk';
 * // Or
 * // const { EmbedEvent } = window.tsembed;
 *
 * // create the liveboard embed.
 *
 * liveboardEmbed.on(EmbedEvent.Drilldown, (drilldown) => {
 *   console.log('Drilldown event', drilldown);
 * }));
 * ```
 * @group Events
 */
// eslint-disable-next-line no-shadow
export enum EmbedEvent {
    /**
     * Rendering has initialized.
     *
     * @returns timestamp - The timestamp when the event was generated.
     */
    Init = 'init',
    /**
     * Authentication has either succeeded or failed.
     *
     * @returns isLoggedIn - A Boolean specifying whether authentication was successful.
     */
    AuthInit = 'authInit',
    /**
     * The embed object container has loaded.
     *
     * @returns timestamp - The timestamp when the event was generated.
     */
    Load = 'load',
    /**
     * Data pertaining to answer or Liveboard is received
     *
     * @return data - The answer or Liveboard data
     * @important
     */
    Data = 'data',
    /**
     * Search/answer/Liveboard filters have been applied/updated by the user.
     *
     * @hidden
     */
    FiltersChanged = 'filtersChanged',
    /**
     * Search query has been updated by the user.
     */
    QueryChanged = 'queryChanged',
    /**
     * A drill down operation has been performed.
     *
     * @returns additionalFilters - Any additional filters applied
     * @returns drillDownColumns - The columns on which drill down was performed
     * @returns nonFilteredColumns - The columns that were not filtered
     */
    Drilldown = 'drillDown',
    /**
     * One or more data sources have been selected.
     *
     * @returns dataSourceIds - the list of data sources
     */
    DataSourceSelected = 'dataSourceSelected',
    /**
     * One or more data columns have been selected.
     *
     * @returns columnIds - the list of columns
     * @version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1-sw
     */
    AddRemoveColumns = 'addRemoveColumns',
    /**
     * A custom action has been triggered
     *
     * @returns actionId - The id of the custom action
     * @returns data - The answer or Liveboard data
     */
    CustomAction = 'customAction',
    /**
     * Listen to double clicks on a visualization
     *
     * @return ContextMenuInputPoints - data point that is double clicked
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     */
    VizPointDoubleClick = 'vizPointDoubleClick',
    /**
     * Listen to clicks on a visualization in a liveboard or Search result.
     *
     * @example
     * ```js
     * embed.on(ThoughtSpotEmbed.Event.VizPointClick, ({data}) => {
     *   console.log(
     *    data.vizId, // viz id
     *    data.clickedPoint.selectedAttributes[0].value,
     *    data.clickedPoint.selectedAttributes[0].column.name,
     *    data.clickedPoint.selectedMeasures[0].value,
     *    data.clickedPoint.selectedMeasures[0].column.name,
     *   )
     * });
     * ```
     * @return viz, clickedPoint - metadata about point that is clicked
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     * @important
     */
    VizPointClick = 'vizPointClick',
    /**
     * An error has occurred.
     *
     * @returns error - An error object or message
     */
    Error = 'Error',
    /**
     * The embedded object has sent an alert
     *
     * @returns alert - An alert object
     */
    Alert = 'alert',
    /**
     * The ThoughtSpot auth session has expired.
     */
    AuthExpire = 'ThoughtspotAuthExpired',
    /**
     * ThoughtSpot failed to validate the auth session.
     *
     * @hidden
     */
    AuthFailure = 'ThoughtspotAuthFailure',
    /**
     * ThoughtSpot failed to validate the auth session.
     *
     * @hidden
     */
    AuthLogout = 'ThoughtspotAuthLogout',
    /**
     * The height of the embedded Liveboard or visualization has been computed.
     *
     * @returns data - The height of the embedded Liveboard or visualization
     * @hidden
     */
    EmbedHeight = 'EMBED_HEIGHT',
    /**
     * The center of visible iframe viewport is calculated.
     *
     * @returns data - The center of the visible Iframe viewport.
     * @hidden
     */
    EmbedIframeCenter = 'EmbedIframeCenter',
    /**
     * Emitted when  the "Get Data" button in Search Bar embed
     * is clicked.
     *
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.0-sw
     */
    GetDataClick = 'getDataClick',
    /**
     * Detects the route change.
     */
    RouteChange = 'ROUTE_CHANGE',
    /**
     * The v1 event type for Data
     *
     * @hidden
     */
    V1Data = 'exportVizDataToParent',
    /**
     * Emitted when the embed does not have cookie access. This
     * happens on Safari where third-party cookies are blocked by default.
     *
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 7.2.1
     */
    NoCookieAccess = 'noCookieAccess',
    /**
     * Emitted when SAML is complete
     *
     * @private
     * @hidden
     */
    SAMLComplete = 'samlComplete',
    /**
     * Emitted when any modal is opened in the app
     *
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1-sw
     */
    DialogOpen = 'dialog-open',
    /**
     * Emitted when any modal is closed in the app
     *
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1-sw
     */
    DialogClose = 'dialog-close',
    /**
     * Emitted when the Liveboard shell loads.
     * You can use this event as a hook to trigger
     * other events on the rendered Liveboard.
     *
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     */
    LiveboardRendered = 'PinboardRendered',
    /**
     * This can be used to register an event listener which
     * is triggered on all events.
     *
     * @Version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1-sw
     */
    ALL = '*',
    /**
     * Emitted when answer is saved in the app
     *
     * @Version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    Save = 'save',
    /**
     * Emitted when the download action is triggered on an answer
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    Download = 'download',
    /**
     * Emitted when the download action is triggered on an answer
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.0-sw
     */
    DownloadAsPng = 'downloadAsPng',
    /**
     * Emitted when the Download as PDF action is triggered on an answer
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * Emitted when the Download as CSV action is triggered on an answer
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    DownloadAsCsv = 'downloadAsCsv',
    /**
     * Emitted when the Download as XLSX action is triggered on an answer
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    DownloadAsXlsx = 'downloadAsXlsx',
    /**
     * Emitted when an answer is deleted in the app
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    AnswerDelete = 'answerDelete',
    /**
     * Emitted when an answer is pinned to a Liveboard
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    Pin = 'pin',
    /**
     * Emitted when SpotIQ analysis is triggered
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    SpotIQAnalyze = 'spotIQAnalyze',
    /**
     * Emitted when a user shares an object with another user or group
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    Share = 'share',
    /**
     * Emitted when a user clicks the Include action to include a specific value or data
     * on a chart or table
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    DrillInclude = 'context-menu-item-include',
    /**
     * Emitted when a user clicks the Exclude action to exclude a specific value or data
     * on a chart or table
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    DrillExclude = 'context-menu-item-exclude',
    /**
     * Emitted when copied column value on the app
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    CopyToClipboard = 'context-menu-item-copy-to-clipboard',
    /**
     * Emitted when a user clicks the Update TML action
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    UpdateTML = 'updateTSL',
    /**
     * Emitted when a user clicks the Edit TML action
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    EditTML = 'editTSL',
    /**
     * Emitted when ExportTML trigger in answer on the app
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    ExportTML = 'exportTSL',
    /**
     * Emitted when an answer is saved as a view
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    SaveAsView = 'saveAsView',
    /**
     * Emitted when copy of existing answer on the app
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    CopyAEdit = 'copyAEdit',
    /**
     * Emitted when a user clicks Show underlying data on an answe
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    ShowUnderlyingData = 'showUnderlyingData',
    /**
     * Emitted when an answer is switched to a chart or table view
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
    /**
     * Internal event to communicate the initial settings back to the TS APP
     *
     * @hidden
     */
    APP_INIT = 'appInit',
    /**
     * Emitted when a user clicks Show Liveboard details on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    LiveboardInfo = 'pinboardInfo',
    /**
     * Emitted when a user clicks on the Favorite icon on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    AddToFavorites = 'addToFavorites',
    /**
     * Emitted when a user clicks Schedule on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Schedule = 'subscription',
    /**
     * Emitted when a user clicks Edit on a Liveboard or visualization
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Edit = 'edit',
    /**
     * Emitted when a user clicks Make a copy on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    MakeACopy = 'makeACopy',
    /**
     * Emitted when a user clicks Present on a Liveboard or visualization
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Present = 'present',
    /**
     * Emitted when a user clicks Delete on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Delete = 'delete',
    /**
     * Emitted when a user clicks Manage schedules on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    SchedulesList = 'schedule-list',
    /**
     * Emitted when a user clicks Cancel in edit mode on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Cancel = 'cancel',
    /**
     * Emitted when a user clicks Explore on a visualization
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Explore = 'explore',
    /**
     * Emitted when a user clicks Copy link action on a visualization
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    CopyLink = 'embedDocument',
    /**
     * Emitted when a user interacts with cross filters on a visualization or liveboard
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    CrossFilterChanged = 'cross-filter-changed',
    /**
     * Emitted when a user right clicks on a visualization (chart or table)
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    VizPointRightClick = 'vizPointRightClick',
    /**
     * Emitted when a user clicks on Insert to slide on a visualization
     *
     * @hidden
     */
    InsertIntoSlide = 'insertInToSlide',
}

/**
 * Event types that can be triggered by the host application
 * to the embedded ThoughtSpot app
 *
 * To trigger an event use the corresponding
 * {@link LiveboardEmbed.trigger} or {@link AppEmbed.trigger} or {@link
 * SearchEmbed.trigger} method.
 *
 * @example
 * ```js
 * import { HostEvent } from '@thoughtspot/visual-embed-sdk';
 * // Or
 * // const { HostEvent } = window.tsembed;
 *
 * // create the liveboard embed.
 *
 * liveboardEmbed.trigger(HostEvent.UpdateRuntimeFilters, [
 *   { columnName: 'state, operator: RuntimeFilterOp.EQ, values: ['california']}
 * ]);
 * ```
 * @group Events
 */
// eslint-disable-next-line no-shadow
export enum HostEvent {
    /**
     * Trigger a search
     *
     * @param - dataSourceIds - The data source GUID to Search on
     *                        - Although an array, only a single source
     *                          is supported at this time.
     * @param - searchQuery - The search query
     * @param - execute - execute the existing / updated query
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.Search, {
     *   searchQuery: "[sales] by [item type],
     *   dataSources: ["cd252e5c-b552-49a8-821d-3eadaa049cca"]
     *   execute: true
     * })
     * ```
     */
    Search = 'search',
    /**
     * Trigger a drill on certain points by certain column
     *
     * @param - points - an object containing selectedPoints/clickedPoints
     *              eg. { selectedPoints: []}
     * @param - columnGuid - a string guid of the column to drill by. This is optional,
     *                     if not provided it will auto drill by the configured
     *                     column.
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.VizPointDoubleClick, (payload) => {
     *       console.log(payload);
     *       const clickedPoint = payload.data.clickedPoint;
     *       const selectedPoint = payload.data.selectedPoints;
     *       console.log('>>> called', clickedPoint);
     *       searchEmbed.trigger(HostEvent.DrillDown, {
     *             points: {
     *                  clickedPoint,
     *                  selectedPoints: selectedPoint
     *             },
     *             autoDrillDown: true,
     *       });
     * })
     * ```
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     */
    DrillDown = 'triggerDrillDown',
    /**
     * Apply filters
     *
     * @hidden
     */
    Filter = 'filter',
    /**
     * Reload the answer or visualization
     *
     * @hidden
     */
    Reload = 'reload',
    /**
     * Set the visible visualizations on a Liveboard.
     *
     * @param - an array of ids of visualizations to show, the ids not passed
     *          will be hidden.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetVisibleVizs, [
     *  '730496d6-6903-4601-937e-2c691821af3c',
     *  'd547ec54-2a37-4516-a222-2b06719af726'])
     * ```
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1-sw
     */
    SetVisibleVizs = 'SetPinboardVisibleVizs',
    /**
     * Update the runtime filters. The runtime filters passed here are extended
     * on to the existing runtime filters if they exist.
     *
     * @param - {@link RuntimeFilter}[] an array of {@link RuntimeFilter} Types.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateRuntimeFilters, [
     *   {columnName: "state",operator: RuntimeFilterOp.EQ,values: ["michigan"]},
     *   {columnName: "item type",operator: RuntimeFilterOp.EQ,values: ["Jackets"]}
     * ])
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     * @important
     */
    UpdateRuntimeFilters = 'UpdateRuntimeFilters',
    /**
     * Navigate to a specific page in App embed without any reload.
     * This is the same as calling `appEmbed.navigateToPage(path, true)`
     *
     * @param - path - the path to navigate to (can be a number[1/-1] to go forward/back)
     * @example
     * ```js
     * appEmbed.navigateToPage(-1)
     * ```
     * @version SDK: 1.12.0 | ThoughtSpot 8.4.0.cl, 8.4.1-sw
     */
    Navigate = 'Navigate',
    /**
     * Opens the filter panel for a particular column.
     * Works with Search embed.
     *
     * @param - { columnId: string,
     *  name: string,
     *  type: INT64/CHAR/DATE,
     *  dataType: ATTRIBUTE/MEASURE }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.OpenFilter,
     *  { columnId: '123', name: 'column name', type: 'INT64', dataType: 'ATTRIBUTE' })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    OpenFilter = 'openFilter',
    /**
     * Adds the columns to the current Search.
     *
     * @param - { columnIds: string[] }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.AddColumns, { columnIds: ['123', '456'] })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AddColumns = 'addColumns',
    /**
     * Removes a column from the current Search.
     *
     * @param - { columnId: string }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.RemoveColumn, { columnId: '123' })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    RemoveColumn = 'removeColumn',
    /**
     * Gets the current pinboard content.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.getExportRequestForCurrentPinboard)
     * ```
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1-sw
     */
    getExportRequestForCurrentPinboard = 'getExportRequestForCurrentPinboard',
    /**
     * Triggers the Pin action on an embedded object
     *
     * @param - incase of Liveboard embed, takes in an object with vizId as a key
     * can be left empty for search and visualization embeds
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Pin, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * vizEmbed.trigger(HostEvent.Pin)
     * searchEmbed.trigger(HostEvent.Pin)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Pin = 'pin',
    /**
     * Triggers the Show Liveboard details action on a Liveboard
     *
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.LiveboardInfo)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    LiveboardInfo = 'pinboardInfo',
    /**
     * Triggers the Schedule action on a Liveboard
     *
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.Schedule)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Schedule = 'subscription',
    /**
     * Triggers the Manage schedule action on a Liveboard
     *
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.ScheduleList)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    SchedulesList = 'schedule-list',
    /**
     * Triggers the Export TML action on a Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ExportTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    ExportTML = 'exportTSL',
    /**
     * Triggers the Edit TML action on a Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.EditTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    EditTML = 'editTSL',
    /**
     * Triggers the Update TML action on a Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    UpdateTML = 'updateTSL',
    /**
     * Triggers the Download PDF action on a Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsPdf)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * Triggers the Make a copy action on a Liveboard, search or visualization
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.MakeACopy, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * vizEmbed.trigger(HostEvent.MakeACopy)
     * searchEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    MakeACopy = 'makeACopy',
    /**
     * Triggers the Delete action on a Liveboard
     *
     * @example
     * ```js
     * appEmbed.trigger(HostEvent.Remove)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Remove = 'delete',
    /**
     * Triggers the Explore action on a visualization
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Explore, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Explore = 'explore',
    /**
     * Triggers the Create alert action on a visualization
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.CreateMonitor {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    CreateMonitor = 'createMonitor',
    /**
     * Triggers the Manage alert action on a visualization
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ManageMonitor, {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    ManageMonitor = 'manageMonitor',
    /**
     * Triggers the Edit action on a Liveboard or visualization
     *
     * @param - object - to trigger the action for a specfic visualization
     *   in Liveboard embed, pass in vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit)
     *
     * liveboardEmbed.trigger(HostEvent.Edit, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger((HostEvent.Edit)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Edit = 'edit',
    /**
     * Triggers the Copy link action on a Liveboard or visualization
     *
     * @param - object - to trigger the action for a s
     *  pecfic visualization in Liveboard embed, pass in vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.CopyLink)
     * liveboardEmbed.trigger(HostEvent.CopyLink, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * vizEmbed.trigger((HostEvent.CopyLink)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    CopyLink = 'embedDocument',
    /**
     * Triggers the Present action on a Liveboard or visualization
     *
     * @param - object - to trigger the action for a specfic visualization
     *  in Liveboard embed, pass in vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Present)
     * liveboardEmbed.trigger(HostEvent.Present, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * vizEmbed.trigger((HostEvent.Present)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1-sw
     */
    Present = 'present',
    /**
     * Get TML for the current search.
     *
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.GetTML).then((tml) => {
     *   console.log(
     *      tml.search_query // TML representation of the search query
     *   );
     * })
     * ```
     * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1-sw
     * @important
     */
    GetTML = 'getTML',
    /**
     * Triggers the ShowUnderlyingData action on visualization or search
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ShowUnderlyingData, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.ShowUnderlyingData)
     *
     * searchEmbed.trigger(HostEvent.ShowUnderlyingData)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    ShowUnderlyingData = 'showUnderlyingData',
    /**
     * Triggers the Delete action on visualization or search
     *
     * @param - incase of Liveboard embed, takes in an object with vizId as a key
     * can be left empty for search and visualization embeds
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Delete, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.Delete)
     *
     * searchEmbed.trigger(HostEvent.Delete)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    Delete = 'onDeleteAnswer',
    /**
     * Triggers the SpotIQAnalyze action on visualization or search
     *
     * @param - incase of Liveboard embed, takes in an object with vizId as a key
     * can be left empty for search and visualization embeds
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SpotIQAnalyze, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.SpotIQAnalyze)
     *
     * searchEmbed.trigger(HostEvent.SpotIQAnalyze)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    SpotIQAnalyze = 'spotIQAnalyze',
    /**
     * Triggers the Download action on visualization or search when Displaymode is Chart
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Download, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.Download)
     *
     * searchEmbed.trigger(HostEvent.Download)
     * ```
     * @deprecated from SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl ,9.4.1-sw ,Use {@link DownloadAsPng}
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    Download = 'downloadAsPng',
    /**
     * Triggers the Download action on visualization or search when Displaymode is Chart
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsPng,
     * {vizId:'730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.DownloadAsPng)
     *
     * searchEmbed.trigger(HostEvent.DownloadAsPng)
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.1-sw
     */
    DownloadAsPng = 'downloadAsPng',
    /**
     * Triggers the downloadAsCSV action on visualization or search
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsCsv, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.DownloadAsCsv)
     *
     * searchEmbed.trigger(HostEvent.DownloadAsCsv)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    DownloadAsCsv = 'downloadAsCSV',
    /**
     * Triggers the downloadAsXLSX action on visualization or search
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsXlsx, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.DownloadAsXlsx)
     *
     * searchEmbed.trigger(HostEvent.DownloadAsXlsx)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    DownloadAsXlsx = 'downloadAsXLSX',
    /**
     * Triggers the Share action on a liveboard or answer
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Share)
     *
     * searchEmbed.trigger(HostEvent.Share)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    Share = 'share',
    /**
     * Trigger the Save action on a liveboard or answer
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Save)
     *
     * searchEmbed.trigger(HostEvent.Save)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    Save = 'save',
    /**
     * Triggers the SyncToSheets action on visualization
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SyncToSheets, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.SyncToSheets)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    SyncToSheets = 'sync-to-sheets',
    /**
     * Triggers the SyncToOtherApps action on visualization
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SyncToOtherApps, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.SyncToOtherApps)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    SyncToOtherApps = 'sync-to-other-apps',
    /**
     * Triggers the ManagePipelines action on visualization
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ManagePipelines, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.ManagePipelines)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1-sw
     */
    ManagePipelines = 'manage-pipeline',
    /**
     * Triggers the Reset search in answer
     *
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.ResetSearch)
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.0.1-sw
     */
    ResetSearch = 'resetSearch',
}

/**
 * The different visual modes that the data sources panel within
 * search could appear in, i.e., hidden, collapsed, or expanded.
 */
// eslint-disable-next-line no-shadow
export enum DataSourceVisualMode {
    /**
     * Data source panel is hidden.
     */
    Hidden = 'hide',
    /**
     * Data source panel is collapsed, but the user can manually expand it.
     */
    Collapsed = 'collapse',
    /**
     * Data source panel is expanded, but the user can manually collapse it.
     */
    Expanded = 'expand',
}

/**
 * The query params passed down to the embedded ThoughtSpot app
 * containing configuration and/or visual information.
 */
// eslint-disable-next-line no-shadow
export enum Param {
    EmbedApp = 'embedApp',
    DataSources = 'dataSources',
    DataSourceMode = 'dataSourceMode',
    DisableActions = 'disableAction',
    DisableActionReason = 'disableHint',
    ForceTable = 'forceTable',
    preventLiveboardFilterRemoval = 'preventPinboardFilterRemoval', // update-TSCB
    SearchQuery = 'searchQuery',
    HideActions = 'hideAction',
    HideObjects = 'hideObjects',
    HostAppUrl = 'hostAppUrl',
    EnableVizTransformations = 'enableVizTransform',
    EnableSearchAssist = 'enableSearchAssist',
    HideResult = 'hideResult',
    UseLastSelectedDataSource = 'useLastSelectedSources',
    Tag = 'tag',
    searchTokenString = 'searchTokenString',
    executeSearch = 'executeSearch',
    fullHeight = 'isFullHeightPinboard',
    livedBoardEmbed = 'isLiveboardEmbed',
    searchEmbed = 'isSearchEmbed',
    vizEmbed = 'isVizEmbed',
    Version = 'sdkVersion',
    ViewPortHeight = 'viewPortHeight',
    ViewPortWidth = 'viewPortWidth',
    VisibleActions = 'visibleAction',
    CustomCSSUrl = 'customCssUrl',
    DisableLoginRedirect = 'disableLoginRedirect',
    visibleVizs = 'pinboardVisibleVizs',
    LiveboardV2Enabled = 'isPinboardV2Enabled',
    ShowAlerts = 'showAlerts',
    Locale = 'locale',
    CustomStyle = 'customStyle',
    ForceSAMLAutoRedirect = 'forceSAMLAutoRedirect',
    // eslint-disable-next-line @typescript-eslint/no-shadow
    AuthType = 'authType',
    IconSpriteUrl = 'iconSprite',
    cookieless = 'cookieless',
    ContextMenuTrigger = 'isContextMenuEnabledOnLeftClick',
    LinkOverride = 'linkOverride',
    blockNonEmbedFullAppAccess = 'blockNonEmbedFullAppAccess',
    ShowInsertToSlide = 'insertInToSlide',
    PrimaryNavHidden = 'primaryNavHidden',
    HideProfleAndHelp = 'profileAndHelpInNavBarHidden',
    HideApplicationSwitcher= 'applicationSwitcherHidden',
    HideOrgSwitcher= 'orgSwitcherHidden',
    IsSageEmbed = 'isSageEmbed',
    HideWorksheetSelector = 'hideWorksheetSelector',
    DisableWorksheetChange = 'disableWorksheetChange',
    HideEurekaResults = 'hideEurekaResults',
    HideEurekaSuggestions = 'hideEurekaSuggestions',
}

/**
 * The list of actions that can be performed on visual ThoughtSpot
 * entities, such as answers and Liveboards.
 *
 * This enum is used to specify the actions that could be disabled,
 * hidden or made visible.
 *
 * @example
 * ```js
 * const embed = new LiveboardEmbed('#embed-container', {
 *    ... // other options
 *    visibleActions: [Action.Save, Action.Explore],
 *    disableActions: [Action.Save],
 *    hiddenActions: [Action.Download], // Set either this or visibleActions
 * })
 * ```
 */
// eslint-disable-next-line no-shadow
export enum Action {
    Save = 'save',
    /**
     * @hidden
     */
    Update = 'update',
    /**
     * @hidden
     */
    SaveUntitled = 'saveUntitled',
    SaveAsView = 'saveAsView',
    MakeACopy = 'makeACopy',
    EditACopy = 'editACopy',
    CopyLink = 'embedDocument',
    /**
     * @hidden
     */
    ResetLayout = 'resetLayout',
    Schedule = 'subscription',
    SchedulesList = 'schedule-list',
    Share = 'share',
    AddFilter = 'addFilter',
    ConfigureFilter = 'configureFilter',
    CollapseDataSources = 'collapseDataSources',
    ChooseDataSources = 'chooseDataSources',
    AddFormula = 'addFormula',
    AddParameter = 'addParameter',
    /**
     * @hidden
     */
    SearchOnTop = 'searchOnTop',
    SpotIQAnalyze = 'spotIQAnalyze',
    /**
     * @hidden
     */
    ExplainInsight = 'explainInsight',
    /**
     * @hidden
     */
    SpotIQFollow = 'spotIQFollow',
    ShareViz = 'shareViz',
    /**
     * @hidden
     */
    ReplaySearch = 'replaySearch',
    ShowUnderlyingData = 'showUnderlyingData',
    Download = 'download',
    DownloadAsPng = 'downloadAsPng',
    DownloadAsPdf = 'downloadAsPdf',
    DownloadAsCsv = 'downloadAsCSV',
    DownloadAsXlsx = 'downloadAsXLSX',
    /**
     * @hidden
     */
    DownloadTrace = 'downloadTrace',
    ExportTML = 'exportTSL',
    ImportTML = 'importTSL',
    UpdateTML = 'updateTSL',
    EditTML = 'editTSL',
    Present = 'present',
    ToggleSize = 'toggleSize',
    Edit = 'edit',
    EditTitle = 'editTitle',
    Remove = 'delete',
    /**
     * @hidden
     */
    Ungroup = 'ungroup',
    /**
     * @hidden
     */
    Describe = 'describe',
    /**
     * @hidden
     */
    Relate = 'relate',
    /**
     * @hidden
     */
    CustomizeHeadlines = 'customizeHeadlines',
    /**
     * @hidden
     */
    PinboardInfo = 'pinboardInfo',
    LiveboardInfo = 'pinboardInfo',
    /**
     * @hidden
     */
    SendAnswerFeedback = 'sendFeedback',
    /**
     * @hidden
     */
    DownloadEmbraceQueries = 'downloadEmbraceQueries',
    /**
     * Pin action.
     */
    Pin = 'pin',
    /**
     * @hidden
     */
    AnalysisInfo = 'analysisInfo',
    Subscription = 'subscription',
    /**
     * Explore action.
     */
    Explore = 'explore',
    DrillInclude = 'context-menu-item-include',
    DrillExclude = 'context-menu-item-exclude',
    CopyToClipboard = 'context-menu-item-copy-to-clipboard',
    CopyAndEdit = 'context-menu-item-copy-and-edit',
    /**
     * @hidden
     */
    DrillEdit = 'context-menu-item-edit',
    EditMeasure = 'context-menu-item-edit-measure',
    Separator = 'context-menu-item-separator',
    DrillDown = 'DRILL',
    RequestAccess = 'requestAccess',
    QueryDetailsButtons = 'queryDetailsButtons',
    /**
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     */
    AnswerDelete = 'onDeleteAnswer',
    /**
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
    /**
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     */
    AddToFavorites = 'addToFavorites',
    /**
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1-sw
     */
    EditDetails = 'editDetails',
    /**
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    CreateMonitor = 'createMonitor',
    /**
     * @version SDK: 1.11.1 | ThoughtSpot: 8.3.0.cl, 8.4.1-sw
     */
    ReportError = 'reportError',
    SyncToSheets = 'sync-to-sheets',
    SyncToOtherApps = 'sync-to-other-apps',
    ManagePipelines = 'manage-pipeline',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    CrossFilter = 'context-menu-item-cross-filter',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    RemoveCrossFilter = 'context-menu-item-remove-cross-filter',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuAggregate = 'axisMenuAggregate',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuTimeBucket = 'axisMenuTimeBucket',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuFilter = 'axisMenuFilter',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuConditionalFormat = 'axisMenuConditionalFormat',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuSort = 'axisMenuSort',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuGroup = 'axisMenuGroup',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuPosition = 'axisMenuPosition',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuRename = 'axisMenuRename',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuEdit = 'axisMenuEdit',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuNumberFormat = 'axisMenuNumberFormat',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuTextWrapping = 'axisMenuTextWrapping',
    /**
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuRemove = 'axisMenuRemove',
    /**
     * @hidden
     */
    InsertInToSlide = 'insertInToSlide',

    /**
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    RenameModalTitleDescription = 'renameModalTitleDescription',
}

export interface SessionInterface {
    sessionId: string;
    genNo: number;
    acSession: { sessionId: string; genNo: number };
}

// eslint-disable-next-line no-shadow
export enum OperationType {
    GetChartWithData = 'GetChartWithData',
    GetTableWithHeadlineData = 'GetTableWithHeadlineData',
}

export interface AnswerServiceType {
    getAnswer?: (offset: number, batchSize: number) => any;
}

export enum PrefetchFeatures {
    FullApp = 'FullApp',
    SearchEmbed = 'SearchEmbed',
    LiveboardEmbed = 'LiveboardEmbed',
    VizEmbed = 'VizEmbed',
}

/**
 * Enum for options to change context trigger
 */
export enum ContextMenuTriggerOptions {
    LEFT_CLICK = 'left-click',
    RIGHT_CLICK = 'right-click',
}
