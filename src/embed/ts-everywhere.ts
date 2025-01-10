import { WebView } from 'react-native-webview';
import { logger } from '../utils/logger';
import pkgInfo from '../../package.json';
import { getAuthenticationToken } from '../authToken';
import { processAuthFailure } from '../utils/processData';
import { getCustomisations, getCustomisationsMobileEmbed } from '../utils';
import { getThoughtSpotHost, getV2BasePath } from '../config';
import { getEmbedConfig } from './embedConfig';
import { AuthType, Param } from '../types';

/**
 * A reference type for the RN WebView (React ref).
 */
type WebViewRef = { current: WebView | null };

/**
 * Minimal config interface for a NativeEmbed scenario.
 */
export interface NativeEmbedConfig {
  thoughtSpotHost?: string;      // e.g., 'https://my-instance.cloud'
  authType?: AuthType;           // e.g., 'TrustedAuthTokenCookieless'
  hiddenActions?: string[];      // e.g., ['ReportError']
  additionalFlags?: Record<string, any>;
  // Add any other fields relevant to your scenario...
}

export class NativeEmbed {
  private config: NativeEmbedConfig;
  private embedConfig = getEmbedConfig(); // Global or user-supplied
  private webViewRef?: WebViewRef;

  /**
   * Cached info about the final TS host, v2 base path, 
   * and whether we base64-encode URL params.
   */
  private thoughtSpotHost: string;
  private thoughtSpotV2Base: string;
  private shouldEncodeUrlQueryParams = false;

  /**
   * Track if we've run into errors
   */
  private isError = false;

  constructor(
    config: NativeEmbedConfig,
    webViewRef?: WebViewRef,
  ) {
    // Merge user config with any global embed config if needed
    this.config = config;

    // Set up references
    if (webViewRef) {
      this.webViewRef = webViewRef;
    }

    // Determine final ThoughtSpot host, base path, and flags
    this.thoughtSpotHost =
      this.config.thoughtSpotHost || getThoughtSpotHost(this.embedConfig);
    this.thoughtSpotV2Base = getV2BasePath(this.embedConfig);
    this.shouldEncodeUrlQueryParams =
      this.embedConfig.shouldEncodeUrlQueryParams || false;

    logger.log('NativeEmbed constructed with config:', config);
  }

  /**
   * Provide a setter if the WebView ref is not known at construction time.
   */
  public setWebViewRef(ref: WebViewRef) {
    this.webViewRef = ref;
  }

  /**
   * Construct a final embed URL for the “iframe” concept, 
   * but in native we'll load this in <WebView source={{ uri: ... }} />.
   */
  public getEmbedUrl(): string {
    // 1) Build an object of base query params
    const queryParams = this.getBaseQueryParams();

    // 2) Convert to query string
    let queryString = this.toQueryString(queryParams);

    // 3) If base64 encoding is required, do that
    if (this.shouldEncodeUrlQueryParams) {
      // strip off leading '?'
      queryString = `?base64UrlEncodedFlags=${this.encodeQueryString(queryString.slice(1))}`;
    }

    // 4) Combine with host + v2 base path
    const baseUrl = [this.thoughtSpotHost, this.thoughtSpotV2Base, queryString]
      .filter(Boolean)
      .join('/') + '#';

    // For example:
    //   https://my-instance.com/v2?embedApp=true&authType=...
    //   plus a '#' route or /embed?someFlags#/embed/viz
    logger.log('NativeEmbed final URL:', baseUrl);
    return baseUrl;
  }

  /**
   * Build base query params similar to how the web embed does, but stripped of DOM/iframe specifics.
   */
  protected getBaseQueryParams(): Record<string, string | boolean | number> {
    const p: Record<string, string | boolean | number> = {};

    // e.g., always embed
    p[Param.EmbedApp] = true;

    // client SDK version
    p[Param.Version] = pkgInfo.version;

    // Handle authType from config
    p[Param.AuthType] = this.config.authType || AuthType.TrustedAuthTokenCookieless;

    // Possibly hide some actions
    if (this.config.hiddenActions && this.config.hiddenActions.length) {
      p[Param.HideActions] = this.config.hiddenActions.join(',');
    }

    // If user has additional flags
    if (this.config.additionalFlags) {
      Object.assign(p, this.config.additionalFlags);
    }

    return p;
  }

