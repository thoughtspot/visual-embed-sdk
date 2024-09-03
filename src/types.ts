/**
 * Copyright (c) 2023
 *
 * TypeScript type definitions for ThoughtSpot Visual Embed SDK
 * @summary Type definitions for Embed SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { CustomCssVariables } from './css-variables';
import type { SessionInterface } from './utils/graphql/answerService/answerService';

/**
 * The authentication mechanism for allowing access to the
 * the embedded app
 * @group Authentication / Init
 */
// eslint-disable-next-line no-shadow
export enum AuthType {
    /**
     * No authentication on the SDK. Passthrough to the embedded App. Alias for
     * `Passthrough`.
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
     * Passthrough SSO to the embedded application within the iframe. Requires least
     * configuration, but may not be supported by all IDPs. This will behave like `None`
     * if SSO is not configured on ThoughtSpot.
     *
     * To use this:
     * Your SAML or OpenID provider must allow iframe redirects.
     * For example, if you are using Okta as IdP, you can enable iframe embedding.
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.EmbeddedSSO,
     *  });
     * ```
     * @version: SDK: 1.15.0 | ThoughtSpot: 8.8.0.cl
     */
    EmbeddedSSO = 'EmbeddedSSO',
    /**
     * SSO using SAML
     * @deprecated Use {@link SAMLRedirect} instead
     * @hidden
     */
    SSO = 'SSO_SAML',
    /**
     * SSO using SAML
     * @deprecated Use {@link SAMLRedirect} instead
     * @hidden
     */
    SAML = 'SSO_SAML',
    /**
     * SSO using SAML
     * Makes the host application redirect to the SAML IdP. Use this
     * if your IdP does not allow itself to be embedded.
     *
     * This redirects the host application to the SAML IdP. The host application
     * will be redirected back to the ThoughtSpot app after authentication.
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.SAMLRedirect,
     *  });
     * ```
     *
     * This opens the SAML IdP in a popup window. The popup is triggered
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
     * Can also use the event to trigger the popup flow. Works the same
     * as the above example.
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
     * @hidden
     * @deprecated Use {@link OIDCRedirect} instead
     */
    OIDC = 'SSO_OIDC',
    /**
     * SSO using OIDC
     * Will make the host application redirect to the OIDC IdP.
     * See code samples in {@link SAMLRedirect}.
     */
    OIDCRedirect = 'SSO_OIDC',
    /**
     * Trusted authentication server
     * @hidden
     * @deprecated Use {@link TrustedAuth} instead
     */
    AuthServer = 'AuthServer',
    /**
     * Trusted authentication server. Use your own authentication server
     * which returns a bearer token, generated using the `secret_key` obtained
     * from ThoughtSpot.
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
     * });
     * ```
     */
    TrustedAuthToken = 'AuthServer',
    /**
     * Trusted authentication server Cookieless, Use your own authentication
     * server which returns a bearer token, generated using the `secret_key`
     * obtained from ThoughtSpot. This uses a cookieless authentication
     * approach, recommended to bypass the third-party cookie-blocking restriction
     * implemented by some browsers.
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
     * @version SDK: 1.22.0| ThoughtSpot: 9.3.0.cl, 9.5.1.sw
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
/**
 *
 * This option does not apply to the classic homepage experience.
 * To access the updated modular homepage,
 * set `modularHomeExperience` to `true`
 * (available as Early Access feature in 9.12.5.cl).
 *
 */

export enum HomeLeftNavItem {
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
    SearchData = 'search-data',
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
    Home = 'insights-home',
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
    Liveboards = 'liveboards',
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
    Answers = 'answers',
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
    MonitorSubscription = 'monitor-alerts',
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
    SpotIQAnalysis = 'spotiq-analysis',
    /**
     * @version SDK: 1.34.0| ThoughtSpot: 10.3.0.cl
     */
    LiveboardSchedules = 'liveboard-schedules'
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
 * You can customize styles, text strings, and icons.
 * For more information, see https://developers.thoughtspot.com/docs/custom-css.
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
 *        'LIVEBOARDS': 'Dashboards',
 *        'ANSWERS': 'Visualizations',
 *        'Edit': 'Modify',
 *        'Show underlying data': 'Show source data',
 *        'SpotIQ': 'Insights',
 *        'Monitor': 'Alerts',
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
     * authentication token. A `GET` request is made to the
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
     * reuse the old issued token. When auth expires this method is
     * called again and if it is called with an older token, the authentication
     * will not succeed.
     */
    getAuthToken?: () => Promise<string>;
    /**
     * [AuthServer / Basic] The user name of the ThoughtSpot user. This
     * attribute is required for trusted authentication.
     */
    username?: string;

    /**
     * [Basic] The ThoughtSpot login password corresponding to the username
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
    password?: string;

    /**
     * [SSO] For SSO Authentication, if `noRedirect` is set to true, it will
     * open the SAML auth flow in a popup, instead of redirecting the browser in
     * place.
     * @default false
     * @deprecated
     */
    noRedirect?: boolean;

    /**
     * [SSO] For SSO Authentication, if `inPopup` is set to true, it will open
     * the SAML auth flow in a popup, instead of redirecting the browser in place.
     *
     * Need to use this with `authTriggerContainer`. Or manually trigger
     * the `AuthEvent.TRIGGER_SSO_POPUP` event on a user interaction.
     * @default false
     * @version SDK: 1.18.0
     */
    inPopup?: boolean;

    /**
     * [SSO] For SSO Authentication, one can supply an optional path param;
     * This will be the path on the host origin where the SAML flow will be
     * terminated.
     *
     * Eg: "/dashboard", "#/foo" [Do not include the host]
     * @version SDK: 1.10.2 | ThoughtSpot 8.2.0.cl, 8.4.1.sw
     */
    redirectPath?: string;

    /** @internal */
    basepath?: string;

    /**
     * Boolean to define if the query parameters in the ThoughtSpot URL
     * should be encoded in base64. This provides additional security to
     * Thoughtspot clusters against cross-site scripting attacks.
     * @default false
     */
    shouldEncodeUrlQueryParams?: boolean;

    /**
     * Suppress cookie access alert when third-party cookies are blocked by the
     * user's browser. Third-party cookie blocking is the default behaviour on
     * some web browsers like Safari. If you set this attribute to `true`,
     * you are encouraged to handle `noCookieAccess` event, to show your own treatment
     * in this case.
     * @default false
     */
    suppressNoCookieAccessAlert?: boolean;

    /**
     * Ignore the cookie access alert when third-party cookies are blocked by the
     * user's browser. If you set this to `true`, the embedded iframe behaviour
     * persists even in the case of a non-logged-in user.
     * @default false
     */
    ignoreNoCookieAccess?: boolean;

    /**
     * Re-login a user with the previous login options
     * when a user session expires.
     * @default false
     */
    autoLogin?: boolean;

    /**
     * Disable redirection to the login page when the embedded session expires
     * This flag is typically used alongside the combination of authentication modes such
     * as {@link AuthType.AuthServer} and auto-login behavior {@link
     * EmbedConfig.autoLogin}
     * @version SDK: 1.9.3 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     * @default false
     */
    disableLoginRedirect?: boolean;

    /**
     * This message is displayed in the embedded view when a user login fails.
     * @version SDK: 1.10.1 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     */
    loginFailedMessage?: string;

    /**
     * Calls the prefetch method internally when set to `true`
     * @default false
     */
    callPrefetch?: boolean;

    /**
     * When there are multiple objects embedded, queue the rendering of embedded objects
     * to start after the previous embed's render is complete. This helps improve
     * performance by decreasing the load on the browser.
     *  @Version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     * @default false
     */
    queueMultiRenders?: boolean;

    /**
     * Dynamic CSS URL to be injected in the loaded application.
     * You would also need to set `style-src` in the CSP settings.
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @default ''
     */
    customCssUrl?: string;
    /**
     * [AuthServer|Basic] Detect if third-party party cookies are enabled by doing an
     * additional call. This is slower and should be avoided. Listen to the
     * `NO_COOKIE_ACCESS` event to handle the situation.
     *
     * This is slightly slower than letting the browser handle the cookie check, as it
     * involves an extra network call.
     * @version SDK: 1.10.4 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     */
    detectCookieAccessSlow?: boolean;
    /**
     * Hide the `beta` alert warning message for SearchEmbed.
     * @version SDK: 1.12.0 | ThoughtSpot: 8.4.0.cl, 8.4.1.sw*
     */
    suppressSearchEmbedBetaWarning?: boolean;
    /**
     * Hide `beta` alert warning message for SageEmbed.
     *
     */
    suppressSageEmbedBetaWarning?: boolean;
    /**
     * Custom style params for embed Config.
     * @version SDK: 1.17.0 | ThoughtSpot: 8.9.0.cl, 9.0.1.sw
     */
    customizations?: CustomisationsInterface;
    /**
     * For `inPopup` SAMLRedirect or OIDCRedirect authentication, we need a
     * button that the user can click to trigger the flow.
     * This attribute sets a containing element for that button.
     * @example
     * ```js
     * init({
     *   authType: AuthType.SAMLRedirect,
     *   inPopup: true,
     *   authTriggerContainer: '#auth-trigger-container'
     * })
     * ```
     * @version SDK: 1.17.0 | ThoughtSpot: 8.9.0.cl, 9.0.1.sw
     */
    authTriggerContainer?: string | HTMLElement;
    /**
     * Specify that we want to use the `AuthEvent.TRIGGER_SSO_POPUP` event to trigger
     * SAML popup. This is useful when you want to trigger the popup on a custom user
     * action.
     *
     */
    useEventForSAMLPopup?: boolean;
    /**
     * Text to show in the button which triggers the popup auth flow.
     * Default: `Authorize`.
     * @version SDK: 1.17.0 | ThoughtSpot: 8.9.0.cl, 9.0.1.sw
     */
    authTriggerText?: string;
    /**
     * Prevent users from accessing the full application or ThoughtSpot application pages
     * access to the embedded application users
     * outside of the iframe.
     * @default true
     * @version SDK: 1.22.0 | ThoughtSpot: 9.3.0.cl, 9.5.1.sw
     */
    blockNonEmbedFullAppAccess?: boolean;

