import EventEmitter from 'eventemitter3';
import { AuthEvent, AuthStatus, setAuthEE } from 'src/auth';
import { setMobileEmbedConfig } from 'src/embed/embedConfig';
import { getCustomisationsMobileEmbed, getQueryParamString } from '../utils';
import { Param } from '../types';
import pkgInfo from '../../package.json';
import { WebViewConfig } from './types';
import { logger } from '../utils/logger';
import { handleAuth } from './handleAuth';

/**
 * This method constructs the webview URL with given config.
 * @param config To get the webviewURL pass the necessary config options.
 * host: string;
 * authType: AuthType;
 * liveboardId: string;
 * getAuthToken: () => Promise<string>;
 * These four are necessary arguments.
 * @returns The Promise for WebView URL.
 */
export const getWebViewUrl = async (config: WebViewConfig): Promise<string> => {
    if (typeof config.getAuthToken !== 'function') {
        throw new Error('`getAuthToken` must be a function that returns a Promise.');
    }

    const authToken = await config.getAuthToken();
    if (!authToken) {
        throw new Error('Failed to fetch initial authentication token.');
    }

    const hostAppUrl = encodeURIComponent(
        config.thoughtSpotHost.includes('localhost')
      || config.thoughtSpotHost.includes('127.0.0.1')
      || config.thoughtSpotHost.includes('10.0.2.2')
            ? 'local-host'
            : config.thoughtSpotHost,
    );

    const queryParams = {
        [Param.EmbedApp]: true,
        [Param.HostAppUrl]: hostAppUrl,
        [Param.Version]: pkgInfo.version,
        [Param.AuthType]: config.authType,
        [Param.livedBoardEmbed]: true,
        [Param.EnableFlipTooltipToContextMenu]: true,
        [Param.ContextMenuTrigger]: true,
    };

    const queryString = getQueryParamString(queryParams);
    const webViewUrl = `${config.thoughtSpotHost}/embed?${queryString}#/embed/viz/${encodeURIComponent(config.liveboardId)}`;
    return webViewUrl;
};

/**
 * setting up message handling for the message replies to TS instances.
 * @param config The webview config
 * @param event The message event from the WebView.
 * @param WebViewRef Ref to use and inject javascript
 * @param webViewRef
 */
export const setupWebViewMessageHandler = async (
    config: WebViewConfig,
    event: any,
    webViewRef: any,
) => {
    const message = JSON.parse(event.nativeEvent.data);

    const injectJavaScript = (codeSnip: string) => {
        if (webViewRef?.current) {
            webViewRef.current.injectJavaScript(codeSnip);
        } else {
            logger.error('Reference for Webview not found!!');
        }
    };

    const defaultHandleMessage = async () => {
        switch (message.type) {
            case 'appInit': {
                try {
                    const authToken = await config.getAuthToken();
                    const initPayload = {
                        type: 'appInit',
                        data: {
                            host: config.thoughtSpotHost,
                            authToken,
                            customisations: getCustomisationsMobileEmbed(config),
                        },
                    };
                    injectJavaScript(jsCodeToHandleInteractionsForContextMenu);
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

    if (config.handleMessage) {
        await config.handleMessage(event);
    } else {
        await defaultHandleMessage();
    }
};

/**
 *
 * @param embedConfig
 * @param webViewRef
 */
export function initMobile(embedConfig: WebViewConfig, webViewRef?: any)
: EventEmitter<AuthStatus | AuthEvent> {
    const authEE = new EventEmitter<AuthStatus | AuthEvent>();
    setMobileEmbedConfig(embedConfig);
    setAuthEE(authEE);

    handleAuth();

    if (embedConfig.autoAttachWebViewHandler && webViewRef?.current) {
        const originalOnMessage = webViewRef.current.props?.onMessage;
        webViewRef.current.props.onMessage = (event: any) => {
            // If the user has some onMessage Added.
            if (originalOnMessage) {
                originalOnMessage(event);
            }
            // Then we execute ours.
            setupWebViewMessageHandler(embedConfig, event, webViewRef);
        };
    }

    return authEE;
}

const jsCodeToHandleInteractionsForContextMenu = `
// Disabling auofocus
document.querySelectorAll('input[autofocus], textarea[autofocus]').forEach(el => el.removeAttribute('autofocus'));

// adding meta tag to keep fixed viewport scalign
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
document.head.appendChild(meta);

// input focus problem. -> we can just force it inside our view. 
document.addEventListener('focusin', (event) => {
  const target = event.target;

  if (
    target.tagName === 'INPUT' || 
    target.tagName === 'TEXTAREA'
  ) {
    const rect = target.getBoundingClientRect();
    if (
      rect.top < 0 || 
      rect.bottom > window.innerHeight || 
      rect.left < 0 || 
      rect.right > window.innerWidth
    ) {
      event.preventDefault();
      // target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'end' });
      const horizontalPadding = 10;

      let scrollX = 0;

      if (rect.left < horizontalPadding) {
        scrollX = rect.left - horizontalPadding;
      }  
      if (rect.right > window.innerWidth - horizontalPadding) {
        scrollX = rect.right - window.innerWidth + horizontalPadding;
      }
      const scrollY = rect.top - (window.innerHeight / 2 - rect.height / 2);

      window.scrollBy({
        top: scrollY,
        left: scrollX,
        behavior: 'smooth',
      })
    }
  }
});
`;
