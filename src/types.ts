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
     * No authentication on the SDK. Pass-through to the embedded App. Alias for
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
     *   authTriggerContainer: '#tsEmbed',
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
    LiveboardSchedules = 'liveboard-schedules',
    /**
     * Create new options in the insights left navigation,
     * available when new navigation V3 is enabled.
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    Create = 'create',
    /**
     * Spotter option in the insights left navigation,
     * available when new navigation V3 is enabled.
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    Spotter = 'spotter',
    /**
     * Favorites option in the insights left navigation,
     * available when new navigation V3 is enabled.
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    Favorites = 'favorites',
}
export type DOMSelector = string | HTMLElement;

/**
 * inline customCSS within the {@link CustomisationsInterface}.
 * Use {@link CustomCssVariables} or css rules.
 */
export interface customCssInterface {
  /**
   * The custom css variables, which can be set.
   * The variables are available in the {@link CustomCssVariables}
   * interface. For more information, see
   * link:https://developers.thoughtspot.com/docs/css-variables-reference[CSS variable reference].
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
 * ThoughtSpot components.
 * You can customize styles, text strings, and icons.
 * For more information, see link:https://developers.thoughtspot.com/docs/custom-css[CSS customization framework].
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
        stringIDs?: Record<string, string>;
        stringIDsUrl?: string;
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
     * ThoughtSpot clusters against cross-site scripting attacks.
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
     * Suppress or show specific types of logs in the console output.
     * For example, `LogLevel.ERROR` shows only Visual Embed SDK and
     * ThoughtSpot application errors and suppresses
     * other logs such as warnings, information alerts,
     * and debug messages in the console output.
     *
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
     * Overrides default/user preferred locale for date formatting
     * @version SDK: 1.28.4 | ThoughtSpot: 10.0.0.cl, 9.5.0.sw
     */
    dateFormatLocale?: string;
    /**
     * Overrides default/user preferred locale for number formatting
     * @version SDK: 1.28.4 | ThoughtSpot: 10.0.0.cl, 9.5.0.sw
     */
    numberFormatLocale?: string;
    /**
     * Format to be used for currency when currency format is set to infer from browser
     * @version SDK: 1.28.4 | ThoughtSpot: 10.0.0.cl, 9.5.0.sw
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
     * @version SDK: 1.28.5 | ThoughtSpot: 9.10.0.cl, 10.1.0.sw
     */
    disableTokenVerification?: boolean;

    /**
     * This flag is used to disable showing the login failure page in the embedded app.
     * @version SDK 1.32.3 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
    disableLoginFailurePage?: boolean;
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
     * @version SDK: 1.33.5 | ThoughtSpot: *
     */
    additionalFlags?: { [key: string]: string | number | boolean };
    /**
     * This is an object (key/val) for customVariables being
     * used by the third party tool's script.
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed', {
     *   ... // other liveboard view config
     *   customVariablesForThirdPartyTools: {
     *        key1: 'value1',
     *        key2: 'value2'
     *     }
     * });
     * ```
     *  @version SDK 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
    customVariablesForThirdPartyTools?: Record< string, any >;

    disablePreauthCache?: boolean;

    /**
     * Disable fullscreen presentation mode functionality. When enabled, prevents entering
     * and exiting fullscreen mode for embedded visualizations during presentations.
     * @default true (feature is disabled by default)
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     * @example
     * ```js
     * init({
     *   ... // other embed config options
     *   disableFullscreenPresentation: false, // enables the feature
     * })
     * ```
     */
    disableFullscreenPresentation?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
 * The common configuration object for an embedded view.
 */
export interface BaseViewConfig {
    /**
     * @hidden
     */
    layoutConfig?: LayoutConfig;
    /**
     * The width and height dimensions to render an embedded
     * object inside your app.  Specify the values in pixels or percentage.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 7.2.1
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    frameParams: {
     *        width: '500px' | '50%',
     *        height: '400px' | '60%',
     *    },
     * })
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
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    disabledActions: [Action.Download, Action.Save],
     * });
     * ```
     */
    disabledActions?: Action[];
    /**
     * The tooltip to display for disabled actions.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    disabledActions: [Action.Download, Action.Save],
     *    disabledActionReason: "Reason for disabling",
     * });
     * ```
     */
    disabledActionReason?: string;
    /**
     * The list of actions to hide from the embedded.
     * This actions will be hidden from the user.
     * Use this to hide an action.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    hiddenActions: [Action.Download, Action.Export],
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
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @important
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    visibleActions: [Action.Download, Action.Export],
     * });
     * ```
     */
    visibleActions?: Action[];
    /**
     * The locale settings to apply to the embedded view.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @version SDK: 1.9.4 | ThoughtSpot 8.1.0.cl, 8.4.1.sw
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    locale:'en',
     * })
     * ```
     */
    locale?: string;
    /**
     * This is an object (key/val) of override flags which will be applied
     * to the internal embedded object. This can be used to add any
     * URL flag.
     * If the same flags are passed in init, they will be overriden by the values here.
     * Warning: This option is for advanced use only and is used internally
     * to control embed behavior in non-regular ways. We do not publish the
     * list of supported keys and values associated with each.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *   additionalFlags: {
     *        flag1: 'value1',
     *        flag2: 'value2'
     *     },
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
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @version SDK: 1.2.0 | ThoughtSpot: 9.0.0.cl, 9.0.0.sw
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    insertAsSibling:true,
     * })
     * ```
     */
    insertAsSibling?: boolean;
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
     * PreRender id to be used for PreRendering the embed.
     * Use PreRender to render the embed in the background and then
     * show or hide the rendered embed using showPreRender or hidePreRender respectively.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *   preRenderId: "preRenderId-123",
     * });
     * embed.showPreRender();
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl, 9.8.0.sw
     */
    preRenderId?: string;

    /**
     * Determines if the PreRender component should dynamically track the size
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
     * Enable the V2 shell. This can provide performance benefits
     * due to a lighterweight shell.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *   enableV2Shell_experimental: true,
     * });
     * ```
     * @version SDK: 1.31.2 | ThoughtSpot: 10.0.0.cl
     */
    // eslint-disable-next-line camelcase
    enableV2Shell_experimental?: boolean;
    /**
     * For internal tracking of the embed component type.
     * @hidden
     */
    embedComponentType?: string;
    /**
     * This flag can be used to expose translation IDs on the embedded app.
     * @default false
     * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
     */
    exposeTranslationIDs?: boolean;
    /**
     * This flag can be used to disable links inside the embedded app,
     * and disable redirection of links in a new tab.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *   ... // other embed view config
     *   disableRedirectionLinksInNewTab: true,
     * });
     * ```
     * @version SDK: 1.32.1 | ThoughtSpot: 10.3.0.cl
     */
    disableRedirectionLinksInNewTab?: boolean;
    /**
     * Overrides an Org context for embedding application users.
     * This parameter allows a user authenticated to one Org to view the
     * objects from another Org.
     * The `overrideOrgId` setting is honoured only if the
     * Per Org URL feature is enabled on your ThoughtSpot instance.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *   ... // other embed view config
     *   overrideOrgId: 142536,
     * });
     * ```
     * @version SDK: 1.35.0 | ThoughtSpot: 10.5.0.cl
     */
    overrideOrgId?: number;
    /**
     * Flag to override the *Open Link in New Tab* context menu option.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SageEmbed`, `SearchEmbed`, `SpotterAgentEmbed`, `SpotterEmbed`, `SearchBarEmbed`
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    linkOverride:false,
     * })
     * ```
     */
    linkOverride?: boolean;
    /**
     * The primary action to display on top of the viz for Liveboard and App Embed.
     * Use this to set the primary action.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.39.0 | ThoughtSpot: 10.11.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *   primaryAction: Action.Download
     * });
     * ```
     */
    primaryAction?: Action | string;
    /**
     * flag to enable insert into slides action
     * @hidden
     * @private
     */
    insertInToSlide?: boolean;
    /**
     * Show alert messages and toast messages in the embed.
     * Supported embed in all embed types.
     * 
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other embed view config
     *    showAlerts:true,
     * })
     * ```
     */
    showAlerts?: boolean;
}

/**
 * The configuration object for Home page embeds configs.
 */