    /**
     * Host config in case embedded app is inside TS app itself
     * @hidden
     */
    hostConfig?: {
        hostUserGuid: string;
        hostClusterId: string;
        hostClusterName: string;
    };

    /**
     * Pendo API key to enable Pendo tracking to your own subscription, the key
     * is added as an additional key to the embed, as per this link:https://support.pendo.io/hc/en-us/articles/360032201951-Send-data-to-multiple-subscriptions[document].
     * @version SDK: 1.27.0 | ThoughtSpot: 9.8.0.cl
     */
    pendoTrackingKey?: string;

    /**
     * If passed as true all alerts will be suppressed in the embedded app.
     * @version SDK: 1.26.2 | ThoughtSpot: *
     */
    suppressErrorAlerts?: boolean;

    /**
     * Log level for the SDK.
     * @default LogLevel.ERROR
     * @example
     * ```js
     * init({
     *   ...embedConfig,
     *   logLevel: LogLevel.SILENT
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot: 9.10.0.cl
     */
    logLevel?: LogLevel;
    /**
     * Disables the Mixpanel tracking from the SDK.
     * @version SDK: 1.27.9
     */
    disableSDKTracking?: boolean;
    /**
     * Overrides default/user preffered locale for date formatting
     * @version SDK: 1.28.4 | Thoughtspot: 10.0.0.cl, 9.5.0.sw
     */
    dateFormatLocale?: string;
    /**
     * Overrides default/user preffered locale for number formatting
     * @version SDK: 1.28.4 | Thoughtspot: 10.0.0.cl, 9.5.0.sw
     */
    numberFormatLocale?: string;
    /**
     * Format to be used for currency when currency format is set to infer from browser
     * @version SDK: 1.28.4 | Thoughtspot: 10.0.0.cl, 9.5.0.sw
     */
    currencyFormat?: string;

    /**
     * This flag is used to disable the token verification in the SDK.
     * Enabling this flag will also disable the caching of the token.
     * @hidden
     * @example
     * ```js
     * init({
     *   ...embedConfig,
     *   disableTokenVerification : true
     * })
     * ```
     * @version SDK: 1.28.5 | Thoughtspot: *
     */
    disableTokenVerification?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LayoutConfig {}

/**
 * Embedded iframe configuration
 * @group Embed components
 */
export interface FrameParams {
    /**
     * The width of the iframe (unit is pixels if numeric).
     */
    width?: number | string;
    /**
     * The height of the iframe (unit is pixels if numeric).
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
     * The width and height dimensions to render an embedded
     * object inside your app.  Specify the values in pixels or percentage.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 7.2.1
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   frameParams: {
     *     width: '500px' | '50%',
     *      height: '400px' | '60%',
     *   },
     * });
     * ```
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
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
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
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   disabledActions: [Action.Download, Action.Save]
     *   disabledActionReason: "Reason for disabling",
     * });
     * ```
     */
    disabledActionReason?: string;
    /**
     * The list of actions to hide from the embedded.
     * This actions will be hidden from the user.
     * Use this to hide an action.
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
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
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @important
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   visibleActions: [Action.Download, Action.Export]
     * });
     * ```
     */
    visibleActions?: Action[];
    /**
     * Show alert messages and toast messages in the embedded view.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    showAlerts:true,
     * })
     * ```
     */
    showAlerts?: boolean;
    /**
     * The list of runtime filters to apply to a search answer,
     * visualization, or Liveboard.
     * @version SDK: 1.9.4 | ThoughtSpot 8.1.0.cl, 8.4.1.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    runtimeFilters: [
     *           {
     *             columnName: 'value',
     *              operator: RuntimeFilterOp.EQ,
     *             values: ['string' | 123 | true],
     *           },
     *       ],
     * })
     * ```
     */
    runtimeFilters?: RuntimeFilter[];
    /**
     * The list of parameter override to apply to a search answer,
     * visualization, or Liveboard.
     * @version SDK : 1.25.0 | Thoughtspot: 9.2.0.cl, 9.5.0.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    runtimeParameters: [
     *     {
     *       name: 'value',
     *       value: 'string' | 123 | true,
     *     },
     *   ],
     * })
     * ```
     */
    runtimeParameters?: RuntimeParameter[];
    /**
     * The locale/language to use for the embedded view.
     * @version SDK: 1.9.4 | ThoughtSpot 8.1.0.cl, 8.4.1.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    locale:'en',
     * })
     * ```
     */
    locale?: string;
    /**
     * This is an object (key/val) of override flags which will be applied
     * to the internal embedded object. This can be used to add any
     * URL flag.
     * Warning: This option is for advanced use only and is used internally
     * to control embed behavior in non-regular ways. We do not publish the
     * list of supported keys and values associated with each.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   additionalFlags: {
     *        flag1: 'value1',
     *        flag2: 'value2'
     *     }
     * });
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    additionalFlags?: { [key: string]: string | number | boolean };
    /**
     * Dynamic CSSUrl and customCSS to be injected in the loaded application.
     * You would also need to set `style-src` in the CSP settings.
     * @version SDK: 1.17.2 | ThoughtSpot: 8.4.1.sw, 8.4.0.cl
     * @default ''
     */
    customizations?: CustomisationsInterface;
    /**
     * Insert as a sibling of the target container, instead of appending to a
     * child inside it.
     * @version SDK: 1.2.0 | Thoughtspot: 9.0.0.cl, 9.0.0.sw
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    insertAsSibling:true,
     * })
     * ```
     */
    insertAsSibling?: boolean;
    /**
     * flag to set ContextMenu Trigger to either left or right click.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#tsEmbed', {
     *    ... // other options
     *    contextMenuTrigger:ContextMenuTriggerOptions.LEFT_CLICK || RIGHT_CLICK,
     * })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    contextMenuTrigger?: ContextMenuTriggerOptions;
    /**
     * Flag to override openNew tab context menu link
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    linkOverride:false,
     * })
     * ```
     */
    linkOverride?: boolean;
    /**
     * flag to enable insert into slides action
     * @hidden
     * @private
     */
    insertInToSlide?: boolean;
    /**
     * Use a pre-rendered iframe from a pool of pre-rendered iframes
     * if available and matches the configuration.
     * @version SDK: 1.22.0
     * @hidden
     *
     * See [docs]() on how to create a prerender pool.
     */
    usePrerenderedIfAvailable?: boolean;
    /**
     * Boolean to exclude runtimeFilters in the URL
     * By default it is true, this flag removes runtime filters from the URL
     * when set to false, runtime filters will be included in the URL.
     *
     * Irrespective of this flag, runtime filters ( if passed ) will be applied to the
     * embedded view.
     * @default false
     * @version SDK: 1.24.0 | ThoughtSpot: 9.5.0.cl
     */
    excludeRuntimeFiltersfromURL?: boolean;
    /**
     * The list of tab IDs to hide from the embedded.
     * This Tabs will be hidden from their respective LBs.
     * Use this to hide an tabID.
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
     * For example: hiddenHomepageModules = [HomepageModule.MyLibrary]
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     * @version SDK: 1.28.0 | Thoughtspot: 9.12.5.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    hiddenHomepageModules : [HomepageModule.Favorite,HomepageModule.Learning],
     * })
     * ```
     */
    hiddenHomepageModules?: HomepageModule[];
    /**
     * reordering the home page modules
     * eg: reorderedHomepageModules = [HomepageModule.MyLibrary, HomepageModule.Watchlist]
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     * @version SDK: 1.28.0| Thoughtspot: 9.12.5.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    reorderedHomepageModules:[HomepageModule.Favorite,HomepageModule.MyLibrary]
     * })
     * ```
     */
    reorderedHomepageModules?: HomepageModule[];
    /**
     * The list of tab IDs to show in the embedded Liveboard.
     * Only the tabs specified in the array will be shown in the Liveboard.
     *
     * Use either `visibleTabs` or `hiddenTabs`.
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options
     *    visibleTabs: [
     *       '430496d6-6903-4601-937e-2c691821af3c',
     *       'f547ec54-2a37-4516-a222-2b06719af726'
     *     ]
     * })
     * ```
     */
    visibleTabs?: string[];
    /**
     * homepageLeftNavItems : Show or hide the left navigation bar items.
     * There are 8 eight home navigation list items.
     * To hide these items, specify the string in the array.
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    hiddenHomeLeftNavItems : [HomeLeftNavItem.Home,HomeLeftNavItem.Answers],
     * })
     * ```
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     * @version SDK: 1.28.0 | Thoughtspot: 9.12.5.cl
     */
    hiddenHomeLeftNavItems?: HomeLeftNavItem[];
    /**
     * PreRender id to be used for PreRendering the embed.
     * Use PreRender to render the embed in the background and then
     * show or hide the rendered embed using showPreRender or hidePreRender respectively.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   preRenderId: "preRenderId-123"
     * });
     * embed.showPreRender();
     * ```
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl, 9.8.0.sw
     */
    preRenderId?: string;

