import { getEmbedConfig } from '../embed/embedConfig';
import { fetchSessionInfoService, fetchPreauthInfoService } from './authService';

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

let sessionInfo: null | SessionInfo = null;
let preauthInfo: null | PreauthInfo = null;

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
export const formatPreauthInfo = async (preauthInfoResp: any): Promise<PreauthInfo> => {
    try {
        // Convert Headers to a plain object
        const headers: Record<string, string> = {};
        preauthInfoResp?.headers?.forEach((value: string, key: string) => {
            headers[key] = value;
        });
        const data = await preauthInfoResp.json();
        return {
            ...data,
            status: 200,
            headers,
        };
    } catch (error) {
        return null;
    }
};

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
export async function getPreauthInfo(allowCache = true): Promise<PreauthInfo> {
    if (!allowCache || !preauthInfo) {
        try {
            const host = getEmbedConfig().thoughtSpotHost;
            const sessionResponse = await fetchPreauthInfoService(host);
            const processedPreauthInfo = await formatPreauthInfo(sessionResponse);
            preauthInfo = processedPreauthInfo;
        } catch (error) {
            return null;
        }
    }

    return preauthInfo;
}

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
export async function getSessionInfo(): Promise<SessionInfo> {
    if (!sessionInfo) {
        const host = getEmbedConfig().thoughtSpotHost;
        const sessionResponse = await fetchSessionInfoService(host);
        const processedSessionInfo = getSessionDetails(sessionResponse);
        sessionInfo = processedSessionInfo;
    }
    return sessionInfo;
}

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
export function getCachedSessionInfo(): SessionInfo | null {
    return sessionInfo;
}

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
export const getSessionDetails = (sessionInfoResp: any): SessionInfo => {
    const devMixpanelToken = sessionInfoResp.configInfo.mixpanelConfig.devSdkKey;
    const prodMixpanelToken = sessionInfoResp.configInfo.mixpanelConfig.prodSdkKey;
    const mixpanelToken = sessionInfoResp.configInfo.mixpanelConfig.production
        ? prodMixpanelToken
        : devMixpanelToken;
    return {
        userGUID: sessionInfoResp.userGUID,
        mixpanelToken,
        isPublicUser: sessionInfoResp.configInfo.isPublicUser,
        releaseVersion: sessionInfoResp.releaseVersion,
        clusterId: sessionInfoResp.configInfo.selfClusterId,
        clusterName: sessionInfoResp.configInfo.selfClusterName,
        ...sessionInfoResp,
    };
};

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
export function resetCachedSessionInfo(): void {
    sessionInfo = null;
}

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
export function resetCachedPreauthInfo(): void {
    preauthInfo = null;
}
