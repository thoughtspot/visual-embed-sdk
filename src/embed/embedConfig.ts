import { getValueFromWindow, storeValueInWindow } from '../utils';
import { EmbedConfig } from '../types';

const configKey = 'embedConfig';

/**
 * Gets the `EmbedConfig` object that was used to
 * initialize the SDK. You can use this method to access the
 * embed configuration configuration settings such as the ThoughtSpot host,
 * authentication type, and other such parameters used when
 * initializing the SDK.
 *
 * @example
 * ```
 * const config = getInitConfig();
   console.log(config);
 * ````
 * @returns {@link EmbedConfig} The embed configuration settings that the SDK
 * was initialized with. This includes:
 *
 *  - `thoughtSpotHost` - ThoughtSpot host URL
 *  - `authType`: The authentication method used. For example, `AuthServerCookieless` for
 *  `AuthType.TrustedAuthTokenCookieless`
 *  - `customizations` - Style, text, and icon customization settings
 *  that were applied during the SDK initialization
 *
 * @example
 * ```
 * {
 *   "thoughtSpotHost": "https://{ThoughtSpot-Host}",
 *   "authType": "AuthServerCookieless",
 *   "customizations": {
 *    "style": {
 *        "customCSS": {
 *        "variables": {
 *            "--ts-var-button--secondary-background": "#7492d5",
 *            "--ts-var-button--secondary--hovers-background": "#aac2f8",
 *            "--ts-var-root-background": "#f1f4f8"
 *          }
 *        }
 *      }
 *    },
 *   "loginFailedMessage": "Login failed, please try again",
 *   "authTriggerText": "Authorize",
 *   "disableTokenVerification": true,
 *   "authTriggerContainer": "#your-own-div"
 *  }
 * ```
 * For a comprehensive list of embed configuration settings, see {@link EmbedConfig}.
 * @version SDK: 1.19.0 | ThoughtSpot: *
 * @group Global methods
 */
export const getEmbedConfig = (): EmbedConfig => getValueFromWindow(configKey) || ({} as any);

/**
 * Sets the configuration embed was initialized with.
 * And returns the new configuration.
 * @param newConfig The configuration to set.
 * @version SDK: 1.27.0 | ThoughtSpot: *
 * @group Global methods
 */
export const setEmbedConfig = (newConfig: EmbedConfig) => {
    storeValueInWindow(configKey, newConfig);
    return getValueFromWindow(configKey);
};