    /**
     * Determines whether the PreRender component should not dynamically track the size
     * of its embedding element and adjust its own size accordingly.
     * Enabling this option allows the PreRender component to automatically adapt
     * its dimensions based on changes to the size of the embedding element.
     * @type {boolean}
     * @default false
     * @version SDK: 1.24.0 | ThoughtSpot:9.4.0.cl, 9.4.0.sw
     * @example
     * ```js
     * // Disable tracking PreRender size in the configuration
     * const config = {
     *   doNotTrackPreRenderSize: true,
     * };
     *
     * // Instantiate an object with the configuration
     * const myComponent = new MyComponent(config);
     * ```
     */
    doNotTrackPreRenderSize?: boolean;
    /**
     * For internal tracking of the embed component type.
     * @hidden
     */
    embedComponentType?: string;
    /**
     * Boolean to exclude runtimeParameters from the URL
     * when set to true, this flag removes runtime parameters from the URL.
     *
     * Irrespective of this flag, runtime filters ( if passed ) will be applied to the
     * embedded view.
     * @default false
     * @version SDK: 1.29.0 | ThoughtSpot: 10.1.0.cl
     */
    excludeRuntimeParametersfromURL?: boolean;
    /**
     * Enable the V2 shell. This can provide performance benefits
     * due to a lighterweight shell.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   liveboardId: '123',
     *   enableV2Shell_experimental: true
     * });
     * ```
     * @version SDK: 1.31.2 | ThoughtSpot: 10.0.0.cl
     */
    // eslint-disable-next-line camelcase
    enableV2Shell_experimental?: boolean;
    /**
     * To set the initial state of the search bar in case of saved-answers.
     * @default true
     * @version SDK: 1.34.0 | Thoughtspot: 10.3.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   liveboardId: '123',
     *   collapseSearchBar: true
     * });
     */
    collapseSearchBar?: boolean;
    /**
     * This flag can be used to disable links inside the embedded app,
     * and disables redirection of links in a new tab.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   disableRedirectionLinksInNewTab: true
     * });
     * ```
     * @version SDK: 1.32.1 | ThoughtSpot: 10.3.0.cl
     */
    disableRedirectionLinksInNewTab?: boolean;
    /**
     * Flag to control Data panel experience
     * @default true
     * @version SDK: 1.34.0 | Thoughtspot: 10.3.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    dataPanelV2: true,
     * })
     * ```
     */
    dataPanelV2?: boolean;
}

/**
 * MessagePayload: Embed event payload: message type, data and status (start/end)
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
 * MessageOptions: By providing options, getting specific event start / end based on
 * option
 * @group Events
 */
export type MessageOptions = {
    /**
     *  A boolean value indicating that start status events of this type
     *  will be dispatched.
     */
    start?: boolean;
};
/**
 * MessageCallback: Embed event message callback
 * @group Events
 */
export type MessageCallback = (
    /* payload: Message payload contains type, data, and status */
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
     *  options: It contains start, a boolean value indicating that start
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
    /**
     * Is not included in this list of values
     */
    NOT_IN = 'NOT_IN',
}

/**
 * Home page module that can be hidden.
 * **Note**: This option does not apply to the classic homepage.
 * To access the updated modular homepage, set
 * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
 * @version SDK: 1.28.0 | Thoughtspot: 9.12.5.cl
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
     * List of answers and Liveboards
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
    values: (number | boolean | string | bigint)[];
}
/**
 * A filter that can be applied to ThoughtSpot Answers, Liveboards, or
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
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Init, showLoader)
     *  //show a loader
     * function showLoader() {
     * document.getElementById("loader");
     * }
     *```
     * @returns timestamp - The timestamp when the event was generated.
     */
    Init = 'init',
    /**
     * Authentication has either succeeded or failed.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.AuthInit, payload => {
     *    console.log('AuthInit', payload);
     * })
     *```
     * @returns isLoggedIn - A Boolean specifying whether authentication was successful.
     */
    AuthInit = 'authInit',
    /**
     * The embed object container has loaded.
     * @returns timestamp - The timestamp when the event was generated.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Load, hideLoader)
     *    //hide loader
     * function hideLoader() {
     *   document.getElementById("loader");
     * }
     *```
     */
    Load = 'load',
    /**
     * Data pertaining to answer or Liveboard is received
     * @return data - The answer or Liveboard data
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Data, payload => {
     *    console.log('data', payload);
     * })
     *```
     * @important
     */
    Data = 'data',
    /**
     * Search query has been updated by the user.
     * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 8.4.1.sw
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.QueryChanged, payload => console.log('data', payload))
     *```
     */
    QueryChanged = 'queryChanged',
    /**
     * A drill-down operation has been performed.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @returns additionalFilters - Any additional filters applied
     * @returns drillDownColumns - The columns on which drill down was performed
     * @returns nonFilteredColumns - The columns that were not filtered
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.DrillDown, {
     *    points: {
     *        clickedPoint,
     *        selectedPoints: selectedPoint
     *    },
     *    autoDrillDown: true,
     * })
     *```
     * In this example, `VizPointDoubleClick` event is used for
     * triggering the `DrillDown` event when an area or specific
     * data point on a table or chart is double-clicked.
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.VizPointDoubleClick, (payload) => {
     *   console.log(payload);
     *   const clickedPoint = payload.data.clickedPoint;
     *   const selectedPoint = payload.data.selectedPoints;
     *   console.log('>>> called', clickedPoint);
     *   embed.trigger(HostEvent.DrillDown, {
     *      points: {
     *      clickedPoint,
     *          selectedPoints: selectedPoint
     *     },
     *   autoDrillDown: true,
     *     })
     * })
     *```
     */
    Drilldown = 'drillDown',
    /**
     * One or more data sources have been selected.
     * @returns dataSourceIds - the list of data sources
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.DataSourceSelected, payload => {
     *    console.log('DataSourceSelected', payload);
     * })
     * ```
     */
    DataSourceSelected = 'dataSourceSelected',
    /**
     * One or more data columns have been selected.
     * @returns columnIds - the list of columns
     * @version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.AddRemoveColumns, payload => {
     *   console.log('AddRemoveColumns', payload);
     * })
     * ```
     */
    AddRemoveColumns = 'addRemoveColumns',
    /**
     * A custom action has been triggered.
     * @returns actionId - ID of the custom action
     * @returns payload {@link CustomActionPayload} - Response payload with the
     * Answer or Liveboard data
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.customAction, payload => {
     *     const data = payload.data;
     *     if (data.id === 'insert Custom Action ID here') {
     *         console.log('Custom Action event:', data.embedAnswerData);
     *     }
     * })
     * ```
     */
    CustomAction = 'customAction',
    /**
     * Listen to double click actions on a visualization.
     * @return ContextMenuInputPoints - Data point that is double-clicked
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     * @example
     * ```js
     * livebaordEmbed.on(EmbedEvent.VizPointDoubleClick, payload => {
     *      console.log('VizPointDoubleClick', payload);
     * })
     * ```
     */
    VizPointDoubleClick = 'vizPointDoubleClick',
    /**
     * Listen to clicks on a visualization in a Liveboard or Search result.
     * @return viz, clickedPoint - metadata about the point that is clicked
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @important
     * @example
     * ```js
     * embed.on(EmbedEvent.VizPointClick, ({data}) => {
     *   console.log(
     *    data.vizId, // viz id
     *    data.clickedPoint.selectedAttributes[0].value,
     *    data.clickedPoint.selectedAttributes[0].column.name,
     *    data.clickedPoint.selectedMeasures[0].value,
     *    data.clickedPoint.selectedMeasures[0].column.name,
     *   )
     * });
     * ```
     */
    VizPointClick = 'vizPointClick',
    /**
     * An error has occurred. This event is fired for the following error types:
     *
     * `API` - API call failure error.
     * `FULLSCREEN` - Error when presenting a Liveboard or visualization in full screen
     * mode. `SINGLE_VALUE_FILTER` - Error due to multiple values in the single value
     * filter. `NON_EXIST_FILTER` - Error due to a non-existent filter.
     * `INVALID_DATE_VALUE` - Invalid date value error.
     * `INVALID_OPERATOR` - Use of invalid operator during filter application.
     *
     * For more information, see https://developers.thoughtspot.com/docs/events-app-integration#errorType
     * @returns error - An error object or message
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * // API error
     * SearchEmbed.on(EmbedEvent.Error, (error) => {
     *   console.log(error);
     *  // { type: "Error", data: { errorType: "API", error: { message: '...', error: '...' } } }
     * });
     * ```
     * @example
     * ```js
     * // Fullscreen error (Errors during presenting of a liveboard)
     * LiveboardEmbed.on(EmbedEvent.Error, (error) => {
     *   console.log(error);
     *   // { type: "Error", data: { errorType: "FULLSCREEN", error: {
     *   //   message: "Fullscreen API is not enabled",
     *   //   stack: "..."
     *   // } }}
     * })
     * ```
     */
    Error = 'Error',
    /**
     * The embedded object has sent an alert.
     * @returns alert - An alert object
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.Alert)
     * ```
     */
    Alert = 'alert',
    /**
     * The ThoughtSpot auth session has expired.
     * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.AuthExpire, showAuthExpired)
     * //show auth expired banner
     * function showAuthExpired() {
     *    document.getElementById("authExpiredBanner");
     * }
     *```
     */
    AuthExpire = 'ThoughtspotAuthExpired',
    /**
     * ThoughtSpot failed to validate the auth session.
     * @hidden
     */
    AuthFailure = 'ThoughtspotAuthFailure',
    /**
     * ThoughtSpot failed to validate the auth session.
     * @hidden
     */
    AuthLogout = 'ThoughtspotAuthLogout',
    /**
     * The height of the embedded Liveboard or visualization has been computed.
     * @returns data - The height of the embedded Liveboard or visualization
     * @hidden
     */
    EmbedHeight = 'EMBED_HEIGHT',
    /**
     * The center of visible iframe viewport is calculated.
     * @returns data - The center of the visible Iframe viewport.
     * @hidden
     */
    EmbedIframeCenter = 'EmbedIframeCenter',
    /**
     * Emitted when the **Get Data** action is initiated.
     * Applicable to `SearchBarEmbed` only.
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     * @example
     *```js
     * searchbarEmbed.on(EmbedEvent.GetDataClick)
     *  .then(data => {
     *  console.log('Answer Data:', data);
     * })
     *```
     */
    GetDataClick = 'getDataClick',
    /**
     * Detects the route change.
     * @version SDK: 1.7.0 | ThoughtSpot: 8.0.0.cl, 8.4.1.sw
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.RouteChange, payload =>
     *    console.log('data', payload))
     *```
     */
    RouteChange = 'ROUTE_CHANGE',
    /**
     * The v1 event type for Data
     * @hidden
     */
    V1Data = 'exportVizDataToParent',
    /**
     * Emitted when the embed does not have cookie access. This happens
     * when Safari and other Web browsers block third-party cookies
     * are blocked by default. `NoCookieAccess` can trigger
     * @example
     *```js
     * appEmbed.on(EmbedEvent.NoCookieAccess)
     *```
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 7.2.1.sw
     */
    NoCookieAccess = 'noCookieAccess',
    /**
     * Emitted when SAML is complete
     * @private
     * @hidden
     */
    SAMLComplete = 'samlComplete',
    /**
     * Emitted when any modal is opened in the app
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.DialogOpen, payload => {
     *    console.log('dialog open', payload);
     *  })
     *```
     */
    DialogOpen = 'dialog-open',
    /**
     * Emitted when any modal is closed in the app
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.DialogClose, payload => {
     *     console.log('dialog close', payload);
     * })
     *```
     */
    DialogClose = 'dialog-close',
    /**
     * Emitted when the Liveboard shell loads.
     * You can use this event as a hook to trigger
     * other events on the rendered Liveboard.
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.LiveboardRendered, payload => {
           console.log('Liveboard is rendered', payload);
       })
     *```
     * The following example shows how to trigger
     * `SetVisibleVizs` event using LiveboardRendered embed event:
     * @example
     *```js
     * const embedRef = useEmbedRef();
     * const onLiveboardRendered = () => {
     * embed.trigger(HostEvent.SetVisibleVizs, ['viz1', 'viz2']);
     * };
     *```
     */
    LiveboardRendered = 'PinboardRendered',
    /**
     * Emits all events.
     * @Version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.ALL, payload => {
     *  console.log('Embed Events', payload)
     * })
     *```
     */
    ALL = '*',
    /**
     * Emitted when an Answer is saved in the app
     * @Version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //Emit when action starts
     *  searchEmbed.on(EmbedEvent.Save, payload => {
     *    console.log('Save', payload)
     *  }, {
     *    start: true
     * })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.Save, payload => {
     *    console.log('Save', payload)
     * })
     *```
     */
    Save = 'save',
    /**
     * Emitted when the download action is triggered on an answer
     *
     * **Note**: This event is deprecated in v1.21.0.
     * To fire an event when a download action is initiated on a chart or table,
     * use `EmbedEvent.DownloadAsPng`, `EmbedEvent.DownloadAsPDF`, `EmbedEvent.DownloadAsCSV`,
     * or `EmbedEvent.DownloadAsXLSX`
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Download, {
     * vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     *```
     */
    Download = 'download',
    /**
     * Emitted when the download action is triggered on an answer
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.0.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsPng, payload => {
     *   console.log('download PNG', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsPng, payload => {
     *   console.log('download PNG', payload)})
     *```
     */
    DownloadAsPng = 'downloadAsPng',
    /**
     * Emitted when the Download as PDF action is triggered on an answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsPdf, payload => {
     *   console.log('download PDF', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsPdf, payload => {
     *   console.log('download PDF', payload)})
     *```
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * Emitted when the Download as CSV action is triggered on an answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsCSV, payload => {
     *   console.log('download CSV', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsCSV, payload => {
     *    console.log('download CSV', payload)})
     *```
     */
    DownloadAsCsv = 'downloadAsCsv',
    /**
     * Emitted when the Download as XLSX action is triggered on an answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsXlsx, payload => {
     *   console.log('download Xlsx', payload)}, { start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsXlsx, payload => {
     *   console.log('download Xlsx', payload)})
     *```
     */
    DownloadAsXlsx = 'downloadAsXlsx',
    /**
     * Emitted when an Answer is deleted in the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * appEmbed.on(EmbedEvent.AnswerDelete, payload => {
     *    console.log('delete answer', payload)}, {start: true })
     * //trigger when action is completed
     * appEmbed.on(EmbedEvent.AnswerDelete, payload => {
     *    console.log('delete answer', payload)})
     *```
     */
    AnswerDelete = 'answerDelete',
    /**
     * Emitted when an answer is pinned to a Liveboard
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.Pin, payload => {
     *    console.log('pin', payload)
     * }, {
     * start: true
     * })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.Pin, payload => {
     *    console.log('pin', payload)
     * })
     *```
     */
    Pin = 'pin',
    /**
     * Emitted when SpotIQ analysis is triggered
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.SpotIQAnalyze, payload => {
     *   console.log('SpotIQAnalyze', payload)
     * }, {
     * start: true
     * })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.SpotIQAnalyze, payload => {
     *   console.log('SpotIQ analyze', payload)
     * })
     *```
     */
    SpotIQAnalyze = 'spotIQAnalyze',
    /**
     * Emitted when a user shares an object with another user or group
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.Share, payload => {
     *    console.log('Share', payload)
     * }, {
     * start: true
     * })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.Share, payload => {
     *   console.log('Share', payload)
     * })
     *```
     */
    Share = 'share',
    /**
     * Emitted when a user clicks the **Include** action to include a specific value or
     * data on a chart or table.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.DrillInclude, payload => {
     *    console.log('Drill include', payload);
     * })
     *```
     */
    DrillInclude = 'context-menu-item-include',
    /**
     * Emitted when a user clicks the **Exclude** action to exclude a specific value or
     * data on a chart or table
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.DrillExclude, payload => {
     *     console.log('Drill exclude', payload);
     * })
     *```
     */
    DrillExclude = 'context-menu-item-exclude',
    /**
     * Emitted when a column value is copied in the embedded app.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * seachEmbed.on(EmbedEvent.CopyToClipboard, payload => {
     *    console.log('copy to clipboard', payload);
     * })
     *```
     */
    CopyToClipboard = 'context-menu-item-copy-to-clipboard',
    /**
     * Emitted when a user clicks the **Update TML** action on
     * embedded Liveboard.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.UpdateTML)
     * })
     *```
     */
    UpdateTML = 'updateTSL',
    /**
     * Emitted when a user clicks the **Edit TML** action
     * on an embedded Liveboard.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.EditTML, payload => {
     *    console.log('Edit TML', payload);
     * })
     *```
     */
    EditTML = 'editTSL',
    /**
     * Emitted when the **Export TML** action is triggered on an
     * an embedded object in the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.ExportTML, payload => {
     *     console.log('Export TML', payload)}, { start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.ExportTML, payload => {
     *     console.log('Export TML', payload)})
     *```
     */
    ExportTML = 'exportTSL',
    /**
     * Emitted when an Answer is saved as a View.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.SaveAsView, payload => {
     *    console.log('View', payload);
     * })
     *```
     */
    SaveAsView = 'saveAsView',
    /**
     * Emitted when the user creates a copy of an Answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * appEmbed.on(EmbedEvent.CopyAEdit, payload => {
     *    console.log('Copy and edit', payload)}, {start: true })
     * //emit when action ends
     * appEmbed.on(EmbedEvent.CopyAEdit, payload => {
     *    console.log('Copy and edit', payload)})
     *```
     */
    CopyAEdit = 'copyAEdit',
    /**
     * Emitted when a user clicks Show underlying data on an Answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.ShowUnderlyingData, payload => {
     *    console.log('show data', payload);
     * })
     *```
     */
    ShowUnderlyingData = 'showUnderlyingData',
    /**
     * Emitted when an answer is switched to a chart or table view.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.AnswerChartSwitcher, payload => {
     *    console.log('switch view', payload);
     * })
     *```
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
    /**
     * Internal event to communicate the initial settings back to the ThoughtSpot app
     * @hidden
     */
    APP_INIT = 'appInit',
    /**
     * Emitted when a user clicks **Show Liveboard details** on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.AnswerChartSwitcher, payload => {
     *    console.log('Liveboard details', payload);
     * })
     *```
     */
    LiveboardInfo = 'pinboardInfo',
    /**
     * Emitted when a user clicks on the Favorite icon on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.AddToFavorites, payload => {
     *    console.log('favorites', payload);
     * })
     *```
     */
    AddToFavorites = 'addToFavorites',
    /**
     * Emitted when a user clicks **Schedule** on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Schedule, payload => {
     *    console.log(`Liveboard schedule', payload);
     * })
     *```
     */
    Schedule = 'subscription',
    /**
     * Emitted when a user clicks **Edit** on a Liveboard or visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Edit, payload => {
     *    console.log(`Liveboard edit', payload);
     * })
     *```
     */
    Edit = 'edit',
    /**
     * Emitted when a user clicks *Make a copy* on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.MakeACopy, payload => {
     *    console.log(`Copy', payload);
     * })
     *```
     */
    MakeACopy = 'makeACopy',
    /**
     * Emitted when a user clicks **Present** on a Liveboard or visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Present)
     *```
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Present, {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * })
     *```
     */
    Present = 'present',
    /**
     * Emitted when a user clicks **Delete** on a visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Delete,
     *   {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
    Delete = 'delete',
    /**
     * Emitted when a user clicks Manage schedules on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.SchedulesList)
     *```
     */
    SchedulesList = 'schedule-list',
    /**
     * Emitted when a user clicks **Cancel** in edit mode on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Cancel)
     *```
     */
    Cancel = 'cancel',
    /**
     * Emitted when a user clicks **Explore** on a visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Explore,  {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
    Explore = 'explore',
    /**
     * Emitted when a user clicks **Copy link** action on a visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.CopyLink, {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
    CopyLink = 'embedDocument',
    /**
     * Emitted when a user interacts with cross filters on a visualization or Liveboard
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     *```js
     * liveboardEmbed.trigger(HostEvent.CrossFilterChanged, {
     *    vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
    CrossFilterChanged = 'cross-filter-changed',
    /**
     * Emitted when a user right clicks on a visualization (chart or table)
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     *```js
     * LiveboardEmbed.on(EmbedEvent.VizPointRightClick, payload => {
     *    console.log('VizPointClick', payload)
     * })
     *```
     */
    VizPointRightClick = 'vizPointRightClick',
    /**
     * Emitted when a user clicks **Insert to slide** on a visualization
     * @hidden
     */
    InsertIntoSlide = 'insertInToSlide',
    /**
     * Emitted when a user changes any filter on a Liveboard.
     * Returns filter type and name, column name and ID, and runtime
     * filter details.
     * @example
     *
     *```js
     * LiveboardEmbed.on(EmbedEvent.FilterChanged, (payload) => {
     *    console.log('payload', payload);
     * })
     *
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl, 9.5.0.sw
     */
    FilterChanged = 'filterChanged',
    /**
     *  Emitted when a user clicks the **Go** button on the Search page
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     */
    SageEmbedQuery = 'sageEmbedQuery',
    /**
     * Emitted when a user selects a data source.
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     */
    SageWorksheetUpdated = 'sageWorksheetUpdated',
    /**
     * Emitted when a user updates a connection on the **Data** page
     * @version SDK : 1.27.0 | Thoughtspot: 9.8.0.cl, 9.8.0.sw
     */
    UpdateConnection = 'updateConnection',
    /**
     * Emitted when a user updates a connection on the **Data** page
     * @version SDK : 1.27.0 | Thoughtspot: 9.8.0.cl, 9.8.0.sw
     */
    CreateConnection = 'createConnection',
    /**
     * Emitted when name, status (private or public) or filter values of a
     * Personalised view is updated.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     */
    UpdatePersonalisedView = 'updatePersonalisedView',
    /**
     * Emitted when a Personalised view is saved.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     */
    SavePersonalisedView = 'savePersonalisedView',
    /**
     * Emitted when a Liveboard is reset.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     */
    ResetLiveboard = 'resetLiveboard',
    /**
     * Emitted when a PersonalisedView is deleted.
     * @returns views: string[]
     * @returns liveboardId: string
     * @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl, 9.8.0.sw
     */
    DeletePersonalisedView = 'deletePersonalisedView',
    /**
     * Emitted when a user creates a new worksheet
     * @version SDK : 1.27.0 | Thoughtspot: 9.8.0.cl
     */
    CreateWorksheet = 'createWorksheet',
    /**
     * Emitted when Ask Sage is initialized.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.29.0 | Thoughtspot: 9.12.0.cl
     */
    AskSageInit = 'AskSageInit',
    /**
     * Emitted when a LB/viz is renamed
     * @version SDK : 1.28.0 | ThoughtSpot: 9.10.5.cl
     */
    Rename = 'rename',
    /**
     * Emitted when user wants to intercept the search execution
     *
     * Set IsOnBeforeGetVizDataInterceptEnabled : true to use
     * this embed event
     *
     *```js
     * searchEmbed.on(EmbedEvent.OnBeforeGetVizDataIntercept,
     * (payload, responder) => {
     *  responder({
     *      data: {
     *          execute: true,
     *   }})
     * })
     *```
     * @version SDK : 1.29.0 | Thoughtspot : 10.2.0.cl
     */
    OnBeforeGetVizDataIntercept = 'onBeforeGetVizDataIntercept',
    /**
     * Emitted when parameter changes in an answer
     * or liveboard
     *
     * ```js
     * liveboardEmbed.on(EmbedEvent.ParameterChanged, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK : 1.29.0 | Thoughtspot : 10.2.0.cl
     */
    ParameterChanged = 'parameterChanged',
}

/**
 * Event types that can be triggered by the host application
 * to the embedded ThoughtSpot app
 *
 * To trigger an event use the corresponding
 * {@link LiveboardEmbed.trigger} or {@link AppEmbed.trigger} or {@link
 * SearchEmbed.trigger} method.
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
     * Triggers a search operation with the search tokens specified in
     * the search query string.
     * Supported in `AppEmbed` and `SearchEmbed` deployments.
     * Includes the following properties:
     * @param - `searchQuery` - query string with search tokens
     * @param - `dataSources` - Data source GUID to Search on
     *                        - Although an array, only a single source
     *                          is supported.
     * @param - `execute` - executes search and updates the existing query
     * @example
     * ```js
     * searchembed.trigger(HostEvent.Search, {
         searchQuery: "[sales] by [item type]",
         dataSources: ["cd252e5c-b552-49a8-821d-3eadaa049cca"],
         execute: true
       });
     * ```
     */
    Search = 'search',
    /**
     * Triggers a drill on certain points of the specified column
     * Includes the following properties:
     * @param - points - an object containing selectedPoints/clickedPoints
     * to drill to. For example, { selectedPoints: []}
     * @param - columnGuid - Optional. GUID of the column to drill
     * by. If not provided it will auto drill by the configured
     *   column.
     * @param - autoDrillDown - Optional. If true, the drill down will be
     * done automatically on the most popular column.
     * @param - vizId [TS >= 9.8.0] - Optional. The GUID of the visualization to drill
     * in case of a liveboard.
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
     * @example
     * ```js
     *  // Works with TS 9.8.0 and above
     *
     *  liveboardEmbed.on(EmbedEvent.VizPointDoubleClick, (payload) => {
     *    console.log(payload);
     *    const clickedPoint = payload.data.clickedPoint;
     *    const selectedPoint = payload.data.selectedPoints;
     *    console.log('>>> called', clickedPoint);
     *    liveboardEmbed.trigger(HostEvent.DrillDown, {
     *      points: {
     *        clickedPoint,
     *        selectedPoints: selectedPoint
     *      },
     *      columnGuid: "<guid of the column to drill>",
     *      vizId: payload.data.vizId
     *    });
     *  })
     * ```
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     */
    DrillDown = 'triggerDrillDown',
    /**
     * Apply filters
     * @hidden
     */
    Filter = 'filter',
    /**
     * Reload the answer or visualization
     * @hidden
     */
    Reload = 'reload',
    /**
     * Get current iframe src
     * @hidden
     */
    GetIframeSrc = 'getIframeSrc',
    /**
     * Display specific visualizations on a Liveboard.
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
     * Set a Liveboard tab as an active tab.
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
     * Update runtime filters applied on a Saved Answer or Liveboard. The
     * runtime filters passed here are appended to the existing runtime
     * filters.
     * Pass an array of runtime filters with the following attributes:
     *
     * `columnName`
     * _String_. The name of the column to filter on.
     *
     * `operator`
     * Runtime filter operator to apply. For information,
     * see link:https://developers.thoughtspot.com/docs/?pageid=runtime-filters#rtOperator[Developer Documentation].
     *
     * `values`
     * List of operands. Some operators such as EQ, LE allow a single value, whereas
     * operators such as BW and IN accept multiple operands.
     *
     * **Note**: `HostEvent.UpdateRuntimeFilters` is not supported in
     * Search embedding (SearchEmbed) and Natural Language Search
     * embedding (SageEmbed).
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
     * Navigate to a specific page in the embedded ThoughtSpot application.
     * This is the same as calling `appEmbed.navigateToPage(path, true)`
     * @param - `path` - the path to navigate to to go forward or back. The path value can
     * be a number; for example, `1`, `-1`.
     * @example
     * ```js
     * appEmbed.navigateToPage(-1)
     * ```
     * @version SDK: 1.12.0 | ThoughtSpot 8.4.0.cl, 8.4.1.sw
     */
    Navigate = 'Navigate',
    /**
     * Open the filter panel for a particular column.
     * Works with Search and Liveboard embed.
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
     * Add columns to the current search query.
     * @param - { columnIds: string[] }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.AddColumns, { columnIds: ['<column-GUID>','<column-GUID>'] })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    AddColumns = 'addColumns',
    /**
     * Remove a column from the current search query.
     * @param - { columnId: string }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.RemoveColumn, { columnId: '<column-Guid>' })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    RemoveColumn = 'removeColumn',
    /**
     * Get the transient state of a Liveboard as encoded content.
     * This includes unsaved and ad hoc changes such as
     * Liveboard filters, runtime filters applied on visualizations on a
     * Liveboard, and Liveboard layout, changes to visualizations such as
     * sorting, toggling of legends, and data drill down.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.getExportRequestForCurrentPinboard).then(
     * data=>console.log(data))
     * ```
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1.sw
     */
    getExportRequestForCurrentPinboard = 'getExportRequestForCurrentPinboard',
    /**
     * Trigger the **Pin** action on an embedded object
     * @param - Liveboard embed takes the `vizId` as a
     * key. Can be left undefined when embedding Search, full app, or
     * a visualization.
     * @example
     * ```js
     * appEmbed.trigger(HostEvent.Pin)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Pin)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Pin = 'pin',
    /**
     * Trigger the **Show Liveboard details** action
     * on an embedded Liveboard.
     * @example
     *```js
     * liveboardEmbed.trigger(HostEvent.LiveboardInfo)
     *```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    LiveboardInfo = 'pinboardInfo',
    /**
     * Trigger the **Schedule** action on an embedded Liveboard.
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.Schedule)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Schedule = 'subscription',
    /**
     * Trigger the **Manage schedule** action on an embedded Liveboard
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.ScheduleList)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    SchedulesList = 'schedule-list',
    /**
     * Trigger the **Export TML** action on an embedded Liveboard or
     * Answer.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ExportTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    ExportTML = 'exportTSL',
    /**
     * Trigger the **Edit TML** action on an embedded Liveboard or
     * saved Answers in the full application embedding.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.EditTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    EditTML = 'editTSL',
    /**
     * Trigger the **Update TML** action on an embedded Liveboard.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    UpdateTML = 'updateTSL',
    /**
     * Trigger the **Download PDF** action on an embedded Liveboard,
     * visualization or Answer.
     *
     * **NOTE**: The **Download** > **PDF** action is available on
     * visualizations and Answers if the data is in tabular format.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsPdf)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * Trigger the **Make a copy** action on a Liveboard,
     * visualization, or Answer page.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.MakeACopy)
     * ```
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.MakeACopy, {
     * vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     *
     * @example
     * ```js
     * vizEmbed.trigger(HostEvent.MakeACopy)
     * ```
     *
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.MakeACopy)
     * ```
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    MakeACopy = 'makeACopy',
    /**
     * Trigger the **Delete** action for a Liveboard.
     * @example
     * ```js
     * appEmbed.trigger(HostEvent.Remove)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Remove = 'delete',
    /**
     * Trigger the **Explore** action on a visualization.
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Explore, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Explore = 'explore',
    /**
     * Trigger the **Create alert** action on a KPI chart
     * in a Liveboard or saved Answer.
     *
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.CreateMonitor {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     *
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.CreateMonitor)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    CreateMonitor = 'createMonitor',
    /**
     * Trigger the **Manage alerts** action on a KPI chart
     * in a visualization or saved Answer.
     *
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ManageMonitor, {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     *
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.ManageMonitor)
     * ```
     *
     * @example
     * ```js
     * vizEmbed.trigger(HostEvent.ManageMonitor)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    ManageMonitor = 'manageMonitor',
    /**
     * Trigger the **Edit** action on a Liveboard or a visualization
     * on a Liveboard.
     *
     * This event is not supported in visualization embed and search embed.
     * @param - object - To trigger the action for a specific visualization
     * in Liveboard embed, pass in `vizId` as a key.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    Edit = 'edit',
    /**
     * Trigger the **Copy link** action on a Liveboard or visualization
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
     * Trigger the **Present** action on a Liveboard or visualization
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
     * Get TML for the current search.
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.GetTML).then((tml) => {
     *   console.log(
     *      tml.answer.search_query // TML representation of the search query
     *   );
     * })
     * ```
     * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     * @important
     */
    GetTML = 'getTML',
    /**
     * Trigger the **Show underlying data** action on visualization or search
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
     * Trigger the **Delete** action for a visualization
     * in an embedded Liveboard, or a chart or table
     * generated from Search.
     * @param - Liveboard embed takes an object with `vizId` as a key.
     * Can be left empty if embedding Search or visualization.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Delete, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Delete)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    Delete = 'onDeleteAnswer',
    /**
     * Trigger the **SpotIQ analyze** action on visualization
     * or search.
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
     * Trigger the **Download** action on charts in
     * the embedded view.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Download, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * embed.trigger(HostEvent.Download)
     * ```
     * @deprecated from SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl ,9.4.1.sw
     * Use {@link DownloadAsPng}
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    Download = 'downloadAsPng',
    /**
     * Trigger the **Download** > **PNG** action on
     * charts in the embedded view.
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
     * Trigger the **Download** > **CSV**  action on tables in
     * the embedded view.
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
     * Trigger the **Download** > **XLSX**  action on tables
     * in the embedded view.
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
     * Trigger the **Share** action on an embedded
     * Liveboard or Answer.
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
     * Trigger the **Save**  action on a Liveboard or Answer.
     * Saves the changes.
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
     * Trigger the **Sync to Sheets** action on an embedded visualization or Answer
     * Sends data from an Answer or Liveboard visualization to a Google sheet.
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
     * Trigger the **Sync to Other Apps** action on an embedded visualization or Answer
     * Sends data from an Answer or Liveboard visualization to third-party apps such
     * as Slack, Salesforce, Microsoft Teams, ServiceNow and so on.
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
     * Trigger the **Manage pipelines** action on an embedded
     * visualization or Answer.
     * Allows users to manage ThoughtSpot Sync pipelines.
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
     * Reset search operation on the Search or Answer page.
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.ResetSearch)
     * ```
     * ```js
     * appEmbed.trigger(HostEvent.ResetSearch)
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.0.1.sw
     */
    ResetSearch = 'resetSearch',
    /**
     * Get details of filters applied on the Liveboard.
     * Returns arrays containing Liveboard filter and runtime filter elements.
     * @example
     * ```js
     * const data = await liveboardEmbed.trigger(HostEvent.GetFilters);
     *     console.log('data', data);
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    GetFilters = 'getFilters',
    /**
     * Update one or several filters applied on a Liveboard.
     * @param - `filter`: a single filter object containing column name,
     * filter operator, and values.
     * @param - `filters`: multiple filter objects with column name, filter operator,
     * and values for each.
     *
     * Each filter object must include the following attributes:
     *
     * `column` - Name of the column to filter on.
     *
     * `oper`  - Filter operator, for example, EQ, IN, CONTAINS.
     *  For information about the supported filter operators,
     *  see link:https://developers.thoughtspot.com/docs/runtime-filters#rtOperator[Developer Documentation].
     *
     * `values` - An array of one or several values. The value definition on the
     *  data type you choose to filter on. For a complete list of supported data types,
     *  see link:https://developers.thoughtspot.com/docs/runtime-filters#_supported_data_types[Developer Documentation].
     * @example
     * ```js
     *
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *     filter: {
     *         column: "item type",
     *         oper: "IN",
     *         values: ["bags","shirts"],
     *        }
     *    });
     * ```
     * @example
     *
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *  filters: [{
     *      column: "Item Type",
     *      oper: 'IN',
     *      values: ["bags","shirts"]
     *  },
     *    {
     *      column: "Region",
     *      oper: 'IN',
     *      values: ["West","Midwest"]
     *  },
     *    {
     *      column: "Date",
     *      oper: 'EQ',
     *      values: ["1656680400"]
     *    }]
     * });
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    UpdateFilters = 'updateFilters',
    /**
     * Get tab details for the current Liveboard.
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
     * Set the visible tabs on a Liveboard.
     * @param - an array of ids of tabs to show, the IDs not passed
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
     * @param - an array of the IDs of the tabs to hide.
     * The IDs not passed will be shown.
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
     * Updates the search query string for Natural Language Search operations.
     * @param - `queryString`: Text string in Natural Language format
     * @param - `executeSearch`: Boolean to execute search and update search query
     * @example
     * ```js
     * sageEmbed.trigger(HostEvent.UpdateSageQuery, {
     *  queryString: 'revenue per year',
     *  executeSearch: true,
     * })
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.8.0.cl, 9.8.0.sw
     */
    UpdateSageQuery = 'updateSageQuery',
    /**
     * Get the answer session for a Search or
     * Liveboard visualization.
     *
     * @example
     * ```js
     * const {session} = await embed.trigger(
     *  HostEvent.GetAnswerSession, {
     *      vizId: '123', // For Liveboard Visualization.
     *  })
     * ```
     *
     * @example
     * ```js
     * const {session} = await embed.trigger( HostEvent.GetAnswerSession )
     * ```
     *
     * @version SDK: 1.26.0 | Thoughtspot: 9.10.0.cl
     */
    GetAnswerSession = 'getAnswerSession',
    /**
     * Trigger Ask Sage for viz
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.AskSage,
     * {vizId:'730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.29.0 | Thoughtspot: 9.12.0.cl
     */
    AskSage = 'AskSage',
    /**
     * Trigger UpdateCrossFilter for Liveboard
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateCrossFilter, {
     *      vizId: 'b535c760-8bbe-4e6f-bb26-af56b4129a1e',
     *      conditions: [
     *      { columnName: 'Category', values: ['mfgr#12','mfgr#14'] },
     *      { columnName: 'color', values: ['mint','hot'] },
     *    ],
     * });
     * ```
     * @version SDK: 1.29.0 | Thoughtspot: 10.0.0.cl
     */
    UpdateCrossFilter = 'UpdateCrossFilter',
    /**
     * Trigger ResetLiveboardPersonalisedView for Liveboard
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ResetLiveboardPersonalisedView);
     * ```
     * @version SDK: 1.29.0 | Thoughtspot: 10.1.0.cl
     */
    ResetLiveboardPersonalisedView = 'ResetLiveboardPersonalisedView',
    /**
     * Triggers Update RuntimeParameters for answers and liveboard
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateParameters, [{
     * name: "Color",
     * value: "almond"
     * }])
     *
     * @version SDK: 1.29.0 | Thoughtspot: 10.1.0.cl
     */
    UpdateParameters = 'UpdateParameters',
    /**
     * Triggers GetParameters to fetch the runtime parameters
     * ```js
     * liveboardEmbed.trigger(HostEvent.GetParameters).then((parameter) => {
     *  console.log('parameters', parameter);
     * });
     *```
     * @version SDK: 1.29.0 | Thoughtspot: 10.1.0.cl
     */
    GetParameters = 'GetParameters',
}