export interface HomePageConfig {
    /**
     * Hide list page columns
     * For example: hiddenListColumns = [ListPageColumns.Author]
     *
     * **Note**: This option is currently available only in full app embedding and requires importing the ListPageColumns enum. 
     * At present, it can be used with Liveboard and Answer list pages, and starting with version 10.14.0.cl, it will also be supported for the Home page.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.38.0 | ThoughtSpot: 10.9.0.cl
     * @example
     * ```js
     * import { ListPageColumns } from '@thoughtspot/visual-embed-sdk';
     * 
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    hiddenListColumns : [ListPageColumns.Favorite,ListPageColumns.Author],
     * })
     * ```
     */
    hiddenListColumns?: ListPageColumns[];
    /**
     * Hide the home page modules
     * For example: hiddenHomepageModules = [HomepageModule.MyLibrary]
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     * To use it, you need to import `HomepageModule` enum.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl, 10.1.0.sw
     * @example
     * ```js
     * import { HomepageModule } from '@thoughtspot/visual-embed-sdk';
     * 
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... //other embed view config
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
     * To use it, you need to import `HomepageModule` enum.
     *
     * Supported embed types: `AppEmbed`
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl, 10.1.0.sw
     * @example
     * ```js
     * import { HomepageModule } from '@thoughtspot/visual-embed-sdk';
     * 
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    reorderedHomepageModules:[HomepageModule.Favorite,HomepageModule.MyLibrary],
     * })
     * ```
     */
    reorderedHomepageModules?: HomepageModule[];
    /**
     * homepageLeftNavItems : Show or hide the left navigation bar items.
     * There are 8 eight home navigation list items.
     * To hide these items, specify the string in the array.
     *
     * Supported embed types: `AppEmbed`
     * @example
     * ```js
     * import { HomeLeftNavItem } from '@thoughtspot/visual-embed-sdk';
     * 
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    hiddenHomeLeftNavItems : [HomeLeftNavItem.Home,HomeLeftNavItem.Answers],
     * })
     * ```
     *
     * **Note**: This option does not apply to the classic homepage.
     * To access the updated modular homepage, set
     * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
     * To use it, you need to import `HomeLeftNavItem` enum.
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl, 10.1.0.sw
     */
    hiddenHomeLeftNavItems?: HomeLeftNavItem[];
}

/**
 * The configuration object for common Search and Liveboard embeds configs.
 */
export interface SearchLiveboardCommonViewConfig {
    /**
     * The list of runtime filters to apply to a search Answer,
     * visualization, or Liveboard.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SearchEmbed`
     * @version SDK: 1.9.4 | ThoughtSpot 8.1.0.cl, 8.4.1.sw
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
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
     * The list of parameter override to apply to a search Answer,
     * visualization, or Liveboard.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`, `SearchEmbed`
     * @version SDK : 1.25.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SearchEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    runtimeParameters: [
     *     {
     *       name: 'value',
     *       value: 'string' | 123 | true,
     *     },
     *   ]
     * })
     * ```
     */
    runtimeParameters?: RuntimeParameter[];
    /**
     * flag to set ContextMenu Trigger to either left or right click.
     *
     * Supported embed types: `AppEmbed`, `SageEmbed`, `SearchEmbed`
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SageEmbed, or SearchEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    contextMenuTrigger:ContextMenuTriggerOptions.LEFT_CLICK || RIGHT_CLICK,
     * })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    contextMenuTrigger?: ContextMenuTriggerOptions;
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
     * To set the initial state of the search bar in case of saved Answers.
     *
     * Supported embed types: `SageEmbed`, `AppEmbed`, `SearchBarEmbed`
     * @default true
     * @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, SageEmbed, AppEmbed, or SearchBarEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *   collapseSearchBar: true,
     * });
     */
    collapseSearchBar?: boolean;
    /**
     * Flag to control Data panel experience
     *
     * Supported embed types: `SageEmbed`, `AppEmbed`, `SearchBarEmbed`, `LiveboardEmbed`, `SearchEmbed`
     * @default false
     * @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, SageEmbed, AppEmbed, or SearchBarEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    dataPanelV2: true,
     * })
     * ```
     */
    dataPanelV2?: boolean;
    /**
     * To enable custom column groups in data panel v2
     *
     * Supported embed types: `SageEmbed`, `SearchBarEmbed`, `LiveboardEmbed`, `SearchEmbed`
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
     * @default false
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, SageEmbed, SearchBarEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *   ... // other embed view config
     *   enableCustomColumnGroups: true,
     * });
     * ```
     */
    enableCustomColumnGroups?: boolean;
}

/**
 * The configuration object for common Liveboard and App embeds configs.
 */
export interface LiveboardAppEmbedViewConfig {
    /**
     * Show or hide Liveboard header
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    hideLiveboardHeader : true,
     * })
     * ```
     */
    hideLiveboardHeader?: boolean;
    /**
     * Show or hide Liveboard title
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    showLiveboardTitle:true,
     * })
     * ```
     */
    showLiveboardTitle?: boolean;
    /**
     * Show or hide Liveboard description
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     * @default false
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    showLiveboardDescription:true,
     * })
     * ```
     */
    showLiveboardDescription?: boolean;
    /**
     * Boolean to control if Liveboard header is sticky or not.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#embed', {
     *   ... // other app view config
     *   isLiveboardHeaderSticky: true,
     * });
     * ```
     * @version SDK: 1.26.0 | Thoughtspot: 9.7.0.cl
     */
    isLiveboardHeaderSticky?: boolean;
    /**
     * This attribute can be used to enable the two-column layout on an embedded Liveboard
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @type {boolean}
     * @default false
     * @version SDK: 1.32.0 | ThoughtSpot:10.1.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    enable2ColumnLayout: true,
     * })
     * ```
     */
    enable2ColumnLayout?: boolean;
    /**
     * This flag can be used to enable the compact header in Liveboard
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @type {boolean}
     * @default false
     * @version SDK: 1.35.0 | ThoughtSpot:10.3.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    isLiveboardCompactHeaderEnabled: true,
     * })
     * ```
     */
    isLiveboardCompactHeaderEnabled?: boolean;
    /**
     * This flag can be used to show or hide the Liveboard verified icon in the compact header.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.35.0 | ThoughtSpot:10.4.0.cl
     * @default true
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    showLiveboardVerifiedBadge: true,
     * })
     * ```
     */
    showLiveboardVerifiedBadge?: boolean;
    /**
     * This flag is used to enable/disable hide irrelevant filters in Liveboard tab
     * 
     * **Note**: This feature is supported only if compact header is enabled on your Liveboard. To enable compact header, use the `isLiveboardCompactHeaderEnabled` attribute.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.36.0 | ThoughtSpot:10.6.0.cl
     * @default false
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    hideIrrelevantChipsInLiveboardTabs: true,
     *    isLiveboardCompactHeaderEnabled: true,
     * })
     * ```
     */
    hideIrrelevantChipsInLiveboardTabs?: boolean;
    /**
     * This flag can be used to show or hide the re-verify banner on the Liveboard compact header
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.35.0 | ThoughtSpot:10.4.0.cl
     * @default true
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    showLiveboardReverifyBanner: true,
     * })
     * ```
     */
    showLiveboardReverifyBanner?: boolean;
    /**
     * enable or disable ask sage
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.29.0 | Thoughtspot: 9.12.0.cl
     * @default false
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, SpotterEmbed, or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    enableAskSage:true,
     * })
     * ```
     */
    enableAskSage?: boolean;
     /**
     * This flag is used to show or hide checkboxes for including or excluding
     * the cover and filters pages in the Liveboard PDF.
     *
     * Supported embed types: `AppEmbed`, `LiveboardEmbed`
     * @version SDK: 1.40.0 | ThoughtSpot:10.8.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed or LiveboardEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    coverAndFilterOptionInPDF: false,
     * })
     * ```
     */
    coverAndFilterOptionInPDF?: boolean;
}

export interface AllEmbedViewConfig extends BaseViewConfig, SearchLiveboardCommonViewConfig, HomePageConfig, LiveboardAppEmbedViewConfig {}

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
    [key: string]: string | boolean | number;
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
 * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl, 10.1.0.sw
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
 * List page columns that can be hidden.
 * **Note**: This option is applicable to full app embedding only.
 * @version SDK: 1.38.0 | ThoughtSpot: 10.9.0.cl
 */
