import { EmbedConfig, PrefetchFeatures } from '../types';
import { notifyAuthFailure, notifyAuthSDKSuccess, notifyAuthSuccess, notifyLogout, AuthEventEmitter } from '../auth';
import '../utils/with-resolvers-polyfill';
export interface executeTMLInput {
    metadata_tmls: string[];
    import_policy?: 'PARTIAL' | 'ALL_OR_NONE' | 'VALIDATE_ONLY';
    create_new?: boolean;
}
export interface exportTMLInput {
    metadata: {
        identifier: string;
        type?: 'LIVEBOARD' | 'ANSWER' | 'LOGICAL_TABLE' | 'CONNECTION';
    }[];
    export_associated?: boolean;
    export_fqn?: boolean;
    edoc_format?: 'YAML' | 'JSON';
}
export declare let authPromise: Promise<boolean>;
export declare const getAuthPromise: () => Promise<boolean>;
export { notifyAuthFailure, notifyAuthSDKSuccess, notifyAuthSuccess, notifyLogout, };
/**
 * Perform authentication on the ThoughtSpot app as applicable.
 */
export declare const handleAuth: () => Promise<boolean>;
/**
 * Prefetches static resources from the specified URL. Web browsers can then cache the
 * prefetched resources and serve them from the user's local disk to provide faster access
 * to your app.
 * @param url The URL provided for prefetch
 * @param prefetchFeatures Specify features which needs to be prefetched.
 * @param additionalFlags This can be used to add any URL flag.
 * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 7.2.1
 * @group Global methods
 */
export declare const prefetch: (url?: string, prefetchFeatures?: PrefetchFeatures[], additionalFlags?: {
    [key: string]: string | number | boolean;
}) => void;
export declare const createAndSetInitPromise: () => void;
export declare const getInitPromise: () => Promise<ReturnType<typeof init>>;
export declare const getIsInitCompleted: () => boolean;
export declare const getIsInitCalled: () => boolean;
/**
 * Initializes the Visual Embed SDK globally and perform
 * authentication if applicable. This function needs to be called before any ThoughtSpot
 * component like Liveboard etc can be embedded. But need not wait for AuthEvent.SUCCESS
 * to actually embed. That is handled internally.
 * @param embedConfig The configuration object containing ThoughtSpot host,
 * authentication mechanism and so on.
 * @example
 * ```js
 *   const authStatus = init({
 *     thoughtSpotHost: 'https://my.thoughtspot.cloud',
 *     authType: AuthType.None,
 *   });
 *   authStatus.on(AuthStatus.FAILURE, (reason) => { // do something here });
 * ```
 * @returns {@link AuthEventEmitter} event emitter which emits events on authentication success,
 *      failure and logout. See {@link AuthStatus}
 * @version SDK: 1.0.0 | ThoughtSpot ts7.april.cl, 7.2.1
 * @group Authentication / Init
 */
export declare const init: (embedConfig: EmbedConfig) => AuthEventEmitter | null;
/**
 *
 */
export declare function disableAutoLogin(): void;
/**
 * Logs out from ThoughtSpot. This also sets the autoLogin flag to false, to
 * prevent the SDK from automatically logging in again.
 *
 * You can call the `init` method again to re login, if autoLogin is set to
 * true in this second call it will be honored.
 * @param doNotDisableAutoLogin This flag when passed will not disable autoLogin
 * @returns Promise which resolves when logout completes.
 * @version SDK: 1.10.1 | ThoughtSpot: 8.2.0.cl, 8.4.1-sw
 * @group Global methods
 */
export declare const logout: (doNotDisableAutoLogin?: boolean) => Promise<boolean>;
/**
 * Renders functions in a queue, resolves to next function only after the callback next
 * is called
 * @param fn The function being registered
 */
export declare const renderInQueue: (fn: (next?: (val?: any) => void) => Promise<any>) => Promise<any>;
/**
 * Imports TML representation of the metadata objects into ThoughtSpot.
 * @param data
 * @returns imports TML data into ThoughtSpot
 * @example
 * ```js
 *  executeTML({
 * //Array of metadata Tmls in string format
 *      metadata_tmls: [
 *          "'\''{\"guid\":\"9bd202f5-d431-44bf-9a07-b4f7be372125\",
 *          \"liveboard\":{\"name\":\"Parameters Liveboard\"}}'\''"
 *      ],
 *      import_policy: 'PARTIAL', // Specifies the import policy for the TML import.
 *      create_new: false, // If selected, creates TML objects with new GUIDs.
 *  }).then(result => {
 *      console.log(result);
 *  }).catch(error => {
 *      console.error(error);
 *  });
 * ```
 * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
 * @group Global methods
 */
export declare const executeTML: (data: executeTMLInput) => Promise<any>;
/**
 * Exports TML representation of the metadata objects from ThoughtSpot in JSON or YAML
 * format.
 * @param data
 * @returns exports TML data
 * @example
 * ```js
 * exportTML({
 *   metadata: [
 *     {
 *       type: "LIVEBOARD", //Metadata Type
 *       identifier: "9bd202f5-d431-44bf-9a07-b4f7be372125" //Metadata Id
 *     }
 *   ],
 *   export_associated: false,//indicates whether to export associated metadata objects
 *   export_fqn: false, //Adds FQNs of the referenced objects.For example, if you are
 *                      //exporting a Liveboard and its associated objects, the API
 *                      //returns the Liveboard TML data with the FQNs of the referenced
 *                      //worksheet. If the exported TML data includes FQNs, you don't need
 *                      //to manually add FQNs of the referenced objects during TML import.
 *   edoc_format: "JSON" //It takes JSON or YAML value
 * }).then(result => {
 *   console.log(result);
 * }).catch(error => {
 *   console.error(error);
 * });
 * ```
 * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
 * @group Global methods
 */
export declare const exportTML: (data: exportTMLInput) => Promise<any>;
/**
 *
 */
export declare function reset(): void;
/**
 * Reloads the ThoughtSpot iframe.
 * @version SDK: 1.43.1
 * @param iFrame
 * @group Global methods
 */
export declare const reloadIframe: (iFrame: HTMLIFrameElement) => void;
//# sourceMappingURL=base.d.ts.map