/**
 * The different visual modes that the data sources panel within
 * search could appear in, such as hidden, collapsed, or expanded.
 */
// eslint-disable-next-line no-shadow
export enum DataSourceVisualMode {
    /**
     * The data source panel is hidden.
     */
    Hidden = 'hide',
    /**
     * The data source panel is collapsed, but the user can manually expand it.
     */
    Collapsed = 'collapse',
    /**
     * The data source panel is expanded, but the user can manually collapse it.
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
    HideAutocompleteSuggestions = 'hideAutocompleteSuggestions',
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
    LiveboardHeaderSticky = 'isLiveboardHeaderSticky',
    IsProductTour = 'isProductTour',
    HideSearchBarTitle = 'hideSearchBarTitle',
    HideSageAnswerHeader = 'hideSageAnswerHeader',
    HideSearchBar = 'hideSearchBar',
    ClientLogLevel = 'clientLogLevel',
    OverrideNativeConsole = 'overrideConsoleLogs',
    enableAskSage = 'enableAskSage',
    CollapseSearchBarInitially = 'collapseSearchBarInitially',
    DataPanelCustomGroupsAccordionInitialState = 'dataPanelCustomGroupsAccordionInitialState',
    EnableCustomColumnGroups = 'enableCustomColumnGroups',
    DateFormatLocale = 'dateFormatLocale',
    NumberFormatLocale = 'numberFormatLocale',
    CurrencyFormat = 'currencyFormat',
    Enable2ColumnLayout = 'enable2ColumnLayout',
    IsFullAppEmbed = 'isFullAppEmbed',
    IsOnBeforeGetVizDataInterceptEnabled = 'isOnBeforeGetVizDataInterceptEnabled',
    FocusSearchBarOnRender = 'focusSearchBarOnRender',
    DisableRedirectionLinksInNewTab = 'disableRedirectionLinksInNewTab',
    HomePageSearchBarMode = 'homePageSearchBarMode',
}

/**
 * ThoughtSpot application pages include actions and menu commands
 * for various user-initiated operations. These actions are represented
 * as enumeration members in the SDK. To show, hide, or disable
 * specific actions in the embedded view, define the Action
 * enumeration members in the `disabledActions`, `visibleActions`,
 * or `hiddenActions` array.
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
     * @example
     * ```js
     * disabledActions: [Action.Save]
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
     * page. Saves an Answer as a View object in the full
     * application embedding mode.
     * @example
     * ```js
     * disabledActions: [Action.SaveAsView]
     * ```
     */
    SaveAsView = 'saveAsView',
    /**
     * The **Make a copy** action on a Liveboard or Answer
     * page. Creates a copy of the Liveboard.
     * In LiveboardEmbed, the **Make a copy** action is not available for
     * visualizations in the embedded Liveboard view.
     * In AppEmbed, the **Make a copy** action is available on both
     * Liveboards and visualizations.
     * @example
     * ```js
     * disabledActions: [Action.MakeACopy]
     * ```
     */
    MakeACopy = 'makeACopy',
    /**
     * The **Copy and Edit** action on a Liveboard.
     * This action is now replaced with `Action.MakeACopy`.
     * @example
     * ```js
     * disabledActions: [Action.EditACopy]
     * ```
     */
    EditACopy = 'editACopy',
    /**
     * The **Copy link** menu action on a Liveboard visualization.
     * Copies the visualization URL
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
     * @example
     * ```js
     * disabledActions: [Action.Schedule]
     * ```
     */
    Schedule = 'subscription',
    /**
     * The **Manage schedules** menu action on a Liveboard.
     * Allows users to manage scheduled Liveboard jobs.
     * @example
     * ```js
     * disabledActions: [Action.SchedulesList]
     * ```
     */
    SchedulesList = 'schedule-list',
    /**
     * The **Share** action on a Liveboard, Answer, or Worksheet.
     * Allows users to share an object with other users and groups.
     * @example
     * ```js
     * disabledActions: [Action.Share]
     * ```
     */
    Share = 'share',
    /**
     * The **Add filter** action on a Liveboard and Search page.
     * Allows adding filters to Answers and visualizations on a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.AddFilter]
     * ```
     */
    AddFilter = 'addFilter',
    /**
     * The **Add Data Panel Objects** action on the data panel v2.
     * Allows to show action menu to add different objects (like
     * formulas, parameters) in data panel v2.
     * @example
     * ```js
     * disabledActions: [Action.AddDataPanelObjects]
     * ```
     * @version SDK: 1.32.0 | Thoughtspot: 10.0.0.cl
     */
    AddDataPanelObjects = 'addDataPanelObjects',
    /**
     * Filter configuration options on a Liveboard and Search page.
     * Allows configuring filter options when adding filters to a
     * Liveboard or Answer.
     * @example
     * ```js
     * disabledActions: [Action.ConfigureFilter]
     * ```
     */
    ConfigureFilter = 'configureFilter',
    CollapseDataSources = 'collapseDataSources',
    CollapseDataPanel = 'collapseDataPanel',
    /**
     * The **Choose sources** button on Search page.
     * Allows selecting data sources for search queries.
     * @example
     * ```js
     * disabledActions: [Action.ChooseDataSources]
     * ```
     */
    ChooseDataSources = 'chooseDataSources',
    /**
     * The **Create formula** action on a Search or Answer page.
     * Allows adding formulas to an Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddFormula]
     * ```
     */
    AddFormula = 'addFormula',
    /**
     * The **Add parameter** action on a Liveboard or Answer.
     * Allows adding Parameters to a Liveboard or Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddParameter]
     * ```
     */
    AddParameter = 'addParameter',
    /**
     * The **Add Column Set** action on a Answer.
     * Allows adding column sets to a Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddColumnSet]
     * ```
     * @version SDK: 1.32.0 | Thoughtspot: 10.0.0.cl
     */
    AddColumnSet = 'addSimpleCohort',
    /**
     * The **Add Query Set** action on a Answer.
     * Allows adding query sets to a Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddQuerySet]
     * ```
     * @version SDK: 1.32.0 | Thoughtspot: 10.0.0.cl
     */
    AddQuerySet = 'addAdvancedCohort',
    /**
     * @hidden
     */
    SearchOnTop = 'searchOnTop',
    /**
     * The **SpotIQ analyze** menu action on a visualization or
     * Answer page.
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
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPng]
     * ```
     */
    DownloadAsPng = 'downloadAsPng',
    /**
     *
     *The **Download PDF** action that downloads a Liveboard,
     *visualization, or Answer as a PDF file.
     *
     *
     ***NOTE**: The **Download** > **PDF** action is available on
     *visualizations and Answers if the data is in tabular format.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPdf]
     * ```
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * The **Download** > **CSV** menu action for tables on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer in the XLSX format.
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
     * @example
     * ```js
     * disabledActions: [Action.ExportTML]
     * ```
     */
    ExportTML = 'exportTSL',
    /**
     * The **Import TML** menu action for Liveboards and Answers.
     * Imports TML representation of ThoughtSpot objects.
     * @example
     * ```js
     * disabledActions: [Action.ImportTML]
     * ```
     */
    ImportTML = 'importTSL',
    /**
     * The **Update TML** menu action for Liveboards and Answers.
     * Update TML representation of ThoughtSpot objects.
     * @example
     * ```js
     * disabledActions: [Action.UpdateTML]
     * ```
     */
    UpdateTML = 'updateTSL',
    /**
     * The **Edit TML** menu action for Liveboards and Answers.
     * Opens the TML editor.
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
     * @example
     * ```js
     * disabledActions: [Action.Present]
     * ```
     */
    Present = 'present',
    /**
     * The tile resize options in the visualization menu.
     * Allows switching between different preset layouts.
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
     * @example
     * ```js
     * disabledActions: [Action.Edit]
     * ```
     */
    Edit = 'edit',
    /**
     * The text edit option for Liveboard and visualization titles.
     * @example
     * ```js
     * disabledActions: [Action.EditTitle]
     * ```
     */
    EditTitle = 'editTitle',
    /**
     * The **Delete** menu action on Liveboards and visualizations.
     * Deletes a Liveboard or a visualization from a Liveboard.
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
     * @example
     * ```js
     * disabledActions: [Action.Subscription]
     * ```
     */
    Subscription = 'subscription',
    /**
     * The **Explore** action on Liveboard visualizations
     * @example
     * ```js
     * disabledActions: [Action.Explore]
     * ```
     */
    Explore = 'explore',
    /**
     * The action to include data points on a drilled-down Answer
     * or visualization
     * @example
     * ```js
     * disabledActions: [Action.DrillInclude]
     * ```
     */