// eslint-disable-next-line no-shadow
export enum ListPageColumns {
    /**
     * Favourite
     */
    Favourite = 'FAVOURITE',
    /**
     * Tags
     */
    Tags = 'TAGS',
    /**
     * Author
     */
    Author = 'AUTHOR',
    /**
     * Last viewed/Last modified
     */
    DateSort = 'DATE_SORT',
    /**
     * Share
     */
    Share = 'SHARE',
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
 *
 * If you are using React components for embedding, you can register to any
 * events from the `EmbedEvent` list by using the `on<EventName>` convention.
 * For example,`onAlert`, `onCopyToClipboard` and so on.
 *  @example
 * ```js
 * // ...
 * const MyComponent = ({ dataSources }) => {
 *      const onLoad = () => {
 *      console.log(EmbedEvent.Load, {});
 *      };
 *
 *      return (
 *          <SearchEmbed
 *              dataSources={dataSources}
 *              onLoad = {logEvent("Load")}
 *          />
 *     );
 * };
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
     * Data pertaining to an Answer or Liveboard is received.
     * The event payload includes the raw data of the object.
     * @return data -  Answer of Liveboard data
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
     * LiveboardEmbed.on(EmbedEvent.VizPointDoubleClick, payload => {
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
     * The ThoughtSpot authentication session has expired.
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
     * ThoughtSpot failed to re validate the auth session.
     * @hidden
     */
    IdleSessionTimeout = 'IdleSessionTimeout',

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
     * are blocked by default. `NoCookieAccess` can trigger.
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
     * Emitted when the download action is triggered on an Answer.
     *
     * **Note**: This event is deprecated in v1.21.0.
     * To fire an event when a download action is initiated on a chart or table,
     * use `EmbedEvent.DownloadAsPng`, `EmbedEvent.DownloadAsPDF`,
     * `EmbedEvent.DownloadAsCSV`, or `EmbedEvent.DownloadAsXLSX`
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
     * Emitted when the download action is triggered on an Answer.
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
     * Emitted when the Download as PDF action is triggered on an Answer
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
     * Emitted when the Download as CSV action is triggered on an Answer.
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
     * Emitted when the Download as XLSX action is triggered on an Answer.
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
     * Emitted when a user initiates the Pin action to
     *  add an Answer to a Liveboard.
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
     * Emitted when the user creates a copy of an Answer.
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
     * Emitted when a user clicks *Show underlying data* on an Answer.
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
     * Emitted when an Answer is switched to a chart or table view.
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
     * liveboardEmbed.on(EmbedEvent.LiveboardInfo, payload => {
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
     * Emitted when a user clicks **Copy link** action on a visualization.
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.CopyLink, {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
    CopyLink = 'embedDocument',
    /**
     * Emitted when a user interacts with cross filters on a
     * visualization or Liveboard.
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.CrossFilterChanged, {
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
     *  Emitted when a user clicks the **Go** button to initiate
     *  a Natural Language Search query
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    SageEmbedQuery = 'sageEmbedQuery',
    /**
     * Emitted when a user selects a data source on the embedded
     * Natural Language Search interface.
     *
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    SageWorksheetUpdated = 'sageWorksheetUpdated',
    /**
     * Emitted when a user updates a connection on the **Data** page
     * @version SDK : 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
    UpdateConnection = 'updateConnection',
    /**
     * Emitted when a user updates a connection on the **Data** page
     * @version SDK : 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
    CreateConnection = 'createConnection',
    /**
     * Emitted when name, status (private or public) or filter values of a
     * Personalised view is updated.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    UpdatePersonalisedView = 'updatePersonalisedView',
    /**
     * Emitted when a Personalised view is saved.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    SavePersonalisedView = 'savePersonalisedView',
    /**
     * Emitted when a Liveboard is reset.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    ResetLiveboard = 'resetLiveboard',
    /**
     * Emitted when a PersonalisedView is deleted.
     * @returns views: string[]
     * @returns liveboardId: string
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    DeletePersonalisedView = 'deletePersonalisedView',
    /**
     * Emitted when a user creates a Worksheet.
     * @version SDK : 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
    CreateWorksheet = 'createWorksheet',
    /**
     * Emitted when the *Ask Sage* is initialized.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.29.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
    AskSageInit = 'AskSageInit',
    /**
     * Emitted when a Liveboard or visualization is renamed.
     * @version SDK : 1.28.0 | ThoughtSpot: 9.10.5.cl, 10.1.0.sw
     */
    Rename = 'rename',
    /**
     *
     * This event can be emitted to intercept search execution initiated by
     * the users and implement the logic to allow or restrict search execution.
     * You can can also show custom error text if the search query must be
     * restricted due to your application or business requirements.

     * Prerequisite: Set `isOnBeforeGetVizDataInterceptEnabled` to `true`
     * for this embed event to get emitted.
     * @param: payload
     * @param: responder
     * Contains elements that lets developers define whether ThoughtSpot
     * should run the search, and if not, what error message
     * should be shown to the user.
     *
     * execute: When execute returns `true`, the search will be run.
     * When execute returns `false`, the search will not be executed.
     *
     * error: Developers can customize the error message text when `execute`
     * returns `false` using the error parameter in responder.
     * @version SDK : 1.29.0 | ThoughtSpot: 10.3.0.cl
     * @example
     *```js
     * .on(EmbedEvent.OnBeforeGetVizDataIntercept,
     * (payload, responder) => {
     *  responder({
     *      data: {
     *          execute:false,
     *          error: {
     *          //Provide a custom error message to explain to your end user
     *          //why their search did not run
     *          errorText: "This search query cannot be run.
     *          Please contact your administrator for more details."
     *          }
     *  }})
     * })
     * ```
     *
     *```js
     * .on(EmbedEvent.OnBeforeGetVizDataIntercept,
     * (payload, responder) => {
     * const query = payload.data.data.answer.search_query
     * responder({
     *  data: {
     *      // returns true as long as the query does not include
     *      // both the 'sales' AND the 'county' column
     *      execute: !(query.includes("sales")&&query.includes("county")),
     *      error: {
     *      //Provide a custom error message to explain to your end user
     *      // why their search did not run, and which searches are accepted by your custom logic.
     *      errorText: "You can't use this query :" + query + ".
     *      The 'sales' measures can never be used at the 'county' level.
     *      Please try another measure, or remove 'county' from your search."
     *      }
     *  }})
     * })
     *```
     */
    OnBeforeGetVizDataIntercept = 'onBeforeGetVizDataIntercept',
    /**
     * Emitted when parameter changes in an Answer
     * or Liveboard.
     * ```js
     * liveboardEmbed.on(EmbedEvent.ParameterChanged, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK : 1.29.0 | ThoughtSpot: 10.3.0.cl
     */
    ParameterChanged = 'parameterChanged',
    /**
     * Emits when a table visualization is rendered in
     * the ThoughtSpot embedded app.
     *
     * You can also use this event as a hook to trigger host events
     * such as `HostEvent.TransformTableVizData` on the table visualization.
     * The event payload contains the data used in the rendered table.
     * You can extract the relevant data from the payload
     * stored in `payload.data.data.columnDataLite`.
     *
     * `columnDataLite` is a multidimensional array that contains
     * data values for each column, which was used in the query to
     * generate the table visualization. To find and modify specific cell data,
     * you can either loop through the array or directly access a cell if
     * you know its position and data index.
     *
     * In the following code sample, the first cell in the first column
     * (`columnDataLite[0].dataValue[0]`) is set to `new fob`.
     * Note that any changes made to the data in the payload will only update the
     * visual presentation and do not affect the underlying data.
     * To persist data value modifications after a reload or during chart
     * interactions such as drill down, ensure that the modified
     * payload in the `columnDataLite` is passed on to
     * `HostEvent.TransformTableVizData` and trigger an update to
     * the table visualization.
     *
     * If the Row-Level Security (RLS) rules are applied on the
     * Worksheet or Model, exercise caution when changing column
     * or table cell values to maintain data security.
     *
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.TableVizRendered, (payload) => {
     *      console.log(payload);
     *      const columnDataLite = payload.data.data.columnDataLite;
     *      columnDataLite[0].dataValue[0]="new fob";
     *      console.log('>>> new Data', columnDataLite);
     *      searchEmbed.trigger(HostEvent.TransformTableVizData, columnDataLite);
     * })
     * ```
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
     TableVizRendered = 'TableVizRendered',
     /**
     * Emitted when the liveboard is created from pin modal or Liveboard list page.
     * You can use this event as a hook to trigger
     * other events on liveboard creation.
     *
     * ```js
     * liveboardEmbed.on(EmbedEvent.CreateLiveboard, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK : 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
    CreateLiveboard = 'createLiveboard',
    /**
     * Emitted when a user creates a Model.
     * @version SDK : 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
     CreateModel = 'createModel',
    /**
     * @hidden
     * Emitted when a user exits present mode.
     * @version SDK : 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    ExitPresentMode = 'exitPresentMode',
    /**
     * Emitted when a user requests the full height lazy load data.
     * @version SDK : 1.39.0 | ThoughtSpot : 10.10.0.cl
     * @hidden
     */
    RequestVisibleEmbedCoordinates = 'requestVisibleEmbedCoordinates',
    /**
     * Emitted when Spotter response is text data
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterData, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    SpotterData = 'SpotterData',
    /**
     * Emitted when user opens up the worksheet preview modal in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.PreviewSpotterData, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    PreviewSpotterData = 'PreviewSpotterData',
    /**
     * Emitted when the Spotter query is triggered in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterQueryTriggered, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    SpotterQueryTriggered = 'SpotterQueryTriggered',
    /**
     * Emitted when the last Spotter query is edited in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.LastPromptEdited, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    LastPromptEdited = 'LastPromptEdited',
    /**
     * Emitted when the last Spotter query is deleted in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.LastPromptDeleted, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    LastPromptDeleted = 'LastPromptDeleted',
    /**
     * Emitted when the coversation is reset in spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.ResetSpotterConversation, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    ResetSpotterConversation = 'ResetSpotterConversation',
    /**
     * Emitted when the *Spotter* is initialized.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterInit, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    SpotterInit = 'spotterInit',
    /**
     * @hidden
     * Triggers when the embed listener is ready to receive events.
     * This is used to trigger events after the embed container is loaded.
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.EmbedListenerReady, () => {
     *     console.log('EmbedListenerReady');
     * })
     * ```
     */
    EmbedListenerReady = 'EmbedListenerReady',
    /**
     * Emitted when the organization is switched.
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.OrgSwitched, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    OrgSwitched = 'orgSwitched',
}

/**
 * Event types that can be triggered by the host application
 * to the embedded ThoughtSpot app.
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
 *   { columnName: 'state', operator: RuntimeFilterOp.EQ, values: ["california"]}
 * ]);
 * ```
 * @example
 * If using React components to embed, use the format shown in this example:
 *
 * ```js
 *  const selectVizs = () => {
 *      embedRef.current.trigger(HostEvent.SetVisibleVizs, [
 *         "715e4613-c891-4884-be44-aa8d13701c06",
 *         "3f84d633-e325-44b2-be25-c6650e5a49cf"
 *      ]);
 *    };
 * ```
 *
 *
 * You can also attach an Embed event to a Host event to trigger
 * a specific action as shown in this example:
 * @example
 * ```js
 *  const EmbeddedComponent = () => {
 *       const embedRef = useRef(null); // import { useRef } from react
 *       const onLiveboardRendered = () => {
 *          embedRef.current.trigger(HostEvent.SetVisibleVizs, ['viz1', 'viz2']);
 *      };
 *
 *      return (
 *          <LiveboardEmbed
 *              ref={embedRef}
 *              liveboardId="<liveboard-guid>"
 *              onLiveboardRendered={onLiveboardRendered}
 *          />
 *      );
 *  }
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
     * in case of a Liveboard.
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
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
     * Reload the Answer or visualization
     * @hidden
     */
    Reload = 'reload',
    /**
     * Get iframe URL for the current embed view on the playground.
     * Developers can use this URL to embed a ThoughtSpot object
     * in apps like Salesforce or Sharepoint.
     * @example
     * ```js
     * const url = embed.trigger(HostEvent.GetIframeUrl);
     * console.log("iFrameURL",url);
     * ```
     * @version SDK: 1.35.0 | ThoughtSpot: 10.4.0.cl
     */
    GetIframeUrl = 'GetIframeUrl',
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
     * Updates the runtime filters applied on a Liveboard. The filter
     * attributes passed with this event are appended to the existing runtime
     * filters applied on a Liveboard.
     *
     * **Note**: `HostEvent.UpdateRuntimeFilters` is supported in `LiveboardEmbed`
     * and `AppEmbed` only. In full application embedding, this event updates
     * the runtime filters applied on the Liveboard and saved Answer objects.
     *
     * @param - Pass an array of {@link RuntimeFilter} with the following attributes:
     * `columnName` - _String_. The name of the column to filter on.
     *
     * `operator` - {@link RuntimeFilterOp} to apply. For more information,
     * see link:https://developers.thoughtspot.com/docs/?pageid=runtime-filters#rtOperator[Developer Documentation].
     *
     * `values` - List of operands. Some operators such as EQ and LE allow a
     * single value, whereas BW and IN accept multiple values.
     *
     * **Note**: Updating runtime filters resets the ThoughtSpot
     * object to its original state and applies new filter conditions.
     * Any user changes (like drilling into a visualization)
     * will be cleared, restoring the original visualization
     * with the updated filters.
     *

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
     * This is the same as calling `appEmbed.navigateToPage(path, true)`.
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
     *  type: ATTRIBUTE/MEASURE,
     *  dataType: INT64/CHAR/DATE }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.OpenFilter,
     *  {column: { columnId: '<column-GUID>', name: 'column name', type: 'ATTRIBUTE', dataType: 'INT64'}})
     * ```
     * @example
     * ```js
     * LiveboardEmbed.trigger(HostEvent.OpenFilter,
     *   { column: {columnId: '<column-GUID>'}})
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
     * For more information, see
     * link:https://developers.thoughtspot.com/docs/fetch-data-and-report-apis#transient-lb-content[Liveboard data with unsaved changes].
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.getExportRequestForCurrentPinboard).then(
     * data=>console.log(data))
     * ```
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1.sw
     */
    getExportRequestForCurrentPinboard = 'getExportRequestForCurrentPinboard',
    /**
     * Trigger **Pin** action on an embedded object.
     * If no parameters are defined, the pin action is triggered
     * for the Answer that the user is currently on
     * and a modal opens for Liveboard selection.
     * To add an Answer or visualization to a Liveboard programmatically without
     * showing requiring additional user input via *Pin to Liveboard* modal, define
     * the following parameters:
     *
     * @param
     * `vizId`-  GUID of the saved Answer or visualization to pin to a Liveboard.
     *  Optional when pinning a new chart or table generated from a Search query.
     *  **Required** in Spotter Embed.
     * @param
     * `liveboardID` - GUID of the Liveboard to pin an Answer. If there is no Liveboard,
     *  specify the `newLiveboardName` parameter to create a new Liveboard.
     * @param
     * `tabId` - GUID of the Liveboard tab. Adds the Answer to the Liveboard tab
     *  specified in the code.
     * @param
     * `newVizName` - Name string for the Answer or visualization. If defined,
     *  this parameter adds a new visualization object or creates a copy of the
     *  Answer or visualization specified in `vizId`.
     *  Required attribute.
     * @param
     * `newLiveboardName` - Name string for the Liveboard.
     *  Creates a new Liveboard object with the specified name.
     * @param
     * `newTabName` - Name of the tab. Adds a new tab Liveboard specified
     *  in the code.
     *
     * @example
     * ```js
     * const pinResponse = await appEmbed.trigger(HostEvent.Pin, {
     *     vizId: "123",
     *     newVizName: "Sales by region",
     *     liveboardId: "123",
     *     tabId: "123"
     *  });
     * ```
     * @example
     * ```js
     * const pinResponse = await appEmbed.trigger(HostEvent.Pin, {
     *     newVizName: "Total sales of Jackets",
     *     liveboardId: "123"
     *  });
     * ```
     *
     * @example
     * ```js
     * const pinResponse = await searchEmbed.trigger(HostEvent.Pin, {
     *     newVizName: "Sales by state",
     *     newLiveboardName: "Sales",
     *     newTabName: "Products"
     *  });
     * ```
     * @example
     * ```js
     * appEmbed.trigger(HostEvent.Pin)
     * ```
     * @example
     * ```js
     * const pinResponse = await spotterEmbed.trigger(HostEvent.Pin, {
     *     vizId:'730496d6-6903-4601-937e-2c691821af3c'
     *  });
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
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     * 
     * **NOTE**: The **Download** > **PDF** action is available on
     * visualizations and Answers if the data is in tabular format.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsPdf)
     * ```
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.DownloadAsPdf, {
     *     vizId:'730496d6-6903-4601-937e-2c691821af3c'
     *  });
     * ```
     * 
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    DownloadAsPdf = 'downloadAsPdf',
    /**
     * Trigger the **Make a copy** action on a Liveboard,
     * visualization, or Answer page.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.MakeACopy, {
     * vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @example
     * ```js
     * vizEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * @example
     * ```js
     * const pinResponse = await spotterEmbed.trigger(HostEvent.MakeACopy, {
     *     vizId:'730496d6-6903-4601-937e-2c691821af3c'
     *  });
     * ```
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
     * * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Remove)
     * ```
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl, 10.10.0.sw
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
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.CreateMonitor, {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
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
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ManageMonitor, {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.ManageMonitor)
     * ```
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
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     * 
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @example
     * ```js
     * const pinResponse = await spotterEmbed.trigger(HostEvent.Edit, {
     *     vizId:'730496d6-6903-4601-937e-2c691821af3c'
     *  });
     * ```
     * @example
     * ```js
     * const editResponse = await spotterEmbed.trigger(HostEvent.Edit, {
     *     vizId:'730496d6-6903-4601-937e-2c691821af3c'
     *  });
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
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.GetTML, {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }).then((tml) => {
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
     * Trigger the **Show underlying data** action on a
     * chart or table.
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
     * Trigger the **SpotIQ analyze** action on a
     * chart or table.
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
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Download, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * embed.trigger(HostEvent.Download)
     * ```
     * ```js
     * spotterEmbed.trigger(HostEvent.Download, {
     *     vizId:'730496d6-6903-4601-937e-2c691821af3c'
     *  });
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
     * 
     * spotterEmbed.trigger(HostEvent.DownloadAsPng, {
     *       vizId:"730496d6-6903-4601-937e-2c691821af3c"
     * })
     * ```
     * 
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.1.sw
     */
    DownloadAsPng = 'downloadAsPng',
    /**
     * Trigger the **Download** > **CSV**  action on tables in
     * the embedded view.
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
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
     * ```js
     * spotterEmbed.trigger(HostEvent.DownloadAsCsv, {
     *       vizId:"730496d6-6903-4601-937e-2c691821af3c"
     * })
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    DownloadAsCsv = 'downloadAsCSV',
    /**
     * Trigger the **Download** > **XLSX**  action on tables
     * in the embedded view.
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
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
     * ```js
     * spotterEmbed.trigger(HostEvent.downloadAsXLSX, {
     *       vizId:"730496d6-6903-4601-937e-2c691821af3c"
     * })
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
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Save)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Save)
     * ```
     * ```js
     * spotterEmbed.trigger(HostEvent.Save, {
     *       vizId:"730496d6-6903-4601-937e-2c691821af3c"
     * })
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
     *  see
     *  link:https://developers.thoughtspot.com/docs/runtime-filters#_supported_data_types[Supported
     *  data types].
     *
     * `type`  - To update filters for date time, specify the date format type.
     * For more information and examples, see link:https://developers.thoughtspot.com/docs/embed-liveboard#_date_filters[Date filters].
     * @example
     * ```js
     *
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *     filter: {
     *         column: "item type",
     *         oper: "IN",
     *         values: ["bags","shirts"]
     *        }
     *    });
     * ```
     * @example
     * ```js
     *
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *     filter: {
     *         column: "date",
     *         oper: "EQ",
     *         values: ["JULY","2023"],
     *         type: "MONTH_YEAR"
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
     *      values: ["2023-07-31"],
     *      types: "EXACT_DATE"
     *    }]
     * });
     * ```
     * If there are multiple columns with the same name, consider
     * using `WORKSHEET_NAME::COLUMN_NAME` format.
     *
     * @example
     *
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *  filters: [{
     *      column: "(Sample) Retail - Apparel::city",
     *      oper: 'IN',
     *      values: ["atlanta"]
     *  },
     *  {
     *      column: "(Sample) Retail - Apparel::Region",
     *      oper: 'IN',
     *      values: ["West","Midwest"]
     *  }]
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
     *      tabDetails // TabDetails of current Liveboard
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
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
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
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
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
     * @version SDK: 1.26.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
    UpdateSageQuery = 'updateSageQuery',
    /**
     * Get the Answer session for a Search or
     * Liveboard visualization.
     *
     * Note: This event is not typically used directly. Instead, use the
     * `getAnswerService()` method on the embed instance to get an AnswerService
     * object that provides a more convenient interface for working with answers.
     *
     * @example
     * ```js
     * // Preferred way to get an AnswerService
     * const service = await embed.getAnswerService();
     *
     * // Alternative direct usage (not recommended)
     * const {session} = await embed.trigger(
     *  HostEvent.GetAnswerSession, {
     *      vizId: '123', // For Liveboard Visualization.
     *  })
     * ```
     * @example
     * ```js
     * // Preferred way to get an AnswerService
     * const service = await embed.getAnswerService();
     *
     * // Alternative direct usage (not recommended)
     * const {session} = await embed.trigger( HostEvent.GetAnswerSession )
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.10.0.cl, 10.1.0.sw
     */
    GetAnswerSession = 'getAnswerSession',
    /**
     * Trigger the *Ask Sage* action for visualizations
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.AskSage,
     * {vizId:'730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
    AskSage = 'AskSage',
    /**
     * Trigger cross filter update action on a Liveboard.
     *
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
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 10.0.0.cl, 10.1.0.sw
     */
    UpdateCrossFilter = 'UpdateCrossFilter',
    /**
     * Trigger reset action for a personalized Liveboard view.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ResetLiveboardPersonalisedView);
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 10.1.0.cl, 10.1.0.sw
     */
    ResetLiveboardPersonalisedView = 'ResetLiveboardPersonalisedView',
    /**
     * Triggers an action to update Parameter values on embedded
     * Answers, Liveboard and Spotter answer in Edit mode.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateParameters, [{
     * name: "Color",
     * value: "almond"
     * }])
     *
     * @version SDK: 1.29.0 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
    UpdateParameters = 'UpdateParameters',
    /**
     * Triggers GetParameters to fetch the runtime Parameters.
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     * ```js
     * liveboardEmbed.trigger(HostEvent.GetParameters).then((parameter) => {
     *  console.log('parameters', parameter);
     * });
     *```
     *```js
     * spotterEmbed.trigger(HostEvent.GetParameters, {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }).then((parameter) => {
     *  console.log('parameters', parameter);
     * });
     *```
     * @version SDK: 1.29.0 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
    GetParameters = 'GetParameters',
    /**
     * Triggers an event to update a personalized view of a Liveboard.
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdatePersonalisedView, {viewId: '1234'})
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
    UpdatePersonalisedView = 'UpdatePersonalisedView',
    /**
     * @hidden
     * Notify when info call is completed successfully
     * ```js
     * liveboardEmbed.trigger(HostEvent.InfoSuccess, data);
     *```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
     InfoSuccess = 'InfoSuccess',
    /**
     * Trigger the save action for an Answer.
     * To programmatically save an answer without opening the
     * *Describe your Answer* modal, define the `name` and `description`
     * properties.
     * If no parameters are specified, the save action is
     * triggered with a modal to prompt users to
     * add a name and description for the Answer.
     * @param - optional attributes to set Answer properties.
     *  `name` - Name string for the Answer.
     *  `description` - Description text for the Answer.
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     * @example
     * ```js
     * const saveAnswerResponse = await searchEmbed.trigger(HostEvent.SaveAnswer, {
     *      name: "Sales by states",
     *      description: "Total sales by states in MidWest"
     *   });
     * ```
     * @example
     * ```js
     * const saveAnswerResponse = await spotterEmbed.trigger(HostEvent.SaveAnswer, {
     *      vizId: '730496d6-6903-4601-937e-2c691821af3c',
     *      name: "Sales by states",
     *      description: "Total sales by states in MidWest"
     * });
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
    SaveAnswer = 'saveAnswer',
    /**
     * EmbedApi
     * @hidden
     */
    UIPassthrough = 'UiPassthrough',
    /**
     * Triggers the table visualization re-render with the updated data.
     * Includes the following properties:
     * @param - `columnDataLite` - an array of object containing the
     * data value modifications retrieved from the `EmbedEvent.TableVizRendered`
     * payload.For example, { columnDataLite: []}`.
     *
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.TableVizRendered, (payload) => {
     *      console.log(payload);
     *      const columnDataLite = payload.data.data.columnDataLite;
     *      columnDataLite[0].dataValue[0]="new fob";
     *      console.log('>>> new Data', columnDataLite);
     *      searchEmbed.trigger(HostEvent.TransformTableVizData, columnDataLite);
     * })
     * ```
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
    TransformTableVizData = 'TransformTableVizData',
    /**
     * Triggers a search operation with the search tokens specified in
     * the search query string in spotter embed.
     * @param - `query`: Text string in Natural Language format
     * @param - `executeSearch`: Boolean to execute search and update search query
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.SpotterSearch, {
     *  query: 'revenue per year',
     *  executeSearch: true,
     * })
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    SpotterSearch = 'SpotterSearch',
    /**
     * Edits the last prompt in spotter embed.
     * @param - `query`: Text string
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.EditLastPrompt, "revenue per year");
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    EditLastPrompt = 'EditLastPrompt',
    /**
     * Opens the Worksheet preview modal in Spotter Embed.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.PreviewSpotterData);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    PreviewSpotterData = 'PreviewSpotterData',
    /**
     * Resets the Spotter Embed Conversation.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.ResetSpotterConversation);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    ResetSpotterConversation = 'ResetSpotterConversation',
    /**
     * Deletes the last prompt in spotter embed.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.DeleteLastPrompt);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    DeleteLastPrompt = 'DeleteLastPrompt',
    /**
     * Toggle the visualization to chart or table view.
     * @param - `vizId ` refers to the answer id in spotter Embed, it is required in spotter Embed.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.AnswerChartSwitcher, {
     *          vizId:'b535c760-8bbe-4e6f-bb26-af56b4129a1e'
     * });
     *```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
    /**
     * @hidden
     * Trigger exit from presentation mode when user exits fullscreen.
     * This is automatically triggered by the SDK when fullscreen mode is exited.
     * ```js
     * liveboardEmbed.trigger(HostEvent.ExitPresentMode);
     *```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    ExitPresentMode = 'exitPresentMode',
    /**
     * Triggers the full height lazy load data.
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.RequestVisibleEmbedCoordinates, (payload) => {
     *      console.log(payload);
     * });
     * ```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     *
     * @hidden
     */
    VisibleEmbedCoordinates = 'visibleEmbedCoordinates',
    /**
     * Trigger the *Ask Spotter* action for visualizations
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.AskSpotter,
     * {vizId:'730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    AskSpotter = 'AskSpotter',
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
    EnablePendoHelp = 'enablePendoHelp',
    HideResult = 'hideResult',
    UseLastSelectedDataSource = 'useLastSelectedSources',
    Tag = 'tag',
    AutoLogin = 'autoLogin',
    searchTokenString = 'searchTokenString',
    executeSearch = 'executeSearch',
    fullHeight = 'isFullHeightPinboard',
    livedBoardEmbed = 'isLiveboardEmbed',
    searchEmbed = 'isSearchEmbed',
    vizEmbed = 'isVizEmbed',
    StringIDsUrl = 'overrideStringIDsUrl',
    Version = 'sdkVersion',
    ViewPortHeight = 'viewPortHeight',
    ViewPortWidth = 'viewPortWidth',
    VisibleActions = 'visibleAction',
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
    // Deprecated: `isContextMenuEnabledOnLeftClick`
    // Introduced: `contextMenuEnabledOnWhichClick` with values: 'left',
    // 'right', or 'both'. This update only affects ThoughtSpot URL parameters
    // and does not impact existing workflows or use cases. Added support for
    // 'both' clicks in `contextMenuTrigger` configuration.
    ContextMenuTrigger = 'contextMenuEnabledOnWhichClick',
    LinkOverride = 'linkOverride',
    blockNonEmbedFullAppAccess = 'blockNonEmbedFullAppAccess',
    ShowInsertToSlide = 'insertInToSlide',
    PrimaryNavHidden = 'primaryNavHidden',
    HideProfleAndHelp = 'profileAndHelpInNavBarHidden',
    NavigationVersion = 'navigationVersion',
    HideHamburger = 'hideHamburger',
    HideObjectSearch = 'hideObjectSearch',
    HideNotification = 'hideNotification',
    HideApplicationSwitcher = 'applicationSwitcherHidden',
    HideOrgSwitcher = 'orgSwitcherHidden',
    IsSageEmbed = 'isSageEmbed',
    HideWorksheetSelector = 'hideWorksheetSelector',
    DisableWorksheetChange = 'disableWorksheetChange',
    HideSourceSelection = 'hideSourceSelection',
    DisableSourceSelection = 'disableSourceSelection',
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
    HomepageVersion = 'homepageVersion',
    ListPageVersion = 'listpageVersion',
    PendoTrackingKey = 'additionalPendoKey',
    LiveboardHeaderSticky = 'isLiveboardHeaderSticky',
    IsProductTour = 'isProductTour',
    HideSearchBarTitle = 'hideSearchBarTitle',
    HideSageAnswerHeader = 'hideSageAnswerHeader',
    HideSearchBar = 'hideSearchBar',
    ClientLogLevel = 'clientLogLevel',
    ExposeTranslationIDs = 'exposeTranslationIDs',
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
    ShowLiveboardVerifiedBadge = 'showLiveboardVerifiedBadge',
    ShowLiveboardReverifyBanner = 'showLiveboardReverifyBanner',
    LiveboardHeaderV2 = 'isLiveboardHeaderV2Enabled',
    HideIrrelevantFiltersInTab = 'hideIrrelevantFiltersAtTabLevel',
    SpotterEnabled = 'isSpotterExperienceEnabled',
    IsUnifiedSearchExperienceEnabled = 'isUnifiedSearchExperienceEnabled',
    OverrideOrgId = 'orgId',
    OauthPollingInterval = 'oAuthPollingInterval',
    IsForceRedirect = 'isForceRedirect',
    DataSourceId = 'dataSourceId',
    preAuthCache = 'preAuthCache',
    ShowSpotterLimitations = 'showSpotterLimitations',
    CoverAndFilterOptionInPDF = 'arePdfCoverFilterPageCheckboxesEnabled',
    PrimaryAction = 'primaryAction',
    isSpotterAgentEmbed = 'isSpotterAgentEmbed',
    IsLiveboardStylingAndGroupingEnabled = 'isLiveboardStylingAndGroupingEnabled',
    IsLazyLoadingForEmbedEnabled = 'isLazyLoadingForEmbedEnabled',
    RootMarginForLazyLoad = 'rootMarginForLazyLoad'
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
 * const embed = new LiveboardEmbed('#tsEmbed', {
 *    ... //other embed view config
 *    visibleActions: [Action.Save, Action.Edit, Action.Present, ActionAction.Explore],
 *    disabledActions: [Action.Download],
 *    //hiddenActions: [], // Set either this or visibleActions
 * })
 * ```
 * @example
 * ```js
 * const embed = new LiveboardEmbed('#tsEmbed', {
 *    ... //other embed view config
 *    //visibleActions: [],
 *    disabledActions: [Action.Download],
 *    hiddenActions: [Action.Edit, ActionAction.Explore],
 * })
 * ```
 * See also link:https://developers.thoughtspot.com/docs/actions[Action IDs in the SDK]
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
     * Allows scheduling a Liveboard job, for example,
     * sending periodic notifications.
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
     * The **Add filter** action on a Liveboard page.
     * Allows adding filters to visualizations on a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.AddFilter]
     * ```
     */
    AddFilter = 'addFilter',
    /**
     * The **Add Data Panel Objects** action on the data panel v2.
     * Allows to show action menu to add different objects (such as
     * formulas, Parameters) in data panel new experience.
     * @example
     * ```js
     * disabledActions: [Action.AddDataPanelObjects]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
     */
    AddDataPanelObjects = 'addDataPanelObjects',
    /**
     * The filter configuration options for a Liveboard.
     * The configuration options are available when adding
     * filters on a Liveboard.
     *
     * @example
     * ```js
     * disabledActions: [Action.ConfigureFilter]
     * ```
     */
    ConfigureFilter = 'configureFilter',
    /**
     * The **Collapse data sources** icon on the Search page.
     * Collapses the panel showing data sources.
     *
     * @example
     * ```js
     * disabledActions: [Action.CollapseDataPanel]
     * ```
     * @version: SDK: 1.1.0 | ThoughtSpot Cloud: ts7.may.cl, 8.4.1.sw
     */
    CollapseDataSources = 'collapseDataSources',
    /**
     * The **Collapse data panel** icon on the Search page.
     * Collapses the data panel view.
     *
     * @version: SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     *
     * @example
     * ```js
     * disabledActions: [Action.CollapseDataPanel]
     * ```
     */
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
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
     */
    AddColumnSet = 'addSimpleCohort',
    /**
     * The **Add Query Set** action on a Answer.
     * Allows adding query sets to a Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddQuerySet]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
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
    /**
     * The Share action for a Liveboard visualization.
     */
    ShareViz = 'shareViz',
    /**
     * @hidden
     */
    ReplaySearch = 'replaySearch',
    /**
     * The **Show underlying data** menu action on a
     * visualization or Answer page.
     * Displays detailed information and raw data
     * for a given visualization.
     * @example
     * ```js
     * disabledActions: [Action.ShowUnderlyingData]
     * ```
     */
    ShowUnderlyingData = 'showUnderlyingData',
    /**
     * The **Download** menu action on Liveboard
     * visualizations and Answers.
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
     * visualization, or Answer as a PDF file.
     *
     * **NOTE**: The **Download** > **PDF** option is available for
     * tables in visualizations and Answers.
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
     * The **Export TML** menu action on a Liveboard, Answer, and
     * the Data Workspace pages for data objects and connections.
     *
     * Allows exporting an object as a TML file.
     *
     * @example
     * ```js
     * disabledActions: [Action.ExportTML]
     * ```
     */
    ExportTML = 'exportTSL',
    /**
     * The **Import TML** menu action on the
     * *Data Workspace* > *Utilities* page.
     * Imports TML representation of ThoughtSpot objects.
     * @example
     * ```js
     * disabledActions: [Action.ImportTML]
     * ```
     */
    ImportTML = 'importTSL',
    /**
     * The **Update TML** menu action for Liveboards and Answers.
     * Updates TML representation of ThoughtSpot objects.
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
     * The visualization tile resize option.
     * Also available via More `...` options menu on a visualization.
     * Allows resizing visualization tiles and switching
     * between different preset layout option.
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
     * The **Delete** action on a Liveboard, *Liveboards* and
     * *Answers* list pages in full application embedding.
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
     * Allows scheduling a Liveboard job.
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
     * The contextual menu action to include a specific data point
     * when drilling down a table or chart on an Answer.
     *
     * @example
     * ```js
     * disabledActions: [Action.DrillInclude]
     * ```
     */

    DrillInclude = 'context-menu-item-include',
    /**
     * The contextual menu action to exclude a specific data point
     * when drilling down a table or chart on an Answer.
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
     * The **Query visualizer** and **Query SQL** buttons in
     * Query details panel of the Answer page.
     *
     * **Query visualizer** - Displays the tables
     * and filters used in a search query.
     * **Query SQL** - Displays the SQL statements used
     * in a search query to fetch data.
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
     * The chart switcher icon on Answer page and
     * visualizations in edit mode.
     * Allows switching to the table or chart mode
     * when editing a visualization.
     * @example
     * ```js
     * disabledActions: [Action.AnswerChartSwitcher]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    AnswerChartSwitcher = 'answerChartSwitcher',
    /**
     * The Favorites icon (*) for Answers,
     * Liveboard, and data objects like Worksheet, Model,
     * Tables and Views.
     * Allows adding an object to the user’s favorites list.
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
     * The *Create alert* action for KPI charts.
     * Allows users to schedule threshold-based alerts
     * for KPI charts.
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
     * disabledActions: [Action.ManagePipelines]
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.8.0.sw
     */
    CrossFilter = 'context-menu-item-cross-filter',
    /**
     * The **Sync to Slack** action on Liveboard visualizations.
     * Allows sending data to third-party apps Slack
     * @example
     * ```js
     * disabledActions: [Action.SyncToSlack]
     * ```
     * @version @version SDK : 1.32.0 | ThoughtSpot Cloud: 10.1.0.cl
     */
    SyncToSlack = 'syncToSlack',
    /**
     * The **Sync to Teams** action on Liveboard visualizations.
     * Allows sending data to third-party apps Team
     * @example
     * ```js
     * disabledActions: [Action.SyncToTeams]
     * ```
     * @version @version SDK : 1.32.0 | ThoughtSpot Cloud: 10.1.0.cl
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    AxisMenuTimeBucket = 'axisMenuTimeBucket',
    /**
     * The **Filter** action in the chart axis or table column
     * customization menu.
     * Allows adding, editing, or removing filters.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    AxisMenuPosition = 'axisMenuPosition',
    /**
     * The **Rename** option in the chart axis or table column customization menu.
     * Renames the axis label on a chart or the column header on a table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuRename]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    AxisMenuEdit = 'axisMenuEdit',
    /**
     * The **Number format** action to customize the format of
     * the data labels on a chart or table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuNumberFormat]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    AxisMenuNumberFormat = 'axisMenuNumberFormat',
    /**
     * The **Text wrapping** action on a table.
     * Wraps or clips column text on a table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuTextWrapping]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
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
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl, 9.8.0.sw
     */
    RenameModalTitleDescription = 'renameModalTitleDescription',
    /**
     * The *Request verification* action on a Liveboard.
     * Initiates a request for Liveboard verification.
     * @example
     * ```js
     * disabledActions: [Action.RequestVerification]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl, 10.1.0.sw
     */
    RequestVerification = 'requestVerification',
    /**
     *
     * Allows users to mark a Liveboard as verified.
     * @example
     * ```js
     * disabledActions: [Action.MarkAsVerified]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl, 10.1.0.sw
     */
    MarkAsVerified = 'markAsVerified',
    /**
     * The **Add Tab** action on a Liveboard.
     * Allows adding a new tab to a Liveboard view.
     * @example
     * ```js
     * disabledActions: [Action.AddTab]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    AddTab = 'addTab',
    /**
     *
     *Initiates contextual change analysis on KPI charts.
     * @example
     * ```js
     * disabledActions: [Action.EnableContextualChangeAnalysis]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot Cloud: 9.6.0.cl
     */
    EnableContextualChangeAnalysis = 'enableContextualChangeAnalysis',
    /**
     * Action ID to hide or disable Iterative Change Analysis option
     * on contextual change analysis  Inisght charts context menu
     *
     * @example
     * ```js
     * disabledActions: [Action.EnableIterativeChangeAnalysis]
     * ```
     * @version SDK: 1.41.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
    EnableIterativeChangeAnalysis = 'enableIterativeChangeAnalysis',
    /**
     * Action ID to hide or disable Natural Language Search query.
     *
     * @example
     * ```js
     * disabledActions: [Action.ShowSageQuery]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot Cloud: 9.7.0.cl
     */
    ShowSageQuery = 'showSageQuery',
    /**
     *
     * Action ID to hide or disable the edit option for the
     * results generated from the
     * Natural Language Search query.
     *
     * @example
     * ```js
     * disabledActions: [Action.EditSageAnswer]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot Cloud: 9.7.0.cl
     */
    EditSageAnswer = 'editSageAnswer',
    /**
     * The feedback widget for AI-generated Answers.
     * Allows users to send feedback on the Answers generated
     * from a Natural Language Search query.
     *
     * @example
     * ```js
     * disabledActions: [Action.SageAnswerFeedback]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl
     */
    SageAnswerFeedback = 'sageAnswerFeedback',
    /**
     *
     * @example
     * ```js
     * disabledActions: [Action.ModifySageAnswer]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl
     */
    ModifySageAnswer = 'modifySageAnswer',
    /**
     * The **Move to Tab** menu action on visualizations in Liveboard edit mode.
     * Allows moving a visualization to a different tab.
     * @example
     * ```js
     * disabledActions: [Action.MoveToTab]
     * ```
     */
    MoveToTab = 'onContainerMove',
    /**
     * The **Manage Alerts** menu action on KPI visualizations.
     * Allows creating, viewing, and editing monitor
     * alerts for a KPI chart.
     *
     * @example
     * ```js
     * disabledActions: [Action.ManageMonitor]
     * ```
     */
    ManageMonitor = 'manageMonitor',
    /**
     * The Liveboard Personalised Views dropdown.
     * Allows navigating to a personalized Liveboard View.
     *  @example
     * ```js
     * disabledActions: [Action.PersonalisedViewsDropdown]
     * ```
     *  @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
     */
    PersonalisedViewsDropdown = 'personalisedViewsDropdown',
    /**
     * Action ID for show or hide the user details on a
     * Liveboard (Recently visited / social proof)
     *  @example
     * ```js
     * disabledActions: [Action.LiveboardUsers]
     * ```
     *  @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
     */
    LiveboardUsers = 'liveboardUsers',

    /**
     * Action ID for the Parent TML action
     * The parent action **TML** must be included to access TML-related options
     * within the cascading menu (specific to the Answer page)
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
     * @version SDK : 1.28.3 | ThoughtSpot: 9.12.0.cl, 10.1.0.sw
     */
    TML = 'tml',
    /**
     * The **Create Liveboard* action on
     * the Liveboards page and the Pin modal.
     * Allows users to create a Liveboard.
     *
     * @example
     * ```js
     * hiddenAction: [Action.CreateLiveboard]
     * disabledActions: [Action.CreateLiveboard]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
    CreateLiveboard = 'createLiveboard',

    /**
     * Action ID for to hide or disable the
     * Verified Liveboard banner.
     *  @example
     * ```js
     * hiddenAction: [Action.VerifiedLiveboard]
     * ```
     *  @version SDK: 1.29.0 | ThoughtSpot: 9.10.0.cl, 10.1.0.sw
     */
    VerifiedLiveboard = 'verifiedLiveboard',

    /**
     * Action ID for the *Ask Sage* In Natural Language Search embed,
     * *Spotter* in Liveboard, full app, and Spotter embed.
     *
     * Allows initiating a conversation with ThoughtSpot AI analyst.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.AskAi]
     * ```
     *  @version SDK: 1.29.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
    AskAi = 'AskAi',

    /**
     * The **Add KPI to Watchlist** action on Home page watchlist.
     * Adds a KPI chart to the watchlist on the Home page.
     * @example
     * ```js
     * disabledActions: [Action.AddToWatchlist]
     * ```
     * @version SDK : 1.27.9 | ThoughtSpot Cloud: 9.12.5.cl
     */
    AddToWatchlist = 'addToWatchlist',

    /**
     * The **Remove from watchlist** menu action on KPI watchlist.
     * Removes a KPI chart from the watchlist on the Home page.
     * @example
     * ```js
     * disabledActions: [Action.RemoveFromWatchlist]
     * ```
     * @version SDK : 1.27.9 | ThoughtSpot: 9.12.5.cl
     */
    RemoveFromWatchlist = 'removeFromWatchlist',
    /**
     * The **Organize Favourites** action on Homepage
     * *Favorites* module.
     *
     * @example
     * ```js
     * disabledActions: [Action.OrganiseFavourites]
     * ```
     * @version SDK : 1.32.0 | ThoughtSpot: 10.0.0.cl
     */
    OrganiseFavourites = 'organiseFavourites',

    /**
     * The **AI Highlights** action on a Liveboard.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.AIHighlights]
     * ```
     *  @version SDK: 1.27.10 | ThoughtSpot Cloud: 9.12.5.cl
     */
    AIHighlights = 'AIHighlights',

    /**
     * The *Edit* action on the *Liveboard Schedules* page
     * (new Homepage experience).
     * Allows editing Liveboard schedules.
     *
     * @example
     * ```js
     * disabledActions: [Action.EditScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
    EditScheduleHomepage = 'editScheduleHomepage',

    /**
     * The *Pause* action on the *Liveboard Schedules* page
     * Pauses a scheduled Liveboard job.
     * @example
     * ```js
     * disabledActions: [Action.PauseScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
    PauseScheduleHomepage = 'pauseScheduleHomepage',

    /**
     * The **View run history** action **Liveboard Schedules** page.
     * Allows viewing schedule run history.
     * @example
     * ```js
     * disabledActions: [Action.ViewScheduleRunHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
    ViewScheduleRunHomepage = 'viewScheduleRunHomepage',

    /**
     * Action ID to hide or disable the
     * unsubscribe option for Liveboard schedules.
     * @example
     * ```js
     * disabledActions: [Action.UnsubscribeScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
    UnsubscribeScheduleHomepage = 'unsubscribeScheduleHomepage',

    /**
     * The **Manage Tags** action on Homepage Favourite Module.
     * @example
     * ```js
     * disabledActions: [Action.ManageTags]
     * ```
     * @version SDK : 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
    ManageTags = 'manageTags',

    /**
     * The **Delete** action on the **Liveboard Schedules* page.
     * Deletes a Liveboard schedule.
     * @example
     * ```js
     * disabledActions: [Action.DeleteScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
    DeleteScheduleHomepage = 'deleteScheduleHomepage',

    /**
     * The **Analyze CTA** action on KPI chart.
     * @example
     * ```js
     * disabledActions: [Action.KPIAnalysisCTA]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
    KPIAnalysisCTA = 'kpiAnalysisCTA',
    /**
     * Action ID for disabling chip reorder in Answer and Liveboard
     * @example
     * ```js
     * const disabledActions = [Action.DisableChipReorder]
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    DisableChipReorder = 'disableChipReorder',

    /**
     * Action ID to show, hide, or disable filters
     * in a Liveboard tab.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.ChangeFilterVisibilityInTab]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    ChangeFilterVisibilityInTab = 'changeFilterVisibilityInTab',

    /**
     * The **Preview data** button on the Spotter interface.
     * Allows previewing the data used for Spotter queries.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.PreviewDataSpotter]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    PreviewDataSpotter = 'previewDataSpotter',

    /**
     * The **Reset** link on the Spotter interface.
     * Resets the conversation with Spotter.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.ResetSpotterChat]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    ResetSpotterChat = 'resetSpotterChat',
    /**
     * Action ID for hide or disable the
     * Spotter feedback widget.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.SpotterFeedback]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    SpotterFeedback = 'spotterFeedback',
    /**
     * Action ID for hide or disable
     * the previous prompt edit option in Spotter.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.EditPreviousPrompt]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    EditPreviousPrompt = 'editPreviousPrompt',
    /**
     * Action ID for hide or disable
     * the previous prompt deletion option in Spotter.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.DeletePreviousPrompt]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    DeletePreviousPrompt = 'deletePreviousPrompt',
    /**
     * Action ID for hide or disable editing tokens generated from
     * Spotter results.
     *  @example
     * ```js
     * hiddenAction: [Action.EditTokens]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    EditTokens = 'editTokens',
    /**
     * Action ID for hiding rename option for Column rename
     *  @example
     * ```js
     * hiddenAction: [Action.ColumnRename]
     * ```
     *  @version SDK: 1.37.0 | ThoughtSpot Cloud: 10.8.0.cl
     */
    ColumnRename = 'columnRename',
    /**
     * Action ID for hide checkboxes for include or exclude
     * cover and filter pages in the Liveboard PDF
     *  @example
     * ```js
     * hiddenAction: [Action.CoverAndFilterOptionInPDF]
     * ```
     *  @version SDK: 1.37.0 | ThoughtSpot Cloud: 10.8.0.cl
     */
    CoverAndFilterOptionInPDF = 'coverAndFilterOptionInPDF',
    /**
     * Action ID for hide or disable the
     * Spotter in conversation training widget.
     * The Add to Coaching feature is currently in beta
     * and is disabled by default on embed deployments.
     * To enable this feature on your instance,
     * contact ThoughtSpot Support.
     *  @example
     * ```js
     * hiddenAction: [Action.InConversationTraining]
     * disabledActions: [Action.InConversationTraining]
     *
     * ```
     *  @version SDK: 1.39.0 | ThoughtSpot Cloud: 10.10.0.cl
     */
    InConversationTraining = 'InConversationTraining',
    /**
     * Action ID to hide the warnings banner in
     * Spotter results. It's an EA feature and
     * handled by LD.
     *  @example
     * ```js
     * hiddenAction: [Action.SpotterWarningsBanner]
     * ```
     *  @version SDK: 1.41.0 | ThoughtSpot Cloud: 10.13.0.cl
     */
    SpotterWarningsBanner = 'SpotterWarningsBanner',
    /**
     * Action ID to hide the warnings border on the knowledge
     * card in Spotter results. It's an EA feature and
     * handled by LD.
     *  @example
     * ```js
     * hiddenAction: [Action.SpotterWarningsOnTokens]
     * ```
     *  @version SDK: 1.41.0 | ThoughtSpot Cloud: 10.13.0.cl
     */
    SpotterWarningsOnTokens = 'SpotterWarningsOnTokens',
    /**
     * Action ID to disable the click event handler on knowledge
     * card in Spotter results. It's an EA feature and
     * handled by LD.
     *  @example
     * ```js
     * hiddenAction: [Action.SpotterTokenQuickEdit]
     * ```
     *  @version SDK: 1.41.0 | ThoughtSpot Cloud: 10.13.0.cl
     */
    SpotterTokenQuickEdit = 'SpotterTokenQuickEdit',
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
 * Enum for options to change context trigger.
 * The `BOTH_CLICKS` option is available from 10.8.0.cl.
 */
