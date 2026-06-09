/**
 * Fetch wrapper that adds the authentication token to the request.
 * Use this to call the ThoughtSpot APIs when using the visual embed sdk.
 * The interface for this method is the same as Web `Fetch`.
 * @param input
 * @param init
 * @example
 * ```js
 * tokenizedFetch("<TS_ORIGIN>/api/rest/2.0/auth/session/user", {
 *   // .. fetch options ..
 * });
 * ```
 * @version SDK: 1.28.0
 * @group Global methods
 */
export declare const tokenizedFetch: typeof fetch;
//# sourceMappingURL=tokenizedFetch.d.ts.map