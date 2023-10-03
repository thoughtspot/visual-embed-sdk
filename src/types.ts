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
     * @version SDK: 1.22.0| ThouhgtSpot: 9.3.0.cl, 9.5.1.sw
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

export enum HomeLeftNavItem {
    QueryBuilder = 'query-builder',
    Home = 'insights-home',
    Liveboards = 'liveboards',
    Answers = 'answers',
    MonitorSubscription = 'monitor-alerts',
    SpotIQAnalysis = 'spotiq-analysis',
    Tutorials = 'tutorials',
    Documentation = 'documentation',
    Community = 'community',
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
        /**
         * @version SDK: 1.26.0 | 9.7.0.cl
         */
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
     * @version SDK: 1.10.2 | 8.2.0.cl, 8.4.1.sw
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
     * @version SDK: 1.9.3 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     * @default false
     */
    disableLoginRedirect?: boolean;

    /**
     * This message is displayed on the embed view when the login fails.
     *
     * @version SDK: 1.10.1 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
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
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
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
     * @version SDK: 1.10.4 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     */
    detectCookieAccessSlow?: boolean;
    /**
     * Hide beta alert warning message for SearchEmbed.
     *
     * @version SDK: 1.12.0 | ThoughtSpot: 8.4.0.cl, 8.4.1.sw*
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
     * @version SDK: 1.22.0 | ThoughtSpot: 9.3.0.cl, 9.5.1.sw
     */
    blockNonEmbedFullAppAccess?: boolean;

    /**
     * Host config incase embedded app is inside TS app itself
     *
     * @hidden
     */
    hostConfig?: {
        hostUserGuid: string;
        hostClusterId: string;
        hostClusterName: string;
    };