    DrillInclude = 'context-menu-item-include',
    /**
     * The action to exclude data points on a drilled-down Answer
     * or visualization
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
     * @example
     * ```js
     * disabledActions: [Action.DrillDown]
     * ```
     */
    DrillDown = 'DRILL',
    /**
     * The request access action on Liveboards.
     * Allows users with view permissions to request edit access to a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.RequestAccess]
     * ```
     */
    RequestAccess = 'requestAccess',
    /**
     * The **Query visualizer** and **Query SQL** buttons in Query details panel
     * of the Answer page
     * @example
     * ```js
     * disabledActions: [Action.QueryDetailsButtons]
     * ```
     */
    QueryDetailsButtons = 'queryDetailsButtons',
    /**
     * The **Delete** action for Answers in the full application
     * embedding mode.
     * @example
     * ```js
     * disabledActions: [Action.AnswerDelete]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    AnswerDelete = 'onDeleteAnswer',
    /**
     * The Chart switcher icon on Answer and visualization pages.
     * @example
     * ```js
     * disabledActions: [Action.AnswerChartSwitcher]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
    /**
     * Favorites icon (*) on Answers, Liveboard, and Data pages
     * @example
     * ```js
     * disabledActions: [Action.AddToFavorites]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    AddToFavorites = 'addToFavorites',
    /**
     * The edit icon on Liveboards (Classic experience).
     * @example
     * ```js
     * disabledActions: [Action.EditDetails]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    EditDetails = 'editDetails',
    /**
     * The Create alert action on KPI charts.
     * @example
     * ```js
     * disabledActions: [Action.CreateMonitor]
     * ```
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    CreateMonitor = 'createMonitor',
    /**
     * @deprecated
     * Reports errors
     *
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
     * @example
     * ```js
     * disabledActions: [Action.CrossFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    CrossFilter = 'context-menu-item-cross-filter',
    /**
     * The **Sync to Slack** action on Liveboard visualizations.
     * Allows sending data to third-party apps Slack
     * @example
     * ```js
     * disabledActions: [Action.SyncToSlack]
     * ```
     * @version @version SDK : 1.32.0 | Thoughtspot: 10.1.0.cl
     */
    SyncToSlack = 'syncToSlack',
    /**
     * The **Sync to Teams** action on Liveboard visualizations.
     * Allows sending data to third-party apps Team
     * @example
     * ```js
     * disabledActions: [Action.SyncToTeams]
     * ```
     * @version @version SDK : 1.32.0 | Thoughtspot: 10.1.0.cl
     */
    SyncToTeams = 'syncToTeams',
    /**
     * The **Remove** action that appears when cross filters are applied
     * on a Liveboard.
     * Removes filters applied o a visualization.
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
     * @example
     * ```js
     * disabledActions: [Action.RenameModalTitleDescription]
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    RenameModalTitleDescription = 'renameModalTitleDescription',
    /**
     *
     * @example
     * ```js
     * disabledActions: [Action.RequestVerification]
     * ```
     *
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl
     */
    RequestVerification = 'requestVerification',
    /**
     *
     * Allows users to mark a Liveboard as verified.
     *
     * @example
     * ```js
     * disabledActions: [Action.MarkAsVerified]
     * ```
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl
     */
    MarkAsVerified = 'markAsVerified',
    /**
     * The **Add Tab** action on a Liveboard.
     * Allows adding a new tab to a Liveboard view.
     *
     * @example
     * ```js
     * disabledActions: [Action.AddTab]
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    AddTab = 'addTab',
    /**
     *
     * Initiates contextual change analysis on KPI charts.
     *
     * @example
     * ```js
     * disabledActions: [Action.EnableContextualChangeAnalysis]
     * ```
     * @version SDK: 1.25.0 | Thoughtspot: 9.6.0.cl
     */
    EnableContextualChangeAnalysis = 'enableContextualChangeAnalysis',
    /**
     *
     * @example
     * ```js
     * disabledActions: [Action.ShowSageQuery]
     * ```
     *
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    ShowSageQuery = 'showSageQuery',
    /**
     *
     * @example
     * ```js
     * disabledActions: [Action.EditSageAnswer]
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    EditSageAnswer = 'editSageAnswer',
    /**
     *
     * This action allows users to send feedback on AI-generated Answers.
     *
     * @example
     * ```js
     * disabledActions: [Action.SageAnswerFeedback]
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    SageAnswerFeedback = 'sageAnswerFeedback',
    /**
     *
     * @example
     * ```js
     * disabledActions: [Action.ModifySageAnswer]
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    ModifySageAnswer = 'modifySageAnswer',
    /**
     * The **Move to Tab** menu action on visualizations in liveboard edit mode.
     * Allows moving a visualization to a different tab.
     * @example
     * ```js
     * disabledActions: [Action.MoveToTab]
     * ```
     */
    MoveToTab = 'onContainerMove',
    /**
     * The **Manage Alertsb** menu action on KPI visualizations.
     * @example
     * ```js
     * disabledActions: [Action.ManageMonitor]
     * ```
     */
    ManageMonitor = 'manageMonitor',
    /**
     * Action ID for Liveboard Personalised Views dropdown
     *  @example
     * ```js
     * disabledActions: [Action.PersonalisedViewsDropdown]
     * ```
     *  @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    PersonalisedViewsDropdown = 'personalisedViewsDropdown',
    /**
     * Action ID for Liveboard Users ( Recently Visited / social proof )
     *  @example
     * ```js
     * disabledActions: [Action.LiveboardUsers]
     * ```
     *  @version SDK : 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    LiveboardUsers = 'liveboardUsers',

    /**
     * Action ID for the Parent TML action
     * The parent action **TML** must be included to access TML-related options
     * within the cascading menu (specific to the answer page)
     * @example
     * ```js
     * // to include specific TML actions
     * visibleActions: [Action.TML, Action.ExportTML, Action.EditTML]
     *
     * ```
     * @example
     * ```js
     * hiddenAction: [Action.TML] // hide all TML actions
     * disabledActions: [Action.TML] // to disable all TML actions
     * ```
     * @version SDK : 1.28.3 | Thoughtspot: 9.12.0.cl
     */
    TML = 'tml',

