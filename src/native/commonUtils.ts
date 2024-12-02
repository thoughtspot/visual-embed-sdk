import { getQueryParamString } from '../utils';
import { AuthType, Param } from '../types';
import pkgInfo from '../../package.json';

const { version } = pkgInfo;

interface WebViewConfig {
  host: string;
  authType: AuthType;
  liveboardId: string;
  getAuthToken: () => Promise<string>;
}

/**
 * Constructs the WebView URL for embedding and handles internal events.
 * @param config Configuration for the WebView.
 * @param webViewRef Reference to the WebView instance for communication.
 * @returns The constructed WebView URL.
 */
export const getWebViewUrl = async (config: WebViewConfig, webViewRef: any): Promise<string> => {
  if (typeof config.getAuthToken !== 'function') {
    throw new Error('`getAuthToken` must be a function that returns a Promise.');
  }

  const authToken = await config.getAuthToken();
  if (!authToken) {
    throw new Error('Failed to fetch initial authentication token.');
  }

  const hostAppUrl = encodeURIComponent(
    config.host.includes('localhost')
      || config.host.includes('127.0.0.1')
      || config.host.includes('10.0.2.2')
      ? 'local-host'
      : config.host
  );

  const queryParams = {
    [Param.EmbedApp]: true,
    [Param.HostAppUrl]: hostAppUrl,
    [Param.Version]: pkgInfo.version,
    [Param.AuthType]: config.authType,
    [Param.livedBoardEmbed]: true,
  };

  const queryString = getQueryParamString(queryParams);
  const webViewUrl = `${config.host}/embed?${queryString}#/embed/viz/${encodeURIComponent(config.liveboardId)}`;

  setupWebViewMessageHandler(config, webViewRef);

  return webViewUrl;
};


/**
 * Sets up the message handling for the WebView to handle events like `appInit` and `AuthExpired`.
 * @param config The WebView configuration.
 * @param webViewRef Reference to the WebView instance for communication.
 */
const setupWebViewMessageHandler = (config: WebViewConfig, webViewRef: any) => {
  const injectJavaScript = (code: string) => {
    webViewRef.current?.injectJavaScript(code);
  };

  const handleMessage = async (event: any) => {
    const message = JSON.parse(event.nativeEvent.data);

    switch (message.type) {
      case 'appInit': {
        try {
          const authToken = await config.getAuthToken();
          const initPayload = {
            type: 'appInit',
            data: {
              host: config.host,
              authToken,
            },
          };
          injectJavaScript(`window.postMessage(${JSON.stringify(initPayload)}, '*');`);
        } catch (error) {
          console.error('Error handling appInit:', error);
        }
        break;
      }

      case 'ThoughtspotAuthExpired': {
        try {
          const newAuthToken = await config.getAuthToken();
          if (newAuthToken) {
            const authExpirePayload = {
              type: 'ThoughtspotAuthExpired',
              data: { authToken: newAuthToken },
            };
            injectJavaScript(`window.postMessage(${JSON.stringify(authExpirePayload)}, '*');`);
          }
        } catch (error) {
          console.error('Error refreshing token on expiry:', error);
        }
        break;
      }

      case 'ThoughtspotAuthFailure': {
        try {
          const newAuthToken = await config.getAuthToken();
          if (newAuthToken) {
            const authFailurePayload = {
              type: 'ThoughtspotAuthFailure',
              data: { authToken: newAuthToken },
            };
            injectJavaScript(`window.postMessage(${JSON.stringify(authFailurePayload)}, '*');`);
          }
        } catch (error) {
          console.error('Error refreshing token on failure:', error);
        }
        break;
      }

      default:
        console.warn('Unhandled message type:', message.type);
    }
  };

  webViewRef.current?.addEventListener('message', handleMessage);
};
