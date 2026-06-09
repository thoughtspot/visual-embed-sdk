import { EmbedConfig } from '../types';
/**
 * Gets the embed configuration settings that were used to
 * initialize the SDK.
 * @returns {@link EmbedConfig}
 *
 * @example
 * ```js
 * import { getInitConfig } from '@thoughtspot/visual-embed-sdk';
 * // Call the getInitConfig method to retrieve the embed configuration
 * const config = getInitConfig();
 * // Log the configuration settings
 * console.log(config);
 * ```
 * Returns the link:https://developers.thoughtspot.com/docs/Interface_EmbedConfig[EmbedConfig]
 * object, which contains the configuration settings used to
 * initialize the SDK, including the following:
 *
 *  - `thoughtSpotHost` - ThoughtSpot host URL
 *  - `authType`: The authentication method used. For example,
 * `AuthServerCookieless` for  `AuthType.TrustedAuthTokenCookieless`
 *  - `customizations` - Style, text, and icon customization settings
 *  that were applied during the SDK initialization.
 *
 * The following JSON output shows the embed configuration
 * settings returned from the code in the previous example:
 *
 * @example
 * ```json
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
 * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw, and later
 * @group Global methods
 */
export declare const getEmbedConfig: () => EmbedConfig;
/**
 * Sets the configuration embed was initialized with.
 * And returns the new configuration.
 * @param newConfig The configuration to set.
 * @version SDK: 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.1.sw, and later
 * @group Global methods
 */
export declare const setEmbedConfig: (newConfig: EmbedConfig) => any;
//# sourceMappingURL=embedConfig.d.ts.map