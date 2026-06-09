import { EmbedConfig } from './types';
export declare const getCacheAuthToken: () => string | null;
export declare const storeAuthTokenInCache: (token: string) => void;
/**
 *
 * @param embedConfig
 */
export declare function getAuthenticationToken(embedConfig: EmbedConfig, skipvalidation?: boolean): Promise<string>;
export declare const validateAuthToken: (embedConfig: EmbedConfig, authToken: string, suppressAlert?: boolean) => Promise<boolean>;
/**
 * Resets the auth token and a new token will be fetched on the next request.
 * @example
 * ```js
 * resetCachedAuthToken();
 * ```
 * @version SDK: 1.28.0 | ThoughtSpot: *
 * @group Authentication / Init
 */
export declare const resetCachedAuthToken: () => void;
//# sourceMappingURL=authToken.d.ts.map