  /**
   * Convert the query params object to a query string, e.g. { embedApp: true } => '?embedApp=true'
   */
  protected toQueryString(params: Record<string, any>): string {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      sp.set(k, String(v));
    });
    return `?${sp.toString()}`;
  }

  /**
   * If we do base64 encoding of the entire query string
   */
  protected encodeQueryString(qs: string): string {
    // A safe base64 or a custom approach
    return btoa(qs); // e.g., basic btoa if environment supports it
  }

  /**
   * Method to call injected JavaScript on the <WebView>.
   */
  public injectJavaScript(codeSnip: string) {
    if (!this.webViewRef?.current) {
      logger.error('injectJavaScript called but no valid webViewRef found.');
      return;
    }
    this.webViewRef.current.injectJavaScript(codeSnip);
  }

  /**
   * If your embedded page sends a message "APP_INIT", we might handle it here 
   * to fetch an auth token or do custom styling.
   */
  public async handleAppInit() {
    // e.g., if token is needed
    if (this.config.authType === AuthType.TrustedAuthTokenCookieless) {
      try {
        const token = await getAuthenticationToken(this.embedConfig);
        const initPayload = {
          type: 'APP_INIT_RESPONSE',
          data: {
            authToken: token,
            customisations: getCustomisationsMobileEmbed(this.embedConfig),
          },
        };
        // Send the token + custom UI settings back to the page:
        this.injectJavaScript(`
          window.postMessage(${JSON.stringify(initPayload)}, "*");
        `);
      } catch (err) {
        this.handleError('Failed to fetch token for APP_INIT: ' + String(err));
      }
    }
    // else do nothing
  }

  /**
   * If the embedded page says "ThoughtspotAuthExpired", we can attempt to refresh the token
   * and re-inject it.
   */
  public async handleAuthExpired() {
    if (this.config.authType === AuthType.TrustedAuthTokenCookieless) {
      try {
        const newToken = await getAuthenticationToken(this.embedConfig);
        const msg = {
          type: 'ThoughtspotAuthExpiredResponse',
          data: { authToken: newToken },
        };
        this.injectJavaScript(`
          window.postMessage(${JSON.stringify(msg)}, "*");
        `);
      } catch (err) {
        this.handleError('Failed to refresh token after expiry: ' + String(err));
      }
    }
  }

  /**
   * Called from your RN <WebView onMessage> flow. 
   * E.g., parse the message data and handle known event types or logs.
   */
  public handleWebViewMessage(message: any) {
    if (!message || typeof message !== 'object' || !message.type) {
      logger.warn('NativeEmbed handleWebViewMessage: Invalid message:', message);
      return;
    }
    switch (message.type) {
      case 'APP_INIT':
        this.handleAppInit();
        break;
      case 'ThoughtspotAuthExpired':
        this.handleAuthExpired();
        break;
      default:
        logger.log('NativeEmbed received an unknown message type:', message.type, message);
        break;
    }
  }

  /**
   * Minimal error handler
   */
  protected handleError(error: string) {
    this.isError = true;
    logger.error('[NativeEmbed error]:', error);
  }

  /**
   * If you want an optional "render" method, typically no-ops in native:
   */
  public render(): void {
    // Do nothing; in RN, you load getEmbedUrl() in a <WebView>.
    logger.log('NativeEmbed: render called (no operation in RN).');
  }

  /**
   * A basic destroy if needed
   */
  public destroy(): void {
    logger.log('NativeEmbed: destroy called.');
    // Clear references, etc. 
    this.webViewRef = undefined;
  }
}
