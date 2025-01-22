import { logger } from '../utils/logger';
import pkgInfo from '../../package.json';
import { getAuthenticationToken } from '../authToken';
import { processAuthFailure } from '../utils/processData';
import { getCustomisations } from '../utils';
import { getThoughtSpotHost, getV2BasePath } from '../config';
import { getEmbedConfig } from './embedConfig';
import { AuthType, Param, ViewConfig } from '../types';
import { BaseEmbed } from './baseEmbed';

/**
 * A reference type for the RN WebView (React ref).
 */
type WebViewRef = { current: any | null };

export class MobileEmbed extends BaseEmbed {
  private webViewRef?: WebViewRef;

  constructor(
      config: ViewConfig,
      webViewRef?: WebViewRef,
  ) {
      super();
      this.viewConfig = config;

      if (webViewRef) {
          this.setWebViewRef(webViewRef);
      }

      this.thoughtSpotHost = this.embedConfig.thoughtSpotHost
        || getThoughtSpotHost(this.embedConfig);
      this.thoughtSpotV2Base = getV2BasePath(this.embedConfig);
      this.shouldEncodeUrlQueryParams = this.embedConfig.shouldEncodeUrlQueryParams || false;
  }

  /**
   * Provide a setter if the WebView ref is not known at construction time.
   * @param ref
   */
  public setWebViewRef(ref: WebViewRef) {
      this.webViewRef = ref;
      this.extendMessageHandler();
  }

  private extendMessageHandler() {
      if (!this.webViewRef?.current) {
          logger.warn('WebViewRef is not set. Cannot extend message handler.');
          return;
      }

      const originalOnMessage = this.webViewRef.current.props?.onMessage;

      this.webViewRef.current.props.onMessage = (event: any) => {
          this.attachWebViewMessageHandler(event);

          if (typeof originalOnMessage === 'function') {
              try {
                  originalOnMessage(event);
              } catch (err) {
                  logger.error('Error in customer-defined onMessage handler:', err);
              }
          }
      };
  }

  private attachWebViewMessageHandler(event: any) {
      if (!this.webViewRef?.current) {
          logger.warn('WebViewRef not set, Unable to attach message handler');
          return;
      }

      try {
          const message = JSON.parse(event.nativeEvent.data);
          if (!message || typeof message !== 'object' || !message.type) {
              logger.warn('Invalid message received:', message);
              return;
          }
          switch (message.type) {
              case 'appInit':
                  this.handleAppInit();
                  break;
              case 'ThoughtspotAuthExpired':
                  this.handleAuthExpired();
                  break;
              default:
                  logger.log('NativeEmbed received an unknown message type:', message.type, message);
                  break;
          }
      } catch (error: any) {
          this.handleError(`Failed to process Message : ${String(error)}`);
      }
  }

  /**
   * Method to call injected JavaScript on the <WebView>.
   * @param codeSnip
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
      let authToken = '';
      if (this.embedConfig.authType === AuthType.TrustedAuthTokenCookieless) {
          try {
              authToken = await getAuthenticationToken(this.embedConfig);
          } catch (err) {
              this.handleError(`Failed to fetch token for APP_INIT: ${String(err)}`);
          }
      }
      try {
          const appInitData = await this.getAppInitData();
          this.isAppInitialized = true;
          const initPayload = {
              type: 'appInit',
              data: appInitData,
          };
          // Send the token + custom UI settings back to the page:
          this.injectJavaScript(`
            window.postMessage(${JSON.stringify(initPayload)}, "*");
        `);
      } catch (error: any) {
          this.handleError(`Unable to Handle appInit ${error}`);
      }
  }

  /**
   * If the embedded page says "ThoughtspotAuthExpired", we can attempt to refresh the
   * token and re-inject it.
   */
  public async handleAuthExpired() {
      let newToken = '';
      if (this.embedConfig.authType === AuthType.TrustedAuthTokenCookieless) {
          try {
              newToken = await getAuthenticationToken(this.embedConfig);
          } catch (err) {
              this.handleError(`Failed to refresh token after expiry: ${String(err)}`);
          }
      }
      try {
          const msg = {
              type: 'ThoughtspotAuthExpired',
              data: { authToken: newToken },
          };
          this.injectJavaScript(`
            window.postMessage(${JSON.stringify(msg)}, "*");
        `);
      } catch (error: any) {
          this.handleError(`Unable to handle Token Expired Event ${error}`);
      }
  }

  /**
   * Called from Mobile Embed onMessage of the Webview
   * Parse the message data and handle known event types or logs.
   * @param message
   * @param event
   */
  public handleWebViewMessage(event: any) {
      const message = JSON.parse(event.nativeEvent.data);
      if (!message || typeof message !== 'object' || !message.type) {
          logger.warn('NativeEmbed handleWebViewMessage: Invalid message:', message);
          return;
      }
      switch (message.type) {
          case 'appInit':
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
   * @param error
   */
  protected handleError(error: string) {
      this.isError = true;
      logger.error('[NativeEmbed error]:', error);
  }

  /**
   * If you want an optional "render" method, typically no-ops in native:
   */
  public render(): void {
      // Do nothing in the case of Mobile Embed
      logger.log('NativeEmbed: render called (no operation in Mobile Embed).');
  }

  /**
   * TODO: Destroy the map for the events after implementation
   */
  public destroy(): void {
      // Clear references, etc.
      this.webViewRef = undefined;
  }
}
