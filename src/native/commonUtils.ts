import { getQueryParamString } from 'src/utils';
import { AuthType, Param } from 'src/types';
import pkgInfo from '../../package.json';

const { version } = pkgInfo;

interface WebViewConfig {
  host: string;
  authType: AuthType;
}

/**
 * Constructs the WebView URL based on the provided configuration.
 * @param {WebViewConfig} wConfig - Configuration for the WebView.
 * @returns {string} The constructed WebView URL.
 */
export const getWebViewUrl = (wConfig: WebViewConfig): string => {
    const hostAppUrl = encodeURIComponent(
        wConfig.host.includes('localhost')
      || wConfig.host.includes('127.0.0.1')
      || wConfig.host.includes('10.0.2.2')
            ? 'local-host'
            : wConfig.host,
    );

    const queryParams = {
        [Param.EmbedApp]: true,
        [Param.HostAppUrl]: hostAppUrl,
        [Param.Version]: version,
        [Param.AuthType]: wConfig.authType,
        ...(wConfig.authType === AuthType.TrustedAuthTokenCookieless
            ? { [Param.cookieless]: true }
            : {}),
    };

    const queryString = getQueryParamString(queryParams);
    return `${wConfig.host}/embed?${queryString}`;
};