    /**
     * Action Id for CreateLiveboard for liveboard list page & Pin Modal
     * @example
     * ```js
     * hiddenAction: [Action.CreateLiveboard]
     * disabledActions: [Action.CreateLiveboard]
     * ```
     *
     * @version SDK: 1.32.0 | Thoughtspot: 10.1.0.cl
     */
    CreateLiveboard = 'CreateLiveboard',

    /**
     * Action ID for to hide Verified Liveboard Banner
     *  @example
     * ```js
     * hiddenAction: [Action.VerifiedLiveboard]
     * ```
     *  @version SDK: 1.29.0 | Thoughtspot: 9.10.0.cl
     */
    VerifiedLiveboard = 'verifiedLiveboard',

    /**
     * Action ID for ask sage button
     *  @example
     * ```js
     * hiddenAction: [Action.AskAi]
     * ```
     *  @version SDK: 1.29.0 | Thoughtspot: 9.12.0.cl
     */
    AskAi = 'AskAi',

    /**
     * The **Add KPI to Watchlist** action on Home page watchlist.
     * @example
     * ```js
     * disabledActions: [Action.AddToWatchlist]
     * ```
     * @version SDK : 1.27.9 | Thoughtspot: 9.12.5.cl
     */
    AddToWatchlist = 'addToWatchlist',

