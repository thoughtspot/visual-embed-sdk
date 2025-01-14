import { getEmbedConfig } from '../embed/embedConfig';
import { fetchSessionInfoService } from './authService';

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

let sessionInfo: null | SessionInfo | string = null;

/**
 * Returns the session info object and caches it for future use.
 * Once fetched the session info object is cached and returned from the cache on
 * subsequent calls.
 * @example ```js
 * const sessionInfo = await getSessionInfo();
 * console.log(sessionInfo);
 * ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 * @returns {Promise<SessionInfo>} The session info object.
 */
export async function getSessionInfo(): Promise<SessionInfo | string> {
    if (!sessionInfo) {
        const host = getEmbedConfig().thoughtSpotHost;
        const sessionResponse = await fetchSessionInfoService(host);
        const processedSessionInfo = getSessionDetails();
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
export function getCachedSessionInfo(): SessionInfo | null | string {
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
// export const getSessionDetails = (sessionInfoResp: any): SessionInfo => {
//     const devMixpanelToken = sessionInfoResp.configInfo.mixpanelConfig.devSdkKey;
//     const prodMixpanelToken = sessionInfoResp.configInfo.mixpanelConfig.prodSdkKey;
//     const mixpanelToken = sessionInfoResp.configInfo.mixpanelConfig.production
//         ? prodMixpanelToken
//         : devMixpanelToken;
//     return {
//         userGUID: sessionInfoResp.userGUID,
//         mixpanelToken,
//         isPublicUser: sessionInfoResp.configInfo.isPublicUser,
//         releaseVersion: sessionInfoResp.releaseVersion,
//         clusterId: sessionInfoResp.configInfo.selfClusterId,
//         clusterName: sessionInfoResp.configInfo.selfClusterName,
//         ...sessionInfoResp,
//     };
// };

const getSessionDetails = () => {
    const x = '5';
    return x;
};

/**
 * Resets the cached session info object and forces a new fetch on the next call.
 * @example ```js
 * resetCachedSessionInfo();
 * const sessionInfo = await getSessionInfo();
 * console.log(sessionInfo);
 * ```
 * @version SDK: 1.28.3 | ThoughtSpot ts7.april.cl, 7.2.1
 * @returns {void}
 */
export function resetCachedSessionInfo(): void {
    sessionInfo = null;
}