    /**
     * Pendo API key to enable Pendo tracking to your own subscription, the key
     * is added as an additional key to the embed, as per this [doc](https://support.pendo.io/hc/en-us/articles/360032201951-Send-data-to-multiple-subscriptions).
     *
     * @version SDK: 1.27.0 | ThoughtSpot: 9.8.0.cl
     */
    pendoTrackingKey?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LayoutConfig {}

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
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @important
     */
    visibleActions?: Action[];
    /**
     * Show alert messages and toast messages in the embedded view.
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    showAlerts?: boolean;
    /**
     * The list of runtime filters to apply to a search answer,
     * visualization, or Liveboard.
     */
    runtimeFilters?: RuntimeFilter[];
    /**
     * The list of parameter override to apply to a search answer,
     * visualization, or Liveboard.
     */
    runtimeParameters?: RuntimeParameter[];
    /**
     * The locale/language to use for the embedded view.
     *
     * @version SDK: 1.9.4 | ThoughtSpot 8.1.0.cl, 8.4.1.sw
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
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    additionalFlags?: { [key: string]: string | number | boolean };
    /**
     * Dynamic CSSUrl and customCSS to be injected in the loaded application.
     * You would also need to set `style-src` in the CSP settings.
     *
     * @version SDK: 1.17.2 | ThoughtSpot: 8.4.1.sw, 8.4.0.cl
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
    /**
     * Boolean to hide liveboard header
     *
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     */
    hideLiveboardHeader?: boolean;
    /**
     * Boolean to show liveboard title
     *
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     */
    showLiveboardTitle?: boolean;
    /**
     * Boolean to show liveboard description
     *
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     */
    showLiveboardDescription?: boolean;
    /**
     * The list of tab IDs to hide from the embedded.
     * This Tabs will be hidden from their respective LBs.
     * Use this to hide an tabID.
     *
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   hiddenTabs: [
     * '430496d6-6903-4601-937e-2c691821af3c',
     *  'f547ec54-2a37-4516-a222-2b06719af726']
     * });
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    hiddenTabs?: string[];
    /**
     * Hide the home page modules
     * eg: hiddenHomepageModules = [HomepageModule.MyLibrary]
     *
     * @version SDK: 1.27.0 | Thoughtspot: 9.8.0.cl
     */
    hiddenHomepageModules?: HomepageModule[];
    /**
     * reordering the home page modules
     * eg: reorderedHomepageModules = [HomepageModule.MyLibrary, HomepageModule.Watchlist]
     * @version SDK: 1.28.0 | Thoughtspot: 9.9.0.cl
     */
    reorderedHomepageModules?: HomepageModule[];
    /**
     * The list of tab IDs to show in the embedded.
     * Only this Tabs will be shown in their respective LBs.
     * Use this to show an tabID.
     *
     * Use either this or hiddenTabs.
     *
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   visibleTabs: [
     * '430496d6-6903-4601-937e-2c691821af3c',
     *  'f547ec54-2a37-4516-a222-2b06719af726']
     * });
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    visibleTabs?: string[];
    /**
     * homepageLeftNavItems : show/hide Homeapage Left Nav Bar Items
     * There are 8 home nav list items, we will send those item as list
     * which we want to hide for TSE.
     * eg: hiddenHomeLeftNavItems = [HomeLeftNavItem.Home] to hide home.
     *
     * @version SDK: 1.27.0 | Thoughtspot: 9.8.0.cl
     */
    hiddenHomeLeftNavItems?: HomeLeftNavItem[];
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
 * Home page module that can be hide
 */
// eslint-disable-next-line no-shadow
export enum HomepageModule {
    /**
     * Search bar
     */
    Search = 'SEARCH',
    /**
     * kPI watchlist module
     */
    Watchlist = 'WATCHLIST',
    /**
     * favorite objects
     */
    Favorite = 'FAVORITE',
    /**
     * List of answers and liveboards
     */
    MyLibrary = 'MY_LIBRARY',
    /**
     * Trending list
     */
    Trending = 'TRENDING',
    /**
     * Learning videos
     */
    Learning = 'LEARNING',
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
 * A filter that can be applied to ThoughtSpot answers, Liveboards, or
 * visualizations at runtime.
 */
export interface RuntimeParameter {
    /**
     * The name of the runtime parameter to filter on (case-sensitive)
     */
    name: string;
    /**
     * Values
     */
    value: number | boolean | string;
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
     * @version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
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
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.0.sw
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
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     */
    DialogOpen = 'dialog-open',
    /**
     * Emitted when any modal is closed in the app
     *
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     */
    DialogClose = 'dialog-close',
    /**
     * Emitted when the Liveboard shell loads.
     * You can use this event as a hook to trigger
     * other events on the rendered Liveboard.
     *
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    LiveboardRendered = 'PinboardRendered',
    /**
     * This can be used to register an event listener which
     * is triggered on all events.
     *
     * @Version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     */
    ALL = '*',
    /**
     * Emitted when an Answer is saved in the app
     *
     * @Version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    Save = 'save',
    /**
     * Emitted when the download action is triggered on an answer
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    Download = 'download',
    /**
     * Emitted when the download action is triggered on an answer
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.0.sw
     */
    DownloadAsPng = 'downloadAsPng',
    /**
     * Emitted when the Download as PDF action is triggered on an answer
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * Emitted when the Download as CSV action is triggered on an answer
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    DownloadAsCsv = 'downloadAsCsv',
    /**
     * Emitted when the Download as XLSX action is triggered on an answer
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    DownloadAsXlsx = 'downloadAsXlsx',
    /**
     * Emitted when an answer is deleted in the app
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    AnswerDelete = 'answerDelete',
    /**
     * Emitted when an answer is pinned to a Liveboard
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    Pin = 'pin',
    /**
     * Emitted when SpotIQ analysis is triggered
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    SpotIQAnalyze = 'spotIQAnalyze',
    /**
     * Emitted when a user shares an object with another user or group
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    Share = 'share',
    /**
     * Emitted when a user clicks the Include action to include a specific value or data
     * on a chart or table
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    DrillInclude = 'context-menu-item-include',
    /**
     * Emitted when a user clicks the Exclude action to exclude a specific value or data
     * on a chart or table
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    DrillExclude = 'context-menu-item-exclude',
    /**
     * Emitted when copied column value on the app
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    CopyToClipboard = 'context-menu-item-copy-to-clipboard',
    /**
     * Emitted when a user clicks the Update TML action
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    UpdateTML = 'updateTSL',
    /**
     * Emitted when a user clicks the Edit TML action
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    EditTML = 'editTSL',
    /**
     * Emitted when ExportTML trigger in answer on the app
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    ExportTML = 'exportTSL',
    /**
     * Emitted when an answer is saved as a view
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    SaveAsView = 'saveAsView',
    /**
     * Emitted when copy of existing answer on the app
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    CopyAEdit = 'copyAEdit',
    /**
     * Emitted when a user clicks Show underlying data on an answe
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    ShowUnderlyingData = 'showUnderlyingData',
    /**
     * Emitted when an answer is switched to a chart or table view
     *
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
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
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    LiveboardInfo = 'pinboardInfo',
    /**
     * Emitted when a user clicks on the Favorite icon on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    AddToFavorites = 'addToFavorites',
    /**
     * Emitted when a user clicks Schedule on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Schedule = 'subscription',
    /**
     * Emitted when a user clicks Edit on a Liveboard or visualization
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Edit = 'edit',
    /**
     * Emitted when a user clicks Make a copy on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    MakeACopy = 'makeACopy',
    /**
     * Emitted when a user clicks Present on a Liveboard or visualization
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Present = 'present',
    /**
     * Emitted when a user clicks Delete on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Delete = 'delete',
    /**
     * Emitted when a user clicks Manage schedules on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    SchedulesList = 'schedule-list',
    /**
     * Emitted when a user clicks Cancel in edit mode on a Liveboard
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Cancel = 'cancel',
    /**
     * Emitted when a user clicks Explore on a visualization
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Explore = 'explore',
    /**
     * Emitted when a user clicks Copy link action on a visualization
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
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
    /**
     * @hidden
     * Emitted when a user changes any filter on a Liveboard.
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    FilterChanged = 'filterChanged',
    /**
     *  Emitted when a user click on Go button in Sage Embed
     *
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    SageEmbedQuery = 'sageEmbedQuery',
    /**
     * Emitten when a user select data source in Sage Embed
     *
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    SageWorksheetUpdated = 'sageWorksheetUpdated',
    /**
     * Emitten when a user updates a connection in Data tab
     *
     * @version SDK : 1.27.0 | Thoughtspot: 9.8.0.cl
     */
    UpdateConnection = 'updateConnection',
    /**
     * Emitted when name, status (private or public) or filter values of a
     * PersonalisedView is updated.
     *
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    UpdatePersonalisedView = 'updatePersonalisedView',
    /**
     * Emitted when a PersonalisedView is saved.
     *
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    SavePersonalisedView = 'savePersonalisedView',
    /**
     * Emitted when a Liveboard is reset.
     *
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    ResetLiveboard = 'resetLiveboard',
    /**
     * Emitted when a PersonalisedView is deleted.
     *
     * @returns views: string[]
     * @returns liveboardId: string
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    DeletePersonalisedView = 'deletePersonalisedView',
    /**
     * Emitten when a user creates a new worksheet
     *
     * @version SDK : 1.27.0 | Thoughtspot: 9.8.0.cl
     */
    CreateWorksheet = 'createWorksheet',
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
     * Triggers a search query in AppEmbed and SearchEmbed
     * deployments.
     * Includes the following properties:
     *
     * @param - dataSourceIds - The data source GUID to Search on
     *                        - Although an array, only a single source
     *                          is supported.
     * @param - searchQuery - Query string with search tokens
     * @param - execute - executes the existing / updated query
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
     * Triggers a drill on certain points of the specified column
     * Includes the following properties:
     *
     * @param - points - an object containing selectedPoints/clickedPoints
     * to drill to. For example, { selectedPoints: []}
     * @param - columnGuid - Optional. GUID of the column to drill
     * by. If not provided it will auto drill by the configured
     *   column.
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
     * Sets the visible visualizations on a Liveboard.
     *
     * @param - An array of GUIDs of the visualization to show. The visualization IDs not passed
     *  in this parameter will be hidden.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetVisibleVizs, [
     *  '730496d6-6903-4601-937e-2c691821af3c',
     *  'd547ec54-2a37-4516-a222-2b06719af726'])
     * ```
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     */
    SetVisibleVizs = 'SetPinboardVisibleVizs',
    /**
     * Set the Active Tab of a Liveboard.
     *
     * @param - tabId - string of id of Tab to show
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetActiveTab,{
     *  tabId:'730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @version SDK: 1.24.0 | ThoughtSpot: 9.5.0.cl, 9.5.1-sw
     */
    SetActiveTab = 'SetActiveTab',
    /**
     * Updates runtime filters applied on a Saved Answer or Liveboard. The
     * runtime filters passed here are appended to the existing runtime
     * filters.
     * Pass an array of runtime filters with the following attributes:
     * `columnName`
     * _String_. The name of the column to filter on.
     * `operator`
     *  Runtime filter operator to apply. For information,
     *  see [Runtime filter operators](https://developers.thoughtspot.com/docs/?pageid=runtime-filters#rtOperator).
     * `values`
     *  List of operands. Some operators such as EQ, LE allow a single value, whereas
     *  operators such as BW and IN accept multiple operands.
     *
     * @param - {@link RuntimeFilter}[] an array of {@link RuntimeFilter} Types.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateRuntimeFilters, [
     *   {columnName: "state",operator: RuntimeFilterOp.EQ,values: ["michigan"]},
     *   {columnName: "item type",operator: RuntimeFilterOp.EQ,values: ["Jackets"]}
     * ])
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     * @important
     */
    UpdateRuntimeFilters = 'UpdateRuntimeFilters',
    /**
     * Navigate to a specific page in the embedded application without reloading the page.
     * This is the same as calling `appEmbed.navigateToPage(path, true)`
     *
     * @param - path - the path to navigate to (can be a number[1/-1] to go forward/back)
     * @example
     * ```js
     * appEmbed.navigateToPage(-1)
     * ```
     * @version SDK: 1.12.0 | ThoughtSpot 8.4.0.cl, 8.4.1.sw
     */
    Navigate = 'Navigate',
    /**
     * Opens the filter panel for a particular column.
     * Works with Search and Liveboard embed.
     *
     * @param - { columnId: string,
     *  name: string,
     *  type: INT64/CHAR/DATE,
     *  dataType: ATTRIBUTE/MEASURE }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.OpenFilter,
     * { columnId: '<column-GUID>', name: 'column name', type: 'INT64', dataType: 'ATTRIBUTE'})
     * LiveboardEmbed.trigger(HostEvent.OpenFilter,
     *  { columnId: '<column-GUID>'})
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    OpenFilter = 'openFilter',
    /**
     * Adds columns to the current search query.
     *
     * @param - { columnIds: string[] }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.AddColumns, { columnIds: ['<column-GUID>','<column-GUID>'] })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AddColumns = 'addColumns',
    /**
     * Removes a column from the current search query.
     *
     * @param - { columnId: string }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.RemoveColumn, { columnId: '<column-Guid>' })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    RemoveColumn = 'removeColumn',
    /**
     * Gets the current Liveboard content.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.getExportRequestForCurrentPinboard)
     * ```
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1.sw
     */
    getExportRequestForCurrentPinboard = 'getExportRequestForCurrentPinboard',
    /**
     * Triggers the **Pin** action on an embedded object
     *
     * @param - Liveboard embed takes the `vizId` as a
     * key. Can be left undefined when embedding Search, full app or
     * a visualization.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Pin, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.Pin)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Pin)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Pin = 'pin',
    /**
     * Triggers the **Show Liveboard details** action on a Liveboard
     *
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.LiveboardInfo)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    LiveboardInfo = 'pinboardInfo',
    /**
     * Triggers the **Schedule** action on a Liveboard
     *
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.Schedule)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Schedule = 'subscription',
    /**
     * Triggers the **Manage schedule** action on a Liveboard
     *
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.ScheduleList)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    SchedulesList = 'schedule-list',
    /**
     * Triggers the **Export TML** action on a Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ExportTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    ExportTML = 'exportTSL',
    /**
     * Triggers the **Edit TML** action on a Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.EditTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    EditTML = 'editTSL',
    /**
     * Triggers the **Update TML** action on a Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    UpdateTML = 'updateTSL',
    /**
     * Triggers the **Download PDF** action on a Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsPdf)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * Triggers the **Make a copy** action on a Liveboard, Search, or
     * visualization page
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.MakeACopy, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    MakeACopy = 'makeACopy',
    /**
     * Triggers the **Delete** action on a Liveboard
     *
     * @example
     * ```js
     * appEmbed.trigger(HostEvent.Remove)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Remove = 'delete',
    /**
     * Triggers the **Explore* action on a visualization
     *
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Explore, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Explore = 'explore',
    /**
     * Triggers the **Create alert** action on a visualization
     *
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.CreateMonitor {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    CreateMonitor = 'createMonitor',
    /**
     * Triggers the **Manage alerts** action on a visualization
     *
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ManageMonitor, {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    ManageMonitor = 'manageMonitor',
    /**
     * Triggers the **Edit** action on a Liveboard or visualization
     *
     * @param - object - To trigger the action for a specific visualization
     * in Liveboard embed, pass in `vizId` as a key.
     * Can be left undefined when embedding Search, full app, or
     * a visualization.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger((HostEvent.Edit)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Edit = 'edit',
    /**
     * Triggers the **Copy link** action on a Liveboard or visualization
     *
     * @param - object - to trigger the action for a
     * specific visualization in Liveboard embed, pass in `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.CopyLink)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.CopyLink, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger((HostEvent.CopyLink)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    CopyLink = 'embedDocument',
    /**
     * Triggers the **Present** action on a Liveboard or visualization
     *
     * @param - object - to trigger the action for a specific visualization
     *  in Liveboard embed, pass in `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Present)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.Present, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger((HostEvent.Present)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Present = 'present',
    /**
     * Gets TML for the current search.
     *
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.GetTML).then((tml) => {
     *   console.log(
     *      tml.search_query // TML representation of the search query
     *   );
     * })
     * ```
     * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     * @important
     */
    GetTML = 'getTML',
    /**
     * Triggers the **Show underlying data** action on visualization or search
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ShowUnderlyingData, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.ShowUnderlyingData)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.ShowUnderlyingData)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    ShowUnderlyingData = 'showUnderlyingData',
    /**
     * Triggers the **Delete** action on visualization or search
     *
     * @param - Liveboard embed takes an object with `vizId` as a key.
     * Can be left empty if embedding Search or visualization.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Delete, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.Delete)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Delete)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    Delete = 'onDeleteAnswer',
    /**
     * Triggers the **SpotIQ analyze** action on visualization
     * or search.
     *
     * @param - Liveboard embed takes `vizId` as a
     * key. Can be left undefined when embedding Search or
     * visualization.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SpotIQAnalyze, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.SpotIQAnalyze)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.SpotIQAnalyze)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    SpotIQAnalyze = 'spotIQAnalyze',
    /**
     * Triggers the **Download** action on charts in
     * the embedded view.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Download, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.Download)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Download)
     * ```
     * @deprecated from SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl ,9.4.1.sw ,Use {@link DownloadAsPng}
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    Download = 'downloadAsPng',
    /**
     * Triggers the **Download** > **PNG** action on
     * charts in the embedded view.
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.1.sw
     */
    DownloadAsPng = 'downloadAsPng',
    /**
     * Triggers the **Download** > **CSV**  action on tables in
     * the embedded view.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsCsv, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.DownloadAsCsv)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.DownloadAsCsv)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    DownloadAsCsv = 'downloadAsCSV',
    /**
     * Triggers the **Download** > **XLSX**  action on tables
     * in the embedded view.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsXlsx, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.DownloadAsXlsx)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.DownloadAsXlsx)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    DownloadAsXlsx = 'downloadAsXLSX',
    /**
     * Triggers the **Share** action on an embedded
     * Liveboard or Answer.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Share)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Share)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    Share = 'share',
    /**
     * Triggers the **Save**  action on a Liveboard or Answer.
     * Saves the changes.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Save)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Save)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    Save = 'save',
    /**
     * Triggers the **Sync to Sheets** action on an embedded visualization or Answer
     * Sends data from an Answer or Liveboard visualization to a Google sheet.
     *
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SyncToSheets, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.SyncToSheets)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    SyncToSheets = 'sync-to-sheets',
    /**
     * Triggers the **Sync to Other Apps** action on an embedded visualization or Answer
     * Sends data from an Answer or Liveboard visualization to third-party apps such
     * as Slack, Salesforce, Microsoft Teams, ServiceNow and so on.
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SyncToOtherApps, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.SyncToOtherApps)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    SyncToOtherApps = 'sync-to-other-apps',
    /**
     * Triggers the **Manage pipelines** action on an embedded
     * visualization or Answer.
     * Allows users to manage ThoughtSpot Sync pipelines.
     *
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ManagePipelines, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.ManagePipelines)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    ManagePipelines = 'manage-pipeline',
    /**
     * Triggers the Reset search on the Search page
     *
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.ResetSearch)
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.0.1.sw
     */
    ResetSearch = 'resetSearch',
    /**
     * @hidden
     * Gets the currents visible and runtime filters applied on a Liveboard
     * @example
     * liveboardEmbed.trigger(HostEvent.GetFilters)
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    GetFilters = 'getFilters',
    /**
     * @hidden
     * Updates the visible filters on the Liveboard.
     * @param - filter: filter object containing column name and filter operation and values
     * @example
     *
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *  filter: { column: 'column name', oper: 'in', values: [1,2,3], is_mandatory: false }
     * })
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    UpdateFilters = 'updateFilters',
    /**
     * Get Tab for the current Liveboard.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.GetTabs).then((tabDetails) => {
     *   console.log(
     *      tabDetails // TabDetails of current LB
     *   );
     * })
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl
     */
    GetTabs = 'getTabs',
    /**
     * Set the visible Tabs on a Liveboard.
     *
     * @param - an array of ids of Tabs to show, the ids not passed
     *          will be hidden.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetVisibleTabs, [
     *  '430496d6-6903-4601-937e-2c691821af3c',
     *  'f547ec54-2a37-4516-a222-2b06719af726'])
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    SetVisibleTabs = 'SetPinboardVisibleTabs',
    /**
     * Set the hidden tabs on a Liveboard.
     *
     * @param - an array of ids of Tabs to hide, the ids not passed
     *          will be shown.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetHiddenTabs, [
     *  '630496d6-6903-4601-937e-2c691821af3c',
     *  'i547ec54-2a37-4516-a222-2b06719af726'])
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    SetHiddenTabs = 'SetPinboardHiddenTabs',
    /**
     * Updates the search query for sage embed.
     *
     * @param - searchOptions: an object queryString and option to execute the query.
     * @example
     * ```js
     * sageEmbed.trigger(HostEvent.UpdateSageQuery, {
     *  queryString: 'revenue per year',
     *  executeSearch: true,
     * })
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    UpdateSageQuery = 'updateSageQuery',
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
    DataPanelV2Enabled = 'enableDataPanelV2',
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
    HideApplicationSwitcher = 'applicationSwitcherHidden',
    HideOrgSwitcher = 'orgSwitcherHidden',
    IsSageEmbed = 'isSageEmbed',
    HideWorksheetSelector = 'hideWorksheetSelector',
    DisableWorksheetChange = 'disableWorksheetChange',
    HideEurekaResults = 'hideEurekaResults',
    HideEurekaSuggestions = 'hideEurekaSuggestions',
    HideLiveboardHeader = 'hideLiveboardHeader',
    ShowLiveboardDescription = 'showLiveboardDescription',
    ShowLiveboardTitle = 'showLiveboardTitle',
    HiddenTabs = 'hideTabs',
    VisibleTabs = 'visibleTabs',
    HideTabPanel = 'hideTabPanel',
    HideSampleQuestions = 'hideSampleQuestions',
    WorksheetId = 'worksheet',
    Query = 'query',
    HideHomepageLeftNav = 'hideHomepageLeftNav',
    ModularHomeExperienceEnabled = 'modularHomeExperience',
    PendoTrackingKey = 'additionalPendoKey',
}

/**
 * ThoughtSpot application pages include actions and menu commands
 * for various user-initiated operations. These actions are represented
 * as enumeration members in the SDK. To show, hide, or disable
 * specific actions in the embedded view, define the Action
 * enumeration members in the `disabledActions`, `visibleActions`,
 * or `hiddenActions` array.
 *
 * @example
 * ```js
 * const embed = new LiveboardEmbed('#embed-container', {
 *    ... // other options
 *    visibleActions: [Action.Save, Action.Edit, Action.Present, ActionAction.Explore],
 *    disabledActions: [Action.Download],
 *    //hiddenActions: [], // Set either this or visibleActions
 * })
 * ```
 * @example
 * ```js
 * const embed = new LiveboardEmbed('#embed-container', {
 *    ... // other options
 *    //visibleActions: [],
 *    disabledActions: [Action.Download],
 *    hiddenActions: [Action.Edit, ActionAction.Explore],
 * })
 * ```
 */
// eslint-disable-next-line no-shadow
export enum Action {
    /**
     * The **Save** action on an Answer or Liveboard.
     * Allows users to save the changes.
     *
     * @example
     * ```js
     * disabledActions: [Action.SaveAsView]
     * ```
     */
    Save = 'save',
    /**
     * @hidden
     */
    Update = 'update',
    /**
     * @hidden
     */
    SaveUntitled = 'saveUntitled',
    /**
     * The **Save as View** action on the Answer
     * page. Saves an Answer as a View object.
     *
     * @example
     * ```js
     * disabledActions: [Action.SaveAsView]
     * ```
     */
    SaveAsView = 'saveAsView',
    /**
     * The **Make a copy** action on a Liveboard or Answer
     * page.
     * Creates a copy of the Liveboard, visualization,
     * or Answer.
     *
     * @example
     * ```js
     * disabledActions: [Action.MakeACopy]
     * ```
     */
    MakeACopy = 'makeACopy',
    /**
     * The **Copy and Edit** action on a Liveboard.
     * This action is now replaced with `Action.MakeACopy`.
     *
     * @example
     * ```js
     * disabledActions: [Action.EditACopy]
     * ```
     */
    EditACopy = 'editACopy',
    /**
     * The **Copy link** menu action on a Liveboard visualization.
     * Copies the visualization URL
     *
     * @example
     * ```js
     * disabledActions: [Action.CopyLink]
     * ```
     */
    CopyLink = 'embedDocument',
    /**
     * @hidden
     */
    ResetLayout = 'resetLayout',
    /**
     * The **Schedule** menu action on a Liveboard.
     * Allows scheduling a Liveboard notification.
     *
     * @example
     * ```js
     * disabledActions: [Action.Schedule]
     * ```
     */
    Schedule = 'subscription',
    /**
     * The **Manage schedules** menu action on a Liveboard.
     * Allows users to manage scheduled Liveboard jobs.
     *
     * @example
     * ```js
     * disabledActions: [Action.SchedulesList]
     * ```
     */
    SchedulesList = 'schedule-list',
    /**
     * The **Share** action on a Liveboard, Answer, or Worksheet.
     * Allows users to share an object with other users and groups.
     *
     * @example
     * ```js
     * disabledActions: [Action.Share]
     * ```
     */
    Share = 'share',
    /**
     * The **Add filter** action on a Liveboard and Search page.
     * Allows adding filters to Answers and visualizations on a Liveboard.
     *
     * @example
     * ```js
     * disabledActions: [Action.AddFilter]
     * ```
     */
    AddFilter = 'addFilter',
    /**
     * Filter configuration options on a Liveboard and Search page.
     * Allows configuring filter options when adding filters to a
     * Liveboard or Answer.
     *
     * @example
     * ```js
     * disabledActions: [Action.ConfigureFilter]
     * ```
     */
    ConfigureFilter = 'configureFilter',
    CollapseDataSources = 'collapseDataSources',
    /**
     * The **Choose sources** button on Search page.
     * Allows selecting data sources for search queries.
     *
     * @example
     * ```js
     * disabledActions: [Action.ChooseDataSources]
     * ```
     */
    ChooseDataSources = 'chooseDataSources',
    /**
     * The **Create formula** action on a Search or Answer page.
     * Allows adding formulas to an Answer.
     *
     * @example
     * ```js
     * disabledActions: [Action.AddFormula]
     * ```
     */
    AddFormula = 'addFormula',
    /**
     * The **Add parameter** action on a Liveboard or Answer.
     * Allows adding Parameters to a Liveboard or Answer.
     *
     * @example
     * ```js
     * disabledActions: [Action.AddParameter]
     * ```
     */
    AddParameter = 'addParameter',
    /**
     * @hidden
     */
    SearchOnTop = 'searchOnTop',
    /**
     * The **SpotIQ analyze** menu action on a visualization or
     * Answer page.
     *
     * @example
     * ```js
     * disabledActions: [Action.SpotIQAnalyze]
     * ```
     */
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
    /**
     * The **Show underlying data** menu action on a visualization or
     * Answer page.
     *
     * @example
     * ```js
     * disabledActions: [Action.ShowUnderlyingData]
     * ```
     */
    ShowUnderlyingData = 'showUnderlyingData',
    /**
     * The **Download** menu action on Liveboard visualizations
     * and Answers.
     * Allows downloading a visualization or Answer.
     *
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPng]
     * ```
     */
    Download = 'download',
    /**
     * The **Download** > **PNG** menu action for charts on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer as a PNG file.
     *
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPng]
     * ```
     */
    DownloadAsPng = 'downloadAsPng',
    /**
     * The **Download** > **PDF** menu action on a Liveboard.
     * Downloads a visualization or Answer as a PDF file.
     *
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPdf]
     * ```
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * The **Download**  > **CSV** menu action for tables on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer in the XLSX format.
     *
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsCsv]
     * ```
     */
    DownloadAsCsv = 'downloadAsCSV',
    /**
     * The **Download** > **XLSX** menu action for tables on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer in the XLSX format.
     *
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsXlsx]
     * ```
     */
    DownloadAsXlsx = 'downloadAsXLSX',
    /**
     * @hidden
     */
    DownloadTrace = 'downloadTrace',
    /**
     * The **Export TML** menu action on Liveboard, Answers
     * Worksheets and Data Connections page.
     * Exports an object as a TML file.
     *
     * @example
     * ```js
     * disabledActions: [Action.ExportTML]
     * ```
     */
    ExportTML = 'exportTSL',
    /**
     * The **Import TML** menu action for Liveboards and Answers.
     * Imports TML representation of ThoughtSpot objects.
     *
     * @example
     * ```js
     * disabledActions: [Action.ImportTML]
     * ```
     */
    ImportTML = 'importTSL',
    /**
     * The **Update TML** menu action for Liveboards and Answers.
     * Update TML representation of ThoughtSpot objects.
     *
     * @example
     * ```js
     * disabledActions: [Action.UpdateTML]
     * ```
     */
    UpdateTML = 'updateTSL',
    /**
     * The **Edit TML** menu action for Liveboards and Answers.
     * Opens the TML editor.
     *
     * @example
     * ```js
     * disabledActions: [Action.EditTML]
     * ```
     */
    EditTML = 'editTSL',
    /**
     * The **Present** menu action for Liveboards and Answers.
     * Allows presenting a Liveboard or visualization in
     * slideshow mode.
     *
     * @example
     * ```js
     * disabledActions: [Action.Present]
     * ```
     */
    Present = 'present',
    /**
     * The tile resize options in the visualization menu.
     * Allows switching between different preset layouts.
     *
     * @example
     * ```js
     * disabledActions: [Action.ToggleSize]
     * ```
     */
    ToggleSize = 'toggleSize',
    /**
     * The *Edit* action on the Liveboard page and in the
     * visualization menu.
     * Opens a Liveboard or visualization in edit mode.
     *
     * @example
     * ```js
     * disabledActions: [Action.Edit]
     * ```
     */
    Edit = 'edit',
    /**
     * The text edit option for Liveboard and visualization titles.
     *
     * @example
     * ```js
     * disabledActions: [Action.EditTitle]
     * ```
     */
    EditTitle = 'editTitle',
    /**
     * The **Delete** menu action on Liveboards and visualizations.
     * Deletes a Liveboard or a visualization from a Liveboard.
     *
     * @example
     * ```js
     * disabledActions: [Action.Remove]
     * ```
     */
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
    /**
     * The **Show Liveboard details** menu action on a Liveboard.
     * Displays details such as the name, description, and
     * author of the Liveboard, and timestamp of Liveboard creation
     * and update.
     *
     * @example
     * ```js
     * disabledActions: [Action.LiveboardInfo]
     * ```
     */
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
     * The **Pin** menu action on an Answer or
     * Search results page.
     *
     * @example
     * ```js
     * disabledActions: [Action.Pin]
     * ```
     */
    Pin = 'pin',
    /**
     * @hidden
     */
    AnalysisInfo = 'analysisInfo',
    /**
     * The **Schedule** menu action on a Liveboard.
     *
     * @example
     * ```js
     * disabledActions: [Action.Subscription]
     * ```
     */
    Subscription = 'subscription',
    /**
     * The **Explore** action on Liveboard visualizations
     *
     * @example
     * ```js
     * disabledActions: [Action.Explore]
     * ```
     */
    Explore = 'explore',
    /**
     * The action to include data points on a drilled-down Answer
     * or visualization
     *
     * @example
     * ```js
     * disabledActions: [Action.DrillInclude]
     * ```
     */