    /**
     * The **Remove from watchlist** menu action on KPI watchlist.
     * @example
     * ```js
     * disabledActions: [Action.RemoveFromWatchlist]
     * ```
     * @version SDK : 1.27.9 | Thoughtspot: 9.12.5.cl
     */
    RemoveFromWatchlist = 'removeFromWatchlist',

    /**
     * The **Organise Favourites** action on Homepage Favourite Module.
     * @example
     * ```js
     * disabledActions: [Action.OrganiseFavourites]
     * ```
     * @version SDK : 1.32.0 | Thoughtspot: 10.0.0.cl
     */
    OrganiseFavourites = 'organiseFavourites',

    /**
     * Action ID for AI Highlights button
     *  @example
     * ```js
     * hiddenAction: [Action.AIHighlights]
     * ```
     *  @version SDK: 1.27.10 | Thoughtspot: 9.12.5.cl
     */
    AIHighlights = 'AIHighlights',

    /**
     * Action ID for edit schedule action on schedule on homepage
     * @example
     * ```js
     * disabledActions: [Action.EditScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | Thoughtspot: 10.3.0.cl
     */
    EditScheduleHomepage = 'editScheduleHomepage',

    /**
     * Action ID for pause schedule action on schedule on homepage
     * @example
     * ```js
     * disabledActions: [Action.PauseScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | Thoughtspot: 10.3.0.cl
     */
    PauseScheduleHomepage = 'pauseScheduleHomepage',