export enum ContextMenuTriggerOptions {
    LEFT_CLICK = 'left-click',
    RIGHT_CLICK = 'right-click',
    BOTH_CLICKS = 'both-clicks',
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

/**
 * Enum options to show or suppress Visual Embed SDK and
 * ThoughtSpot application logs in the console output.
 * This attribute doesn't support suppressing
 * browser warnings or errors.
 */

export enum LogLevel {
    /**
     * No application or SDK-related logs will be logged
     * in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.SILENT,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    SILENT = 'SILENT',
    /**
     * Log only errors in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.ERROR,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    ERROR = 'ERROR',
    /**
     * Log only warnings and errors in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.WARN,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    WARN = 'WARN',
    /**
     * Log only the information alerts, warnings, and errors
     * in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.INFO,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    INFO = 'INFO',

    /**
     * Log debug messages, warnings, information alerts,
     * and errors in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.DEBUG,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    DEBUG = 'DEBUG',
    /**
     * All logs will be logged in the browser console.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.TRACE,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    TRACE = 'TRACE',
}

export interface DefaultAppInitData {
    customisations: CustomisationsInterface;
    authToken: string;
    runtimeFilterParams: string | null;
    runtimeParameterParams: string | null;
    hiddenHomepageModules: HomepageModule[];
    reorderedHomepageModules: string[];
    hostConfig: Record<string, any>;
    hiddenHomeLeftNavItems: string[];
    customVariablesForThirdPartyTools: Record<string, any>;
    hiddenListColumns: ListPageColumns[];
}