    DrillInclude = 'context-menu-item-include',
    /**
     * The action to exclude data points on a drilled-down Answer
     * or visualization
     *
     * @example
     * ```js
     * disabledActions: [Action.DrillInclude]
     * ```
     */
    DrillExclude = 'context-menu-item-exclude',
    /**
     * The **Copy to clipboard** menu action on tables in an Answer
     * or Liveboard.
     * Copies the selected data point.
     *
     * @example
     * ```js
     * disabledActions: [Action.CopyToClipboard]
     * ```
     */
    CopyToClipboard = 'context-menu-item-copy-to-clipboard',
    CopyAndEdit = 'context-menu-item-copy-and-edit',
    /**
     * @hidden
     */
    DrillEdit = 'context-menu-item-edit',
    EditMeasure = 'context-menu-item-edit-measure',
    Separator = 'context-menu-item-separator',
    /**
     * The **Drill down** menu action on Answers and Liveboard
     * visualizations.
     * Allows drilling down to a specific data point on a chart or table.
     *
     * @example
     * ```js
     * disabledActions: [Action.DrillDown]
     * ```
     */
    DrillDown = 'DRILL',
    /**
     * The request access action on Liveboards.
     * Allows users with view permissions to request edit access to a Liveboard.
     *
     * @example
     * ```js
     * disabledActions: [Action.RequestAccess]
     * ```
     */
    RequestAccess = 'requestAccess',
    /**
     * The **Query visualizer** and **Query SQL** buttons in Query details panel
     * of the Answer page
     *
     * @example
     * ```js
     * disabledActions: [Action.QueryDetailsButtons]
     * ```
     */
    QueryDetailsButtons = 'queryDetailsButtons',
    /**
     * The **Delete** action for Answers.
     *
     * @example
     * ```js
     * disabledActions: [Action.AnswerDelete]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    AnswerDelete = 'onDeleteAnswer',
    /**
     * The Chart switcher icon on Answer and visualization pages.
     *
     * @example
     * ```js
     * disabledActions: [Action.AnswerChartSwitcher]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
    /**
     * Favorites icon (*) on Answers, Liveboard, and Data pages
     *
     * @example
     * ```js
     * disabledActions: [Action.AddToFavorites]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    AddToFavorites = 'addToFavorites',
    /**
     * The edit icon on Liveboards (Classic experience).
     *
     * @example
     * ```js
     * disabledActions: [Action.EditDetails]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    EditDetails = 'editDetails',
    /**
     * The Create alert action on KPI charts.
     *
     * @example
     * ```js
     * disabledActions: [Action.CreateMonitor ]
     * ```
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    CreateMonitor = 'createMonitor',
    /**
     * @example
     * ```js
     * disabledActions: [Action.ReportError]
     * ```
     * @version SDK: 1.11.1 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    ReportError = 'reportError',
    /**
     * The **Sync to sheets** action on Answers and Liveboard visualizations.
     * Allows sending data to a Google Sheet.
     *
     * @example
     * ```js
     * disabledActions: [Action.SyncToSheets]
     * ```
     * @version SDK: 1.18.0| ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
    SyncToSheets = 'sync-to-sheets',
    /**
     * The **Sync to other apps** action on Answers and Liveboard visualizations.
     * Allows sending data to third-party apps like Slack, Salesforce,
     * Microsoft Teams, and so on.
     *
     * @example
     * ```js
     * disabledActions: [Action.SyncToOtherApps]
     * ```
     * @version SDK: 1.18.0| ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
    SyncToOtherApps = 'sync-to-other-apps',
    /**
     * The **Manage pipelines** action on Answers and Liveboard visualizations.
     * Allows users to manage data sync pipelines to third-party apps.
     *
     * @example
     * ```js
     * disabledActions: [Action.SyncToOtherApps]
     * ```
     * @version SDK: 1.18.0| ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
    ManagePipelines = 'manage-pipeline',
    /**
     * The **Filter** action on Liveboard visualizations.
     * Allows users to apply cross-filters on a Liveboard.
     *
     * @example
     * ```js
     * disabledActions: [Action.CrossFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    CrossFilter = 'context-menu-item-cross-filter',
    /**
     * The **Remove** action that appears when cross filters are applied
     * on a Liveboard.
     * Removes filters applied o a visualization.
     *
     * @example
     * ```js
     * disabledActions: [Action.RemoveCrossFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    RemoveCrossFilter = 'context-menu-item-remove-cross-filter',
    /**
     * The **Aggregate** option in the chart axis or the
     * table column customization menu.
     * Provides aggregation options to analyze the data on a chart or table.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuAggregate]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuAggregate = 'axisMenuAggregate',
    /**
     * The **Time bucket** option in the chart axis or table column
     * customization menu.
     * Allows defining time metric for date comparison.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuTimeBucket]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuTimeBucket = 'axisMenuTimeBucket',
    /**
     * The **Filter** action in the chart axis or table column
     * customization menu.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuFilter = 'axisMenuFilter',
    /**
     * The **Conditional formatting** action on chart or table.
     * Allows adding rules for conditional formatting of data
     * points on a chart or table.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuConditionalFormat]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuConditionalFormat = 'axisMenuConditionalFormat',
    /**
     * The **Sort** menu action on a table or chart axis
     * Sorts data in ascending or descending order.
     * Allows adding, editing, or removing filters.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuConditionalFormat]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuSort = 'axisMenuSort',
    /**
     * The **Group** option in the chart axis or table column
     * customization menu.
     * Allows grouping data points if the axes use the same
     * unit of measurement and a similar scale.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuGroup]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuGroup = 'axisMenuGroup',
    /**
     * The **Position** option in the axis customization menu.
     * Allows changing the position of the axis to the
     * left or right side of the chart.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuPosition]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuPosition = 'axisMenuPosition',
    /**
     * The **Rename** option in the chart axis or table column customization menu.
     * Renames the axis label on a chart or the column header on a table.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuRename]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuRename = 'axisMenuRename',
    /**
     * The **Edit** action in the axis customization menu.
     * Allows editing the axis name, position, minimum and maximum values,
     * and format of a column.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuEdit]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuEdit = 'axisMenuEdit',
    /**
     * The **Number format** action to customize the format of
     * the data labels on a chart or table.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuNumberFormat]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuNumberFormat = 'axisMenuNumberFormat',
    /**
     * The **Text wrapping** action on a table.
     * Wraps or clips column text on a table.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuTextWrapping]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuTextWrapping = 'axisMenuTextWrapping',
    /**
     * The **Remove** action in the chart axis or table column
     * customization menu.
     * Removes the data labels from a chart or the column of a
     * table visualization.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuRemove]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AxisMenuRemove = 'axisMenuRemove',
    /**
     * @hidden
     */
    InsertInToSlide = 'insertInToSlide',
    /**
     * The **Rename** menu action on Liveboards and visualizations.
     * Allows renaming a Liveboard or visualization.
     *
     * @example
     * ```js
     * disabledActions: [Action.RenameModalTitleDescription]
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    RenameModalTitleDescription = 'renameModalTitleDescription',
    /**
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl
     */
    RequestVerification = 'requestVerification',
    /**
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl
     */
    MarkAsVerified = 'markAsVerified',
    /**
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    AddTab = 'addTab',
    /**
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl
     */
    EnableContextualChangeAnalysis = 'enableContextualChangeAnalysis',
    /**
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    ShowSageQuery = 'showSageQuery',
    /**
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    EditSageAnswer = 'editSageAnswer',
    /**
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    SageAnswerFeedback = 'sageAnswerFeedback',
    /**
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    ModifySageAnswer = 'modifySageAnswer',
    /**
     * The **Move to Tab** menu action on visualizations in liveboard edit mode.
     * Allows moving a visualization to a different tab.
     *
     * @example
     * ```js
     * disabledActions: [Action.MoveToTab]
     * ```
     */
    MoveToTab = 'onContainerMove',
    /**
     * The **Manage Alertsb** menu action on KPI visualizations.
     *
     * @example
     * ```js
     * disabledActions: [Action.ManageMonitor]
     * ```
     */
    ManageMonitor = 'ManageMonitor',
    /**
     * Action ID for Liveboard Personalised Views dropdown
     *
     *  @example
     * ```js
     * disabledActions: [Action.PersonalisedViewsDropdown]
     * ```
     *  @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    PersonalisedViewsDropdown = 'personalisedViewsDropdown',
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