    /**
     * Action ID for view schedule run action on schedule on homepage
     * @example
     * ```js
     * disabledActions: [Action.ViewScheduleRunHomepage]
     * ```
     *  @version SDK: 1.34.0 | Thoughtspot: 10.3.0.cl
     */
    ViewScheduleRunHomepage = 'viewScheduleRunHomepage',

    /**
     * Action ID for unsubscribe schedule action on schedule on homepage
     * @example
     * ```js
     * disabledActions: [Action.UnsubscribeScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | Thoughtspot: 10.3.0.cl
     */
    UnsubscribeScheduleHomepage = 'unsubscribeScheduleHomepage',

    /**
     * The **Manage Tags** action on Homepage Favourite Module.
     *
     * @example
     * ```js
     * disabledActions: [Action.ManageTags]
     * ```
     * @version SDK : 1.34.0 | Thoughtspot: 10.3.0.cl
     */
    ManageTags = 'manageTags',

    /**
     * Action ID for delete schedule action on schedule on homepage
     * @example
     * ```js
     * disabledActions: [Action.DeleteScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | Thoughtspot: 10.3.0.cl
     */
    DeleteScheduleHomepage = 'deleteScheduleHomepage',

    /**
     * The **Analyze CTA** action on KPI chart.
     * @example
     * ```js
     * disabledActions: [Action.KPIAnalysisCTA]
     * ```
     *  @version SDK: 1.34.0 | Thoughtspot: 10.3.0.cl
     */
    KPIAnalysisCTA = 'kpiAnalysisCTA',
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

export interface ColumnValue {
    column: {
        id: string;
        name: string;
        dataType: string;
        [key: string]: any;
    };
    value:
        | string
        | number
        | boolean
        | {
              v: {
                  s: number;
                  e: number;
              };
          };
}

export interface VizPoint {
    selectedAttributes: ColumnValue[];
    selectedMeasures: ColumnValue[];
}

/**
 * @group Events
 */
export interface CustomActionPayload {
    contextMenuPoints?: {
        clickedPoint: VizPoint;
        selectedPoints: VizPoint[];
    };
    embedAnswerData: {
        name: string;
        id: string;
        sources: {
            header: {
                guid: string;
            };
        };
        columns: any[];
        data: any[];
        [key: string]: any;
    };
    session: SessionInterface;
    vizId?: string;
}

export enum LogLevel {
    /**
     * No logs will be logged in the console.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.SILENT,
     * })
     * ```
     * @version SDK: 1.26.7 | Thoughtspot: 9.10.0.cl
     */
    SILENT = 'SILENT',
    /**
     * Only ERROR logs will be logged in the console.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.ERROR,
     * })
     * ```
     * @version SDK: 1.26.7 | Thoughtspot: 9.10.0.cl
     */
    ERROR = 'ERROR',
    /**
     * Only WARN and ERROR logs will be logged in the console.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.WARN,
     * })
     * ```
     * @version SDK: 1.26.7 | Thoughtspot: 9.10.0.cl
     */
    WARN = 'WARN',
    /**
     * Only INFO, WARN, and ERROR logs will be logged in the console.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.INFO,
     * })
     * ```
     * @version SDK: 1.26.7 | Thoughtspot: 9.10.0.cl
     */
    INFO = 'INFO',

    /**
     * Only DEBUG, INFO, WARN, and ERROR logs will be logged in the console.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.DEBUG,
     * })
     * ```
     * @version SDK: 1.26.7 | Thoughtspot: 9.10.0.cl
     */
    DEBUG = 'DEBUG',
    /**
     * All logs will be logged in the console.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.TRACE,
     * })
     * ```
     * @version SDK: 1.26.7 | Thoughtspot: 9.10.0.cl
     */
    TRACE = 'TRACE',
}
