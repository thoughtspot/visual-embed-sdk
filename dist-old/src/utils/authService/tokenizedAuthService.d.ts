/**
 * Fetches the session info from the ThoughtSpot server.
 * @param thoughtspotHost
 * @returns {Promise<any>}
 * @example
 * ```js
 *  const response = await sessionInfoService();
 * ```
 */
export declare function fetchPreauthInfoService(thoughtspotHost: string): Promise<any>;
/**
 * Fetches the session info from the ThoughtSpot server.
 * @param thoughtspotHost
 * @returns {Promise<any>}
 * @example
 * ```js
 *  const response = await sessionInfoService();
 * ```
 */
export declare function fetchSessionInfoService(thoughtspotHost: string): Promise<any>;
/**
 *
 * @param thoughtSpotHost
 */
export declare function fetchLogoutService(thoughtSpotHost: string): Promise<any>;
/**
 * Is active service to check if the user is logged in.
 * @param thoughtSpotHost
 * @version SDK: 1.28.4 | ThoughtSpot: *
 */
export declare function isActiveService(thoughtSpotHost: string): Promise<boolean>;
//# sourceMappingURL=tokenizedAuthService.d.ts.map