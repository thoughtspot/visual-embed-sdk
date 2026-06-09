export type SessionInfo = {
    releaseVersion: string;
    userGUID: string;
    currentOrgId: number;
    privileges: string[];
    mixpanelToken: string;
    isPublicUser: boolean;
    clusterId: string;
    clusterName: string;
    [key: string]: any;
};
export type PreauthInfo = {
    info?: SessionInfo;
    headers: Record<string, string>;
    status: number;
    [key: string]: any;
};
/**
 * Processes the session info response and returns the session info object.
 *  @param preauthInfoResp {any} Response from the session info API.
 *  @returns {PreauthInfo} The session info object.
 *  @example ```js
 *  const preauthInfoResp = await fetch(sessionInfoPath);
 *  const sessionInfo = await formatPreauthInfo(preauthInfoResp);
 *  console.log(sessionInfo);
 *  ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 */
export declare const formatPreauthInfo: (preauthInfoResp: any) => Promise<PreauthInfo>;
/**
 * Returns the session info object and caches it for future use.
 * Once fetched the session info object is cached and returned from the cache on
 * subsequent calls.
 * @example ```js
 * const preauthInfo = await getPreauthInfo();
 * console.log(preauthInfo);
 * ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 * @returns {Promise<SessionInfo>} The session info object.
 */
export declare function getPreauthInfo(allowCache?: boolean): Promise<PreauthInfo>;
/**
 * Returns the cached session info object and caches it for future use.
 * Once fetched the session info object is cached and returned from the cache on
 * subsequent calls.
 * This cache is cleared when inti is called OR resetCachedSessionInfo is called.
 * @example ```js
 * const sessionInfo = await getSessionInfo();
 * console.log(sessionInfo);
 * ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 * @returns {Promise<SessionInfo>} The session info object.
 */
export declare function getSessionInfo(): Promise<SessionInfo>;
/**
 * Returns the cached session info object. If the client is not authenticated the
 * function will return null.
 * @example ```js
 * const sessionInfo = getCachedSessionInfo();
 * if (sessionInfo) {
 *   console.log(sessionInfo);
 * } else {
 *   console.log('Not authenticated');
 * }
 * ```
 * @returns {SessionInfo | null} The session info object.
 * @version SDK: 1.28.3 | ThoughtSpot: *
 */
export declare function getCachedSessionInfo(): SessionInfo | null;
/**
 * Processes the session info response and returns the session info object.
 *  @param sessionInfoResp {any} Response from the session info API.
 *  @returns {SessionInfo} The session info object.
 *  @example ```js
 *  const sessionInfoResp = await fetch(sessionInfoPath);
 *  const sessionInfo = getSessionDetails(sessionInfoResp);
 *  console.log(sessionInfo);
 *  ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 */
export declare const getSessionDetails: (sessionInfoResp: any) => SessionInfo;
/**
 * Resets the cached session info object and forces a new fetch on the next call.
 * @example ```js
 * resetCachedSessionInfo();
 * const sessionInfo = await getSessionInfo();
 * console.log(sessionInfo);
 * ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 * @returns {void}
 */
export declare function resetCachedSessionInfo(): void;
/**
 * Resets the cached preauth info object and forces a new fetch on the next call.
 * @example ```js
 * resetCachedPreauthInfo();
 * const preauthInfo = await getPreauthInfo();
 * console.log(preauthInfo);
 * ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 * @returns {void}
 */
export declare function resetCachedPreauthInfo(): void;
//# sourceMappingURL=sessionInfoService.d.ts.map