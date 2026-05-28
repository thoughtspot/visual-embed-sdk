/* @thoughtspot/visual-embed-sdk version 1.48.0 */
'use client';
import * as React from 'react';
import React__default, { useRef, useCallback } from 'react';

function _mergeNamespaces(n, m) {
	m.forEach(function (e) {
		e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
			if (k !== 'default' && !(k in n)) {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	});
	return Object.freeze(n);
}

var has = Object.prototype.hasOwnProperty;

function find(iter, tar, key) {
	for (key of iter.keys()) {
		if (dequal(key, tar)) return key;
	}
}

function dequal(foo, bar) {
	var ctor, len, tmp;
	if (foo === bar) return true;

	if (foo && bar && (ctor=foo.constructor) === bar.constructor) {
		if (ctor === Date) return foo.getTime() === bar.getTime();
		if (ctor === RegExp) return foo.toString() === bar.toString();

		if (ctor === Array) {
			if ((len=foo.length) === bar.length) {
				while (len-- && dequal(foo[len], bar[len]));
			}
			return len === -1;
		}

		if (ctor === Set) {
			if (foo.size !== bar.size) {
				return false;
			}
			for (len of foo) {
				tmp = len;
				if (tmp && typeof tmp === 'object') {
					tmp = find(bar, tmp);
					if (!tmp) return false;
				}
				if (!bar.has(tmp)) return false;
			}
			return true;
		}

		if (ctor === Map) {
			if (foo.size !== bar.size) {
				return false;
			}
			for (len of foo) {
				tmp = len[0];
				if (tmp && typeof tmp === 'object') {
					tmp = find(bar, tmp);
					if (!tmp) return false;
				}
				if (!dequal(len[1], bar.get(tmp))) {
					return false;
				}
			}
			return true;
		}

		if (ctor === ArrayBuffer) {
			foo = new Uint8Array(foo);
			bar = new Uint8Array(bar);
		} else if (ctor === DataView) {
			if ((len=foo.byteLength) === bar.byteLength) {
				while (len-- && foo.getInt8(len) === bar.getInt8(len));
			}
			return len === -1;
		}

		if (ArrayBuffer.isView(foo)) {
			if ((len=foo.byteLength) === bar.byteLength) {
				while (len-- && foo[len] === bar[len]);
			}
			return len === -1;
		}

		if (!ctor || typeof foo === 'object') {
			len = 0;
			for (ctor in foo) {
				if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
				if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
			}
			return Object.keys(bar).length === len;
		}
	}

	return foo !== foo && bar !== bar;
}

/**
 * @param value the value to be memoized (usually a dependency list)
 * @returns a momoized version of the value as long as it remains deeply equal
 */


function useDeepCompareMemoize(value) {
  var ref = React.useRef(value);
  var signalRef = React.useRef(0);

  if (!dequal(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  } // eslint-disable-next-line react-hooks/exhaustive-deps


  return React.useMemo(function () {
    return ref.current;
  }, [signalRef.current]);
}

function useDeepCompareEffect(callback, dependencies) {


  return React.useEffect(callback, useDeepCompareMemoize(dependencies));
}

// istanbul ignore next
const isObject$1 = (obj) => {
    if (typeof obj === "object" && obj !== null) {
        if (typeof Object.getPrototypeOf === "function") {
            const prototype = Object.getPrototypeOf(obj);
            return prototype === Object.prototype || prototype === null;
        }
        return Object.prototype.toString.call(obj) === "[object Object]";
    }
    return false;
};
const merge = (...objects) => objects.reduce((result, current) => {
    if (Array.isArray(current)) {
        throw new TypeError("Arguments provided to ts-deepmerge must be objects, not arrays.");
    }
    Object.keys(current).forEach((key) => {
        if (["__proto__", "constructor", "prototype"].includes(key)) {
            return;
        }
        if (Array.isArray(result[key]) && Array.isArray(current[key])) {
            result[key] = merge.options.mergeArrays
                ? merge.options.uniqueArrayItems
                    ? Array.from(new Set(result[key].concat(current[key])))
                    : [...result[key], ...current[key]]
                : current[key];
        }
        else if (isObject$1(result[key]) && isObject$1(current[key])) {
            result[key] = merge(result[key], current[key]);
        }
        else {
            result[key] =
                current[key] === undefined
                    ? merge.options.allowUndefinedOverrides
                        ? current[key]
                        : result[key]
                    : current[key];
        }
    });
    return result;
}, {});
const defaultOptions = {
    allowUndefinedOverrides: true,
    mergeArrays: true,
    uniqueArrayItems: true,
};
merge.options = defaultOptions;
merge.withOptions = (options, ...objects) => {
    merge.options = Object.assign(Object.assign({}, defaultOptions), options);
    const result = merge(...objects);
    merge.options = defaultOptions;
    return result;
};

/**
 * Copyright (c) 2023
 *
 * TypeScript type definitions for ThoughtSpot Visual Embed SDK
 * @summary Type definitions for Embed SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
/**
 * The authentication mechanism for allowing access to
 * the embedded app
 * @group Authentication / Init
 */
var AuthType;
(function (AuthType) {
    /**
     * No authentication on the SDK. Pass-through to the embedded App. Alias for
     * `Passthrough`.
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.None,
     *  });
     * ```
     */
    AuthType["None"] = "None";
    /**
     * Passthrough SSO to the embedded application within the iframe. Requires least
     * configuration, but may not be supported by all IDPs. This will behave like `None`
     * if SSO is not configured on ThoughtSpot.
     *
     * To use this:
     * Your SAML or OpenID provider must allow iframe redirects.
     * For example, if you are using Okta as IdP, you can enable iframe embedding.
     * @version SDK: 1.15.0 | ThoughtSpot: 8.8.0.cl
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.EmbeddedSSO,
     *  });
     * ```
     */
    AuthType["EmbeddedSSO"] = "EmbeddedSSO";
    /**
     * SSO using SAML, Use {@link SAMLRedirect} instead
     * @deprecated This option is deprecated.
     * @hidden
     */
    AuthType["SSO"] = "SSO_SAML";
    /**
     * SSO using SAML, Use {@link SAMLRedirect} instead
     * @deprecated This option is deprecated.
     * @hidden
     */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    AuthType["SAML"] = "SSO_SAML";
    /**
     * SSO using SAML
     * Makes the host application redirect to the SAML IdP. Use this
     * if your IdP does not allow itself to be embedded.
     *
     * This redirects the host application to the SAML IdP. The host application
     * will be redirected back to the ThoughtSpot app after authentication.
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.SAMLRedirect,
     *  });
     * ```
     *
     * This opens the SAML IdP in a popup window. The popup is triggered
     * when the user clicks the trigger button. The popup window will be
     * closed automatically after authentication.
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.SAMLRedirect,
     *   authTriggerText: 'Login with SAML',
     *   authTriggerContainer: '#tsEmbed',
     *   inPopup: true,
     * });
     * ```
     *
     * Can also use the event to trigger the popup flow. Works the same
     * as the above example.
     * @example
     * ```js
     * const authEE = init({
     *  // ...
     *  authType: AuthType.SAMLRedirect,
     *  inPopup: true,
     * });
     *
     * someButtonOnYourPage.addEventListener('click', () => {
     *  authEE.emit(AuthEvent.TRIGGER_SSO_POPUP);
     * });
     * ```
     */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    AuthType["SAMLRedirect"] = "SSO_SAML";
    /**
     * SSO using OIDC
     * SSO using OIDC, Use {@link OIDCRedirect} instead
     * @deprecated This option is deprecated.
     * @hidden
     */
    AuthType["OIDC"] = "SSO_OIDC";
    /**
     * SSO using OIDC
     * Will make the host application redirect to the OIDC IdP.
     * See code samples in {@link SAMLRedirect}.
     */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    AuthType["OIDCRedirect"] = "SSO_OIDC";
    /**
     * Trusted authentication server
     * Use {@link TrustedAuth} instead
     * @deprecated This option is deprecated.
     * @hidden
     */
    AuthType["AuthServer"] = "AuthServer";
    /**
     * Trusted authentication server. Use your own authentication server
     * which returns a bearer token, generated using the `secret_key` obtained
     * from ThoughtSpot.
     * @example
     * ```js
     * init({
     *  // ...
     *  authType: AuthType.TrustedAuthToken,
     *  getAuthToken: () => {
     *    return fetch('https://my-backend.app/ts-token')
     *      .then((response) => response.json())
     *      .then((data) => data.token);
     *  }
     * });
     * ```
     */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    AuthType["TrustedAuthToken"] = "AuthServer";
    /**
     * Trusted authentication server Cookieless, Use your own authentication
     * server which returns a bearer token, generated using the `secret_key`
     * obtained from ThoughtSpot. This uses a cookieless authentication
     * approach, recommended to bypass the third-party cookie-blocking restriction
     * implemented by some browsers.
     * @version SDK: 1.22.0 | ThoughtSpot: 9.3.0.cl, 9.5.1.sw
     * @example
     * ```js
     * init({
     *  // ...
     *  authType: AuthType.TrustedAuthTokenCookieless,
     *  getAuthToken: () => {
     *    return fetch('https://my-backend.app/ts-token')
     *      .then((response) => response.json())
     *      .then((data) => data.token);
     *  }
     * });
     * ```
     */
    AuthType["TrustedAuthTokenCookieless"] = "AuthServerCookieless";
    /**
     * Use the ThoughtSpot login API to authenticate to the cluster directly.
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
    AuthType["Basic"] = "Basic";
})(AuthType || (AuthType = {}));
/**
 *
 * **Note**:  This attribute is not supported in the classic (V1) homepage experience.
 *
 */
var HomeLeftNavItem;
(function (HomeLeftNavItem) {
    /**
     * The *Search data* option in
     * the *Insights* left navigation panel.
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     */
    HomeLeftNavItem["SearchData"] = "search-data";
    /**
     * The *Home* menu option in
     * the *Insights* left navigation panel.
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     */
    HomeLeftNavItem["Home"] = "insights-home";
    /**
     * The *Liveboards* menu option in
     * the *Insights* left navigation panel.
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     */
    HomeLeftNavItem["Liveboards"] = "liveboards";
    /**
     * The *Answers* menu option in
     * the *Insights* left navigation panel.
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     */
    HomeLeftNavItem["Answers"] = "answers";
    /**
     * The *Monitor subscriptions* menu option in
     * the *Insights* left navigation panel.
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     */
    HomeLeftNavItem["MonitorSubscription"] = "monitor-alerts";
    /**
     * The *SpotIQ analysis* menu option in
     * the *Insights* left navigation panel.
     * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl
     */
    HomeLeftNavItem["SpotIQAnalysis"] = "spotiq-analysis";
    /**
     * The *Liveboard schedules* menu option in
     * the *Insights* left navigation panel.
     * @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
    HomeLeftNavItem["LiveboardSchedules"] = "liveboard-schedules";
    /**
     * The create option in the *Insights*
     * left navigation panel.
     * Available in the V3 navigation experience.
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HomeLeftNavItem["Create"] = "create";
    /**
     * The *Spotter* menu option in the *Insights*
     * left navigation panel.
     * Available in the V3 navigation experience.
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HomeLeftNavItem["Spotter"] = "spotter";
    /**
     * The *Favorites* section in the *Insights*
     * left navigation panel.
     * Available in the V3 navigation experience.
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    HomeLeftNavItem["Favorites"] = "favorites";
})(HomeLeftNavItem || (HomeLeftNavItem = {}));
/**
 * A map of the supported runtime filter operations
 */
var RuntimeFilterOp;
(function (RuntimeFilterOp) {
    /**
     * Equals
     */
    RuntimeFilterOp["EQ"] = "EQ";
    /**
     * Does not equal
     */
    RuntimeFilterOp["NE"] = "NE";
    /**
     * Less than
     */
    RuntimeFilterOp["LT"] = "LT";
    /**
     * Less than or equal to
     */
    RuntimeFilterOp["LE"] = "LE";
    /**
     * Greater than
     */
    RuntimeFilterOp["GT"] = "GT";
    /**
     * Greater than or equal to
     */
    RuntimeFilterOp["GE"] = "GE";
    /**
     * Contains
     */
    RuntimeFilterOp["CONTAINS"] = "CONTAINS";
    /**
     * Begins with
     */
    RuntimeFilterOp["BEGINS_WITH"] = "BEGINS_WITH";
    /**
     * Ends with
     */
    RuntimeFilterOp["ENDS_WITH"] = "ENDS_WITH";
    /**
     * Between, inclusive of higher value
     */
    RuntimeFilterOp["BW_INC_MAX"] = "BW_INC_MAX";
    /**
     * Between, inclusive of lower value
     */
    RuntimeFilterOp["BW_INC_MIN"] = "BW_INC_MIN";
    /**
     * Between, inclusive of both higher and lower value
     */
    RuntimeFilterOp["BW_INC"] = "BW_INC";
    /**
     * Between, non-inclusive
     */
    RuntimeFilterOp["BW"] = "BW";
    /**
     * Is included in this list of values
     */
    RuntimeFilterOp["IN"] = "IN";
    /**
     * Is not included in this list of values
     */
    RuntimeFilterOp["NOT_IN"] = "NOT_IN";
})(RuntimeFilterOp || (RuntimeFilterOp = {}));
/**
 * Home page modules that can be hidden
 * via `hiddenHomepageModules` and reordered via
 * `reorderedHomepageModules`.
 *
 * **Note**: This option is not supported in the classic (v1) experience.
 * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl, 10.1.0.sw
 */
var HomepageModule;
(function (HomepageModule) {
    /**
     * Search bar
     */
    HomepageModule["Search"] = "SEARCH";
    /**
     * KPI watchlist module
     */
    HomepageModule["Watchlist"] = "WATCHLIST";
    /**
     * Favorite module
     */
    HomepageModule["Favorite"] = "FAVORITE";
    /**
     * List of answers and Liveboards
     */
    HomepageModule["MyLibrary"] = "MY_LIBRARY";
    /**
     * Trending list
     */
    HomepageModule["Trending"] = "TRENDING";
    /**
     * Learning videos
     */
    HomepageModule["Learning"] = "LEARNING";
})(HomepageModule || (HomepageModule = {}));
/**
 * List page columns that can be hidden.
 * **Note**: This option is applicable to full app embedding only.
 * @version SDK: 1.38.0 | ThoughtSpot: 10.9.0.cl
 */
var ListPageColumns;
(function (ListPageColumns) {
    /**
     * Favorites
     */
    ListPageColumns["Favorites"] = "FAVOURITE";
    /**
     * Favourite Use {@link ListPageColumns.Favorites} instead.
     * @deprecated This option is deprecated.
     */
    ListPageColumns["Favourite"] = "FAVOURITE";
    /**
     * Tags
     */
    ListPageColumns["Tags"] = "TAGS";
    /**
     * Author
     */
    ListPageColumns["Author"] = "AUTHOR";
    /**
     * Last viewed/Last modified
     */
    ListPageColumns["DateSort"] = "DATE_SORT";
    /**
     * Share
     */
    ListPageColumns["Share"] = "SHARE";
    /**
     * Verified badge/column
     */
    ListPageColumns["Verified"] = "VERIFIED";
})(ListPageColumns || (ListPageColumns = {}));
/**
 * Event types emitted by the embedded ThoughtSpot application.
 *
 * To add an event listener use the corresponding
 * {@link LiveboardEmbed.on} or {@link AppEmbed.on} or {@link SearchEmbed.on} method.
 *  @example
 * ```js
 * import { EmbedEvent } from '@thoughtspot/visual-embed-sdk';
 * // Or
 * // const { EmbedEvent } = window.tsembed;
 *
 * // create the liveboard embed.
 *
 * liveboardEmbed.on(EmbedEvent.Drilldown, (drilldown) => {
 *   console.log('Drilldown event', drilldown);
 * }));
 * ```
 *
 * If you are using React components for embedding, you can register to any
 * events from the `EmbedEvent` list by using the `on<EventName>` convention.
 * For example,`onAlert`, `onCopyToClipboard` and so on.
 *  @example
 * ```js
 * // ...
 * const MyComponent = ({ dataSources }) => {
 *      const onLoad = () => {
 *      console.log(EmbedEvent.Load, {});
 *      };
 *
 *      return (
 *          <SearchEmbed
 *              dataSources={dataSources}
 *              onLoad = {logEvent("Load")}
 *          />
 *     );
 * };
 * ```
 * @group Events
 */
var EmbedEvent;
(function (EmbedEvent) {
    /**
     * Rendering has initialized.
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Init, showLoader)
     *  //show a loader
     * function showLoader() {
     * document.getElementById("loader");
     * }
     * ```
     * @returns timestamp - The timestamp when the event was generated.
     */
    EmbedEvent["Init"] = "init";
    /**
     * Authentication has either succeeded or failed.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.AuthInit, payload => {
     *    console.log('AuthInit', payload);
     * })
     * ```
     * @returns isLoggedIn - A Boolean specifying whether authentication was successful.
     */
    EmbedEvent["AuthInit"] = "authInit";
    /**
     * The embed object container has loaded.
     * @returns timestamp - The timestamp when the event was generated.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Load, hideLoader)
     *    //hide loader
     * function hideLoader() {
     *   document.getElementById("loader");
     * }
     * ```
     */
    EmbedEvent["Load"] = "load";
    /**
     * Data pertaining to an Answer, Liveboard or Spotter visualization is received.
     * The event payload includes the raw data of the object.
     * @return data -  Answer of Liveboard data
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Data, payload => {
     *    console.log('data', payload);
     * })
     * ```
     * @important
     */
    EmbedEvent["Data"] = "data";
    /**
     * Search query has been updated by the user.
     * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.QueryChanged, payload => console.log('data', payload))
     * ```
     */
    EmbedEvent["QueryChanged"] = "queryChanged";
    /**
     * A drill-down operation has been performed.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @returns additionalFilters - Any additional filters applied
     * @returns drillDownColumns - The columns on which drill down was performed
     * @returns nonFilteredColumns - The columns that were not filtered
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.DrillDown, {
     *    points: {
     *        clickedPoint,
     *        selectedPoints: selectedPoint
     *    },
     *    autoDrillDown: true,
     * })
     * ```
     * In this example, `VizPointDoubleClick` event is used for
     * triggering the `DrillDown` event when an area or specific
     * data point on a table or chart is double-clicked.
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.VizPointDoubleClick, (payload) => {
     *   console.log(payload);
     *   const clickedPoint = payload.data.clickedPoint;
     *   const selectedPoint = payload.data.selectedPoints;
     *   console.log('>>> called', clickedPoint);
     *   embed.trigger(HostEvent.DrillDown, {
     *      points: {
     *      clickedPoint,
     *          selectedPoints: selectedPoint
     *     },
     *   autoDrillDown: true,
     *     })
     * })
     * ```
     */
    EmbedEvent["Drilldown"] = "drillDown";
    /**
     * One or more data sources have been selected.
     * @returns dataSourceIds - the list of data sources
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.DataSourceSelected, payload => {
     *    console.log('DataSourceSelected', payload);
     * })
     * ```
     */
    EmbedEvent["DataSourceSelected"] = "dataSourceSelected";
    /**
     * One or more data columns have been selected.
     * @returns columnIds - the list of columns
     * @version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.AddRemoveColumns, payload => {
     *   console.log('AddRemoveColumns', payload);
     * })
     * ```
     */
    EmbedEvent["AddRemoveColumns"] = "addRemoveColumns";
    /**
     * A custom action has been triggered.
     * @returns actionId - ID of the custom action
     * @returns payload {@link CustomActionPayload} - Response payload with the
     * Answer or Liveboard data
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.customAction, payload => {
     *     const data = payload.data;
     *     if (data.id === 'insert Custom Action ID here') {
     *         console.log('Custom Action event:', data.embedAnswerData);
     *     }
     * })
     * ```
     */
    EmbedEvent["CustomAction"] = "customAction";
    /**
     * Listen to double click actions on a visualization.
     * @return ContextMenuInputPoints - Data point that is double-clicked
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     * @example
     * ```js
     * LiveboardEmbed.on(EmbedEvent.VizPointDoubleClick, payload => {
     *      console.log('VizPointDoubleClick', payload);
     * })
     * ```
     */
    EmbedEvent["VizPointDoubleClick"] = "vizPointDoubleClick";
    /**
     * Listen to clicks on a visualization in a Liveboard or Search result.
     * @return viz, clickedPoint - metadata about the point that is clicked
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @important
     * @example
     * ```js
     * embed.on(EmbedEvent.VizPointClick, ({data}) => {
     *   console.log(
     *    data.vizId, // viz id
     *    data.clickedPoint.selectedAttributes[0].value,
     *    data.clickedPoint.selectedAttributes[0].column.name,
     *    data.clickedPoint.selectedMeasures[0].value,
     *    data.clickedPoint.selectedMeasures[0].column.name,
     *   )
     * });
     * ```
     */
    EmbedEvent["VizPointClick"] = "vizPointClick";
    /**
     * Fired when an error occurs in the embedded component.
     *
     * **Important:** This event fires for many reasons — including internal
     * validation warnings (e.g. `HOST_EVENT_VALIDATION`), configuration issues,
     * and transient errors that ThoughtSpot already handles gracefully inside the
     * iframe. **Do not call `embed.destroy()` or unmount the embed component on
     * every error.** Doing so will tear down the iframe and abort all in-flight
     * requests, causing the embed to fail entirely.
     *
     * Only treat the following codes as unrecoverable:
     * - `INIT_ERROR` — SDK was not initialised before render
     * - `LOGIN_FAILED` — authentication could not be completed
     *
     * All other error codes should be logged and inspected, not acted upon
     * destructively.
     *
     * **Note:** There is currently no dedicated event for a true unrecoverable
     * crash. A future `EmbedEvent.FatalError` event is planned to give customers
     * a clean signal for when the embed cannot recover and needs to be torn down.
     *
     * Error types include:
     * `API` - API call failure.
     * `FULLSCREEN` - Error when presenting a Liveboard in full screen mode.
     * `VALIDATION_ERROR` - Internal host event or configuration validation warning.
     *
     * For more information, see https://developers.thoughtspot.com/docs/events-app-integration#errorType
     * @returns error - An error object or message
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * // Recommended pattern — only destroy on truly fatal errors
     * embed.on(EmbedEvent.Error, (error) => {
     *   const FATAL_CODES = ['INIT_ERROR', 'LOGIN_FAILED'];
     *   if (FATAL_CODES.includes(error.data?.code)) {
     *     embed.destroy();
     *     return;
     *   }
     *   // Log all other errors — do not destroy
     *   console.warn('Embed error (non-fatal):', error);
     * });
     * ```
     * @example
     * ```js
     * // API error
     * SearchEmbed.on(EmbedEvent.Error, (error) => {
     *   console.log(error);
     *   // { errorType: "API", message: '...', code: '...' }
     * });
     * ```
     */
    EmbedEvent["Error"] = "Error";
    /**
     * The embedded object has sent an alert.
     * @returns alert - An alert object
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.Alert)
     * ```
     */
    EmbedEvent["Alert"] = "alert";
    /**
     * The ThoughtSpot authentication session has expired.
     * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.AuthExpire, showAuthExpired)
     * //show auth expired banner
     * function showAuthExpired() {
     *    document.getElementById("authExpiredBanner");
     * }
     * ```
     */
    EmbedEvent["AuthExpire"] = "ThoughtspotAuthExpired";
    /**
     * ThoughtSpot failed to validate the auth session.
     * @hidden
     */
    EmbedEvent["AuthFailure"] = "ThoughtspotAuthFailure";
    /**
     * ThoughtSpot failed to re validate the auth session.
     * @hidden
     */
    EmbedEvent["IdleSessionTimeout"] = "IdleSessionTimeout";
    /**
     * ThoughtSpot failed to validate the auth session.
     * @hidden
     */
    EmbedEvent["AuthLogout"] = "ThoughtspotAuthLogout";
    /**
     * The height of the embedded Liveboard or visualization has been computed.
     * @returns data - The height of the embedded Liveboard or visualization
     * @hidden
     */
    EmbedEvent["EmbedHeight"] = "EMBED_HEIGHT";
    /**
     * The center of visible iframe viewport is calculated.
     * @returns data - The center of the visible Iframe viewport.
     * @hidden
     */
    EmbedEvent["EmbedIframeCenter"] = "EmbedIframeCenter";
    /**
     * Emitted when the **Get Data** action is initiated.
     * Applicable to `SearchBarEmbed` only.
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     * @example
     * ```js
     * searchbarEmbed.on(EmbedEvent.GetDataClick)
     *  .then(data => {
     *  console.log('Answer Data:', data);
     * })
     * ```
     */
    EmbedEvent["GetDataClick"] = "getDataClick";
    /**
     * Detects the route change.
     * @version SDK: 1.7.0 | ThoughtSpot: 8.0.0.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.RouteChange, payload =>
     *    console.log('data', payload))
     * ```
     */
    EmbedEvent["RouteChange"] = "ROUTE_CHANGE";
    /**
     * The v1 event type for Data
     * @hidden
     */
    EmbedEvent["V1Data"] = "exportVizDataToParent";
    /**
     * Emitted when the embed does not have cookie access. This happens
     * when third-party cookies are blocked by Safari or other
     * web browsers. `NoCookieAccess` can trigger.
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.NoCookieAccess)
     * ```
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 7.2.1.sw
     */
    EmbedEvent["NoCookieAccess"] = "noCookieAccess";
    /**
     * Emitted when SAML is complete
     * @private
     * @hidden
     */
    EmbedEvent["SAMLComplete"] = "samlComplete";
    /**
     * Emitted when any modal is opened in the app
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.DialogOpen, payload => {
     *    console.log('dialog open', payload);
     *  })
     * ```
     */
    EmbedEvent["DialogOpen"] = "dialog-open";
    /**
     * Emitted when any modal is closed in the app
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.DialogClose, payload => {
     *     console.log('dialog close', payload);
     * })
     * ```
     */
    EmbedEvent["DialogClose"] = "dialog-close";
    /**
     * Emitted when the Liveboard shell loads.
     * You can use this event as a hook to trigger
     * other events on the rendered Liveboard.
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.LiveboardRendered, payload => {
           console.log('Liveboard is rendered', payload);
       })
     * ```
     * The following example shows how to trigger
     * `SetVisibleVizs` event using LiveboardRendered embed event:
     * @example
     * ```js
     * const embedRef = useEmbedRef();
     * const onLiveboardRendered = () => {
     * embed.trigger(HostEvent.SetVisibleVizs, ['viz1', 'viz2']);
     * };
     * ```
     */
    EmbedEvent["LiveboardRendered"] = "PinboardRendered";
    /**
     * Emits all events.
     * @version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.ALL, payload => {
     *  console.log('Embed Events', payload)
     * })
     * ```
     */
    EmbedEvent["ALL"] = "*";
    /**
     * Emitted when an Answer is saved in the app.
     * Use start:true to subscribe to when save is initiated, or end:true to subscribe to when save is completed. Default is end:true.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //Emit when action starts
     *  searchEmbed.on(EmbedEvent.Save, payload => {
     *    console.log('Save', payload)
     *  }, {
     *    start: true
     * })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.Save, payload => {
     *    console.log('Save', payload)
     * })
     * ```
     */
    EmbedEvent["Save"] = "save";
    /**
     * Emitted when the download action is triggered on an Answer.
     *
     * **Note**: This event is deprecated in v1.21.0.
     * To fire an event when a download action is initiated on a chart or table,
     * use `EmbedEvent.DownloadAsPng`, `EmbedEvent.DownloadAsPDF`,
     * `EmbedEvent.DownloadAsCSV`, or `EmbedEvent.DownloadAsXLSX`
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Download, {
     * vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     */
    EmbedEvent["Download"] = "download";
    /**
     * Emitted when the download action is triggered on an Answer.
     *  Use start:true to subscribe to when download is initiated, or end:true to
     *  subscribe to when download is completed. Default is end:true.
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.0.sw
     * @example
     * ```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsPng, payload => {
     *   console.log('download PNG', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsPng, payload => {
     *   console.log('download PNG', payload)})
     * ```
     */
    EmbedEvent["DownloadAsPng"] = "downloadAsPng";
    /**
     * Emitted when the Download as PDF action is triggered on an Answer
     *  Use start:true to subscribe to when download as PDF is initiated, or end:true to
     *  subscribe to when download as PDF is completed. Default is end:true.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsPdf, payload => {
     *   console.log('download PDF', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsPdf, payload => {
     *   console.log('download PDF', payload)})
     * ```
     */
    EmbedEvent["DownloadAsPdf"] = "downloadAsPdf";
    /**
     * Emitted when the Download as CSV action is triggered on an Answer.
     *  Use start:true to subscribe to when download as CSV is initiated, or end:true to
     *  subscribe to when download as CSV is completed. Default is end:true.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsCSV, payload => {
     *   console.log('download CSV', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsCSV, payload => {
     *    console.log('download CSV', payload)})
     * ```
     */
    EmbedEvent["DownloadAsCsv"] = "downloadAsCsv";
    /**
     * Emitted when the Download as XLSX action is triggered on an Answer.
     *  Use start:true to subscribe to when download as XLSX is initiated, or end:true to
     *  subscribe to when download as XLSX is completed. Default is end:true.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsXlsx, payload => {
     *   console.log('download Xlsx', payload)}, { start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsXlsx, payload => {
     *   console.log('download Xlsx', payload)})
     * ```
     */
    EmbedEvent["DownloadAsXlsx"] = "downloadAsXlsx";
    /**
     * Emitted when the Download Liveboard as Continuous PDF action is triggered
     * on a Liveboard.
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.DownloadLiveboardAsContinuousPDF, payload => {
     *   console.log('download liveboard as continuous PDF', payload)})
     * ```
     */
    EmbedEvent["DownloadLiveboardAsContinuousPDF"] = "downloadLiveboardAsContinuousPDF";
    /**
     * Emitted when an Answer is deleted in the app
     *  Use start:true to subscribe to when delete is initiated, or end:true to subscribe
     *  to when delete is completed. Default is end:true.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * appEmbed.on(EmbedEvent.AnswerDelete, payload => {
     *    console.log('delete answer', payload)}, {start: true })
     * //trigger when action is completed
     * appEmbed.on(EmbedEvent.AnswerDelete, payload => {
     *    console.log('delete answer', payload)})
     * ```
     */
    EmbedEvent["AnswerDelete"] = "answerDelete";
    /**
     * Emitted when the AI Highlights action is triggered on a Liveboard
     * @version SDK: 1.44.0 | ThoughtSpot: 10.15.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.AIHighlights, (payload) => {
     *   console.log('AI Highlights', payload);
     * })
     * ```
     */
    EmbedEvent["AIHighlights"] = "AIHighlights";
    /**
     * Emitted when a user initiates the Pin action to
     *  add an Answer to a Liveboard.
     *  Use start:true to subscribe to when pin is initiated, or end:true to subscribe to
     *  when pin is completed. Default is end:true.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.Pin, payload => {
     *    console.log('pin', payload)
     * }, {
     * start: true
     * })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.Pin, payload => {
     *    console.log('pin', payload)
     * })
     * ```
     */
    EmbedEvent["Pin"] = "pin";
    /**
     * Emitted when SpotIQ analysis is triggered
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.SpotIQAnalyze, payload => {
     *   console.log('SpotIQAnalyze', payload)
     * }, {
     * start: true
     * })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.SpotIQAnalyze, payload => {
     *   console.log('SpotIQ analyze', payload)
     * })
     * ```
     */
    EmbedEvent["SpotIQAnalyze"] = "spotIQAnalyze";
    /**
     * Emitted when a user shares an object with another user or group
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.Share, payload => {
     *    console.log('Share', payload)
     * }, {
     * start: true
     * })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.Share, payload => {
     *   console.log('Share', payload)
     * })
     * ```
     */
    EmbedEvent["Share"] = "share";
    /**
     * Emitted when a user clicks the **Include** action to include a specific value or
     * data on a chart or table.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.DrillInclude, payload => {
     *    console.log('Drill include', payload);
     * })
     * ```
     */
    EmbedEvent["DrillInclude"] = "context-menu-item-include";
    /**
     * Emitted when a user clicks the **Exclude** action to exclude a specific value or
     * data on a chart or table
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.DrillExclude, payload => {
     *     console.log('Drill exclude', payload);
     * })
     * ```
     */
    EmbedEvent["DrillExclude"] = "context-menu-item-exclude";
    /**
     * Emitted when a column value is copied in the embedded app.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.CopyToClipboard, payload => {
     *    console.log('copy to clipboard', payload);
     * })
     * ```
     */
    EmbedEvent["CopyToClipboard"] = "context-menu-item-copy-to-clipboard";
    /**
     * Emitted when a user clicks the **Update TML** action on
     * embedded Liveboard.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.UpdateTML)
     * })
     * ```
     */
    EmbedEvent["UpdateTML"] = "updateTSL";
    /**
     * Emitted when a user clicks the **Edit TML** action
     * on an embedded Liveboard.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.EditTML, payload => {
     *    console.log('Edit TML', payload);
     * })
     * ```
     */
    EmbedEvent["EditTML"] = "editTSL";
    /**
     * Emitted when the **Export TML** action is triggered on an
     * an embedded object in the app
     *  Use start:true to subscribe to when export is initiated, or end:true to subscribe
     *  to when export is completed. Default is end:true.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.ExportTML, payload => {
     *     console.log('Export TML', payload)}, { start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.ExportTML, payload => {
     *     console.log('Export TML', payload)})
     * ```
     */
    EmbedEvent["ExportTML"] = "exportTSL";
    /**
     * Emitted when an Answer is saved as a View.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.SaveAsView, payload => {
     *    console.log('View', payload);
     * })
     * ```
     */
    EmbedEvent["SaveAsView"] = "saveAsView";
    /**
     * Emitted when the user creates a copy of an Answer.
     *  Use start:true to subscribe to when copy and edit is initiated, or end:true to
     *  subscribe to when copy and edit is completed. Default is end:true.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * //emit when action starts
     * appEmbed.on(EmbedEvent.CopyAEdit, payload => {
     *    console.log('Copy and edit', payload)}, {start: true })
     * //emit when action ends
     * appEmbed.on(EmbedEvent.CopyAEdit, payload => {
     *    console.log('Copy and edit', payload)})
     * ```
     */
    EmbedEvent["CopyAEdit"] = "copyAEdit";
    /**
     * Emitted when a user clicks *Show underlying data* on an Answer.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.ShowUnderlyingData, payload => {
     *    console.log('show data', payload);
     * })
     * ```
     */
    EmbedEvent["ShowUnderlyingData"] = "showUnderlyingData";
    /**
     * Emitted when an Answer is switched to a chart or table view.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.AnswerChartSwitcher, payload => {
     *    console.log('switch view', payload);
     * })
     * ```
     */
    EmbedEvent["AnswerChartSwitcher"] = "answerChartSwitcher";
    /**
     * Internal event to communicate the initial settings back to the ThoughtSpot app
     * @hidden
     */
    EmbedEvent["APP_INIT"] = "appInit";
    /**
     * Internal event to clear the cached info
     * @hidden
     */
    EmbedEvent["CLEAR_INFO_CACHE"] = "clearInfoCache";
    /**
     * Emitted when a user clicks **Show Liveboard details** on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.LiveboardInfo, payload => {
     *    console.log('Liveboard details', payload);
     * })
     * ```
     */
    EmbedEvent["LiveboardInfo"] = "pinboardInfo";
    /**
     * Emitted when a user clicks on the Favorite icon on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.AddToFavorites, payload => {
     *    console.log('favorites', payload);
     * })
     * ```
     */
    EmbedEvent["AddToFavorites"] = "addToFavorites";
    /**
     * Emitted when a user clicks **Schedule** on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Schedule, payload => {
     *    console.log('Liveboard schedule', payload);
     * })
     * ```
     */
    EmbedEvent["Schedule"] = "subscription";
    /**
     * Emitted when a user clicks **Edit** on a Liveboard or visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Edit, payload => {
     *    console.log('Liveboard edit', payload);
     * })
     * ```
     */
    EmbedEvent["Edit"] = "edit";
    /**
     * Emitted when a user clicks *Make a copy* on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.MakeACopy, payload => {
     *    console.log('Copy', payload);
     * })
     * ```
     */
    EmbedEvent["MakeACopy"] = "makeACopy";
    /**
     * Emitted when a user clicks **Present** on a Liveboard or visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Present)
     * ```
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Present, {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * })
     * ```
     */
    EmbedEvent["Present"] = "present";
    /**
     * Emitted when a user clicks **Delete** on a visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Delete,
     *   {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     */
    EmbedEvent["Delete"] = "delete";
    /**
     * Emitted when a user clicks Manage schedules on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SchedulesList)
     * ```
     */
    EmbedEvent["SchedulesList"] = "schedule-list";
    /**
     * Emitted when a user clicks **Cancel** in edit mode on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Cancel)
     * ```
     */
    EmbedEvent["Cancel"] = "cancel";
    /**
     * Emitted when a user clicks **Explore** on a visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.Explore,  {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     */
    EmbedEvent["Explore"] = "explore";
    /**
     * Emitted when a user clicks **Copy link** action on a visualization.
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.CopyLink, {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     */
    EmbedEvent["CopyLink"] = "embedDocument";
    /**
     * Emitted when a user interacts with cross filters on a
     * visualization or Liveboard.
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.CrossFilterChanged, {
     *    vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     */
    EmbedEvent["CrossFilterChanged"] = "cross-filter-changed";
    /**
     * Emitted when a user right clicks on a visualization (chart or table)
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     * ```js
     * LiveboardEmbed.on(EmbedEvent.VizPointRightClick, payload => {
     *    console.log('VizPointClick', payload)
     * })
     * ```
     */
    EmbedEvent["VizPointRightClick"] = "vizPointRightClick";
    /**
     * Emitted when a user clicks **Insert to slide** on a visualization
     * @hidden
     */
    EmbedEvent["InsertIntoSlide"] = "insertInToSlide";
    /**
     * Emitted when a user changes any filter on a Liveboard.
     * Returns filter type and name, column name and ID, and runtime
     * filter details.
     * @example
     *
     * ```js
     * LiveboardEmbed.on(EmbedEvent.FilterChanged, (payload) => {
     *    console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl, 9.5.0.sw
     */
    EmbedEvent["FilterChanged"] = "filterChanged";
    /**
     * Emitted when a user updates a connection on the **Data** page
     * @version SDK: 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
    EmbedEvent["UpdateConnection"] = "updateConnection";
    /**
     * Emitted when a user updates a connection on the **Data** page
     * @version SDK: 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
    EmbedEvent["CreateConnection"] = "createConnection";
    /**
     * Emitted when name, status (private or public) or filter values of a
     * Personalised view is updated.
     * This event is deprecated. Use {@link EmbedEvent.UpdatePersonalizedView} instead.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     * @deprecated SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    EmbedEvent["UpdatePersonalisedView"] = "updatePersonalisedView";
    /**
     * Emitted when name, status (private or public) or filter values of a
     * Personalized view is updated.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    EmbedEvent["UpdatePersonalizedView"] = "updatePersonalisedView";
    /**
     * Emitted when a Personalised view is saved.
     * This event is deprecated. Use {@link EmbedEvent.SavePersonalizedView} instead.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     * @deprecated SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    EmbedEvent["SavePersonalisedView"] = "savePersonalisedView";
    /**
     * Emitted when a Personalized view is saved.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    EmbedEvent["SavePersonalizedView"] = "savePersonalisedView";
    /**
     * Emitted when a Liveboard is reset.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    EmbedEvent["ResetLiveboard"] = "resetLiveboard";
    /**
     * Emitted when a PersonalisedView is deleted.
     * This event is deprecated. Use {@link EmbedEvent.DeletePersonalizedView} instead.
     * @returns views: string[]
     * @returns liveboardId: string
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     * @deprecated SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    EmbedEvent["DeletePersonalisedView"] = "deletePersonalisedView";
    /**
     * Emitted when a PersonalizedView is deleted.
     * @returns views: string[]
     * @returns liveboardId: string
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    EmbedEvent["DeletePersonalizedView"] = "deletePersonalisedView";
    /**
     * Emitted when a user selects a different Personalized View or
     * resets to the original/default view on a Liveboard.
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.ChangePersonalizedView, (data) => {
     *   console.log(data.viewName);    // 'Q4 Revenue' or 'Original View'
     *   console.log(data.viewId);      // '2a021a12-...' or null (default)
     *   console.log(data.liveboardId); // 'abc123...'
     *   console.log(data.isPublic);    // true | false
     * })
     * ```
     * @returns viewName: string - Name of the selected view,
     *   or 'Original View' when reset to default.
     * @returns viewId: string | null - GUID of the selected view,
     *   or null when reset to default.
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    EmbedEvent["ChangePersonalizedView"] = "changePersonalisedView";
    /**
     * Emitted when a user creates a Worksheet.
     * @version SDK: 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
    EmbedEvent["CreateWorksheet"] = "createWorksheet";
    /**
     * Emitted when the *Ask Sage* is initialized.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
    EmbedEvent["AskSageInit"] = "AskSageInit";
    /**
     * Emitted when a Liveboard or visualization is renamed.
     * @version SDK: 1.28.0 | ThoughtSpot: 9.10.5.cl, 10.1.0.sw
     */
    EmbedEvent["Rename"] = "rename";
    /**
     *
     * This event allows developers to intercept search execution
     * and implement logic that decides whether Search Data should return
     * data or block the search operation.
     *
     * **Prerequisite**: Set`isOnBeforeGetVizDataInterceptEnabled` to `true`
     * to ensure that `EmbedEvent.OnBeforeGetVizDataIntercept` is emitted
     * when the embedding application user tries to run a search query.
     *
     * This framework applies only to `AppEmbed` and `SearchEmbed`.
     * @param - Includes the following parameters:
     * - `payload`: The payload received from the embed related to the Data API call.
     * - `responder`: Contains elements that let developers define whether ThoughtSpot
     *   will run or block the search operation, and if blocked, which error message to
     *   provide.
     * - `execute` - When `execute` returns `true`, the search is run.
     * When `execute` returns `false`, the search is not executed.
     * - `error` - Developers can customize the user-facing error message when `execute`
     * is `false` by using the `error` parameters in `responder`.
     * - `errorText` - The error message text shown to the user.
     * @version SDK: 1.29.0 | ThoughtSpot: 10.3.0.cl
     * @example
     *
     * This example blocks search operation and returns a custom error message:
     * ```js
     * embed.on(EmbedEvent.OnBeforeGetVizDataIntercept, (payload, responder) => {
     *   responder({
     *     data: {
     *       execute: false,
     *       error: {
     *         // Provide a custom error message to explain why the search did not run.
     *         errorText: 'This search query cannot be run. Please contact your administrator for more details.',
     *       },
     *     },
     *   });
     * })
     * ```
     * @example
     *
     * This example allows the search operation to run
     * unless the query contains both `sales` and `county`,
     * and returns a custom error message if the query is rejected:
     * ```js
     * embed.on(EmbedEvent.OnBeforeGetVizDataIntercept, (payload, responder) => {
     *   // Record the search query submitted by the end user.
     *   const query = payload.data.data.answer.search_query;
     *
     *   responder({
     *     data: {
     *       // Returns true as long as the query does not include both `sales` and `county`.
     *       execute: !(query.includes('sales') && query.includes('county')),
     *       error: {
     *         // Provide a custom error message when the query is blocked by your logic.
     *         errorText:
     *           "You can't use this query: "
     *           + query
     *           + ". The 'sales' measure can never be used at the 'county' level. "
     *           + "Please try another measure or remove 'county' from your search.",
     *       },
     *     },
     *   });
     * })
     * ```
     */
    EmbedEvent["OnBeforeGetVizDataIntercept"] = "onBeforeGetVizDataIntercept";
    /**
     * Emitted when parameter changes in an Answer
     * or Liveboard.
     * ```js
     * liveboardEmbed.on(EmbedEvent.ParameterChanged, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot: 10.3.0.cl
     */
    EmbedEvent["ParameterChanged"] = "parameterChanged";
    /**
     * Emits when a table visualization is rendered in
     * the ThoughtSpot embedded app.
     *
     * You can also use this event as a hook to trigger host events
     * such as `HostEvent.TransformTableVizData` on the table visualization.
     * The event payload contains the data used in the rendered table.
     * You can extract the relevant data from the payload
     * stored in `payload.data.data.columnDataLite`.
     *
     * `columnDataLite` is a multidimensional array that contains
     * data values for each column, which was used in the query to
     * generate the table visualization. To find and modify specific cell data,
     * you can either loop through the array or directly access a cell if
     * you know its position and data index.
     *
     * In the following code sample, the first cell in the first column
     * (`columnDataLite[0].dataValue[0]`) is set to `new fob`.
     * Note that any changes made to the data in the payload will only update the
     * visual presentation and do not affect the underlying data.
     * To persist data value modifications after a reload or during chart
     * interactions such as drill down, ensure that the modified
     * payload in the `columnDataLite` is passed on to
     * `HostEvent.TransformTableVizData` and trigger an update to
     * the table visualization.
     *
     * If the Row-Level Security (RLS) rules are applied on the
     * Model, exercise caution when changing column
     * or table cell values to maintain data security.
     *
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.TableVizRendered, (payload) => {
     *      console.log(payload);
     *      const columnDataLite = payload.data.data.columnDataLite;
     *      columnDataLite[0].dataValue[0]="new fob";
     *      console.log('>>> new Data', columnDataLite);
     *      searchEmbed.trigger(HostEvent.TransformTableVizData, columnDataLite);
     * })
     * ```
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
    EmbedEvent["TableVizRendered"] = "TableVizRendered";
    /**
     * Emitted when the liveboard is created from pin modal or Liveboard list page.
     * You can use this event as a hook to trigger
     * other events on liveboard creation.
     *
     * ```js
     * liveboardEmbed.on(EmbedEvent.CreateLiveboard, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
    EmbedEvent["CreateLiveboard"] = "createLiveboard";
    /**
     * Emitted when a user creates a Model.
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
    EmbedEvent["CreateModel"] = "createModel";
    /**
     * @hidden
     * Emitted when a user exits present mode.
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    EmbedEvent["ExitPresentMode"] = "exitPresentMode";
    /**
     * Emitted when a user requests the full height lazy load data.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     * @hidden
     */
    EmbedEvent["RequestVisibleEmbedCoordinates"] = "requestVisibleEmbedCoordinates";
    /**
     * Emitted when Spotter response is text data
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterData, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    EmbedEvent["SpotterData"] = "SpotterData";
    /**
     * Emitted when user opens up the data source preview modal in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.PreviewSpotterData, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    EmbedEvent["PreviewSpotterData"] = "PreviewSpotterData";
    /**
     * Emitted when user opens up the Add to Coaching modal on any visualization in Spotter Embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.AddToCoaching, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     */
    EmbedEvent["AddToCoaching"] = "addToCoaching";
    /**
     * Emitted when user opens up the data model instructions modal in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.DataModelInstructions, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    EmbedEvent["DataModelInstructions"] = "DataModelInstructions";
    /**
     * Emitted when the Spotter query is triggered in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterQueryTriggered, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    EmbedEvent["SpotterQueryTriggered"] = "SpotterQueryTriggered";
    /**
     * Emitted when the last Spotter query is edited in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.LastPromptEdited, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    EmbedEvent["LastPromptEdited"] = "LastPromptEdited";
    /**
     * Emitted when the last Spotter query is deleted in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.LastPromptDeleted, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    EmbedEvent["LastPromptDeleted"] = "LastPromptDeleted";
    /**
     * Emitted when the conversation is reset in Spotter embed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.ResetSpotterConversation, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    EmbedEvent["ResetSpotterConversation"] = "ResetSpotterConversation";
    /**
     * Emitted when the *Spotter* is initialized.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterInit, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    EmbedEvent["SpotterInit"] = "spotterInit";
    /**
     * Emitted when a *Spotter* conversation has been successfully created.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterLoadComplete, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.44.0 | ThoughtSpot: 26.2.0.cl
     */
    EmbedEvent["SpotterLoadComplete"] = "spotterLoadComplete";
    /**
     * @hidden
     * Triggers when the embed listener is ready to receive events.
     * This is used to trigger events after the embed container is loaded.
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.EmbedListenerReady, () => {
     *     console.log('EmbedListenerReady');
     * })
     * ```
     */
    EmbedEvent["EmbedListenerReady"] = "EmbedListenerReady";
    /**
     * Emitted when the organization is switched.
     * @example
     * ```js
     * appEmbed.on(EmbedEvent.OrgSwitched, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    EmbedEvent["OrgSwitched"] = "orgSwitched";
    /**
     * Emitted when the user intercepts a URL.
     *
     * Supported on all embed types.
     *
     * @example
     *
     * ```js
     * embed.on(EmbedEvent.ApiIntercept, (payload, responder) => {
     *     console.log('payload', payload);
     *     responder({
     *         data: {
     *             execute: false,
     *             error: {
     *                 errorText: 'Error Occurred',
     *             }
     *         }
     *     })
     * })
     * ```
     *
     * ```js
     * // We can also send a response for the intercepted api
     * embed.on(EmbedEvent.ApiIntercept, (payload, responder) => {
     *     console.log('payload', payload);
     *     responder({
     *         data: {
     *             execute: false,
     *             response: {
     *                body: {
     *                    data: {
     *                       // Some api response
     *                    },
     *                }
     *             }
     *         }
     *     })
     * })
     *
     * // here embed will use the response from the responder as the response for the api
     * ```
     *
     * ```js
     * // We can also send error in response for the intercepted api
     * embed.on(EmbedEvent.ApiIntercept, (payload, responder) => {
     *     console.log('payload', payload);
     *     responder({
     *         data: {
     *             execute: false,
     *             response: {
     *                body: {
     *                    errors: [{
     *                      title: 'Error Occurred',
     *                      description: 'Error Description',
     *                      isUserError: true,
     *                    }],
     *                    data: {},
     *                },
     *             }
     *         }
     *     })
     * })
     * ```
     * @version SDK: 1.43.0 | ThoughtSpot: 10.15.0.cl
     */
    EmbedEvent["ApiIntercept"] = "ApiIntercept";
    /**
     * Emitted when a Spotter conversation is renamed.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterConversationRenamed, (payload) => {
     *     console.log('Conversation renamed', payload);
     *     // payload: { convId: string, oldTitle: string, newTitle: string }
     * })
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    EmbedEvent["SpotterConversationRenamed"] = "spotterConversationRenamed";
    /**
     * Emitted when a Spotter conversation is deleted.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterConversationDeleted, (payload) => {
     *     console.log('Conversation deleted', payload);
     *     // payload: { convId: string, title: string }
     * })
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    EmbedEvent["SpotterConversationDeleted"] = "spotterConversationDeleted";
    /**
     * Emitted when a Spotter conversation is selected/clicked.
     * @example
     * ```js
     * spotterEmbed.on(EmbedEvent.SpotterConversationSelected, (payload) => {
     *     console.log('Conversation selected', payload);
     *     // payload: { convId: string, title: string, worksheetId: string }
     * })
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    EmbedEvent["SpotterConversationSelected"] = "spotterConversationSelected";
    /**
     * @hidden
     * Emitted when the auth token is about to get expired and needs to be refreshed.
     * @example
     * ```js
     * embed.on(EmbedEvent.RefreshAuthToken, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.45.2 | ThoughtSpot: 26.3.0.cl
     */
    EmbedEvent["RefreshAuthToken"] = "RefreshAuthToken";
    /**
     * Triggered whenever the page context changes, returning the current context along with the navigation stack.
     * @example
     * ```js
     * embed.on(EmbedEvent.EmbedPageContextChanged, (payload) => {
     *     console.log('payload', payload);
     * })
     * ```
     * @version SDK: 1.47.2 | ThoughtSpot: 26.3.0.cl
     */
    EmbedEvent["EmbedPageContextChanged"] = "EmbedPageContextChanged";
    /**
     * Represents a special embed event that is triggered whenever any host event is subscribed.
     *
     * You can listen to this event when you need to dispatch a host event during load or render,
     * particularly in situations where timing issues may occur.
     *
     * @example
     * ```js
     * embed.on(`${HostEvent.Save} Subscribed`, () => {
     *     // make action
     * });
     * ```
     *
     * @example
     * ```js
     * embed.on(subscribedEvent(HostEvent.Save), () => {
     *     // make action
     * });
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.4.0.cl
     */
    EmbedEvent["Subscribed"] = "Subscribed";
    /**
     * Emitted when a user clicks the **Send Test Email** button in the
     * Liveboard schedule modal. Requires `isSendNowLiveboardSchedulingEnabled`
     * to be enabled.
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SendTestScheduleEmail, (payload) => {
     *     console.log('Send test email', payload);
     *     // payload: { liveboardId: string, sendToSelf: boolean }
     * })
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot Cloud: 26.5.0.cl
     */
    EmbedEvent["SendTestScheduleEmail"] = "sendTestScheduleEmail";
    /**
     * Emitted when the SpotterViz panel mounts in embed mode.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SpotterVizInit, (payload) => {
     *     console.log('SpotterViz initialized', payload);
     *     // payload: { liveboardId: string }
     * })
     * ```
     */
    EmbedEvent["SpotterVizInit"] = "SpotterVizInit";
    /**
     * Emitted when the user submits a prompt in the SpotterViz panel.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SpotterVizQueryTriggered, (payload) => {
     *     console.log('SpotterViz query triggered', payload);
     *     // payload: { query: string, sessionId: string }
     * })
     * ```
     */
    EmbedEvent["SpotterVizQueryTriggered"] = "SpotterVizQueryTriggered";
    /**
     * Emitted when the SpotterViz agent finishes responding.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SpotterVizResponseComplete, (payload) => {
     *     console.log('SpotterViz response complete', payload);
     *     // payload: { sessionId: string, messageId: string }
     * })
     * ```
     */
    EmbedEvent["SpotterVizResponseComplete"] = "SpotterVizResponseComplete";
    /**
     * Emitted when a checkpoint is created in the SpotterViz panel.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SpotterVizCheckpointCreated, (payload) => {
     *     console.log('SpotterViz checkpoint created', payload);
     *     // payload: { checkpointId: string, source: string, label: string }
     * })
     * ```
     */
    EmbedEvent["SpotterVizCheckpointCreated"] = "SpotterVizCheckpointCreated";
    /**
     * Emitted when a checkpoint is restored in the SpotterViz panel.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SpotterVizCheckpointRestored, (payload) => {
     *     console.log('SpotterViz checkpoint restored', payload);
     *     // payload: { checkpointId: string, newGenNumber: number }
     * })
     * ```
     */
    EmbedEvent["SpotterVizCheckpointRestored"] = "SpotterVizCheckpointRestored";
    /**
     * Emitted when an error occurs in the SpotterViz panel.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SpotterVizError, (payload) => {
     *     console.log('SpotterViz error', payload);
     * })
     * ```
     */
    EmbedEvent["SpotterVizError"] = "SpotterVizError";
    /**
     * Emitted when the SpotterViz panel is closed.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.SpotterVizClosed, (payload) => {
     *     console.log('SpotterViz panel closed', payload);
     * })
     * ```
     */
    EmbedEvent["SpotterVizClosed"] = "SpotterVizClosed";
    /**
     * Emitted when a user clicks the **Refresh** button in the
     * Liveboard header. Requires `enableLiveboardDataCache`
     * to be enabled.
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.RefreshLiveboardBrowserCache, (payload) => {
     *     console.log('Liveboard browser cache refreshed', payload);
     *     // payload: { liveboardId: string }
     * })
     * ```
     * @version SDK: 1.49.0 | ThoughtSpot Cloud: 26.6.0.cl
     */
    EmbedEvent["RefreshLiveboardBrowserCache"] = "refreshLiveboardBrowserCache";
})(EmbedEvent || (EmbedEvent = {}));
/**
 * Event types that can be triggered by the host application
 * to the embedded ThoughtSpot app.
 *
 * To trigger an event use the corresponding
 * {@link LiveboardEmbed.trigger} or {@link AppEmbed.trigger} or {@link
 * SearchEmbed.trigger} method.
 * @example
 * ```js
 * import { HostEvent } from '@thoughtspot/visual-embed-sdk';
 * // Or
 * // const { HostEvent } = window.tsembed;
 *
 * // create the liveboard embed.
 *
 * liveboardEmbed.trigger(HostEvent.UpdateRuntimeFilters, [
 *   { columnName: 'state', operator: RuntimeFilterOp.EQ, values: ["california"]}
 * ]);
 * ```
 * @example
 * If using React components to embed, use the format shown in this example:
 *
 * ```js
 *  const selectVizs = () => {
 *      embedRef.current.trigger(HostEvent.SetVisibleVizs, [
 *         "715e4613-c891-4884-be44-aa8d13701c06",
 *         "3f84d633-e325-44b2-be25-c6650e5a49cf"
 *      ]);
 *    };
 * ```
 *
 *
 * You can also attach an Embed event to a Host event to trigger
 * a specific action as shown in this example:
 * @example
 * ```js
 *  const EmbeddedComponent = () => {
 *       const embedRef = useRef(null); // import { useRef } from react
 *       const onLiveboardRendered = () => {
 *          embedRef.current.trigger(HostEvent.SetVisibleVizs, ['viz1', 'viz2']);
 *      };
 *
 *      return (
 *          <LiveboardEmbed
 *              ref={embedRef}
 *              liveboardId="<liveboard-guid>"
 *              onLiveboardRendered={onLiveboardRendered}
 *          />
 *      );
 *  }
 * ```
 *
 * **Context Parameter (SDK: 1.45.2+)**
 *
 * Starting from SDK version 1.45.2 | ThoughtSpot: 26.3.0.cl, you can optionally pass a
 * `ContextType` as the third parameter to the `trigger` method to specify the context
 * from which the event is triggered. This helps ThoughtSpot understand the current page
 * context (Search, Answer, Liveboard, or Spotter) for better event handling.
 *
 * @example
 * ```js
 * import { HostEvent, ContextType } from '@thoughtspot/visual-embed-sdk';
 *
 * // Trigger Pin event with Search context
 * appEmbed.trigger(HostEvent.Pin, {
 *     vizId: "123",
 *     liveboardId: "456"
 * }, ContextType.Search);
 * ```
 *
 * @group Events
 */
var HostEvent;
(function (HostEvent) {
    /**
     * Triggers a search operation with the search tokens specified in
     * the search query string.
     * Supported in `AppEmbed` and `SearchEmbed` deployments.
     * Includes the following properties:
     * @param - Includes the following keys:
     * - `searchQuery`: Query string with search tokens.
     * - `dataSources`: Data source GUID to search on.
     *   Although an array, only a single source is supported.
     * - `execute`: Executes search and updates the existing query.
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.Search, {
         searchQuery: "[sales] by [item type]",
         dataSources: ["cd252e5c-b552-49a8-821d-3eadaa049cca"],
         execute: true
       });
     * ```
     * @example
     * ```js
     * // Trigger search from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Search, {
     *     searchQuery: "[revenue] by [region]",
     *     dataSources: ["cd252e5c-b552-49a8-821d-3eadaa049cca"],
     *     execute: true
     * }, ContextType.Search);
     * ```
     */
    HostEvent["Search"] = "search";
    /**
     * Triggers a drill on certain points of the specified column
     * Includes the following properties:
     * @param - Includes the following keys:
     * - `points`: An object containing `selectedPoints` and/or `clickedPoint`
     *   to drill to. For example, `{ selectedPoints: [] }`.
     * - `columnGuid`: Optional. GUID of the column to drill by. If not provided,
     *   it will auto drill by the configured column.
     * - `autoDrillDown`: Optional. If `true`, the drill down will be done automatically
     *   on the most popular column.
     * - `vizId` (TS >= 9.8.0): Optional. The GUID of the visualization to drill in case
     *   of a Liveboard. In Spotter embed, `vizId` refers to the Answer ID and is
     *   **required**.
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.VizPointDoubleClick, (payload) => {
     *       console.log(payload);
     *       const clickedPoint = payload.data.clickedPoint;
     *       const selectedPoint = payload.data.selectedPoints;
     *       console.log('>>> called', clickedPoint);
     *       searchEmbed.trigger(HostEvent.DrillDown, {
     *             points: {
     *                  clickedPoint,
     *                  selectedPoints: selectedPoint
     *             },
     *             autoDrillDown: true,
     *       });
     * })
     * ```
     * @example
     * ```js
     *  // Works with TS 9.8.0 and above
     *
     *  liveboardEmbed.on(EmbedEvent.VizPointDoubleClick, (payload) => {
     *    console.log(payload);
     *    const clickedPoint = payload.data.clickedPoint;
     *    const selectedPoint = payload.data.selectedPoints;
     *    console.log('>>> called', clickedPoint);
     *    liveboardEmbed.trigger(HostEvent.DrillDown, {
     *      points: {
     *        clickedPoint,
     *        selectedPoints: selectedPoint
     *      },
     *      columnGuid: "<guid of the column to drill>",
     *      vizId: payload.data.vizId
     *    });
     *  })
     * ```
     * @example
     * ```js
     * // Drill down from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.DrillDown, {
     *     points: { clickedPoint, selectedPoints },
     *     autoDrillDown: true
     * }, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Drill down from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * searchEmbed.trigger(HostEvent.DrillDown, {
     *     points: { clickedPoint, selectedPoints },
     *     columnGuid: "column-guid"
     * }, ContextType.Search);
     * ```
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     */
    HostEvent["DrillDown"] = "triggerDrillDown";
    /**
     * Apply filters
     * @hidden
     */
    HostEvent["Filter"] = "filter";
    /**
     * Reload the Answer or visualization
     * @hidden
     */
    HostEvent["Reload"] = "reload";
    /**
     * Get iframe URL for the current embed view.
     * @example
     * ```js
     * const url = embed.trigger(HostEvent.GetIframeUrl);
     * console.log("iFrameURL",url);
     * ```
     * @example
     * ```js
     * // Get iframe URL from specific context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * const url = await appEmbed.trigger(HostEvent.GetIframeUrl, {}, ContextType.Answer);
     * console.log("iFrameURL", url);
     * ```
     * @version SDK: 1.35.0 | ThoughtSpot: 10.4.0.cl
     */
    HostEvent["GetIframeUrl"] = "GetIframeUrl";
    /**
     * Display specific visualizations on a Liveboard.
     * @param - An array of GUIDs of the visualization to show. The visualization IDs not passed
     *  in this parameter will be hidden.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetVisibleVizs, [
     *  '730496d6-6903-4601-937e-2c691821af3c',
     *  'd547ec54-2a37-4516-a222-2b06719af726'])
     * ```
     * @example
     * ```js
     * // Set visible vizs from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.SetVisibleVizs, [
     *     '730496d6-6903-4601-937e-2c691821af3c',
     *     'd547ec54-2a37-4516-a222-2b06719af726'
     * ], ContextType.Liveboard);
     * ```
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     */
    HostEvent["SetVisibleVizs"] = "SetPinboardVisibleVizs";
    /**
     * Set a Liveboard tab as an active tab.
     * @param - tabId - string of id of Tab to show
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetActiveTab,{
     *  tabId:'730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @example
     * ```js
     * // Set active tab from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.SetActiveTab, {
     *     tabId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.24.0 | ThoughtSpot: 9.5.0.cl, 9.5.1-sw
     */
    HostEvent["SetActiveTab"] = "SetActiveTab";
    /**
     * Updates the runtime filters applied on a Liveboard. The filter
     * attributes passed with this event are appended to the existing runtime
     * filters applied on a Liveboard.
     *
     * **Note**: `HostEvent.UpdateRuntimeFilters` is supported in `LiveboardEmbed`
     * and `AppEmbed` only. In full application embedding, this event updates
     * the runtime filters applied on the Liveboard and saved Answer objects.
     *
     * @param - Array of {@link RuntimeFilter} objects. Each item includes:
     * - `columnName`: Name of the column to filter on.
     * - `operator`: {@link RuntimeFilterOp} to apply. For more information, see
     *   link:https://developers.thoughtspot.com/docs/runtime-filters#rtOperator[Developer Documentation].
     * - `values`: List of operands. Some operators such as EQ and LE allow a single
     *   value, whereas BW and IN accept multiple values.
     *
     * **Note**: Updating runtime filters resets the ThoughtSpot
     * object to its original state and applies new filter conditions.
     * Any user changes (like drilling into a visualization)
     * will be cleared, restoring the original visualization
     * with the updated filters.
     *

     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateRuntimeFilters, [
     *   {columnName: "state",operator: RuntimeFilterOp.EQ,values: ["michigan"]},
     *   {columnName: "item type",operator: RuntimeFilterOp.EQ,values: ["Jackets"]}
     * ])
     * ```
     * @example
     * ```js
     * // Update runtime filters from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.UpdateRuntimeFilters, [
     *     {columnName: "region", operator: RuntimeFilterOp.EQ, values: ["west"]},
     *     {columnName: "product", operator: RuntimeFilterOp.IN, values: ["shoes", "boots"]}
     * ], ContextType.Liveboard);
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     * @important
     */
    HostEvent["UpdateRuntimeFilters"] = "UpdateRuntimeFilters";
    /**
     * Navigate to a specific page in the embedded ThoughtSpot application.
     * This is the same as calling `appEmbed.navigateToPage(path, true)`.
     * @param - `path` - the path to navigate to go forward or back. The path value can
     * be a number; for example, `1`, `-1`.
     * @example
     * ```js
     * appEmbed.navigateToPage(-1)
     * ```
     * @version SDK: 1.12.0 | ThoughtSpot: 8.4.0.cl, 8.4.1.sw
     */
    HostEvent["Navigate"] = "Navigate";
    /**
     * Open the filter panel for a particular column.
     * Works with Search and Liveboard embed.
     * @param - { columnId: string,
     *  name: string,
     *  type: ATTRIBUTE/MEASURE,
     *  dataType: INT64/CHAR/DATE }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.OpenFilter,
     *  {column: { columnId: '<column-GUID>', name: 'column name', type: 'ATTRIBUTE', dataType: 'INT64'}})
     * ```
     * @example
     * ```js
     * LiveboardEmbed.trigger(HostEvent.OpenFilter,
     *   { column: {columnId: '<column-GUID>'}})
     * ```
     * @example
     * ```js
     * // Open filter from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * searchEmbed.trigger(HostEvent.OpenFilter, {
     *     column: { columnId: '<column-GUID>', name: 'region', type: 'ATTRIBUTE', dataType: 'CHAR'}
     * }, ContextType.Search);
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    HostEvent["OpenFilter"] = "openFilter";
    /**
     * Add columns to the current search query.
     * @param - { columnIds: string[] }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.AddColumns, { columnIds: ['<column-GUID>','<column-GUID>'] })
     * ```
     * @example
     * ```js
     * // Add columns from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * searchEmbed.trigger(HostEvent.AddColumns, {
     *     columnIds: ['col-guid-1', 'col-guid-2']
     * }, ContextType.Search);
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    HostEvent["AddColumns"] = "addColumns";
    /**
     * Remove a column from the current search query.
     * @param - { columnId: string }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.RemoveColumn, { columnId: '<column-Guid>' })
     * ```
     * @example
     * ```js
     * // Remove column from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * searchEmbed.trigger(HostEvent.RemoveColumn, {
     *     columnId: 'column-guid'
     * }, ContextType.Search);
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
    HostEvent["RemoveColumn"] = "removeColumn";
    /**
     * Get the transient state of a Liveboard as encoded content.
     * This includes unsaved and ad hoc changes such as
     * Liveboard filters, runtime filters applied on visualizations on a
     * Liveboard, and Liveboard layout, changes to visualizations such as
     * sorting, toggling of legends, and data drill down.
     * For more information, see
     * link:https://developers.thoughtspot.com/docs/fetch-data-and-report-apis#transient-lb-content[Liveboard data with unsaved changes].
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.getExportRequestForCurrentPinboard).then(
     * data=>console.log(data))
     * ```
     * @version SDK: 1.13.0 | ThoughtSpot: 8.5.0.cl, 8.8.1.sw
     */
    HostEvent["getExportRequestForCurrentPinboard"] = "getExportRequestForCurrentPinboard";
    /**
     * Trigger **Pin** action on an embedded object.
     * If no parameters are defined, the pin action is triggered
     * for the Answer that the user is currently on
     * and a modal opens for Liveboard selection.
     * To add an Answer or visualization to a Liveboard programmatically without
     * requiring additional user input via the *Pin to Liveboard* modal, define
     * the following parameters:
     *
     * @param - Includes the following keys:
     * - `vizId`: GUID of the saved Answer or Spotter visualization ID to pin to a
     * Liveboard.
     *   Optional when pinning a new chart or table generated from a Search query.
     *   **Required** in Spotter Embed.
     * - `liveboardId`: GUID of the Liveboard to pin an Answer. If there is no Liveboard,
     *   specify the `newLiveboardName` parameter to create a new Liveboard.
     * - `tabId`: GUID of the Liveboard tab. Adds the Answer to the Liveboard tab
     *   specified in the code.
     * - `newVizName`: Name string for the Answer or visualization. If defined,
     *   this parameter adds a new visualization object or creates a copy of the
     *   Answer or visualization specified in `vizId`.
     *   Required.
     * - `newLiveboardName`: Name string for the Liveboard.
     *   Creates a new Liveboard object with the specified name.
     * - `newTabName`: Name of the tab. Adds a new tab Liveboard specified
     *   in the code.
     *
     * @example
     * ```js
     * const pinResponse = await appEmbed.trigger(HostEvent.Pin, {
     *     vizId: "123",
     *     newVizName: "Sales by region",
     *     liveboardId: "123",
     *     tabId: "123"
     *  });
     * ```
     * @example
     * ```js
     * const pinResponse = await appEmbed.trigger(HostEvent.Pin, {
     *     newVizName: "Total sales of Jackets",
     *     liveboardId: "123"
     *  });
     * ```
     *
     * @example
     * ```js
     * const pinResponse = await searchEmbed.trigger(HostEvent.Pin, {
     *     newVizName: "Sales by state",
     *     newLiveboardName: "Sales",
     *     newTabName: "Products"
     *  });
     * ```
     * @example
     * ```js
     * appEmbed.trigger(HostEvent.Pin)
     * ```
     * @example
     * ```js

    * // You can use the Data event dispatched on each answer creation to get the vizId and use in Pin host event.
    * let latestSpotterVizId = '';
    * spotterEmbed.on(EmbedEvent.Data, (payload) => {
    *   latestSpotterVizId = payload.data.id;
    * });
    *
    * spotterEmbed.trigger(HostEvent.Pin, { vizId: latestSpotterVizId });
    * ```
     * @example
     * ```js
     * // Using context parameter to specify the context type (SDK: 1.45.2+)
     * // Pin from a search answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Pin, {
     *     vizId: "123",
     *     newVizName: "Sales by region",
     *     liveboardId: "456"
     *  }, ContextType.Search);
     * ```
     * @example
     * ```js
     * // Pin from an answer context (explore modal/page) (SDK: 1.45.2+)
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Pin, {
     *     vizId: "789",
     *     newVizName: "Revenue trends",
     *     liveboardId: "456"
     *  }, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Pin from a spotter context (SDK: 1.45.2+)
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Pin, {
     *     vizId: latestSpotterVizId,
     *     newVizName: "AI-generated insights",
     *     liveboardId: "456"
     *  }, ContextType.Spotter);
     * ```
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["Pin"] = "pin";
    /**
     * Trigger the **Show Liveboard details** action
     * on an embedded Liveboard.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.LiveboardInfo)
     *```
     * @example
     * ```js
     * // Show liveboard info from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.LiveboardInfo, {}, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["LiveboardInfo"] = "pinboardInfo";
    /**
     * Trigger the **Schedule** action on an embedded Liveboard.
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.Schedule)
     * ```
     * @example
     * ```js
     * // Schedule from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Schedule, {}, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["Schedule"] = "subscription";
    /**
     * Trigger the **Manage schedule** action on an embedded Liveboard
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.ScheduleList)
     * ```
     * @example
     * ```js
     * // Manage schedules from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.ScheduleList, {}, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["SchedulesList"] = "schedule-list";
    /**
     * Trigger the **Export TML** action on an embedded Liveboard or
     * Answer.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ExportTML)
     * ```
     * @example
     * ```js
     * // Export TML from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.ExportTML, {}, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Export TML from search-answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.ExportTML, {}, ContextType.Search);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["ExportTML"] = "exportTSL";
    /**
     * Trigger the **Edit TML** action on an embedded Liveboard or
     * saved Answers in the full application embedding.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.EditTML)
     * ```
     * @example
     * ```js
     * // Edit TML from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.EditTML, {}, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Edit TML from search-answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.EditTML, {}, ContextType.Search);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["EditTML"] = "editTSL";
    /**
     * Trigger the **Update TML** action on an embedded Liveboard.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateTML)
     * ```
     * @example
     * ```js
     * // Update TML from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.UpdateTML, {}, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["UpdateTML"] = "updateTSL";
    /**
     * Trigger the **Download PDF** action on an embedded Liveboard,
     * visualization or Answer.
     *
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     *
     * **NOTE**: The **Download** > **PDF** action is available on
     * visualizations and Answers if the data is in tabular format.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsPdf)
     * ```
     * @example
     * ```js

    * // You can use the Data event dispatched on each answer creation to get the vizId and use in DownloadAsPdf host event.
    * let latestSpotterVizId = '';
    * spotterEmbed.on(EmbedEvent.Data, (payload) => {
    *   latestSpotterVizId = payload.data.id;
    * });
    *
    * spotterEmbed.trigger(HostEvent.DownloadAsPdf, { vizId: latestSpotterVizId });
    * ```
     * @example
     * ```js
     * // Download as PDF from search-answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.DownloadAsPdf, {}, ContextType.Search);
     * ```
     * @example
     * ```js
     * // Download as PDF from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.DownloadAsPdf, {}, ContextType.Liveboard);
     * ```
     *
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["DownloadAsPdf"] = "downloadAsPdf";
    /**
     * Trigger the **Download Liveboard as Continuous PDF** action on an
     * embedded Liveboard.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadLiveboardAsContinuousPDF)
     * ```
     *
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    HostEvent["DownloadLiveboardAsContinuousPDF"] = "downloadLiveboardAsContinuousPDF";
    /**
     * Trigger the **AI Highlights** action on an embedded Liveboard
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.AIHighlights)
     * ```
     * @version SDK: 1.44.0 | ThoughtSpot: 10.15.0.cl
     */
    HostEvent["AIHighlights"] = "AIHighlights";
    /**
     * Trigger the **Make a copy** action on a Liveboard,
     * visualization, or Answer page.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.MakeACopy, {
     * vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @example
     * ```js
     * vizEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.MakeACopy)
     * ```
     * @example
     * ```js
     * // You can use the Data event dispatched on each answer creation to get the vizId and use in MakeACopy host event.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.MakeACopy, { vizId: latestSpotterVizId });
     * ```
     * @example
     * ```js
     * // Make a copy from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.MakeACopy, {}, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Make a copy from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.MakeACopy, {}, ContextType.Search);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["MakeACopy"] = "makeACopy";
    /**
     * Trigger the **Delete** action for a Liveboard.
     * @example
     * ```js
     * appEmbed.trigger(HostEvent.Remove)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Remove)
     * ```
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl, 10.10.0.sw
     */
    HostEvent["Remove"] = "delete";
    /**
     * Trigger the **Explore** action on a visualization.
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Explore, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @example
     * ```js
     * // Explore from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Explore, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["Explore"] = "explore";
    /**
     * Trigger the **Create alert** action on a KPI chart
     * in a Liveboard or saved Answer.
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.CreateMonitor, {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.CreateMonitor)
     * ```
     * @example
     * ```js
     * // Create monitor from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.CreateMonitor, {}, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Create monitor from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.CreateMonitor, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["CreateMonitor"] = "createMonitor";
    /**
     * Trigger the **Manage alerts** action on a KPI chart
     * in a visualization or saved Answer.
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ManageMonitor, {
     *  vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.ManageMonitor)
     * ```
     * @example
     * ```js
     * vizEmbed.trigger(HostEvent.ManageMonitor)
     * ```
     * @example
     * ```js
     * // Manage monitor from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.ManageMonitor, {}, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Manage monitor from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.ManageMonitor, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["ManageMonitor"] = "manageMonitor";
    /**
     * Trigger the **Edit** action on a Liveboard or a visualization
     * on a Liveboard.
     *
     * This event is not supported in visualization embed and search embed.
     * @param - Object parameter. Includes the following keys:
     * - `vizId`: To trigger the action for a specific visualization in Liveboard embed,
     *   pass in `vizId` as a key. In Spotter embed, `vizId` refers to the Answer ID and
     *   is **required**.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.Edit);
     * ```
     * @example
     * ```js
     * // Using context parameter to edit liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Edit, {}, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Edit from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Edit, {}, ContextType.Search);
     * ```
     * * @example
     * ```js
     * // Edit from spotter context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Edit, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Spotter);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["Edit"] = "edit";
    /**
     * Trigger the **Copy link** action on a Liveboard or visualization
     * @param - object - to trigger the action for a
     * specific visualization in Liveboard embed, pass in `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.CopyLink)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.CopyLink, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.CopyLink)
     * ```
     * @example
     * ```js
     * // Copy link from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.CopyLink, {}, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Copy link from liveboard visualization context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.CopyLink, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Copy link from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.CopyLink, {}, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Copy link from liveboard visualization context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.CopyLink, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["CopyLink"] = "embedDocument";
    /**
     * Trigger the **Present** action on a Liveboard or visualization
     * @param - object - to trigger the action for a specific visualization
     *  in Liveboard embed, pass in `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Present)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.Present, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.Present)
     * ```
     * @example
     * ```js
     * // Present from liveboard visualization context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Present, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Present from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Present, {}, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Present from liveboard visualization context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Present, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Present from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Present, {}, ContextType.Liveboard);
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
    HostEvent["Present"] = "present";
    /**
     * Get TML for the current search.
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.GetTML).then((tml) => {
     *   console.log(
     *      tml.answer.search_query // TML representation of the search query
     *   );
     * })
     * ```
     * @example
     * ```js
     * // You can use the Data event dispatched on each answer creation to get the vizId and use in GetTML host event.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.GetTML, {
     *   vizId: latestSpotterVizId
     * }).then((tml) => {
     *   console.log(
     *      tml.answer.search_query // TML representation of the search query
     *   );
     * })
     * ```
     * @example
     * ```js
     * // Get TML from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.GetTML, {}, ContextType.Search).then((tml) => {
     *   console.log(tml.answer.search_query);
     * });
     * ```
     * @example
     * ```js
     * // Get TML from search-answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.GetTML, {}, ContextType.Search).then((tml) => {
     *   console.log(tml.answer);
     * });
     * ```
     * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     * @important
     */
    HostEvent["GetTML"] = "getTML";
    /**
     * Trigger the **Show underlying data** action on a
     * chart or table.
     *
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ShowUnderlyingData, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.ShowUnderlyingData)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.ShowUnderlyingData)
     * ```
     * @example
     * ```js
     * // Show underlying data from liveboard visualization context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.ShowUnderlyingData, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Show underlying data from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.ShowUnderlyingData, {}, ContextType.Search);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["ShowUnderlyingData"] = "showUnderlyingData";
    /**
     * Trigger the **Delete** action for a visualization
     * in an embedded Liveboard, or a chart or table
     * generated from Search.
     * @param - Liveboard embed takes an object with `vizId` as a key.
     * Can be left empty if embedding Search or visualization.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Delete, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Delete)
     * ```
     * @example
     * ```js
     * // Delete from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Delete, {}, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Delete from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Delete, {}, ContextType.Search);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["Delete"] = "onDeleteAnswer";
    /**
     * Trigger the **SpotIQ analyze** action on a
     * chart or table.
     * @param - Liveboard embed takes `vizId` as a
     * key. Can be left undefined when embedding Search or
     * visualization.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SpotIQAnalyze, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.SpotIQAnalyze)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.SpotIQAnalyze)
     * ```
     * @example
     * ```js
     * // SpotIQ analyze from search-answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.SpotIQAnalyze, { vizId: '730496d6-6903-4601-937e-2c691821af3c' }, ContextType.Search);
     * ```
     * @example
     * ```js
     * // SpotIQ analyze from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.SpotIQAnalyze, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["SpotIQAnalyze"] = "spotIQAnalyze";
    /**
     * Trigger the **Download** action on charts in
     * the embedded view.
     * Use {@link HostEvent.DownloadAsPng} instead.
     *
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     *
     * @deprecated from SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl ,9.4.1.sw
     * @param - `vizId` refers to the Visualization ID in Spotter embed and is required in Spotter embed.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Download, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * embed.trigger(HostEvent.Download)
     * ```
     * ```js
     * // You can use the Data event dispatched on each answer creation to get the vizId and use in Download host event.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.Download, { vizId: latestSpotterVizId });
     * ```
     */
    HostEvent["Download"] = "downloadAsPng";
    /**
     * Trigger the **Download** > **PNG** action on
     * charts in the embedded view.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsPng,
     * {vizId:'730496d6-6903-4601-937e-2c691821af3c'})
     *
     * vizEmbed.trigger(HostEvent.DownloadAsPng)
     *
     * searchEmbed.trigger(HostEvent.DownloadAsPng)
     *
     * // You can use the Data event dispatched on each answer creation to get the vizId and use in DownloadAsPng host event.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.DownloadAsPng, { vizId: latestSpotterVizId });
     * ```
     * @example
     * ```js
     * // Download as PNG from search-answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.DownloadAsPng, {}, ContextType.Search);
     * ```
     *
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.1.sw
     */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    HostEvent["DownloadAsPng"] = "downloadAsPng";
    /**
     * Trigger the **Download** > **CSV**  action on tables in
     * the embedded view.
     * @param - `vizId` refers to the Visualization ID in Spotter embed and is required in Spotter embed.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsCsv, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.DownloadAsCsv)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.DownloadAsCsv)
     * ```
     * ```js
     * // You can use the Data event dispatched on each answer creation to get the vizId and use in DownloadAsCsv host event.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.DownloadAsCsv, { vizId: latestSpotterVizId });
     * ```
     * @example
     * ```js
     * // Download as CSV from search-answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.DownloadAsCsv, {}, ContextType.Search);
     * ```
     * @example
     * ```js
     * // Download as CSV from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * searchEmbed.trigger(HostEvent.DownloadAsCsv, {}, ContextType.Search);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["DownloadAsCsv"] = "downloadAsCSV";
    /**
     * Trigger the **Download** > **XLSX**  action on tables
     * in the embedded view.
     * @param - `vizId` refers to the Visualization ID in Spotter embed and is required in Spotter embed.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsXlsx, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.DownloadAsXlsx)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.DownloadAsXlsx)
     * ```
     * ```js
     * // You can use the Data event dispatched on each answer creation to get the vizId and use in DownloadAsXlsx host event.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.DownloadAsXlsx, { vizId: latestSpotterVizId });
     * ```
     * @example
     * ```js
     * // Download as XLSX from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.DownloadAsXlsx, {}, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Download as XLSX from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * searchEmbed.trigger(HostEvent.DownloadAsXlsx, {}, ContextType.Search);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["DownloadAsXlsx"] = "downloadAsXLSX";
    /**
     * Trigger the **Share** action on an embedded
     * Liveboard or Answer.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Share)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Share)
     * ```
     * @example
     * ```js
     * // Share from Liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.Share, {}, ContextType.Liveboard);
     * ```
     * @example
     * ```js
     * // Share from search-answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Share, {}, ContextType.Search);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["Share"] = "share";
    /**
     * Trigger the **Save** action on a Liveboard, Answer, or Spotter.
     * Saves the changes.
     *
     * @param - `vizId` refers to the Spotter Visualization Id used in Spotter embed.
     * It is required and can be retrieved from the data embed event.
     *
     * @example
     * ```js
     * // Save changes in a Liveboard
     * liveboardEmbed.trigger(HostEvent.Save)
     * ```
     *
     * ```js
     * // Save the current Answer in Search embed
     * searchEmbed.trigger(HostEvent.Save)
     * ```
     *
     * ```js
     * // Save a Visualization in Spotter (requires vizId)
     * spotterEmbed.trigger(HostEvent.Save, {
     *   vizId: "730496d6-6903-4601-937e-2c691821af3c"
     * })
     * ```
     *
     * ```js
     * // How to get the vizId in Spotter?
     *
     * // You can use the Data event dispatched on each answer creation to get the vizId.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.Save, { vizId: latestSpotterVizId });
     * ```
     * @example
     * ```js
     * // Save from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.Save, {}, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Save from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * searchEmbed.trigger(HostEvent.Save, {}, ContextType.Search);
     * ```
     *
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["Save"] = "save";
    /**
     * Trigger the **Sync to Sheets** action on an embedded visualization or Answer
     * Sends data from an Answer or Liveboard visualization to a Google sheet.
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SyncToSheets, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.SyncToSheets)
     * ```
     * @example
     * ```js
     * // Sync to sheets from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.SyncToSheets, {}, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Sync to sheets from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.SyncToSheets, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["SyncToSheets"] = "sync-to-sheets";
    /**
     * Trigger the **Sync to Other Apps** action on an embedded visualization or Answer
     * Sends data from an Answer or Liveboard visualization to third-party apps such
     * as Slack, Salesforce, Microsoft Teams, ServiceNow and so on.
     * @param - an object with vizId as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SyncToOtherApps, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.SyncToOtherApps)
     * ```
     * @example
     * ```js
     * // Sync to other apps from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.SyncToOtherApps, {}, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Sync to other apps from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.SyncToOtherApps, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["SyncToOtherApps"] = "sync-to-other-apps";
    /**
     * Trigger the **Manage pipelines** action on an embedded
     * visualization or Answer.
     * Allows users to manage ThoughtSpot Sync pipelines.
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ManagePipelines, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * vizEmbed.trigger(HostEvent.ManagePipelines)
     * ```
     * @example
     * ```js
     * // Manage pipelines from answer context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * appEmbed.trigger(HostEvent.ManagePipelines, {}, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Manage pipelines from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.ManagePipelines, {
     *     vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
    HostEvent["ManagePipelines"] = "manage-pipeline";
    /**
     * Reset search operation on the Search or Answer page.
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.ResetSearch)
     * ```
     * ```js
     * appEmbed.trigger(HostEvent.ResetSearch)
     * ```
     * @example
     * ```js
     * // Reset search from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * searchEmbed.trigger(HostEvent.ResetSearch, {}, ContextType.Search);
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.0.1.sw
     */
    HostEvent["ResetSearch"] = "resetSearch";
    /**
     * Get details of filters applied on the Liveboard.
     * Returns arrays containing Liveboard filter and runtime filter elements.
     * @example
     * ```js
     * const data = await liveboardEmbed.trigger(HostEvent.GetFilters);
     *     console.log('data', data);
     * ```
     * @example
     * ```js
     * // Get filters from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * const data = await liveboardEmbed.trigger(HostEvent.GetFilters, {}, ContextType.Liveboard);
     * console.log('filters', data);
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    HostEvent["GetFilters"] = "getFilters";
    /**
     * Update one or several filters applied on a Liveboard.
     * @param - Includes the following keys:
     * - `filter`: A single filter object containing column name, filter operator, and
     * values.
     * - `filters`: Multiple filter objects with column name, filter operator,
     * and values for each.
     *
     * Each filter object must include the following attributes:
     *
     * `column` - Name of the column to filter on.
     *
     * `oper`  - Filter operator, for example, EQ, IN, CONTAINS.
     *  For information about the supported filter operators,
     *  see link:https://developers.thoughtspot.com/docs/runtime-filters#rtOperator[Developer Documentation].
     *
     * `values` - An array of one or several values. The value definition on the
     *  data type you choose to filter on. For a complete list of supported data types,
     *  see
     *  link:https://developers.thoughtspot.com/docs/runtime-filters#_supported_data_types[Supported
     *  data types].
     *
     * `type`  - To update filters for date time, specify the date format type.
     * For more information and examples, see link:https://developers.thoughtspot.com/docs/embed-liveboard#_date_filters[Date filters].
     * @example
     * ```js
     *
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *     filter: {
     *         column: "item type",
     *         oper: "IN",
     *         values: ["bags","shirts"]
     *        }
     *    });
     * ```
     * @example
     * ```js
     *
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *     filter: {
     *         column: "date",
     *         oper: "EQ",
     *         values: ["JULY","2023"],
     *         type: "MONTH_YEAR"
     *        }
     *    });
     * ```
     * @example
     *
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *  filters: [{
     *      column: "Item Type",
     *      oper: 'IN',
     *      values: ["bags","shirts"]
     *  },
     *    {
     *      column: "Region",
     *      oper: 'IN',
     *      values: ["West","Midwest"]
     *  },
     *    {
     *      column: "Date",
     *      oper: 'EQ',
     *      values: ["2023-07-31"],
     *      type: "EXACT_DATE"
     *    }]
     * });
     * ```
     * If there are multiple columns with the same name, consider
     * using `WORKSHEET_NAME::COLUMN_NAME` format.
     *
     * @example
     *
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *  filters: [{
     *      column: "(Sample) Retail - Apparel::city",
     *      oper: 'IN',
     *      values: ["atlanta"]
     *  },
     *  {
     *      column: "(Sample) Retail - Apparel::Region",
     *      oper: 'IN',
     *      values: ["West","Midwest"]
     *  }]
     * });
     * ```
     * @example
     * ```js
     * // Update filters from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.UpdateFilters, {
     *     filter: {
     *         column: "item type",
     *         oper: "IN",
     *         values: ["shoes", "boots"]
     *     }
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
    HostEvent["UpdateFilters"] = "updateFilters";
    /**
     * Get tab details for the current Liveboard.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.GetTabs).then((tabDetails) => {
     *   console.log(
     *      tabDetails // TabDetails of current Liveboard
     *   );
     * })
     * ```
     * @example
     * ```js
     * // Get tabs from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.GetTabs, {}, ContextType.Liveboard).then((tabDetails) => {
     *     console.log('tabs', tabDetails);
     * });
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl
     */
    HostEvent["GetTabs"] = "getTabs";
    /**
     * Set the visible tabs on a Liveboard.
     * @param - an array of ids of tabs to show, the IDs not passed
     *          will be hidden.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetVisibleTabs, [
     *  '430496d6-6903-4601-937e-2c691821af3c',
     *  'f547ec54-2a37-4516-a222-2b06719af726'])
     * ```
     * @example
     * ```js
     * // Set visible tabs from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.SetVisibleTabs, [
     *     '430496d6-6903-4601-937e-2c691821af3c',
     *     'f547ec54-2a37-4516-a222-2b06719af726'
     * ], ContextType.Liveboard);
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    HostEvent["SetVisibleTabs"] = "SetPinboardVisibleTabs";
    /**
     * Set the hidden tabs on a Liveboard.
     * @param - an array of the IDs of the tabs to hide.
     * The IDs not passed will be shown.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetHiddenTabs, [
     *  '630496d6-6903-4601-937e-2c691821af3c',
     *  'i547ec54-2a37-4516-a222-2b06719af726'])
     * ```
     * @example
     * ```js
     * // Set hidden tabs from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.SetHiddenTabs, [
     *     '630496d6-6903-4601-937e-2c691821af3c',
     *     'i547ec54-2a37-4516-a222-2b06719af726'
     * ], ContextType.Liveboard);
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    HostEvent["SetHiddenTabs"] = "SetPinboardHiddenTabs";
    /**
     * Get the Answer session for a Search or
     * Liveboard visualization.
     *
     * Note: This event is not typically used directly. Instead, use the
     * `getAnswerService()` method on the embed instance to get an AnswerService
     * object that provides a more convenient interface for working with answers.
     *
     * @example
     * ```js
     * // Preferred way to get an AnswerService
     * const service = await embed.getAnswerService();
     *
     * // Alternative direct usage (not recommended)
     * const {session} = await embed.trigger(
     *  HostEvent.GetAnswerSession, {
     *      vizId: '123', // For Liveboard Visualization.
     *  })
     * ```
     * @example
     * ```js
     * // Preferred way to get an AnswerService
     * const service = await embed.getAnswerService();
     *
     * // Alternative direct usage (not recommended)
     * const {session} = await embed.trigger( HostEvent.GetAnswerSession )
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.10.0.cl, 10.1.0.sw
     */
    HostEvent["GetAnswerSession"] = "getAnswerSession";
    /**
     * Trigger the *Ask Sage* action for visualizations
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.AskSage,
     * {vizId:'730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
    HostEvent["AskSage"] = "AskSage";
    /**
     * Trigger cross filter update action on a Liveboard.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateCrossFilter, {
     *      vizId: 'b535c760-8bbe-4e6f-bb26-af56b4129a1e',
     *      conditions: [
     *      { columnName: 'Category', values: ['mfgr#12','mfgr#14'] },
     *      { columnName: 'color', values: ['mint','hot'] },
     *    ],
     * });
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 10.0.0.cl, 10.1.0.sw
     */
    HostEvent["UpdateCrossFilter"] = "UpdateCrossFilter";
    /**
     * Trigger reset action for a personalized Liveboard view.
     * This event is deprecated. Use {@link HostEvent.ResetLiveboardPersonalizedView} instead.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ResetLiveboardPersonalisedView);
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 10.1.0.cl, 10.1.0.sw
     * @deprecated SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    HostEvent["ResetLiveboardPersonalisedView"] = "ResetLiveboardPersonalisedView";
    /**
     * Trigger reset action for a personalized Liveboard view.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ResetLiveboardPersonalizedView);
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    HostEvent["ResetLiveboardPersonalizedView"] = "ResetLiveboardPersonalisedView";
    /**
     * Triggers an action to update Parameter values on embedded
     * Answers, Liveboard, and Spotter answer in Edit mode.
     * @param - Includes the following keys for each item:
     * - `name`: Name of the parameter.
     * - `value`: The value to set for the parameter.
     * - `isVisibleToUser`: Optional. To control the visibility of the parameter chip.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateParameters, [{
     *   name: "Integer Range Param",
     *   value: 10,
     *   isVisibleToUser: false
     * }])
     * ```
     * @example
     * ```js
     * // Update parameters from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.UpdateParameters, [{
     *     name: "Region Param",
     *     value: "West",
     *     isVisibleToUser: true
     * }], ContextType.Liveboard);
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
    HostEvent["UpdateParameters"] = "UpdateParameters";
    /**
     * Triggers GetParameters to fetch the runtime Parameters.
     * @param - `vizId` refers to the Answer ID in Spotter embed and is required in Spotter embed.
     * ```js
     * liveboardEmbed.trigger(HostEvent.GetParameters).then((parameter) => {
     *  console.log('parameters', parameter);
     * });
     * ```
     * ```js
     * // You can use the Data event dispatched on each answer creation to get the vizId and use in GetParameters host event.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.GetParameters, { vizId: latestSpotterVizId });
     *```
     * @example
     * ```js
     * // Get parameters from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.GetParameters, {},
     * ContextType.Liveboard).then((parameters) => {
     *     console.log('parameters', parameters);
     * });
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
    HostEvent["GetParameters"] = "GetParameters";
    /**
     * Triggers an event to update a personalized view of a Liveboard.
     * This event is deprecated. Use {@link HostEvent.UpdatePersonalizedView} instead.
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdatePersonalisedView, {viewId: '1234'})
     * ```
     * @example
     * ```js
     * // Update personalized view from liveboard context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * liveboardEmbed.trigger(HostEvent.UpdatePersonalisedView, {
     *     viewId: '1234'
     * }, ContextType.Liveboard);
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     * @deprecated SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    HostEvent["UpdatePersonalisedView"] = "UpdatePersonalisedView";
    /**
     * Triggers an event to update a personalized view of a Liveboard.
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdatePersonalisedView, {viewId: '1234'})
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    HostEvent["UpdatePersonalizedView"] = "UpdatePersonalisedView";
    /**
     * Triggers selection of a specific Personalized View on a
     * Liveboard without reloading the embed. Pass either a
     * `viewId` (GUID) or `viewName`. If both are provided, `viewId` takes precedence.
     * If neither is provided, the Liveboard resets to the original/default view.
     * When a `viewName` is provided and multiple views share
     * the same name, the first match is selected.
     * @example
     * ```js
     * liveboardEmbed.trigger(
     *   HostEvent.SelectPersonalizedView,
     *   { viewId: '2a021a12-1aed-425d-984b-141ee916ce72' },
     * )
     * ```
     * @example
     * ```js
     * // Select by name
     * liveboardEmbed.trigger(
     *   HostEvent.SelectPersonalizedView,
     *   { viewName: 'Dr Smith Cardiology' },
     * )
     * ```
     * @example
     * ```js
     * // Reset to default view
     * liveboardEmbed.trigger(
     *   HostEvent.SelectPersonalizedView,
     *   {},
     * )
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    HostEvent["SelectPersonalizedView"] = "SelectPersonalisedView";
    /**
     * @hidden
     * Notify when info call is completed successfully
     * ```js
     * liveboardEmbed.trigger(HostEvent.InfoSuccess, data);
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
    HostEvent["InfoSuccess"] = "InfoSuccess";
    /**
     * Trigger the save action for an Answer.
     * To programmatically save an answer without opening the
     * *Describe your Answer* modal, define the `name` and `description`
     * properties.
     * If no parameters are specified, the save action is
     * triggered with a modal to prompt users to
     * add a name and description for the Answer.
     * @param - Includes the following keys:
     * - `vizId`: Refers to the Answer ID in Spotter embed and is **required** in Spotter
     * embed.
     * - `name`: Optional. Name string for the Answer.
     * - `description`: Optional. Description text for the Answer.
     * @example
     * ```js
     * const saveAnswerResponse = await searchEmbed.trigger(HostEvent.SaveAnswer, {
     *      name: "Sales by states",
     *      description: "Total sales by states in MidWest"
     *   });
     * ```
     * @example
     * ```js
     * // You can use the Data event dispatched on each answer creation to get the vizId and use in SaveAnswer host event.
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.SaveAnswer, { vizId: latestSpotterVizId });
     * ```
     * @example
     * ```js
     * // Using context parameter to save answer from search context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * const saveAnswerResponse = await appEmbed.trigger(HostEvent.SaveAnswer, {
     *      name: "Regional sales analysis",
     *      description: "Sales breakdown by region"
     *   }, ContextType.Search);
     * ```
     * @example
     * ```js
     * // Save answer from answer context (explore modal)
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * const saveAnswerResponse = await appEmbed.trigger(HostEvent.SaveAnswer, {
     *      name: "Modified analysis",
     *      description: "Updated from explore view"
     *   }, ContextType.Answer);
     * ```
     * @example
     * ```js
     * // Save answer from spotter context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * const saveAnswerResponse = await appEmbed.trigger(HostEvent.SaveAnswer, {
     *      vizId: latestSpotterVizId,
     *      name: "AI insights",
     *      description: "Generated from Spotter"
     *   }, ContextType.Spotter);
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
    HostEvent["SaveAnswer"] = "saveAnswer";
    /**
     * EmbedApi
     * @hidden
     */
    HostEvent["UIPassthrough"] = "UiPassthrough";
    /**
     * Triggers the table visualization re-render with the updated data.
     * Includes the following properties:
     * @param - `columnDataLite` - an array of object containing the
     * data value modifications retrieved from the `EmbedEvent.TableVizRendered`
     * payload.For example, { columnDataLite: []}`.
     *
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.TableVizRendered, (payload) => {
     *      console.log(payload);
     *      const columnDataLite = payload.data.data.columnDataLite;
     *      columnDataLite[0].dataValue[0]="new fob";
     *      console.log('>>> new Data', columnDataLite);
     *      searchEmbed.trigger(HostEvent.TransformTableVizData, columnDataLite);
     * })
     * ```
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl
     */
    HostEvent["TransformTableVizData"] = "TransformTableVizData";
    /**
     * Triggers a search operation with the search tokens specified in
     * the search query string in spotter embed.
     * @param - Includes the following keys:
     * - `query`: Text string in Natural Language format.
     * - `executeSearch`: Boolean to execute search and update search query.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.SpotterSearch, {
     *  query: 'revenue per year',
     *  executeSearch: true,
     * })
     * ```
     * @example
     * ```js
     * // Spotter search from spotter context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * spotterEmbed.trigger(HostEvent.SpotterSearch, {
     *     query: 'sales by region',
     *     executeSearch: true
     * }, ContextType.Spotter);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HostEvent["SpotterSearch"] = "SpotterSearch";
    /**
     * Edits the last prompt in spotter embed.
     * @param - `query`: Text string
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.EditLastPrompt, "revenue per year");
     * ```
     * @example
     * ```js
     * // Edit last prompt from spotter context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * spotterEmbed.trigger(HostEvent.EditLastPrompt, "sales by region", ContextType.Spotter);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HostEvent["EditLastPrompt"] = "EditLastPrompt";
    /**
     * Opens the data source preview modal in Spotter Embed.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.PreviewSpotterData);
     * ```
     * @example
     * ```js
     * // Preview spotter data from spotter context
     * import { ContextType } from '@thoughtspot/visual-embed-sdk';
     * spotterEmbed.trigger(HostEvent.PreviewSpotterData, {}, ContextType.Spotter);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HostEvent["PreviewSpotterData"] = "PreviewSpotterData";
    /**
     * Opens the Add to Coaching modal from a visualization in Spotter Embed.
     * @param - `vizId ` refers to the Visualization ID in Spotter embed and is required.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.AddToCoaching, { vizId: '730496d6-6903-4601-937e-2c691821af3c' });
     *
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     */
    HostEvent["AddToCoaching"] = "addToCoaching";
    /**
     * Opens the data model instructions modal in Spotter Embed.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.DataModelInstructions);
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    HostEvent["DataModelInstructions"] = "DataModelInstructions";
    /**
     * Resets the Spotter Embed Conversation.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.ResetSpotterConversation);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HostEvent["ResetSpotterConversation"] = "ResetSpotterConversation";
    /**
     * Deletes the last prompt in spotter embed.
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.DeleteLastPrompt);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HostEvent["DeleteLastPrompt"] = "DeleteLastPrompt";
    /**
     * Toggle the visualization to chart or table view.
     * @param - `vizId ` refers to the Visualization ID in Spotter embed and is required.
     * @example
     * ```js
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.AnswerChartSwitcher, { vizId: latestSpotterVizId });
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HostEvent["AnswerChartSwitcher"] = "answerChartSwitcher";
    /**
     * @hidden
     * Trigger exit from presentation mode when user exits fullscreen.
     * This is automatically triggered by the SDK when fullscreen mode is exited.
     * ```js
     * liveboardEmbed.trigger(HostEvent.ExitPresentMode);
     * ```
     * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
     */
    HostEvent["ExitPresentMode"] = "exitPresentMode";
    /**
     * Triggers the full height lazy load data.
     * @example
     * ```js
     * liveboardEmbed.on(EmbedEvent.RequestVisibleEmbedCoordinates, (payload) => {
     *      console.log(payload);
     * });
     * ```
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     *
     * @hidden
     */
    HostEvent["VisibleEmbedCoordinates"] = "visibleEmbedCoordinates";
    /**
     * Trigger the *Spotter* action for visualizations present on the liveboard's vizzes.
     * @param - `vizId` refers to the Visualization ID in Spotter embed and is required.
     * @example
     * ```js
     * let latestSpotterVizId = '';
     * spotterEmbed.on(EmbedEvent.Data, (payload) => {
     *   latestSpotterVizId = payload.data.id;
     * });
     *
     * spotterEmbed.trigger(HostEvent.AskSpotter, { vizId: latestSpotterVizId });
     * ```
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    HostEvent["AskSpotter"] = "AskSpotter";
    /**
     * @hidden
     * Triggers the update of the embed params.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateEmbedParams, viewConfig);
     * ```
     */
    HostEvent["UpdateEmbedParams"] = "updateEmbedParams";
    /**
     * Triggered when the embed needs to be destroyed. This is used to clean up any embed-related resources internally.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DestroyEmbed);
     * ```
     * @version SDK: 1.41.0 | ThoughtSpot: 10.12.0.cl
     */
    HostEvent["DestroyEmbed"] = "EmbedDestroyed";
    /**
     * Triggers a new conversation in Spotter embed.
     *
     * This feature is available only when chat history is enabled on your ThoughtSpot
     * instance. Contact your admin or ThoughtSpot Support to enable chat history on your
     * instance.
     *
     * @example
     * ```js
     * spotterEmbed.trigger(HostEvent.StartNewSpotterConversation);
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     */
    HostEvent["StartNewSpotterConversation"] = "StartNewSpotterConversation";
    /**
     * @hidden
     * Get the current context of the embedded page.
     *
     * @example
     * ```js
     * const context = await liveboardEmbed.trigger(HostEvent.GetPageContext);
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     */
    HostEvent["GetPageContext"] = "GetPageContext";
    /**
     * Trigger the **Send Test Email** action in the Liveboard schedule modal.
     * Sends a test schedule email to self or all recipients.
     * Requires `isSendNowLiveboardSchedulingEnabled` to be enabled.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SendTestScheduleEmail, {
     *     sendToSelf: true,
     * })
     * ```
     * @example
     * ```js
     * // Send to all recipients
     * liveboardEmbed.trigger(HostEvent.SendTestScheduleEmail, {
     *     sendToSelf: false,
     * })
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot Cloud: 26.5.0.cl
     */
    HostEvent["SendTestScheduleEmail"] = "sendTestScheduleEmail";
    /**
     * Sends a user message (prompt) to the SpotterViz panel programmatically.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @param query - the prompt text to send.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SpotterVizSendUserMessage, {
     *     query: 'Show me revenue by region',
     * });
     * ```
     */
    HostEvent["SpotterVizSendUserMessage"] = "SpotterVizSendUserMessage";
    /**
     * Initializes a new SpotterViz conversation.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.InitSpotterVizConversation);
     * ```
     */
    HostEvent["InitSpotterVizConversation"] = "InitSpotterVizConversation";
    /**
     * Clears browser cache and fetches new data for liveboard ChartViz Containers.
     * Requires `enableLiveboardDataCache` to be enabled.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.RefreshLiveboardBrowserCache);
     * ```
     * @version SDK: 1.49.0 | ThoughtSpot Cloud: 26.6.0.cl
     */
    HostEvent["RefreshLiveboardBrowserCache"] = "refreshLiveboardBrowserCache";
})(HostEvent || (HostEvent = {}));
/**
 * The different visual modes that the data sources panel within
 * search could appear in, such as hidden, collapsed, or expanded.
 */
var DataSourceVisualMode;
(function (DataSourceVisualMode) {
    /**
     * The data source panel is hidden.
     */
    DataSourceVisualMode["Hidden"] = "hide";
    /**
     * The data source panel is collapsed, but the user can manually expand it.
     */
    DataSourceVisualMode["Collapsed"] = "collapse";
    /**
     * The data source panel is expanded, but the user can manually collapse it.
     */
    DataSourceVisualMode["Expanded"] = "expand";
})(DataSourceVisualMode || (DataSourceVisualMode = {}));
/**
 * The query params passed down to the embedded ThoughtSpot app
 * containing configuration and/or visual information.
 */
var Param;
(function (Param) {
    Param["Tsmcp"] = "tsmcp";
    Param["EmbedApp"] = "embedApp";
    Param["DataSources"] = "dataSources";
    Param["DataSourceMode"] = "dataSourceMode";
    Param["DisableActions"] = "disableAction";
    Param["DisableActionReason"] = "disableHint";
    Param["ForceTable"] = "forceTable";
    Param["preventLiveboardFilterRemoval"] = "preventPinboardFilterRemoval";
    Param["SearchQuery"] = "searchQuery";
    Param["HideActions"] = "hideAction";
    Param["HideObjects"] = "hideObjects";
    Param["HostAppUrl"] = "hostAppUrl";
    Param["EnableVizTransformations"] = "enableVizTransform";
    Param["EnableSearchAssist"] = "enableSearchAssist";
    Param["EnableConnectionNewExperience"] = "newConnectionsExperience";
    Param["EnablePendoHelp"] = "enablePendoHelp";
    Param["HideResult"] = "hideResult";
    Param["UseLastSelectedDataSource"] = "useLastSelectedSources";
    Param["Tag"] = "tag";
    Param["HideTagFilterChips"] = "hideTagFilterChips";
    Param["AutoLogin"] = "autoLogin";
    Param["searchTokenString"] = "searchTokenString";
    Param["executeSearch"] = "executeSearch";
    Param["fullHeight"] = "isFullHeightPinboard";
    Param["livedBoardEmbed"] = "isLiveboardEmbed";
    Param["searchEmbed"] = "isSearchEmbed";
    Param["vizEmbed"] = "isVizEmbed";
    Param["StringIDsUrl"] = "overrideStringIDsUrl";
    Param["Version"] = "sdkVersion";
    Param["ViewPortHeight"] = "viewPortHeight";
    Param["ViewPortWidth"] = "viewPortWidth";
    Param["VisibleActions"] = "visibleAction";
    Param["DisableLoginRedirect"] = "disableLoginRedirect";
    Param["visibleVizs"] = "pinboardVisibleVizs";
    Param["LiveboardV2Enabled"] = "isPinboardV2Enabled";
    Param["DataPanelV2Enabled"] = "enableDataPanelV2";
    Param["ShowAlerts"] = "showAlerts";
    Param["Locale"] = "locale";
    Param["CustomStyle"] = "customStyle";
    Param["ForceSAMLAutoRedirect"] = "forceSAMLAutoRedirect";
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Param["AuthType"] = "authType";
    Param["IconSpriteUrl"] = "iconSprite";
    Param["cookieless"] = "cookieless";
    // Deprecated: `isContextMenuEnabledOnLeftClick`
    // Introduced: `contextMenuEnabledOnWhichClick` with values: 'left',
    // 'right', or 'both'. This update only affects ThoughtSpot URL parameters
    // and does not impact existing workflows or use cases. Added support for
    // 'both' clicks in `contextMenuTrigger` configuration.
    Param["ContextMenuTrigger"] = "contextMenuEnabledOnWhichClick";
    Param["LinkOverride"] = "linkOverride";
    Param["EnableLinkOverridesV2"] = "enableLinkOverridesV2";
    Param["blockNonEmbedFullAppAccess"] = "blockNonEmbedFullAppAccess";
    Param["ShowInsertToSlide"] = "insertInToSlide";
    Param["PrimaryNavHidden"] = "primaryNavHidden";
    Param["HideProfleAndHelp"] = "profileAndHelpInNavBarHidden";
    Param["NavigationVersion"] = "navigationVersion";
    Param["HideHamburger"] = "hideHamburger";
    Param["HideObjectSearch"] = "hideObjectSearch";
    Param["HideNotification"] = "hideNotification";
    Param["HideApplicationSwitcher"] = "applicationSwitcherHidden";
    Param["HideOrgSwitcher"] = "orgSwitcherHidden";
    Param["HideWorksheetSelector"] = "hideWorksheetSelector";
    Param["DisableWorksheetChange"] = "disableWorksheetChange";
    Param["HideSourceSelection"] = "hideSourceSelection";
    Param["DisableSourceSelection"] = "disableSourceSelection";
    Param["HideEurekaResults"] = "hideEurekaResults";
    Param["HideEurekaSuggestions"] = "hideEurekaSuggestions";
    Param["HideAutocompleteSuggestions"] = "hideAutocompleteSuggestions";
    Param["HideLiveboardHeader"] = "hideLiveboardHeader";
    Param["ShowLiveboardDescription"] = "showLiveboardDescription";
    Param["ShowLiveboardTitle"] = "showLiveboardTitle";
    Param["ShowMaskedFilterChip"] = "showMaskedFilterChip";
    Param["IsLiveboardMasterpiecesEnabled"] = "isLiveboardMasterpiecesEnabled";
    Param["EnableNewChartLibrary"] = "muzeChartPhase1EnabledGA";
    Param["HiddenTabs"] = "hideTabs";
    Param["VisibleTabs"] = "visibleTabs";
    Param["HideTabPanel"] = "hideTabPanel";
    Param["HideSampleQuestions"] = "hideSampleQuestions";
    Param["WorksheetId"] = "worksheet";
    Param["Query"] = "query";
    Param["HideHomepageLeftNav"] = "hideHomepageLeftNav";
    Param["ModularHomeExperienceEnabled"] = "modularHomeExperience";
    Param["HomepageVersion"] = "homepageVersion";
    Param["ListPageVersion"] = "listpageVersion";
    Param["PendoTrackingKey"] = "additionalPendoKey";
    Param["LiveboardHeaderSticky"] = "isLiveboardHeaderSticky";
    Param["IsProductTour"] = "isProductTour";
    Param["HideSearchBarTitle"] = "hideSearchBarTitle";
    Param["HideSageAnswerHeader"] = "hideSageAnswerHeader";
    Param["HideSearchBar"] = "hideSearchBar";
    Param["ClientLogLevel"] = "clientLogLevel";
    Param["ExposeTranslationIDs"] = "exposeTranslationIDs";
    Param["OverrideNativeConsole"] = "overrideConsoleLogs";
    Param["enableAskSage"] = "enableAskSage";
    Param["CollapseSearchBarInitially"] = "collapseSearchBarInitially";
    Param["DataPanelCustomGroupsAccordionInitialState"] = "dataPanelCustomGroupsAccordionInitialState";
    Param["EnableCustomColumnGroups"] = "enableCustomColumnGroups";
    Param["DateFormatLocale"] = "dateFormatLocale";
    Param["NumberFormatLocale"] = "numberFormatLocale";
    Param["CurrencyFormat"] = "currencyFormat";
    Param["Enable2ColumnLayout"] = "enable2ColumnLayout";
    Param["IsFullAppEmbed"] = "isFullAppEmbed";
    Param["IsOnBeforeGetVizDataInterceptEnabled"] = "isOnBeforeGetVizDataInterceptEnabled";
    Param["FocusSearchBarOnRender"] = "focusSearchBarOnRender";
    Param["DisableRedirectionLinksInNewTab"] = "disableRedirectionLinksInNewTab";
    Param["HomePageSearchBarMode"] = "homePageSearchBarMode";
    Param["ShowLiveboardVerifiedBadge"] = "showLiveboardVerifiedBadge";
    Param["ShowLiveboardReverifyBanner"] = "showLiveboardReverifyBanner";
    Param["LiveboardHeaderV2"] = "isLiveboardHeaderV2Enabled";
    Param["HideIrrelevantFiltersInTab"] = "hideIrrelevantFiltersAtTabLevel";
    Param["IsEnhancedFilterInteractivityEnabled"] = "isLiveboardPermissionV2Enabled";
    Param["SpotterEnabled"] = "isSpotterExperienceEnabled";
    Param["IsUnifiedSearchExperienceEnabled"] = "isUnifiedSearchExperienceEnabled";
    Param["OverrideOrgId"] = "orgId";
    Param["OauthPollingInterval"] = "oAuthPollingInterval";
    Param["IsForceRedirect"] = "isForceRedirect";
    Param["DataSourceId"] = "dataSourceId";
    Param["preAuthCache"] = "preAuthCache";
    Param["ShowSpotterLimitations"] = "showSpotterLimitations";
    Param["CoverAndFilterOptionInPDF"] = "arePdfCoverFilterPageCheckboxesEnabled";
    Param["PrimaryAction"] = "primaryAction";
    Param["isSpotterAgentEmbed"] = "isSpotterAgentEmbed";
    Param["IsLiveboardStylingAndGroupingEnabled"] = "isLiveboardStylingAndGroupingEnabled";
    Param["IsLazyLoadingForEmbedEnabled"] = "isLazyLoadingForEmbedEnabled";
    Param["RootMarginForLazyLoad"] = "rootMarginForLazyLoad";
    Param["isPNGInScheduledEmailsEnabled"] = "isPNGInScheduledEmailsEnabled";
    Param["IsWYSIWYGLiveboardPDFEnabled"] = "isWYSIWYGLiveboardPDFEnabled";
    Param["isLiveboardXLSXCSVDownloadEnabled"] = "isLiveboardXLSXCSVDownloadEnabled";
    Param["isGranularXLSXCSVSchedulesEnabled"] = "isGranularXLSXCSVSchedulesEnabled";
    Param["isSendNowLiveboardSchedulingEnabled"] = "isSendNowLiveboardSchedulingEnabled";
    Param["isCentralizedLiveboardFilterUXEnabled"] = "isCentralizedLiveboardFilterUXEnabled";
    Param["isLinkParametersEnabled"] = "isLinkParametersEnabled";
    Param["EnablePastConversationsSidebar"] = "enablePastConversationsSidebar";
    Param["UpdatedSpotterChatPrompt"] = "updatedSpotterChatPrompt";
    Param["EnableStopAnswerGenerationEmbed"] = "enableStopAnswerGenerationEmbed";
    Param["SpotterSidebarTitle"] = "spotterSidebarTitle";
    Param["SpotterSidebarDefaultExpanded"] = "spotterSidebarDefaultExpanded";
    Param["SpotterChatRenameLabel"] = "spotterChatRenameLabel";
    Param["SpotterChatDeleteLabel"] = "spotterChatDeleteLabel";
    Param["SpotterDeleteConversationModalTitle"] = "spotterDeleteConversationModalTitle";
    Param["SpotterPastConversationAlertMessage"] = "spotterPastConversationAlertMessage";
    Param["SpotterDocumentationUrl"] = "spotterDocumentationUrl";
    Param["SpotterBestPracticesLabel"] = "spotterBestPracticesLabel";
    Param["SpotterConversationsBatchSize"] = "spotterConversationsBatchSize";
    Param["SpotterNewChatButtonTitle"] = "spotterNewChatButtonTitle";
    Param["IsThisPeriodInDateFiltersEnabled"] = "isThisPeriodInDateFiltersEnabled";
    Param["HideToolResponseCardBranding"] = "hideToolResponseCardBranding";
    Param["ToolResponseCardBrandingLabel"] = "toolResponseCardBrandingLabel";
    Param["EnableHomepageAnnouncement"] = "enableHomepageAnnouncement";
    Param["EnableLiveboardDataCache"] = "enableLiveboardDataCache";
    Param["SpotterFileUploadEnabled"] = "spotterFileUploadEnabled";
    Param["SpotterFileUploadFileTypes"] = "spotterFileUploadFileTypes";
})(Param || (Param = {}));
/**
 * ThoughtSpot application pages include actions and menu commands
 * for various user-initiated operations. These actions are represented
 * as enumeration members in the SDK. To control actions in the embedded view:
 * - disabledActions — the action is grayed out and still visible, but non-interactive (user can see but not click).
 * - hiddenActions — the action is completely removed from the UI (user cannot see it at all).
 * - visibleActions — allowlist, only these actions are shown; all others are hidden.
 *
 * Use disabledActions to disable (gray out) an action.
 * Use hiddenActions to hide (fully remove) an action.
 * Use visibleActions to show only specific actions.
 * @example
 * ```js
 * const embed = new LiveboardEmbed('#tsEmbed', {
 *    ... //other embed view config
 *    visibleActions: [Action.Save, Action.Edit, Action.Present, Action.Explore],
 *    disabledActions: [Action.Download],
 *    //hiddenActions: [], // Set either this or visibleActions
 * })
 * ```
 * @example
 * ```js
 * const embed = new LiveboardEmbed('#tsEmbed', {
 *    ... //other embed view config
 *    //visibleActions: [],
 *    disabledActions: [Action.Download],
 *    hiddenActions: [Action.Edit, Action.Explore],
 * })
 * ```
 * See also link:https://developers.thoughtspot.com/docs/actions[Developer Documentation].
 */
var Action;
(function (Action) {
    /**
     * The **Save** action on an Answer or Liveboard.
     * Allows users to save the changes.
     * @example
     * ```js
     * disabledActions: [Action.Save]
     * ```
     */
    Action["Save"] = "save";
    /**
     * @hidden
     */
    Action["Update"] = "update";
    /**
     * @hidden
     */
    Action["SaveUntitled"] = "saveUntitled";
    /**
     * The **Save as View** action on the Answer
     * page. Saves an Answer as a View object in the full
     * application embedding mode.
     * @example
     * ```js
     * disabledActions: [Action.SaveAsView]
     * ```
     */
    Action["SaveAsView"] = "saveAsView";
    /**
     * The **Make a copy** action on a Liveboard or Answer
     * page. Creates a copy of the Liveboard.
     * In LiveboardEmbed, the **Make a copy** action is not available for
     * visualizations in the embedded Liveboard view.
     * In AppEmbed, the **Make a copy** action is available on both
     * Liveboards and visualizations.
     * @example
     * ```js
     * disabledActions: [Action.MakeACopy]
     * ```
     */
    Action["MakeACopy"] = "makeACopy";
    /**
     * The **Copy and Edit** action on a Liveboard.
     * This action is now replaced with `Action.MakeACopy`.
     * @example
     * ```js
     * disabledActions: [Action.EditACopy]
     * ```
     */
    Action["EditACopy"] = "editACopy";
    /**
     * The **Copy link** menu action on a Liveboard visualization.
     * Copies the visualization URL
     * @example
     * ```js
     * disabledActions: [Action.CopyLink]
     * ```
     */
    Action["CopyLink"] = "embedDocument";
    /**
     * @hidden
     */
    Action["ResetLayout"] = "resetLayout";
    /**
     * The **Schedule** menu action on a Liveboard.
     * Allows scheduling a Liveboard job, for example,
     * sending periodic notifications.
     * @example
     * ```js
     * disabledActions: [Action.Schedule]
     * ```
     */
    Action["Schedule"] = "subscription";
    /**
     * The **Manage schedules** menu action on a Liveboard.
     * Allows users to manage scheduled Liveboard jobs.
     * @example
     * ```js
     * disabledActions: [Action.SchedulesList]
     * ```
     */
    Action["SchedulesList"] = "schedule-list";
    /**
     * The **Share** action on a Liveboard, Answer, or Model.
     * Allows users to share an object with other users and groups.
     * @example
     * ```js
     * disabledActions: [Action.Share]
     * ```
     */
    Action["Share"] = "share";
    /**
     * The **Add filter** action on a Liveboard page.
     * Allows adding filters to visualizations on a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.AddFilter]
     * ```
     */
    Action["AddFilter"] = "addFilter";
    /**
     * The **Add Data Panel Objects** action on the data panel v2.
     * Allows to show action menu to add different objects (such as
     * formulas, Parameters) in data panel new experience.
     * @example
     * ```js
     * disabledActions: [Action.AddDataPanelObjects]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
     */
    Action["AddDataPanelObjects"] = "addDataPanelObjects";
    /**
     * The filter configuration options for a Liveboard.
     * The configuration options are available when adding
     * filters on a Liveboard.
     *
     * @example
     * ```js
     * disabledActions: [Action.ConfigureFilter]
     * ```
     */
    Action["ConfigureFilter"] = "configureFilter";
    /**
     * The **Collapse data sources** icon on the Search page.
     * Collapses the panel showing data sources.
     *
     * @example
     * ```js
     * disabledActions: [Action.CollapseDataPanel]
     * ```
     * @version SDK: 1.1.0 | ThoughtSpot Cloud: ts7.may.cl, 8.4.1.sw
     */
    Action["CollapseDataSources"] = "collapseDataSources";
    /**
     * The **Collapse data panel** icon on the Search page.
     * Collapses the data panel view.
     *
     * @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     *
     * @example
     * ```js
     * disabledActions: [Action.CollapseDataPanel]
     * ```
     */
    Action["CollapseDataPanel"] = "collapseDataPanel";
    /**
     * The **Choose sources** button on Search page.
     * Allows selecting data sources for search queries.
     * @example
     * ```js
     * disabledActions: [Action.ChooseDataSources]
     * ```
     */
    Action["ChooseDataSources"] = "chooseDataSources";
    /**
     * The **Create formula** action on a Search or Answer page.
     * Allows adding formulas to an Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddFormula]
     * ```
     */
    Action["AddFormula"] = "addFormula";
    /**
     * The **Add parameter** action on a Liveboard or Answer.
     * Allows adding Parameters to a Liveboard or Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddParameter]
     * ```
     */
    Action["AddParameter"] = "addParameter";
    /**
     * The **Add Column Set** action on a Answer.
     * Allows adding column sets to a Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddColumnSet]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
     */
    Action["AddColumnSet"] = "addSimpleCohort";
    /**
     * The **Add Query Set** action on a Answer.
     * Allows adding query sets to a Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddQuerySet]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
     */
    Action["AddQuerySet"] = "addAdvancedCohort";
    /**
     * @hidden
     */
    Action["SearchOnTop"] = "searchOnTop";
    /**
     * The **SpotIQ analyze** menu action on a visualization or
     * Answer page.
     * @example
     * ```js
     * disabledActions: [Action.SpotIQAnalyze]
     * ```
     */
    Action["SpotIQAnalyze"] = "spotIQAnalyze";
    /**
     * @hidden
     */
    Action["ExplainInsight"] = "explainInsight";
    /**
     * @hidden
     */
    Action["SpotIQFollow"] = "spotIQFollow";
    /**
     * The Share action for a Liveboard visualization.
     */
    Action["ShareViz"] = "shareViz";
    /**
     * @hidden
     */
    Action["ReplaySearch"] = "replaySearch";
    /**
     * The **Show underlying data** menu action on a
     * visualization or Answer page.
     * Displays detailed information and raw data
     * for a given visualization.
     * @example
     * ```js
     * disabledActions: [Action.ShowUnderlyingData]
     * ```
     */
    Action["ShowUnderlyingData"] = "showUnderlyingData";
    /**
     * The **Download** menu action on Liveboard
     * visualizations and Answers.
     * Allows downloading a visualization or Answer.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPng]
     * ```
     */
    Action["Download"] = "download";
    /**
     * The **Download** > **PNG** menu action for charts on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer as a PNG file.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPng]
     * ```
     */
    Action["DownloadAsPng"] = "downloadAsPng";
    /**
     *
     *The **Download PDF** action that downloads a Liveboard,
     * visualization, or Answer as a PDF file.
     *
     * **NOTE**: The **Download** > **PDF** option is available for
     * tables in visualizations and Answers.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPdf]
     * ```
     */
    Action["DownloadAsPdf"] = "downloadAsPdf";
    /**
     * The **Download** > **CSV** menu action for tables on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer in the XLSX format.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsCsv]
     * ```
     */
    Action["DownloadAsCsv"] = "downloadAsCSV";
    /**
     * The **Download** > **XLSX** menu action for tables on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer in the XLSX format.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsXlsx]
     * ```
     */
    Action["DownloadAsXlsx"] = "downloadAsXLSX";
    /**
     * The **Download Liveboard** menu action on a Liveboard.
     * Allows downloading the entire Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.DownloadLiveboard]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    Action["DownloadLiveboard"] = "downloadLiveboard";
    /**
     * The **Download Liveboard as Continuous PDF** menu action on a Liveboard.
     * Allows downloading the entire Liveboard as a continuous PDF.
     * @example
     * ```js
     * disabledActions: [Action.DownloadLiveboardAsContinuousPDF]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    Action["DownloadLiveboardAsContinuousPDF"] = "downloadLiveboardAsContinuousPDF";
    /**
     * The Download Liveboard as A4 PDF menu action on a Liveboard.
     * Allows downloading the entire Liveboard as an A4 PDF.
     * Requires {@link Action.DownloadLiveboard} as a parent action when
     * {@link LiveboardViewConfig.isLiveboardXLSXCSVDownloadEnabled} or
     * {@link LiveboardViewConfig.isContinuousLiveboardPDFEnabled} flags are enabled.
     * Use this instead of {@link Action.DownloadAsPdf} when either flag is on.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * disabledActions: [Action.DownloadLiveboardAsA4Pdf]
     * ```
     */
    Action["DownloadLiveboardAsA4Pdf"] = "downloadLiveboardAsA4Pdf";
    /**
     * The **Download Liveboard as XLSX** menu action on a Liveboard.
     * Allows downloading the entire Liveboard as an XLSX file.
     * @example
     * ```js
     * disabledActions: [Action.DownloadLiveboardAsXlsx]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    Action["DownloadLiveboardAsXlsx"] = "downloadLiveboardAsXlsx";
    /**
     * The **Download Liveboard as CSV** menu action on a Liveboard.
     * Allows downloading the entire Liveboard as a CSV file.
     * @example
     * ```js
     * disabledActions: [Action.DownloadLiveboardAsCsv]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    Action["DownloadLiveboardAsCsv"] = "downloadLiveboardAsCsv";
    /**
     * @hidden
     */
    Action["DownloadTrace"] = "downloadTrace";
    /**
     * The **Export TML** menu action on a Liveboard, Answer, and
     * the Data Workspace pages for data objects and connections.
     *
     * Allows exporting an object as a TML file.
     *
     * @example
     * ```js
     * disabledActions: [Action.ExportTML]
     * ```
     */
    Action["ExportTML"] = "exportTSL";
    /**
     * The **Import TML** menu action on the
     * *Data Workspace* > *Utilities* page.
     * Imports TML representation of ThoughtSpot objects.
     * @example
     * ```js
     * disabledActions: [Action.ImportTML]
     * ```
     */
    Action["ImportTML"] = "importTSL";
    /**
     * The **Update TML** menu action for Liveboards and Answers.
     * Updates TML representation of ThoughtSpot objects.
     * @example
     * ```js
     * disabledActions: [Action.UpdateTML]
     * ```
     */
    Action["UpdateTML"] = "updateTSL";
    /**
     * The **Edit TML** menu action for Liveboards and Answers.
     * Opens the TML editor.
     * @example
     * ```js
     * disabledActions: [Action.EditTML]
     * ```
     */
    Action["EditTML"] = "editTSL";
    /**
     * The **Present** menu action for Liveboards and Answers.
     * Allows presenting a Liveboard or visualization in
     * slideshow mode.
     * @example
     * ```js
     * disabledActions: [Action.Present]
     * ```
     */
    Action["Present"] = "present";
    /**
     * The visualization tile resize option.
     * Also available via More `...` options menu on a visualization.
     * Allows resizing visualization tiles and switching
     * between different preset layout option.
     *
     * @example
     * ```js
     * disabledActions: [Action.ToggleSize]
     * ```
     */
    Action["ToggleSize"] = "toggleSize";
    /**
     * The *Edit* action on the Liveboard page and in the
     * visualization menu.
     * Opens a Liveboard or visualization in edit mode.
     * @example
     * ```js
     * disabledActions: [Action.Edit]
     * ```
     */
    Action["Edit"] = "edit";
    /**
     * The text edit option for Liveboard and visualization titles.
     * @example
     * ```js
     * disabledActions: [Action.EditTitle]
     * ```
     */
    Action["EditTitle"] = "editTitle";
    /**
     * The **Delete** action on a Liveboard, *Liveboards* and
     * *Answers* list pages in full application embedding.
     *
     * @example
     * ```js
     * disabledActions: [Action.Remove]
     * ```
     */
    Action["Remove"] = "delete";
    /**
     * @hidden
     */
    Action["Ungroup"] = "ungroup";
    /**
     * @hidden
     */
    Action["Describe"] = "describe";
    /**
     * @hidden
     */
    Action["Relate"] = "relate";
    /**
     * @hidden
     */
    Action["CustomizeHeadlines"] = "customizeHeadlines";
    /**
     * @hidden
     */
    Action["PinboardInfo"] = "pinboardInfo";
    /**
     * The **Show Liveboard details** menu action on a Liveboard.
     * Displays details such as the name, description, and
     * author of the Liveboard, and timestamp of Liveboard creation
     * and update.
     * @example
     * ```js
     * disabledActions: [Action.LiveboardInfo]
     * ```
     */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    Action["LiveboardInfo"] = "pinboardInfo";
    /**
     * @hidden
     */
    Action["SendAnswerFeedback"] = "sendFeedback";
    /**
     * @hidden
     */
    Action["DownloadEmbraceQueries"] = "downloadEmbraceQueries";
    /**
     * The **Pin** menu action on an Answer or
     * Search results page.
     * @example
     * ```js
     * disabledActions: [Action.Pin]
     * ```
     */
    Action["Pin"] = "pin";
    /**
     * @hidden
     */
    Action["AnalysisInfo"] = "analysisInfo";
    /**
     * The **Schedule** menu action on a Liveboard.
     * Allows scheduling a Liveboard job.
     * @example
     * ```js
     * disabledActions: [Action.Subscription]
     * ```
     */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    Action["Subscription"] = "subscription";
    /**
     * The **Explore** action on Liveboard visualizations
     * @example
     * ```js
     * disabledActions: [Action.Explore]
     * ```
     */
    Action["Explore"] = "explore";
    /**
     * The contextual menu action to include a specific data point
     * when drilling down a table or chart on an Answer.
     *
     * @example
     * ```js
     * disabledActions: [Action.DrillInclude]
     * ```
     */
    Action["DrillInclude"] = "context-menu-item-include";
    /**
     * The contextual menu action to exclude a specific data point
     * when drilling down a table or chart on an Answer.
     * @example
     * ```js
     * disabledActions: [Action.DrillInclude]
     * ```
     */
    Action["DrillExclude"] = "context-menu-item-exclude";
    /**
     * The **Copy to clipboard** menu action on tables in an Answer
     * or Liveboard.
     * Copies the selected data point.
     * @example
     * ```js
     * disabledActions: [Action.CopyToClipboard]
     * ```
     */
    Action["CopyToClipboard"] = "context-menu-item-copy-to-clipboard";
    Action["CopyAndEdit"] = "context-menu-item-copy-and-edit";
    /**
     * @hidden
     */
    Action["DrillEdit"] = "context-menu-item-edit";
    Action["EditMeasure"] = "context-menu-item-edit-measure";
    Action["Separator"] = "context-menu-item-separator";
    /**
     * The **Drill down** menu action on Answers and Liveboard
     * visualizations.
     * Allows drilling down to a specific data point on a chart or table.
     * @example
     * ```js
     * disabledActions: [Action.DrillDown]
     * ```
     */
    Action["DrillDown"] = "DRILL";
    /**
     * The request access action on Liveboards.
     * Allows users with view permissions to request edit access to a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.RequestAccess]
     * ```
     */
    Action["RequestAccess"] = "requestAccess";
    /**
     * Controls the display and availability of the **Query visualizer** and
     * **Query SQL** buttons in the Query details panel on the Answer page.
     *
     * **Query visualizer** - Displays the tables and filters used in the search query.
     * **Query SQL** - Displays the SQL statements used to retrieve data for the query.
     *
     * Note: This action ID only affects the visibility of the buttons within the
     * Query details panel. It does not control the visibility
     * of the query details icon on the Answer page.
     * @example
     * ```js
     * disabledActions: [Action.QueryDetailsButtons]
     * ```
     */
    Action["QueryDetailsButtons"] = "queryDetailsButtons";
    /**
     * The **Delete** action for Answers in the full application
     * embedding mode.
     * @example
     * ```js
     * disabledActions: [Action.AnswerDelete]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    Action["AnswerDelete"] = "onDeleteAnswer";
    /**
     * The chart switcher icon on Answer page and
     * visualizations in edit mode.
     * Allows switching to the table or chart mode
     * when editing a visualization.
     * @example
     * ```js
     * disabledActions: [Action.AnswerChartSwitcher]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    Action["AnswerChartSwitcher"] = "answerChartSwitcher";
    /**
     * The Favorites icon (*) for Answers,
     * Liveboard, and data objects like Model,
     * Tables and Views.
     * Allows adding an object to the user's favorites list.
     * @example
     * ```js
     * disabledActions: [Action.AddToFavorites]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    Action["AddToFavorites"] = "addToFavorites";
    /**
     * The edit icon on Liveboards (Classic experience).
     * @example
     * ```js
     * disabledActions: [Action.EditDetails]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
    Action["EditDetails"] = "editDetails";
    /**
     * The *Create alert* action for KPI charts.
     * Allows users to schedule threshold-based alerts
     * for KPI charts.
     * @example
     * ```js
     * disabledActions: [Action.CreateMonitor]
     * ```
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
    Action["CreateMonitor"] = "createMonitor";
    /**
     * @version SDK: 1.11.1 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @deprecated This action is deprecated. It was used for reporting errors.
     * @example
     * ```js
     * disabledActions: [Action.ReportError]
     * ```
     */
    Action["ReportError"] = "reportError";
    /**
     * The **Sync to sheets** action on Answers and Liveboard visualizations.
     * Allows sending data to a Google Sheet.
     * @example
     * ```js
     * disabledActions: [Action.SyncToSheets]
     * ```
     * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
    Action["SyncToSheets"] = "sync-to-sheets";
    /**
     * The **Sync to other apps** action on Answers and Liveboard visualizations.
     * Allows sending data to third-party apps like Slack, Salesforce,
     * Microsoft Teams, and so on.
     * @example
     * ```js
     * disabledActions: [Action.SyncToOtherApps]
     * ```
     * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
    Action["SyncToOtherApps"] = "sync-to-other-apps";
    /**
     * The **Manage pipelines** action on Answers and Liveboard visualizations.
     * Allows users to manage data sync pipelines to third-party apps.
     * @example
     * ```js
     * disabledActions: [Action.ManagePipelines]
     * ```
     * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
    Action["ManagePipelines"] = "manage-pipeline";
    /**
     * The **Filter** action on Liveboard visualizations.
     * Allows users to apply cross-filters on a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.CrossFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.8.0.sw
     */
    Action["CrossFilter"] = "context-menu-item-cross-filter";
    /**
     * The **Sync to Slack** action on Liveboard visualizations.
     * Allows sending data to third-party apps like Slack.
     * @example
     * ```js
     * disabledActions: [Action.SyncToSlack]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot Cloud: 10.1.0.cl
     */
    Action["SyncToSlack"] = "syncToSlack";
    /**
     * The **Sync to Teams** action on Liveboard visualizations.
     * Allows sending data to third-party apps like Microsoft Teams.
     * @example
     * ```js
     * disabledActions: [Action.SyncToTeams]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot Cloud: 10.1.0.cl
     */
    Action["SyncToTeams"] = "syncToTeams";
    /**
     * The **Remove** action that appears when cross filters are applied
     * on a Liveboard.
     * Removes filters applied to a visualization.
     * @example
     * ```js
     * disabledActions: [Action.RemoveCrossFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["RemoveCrossFilter"] = "context-menu-item-remove-cross-filter";
    /**
     * The **Aggregate** option in the chart axis or the
     * table column customization menu.
     * Provides aggregation options to analyze the data on a chart or table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuAggregate]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuAggregate"] = "axisMenuAggregate";
    /**
     * The **Time bucket** option in the chart axis or table column
     * customization menu.
     * Allows defining time metric for date comparison.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuTimeBucket]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuTimeBucket"] = "axisMenuTimeBucket";
    /**
     * The **Filter** action in the chart axis or table column
     * customization menu.
     * Allows adding, editing, or removing filters.
     *
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuFilter"] = "axisMenuFilter";
    /**
     * The **Conditional formatting** action on chart or table.
     * Allows adding rules for conditional formatting of data
     * points on a chart or table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuConditionalFormat]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuConditionalFormat"] = "axisMenuConditionalFormat";
    /**
     * The **Sort** menu action on a table or chart axis
     * Sorts data in ascending or descending order.
     * Allows adding, editing, or removing filters.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuConditionalFormat]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuSort"] = "axisMenuSort";
    /**
     * The **Group** option in the chart axis or table column
     * customization menu.
     * Allows grouping data points if the axes use the same
     * unit of measurement and a similar scale.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuGroup]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuGroup"] = "axisMenuGroup";
    /**
     * The **Position** option in the axis customization menu.
     * Allows changing the position of the axis to the
     * left or right side of the chart.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuPosition]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuPosition"] = "axisMenuPosition";
    /**
     * The **Rename** option in the chart axis or table column customization menu.
     * Renames the axis label on a chart or the column header on a table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuRename]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuRename"] = "axisMenuRename";
    /**
     * The **Edit** action in the axis customization menu.
     * Allows editing the axis name, position, minimum and maximum values,
     * and format of a column.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuEdit]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuEdit"] = "axisMenuEdit";
    /**
     * The **Number format** action to customize the format of
     * the data labels on a chart or table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuNumberFormat]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuNumberFormat"] = "axisMenuNumberFormat";
    /**
     * The **Text wrapping** action on a table.
     * Wraps or clips column text on a table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuTextWrapping]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuTextWrapping"] = "axisMenuTextWrapping";
    /**
     * The **Remove** action in the chart axis or table column
     * customization menu.
     * Removes the data labels from a chart or the column of a
     * table visualization.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuRemove]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
    Action["AxisMenuRemove"] = "axisMenuRemove";
    /**
     * The **Compare with** action in the chart axis customization menu.
     * Allows comparing data across dimensions or measures.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuCompare]
     * ```
     * @version SDK: 1.50.0 | ThoughtSpot: 26.7.0.cl
     */
    Action["AxisMenuCompare"] = "axisMenuCompare";
    /**
     * The **Merge with** action in the chart axis customization menu.
     * Allows merging data across dimensions or measures.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuMerge]
     * ```
     * @version SDK: 1.50.0 | ThoughtSpot: 26.7.0.cl
     */
    Action["AxisMenuMerge"] = "axisMenuMerge";
    /**
     * @hidden
     */
    Action["InsertInToSlide"] = "insertInToSlide";
    /**
     * The **Rename** menu action on Liveboards and visualizations.
     * Allows renaming a Liveboard or visualization.
     * @example
     * ```js
     * disabledActions: [Action.RenameModalTitleDescription]
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl, 9.8.0.sw
     */
    Action["RenameModalTitleDescription"] = "renameModalTitleDescription";
    /**
     * The *Request verification* action on a Liveboard.
     * Initiates a request for Liveboard verification.
     * @example
     * ```js
     * disabledActions: [Action.RequestVerification]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl, 10.1.0.sw
     */
    Action["RequestVerification"] = "requestVerification";
    /**
     *
     * Allows users to mark a Liveboard as verified.
     * @example
     * ```js
     * disabledActions: [Action.MarkAsVerified]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl, 10.1.0.sw
     */
    Action["MarkAsVerified"] = "markAsVerified";
    /**
     * The **Add Tab** action on a Liveboard.
     * Allows adding a new tab to a Liveboard view.
     * @example
     * ```js
     * disabledActions: [Action.AddTab]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
    Action["AddTab"] = "addTab";
    /**
     *
     * Initiates contextual change analysis on KPI charts.
     * @example
     * ```js
     * disabledActions: [Action.EnableContextualChangeAnalysis]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot Cloud: 9.6.0.cl
     */
    Action["EnableContextualChangeAnalysis"] = "enableContextualChangeAnalysis";
    /**
     * Action ID to hide or disable Iterative Change Analysis option
     * in the contextual change analysis Insight charts context menu.
     *
     * @example
     * ```js
     * disabledActions: [Action.EnableIterativeChangeAnalysis]
     * ```
     * @version SDK: 1.41.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
    Action["EnableIterativeChangeAnalysis"] = "enableIterativeChangeAnalysis";
    /**
     * Action ID to hide or disable Natural Language Search query.
     *
     * @example
     * ```js
     * disabledActions: [Action.ShowSageQuery]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot Cloud: 9.7.0.cl
     */
    Action["ShowSageQuery"] = "showSageQuery";
    /**
     *
     * Action ID to hide or disable the edit option for the
     * results generated from the
     * Natural Language Search query.
     *
     * @example
     * ```js
     * disabledActions: [Action.EditSageAnswer]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot Cloud: 9.7.0.cl
     */
    Action["EditSageAnswer"] = "editSageAnswer";
    /**
     * The feedback widget for AI-generated Answers.
     * Allows users to send feedback on the Answers generated
     * from a Natural Language Search query.
     *
     * @example
     * ```js
     * disabledActions: [Action.SageAnswerFeedback]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl
     */
    Action["SageAnswerFeedback"] = "sageAnswerFeedback";
    /**
     *
     * @example
     * ```js
     * disabledActions: [Action.ModifySageAnswer]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl
     */
    Action["ModifySageAnswer"] = "modifySageAnswer";
    /**
     * The **Move to Tab** menu action on visualizations in Liveboard edit mode.
     * Allows moving a visualization to a different tab.
     * @example
     * ```js
     * disabledActions: [Action.MoveToTab]
     * ```
     */
    Action["MoveToTab"] = "onContainerMove";
    /**
     * The **Manage Alerts** menu action on KPI visualizations.
     * Allows creating, viewing, and editing monitor
     * alerts for a KPI chart.
     *
     * @example
     * ```js
     * disabledActions: [Action.ManageMonitor]
     * ```
     */
    Action["ManageMonitor"] = "manageMonitor";
    /**
     * The Liveboard Personalised Views dropdown.
     * Allows navigating to a personalized Liveboard View.
     * This action is deprecated. Use {@link Action.PersonalizedViewsDropdown} instead.
     *  @example
     * ```js
     * disabledActions: [Action.PersonalisedViewsDropdown]
     * ```
     *  @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
     * @deprecated SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    Action["PersonalisedViewsDropdown"] = "personalisedViewsDropdown";
    /**
     * The Liveboard Personalized Views dropdown.
     * Allows navigating to a personalized Liveboard View.
     *  @example
     * ```js
     * disabledActions: [Action.PersonalizedViewsDropdown]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    Action["PersonalizedViewsDropdown"] = "personalisedViewsDropdown";
    /**
     * Action ID for show or hide the user details on a
     * Liveboard (Recently visited / social proof)
     *  @example
     * ```js
     * disabledActions: [Action.LiveboardUsers]
     * ```
     *  @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
     */
    Action["LiveboardUsers"] = "liveboardUsers";
    /**
     * Action ID for the Parent TML action
     * The parent action **TML** must be included to access TML-related options
     * within the cascading menu (specific to the Answer page)
     * @example
     * ```js
     * // to include specific TML actions
     * visibleActions: [Action.TML, Action.ExportTML, Action.EditTML]
     *
     * ```
     * @example
     * ```js
     * hiddenAction: [Action.TML] // hide all TML actions
     * disabledActions: [Action.TML] // to disable all TML actions
     * ```
     * @version SDK: 1.28.3 | ThoughtSpot: 9.12.0.cl, 10.1.0.sw
     */
    Action["TML"] = "tml";
    /**
     * The **Create Liveboard* action on
     * the Liveboards page and the Pin modal.
     * Allows users to create a Liveboard.
     *
     * @example
     * ```js
     * hiddenAction: [Action.CreateLiveboard]
     * disabledActions: [Action.CreateLiveboard]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
    Action["CreateLiveboard"] = "createLiveboard";
    /**
     * Action ID for to hide or disable the
     * Verified Liveboard banner.
     *  @example
     * ```js
     * hiddenAction: [Action.VerifiedLiveboard]
     * ```
     *  @version SDK: 1.29.0 | ThoughtSpot: 9.10.0.cl, 10.1.0.sw
     */
    Action["VerifiedLiveboard"] = "verifiedLiveboard";
    /**
     * Action ID for the *Ask Sage* In Natural Language Search embed,
     * *Spotter* in Liveboard, full app, and Spotter embed.
     *
     * Allows initiating a conversation with ThoughtSpot AI analyst.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.AskAi]
     * ```
     *  @version SDK: 1.29.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
    Action["AskAi"] = "AskAi";
    /**
     * The **Add KPI to Watchlist** action on Home page watchlist.
     * Adds a KPI chart to the watchlist on the Home page.
     * @example
     * ```js
     * disabledActions: [Action.AddToWatchlist]
     * ```
     * @version SDK: 1.27.9 | ThoughtSpot Cloud: 9.12.5.cl
     */
    Action["AddToWatchlist"] = "addToWatchlist";
    /**
     * The **Remove from watchlist** menu action on KPI watchlist.
     * Removes a KPI chart from the watchlist on the Home page.
     * @example
     * ```js
     * disabledActions: [Action.RemoveFromWatchlist]
     * ```
     * @version SDK: 1.27.9 | ThoughtSpot: 9.12.5.cl
     */
    Action["RemoveFromWatchlist"] = "removeFromWatchlist";
    /**
     * The **Organize Favourites** action on Homepage
     * *Favorites* module.
     * This action is deprecated. Use {@link Action.OrganizeFavorites} instead.
     *
     * @example
     * ```js
     * disabledActions: [Action.OrganiseFavourites]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl
     * @deprecated SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    Action["OrganiseFavourites"] = "organiseFavourites";
    /**
     * The **Organize Favorites** action on Homepage
     * *Favorites* module.
     *
     * @example
     * ```js
     * disabledActions: [Action.OrganizeFavorites]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     */
    Action["OrganizeFavorites"] = "organiseFavourites";
    /**
     * The **AI Highlights** action on a Liveboard.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.AIHighlights]
     * ```
     *  @version SDK: 1.27.10 | ThoughtSpot Cloud: 9.12.5.cl
     */
    Action["AIHighlights"] = "AIHighlights";
    /**
     * The *Edit* action on the *Liveboard Schedules* page
     * (new Homepage experience).
     * Allows editing Liveboard schedules.
     *
     * @example
     * ```js
     * disabledActions: [Action.EditScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
    Action["EditScheduleHomepage"] = "editScheduleHomepage";
    /**
     * The *Pause* action on the *Liveboard Schedules* page
     * Pauses a scheduled Liveboard job.
     * @example
     * ```js
     * disabledActions: [Action.PauseScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
    Action["PauseScheduleHomepage"] = "pauseScheduleHomepage";
    /**
     * The **View run history** action **Liveboard Schedules** page.
     * Allows viewing schedule run history.
     * @example
     * ```js
     * disabledActions: [Action.ViewScheduleRunHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
    Action["ViewScheduleRunHomepage"] = "viewScheduleRunHomepage";
    /**
     * Action ID to hide or disable the
     * unsubscribe option for Liveboard schedules.
     * @example
     * ```js
     * disabledActions: [Action.UnsubscribeScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
    Action["UnsubscribeScheduleHomepage"] = "unsubscribeScheduleHomepage";
    /**
     * The **Manage Tags** action on Homepage Favourite Module.
     * @example
     * ```js
     * disabledActions: [Action.ManageTags]
     * ```
     * @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
    Action["ManageTags"] = "manageTags";
    /**
     * The **Delete** action on the **Liveboard Schedules* page.
     * Deletes a Liveboard schedule.
     * @example
     * ```js
     * disabledActions: [Action.DeleteScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
    Action["DeleteScheduleHomepage"] = "deleteScheduleHomepage";
    /**
     * The **Analyze CTA** action on KPI chart.
     * @example
     * ```js
     * disabledActions: [Action.KPIAnalysisCTA]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
    Action["KPIAnalysisCTA"] = "kpiAnalysisCTA";
    /**
     * Action ID for disabling chip reorder in Answer and Liveboard
     * @example
     * ```js
     * const disabledActions = [Action.DisableChipReorder]
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    Action["DisableChipReorder"] = "disableChipReorder";
    /**
     * Action ID to show, hide, or disable filters
     * in a Liveboard tab.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.ChangeFilterVisibilityInTab]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    Action["ChangeFilterVisibilityInTab"] = "changeFilterVisibilityInTab";
    /**
     * The **Data model instructions** button on the Spotter interface.
     * Allows opening the data model instructions modal.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.DataModelInstructions]
     * ```
     *  @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["DataModelInstructions"] = "DataModelInstructions";
    /**
     * The **Preview data** button on the Spotter interface.
     * Allows previewing the data used for Spotter queries.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.PreviewDataSpotter]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    Action["PreviewDataSpotter"] = "previewDataSpotter";
    /**
     * The **Reset** link on the Spotter interface.
     * Resets the conversation with Spotter.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.ResetSpotterChat]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    Action["ResetSpotterChat"] = "resetSpotterChat";
    /**
     * Action ID for hide or disable the
     * Spotter feedback widget.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.SpotterFeedback]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    Action["SpotterFeedback"] = "spotterFeedback";
    /**
     * Action ID for hide or disable
     * the previous prompt edit option in Spotter.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.EditPreviousPrompt]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    Action["EditPreviousPrompt"] = "editPreviousPrompt";
    /**
     * Action ID for hide or disable
     * the previous prompt deletion option in Spotter.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.DeletePreviousPrompt]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    Action["DeletePreviousPrompt"] = "deletePreviousPrompt";
    /**
     * Action ID for hide or disable editing tokens generated from
     * Spotter results.
     *  @example
     * ```js
     * hiddenAction: [Action.EditTokens]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
    Action["EditTokens"] = "editTokens";
    /**
     * Action ID for hiding rename option for Column rename
     *  @example
     * ```js
     * hiddenAction: [Action.ColumnRename]
     * ```
     *  @version SDK: 1.37.0 | ThoughtSpot Cloud: 10.8.0.cl
     */
    Action["ColumnRename"] = "columnRename";
    /**
     * Action ID for hide checkboxes for include or exclude
     * cover and filter pages in the Liveboard PDF
     *  @example
     * ```js
     * hiddenAction: [Action.CoverAndFilterOptionInPDF]
     * ```
     *  @version SDK: 1.37.0 | ThoughtSpot Cloud: 10.8.0.cl
     */
    Action["CoverAndFilterOptionInPDF"] = "coverAndFilterOptionInPDF";
    /**
     * Action ID to hide or disable the Coaching workflow in Spotter conversations.
     * When disabled, users cannot access **Add to Coaching** workflow in conversation.
     * The **Add to Coaching** feature allows adding reference questions and
     * business terms to improve Spotter’s responses. This feature is generally available
     * (GA) from version 26.2.0.cl and enabled by default on embed deployments.
     *  @example
     * ```js
     * hiddenAction: [Action.InConversationTraining]
     * disabledActions: [Action.InConversationTraining]
     *
     * ```
     *  @version SDK: 1.39.0 | ThoughtSpot Cloud: 10.10.0.cl
     */
    Action["InConversationTraining"] = "InConversationTraining";
    /**
     * Action ID to hide the warnings banner in
     * Spotter results. It's an EA feature and
     * handled by LD.
     *  @example
     * ```js
     * hiddenAction: [Action.SpotterWarningsBanner]
     * ```
     *  @version SDK: 1.41.0 | ThoughtSpot Cloud: 10.13.0.cl
     */
    Action["SpotterWarningsBanner"] = "SpotterWarningsBanner";
    /**
     * Action ID to hide the warnings border on the knowledge
     * card in Spotter results. It's an EA feature and
     * handled by LD.
     *  @example
     * ```js
     * hiddenAction: [Action.SpotterWarningsOnTokens]
     * ```
     *  @version SDK: 1.41.0 | ThoughtSpot Cloud: 10.13.0.cl
     */
    Action["SpotterWarningsOnTokens"] = "SpotterWarningsOnTokens";
    /**
     * Action ID to disable the click event handler on knowledge
     * card in Spotter results. It's an EA feature and
     * handled by LD.
     *  @example
     * ```js
     * hiddenAction: [Action.SpotterTokenQuickEdit]
     * ```
     *  @version SDK: 1.41.0 | ThoughtSpot Cloud: 10.13.0.cl
     */
    Action["SpotterTokenQuickEdit"] = "SpotterTokenQuickEdit";
    /**
     * The **PNG screenshot in email** option in the schedule email dialog.
     * Includes a PNG screenshot in the notification email body.
     * @example
     * ```js
     * disabledActions: [Action.PngScreenshotInEmail]
     * ```
     * ```
     *  @version SDK: 1.42.0 | ThoughtSpot Cloud: 10.14.0.cl
     */
    Action["PngScreenshotInEmail"] = "pngScreenshotInEmail";
    /**
     * The **Remove attachment** action in the schedule email dialog.
     * Removes an attachment from the email configuration.
     * @example
     * ```js
     * disabledActions: [Action.RemoveAttachment]
     * ```
     * ```
     * ```
     *  @version SDK: 1.42.0 | ThoughtSpot Cloud: 10.14.0.cl
     */
    Action["RemoveAttachment"] = "removeAttachment";
    /**
     * The **Style panel** on a Liveboard.
     * Controls the visibility of the Liveboard style panel.
     * @example
     * ```js
     * hiddenActions: [Action.LiveboardStylePanel]
     * ```
     * @version SDK: 1.43.0 | ThoughtSpot Cloud: 10.15.0.cl
     */
    Action["LiveboardStylePanel"] = "liveboardStylePanel";
    /**
     * The **Publish** action for Liveboards, Answers and Models.
     * Opens the publishing modal. It's a parent action for the
     * **Manage Publishing** and **Unpublish** actions if the object
     * is already published, otherwise appears standalone.
     * @example
     * ```js
     * hiddenActions: [Action.Publish]
     * disabledActions: [Action.Publish]
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot Cloud: 26.2.0.cl
     */
    Action["Publish"] = "publish";
    /**
     * The **Manage Publishing** action for Liveboards, Answers and Models.
     * Opens the same publishing modal as the **Publish** action.
     * Appears as a child action to the **Publish** action if the
     * object is already published.
     * @example
     * ```js
     * hiddenActions: [Action.ManagePublishing]
     * disabledActions: [Action.ManagePublishing]
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot Cloud: 26.2.0.cl
     */
    Action["ManagePublishing"] = "managePublishing";
    /**
     * The **Unpublish** action for Liveboards, Answers and Models.
     * Opens the unpublishing modal. Appears as a child action to
     * the **Publish** action if the object is already published.
     * @example
     * ```js
     * hiddenActions: [Action.Unpublish]
     * disabledActions: [Action.Unpublish]
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot Cloud: 26.2.0.cl
     */
    Action["Unpublish"] = "unpublish";
    /**
     * The **Parameterize** action for Tables and Connections.
     * Opens the parameterization modal.
     * @example
     * ```js
     * hiddenActions: [Action.Parameterize]
     * disabledActions: [Action.Parameterize]
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot Cloud: 26.2.0.cl
     */
    Action["Parameterize"] = "parameterise";
    /**
     * The **Move to Group** menu action on a Liveboard.
     * Allows moving a visualization to a different group.
     * @example
     * ```js
     * disabledActions: [Action.MoveToGroup]
     * ```
     * @version SDK: 1.44.0 | ThoughtSpot Cloud: 26.2.0.cl
     */
    Action["MoveToGroup"] = "moveToGroup";
    /**
     * The **Move out of Group** menu action on a Liveboard.
     * Allows moving a visualization out of a group.
     * @example
     * ```js
     * disabledActions: [Action.MoveOutOfGroup]
     * ```
     * @version SDK: 1.44.0 | ThoughtSpot Cloud: 26.2.0.cl
     */
    Action["MoveOutOfGroup"] = "moveOutOfGroup";
    /**
     * The **Create Group** menu action on a Liveboard.
     * Allows creating a new group.
     * @example
     * ```js
     * disabledActions: [Action.CreateGroup]
     * ```
     * @version SDK: 1.44.0 | ThoughtSpot Cloud: 26.2.0.cl
     */
    Action["CreateGroup"] = "createGroup";
    /**
     * The **Ungroup Liveboard Group** menu action on a Liveboard.
     * Allows ungrouping a liveboard group.
     * @example
     * ```js
     * disabledActions: [Action.UngroupLiveboardGroup]
     * ```
     * @version SDK: 1.44.0 | ThoughtSpot Cloud: 26.2.0.cl
     */
    Action["UngroupLiveboardGroup"] = "ungroupLiveboardGroup";
    /**
     * Controls visibility of the sidebar header (title and toggle button)
     * in the Spotter past conversations sidebar.
     * @example
     * ```js
     * hiddenActions: [Action.SpotterSidebarHeader]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterSidebarHeader"] = "spotterSidebarHeader";
    /**
     * Controls visibility of the sidebar footer (documentation link)
     * in the Spotter past conversations sidebar.
     * @example
     * ```js
     * hiddenActions: [Action.SpotterSidebarFooter]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterSidebarFooter"] = "spotterSidebarFooter";
    /**
     * Controls visibility and disable state of the sidebar toggle/expand button
     * in the Spotter past conversations sidebar.
     * @example
     * ```js
     * disabledActions: [Action.SpotterSidebarToggle]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterSidebarToggle"] = "spotterSidebarToggle";
    /**
     * Controls visibility and disable state of the "New Chat" button
     * in the Spotter past conversations sidebar.
     * @example
     * ```js
     * disabledActions: [Action.SpotterNewChat]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterNewChat"] = "spotterNewChat";
    /**
     * Controls visibility of the past conversation banner alert
     * in the Spotter interface.
     * @example
     * ```js
     * hiddenActions: [Action.SpotterPastChatBanner]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterPastChatBanner"] = "spotterPastChatBanner";
    /**
     * Controls visibility and disable state of the conversation edit menu
     * (three-dot menu) in the Spotter past conversations sidebar.
     * @example
     * ```js
     * disabledActions: [Action.SpotterChatMenu]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterChatMenu"] = "spotterChatMenu";
    /**
     * Controls visibility and disable state of the rename action
     * in the Spotter conversation edit menu.
     * @example
     * ```js
     * disabledActions: [Action.SpotterChatRename]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterChatRename"] = "spotterChatRename";
    /**
     * Controls visibility and disable state of the delete action
     * in the Spotter conversation edit menu.
     * @example
     * ```js
     * disabledActions: [Action.SpotterChatDelete]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterChatDelete"] = "spotterChatDelete";
    /**
     * Controls visibility and disable state of the documentation/best practices
     * link in the Spotter sidebar footer.
     * @example
     * ```js
     * disabledActions: [Action.SpotterDocs]
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     */
    Action["SpotterDocs"] = "spotterDocs";
    /**
     * Controls visibility and disable state of the connector resources
     * section in the Spotter chat interface.
     * @example
     * ```js
     * hiddenActions: [Action.SpotterChatConnectorResources]
     * disabledActions: [Action.SpotterChatConnectorResources]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot Cloud: 26.5.0.cl
     */
    Action["SpotterChatConnectorResources"] = "spotterChatConnectorResources";
    /**
     * Controls visibility and disable state of the connectors
     * in the Spotter chat interface.
     * @example
     * ```js
     * hiddenActions: [Action.SpotterChatConnectors]
     * disabledActions: [Action.SpotterChatConnectors]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot Cloud: 26.5.0.cl
     */
    Action["SpotterChatConnectors"] = "spotterChatConnectors";
    /**
     * Controls visibility and disable state of the mode switcher
     * in the Spotter chat interface.
     * @example
     * ```js
     * hiddenActions: [Action.SpotterChatModeSwitcher]
     * disabledActions: [Action.SpotterChatModeSwitcher]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot Cloud: 26.5.0.cl
     */
    Action["SpotterChatModeSwitcher"] = "spotterChatModeSwitcher";
    /**
     * The **Include current period** checkbox for date filters.
     * Controls the visibility and availability of the option to include
     * the current time period in filter results.
     * @example
     * ```js
     * hiddenActions: [Action.IncludeCurrentPeriod]
     * disabledActions: [Action.IncludeCurrentPeriod]
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot: 26.4.0.cl
     */
    Action["IncludeCurrentPeriod"] = "includeCurrentPeriod";
    /**
     * The **Send Test Email** button in the Liveboard schedule modal.
     * Allows sending a test schedule email to self or all recipients.
     * Requires `isSendNowLiveboardSchedulingEnabled` to be enabled.
     * @example
     * ```js
     * disabledActions: [Action.SendTestScheduleEmail]
     * hiddenActions: [Action.SendTestScheduleEmail]
     * ```
     * @version SDK: 1.48.0 | ThoughtSpot Cloud: 26.5.0.cl
     */
    Action["SendTestScheduleEmail"] = "sendTestScheduleEmail";
    /**
     * The thumbs up/down feedback buttons in the SpotterViz panel.
     * Visible by default.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * hiddenActions: [Action.SpotterVizFeedback]
     * disabledActions: [Action.SpotterVizFeedback]
     * ```
     */
    Action["SpotterVizFeedback"] = "spotterVizFeedback";
    /**
     * The version restore button on checkpoint cards in the SpotterViz panel.
     * Visible by default.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * hiddenActions: [Action.SpotterVizCheckpointRestore]
     * disabledActions: [Action.SpotterVizCheckpointRestore]
     * ```
     */
    Action["SpotterVizCheckpointRestore"] = "spotterVizCheckpointRestore";
    /**
     * The **SpotterViz** button in the top edit header.
     * Visible by default.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @example
     * ```js
     * hiddenActions: [Action.SpotterViz]
     * disabledActions: [Action.SpotterViz]
     * ```
     */
    Action["SpotterViz"] = "spotterViz";
    /**
     * Clears browser cache and fetches new data for liveboard ChartViz Containers.
     * Requires `enableLiveboardDataCache` to be enabled.
     * @example
     * ```js
     * disabledActions: [Action.RefreshLiveboardBrowserCache]
     * hiddenActions: [Action.RefreshLiveboardBrowserCache]
     * ```
     * @version SDK: 1.49.0 | ThoughtSpot Cloud: 26.6.0.cl
     */
    Action["RefreshLiveboardBrowserCache"] = "refreshLiveboardBrowserCache";
})(Action || (Action = {}));
var PrefetchFeatures;
(function (PrefetchFeatures) {
    PrefetchFeatures["FullApp"] = "FullApp";
    PrefetchFeatures["SearchEmbed"] = "SearchEmbed";
    PrefetchFeatures["LiveboardEmbed"] = "LiveboardEmbed";
    PrefetchFeatures["VizEmbed"] = "VizEmbed";
})(PrefetchFeatures || (PrefetchFeatures = {}));
/**
 * Enum for options to change context trigger.
 * The `BOTH_CLICKS` option is available from 10.8.0.cl.
 */
var ContextMenuTriggerOptions;
(function (ContextMenuTriggerOptions) {
    ContextMenuTriggerOptions["LEFT_CLICK"] = "left-click";
    ContextMenuTriggerOptions["RIGHT_CLICK"] = "right-click";
    ContextMenuTriggerOptions["BOTH_CLICKS"] = "both-clicks";
})(ContextMenuTriggerOptions || (ContextMenuTriggerOptions = {}));
/**
 * Enum options to show custom actions at different
 * positions in the application.
 */
var CustomActionsPosition;
(function (CustomActionsPosition) {
    /**
     * Shows the action as a primary button
     * in the toolbar area of the embed.
     */
    CustomActionsPosition["PRIMARY"] = "PRIMARY";
    /**
     * Shows the action inside the "More" menu
     * (three-dot overflow menu).
     */
    CustomActionsPosition["MENU"] = "MENU";
    /**
     * Shows the action in the right-click
     * context menu. Only supported for
     * {@link CustomActionTarget.VIZ},
     * {@link CustomActionTarget.ANSWER}, and
     * {@link CustomActionTarget.SPOTTER} targets.
     */
    CustomActionsPosition["CONTEXTMENU"] = "CONTEXTMENU";
})(CustomActionsPosition || (CustomActionsPosition = {}));
/**
 * Enum options to mention the target of the code-based custom action.
 * The target determines which type of ThoughtSpot object the action is
 * associated with, and also controls which positions and scoping options
 * are available.
 */
var CustomActionTarget;
(function (CustomActionTarget) {
    /**
     * Action applies at the Liveboard level.
     * Supported positions:
     * {@link CustomActionsPosition.PRIMARY},
     * {@link CustomActionsPosition.MENU}.
     * Can be scoped with
     * `metadataIds.liveboardIds`,
     * `orgIds`, and `groupIds`.
     */
    CustomActionTarget["LIVEBOARD"] = "LIVEBOARD";
    /**
     * Action applies to individual
     * visualizations (charts/tables).
     * Supported positions:
     * {@link CustomActionsPosition.PRIMARY},
     * {@link CustomActionsPosition.MENU},
     * {@link CustomActionsPosition.CONTEXTMENU}.
     * Can be scoped with `metadataIds`
     * (answerIds, liveboardIds, vizIds),
     * `dataModelIds` (modelIds,
     * modelColumnNames), `orgIds`,
     * and `groupIds`.
     */
    CustomActionTarget["VIZ"] = "VIZ";
    /**
     * Action applies to saved or unsaved
     * Answers. Supported positions:
     * {@link CustomActionsPosition.PRIMARY},
     * {@link CustomActionsPosition.MENU},
     * {@link CustomActionsPosition.CONTEXTMENU}.
     * Can be scoped with
     * `metadataIds.answerIds`,
     * `dataModelIds` (modelIds,
     * modelColumnNames), `orgIds`,
     * and `groupIds`.
     */
    CustomActionTarget["ANSWER"] = "ANSWER";
    /**
     * Action applies to Spotter
     * (AI-powered search).
     * Supported positions:
     * {@link CustomActionsPosition.MENU},
     * {@link CustomActionsPosition.CONTEXTMENU}.
     * Can be scoped with
     * `dataModelIds.modelIds`,
     * `orgIds`, and `groupIds`.
     */
    CustomActionTarget["SPOTTER"] = "SPOTTER";
})(CustomActionTarget || (CustomActionTarget = {}));
/**
 * Enum options to show or suppress Visual Embed SDK and
 * ThoughtSpot application logs in the console output.
 * This attribute doesn't support suppressing
 * browser warnings or errors.
 */
var LogLevel;
(function (LogLevel) {
    /**
     * No application or SDK-related logs will be logged
     * in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.SILENT,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    LogLevel["SILENT"] = "SILENT";
    /**
     * Log only errors in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.ERROR,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    LogLevel["ERROR"] = "ERROR";
    /**
     * Log only warnings and errors in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.WARN,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    LogLevel["WARN"] = "WARN";
    /**
     * Log only the information alerts, warnings, and errors
     * in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.INFO,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    LogLevel["INFO"] = "INFO";
    /**
     * Log debug messages, warnings, information alerts,
     * and errors in the console output.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.DEBUG,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    LogLevel["DEBUG"] = "DEBUG";
    /**
     * All logs will be logged in the browser console.
     * @example
     * ```js
     * init({
     *   ... //other embed view config,
     *  logLevel: LogLevel.TRACE,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
    LogLevel["TRACE"] = "TRACE";
})(LogLevel || (LogLevel = {}));
/**
 * Error types emitted by embedded components.
 *
 * These enum values categorize different types of errors that can occur during
 * the lifecycle of an embedded ThoughtSpot component.
 * Use {@link EmbedErrorDetailsEvent} and {@link EmbedErrorCodes} to handle specific errors.
 * @version SDK: 1.44.2 | ThoughtSpot: 26.2.0.cl
 * @group Error Handling
 *
 * @example
 * Handle specific error types
 * ```js
 * embed.on(EmbedEvent.Error, (error) => {
 *   switch (error.errorType) {
 *     case ErrorDetailsTypes.API:
 *       console.error('API error:', error.message);
 *       break;
 *     case ErrorDetailsTypes.VALIDATION_ERROR:
 *       console.error('Validation error:', error.message);
 *       break;
 *     case ErrorDetailsTypes.NETWORK:
 *       console.error('Network error:', error.message);
 *       break;
 *     default:
 *       console.error('Unknown error:', error);
 *   }
 * });
 * ```
 */
var ErrorDetailsTypes;
(function (ErrorDetailsTypes) {
    /** API call failure */
    ErrorDetailsTypes["API"] = "API";
    /** General validation error */
    ErrorDetailsTypes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    /** Network connectivity or request error */
    ErrorDetailsTypes["NETWORK"] = "NETWORK";
})(ErrorDetailsTypes || (ErrorDetailsTypes = {}));
/**
 * Error codes for identifying specific issues in embedded ThoughtSpot components. Use
 * {@link EmbedErrorDetailsEvent}  and  {@link ErrorDetailsTypes} codes for precise error
 * handling and debugging.
 *
 * @version SDK: 1.44.2 | ThoughtSpot: 26.2.0.cl
 * @group Error Handling

 * @example
 * Handle specific error codes in the error event handler
 * ```js
 * embed.on(EmbedEvent.Error, (error) => {
 *   switch (error.code) {
 *     case EmbedErrorCodes.WORKSHEET_ID_NOT_FOUND:
 *       console.error('Worksheet ID not found:', error.message);
 *       break;
 *     case EmbedErrorCodes.LIVEBOARD_ID_MISSING:
 *       console.error('Liveboard ID is missing:', error.message);
 *       break;
 *     case EmbedErrorCodes.CONFLICTING_ACTIONS_CONFIG:
 *       console.error('Conflicting actions configuration:', error.message);
 *       break;
 *     case EmbedErrorCodes.CONFLICTING_TABS_CONFIG:
 *       console.error('Conflicting tabs configuration:', error.message);
 *       break;
 *     default:
 *       console.error('Unknown error:', error);
 *   }
 * });
 * ```
 * */
var EmbedErrorCodes;
(function (EmbedErrorCodes) {
    /** Worksheet ID not found or does not exist */
    EmbedErrorCodes["WORKSHEET_ID_NOT_FOUND"] = "WORKSHEET_ID_NOT_FOUND";
    /** Required Liveboard ID is missing from configuration */
    EmbedErrorCodes["LIVEBOARD_ID_MISSING"] = "LIVEBOARD_ID_MISSING";
    /** Conflicting action configuration detected */
    EmbedErrorCodes["CONFLICTING_ACTIONS_CONFIG"] = "CONFLICTING_ACTIONS_CONFIG";
    /** Conflicting tab configuration detected  */
    EmbedErrorCodes["CONFLICTING_TABS_CONFIG"] = "CONFLICTING_TABS_CONFIG";
    /** Error during component initialization */
    EmbedErrorCodes["INIT_ERROR"] = "INIT_ERROR";
    /** Network connectivity or request error */
    EmbedErrorCodes["NETWORK_ERROR"] = "NETWORK_ERROR";
    /** Custom action validation failed */
    EmbedErrorCodes["CUSTOM_ACTION_VALIDATION"] = "CUSTOM_ACTION_VALIDATION";
    /** Authentication/login failed */
    EmbedErrorCodes["LOGIN_FAILED"] = "LOGIN_FAILED";
    /** Render method was not called before attempting to use the component */
    EmbedErrorCodes["RENDER_NOT_CALLED"] = "RENDER_NOT_CALLED";
    /** Host event type is undefined or invalid */
    EmbedErrorCodes["HOST_EVENT_TYPE_UNDEFINED"] = "HOST_EVENT_TYPE_UNDEFINED";
    /** Error parsing api intercept body */
    EmbedErrorCodes["PARSING_API_INTERCEPT_BODY_ERROR"] = "PARSING_API_INTERCEPT_BODY_ERROR";
    /** Failed to update embed parameters during pre-render */
    EmbedErrorCodes["UPDATE_PARAMS_FAILED"] = "UPDATE_PARAMS_FAILED";
    /** Invalid URL provided in configuration */
    EmbedErrorCodes["INVALID_URL"] = "INVALID_URL";
    /** Host event payload validation failed */
    EmbedErrorCodes["HOST_EVENT_VALIDATION"] = "HOST_EVENT_VALIDATION";
    /** UpdateFilters payload is invalid - missing or malformed filter/filters */
    EmbedErrorCodes["UPDATEFILTERS_INVALID_PAYLOAD"] = "UPDATEFILTERS_INVALID_PAYLOAD";
    /** DrillDown payload is invalid - missing or malformed points */
    EmbedErrorCodes["DRILLDOWN_INVALID_PAYLOAD"] = "DRILLDOWN_INVALID_PAYLOAD";
})(EmbedErrorCodes || (EmbedErrorCodes = {}));
/**
 * Context types for specifying the page context when triggering host events.
 * Used as the third parameter in the `trigger` method to help ThoughtSpot
 * understand the current page context for better event handling.
 *
 * @example
 * ```js
 * import { HostEvent, ContextType } from '@thoughtspot/visual-embed-sdk';
 *
 * // Trigger an event with specific context
 * embed.trigger(HostEvent.Pin, { vizId: "123", liveboardId: "456" }, ContextType.Search);
 * ```
 *
 * @version SDK: 1.45.2 | ThoughtSpot: 26.3.0.cl
 * @group Events
 */
var ContextType;
(function (ContextType) {
    /**
     * Search answer context for search page or edit viz dialog on liveboard page.
     */
    ContextType["Search"] = "search-answer";
    /**
     * Liveboard context for liveboard page.
     */
    ContextType["Liveboard"] = "liveboard";
    /**
     * Answer context for explore modal/page on liveboard page.
     */
    ContextType["Answer"] = "answer";
    /**
     * Spotter context for spotter modal/page.
     */
    ContextType["Spotter"] = "spotter";
    /**
     * Other context for any other generic page.
     */
    ContextType["Other"] = "other";
})(ContextType || (ContextType = {}));
/**
 * Enum for the type of API intercepted
 */
var InterceptedApiType;
(function (InterceptedApiType) {
    /**
     * The apis that are use to get the data for the embed
     */
    InterceptedApiType["AnswerData"] = "AnswerData";
    /**
     * This will intercept all the apis
     */
    InterceptedApiType["ALL"] = "ALL";
    /**
     * The apis that are use to get the data for the liveboard
     */
    InterceptedApiType["LiveboardData"] = "LiveboardData";
})(InterceptedApiType || (InterceptedApiType = {}));
/**
 * Data label filter operators
 * @group Visual Overrides
 */
var DataLabelFilterOperator;
(function (DataLabelFilterOperator) {
    /** Greater than */
    DataLabelFilterOperator["GreaterThan"] = "GREATER_THAN";
    /** Less than */
    DataLabelFilterOperator["LessThan"] = "LESS_THAN";
    /** Greater than or equal to */
    DataLabelFilterOperator["GreaterThanOrEqualTo"] = "GREATER_THAN_OR_EQUAL_TO";
    /** Less than or equal to */
    DataLabelFilterOperator["LessThanOrEqualTo"] = "LESS_THAN_OR_EQUAL_TO";
    /** Equal to */
    DataLabelFilterOperator["EqualTo"] = "EQUAL_TO";
    /** Not equal to */
    DataLabelFilterOperator["NotEqualTo"] = "NOT_EQUAL_TO";
})(DataLabelFilterOperator || (DataLabelFilterOperator = {}));
/**
 * Conditional formatting operators
 * @group Visual Overrides
 */
var ConditionalFormattingOperator;
(function (ConditionalFormattingOperator) {
    /** Is equal to */
    ConditionalFormattingOperator["Is"] = "IS";
    /** Is not equal to */
    ConditionalFormattingOperator["IsNot"] = "IS_NOT";
    /** Contains */
    ConditionalFormattingOperator["Contains"] = "CONTAINS";
    /** Does not contain */
    ConditionalFormattingOperator["DoesNotContain"] = "DOES_NOT_CONTAIN";
    /** Starts with */
    ConditionalFormattingOperator["StartsWith"] = "STARTS_WITH";
    /** Ends with */
    ConditionalFormattingOperator["EndsWith"] = "ENDS_WITH";
    /** Greater than */
    ConditionalFormattingOperator["GreaterThan"] = "GREATER_THAN";
    /** Less than */
    ConditionalFormattingOperator["LessThan"] = "LESS_THAN";
    /** Greater than or equal to */
    ConditionalFormattingOperator["GreaterThanEqualTo"] = "GREATER_THAN_EQUAL_TO";
    /** Less than or equal to */
    ConditionalFormattingOperator["LessThanEqualTo"] = "LESS_THAN_EQUAL_TO";
    /** Equal to */
    ConditionalFormattingOperator["EqualTo"] = "EQUAL_TO";
    /** Not equal to */
    ConditionalFormattingOperator["NotEqualTo"] = "NOT_EQUAL_TO";
    /** Is between */
    ConditionalFormattingOperator["IsBetween"] = "IS_BETWEEN";
    /** Is null */
    ConditionalFormattingOperator["IsNull"] = "IS_NULL";
    /** Is not null */
    ConditionalFormattingOperator["IsNotNull"] = "IS_NOT_NULL";
})(ConditionalFormattingOperator || (ConditionalFormattingOperator = {}));
/**
 * Background format types for conditional formatting
 * @group Visual Overrides
 */
var BackgroundFormatType;
(function (BackgroundFormatType) {
    /** Solid color background */
    BackgroundFormatType["Solid"] = "SOLID";
    /** Gradient background */
    BackgroundFormatType["Gradient"] = "GRADIENT";
})(BackgroundFormatType || (BackgroundFormatType = {}));
/**
 * Comparison types for conditional formatting
 * @group Visual Overrides
 */
var ConditionalFormattingComparisonType;
(function (ConditionalFormattingComparisonType) {
    /** Value-based comparison */
    ConditionalFormattingComparisonType["ValueBased"] = "VALUE_BASED";
    /** Column-based comparison */
    ConditionalFormattingComparisonType["ColumnBased"] = "COLUMN_BASED";
    /** Parameter-based comparison */
    ConditionalFormattingComparisonType["ParameterBased"] = "PARAMETER_BASED";
})(ConditionalFormattingComparisonType || (ConditionalFormattingComparisonType = {}));
/**
 * Legend position options
 * @group Visual Overrides
 */
var LegendPosition;
(function (LegendPosition) {
    /** Position legend at the top */
    LegendPosition["Top"] = "top";
    /** Position legend at the bottom */
    LegendPosition["Bottom"] = "bottom";
    /** Position legend on the left */
    LegendPosition["Left"] = "left";
    /** Position legend on the right */
    LegendPosition["Right"] = "right";
})(LegendPosition || (LegendPosition = {}));
/**
 * Table theme options
 * @group Visual Overrides
 */
var TableTheme;
(function (TableTheme) {
    /** Outline theme */
    TableTheme["Outline"] = "OUTLINE";
    /** Row theme */
    TableTheme["Row"] = "ROW";
    /** Zebra theme */
    TableTheme["Zebra"] = "ZEBRA";
})(TableTheme || (TableTheme = {}));
/**
 * Table content density options
 * @group Visual Overrides
 */
var TableContentDensity;
(function (TableContentDensity) {
    /** Regular density */
    TableContentDensity["Regular"] = "REGULAR";
    /** Compact density */
    TableContentDensity["Compact"] = "COMPACT";
})(TableContentDensity || (TableContentDensity = {}));

var version="1.48.0";var packageInfo = {version:version};

const logFunctions = {
    [LogLevel.SILENT]: () => undefined,
    [LogLevel.ERROR]: console.error,
    [LogLevel.WARN]: console.warn,
    [LogLevel.INFO]: console.info,
    [LogLevel.DEBUG]: console.debug,
    [LogLevel.TRACE]: console.trace,
};
let globalLogLevelOverride = LogLevel.TRACE;
const setGlobalLogLevelOverride = (logLevel) => {
    globalLogLevelOverride = logLevel;
};
const logLevelToNumber = {
    [LogLevel.SILENT]: 0,
    [LogLevel.ERROR]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.INFO]: 3,
    [LogLevel.DEBUG]: 4,
    [LogLevel.TRACE]: 5,
};
const compareLogLevels = (logLevel1, logLevel2) => {
    const logLevel1Index = logLevelToNumber[logLevel1];
    const logLevel2Index = logLevelToNumber[logLevel2];
    return logLevel1Index - logLevel2Index;
};
class Logger {
    constructor() {
        this.logLevel = LogLevel.ERROR;
        this.setLogLevel = (newLogLevel) => {
            this.logLevel = newLogLevel;
        };
        this.getLogLevel = () => this.logLevel;
    }
    canLog(logLevel) {
        if (logLevel === LogLevel.SILENT)
            return false;
        if (globalLogLevelOverride !== undefined) {
            return compareLogLevels(globalLogLevelOverride, logLevel) >= 0;
        }
        return compareLogLevels(this.logLevel, logLevel) >= 0;
    }
    logMessages(args, logLevel) {
        if (this.canLog(logLevel)) {
            const logFn = logFunctions[logLevel];
            if (logFn) {
                logFn(`[vesdk-${version}]`, ...args);
            }
        }
    }
    log(...args) {
        this.info(args);
    }
    info(...args) {
        this.logMessages(args, LogLevel.INFO);
    }
    debug(...args) {
        this.logMessages(args, LogLevel.DEBUG);
    }
    trace(...args) {
        this.logMessages(args, LogLevel.TRACE);
    }
    error(...args) {
        this.logMessages(args, LogLevel.ERROR);
    }
    warn(...args) {
        this.logMessages(args, LogLevel.WARN);
    }
}
const logger$3 = new Logger();

const ERROR_MESSAGE = {
    INVALID_THOUGHTSPOT_HOST: 'Error parsing ThoughtSpot host. Please provide a valid URL.',
    SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND: 'Please select a Model to get started',
    LIVEBOARD_VIZ_ID_VALIDATION: 'Please select a Liveboard to embed.',
    TRIGGER_TIMED_OUT: 'Trigger timed-out in getting a response',
    SEARCHEMBED_BETA_WRANING_MESSAGE: 'SearchEmbed is in Beta in this release.',
    THIRD_PARTY_COOKIE_BLOCKED_ALERT: 'Third-party cookie access is blocked on this browser. Please allow third-party cookies for this to work properly. \nYou can use `suppressNoCookieAccessAlert` to suppress this message.',
    DUPLICATE_TOKEN_ERR: 'Duplicate token. Please issue a new token every time getAuthToken callback is called. See https://developers.thoughtspot.com/docs/?pageid=embed-auth#trusted-auth-embed for more details.',
    SDK_NOT_INITIALIZED: 'SDK not initialized',
    SESSION_INFO_FAILED: 'Failed to get session information',
    INVALID_TOKEN_ERROR: 'Received invalid token from getAuthToken callback or authToken endpoint.',
    INVALID_TOKEN_TYPE_ERROR: 'Expected getAuthToken to return a string, but received a {invalidType}.',
    MIXPANEL_TOKEN_NOT_FOUND: 'Mixpanel token not found in session info',
    PRERENDER_ID_MISSING: 'PreRender ID is required for preRender',
    SYNC_STYLE_CALLED_BEFORE_RENDER: 'PreRender should be called before using syncPreRenderStyle',
    CSP_VIOLATION_ALERT: 'CSP violation detected. Please check the console errors for more details.',
    CSP_FRAME_HOST_VIOLATION_LOG_MESSAGE: 'Please set up CSP correctly for the application to start working. For more information, see https://developers.thoughtspot.com/docs/security-settings#csp-viz-embed-hosts. \n If the issue persists, refer to https://developers.thoughtspot.com/docs/security-settings#csp-viz-embed-hosts',
    MISSING_REPORTING_OBSERVER: 'ReportingObserver not supported',
    RENDER_CALLED_BEFORE_INIT: 'Looks like render was called before calling init, the render won\'t start until init is called.\nFor more info check\n1. https://developers.thoughtspot.com/docs/Function_init#_init\n2.https://developers.thoughtspot.com/docs/getting-started#initSdk',
    SPOTTER_AGENT_NOT_INITIALIZED: 'SpotterAgent not initialized',
    OFFLINE_WARNING: 'Network not Detected. Embed is offline. Please reconnect and refresh',
    INIT_SDK_REQUIRED: 'You need to init the ThoughtSpot SDK module first',
    CONFLICTING_ACTIONS_CONFIG: 'You cannot have both hidden actions and visible actions',
    CONFLICTING_TABS_CONFIG: 'You cannot have both hidden Tabs and visible Tabs',
    RENDER_BEFORE_EVENTS_REQUIRED: 'Please call render before triggering events',
    HOST_EVENT_TYPE_UNDEFINED: 'Host event type is undefined',
    LOGIN_FAILED: 'Login failed',
    ERROR_PARSING_API_INTERCEPT_BODY: 'Error parsing api intercept body',
    SSR_ENVIRONMENT_ERROR: 'SSR environment detected. This function cannot be called in SSR environment.',
    UPDATE_PARAMS_FAILED: 'Failed to update embed parameters',
    INVALID_SPOTTER_DOCUMENTATION_URL: 'Invalid spotterDocumentationUrl. Please provide a valid http or https URL.',
    UPDATEFILTERS_INVALID_PAYLOAD: 'UpdateFilters requires a valid filter or filters array. Expected: { filter: { column, oper, values } } or { filters: [{ column, oper, values }, ...] }',
    DRILLDOWN_INVALID_PAYLOAD: 'DrillDown requires a valid points object. Expected: { points: { clickedPoint?, selectedPoints? }, autoDrillDown?, vizId? }',
};
const CUSTOM_ACTIONS_ERROR_MESSAGE = {
    INVALID_ACTION_OBJECT: 'Custom Action Validation Error: Invalid action object provided',
    MISSING_REQUIRED_FIELDS: (id, missingFields) => `Custom Action Validation Error for '${id}': Missing required fields: ${missingFields.join(', ')}`,
    UNSUPPORTED_TARGET: (id, targetType) => `Custom Action Validation Error for '${id}': Target type '${targetType}' is not supported`,
    INVALID_POSITION: (position, targetType, supportedPositions) => `Position '${position}' is not supported for ${targetType.toLowerCase()}-level custom actions. Supported positions: ${supportedPositions}`,
    INVALID_METADATA_IDS: (targetType, invalidIds, supportedIds) => `Invalid metadata IDs for ${targetType.toLowerCase()}-level custom actions: ${invalidIds.join(', ')}. Supported metadata IDs: ${supportedIds}`,
    INVALID_DATA_MODEL_IDS: (targetType, invalidIds, supportedIds) => `Invalid data model IDs for ${targetType.toLowerCase()}-level custom actions: ${invalidIds.join(', ')}. Supported data model IDs: ${supportedIds}`,
    INVALID_FIELDS: (targetType, invalidFields, supportedFields) => `Invalid fields for ${targetType.toLowerCase()}-level custom actions: ${invalidFields.join(', ')}. Supported fields: ${supportedFields}`,
    DUPLICATE_IDS: (id, duplicateNames, keptName) => `Duplicate custom action ID '${id}' found. Actions with names '${duplicateNames.join("', '")}' will be ignored. Keeping '${keptName}'.`,
};

/**
 * Copyright (c) 2023
 *
 * Common utility functions for ThoughtSpot Visual Embed SDK
 * @summary Utils
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
/**
 * Construct a runtime filters query string from the given filters.
 * Refer to the following docs for more details on runtime filter syntax:
 * https://cloud-docs.thoughtspot.com/admin/ts-cloud/apply-runtime-filter.html
 * https://cloud-docs.thoughtspot.com/admin/ts-cloud/runtime-filter-operators.html
 * @param runtimeFilters
 */
const getFilterQuery = (runtimeFilters) => {
    if (runtimeFilters && runtimeFilters.length) {
        const filters = runtimeFilters.map((filter, valueIndex) => {
            const index = valueIndex + 1;
            const filterExpr = [];
            filterExpr.push(`col${index}=${encodeURIComponent(filter.columnName)}`);
            filterExpr.push(`op${index}=${filter.operator}`);
            filterExpr.push(filter.values.map((value) => {
                const encodedValue = typeof value === 'bigint' ? value.toString() : value;
                return `val${index}=${encodeURIComponent(String(encodedValue))}`;
            }).join('&'));
            return filterExpr.join('&');
        });
        return `${filters.join('&')}`;
    }
    return null;
};
/**
 * Construct a runtime parameter override query string from the given option.
 * @param runtimeParameters
 */
const getRuntimeParameters = (runtimeParameters) => {
    if (runtimeParameters && runtimeParameters.length) {
        const params = runtimeParameters.map((param, valueIndex) => {
            const index = valueIndex + 1;
            const filterExpr = [];
            filterExpr.push(`param${index}=${encodeURIComponent(param.name)}`);
            filterExpr.push(`paramVal${index}=${encodeURIComponent(param.value)}`);
            return filterExpr.join('&');
        });
        return `${params.join('&')}`;
    }
    return null;
};
/**
 * Convert a value to a string representation to be sent as a query
 * parameter to the ThoughtSpot app.
 * @param value Any parameter value
 */
const serializeParam = (value) => {
    // do not serialize primitive types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    return JSON.stringify(value);
};
/**
 * Convert a value to a string:
 * in case of an array, we convert it to CSV.
 * in case of any other type, we directly return the value.
 * @param value
 */
const paramToString = (value) => (Array.isArray(value) ? value.join(',') : value);
/**
 * Return a query param string composed from the given params object
 * @param queryParams
 * @param shouldSerializeParamValues
 */
const getQueryParamString = (queryParams, shouldSerializeParamValues = false) => {
    const qp = [];
    const params = Object.keys(queryParams);
    params.forEach((key) => {
        const val = queryParams[key];
        if (val !== undefined) {
            const serializedValue = shouldSerializeParamValues
                ? serializeParam(val)
                : paramToString(val);
            qp.push(`${key}=${serializedValue}`);
        }
    });
    if (qp.length) {
        return qp.join('&');
    }
    return null;
};
/**
 * Get a string representation of a dimension value in CSS
 * If numeric, it is considered in pixels.
 * @param value
 */
const getCssDimension = (value) => {
    if (typeof value === 'number') {
        return `${value}px`;
    }
    return value;
};
/**
 * Validates if a string is a valid CSS margin value.
 * @param value - The string to validate
 * @returns true if the value is a valid CSS margin value, false otherwise
 */
const isValidCssMargin = (value) => {
    if (isUndefined(value)) {
        return false;
    }
    if (typeof value !== 'string') {
        logger$3.error('Please provide a valid lazyLoadingMargin value (e.g., "10px")');
        return false;
    }
    // This pattern allows for an optional negative sign, and numbers
    // that can be integers or decimals (including leading dot).
    const cssUnitPattern = /^-?(\d+(\.\d*)?|\.\d+)(px|em|rem|%|vh|vw)$/i;
    const parts = value.trim().split(/\s+/);
    if (parts.length > 4) {
        logger$3.error('Please provide a valid lazyLoadingMargin value (e.g., "10px")');
        return false;
    }
    const isValid = parts.every(part => {
        const trimmedPart = part.trim();
        return trimmedPart.toLowerCase() === 'auto' || trimmedPart === '0' || cssUnitPattern.test(trimmedPart);
    });
    if (!isValid) {
        logger$3.error('Please provide a valid lazyLoadingMargin value (e.g., "10px")');
        return false;
    }
    return true;
};
const getSSOMarker = (markerId) => {
    const encStringToAppend = encodeURIComponent(markerId);
    return `tsSSOMarker=${encStringToAppend}`;
};
/**
 * Append a string to a URL's hash fragment
 * @param url A URL
 * @param stringToAppend The string to append to the URL hash
 */
const appendToUrlHash = (url, stringToAppend) => {
    let outputUrl = url;
    const encStringToAppend = encodeURIComponent(stringToAppend);
    const marker = `tsSSOMarker=${encStringToAppend}`;
    let splitAdder = '';
    if (url.indexOf('#') >= 0) {
        // If second half of hash contains a '?' already add a '&' instead of
        // '?' which appends to query params.
        splitAdder = url.split('#')[1].indexOf('?') >= 0 ? '&' : '?';
    }
    else {
        splitAdder = '#?';
    }
    outputUrl = `${outputUrl}${splitAdder}${marker}`;
    return outputUrl;
};
/**
 *
 * @param url
 * @param stringToAppend
 * @param path
 */
function getRedirectUrl(url, stringToAppend, path = '') {
    const targetUrl = path ? new URL(path, window.location.origin).href : url;
    return appendToUrlHash(targetUrl, stringToAppend);
}
const getEncodedQueryParamsString = (queryString) => {
    if (!queryString) {
        return queryString;
    }
    return btoa(queryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const getOffsetTop = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top + window.scrollY;
};
const embedEventStatus = {
    START: 'start',
    END: 'end',
};
const setAttributes = (element, attributes) => {
    Object.keys(attributes).forEach((key) => {
        element.setAttribute(key, attributes[key].toString());
    });
};
const isCloudRelease = (version) => version.endsWith('.cl');
/* For Search Embed: ReleaseVersionInBeta */
const checkReleaseVersionInBeta = (releaseVersion, suppressBetaWarning) => {
    if (releaseVersion !== '' && !isCloudRelease(releaseVersion)) {
        const splittedReleaseVersion = releaseVersion.split('.');
        const majorVersion = Number(splittedReleaseVersion[0]);
        const isBetaVersion = majorVersion < 8;
        return !suppressBetaWarning && isBetaVersion;
    }
    return false;
};
const getCustomisations = (embedConfig, viewConfig) => {
    var _a, _b, _c, _d;
    const customizationsFromViewConfig = viewConfig.customizations;
    const customizationsFromEmbedConfig = embedConfig.customizations
        || embedConfig.customisations;
    const customizations = {
        style: {
            ...customizationsFromEmbedConfig === null || customizationsFromEmbedConfig === void 0 ? void 0 : customizationsFromEmbedConfig.style,
            ...customizationsFromViewConfig === null || customizationsFromViewConfig === void 0 ? void 0 : customizationsFromViewConfig.style,
            customCSS: {
                ...(_a = customizationsFromEmbedConfig === null || customizationsFromEmbedConfig === void 0 ? void 0 : customizationsFromEmbedConfig.style) === null || _a === void 0 ? void 0 : _a.customCSS,
                ...(_b = customizationsFromViewConfig === null || customizationsFromViewConfig === void 0 ? void 0 : customizationsFromViewConfig.style) === null || _b === void 0 ? void 0 : _b.customCSS,
            },
            customCSSUrl: ((_c = customizationsFromViewConfig === null || customizationsFromViewConfig === void 0 ? void 0 : customizationsFromViewConfig.style) === null || _c === void 0 ? void 0 : _c.customCSSUrl)
                || ((_d = customizationsFromEmbedConfig === null || customizationsFromEmbedConfig === void 0 ? void 0 : customizationsFromEmbedConfig.style) === null || _d === void 0 ? void 0 : _d.customCSSUrl),
        },
        content: {
            ...customizationsFromEmbedConfig === null || customizationsFromEmbedConfig === void 0 ? void 0 : customizationsFromEmbedConfig.content,
            ...customizationsFromViewConfig === null || customizationsFromViewConfig === void 0 ? void 0 : customizationsFromViewConfig.content,
        },
    };
    return customizations;
};
const getRuntimeFilters = (runtimefilters) => getFilterQuery(runtimefilters || []);
/**
 * Gets a reference to the DOM node given
 * a selector.
 * @param domSelector
 */
function getDOMNode(domSelector) {
    return typeof domSelector === 'string' ? document.querySelector(domSelector) : domSelector;
}
const deepMerge = (target, source) => merge(target, source);
const getOperationNameFromQuery = (query) => {
    const regex = /(?:query|mutation)\s+(\w+)/;
    const matches = query.match(regex);
    return matches === null || matches === void 0 ? void 0 : matches[1];
};
/**
 *
 * @param obj
 */
function removeTypename(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
    for (const key in obj) {
        if (key === '__typename') {
            delete obj[key];
        }
        else if (typeof obj[key] === 'object') {
            removeTypename(obj[key]);
        }
    }
    return obj;
}
/**
 * Sets the specified style properties on an HTML element.
 * @param {HTMLElement} element - The HTML element to which the styles should be applied.
 * @param {Partial<CSSStyleDeclaration>} styleProperties - An object containing style
 * property names and their values.
 * @example
 * // Apply styles to an element
 * const element = document.getElementById('myElement');
 * const styles = {
 *   backgroundColor: 'red',
 *   fontSize: '16px',
 * };
 * setStyleProperties(element, styles);
 */
const setStyleProperties = (element, styleProperties) => {
    if (!(element === null || element === void 0 ? void 0 : element.style))
        return;
    Object.keys(styleProperties).forEach((styleProperty) => {
        const styleKey = styleProperty;
        const value = styleProperties[styleKey];
        if (value !== undefined) {
            element.style[styleKey] = value.toString();
        }
    });
};
/**
 * Removes specified style properties from an HTML element.
 * @param {HTMLElement} element - The HTML element from which the styles should be removed.
 * @param {string[]} styleProperties - An array of style property names to be removed.
 * @example
 * // Remove styles from an element
 * const element = document.getElementById('myElement');
 * element.style.backgroundColor = 'red';
 * const propertiesToRemove = ['backgroundColor'];
 * removeStyleProperties(element, propertiesToRemove);
 */
const removeStyleProperties = (element, styleProperties) => {
    if (!(element === null || element === void 0 ? void 0 : element.style))
        return;
    styleProperties.forEach((styleProperty) => {
        element.style.removeProperty(styleProperty);
    });
};
const isUndefined = (value) => value === undefined;
// Return if the value is a string, double or boolean.
const getTypeFromValue = (value) => {
    if (typeof value === 'string') {
        return ['char', 'string'];
    }
    if (typeof value === 'number') {
        return ['double', 'double'];
    }
    if (typeof value === 'boolean') {
        return ['boolean', 'boolean'];
    }
    return ['', ''];
};
const sdkWindowKey = '_tsEmbedSDK';
/**
 * Stores a value in the global `window` object under the `_tsEmbedSDK` namespace.
 * @param key - The key under which the value will be stored.
 * @param value - The value to store.
 * @param options - Additional options.
 * @param options.ignoreIfAlreadyExists - Does not set if value for key is set.
 *
 * @returns The stored value.
 *
 * @version SDK: 1.36.2 | ThoughtSpot: *
 */
function storeValueInWindow(key, value, options = {}) {
    if (isWindowUndefined())
        return value;
    if (!window[sdkWindowKey]) {
        window[sdkWindowKey] = {};
    }
    if (options.ignoreIfAlreadyExists && key in window[sdkWindowKey]) {
        return window[sdkWindowKey][key];
    }
    window[sdkWindowKey][key] = value;
    return value;
}
/**
 * Retrieves a stored value from the global
 * `window` object under the `_tsEmbedSDK` namespace.
 * Returns undefined in SSR environment.
 */
const getValueFromWindow = (key) => {
    var _a;
    if (isWindowUndefined())
        return undefined;
    return (_a = window === null || window === void 0 ? void 0 : window[sdkWindowKey]) === null || _a === void 0 ? void 0 : _a[key];
};
/**
 * Check if an array includes a string value
 * @param arr - The array to check
 * @param key - The string to search for
 * @returns boolean indicating if the string is found in the array
 */
const arrayIncludesString = (arr, key) => {
    return arr.some(item => typeof item === 'string' && item === key);
};
/**
 * Check if the document is currently in fullscreen mode
 */
const isInFullscreen = () => {
    return !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement);
};
/**
 * Handle Present HostEvent by entering fullscreen mode
 * @param iframe The iframe element to make fullscreen
 */
const handlePresentEvent = async (iframe) => {
    if (isInFullscreen()) {
        return; // Already in fullscreen
    }
    // Browser-specific methods to enter fullscreen mode
    const fullscreenMethods = [
        'requestFullscreen',
        'webkitRequestFullscreen',
        'mozRequestFullScreen',
        'msRequestFullscreen' // IE/Edge
    ];
    for (const method of fullscreenMethods) {
        if (typeof iframe[method] === 'function') {
            try {
                const result = iframe[method]();
                await Promise.resolve(result);
                return;
            }
            catch (error) {
                logger$3.warn(`Failed to enter fullscreen using ${method}:`, error);
            }
        }
    }
    logger$3.error('Fullscreen API is not supported by this browser.');
};
/**
 * Handle ExitPresentMode EmbedEvent by exiting fullscreen mode
 */
const handleExitPresentMode = async () => {
    if (!isInFullscreen()) {
        return; // Not in fullscreen
    }
    const exitFullscreenMethods = [
        'exitFullscreen',
        'webkitExitFullscreen',
        'mozCancelFullScreen',
        'msExitFullscreen' // IE/Edge
    ];
    // Try each method until one works
    for (const method of exitFullscreenMethods) {
        if (typeof document[method] === 'function') {
            try {
                const result = document[method]();
                await Promise.resolve(result);
                return;
            }
            catch (error) {
                logger$3.warn(`Failed to exit fullscreen using ${method}:`, error);
            }
        }
    }
    logger$3.warn('Exit fullscreen API is not supported by this browser.');
};
const calculateVisibleElementData = (element) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const frameRelativeTop = Math.max(rect.top, 0);
    const frameRelativeLeft = Math.max(rect.left, 0);
    const frameRelativeBottom = Math.min(windowHeight, rect.bottom);
    const frameRelativeRight = Math.min(windowWidth, rect.right);
    const data = {
        top: Math.max(0, rect.top * -1),
        height: Math.max(0, frameRelativeBottom - frameRelativeTop),
        left: Math.max(0, rect.left * -1),
        width: Math.max(0, frameRelativeRight - frameRelativeLeft),
    };
    return data;
};
/**
 * Replaces placeholders in a template string with provided values.
 * Placeholders should be in the format {key}.
 * @param template - The template string with placeholders
 * @param values - An object containing key-value pairs to replace placeholders
 * @returns The template string with placeholders replaced
 * @example
 * formatTemplate('Hello {name}, you are {age} years old', { name: 'John', age: 30 })
 * // Returns: 'Hello John, you are 30 years old'
 *
 * formatTemplate('Expected {type}, but received {actual}', { type: 'string', actual: 'number' })
 * // Returns: 'Expected string, but received number'
 */
const formatTemplate = (template, values) => {
    // This regex /\{(\w+)\}/g finds all placeholders in the format {word} 
    // and captures the word inside the braces for replacement.
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return values[key] !== undefined ? String(values[key]) : match;
    });
};
const getHostEventsConfig = (viewConfig) => {
    return {
        shouldBypassPayloadValidation: viewConfig.shouldBypassPayloadValidation,
        useHostEventsV2: viewConfig.useHostEventsV2,
    };
};
/**
 * Check if the window is undefined
 * If the window is undefined, it means the code is running in a SSR environment.
 * @returns true if the window is undefined, false otherwise
 *
 */
const isWindowUndefined = () => {
    if (typeof window === 'undefined') {
        logger$3.error(ERROR_MESSAGE.SSR_ENVIRONMENT_ERROR);
        return true;
    }
    return false;
};
/**
 * Validates that a URL uses only http: or https: protocols.
 * Returns a tuple of [isValid, error] so the caller can handle validation errors.
 * @param url - The URL string to validate
 * @returns [true, null] if valid, [false, Error] if invalid
 */
const validateHttpUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return [false, new Error(`Invalid protocol: ${parsedUrl.protocol}. Only http: and https: are allowed.`)];
        }
        return [true, null];
    }
    catch (error) {
        return [false, error instanceof Error ? error : new Error(String(error))];
    }
};
/**
 * Sets a query parameter if the value is defined.
 * @param queryParams - The query params object to modify
 * @param param - The parameter key
 * @param value - The value to set
 * @param asBoolean - If true, coerces value to boolean
 */
const setParamIfDefined = (queryParams, param, value, asBoolean = false) => {
    if (value !== undefined) {
        queryParams[param] = asBoolean ? !!value : value;
    }
};

/** Used for built-in method references. */
var objectProto$c = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$c;

  return value === proto;
}

var _isPrototype = isPrototype;

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

var _overArg = overArg;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = _overArg(Object.keys, Object);

var _nativeKeys = nativeKeys;

/** Used for built-in method references. */
var objectProto$b = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$a = objectProto$b.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!_isPrototype(object)) {
    return _nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$a.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

var _baseKeys = baseKeys;

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

/** Detect free variable `global` from Node.js. */

var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/** Built-in value references. */
var Symbol$1 = _root.Symbol;

var _Symbol = Symbol$1;

/** Used for built-in method references. */
var objectProto$a = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$9 = objectProto$a.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$a.toString;

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty$9.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto$9.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag$1 = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag$1;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag$1 = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject_1(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = _baseGetTag(value);
  return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
}

var isFunction_1 = isFunction;

/** Used to detect overreaching core-js shims. */
var coreJsData = _root['__core-js_shared__'];

var _coreJsData = coreJsData;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

var _isMasked = isMasked;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

var _toSource = toSource;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto$8 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$8 = objectProto$8.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty$8).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject_1(value) || _isMasked(value)) {
    return false;
  }
  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(_toSource(value));
}

var _baseIsNative = baseIsNative;

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

var _getValue = getValue;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = _getValue(object, key);
  return _baseIsNative(value) ? value : undefined;
}

var _getNative = getNative;

/* Built-in method references that are verified to be native. */
var DataView$1 = _getNative(_root, 'DataView');

var _DataView = DataView$1;

/* Built-in method references that are verified to be native. */
var Map$1 = _getNative(_root, 'Map');

var _Map = Map$1;

/* Built-in method references that are verified to be native. */
var Promise$1 = _getNative(_root, 'Promise');

var _Promise = Promise$1;

/* Built-in method references that are verified to be native. */
var Set$1 = _getNative(_root, 'Set');

var _Set = Set$1;

/* Built-in method references that are verified to be native. */
var WeakMap = _getNative(_root, 'WeakMap');

var _WeakMap = WeakMap;

/** `Object#toString` result references. */
var mapTag$3 = '[object Map]',
    objectTag$2 = '[object Object]',
    promiseTag = '[object Promise]',
    setTag$3 = '[object Set]',
    weakMapTag$1 = '[object WeakMap]';

var dataViewTag$2 = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = _toSource(_DataView),
    mapCtorString = _toSource(_Map),
    promiseCtorString = _toSource(_Promise),
    setCtorString = _toSource(_Set),
    weakMapCtorString = _toSource(_WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = _baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$2) ||
    (_Map && getTag(new _Map) != mapTag$3) ||
    (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
    (_Set && getTag(new _Set) != setTag$3) ||
    (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
  getTag = function(value) {
    var result = _baseGetTag(value),
        Ctor = result == objectTag$2 ? value.constructor : undefined,
        ctorString = Ctor ? _toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag$2;
        case mapCtorString: return mapTag$3;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag$3;
        case weakMapCtorString: return weakMapTag$1;
      }
    }
    return result;
  };
}

var _getTag = getTag;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var argsTag$2 = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike_1(value) && _baseGetTag(value) == argsTag$2;
}

var _baseIsArguments = baseIsArguments;

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$7.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable$1 = objectProto$7.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
  return isObjectLike_1(value) && hasOwnProperty$7.call(value, 'callee') &&
    !propertyIsEnumerable$1.call(value, 'callee');
};

var isArguments_1 = isArguments;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

var isArray_1 = isArray;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}

var isLength_1 = isLength;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength_1(value.length) && !isFunction_1(value);
}

var isArrayLike_1 = isArrayLike;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

var stubFalse_1 = stubFalse;

var isBuffer_1 = createCommonjsModule(function (module, exports$1) {
/** Detect free variable `exports`. */
var freeExports = exports$1 && !exports$1.nodeType && exports$1;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? _root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse_1;

module.exports = isBuffer;
});

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]',
    arrayTag$1 = '[object Array]',
    boolTag$2 = '[object Boolean]',
    dateTag$1 = '[object Date]',
    errorTag$1 = '[object Error]',
    funcTag = '[object Function]',
    mapTag$2 = '[object Map]',
    numberTag$1 = '[object Number]',
    objectTag$1 = '[object Object]',
    regexpTag$1 = '[object RegExp]',
    setTag$2 = '[object Set]',
    stringTag$1 = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag$1 = '[object ArrayBuffer]',
    dataViewTag$1 = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag$1] =
typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$2] =
typedArrayTags[dataViewTag$1] = typedArrayTags[dateTag$1] =
typedArrayTags[errorTag$1] = typedArrayTags[funcTag] =
typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] =
typedArrayTags[objectTag$1] = typedArrayTags[regexpTag$1] =
typedArrayTags[setTag$2] = typedArrayTags[stringTag$1] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike_1(value) &&
    isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
}

var _baseIsTypedArray = baseIsTypedArray;

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

var _baseUnary = baseUnary;

var _nodeUtil = createCommonjsModule(function (module, exports$1) {
/** Detect free variable `exports`. */
var freeExports = exports$1 && !exports$1.nodeType && exports$1;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && _freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;
});

/* Node.js helper references. */
var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

var isTypedArray_1 = isTypedArray;

/** `Object#toString` result references. */
var mapTag$1 = '[object Map]',
    setTag$1 = '[object Set]';

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$6.hasOwnProperty;

/**
 * Checks if `value` is an empty object, collection, map, or set.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
 * jQuery-like collections are considered empty if they have a `length` of `0`.
 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty$1(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike_1(value) &&
      (isArray_1(value) || typeof value == 'string' || typeof value.splice == 'function' ||
        isBuffer_1(value) || isTypedArray_1(value) || isArguments_1(value))) {
    return !value.length;
  }
  var tag = _getTag(value);
  if (tag == mapTag$1 || tag == setTag$1) {
    return !value.size;
  }
  if (_isPrototype(value)) {
    return !_baseKeys(value).length;
  }
  for (var key in value) {
    if (hasOwnProperty$6.call(value, key)) {
      return false;
    }
  }
  return true;
}

var isEmpty_1 = isEmpty$1;

var UIPassthroughEvent;
(function (UIPassthroughEvent) {
    UIPassthroughEvent["PinAnswerToLiveboard"] = "addVizToPinboard";
    UIPassthroughEvent["SaveAnswer"] = "saveAnswer";
    UIPassthroughEvent["GetDiscoverabilityStatus"] = "getDiscoverabilityStatus";
    UIPassthroughEvent["GetAvailableUIPassthroughs"] = "getAvailableUiPassthroughs";
    UIPassthroughEvent["GetAnswerConfig"] = "getAnswerPageConfig";
    UIPassthroughEvent["GetLiveboardConfig"] = "getPinboardPageConfig";
    UIPassthroughEvent["GetUnsavedAnswerTML"] = "getUnsavedAnswerTML";
    UIPassthroughEvent["UpdateFilters"] = "updateFilters";
    UIPassthroughEvent["Drilldown"] = "drillDown";
    UIPassthroughEvent["GetAnswerSession"] = "getAnswerSession";
    UIPassthroughEvent["GetFilters"] = "getFilters";
    UIPassthroughEvent["GetIframeUrl"] = "getIframeUrl";
    UIPassthroughEvent["GetParameters"] = "getParameters";
    UIPassthroughEvent["GetTML"] = "getTML";
    UIPassthroughEvent["GetTabs"] = "getTabs";
    UIPassthroughEvent["GetExportRequestForCurrentPinboard"] = "getExportRequestForCurrentPinboard";
})(UIPassthroughEvent || (UIPassthroughEvent = {}));

const EndPoints = {
    AUTH_VERIFICATION: '/callosum/v1/session/info',
    SESSION_INFO: '/callosum/v1/session/info',
    PREAUTH_INFO: '/prism/preauth/info',
    SAML_LOGIN_TEMPLATE: (targetUrl) => `/callosum/v1/saml/login?targetURLPath=${targetUrl}`,
    OIDC_LOGIN_TEMPLATE: (targetUrl) => `/callosum/v1/oidc/login?targetURLPath=${targetUrl}`,
    TOKEN_LOGIN: '/callosum/v1/session/login/token',
    BASIC_LOGIN: '/callosum/v1/session/login',
    LOGOUT: '/callosum/v1/session/logout',
    EXECUTE_TML: '/api/rest/2.0/metadata/tml/import',
    EXPORT_TML: '/api/rest/2.0/metadata/tml/export',
    IS_ACTIVE: '/callosum/v1/session/isactive',
};
/**
 *
 * @param url
 * @param options
 */
function failureLoggedFetch(url, options = {}) {
    return fetch(url, options).then(async (r) => {
        var _a;
        if (!r.ok && r.type !== 'opaqueredirect' && r.type !== 'opaque') {
            logger$3.error('Failure', await ((_a = r.text) === null || _a === void 0 ? void 0 : _a.call(r)));
        }
        return r;
    });
}
/**
 * Service to validate a auth token against a ThoughtSpot host.
 * @param thoughtSpotHost : ThoughtSpot host to verify the token against.
 * @param authToken : Auth token to verify.
 */
async function verifyTokenService(thoughtSpotHost, authToken) {
    const authVerificationUrl = `${thoughtSpotHost}${EndPoints.IS_ACTIVE}`;
    try {
        const res = await fetch(authVerificationUrl, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'x-requested-by': 'ThoughtSpot',
            },
            credentials: 'omit',
        });
        return res.ok;
    }
    catch (e) {
        logger$3.warn(`Token Verification Service failed : ${e.message}`);
    }
    return false;
}
/**
 *
 * @param authEndpoint
 */
async function fetchAuthTokenService(authEndpoint) {
    return fetch(authEndpoint);
}
/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param authToken
 */
async function fetchAuthService(thoughtSpotHost, username, authToken) {
    const fetchUrlParams = username
        ? `username=${username}&auth_token=${authToken}`
        : `auth_token=${authToken}`;
    return failureLoggedFetch(`${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}?${fetchUrlParams}`, {
        credentials: 'include',
        // We do not want to follow the redirect, as it starts giving a CORS
        // error
        redirect: 'manual',
    });
}
/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param authToken
 */
async function fetchAuthPostService(thoughtSpotHost, username, authToken) {
    const bodyPrams = username
        ? `username=${encodeURIComponent(username)}&auth_token=${encodeURIComponent(authToken)}`
        : `auth_token=${encodeURIComponent(authToken)}`;
    return failureLoggedFetch(`${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-requested-by': 'ThoughtSpot',
        },
        body: bodyPrams,
        credentials: 'include',
        // We do not want to follow the redirect, as it starts giving a CORS
        // error
        redirect: 'manual',
    });
}
/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param password
 */
async function fetchBasicAuthService(thoughtSpotHost, username, password) {
    return failureLoggedFetch(`${thoughtSpotHost}${EndPoints.BASIC_LOGIN}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-requested-by': 'ThoughtSpot',
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        credentials: 'include',
    });
}

const cacheAuthTokenKey = 'cachedAuthToken';
const getCacheAuthToken = () => getValueFromWindow(cacheAuthTokenKey);
const storeAuthTokenInCache = (token) => {
    storeValueInWindow(cacheAuthTokenKey, token);
};
// This method can be used to get the authToken using the embedConfig
/**
 *
 * @param embedConfig
 */
async function getAuthenticationToken(embedConfig, skipvalidation = false) {
    const cachedAuthToken = getCacheAuthToken();
    // Since we don't have token validation enabled , we cannot tell if the
    // cached token is valid or not. So we will always fetch a new token.
    if (cachedAuthToken && !embedConfig.disableTokenVerification && !skipvalidation) {
        let isCachedTokenStillValid;
        try {
            isCachedTokenStillValid = await validateAuthToken(embedConfig, cachedAuthToken, true);
        }
        catch {
            isCachedTokenStillValid = false;
        }
        if (isCachedTokenStillValid)
            return cachedAuthToken;
    }
    const { authEndpoint, getAuthToken } = embedConfig;
    let authToken = null;
    if (getAuthToken) {
        authToken = await getAuthToken();
    }
    else {
        const response = await fetchAuthTokenService(authEndpoint);
        authToken = await response.text();
    }
    try {
        // this will throw error if the token is not valid
        await validateAuthToken(embedConfig, authToken);
    }
    catch (e) {
        logger$3.error(`${ERROR_MESSAGE.INVALID_TOKEN_ERROR} Error : ${e.message}`);
        throw e;
    }
    storeAuthTokenInCache(authToken);
    return authToken;
}
const validateAuthToken = async (embedConfig, authToken, suppressAlert) => {
    // even if token verification is disabled, we will still validate
    // that the token is a string before proceeding.
    if (typeof authToken !== 'string') {
        const errorMessage = formatTemplate(ERROR_MESSAGE.INVALID_TOKEN_TYPE_ERROR, {
            invalidType: typeof authToken,
        });
        logger$3.error(errorMessage);
        throw new Error(errorMessage);
    }
    const cachedAuthToken = getCacheAuthToken();
    if (embedConfig.disableTokenVerification) {
        logger$3.info('Token verification is disabled. Assuming token is valid.');
        return true;
    }
    try {
        const isTokenValid = await verifyTokenService(embedConfig.thoughtSpotHost, authToken);
        if (isTokenValid)
            return true;
    }
    catch {
        return false;
    }
    if (cachedAuthToken && cachedAuthToken === authToken) {
        if (!embedConfig.suppressErrorAlerts && !suppressAlert) {
            alert(ERROR_MESSAGE.DUPLICATE_TOKEN_ERR);
        }
        throw new Error(ERROR_MESSAGE.DUPLICATE_TOKEN_ERR);
    }
    else {
        throw new Error(ERROR_MESSAGE.INVALID_TOKEN_ERROR);
    }
};
/**
 * Resets the auth token and a new token will be fetched on the next request.
 * @example
 * ```js
 * resetCachedAuthToken();
 * ```
 * @version SDK: 1.28.0 | ThoughtSpot: *
 * @group Authentication / Init
 */
const resetCachedAuthToken = () => {
    storeAuthTokenInCache(null);
};

const configKey = 'embedConfig';
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
const getEmbedConfig = () => getValueFromWindow(configKey) || {};
/**
 * Sets the configuration embed was initialized with.
 * And returns the new configuration.
 * @param newConfig The configuration to set.
 * @version SDK: 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.1.sw, and later
 * @group Global methods
 */
const setEmbedConfig = (newConfig) => {
    storeValueInWindow(configKey, newConfig);
    return getValueFromWindow(configKey);
};

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
const tokenizedFetch = async (input, init) => {
    const embedConfig = getEmbedConfig();
    const options = { ...init };
    let token;
    if (embedConfig.authType !== AuthType.TrustedAuthTokenCookieless) {
        token = getCacheAuthToken();
        if (!token) {
            return fetch(input, { ...options, credentials: 'include' });
        }
    }
    else {
        token = await getAuthenticationToken(embedConfig);
    }
    const req = new Request(input, options);
    if (token) {
        req.headers.append('Authorization', `Bearer ${token}`);
    }
    return fetch(req);
};

/**
 *
 * @param root0
 * @param root0.query
 * @param root0.variables
 * @param root0.thoughtSpotHost
 * @param root0.isCompositeQuery
 */
async function graphqlQuery({ query, variables, thoughtSpotHost, isCompositeQuery = false, }) {
    const operationName = getOperationNameFromQuery(query);
    try {
        const response = await tokenizedFetch(`${thoughtSpotHost}/prism/?op=${operationName}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json;charset=UTF-8',
                'x-requested-by': 'ThoughtSpot',
                accept: '*/*',
                'accept-language': 'en-us',
            },
            body: JSON.stringify({
                operationName,
                query,
                variables,
            }),
            credentials: 'include',
        });
        const result = await response.json();
        const dataValues = Object.values(result.data);
        return (isCompositeQuery) ? result.data : dataValues[0];
    }
    catch (error) {
        return error;
    }
}

const getSourceDetailQuery = `
    query GetSourceDetail($ids: [GUID!]!) {
        getSourceDetailById(ids: $ids, type: LOGICAL_TABLE) {
        id
        name
        description
        authorName
        authorDisplayName
        isExternal
        type
        created
        modified
        columns {
            id
            name
            author
            authorDisplayName
            description
            dataType
            type
            modified
            ownerName
            owner
            dataRecency
            sources {
            tableId
            tableName
            columnId
            columnName
            __typename
            }
            synonyms
            cohortAnswerId
            __typename
        }
        relationships
        destinationRelationships
        dataSourceId
        __typename
        }
    }  
`;
const sourceDetailCache = new Map();
/**
 *
 * @param thoughtSpotHost
 * @param sourceId
 */
async function getSourceDetail(thoughtSpotHost, sourceId) {
    if (sourceDetailCache.get(sourceId)) {
        return sourceDetailCache.get(sourceId);
    }
    const details = await graphqlQuery({
        query: getSourceDetailQuery,
        variables: {
            ids: [sourceId],
        },
        thoughtSpotHost,
    });
    const souceDetails = details[0];
    if (souceDetails) {
        sourceDetailCache.set(sourceId, souceDetails);
    }
    return souceDetails;
}

const bachSessionId = `
id {
    sessionId
    genNo
    acSession {
        sessionId
        genNo
    }
}
`;
const getUnaggregatedAnswerSession = `
mutation GetUnAggregatedAnswerSession($session: BachSessionIdInput!, $columns: [UserPointSelectionInput!]!) {
    Answer__getUnaggregatedAnswer(session: $session, columns: $columns) {
        ${bachSessionId}
        answer {
            visualizations {
                ... on TableViz {
                    columns {
                        column {
                            id
                            name
                            referencedColumns {
                                guid
                                displayName
                            }
                        }
                    }
                }
            }
        }
    }
}  
`;
const removeColumns = `
mutation RemoveColumns($session: BachSessionIdInput!, $logicalColumnIds: [GUID!], $columnIds: [GUID!]) {
    Answer__removeColumns(
        session: $session
        logicalColumnIds: $logicalColumnIds
        columnIds: $columnIds
        ) {
            ${bachSessionId}
    }
}
    `;
const addColumns = `
    mutation AddColumns($session: BachSessionIdInput!, $columns: [AnswerColumnInfo!]!) {
        Answer__addColumn(session: $session, columns: $columns) {
            ${bachSessionId}
        }
    }
    `;
const addFilter = `
    mutation AddUpdateFilter($session: BachSessionIdInput!, $params: AddUpdateFilterInput!) {
        Answer__addUpdateFilter(session: $session, params: $params) {
            ${bachSessionId}
        }
    }
`;
const getAnswer = `
    query GetAnswer($session: BachSessionIdInput!) {
        getAnswer(session: $session) {
            ${bachSessionId}
            answer {
                id
                name
                description
                displayMode
                sources {
                    header {
                        guid
                        displayName
                    }
                }
                filterGroups {
                    columnInfo {
                        name
                        referencedColumns {
                            guid
                            displayName
                        }
                    }
                    filters {
                        filterContent {
                            filterType
                            negate
                            value {
                                key
                            }
                        }
                    }
                }
                metadata {
                    author
                    authorId
                    createdAt
                    isDiscoverable
                    isHidden
                    modifiedAt
                }
                visualizations {
                    ... on TableViz {
                        id
                        columns {
                            column {
                                id
                                name
                                referencedColumns {
                                    guid
                                    displayName
                                }
                            }
                        }
                    }
                    ... on ChartViz {
                        id
                    }
                }
            }
        }
    }

`;
const getAnswerData = `
    query GetTableWithHeadlineData($session: BachSessionIdInput!, $deadline: Int!, $dataPaginationParams: DataPaginationParamsInput!) {
        getAnswer(session: $session) {
            ${bachSessionId}
            answer {
                id
                visualizations {
                    id
                    ... on TableViz {
                        columns {
                            column {
                                id
                                name
                                type
                                aggregationType
                                dataType
                            }
                        }
                        data(deadline: $deadline, pagination: $dataPaginationParams)
                    }          
                }
            }
        }
    }
`;
const addVizToLiveboard = `
    mutation AddVizToLiveboard(liveboardId: GUID!, session: BachSessionIdInput!, tabId: GUID, vizId: GUID!) {
        Answer__addVizToPinboard(
            pinboardId: liveboardId

            session: $session

            tabId: $tabId

            vizId: $vizId
        ) {
            ${bachSessionId}
        }
    }
`;
const getSQLQuery = `
    mutation GetSQLQuery($session: BachSessionIdInput!) {
        Answer__getQuery(session: $session) {
            sql
        }
    }
`;
const updateDisplayMode = `
   mutation UpdateDisplayMode(
    $session: BachSessionIdInput!
    $displayMode: DisplayMode
) {
    Answer__updateProperties(session: $session, displayMode: $displayMode) {
        id {
            sessionId
            genNo
            acSession {
                sessionId
                genNo
            }
        }
        answer {
            id
            displayMode
            suggestedDisplayMode
        }
    }
}
`;
const getAnswerTML = `
mutation GetUnsavedAnswerTML($session: BachSessionIdInput!, $exportDependencies: Boolean, $formatType:  EDocFormatType, $exportPermissions: Boolean, $exportFqn: Boolean) {
  UnsavedAnswer_getTML(
    session: $session
    exportDependencies: $exportDependencies
    formatType: $formatType
    exportPermissions: $exportPermissions
    exportFqn: $exportFqn
  ) {
    zipFile
    object {
      edoc
      name
      type
      __typename
    }
    __typename
  }
}`;

// import YAML from 'yaml';
var OperationType;
(function (OperationType) {
    OperationType["GetChartWithData"] = "GetChartWithData";
    OperationType["GetTableWithHeadlineData"] = "GetTableWithHeadlineData";
})(OperationType || (OperationType = {}));
const DATA_TYPES = ['DATE', 'DATE_TIME', 'TIME'];
/**
 * AnswerService provides a simple way to work with ThoughtSpot Answers.
 *
 * This service allows you to interact with ThoughtSpot Answers programmatically,
 * making it easy to customize visualizations, filter data, and extract insights
 * directly from your application.
 *
 * You can use this service to:
 *
 * - Add or remove columns from Answers (`addColumns`, `removeColumns`,
 * `addColumnsByName`)
 * - Apply filters to Answers (`addFilter`)
 * - Get data from Answers in different formats (JSON, CSV, PNG) (`fetchData`,
 * `fetchCSVBlob`, `fetchPNGBlob`)
 * - Get data for specific points in visualizations
 * (`getUnderlyingDataForPoint`)
 * - Run custom queries (`executeQuery`)
 * - Add visualizations to Liveboards (`addDisplayedVizToLiveboard`)
 *
 * @example
 * ```js
 * // Get the answer service
 * embed.on(EmbedEvent.Data, async (e) => {
 *     const service = await embed.getAnswerService();
 *
 *     // Add columns to the answer
 *     await service.addColumnsByName(["Sales", "Region"]);
 *
 *     // Get the data
 *     const data = await service.fetchData();
 *     console.log(data);
 * });
 * ```
 *
 * @example
 * ```js
 * // Get data for a point in a visualization
 * embed.on(EmbedEvent.CustomAction, async (e) => {
 *     const underlying = await e.answerService.getUnderlyingDataForPoint([
 *       'Product Name',
 *       'Sales Amount'
 *     ]);
 *
 *     const data = await underlying.fetchData(0, 100);
 *     console.log(data);
 * });
 * ```
 *
 * @version SDK: 1.25.0 | ThoughtSpot: 9.10.0.cl
 * @group Events
 */
class AnswerService {
    /**
     * Should not need to be called directly.
     * @param session
     * @param answer
     * @param thoughtSpotHost
     * @param selectedPoints
     */
    constructor(session, answer, thoughtSpotHost, selectedPoints) {
        this.session = session;
        this.thoughtSpotHost = thoughtSpotHost;
        this.selectedPoints = selectedPoints;
        this.tmlOverride = {};
        this.session = removeTypename(session);
        this.answer = answer;
    }
    /**
     * Get the details about the source used in the answer.
     * This can be used to get the list of all columns in the data source for example.
     */
    async getSourceDetail() {
        const sourceId = (await this.getAnswer()).sources[0].header.guid;
        return getSourceDetail(this.thoughtSpotHost, sourceId);
    }
    /**
     * Remove columnIds and return updated answer session.
     * @param columnIds
     * @returns
     */
    async removeColumns(columnIds) {
        return this.executeQuery(removeColumns, {
            logicalColumnIds: columnIds,
        });
    }
    /**
     * Add columnIds and return updated answer session.
     * @param columnIds
     * @returns
     */
    async addColumns(columnIds) {
        return this.executeQuery(addColumns, {
            columns: columnIds.map((colId) => ({ logicalColumnId: colId })),
        });
    }
    /**
     * Add columns by names and return updated answer session.
     * @param columnNames
     * @returns
     * @example
     * ```js
     * embed.on(EmbedEvent.Data, async (e) => {
     *    const service = await embed.getAnswerService();
     *    await service.addColumnsByName([
     *      "col name 1",
     *      "col name 2"
     *    ]);
     *    console.log(await service.fetchData());
     * });
     * ```
     */
    async addColumnsByName(columnNames) {
        const sourceDetail = await this.getSourceDetail();
        const columnGuids = getGuidsFromColumnNames(sourceDetail, columnNames);
        return this.addColumns([...columnGuids]);
    }
    /**
     * Add a filter to the answer.
     * @param columnName
     * @param operator
     * @param values
     * @returns
     */
    async addFilter(columnName, operator, values) {
        const sourceDetail = await this.getSourceDetail();
        const columnGuids = getGuidsFromColumnNames(sourceDetail, [columnName]);
        return this.executeQuery(addFilter, {
            params: {
                filterContent: [{
                        filterType: operator,
                        value: values.map((v) => {
                            const [type, prefix] = getTypeFromValue(v);
                            return {
                                type: type.toUpperCase(),
                                [`${prefix}Value`]: v,
                            };
                        }),
                    }],
                filterGroupId: {
                    logicalColumnId: columnGuids.values().next().value,
                },
            },
        });
    }
    async updateDisplayMode(displayMode = "TABLE_MODE") {
        return this.executeQuery(updateDisplayMode, {
            displayMode,
        });
    }
    async getSQLQuery(fetchSQLWithAllColumns = false) {
        if (fetchSQLWithAllColumns) {
            await this.updateDisplayMode("TABLE_MODE");
        }
        const { sql } = await this.executeQuery(getSQLQuery, {});
        return sql;
    }
    /**
     * Fetch data from the answer.
     * @param offset
     * @param size
     * @returns
     */
    async fetchData(offset = 0, size = 1000) {
        const { answer } = await this.executeQuery(getAnswerData, {
            deadline: 0,
            dataPaginationParams: {
                isClientPaginated: true,
                offset,
                size,
            },
        });
        const { columns, data } = answer.visualizations.find((viz) => !!viz.data) || {};
        return {
            columns,
            data,
        };
    }
    /**
     * Fetch the data for the answer as a CSV blob. This might be
     * quicker for larger data.
     * @param userLocale
     * @param includeInfo Include the CSV header in the output
     * @returns Response
     */
    async fetchCSVBlob(userLocale = 'en-us', includeInfo = false) {
        const fetchUrl = this.getFetchCSVBlobUrl(userLocale, includeInfo);
        return tokenizedFetch(fetchUrl, {
            credentials: 'include',
        });
    }
    /**
     * Fetch the data for the answer as a PNG blob. This might be
     * quicker for larger data.
     * @param userLocale
     * @param includeInfo
     * @param omitBackground Omit the background in the PNG
     * @param deviceScaleFactor The scale factor for the PNG
     * @return Response
     */
    async fetchPNGBlob(userLocale = 'en-us', omitBackground = false, deviceScaleFactor = 2) {
        const fetchUrl = this.getFetchPNGBlobUrl(userLocale, omitBackground, deviceScaleFactor);
        return tokenizedFetch(fetchUrl, {
            credentials: 'include',
        });
    }
    /**
     * Just get the internal URL for this answer's data
     * as a CSV blob.
     * @param userLocale
     * @param includeInfo
     * @returns
     */
    getFetchCSVBlobUrl(userLocale = 'en-us', includeInfo = false) {
        return `${this.thoughtSpotHost}/prism/download/answer/csv?sessionId=${this.session.sessionId}&genNo=${this.session.genNo}&userLocale=${userLocale}&exportFileName=data&hideCsvHeader=${!includeInfo}`;
    }
    /**
     * Just get the internal URL for this answer's data
     * as a PNG blob.
     * @param userLocale
     * @param omitBackground
     * @param deviceScaleFactor
     */
    getFetchPNGBlobUrl(userLocale = 'en-us', omitBackground = false, deviceScaleFactor = 2) {
        return `${this.thoughtSpotHost}/prism/download/answer/png?sessionId=${this.session.sessionId}&deviceScaleFactor=${deviceScaleFactor}&omitBackground=${omitBackground}&genNo=${this.session.genNo}&userLocale=${userLocale}&exportFileName=data`;
    }
    /**
     * Get underlying data given a point and the output column names.
     * In case of a context menu action, the selectedPoints are
     * automatically passed.
     * @param outputColumnNames
     * @param selectedPoints
     * @example
     * ```js
     *  embed.on(EmbedEvent.CustomAction, e => {
     *     const underlying = await e.answerService.getUnderlyingDataForPoint([
     *       'col name 1' // The column should exist in the data source.
     *     ]);
     *     const data = await underlying.fetchData(0, 100);
     *  })
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot: 9.10.0.cl
     */
    async getUnderlyingDataForPoint(outputColumnNames, selectedPoints) {
        if (!selectedPoints && !this.selectedPoints) {
            throw new Error('Needs to be triggered in context of a point');
        }
        if (!selectedPoints) {
            selectedPoints = getSelectedPointsForUnderlyingDataQuery(this.selectedPoints);
        }
        const sourceDetail = await this.getSourceDetail();
        const ouputColumnGuids = getGuidsFromColumnNames(sourceDetail, outputColumnNames);
        const unAggAnswer = await graphqlQuery({
            query: getUnaggregatedAnswerSession,
            variables: {
                session: this.session,
                columns: selectedPoints,
            },
            thoughtSpotHost: this.thoughtSpotHost,
        });
        const unaggAnswerSession = new AnswerService(unAggAnswer.id, unAggAnswer.answer, this.thoughtSpotHost);
        const currentColumns = new Set(unAggAnswer.answer.visualizations[0].columns
            .map((c) => c.column.referencedColumns[0].guid));
        const columnsToAdd = [...ouputColumnGuids].filter((col) => !currentColumns.has(col));
        if (columnsToAdd.length) {
            await unaggAnswerSession.addColumns(columnsToAdd);
        }
        const columnsToRemove = [...currentColumns].filter((col) => !ouputColumnGuids.has(col));
        if (columnsToRemove.length) {
            await unaggAnswerSession.removeColumns(columnsToRemove);
        }
        return unaggAnswerSession;
    }
    /**
     * Execute a custom graphql query in the context of the answer.
     * @param query graphql query
     * @param variables graphql variables
     * @returns
     */
    async executeQuery(query, variables) {
        const data = await graphqlQuery({
            query,
            variables: {
                session: this.session,
                ...variables,
            },
            thoughtSpotHost: this.thoughtSpotHost,
            isCompositeQuery: false,
        });
        this.session = deepMerge(this.session, (data === null || data === void 0 ? void 0 : data.id) || {});
        return data;
    }
    /**
     * Get the internal session details for the answer.
     * @returns
     */
    getSession() {
        return this.session;
    }
    async getAnswer() {
        if (this.answer) {
            return this.answer;
        }
        this.answer = this.executeQuery(getAnswer, {}).then((data) => data === null || data === void 0 ? void 0 : data.answer);
        return this.answer;
    }
    async getTML() {
        const { object } = await this.executeQuery(getAnswerTML, {});
        const edoc = object[0].edoc;
        const YAML = await import('./index-Ck-r09gt.js');
        const parsedDoc = YAML.parse(edoc);
        return {
            answer: {
                ...parsedDoc.answer,
                ...this.tmlOverride,
            },
        };
    }
    async addDisplayedVizToLiveboard(liveboardId) {
        const { displayMode, visualizations } = await this.getAnswer();
        const viz = getDisplayedViz(visualizations, displayMode);
        return this.executeQuery(addVizToLiveboard, {
            liveboardId,
            vizId: viz.id,
        });
    }
    setTMLOverride(override) {
        this.tmlOverride = override;
    }
}
/**
 *
 * @param sourceDetail
 * @param colNames
 */
function getGuidsFromColumnNames(sourceDetail, colNames) {
    const cols = sourceDetail.columns.reduce((colSet, col) => {
        colSet[col.name.toLowerCase()] = col;
        return colSet;
    }, {});
    return new Set(colNames.map((colName) => {
        const col = cols[colName.toLowerCase()];
        return col.id;
    }));
}
/**
 *
 * @param selectedPoints
 */
function getSelectedPointsForUnderlyingDataQuery(selectedPoints) {
    const underlyingDataPoint = [];
    /**
     *
     * @param colVal
     */
    function addPointFromColVal(colVal) {
        var _a;
        const dataType = colVal.column.dataType;
        colVal.column.id;
        let dataValue;
        if (DATA_TYPES.includes(dataType)) {
            if (Number.isFinite(colVal.value)) {
                dataValue = [{
                        epochRange: {
                            startEpoch: colVal.value,
                        },
                    }];
                // Case for custom calendar.
            }
            else if ((_a = colVal.value) === null || _a === void 0 ? void 0 : _a.v) {
                dataValue = [{
                        epochRange: {
                            startEpoch: colVal.value.v.s,
                            endEpoch: colVal.value.v.e,
                        },
                    }];
            }
        }
        else {
            dataValue = [{ value: colVal.value }];
        }
        underlyingDataPoint.push({
            columnId: colVal.column.id,
            dataValue,
        });
    }
    selectedPoints.forEach((p) => {
        p.selectedAttributes.forEach(addPointFromColVal);
    });
    return underlyingDataPoint;
}
/**
 *
 * @param visualizations
 * @param displayMode
 */
function getDisplayedViz(visualizations, displayMode) {
    if (displayMode === 'CHART_MODE') {
        return visualizations.find((viz) => viz.__typename === 'ChartViz');
    }
    return visualizations.find((viz) => viz.__typename === 'TableViz');
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

var _arrayPush = arrayPush;

/** Built-in value references. */
var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArray_1(value) || isArguments_1(value) ||
    !!(spreadableSymbol && value && value[spreadableSymbol]);
}

var _isFlattenable = isFlattenable;

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = _isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        _arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

var _baseFlatten = baseFlatten;

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

var _arrayMap = arrayMap;

/** `Object#toString` result references. */
var symbolTag$1 = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike_1(value) && _baseGetTag(value) == symbolTag$1);
}

var isSymbol_1 = isSymbol;

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray_1(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol_1(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

var _isKey = isKey;

/* Built-in method references that are verified to be native. */
var nativeCreate = _getNative(Object, 'create');

var _nativeCreate = nativeCreate;

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
  this.size = 0;
}

var _hashClear = hashClear;

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

var _hashDelete = hashDelete;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$5.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (_nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED$2 ? undefined : result;
  }
  return hasOwnProperty$5.call(data, key) ? data[key] : undefined;
}

var _hashGet = hashGet;

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$4.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$4.call(data, key);
}

var _hashHas = hashHas;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
  return this;
}

var _hashSet = hashSet;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = _hashClear;
Hash.prototype['delete'] = _hashDelete;
Hash.prototype.get = _hashGet;
Hash.prototype.has = _hashHas;
Hash.prototype.set = _hashSet;

var _Hash = Hash;

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

var _listCacheClear = listCacheClear;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

var eq_1 = eq;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_1(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

var _assocIndexOf = assocIndexOf;

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

var _listCacheDelete = listCacheDelete;

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

var _listCacheGet = listCacheGet;

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return _assocIndexOf(this.__data__, key) > -1;
}

var _listCacheHas = listCacheHas;

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

var _listCacheSet = listCacheSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = _listCacheClear;
ListCache.prototype['delete'] = _listCacheDelete;
ListCache.prototype.get = _listCacheGet;
ListCache.prototype.has = _listCacheHas;
ListCache.prototype.set = _listCacheSet;

var _ListCache = ListCache;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new _Hash,
    'map': new (_Map || _ListCache),
    'string': new _Hash
  };
}

var _mapCacheClear = mapCacheClear;

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

var _isKeyable = isKeyable;

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return _isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

var _getMapData = getMapData;

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = _getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

var _mapCacheDelete = mapCacheDelete;

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return _getMapData(this, key).get(key);
}

var _mapCacheGet = mapCacheGet;

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return _getMapData(this, key).has(key);
}

var _mapCacheHas = mapCacheHas;

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = _getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

var _mapCacheSet = mapCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = _mapCacheClear;
MapCache.prototype['delete'] = _mapCacheDelete;
MapCache.prototype.get = _mapCacheGet;
MapCache.prototype.has = _mapCacheHas;
MapCache.prototype.set = _mapCacheSet;

var _MapCache = MapCache;

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || _MapCache);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = _MapCache;

var memoize_1 = memoize;

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize_1(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

var _memoizeCapped = memoizeCapped;

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = _memoizeCapped(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

var _stringToPath = stringToPath;

/** Used to convert symbols to primitives and strings. */
var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined,
    symbolToString = symbolProto$1 ? symbolProto$1.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray_1(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return _arrayMap(value, baseToString) + '';
  }
  if (isSymbol_1(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -Infinity) ? '-0' : result;
}

var _baseToString = baseToString;

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString$1(value) {
  return value == null ? '' : _baseToString(value);
}

var toString_1 = toString$1;

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray_1(value)) {
    return value;
  }
  return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
}

var _castPath = castPath;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol_1(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -Infinity) ? '-0' : result;
}

var _toKey = toKey;

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = _castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[_toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

var _baseGet = baseGet;

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new _ListCache;
  this.size = 0;
}

var _stackClear = stackClear;

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

var _stackDelete = stackDelete;

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

var _stackGet = stackGet;

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

var _stackHas = stackHas;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof _ListCache) {
    var pairs = data.__data__;
    if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new _MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

var _stackSet = stackSet;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new _ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = _stackClear;
Stack.prototype['delete'] = _stackDelete;
Stack.prototype.get = _stackGet;
Stack.prototype.has = _stackHas;
Stack.prototype.set = _stackSet;

var _Stack = Stack;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

var _setCacheAdd = setCacheAdd;

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {boolean} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

var _setCacheHas = setCacheHas;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new _MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
SetCache.prototype.has = _setCacheHas;

var _SetCache = SetCache;

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

var _arraySome = arraySome;

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

var _cacheHas = cacheHas;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$5 = 1,
    COMPARE_UNORDERED_FLAG$3 = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$5,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Check that cyclic values are equal.
  var arrStacked = stack.get(array);
  var othStacked = stack.get(other);
  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG$3) ? new _SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!_arraySome(other, function(othValue, othIndex) {
            if (!_cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

var _equalArrays = equalArrays;

/** Built-in value references. */
var Uint8Array$1 = _root.Uint8Array;

var _Uint8Array = Uint8Array$1;

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

var _mapToArray = mapToArray;

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

var _setToArray = setToArray;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$4 = 1,
    COMPARE_UNORDERED_FLAG$2 = 2;

/** `Object#toString` result references. */
var boolTag$1 = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new _Uint8Array(object), new _Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag$1:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq_1(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = _mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$4;
      convert || (convert = _setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG$2;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = _equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

var _equalByTag = equalByTag;

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
}

var _baseGetAllKeys = baseGetAllKeys;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

var _arrayFilter = arrayFilter;

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

var stubArray_1 = stubArray;

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return _arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

var _getSymbols = getSymbols;

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

var _baseTimes = baseTimes;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

var _isIndex = isIndex;

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$2.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_1(value),
      isArg = !isArr && isArguments_1(value),
      isBuff = !isArr && !isArg && isBuffer_1(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? _baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$3.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           _isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

var _arrayLikeKeys = arrayLikeKeys;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
}

var keys_1 = keys;

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return _baseGetAllKeys(object, keys_1, _getSymbols);
}

var _getAllKeys = getAllKeys;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$3 = 1;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$1.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3,
      objProps = _getAllKeys(object),
      objLength = objProps.length,
      othProps = _getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty$2.call(other, key))) {
      return false;
    }
  }
  // Check that cyclic values are equal.
  var objStacked = stack.get(object);
  var othStacked = stack.get(other);
  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

var _equalObjects = equalObjects;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$2 = 1;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray_1(object),
      othIsArr = isArray_1(other),
      objTag = objIsArr ? arrayTag : _getTag(object),
      othTag = othIsArr ? arrayTag : _getTag(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer_1(object)) {
    if (!isBuffer_1(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new _Stack);
    return (objIsArr || isTypedArray_1(object))
      ? _equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : _equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG$2)) {
    var objIsWrapped = objIsObj && hasOwnProperty$1.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty$1.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new _Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new _Stack);
  return _equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

var _baseIsEqualDeep = baseIsEqualDeep;

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike_1(value) && !isObjectLike_1(other))) {
    return value !== value && other !== other;
  }
  return _baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

var _baseIsEqual = baseIsEqual;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$1 = 1,
    COMPARE_UNORDERED_FLAG$1 = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new _Stack;
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$1 | COMPARE_UNORDERED_FLAG$1, customizer, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

var _baseIsMatch = baseIsMatch;

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject_1(value);
}

var _isStrictComparable = isStrictComparable;

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = keys_1(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, _isStrictComparable(value)];
  }
  return result;
}

var _getMatchData = getMatchData;

/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

var _matchesStrictComparable = matchesStrictComparable;

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
  var matchData = _getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return _matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || _baseIsMatch(object, source, matchData);
  };
}

var _baseMatches = baseMatches;

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : _baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

var get_1 = get;

/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

var _baseHasIn = baseHasIn;

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
  path = _castPath(path, object);

  var index = -1,
      length = path.length,
      result = false;

  while (++index < length) {
    var key = _toKey(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength_1(length) && _isIndex(key, length) &&
    (isArray_1(object) || isArguments_1(object));
}

var _hasPath = hasPath;

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
  return object != null && _hasPath(object, path, _baseHasIn);
}

var hasIn_1 = hasIn;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
  if (_isKey(path) && _isStrictComparable(srcValue)) {
    return _matchesStrictComparable(_toKey(path), srcValue);
  }
  return function(object) {
    var objValue = get_1(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn_1(object, path)
      : _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}

var _baseMatchesProperty = baseMatchesProperty;

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

var identity_1 = identity;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

var _baseProperty = baseProperty;

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return _baseGet(object, path);
  };
}

var _basePropertyDeep = basePropertyDeep;

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return _isKey(path) ? _baseProperty(_toKey(path)) : _basePropertyDeep(path);
}

var property_1 = property;

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity_1;
  }
  if (typeof value == 'object') {
    return isArray_1(value)
      ? _baseMatchesProperty(value[0], value[1])
      : _baseMatches(value);
  }
  return property_1(value);
}

var _baseIteratee = baseIteratee;

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

var _createBaseFor = createBaseFor;

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = _createBaseFor();

var _baseFor = baseFor;

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && _baseFor(object, iteratee, keys_1);
}

var _baseForOwn = baseForOwn;

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike_1(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

var _createBaseEach = createBaseEach;

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = _createBaseEach(_baseForOwn);

var _baseEach = baseEach;

/**
 * The base implementation of `_.map` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike_1(collection) ? Array(collection.length) : [];

  _baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

var _baseMap = baseMap;

/**
 * The base implementation of `_.sortBy` which uses `comparer` to define the
 * sort order of `array` and replaces criteria objects with their corresponding
 * values.
 *
 * @private
 * @param {Array} array The array to sort.
 * @param {Function} comparer The function to define sort order.
 * @returns {Array} Returns `array`.
 */
function baseSortBy(array, comparer) {
  var length = array.length;

  array.sort(comparer);
  while (length--) {
    array[length] = array[length].value;
  }
  return array;
}

var _baseSortBy = baseSortBy;

/**
 * Compares values to sort them in ascending order.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {number} Returns the sort order indicator for `value`.
 */
function compareAscending(value, other) {
  if (value !== other) {
    var valIsDefined = value !== undefined,
        valIsNull = value === null,
        valIsReflexive = value === value,
        valIsSymbol = isSymbol_1(value);

    var othIsDefined = other !== undefined,
        othIsNull = other === null,
        othIsReflexive = other === other,
        othIsSymbol = isSymbol_1(other);

    if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
        (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
        (valIsNull && othIsDefined && othIsReflexive) ||
        (!valIsDefined && othIsReflexive) ||
        !valIsReflexive) {
      return 1;
    }
    if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
        (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
        (othIsNull && valIsDefined && valIsReflexive) ||
        (!othIsDefined && valIsReflexive) ||
        !othIsReflexive) {
      return -1;
    }
  }
  return 0;
}

var _compareAscending = compareAscending;

/**
 * Used by `_.orderBy` to compare multiple properties of a value to another
 * and stable sort them.
 *
 * If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
 * specify an order of "desc" for descending or "asc" for ascending sort order
 * of corresponding values.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {boolean[]|string[]} orders The order to sort by for each property.
 * @returns {number} Returns the sort order indicator for `object`.
 */
function compareMultiple(object, other, orders) {
  var index = -1,
      objCriteria = object.criteria,
      othCriteria = other.criteria,
      length = objCriteria.length,
      ordersLength = orders.length;

  while (++index < length) {
    var result = _compareAscending(objCriteria[index], othCriteria[index]);
    if (result) {
      if (index >= ordersLength) {
        return result;
      }
      var order = orders[index];
      return result * (order == 'desc' ? -1 : 1);
    }
  }
  // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
  // that causes it, under certain circumstances, to provide the same value for
  // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
  // for more details.
  //
  // This also ensures a stable sort in V8 and other engines.
  // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.
  return object.index - other.index;
}

var _compareMultiple = compareMultiple;

/**
 * The base implementation of `_.orderBy` without param guards.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
 * @param {string[]} orders The sort orders of `iteratees`.
 * @returns {Array} Returns the new sorted array.
 */
function baseOrderBy(collection, iteratees, orders) {
  if (iteratees.length) {
    iteratees = _arrayMap(iteratees, function(iteratee) {
      if (isArray_1(iteratee)) {
        return function(value) {
          return _baseGet(value, iteratee.length === 1 ? iteratee[0] : iteratee);
        };
      }
      return iteratee;
    });
  } else {
    iteratees = [identity_1];
  }

  var index = -1;
  iteratees = _arrayMap(iteratees, _baseUnary(_baseIteratee));

  var result = _baseMap(collection, function(value, key, collection) {
    var criteria = _arrayMap(iteratees, function(iteratee) {
      return iteratee(value);
    });
    return { 'criteria': criteria, 'index': ++index, 'value': value };
  });

  return _baseSortBy(result, function(object, other) {
    return _compareMultiple(object, other, orders);
  });
}

var _baseOrderBy = baseOrderBy;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

var _apply = apply;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return _apply(func, this, otherArgs);
  };
}

var _overRest = overRest;

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

var constant_1 = constant;

var defineProperty = (function() {
  try {
    var func = _getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

var _defineProperty = defineProperty;

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !_defineProperty ? identity_1 : function(func, string) {
  return _defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant_1(string),
    'writable': true
  });
};

var _baseSetToString = baseSetToString;

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

var _shortOut = shortOut;

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = _shortOut(_baseSetToString);

var _setToString = setToString;

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return _setToString(_overRest(func, start, identity_1), func + '');
}

var _baseRest = baseRest;

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject_1(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike_1(object) && _isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq_1(object[index], value);
  }
  return false;
}

var _isIterateeCall = isIterateeCall;

/**
 * Creates an array of elements, sorted in ascending order by the results of
 * running each element in a collection thru each iteratee. This method
 * performs a stable sort, that is, it preserves the original sort order of
 * equal elements. The iteratees are invoked with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {...(Function|Function[])} [iteratees=[_.identity]]
 *  The iteratees to sort by.
 * @returns {Array} Returns the new sorted array.
 * @example
 *
 * var users = [
 *   { 'user': 'fred',   'age': 48 },
 *   { 'user': 'barney', 'age': 36 },
 *   { 'user': 'fred',   'age': 30 },
 *   { 'user': 'barney', 'age': 34 }
 * ];
 *
 * _.sortBy(users, [function(o) { return o.user; }]);
 * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 30]]
 *
 * _.sortBy(users, ['user', 'age']);
 * // => objects for [['barney', 34], ['barney', 36], ['fred', 30], ['fred', 48]]
 */
var sortBy = _baseRest(function(collection, iteratees) {
  if (collection == null) {
    return [];
  }
  var length = iteratees.length;
  if (length > 1 && _isIterateeCall(collection, iteratees[0], iteratees[1])) {
    iteratees = [];
  } else if (length > 2 && _isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
    iteratees = [iteratees[0]];
  }
  return _baseOrderBy(collection, _baseFlatten(iteratees, 1), []);
});

var sortBy_1 = sortBy;

/**
 * Configuration for custom action validation rules.
 * Defines allowed positions, metadata IDs, data model IDs, and fields for each target
 * type.
 *
 */
const customActionValidationConfig = {
    [CustomActionTarget.LIVEBOARD]: {
        positions: [CustomActionsPosition.PRIMARY, CustomActionsPosition.MENU],
        allowedMetadataIds: ['liveboardIds'],
        allowedDataModelIds: [],
        allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds'],
    },
    [CustomActionTarget.VIZ]: {
        positions: [CustomActionsPosition.MENU, CustomActionsPosition.PRIMARY, CustomActionsPosition.CONTEXTMENU],
        allowedMetadataIds: ['liveboardIds', 'vizIds', 'answerIds'],
        allowedDataModelIds: ['modelIds', 'modelColumnNames'],
        allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds', 'dataModelIds'],
    },
    [CustomActionTarget.ANSWER]: {
        positions: [CustomActionsPosition.MENU, CustomActionsPosition.PRIMARY, CustomActionsPosition.CONTEXTMENU],
        allowedMetadataIds: ['answerIds'],
        allowedDataModelIds: ['modelIds', 'modelColumnNames'],
        allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds', 'dataModelIds'],
    },
    [CustomActionTarget.SPOTTER]: {
        positions: [CustomActionsPosition.MENU, CustomActionsPosition.CONTEXTMENU],
        allowedMetadataIds: [],
        allowedDataModelIds: ['modelIds'],
        allowedFields: ['name', 'id', 'position', 'target', 'orgIds', 'groupIds', 'dataModelIds'],
    },
};
/**
 * Validates a single custom action based on its target type
 * @param action - The custom action to validate
 * @param primaryActionsPerTarget - Map to track primary actions per target
 * @returns CustomActionValidation with isValid flag and reason string
 *
 * @hidden
 */
const validateCustomAction = (action, primaryActionsPerTarget) => {
    const { id: actionId, target: targetType, position, metadataIds, dataModelIds } = action;
    // Check if target type is supported
    if (!customActionValidationConfig[targetType]) {
        const errorMessage = CUSTOM_ACTIONS_ERROR_MESSAGE.UNSUPPORTED_TARGET(actionId, targetType);
        return { isValid: false, errors: [errorMessage] };
    }
    const config = customActionValidationConfig[targetType];
    const errors = [];
    // Validate position
    if (!arrayIncludesString(config.positions, position)) {
        const supportedPositions = config.positions.join(', ');
        errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_POSITION(position, targetType, supportedPositions));
    }
    // Validate metadata IDs
    if (metadataIds) {
        const invalidMetadataIds = Object.keys(metadataIds).filter((key) => !arrayIncludesString(config.allowedMetadataIds, key));
        if (invalidMetadataIds.length > 0) {
            const supportedMetadataIds = config.allowedMetadataIds.length > 0 ? config.allowedMetadataIds.join(', ') : 'none';
            errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_METADATA_IDS(targetType, invalidMetadataIds, supportedMetadataIds));
        }
    }
    // Validate data model IDs
    if (dataModelIds) {
        const invalidDataModelIds = Object.keys(dataModelIds).filter((key) => !arrayIncludesString(config.allowedDataModelIds, key));
        if (invalidDataModelIds.length > 0) {
            const supportedDataModelIds = config.allowedDataModelIds.length > 0 ? config.allowedDataModelIds.join(', ') : 'none';
            errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_DATA_MODEL_IDS(targetType, invalidDataModelIds, supportedDataModelIds));
        }
    }
    // Validate allowed fields
    const actionKeys = Object.keys(action);
    const invalidFields = actionKeys.filter((key) => !arrayIncludesString(config.allowedFields, key));
    if (invalidFields.length > 0) {
        const supportedFields = config.allowedFields.join(', ');
        errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_FIELDS(targetType, invalidFields, supportedFields));
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
/**
 * Validates basic action structure and required fields
 * @param action - The action to validate
 * @returns Object containing validation result and missing fields
 *
 * @hidden
 */
const validateActionStructure = (action) => {
    if (!action || typeof action !== 'object') {
        return { isValid: false, missingFields: [] };
    }
    // Check for all missing required fields
    const missingFields = ['id', 'name', 'target', 'position'].filter(field => !action[field]);
    return { isValid: missingFields.length === 0, missingFields };
};
/**
 * Checks for duplicate IDs among actions
 * @param actions - Array of actions to check
 * @returns Object containing filtered actions and duplicate errors
 *
 * @hidden
 */
const filterDuplicateIds = (actions) => {
    const idMap = actions.reduce((map, action) => {
        const list = map.get(action.id) || [];
        list.push(action);
        map.set(action.id, list);
        return map;
    }, new Map());
    const { actions: actionsWithUniqueIds, errors } = Array.from(idMap.entries()).reduce((acc, [id, actionsWithSameId]) => {
        if (actionsWithSameId.length === 1) {
            acc.actions.push(actionsWithSameId[0]);
        }
        else {
            // Keep the first action and add error for duplicates
            acc.actions.push(actionsWithSameId[0]);
            const duplicateNames = actionsWithSameId.slice(1).map(action => action.name);
            acc.errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.DUPLICATE_IDS(id, duplicateNames, actionsWithSameId[0].name));
        }
        return acc;
    }, { actions: [], errors: [] });
    return { actions: actionsWithUniqueIds, errors };
};
/**
 * Validates and processes custom actions
 * @param customActions - Array of custom actions to validate
 * @returns Object containing valid actions and any validation errors
 */
const getCustomActions = (customActions) => {
    const errors = [];
    if (!customActions || !Array.isArray(customActions)) {
        return { actions: [], errors: [] };
    }
    // Step 1: Handle invalid actions first (null, undefined, missing required
    // fields)
    const validActions = customActions.filter(action => {
        const validation = validateActionStructure(action);
        if (!validation.isValid) {
            if (!action || typeof action !== 'object') {
                errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_ACTION_OBJECT);
            }
            else {
                errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.MISSING_REQUIRED_FIELDS(action.id, validation.missingFields));
            }
            return false;
        }
        return true;
    });
    // Step 2: Check for duplicate IDs among valid actions
    const { actions: actionsWithUniqueIds, errors: duplicateErrors } = filterDuplicateIds(validActions);
    // Add duplicate errors to the errors array
    duplicateErrors.forEach(error => errors.push(error));
    // Step 3: Validate actions with unique IDs
    const finalValidActions = [];
    actionsWithUniqueIds.forEach((action) => {
        const { isValid, errors: validationErrors } = validateCustomAction(action);
        validationErrors.forEach(error => errors.push(error));
        if (isValid) {
            finalValidActions.push(action);
        }
    });
    // Step 4: Collect warnings for long custom action names
    const MAX_ACTION_NAME_LENGTH = 30;
    const warnings = finalValidActions
        .filter(action => action.name.length > MAX_ACTION_NAME_LENGTH)
        .map(action => `Custom action name '${action.name}' exceeds ${MAX_ACTION_NAME_LENGTH} characters. This may cause display or truncation issues in the UI.`);
    if (warnings.length > 0) {
        logger$3.warn(warnings);
    }
    const sortedActions = sortBy_1(finalValidActions, (a) => a.name.toLocaleLowerCase());
    return {
        actions: sortedActions,
        errors: errors,
    };
};

/**
 * Copyright (c) 2023
 *
 * Utilities related to reading configuration objects
 * @summary Config-related utils
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
const urlRegex = new RegExp([
    '(^(https?:)//)?',
    '(([^:/?#]*)(?::([0-9]+))?)',
    '(/{0,1}[^?#]*)',
    '(\\?[^#]*|)',
    '(#.*|)$', // hash
].join(''));
/**
 * Parse and construct the ThoughtSpot hostname or IP address
 * from the embed configuration object.
 * @param config
 */
const getThoughtSpotHost = (config) => {
    if (!config.thoughtSpotHost) {
        throw new Error(ERROR_MESSAGE.INVALID_THOUGHTSPOT_HOST);
    }
    const urlParts = config.thoughtSpotHost.match(urlRegex);
    if (!urlParts) {
        throw new Error(ERROR_MESSAGE.INVALID_THOUGHTSPOT_HOST);
    }
    const protocol = urlParts[2] || window.location.protocol;
    const host = urlParts[3];
    let path = urlParts[6];
    // Lose the trailing / if any
    if (path.charAt(path.length - 1) === '/') {
        path = path.substring(0, path.length - 1);
    }
    // const urlParams = urlParts[7];
    // const hash = urlParts[8];
    return `${protocol}//${host}${path}`;
};
const getV2BasePath = (config) => {
    if (config.basepath) {
        return config.basepath;
    }
    const tsHost = getThoughtSpotHost(config);
    // This is to handle when e2e's. Search is run on pods for
    // comp-blink-test-pipeline with baseUrl=https://localhost:8443.
    // This is to handle when the developer is developing in their local
    // environment.
    if (tsHost.includes('://localhost') && !tsHost.includes(':8443')) {
        return '';
    }
    return 'v2';
};
/**
 * It is a good idea to keep URLs under 2000 chars.
 * If this is ever breached, since we pass view configuration through
 * URL params, we would like to log a warning.
 * Reference: https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
 */
const URL_MAX_LENGTH = 2000;
/**
 * The default CSS dimensions of the embedded app
 */
const DEFAULT_EMBED_WIDTH = '100%';
const DEFAULT_EMBED_HEIGHT = '100%';

var Config = {
    DEBUG: false,
    LIB_VERSION: '2.47.0'
};

// since es6 imports are static and we run unit tests from the console, window won't be defined when importing this file
var window$1;
if (typeof(window) === 'undefined') {
    var loc = {
        hostname: ''
    };
    window$1 = {
        navigator: { userAgent: '' },
        document: {
            location: loc,
            referrer: ''
        },
        screen: { width: 0, height: 0 },
        location: loc
    };
} else {
    window$1 = window;
}

/*
 * Saved references to long variable names, so that closure compiler can
 * minimize file size.
 */

var ArrayProto = Array.prototype;
var FuncProto = Function.prototype;
var ObjProto = Object.prototype;
var slice = ArrayProto.slice;
var toString = ObjProto.toString;
var hasOwnProperty = ObjProto.hasOwnProperty;
var windowConsole = window$1.console;
var navigator = window$1.navigator;
var document$1 = window$1.document;
var windowOpera = window$1.opera;
var screen = window$1.screen;
var userAgent = navigator.userAgent;
var nativeBind = FuncProto.bind;
var nativeForEach = ArrayProto.forEach;
var nativeIndexOf = ArrayProto.indexOf;
var nativeMap = ArrayProto.map;
var nativeIsArray = Array.isArray;
var breaker = {};
var _ = {
    trim: function(str) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim#Polyfill
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    }
};

// Console override
var console$1 = {
    /** @type {function(...*)} */
    log: function() {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
            try {
                windowConsole.log.apply(windowConsole, arguments);
            } catch (err) {
                _.each(arguments, function(arg) {
                    windowConsole.log(arg);
                });
            }
        }
    },
    /** @type {function(...*)} */
    warn: function() {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
            var args = ['Mixpanel warning:'].concat(_.toArray(arguments));
            try {
                windowConsole.warn.apply(windowConsole, args);
            } catch (err) {
                _.each(args, function(arg) {
                    windowConsole.warn(arg);
                });
            }
        }
    },
    /** @type {function(...*)} */
    error: function() {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
            var args = ['Mixpanel error:'].concat(_.toArray(arguments));
            try {
                windowConsole.error.apply(windowConsole, args);
            } catch (err) {
                _.each(args, function(arg) {
                    windowConsole.error(arg);
                });
            }
        }
    },
    /** @type {function(...*)} */
    critical: function() {
        if (!_.isUndefined(windowConsole) && windowConsole) {
            var args = ['Mixpanel error:'].concat(_.toArray(arguments));
            try {
                windowConsole.error.apply(windowConsole, args);
            } catch (err) {
                _.each(args, function(arg) {
                    windowConsole.error(arg);
                });
            }
        }
    }
};

var log_func_with_prefix = function(func, prefix) {
    return function() {
        arguments[0] = '[' + prefix + '] ' + arguments[0];
        return func.apply(console$1, arguments);
    };
};
var console_with_prefix = function(prefix) {
    return {
        log: log_func_with_prefix(console$1.log, prefix),
        error: log_func_with_prefix(console$1.error, prefix),
        critical: log_func_with_prefix(console$1.critical, prefix)
    };
};


// UNDERSCORE
// Embed part of the Underscore Library
_.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) {
        return nativeBind.apply(func, slice.call(arguments, 1));
    }
    if (!_.isFunction(func)) {
        throw new TypeError();
    }
    args = slice.call(arguments, 2);
    bound = function() {
        if (!(this instanceof bound)) {
            return func.apply(context, args.concat(slice.call(arguments)));
        }
        var ctor = {};
        ctor.prototype = func.prototype;
        var self = new ctor();
        ctor.prototype = null;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) {
            return result;
        }
        return self;
    };
    return bound;
};

/**
 * @param {*=} obj
 * @param {function(...*)=} iterator
 * @param {Object=} context
 */
_.each = function(obj, iterator, context) {
    if (obj === null || obj === undefined) {
        return;
    }
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
            if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                return;
            }
        }
    } else {
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                if (iterator.call(context, obj[key], key, obj) === breaker) {
                    return;
                }
            }
        }
    }
};

_.extend = function(obj) {
    _.each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
            if (source[prop] !== void 0) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};

_.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
};

// from a comment on http://dbj.org/dbj/?p=286
// fails on only one very rare and deliberate custom object:
// var bomb = { toString : undefined, valueOf: function(o) { return "function BOMBA!"; }};
_.isFunction = function(f) {
    try {
        return /^\s*\bfunction\b/.test(f);
    } catch (x) {
        return false;
    }
};

_.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
};

_.toArray = function(iterable) {
    if (!iterable) {
        return [];
    }
    if (iterable.toArray) {
        return iterable.toArray();
    }
    if (_.isArray(iterable)) {
        return slice.call(iterable);
    }
    if (_.isArguments(iterable)) {
        return slice.call(iterable);
    }
    return _.values(iterable);
};

_.map = function(arr, callback, context) {
    if (nativeMap && arr.map === nativeMap) {
        return arr.map(callback, context);
    } else {
        var results = [];
        _.each(arr, function(item) {
            results.push(callback.call(context, item));
        });
        return results;
    }
};

_.keys = function(obj) {
    var results = [];
    if (obj === null) {
        return results;
    }
    _.each(obj, function(value, key) {
        results[results.length] = key;
    });
    return results;
};

_.values = function(obj) {
    var results = [];
    if (obj === null) {
        return results;
    }
    _.each(obj, function(value) {
        results[results.length] = value;
    });
    return results;
};

_.include = function(obj, target) {
    var found = false;
    if (obj === null) {
        return found;
    }
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
        return obj.indexOf(target) != -1;
    }
    _.each(obj, function(value) {
        if (found || (found = (value === target))) {
            return breaker;
        }
    });
    return found;
};

_.includes = function(str, needle) {
    return str.indexOf(needle) !== -1;
};

// Underscore Addons
_.inherit = function(subclass, superclass) {
    subclass.prototype = new superclass();
    subclass.prototype.constructor = subclass;
    subclass.superclass = superclass.prototype;
    return subclass;
};

_.isObject = function(obj) {
    return (obj === Object(obj) && !_.isArray(obj));
};

_.isEmptyObject = function(obj) {
    if (_.isObject(obj)) {
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    }
    return false;
};

_.isUndefined = function(obj) {
    return obj === void 0;
};

_.isString = function(obj) {
    return toString.call(obj) == '[object String]';
};

_.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
};

_.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
};

_.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
};

_.encodeDates = function(obj) {
    _.each(obj, function(v, k) {
        if (_.isDate(v)) {
            obj[k] = _.formatDate(v);
        } else if (_.isObject(v)) {
            obj[k] = _.encodeDates(v); // recurse
        }
    });
    return obj;
};

_.timestamp = function() {
    Date.now = Date.now || function() {
        return +new Date;
    };
    return Date.now();
};

_.formatDate = function(d) {
    // YYYY-MM-DDTHH:MM:SS in UTC
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' +
        pad(d.getUTCMonth() + 1) + '-' +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) + ':' +
        pad(d.getUTCMinutes()) + ':' +
        pad(d.getUTCSeconds());
};

_.strip_empty_properties = function(p) {
    var ret = {};
    _.each(p, function(v, k) {
        if (_.isString(v) && v.length > 0) {
            ret[k] = v;
        }
    });
    return ret;
};

/*
 * this function returns a copy of object after truncating it.  If
 * passed an Array or Object it will iterate through obj and
 * truncate all the values recursively.
 */
_.truncate = function(obj, length) {
    var ret;

    if (typeof(obj) === 'string') {
        ret = obj.slice(0, length);
    } else if (_.isArray(obj)) {
        ret = [];
        _.each(obj, function(val) {
            ret.push(_.truncate(val, length));
        });
    } else if (_.isObject(obj)) {
        ret = {};
        _.each(obj, function(val, key) {
            ret[key] = _.truncate(val, length);
        });
    } else {
        ret = obj;
    }

    return ret;
};

_.JSONEncode = (function() {
    return function(mixed_val) {
        var value = mixed_val;
        var quote = function(string) {
            var escapable = /[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; // eslint-disable-line no-control-regex
            var meta = { // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            };

            escapable.lastIndex = 0;
            return escapable.test(string) ?
                '"' + string.replace(escapable, function(a) {
                    var c = meta[a];
                    return typeof c === 'string' ? c :
                        '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                }) + '"' :
                '"' + string + '"';
        };

        var str = function(key, holder) {
            var gap = '';
            var indent = '    ';
            var i = 0; // The loop counter.
            var k = ''; // The member key.
            var v = ''; // The member value.
            var length = 0;
            var mind = gap;
            var partial = [];
            var value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.
            if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
                value = value.toJSON(key);
            }

            // What happens next depends on the value's type.
            switch (typeof value) {
                case 'string':
                    return quote(value);

                case 'number':
                    // JSON numbers must be finite. Encode non-finite numbers as null.
                    return isFinite(value) ? String(value) : 'null';

                case 'boolean':
                case 'null':
                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that this gets fixed someday.

                    return String(value);

                case 'object':
                    // If the type is 'object', we might be dealing with an object or an array or
                    // null.
                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.
                    if (!value) {
                        return 'null';
                    }

                    // Make an array to hold the partial results of stringifying this object value.
                    gap += indent;
                    partial = [];

                    // Is the value an array?
                    if (toString.apply(value) === '[object Array]') {
                        // The value is an array. Stringify every element. Use null as a placeholder
                        // for non-JSON values.

                        length = value.length;
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value) || 'null';
                        }

                        // Join all of the elements together, separated with commas, and wrap them in
                        // brackets.
                        v = partial.length === 0 ? '[]' :
                            gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                            mind + ']' :
                                '[' + partial.join(',') + ']';
                        gap = mind;
                        return v;
                    }

                    // Iterate through all of the keys in the object.
                    for (k in value) {
                        if (hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }

                    // Join all of the member texts together, separated with commas,
                    // and wrap them in braces.
                    v = partial.length === 0 ? '{}' :
                        gap ? '{' + partial.join(',') + '' +
                        mind + '}' : '{' + partial.join(',') + '}';
                    gap = mind;
                    return v;
            }
        };

        // Make a fake root object containing our value under the key of ''.
        // Return the result of stringifying the value.
        return str('', {
            '': value
        });
    };
})();

/**
 * From https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
 * Slightly modified to throw a real Error rather than a POJO
 */
_.JSONDecode = (function() {
    var at, // The index of the current character
        ch, // The current character
        escapee = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            'b': '\b',
            'f': '\f',
            'n': '\n',
            'r': '\r',
            't': '\t'
        },
        text,
        error = function(m) {
            var e = new SyntaxError(m);
            e.at = at;
            e.text = text;
            throw e;
        },
        next = function(c) {
            // If a c parameter is provided, verify that it matches the current character.
            if (c && c !== ch) {
                error('Expected \'' + c + '\' instead of \'' + ch + '\'');
            }
            // Get the next character. When there are no more characters,
            // return the empty string.
            ch = text.charAt(at);
            at += 1;
            return ch;
        },
        number = function() {
            // Parse a number value.
            var number,
                string = '';

            if (ch === '-') {
                string = '-';
                next('-');
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
            if (ch === '.') {
                string += '.';
                while (next() && ch >= '0' && ch <= '9') {
                    string += ch;
                }
            }
            if (ch === 'e' || ch === 'E') {
                string += ch;
                next();
                if (ch === '-' || ch === '+') {
                    string += ch;
                    next();
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
            }
            number = +string;
            if (!isFinite(number)) {
                error('Bad number');
            } else {
                return number;
            }
        },

        string = function() {
            // Parse a string value.
            var hex,
                i,
                string = '',
                uffff;
            // When parsing for string values, we must look for " and \ characters.
            if (ch === '"') {
                while (next()) {
                    if (ch === '"') {
                        next();
                        return string;
                    }
                    if (ch === '\\') {
                        next();
                        if (ch === 'u') {
                            uffff = 0;
                            for (i = 0; i < 4; i += 1) {
                                hex = parseInt(next(), 16);
                                if (!isFinite(hex)) {
                                    break;
                                }
                                uffff = uffff * 16 + hex;
                            }
                            string += String.fromCharCode(uffff);
                        } else if (typeof escapee[ch] === 'string') {
                            string += escapee[ch];
                        } else {
                            break;
                        }
                    } else {
                        string += ch;
                    }
                }
            }
            error('Bad string');
        },
        white = function() {
            // Skip whitespace.
            while (ch && ch <= ' ') {
                next();
            }
        },
        word = function() {
            // true, false, or null.
            switch (ch) {
                case 't':
                    next('t');
                    next('r');
                    next('u');
                    next('e');
                    return true;
                case 'f':
                    next('f');
                    next('a');
                    next('l');
                    next('s');
                    next('e');
                    return false;
                case 'n':
                    next('n');
                    next('u');
                    next('l');
                    next('l');
                    return null;
            }
            error('Unexpected "' + ch + '"');
        },
        value, // Placeholder for the value function.
        array = function() {
            // Parse an array value.
            var array = [];

            if (ch === '[') {
                next('[');
                white();
                if (ch === ']') {
                    next(']');
                    return array; // empty array
                }
                while (ch) {
                    array.push(value());
                    white();
                    if (ch === ']') {
                        next(']');
                        return array;
                    }
                    next(',');
                    white();
                }
            }
            error('Bad array');
        },
        object = function() {
            // Parse an object value.
            var key,
                object = {};

            if (ch === '{') {
                next('{');
                white();
                if (ch === '}') {
                    next('}');
                    return object; // empty object
                }
                while (ch) {
                    key = string();
                    white();
                    next(':');
                    if (Object.hasOwnProperty.call(object, key)) {
                        error('Duplicate key "' + key + '"');
                    }
                    object[key] = value();
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;
                    }
                    next(',');
                    white();
                }
            }
            error('Bad object');
        };

    value = function() {
        // Parse a JSON value. It could be an object, an array, a string,
        // a number, or a word.
        white();
        switch (ch) {
            case '{':
                return object();
            case '[':
                return array();
            case '"':
                return string();
            case '-':
                return number();
            default:
                return ch >= '0' && ch <= '9' ? number() : word();
        }
    };

    // Return the json_parse function. It will have access to all of the
    // above functions and variables.
    return function(source) {
        var result;

        text = source;
        at = 0;
        ch = ' ';
        result = value();
        white();
        if (ch) {
            error('Syntax error');
        }

        return result;
    };
})();

_.base64Encode = function(data) {
    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = '',
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data = _.utf8Encode(data);

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
            break;
        case 2:
            enc = enc.slice(0, -1) + '=';
            break;
    }

    return enc;
};

_.utf8Encode = function(string) {
    string = (string + '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    var utftext = '',
        start,
        end;
    var stringl = 0,
        n;

    start = end = 0;
    stringl = string.length;

    for (n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
            end++;
        } else if ((c1 > 127) && (c1 < 2048)) {
            enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
        } else {
            enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.substring(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }

    if (end > start) {
        utftext += string.substring(start, string.length);
    }

    return utftext;
};

_.UUID = (function() {

    // Time-based entropy
    var T = function() {
        var time = 1 * new Date(); // cross-browser version of Date.now()
        var ticks;
        if (window$1.performance && window$1.performance.now) {
            ticks = window$1.performance.now();
        } else {
            // fall back to busy loop
            ticks = 0;

            // this while loop figures how many browser ticks go by
            // before 1*new Date() returns a new number, ie the amount
            // of ticks that go by per millisecond
            while (time == 1 * new Date()) {
                ticks++;
            }
        }
        return time.toString(16) + Math.floor(ticks).toString(16);
    };

    // Math.Random entropy
    var R = function() {
        return Math.random().toString(16).replace('.', '');
    };

    // User agent entropy
    // This function takes the user agent string, and then xors
    // together each sequence of 8 bytes.  This produces a final
    // sequence of 8 bytes which it returns as hex.
    var UA = function() {
        var ua = userAgent,
            i, ch, buffer = [],
            ret = 0;

        function xor(result, byte_array) {
            var j, tmp = 0;
            for (j = 0; j < byte_array.length; j++) {
                tmp |= (buffer[j] << j * 8);
            }
            return result ^ tmp;
        }

        for (i = 0; i < ua.length; i++) {
            ch = ua.charCodeAt(i);
            buffer.unshift(ch & 0xFF);
            if (buffer.length >= 4) {
                ret = xor(ret, buffer);
                buffer = [];
            }
        }

        if (buffer.length > 0) {
            ret = xor(ret, buffer);
        }

        return ret.toString(16);
    };

    return function() {
        var se = (screen.height * screen.width).toString(16);
        return (T() + '-' + R() + '-' + UA() + '-' + se + '-' + T());
    };
})();

// _.isBlockedUA()
// This is to block various web spiders from executing our JS and
// sending false tracking data
var BLOCKED_UA_STRS = [
    'ahrefsbot',
    'baiduspider',
    'bingbot',
    'bingpreview',
    'facebookexternal',
    'petalbot',
    'pinterest',
    'screaming frog',
    'yahoo! slurp',
    'yandexbot',

    // a whole bunch of goog-specific crawlers
    // https://developers.google.com/search/docs/advanced/crawling/overview-google-crawlers
    'adsbot-google',
    'apis-google',
    'duplexweb-google',
    'feedfetcher-google',
    'google favicon',
    'google web preview',
    'google-read-aloud',
    'googlebot',
    'googleweblight',
    'mediapartners-google',
    'storebot-google'
];
_.isBlockedUA = function(ua) {
    var i;
    ua = ua.toLowerCase();
    for (i = 0; i < BLOCKED_UA_STRS.length; i++) {
        if (ua.indexOf(BLOCKED_UA_STRS[i]) !== -1) {
            return true;
        }
    }
    return false;
};

/**
 * @param {Object=} formdata
 * @param {string=} arg_separator
 */
_.HTTPBuildQuery = function(formdata, arg_separator) {
    var use_val, use_key, tmp_arr = [];

    if (_.isUndefined(arg_separator)) {
        arg_separator = '&';
    }

    _.each(formdata, function(val, key) {
        use_val = encodeURIComponent(val.toString());
        use_key = encodeURIComponent(key);
        tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
    });

    return tmp_arr.join(arg_separator);
};

_.getQueryParam = function(url, param) {
    // Expects a raw URL

    param = param.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    var regexS = '[\\?&]' + param + '=([^&#]*)',
        regex = new RegExp(regexS),
        results = regex.exec(url);
    if (results === null || (results && typeof(results[1]) !== 'string' && results[1].length)) {
        return '';
    } else {
        var result = results[1];
        try {
            result = decodeURIComponent(result);
        } catch(err) {
            console$1.error('Skipping decoding for malformed query param: ' + result);
        }
        return result.replace(/\+/g, ' ');
    }
};


// _.cookie
// Methods partially borrowed from quirksmode.org/js/cookies.html
_.cookie = {
    get: function(name) {
        var nameEQ = name + '=';
        var ca = document$1.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    },

    parse: function(name) {
        var cookie;
        try {
            cookie = _.JSONDecode(_.cookie.get(name)) || {};
        } catch (err) {
            // noop
        }
        return cookie;
    },

    set_seconds: function(name, value, seconds, is_cross_subdomain, is_secure, is_cross_site, domain_override) {
        var cdomain = '',
            expires = '',
            secure = '';

        if (domain_override) {
            cdomain = '; domain=' + domain_override;
        } else if (is_cross_subdomain) {
            var domain = extract_domain(document$1.location.hostname);
            cdomain = domain ? '; domain=.' + domain : '';
        }

        if (seconds) {
            var date = new Date();
            date.setTime(date.getTime() + (seconds * 1000));
            expires = '; expires=' + date.toGMTString();
        }

        if (is_cross_site) {
            is_secure = true;
            secure = '; SameSite=None';
        }
        if (is_secure) {
            secure += '; secure';
        }

        document$1.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
    },

    set: function(name, value, days, is_cross_subdomain, is_secure, is_cross_site, domain_override) {
        var cdomain = '', expires = '', secure = '';

        if (domain_override) {
            cdomain = '; domain=' + domain_override;
        } else if (is_cross_subdomain) {
            var domain = extract_domain(document$1.location.hostname);
            cdomain = domain ? '; domain=.' + domain : '';
        }

        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toGMTString();
        }

        if (is_cross_site) {
            is_secure = true;
            secure = '; SameSite=None';
        }
        if (is_secure) {
            secure += '; secure';
        }

        var new_cookie_val = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
        document$1.cookie = new_cookie_val;
        return new_cookie_val;
    },

    remove: function(name, is_cross_subdomain, domain_override) {
        _.cookie.set(name, '', -1, is_cross_subdomain, false, false, domain_override);
    }
};

var _localStorageSupported = null;
var localStorageSupported = function(storage, forceCheck) {
    if (_localStorageSupported !== null && !forceCheck) {
        return _localStorageSupported;
    }

    var supported = true;
    try {
        storage = storage || window.localStorage;
        var key = '__mplss_' + cheap_guid(8),
            val = 'xyz';
        storage.setItem(key, val);
        if (storage.getItem(key) !== val) {
            supported = false;
        }
        storage.removeItem(key);
    } catch (err) {
        supported = false;
    }

    _localStorageSupported = supported;
    return supported;
};

// _.localStorage
_.localStorage = {
    is_supported: function(force_check) {
        var supported = localStorageSupported(null, force_check);
        if (!supported) {
            console$1.error('localStorage unsupported; falling back to cookie store');
        }
        return supported;
    },

    error: function(msg) {
        console$1.error('localStorage error: ' + msg);
    },

    get: function(name) {
        try {
            return window.localStorage.getItem(name);
        } catch (err) {
            _.localStorage.error(err);
        }
        return null;
    },

    parse: function(name) {
        try {
            return _.JSONDecode(_.localStorage.get(name)) || {};
        } catch (err) {
            // noop
        }
        return null;
    },

    set: function(name, value) {
        try {
            window.localStorage.setItem(name, value);
        } catch (err) {
            _.localStorage.error(err);
        }
    },

    remove: function(name) {
        try {
            window.localStorage.removeItem(name);
        } catch (err) {
            _.localStorage.error(err);
        }
    }
};

_.register_event = (function() {
    // written by Dean Edwards, 2005
    // with input from Tino Zijdel - crisp@xs4all.nl
    // with input from Carl Sverre - mail@carlsverre.com
    // with input from Mixpanel
    // http://dean.edwards.name/weblog/2005/10/add-event/
    // https://gist.github.com/1930440

    /**
     * @param {Object} element
     * @param {string} type
     * @param {function(...*)} handler
     * @param {boolean=} oldSchool
     * @param {boolean=} useCapture
     */
    var register_event = function(element, type, handler, oldSchool, useCapture) {
        if (!element) {
            console$1.error('No valid element provided to register_event');
            return;
        }

        if (element.addEventListener && !oldSchool) {
            element.addEventListener(type, handler, !!useCapture);
        } else {
            var ontype = 'on' + type;
            var old_handler = element[ontype]; // can be undefined
            element[ontype] = makeHandler(element, handler, old_handler);
        }
    };

    function makeHandler(element, new_handler, old_handlers) {
        var handler = function(event) {
            event = event || fixEvent(window.event);

            // this basically happens in firefox whenever another script
            // overwrites the onload callback and doesn't pass the event
            // object to previously defined callbacks.  All the browsers
            // that don't define window.event implement addEventListener
            // so the dom_loaded handler will still be fired as usual.
            if (!event) {
                return undefined;
            }

            var ret = true;
            var old_result, new_result;

            if (_.isFunction(old_handlers)) {
                old_result = old_handlers(event);
            }
            new_result = new_handler.call(element, event);

            if ((false === old_result) || (false === new_result)) {
                ret = false;
            }

            return ret;
        };

        return handler;
    }

    function fixEvent(event) {
        if (event) {
            event.preventDefault = fixEvent.preventDefault;
            event.stopPropagation = fixEvent.stopPropagation;
        }
        return event;
    }
    fixEvent.preventDefault = function() {
        this.returnValue = false;
    };
    fixEvent.stopPropagation = function() {
        this.cancelBubble = true;
    };

    return register_event;
})();


var TOKEN_MATCH_REGEX = new RegExp('^(\\w*)\\[(\\w+)([=~\\|\\^\\$\\*]?)=?"?([^\\]"]*)"?\\]$');

_.dom_query = (function() {
    /* document.getElementsBySelector(selector)
    - returns an array of element objects from the current document
    matching the CSS selector. Selectors can contain element names,
    class names and ids and can be nested. For example:

    elements = document.getElementsBySelector('div#main p a.external')

    Will return an array of all 'a' elements with 'external' in their
    class attribute that are contained inside 'p' elements that are
    contained inside the 'div' element which has id="main"

    New in version 0.4: Support for CSS2 and CSS3 attribute selectors:
    See http://www.w3.org/TR/css3-selectors/#attribute-selectors

    Version 0.4 - Simon Willison, March 25th 2003
    -- Works in Phoenix 0.5, Mozilla 1.3, Opera 7, Internet Explorer 6, Internet Explorer 5 on Windows
    -- Opera 7 fails

    Version 0.5 - Carl Sverre, Jan 7th 2013
    -- Now uses jQuery-esque `hasClass` for testing class name
    equality.  This fixes a bug related to '-' characters being
    considered not part of a 'word' in regex.
    */

    function getAllChildren(e) {
        // Returns all children of element. Workaround required for IE5/Windows. Ugh.
        return e.all ? e.all : e.getElementsByTagName('*');
    }

    var bad_whitespace = /[\t\r\n]/g;

    function hasClass(elem, selector) {
        var className = ' ' + selector + ' ';
        return ((' ' + elem.className + ' ').replace(bad_whitespace, ' ').indexOf(className) >= 0);
    }

    function getElementsBySelector(selector) {
        // Attempt to fail gracefully in lesser browsers
        if (!document$1.getElementsByTagName) {
            return [];
        }
        // Split selector in to tokens
        var tokens = selector.split(' ');
        var token, bits, tagName, found, foundCount, i, j, k, elements, currentContextIndex;
        var currentContext = [document$1];
        for (i = 0; i < tokens.length; i++) {
            token = tokens[i].replace(/^\s+/, '').replace(/\s+$/, '');
            if (token.indexOf('#') > -1) {
                // Token is an ID selector
                bits = token.split('#');
                tagName = bits[0];
                var id = bits[1];
                var element = document$1.getElementById(id);
                if (!element || (tagName && element.nodeName.toLowerCase() != tagName)) {
                    // element not found or tag with that ID not found, return false
                    return [];
                }
                // Set currentContext to contain just this element
                currentContext = [element];
                continue; // Skip to next token
            }
            if (token.indexOf('.') > -1) {
                // Token contains a class selector
                bits = token.split('.');
                tagName = bits[0];
                var className = bits[1];
                if (!tagName) {
                    tagName = '*';
                }
                // Get elements matching tag, filter them for class selector
                found = [];
                foundCount = 0;
                for (j = 0; j < currentContext.length; j++) {
                    if (tagName == '*') {
                        elements = getAllChildren(currentContext[j]);
                    } else {
                        elements = currentContext[j].getElementsByTagName(tagName);
                    }
                    for (k = 0; k < elements.length; k++) {
                        found[foundCount++] = elements[k];
                    }
                }
                currentContext = [];
                currentContextIndex = 0;
                for (j = 0; j < found.length; j++) {
                    if (found[j].className &&
                        _.isString(found[j].className) && // some SVG elements have classNames which are not strings
                        hasClass(found[j], className)
                    ) {
                        currentContext[currentContextIndex++] = found[j];
                    }
                }
                continue; // Skip to next token
            }
            // Code to deal with attribute selectors
            var token_match = token.match(TOKEN_MATCH_REGEX);
            if (token_match) {
                tagName = token_match[1];
                var attrName = token_match[2];
                var attrOperator = token_match[3];
                var attrValue = token_match[4];
                if (!tagName) {
                    tagName = '*';
                }
                // Grab all of the tagName elements within current context
                found = [];
                foundCount = 0;
                for (j = 0; j < currentContext.length; j++) {
                    if (tagName == '*') {
                        elements = getAllChildren(currentContext[j]);
                    } else {
                        elements = currentContext[j].getElementsByTagName(tagName);
                    }
                    for (k = 0; k < elements.length; k++) {
                        found[foundCount++] = elements[k];
                    }
                }
                currentContext = [];
                currentContextIndex = 0;
                var checkFunction; // This function will be used to filter the elements
                switch (attrOperator) {
                    case '=': // Equality
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName) == attrValue);
                        };
                        break;
                    case '~': // Match one of space seperated words
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).match(new RegExp('\\b' + attrValue + '\\b')));
                        };
                        break;
                    case '|': // Match start with value followed by optional hyphen
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).match(new RegExp('^' + attrValue + '-?')));
                        };
                        break;
                    case '^': // Match starts with value
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).indexOf(attrValue) === 0);
                        };
                        break;
                    case '$': // Match ends with value - fails with "Warning" in Opera 7
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length);
                        };
                        break;
                    case '*': // Match ends with value
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).indexOf(attrValue) > -1);
                        };
                        break;
                    default:
                        // Just test for existence of attribute
                        checkFunction = function(e) {
                            return e.getAttribute(attrName);
                        };
                }
                currentContext = [];
                currentContextIndex = 0;
                for (j = 0; j < found.length; j++) {
                    if (checkFunction(found[j])) {
                        currentContext[currentContextIndex++] = found[j];
                    }
                }
                // alert('Attribute Selector: '+tagName+' '+attrName+' '+attrOperator+' '+attrValue);
                continue; // Skip to next token
            }
            // If we get here, token is JUST an element (not a class or ID selector)
            tagName = token;
            found = [];
            foundCount = 0;
            for (j = 0; j < currentContext.length; j++) {
                elements = currentContext[j].getElementsByTagName(tagName);
                for (k = 0; k < elements.length; k++) {
                    found[foundCount++] = elements[k];
                }
            }
            currentContext = found;
        }
        return currentContext;
    }

    return function(query) {
        if (_.isElement(query)) {
            return [query];
        } else if (_.isObject(query) && !_.isUndefined(query.length)) {
            return query;
        } else {
            return getElementsBySelector.call(this, query);
        }
    };
})();

var CAMPAIGN_KEYWORDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
var CLICK_IDS = ['dclid', 'fbclid', 'gclid', 'ko_click_id', 'li_fat_id', 'msclkid', 'ttclid', 'twclid', 'wbraid'];

_.info = {
    campaignParams: function(default_value) {
        var kw = '',
            params = {};
        _.each(CAMPAIGN_KEYWORDS, function(kwkey) {
            kw = _.getQueryParam(document$1.URL, kwkey);
            if (kw.length) {
                params[kwkey] = kw;
            } else if (default_value !== undefined) {
                params[kwkey] = default_value;
            }
        });

        return params;
    },

    clickParams: function() {
        var id = '',
            params = {};
        _.each(CLICK_IDS, function(idkey) {
            id = _.getQueryParam(document$1.URL, idkey);
            if (id.length) {
                params[idkey] = id;
            }
        });

        return params;
    },

    marketingParams: function() {
        return _.extend(_.info.campaignParams(), _.info.clickParams());
    },

    searchEngine: function(referrer) {
        if (referrer.search('https?://(.*)google.([^/?]*)') === 0) {
            return 'google';
        } else if (referrer.search('https?://(.*)bing.com') === 0) {
            return 'bing';
        } else if (referrer.search('https?://(.*)yahoo.com') === 0) {
            return 'yahoo';
        } else if (referrer.search('https?://(.*)duckduckgo.com') === 0) {
            return 'duckduckgo';
        } else {
            return null;
        }
    },

    searchInfo: function(referrer) {
        var search = _.info.searchEngine(referrer),
            param = (search != 'yahoo') ? 'q' : 'p',
            ret = {};

        if (search !== null) {
            ret['$search_engine'] = search;

            var keyword = _.getQueryParam(referrer, param);
            if (keyword.length) {
                ret['mp_keyword'] = keyword;
            }
        }

        return ret;
    },

    /**
     * This function detects which browser is running this script.
     * The order of the checks are important since many user agents
     * include key words used in later checks.
     */
    browser: function(user_agent, vendor, opera) {
        vendor = vendor || ''; // vendor is undefined for at least IE9
        if (opera || _.includes(user_agent, ' OPR/')) {
            if (_.includes(user_agent, 'Mini')) {
                return 'Opera Mini';
            }
            return 'Opera';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
            return 'BlackBerry';
        } else if (_.includes(user_agent, 'IEMobile') || _.includes(user_agent, 'WPDesktop')) {
            return 'Internet Explorer Mobile';
        } else if (_.includes(user_agent, 'SamsungBrowser/')) {
            // https://developer.samsung.com/internet/user-agent-string-format
            return 'Samsung Internet';
        } else if (_.includes(user_agent, 'Edge') || _.includes(user_agent, 'Edg/')) {
            return 'Microsoft Edge';
        } else if (_.includes(user_agent, 'FBIOS')) {
            return 'Facebook Mobile';
        } else if (_.includes(user_agent, 'Chrome')) {
            return 'Chrome';
        } else if (_.includes(user_agent, 'CriOS')) {
            return 'Chrome iOS';
        } else if (_.includes(user_agent, 'UCWEB') || _.includes(user_agent, 'UCBrowser')) {
            return 'UC Browser';
        } else if (_.includes(user_agent, 'FxiOS')) {
            return 'Firefox iOS';
        } else if (_.includes(vendor, 'Apple')) {
            if (_.includes(user_agent, 'Mobile')) {
                return 'Mobile Safari';
            }
            return 'Safari';
        } else if (_.includes(user_agent, 'Android')) {
            return 'Android Mobile';
        } else if (_.includes(user_agent, 'Konqueror')) {
            return 'Konqueror';
        } else if (_.includes(user_agent, 'Firefox')) {
            return 'Firefox';
        } else if (_.includes(user_agent, 'MSIE') || _.includes(user_agent, 'Trident/')) {
            return 'Internet Explorer';
        } else if (_.includes(user_agent, 'Gecko')) {
            return 'Mozilla';
        } else {
            return '';
        }
    },

    /**
     * This function detects which browser version is running this script,
     * parsing major and minor version (e.g., 42.1). User agent strings from:
     * http://www.useragentstring.com/pages/useragentstring.php
     */
    browserVersion: function(userAgent, vendor, opera) {
        var browser = _.info.browser(userAgent, vendor, opera);
        var versionRegexs = {
            'Internet Explorer Mobile': /rv:(\d+(\.\d+)?)/,
            'Microsoft Edge': /Edge?\/(\d+(\.\d+)?)/,
            'Chrome': /Chrome\/(\d+(\.\d+)?)/,
            'Chrome iOS': /CriOS\/(\d+(\.\d+)?)/,
            'UC Browser' : /(UCBrowser|UCWEB)\/(\d+(\.\d+)?)/,
            'Safari': /Version\/(\d+(\.\d+)?)/,
            'Mobile Safari': /Version\/(\d+(\.\d+)?)/,
            'Opera': /(Opera|OPR)\/(\d+(\.\d+)?)/,
            'Firefox': /Firefox\/(\d+(\.\d+)?)/,
            'Firefox iOS': /FxiOS\/(\d+(\.\d+)?)/,
            'Konqueror': /Konqueror:(\d+(\.\d+)?)/,
            'BlackBerry': /BlackBerry (\d+(\.\d+)?)/,
            'Android Mobile': /android\s(\d+(\.\d+)?)/,
            'Samsung Internet': /SamsungBrowser\/(\d+(\.\d+)?)/,
            'Internet Explorer': /(rv:|MSIE )(\d+(\.\d+)?)/,
            'Mozilla': /rv:(\d+(\.\d+)?)/
        };
        var regex = versionRegexs[browser];
        if (regex === undefined) {
            return null;
        }
        var matches = userAgent.match(regex);
        if (!matches) {
            return null;
        }
        return parseFloat(matches[matches.length - 2]);
    },

    os: function() {
        var a = userAgent;
        if (/Windows/i.test(a)) {
            if (/Phone/.test(a) || /WPDesktop/.test(a)) {
                return 'Windows Phone';
            }
            return 'Windows';
        } else if (/(iPhone|iPad|iPod)/.test(a)) {
            return 'iOS';
        } else if (/Android/.test(a)) {
            return 'Android';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
            return 'BlackBerry';
        } else if (/Mac/i.test(a)) {
            return 'Mac OS X';
        } else if (/Linux/.test(a)) {
            return 'Linux';
        } else if (/CrOS/.test(a)) {
            return 'Chrome OS';
        } else {
            return '';
        }
    },

    device: function(user_agent) {
        if (/Windows Phone/i.test(user_agent) || /WPDesktop/.test(user_agent)) {
            return 'Windows Phone';
        } else if (/iPad/.test(user_agent)) {
            return 'iPad';
        } else if (/iPod/.test(user_agent)) {
            return 'iPod Touch';
        } else if (/iPhone/.test(user_agent)) {
            return 'iPhone';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
            return 'BlackBerry';
        } else if (/Android/.test(user_agent)) {
            return 'Android';
        } else {
            return '';
        }
    },

    referringDomain: function(referrer) {
        var split = referrer.split('/');
        if (split.length >= 3) {
            return split[2];
        }
        return '';
    },

    properties: function() {
        return _.extend(_.strip_empty_properties({
            '$os': _.info.os(),
            '$browser': _.info.browser(userAgent, navigator.vendor, windowOpera),
            '$referrer': document$1.referrer,
            '$referring_domain': _.info.referringDomain(document$1.referrer),
            '$device': _.info.device(userAgent)
        }), {
            '$current_url': window$1.location.href,
            '$browser_version': _.info.browserVersion(userAgent, navigator.vendor, windowOpera),
            '$screen_height': screen.height,
            '$screen_width': screen.width,
            'mp_lib': 'web',
            '$lib_version': Config.LIB_VERSION,
            '$insert_id': cheap_guid(),
            'time': _.timestamp() / 1000 // epoch time in seconds
        });
    },

    people_properties: function() {
        return _.extend(_.strip_empty_properties({
            '$os': _.info.os(),
            '$browser': _.info.browser(userAgent, navigator.vendor, windowOpera)
        }), {
            '$browser_version': _.info.browserVersion(userAgent, navigator.vendor, windowOpera)
        });
    },

    mpPageViewProperties: function() {
        return _.strip_empty_properties({
            'current_page_title': document$1.title,
            'current_domain': window$1.location.hostname,
            'current_url_path': window$1.location.pathname,
            'current_url_protocol': window$1.location.protocol,
            'current_url_search': window$1.location.search
        });
    }
};

var cheap_guid = function(maxlen) {
    var guid = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    return maxlen ? guid.substring(0, maxlen) : guid;
};

// naive way to extract domain name (example.com) from full hostname (my.sub.example.com)
var SIMPLE_DOMAIN_MATCH_REGEX = /[a-z0-9][a-z0-9-]*\.[a-z]+$/i;
// this next one attempts to account for some ccSLDs, e.g. extracting oxford.ac.uk from www.oxford.ac.uk
var DOMAIN_MATCH_REGEX = /[a-z0-9][a-z0-9-]+\.[a-z.]{2,6}$/i;
/**
 * Attempts to extract main domain name from full hostname, using a few blunt heuristics. For
 * common TLDs like .com/.org that always have a simple SLD.TLD structure (example.com), we
 * simply extract the last two .-separated parts of the hostname (SIMPLE_DOMAIN_MATCH_REGEX).
 * For others, we attempt to account for short ccSLD+TLD combos (.ac.uk) with the legacy
 * DOMAIN_MATCH_REGEX (kept to maintain backwards compatibility with existing Mixpanel
 * integrations). The only _reliable_ way to extract domain from hostname is with an up-to-date
 * list like at https://publicsuffix.org/ so for cases that this helper fails at, the SDK
 * offers the 'cookie_domain' config option to set it explicitly.
 * @example
 * extract_domain('my.sub.example.com')
 * // 'example.com'
 */
var extract_domain = function(hostname) {
    var domain_regex = DOMAIN_MATCH_REGEX;
    var parts = hostname.split('.');
    var tld = parts[parts.length - 1];
    if (tld.length > 4 || tld === 'com' || tld === 'org') {
        domain_regex = SIMPLE_DOMAIN_MATCH_REGEX;
    }
    var matches = hostname.match(domain_regex);
    return matches ? matches[0] : '';
};

var JSONStringify = null;
var JSONParse = null;
if (typeof JSON !== 'undefined') {
    JSONStringify = JSON.stringify;
    JSONParse = JSON.parse;
}
JSONStringify = JSONStringify || _.JSONEncode;
JSONParse = JSONParse || _.JSONDecode;

// EXPORTS (for closure compiler)
_['toArray']                = _.toArray;
_['isObject']               = _.isObject;
_['JSONEncode']             = _.JSONEncode;
_['JSONDecode']             = _.JSONDecode;
_['isBlockedUA']            = _.isBlockedUA;
_['isEmptyObject']          = _.isEmptyObject;
_['info']                   = _.info;
_['info']['device']         = _.info.device;
_['info']['browser']        = _.info.browser;
_['info']['browserVersion'] = _.info.browserVersion;
_['info']['properties']     = _.info.properties;

/**
 * DomTracker Object
 * @constructor
 */
var DomTracker = function() {};


// interface
DomTracker.prototype.create_properties = function() {};
DomTracker.prototype.event_handler = function() {};
DomTracker.prototype.after_track_handler = function() {};

DomTracker.prototype.init = function(mixpanel_instance) {
    this.mp = mixpanel_instance;
    return this;
};

/**
 * @param {Object|string} query
 * @param {string} event_name
 * @param {Object=} properties
 * @param {function=} user_callback
 */
DomTracker.prototype.track = function(query, event_name, properties, user_callback) {
    var that = this;
    var elements = _.dom_query(query);

    if (elements.length === 0) {
        console$1.error('The DOM query (' + query + ') returned 0 elements');
        return;
    }

    _.each(elements, function(element) {
        _.register_event(element, this.override_event, function(e) {
            var options = {};
            var props = that.create_properties(properties, this);
            var timeout = that.mp.get_config('track_links_timeout');

            that.event_handler(e, this, options);

            // in case the mixpanel servers don't get back to us in time
            window.setTimeout(that.track_callback(user_callback, props, options, true), timeout);

            // fire the tracking event
            that.mp.track(event_name, props, that.track_callback(user_callback, props, options));
        });
    }, this);

    return true;
};

/**
 * @param {function} user_callback
 * @param {Object} props
 * @param {boolean=} timeout_occured
 */
DomTracker.prototype.track_callback = function(user_callback, props, options, timeout_occured) {
    timeout_occured = timeout_occured || false;
    var that = this;

    return function() {
        // options is referenced from both callbacks, so we can have
        // a 'lock' of sorts to ensure only one fires
        if (options.callback_fired) { return; }
        options.callback_fired = true;

        if (user_callback && user_callback(timeout_occured, props) === false) {
            // user can prevent the default functionality by
            // returning false from their callback
            return;
        }

        that.after_track_handler(props, options, timeout_occured);
    };
};

DomTracker.prototype.create_properties = function(properties, element) {
    var props;

    if (typeof(properties) === 'function') {
        props = properties(element);
    } else {
        props = _.extend({}, properties);
    }

    return props;
};

/**
 * LinkTracker Object
 * @constructor
 * @extends DomTracker
 */
var LinkTracker = function() {
    this.override_event = 'click';
};
_.inherit(LinkTracker, DomTracker);

LinkTracker.prototype.create_properties = function(properties, element) {
    var props = LinkTracker.superclass.create_properties.apply(this, arguments);

    if (element.href) { props['url'] = element.href; }

    return props;
};

LinkTracker.prototype.event_handler = function(evt, element, options) {
    options.new_tab = (
        evt.which === 2 ||
        evt.metaKey ||
        evt.ctrlKey ||
        element.target === '_blank'
    );
    options.href = element.href;

    if (!options.new_tab) {
        evt.preventDefault();
    }
};

LinkTracker.prototype.after_track_handler = function(props, options) {
    if (options.new_tab) { return; }

    setTimeout(function() {
        window.location = options.href;
    }, 0);
};

/**
 * FormTracker Object
 * @constructor
 * @extends DomTracker
 */
var FormTracker = function() {
    this.override_event = 'submit';
};
_.inherit(FormTracker, DomTracker);

FormTracker.prototype.event_handler = function(evt, element, options) {
    options.element = element;
    evt.preventDefault();
};

FormTracker.prototype.after_track_handler = function(props, options) {
    setTimeout(function() {
        options.element.submit();
    }, 0);
};

// eslint-disable-line camelcase

var logger$2 = console_with_prefix('lock');

/**
 * SharedLock: a mutex built on HTML5 localStorage, to ensure that only one browser
 * window/tab at a time will be able to access shared resources.
 *
 * Based on the Alur and Taubenfeld fast lock
 * (http://www.cs.rochester.edu/research/synchronization/pseudocode/fastlock.html)
 * with an added timeout to ensure there will be eventual progress in the event
 * that a window is closed in the middle of the callback.
 *
 * Implementation based on the original version by David Wolever (https://github.com/wolever)
 * at https://gist.github.com/wolever/5fd7573d1ef6166e8f8c4af286a69432.
 *
 * @example
 * const myLock = new SharedLock('some-key');
 * myLock.withLock(function() {
 *   console.log('I hold the mutex!');
 * });
 *
 * @constructor
 */
var SharedLock = function(key, options) {
    options = options || {};

    this.storageKey = key;
    this.storage = options.storage || window.localStorage;
    this.pollIntervalMS = options.pollIntervalMS || 100;
    this.timeoutMS = options.timeoutMS || 2000;
};

// pass in a specific pid to test contention scenarios; otherwise
// it is chosen randomly for each acquisition attempt
SharedLock.prototype.withLock = function(lockedCB, errorCB, pid) {
    if (!pid && typeof errorCB !== 'function') {
        pid = errorCB;
        errorCB = null;
    }

    var i = pid || (new Date().getTime() + '|' + Math.random());
    var startTime = new Date().getTime();

    var key = this.storageKey;
    var pollIntervalMS = this.pollIntervalMS;
    var timeoutMS = this.timeoutMS;
    var storage = this.storage;

    var keyX = key + ':X';
    var keyY = key + ':Y';
    var keyZ = key + ':Z';

    var reportError = function(err) {
        errorCB && errorCB(err);
    };

    var delay = function(cb) {
        if (new Date().getTime() - startTime > timeoutMS) {
            logger$2.error('Timeout waiting for mutex on ' + key + '; clearing lock. [' + i + ']');
            storage.removeItem(keyZ);
            storage.removeItem(keyY);
            loop();
            return;
        }
        setTimeout(function() {
            try {
                cb();
            } catch(err) {
                reportError(err);
            }
        }, pollIntervalMS * (Math.random() + 0.1));
    };

    var waitFor = function(predicate, cb) {
        if (predicate()) {
            cb();
        } else {
            delay(function() {
                waitFor(predicate, cb);
            });
        }
    };

    var getSetY = function() {
        var valY = storage.getItem(keyY);
        if (valY && valY !== i) { // if Y == i then this process already has the lock (useful for test cases)
            return false;
        } else {
            storage.setItem(keyY, i);
            if (storage.getItem(keyY) === i) {
                return true;
            } else {
                if (!localStorageSupported(storage, true)) {
                    throw new Error('localStorage support dropped while acquiring lock');
                }
                return false;
            }
        }
    };

    var loop = function() {
        storage.setItem(keyX, i);

        waitFor(getSetY, function() {
            if (storage.getItem(keyX) === i) {
                criticalSection();
                return;
            }

            delay(function() {
                if (storage.getItem(keyY) !== i) {
                    loop();
                    return;
                }
                waitFor(function() {
                    return !storage.getItem(keyZ);
                }, criticalSection);
            });
        });
    };

    var criticalSection = function() {
        storage.setItem(keyZ, '1');
        try {
            lockedCB();
        } finally {
            storage.removeItem(keyZ);
            if (storage.getItem(keyY) === i) {
                storage.removeItem(keyY);
            }
            if (storage.getItem(keyX) === i) {
                storage.removeItem(keyX);
            }
        }
    };

    try {
        if (localStorageSupported(storage, true)) {
            loop();
        } else {
            throw new Error('localStorage support check failed');
        }
    } catch(err) {
        reportError(err);
    }
};

// eslint-disable-line camelcase

var logger$1 = console_with_prefix('batch');

/**
 * RequestQueue: queue for batching API requests with localStorage backup for retries.
 * Maintains an in-memory queue which represents the source of truth for the current
 * page, but also writes all items out to a copy in the browser's localStorage, which
 * can be read on subsequent pageloads and retried. For batchability, all the request
 * items in the queue should be of the same type (events, people updates, group updates)
 * so they can be sent in a single request to the same API endpoint.
 *
 * LocalStorage keying and locking: In order for reloads and subsequent pageloads of
 * the same site to access the same persisted data, they must share the same localStorage
 * key (for instance based on project token and queue type). Therefore access to the
 * localStorage entry is guarded by an asynchronous mutex (SharedLock) to prevent
 * simultaneously open windows/tabs from overwriting each other's data (which would lead
 * to data loss in some situations).
 * @constructor
 */
var RequestQueue = function(storageKey, options) {
    options = options || {};
    this.storageKey = storageKey;
    this.storage = options.storage || window.localStorage;
    this.reportError = options.errorReporter || _.bind(logger$1.error, logger$1);
    this.lock = new SharedLock(storageKey, {storage: this.storage});

    this.pid = options.pid || null; // pass pid to test out storage lock contention scenarios

    this.memQueue = [];
};

/**
 * Add one item to queues (memory and localStorage). The queued entry includes
 * the given item along with an auto-generated ID and a "flush-after" timestamp.
 * It is expected that the item will be sent over the network and dequeued
 * before the flush-after time; if this doesn't happen it is considered orphaned
 * (e.g., the original tab where it was enqueued got closed before it could be
 * sent) and the item can be sent by any tab that finds it in localStorage.
 *
 * The final callback param is called with a param indicating success or
 * failure of the enqueue operation; it is asynchronous because the localStorage
 * lock is asynchronous.
 */
RequestQueue.prototype.enqueue = function(item, flushInterval, cb) {
    var queueEntry = {
        'id': cheap_guid(),
        'flushAfter': new Date().getTime() + flushInterval * 2,
        'payload': item
    };

    this.lock.withLock(_.bind(function lockAcquired() {
        var succeeded;
        try {
            var storedQueue = this.readFromStorage();
            storedQueue.push(queueEntry);
            succeeded = this.saveToStorage(storedQueue);
            if (succeeded) {
                // only add to in-memory queue when storage succeeds
                this.memQueue.push(queueEntry);
            }
        } catch(err) {
            this.reportError('Error enqueueing item', item);
            succeeded = false;
        }
        if (cb) {
            cb(succeeded);
        }
    }, this), _.bind(function lockFailure(err) {
        this.reportError('Error acquiring storage lock', err);
        if (cb) {
            cb(false);
        }
    }, this), this.pid);
};

/**
 * Read out the given number of queue entries. If this.memQueue
 * has fewer than batchSize items, then look for "orphaned" items
 * in the persisted queue (items where the 'flushAfter' time has
 * already passed).
 */
RequestQueue.prototype.fillBatch = function(batchSize) {
    var batch = this.memQueue.slice(0, batchSize);
    if (batch.length < batchSize) {
        // don't need lock just to read events; localStorage is thread-safe
        // and the worst that could happen is a duplicate send of some
        // orphaned events, which will be deduplicated on the server side
        var storedQueue = this.readFromStorage();
        if (storedQueue.length) {
            // item IDs already in batch; don't duplicate out of storage
            var idsInBatch = {}; // poor man's Set
            _.each(batch, function(item) { idsInBatch[item['id']] = true; });

            for (var i = 0; i < storedQueue.length; i++) {
                var item = storedQueue[i];
                if (new Date().getTime() > item['flushAfter'] && !idsInBatch[item['id']]) {
                    item.orphaned = true;
                    batch.push(item);
                    if (batch.length >= batchSize) {
                        break;
                    }
                }
            }
        }
    }
    return batch;
};

/**
 * Remove items with matching 'id' from array (immutably)
 * also remove any item without a valid id (e.g., malformed
 * storage entries).
 */
var filterOutIDsAndInvalid = function(items, idSet) {
    var filteredItems = [];
    _.each(items, function(item) {
        if (item['id'] && !idSet[item['id']]) {
            filteredItems.push(item);
        }
    });
    return filteredItems;
};

/**
 * Remove items with matching IDs from both in-memory queue
 * and persisted queue
 */
RequestQueue.prototype.removeItemsByID = function(ids, cb) {
    var idSet = {}; // poor man's Set
    _.each(ids, function(id) { idSet[id] = true; });

    this.memQueue = filterOutIDsAndInvalid(this.memQueue, idSet);

    var removeFromStorage = _.bind(function() {
        var succeeded;
        try {
            var storedQueue = this.readFromStorage();
            storedQueue = filterOutIDsAndInvalid(storedQueue, idSet);
            succeeded = this.saveToStorage(storedQueue);

            // an extra check: did storage report success but somehow
            // the items are still there?
            if (succeeded) {
                storedQueue = this.readFromStorage();
                for (var i = 0; i < storedQueue.length; i++) {
                    var item = storedQueue[i];
                    if (item['id'] && !!idSet[item['id']]) {
                        this.reportError('Item not removed from storage');
                        return false;
                    }
                }
            }
        } catch(err) {
            this.reportError('Error removing items', ids);
            succeeded = false;
        }
        return succeeded;
    }, this);

    this.lock.withLock(function lockAcquired() {
        var succeeded = removeFromStorage();
        if (cb) {
            cb(succeeded);
        }
    }, _.bind(function lockFailure(err) {
        var succeeded = false;
        this.reportError('Error acquiring storage lock', err);
        if (!localStorageSupported(this.storage, true)) {
            // Looks like localStorage writes have stopped working sometime after
            // initialization (probably full), and so nobody can acquire locks
            // anymore. Consider it temporarily safe to remove items without the
            // lock, since nobody's writing successfully anyway.
            succeeded = removeFromStorage();
            if (!succeeded) {
                // OK, we couldn't even write out the smaller queue. Try clearing it
                // entirely.
                try {
                    this.storage.removeItem(this.storageKey);
                } catch(err) {
                    this.reportError('Error clearing queue', err);
                }
            }
        }
        if (cb) {
            cb(succeeded);
        }
    }, this), this.pid);
};

// internal helper for RequestQueue.updatePayloads
var updatePayloads = function(existingItems, itemsToUpdate) {
    var newItems = [];
    _.each(existingItems, function(item) {
        var id = item['id'];
        if (id in itemsToUpdate) {
            var newPayload = itemsToUpdate[id];
            if (newPayload !== null) {
                item['payload'] = newPayload;
                newItems.push(item);
            }
        } else {
            // no update
            newItems.push(item);
        }
    });
    return newItems;
};

/**
 * Update payloads of given items in both in-memory queue and
 * persisted queue. Items set to null are removed from queues.
 */
RequestQueue.prototype.updatePayloads = function(itemsToUpdate, cb) {
    this.memQueue = updatePayloads(this.memQueue, itemsToUpdate);
    this.lock.withLock(_.bind(function lockAcquired() {
        var succeeded;
        try {
            var storedQueue = this.readFromStorage();
            storedQueue = updatePayloads(storedQueue, itemsToUpdate);
            succeeded = this.saveToStorage(storedQueue);
        } catch(err) {
            this.reportError('Error updating items', itemsToUpdate);
            succeeded = false;
        }
        if (cb) {
            cb(succeeded);
        }
    }, this), _.bind(function lockFailure(err) {
        this.reportError('Error acquiring storage lock', err);
        if (cb) {
            cb(false);
        }
    }, this), this.pid);
};

/**
 * Read and parse items array from localStorage entry, handling
 * malformed/missing data if necessary.
 */
RequestQueue.prototype.readFromStorage = function() {
    var storageEntry;
    try {
        storageEntry = this.storage.getItem(this.storageKey);
        if (storageEntry) {
            storageEntry = JSONParse(storageEntry);
            if (!_.isArray(storageEntry)) {
                this.reportError('Invalid storage entry:', storageEntry);
                storageEntry = null;
            }
        }
    } catch (err) {
        this.reportError('Error retrieving queue', err);
        storageEntry = null;
    }
    return storageEntry || [];
};

/**
 * Serialize the given items array to localStorage.
 */
RequestQueue.prototype.saveToStorage = function(queue) {
    try {
        this.storage.setItem(this.storageKey, JSONStringify(queue));
        return true;
    } catch (err) {
        this.reportError('Error saving queue', err);
        return false;
    }
};

/**
 * Clear out queues (memory and localStorage).
 */
RequestQueue.prototype.clear = function() {
    this.memQueue = [];
    this.storage.removeItem(this.storageKey);
};

// eslint-disable-line camelcase

// maximum interval between request retries after exponential backoff
var MAX_RETRY_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

var logger = console_with_prefix('batch');

/**
 * RequestBatcher: manages the queueing, flushing, retry etc of requests of one
 * type (events, people, groups).
 * Uses RequestQueue to manage the backing store.
 * @constructor
 */
var RequestBatcher = function(storageKey, options) {
    this.errorReporter = options.errorReporter;
    this.queue = new RequestQueue(storageKey, {
        errorReporter: _.bind(this.reportError, this),
        storage: options.storage
    });

    this.libConfig = options.libConfig;
    this.sendRequest = options.sendRequestFunc;
    this.beforeSendHook = options.beforeSendHook;
    this.stopAllBatching = options.stopAllBatchingFunc;

    // seed variable batch size + flush interval with configured values
    this.batchSize = this.libConfig['batch_size'];
    this.flushInterval = this.libConfig['batch_flush_interval_ms'];

    this.stopped = !this.libConfig['batch_autostart'];
    this.consecutiveRemovalFailures = 0;

    // extra client-side dedupe
    this.itemIdsSentSuccessfully = {};
};

/**
 * Add one item to queue.
 */
RequestBatcher.prototype.enqueue = function(item, cb) {
    this.queue.enqueue(item, this.flushInterval, cb);
};

/**
 * Start flushing batches at the configured time interval. Must call
 * this method upon SDK init in order to send anything over the network.
 */
RequestBatcher.prototype.start = function() {
    this.stopped = false;
    this.consecutiveRemovalFailures = 0;
    this.flush();
};

/**
 * Stop flushing batches. Can be restarted by calling start().
 */
RequestBatcher.prototype.stop = function() {
    this.stopped = true;
    if (this.timeoutID) {
        clearTimeout(this.timeoutID);
        this.timeoutID = null;
    }
};

/**
 * Clear out queue.
 */
RequestBatcher.prototype.clear = function() {
    this.queue.clear();
};

/**
 * Restore batch size configuration to whatever is set in the main SDK.
 */
RequestBatcher.prototype.resetBatchSize = function() {
    this.batchSize = this.libConfig['batch_size'];
};

/**
 * Restore flush interval time configuration to whatever is set in the main SDK.
 */
RequestBatcher.prototype.resetFlush = function() {
    this.scheduleFlush(this.libConfig['batch_flush_interval_ms']);
};

/**
 * Schedule the next flush in the given number of milliseconds.
 */
RequestBatcher.prototype.scheduleFlush = function(flushMS) {
    this.flushInterval = flushMS;
    if (!this.stopped) { // don't schedule anymore if batching has been stopped
        this.timeoutID = setTimeout(_.bind(this.flush, this), this.flushInterval);
    }
};

/**
 * Flush one batch to network. Depending on success/failure modes, it will either
 * remove the batch from the queue or leave it in for retry, and schedule the next
 * flush. In cases of most network or API failures, it will back off exponentially
 * when retrying.
 * @param {Object} [options]
 * @param {boolean} [options.sendBeacon] - whether to send batch with
 * navigator.sendBeacon (only useful for sending batches before page unloads, as
 * sendBeacon offers no callbacks or status indications)
 */
RequestBatcher.prototype.flush = function(options) {
    try {

        if (this.requestInProgress) {
            logger.log('Flush: Request already in progress');
            return;
        }

        options = options || {};
        var timeoutMS = this.libConfig['batch_request_timeout_ms'];
        var startTime = new Date().getTime();
        var currentBatchSize = this.batchSize;
        var batch = this.queue.fillBatch(currentBatchSize);
        var dataForRequest = [];
        var transformedItems = {};
        _.each(batch, function(item) {
            var payload = item['payload'];
            if (this.beforeSendHook && !item.orphaned) {
                payload = this.beforeSendHook(payload);
            }
            if (payload) {
                // mp_sent_by_lib_version prop captures which lib version actually
                // sends each event (regardless of which version originally queued
                // it for sending)
                if (payload['event'] && payload['properties']) {
                    payload['properties'] = _.extend(
                        {},
                        payload['properties'],
                        {'mp_sent_by_lib_version': Config.LIB_VERSION}
                    );
                }
                var addPayload = true;
                var itemId = item['id'];
                if (itemId) {
                    if ((this.itemIdsSentSuccessfully[itemId] || 0) > 5) {
                        this.reportError('[dupe] item ID sent too many times, not sending', {
                            item: item,
                            batchSize: batch.length,
                            timesSent: this.itemIdsSentSuccessfully[itemId]
                        });
                        addPayload = false;
                    }
                } else {
                    this.reportError('[dupe] found item with no ID', {item: item});
                }

                if (addPayload) {
                    dataForRequest.push(payload);
                }
            }
            transformedItems[item['id']] = payload;
        }, this);
        if (dataForRequest.length < 1) {
            this.resetFlush();
            return; // nothing to do
        }

        this.requestInProgress = true;

        var batchSendCallback = _.bind(function(res) {
            this.requestInProgress = false;

            try {

                // handle API response in a try-catch to make sure we can reset the
                // flush operation if something goes wrong

                var removeItemsFromQueue = false;
                if (options.unloading) {
                    // update persisted data to include hook transformations
                    this.queue.updatePayloads(transformedItems);
                } else if (
                    _.isObject(res) &&
                    res.error === 'timeout' &&
                    new Date().getTime() - startTime >= timeoutMS
                ) {
                    this.reportError('Network timeout; retrying');
                    this.flush();
                } else if (
                    _.isObject(res) &&
                    res.xhr_req &&
                    (res.xhr_req['status'] >= 500 || res.xhr_req['status'] === 429 || res.error === 'timeout')
                ) {
                    // network or API error, or 429 Too Many Requests, retry
                    var retryMS = this.flushInterval * 2;
                    var headers = res.xhr_req['responseHeaders'];
                    if (headers) {
                        var retryAfter = headers['Retry-After'];
                        if (retryAfter) {
                            retryMS = (parseInt(retryAfter, 10) * 1000) || retryMS;
                        }
                    }
                    retryMS = Math.min(MAX_RETRY_INTERVAL_MS, retryMS);
                    this.reportError('Error; retry in ' + retryMS + ' ms');
                    this.scheduleFlush(retryMS);
                } else if (_.isObject(res) && res.xhr_req && res.xhr_req['status'] === 413) {
                    // 413 Payload Too Large
                    if (batch.length > 1) {
                        var halvedBatchSize = Math.max(1, Math.floor(currentBatchSize / 2));
                        this.batchSize = Math.min(this.batchSize, halvedBatchSize, batch.length - 1);
                        this.reportError('413 response; reducing batch size to ' + this.batchSize);
                        this.resetFlush();
                    } else {
                        this.reportError('Single-event request too large; dropping', batch);
                        this.resetBatchSize();
                        removeItemsFromQueue = true;
                    }
                } else {
                    // successful network request+response; remove each item in batch from queue
                    // (even if it was e.g. a 400, in which case retrying won't help)
                    removeItemsFromQueue = true;
                }

                if (removeItemsFromQueue) {
                    this.queue.removeItemsByID(
                        _.map(batch, function(item) { return item['id']; }),
                        _.bind(function(succeeded) {
                            if (succeeded) {
                                this.consecutiveRemovalFailures = 0;
                                this.flush(); // handle next batch if the queue isn't empty
                            } else {
                                this.reportError('Failed to remove items from queue');
                                if (++this.consecutiveRemovalFailures > 5) {
                                    this.reportError('Too many queue failures; disabling batching system.');
                                    this.stopAllBatching();
                                } else {
                                    this.resetFlush();
                                }
                            }
                        }, this)
                    );

                    // client-side dedupe
                    _.each(batch, _.bind(function(item) {
                        var itemId = item['id'];
                        if (itemId) {
                            this.itemIdsSentSuccessfully[itemId] = this.itemIdsSentSuccessfully[itemId] || 0;
                            this.itemIdsSentSuccessfully[itemId]++;
                            if (this.itemIdsSentSuccessfully[itemId] > 5) {
                                this.reportError('[dupe] item ID sent too many times', {
                                    item: item,
                                    batchSize: batch.length,
                                    timesSent: this.itemIdsSentSuccessfully[itemId]
                                });
                            }
                        } else {
                            this.reportError('[dupe] found item with no ID while removing', {item: item});
                        }
                    }, this));
                }

            } catch(err) {
                this.reportError('Error handling API response', err);
                this.resetFlush();
            }
        }, this);
        var requestOptions = {
            method: 'POST',
            verbose: true,
            ignore_json_errors: true, // eslint-disable-line camelcase
            timeout_ms: timeoutMS // eslint-disable-line camelcase
        };
        if (options.unloading) {
            requestOptions.transport = 'sendBeacon';
        }
        logger.log('MIXPANEL REQUEST:', dataForRequest);
        this.sendRequest(dataForRequest, requestOptions, batchSendCallback);

    } catch(err) {
        this.reportError('Error flushing request queue', err);
        this.resetFlush();
    }
};

/**
 * Log error to global logger and optional user-defined logger.
 */
RequestBatcher.prototype.reportError = function(msg, err) {
    logger.error.apply(logger.error, arguments);
    if (this.errorReporter) {
        try {
            if (!(err instanceof Error)) {
                err = new Error(msg);
            }
            this.errorReporter(msg, err);
        } catch(err) {
            logger.error(err);
        }
    }
};

/**
 * A function used to track a Mixpanel event (e.g. MixpanelLib.track)
 * @callback trackFunction
 * @param {String} event_name The name of the event. This can be anything the user does - 'Button Click', 'Sign Up', 'Item Purchased', etc.
 * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
 * @param {Function} [callback] If provided, the callback function will be called after tracking the event.
 */

/** Public **/

var GDPR_DEFAULT_PERSISTENCE_PREFIX = '__mp_opt_in_out_';

/**
 * Opt the user in to data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {trackFunction} [options.track] - function used for tracking a Mixpanel event to record the opt-in action
 * @param {string} [options.trackEventName] - event name to be used for tracking the opt-in action
 * @param {Object} [options.trackProperties] - set of properties to be tracked along with the opt-in action
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {string} [options.cookieDomain] - custom cookie domain
 * @param {boolean} [options.crossSiteCookie] - whether the opt-in cookie is set as cross-site-enabled
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function optIn(token, options) {
    _optInOut(true, token, options);
}

/**
 * Opt the user out of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-out cookie expires
 * @param {string} [options.cookieDomain] - custom cookie domain
 * @param {boolean} [options.crossSiteCookie] - whether the opt-in cookie is set as cross-site-enabled
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-out cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-out cookie is set as secure or not
 */
function optOut(token, options) {
    _optInOut(false, token, options);
}

/**
 * Check whether the user has opted in to data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} whether the user has opted in to the given opt type
 */
function hasOptedIn(token, options) {
    return _getStorageValue(token, options) === '1';
}

/**
 * Check whether the user has opted out of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {boolean} [options.ignoreDnt] - flag to ignore browser DNT settings and always return false
 * @returns {boolean} whether the user has opted out of the given opt type
 */
function hasOptedOut(token, options) {
    if (_hasDoNotTrackFlagOn(options)) {
        console$1.warn('This browser has "Do Not Track" enabled. This will prevent the Mixpanel SDK from sending any data. To ignore the "Do Not Track" browser setting, initialize the Mixpanel instance with the config "ignore_dnt: true"');
        return true;
    }
    var optedOut = _getStorageValue(token, options) === '0';
    if (optedOut) {
        console$1.warn('You are opted out of Mixpanel tracking. This will prevent the Mixpanel SDK from sending any data.');
    }
    return optedOut;
}

/**
 * Wrap a MixpanelLib method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function addOptOutCheckMixpanelLib(method) {
    return _addOptOutCheck(method, function(name) {
        return this.get_config(name);
    });
}

/**
 * Wrap a MixpanelPeople method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function addOptOutCheckMixpanelPeople(method) {
    return _addOptOutCheck(method, function(name) {
        return this._get_config(name);
    });
}

/**
 * Wrap a MixpanelGroup method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function addOptOutCheckMixpanelGroup(method) {
    return _addOptOutCheck(method, function(name) {
        return this._get_config(name);
    });
}

/**
 * Clear the user's opt in/out status of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {string} [options.cookieDomain] - custom cookie domain
 * @param {boolean} [options.crossSiteCookie] - whether the opt-in cookie is set as cross-site-enabled
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function clearOptInOut(token, options) {
    options = options || {};
    _getStorage(options).remove(
        _getStorageKey(token, options), !!options.crossSubdomainCookie, options.cookieDomain
    );
}

/** Private **/

/**
 * Get storage util
 * @param {Object} [options]
 * @param {string} [options.persistenceType]
 * @returns {object} either _.cookie or _.localstorage
 */
function _getStorage(options) {
    options = options || {};
    return options.persistenceType === 'localStorage' ? _.localStorage : _.cookie;
}

/**
 * Get the name of the cookie that is used for the given opt type (tracking, cookie, etc.)
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {string} the name of the cookie for the given opt type
 */
function _getStorageKey(token, options) {
    options = options || {};
    return (options.persistencePrefix || GDPR_DEFAULT_PERSISTENCE_PREFIX) + token;
}

/**
 * Get the value of the cookie that is used for the given opt type (tracking, cookie, etc.)
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {string} the value of the cookie for the given opt type
 */
function _getStorageValue(token, options) {
    return _getStorage(options).get(_getStorageKey(token, options));
}

/**
 * Check whether the user has set the DNT/doNotTrack setting to true in their browser
 * @param {Object} [options]
 * @param {string} [options.window] - alternate window object to check; used to force various DNT settings in browser tests
 * @param {boolean} [options.ignoreDnt] - flag to ignore browser DNT settings and always return false
 * @returns {boolean} whether the DNT setting is true
 */
function _hasDoNotTrackFlagOn(options) {
    if (options && options.ignoreDnt) {
        return false;
    }
    var win = (options && options.window) || window$1;
    var nav = win['navigator'] || {};
    var hasDntOn = false;

    _.each([
        nav['doNotTrack'], // standard
        nav['msDoNotTrack'],
        win['doNotTrack']
    ], function(dntValue) {
        if (_.includes([true, 1, '1', 'yes'], dntValue)) {
            hasDntOn = true;
        }
    });

    return hasDntOn;
}

/**
 * Set cookie/localstorage for the user indicating that they are opted in or out for the given opt type
 * @param {boolean} optValue - whether to opt the user in or out for the given opt type
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {trackFunction} [options.track] - function used for tracking a Mixpanel event to record the opt-in action
 * @param {string} [options.trackEventName] - event name to be used for tracking the opt-in action
 * @param {Object} [options.trackProperties] - set of properties to be tracked along with the opt-in action
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {string} [options.cookieDomain] - custom cookie domain
 * @param {boolean} [options.crossSiteCookie] - whether the opt-in cookie is set as cross-site-enabled
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function _optInOut(optValue, token, options) {
    if (!_.isString(token) || !token.length) {
        console$1.error('gdpr.' + (optValue ? 'optIn' : 'optOut') + ' called with an invalid token');
        return;
    }

    options = options || {};

    _getStorage(options).set(
        _getStorageKey(token, options),
        optValue ? 1 : 0,
        _.isNumber(options.cookieExpiration) ? options.cookieExpiration : null,
        !!options.crossSubdomainCookie,
        !!options.secureCookie,
        !!options.crossSiteCookie,
        options.cookieDomain
    );

    if (options.track && optValue) { // only track event if opting in (optValue=true)
        options.track(options.trackEventName || '$opt_in', options.trackProperties, {
            'send_immediately': true
        });
    }
}

/**
 * Wrap a method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @param {function} getConfigValue - getter function for the Mixpanel API token and other options to be used with opt-out check
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function _addOptOutCheck(method, getConfigValue) {
    return function() {
        var optedOut = false;

        try {
            var token = getConfigValue.call(this, 'token');
            var ignoreDnt = getConfigValue.call(this, 'ignore_dnt');
            var persistenceType = getConfigValue.call(this, 'opt_out_tracking_persistence_type');
            var persistencePrefix = getConfigValue.call(this, 'opt_out_tracking_cookie_prefix');
            var win = getConfigValue.call(this, 'window'); // used to override window during browser tests

            if (token) { // if there was an issue getting the token, continue method execution as normal
                optedOut = hasOptedOut(token, {
                    ignoreDnt: ignoreDnt,
                    persistenceType: persistenceType,
                    persistencePrefix: persistencePrefix,
                    window: win
                });
            }
        } catch(err) {
            console$1.error('Unexpected error when checking tracking opt-out status: ' + err);
        }

        if (!optedOut) {
            return method.apply(this, arguments);
        }

        var callback = arguments[arguments.length - 1];
        if (typeof(callback) === 'function') {
            callback(0);
        }

        return;
    };
}

/** @const */ var SET_ACTION      = '$set';
/** @const */ var SET_ONCE_ACTION = '$set_once';
/** @const */ var UNSET_ACTION    = '$unset';
/** @const */ var ADD_ACTION      = '$add';
/** @const */ var APPEND_ACTION   = '$append';
/** @const */ var UNION_ACTION    = '$union';
/** @const */ var REMOVE_ACTION   = '$remove';
/** @const */ var DELETE_ACTION   = '$delete';

// Common internal methods for mixpanel.people and mixpanel.group APIs.
// These methods shouldn't involve network I/O.
var apiActions = {
    set_action: function(prop, to) {
        var data = {};
        var $set = {};
        if (_.isObject(prop)) {
            _.each(prop, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $set[k] = v;
                }
            }, this);
        } else {
            $set[prop] = to;
        }

        data[SET_ACTION] = $set;
        return data;
    },

    unset_action: function(prop) {
        var data = {};
        var $unset = [];
        if (!_.isArray(prop)) {
            prop = [prop];
        }

        _.each(prop, function(k) {
            if (!this._is_reserved_property(k)) {
                $unset.push(k);
            }
        }, this);

        data[UNSET_ACTION] = $unset;
        return data;
    },

    set_once_action: function(prop, to) {
        var data = {};
        var $set_once = {};
        if (_.isObject(prop)) {
            _.each(prop, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $set_once[k] = v;
                }
            }, this);
        } else {
            $set_once[prop] = to;
        }
        data[SET_ONCE_ACTION] = $set_once;
        return data;
    },

    union_action: function(list_name, values) {
        var data = {};
        var $union = {};
        if (_.isObject(list_name)) {
            _.each(list_name, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $union[k] = _.isArray(v) ? v : [v];
                }
            }, this);
        } else {
            $union[list_name] = _.isArray(values) ? values : [values];
        }
        data[UNION_ACTION] = $union;
        return data;
    },

    append_action: function(list_name, value) {
        var data = {};
        var $append = {};
        if (_.isObject(list_name)) {
            _.each(list_name, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $append[k] = v;
                }
            }, this);
        } else {
            $append[list_name] = value;
        }
        data[APPEND_ACTION] = $append;
        return data;
    },

    remove_action: function(list_name, value) {
        var data = {};
        var $remove = {};
        if (_.isObject(list_name)) {
            _.each(list_name, function(v, k) {
                if (!this._is_reserved_property(k)) {
                    $remove[k] = v;
                }
            }, this);
        } else {
            $remove[list_name] = value;
        }
        data[REMOVE_ACTION] = $remove;
        return data;
    },

    delete_action: function() {
        var data = {};
        data[DELETE_ACTION] = '';
        return data;
    }
};

/**
 * Mixpanel Group Object
 * @constructor
 */
var MixpanelGroup = function() {};

_.extend(MixpanelGroup.prototype, apiActions);

MixpanelGroup.prototype._init = function(mixpanel_instance, group_key, group_id) {
    this._mixpanel = mixpanel_instance;
    this._group_key = group_key;
    this._group_id = group_id;
};

/**
 * Set properties on a group.
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').set('Location', '405 Howard');
 *
 *     // or set multiple properties at once
 *     mixpanel.get_group('company', 'mixpanel').set({
 *          'Location': '405 Howard',
 *          'Founded' : 2009,
 *     });
 *     // properties can be strings, integers, dates, or lists
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
 * @param {*} [to] A value to set on the given property name
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.set = addOptOutCheckMixpanelGroup(function(prop, to, callback) {
    var data = this.set_action(prop, to);
    if (_.isObject(prop)) {
        callback = to;
    }
    return this._send_request(data, callback);
});

/**
 * Set properties on a group, only if they do not yet exist.
 * This will not overwrite previous group property values, unlike
 * group.set().
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').set_once('Location', '405 Howard');
 *
 *     // or set multiple properties at once
 *     mixpanel.get_group('company', 'mixpanel').set_once({
 *          'Location': '405 Howard',
 *          'Founded' : 2009,
 *     });
 *     // properties can be strings, integers, lists or dates
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
 * @param {*} [to] A value to set on the given property name
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.set_once = addOptOutCheckMixpanelGroup(function(prop, to, callback) {
    var data = this.set_once_action(prop, to);
    if (_.isObject(prop)) {
        callback = to;
    }
    return this._send_request(data, callback);
});

/**
 * Unset properties on a group permanently.
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').unset('Founded');
 *
 * @param {String} prop The name of the property.
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.unset = addOptOutCheckMixpanelGroup(function(prop, callback) {
    var data = this.unset_action(prop);
    return this._send_request(data, callback);
});

/**
 * Merge a given list with a list-valued group property, excluding duplicate values.
 *
 * ### Usage:
 *
 *     // merge a value to a list, creating it if needed
 *     mixpanel.get_group('company', 'mixpanel').union('Location', ['San Francisco', 'London']);
 *
 * @param {String} list_name Name of the property.
 * @param {Array} values Values to merge with the given property
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.union = addOptOutCheckMixpanelGroup(function(list_name, values, callback) {
    if (_.isObject(list_name)) {
        callback = values;
    }
    var data = this.union_action(list_name, values);
    return this._send_request(data, callback);
});

/**
 * Permanently delete a group.
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').delete();
 *
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype['delete'] = addOptOutCheckMixpanelGroup(function(callback) {
    // bracket notation above prevents a minification error related to reserved words
    var data = this.delete_action();
    return this._send_request(data, callback);
});

/**
 * Remove a property from a group. The value will be ignored if doesn't exist.
 *
 * ### Usage:
 *
 *     mixpanel.get_group('company', 'mixpanel').remove('Location', 'London');
 *
 * @param {String} list_name Name of the property.
 * @param {Object} value Value to remove from the given group property
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelGroup.prototype.remove = addOptOutCheckMixpanelGroup(function(list_name, value, callback) {
    var data = this.remove_action(list_name, value);
    return this._send_request(data, callback);
});

MixpanelGroup.prototype._send_request = function(data, callback) {
    data['$group_key'] = this._group_key;
    data['$group_id'] = this._group_id;
    data['$token'] = this._get_config('token');

    var date_encoded_data = _.encodeDates(data);
    return this._mixpanel._track_or_batch({
        type: 'groups',
        data: date_encoded_data,
        endpoint: this._get_config('api_host') + '/groups/',
        batcher: this._mixpanel.request_batchers.groups
    }, callback);
};

MixpanelGroup.prototype._is_reserved_property = function(prop) {
    return prop === '$group_key' || prop === '$group_id';
};

MixpanelGroup.prototype._get_config = function(conf) {
    return this._mixpanel.get_config(conf);
};

MixpanelGroup.prototype.toString = function() {
    return this._mixpanel.toString() + '.group.' + this._group_key + '.' + this._group_id;
};

// MixpanelGroup Exports
MixpanelGroup.prototype['remove']   = MixpanelGroup.prototype.remove;
MixpanelGroup.prototype['set']      = MixpanelGroup.prototype.set;
MixpanelGroup.prototype['set_once'] = MixpanelGroup.prototype.set_once;
MixpanelGroup.prototype['union']    = MixpanelGroup.prototype.union;
MixpanelGroup.prototype['unset']    = MixpanelGroup.prototype.unset;
MixpanelGroup.prototype['toString'] = MixpanelGroup.prototype.toString;

/**
 * Mixpanel People Object
 * @constructor
 */
var MixpanelPeople = function() {};

_.extend(MixpanelPeople.prototype, apiActions);

MixpanelPeople.prototype._init = function(mixpanel_instance) {
    this._mixpanel = mixpanel_instance;
};

/*
* Set properties on a user record.
*
* ### Usage:
*
*     mixpanel.people.set('gender', 'm');
*
*     // or set multiple properties at once
*     mixpanel.people.set({
*         'Company': 'Acme',
*         'Plan': 'Premium',
*         'Upgrade date': new Date()
*     });
*     // properties can be strings, integers, dates, or lists
*
* @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [to] A value to set on the given property name
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.set = addOptOutCheckMixpanelPeople(function(prop, to, callback) {
    var data = this.set_action(prop, to);
    if (_.isObject(prop)) {
        callback = to;
    }
    // make sure that the referrer info has been updated and saved
    if (this._get_config('save_referrer')) {
        this._mixpanel['persistence'].update_referrer_info(document.referrer);
    }

    // update $set object with default people properties
    data[SET_ACTION] = _.extend(
        {},
        _.info.people_properties(),
        this._mixpanel['persistence'].get_referrer_info(),
        data[SET_ACTION]
    );
    return this._send_request(data, callback);
});

/*
* Set properties on a user record, only if they do not yet exist.
* This will not overwrite previous people property values, unlike
* people.set().
*
* ### Usage:
*
*     mixpanel.people.set_once('First Login Date', new Date());
*
*     // or set multiple properties at once
*     mixpanel.people.set_once({
*         'First Login Date': new Date(),
*         'Starting Plan': 'Premium'
*     });
*
*     // properties can be strings, integers or dates
*
* @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [to] A value to set on the given property name
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.set_once = addOptOutCheckMixpanelPeople(function(prop, to, callback) {
    var data = this.set_once_action(prop, to);
    if (_.isObject(prop)) {
        callback = to;
    }
    return this._send_request(data, callback);
});

/*
* Unset properties on a user record (permanently removes the properties and their values from a profile).
*
* ### Usage:
*
*     mixpanel.people.unset('gender');
*
*     // or unset multiple properties at once
*     mixpanel.people.unset(['gender', 'Company']);
*
* @param {Array|String} prop If a string, this is the name of the property. If an array, this is a list of property names.
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.unset = addOptOutCheckMixpanelPeople(function(prop, callback) {
    var data = this.unset_action(prop);
    return this._send_request(data, callback);
});

/*
* Increment/decrement numeric people analytics properties.
*
* ### Usage:
*
*     mixpanel.people.increment('page_views', 1);
*
*     // or, for convenience, if you're just incrementing a counter by
*     // 1, you can simply do
*     mixpanel.people.increment('page_views');
*
*     // to decrement a counter, pass a negative number
*     mixpanel.people.increment('credits_left', -1);
*
*     // like mixpanel.people.set(), you can increment multiple
*     // properties at once:
*     mixpanel.people.increment({
*         counter1: 1,
*         counter2: 6
*     });
*
* @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and numeric values.
* @param {Number} [by] An amount to increment the given property
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.increment = addOptOutCheckMixpanelPeople(function(prop, by, callback) {
    var data = {};
    var $add = {};
    if (_.isObject(prop)) {
        _.each(prop, function(v, k) {
            if (!this._is_reserved_property(k)) {
                if (isNaN(parseFloat(v))) {
                    console$1.error('Invalid increment value passed to mixpanel.people.increment - must be a number');
                    return;
                } else {
                    $add[k] = v;
                }
            }
        }, this);
        callback = by;
    } else {
        // convenience: mixpanel.people.increment('property'); will
        // increment 'property' by 1
        if (_.isUndefined(by)) {
            by = 1;
        }
        $add[prop] = by;
    }
    data[ADD_ACTION] = $add;

    return this._send_request(data, callback);
});

/*
* Append a value to a list-valued people analytics property.
*
* ### Usage:
*
*     // append a value to a list, creating it if needed
*     mixpanel.people.append('pages_visited', 'homepage');
*
*     // like mixpanel.people.set(), you can append multiple
*     // properties at once:
*     mixpanel.people.append({
*         list1: 'bob',
*         list2: 123
*     });
*
* @param {Object|String} list_name If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [value] value An item to append to the list
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.append = addOptOutCheckMixpanelPeople(function(list_name, value, callback) {
    if (_.isObject(list_name)) {
        callback = value;
    }
    var data = this.append_action(list_name, value);
    return this._send_request(data, callback);
});

/*
* Remove a value from a list-valued people analytics property.
*
* ### Usage:
*
*     mixpanel.people.remove('School', 'UCB');
*
* @param {Object|String} list_name If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [value] value Item to remove from the list
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.remove = addOptOutCheckMixpanelPeople(function(list_name, value, callback) {
    if (_.isObject(list_name)) {
        callback = value;
    }
    var data = this.remove_action(list_name, value);
    return this._send_request(data, callback);
});

/*
* Merge a given list with a list-valued people analytics property,
* excluding duplicate values.
*
* ### Usage:
*
*     // merge a value to a list, creating it if needed
*     mixpanel.people.union('pages_visited', 'homepage');
*
*     // like mixpanel.people.set(), you can append multiple
*     // properties at once:
*     mixpanel.people.union({
*         list1: 'bob',
*         list2: 123
*     });
*
*     // like mixpanel.people.append(), you can append multiple
*     // values to the same list:
*     mixpanel.people.union({
*         list1: ['bob', 'billy']
*     });
*
* @param {Object|String} list_name If a string, this is the name of the property. If an object, this is an associative array of names and values.
* @param {*} [value] Value / values to merge with the given property
* @param {Function} [callback] If provided, the callback will be called after tracking the event.
*/
MixpanelPeople.prototype.union = addOptOutCheckMixpanelPeople(function(list_name, values, callback) {
    if (_.isObject(list_name)) {
        callback = values;
    }
    var data = this.union_action(list_name, values);
    return this._send_request(data, callback);
});

/*
 * Record that you have charged the current user a certain amount
 * of money. Charges recorded with track_charge() will appear in the
 * Mixpanel revenue report.
 *
 * ### Usage:
 *
 *     // charge a user $50
 *     mixpanel.people.track_charge(50);
 *
 *     // charge a user $30.50 on the 2nd of january
 *     mixpanel.people.track_charge(30.50, {
 *         '$time': new Date('jan 1 2012')
 *     });
 *
 * @param {Number} amount The amount of money charged to the current user
 * @param {Object} [properties] An associative array of properties associated with the charge
 * @param {Function} [callback] If provided, the callback will be called when the server responds
 * @deprecated
 */
MixpanelPeople.prototype.track_charge = addOptOutCheckMixpanelPeople(function(amount, properties, callback) {
    if (!_.isNumber(amount)) {
        amount = parseFloat(amount);
        if (isNaN(amount)) {
            console$1.error('Invalid value passed to mixpanel.people.track_charge - must be a number');
            return;
        }
    }

    return this.append('$transactions', _.extend({
        '$amount': amount
    }, properties), callback);
});

/*
 * Permanently clear all revenue report transactions from the
 * current user's people analytics profile.
 *
 * ### Usage:
 *
 *     mixpanel.people.clear_charges();
 *
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 * @deprecated
 */
MixpanelPeople.prototype.clear_charges = function(callback) {
    return this.set('$transactions', [], callback);
};

/*
* Permanently deletes the current people analytics profile from
* Mixpanel (using the current distinct_id).
*
* ### Usage:
*
*     // remove the all data you have stored about the current user
*     mixpanel.people.delete_user();
*
*/
MixpanelPeople.prototype.delete_user = function() {
    if (!this._identify_called()) {
        console$1.error('mixpanel.people.delete_user() requires you to call identify() first');
        return;
    }
    var data = {'$delete': this._mixpanel.get_distinct_id()};
    return this._send_request(data);
};

MixpanelPeople.prototype.toString = function() {
    return this._mixpanel.toString() + '.people';
};

MixpanelPeople.prototype._send_request = function(data, callback) {
    data['$token'] = this._get_config('token');
    data['$distinct_id'] = this._mixpanel.get_distinct_id();
    var device_id = this._mixpanel.get_property('$device_id');
    var user_id = this._mixpanel.get_property('$user_id');
    var had_persisted_distinct_id = this._mixpanel.get_property('$had_persisted_distinct_id');
    if (device_id) {
        data['$device_id'] = device_id;
    }
    if (user_id) {
        data['$user_id'] = user_id;
    }
    if (had_persisted_distinct_id) {
        data['$had_persisted_distinct_id'] = had_persisted_distinct_id;
    }

    var date_encoded_data = _.encodeDates(data);

    if (!this._identify_called()) {
        this._enqueue(data);
        if (!_.isUndefined(callback)) {
            if (this._get_config('verbose')) {
                callback({status: -1, error: null});
            } else {
                callback(-1);
            }
        }
        return _.truncate(date_encoded_data, 255);
    }

    return this._mixpanel._track_or_batch({
        type: 'people',
        data: date_encoded_data,
        endpoint: this._get_config('api_host') + '/engage/',
        batcher: this._mixpanel.request_batchers.people
    }, callback);
};

MixpanelPeople.prototype._get_config = function(conf_var) {
    return this._mixpanel.get_config(conf_var);
};

MixpanelPeople.prototype._identify_called = function() {
    return this._mixpanel._flags.identify_called === true;
};

// Queue up engage operations if identify hasn't been called yet.
MixpanelPeople.prototype._enqueue = function(data) {
    if (SET_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(SET_ACTION, data);
    } else if (SET_ONCE_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(SET_ONCE_ACTION, data);
    } else if (UNSET_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(UNSET_ACTION, data);
    } else if (ADD_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(ADD_ACTION, data);
    } else if (APPEND_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(APPEND_ACTION, data);
    } else if (REMOVE_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(REMOVE_ACTION, data);
    } else if (UNION_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(UNION_ACTION, data);
    } else {
        console$1.error('Invalid call to _enqueue():', data);
    }
};

MixpanelPeople.prototype._flush_one_queue = function(action, action_method, callback, queue_to_params_fn) {
    var _this = this;
    var queued_data = _.extend({}, this._mixpanel['persistence']._get_queue(action));
    var action_params = queued_data;

    if (!_.isUndefined(queued_data) && _.isObject(queued_data) && !_.isEmptyObject(queued_data)) {
        _this._mixpanel['persistence']._pop_from_people_queue(action, queued_data);
        if (queue_to_params_fn) {
            action_params = queue_to_params_fn(queued_data);
        }
        action_method.call(_this, action_params, function(response, data) {
            // on bad response, we want to add it back to the queue
            if (response === 0) {
                _this._mixpanel['persistence']._add_to_people_queue(action, queued_data);
            }
            if (!_.isUndefined(callback)) {
                callback(response, data);
            }
        });
    }
};

// Flush queued engage operations - order does not matter,
// and there are network level race conditions anyway
MixpanelPeople.prototype._flush = function(
    _set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback, _remove_callback
) {
    var _this = this;
    var $append_queue = this._mixpanel['persistence']._get_queue(APPEND_ACTION);
    var $remove_queue = this._mixpanel['persistence']._get_queue(REMOVE_ACTION);

    this._flush_one_queue(SET_ACTION, this.set, _set_callback);
    this._flush_one_queue(SET_ONCE_ACTION, this.set_once, _set_once_callback);
    this._flush_one_queue(UNSET_ACTION, this.unset, _unset_callback, function(queue) { return _.keys(queue); });
    this._flush_one_queue(ADD_ACTION, this.increment, _add_callback);
    this._flush_one_queue(UNION_ACTION, this.union, _union_callback);

    // we have to fire off each $append individually since there is
    // no concat method server side
    if (!_.isUndefined($append_queue) && _.isArray($append_queue) && $append_queue.length) {
        var $append_item;
        var append_callback = function(response, data) {
            if (response === 0) {
                _this._mixpanel['persistence']._add_to_people_queue(APPEND_ACTION, $append_item);
            }
            if (!_.isUndefined(_append_callback)) {
                _append_callback(response, data);
            }
        };
        for (var i = $append_queue.length - 1; i >= 0; i--) {
            $append_item = $append_queue.pop();
            if (!_.isEmptyObject($append_item)) {
                _this.append($append_item, append_callback);
            }
        }
        // Save the shortened append queue
        _this._mixpanel['persistence'].save();
    }

    // same for $remove
    if (!_.isUndefined($remove_queue) && _.isArray($remove_queue) && $remove_queue.length) {
        var $remove_item;
        var remove_callback = function(response, data) {
            if (response === 0) {
                _this._mixpanel['persistence']._add_to_people_queue(REMOVE_ACTION, $remove_item);
            }
            if (!_.isUndefined(_remove_callback)) {
                _remove_callback(response, data);
            }
        };
        for (var j = $remove_queue.length - 1; j >= 0; j--) {
            $remove_item = $remove_queue.pop();
            if (!_.isEmptyObject($remove_item)) {
                _this.remove($remove_item, remove_callback);
            }
        }
        _this._mixpanel['persistence'].save();
    }
};

MixpanelPeople.prototype._is_reserved_property = function(prop) {
    return prop === '$distinct_id' || prop === '$token' || prop === '$device_id' || prop === '$user_id' || prop === '$had_persisted_distinct_id';
};

// MixpanelPeople Exports
MixpanelPeople.prototype['set']           = MixpanelPeople.prototype.set;
MixpanelPeople.prototype['set_once']      = MixpanelPeople.prototype.set_once;
MixpanelPeople.prototype['unset']         = MixpanelPeople.prototype.unset;
MixpanelPeople.prototype['increment']     = MixpanelPeople.prototype.increment;
MixpanelPeople.prototype['append']        = MixpanelPeople.prototype.append;
MixpanelPeople.prototype['remove']        = MixpanelPeople.prototype.remove;
MixpanelPeople.prototype['union']         = MixpanelPeople.prototype.union;
MixpanelPeople.prototype['track_charge']  = MixpanelPeople.prototype.track_charge;
MixpanelPeople.prototype['clear_charges'] = MixpanelPeople.prototype.clear_charges;
MixpanelPeople.prototype['delete_user']   = MixpanelPeople.prototype.delete_user;
MixpanelPeople.prototype['toString']      = MixpanelPeople.prototype.toString;

/*
 * Constants
 */
/** @const */ var SET_QUEUE_KEY          = '__mps';
/** @const */ var SET_ONCE_QUEUE_KEY     = '__mpso';
/** @const */ var UNSET_QUEUE_KEY        = '__mpus';
/** @const */ var ADD_QUEUE_KEY          = '__mpa';
/** @const */ var APPEND_QUEUE_KEY       = '__mpap';
/** @const */ var REMOVE_QUEUE_KEY       = '__mpr';
/** @const */ var UNION_QUEUE_KEY        = '__mpu';
// This key is deprecated, but we want to check for it to see whether aliasing is allowed.
/** @const */ var PEOPLE_DISTINCT_ID_KEY = '$people_distinct_id';
/** @const */ var ALIAS_ID_KEY           = '__alias';
/** @const */ var EVENT_TIMERS_KEY       = '__timers';
/** @const */ var RESERVED_PROPERTIES = [
    SET_QUEUE_KEY,
    SET_ONCE_QUEUE_KEY,
    UNSET_QUEUE_KEY,
    ADD_QUEUE_KEY,
    APPEND_QUEUE_KEY,
    REMOVE_QUEUE_KEY,
    UNION_QUEUE_KEY,
    PEOPLE_DISTINCT_ID_KEY,
    ALIAS_ID_KEY,
    EVENT_TIMERS_KEY
];

/**
 * Mixpanel Persistence Object
 * @constructor
 */
var MixpanelPersistence = function(config) {
    this['props'] = {};
    this.campaign_params_saved = false;

    if (config['persistence_name']) {
        this.name = 'mp_' + config['persistence_name'];
    } else {
        this.name = 'mp_' + config['token'] + '_mixpanel';
    }

    var storage_type = config['persistence'];
    if (storage_type !== 'cookie' && storage_type !== 'localStorage') {
        console$1.critical('Unknown persistence type ' + storage_type + '; falling back to cookie');
        storage_type = config['persistence'] = 'cookie';
    }

    if (storage_type === 'localStorage' && _.localStorage.is_supported()) {
        this.storage = _.localStorage;
    } else {
        this.storage = _.cookie;
    }

    this.load();
    this.update_config(config);
    this.upgrade(config);
    this.save();
};

MixpanelPersistence.prototype.properties = function() {
    var p = {};
    // Filter out reserved properties
    _.each(this['props'], function(v, k) {
        if (!_.include(RESERVED_PROPERTIES, k)) {
            p[k] = v;
        }
    });
    return p;
};

MixpanelPersistence.prototype.load = function() {
    if (this.disabled) { return; }

    var entry = this.storage.parse(this.name);

    if (entry) {
        this['props'] = _.extend({}, entry);
    }
};

MixpanelPersistence.prototype.upgrade = function(config) {
    var upgrade_from_old_lib = config['upgrade'],
        old_cookie_name,
        old_cookie;

    if (upgrade_from_old_lib) {
        old_cookie_name = 'mp_super_properties';
        // Case where they had a custom cookie name before.
        if (typeof(upgrade_from_old_lib) === 'string') {
            old_cookie_name = upgrade_from_old_lib;
        }

        old_cookie = this.storage.parse(old_cookie_name);

        // remove the cookie
        this.storage.remove(old_cookie_name);
        this.storage.remove(old_cookie_name, true);

        if (old_cookie) {
            this['props'] = _.extend(
                this['props'],
                old_cookie['all'],
                old_cookie['events']
            );
        }
    }

    if (!config['cookie_name'] && config['name'] !== 'mixpanel') {
        // special case to handle people with cookies of the form
        // mp_TOKEN_INSTANCENAME from the first release of this library
        old_cookie_name = 'mp_' + config['token'] + '_' + config['name'];
        old_cookie = this.storage.parse(old_cookie_name);

        if (old_cookie) {
            this.storage.remove(old_cookie_name);
            this.storage.remove(old_cookie_name, true);

            // Save the prop values that were in the cookie from before -
            // this should only happen once as we delete the old one.
            this.register_once(old_cookie);
        }
    }

    if (this.storage === _.localStorage) {
        old_cookie = _.cookie.parse(this.name);

        _.cookie.remove(this.name);
        _.cookie.remove(this.name, true);

        if (old_cookie) {
            this.register_once(old_cookie);
        }
    }
};

MixpanelPersistence.prototype.save = function() {
    if (this.disabled) { return; }
    this.storage.set(
        this.name,
        _.JSONEncode(this['props']),
        this.expire_days,
        this.cross_subdomain,
        this.secure,
        this.cross_site,
        this.cookie_domain
    );
};

MixpanelPersistence.prototype.remove = function() {
    // remove both domain and subdomain cookies
    this.storage.remove(this.name, false, this.cookie_domain);
    this.storage.remove(this.name, true, this.cookie_domain);
};

// removes the storage entry and deletes all loaded data
// forced name for tests
MixpanelPersistence.prototype.clear = function() {
    this.remove();
    this['props'] = {};
};

/**
* @param {Object} props
* @param {*=} default_value
* @param {number=} days
*/
MixpanelPersistence.prototype.register_once = function(props, default_value, days) {
    if (_.isObject(props)) {
        if (typeof(default_value) === 'undefined') { default_value = 'None'; }
        this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

        _.each(props, function(val, prop) {
            if (!this['props'].hasOwnProperty(prop) || this['props'][prop] === default_value) {
                this['props'][prop] = val;
            }
        }, this);

        this.save();

        return true;
    }
    return false;
};

/**
* @param {Object} props
* @param {number=} days
*/
MixpanelPersistence.prototype.register = function(props, days) {
    if (_.isObject(props)) {
        this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

        _.extend(this['props'], props);

        this.save();

        return true;
    }
    return false;
};

MixpanelPersistence.prototype.unregister = function(prop) {
    if (prop in this['props']) {
        delete this['props'][prop];
        this.save();
    }
};

MixpanelPersistence.prototype.update_search_keyword = function(referrer) {
    this.register(_.info.searchInfo(referrer));
};

// EXPORTED METHOD, we test this directly.
MixpanelPersistence.prototype.update_referrer_info = function(referrer) {
    // If referrer doesn't exist, we want to note the fact that it was type-in traffic.
    this.register_once({
        '$initial_referrer': referrer || '$direct',
        '$initial_referring_domain': _.info.referringDomain(referrer) || '$direct'
    }, '');
};

MixpanelPersistence.prototype.get_referrer_info = function() {
    return _.strip_empty_properties({
        '$initial_referrer': this['props']['$initial_referrer'],
        '$initial_referring_domain': this['props']['$initial_referring_domain']
    });
};

// safely fills the passed in object with stored properties,
// does not override any properties defined in both
// returns the passed in object
MixpanelPersistence.prototype.safe_merge = function(props) {
    _.each(this['props'], function(val, prop) {
        if (!(prop in props)) {
            props[prop] = val;
        }
    });

    return props;
};

MixpanelPersistence.prototype.update_config = function(config) {
    this.default_expiry = this.expire_days = config['cookie_expiration'];
    this.set_disabled(config['disable_persistence']);
    this.set_cookie_domain(config['cookie_domain']);
    this.set_cross_site(config['cross_site_cookie']);
    this.set_cross_subdomain(config['cross_subdomain_cookie']);
    this.set_secure(config['secure_cookie']);
};

MixpanelPersistence.prototype.set_disabled = function(disabled) {
    this.disabled = disabled;
    if (this.disabled) {
        this.remove();
    } else {
        this.save();
    }
};

MixpanelPersistence.prototype.set_cookie_domain = function(cookie_domain) {
    if (cookie_domain !== this.cookie_domain) {
        this.remove();
        this.cookie_domain = cookie_domain;
        this.save();
    }
};

MixpanelPersistence.prototype.set_cross_site = function(cross_site) {
    if (cross_site !== this.cross_site) {
        this.cross_site = cross_site;
        this.remove();
        this.save();
    }
};

MixpanelPersistence.prototype.set_cross_subdomain = function(cross_subdomain) {
    if (cross_subdomain !== this.cross_subdomain) {
        this.cross_subdomain = cross_subdomain;
        this.remove();
        this.save();
    }
};

MixpanelPersistence.prototype.get_cross_subdomain = function() {
    return this.cross_subdomain;
};

MixpanelPersistence.prototype.set_secure = function(secure) {
    if (secure !== this.secure) {
        this.secure = secure ? true : false;
        this.remove();
        this.save();
    }
};

MixpanelPersistence.prototype._add_to_people_queue = function(queue, data) {
    var q_key = this._get_queue_key(queue),
        q_data = data[queue],
        set_q = this._get_or_create_queue(SET_ACTION),
        set_once_q = this._get_or_create_queue(SET_ONCE_ACTION),
        unset_q = this._get_or_create_queue(UNSET_ACTION),
        add_q = this._get_or_create_queue(ADD_ACTION),
        union_q = this._get_or_create_queue(UNION_ACTION),
        remove_q = this._get_or_create_queue(REMOVE_ACTION, []),
        append_q = this._get_or_create_queue(APPEND_ACTION, []);

    if (q_key === SET_QUEUE_KEY) {
        // Update the set queue - we can override any existing values
        _.extend(set_q, q_data);
        // if there was a pending increment, override it
        // with the set.
        this._pop_from_people_queue(ADD_ACTION, q_data);
        // if there was a pending union, override it
        // with the set.
        this._pop_from_people_queue(UNION_ACTION, q_data);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === SET_ONCE_QUEUE_KEY) {
        // only queue the data if there is not already a set_once call for it.
        _.each(q_data, function(v, k) {
            if (!(k in set_once_q)) {
                set_once_q[k] = v;
            }
        });
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === UNSET_QUEUE_KEY) {
        _.each(q_data, function(prop) {

            // undo previously-queued actions on this key
            _.each([set_q, set_once_q, add_q, union_q], function(enqueued_obj) {
                if (prop in enqueued_obj) {
                    delete enqueued_obj[prop];
                }
            });
            _.each(append_q, function(append_obj) {
                if (prop in append_obj) {
                    delete append_obj[prop];
                }
            });

            unset_q[prop] = true;

        });
    } else if (q_key === ADD_QUEUE_KEY) {
        _.each(q_data, function(v, k) {
            // If it exists in the set queue, increment
            // the value
            if (k in set_q) {
                set_q[k] += v;
            } else {
                // If it doesn't exist, update the add
                // queue
                if (!(k in add_q)) {
                    add_q[k] = 0;
                }
                add_q[k] += v;
            }
        }, this);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === UNION_QUEUE_KEY) {
        _.each(q_data, function(v, k) {
            if (_.isArray(v)) {
                if (!(k in union_q)) {
                    union_q[k] = [];
                }
                // We may send duplicates, the server will dedup them.
                union_q[k] = union_q[k].concat(v);
            }
        });
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === REMOVE_QUEUE_KEY) {
        remove_q.push(q_data);
        this._pop_from_people_queue(APPEND_ACTION, q_data);
    } else if (q_key === APPEND_QUEUE_KEY) {
        append_q.push(q_data);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    }

    console$1.log('MIXPANEL PEOPLE REQUEST (QUEUED, PENDING IDENTIFY):');
    console$1.log(data);

    this.save();
};

MixpanelPersistence.prototype._pop_from_people_queue = function(queue, data) {
    var q = this._get_queue(queue);
    if (!_.isUndefined(q)) {
        _.each(data, function(v, k) {
            if (queue === APPEND_ACTION || queue === REMOVE_ACTION) {
                // list actions: only remove if both k+v match
                // e.g. remove should not override append in a case like
                // append({foo: 'bar'}); remove({foo: 'qux'})
                _.each(q, function(queued_action) {
                    if (queued_action[k] === v) {
                        delete queued_action[k];
                    }
                });
            } else {
                delete q[k];
            }
        }, this);

        this.save();
    }
};

MixpanelPersistence.prototype._get_queue_key = function(queue) {
    if (queue === SET_ACTION) {
        return SET_QUEUE_KEY;
    } else if (queue === SET_ONCE_ACTION) {
        return SET_ONCE_QUEUE_KEY;
    } else if (queue === UNSET_ACTION) {
        return UNSET_QUEUE_KEY;
    } else if (queue === ADD_ACTION) {
        return ADD_QUEUE_KEY;
    } else if (queue === APPEND_ACTION) {
        return APPEND_QUEUE_KEY;
    } else if (queue === REMOVE_ACTION) {
        return REMOVE_QUEUE_KEY;
    } else if (queue === UNION_ACTION) {
        return UNION_QUEUE_KEY;
    } else {
        console$1.error('Invalid queue:', queue);
    }
};

MixpanelPersistence.prototype._get_queue = function(queue) {
    return this['props'][this._get_queue_key(queue)];
};
MixpanelPersistence.prototype._get_or_create_queue = function(queue, default_val) {
    var key = this._get_queue_key(queue);
    default_val = _.isUndefined(default_val) ? {} : default_val;

    return this['props'][key] || (this['props'][key] = default_val);
};

MixpanelPersistence.prototype.set_event_timer = function(event_name, timestamp) {
    var timers = this['props'][EVENT_TIMERS_KEY] || {};
    timers[event_name] = timestamp;
    this['props'][EVENT_TIMERS_KEY] = timers;
    this.save();
};

MixpanelPersistence.prototype.remove_event_timer = function(event_name) {
    var timers = this['props'][EVENT_TIMERS_KEY] || {};
    var timestamp = timers[event_name];
    if (!_.isUndefined(timestamp)) {
        delete this['props'][EVENT_TIMERS_KEY][event_name];
        this.save();
    }
    return timestamp;
};

/*
 * Mixpanel JS Library
 *
 * Copyright 2012, Mixpanel, Inc. All Rights Reserved
 * http://mixpanel.com/
 *
 * Includes portions of Underscore.js
 * http://documentcloud.github.com/underscore/
 * (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
 * Released under the MIT License.
 */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name mixpanel-2.8.min.js
// ==/ClosureCompiler==

/*
SIMPLE STYLE GUIDE:

this.x === public function
this._x === internal - only use within this file
this.__x === private - only use within the class

Globals should be all caps
*/

var init_type;       // MODULE or SNIPPET loader
var mixpanel_master; // main mixpanel instance / object
var INIT_MODULE  = 0;
var INIT_SNIPPET = 1;

var IDENTITY_FUNC = function(x) {return x;};
var NOOP_FUNC = function() {};

/** @const */ var PRIMARY_INSTANCE_NAME = 'mixpanel';
/** @const */ var PAYLOAD_TYPE_BASE64   = 'base64';
/** @const */ var PAYLOAD_TYPE_JSON     = 'json';
/** @const */ var DEVICE_ID_PREFIX      = '$device:';


/*
 * Dynamic... constants? Is that an oxymoron?
 */
// http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
// https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#withCredentials
var USE_XHR = (window$1.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest());

// IE<10 does not support cross-origin XHR's but script tags
// with defer won't block window.onload; ENQUEUE_REQUESTS
// should only be true for Opera<12
var ENQUEUE_REQUESTS = !USE_XHR && (userAgent.indexOf('MSIE') === -1) && (userAgent.indexOf('Mozilla') === -1);

// save reference to navigator.sendBeacon so it can be minified
var sendBeacon = null;
if (navigator['sendBeacon']) {
    sendBeacon = function() {
        // late reference to navigator.sendBeacon to allow patching/spying
        return navigator['sendBeacon'].apply(navigator, arguments);
    };
}

/*
 * Module-level globals
 */
var DEFAULT_CONFIG = {
    'api_host':                          'https://api-js.mixpanel.com',
    'api_method':                        'POST',
    'api_transport':                     'XHR',
    'api_payload_format':                PAYLOAD_TYPE_BASE64,
    'app_host':                          'https://mixpanel.com',
    'cdn':                               'https://cdn.mxpnl.com',
    'cross_site_cookie':                 false,
    'cross_subdomain_cookie':            true,
    'error_reporter':                    NOOP_FUNC,
    'persistence':                       'cookie',
    'persistence_name':                  '',
    'cookie_domain':                     '',
    'cookie_name':                       '',
    'loaded':                            NOOP_FUNC,
    'track_marketing':                   true,
    'track_pageview':                    false,
    'skip_first_touch_marketing':        false,
    'store_google':                      true,
    'save_referrer':                     true,
    'test':                              false,
    'verbose':                           false,
    'img':                               false,
    'debug':                             false,
    'track_links_timeout':               300,
    'cookie_expiration':                 365,
    'upgrade':                           false,
    'disable_persistence':               false,
    'disable_cookie':                    false,
    'secure_cookie':                     false,
    'ip':                                true,
    'opt_out_tracking_by_default':       false,
    'opt_out_persistence_by_default':    false,
    'opt_out_tracking_persistence_type': 'localStorage',
    'opt_out_tracking_cookie_prefix':    null,
    'property_blacklist':                [],
    'xhr_headers':                       {}, // { header: value, header2: value }
    'ignore_dnt':                        false,
    'batch_requests':                    true,
    'batch_size':                        50,
    'batch_flush_interval_ms':           5000,
    'batch_request_timeout_ms':          90000,
    'batch_autostart':                   true,
    'hooks':                             {}
};

var DOM_LOADED = false;

/**
 * Mixpanel Library Object
 * @constructor
 */
var MixpanelLib = function() {};


/**
 * create_mplib(token:string, config:object, name:string)
 *
 * This function is used by the init method of MixpanelLib objects
 * as well as the main initializer at the end of the JSLib (that
 * initializes document.mixpanel as well as any additional instances
 * declared before this file has loaded).
 */
var create_mplib = function(token, config, name) {
    var instance,
        target = (name === PRIMARY_INSTANCE_NAME) ? mixpanel_master : mixpanel_master[name];

    if (target && init_type === INIT_MODULE) {
        instance = target;
    } else {
        if (target && !_.isArray(target)) {
            console$1.error('You have already initialized ' + name);
            return;
        }
        instance = new MixpanelLib();
    }

    instance._cached_groups = {}; // cache groups in a pool

    instance._init(token, config, name);

    instance['people'] = new MixpanelPeople();
    instance['people']._init(instance);

    if (!instance.get_config('skip_first_touch_marketing')) {
        // We need null UTM params in the object because
        // UTM parameters act as a tuple. If any UTM param
        // is present, then we set all UTM params including
        // empty ones together
        var utm_params = _.info.campaignParams(null);
        var initial_utm_params = {};
        var has_utm = false;
        _.each(utm_params, function(utm_value, utm_key) {
            initial_utm_params['initial_' + utm_key] = utm_value;
            if (utm_value) {
                has_utm = true;
            }
        });
        if (has_utm) {
            instance['people'].set_once(initial_utm_params);
        }
    }

    // if any instance on the page has debug = true, we set the
    // global debug to be true
    Config.DEBUG = Config.DEBUG || instance.get_config('debug');

    // if target is not defined, we called init after the lib already
    // loaded, so there won't be an array of things to execute
    if (!_.isUndefined(target) && _.isArray(target)) {
        // Crunch through the people queue first - we queue this data up &
        // flush on identify, so it's better to do all these operations first
        instance._execute_array.call(instance['people'], target['people']);
        instance._execute_array(target);
    }

    return instance;
};

// Initialization methods

/**
 * This function initializes a new instance of the Mixpanel tracking object.
 * All new instances are added to the main mixpanel object as sub properties (such as
 * mixpanel.library_name) and also returned by this function. To define a
 * second instance on the page, you would call:
 *
 *     mixpanel.init('new token', { your: 'config' }, 'library_name');
 *
 * and use it like so:
 *
 *     mixpanel.library_name.track(...);
 *
 * @param {String} token   Your Mixpanel API token
 * @param {Object} [config]  A dictionary of config options to override. <a href="https://github.com/mixpanel/mixpanel-js/blob/v2.46.0/src/mixpanel-core.js#L88-L127">See a list of default config options</a>.
 * @param {String} [name]    The name for the new mixpanel instance that you want created
 */
MixpanelLib.prototype.init = function (token, config, name) {
    if (_.isUndefined(name)) {
        this.report_error('You must name your new library: init(token, config, name)');
        return;
    }
    if (name === PRIMARY_INSTANCE_NAME) {
        this.report_error('You must initialize the main mixpanel object right after you include the Mixpanel js snippet');
        return;
    }

    var instance = create_mplib(token, config, name);
    mixpanel_master[name] = instance;
    instance._loaded();

    return instance;
};

// mixpanel._init(token:string, config:object, name:string)
//
// This function sets up the current instance of the mixpanel
// library.  The difference between this method and the init(...)
// method is this one initializes the actual instance, whereas the
// init(...) method sets up a new library and calls _init on it.
//
MixpanelLib.prototype._init = function(token, config, name) {
    config = config || {};

    this['__loaded'] = true;
    this['config'] = {};

    var variable_features = {};

    // default to JSON payload for standard mixpanel.com API hosts
    if (!('api_payload_format' in config)) {
        var api_host = config['api_host'] || DEFAULT_CONFIG['api_host'];
        if (api_host.match(/\.mixpanel\.com/)) {
            variable_features['api_payload_format'] = PAYLOAD_TYPE_JSON;
        }
    }

    this.set_config(_.extend({}, DEFAULT_CONFIG, variable_features, config, {
        'name': name,
        'token': token,
        'callback_fn': ((name === PRIMARY_INSTANCE_NAME) ? name : PRIMARY_INSTANCE_NAME + '.' + name) + '._jsc'
    }));

    this['_jsc'] = NOOP_FUNC;

    this.__dom_loaded_queue = [];
    this.__request_queue = [];
    this.__disabled_events = [];
    this._flags = {
        'disable_all_events': false,
        'identify_called': false
    };

    // set up request queueing/batching
    this.request_batchers = {};
    this._batch_requests = this.get_config('batch_requests');
    if (this._batch_requests) {
        if (!_.localStorage.is_supported(true) || !USE_XHR) {
            this._batch_requests = false;
            console$1.log('Turning off Mixpanel request-queueing; needs XHR and localStorage support');
        } else {
            this.init_batchers();
            if (sendBeacon && window$1.addEventListener) {
                // Before page closes or hides (user tabs away etc), attempt to flush any events
                // queued up via navigator.sendBeacon. Since sendBeacon doesn't report success/failure,
                // events will not be removed from the persistent store; if the site is loaded again,
                // the events will be flushed again on startup and deduplicated on the Mixpanel server
                // side.
                // There is no reliable way to capture only page close events, so we lean on the
                // visibilitychange and pagehide events as recommended at
                // https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event#usage_notes.
                // These events fire when the user clicks away from the current page/tab, so will occur
                // more frequently than page unload, but are the only mechanism currently for capturing
                // this scenario somewhat reliably.
                var flush_on_unload = _.bind(function() {
                    if (!this.request_batchers.events.stopped) {
                        this.request_batchers.events.flush({unloading: true});
                    }
                }, this);
                window$1.addEventListener('pagehide', function(ev) {
                    if (ev['persisted']) {
                        flush_on_unload();
                    }
                });
                window$1.addEventListener('visibilitychange', function() {
                    if (document$1['visibilityState'] === 'hidden') {
                        flush_on_unload();
                    }
                });
            }
        }
    }

    this['persistence'] = this['cookie'] = new MixpanelPersistence(this['config']);
    this.unpersisted_superprops = {};
    this._gdpr_init();

    var uuid = _.UUID();
    if (!this.get_distinct_id()) {
        // There is no need to set the distinct id
        // or the device id if something was already stored
        // in the persitence
        this.register_once({
            'distinct_id': DEVICE_ID_PREFIX + uuid,
            '$device_id': uuid
        }, '');
    }

    if (this.get_config('track_pageview')) {
        this.track_pageview();
    }
};

// Private methods

MixpanelLib.prototype._loaded = function() {
    this.get_config('loaded')(this);
    this._set_default_superprops();
};

// update persistence with info on referrer, UTM params, etc
MixpanelLib.prototype._set_default_superprops = function() {
    this['persistence'].update_search_keyword(document$1.referrer);
    if (this.get_config('store_google')) {
        this.register(_.info.campaignParams(), {persistent: false});
    }
    if (this.get_config('save_referrer')) {
        this['persistence'].update_referrer_info(document$1.referrer);
    }
};

MixpanelLib.prototype._dom_loaded = function() {
    _.each(this.__dom_loaded_queue, function(item) {
        this._track_dom.apply(this, item);
    }, this);

    if (!this.has_opted_out_tracking()) {
        _.each(this.__request_queue, function(item) {
            this._send_request.apply(this, item);
        }, this);
    }

    delete this.__dom_loaded_queue;
    delete this.__request_queue;
};

MixpanelLib.prototype._track_dom = function(DomClass, args) {
    if (this.get_config('img')) {
        this.report_error('You can\'t use DOM tracking functions with img = true.');
        return false;
    }

    if (!DOM_LOADED) {
        this.__dom_loaded_queue.push([DomClass, args]);
        return false;
    }

    var dt = new DomClass().init(this);
    return dt.track.apply(dt, args);
};

/**
 * _prepare_callback() should be called by callers of _send_request for use
 * as the callback argument.
 *
 * If there is no callback, this returns null.
 * If we are going to make XHR/XDR requests, this returns a function.
 * If we are going to use script tags, this returns a string to use as the
 * callback GET param.
 */
MixpanelLib.prototype._prepare_callback = function(callback, data) {
    if (_.isUndefined(callback)) {
        return null;
    }

    if (USE_XHR) {
        var callback_function = function(response) {
            callback(response, data);
        };
        return callback_function;
    } else {
        // if the user gives us a callback, we store as a random
        // property on this instances jsc function and update our
        // callback string to reflect that.
        var jsc = this['_jsc'];
        var randomized_cb = '' + Math.floor(Math.random() * 100000000);
        var callback_string = this.get_config('callback_fn') + '[' + randomized_cb + ']';
        jsc[randomized_cb] = function(response) {
            delete jsc[randomized_cb];
            callback(response, data);
        };
        return callback_string;
    }
};

MixpanelLib.prototype._send_request = function(url, data, options, callback) {
    var succeeded = true;

    if (ENQUEUE_REQUESTS) {
        this.__request_queue.push(arguments);
        return succeeded;
    }

    var DEFAULT_OPTIONS = {
        method: this.get_config('api_method'),
        transport: this.get_config('api_transport'),
        verbose: this.get_config('verbose')
    };
    var body_data = null;

    if (!callback && (_.isFunction(options) || typeof options === 'string')) {
        callback = options;
        options = null;
    }
    options = _.extend(DEFAULT_OPTIONS, options || {});
    if (!USE_XHR) {
        options.method = 'GET';
    }
    var use_post = options.method === 'POST';
    var use_sendBeacon = sendBeacon && use_post && options.transport.toLowerCase() === 'sendbeacon';

    // needed to correctly format responses
    var verbose_mode = options.verbose;
    if (data['verbose']) { verbose_mode = true; }

    if (this.get_config('test')) { data['test'] = 1; }
    if (verbose_mode) { data['verbose'] = 1; }
    if (this.get_config('img')) { data['img'] = 1; }
    if (!USE_XHR) {
        if (callback) {
            data['callback'] = callback;
        } else if (verbose_mode || this.get_config('test')) {
            // Verbose output (from verbose mode, or an error in test mode) is a json blob,
            // which by itself is not valid javascript. Without a callback, this verbose output will
            // cause an error when returned via jsonp, so we force a no-op callback param.
            // See the ECMA script spec: http://www.ecma-international.org/ecma-262/5.1/#sec-12.4
            data['callback'] = '(function(){})';
        }
    }

    data['ip'] = this.get_config('ip')?1:0;
    data['_'] = new Date().getTime().toString();

    if (use_post) {
        body_data = 'data=' + encodeURIComponent(data['data']);
        delete data['data'];
    }

    url += '?' + _.HTTPBuildQuery(data);

    var lib = this;
    if ('img' in data) {
        var img = document$1.createElement('img');
        img.src = url;
        document$1.body.appendChild(img);
    } else if (use_sendBeacon) {
        try {
            succeeded = sendBeacon(url, body_data);
        } catch (e) {
            lib.report_error(e);
            succeeded = false;
        }
        try {
            if (callback) {
                callback(succeeded ? 1 : 0);
            }
        } catch (e) {
            lib.report_error(e);
        }
    } else if (USE_XHR) {
        try {
            var req = new XMLHttpRequest();
            req.open(options.method, url, true);

            var headers = this.get_config('xhr_headers');
            if (use_post) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
            _.each(headers, function(headerValue, headerName) {
                req.setRequestHeader(headerName, headerValue);
            });

            if (options.timeout_ms && typeof req.timeout !== 'undefined') {
                req.timeout = options.timeout_ms;
                var start_time = new Date().getTime();
            }

            // send the mp_optout cookie
            // withCredentials cannot be modified until after calling .open on Android and Mobile Safari
            req.withCredentials = true;
            req.onreadystatechange = function () {
                if (req.readyState === 4) { // XMLHttpRequest.DONE == 4, except in safari 4
                    if (req.status === 200) {
                        if (callback) {
                            if (verbose_mode) {
                                var response;
                                try {
                                    response = _.JSONDecode(req.responseText);
                                } catch (e) {
                                    lib.report_error(e);
                                    if (options.ignore_json_errors) {
                                        response = req.responseText;
                                    } else {
                                        return;
                                    }
                                }
                                callback(response);
                            } else {
                                callback(Number(req.responseText));
                            }
                        }
                    } else {
                        var error;
                        if (
                            req.timeout &&
                            !req.status &&
                            new Date().getTime() - start_time >= req.timeout
                        ) {
                            error = 'timeout';
                        } else {
                            error = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                        }
                        lib.report_error(error);
                        if (callback) {
                            if (verbose_mode) {
                                callback({status: 0, error: error, xhr_req: req});
                            } else {
                                callback(0);
                            }
                        }
                    }
                }
            };
            req.send(body_data);
        } catch (e) {
            lib.report_error(e);
            succeeded = false;
        }
    } else {
        var script = document$1.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = url;
        var s = document$1.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(script, s);
    }

    return succeeded;
};

/**
 * _execute_array() deals with processing any mixpanel function
 * calls that were called before the Mixpanel library were loaded
 * (and are thus stored in an array so they can be called later)
 *
 * Note: we fire off all the mixpanel function calls && user defined
 * functions BEFORE we fire off mixpanel tracking calls. This is so
 * identify/register/set_config calls can properly modify early
 * tracking calls.
 *
 * @param {Array} array
 */
MixpanelLib.prototype._execute_array = function(array) {
    var fn_name, alias_calls = [], other_calls = [], tracking_calls = [];
    _.each(array, function(item) {
        if (item) {
            fn_name = item[0];
            if (_.isArray(fn_name)) {
                tracking_calls.push(item); // chained call e.g. mixpanel.get_group().set()
            } else if (typeof(item) === 'function') {
                item.call(this);
            } else if (_.isArray(item) && fn_name === 'alias') {
                alias_calls.push(item);
            } else if (_.isArray(item) && fn_name.indexOf('track') !== -1 && typeof(this[fn_name]) === 'function') {
                tracking_calls.push(item);
            } else {
                other_calls.push(item);
            }
        }
    }, this);

    var execute = function(calls, context) {
        _.each(calls, function(item) {
            if (_.isArray(item[0])) {
                // chained call
                var caller = context;
                _.each(item, function(call) {
                    caller = caller[call[0]].apply(caller, call.slice(1));
                });
            } else {
                this[item[0]].apply(this, item.slice(1));
            }
        }, context);
    };

    execute(alias_calls, this);
    execute(other_calls, this);
    execute(tracking_calls, this);
};

// request queueing utils

MixpanelLib.prototype.are_batchers_initialized = function() {
    return !!this.request_batchers.events;
};

MixpanelLib.prototype.init_batchers = function() {
    var token = this.get_config('token');
    if (!this.are_batchers_initialized()) {
        var batcher_for = _.bind(function(attrs) {
            return new RequestBatcher(
                '__mpq_' + token + attrs.queue_suffix,
                {
                    libConfig: this['config'],
                    sendRequestFunc: _.bind(function(data, options, cb) {
                        this._send_request(
                            this.get_config('api_host') + attrs.endpoint,
                            this._encode_data_for_request(data),
                            options,
                            this._prepare_callback(cb, data)
                        );
                    }, this),
                    beforeSendHook: _.bind(function(item) {
                        return this._run_hook('before_send_' + attrs.type, item);
                    }, this),
                    errorReporter: this.get_config('error_reporter'),
                    stopAllBatchingFunc: _.bind(this.stop_batch_senders, this)
                }
            );
        }, this);
        this.request_batchers = {
            events: batcher_for({type: 'events', endpoint: '/track/', queue_suffix: '_ev'}),
            people: batcher_for({type: 'people', endpoint: '/engage/', queue_suffix: '_pp'}),
            groups: batcher_for({type: 'groups', endpoint: '/groups/', queue_suffix: '_gr'})
        };
    }
    if (this.get_config('batch_autostart')) {
        this.start_batch_senders();
    }
};

MixpanelLib.prototype.start_batch_senders = function() {
    if (this.are_batchers_initialized()) {
        this._batch_requests = true;
        _.each(this.request_batchers, function(batcher) {
            batcher.start();
        });
    }
};

MixpanelLib.prototype.stop_batch_senders = function() {
    this._batch_requests = false;
    _.each(this.request_batchers, function(batcher) {
        batcher.stop();
        batcher.clear();
    });
};

/**
 * push() keeps the standard async-array-push
 * behavior around after the lib is loaded.
 * This is only useful for external integrations that
 * do not wish to rely on our convenience methods
 * (created in the snippet).
 *
 * ### Usage:
 *     mixpanel.push(['register', { a: 'b' }]);
 *
 * @param {Array} item A [function_name, args...] array to be executed
 */
MixpanelLib.prototype.push = function(item) {
    this._execute_array([item]);
};

/**
 * Disable events on the Mixpanel object. If passed no arguments,
 * this function disables tracking of any event. If passed an
 * array of event names, those events will be disabled, but other
 * events will continue to be tracked.
 *
 * Note: this function does not stop other mixpanel functions from
 * firing, such as register() or people.set().
 *
 * @param {Array} [events] An array of event names to disable
 */
MixpanelLib.prototype.disable = function(events) {
    if (typeof(events) === 'undefined') {
        this._flags.disable_all_events = true;
    } else {
        this.__disabled_events = this.__disabled_events.concat(events);
    }
};

MixpanelLib.prototype._encode_data_for_request = function(data) {
    var encoded_data = _.JSONEncode(data);
    if (this.get_config('api_payload_format') === PAYLOAD_TYPE_BASE64) {
        encoded_data = _.base64Encode(encoded_data);
    }
    return {'data': encoded_data};
};

// internal method for handling track vs batch-enqueue logic
MixpanelLib.prototype._track_or_batch = function(options, callback) {
    var truncated_data = _.truncate(options.data, 255);
    var endpoint = options.endpoint;
    var batcher = options.batcher;
    var should_send_immediately = options.should_send_immediately;
    var send_request_options = options.send_request_options || {};
    callback = callback || NOOP_FUNC;

    var request_enqueued_or_initiated = true;
    var send_request_immediately = _.bind(function() {
        if (!send_request_options.skip_hooks) {
            truncated_data = this._run_hook('before_send_' + options.type, truncated_data);
        }
        if (truncated_data) {
            console$1.log('MIXPANEL REQUEST:');
            console$1.log(truncated_data);
            return this._send_request(
                endpoint,
                this._encode_data_for_request(truncated_data),
                send_request_options,
                this._prepare_callback(callback, truncated_data)
            );
        } else {
            return null;
        }
    }, this);

    if (this._batch_requests && !should_send_immediately) {
        batcher.enqueue(truncated_data, function(succeeded) {
            if (succeeded) {
                callback(1, truncated_data);
            } else {
                send_request_immediately();
            }
        });
    } else {
        request_enqueued_or_initiated = send_request_immediately();
    }

    return request_enqueued_or_initiated && truncated_data;
};

/**
 * Track an event. This is the most important and
 * frequently used Mixpanel function.
 *
 * ### Usage:
 *
 *     // track an event named 'Registered'
 *     mixpanel.track('Registered', {'Gender': 'Male', 'Age': 21});
 *
 *     // track an event using navigator.sendBeacon
 *     mixpanel.track('Left page', {'duration_seconds': 35}, {transport: 'sendBeacon'});
 *
 * To track link clicks or form submissions, see track_links() or track_forms().
 *
 * @param {String} event_name The name of the event. This can be anything the user does - 'Button Click', 'Sign Up', 'Item Purchased', etc.
 * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
 * @param {Object} [options] Optional configuration for this track request.
 * @param {String} [options.transport] Transport method for network request ('xhr' or 'sendBeacon').
 * @param {Boolean} [options.send_immediately] Whether to bypass batching/queueing and send track request immediately.
 * @param {Function} [callback] If provided, the callback function will be called after tracking the event.
 * @returns {Boolean|Object} If the tracking request was successfully initiated/queued, an object
 * with the tracking payload sent to the API server is returned; otherwise false.
 */
MixpanelLib.prototype.track = addOptOutCheckMixpanelLib(function(event_name, properties, options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};
    var transport = options['transport']; // external API, don't minify 'transport' prop
    if (transport) {
        options.transport = transport; // 'transport' prop name can be minified internally
    }
    var should_send_immediately = options['send_immediately'];
    if (typeof callback !== 'function') {
        callback = NOOP_FUNC;
    }

    if (_.isUndefined(event_name)) {
        this.report_error('No event name provided to mixpanel.track');
        return;
    }

    if (this._event_is_disabled(event_name)) {
        callback(0);
        return;
    }

    // set defaults
    properties = properties || {};
    properties['token'] = this.get_config('token');

    // set $duration if time_event was previously called for this event
    var start_timestamp = this['persistence'].remove_event_timer(event_name);
    if (!_.isUndefined(start_timestamp)) {
        var duration_in_ms = new Date().getTime() - start_timestamp;
        properties['$duration'] = parseFloat((duration_in_ms / 1000).toFixed(3));
    }

    this._set_default_superprops();

    var marketing_properties = this.get_config('track_marketing')
        ? _.info.marketingParams()
        : {};

    // note: extend writes to the first object, so lets make sure we
    // don't write to the persistence properties object and info
    // properties object by passing in a new object

    // update properties with pageview info and super-properties
    properties = _.extend(
        {},
        _.info.properties(),
        marketing_properties,
        this['persistence'].properties(),
        this.unpersisted_superprops,
        properties
    );

    var property_blacklist = this.get_config('property_blacklist');
    if (_.isArray(property_blacklist)) {
        _.each(property_blacklist, function(blacklisted_prop) {
            delete properties[blacklisted_prop];
        });
    } else {
        this.report_error('Invalid value for property_blacklist config: ' + property_blacklist);
    }

    var data = {
        'event': event_name,
        'properties': properties
    };
    var ret = this._track_or_batch({
        type: 'events',
        data: data,
        endpoint: this.get_config('api_host') + '/track/',
        batcher: this.request_batchers.events,
        should_send_immediately: should_send_immediately,
        send_request_options: options
    }, callback);

    return ret;
});

/**
 * Register the current user into one/many groups.
 *
 * ### Usage:
 *
 *      mixpanel.set_group('company', ['mixpanel', 'google']) // an array of IDs
 *      mixpanel.set_group('company', 'mixpanel')
 *      mixpanel.set_group('company', 128746312)
 *
 * @param {String} group_key Group key
 * @param {Array|String|Number} group_ids An array of group IDs, or a singular group ID
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 *
 */
MixpanelLib.prototype.set_group = addOptOutCheckMixpanelLib(function(group_key, group_ids, callback) {
    if (!_.isArray(group_ids)) {
        group_ids = [group_ids];
    }
    var prop = {};
    prop[group_key] = group_ids;
    this.register(prop);
    return this['people'].set(group_key, group_ids, callback);
});

/**
 * Add a new group for this user.
 *
 * ### Usage:
 *
 *      mixpanel.add_group('company', 'mixpanel')
 *
 * @param {String} group_key Group key
 * @param {*} group_id A valid Mixpanel property type
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 */
MixpanelLib.prototype.add_group = addOptOutCheckMixpanelLib(function(group_key, group_id, callback) {
    var old_values = this.get_property(group_key);
    if (old_values === undefined) {
        var prop = {};
        prop[group_key] = [group_id];
        this.register(prop);
    } else {
        if (old_values.indexOf(group_id) === -1) {
            old_values.push(group_id);
            this.register(prop);
        }
    }
    return this['people'].union(group_key, group_id, callback);
});

/**
 * Remove a group from this user.
 *
 * ### Usage:
 *
 *      mixpanel.remove_group('company', 'mixpanel')
 *
 * @param {String} group_key Group key
 * @param {*} group_id A valid Mixpanel property type
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 */
MixpanelLib.prototype.remove_group = addOptOutCheckMixpanelLib(function(group_key, group_id, callback) {
    var old_value = this.get_property(group_key);
    // if the value doesn't exist, the persistent store is unchanged
    if (old_value !== undefined) {
        var idx = old_value.indexOf(group_id);
        if (idx > -1) {
            old_value.splice(idx, 1);
            this.register({group_key: old_value});
        }
        if (old_value.length === 0) {
            this.unregister(group_key);
        }
    }
    return this['people'].remove(group_key, group_id, callback);
});

/**
 * Track an event with specific groups.
 *
 * ### Usage:
 *
 *      mixpanel.track_with_groups('purchase', {'product': 'iphone'}, {'University': ['UCB', 'UCLA']})
 *
 * @param {String} event_name The name of the event (see `mixpanel.track()`)
 * @param {Object=} properties A set of properties to include with the event you're sending (see `mixpanel.track()`)
 * @param {Object=} groups An object mapping group name keys to one or more values
 * @param {Function} [callback] If provided, the callback will be called after tracking the event.
 */
MixpanelLib.prototype.track_with_groups = addOptOutCheckMixpanelLib(function(event_name, properties, groups, callback) {
    var tracking_props = _.extend({}, properties || {});
    _.each(groups, function(v, k) {
        if (v !== null && v !== undefined) {
            tracking_props[k] = v;
        }
    });
    return this.track(event_name, tracking_props, callback);
});

MixpanelLib.prototype._create_map_key = function (group_key, group_id) {
    return group_key + '_' + JSON.stringify(group_id);
};

MixpanelLib.prototype._remove_group_from_cache = function (group_key, group_id) {
    delete this._cached_groups[this._create_map_key(group_key, group_id)];
};

/**
 * Look up reference to a Mixpanel group
 *
 * ### Usage:
 *
 *       mixpanel.get_group(group_key, group_id)
 *
 * @param {String} group_key Group key
 * @param {Object} group_id A valid Mixpanel property type
 * @returns {Object} A MixpanelGroup identifier
 */
MixpanelLib.prototype.get_group = function (group_key, group_id) {
    var map_key = this._create_map_key(group_key, group_id);
    var group = this._cached_groups[map_key];
    if (group === undefined || group._group_key !== group_key || group._group_id !== group_id) {
        group = new MixpanelGroup();
        group._init(this, group_key, group_id);
        this._cached_groups[map_key] = group;
    }
    return group;
};

/**
 * Track a default Mixpanel page view event, which includes extra default event properties to
 * improve page view data. The `config.track_pageview` option for <a href="#mixpanelinit">mixpanel.init()</a>
 * may be turned on for tracking page loads automatically.
 *
 * ### Usage
 *
 *     // track a default $mp_web_page_view event
 *     mixpanel.track_pageview();
 *
 *     // track a page view event with additional event properties
 *     mixpanel.track_pageview({'ab_test_variant': 'card-layout-b'});
 *
 *     // example approach to track page views on different page types as event properties
 *     mixpanel.track_pageview({'page': 'pricing'});
 *     mixpanel.track_pageview({'page': 'homepage'});
 *
 *     // UNCOMMON: Tracking a page view event with a custom event_name option. NOT expected to be used for
 *     // individual pages on the same site or product. Use cases for custom event_name may be page
 *     // views on different products or internal applications that are considered completely separate
 *     mixpanel.track_pageview({'page': 'customer-search'}, {'event_name': '[internal] Admin Page View'});
 *
 * @param {Object} [properties] An optional set of additional properties to send with the page view event
 * @param {Object} [options] Page view tracking options
 * @param {String} [options.event_name] - Alternate name for the tracking event
 * @returns {Boolean|Object} If the tracking request was successfully initiated/queued, an object
 * with the tracking payload sent to the API server is returned; otherwise false.
 */
MixpanelLib.prototype.track_pageview = addOptOutCheckMixpanelLib(function(properties, options) {
    if (typeof properties !== 'object') {
        properties = {};
    }
    options = options || {};
    var event_name = options['event_name'] || '$mp_web_page_view';

    var default_page_properties = _.extend(
        _.info.mpPageViewProperties(),
        _.info.campaignParams(),
        _.info.clickParams()
    );

    var event_properties = _.extend(
        {},
        default_page_properties,
        properties
    );

    return this.track(event_name, event_properties);
});

/**
 * Track clicks on a set of document elements. Selector must be a
 * valid query. Elements must exist on the page at the time track_links is called.
 *
 * ### Usage:
 *
 *     // track click for link id #nav
 *     mixpanel.track_links('#nav', 'Clicked Nav Link');
 *
 * ### Notes:
 *
 * This function will wait up to 300 ms for the Mixpanel
 * servers to respond. If they have not responded by that time
 * it will head to the link without ensuring that your event
 * has been tracked.  To configure this timeout please see the
 * set_config() documentation below.
 *
 * If you pass a function in as the properties argument, the
 * function will receive the DOMElement that triggered the
 * event as an argument.  You are expected to return an object
 * from the function; any properties defined on this object
 * will be sent to mixpanel as event properties.
 *
 * @type {Function}
 * @param {Object|String} query A valid DOM query, element or jQuery-esque list
 * @param {String} event_name The name of the event to track
 * @param {Object|Function} [properties] A properties object or function that returns a dictionary of properties when passed a DOMElement
 */
MixpanelLib.prototype.track_links = function() {
    return this._track_dom.call(this, LinkTracker, arguments);
};

/**
 * Track form submissions. Selector must be a valid query.
 *
 * ### Usage:
 *
 *     // track submission for form id 'register'
 *     mixpanel.track_forms('#register', 'Created Account');
 *
 * ### Notes:
 *
 * This function will wait up to 300 ms for the mixpanel
 * servers to respond, if they have not responded by that time
 * it will head to the link without ensuring that your event
 * has been tracked.  To configure this timeout please see the
 * set_config() documentation below.
 *
 * If you pass a function in as the properties argument, the
 * function will receive the DOMElement that triggered the
 * event as an argument.  You are expected to return an object
 * from the function; any properties defined on this object
 * will be sent to mixpanel as event properties.
 *
 * @type {Function}
 * @param {Object|String} query A valid DOM query, element or jQuery-esque list
 * @param {String} event_name The name of the event to track
 * @param {Object|Function} [properties] This can be a set of properties, or a function that returns a set of properties after being passed a DOMElement
 */
MixpanelLib.prototype.track_forms = function() {
    return this._track_dom.call(this, FormTracker, arguments);
};

/**
 * Time an event by including the time between this call and a
 * later 'track' call for the same event in the properties sent
 * with the event.
 *
 * ### Usage:
 *
 *     // time an event named 'Registered'
 *     mixpanel.time_event('Registered');
 *     mixpanel.track('Registered', {'Gender': 'Male', 'Age': 21});
 *
 * When called for a particular event name, the next track call for that event
 * name will include the elapsed time between the 'time_event' and 'track'
 * calls. This value is stored as seconds in the '$duration' property.
 *
 * @param {String} event_name The name of the event.
 */
MixpanelLib.prototype.time_event = function(event_name) {
    if (_.isUndefined(event_name)) {
        this.report_error('No event name provided to mixpanel.time_event');
        return;
    }

    if (this._event_is_disabled(event_name)) {
        return;
    }

    this['persistence'].set_event_timer(event_name,  new Date().getTime());
};

var REGISTER_DEFAULTS = {
    'persistent': true
};
/**
 * Helper to parse options param for register methods, maintaining
 * legacy support for plain "days" param instead of options object
 * @param {Number|Object} [days_or_options] 'days' option (Number), or Options object for register methods
 * @returns {Object} options object
 */
var options_for_register = function(days_or_options) {
    var options;
    if (_.isObject(days_or_options)) {
        options = days_or_options;
    } else if (!_.isUndefined(days_or_options)) {
        options = {'days': days_or_options};
    } else {
        options = {};
    }
    return _.extend({}, REGISTER_DEFAULTS, options);
};

/**
 * Register a set of super properties, which are included with all
 * events. This will overwrite previous super property values.
 *
 * ### Usage:
 *
 *     // register 'Gender' as a super property
 *     mixpanel.register({'Gender': 'Female'});
 *
 *     // register several super properties when a user signs up
 *     mixpanel.register({
 *         'Email': 'jdoe@example.com',
 *         'Account Type': 'Free'
 *     });
 *
 *     // register only for the current pageload
 *     mixpanel.register({'Name': 'Pat'}, {persistent: false});
 *
 * @param {Object} properties An associative array of properties to store about the user
 * @param {Number|Object} [days_or_options] Options object or number of days since the user's last visit to store the super properties (only valid for persisted props)
 * @param {boolean} [days_or_options.days] - number of days since the user's last visit to store the super properties (only valid for persisted props)
 * @param {boolean} [days_or_options.persistent=true] - whether to put in persistent storage (cookie/localStorage)
 */
MixpanelLib.prototype.register = function(props, days_or_options) {
    var options = options_for_register(days_or_options);
    if (options['persistent']) {
        this['persistence'].register(props, options['days']);
    } else {
        _.extend(this.unpersisted_superprops, props);
    }
};

/**
 * Register a set of super properties only once. This will not
 * overwrite previous super property values, unlike register().
 *
 * ### Usage:
 *
 *     // register a super property for the first time only
 *     mixpanel.register_once({
 *         'First Login Date': new Date().toISOString()
 *     });
 *
 *     // register once, only for the current pageload
 *     mixpanel.register_once({
 *         'First interaction time': new Date().toISOString()
 *     }, 'None', {persistent: false});
 *
 * ### Notes:
 *
 * If default_value is specified, current super properties
 * with that value will be overwritten.
 *
 * @param {Object} properties An associative array of properties to store about the user
 * @param {*} [default_value] Value to override if already set in super properties (ex: 'False') Default: 'None'
 * @param {Number|Object} [days_or_options] Options object or number of days since the user's last visit to store the super properties (only valid for persisted props)
 * @param {boolean} [days_or_options.days] - number of days since the user's last visit to store the super properties (only valid for persisted props)
 * @param {boolean} [days_or_options.persistent=true] - whether to put in persistent storage (cookie/localStorage)
 */
MixpanelLib.prototype.register_once = function(props, default_value, days_or_options) {
    var options = options_for_register(days_or_options);
    if (options['persistent']) {
        this['persistence'].register_once(props, default_value, options['days']);
    } else {
        if (typeof(default_value) === 'undefined') {
            default_value = 'None';
        }
        _.each(props, function(val, prop) {
            if (!this.unpersisted_superprops.hasOwnProperty(prop) || this.unpersisted_superprops[prop] === default_value) {
                this.unpersisted_superprops[prop] = val;
            }
        }, this);
    }
};

/**
 * Delete a super property stored with the current user.
 *
 * @param {String} property The name of the super property to remove
 * @param {Object} [options]
 * @param {boolean} [options.persistent=true] - whether to look in persistent storage (cookie/localStorage)
 */
MixpanelLib.prototype.unregister = function(property, options) {
    options = options_for_register(options);
    if (options['persistent']) {
        this['persistence'].unregister(property);
    } else {
        delete this.unpersisted_superprops[property];
    }
};

MixpanelLib.prototype._register_single = function(prop, value) {
    var props = {};
    props[prop] = value;
    this.register(props);
};

/**
 * Identify a user with a unique ID to track user activity across
 * devices, tie a user to their events, and create a user profile.
 * If you never call this method, unique visitors are tracked using
 * a UUID generated the first time they visit the site.
 *
 * Call identify when you know the identity of the current user,
 * typically after login or signup. We recommend against using
 * identify for anonymous visitors to your site.
 *
 * ### Notes:
 * If your project has
 * <a href="https://help.mixpanel.com/hc/en-us/articles/360039133851">ID Merge</a>
 * enabled, the identify method will connect pre- and
 * post-authentication events when appropriate.
 *
 * If your project does not have ID Merge enabled, identify will
 * change the user's local distinct_id to the unique ID you pass.
 * Events tracked prior to authentication will not be connected
 * to the same user identity. If ID Merge is disabled, alias can
 * be used to connect pre- and post-registration events.
 *
 * @param {String} [unique_id] A string that uniquely identifies a user. If not provided, the distinct_id currently in the persistent store (cookie or localStorage) will be used.
 */
MixpanelLib.prototype.identify = function(
    new_distinct_id, _set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback, _remove_callback
) {
    // Optional Parameters
    //  _set_callback:function  A callback to be run if and when the People set queue is flushed
    //  _add_callback:function  A callback to be run if and when the People add queue is flushed
    //  _append_callback:function  A callback to be run if and when the People append queue is flushed
    //  _set_once_callback:function  A callback to be run if and when the People set_once queue is flushed
    //  _union_callback:function  A callback to be run if and when the People union queue is flushed
    //  _unset_callback:function  A callback to be run if and when the People unset queue is flushed

    var previous_distinct_id = this.get_distinct_id();
    if (new_distinct_id && previous_distinct_id !== new_distinct_id) {
        // we allow the following condition if previous distinct_id is same as new_distinct_id
        // so that you can force flush people updates for anonymous profiles.
        if (typeof new_distinct_id === 'string' && new_distinct_id.indexOf(DEVICE_ID_PREFIX) === 0) {
            this.report_error('distinct_id cannot have $device: prefix');
            return -1;
        }
        this.register({'$user_id': new_distinct_id});
    }

    if (!this.get_property('$device_id')) {
        // The persisted distinct id might not actually be a device id at all
        // it might be a distinct id of the user from before
        var device_id = previous_distinct_id;
        this.register_once({
            '$had_persisted_distinct_id': true,
            '$device_id': device_id
        }, '');
    }

    // identify only changes the distinct id if it doesn't match either the existing or the alias;
    // if it's new, blow away the alias as well.
    if (new_distinct_id !== previous_distinct_id && new_distinct_id !== this.get_property(ALIAS_ID_KEY)) {
        this.unregister(ALIAS_ID_KEY);
        this.register({'distinct_id': new_distinct_id});
    }
    this._flags.identify_called = true;
    // Flush any queued up people requests
    this['people']._flush(_set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback, _remove_callback);

    // send an $identify event any time the distinct_id is changing - logic on the server
    // will determine whether or not to do anything with it.
    if (new_distinct_id !== previous_distinct_id) {
        this.track('$identify', {
            'distinct_id': new_distinct_id,
            '$anon_distinct_id': previous_distinct_id
        }, {skip_hooks: true});
    }
};

/**
 * Clears super properties and generates a new random distinct_id for this instance.
 * Useful for clearing data when a user logs out.
 */
MixpanelLib.prototype.reset = function() {
    this['persistence'].clear();
    this._flags.identify_called = false;
    var uuid = _.UUID();
    this.register_once({
        'distinct_id': DEVICE_ID_PREFIX + uuid,
        '$device_id': uuid
    }, '');
};

/**
 * Returns the current distinct id of the user. This is either the id automatically
 * generated by the library or the id that has been passed by a call to identify().
 *
 * ### Notes:
 *
 * get_distinct_id() can only be called after the Mixpanel library has finished loading.
 * init() has a loaded function available to handle this automatically. For example:
 *
 *     // set distinct_id after the mixpanel library has loaded
 *     mixpanel.init('YOUR PROJECT TOKEN', {
 *         loaded: function(mixpanel) {
 *             distinct_id = mixpanel.get_distinct_id();
 *         }
 *     });
 */
MixpanelLib.prototype.get_distinct_id = function() {
    return this.get_property('distinct_id');
};

/**
 * The alias method creates an alias which Mixpanel will use to
 * remap one id to another. Multiple aliases can point to the
 * same identifier.
 *
 * The following is a valid use of alias:
 *
 *     mixpanel.alias('new_id', 'existing_id');
 *     // You can add multiple id aliases to the existing ID
 *     mixpanel.alias('newer_id', 'existing_id');
 *
 * Aliases can also be chained - the following is a valid example:
 *
 *     mixpanel.alias('new_id', 'existing_id');
 *     // chain newer_id - new_id - existing_id
 *     mixpanel.alias('newer_id', 'new_id');
 *
 * Aliases cannot point to multiple identifiers - the following
 * example will not work:
 *
 *     mixpanel.alias('new_id', 'existing_id');
 *     // this is invalid as 'new_id' already points to 'existing_id'
 *     mixpanel.alias('new_id', 'newer_id');
 *
 * ### Notes:
 *
 * If your project does not have
 * <a href="https://help.mixpanel.com/hc/en-us/articles/360039133851">ID Merge</a>
 * enabled, the best practice is to call alias once when a unique
 * ID is first created for a user (e.g., when a user first registers
 * for an account). Do not use alias multiple times for a single
 * user without ID Merge enabled.
 *
 * @param {String} alias A unique identifier that you want to use for this user in the future.
 * @param {String} [original] The current identifier being used for this user.
 */
MixpanelLib.prototype.alias = function(alias, original) {
    // If the $people_distinct_id key exists in persistence, there has been a previous
    // mixpanel.people.identify() call made for this user. It is VERY BAD to make an alias with
    // this ID, as it will duplicate users.
    if (alias === this.get_property(PEOPLE_DISTINCT_ID_KEY)) {
        this.report_error('Attempting to create alias for existing People user - aborting.');
        return -2;
    }

    var _this = this;
    if (_.isUndefined(original)) {
        original = this.get_distinct_id();
    }
    if (alias !== original) {
        this._register_single(ALIAS_ID_KEY, alias);
        return this.track('$create_alias', {
            'alias': alias,
            'distinct_id': original
        }, {
            skip_hooks: true
        }, function() {
            // Flush the people queue
            _this.identify(alias);
        });
    } else {
        this.report_error('alias matches current distinct_id - skipping api call.');
        this.identify(alias);
        return -1;
    }
};

/**
 * Provide a string to recognize the user by. The string passed to
 * this method will appear in the Mixpanel Streams product rather
 * than an automatically generated name. Name tags do not have to
 * be unique.
 *
 * This value will only be included in Streams data.
 *
 * @param {String} name_tag A human readable name for the user
 * @deprecated
 */
MixpanelLib.prototype.name_tag = function(name_tag) {
    this._register_single('mp_name_tag', name_tag);
};

/**
 * Update the configuration of a mixpanel library instance.
 *
 * The default config is:
 *
 *     {
 *       // HTTP method for tracking requests
 *       api_method: 'POST'
 *
 *       // transport for sending requests ('XHR' or 'sendBeacon')
 *       // NB: sendBeacon should only be used for scenarios such as
 *       // page unload where a "best-effort" attempt to send is
 *       // acceptable; the sendBeacon API does not support callbacks
 *       // or any way to know the result of the request. Mixpanel
 *       // tracking via sendBeacon will not support any event-
 *       // batching or retry mechanisms.
 *       api_transport: 'XHR'
 *
 *       // request-batching/queueing/retry
 *       batch_requests: true,
 *
 *       // maximum number of events/updates to send in a single
 *       // network request
 *       batch_size: 50,
 *
 *       // milliseconds to wait between sending batch requests
 *       batch_flush_interval_ms: 5000,
 *
 *       // milliseconds to wait for network responses to batch requests
 *       // before they are considered timed-out and retried
 *       batch_request_timeout_ms: 90000,
 *
 *       // override value for cookie domain, only useful for ensuring
 *       // correct cross-subdomain cookies on unusual domains like
 *       // subdomain.mainsite.avocat.fr; NB this cannot be used to
 *       // set cookies on a different domain than the current origin
 *       cookie_domain: ''
 *
 *       // super properties cookie expiration (in days)
 *       cookie_expiration: 365
 *
 *       // if true, cookie will be set with SameSite=None; Secure
 *       // this is only useful in special situations, like embedded
 *       // 3rd-party iframes that set up a Mixpanel instance
 *       cross_site_cookie: false
 *
 *       // super properties span subdomains
 *       cross_subdomain_cookie: true
 *
 *       // debug mode
 *       debug: false
 *
 *       // if this is true, the mixpanel cookie or localStorage entry
 *       // will be deleted, and no user persistence will take place
 *       disable_persistence: false
 *
 *       // if this is true, Mixpanel will automatically determine
 *       // City, Region and Country data using the IP address of
 *       //the client
 *       ip: true
 *
 *       // opt users out of tracking by this Mixpanel instance by default
 *       opt_out_tracking_by_default: false
 *
 *       // opt users out of browser data storage by this Mixpanel instance by default
 *       opt_out_persistence_by_default: false
 *
 *       // persistence mechanism used by opt-in/opt-out methods - cookie
 *       // or localStorage - falls back to cookie if localStorage is unavailable
 *       opt_out_tracking_persistence_type: 'localStorage'
 *
 *       // customize the name of cookie/localStorage set by opt-in/opt-out methods
 *       opt_out_tracking_cookie_prefix: null
 *
 *       // type of persistent store for super properties (cookie/
 *       // localStorage) if set to 'localStorage', any existing
 *       // mixpanel cookie value with the same persistence_name
 *       // will be transferred to localStorage and deleted
 *       persistence: 'cookie'
 *
 *       // name for super properties persistent store
 *       persistence_name: ''
 *
 *       // names of properties/superproperties which should never
 *       // be sent with track() calls
 *       property_blacklist: []
 *
 *       // if this is true, mixpanel cookies will be marked as
 *       // secure, meaning they will only be transmitted over https
 *       secure_cookie: false
 *
 *       // disables enriching user profiles with first touch marketing data
 *       skip_first_touch_marketing: false
 *
 *       // the amount of time track_links will
 *       // wait for Mixpanel's servers to respond
 *       track_links_timeout: 300
 *
 *       // adds any UTM parameters and click IDs present on the page to any events fired
 *       track_marketing: true
 *
 *       // enables automatic page view tracking using default page view events through
 *       // the track_pageview() method
 *       track_pageview: false
 *
 *       // if you set upgrade to be true, the library will check for
 *       // a cookie from our old js library and import super
 *       // properties from it, then the old cookie is deleted
 *       // The upgrade config option only works in the initialization,
 *       // so make sure you set it when you create the library.
 *       upgrade: false
 *
 *       // extra HTTP request headers to set for each API request, in
 *       // the format {'Header-Name': value}
 *       xhr_headers: {}
 *
 *       // whether to ignore or respect the web browser's Do Not Track setting
 *       ignore_dnt: false
 *     }
 *
 *
 * @param {Object} config A dictionary of new configuration values to update
 */
MixpanelLib.prototype.set_config = function(config) {
    if (_.isObject(config)) {
        _.extend(this['config'], config);

        var new_batch_size = config['batch_size'];
        if (new_batch_size) {
            _.each(this.request_batchers, function(batcher) {
                batcher.resetBatchSize();
            });
        }

        if (!this.get_config('persistence_name')) {
            this['config']['persistence_name'] = this['config']['cookie_name'];
        }
        if (!this.get_config('disable_persistence')) {
            this['config']['disable_persistence'] = this['config']['disable_cookie'];
        }

        if (this['persistence']) {
            this['persistence'].update_config(this['config']);
        }
        Config.DEBUG = Config.DEBUG || this.get_config('debug');
    }
};

/**
 * returns the current config object for the library.
 */
MixpanelLib.prototype.get_config = function(prop_name) {
    return this['config'][prop_name];
};

/**
 * Fetch a hook function from config, with safe default, and run it
 * against the given arguments
 * @param {string} hook_name which hook to retrieve
 * @returns {any|null} return value of user-provided hook, or null if nothing was returned
 */
MixpanelLib.prototype._run_hook = function(hook_name) {
    var ret = (this['config']['hooks'][hook_name] || IDENTITY_FUNC).apply(this, slice.call(arguments, 1));
    if (typeof ret === 'undefined') {
        this.report_error(hook_name + ' hook did not return a value');
        ret = null;
    }
    return ret;
};

/**
 * Returns the value of the super property named property_name. If no such
 * property is set, get_property() will return the undefined value.
 *
 * ### Notes:
 *
 * get_property() can only be called after the Mixpanel library has finished loading.
 * init() has a loaded function available to handle this automatically. For example:
 *
 *     // grab value for 'user_id' after the mixpanel library has loaded
 *     mixpanel.init('YOUR PROJECT TOKEN', {
 *         loaded: function(mixpanel) {
 *             user_id = mixpanel.get_property('user_id');
 *         }
 *     });
 *
 * @param {String} property_name The name of the super property you want to retrieve
 */
MixpanelLib.prototype.get_property = function(property_name) {
    return this['persistence']['props'][property_name];
};

MixpanelLib.prototype.toString = function() {
    var name = this.get_config('name');
    if (name !== PRIMARY_INSTANCE_NAME) {
        name = PRIMARY_INSTANCE_NAME + '.' + name;
    }
    return name;
};

MixpanelLib.prototype._event_is_disabled = function(event_name) {
    return _.isBlockedUA(userAgent) ||
        this._flags.disable_all_events ||
        _.include(this.__disabled_events, event_name);
};

// perform some housekeeping around GDPR opt-in/out state
MixpanelLib.prototype._gdpr_init = function() {
    var is_localStorage_requested = this.get_config('opt_out_tracking_persistence_type') === 'localStorage';

    // try to convert opt-in/out cookies to localStorage if possible
    if (is_localStorage_requested && _.localStorage.is_supported()) {
        if (!this.has_opted_in_tracking() && this.has_opted_in_tracking({'persistence_type': 'cookie'})) {
            this.opt_in_tracking({'enable_persistence': false});
        }
        if (!this.has_opted_out_tracking() && this.has_opted_out_tracking({'persistence_type': 'cookie'})) {
            this.opt_out_tracking({'clear_persistence': false});
        }
        this.clear_opt_in_out_tracking({
            'persistence_type': 'cookie',
            'enable_persistence': false
        });
    }

    // check whether the user has already opted out - if so, clear & disable persistence
    if (this.has_opted_out_tracking()) {
        this._gdpr_update_persistence({'clear_persistence': true});

    // check whether we should opt out by default
    // note: we don't clear persistence here by default since opt-out default state is often
    //       used as an initial state while GDPR information is being collected
    } else if (!this.has_opted_in_tracking() && (
        this.get_config('opt_out_tracking_by_default') || _.cookie.get('mp_optout')
    )) {
        _.cookie.remove('mp_optout');
        this.opt_out_tracking({
            'clear_persistence': this.get_config('opt_out_persistence_by_default')
        });
    }
};

/**
 * Enable or disable persistence based on options
 * only enable/disable if persistence is not already in this state
 * @param {boolean} [options.clear_persistence] If true, will delete all data stored by the sdk in persistence and disable it
 * @param {boolean} [options.enable_persistence] If true, will re-enable sdk persistence
 */
MixpanelLib.prototype._gdpr_update_persistence = function(options) {
    var disabled;
    if (options && options['clear_persistence']) {
        disabled = true;
    } else if (options && options['enable_persistence']) {
        disabled = false;
    } else {
        return;
    }

    if (!this.get_config('disable_persistence') && this['persistence'].disabled !== disabled) {
        this['persistence'].set_disabled(disabled);
    }

    if (disabled) {
        _.each(this.request_batchers, function(batcher) {
            batcher.clear();
        });
    }
};

// call a base gdpr function after constructing the appropriate token and options args
MixpanelLib.prototype._gdpr_call_func = function(func, options) {
    options = _.extend({
        'track': _.bind(this.track, this),
        'persistence_type': this.get_config('opt_out_tracking_persistence_type'),
        'cookie_prefix': this.get_config('opt_out_tracking_cookie_prefix'),
        'cookie_expiration': this.get_config('cookie_expiration'),
        'cross_site_cookie': this.get_config('cross_site_cookie'),
        'cross_subdomain_cookie': this.get_config('cross_subdomain_cookie'),
        'cookie_domain': this.get_config('cookie_domain'),
        'secure_cookie': this.get_config('secure_cookie'),
        'ignore_dnt': this.get_config('ignore_dnt')
    }, options);

    // check if localStorage can be used for recording opt out status, fall back to cookie if not
    if (!_.localStorage.is_supported()) {
        options['persistence_type'] = 'cookie';
    }

    return func(this.get_config('token'), {
        track: options['track'],
        trackEventName: options['track_event_name'],
        trackProperties: options['track_properties'],
        persistenceType: options['persistence_type'],
        persistencePrefix: options['cookie_prefix'],
        cookieDomain: options['cookie_domain'],
        cookieExpiration: options['cookie_expiration'],
        crossSiteCookie: options['cross_site_cookie'],
        crossSubdomainCookie: options['cross_subdomain_cookie'],
        secureCookie: options['secure_cookie'],
        ignoreDnt: options['ignore_dnt']
    });
};

/**
 * Opt the user in to data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // opt user in
 *     mixpanel.opt_in_tracking();
 *
 *     // opt user in with specific event name, properties, cookie configuration
 *     mixpanel.opt_in_tracking({
 *         track_event_name: 'User opted in',
 *         track_event_properties: {
 *             'Email': 'jdoe@example.com'
 *         },
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {function} [options.track] Function used for tracking a Mixpanel event to record the opt-in action (default is this Mixpanel instance's track method)
 * @param {string} [options.track_event_name=$opt_in] Event name to be used for tracking the opt-in action
 * @param {Object} [options.track_properties] Set of properties to be tracked along with the opt-in action
 * @param {boolean} [options.enable_persistence=true] If true, will re-enable sdk persistence
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {string} [options.cookie_domain] Custom cookie domain (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_site_cookie] Whether the opt-in cookie is set as cross-site-enabled (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.opt_in_tracking = function(options) {
    options = _.extend({
        'enable_persistence': true
    }, options);

    this._gdpr_call_func(optIn, options);
    this._gdpr_update_persistence(options);
};

/**
 * Opt the user out of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // opt user out
 *     mixpanel.opt_out_tracking();
 *
 *     // opt user out with different cookie configuration from Mixpanel instance
 *     mixpanel.opt_out_tracking({
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {boolean} [options.delete_user=true] If true, will delete the currently identified user's profile and clear all charges after opting the user out
 * @param {boolean} [options.clear_persistence=true] If true, will delete all data stored by the sdk in persistence
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {string} [options.cookie_domain] Custom cookie domain (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_site_cookie] Whether the opt-in cookie is set as cross-site-enabled (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.opt_out_tracking = function(options) {
    options = _.extend({
        'clear_persistence': true,
        'delete_user': true
    }, options);

    // delete user and clear charges since these methods may be disabled by opt-out
    if (options['delete_user'] && this['people'] && this['people']._identify_called()) {
        this['people'].delete_user();
        this['people'].clear_charges();
    }

    this._gdpr_call_func(optOut, options);
    this._gdpr_update_persistence(options);
};

/**
 * Check whether the user has opted in to data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     var has_opted_in = mixpanel.has_opted_in_tracking();
 *     // use has_opted_in value
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} current opt-in status
 */
MixpanelLib.prototype.has_opted_in_tracking = function(options) {
    return this._gdpr_call_func(hasOptedIn, options);
};

/**
 * Check whether the user has opted out of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     var has_opted_out = mixpanel.has_opted_out_tracking();
 *     // use has_opted_out value
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} current opt-out status
 */
MixpanelLib.prototype.has_opted_out_tracking = function(options) {
    return this._gdpr_call_func(hasOptedOut, options);
};

/**
 * Clear the user's opt in/out status of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // clear user's opt-in/out status
 *     mixpanel.clear_opt_in_out_tracking();
 *
 *     // clear user's opt-in/out status with specific cookie configuration - should match
 *     // configuration used when opt_in_tracking/opt_out_tracking methods were called.
 *     mixpanel.clear_opt_in_out_tracking({
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {boolean} [options.enable_persistence=true] If true, will re-enable sdk persistence
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {string} [options.cookie_domain] Custom cookie domain (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_site_cookie] Whether the opt-in cookie is set as cross-site-enabled (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.clear_opt_in_out_tracking = function(options) {
    options = _.extend({
        'enable_persistence': true
    }, options);

    this._gdpr_call_func(clearOptInOut, options);
    this._gdpr_update_persistence(options);
};

MixpanelLib.prototype.report_error = function(msg, err) {
    console$1.error.apply(console$1.error, arguments);
    try {
        if (!err && !(msg instanceof Error)) {
            msg = new Error(msg);
        }
        this.get_config('error_reporter')(msg, err);
    } catch(err) {
        console$1.error(err);
    }
};

// EXPORTS (for closure compiler)

// MixpanelLib Exports
MixpanelLib.prototype['init']                               = MixpanelLib.prototype.init;
MixpanelLib.prototype['reset']                              = MixpanelLib.prototype.reset;
MixpanelLib.prototype['disable']                            = MixpanelLib.prototype.disable;
MixpanelLib.prototype['time_event']                         = MixpanelLib.prototype.time_event;
MixpanelLib.prototype['track']                              = MixpanelLib.prototype.track;
MixpanelLib.prototype['track_links']                        = MixpanelLib.prototype.track_links;
MixpanelLib.prototype['track_forms']                        = MixpanelLib.prototype.track_forms;
MixpanelLib.prototype['track_pageview']                     = MixpanelLib.prototype.track_pageview;
MixpanelLib.prototype['register']                           = MixpanelLib.prototype.register;
MixpanelLib.prototype['register_once']                      = MixpanelLib.prototype.register_once;
MixpanelLib.prototype['unregister']                         = MixpanelLib.prototype.unregister;
MixpanelLib.prototype['identify']                           = MixpanelLib.prototype.identify;
MixpanelLib.prototype['alias']                              = MixpanelLib.prototype.alias;
MixpanelLib.prototype['name_tag']                           = MixpanelLib.prototype.name_tag;
MixpanelLib.prototype['set_config']                         = MixpanelLib.prototype.set_config;
MixpanelLib.prototype['get_config']                         = MixpanelLib.prototype.get_config;
MixpanelLib.prototype['get_property']                       = MixpanelLib.prototype.get_property;
MixpanelLib.prototype['get_distinct_id']                    = MixpanelLib.prototype.get_distinct_id;
MixpanelLib.prototype['toString']                           = MixpanelLib.prototype.toString;
MixpanelLib.prototype['opt_out_tracking']                   = MixpanelLib.prototype.opt_out_tracking;
MixpanelLib.prototype['opt_in_tracking']                    = MixpanelLib.prototype.opt_in_tracking;
MixpanelLib.prototype['has_opted_out_tracking']             = MixpanelLib.prototype.has_opted_out_tracking;
MixpanelLib.prototype['has_opted_in_tracking']              = MixpanelLib.prototype.has_opted_in_tracking;
MixpanelLib.prototype['clear_opt_in_out_tracking']          = MixpanelLib.prototype.clear_opt_in_out_tracking;
MixpanelLib.prototype['get_group']                          = MixpanelLib.prototype.get_group;
MixpanelLib.prototype['set_group']                          = MixpanelLib.prototype.set_group;
MixpanelLib.prototype['add_group']                          = MixpanelLib.prototype.add_group;
MixpanelLib.prototype['remove_group']                       = MixpanelLib.prototype.remove_group;
MixpanelLib.prototype['track_with_groups']                  = MixpanelLib.prototype.track_with_groups;
MixpanelLib.prototype['start_batch_senders']                = MixpanelLib.prototype.start_batch_senders;
MixpanelLib.prototype['stop_batch_senders']                 = MixpanelLib.prototype.stop_batch_senders;

// MixpanelPersistence Exports
MixpanelPersistence.prototype['properties']            = MixpanelPersistence.prototype.properties;
MixpanelPersistence.prototype['update_search_keyword'] = MixpanelPersistence.prototype.update_search_keyword;
MixpanelPersistence.prototype['update_referrer_info']  = MixpanelPersistence.prototype.update_referrer_info;
MixpanelPersistence.prototype['get_cross_subdomain']   = MixpanelPersistence.prototype.get_cross_subdomain;
MixpanelPersistence.prototype['clear']                 = MixpanelPersistence.prototype.clear;


var instances = {};
var extend_mp = function() {
    // add all the sub mixpanel instances
    _.each(instances, function(instance, name) {
        if (name !== PRIMARY_INSTANCE_NAME) { mixpanel_master[name] = instance; }
    });

    // add private functions as _
    mixpanel_master['_'] = _;
};

var override_mp_init_func = function() {
    // we override the snippets init function to handle the case where a
    // user initializes the mixpanel library after the script loads & runs
    mixpanel_master['init'] = function(token, config, name) {
        if (name) {
            // initialize a sub library
            if (!mixpanel_master[name]) {
                mixpanel_master[name] = instances[name] = create_mplib(token, config, name);
                mixpanel_master[name]._loaded();
            }
            return mixpanel_master[name];
        } else {
            var instance = mixpanel_master;

            if (instances[PRIMARY_INSTANCE_NAME]) {
                // main mixpanel lib already initialized
                instance = instances[PRIMARY_INSTANCE_NAME];
            } else if (token) {
                // intialize the main mixpanel lib
                instance = create_mplib(token, config, PRIMARY_INSTANCE_NAME);
                instance._loaded();
                instances[PRIMARY_INSTANCE_NAME] = instance;
            }

            mixpanel_master = instance;
            if (init_type === INIT_SNIPPET) {
                window$1[PRIMARY_INSTANCE_NAME] = mixpanel_master;
            }
            extend_mp();
        }
    };
};

var add_dom_loaded_handler = function() {
    // Cross browser DOM Loaded support
    function dom_loaded_handler() {
        // function flag since we only want to execute this once
        if (dom_loaded_handler.done) { return; }
        dom_loaded_handler.done = true;

        DOM_LOADED = true;
        ENQUEUE_REQUESTS = false;

        _.each(instances, function(inst) {
            inst._dom_loaded();
        });
    }

    function do_scroll_check() {
        try {
            document$1.documentElement.doScroll('left');
        } catch(e) {
            setTimeout(do_scroll_check, 1);
            return;
        }

        dom_loaded_handler();
    }

    if (document$1.addEventListener) {
        if (document$1.readyState === 'complete') {
            // safari 4 can fire the DOMContentLoaded event before loading all
            // external JS (including this file). you will see some copypasta
            // on the internet that checks for 'complete' and 'loaded', but
            // 'loaded' is an IE thing
            dom_loaded_handler();
        } else {
            document$1.addEventListener('DOMContentLoaded', dom_loaded_handler, false);
        }
    } else if (document$1.attachEvent) {
        // IE
        document$1.attachEvent('onreadystatechange', dom_loaded_handler);

        // check to make sure we arn't in a frame
        var toplevel = false;
        try {
            toplevel = window$1.frameElement === null;
        } catch(e) {
            // noop
        }

        if (document$1.documentElement.doScroll && toplevel) {
            do_scroll_check();
        }
    }

    // fallback handler, always will work
    _.register_event(window$1, 'load', dom_loaded_handler, true);
};

function init_as_module() {
    init_type = INIT_MODULE;
    mixpanel_master = new MixpanelLib();

    override_mp_init_func();
    mixpanel_master['init']();
    add_dom_loaded_handler();

    return mixpanel_master;
}

var mixpanel = init_as_module();

var mixpanel_cjs = mixpanel;

var mixpanel$1 = /*#__PURE__*/_mergeNamespaces({
	__proto__: null,
	default: mixpanel_cjs
}, [mixpanel_cjs]);

const VERSION$1 = packageInfo.version;
// Needed to avoid error in CJS builds on some bundlers.
const mixpanelLib = mixpanel_cjs || mixpanel$1;
let mixpanelInstance;
/**
 * Enum of mixpanel events
 * @hidden
 */
const MIXPANEL_EVENT = {
    VISUAL_SDK_RENDER_START: 'visual-sdk-render-start',
    VISUAL_SDK_CALLED_INIT: 'visual-sdk-called-init',
    VISUAL_SDK_RENDER_COMPLETE: 'visual-sdk-render-complete',
    VISUAL_SDK_RENDER_FAILED: 'visual-sdk-render-failed',
    VISUAL_SDK_TRIGGER: 'visual-sdk-trigger',
    VISUAL_SDK_ON: 'visual-sdk-on',
    VISUAL_SDK_EMBED_CREATE: 'visual-sdk-embed-create'};
let isMixpanelInitialized = false;
let eventQueue = [];
/**
 * Pushes the event with its Property key-value map to mixpanel.
 * @param eventId
 * @param eventProps
 */
function uploadMixpanelEvent(eventId, eventProps = {}) {
    if (!isMixpanelInitialized) {
        eventQueue.push({ eventId, eventProps });
        return;
    }
    mixpanelInstance.track(eventId, eventProps);
}
/**
 *
 */
function emptyQueue() {
    if (!isMixpanelInitialized) {
        return;
    }
    eventQueue.forEach((event) => {
        uploadMixpanelEvent(event.eventId, event.eventProps);
    });
    eventQueue = [];
}
/**
 *
 * @param sessionInfo
 */
function initMixpanel(sessionInfo) {
    var _a;
    if (!sessionInfo || !sessionInfo.mixpanelToken) {
        logger$3.error(ERROR_MESSAGE.MIXPANEL_TOKEN_NOT_FOUND);
        return;
    }
    // On a public cluster the user is anonymous, so don't set the identify to
    // userGUID
    const isPublicCluster = !!sessionInfo.isPublicUser;
    const token = sessionInfo.mixpanelToken;
    try {
        if (token) {
            mixpanelInstance = mixpanelLib.init(token, undefined, 'tsEmbed');
            if (!isPublicCluster) {
                mixpanelInstance.identify(sessionInfo.userGUID);
            }
            mixpanelInstance.register_once({
                clusterId: sessionInfo.clusterId,
                clusterName: sessionInfo.clusterName,
                releaseVersion: sessionInfo.releaseVersion,
                hostAppUrl: ((_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.host) || '',
                sdkVersion: VERSION$1,
            });
            isMixpanelInitialized = true;
            emptyQueue();
        }
    }
    catch (e) {
        logger$3.error('Error initializing mixpanel', e);
    }
}

var eventemitter3 = createCommonjsModule(function (module) {

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
{
  module.exports = EventEmitter;
}
});

var ReportType;
(function (ReportType) {
    ReportType["CSP_VIOLATION"] = "csp-violation";
    ReportType["DEPRECATION"] = "deprecation";
    ReportType["INTERVENTION"] = "intervention";
})(ReportType || (ReportType = {}));
let globalObserver = null;
/**
 * Register a global ReportingObserver to capture all unhandled errors
 * @param overrideExisting boolean to override existing observer
 * @returns ReportingObserver | null
 */
function registerReportingObserver(overrideExisting = false) {
    if (!(window.ReportingObserver)) {
        logger$3.warn(ERROR_MESSAGE.MISSING_REPORTING_OBSERVER);
        return null;
    }
    if (overrideExisting) {
        resetGlobalReportingObserver();
    }
    if (globalObserver) {
        return globalObserver;
    }
    const embedConfig = getEmbedConfig();
    globalObserver = new ReportingObserver((reports) => {
        reports.forEach((report) => {
            const { type, url, body } = report;
            const reportBody = body;
            const isThoughtSpotHost = url
                && url.startsWith(embedConfig.thoughtSpotHost);
            const isFrameHostError = type === ReportType.CSP_VIOLATION
                && reportBody.effectiveDirective === 'frame-ancestors';
            if (isThoughtSpotHost && isFrameHostError) {
                if (!embedConfig.suppressErrorAlerts) {
                    alert(ERROR_MESSAGE.CSP_VIOLATION_ALERT);
                }
                logger$3.error(ERROR_MESSAGE.CSP_FRAME_HOST_VIOLATION_LOG_MESSAGE);
            }
        });
    }, { buffered: true });
    globalObserver.observe();
    return globalObserver;
}
/**
 * Resets the global ReportingObserver
 */
function resetGlobalReportingObserver() {
    if (globalObserver)
        globalObserver.disconnect();
    globalObserver = null;
}

/**
 *
 * @param url
 * @param options
 */
function tokenizedFailureLoggedFetch(url, options = {}) {
    return tokenizedFetch(url, options).then(async (r) => {
        var _a;
        if (!r.ok && r.type !== 'opaqueredirect' && r.type !== 'opaque') {
            logger$3.error(`Failed to fetch ${url}`, await ((_a = r.text) === null || _a === void 0 ? void 0 : _a.call(r)));
        }
        return r;
    });
}
/**
 * Fetches the session info from the ThoughtSpot server.
 * @param thoughtspotHost
 * @returns {Promise<any>}
 * @example
 * ```js
 *  const response = await sessionInfoService();
 * ```
 */
async function fetchPreauthInfoService(thoughtspotHost) {
    const sessionInfoPath = `${thoughtspotHost}${EndPoints.PREAUTH_INFO}`;
    const handleError = (e) => {
        const error = new Error(`Failed to fetch auth info: ${e.message || e.statusText}`);
        error.status = e.status; // Attach the status code to the error object
        throw error;
    };
    try {
        const response = await tokenizedFailureLoggedFetch(sessionInfoPath);
        return response;
    }
    catch (e) {
        handleError(e);
        return null;
    }
}
/**
 * Fetches the session info from the ThoughtSpot server.
 * @param thoughtspotHost
 * @returns {Promise<any>}
 * @example
 * ```js
 *  const response = await sessionInfoService();
 * ```
 */
async function fetchSessionInfoService(thoughtspotHost) {
    const sessionInfoPath = `${thoughtspotHost}${EndPoints.SESSION_INFO}`;
    const response = await tokenizedFailureLoggedFetch(sessionInfoPath);
    if (!response.ok) {
        throw new Error(`Failed to fetch session info: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}
/**
 * Is active service to check if the user is logged in.
 * @param thoughtSpotHost
 * @version SDK: 1.28.4 | ThoughtSpot: *
 */
async function isActiveService(thoughtSpotHost) {
    const isActiveUrl = `${thoughtSpotHost}${EndPoints.IS_ACTIVE}`;
    try {
        const res = await tokenizedFetch(isActiveUrl, {
            credentials: 'include',
        });
        return res.ok;
    }
    catch (e) {
        logger$3.warn(`Is Logged In Service failed : ${e.message}`);
    }
    return false;
}

let sessionInfo = null;
let preauthInfo = null;
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
const formatPreauthInfo = async (preauthInfoResp) => {
    var _a;
    try {
        // Convert Headers to a plain object
        const headers = {};
        (_a = preauthInfoResp === null || preauthInfoResp === void 0 ? void 0 : preauthInfoResp.headers) === null || _a === void 0 ? void 0 : _a.forEach((value, key) => {
            headers[key] = value;
        });
        const data = await preauthInfoResp.json();
        return {
            ...data,
            status: 200,
            headers,
        };
    }
    catch (error) {
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
async function getPreauthInfo(allowCache = true) {
    if (!allowCache || !preauthInfo) {
        try {
            const host = getEmbedConfig().thoughtSpotHost;
            const sessionResponse = await fetchPreauthInfoService(host);
            const processedPreauthInfo = await formatPreauthInfo(sessionResponse);
            preauthInfo = processedPreauthInfo;
        }
        catch (error) {
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
async function getSessionInfo() {
    if (!sessionInfo) {
        const host = getEmbedConfig().thoughtSpotHost;
        const sessionResponse = await fetchSessionInfoService(host);
        const processedSessionInfo = getSessionDetails(sessionResponse);
        sessionInfo = processedSessionInfo;
    }
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
const getSessionDetails = (sessionInfoResp) => {
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
function resetCachedSessionInfo() {
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
function resetCachedPreauthInfo() {
    preauthInfo = null;
}

/**
 * This function resets all the services that are cached in the SDK.
 * This is to be called when the user logs out of the application and also
 * when init is called again.
 * @version SDK: 1.30.2 | ThoughtSpot: *
 */
function resetAllCachedServices() {
    resetCachedAuthToken();
    resetCachedSessionInfo();
    resetCachedPreauthInfo();
}

let loggedInStatus = false;
let samlAuthWindow = null;
let samlCompletionPromise = null;
let releaseVersion = '';
const SSO_REDIRECTION_MARKER_GUID = '5e16222e-ef02-43e9-9fbd-24226bf3ce5b';
/**
 * Enum for auth failure types.
 * This value is passed to the listener for {@link AuthStatus.FAILURE}.
 * @group Authentication / Init
 */
var AuthFailureType;
(function (AuthFailureType) {
    /**
     * Authentication failed in the SDK authentication flow.
     *
     * Emitted when `init()` or auto-authentication cannot establish a logged-in session.
     * For example, this can happen because of an invalid token, an auth request failure,
     * or an auth promise rejection.
     */
    AuthFailureType["SDK"] = "SDK";
    /**
     * Browser cookie access is blocked for the embedded app.
     *
     * Emitted when the iframe reports that required cookies
     * cannot be read or sent, commonly due to third-party cookie restrictions.
     */
    AuthFailureType["NO_COOKIE_ACCESS"] = "NO_COOKIE_ACCESS";
    /**
     * The current authentication token or session has expired.
     *
     * Emitted when the embed receives an auth-expiry signal and starts auth refresh
     * handling.
     */
    AuthFailureType["EXPIRY"] = "EXPIRY";
    /**
     * A generic authentication failure that does not match a more specific type.
     *
     * Emitted as a fallback for app-reported auth failures in standard auth flows.
     */
    AuthFailureType["OTHER"] = "OTHER";
    /**
     * The user session timed out due to inactivity.
     *
     * Emitted when the app reports an idle-session timeout.
     */
    AuthFailureType["IDLE_SESSION_TIMEOUT"] = "IDLE_SESSION_TIMEOUT";
    /**
     * The app reports that the user is unauthenticated.
     *
     * Used primarily to classify unauthenticated failures in Embedded SSO flows.
     */
    AuthFailureType["UNAUTHENTICATED_FAILURE"] = "UNAUTHENTICATED_FAILURE";
})(AuthFailureType || (AuthFailureType = {}));
/**
 * Enum for auth status emitted by the emitter returned from {@link init}.
 * @group Authentication / Init
 */
var AuthStatus;
(function (AuthStatus) {
    /**
     * Emits when the SDK fails to authenticate.
     */
    AuthStatus["FAILURE"] = "FAILURE";
    /**
     * Emits when the SDK authentication step completes
     * successfully (e.g., token exchange, cookie set).
     * This fires before any iframe is rendered. Use
     * this to know that auth passed and it is safe to
     * proceed with rendering. The callback receives no
     * arguments.
     * @example
     * ```js
     * const authEE = init({ ... });
     * authEE.on(AuthStatus.SDK_SUCCESS, () => {
     *     // Auth done, iframe not loaded yet
     * });
     * ```
     */
    AuthStatus["SDK_SUCCESS"] = "SDK_SUCCESS";
    /**
     * @hidden
     * Emits when iframe is loaded and session
     * information is available.
     */
    AuthStatus["SESSION_INFO_SUCCESS"] = "SESSION_INFO_SUCCESS";
    /**
     * Emits when the ThoughtSpot app inside the
     * embedded iframe confirms its session is active.
     * This fires after the iframe loads and sends back an `AuthInit` event.
     * @param sessionInfo Information about the user session, with details like `userGUID`.
     * @see EmbedEvent.AuthInit
     * @example
     * ```js
     * const authEE = init({ ... });
     * authEE.on(AuthStatus.SUCCESS, (sessionInfo) => {
     *     // App is loaded and authenticated
     *     console.log(sessionInfo.userGUID);
     * });
     * ```
     */
    AuthStatus["SUCCESS"] = "SUCCESS";
    /**
     * Emits when a user logs out
     */
    AuthStatus["LOGOUT"] = "LOGOUT";
    /**
     * Emitted when inPopup is true in the SAMLRedirect flow and the
     * popup is waiting to be triggered either programmatically
     * or by the trigger button.
     * @version SDK: 1.19.0
     */
    AuthStatus["WAITING_FOR_POPUP"] = "WAITING_FOR_POPUP";
    /**
     * Emitted when the SAML popup is closed without authentication
     */
    AuthStatus["SAML_POPUP_CLOSED_NO_AUTH"] = "SAML_POPUP_CLOSED_NO_AUTH";
})(AuthStatus || (AuthStatus = {}));
/**
 * Events which can be triggered on the emitter returned from {@link init}.
 * @group Authentication / Init
 */
var AuthEvent;
(function (AuthEvent) {
    /**
     * Manually trigger the SSO popup. This is useful when
     * authStatus is SAMLRedirect/OIDCRedirect and inPopup is set to true
     */
    AuthEvent["TRIGGER_SSO_POPUP"] = "TRIGGER_SSO_POPUP";
})(AuthEvent || (AuthEvent = {}));
let authEE;
/**
 *
 * @param eventEmitter
 */
function setAuthEE(eventEmitter) {
    authEE = eventEmitter;
}
/**
 *
 */
function notifyAuthSDKSuccess() {
    if (!authEE) {
        logger$3.error(ERROR_MESSAGE.SDK_NOT_INITIALIZED);
        return;
    }
    authEE.emit(AuthStatus.SDK_SUCCESS);
}
/**
 *
 */
async function notifyAuthSuccess() {
    if (!authEE) {
        logger$3.error(ERROR_MESSAGE.SDK_NOT_INITIALIZED);
        return;
    }
    try {
        getPreauthInfo();
        const sessionInfo = await getSessionInfo();
        authEE.emit(AuthStatus.SUCCESS, sessionInfo);
    }
    catch (e) {
        logger$3.error(ERROR_MESSAGE.SESSION_INFO_FAILED);
    }
}
/**
 *
 * @param failureType
 */
function notifyAuthFailure(failureType) {
    if (!authEE) {
        logger$3.error(ERROR_MESSAGE.SDK_NOT_INITIALIZED);
        return;
    }
    authEE.emit(AuthStatus.FAILURE, failureType);
}
/**
 *
 */
function notifyLogout() {
    if (!authEE) {
        logger$3.error(ERROR_MESSAGE.SDK_NOT_INITIALIZED);
        return;
    }
    authEE.emit(AuthStatus.LOGOUT);
}
/**
 * Check if we are logged into the ThoughtSpot cluster
 * @param thoughtSpotHost The ThoughtSpot cluster hostname or IP
 */
async function isLoggedIn(thoughtSpotHost) {
    try {
        const response = await isActiveService(thoughtSpotHost);
        return response;
    }
    catch (e) {
        return false;
    }
}
/**
 * Services to be called after the login is successful,
 * This should be called after the cookie is set for cookie auth or
 * after the token is set for cookieless.
 * @return {Promise<void>}
 * @example
 * ```js
 * await postLoginService();
 * ```
 * @version SDK: 1.28.3 | ThoughtSpot: *
 */
async function postLoginService() {
    try {
        getPreauthInfo();
        const sessionInfo = await getSessionInfo();
        releaseVersion = sessionInfo.releaseVersion;
        const embedConfig = getEmbedConfig();
        if (!embedConfig.disableSDKTracking) {
            initMixpanel(sessionInfo);
        }
    }
    catch (e) {
        logger$3.error('Post login services failed.', e.message, e);
    }
}
/**
 * Return releaseVersion if available
 */
function getReleaseVersion() {
    return releaseVersion;
}
/**
 * Check if we are stuck at the SSO redirect URL
 */
function isAtSSORedirectUrl() {
    return window.location.href.indexOf(getSSOMarker(SSO_REDIRECTION_MARKER_GUID)) >= 0;
}
/**
 * Remove the SSO redirect URL marker
 */
function removeSSORedirectUrlMarker() {
    // Note (sunny): This will leave a # around even if it was not in the URL
    // to begin with. Trying to remove the hash by changing window.location will
    // reload the page which we don't want. We'll live with adding an
    // unnecessary hash to the parent page URL until we find any use case where
    // that creates an issue.
    // Replace any occurrences of ?ssoMarker=guid or &ssoMarker=guid.
    let updatedHash = window.location.hash.replace(`?${getSSOMarker(SSO_REDIRECTION_MARKER_GUID)}`, '');
    updatedHash = updatedHash.replace(`&${getSSOMarker(SSO_REDIRECTION_MARKER_GUID)}`, '');
    window.location.hash = updatedHash;
}
/**
 * Perform token based authentication
 * @param embedConfig The embed configuration
 */
const doTokenAuth = async (embedConfig) => {
    const { thoughtSpotHost, username, authEndpoint, getAuthToken, } = embedConfig;
    if (!authEndpoint && !getAuthToken) {
        throw new Error('Either auth endpoint or getAuthToken function must be provided');
    }
    loggedInStatus = await isLoggedIn(thoughtSpotHost);
    if (!loggedInStatus) {
        let authToken;
        try {
            authToken = await getAuthenticationToken(embedConfig);
        }
        catch (e) {
            loggedInStatus = false;
            throw e;
        }
        let resp;
        try {
            resp = await fetchAuthPostService(thoughtSpotHost, username, authToken);
        }
        catch (e) {
            resp = await fetchAuthService(thoughtSpotHost, username, authToken);
        }
        // token login issues a 302 when successful
        loggedInStatus = resp.ok || resp.type === 'opaqueredirect';
        if (loggedInStatus && embedConfig.detectCookieAccessSlow) {
            // When 3rd party cookie access is blocked, this will fail because
            // cookies will not be sent with the call.
            loggedInStatus = await isLoggedIn(thoughtSpotHost);
        }
    }
    return loggedInStatus;
};
/**
 * Validate embedConfig parameters required for cookielessTokenAuth
 * @param embedConfig The embed configuration
 */
const doCookielessTokenAuth = async (embedConfig) => {
    const { authEndpoint, getAuthToken } = embedConfig;
    if (!authEndpoint && !getAuthToken) {
        throw new Error('Either auth endpoint or getAuthToken function must be provided');
    }
    let authSuccess = false;
    try {
        const authToken = await getAuthenticationToken(embedConfig);
        if (authToken) {
            authSuccess = true;
        }
    }
    catch {
        authSuccess = false;
    }
    return authSuccess;
};
/**
 * Perform basic authentication to the ThoughtSpot cluster using the cluster
 * credentials.
 *
 * Warning: This feature is primarily intended for developer testing. It is
 * strongly advised not to use this authentication method in production.
 * @param embedConfig The embed configuration
 */
const doBasicAuth = async (embedConfig) => {
    const { thoughtSpotHost, username, password } = embedConfig;
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (!loggedIn) {
        const response = await fetchBasicAuthService(thoughtSpotHost, username, password);
        loggedInStatus = response.ok;
        if (embedConfig.detectCookieAccessSlow) {
            loggedInStatus = await isLoggedIn(thoughtSpotHost);
        }
    }
    else {
        loggedInStatus = true;
    }
    return loggedInStatus;
};
/**
 *
 * @param ssoURL
 * @param triggerContainer
 * @param triggerText
 */
async function samlPopupFlow(ssoURL, triggerContainer, triggerText) {
    let popupClosedCheck;
    const openPopup = () => {
        if (samlAuthWindow === null || samlAuthWindow.closed) {
            samlAuthWindow = window.open(ssoURL, '_blank', 'location=no,height=570,width=520,scrollbars=yes,status=yes');
            if (samlAuthWindow) {
                popupClosedCheck = setInterval(() => {
                    if (samlAuthWindow.closed) {
                        clearInterval(popupClosedCheck);
                        if (samlCompletionPromise && !samlCompletionResolved) {
                            authEE === null || authEE === void 0 ? void 0 : authEE.emit(AuthStatus.SAML_POPUP_CLOSED_NO_AUTH);
                        }
                    }
                }, 500);
            }
        }
        else {
            samlAuthWindow.focus();
        }
    };
    let samlCompletionResolved = false;
    authEE === null || authEE === void 0 ? void 0 : authEE.emit(AuthStatus.WAITING_FOR_POPUP);
    const containerEl = getDOMNode(triggerContainer);
    if (containerEl) {
        containerEl.innerHTML = '<button id="ts-auth-btn" class="ts-auth-btn" style="margin: auto;"></button>';
        const authElem = document.getElementById('ts-auth-btn');
        authElem.textContent = triggerText;
        authElem.addEventListener('click', openPopup, { once: true });
    }
    samlCompletionPromise = samlCompletionPromise || new Promise((resolve, reject) => {
        window.addEventListener('message', (e) => {
            if (e.data.type === EmbedEvent.SAMLComplete) {
                if (e.data.accessToken) {
                    const decodedToken = decodeURIComponent(e.data.accessToken);
                    storeAuthTokenInCache(decodedToken);
                }
                samlCompletionResolved = true;
                if (popupClosedCheck) {
                    clearInterval(popupClosedCheck);
                }
                e.source.close();
                resolve();
            }
        });
    });
    authEE === null || authEE === void 0 ? void 0 : authEE.once(AuthEvent.TRIGGER_SSO_POPUP, openPopup);
    return samlCompletionPromise;
}
/**
 * Perform SAML authentication
 * @param embedConfig The embed configuration
 * @param ssoEndPoint
 */
const doSSOAuth = async (embedConfig, ssoEndPoint) => {
    const { thoughtSpotHost } = embedConfig;
    const loggedIn = await isLoggedIn(thoughtSpotHost);
    if (loggedIn) {
        if (isAtSSORedirectUrl()) {
            removeSSORedirectUrlMarker();
        }
        loggedInStatus = true;
        return;
    }
    // we have already tried authentication and it did not succeed, restore
    // the current URL to the original one and invoke the callback.
    if (isAtSSORedirectUrl()) {
        removeSSORedirectUrlMarker();
        loggedInStatus = false;
        return;
    }
    const ssoURL = `${thoughtSpotHost}${ssoEndPoint}`;
    if (embedConfig.inPopup) {
        await samlPopupFlow(ssoURL, embedConfig.authTriggerContainer, embedConfig.authTriggerText);
        const cachedToken = getCacheAuthToken();
        if (cachedToken) {
            loggedInStatus = true;
        }
        else {
            loggedInStatus = await isLoggedIn(thoughtSpotHost);
        }
        return;
    }
    window.location.href = ssoURL;
};
const doSamlAuth = async (embedConfig) => {
    const { thoughtSpotHost } = embedConfig;
    // redirect for SSO, when the SSO authentication is done, this page will be
    // loaded again and the same JS will execute again.
    const ssoRedirectUrl = embedConfig.inPopup
        ? `${thoughtSpotHost}/v2/#/embed/saml-complete`
        : getRedirectUrl(window.location.href, SSO_REDIRECTION_MARKER_GUID, embedConfig.redirectPath);
    // bring back the page to the same URL
    const ssoEndPoint = `${EndPoints.SAML_LOGIN_TEMPLATE(encodeURIComponent(ssoRedirectUrl))}`;
    await doSSOAuth(embedConfig, ssoEndPoint);
    return loggedInStatus;
};
const doOIDCAuth = async (embedConfig) => {
    const { thoughtSpotHost } = embedConfig;
    // redirect for SSO, when the SSO authentication is done, this page will be
    // loaded again and the same JS will execute again.
    const ssoRedirectUrl = embedConfig.noRedirect || embedConfig.inPopup
        ? `${thoughtSpotHost}/v2/#/embed/saml-complete`
        : getRedirectUrl(window.location.href, SSO_REDIRECTION_MARKER_GUID, embedConfig.redirectPath);
    // bring back the page to the same URL
    const baseEndpoint = `${EndPoints.OIDC_LOGIN_TEMPLATE(encodeURIComponent(ssoRedirectUrl))}`;
    const ssoEndPoint = `${baseEndpoint}${baseEndpoint.includes('?') ? '&' : '?'}forceSAMLAutoRedirect=true`;
    await doSSOAuth(embedConfig, ssoEndPoint);
    return loggedInStatus;
};
/**
 * Perform authentication on the ThoughtSpot cluster
 * @param embedConfig The embed configuration
 */
const authenticate = async (embedConfig) => {
    const { authType } = embedConfig;
    switch (authType) {
        case AuthType.SSO:
        case AuthType.SAMLRedirect:
        case AuthType.SAML:
            return doSamlAuth(embedConfig);
        case AuthType.OIDC:
        case AuthType.OIDCRedirect:
            return doOIDCAuth(embedConfig);
        case AuthType.AuthServer:
        case AuthType.TrustedAuthToken:
            return doTokenAuth(embedConfig);
        case AuthType.TrustedAuthTokenCookieless:
            return doCookielessTokenAuth(embedConfig);
        case AuthType.Basic:
            return doBasicAuth(embedConfig);
        default:
            return Promise.resolve(true);
    }
};

if (typeof Promise.withResolvers === 'undefined') {
    Promise.withResolvers = () => {
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

/**
 * Reloads the ThoughtSpot iframe.
 * @param iFrame
 */
const reload = (iFrame) => {
    const src = iFrame.src;
    iFrame.src = '';
    setTimeout(() => {
        iFrame.src = src;
    }, 100);
};
/**
 * Post iframe message.
 * @param iFrame
 * @param message
 * @param message.type
 * @param message.data
 * @param message.context
 * @param thoughtSpotHost
 * @param channel
 */
function postIframeMessage(iFrame, message, thoughtSpotHost, channel) {
    var _a;
    return (_a = iFrame.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(message, thoughtSpotHost, [channel === null || channel === void 0 ? void 0 : channel.port2]);
}
const TRIGGER_TIMEOUT = 30000;
/**
 *
 * @param iFrame
 * @param messageType
 * @param thoughtSpotHost
 * @param data
 * @param context
 */
function processTrigger(iFrame, messageType, thoughtSpotHost, data, context) {
    return new Promise((res, rej) => {
        var _a;
        if (messageType === HostEvent.Reload) {
            reload(iFrame);
            return res(null);
        }
        if (messageType === HostEvent.Present) {
            const embedConfig = getEmbedConfig();
            const disableFullscreenPresentation = (_a = embedConfig === null || embedConfig === void 0 ? void 0 : embedConfig.disableFullscreenPresentation) !== null && _a !== void 0 ? _a : true;
            if (!disableFullscreenPresentation) {
                handlePresentEvent(iFrame);
            }
            else {
                logger$3.warn('Fullscreen presentation mode is disabled. Set disableFullscreenPresentation: false to enable this feature.');
            }
        }
        const channel = new MessageChannel();
        channel.port1.onmessage = ({ data: responseData }) => {
            var _a;
            channel.port1.close();
            const error = (responseData === null || responseData === void 0 ? void 0 : responseData.error) || ((_a = responseData === null || responseData === void 0 ? void 0 : responseData.data) === null || _a === void 0 ? void 0 : _a.error);
            if (error) {
                rej(error);
            }
            else {
                res(responseData);
            }
        };
        // Close the messageChannel and resolve the promise if timeout.
        setTimeout(() => {
            channel.port1.close();
            res(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
        }, TRIGGER_TIMEOUT);
        return postIframeMessage(iFrame, { type: messageType, data, context }, thoughtSpotHost, channel);
    });
}

/**
 * Copyright (c) 2022
 *
 * Base classes
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
const CONFIG_DEFAULTS = {
    loginFailedMessage: 'Not logged in',
    authTriggerText: 'Authorize',
    authType: AuthType.None,
    logLevel: LogLevel.ERROR,
    waitForCleanupOnDestroy: false,
    cleanupTimeout: 5000,
};
let authPromise;
const getAuthPromise = () => authPromise;
/**
 * Perform authentication on the ThoughtSpot app as applicable.
 */
const handleAuth = () => {
    authPromise = authenticate(getEmbedConfig());
    authPromise.then((isLoggedIn) => {
        if (!isLoggedIn) {
            notifyAuthFailure(AuthFailureType.SDK);
        }
        else {
            // Post login service is called after successful login.
            postLoginService();
            notifyAuthSDKSuccess();
        }
    }, () => {
        notifyAuthFailure(AuthFailureType.SDK);
    });
    return authPromise;
};
const hostUrlToFeatureUrl = {
    [PrefetchFeatures.SearchEmbed]: (url, flags) => `${url}v2/?${flags}#/embed/answer`,
    [PrefetchFeatures.LiveboardEmbed]: (url, flags) => `${url}?${flags}`,
    [PrefetchFeatures.FullApp]: (url, flags) => `${url}?${flags}`,
    [PrefetchFeatures.VizEmbed]: (url, flags) => `${url}?${flags}`,
};
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
const prefetch = (url, prefetchFeatures, additionalFlags) => {
    var _a;
    if (url === '') {
        logger$3.warn('The prefetch method does not have a valid URL');
    }
    else {
        const features = [PrefetchFeatures.FullApp];
        let hostUrl = url || getEmbedConfig().thoughtSpotHost;
        const prefetchFlags = {
            [Param.EmbedApp]: true,
            ...(_a = getEmbedConfig()) === null || _a === void 0 ? void 0 : _a.additionalFlags,
            ...additionalFlags,
        };
        hostUrl = hostUrl[hostUrl.length - 1] === '/' ? hostUrl : `${hostUrl}/`;
        Array.from(new Set(features
            .map((feature) => hostUrlToFeatureUrl[feature](hostUrl, getQueryParamString(prefetchFlags)))))
            .forEach((prefetchUrl, index) => {
            const iFrame = document.createElement('iframe');
            iFrame.src = prefetchUrl;
            iFrame.style.width = '0';
            iFrame.style.height = '0';
            iFrame.style.border = '0';
            // Make it 'fixed' to keep it in a different stacking
            // context. This should solve the focus behaviours inside
            // the iframe from interfering with main body.
            iFrame.style.position = 'fixed';
            // Push it out of viewport.
            iFrame.style.top = '100vh';
            iFrame.style.left = '100vw';
            iFrame.classList.add('prefetchIframe');
            iFrame.classList.add(`prefetchIframeNum-${index}`);
            document.body.appendChild(iFrame);
        });
    }
};
/**
 *
 * @param embedConfig
 */
function sanity(embedConfig) {
    if (embedConfig.thoughtSpotHost === undefined) {
        throw new Error('ThoughtSpot host not provided');
    }
    if (embedConfig.authType === AuthType.TrustedAuthToken) {
        if (!embedConfig.authEndpoint && typeof embedConfig.getAuthToken !== 'function') {
            throw new Error('Trusted auth should provide either authEndpoint or getAuthToken');
        }
    }
}
/**
 *
 * @param embedConfig
 */
function backwardCompat(embedConfig) {
    const newConfig = { ...embedConfig };
    if (embedConfig.noRedirect !== undefined && embedConfig.inPopup === undefined) {
        newConfig.inPopup = embedConfig.noRedirect;
    }
    return newConfig;
}
const initFlagKey = 'initFlagKey';
const createAndSetInitPromise = () => {
    if (isWindowUndefined())
        return;
    const { promise: initPromise, resolve: initPromiseResolve,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
     } = Promise.withResolvers();
    const initFlagStore = {
        initPromise,
        isInitCalled: false,
        isInitCompleted: false,
        initPromiseResolve,
    };
    storeValueInWindow(initFlagKey, initFlagStore, {
        // In case of diff imports the promise might be already set
        ignoreIfAlreadyExists: true,
    });
    initPromise.finally(() => {
        const curVal = getValueFromWindow(initFlagKey);
        curVal.isInitCompleted = true;
        storeValueInWindow(initFlagKey, curVal);
    });
};
createAndSetInitPromise();
const getInitPromise = () => { var _a; return (_a = getValueFromWindow(initFlagKey)) === null || _a === void 0 ? void 0 : _a.initPromise; };
const getIsInitCompleted = () => { var _a; return (_a = getValueFromWindow(initFlagKey)) === null || _a === void 0 ? void 0 : _a.isInitCompleted; };
const getIsInitCalled = () => { var _a; return !!((_a = getValueFromWindow(initFlagKey)) === null || _a === void 0 ? void 0 : _a.isInitCalled); };
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
const init = (embedConfig) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    if (isWindowUndefined())
        return null;
    sanity(embedConfig);
    resetAllCachedServices();
    embedConfig = setEmbedConfig(backwardCompat({
        ...CONFIG_DEFAULTS,
        ...embedConfig,
        thoughtSpotHost: getThoughtSpotHost(embedConfig),
    }));
    setGlobalLogLevelOverride(embedConfig.logLevel);
    registerReportingObserver();
    const authEE = new eventemitter3();
    setAuthEE(authEE);
    handleAuth();
    const { password, ...configToTrack } = getEmbedConfig();
    uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_CALLED_INIT, {
        ...configToTrack,
        usedCustomizationSheet: ((_b = (_a = embedConfig.customizations) === null || _a === void 0 ? void 0 : _a.style) === null || _b === void 0 ? void 0 : _b.customCSSUrl) != null,
        usedCustomizationVariables: ((_e = (_d = (_c = embedConfig.customizations) === null || _c === void 0 ? void 0 : _c.style) === null || _d === void 0 ? void 0 : _d.customCSS) === null || _e === void 0 ? void 0 : _e.variables) != null,
        usedCustomizationRules: ((_h = (_g = (_f = embedConfig.customizations) === null || _f === void 0 ? void 0 : _f.style) === null || _g === void 0 ? void 0 : _g.customCSS) === null || _h === void 0 ? void 0 : _h.rules_UNSTABLE) != null,
        usedCustomizationStrings: !!((_k = (_j = embedConfig.customizations) === null || _j === void 0 ? void 0 : _j.content) === null || _k === void 0 ? void 0 : _k.strings),
        usedCustomizationIconSprite: !!((_l = embedConfig.customizations) === null || _l === void 0 ? void 0 : _l.iconSpriteUrl),
    });
    if (getEmbedConfig().callPrefetch) {
        prefetch(getEmbedConfig().thoughtSpotHost);
    }
    // Resolves the promise created in the initPromiseKey
    getValueFromWindow(initFlagKey).initPromiseResolve(authEE);
    getValueFromWindow(initFlagKey).isInitCalled = true;
    return authEE;
};
/**
 *
 */
function disableAutoLogin() {
    getEmbedConfig().autoLogin = false;
}
let renderQueue = Promise.resolve();
/**
 * Renders functions in a queue, resolves to next function only after the callback next
 * is called
 * @param fn The function being registered
 */
const renderInQueue = (fn) => {
    const { queueMultiRenders = false } = getEmbedConfig();
    if (queueMultiRenders) {
        renderQueue = renderQueue.then(() => new Promise((res) => fn(res)));
        return renderQueue;
    }
    // Sending an empty function to keep it consistent with the above usage.
    return fn(() => { });
};

/**
 * Process the ExitPresentMode event and handle default fullscreen exit
 * @param e - The event data
 */
function processExitPresentMode(e) {
    var _a;
    const embedConfig = getEmbedConfig();
    const disableFullscreenPresentation = (_a = embedConfig === null || embedConfig === void 0 ? void 0 : embedConfig.disableFullscreenPresentation) !== null && _a !== void 0 ? _a : true;
    if (!disableFullscreenPresentation) {
        handleExitPresentMode();
    }
}
/**
 * Clears the cached preauth and session info.
 */
function processClearInfoCache() {
    resetCachedPreauthInfo();
    resetCachedSessionInfo();
}
/**
 *
 * @param e
 * @param thoughtSpotHost
 */
function processCustomAction(e, thoughtSpotHost) {
    const { session, embedAnswerData, contextMenuPoints } = e.data;
    const answerService = new AnswerService(session, embedAnswerData || {}, thoughtSpotHost, contextMenuPoints === null || contextMenuPoints === void 0 ? void 0 : contextMenuPoints.selectedPoints);
    return {
        ...e,
        answerService,
    };
}
/**
 * Responds to AuthInit sent from host signifying successful authentication in host.
 * @param e
 * @returns {any}
 */
function processAuthInit(e) {
    var _a, _b;
    notifyAuthSuccess();
    // Expose only allowed details (eg: userGUID) back to SDK users.
    return {
        ...e,
        data: {
            userGUID: ((_a = e.data) === null || _a === void 0 ? void 0 : _a.userGUID) || ((_b = e.payload) === null || _b === void 0 ? void 0 : _b.userGUID),
        },
    };
}
/**
 *
 * @param e
 * @param containerEl
 */
function processNoCookieAccess(e, containerEl) {
    const { loginFailedMessage, suppressNoCookieAccessAlert, ignoreNoCookieAccess, suppressErrorAlerts, } = getEmbedConfig();
    if (!ignoreNoCookieAccess) {
        if (!suppressNoCookieAccessAlert && !suppressErrorAlerts) {
            alert(ERROR_MESSAGE.THIRD_PARTY_COOKIE_BLOCKED_ALERT);
        }
        containerEl.innerHTML = loginFailedMessage;
    }
    notifyAuthFailure(AuthFailureType.NO_COOKIE_ACCESS);
    return e;
}
/**
 *
 * @param e
 * @param containerEl
 */
function processAuthFailure(e, containerEl) {
    var _a;
    const { loginFailedMessage, authType, disableLoginFailurePage, autoLogin, } = getEmbedConfig();
    const isEmbeddedSSO = authType === AuthType.EmbeddedSSO;
    const isTrustedAuth = authType === AuthType.TrustedAuthToken || authType === AuthType.TrustedAuthTokenCookieless;
    const isEmbeddedSSOInfoFailure = isEmbeddedSSO && ((_a = e === null || e === void 0 ? void 0 : e.data) === null || _a === void 0 ? void 0 : _a.type) === AuthFailureType.UNAUTHENTICATED_FAILURE;
    if (autoLogin && isTrustedAuth) {
        containerEl.innerHTML = loginFailedMessage;
        notifyAuthFailure(AuthFailureType.IDLE_SESSION_TIMEOUT);
    }
    else if (authType !== AuthType.None && !disableLoginFailurePage && !isEmbeddedSSOInfoFailure) {
        containerEl.innerHTML = loginFailedMessage;
        notifyAuthFailure(AuthFailureType.OTHER);
    }
    resetCachedAuthToken();
    return e;
}
/**
 *
 * @param e
 * @param containerEl
 */
function processAuthLogout(e, containerEl) {
    const { loginFailedMessage } = getEmbedConfig();
    containerEl.innerHTML = loginFailedMessage;
    resetCachedAuthToken();
    disableAutoLogin();
    notifyLogout();
    return e;
}
/**
 *
 * @param type
 * @param e
 * @param thoughtSpotHost
 * @param containerEl
 */
function processEventData(type, eventData, thoughtSpotHost, containerEl) {
    switch (type) {
        case EmbedEvent.CustomAction:
            return processCustomAction(eventData, thoughtSpotHost);
        case EmbedEvent.AuthInit:
            return processAuthInit(eventData);
        case EmbedEvent.NoCookieAccess:
            return processNoCookieAccess(eventData, containerEl);
        case EmbedEvent.AuthFailure:
            return processAuthFailure(eventData, containerEl);
        case EmbedEvent.AuthLogout:
            return processAuthLogout(eventData, containerEl);
        case EmbedEvent.ExitPresentMode:
            return processExitPresentMode();
        case EmbedEvent.CLEAR_INFO_CACHE:
            return processClearInfoCache();
    }
    return eventData;
}

function isValidUpdateFiltersPayload(payload) {
    if (!payload)
        return false;
    const isValidFilter = (f) => {
        const hasColumn = typeof f.column === 'string' || typeof f.columnName === 'string';
        const hasOperator = typeof f.oper === 'string' || typeof f.operator === 'string';
        const hasValues = Array.isArray(f.values);
        const validType = !f.type || typeof f.type === 'string';
        return hasColumn && hasOperator && hasValues && validType;
    };
    const hasValidFilter = payload.filter && isValidFilter(payload.filter);
    const hasValidFilters = Array.isArray(payload.filters) && payload.filters.length > 0 && payload.filters.every(isValidFilter);
    return !!(hasValidFilter || hasValidFilters);
}
function isValidDrillDownPayload(payload) {
    if (!payload)
        return false;
    const points = payload.points;
    if (!points || typeof points !== 'object')
        return false;
    const hasClickedPoint = 'clickedPoint' in points && points.clickedPoint != null;
    const hasSelectedPoints = Array.isArray(points.selectedPoints) && points.selectedPoints.length > 0;
    return hasClickedPoint || hasSelectedPoints;
}
function createValidationError(message) {
    const err = new Error(message);
    err.isValidationError = true;
    err.embedErrorDetails = {
        type: EmbedEvent.Error,
        data: {
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message,
            code: EmbedErrorCodes.HOST_EVENT_VALIDATION,
            error: message
        },
        status: embedEventStatus.END
    };
    throw err;
}
function throwUpdateFiltersValidationError() {
    createValidationError(ERROR_MESSAGE.UPDATEFILTERS_INVALID_PAYLOAD);
}
function throwDrillDownValidationError() {
    createValidationError(ERROR_MESSAGE.DRILLDOWN_INVALID_PAYLOAD);
}

/**
 * Maps HostEvent to its corresponding UIPassthroughEvent.
 * Includes both custom-handler events (Pin, SaveAnswer, UpdateFilters, DrillDown)
 * and getter events (GetAnswerSession, GetFilters, etc.) that use getDataWithPassthroughFallback.
 */
const PASSTHROUGH_MAP = {
    // Custom handlers (setters with special logic)
    [HostEvent.Pin]: UIPassthroughEvent.PinAnswerToLiveboard,
    [HostEvent.SaveAnswer]: UIPassthroughEvent.SaveAnswer,
    [HostEvent.UpdateFilters]: UIPassthroughEvent.UpdateFilters,
    [HostEvent.DrillDown]: UIPassthroughEvent.Drilldown,
    // Getters (use getDataWithPassthroughFallback)
    [HostEvent.GetAnswerSession]: UIPassthroughEvent.GetAnswerSession,
    [HostEvent.GetFilters]: UIPassthroughEvent.GetFilters,
    [HostEvent.GetIframeUrl]: UIPassthroughEvent.GetIframeUrl,
    [HostEvent.GetParameters]: UIPassthroughEvent.GetParameters,
    [HostEvent.GetTML]: UIPassthroughEvent.GetTML,
    [HostEvent.GetTabs]: UIPassthroughEvent.GetTabs,
    [HostEvent.getExportRequestForCurrentPinboard]: UIPassthroughEvent.GetExportRequestForCurrentPinboard,
};
class HostEventClient {
    constructor(iFrame) {
        /** Cached list of available UI passthrough keys from the embedded app */
        this.availablePassthroughKeysCache = null;
        this.iFrame = iFrame;
        this.customHandlers = {
            [HostEvent.Pin]: (p, c) => this.handlePinEvent(p, c),
            [HostEvent.SaveAnswer]: (p, c) => this.handleSaveAnswerEvent(p, c),
            [HostEvent.UpdateFilters]: (p, c) => this.handleUpdateFiltersEvent(p, c),
            [HostEvent.DrillDown]: (p, c) => this.handleDrillDownEvent(p, c),
        };
    }
    /**
     * A wrapper over process trigger to
     * @param {HostEvent} message Host event to send
     * @param {any} data Data to send with the host event
     * @returns {Promise<any>} - the response from the process trigger
     */
    async processTrigger(message, data, context) {
        if (!this.iFrame) {
            throw new Error('Iframe element is not set');
        }
        const thoughtspotHost = getEmbedConfig().thoughtSpotHost;
        return processTrigger(this.iFrame, message, thoughtspotHost, data, context);
    }
    async handleHostEventWithParam(apiName, parameters, context) {
        var _a, _b, _c, _d;
        const response = (_b = (_a = (await this.triggerUIPassthroughApi(apiName, parameters, context))) === null || _a === void 0 ? void 0 : _a.find) === null || _b === void 0 ? void 0 : _b.call(_a, (r) => r.error || r.value);
        if (!response) {
            const error = `No answer found${parameters.vizId ? ` for vizId: ${parameters.vizId}` : ''}.`;
            throw { error };
        }
        const errors = response.error
            || ((_c = response.value) === null || _c === void 0 ? void 0 : _c.errors)
            || ((_d = response.value) === null || _d === void 0 ? void 0 : _d.error);
        if (errors) {
            const message = typeof errors === 'string' ? errors : JSON.stringify(errors);
            throw { error: message };
        }
        return { ...response.value };
    }
    async hostEventFallback(hostEvent, data, context) {
        return this.processTrigger(hostEvent, data, context);
    }
    /**
     * For getter events that return data. Tries UI passthrough first;
     * if the app doesn't support it (no response data), falls back to
     * the legacy host event channel. Real errors are thrown as-is.
     */
    async getDataWithPassthroughFallback(passthroughEvent, hostEvent, payload, context) {
        var _a, _b, _c;
        const response = await this.triggerUIPassthroughApi(passthroughEvent, payload || {}, context);
        const matched = (_a = response === null || response === void 0 ? void 0 : response.find) === null || _a === void 0 ? void 0 : _a.call(response, (r) => r.error || r.value);
        if (!matched) {
            return this.hostEventFallback(hostEvent, payload, context);
        }
        const errors = matched.error
            || ((_b = matched.value) === null || _b === void 0 ? void 0 : _b.errors)
            || ((_c = matched.value) === null || _c === void 0 ? void 0 : _c.error);
        if (errors) {
            const message = typeof errors === 'string' ? errors : JSON.stringify(errors);
            throw new Error(message);
        }
        return { ...matched.value };
    }
    /**
     * Setter for the iframe element used for host events
     * @param {HTMLIFrameElement} iFrame - the iframe element to set
     */
    setIframeElement(iFrame) {
        this.iFrame = iFrame;
    }
    /**
     * Fetches the list of available UI passthrough keys from the embedded app.
     * Result is cached for the session. Returns empty array on failure.
     */
    async getAvailableUIPassthroughKeys(context) {
        var _a, _b;
        if (this.availablePassthroughKeysCache !== null) {
            return this.availablePassthroughKeysCache;
        }
        try {
            const response = await this.triggerUIPassthroughApi(UIPassthroughEvent.GetAvailableUIPassthroughs, {}, context);
            const matched = (_a = response === null || response === void 0 ? void 0 : response.find) === null || _a === void 0 ? void 0 : _a.call(response, (r) => r.value && !r.error);
            const keys = (_b = matched === null || matched === void 0 ? void 0 : matched.value) === null || _b === void 0 ? void 0 : _b.keys;
            this.availablePassthroughKeysCache = Array.isArray(keys) ? keys : [];
            return this.availablePassthroughKeysCache;
        }
        catch {
            return [];
        }
    }
    async triggerUIPassthroughApi(apiName, parameters, context) {
        const res = await this.processTrigger(HostEvent.UIPassthrough, {
            type: apiName,
            parameters,
        }, context);
        return res;
    }
    async handlePinEvent(payload, context) {
        var _a, _b;
        if (!payload || !('newVizName' in payload)) {
            return this.hostEventFallback(HostEvent.Pin, payload, context);
        }
        const formattedPayload = {
            ...payload,
            pinboardId: (_a = payload.liveboardId) !== null && _a !== void 0 ? _a : payload.pinboardId,
            newPinboardName: (_b = payload.newLiveboardName) !== null && _b !== void 0 ? _b : payload.newPinboardName,
        };
        const data = await this.handleHostEventWithParam(UIPassthroughEvent.PinAnswerToLiveboard, formattedPayload, context);
        return {
            ...data,
            liveboardId: data.pinboardId,
        };
    }
    async handleSaveAnswerEvent(payload, context) {
        var _a, _b, _c, _d;
        if (!payload || !('name' in payload) || !('description' in payload)) {
            // Save is the fallback for SaveAnswer
            return this.hostEventFallback(HostEvent.Save, payload, context);
        }
        const data = await this.handleHostEventWithParam(UIPassthroughEvent.SaveAnswer, payload, context);
        return {
            ...data,
            answerId: (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.saveResponse) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.Answer__save) === null || _c === void 0 ? void 0 : _c.answer) === null || _d === void 0 ? void 0 : _d.id,
        };
    }
    handleUpdateFiltersEvent(payload, context) {
        if (!isValidUpdateFiltersPayload(payload)) {
            throwUpdateFiltersValidationError();
        }
        return this.handleHostEventWithParam(UIPassthroughEvent.UpdateFilters, payload, context);
    }
    handleDrillDownEvent(payload, context) {
        if (!isValidDrillDownPayload(payload)) {
            throwDrillDownValidationError();
        }
        return this.handleHostEventWithParam(UIPassthroughEvent.Drilldown, payload, context);
    }
    /**
     * Dispatches a host event using the appropriate channel:
     * 1. If the embedded app supports UI passthrough for this event, use it (custom handler or getter).
     * 2. Otherwise fall back to the legacy host event channel.
     *
     * @param hostEvent - The host event to trigger
     * @param payload - Optional payload for the event
     * @param context - Optional context (e.g. vizId) for scoped operations
     */
    async triggerHostEvent(hostEvent, payload, context) {
        const customHandler = this.customHandlers[hostEvent];
        const passthroughEvent = PASSTHROUGH_MAP[hostEvent];
        // If embedded app supports passthrough but not this event, use legacy channel
        const keys = passthroughEvent ? await this.getAvailableUIPassthroughKeys(context) : [];
        if (passthroughEvent && keys.length > 0 && !keys.includes(passthroughEvent)) {
            return this.hostEventFallback(hostEvent, payload, context);
        }
        // Custom handler (setters) > getter passthrough > legacy fallback
        return (customHandler
            ? customHandler(payload, context)
            : passthroughEvent
                ? this.getDataWithPassthroughFallback(passthroughEvent, hostEvent, payload, context)
                : this.hostEventFallback(hostEvent, payload, context));
    }
}

const DefaultInterceptUrlsMap = {
    [InterceptedApiType.AnswerData]: [
        '/prism/?op=GetChartWithData',
        '/prism/?op=GetTableWithHeadlineData',
        '/prism/?op=GetTableWithData',
    ],
    [InterceptedApiType.LiveboardData]: [
        '/prism/?op=LoadContextBook'
    ],
};
const formatInterceptUrl = (url) => {
    const host = getThoughtSpotHost(getEmbedConfig());
    if (url.startsWith('/'))
        return `${host}${url}`;
    return url;
};
/**
 * Converts user passed url values to proper urls
 * [ANSER_DATA] => ['https://host/pris/op?=op']
 * @param interceptUrls
 * @returns
 */
const processInterceptUrls = (interceptUrls) => {
    let processedUrls = [...interceptUrls];
    Object.entries(DefaultInterceptUrlsMap).forEach(([apiType, apiTypeUrls]) => {
        if (!processedUrls.includes(apiType))
            return;
        processedUrls = processedUrls.filter(url => url !== apiType);
        processedUrls = [...processedUrls, ...apiTypeUrls];
    });
    return processedUrls.map(url => formatInterceptUrl(url));
};
/**
 * Returns the data to be sent to embed to setup intercepts
 * the urls to intercept, timeout etc
 * @param viewConfig
 * @returns
 */
const getInterceptInitData = (viewConfig) => {
    const combinedUrls = [...(viewConfig.interceptUrls || [])];
    if (viewConfig.isOnBeforeGetVizDataInterceptEnabled) {
        combinedUrls.push(InterceptedApiType.AnswerData);
    }
    const shouldInterceptAll = combinedUrls.includes(InterceptedApiType.ALL);
    const interceptUrls = shouldInterceptAll ? [InterceptedApiType.ALL] : processInterceptUrls(combinedUrls);
    const interceptTimeout = viewConfig.interceptTimeout;
    return {
        interceptUrls,
        interceptTimeout,
    };
};
const parseJson = (jsonString) => {
    try {
        const json = JSON.parse(jsonString);
        return [json, null];
    }
    catch (error) {
        return [null, error];
    }
};
/**
 * Parse the api intercept data and return the parsed data and error if any
 * Embed returns the input and init from the fetch call
 */
const parseInterceptData = (eventDataString) => {
    try {
        const [parsedData, error] = parseJson(eventDataString);
        if (error) {
            return [null, error];
        }
        const { input, init } = parsedData;
        const [parsedBody, bodyParseError] = parseJson(init.body);
        if (!bodyParseError) {
            init.body = parsedBody;
        }
        const parsedInit = { input, init };
        return [parsedInit, null];
    }
    catch (error) {
        return [null, error];
    }
};
const getUrlType = (url) => {
    for (const [apiType, apiTypeUrls] of Object.entries(DefaultInterceptUrlsMap)) {
        if (apiTypeUrls.includes(url))
            return apiType;
    }
    // TODO: have a unknown type maybe ??
    return InterceptedApiType.ALL;
};
/**
 * Handle Api intercept event and simulate legacy onBeforeGetVizDataIntercept event
 *
 * embed sends -> ApiIntercept -> we send
 *  ApiIntercept
 *  OnBeforeGetVizDataIntercept (if url is part of DefaultUrlMap.AnswerData)
 *
 * @param params
 * @returns
 */
const handleInterceptEvent = async (params) => {
    var _a, _b, _c, _d, _e;
    const { eventData, executeEvent, viewConfig, getUnsavedAnswerTml } = params;
    const [interceptData, bodyParseError] = parseInterceptData(eventData.data);
    if (bodyParseError) {
        const errorDetails = {
            errorType: ErrorDetailsTypes.API,
            message: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
            code: EmbedErrorCodes.PARSING_API_INTERCEPT_BODY_ERROR,
            error: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
        };
        executeEvent(EmbedEvent.Error, errorDetails);
        logger$3.error('Error parsing request body', bodyParseError);
        return;
    }
    const { input: requestUrl, init } = interceptData;
    const sessionId = (_c = (_b = (_a = init === null || init === void 0 ? void 0 : init.body) === null || _a === void 0 ? void 0 : _a.variables) === null || _b === void 0 ? void 0 : _b.session) === null || _c === void 0 ? void 0 : _c.sessionId;
    const vizId = (_e = (_d = init === null || init === void 0 ? void 0 : init.body) === null || _d === void 0 ? void 0 : _d.variables) === null || _e === void 0 ? void 0 : _e.contextBookId;
    const answerDataUrls = DefaultInterceptUrlsMap[InterceptedApiType.AnswerData];
    const legacyInterceptEnabled = viewConfig.isOnBeforeGetVizDataInterceptEnabled;
    const isAnswerDataUrl = answerDataUrls.includes(requestUrl);
    const sendLegacyIntercept = isAnswerDataUrl && legacyInterceptEnabled;
    if (sendLegacyIntercept) {
        const answerTml = await getUnsavedAnswerTml({ sessionId, vizId });
        // Build the legacy payload for backwards compatibility
        const legacyPayload = {
            data: {
                data: answerTml,
                status: embedEventStatus.END,
                type: EmbedEvent.OnBeforeGetVizDataIntercept
            }
        };
        executeEvent(EmbedEvent.OnBeforeGetVizDataIntercept, legacyPayload);
    }
    const urlType = getUrlType(requestUrl);
    executeEvent(EmbedEvent.ApiIntercept, { ...interceptData, urlType });
};
/**
 * Support both the legacy and new format of the api intercept response
 * @param payload
 * @returns
 */
const processApiInterceptResponse = (payload) => {
    var _a;
    const isLegacyFormat = (_a = payload === null || payload === void 0 ? void 0 : payload.data) === null || _a === void 0 ? void 0 : _a.error;
    if (isLegacyFormat) {
        return processLegacyInterceptResponse(payload);
    }
    return payload;
};
const processLegacyInterceptResponse = (payload) => {
    var _a, _b, _c, _d, _e;
    const errorText = (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.data) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.errorText;
    const errorDescription = (_d = (_c = payload === null || payload === void 0 ? void 0 : payload.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.errorDescription;
    const payloadToSend = {
        execute: (_e = payload === null || payload === void 0 ? void 0 : payload.data) === null || _e === void 0 ? void 0 : _e.execute,
        response: {
            body: {
                errors: [
                    {
                        title: errorText,
                        description: errorDescription,
                        isUserError: true,
                    },
                ],
                data: {},
            },
        },
    };
    return { data: payloadToSend };
};

/**
 * Copyright (c) 2022
 *
 * Base classes
 * @summary Base classes
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
/**
 * Global prefix for all ThoughtSpot postHash Params.
 */
const THOUGHTSPOT_PARAM_PREFIX = 'ts-';
const TS_EMBED_ID = '_thoughtspot-embed';
const VERSION = packageInfo.version;
/**
 * The event id map from v2 event names to v1 event id
 * v1 events are the classic embed events implemented in Blink v1
 * We cannot rename v1 event types to maintain backward compatibility
 * @internal
 */
const V1EventMap = {};
/**
 * Base class for embedding v2 experience
 * Note: the v2 version of ThoughtSpot Blink is built on the new stack:
 * React+GraphQL
 */
class TsEmbed {
    /**
     * Setter for the iframe element
     * @param {HTMLIFrameElement} iFrame HTMLIFrameElement
     */
    setIframeElement(iFrame) {
        this.iFrame = iFrame;
        this.hostEventClient.setIframeElement(iFrame);
    }
    constructor(domSelector, viewConfig) {
        /**
         * The key to store the embed instance in the DOM node
         */
        this.embedNodeKey = '__tsEmbed';
        this.isAppInitialized = false;
        /**
         * Should we encode URL Query Params using base64 encoding which ThoughtSpot
         * will generate for embedding. This provides additional security to
         * ThoughtSpot clusters against Cross site scripting attacks.
         * @default false
         */
        this.shouldEncodeUrlQueryParams = false;
        this.defaultHiddenActions = [Action.ReportError];
        /**
         * Handler for fullscreen change events
         */
        this.fullscreenChangeHandler = null;
        this.subscribedListeners = {};
        this.messageEventListener = (event) => {
            const eventType = this.getEventType(event);
            const eventPort = this.getEventPort(event);
            const eventData = this.formatEventData(event, eventType);
            if (event.source === this.iFrame.contentWindow) {
                const processedEventData = processEventData(eventType, eventData, this.thoughtSpotHost, this.isPreRendered ? this.preRenderWrapper : this.hostElement);
                if (eventType === EmbedEvent.ApiIntercept) {
                    this.handleApiInterceptEvent({ eventData, eventPort });
                    return;
                }
                this.executeCallbacks(eventType, processedEventData, eventPort);
            }
        };
        /**
         * Send Custom style as part of payload of APP_INIT
         * @param _
         * @param responder
         */
        this.appInitCb = async (_, responder) => {
            try {
                const appInitData = await this.getAppInitData();
                this.isAppInitialized = true;
                responder({
                    type: EmbedEvent.APP_INIT,
                    data: appInitData,
                });
            }
            catch (e) {
                logger$3.error(`AppInit failed, Error : ${e === null || e === void 0 ? void 0 : e.message}`);
            }
        };
        this.handleAuthFailure = (error) => {
            logger$3.error(`${ERROR_MESSAGE.INVALID_TOKEN_ERROR} Error : ${error === null || error === void 0 ? void 0 : error.message}`);
            processAuthFailure(error, this.isPreRendered ? this.preRenderWrapper : this.hostElement);
        };
        /**
         * Refresh the auth token if the autoLogin is true and the authType is TrustedAuthTokenCookieless
         * @param _
         * @param responder
         */
        this.tokenRefresh = async (_, responder) => {
            try {
                await this.refreshAuthTokenForCookieless(responder, EmbedEvent.RefreshAuthToken, true);
            }
            catch (e) {
                this.handleAuthFailure(e);
            }
        };
        /**
         * Sends updated auth token to the iFrame to avoid user logout
         * @param _
         * @param responder
         */
        this.updateAuthToken = async (_, responder) => {
            const { authType, autoLogin: autoLoginConfig } = this.embedConfig;
            // Default autoLogin: true for cookieless if undefined/null, otherwise
            // false
            const autoLogin = autoLoginConfig !== null && autoLoginConfig !== void 0 ? autoLoginConfig : (authType === AuthType.TrustedAuthTokenCookieless);
            try {
                await this.refreshAuthTokenForCookieless(responder, EmbedEvent.AuthExpire, false);
            }
            catch (e) {
                this.handleAuthFailure(e);
            }
            if (autoLogin && authType !== AuthType.TrustedAuthTokenCookieless) {
                handleAuth();
            }
            notifyAuthFailure(AuthFailureType.EXPIRY);
        };
        /**
         * Auto Login and send updated authToken to the iFrame to avoid user session logout
         * @param _
         * @param responder
         */
        this.idleSessionTimeout = (_, responder) => {
            handleAuth().then(async () => {
                let authToken = '';
                try {
                    authToken = await getAuthenticationToken(this.embedConfig);
                    responder({
                        type: EmbedEvent.IdleSessionTimeout,
                        data: { authToken },
                    });
                }
                catch (e) {
                    this.handleAuthFailure(e);
                }
            }).catch((e) => {
                logger$3.error(`Auto Login failed, Error : ${e === null || e === void 0 ? void 0 : e.message}`);
            });
            notifyAuthFailure(AuthFailureType.IDLE_SESSION_TIMEOUT);
        };
        /**
         * Register APP_INIT event and sendback init payload
         */
        this.registerAppInit = () => {
            this.on(EmbedEvent.APP_INIT, this.appInitCb, { start: false }, true);
            this.on(EmbedEvent.AuthExpire, this.updateAuthToken, { start: false }, true);
            this.on(EmbedEvent.IdleSessionTimeout, this.idleSessionTimeout, { start: false }, true);
            const embedListenerReadyHandler = this.createEmbedContainerHandler(EmbedEvent.EmbedListenerReady);
            this.on(EmbedEvent.EmbedListenerReady, embedListenerReadyHandler, { start: false }, true);
            const authInitHandler = this.createEmbedContainerHandler(EmbedEvent.AuthInit);
            this.on(EmbedEvent.AuthInit, authInitHandler, { start: false }, true);
            this.on(EmbedEvent.RefreshAuthToken, this.tokenRefresh, { start: false }, true);
        };
        this.showPreRenderByDefault = false;
        /**
         * We can process the customer given payload before sending it to the embed port
         * Embed event handler -> responder -> createEmbedEventResponder -> send response
         * @param eventPort The event port for a specific MessageChannel
         * @param eventType The event type
         * @returns
         */
        this.createEmbedEventResponder = (eventPort, eventType) => {
            const getPayloadToSend = (payload) => {
                if (eventType === EmbedEvent.OnBeforeGetVizDataIntercept) {
                    return processLegacyInterceptResponse(payload);
                }
                if (eventType === EmbedEvent.ApiIntercept) {
                    return processApiInterceptResponse(payload);
                }
                return payload;
            };
            return (payload) => {
                const payloadToSend = getPayloadToSend(payload);
                this.triggerEventOnPort(eventPort, payloadToSend);
            };
        };
        /**
        * @hidden
        * Internal state to track if the embed container is loaded.
        * This is used to trigger events after the embed container is loaded.
        */
        this.isEmbedContainerLoaded = false;
        /**
         * @hidden
         * Internal state to track the callbacks to be executed after the embed container
         * is loaded.
         * This is used to trigger events after the embed container is loaded.
         */
        this.embedContainerReadyCallbacks = [];
        this.createEmbedContainerHandler = (source) => () => {
            const processEmbedContainerReady = () => {
                logger$3.debug('processEmbedContainerReady');
                this.isEmbedContainerLoaded = true;
                this.executeEmbedContainerReadyCallbacks();
            };
            if (source === EmbedEvent.AuthInit) {
                const AUTH_INIT_FALLBACK_DELAY = 1000;
                // Wait for 1 second to ensure the embed container is loaded
                // This is a workaround to ensure the embed container is loaded
                // this is needed until all clusters have EmbedListenerReady event
                setTimeout(processEmbedContainerReady, AUTH_INIT_FALLBACK_DELAY);
            }
            else if (source === EmbedEvent.EmbedListenerReady) {
                processEmbedContainerReady();
            }
        };
        this.hostElement = getDOMNode(domSelector);
        this.eventHandlerMap = new Map();
        this.isError = false;
        this.viewConfig = {
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        };
        this.registerAppInit();
        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_EMBED_CREATE, {
            ...viewConfig,
            sdkVersion: VERSION,
        });
        const embedConfig = getEmbedConfig();
        if (embedConfig) {
            this.embedConfig = embedConfig;
            this.thoughtSpotHost = getThoughtSpotHost(embedConfig);
            this.thoughtSpotV2Base = getV2BasePath(embedConfig);
        }
        this.hostEventClient = new HostEventClient(this.iFrame);
        this.shouldWaitForRenderPromise = !getIsInitCompleted();
        const afterInit = () => {
            this.embedConfig = embedConfig;
            if (!embedConfig.authTriggerContainer && !embedConfig.useEventForSAMLPopup) {
                this.embedConfig.authTriggerContainer = domSelector;
            }
            this.thoughtSpotHost = getThoughtSpotHost(embedConfig);
            this.thoughtSpotV2Base = getV2BasePath(embedConfig);
            this.shouldEncodeUrlQueryParams = embedConfig.shouldEncodeUrlQueryParams;
        };
        if (!this.shouldWaitForRenderPromise) {
            afterInit();
        }
        else {
            this.isReadyForRenderPromise = getInitPromise().then(afterInit).finally(() => {
                this.shouldWaitForRenderPromise = true;
            });
        }
    }
    /**
     * Throws error encountered during initialization.
     */
    throwInitError() {
        this.handleError({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.INIT_SDK_REQUIRED,
            code: EmbedErrorCodes.INIT_ERROR,
            error: ERROR_MESSAGE.INIT_SDK_REQUIRED,
        });
    }
    /**
     * Handles errors within the SDK
     * @param error The error message or object
     * @param errorDetails The error details
     */
    handleError(errorDetails) {
        this.isError = true;
        this.executeCallbacks(EmbedEvent.Error, errorDetails);
        // Log error
        logger$3.error(errorDetails);
    }
    /**
     * Extracts the type field from the event payload
     * @param event The window message event
     */
    getEventType(event) {
        var _a, _b;
        return ((_a = event.data) === null || _a === void 0 ? void 0 : _a.type) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.__type);
    }
    /**
     * Extracts the port field from the event payload
     * @param event  The window message event
     * @returns
     */
    getEventPort(event) {
        if (event.ports.length && event.ports[0]) {
            return event.ports[0];
        }
        return null;
    }
    /**
     * Checks if preauth cache is enabled
     * from the view config and embed config
     * @returns boolean
     */
    isPreAuthCacheEnabled() {
        // Disable preauth cache when:
        // 1. overrideOrgId is present since:
        //    - cached auth info would be for wrong org
        //    - info call response changes for each different overrideOrgId
        // 2. disablePreauthCache is explicitly set to true
        // 3. FullAppEmbed has primary navbar visible since:
        //    - primary navbar requires fresh auth state for navigation
        //    - cached auth may not reflect current user permissions
        const isDisabled = (this.viewConfig.overrideOrgId !== undefined
            || this.embedConfig.disablePreauthCache === true
            || this.isFullAppEmbedWithVisiblePrimaryNavbar());
        return !isDisabled;
    }
    /**
     * Checks if current embed is FullAppEmbed with visible primary navbar
     * @returns boolean
     */
    isFullAppEmbedWithVisiblePrimaryNavbar() {
        const appViewConfig = this.viewConfig;
        // Check if this is a FullAppEmbed (AppEmbed)
        // showPrimaryNavbar defaults to true if not explicitly set to false
        return (appViewConfig.embedComponentType === 'AppEmbed'
            && appViewConfig.showPrimaryNavbar === true);
    }
    /**
     * fix for ts7.sep.cl
     * will be removed for ts7.oct.cl
     * @param event
     * @param eventType
     * @hidden
     */
    formatEventData(event, eventType) {
        const eventData = {
            ...event.data,
            type: eventType,
        };
        if (!eventData.data) {
            eventData.data = event.data.payload;
        }
        return eventData;
    }
    /**
     * Subscribe to network events (online/offline) that should
     * work regardless of auth status
     */
    subscribeToNetworkEvents() {
        this.unsubscribeToNetworkEvents();
        const onlineEventListener = (e) => {
            this.trigger(HostEvent.Reload);
        };
        window.addEventListener('online', onlineEventListener);
        const offlineEventListener = (e) => {
            const errorDetails = {
                errorType: ErrorDetailsTypes.NETWORK,
                message: ERROR_MESSAGE.OFFLINE_WARNING,
                code: EmbedErrorCodes.NETWORK_ERROR,
                offlineWarning: ERROR_MESSAGE.OFFLINE_WARNING,
            };
            this.executeCallbacks(EmbedEvent.Error, errorDetails);
            logger$3.warn(errorDetails);
        };
        window.addEventListener('offline', offlineEventListener);
        this.subscribedListeners.online = onlineEventListener;
        this.subscribedListeners.offline = offlineEventListener;
    }
    handleApiInterceptEvent({ eventData, eventPort }) {
        const executeEvent = (_eventType, data) => {
            this.executeCallbacks(_eventType, data, eventPort);
        };
        const getUnsavedAnswerTml = async (props) => {
            var _a, _b;
            const response = await this.triggerUIPassThrough(UIPassthroughEvent.GetUnsavedAnswerTML, props);
            return (_b = (_a = response.filter((item) => item.value)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        };
        handleInterceptEvent({ eventData, executeEvent, viewConfig: this.viewConfig, getUnsavedAnswerTml });
    }
    /**
     * Subscribe to message events that depend on successful iframe setup
     */
    subscribeToMessageEvents() {
        this.unsubscribeToMessageEvents();
        window.addEventListener('message', this.messageEventListener);
        this.subscribedListeners.message = this.messageEventListener;
    }
    /**
     * Adds event listeners for both network and message events.
     * This maintains backward compatibility with the existing method.
     * Adds a global event listener to window for "message" events.
     * ThoughtSpot detects if a particular event is targeted to this
     * embed instance through an identifier contained in the payload,
     * and executes the registered callbacks accordingly.
     */
    subscribeToEvents() {
        this.subscribeToNetworkEvents();
        this.subscribeToMessageEvents();
    }
    unsubscribeToNetworkEvents() {
        if (this.subscribedListeners.online) {
            window.removeEventListener('online', this.subscribedListeners.online);
            delete this.subscribedListeners.online;
        }
        if (this.subscribedListeners.offline) {
            window.removeEventListener('offline', this.subscribedListeners.offline);
            delete this.subscribedListeners.offline;
        }
    }
    unsubscribeToMessageEvents() {
        if (this.subscribedListeners.message) {
            window.removeEventListener('message', this.subscribedListeners.message);
            delete this.subscribedListeners.message;
        }
    }
    unsubscribeToEvents() {
        Object.keys(this.subscribedListeners).forEach((key) => {
            window.removeEventListener(key, this.subscribedListeners[key]);
        });
    }
    async getAuthTokenForCookielessInit() {
        let authToken = '';
        if (this.embedConfig.authType !== AuthType.TrustedAuthTokenCookieless)
            return authToken;
        try {
            authToken = await getAuthenticationToken(this.embedConfig);
        }
        catch (e) {
            processAuthFailure(e, this.isPreRendered ? this.preRenderWrapper : this.hostElement);
            throw e;
        }
        return authToken;
    }
    async getDefaultAppInitData() {
        var _a, _b, _c;
        const authToken = await this.getAuthTokenForCookielessInit();
        const customActionsResult = getCustomActions([
            ...(this.viewConfig.customActions || []),
            ...(this.embedConfig.customActions || [])
        ]);
        if (customActionsResult.errors.length > 0) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: customActionsResult.errors,
                code: EmbedErrorCodes.CUSTOM_ACTION_VALIDATION,
                error: { type: EmbedErrorCodes.CUSTOM_ACTION_VALIDATION, message: customActionsResult.errors }
            });
        }
        const baseInitData = {
            customisations: getCustomisations(this.embedConfig, this.viewConfig),
            authToken,
            runtimeFilterParams: this.viewConfig.excludeRuntimeFiltersfromURL
                ? getRuntimeFilters(this.viewConfig.runtimeFilters)
                : null,
            runtimeParameterParams: this.viewConfig.excludeRuntimeParametersfromURL
                ? getRuntimeParameters(this.viewConfig.runtimeParameters || [])
                : null,
            hiddenHomepageModules: this.viewConfig.hiddenHomepageModules || [],
            reorderedHomepageModules: this.viewConfig.reorderedHomepageModules || [],
            hostConfig: this.embedConfig.hostConfig,
            hiddenHomeLeftNavItems: ((_a = this.viewConfig) === null || _a === void 0 ? void 0 : _a.hiddenHomeLeftNavItems)
                ? (_b = this.viewConfig) === null || _b === void 0 ? void 0 : _b.hiddenHomeLeftNavItems
                : [],
            customVariablesForThirdPartyTools: this.embedConfig.customVariablesForThirdPartyTools || {},
            hiddenListColumns: this.viewConfig.hiddenListColumns || [],
            customActions: customActionsResult.actions,
            embedExpiryInAuthToken: (_c = this.viewConfig.refreshAuthTokenOnNearExpiry) !== null && _c !== void 0 ? _c : true,
            ...getInterceptInitData(this.viewConfig),
            ...getHostEventsConfig(this.viewConfig),
        };
        return baseInitData;
    }
    async getAppInitData() {
        return this.getDefaultAppInitData();
    }
    /**
     * Helper method to refresh/update auth token for TrustedAuthTokenCookieless auth type
     * @param responder - Function to send response back
     * @param eventType - The embed event type to send
     * @param forceRefresh - Whether to force refresh the token
     * @returns Promise that resolves if token was refreshed, rejects otherwise
     */
    async refreshAuthTokenForCookieless(responder, eventType, forceRefresh = false) {
        const { authType, autoLogin } = this.embedConfig;
        const isAutoLoginTrue = autoLogin !== null && autoLogin !== void 0 ? autoLogin : (authType === AuthType.TrustedAuthTokenCookieless);
        if (isAutoLoginTrue && authType === AuthType.TrustedAuthTokenCookieless) {
            const authToken = await getAuthenticationToken(this.embedConfig, forceRefresh);
            responder({
                type: eventType,
                data: { authToken },
            });
        }
    }
    /**
     * Constructs the base URL string to load the ThoughtSpot app.
     * @param query
     */
    getEmbedBasePath(query) {
        let queryString = query.startsWith('?') ? query : `?${query}`;
        if (this.shouldEncodeUrlQueryParams) {
            queryString = `?base64UrlEncodedFlags=${getEncodedQueryParamsString(queryString.substr(1))}`;
        }
        const basePath = [this.thoughtSpotHost, this.thoughtSpotV2Base, queryString]
            .filter((x) => x.length > 0)
            .join('/');
        return `${basePath}#`;
    }
    async getUpdateEmbedParamsObject() {
        let queryParams = this.getEmbedParamsObject();
        const appInitData = await this.getAppInitData();
        queryParams = { ...this.viewConfig, ...queryParams, ...appInitData };
        return queryParams;
    }
    /**
     * Common query params set for all the embed modes.
     * @param queryParams
     * @returns queryParams
     */
    getBaseQueryParams(queryParams = {}) {
        var _a, _b, _c, _d;
        let hostAppUrl = ((_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.host) || '';
        // The below check is needed because TS Cloud firewall, blocks
        // localhost/127.0.0.1 in any url param.
        if (hostAppUrl.includes('localhost') || hostAppUrl.includes('127.0.0.1')) {
            hostAppUrl = 'local-host';
        }
        const blockNonEmbedFullAppAccess = (_b = this.embedConfig.blockNonEmbedFullAppAccess) !== null && _b !== void 0 ? _b : true;
        queryParams[Param.EmbedApp] = true;
        queryParams[Param.HostAppUrl] = encodeURIComponent(hostAppUrl);
        queryParams[Param.ViewPortHeight] = window.innerHeight;
        queryParams[Param.ViewPortWidth] = window.innerWidth;
        queryParams[Param.Version] = VERSION;
        queryParams[Param.AuthType] = this.embedConfig.authType;
        queryParams[Param.blockNonEmbedFullAppAccess] = blockNonEmbedFullAppAccess;
        queryParams[Param.AutoLogin] = this.embedConfig.autoLogin;
        if (this.embedConfig.disableLoginRedirect === true || this.embedConfig.autoLogin === true) {
            queryParams[Param.DisableLoginRedirect] = true;
        }
        if (this.embedConfig.authType === AuthType.EmbeddedSSO) {
            queryParams[Param.ForceSAMLAutoRedirect] = true;
        }
        if (this.embedConfig.authType === AuthType.TrustedAuthTokenCookieless) {
            queryParams[Param.cookieless] = true;
        }
        if (this.embedConfig.pendoTrackingKey) {
            queryParams[Param.PendoTrackingKey] = this.embedConfig.pendoTrackingKey;
        }
        if (this.embedConfig.numberFormatLocale) {
            queryParams[Param.NumberFormatLocale] = this.embedConfig.numberFormatLocale;
        }
        if (this.embedConfig.dateFormatLocale) {
            queryParams[Param.DateFormatLocale] = this.embedConfig.dateFormatLocale;
        }
        if (this.embedConfig.currencyFormat) {
            queryParams[Param.CurrencyFormat] = this.embedConfig.currencyFormat;
        }
        const { disabledActions, disabledActionReason, hiddenActions, visibleActions, hiddenTabs, visibleTabs, showAlerts, additionalFlags: additionalFlagsFromView, locale, customizations, contextMenuTrigger, linkOverride, enableLinkOverridesV2, insertInToSlide, disableRedirectionLinksInNewTab, overrideOrgId, exposeTranslationIDs, primaryAction, } = this.viewConfig;
        const { additionalFlags: additionalFlagsFromInit } = this.embedConfig;
        const additionalFlags = {
            ...additionalFlagsFromInit,
            ...additionalFlagsFromView,
        };
        if (Array.isArray(visibleActions) && Array.isArray(hiddenActions)) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.CONFLICTING_ACTIONS_CONFIG,
                code: EmbedErrorCodes.CONFLICTING_ACTIONS_CONFIG,
                error: ERROR_MESSAGE.CONFLICTING_ACTIONS_CONFIG,
            });
            return queryParams;
        }
        if (Array.isArray(visibleTabs) && Array.isArray(hiddenTabs)) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.CONFLICTING_TABS_CONFIG,
                code: EmbedErrorCodes.CONFLICTING_TABS_CONFIG,
                error: ERROR_MESSAGE.CONFLICTING_TABS_CONFIG,
            });
            return queryParams;
        }
        if (primaryAction) {
            queryParams[Param.PrimaryAction] = primaryAction;
        }
        if (disabledActions === null || disabledActions === void 0 ? void 0 : disabledActions.length) {
            queryParams[Param.DisableActions] = disabledActions;
        }
        if (disabledActionReason) {
            queryParams[Param.DisableActionReason] = disabledActionReason;
        }
        if (exposeTranslationIDs) {
            queryParams[Param.ExposeTranslationIDs] = exposeTranslationIDs;
        }
        queryParams[Param.HideActions] = [...this.defaultHiddenActions, ...(hiddenActions !== null && hiddenActions !== void 0 ? hiddenActions : [])];
        if (Array.isArray(visibleActions)) {
            queryParams[Param.VisibleActions] = visibleActions;
        }
        if (Array.isArray(hiddenTabs)) {
            queryParams[Param.HiddenTabs] = hiddenTabs;
        }
        if (Array.isArray(visibleTabs)) {
            queryParams[Param.VisibleTabs] = visibleTabs;
        }
        /**
         * Default behavior for context menu will be left-click
         *  from version 9.2.0.cl the user have an option to override context
         *  menu click
         */
        if (contextMenuTrigger === ContextMenuTriggerOptions.LEFT_CLICK) {
            queryParams[Param.ContextMenuTrigger] = 'left';
        }
        else if (contextMenuTrigger === ContextMenuTriggerOptions.RIGHT_CLICK) {
            queryParams[Param.ContextMenuTrigger] = 'right';
        }
        else if (contextMenuTrigger === ContextMenuTriggerOptions.BOTH_CLICKS) {
            queryParams[Param.ContextMenuTrigger] = 'both';
        }
        const embedCustomizations = this.embedConfig.customizations;
        const spriteUrl = (customizations === null || customizations === void 0 ? void 0 : customizations.iconSpriteUrl) || (embedCustomizations === null || embedCustomizations === void 0 ? void 0 : embedCustomizations.iconSpriteUrl);
        if (spriteUrl) {
            queryParams[Param.IconSpriteUrl] = spriteUrl.replace('https://', '');
        }
        const stringIDsUrl = ((_c = customizations === null || customizations === void 0 ? void 0 : customizations.content) === null || _c === void 0 ? void 0 : _c.stringIDsUrl)
            || ((_d = embedCustomizations === null || embedCustomizations === void 0 ? void 0 : embedCustomizations.content) === null || _d === void 0 ? void 0 : _d.stringIDsUrl);
        if (stringIDsUrl) {
            queryParams[Param.StringIDsUrl] = stringIDsUrl;
        }
        if (showAlerts !== undefined) {
            queryParams[Param.ShowAlerts] = showAlerts;
        }
        if (locale !== undefined) {
            queryParams[Param.Locale] = locale;
        }
        // TODO: Once V2 is stable, send both flags when
        // linkOverride is true (remove the else-if).
        if (enableLinkOverridesV2) {
            queryParams[Param.EnableLinkOverridesV2] = true;
            queryParams[Param.LinkOverride] = true;
        }
        else if (linkOverride) {
            queryParams[Param.LinkOverride] = linkOverride;
        }
        if (insertInToSlide) {
            queryParams[Param.ShowInsertToSlide] = insertInToSlide;
        }
        if (disableRedirectionLinksInNewTab) {
            queryParams[Param.DisableRedirectionLinksInNewTab] = disableRedirectionLinksInNewTab;
        }
        if (overrideOrgId !== undefined) {
            queryParams[Param.OverrideOrgId] = overrideOrgId;
        }
        if (this.isPreAuthCacheEnabled()) {
            queryParams[Param.preAuthCache] = true;
        }
        queryParams[Param.OverrideNativeConsole] = true;
        queryParams[Param.ClientLogLevel] = this.embedConfig.logLevel;
        if (isObject_1(additionalFlags) && !isEmpty_1(additionalFlags)) {
            Object.assign(queryParams, additionalFlags);
        }
        // Do not add any flags below this, as we want additional flags to
        // override other flags
        return queryParams;
    }
    /**
     * Constructs the base URL string to load v1 of the ThoughtSpot app.
     * This is used for embedding Liveboards, visualizations, and full application.
     * @param queryString The query string to append to the URL.
     * @param isAppEmbed A Boolean parameter to specify if you are embedding
     * the full application.
     */
    getV1EmbedBasePath(queryString) {
        const queryParams = this.shouldEncodeUrlQueryParams
            ? `?base64UrlEncodedFlags=${getEncodedQueryParamsString(queryString)}`
            : `?${queryString}`;
        const host = this.thoughtSpotHost;
        const path = `${host}/${queryParams}#`;
        return path;
    }
    getEmbedParams() {
        const queryParams = this.getEmbedParamsObject();
        return getQueryParamString(queryParams);
    }
    getEmbedParamsObject() {
        const params = this.getBaseQueryParams();
        return params;
    }
    getRootIframeSrc() {
        const query = this.getEmbedParams();
        return this.getEmbedBasePath(query);
    }
    createIframeEl(frameSrc) {
        const iFrame = document.createElement('iframe');
        iFrame.src = frameSrc;
        iFrame.id = TS_EMBED_ID;
        iFrame.setAttribute('data-ts-iframe', 'true');
        // according to screenfull.js documentation
        // allowFullscreen, webkitallowfullscreen and mozallowfullscreen must be
        // true
        iFrame.allowFullscreen = true;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        iFrame.webkitallowfullscreen = true;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        iFrame.mozallowfullscreen = true;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        iFrame.allow = 'clipboard-read; clipboard-write; fullscreen; local-network-access;';
        const frameParams = this.viewConfig.frameParams;
        const { height: frameHeight, width: frameWidth, ...restParams } = frameParams || {};
        const width = getCssDimension(frameWidth || DEFAULT_EMBED_WIDTH);
        const height = getCssDimension(frameHeight || DEFAULT_EMBED_HEIGHT);
        setAttributes(iFrame, restParams);
        iFrame.style.width = `${width}`;
        iFrame.style.height = `${height}`;
        // Set minimum height to the frame so that,
        // scaling down on the fullheight doesn't make it too small.
        iFrame.style.minHeight = `${height}`;
        iFrame.style.border = '0';
        iFrame.name = 'ThoughtSpot Embedded Analytics';
        return iFrame;
    }
    /**
     * Returns true if this embed instance is configured for pre-rendering.
     */
    isPreRenderEmbed() {
        return !!this.viewConfig.preRenderId;
    }
    handleInsertionIntoDOM(child) {
        if (this.isPreRenderEmbed()) {
            this.insertIntoDOMForPreRender(child);
        }
        else {
            this.insertIntoDOM(child);
        }
        if (this.insertedDomEl instanceof Node) {
            this.insertedDomEl[this.embedNodeKey] = this;
        }
        if (this.preRenderWrapper) {
            this.preRenderWrapper[this.embedNodeKey] = this;
        }
    }
    /**
     * Renders the embedded ThoughtSpot app in an iframe and sets up
     * event listeners.
     * @param url - The URL of the embedded ThoughtSpot app.
     */
    async renderIFrame(url) {
        if (this.isError) {
            return null;
        }
        if (!this.thoughtSpotHost) {
            this.throwInitError();
        }
        if (url.length > URL_MAX_LENGTH) ;
        return renderInQueue((nextInQueue) => {
            var _a;
            const initTimestamp = Date.now();
            this.executeCallbacks(EmbedEvent.Init, {
                data: {
                    timestamp: initTimestamp,
                },
                type: EmbedEvent.Init,
            });
            uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_START);
            // Always subscribe to network events, regardless of auth status
            this.subscribeToNetworkEvents();
            return (_a = getAuthPromise()) === null || _a === void 0 ? void 0 : _a.then((isLoggedIn) => {
                if (!isLoggedIn) {
                    this.handleInsertionIntoDOM(this.embedConfig.loginFailedMessage);
                    return;
                }
                this.setIframeElement(this.iFrame || this.createIframeEl(url));
                this.iFrame.addEventListener('load', () => {
                    nextInQueue();
                    const loadTimestamp = Date.now();
                    this.executeCallbacks(EmbedEvent.Load, {
                        data: {
                            timestamp: loadTimestamp,
                        },
                        type: EmbedEvent.Load,
                    });
                    uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_COMPLETE, {
                        elWidth: this.iFrame.clientWidth,
                        elHeight: this.iFrame.clientHeight,
                        timeTookToLoad: loadTimestamp - initTimestamp,
                    });
                    // Send info event  if preauth cache is enabled
                    if (this.isPreAuthCacheEnabled()) {
                        getPreauthInfo().then((data) => {
                            if (data === null || data === void 0 ? void 0 : data.info) {
                                this.trigger(HostEvent.InfoSuccess, data);
                            }
                        });
                    }
                    // Setup fullscreen change handler after iframe is
                    // loaded and ready
                    this.setupFullscreenChangeHandler();
                });
                this.iFrame.addEventListener('error', () => {
                    nextInQueue();
                });
                this.handleInsertionIntoDOM(this.iFrame);
                const prefetchIframe = document.querySelectorAll('.prefetchIframe');
                if (prefetchIframe.length) {
                    prefetchIframe.forEach((el) => {
                        el.remove();
                    });
                }
                // Subscribe to message events only after successful
                // auth and iframe setup
                this.subscribeToMessageEvents();
            }).catch((error) => {
                nextInQueue();
                uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_RENDER_FAILED, {
                    error: JSON.stringify(error),
                });
                this.handleInsertionIntoDOM(this.embedConfig.loginFailedMessage);
                this.handleError({
                    errorType: ErrorDetailsTypes.API,
                    message: error.message || ERROR_MESSAGE.LOGIN_FAILED,
                    code: EmbedErrorCodes.LOGIN_FAILED,
                    error: error,
                });
            });
        });
    }
    createPreRenderWrapper() {
        var _a;
        const preRenderIds = this.getPreRenderIds();
        (_a = document.getElementById(preRenderIds.wrapper)) === null || _a === void 0 ? void 0 : _a.remove();
        const preRenderWrapper = document.createElement('div');
        preRenderWrapper.id = preRenderIds.wrapper;
        const initialPreRenderWrapperStyle = {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
        };
        setStyleProperties(preRenderWrapper, initialPreRenderWrapperStyle);
        return preRenderWrapper;
    }
    /**
     * Checks for an existing pre-rendered component and connects to it.
     *
     * If a matching pre-rendered component is found in the DOM, this method
     * sets the internal properties of the embed object to reference it.
     *
     * @returns True if a connection was successfully established, false otherwise.
     */
    connectPreRendered() {
        const preRenderIds = this.getPreRenderIds();
        const preRenderWrapperElement = document.getElementById(preRenderIds.wrapper);
        this.preRenderWrapper = this.preRenderWrapper || preRenderWrapperElement;
        this.preRenderChild = this.preRenderChild || document.getElementById(preRenderIds.child);
        if (this.preRenderWrapper && this.preRenderChild) {
            this.isPreRendered = true;
            if (this.preRenderChild instanceof HTMLIFrameElement) {
                this.setIframeElement(this.preRenderChild);
            }
            this.isRendered = true;
        }
        return this.isPreRenderConnected();
    }
    isPreRenderConnected() {
        return (Boolean(this.preRenderWrapper && this.preRenderChild));
    }
    createPreRenderChild(child) {
        var _a;
        const preRenderIds = this.getPreRenderIds();
        (_a = document.getElementById(preRenderIds.child)) === null || _a === void 0 ? void 0 : _a.remove();
        if (child instanceof HTMLElement) {
            child.id = preRenderIds.child;
            return child;
        }
        const divChildNode = document.createElement('div');
        setStyleProperties(divChildNode, { width: '100%', height: '100%' });
        divChildNode.id = preRenderIds.child;
        if (typeof child === 'string') {
            divChildNode.innerHTML = child;
        }
        else {
            divChildNode.appendChild(child);
        }
        return divChildNode;
    }
    /**
     * Creates the in-flow placeholder div inserted into the host element when
     * showPreRender() is called. The wrapper observes this element to stay
     * aligned with the host layout.
     */
    createPreRenderPlaceholder() {
        const placeholder = document.createElement('div');
        const id = this.getPreRenderIds();
        const { width: frameWidth, height: frameHeight } = this.viewConfig.frameParams || {};
        const width = getCssDimension(frameWidth || DEFAULT_EMBED_WIDTH);
        const height = getCssDimension(frameHeight || DEFAULT_EMBED_HEIGHT);
        placeholder.style.width = width;
        placeholder.style.height = height;
        // we can improve this , lol
        placeholder.id = id.placeHolder;
        return placeholder;
    }
    insertIntoDOMForPreRender(child) {
        const preRenderChild = this.createPreRenderChild(child);
        const preRenderWrapper = this.createPreRenderWrapper();
        preRenderWrapper.appendChild(preRenderChild);
        this.preRenderChild = preRenderChild;
        this.preRenderWrapper = preRenderWrapper;
        if (preRenderChild instanceof HTMLIFrameElement) {
            this.setIframeElement(preRenderChild);
        }
        if (this.iFrame) {
            this.iFrame.style.height = '100%';
            this.iFrame.style.width = '100%';
        }
        if (this.showPreRenderByDefault) {
            this.showPreRender();
        }
        else {
            this.hidePreRender();
        }
        document.body.appendChild(preRenderWrapper);
    }
    insertIntoDOM(child) {
        var _a;
        if (this.viewConfig.insertAsSibling) {
            if (typeof child === 'string') {
                const div = document.createElement('div');
                div.innerHTML = child;
                div.id = TS_EMBED_ID;
                child = div;
            }
            if (((_a = this.hostElement.nextElementSibling) === null || _a === void 0 ? void 0 : _a.id) === TS_EMBED_ID) {
                this.hostElement.nextElementSibling.remove();
            }
            this.hostElement.parentElement.insertBefore(child, this.hostElement.nextSibling);
            this.insertedDomEl = child;
        }
        else if (typeof child === 'string') {
            this.hostElement.innerHTML = child;
            this.insertedDomEl = this.hostElement.children[0];
        }
        else {
            this.hostElement.innerHTML = '';
            this.hostElement.appendChild(child);
            this.insertedDomEl = child;
        }
    }
    /**
     * Sets the height of the iframe
     * @param height The height in pixels
     */
    setIFrameHeight(height) {
        if (this.isPreRendered) {
            if (this.insertedDomEl)
                this.insertedDomEl.style.height = getCssDimension(height);
            else
                this.preRenderWrapper.style.height = getCssDimension(height);
        }
        else {
            // normal (non-preRender) mode: size the iframe directly
            this.iFrame.style.height = getCssDimension(height);
        }
    }
    shouldSkipEvent(eventType, data) {
        var _a, _b, _c;
        const errorType = (_a = data === null || data === void 0 ? void 0 : data.errorType) !== null && _a !== void 0 ? _a : (_b = data === null || data === void 0 ? void 0 : data.data) === null || _b === void 0 ? void 0 : _b.code;
        if (eventType === EmbedEvent.Error
            && errorType === EmbedErrorCodes.HOST_EVENT_VALIDATION
            && (!getHostEventsConfig(this.viewConfig).useHostEventsV2 || getHostEventsConfig(this.viewConfig).shouldBypassPayloadValidation)) {
            logger$3.warn(`Host Event Validation failed: ${(_c = data === null || data === void 0 ? void 0 : data.data) === null || _c === void 0 ? void 0 : _c.message}`);
            return true;
        }
        return false;
    }
    /**
     * Executes all registered event handlers for a particular event type
     * @param eventType The event type
     * @param data The payload invoked with the event handler
     * @param eventPort The event Port for a specific MessageChannel
     */
    executeCallbacks(eventType, data, eventPort) {
        if (this.shouldSkipEvent(eventType, data))
            return;
        const eventHandlers = this.eventHandlerMap.get(eventType) || [];
        const allHandlers = this.eventHandlerMap.get(EmbedEvent.ALL) || [];
        const callbacks = [...eventHandlers, ...allHandlers];
        const dataStatus = (data === null || data === void 0 ? void 0 : data.status) || embedEventStatus.END;
        callbacks.forEach((callbackObj) => {
            if (
            // When start status is true it trigger only start releated
            // payload
            (callbackObj.options.start && dataStatus === embedEventStatus.START)
                // When start status is false it trigger only end releated
                // payload
                || (!callbackObj.options.start && dataStatus === embedEventStatus.END)) {
                const responder = this.createEmbedEventResponder(eventPort, eventType);
                callbackObj.callback(data, responder);
            }
        });
    }
    /**
     * Returns the ThoughtSpot hostname or IP address.
     */
    getThoughtSpotHost() {
        return this.thoughtSpotHost;
    }
    /**
     * Gets the v1 event type (if applicable) for the EmbedEvent type
     * @param eventType The v2 event type
     * @returns The corresponding v1 event type if one exists
     * or else the v2 event type itself
     */
    getCompatibleEventType(eventType) {
        return V1EventMap[eventType] || eventType;
    }
    /**
     * Calculates the iframe center for the current visible viewPort
     * of iframe using Scroll position of Host App, offsetTop for iframe
     * in Host app. ViewPort height of the tab.
     * @returns iframe Center in visible viewport,
     *  Iframe height,
     *  View port height.
     */
    getIframeCenter() {
        const offsetTopClient = getOffsetTop(this.iFrame);
        const scrollTopClient = window.scrollY;
        const viewPortHeight = window.innerHeight;
        const iframeHeight = this.iFrame.offsetHeight;
        const iframeScrolled = scrollTopClient - offsetTopClient;
        let iframeVisibleViewPort;
        let iframeOffset;
        if (iframeScrolled < 0) {
            iframeVisibleViewPort = viewPortHeight - (offsetTopClient - scrollTopClient);
            iframeVisibleViewPort = Math.min(iframeHeight, iframeVisibleViewPort);
            iframeOffset = 0;
        }
        else {
            iframeVisibleViewPort = Math.min(iframeHeight - iframeScrolled, viewPortHeight);
            iframeOffset = iframeScrolled;
        }
        const iframeCenter = iframeOffset + iframeVisibleViewPort / 2;
        return {
            iframeCenter,
            iframeScrolled,
            iframeHeight,
            viewPortHeight,
            iframeVisibleViewPort,
        };
    }
    /**
     * Registers an event listener to trigger an alert when the ThoughtSpot app
     * sends an event of a particular message type to the host application.
     * @param messageType The message type
     * @param callback A callback as a function
     * @param options The message options
     * @param isSelf
     * @param isRegisteredBySDK
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Error, (data) => {
     *   console.error(data);
     * });
     * ```
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Save, (data) => {
     *   console.log("Answer save clicked", data);
     * }, {
     *   start: true // This will trigger the callback on start of save
     * });
     * ```
     */
    on(messageType, callback, options = { start: false }, isRegisteredBySDK = false) {
        uploadMixpanelEvent(`${MIXPANEL_EVENT.VISUAL_SDK_ON}-${messageType}`, {
            isRegisteredBySDK,
        });
        if (this.isRendered) {
            logger$3.warn('Please register event handlers before calling render');
        }
        const callbacks = this.eventHandlerMap.get(messageType) || [];
        callbacks.push({ options, callback });
        this.eventHandlerMap.set(messageType, callbacks);
        return this;
    }
    /**
     * Removes an event listener for a particular event type.
     * @param messageType The message type
     * @param callback The callback to remove
     * @example
     * ```js
     * const errorHandler = (data) => { console.error(data); };
     * tsEmbed.on(EmbedEvent.Error, errorHandler);
     * tsEmbed.off(EmbedEvent.Error, errorHandler);
     * ```
     */
    off(messageType, callback) {
        const callbacks = this.eventHandlerMap.get(messageType) || [];
        const index = callbacks.findIndex((cb) => cb.callback === callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
        return this;
    }
    /**
     * Triggers an event on specific Port registered against
     * for the EmbedEvent
     * @param eventType The message type
     * @param data The payload to send
     * @param eventPort
     * @param payload
     */
    triggerEventOnPort(eventPort, payload) {
        if (eventPort) {
            try {
                eventPort.postMessage({
                    type: payload.type,
                    data: payload.data,
                });
            }
            catch (e) {
                eventPort.postMessage({ error: e });
                logger$3.log(e);
            }
        }
        else {
            logger$3.log('Event Port is not defined');
        }
    }
    getPreRenderObj() {
        var _a;
        const embedObj = (_a = this.preRenderWrapper) === null || _a === void 0 ? void 0 : _a[this.embedNodeKey];
        if (embedObj === this) {
            logger$3.info('embedObj is same as this');
        }
        return embedObj;
    }
    checkEmbedContainerLoaded() {
        if (this.isEmbedContainerLoaded)
            return true;
        const preRenderObj = this.getPreRenderObj();
        if (preRenderObj && preRenderObj.isEmbedContainerLoaded) {
            this.isEmbedContainerLoaded = true;
        }
        return this.isEmbedContainerLoaded;
    }
    executeEmbedContainerReadyCallbacks() {
        logger$3.debug('executePendingEvents', this.embedContainerReadyCallbacks);
        this.embedContainerReadyCallbacks.forEach((callback) => {
            callback === null || callback === void 0 ? void 0 : callback();
        });
        this.embedContainerReadyCallbacks = [];
    }
    /**
     * Executes a callback after the embed container is loaded.
     * @param callback The callback to execute
     */
    executeAfterEmbedContainerLoaded(callback) {
        if (this.checkEmbedContainerLoaded()) {
            callback === null || callback === void 0 ? void 0 : callback();
        }
        else {
            logger$3.debug('pushing callback to embedContainerReadyCallbacks', callback);
            this.embedContainerReadyCallbacks.push(callback);
        }
    }
    /**
     * Triggers an event to the embedded app
     * @param {HostEvent} messageType The event type
     * @param {any} data The payload to send with the message
     * @param {ContextType} context Optional context type to specify the context from which the event is triggered.
     * Use ContextType.Search for search answer context, ContextType.Answer for answer/explore context,
     * ContextType.Liveboard for liveboard context, or ContextType.Spotter for spotter context.
     * Available from SDK version 1.45.2 | ThoughtSpot: 26.3.0.cl
     * @returns A promise that resolves with the response from the embedded app
     * @example
     * ```js
     * // Trigger Pin event with context (SDK: 1.45.2+)
     * import { HostEvent, ContextType } from '@thoughtspot/visual-embed-sdk';
     * embed.trigger(HostEvent.Pin, {
     *   vizId: "123",
     *   liveboardId: "456"
     * }, ContextType.Search);
     * ```
     * @version SDK: 1.45.2 | ThoughtSpot: 26.3.0.cl (for context parameter)
     */
    async trigger(messageType, data = {}, context) {
        uploadMixpanelEvent(`${MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${messageType}`);
        if (!this.isRendered) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.RENDER_BEFORE_EVENTS_REQUIRED,
                code: EmbedErrorCodes.RENDER_NOT_CALLED,
                error: ERROR_MESSAGE.RENDER_BEFORE_EVENTS_REQUIRED,
            });
            return null;
        }
        if (!messageType) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.HOST_EVENT_TYPE_UNDEFINED,
                code: EmbedErrorCodes.HOST_EVENT_TYPE_UNDEFINED,
                error: ERROR_MESSAGE.HOST_EVENT_TYPE_UNDEFINED,
            });
            return null;
        }
        // Check if iframe exists before triggering - 
        // this prevents the error when auth fails
        if (!this.iFrame) {
            logger$3.debug(`Cannot trigger ${messageType} - iframe not available (likely due to auth failure)`);
            return null;
        }
        // send an empty object, this is needed for liveboard default handlers
        return this.hostEventClient.triggerHostEvent(messageType, data, context).catch((err) => {
            var _a;
            if (err === null || err === void 0 ? void 0 : err.isValidationError) {
                const errorDetails = (_a = err.embedErrorDetails) !== null && _a !== void 0 ? _a : {
                    errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                    message: err.message || ERROR_MESSAGE.UPDATEFILTERS_INVALID_PAYLOAD,
                    code: EmbedErrorCodes.UPDATEFILTERS_INVALID_PAYLOAD,
                    error: err.message,
                };
                this.handleError(errorDetails);
            }
            throw err;
        });
    }
    /**
     * Triggers an event to the embedded app, skipping the UI flow.
     * @param {UIPassthroughEvent} apiName - The name of the API to be triggered.
     * @param {UIPassthroughRequest} parameters - The parameters to be passed to the API.
     * @returns {Promise<UIPassthroughRequest>} - A promise that resolves with the response
     * from the embedded app.
     */
    async triggerUIPassThrough(apiName, parameters) {
        const response = this.hostEventClient.triggerUIPassthroughApi(apiName, parameters);
        return response;
    }
    /**
     * Marks the ThoughtSpot object to have been rendered
     * Needs to be overridden by subclasses to do the actual
     * rendering of the iframe.
     * @param args
     */
    async render() {
        if (!getIsInitCalled()) {
            logger$3.error(ERROR_MESSAGE.RENDER_CALLED_BEFORE_INIT);
        }
        if (this.shouldWaitForRenderPromise)
            await this.isReadyForRenderPromise;
        this.isRendered = true;
        return this;
    }
    getIframeSrc() {
        return '';
    }
    handleRenderForPrerender() {
        return this.render();
    }
    /**
    * Context object for the embedded component.
    * @returns {ContextObject} The current context object containing the page type and object ids.
    * @example
    * ```js
    * const context = await embed.getCurrentContext();
    * console.log(context);
    *
    * // Example output
    * {
    *   stack: [
    *     {
    *       name: 'Liveboard',
    *       type: ContextType.Liveboard,
    *       objectIds: {
    *         liveboardId: '123',
    *       },
    *     },
    *   ],
    *   currentContext: {
    *     name: 'Liveboard',
    *     type: ContextType.Liveboard,
    *     objectIds: {
    *       liveboardId: '123',
    *     },
    *   },
    * }
    * ```
     * @version SDK: 1.45.2 | ThoughtSpot: 26.3.0.cl
     */
    async getCurrentContext() {
        return new Promise((resolve) => {
            this.executeAfterEmbedContainerLoaded(async () => {
                const context = await this.trigger(HostEvent.GetPageContext, {});
                resolve(context);
            });
        });
    }
    /**
     * Generates the event name for a "Subscribed" embed event.
     *
     * This helper appends the "Subscribed" suffix to a given host or action event,
     * allowing you to listen for subscription lifecycle events in a consistent format.
     *
     * @param eventName - The host or action event to generate the subscribed event name for.
     * @returns The formatted event name (e.g., "Save Subscribed").
     *
     * @version SDK: 1.47.2 | ThoughtSpot: 26.3.0.cl
     */
    subscribedEvent(eventName) {
        return `${eventName} ${EmbedEvent.Subscribed}`;
    }
    /**
     * Creates the preRender shell
     * @param showPreRenderByDefault - Show the preRender after render, hidden by default
     */
    async preRender(showPreRenderByDefault = false, replaceExistingPreRender = false) {
        if (!this.viewConfig.preRenderId) {
            logger$3.error(ERROR_MESSAGE.PRERENDER_ID_MISSING);
            return this;
        }
        this.isPreRendered = true;
        this.showPreRenderByDefault = showPreRenderByDefault;
        const isAlreadyRendered = this.connectPreRendered();
        if (isAlreadyRendered && !replaceExistingPreRender) {
            if (this.showPreRenderByDefault) {
                this.showPreRender();
            }
            return this;
        }
        return this.handleRenderForPrerender();
    }
    /**
     * Get the Post Url Params for THOUGHTSPOT from the current
     * host app URL.
     * THOUGHTSPOT URL params starts with a prefix "ts-"
     * @version SDK: 1.14.0 | ThoughtSpot: 8.4.0.cl, 8.4.1-sw
     */
    getThoughtSpotPostUrlParams(additionalParams = {}) {
        const urlHash = window.location.hash;
        const queryParams = window.location.search;
        const postHashParams = urlHash.split('?');
        const postURLParams = postHashParams[postHashParams.length - 1];
        const queryParamsObj = new URLSearchParams(queryParams);
        const postURLParamsObj = new URLSearchParams(postURLParams);
        const params = new URLSearchParams();
        const addKeyValuePairCb = (value, key) => {
            if (key.startsWith(THOUGHTSPOT_PARAM_PREFIX)) {
                params.append(key, value);
            }
        };
        queryParamsObj.forEach(addKeyValuePairCb);
        postURLParamsObj.forEach(addKeyValuePairCb);
        Object.entries(additionalParams).forEach(([k, v]) => params.append(k, v));
        let tsParams = params.toString();
        tsParams = tsParams ? `?${tsParams}` : '';
        return tsParams;
    }
    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.19.1 | ThoughtSpot: *
     */
    destroy() {
        var _a, _b, _c;
        try {
            this.removeFullscreenChangeHandler();
            this.unsubscribeToEvents();
            (_a = this.preRenderWrapper) === null || _a === void 0 ? void 0 : _a.remove();
            if (!this.isRendered) {
                return;
            }
            if (!getEmbedConfig().waitForCleanupOnDestroy) {
                this.trigger(HostEvent.DestroyEmbed);
                (_c = (_b = this.insertedDomEl) === null || _b === void 0 ? void 0 : _b.parentNode) === null || _c === void 0 ? void 0 : _c.removeChild(this.insertedDomEl);
            }
            else {
                const cleanupTimeout = getEmbedConfig().cleanupTimeout;
                Promise.race([
                    this.trigger(HostEvent.DestroyEmbed),
                    new Promise((resolve) => setTimeout(resolve, cleanupTimeout)),
                ]).catch((e) => {
                    logger$3.log('Error destroying TS Embed', e);
                }).finally(() => {
                    var _a, _b;
                    try {
                        (_b = (_a = this.insertedDomEl) === null || _a === void 0 ? void 0 : _a.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(this.insertedDomEl);
                    }
                    catch (e) {
                        logger$3.log('Error removing DOM element on destroy', e);
                    }
                });
            }
        }
        catch (e) {
            logger$3.log('Error destroying TS Embed', e);
        }
    }
    getUnderlyingFrameElement() {
        return this.iFrame;
    }
    /**
     * Prerenders a generic instance of the TS component.
     * This means without the path but with the flags already applied.
     * This is useful for prerendering the component in the background.
     * @version SDK: 1.22.0
     * @returns
     */
    async prerenderGeneric() {
        if (!getIsInitCalled()) {
            logger$3.error(ERROR_MESSAGE.RENDER_CALLED_BEFORE_INIT);
        }
        if (this.shouldWaitForRenderPromise)
            await this.isReadyForRenderPromise;
        const prerenderFrameSrc = this.getRootIframeSrc();
        this.isRendered = true;
        return this.renderIFrame(prerenderFrameSrc);
    }
    beforePrerenderVisible() {
        // We can ignore this as its a bit expensive and the newer customers 
        // have moved on to UpdateEmbedParams supported clusters
        // this.validatePreRenderViewConfig(this.viewConfig); removed in #517
        logger$3.debug('triggering UpdateEmbedParams', this.viewConfig);
        this.executeAfterEmbedContainerLoaded(async () => {
            try {
                const params = await this.getUpdateEmbedParamsObject();
                this.trigger(HostEvent.UpdateEmbedParams, params);
            }
            catch (error) {
                logger$3.error(ERROR_MESSAGE.UPDATE_PARAMS_FAILED, error);
                this.handleError({
                    errorType: ErrorDetailsTypes.API,
                    message: (error === null || error === void 0 ? void 0 : error.message) || ERROR_MESSAGE.UPDATE_PARAMS_FAILED,
                    code: EmbedErrorCodes.UPDATE_PARAMS_FAILED,
                    error: (error === null || error === void 0 ? void 0 : error.message) || error,
                });
            }
        });
    }
    /**
     * Displays the pre-rendered component inside the host element.
     * If the component has not been pre-rendered yet, it initiates rendering first.
     * Inserts a placeholder element into the host and positions the pre-render
     * wrapper to overlay it.
     */
    async showPreRender() {
        var _a;
        if (this.shouldWaitForRenderPromise)
            await this.isReadyForRenderPromise;
        if (!this.viewConfig.preRenderId) {
            logger$3.error(ERROR_MESSAGE.PRERENDER_ID_MISSING);
            return this;
        }
        if (!this.isPreRenderConnected()) {
            // this will call showPreRender down the line
            return this.preRender(true);
        }
        this.isRendered = true;
        this.beforePrerenderVisible();
        if (this.hostElement) {
            this.insertedDomEl = this.createPreRenderPlaceholder();
            if (this.viewConfig.fullHeight) {
                // If fullHeight has already sized the wrapper, seed the placeholder
                // with the same height so syncPreRenderStyle gets an accurate rect.
                const existingHeight = this.preRenderWrapper.style.height;
                if (existingHeight) {
                    this.insertedDomEl.style.height = existingHeight;
                }
            }
            const placeHolderId = this.getPreRenderIds().placeHolder;
            const oldEle = this.hostElement.querySelector(`#${placeHolderId}`);
            if (oldEle) {
                this.hostElement.removeChild(oldEle);
            }
            this.hostElement.appendChild(this.insertedDomEl);
            this.syncPreRenderStyle();
            if (!this.viewConfig.doNotTrackPreRenderSize) {
                const observeTarget = (_a = this.insertedDomEl) !== null && _a !== void 0 ? _a : this.hostElement;
                this.resizeObserver = new ResizeObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.contentRect && entry.target === observeTarget) {
                            setStyleProperties(this.preRenderWrapper, {
                                width: `${entry.contentRect.width}px`,
                                height: `${entry.contentRect.height}px`,
                            });
                        }
                    });
                });
                this.resizeObserver.observe(observeTarget);
            }
        }
        removeStyleProperties(this.preRenderWrapper, ['z-index', 'opacity', 'pointer-events', 'overflow']);
        this.subscribeToEvents();
        // Setup fullscreen change handler for prerendered components
        if (this.iFrame) {
            this.setupFullscreenChangeHandler();
        }
        return this;
    }
    getPreRenderPlaceHolderElement() {
        return this.insertedDomEl;
    }
    /**
     * Synchronizes the style properties of the PreRender component with the embedding
     * element. This function adjusts the position, width, and height of the PreRender
     * component
     * to match the dimensions and position of the embedding element.
     * @throws {Error} Throws an error if the embedding element (passed as domSelector)
     * is not defined or not found.
     */
    syncPreRenderStyle() {
        if (!this.isPreRenderConnected() || !this.getPreRenderPlaceHolderElement()) {
            logger$3.error(ERROR_MESSAGE.SYNC_STYLE_CALLED_BEFORE_RENDER);
            return;
        }
        const elBoundingClient = this.getPreRenderPlaceHolderElement().getBoundingClientRect();
        setStyleProperties(this.preRenderWrapper, {
            top: `${elBoundingClient.y + window.scrollY}px`,
            left: `${elBoundingClient.x + window.scrollX}px`,
            width: `${elBoundingClient.width}px`,
            height: `${elBoundingClient.height}px`,
            position: 'absolute'
        });
    }
    /**
     * Hides the PreRender component if it is available.
     * If the component is not preRendered, it issues a warning.
     */
    hidePreRender() {
        logger$3.debug('HidePreRender Called');
        if (!this.isPreRenderConnected()) {
            // if the embed component is not preRendered , nothing to hide
            logger$3.warn('PreRender should be called before hiding it using hidePreRender.');
            return;
        }
        const preRenderHideStyles = {
            opacity: '0',
            pointerEvents: 'none',
            zIndex: '-1000',
            position: 'absolute',
            top: '0',
            left: '0',
            overflow: 'hidden',
        };
        setStyleProperties(this.preRenderWrapper, preRenderHideStyles);
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        const placeHolderEle = this.getPreRenderPlaceHolderElement();
        if (placeHolderEle) {
            placeHolderEle.parentElement.removeChild(placeHolderEle);
        }
        this.unsubscribeToEvents();
    }
    /**
     * Retrieves unique HTML element IDs for PreRender-related elements.
     * These IDs are constructed based on the provided 'preRenderId' from 'viewConfig'.
     * @returns {object} An object containing the IDs for the PreRender elements.
     * @property {string} wrapper - The HTML element ID for the PreRender wrapper.
     * @property {string} child - The HTML element ID for the PreRender child.
     */
    getPreRenderIds() {
        return {
            wrapper: `tsEmbed-pre-render-wrapper-${this.viewConfig.preRenderId}`,
            child: `tsEmbed-pre-render-child-${this.viewConfig.preRenderId}`,
            placeHolder: `tsEmbed-pre-render-placeholder-${this.viewConfig.preRenderId}`,
        };
    }
    /**
     * Returns the answerService which can be used to make arbitrary graphql calls on top
     * session.
     * @param vizId [Optional] to get for a specific viz in case of a Liveboard.
     * @version SDK: 1.25.0 | ThoughtSpot: 9.10.0
     */
    async getAnswerService(vizId) {
        const { session } = await this.trigger(HostEvent.GetAnswerSession, vizId ? { vizId } : {});
        return new AnswerService(session, null, this.embedConfig.thoughtSpotHost);
    }
    /**
     * Set up fullscreen change detection to automatically trigger ExitPresentMode
     * when user exits fullscreen mode
     */
    setupFullscreenChangeHandler() {
        var _a;
        const embedConfig = getEmbedConfig();
        const disableFullscreenPresentation = (_a = embedConfig === null || embedConfig === void 0 ? void 0 : embedConfig.disableFullscreenPresentation) !== null && _a !== void 0 ? _a : true;
        if (disableFullscreenPresentation) {
            return;
        }
        if (this.fullscreenChangeHandler) {
            document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
        }
        this.fullscreenChangeHandler = () => {
            const isFullscreen = !!document.fullscreenElement;
            if (!isFullscreen) {
                logger$3.info('Exited fullscreen mode - triggering ExitPresentMode');
                // Only trigger if iframe is available and contentWindow is
                // accessible
                if (this.iFrame && this.iFrame.contentWindow) {
                    this.trigger(HostEvent.ExitPresentMode);
                }
                else {
                    logger$3.debug('Skipping ExitPresentMode - iframe contentWindow not available');
                }
            }
        };
        document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    }
    /**
     * Remove fullscreen change handler
     */
    removeFullscreenChangeHandler() {
        if (this.fullscreenChangeHandler) {
            document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
            this.fullscreenChangeHandler = null;
        }
    }
}
/**
 * Base class for embedding v1 experience
 * Note: The v1 version of ThoughtSpot Blink works on the AngularJS stack
 * which is currently under migration to v2
 * @inheritdoc
 */
class V1Embed extends TsEmbed {
    constructor(domSelector, viewConfig) {
        super(domSelector, viewConfig);
        /**
         * Only for testing purposes.
         * @hidden
         */
        this.test__executeCallbacks = this.executeCallbacks;
        this.viewConfig = {
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        };
    }
    /**
     * Render the app in an iframe and set up event handlers
     * @param iframeSrc
     */
    renderV1Embed(iframeSrc) {
        return this.renderIFrame(iframeSrc);
    }
    getRootIframeSrc() {
        const queryParams = this.getEmbedParams();
        let queryString = queryParams;
        if (!this.viewConfig.excludeRuntimeParametersfromURL) {
            const runtimeParameters = this.viewConfig.runtimeParameters;
            const parameterQuery = getRuntimeParameters(runtimeParameters || []);
            queryString = [parameterQuery, queryParams].filter(Boolean).join('&');
        }
        if (!this.viewConfig.excludeRuntimeFiltersfromURL) {
            const runtimeFilters = this.viewConfig.runtimeFilters;
            const filterQuery = getFilterQuery(runtimeFilters || []);
            queryString = [filterQuery, queryString].filter(Boolean).join('&');
        }
        return this.viewConfig.enableV2Shell_experimental
            ? this.getEmbedBasePath(queryString)
            : this.getV1EmbedBasePath(queryString);
    }
    /**
     * @inheritdoc
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Error, (data) => {
     *   console.error(data);
     * });
     * ```
     * @example
     * ```js
     * tsEmbed.on(EmbedEvent.Save, (data) => {
     *   console.log("Answer save clicked", data);
     * }, {
     *   start: true // This will trigger the callback on start of save
     * });
     * ```
     */
    on(messageType, callback, options = { start: false }) {
        const eventType = this.getCompatibleEventType(messageType);
        return super.on(eventType, callback, options);
    }
}

/**
 * Embed ThoughtSpot search bar
 * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1-sw
 * @group Embed components
 */
let SearchBarEmbed$1 = class SearchBarEmbed extends TsEmbed {
    constructor(domSelector, viewConfig) {
        super(domSelector);
        this.embedComponentType = 'SearchBarEmbed';
        this.viewConfig = viewConfig;
    }
    getEmbedParamsObject() {
        var _a;
        const { searchOptions, dataSource, dataSources, useLastSelectedSources = false, excludeSearchTokenStringFromURL, } = this.viewConfig;
        const queryParams = this.getBaseQueryParams();
        queryParams[Param.HideActions] = [...((_a = queryParams[Param.HideActions]) !== null && _a !== void 0 ? _a : [])];
        if (dataSources && dataSources.length) {
            queryParams[Param.DataSources] = JSON.stringify(dataSources);
        }
        if (dataSource) {
            queryParams[Param.DataSources] = `["${dataSource}"]`;
        }
        if (searchOptions === null || searchOptions === void 0 ? void 0 : searchOptions.searchTokenString) {
            if (!excludeSearchTokenStringFromURL) {
                queryParams[Param.searchTokenString] = encodeURIComponent(searchOptions.searchTokenString);
            }
            if (searchOptions.executeSearch) {
                queryParams[Param.executeSearch] = true;
            }
        }
        queryParams[Param.UseLastSelectedDataSource] = useLastSelectedSources;
        if (dataSource || dataSources) {
            queryParams[Param.UseLastSelectedDataSource] = false;
        }
        queryParams[Param.searchEmbed] = true;
        return queryParams;
    }
    /**
     * Construct the URL of the embedded ThoughtSpot search to be
     * loaded in the iframe
     * @param dataSources A list of data source GUIDs
     */
    getIFrameSrc() {
        const queryParams = this.getEmbedParamsObject();
        const path = 'search-bar-embed';
        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();
        return `${this.getEmbedBasePath(query)}/embed/${path}${tsPostHashParams}`;
    }
    /**
     * Render the embedded ThoughtSpot search
     */
    async render() {
        await super.render();
        const src = this.getIFrameSrc();
        await this.renderIFrame(src);
        return this;
    }
    getSearchInitData() {
        return {
            searchOptions: this.viewConfig.excludeSearchTokenStringFromURL
                ? this.viewConfig.searchOptions
                : null,
        };
    }
    async getAppInitData() {
        const defaultAppInitData = await super.getAppInitData();
        return { ...defaultAppInitData, ...this.getSearchInitData() };
    }
};

/**
 * Copyright (c) 2022
 *
 * Embed ThoughtSpot search or a saved answer.
 * https://developers.thoughtspot.com/docs/search-embed
 * @summary Search embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
/**
 * Define the initial state of column custom group accordions
 * in data panel v2.
 */
var DataPanelCustomColumnGroupsAccordionState$1;
(function (DataPanelCustomColumnGroupsAccordionState) {
    /**
     * Expand all the accordion initially in data panel v2.
     */
    DataPanelCustomColumnGroupsAccordionState["EXPAND_ALL"] = "EXPAND_ALL";
    /**
     * Collapse all the accordions initially in data panel v2.
     */
    DataPanelCustomColumnGroupsAccordionState["COLLAPSE_ALL"] = "COLLAPSE_ALL";
    /**
     * Expand the first accordion and collapse the rest.
     */
    DataPanelCustomColumnGroupsAccordionState["EXPAND_FIRST"] = "EXPAND_FIRST";
})(DataPanelCustomColumnGroupsAccordionState$1 || (DataPanelCustomColumnGroupsAccordionState$1 = {}));
const HiddenActionItemByDefaultForSearchEmbed = [
    Action.EditACopy,
    Action.SaveAsView,
    Action.UpdateTML,
    Action.EditTML,
    Action.AnswerDelete,
];
/**
 * Embed ThoughtSpot search
 * @group Embed components
 */
let SearchEmbed$1 = class SearchEmbed extends TsEmbed {
    constructor(domSelector, viewConfig) {
        viewConfig = {
            embedComponentType: 'SearchEmbed',
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        };
        super(domSelector, viewConfig);
    }
    /**
     * Get the state of the data sources panel that the embedded
     * ThoughtSpot search will be initialized with.
     */
    getDataSourceMode() {
        let dataSourceMode = DataSourceVisualMode.Expanded;
        if (this.viewConfig.collapseDataSources === true
            || this.viewConfig.collapseDataPanel === true) {
            dataSourceMode = DataSourceVisualMode.Collapsed;
        }
        if (this.viewConfig.hideDataSources === true) {
            dataSourceMode = DataSourceVisualMode.Hidden;
        }
        return dataSourceMode;
    }
    getSearchInitData() {
        var _a;
        return {
            ...(this.viewConfig.excludeSearchTokenStringFromURL ? {
                searchOptions: {
                    searchTokenString: (_a = this.viewConfig.searchOptions) === null || _a === void 0 ? void 0 : _a.searchTokenString,
                },
            } : {}),
        };
    }
    async getAppInitData() {
        const defaultAppInitData = await super.getAppInitData();
        const result = {
            ...defaultAppInitData,
            ...this.getSearchInitData(),
        };
        if (this.viewConfig.visualOverrides) {
            result.embedParams = {
                ...(defaultAppInitData.embedParams || {}),
                visualOverridesParams: this.viewConfig.visualOverrides,
            };
        }
        return result;
    }
    getEmbedParamsObject() {
        var _a;
        const { hideResults, enableSearchAssist, forceTable, searchOptions, runtimeFilters, dataSource, dataSources, excludeRuntimeFiltersfromURL, hideSearchBar, dataPanelV2 = true, useLastSelectedSources = false, runtimeParameters, collapseSearchBarInitially = false, enableCustomColumnGroups = false, dataPanelCustomGroupsAccordionInitialState = DataPanelCustomColumnGroupsAccordionState$1.EXPAND_ALL, focusSearchBarOnRender = true, excludeRuntimeParametersfromURL, excludeSearchTokenStringFromURL, collapseSearchBar = true, isThisPeriodInDateFiltersEnabled, newChartsLibrary, } = this.viewConfig;
        const queryParams = this.getBaseQueryParams();
        queryParams[Param.HideActions] = [
            ...((_a = queryParams[Param.HideActions]) !== null && _a !== void 0 ? _a : []),
            ...HiddenActionItemByDefaultForSearchEmbed,
        ];
        if (dataSources && dataSources.length) {
            queryParams[Param.DataSources] = JSON.stringify(dataSources);
        }
        if (dataSource) {
            queryParams[Param.DataSources] = `["${dataSource}"]`;
        }
        if (searchOptions === null || searchOptions === void 0 ? void 0 : searchOptions.searchTokenString) {
            if (!excludeSearchTokenStringFromURL) {
                queryParams[Param.searchTokenString] = encodeURIComponent(searchOptions.searchTokenString);
            }
            if (searchOptions.executeSearch) {
                queryParams[Param.executeSearch] = true;
            }
        }
        if (enableSearchAssist) {
            queryParams[Param.EnableSearchAssist] = true;
        }
        if (hideResults) {
            queryParams[Param.HideResult] = true;
        }
        if (forceTable) {
            queryParams[Param.ForceTable] = true;
        }
        if (hideSearchBar) {
            queryParams[Param.HideSearchBar] = true;
        }
        if (!focusSearchBarOnRender) {
            queryParams[Param.FocusSearchBarOnRender] = focusSearchBarOnRender;
        }
        if (isThisPeriodInDateFiltersEnabled !== undefined) {
            queryParams[Param.IsThisPeriodInDateFiltersEnabled] = isThisPeriodInDateFiltersEnabled;
        }
        if (newChartsLibrary !== undefined) {
            queryParams[Param.EnableNewChartLibrary] = newChartsLibrary;
        }
        queryParams[Param.DataPanelV2Enabled] = dataPanelV2;
        queryParams[Param.DataSourceMode] = this.getDataSourceMode();
        queryParams[Param.UseLastSelectedDataSource] = useLastSelectedSources;
        if (dataSource || dataSources) {
            queryParams[Param.UseLastSelectedDataSource] = false;
        }
        queryParams[Param.searchEmbed] = true;
        queryParams[Param.CollapseSearchBarInitially] = collapseSearchBarInitially || collapseSearchBar;
        queryParams[Param.EnableCustomColumnGroups] = enableCustomColumnGroups;
        if (dataPanelCustomGroupsAccordionInitialState
            === DataPanelCustomColumnGroupsAccordionState$1.COLLAPSE_ALL
            || dataPanelCustomGroupsAccordionInitialState
                === DataPanelCustomColumnGroupsAccordionState$1.EXPAND_FIRST) {
            queryParams[Param.DataPanelCustomGroupsAccordionInitialState] = dataPanelCustomGroupsAccordionInitialState;
        }
        else {
            queryParams[Param.DataPanelCustomGroupsAccordionInitialState] = DataPanelCustomColumnGroupsAccordionState$1.EXPAND_ALL;
        }
        return queryParams;
    }
    getEmbedParams() {
        const { runtimeParameters, runtimeFilters, excludeRuntimeParametersfromURL, excludeRuntimeFiltersfromURL, } = this.viewConfig;
        const queryParams = this.getEmbedParamsObject();
        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }
        const parameterQuery = getRuntimeParameters(runtimeParameters || []);
        if (parameterQuery && !excludeRuntimeParametersfromURL)
            query += `&${parameterQuery}`;
        const filterQuery = getFilterQuery(runtimeFilters || []);
        if (filterQuery && !excludeRuntimeFiltersfromURL) {
            query += `&${filterQuery}`;
        }
        return query;
    }
    /**
     * Construct the URL of the embedded ThoughtSpot search to be
     * loaded in the iframe
     * @param answerId The GUID of a saved answer
     * @param dataSources A list of data source GUIDs
     */
    getIFrameSrc() {
        const { answerId } = this.viewConfig;
        const answerPath = answerId ? `saved-answer/${answerId}` : 'answer';
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();
        return `${this.getRootIframeSrc()}/embed/${answerPath}${tsPostHashParams}`;
    }
    /**
     * Render the embedded ThoughtSpot search
     */
    async render() {
        await super.render();
        const { answerId } = this.viewConfig;
        const src = this.getIFrameSrc();
        await this.renderIFrame(src);
        getAuthPromise().then(() => {
            if (checkReleaseVersionInBeta(getReleaseVersion(), getEmbedConfig().suppressSearchEmbedBetaWarning
                || getEmbedConfig().suppressErrorAlerts)) {
                alert(ERROR_MESSAGE.SEARCHEMBED_BETA_WRANING_MESSAGE);
            }
        });
        return this;
    }
};

/**
 * Resolves enablePastConversationsSidebar with
 * spotterSidebarConfig taking precedence over the
 * standalone flag.
 */
const resolveEnablePastConversationsSidebar = (params) => (params.spotterSidebarConfigValue !== undefined
    ? params.spotterSidebarConfigValue
    : params.standaloneValue);
function buildSpotterSidebarAppInitData(defaultAppInitData, viewConfig, handleError) {
    const { spotterSidebarConfig, enablePastConversationsSidebar, visualOverrides } = viewConfig;
    const resolvedEnablePastConversations = resolveEnablePastConversationsSidebar({
        spotterSidebarConfigValue: spotterSidebarConfig === null || spotterSidebarConfig === void 0 ? void 0 : spotterSidebarConfig.enablePastConversationsSidebar,
        standaloneValue: enablePastConversationsSidebar,
    });
    const hasConfig = spotterSidebarConfig || resolvedEnablePastConversations !== undefined;
    if (!hasConfig) {
        if (visualOverrides === undefined) {
            return defaultAppInitData;
        }
        return {
            ...defaultAppInitData,
            embedParams: { visualOverridesParams: visualOverrides },
        };
    }
    const resolvedSidebarConfig = {
        ...spotterSidebarConfig,
        ...(resolvedEnablePastConversations !== undefined && {
            enablePastConversationsSidebar: resolvedEnablePastConversations,
        }),
    };
    if (resolvedSidebarConfig.spotterDocumentationUrl !== undefined) {
        const [isValid, validationError] = validateHttpUrl(resolvedSidebarConfig.spotterDocumentationUrl);
        if (!isValid) {
            handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                code: EmbedErrorCodes.INVALID_URL,
                error: (validationError === null || validationError === void 0 ? void 0 : validationError.message) || ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
            });
            delete resolvedSidebarConfig.spotterDocumentationUrl;
        }
    }
    return {
        ...defaultAppInitData,
        embedParams: {
            ...(defaultAppInitData.embedParams || {}),
            spotterSidebarConfig: resolvedSidebarConfig,
            ...(visualOverrides !== undefined ? { visualOverridesParams: visualOverrides } : {}),
        },
    };
}

function buildSpotterVizAppInitData(initData, viewConfig) {
    const { spotterViz } = viewConfig;
    if (!spotterViz)
        return initData;
    return {
        ...initData,
        embedParams: {
            ...(initData.embedParams || {}),
            spotterVizConfig: spotterViz,
        },
    };
}

/**
 * Copyright (c) 2022
 *
 * Full application embedding
 * https://developers.thoughtspot.com/docs/?pageid=full-embed
 * @summary Full app embed
 * @module
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
/**
 * Pages within the ThoughtSpot app that can be embedded.
 */
var Page;
(function (Page) {
    /**
     * Home page
     */
    Page["Home"] = "home";
    /**
     * Search page
     */
    Page["Search"] = "search";
    /**
     * Saved answers listing page
     */
    Page["Answers"] = "answers";
    /**
     * Liveboards listing page
     */
    Page["Liveboards"] = "liveboards";
    /**
     * @hidden
     */
    Page["Pinboards"] = "pinboards";
    /**
     * Data management page
     */
    Page["Data"] = "data";
    /**
     * SpotIQ listing page
     */
    Page["SpotIQ"] = "insights";
    /**
     *  Monitor Alerts Page
     */
    Page["Monitor"] = "monitor";
})(Page || (Page = {}));
/**
 * Define the initial state of column custom group accordions
 * in data panel v2.
 */
var DataPanelCustomColumnGroupsAccordionState;
(function (DataPanelCustomColumnGroupsAccordionState) {
    /**
     * Expand all the accordion initially in data panel v2.
     */
    DataPanelCustomColumnGroupsAccordionState["EXPAND_ALL"] = "EXPAND_ALL";
    /**
     * Collapse all the accordions initially in data panel v2.
     */
    DataPanelCustomColumnGroupsAccordionState["COLLAPSE_ALL"] = "COLLAPSE_ALL";
    /**
     * Expand the first accordion and collapse the rest.
     */
    DataPanelCustomColumnGroupsAccordionState["EXPAND_FIRST"] = "EXPAND_FIRST";
})(DataPanelCustomColumnGroupsAccordionState || (DataPanelCustomColumnGroupsAccordionState = {}));
var HomePageSearchBarMode;
(function (HomePageSearchBarMode) {
    HomePageSearchBarMode["OBJECT_SEARCH"] = "objectSearch";
    HomePageSearchBarMode["AI_ANSWER"] = "aiAnswer";
    HomePageSearchBarMode["NONE"] = "none";
})(HomePageSearchBarMode || (HomePageSearchBarMode = {}));
/**
 * Define the version of the primary navbar
 * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
 */
var PrimaryNavbarVersion;
(function (PrimaryNavbarVersion) {
    /**
     * Sliding (v3) introduces a new left-side navigation hub featuring a tab switcher,
     * along with updates to the top navigation bar.
     * It serves as the foundational version of the PrimaryNavBar.
     */
    PrimaryNavbarVersion["Sliding"] = "v3";
})(PrimaryNavbarVersion || (PrimaryNavbarVersion = {}));
/**
 * Define the version of the home page
 * @version SDK: 1.40.0 | ThoughtSpot: 10.11.0.cl
 */
var HomePage;
(function (HomePage) {
    /**
     * Modular (v2) introduces the updated Modular Home Experience.
     * It serves as the foundational version of the home page.
     */
    HomePage["Modular"] = "v2";
    /**
     * ModularWithStylingChanges (v3) introduces Modular Home Experience
     * with styling changes.
     */
    HomePage["ModularWithStylingChanges"] = "v3";
    /**
     * Focused (v4) introduces the V4 homepage experience
     * in which Watchlist and recents and incorporated together
     * to form a more focused homepage.
     * Pre-requisite : spotter enablement
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    HomePage["Focused"] = "v4";
})(HomePage || (HomePage = {}));
/**
 * Define the version of the list page
 * @version SDK: 1.40.0 | ThoughtSpot: 10.12.0.cl
 */
var ListPage;
(function (ListPage) {
    /**
     * List (v2) is the traditional List Experience.
     * It serves as the foundational version of the list page.
     */
    ListPage["List"] = "v2";
    /**
     * ListWithUXChanges (v3) introduces the new updated list page with UX changes.
     */
    ListPage["ListWithUXChanges"] = "v3";
})(ListPage || (ListPage = {}));
/**
 * Embeds full ThoughtSpot experience in a host application.
 * @group Embed components
 */
let AppEmbed$1 = class AppEmbed extends V1Embed {
    constructor(domSelector, viewConfig) {
        viewConfig.embedComponentType = 'AppEmbed';
        super(domSelector, viewConfig);
        this.defaultHeight = 500;
        this.sendFullHeightLazyLoadData = () => {
            const data = calculateVisibleElementData(this.iFrame);
            // this should be fired only if the lazyLoadingForFullHeight and fullHeight are true
            if (this.viewConfig.lazyLoadingForFullHeight && this.viewConfig.fullHeight) {
                this.trigger(HostEvent.VisibleEmbedCoordinates, data);
            }
        };
        /**
         * This is a handler for the RequestVisibleEmbedCoordinates event.
         * It is used to send the visible coordinates data to the host application.
         * @param data The event payload
         * @param responder The responder function
         */
        this.requestVisibleEmbedCoordinatesHandler = (data, responder) => {
            logger$3.info('Sending RequestVisibleEmbedCoordinates', data);
            const visibleCoordinatesData = calculateVisibleElementData(this.iFrame);
            responder({ type: EmbedEvent.RequestVisibleEmbedCoordinates, data: visibleCoordinatesData });
        };
        /**
         * Set the iframe height as per the computed height received
         * from the ThoughtSpot app.
         * @param data The event payload
         */
        this.updateIFrameHeight = (data) => {
            this.setIFrameHeight(Math.max(data.data, this.defaultHeight));
            this.sendFullHeightLazyLoadData();
        };
        this.embedIframeCenter = (data, responder) => {
            const obj = this.getIframeCenter();
            responder({ type: EmbedEvent.EmbedIframeCenter, data: obj });
        };
        this.setIframeHeightForNonEmbedLiveboard = (data) => {
            const { height: frameHeight } = this.viewConfig.frameParams || {};
            const liveboardRelatedRoutes = [
                '/pinboard/',
                '/insights/pinboard/',
                '/schedules/',
                '/embed/viz/',
                '/embed/insights/viz/',
                '/liveboard/',
                '/insights/liveboard/',
                '/tsl-editor/PINBOARD_ANSWER_BOOK/',
                '/import-tsl/PINBOARD_ANSWER_BOOK/',
            ];
            if (liveboardRelatedRoutes.some((path) => data.data.currentPath.startsWith(path))) {
                // Ignore the height reset of the frame, if the navigation is
                // only within the liveboard page.
                return;
            }
            this.setIFrameHeight(frameHeight || this.defaultHeight);
        };
        if (this.viewConfig.fullHeight === true) {
            this.on(EmbedEvent.RouteChange, this.setIframeHeightForNonEmbedLiveboard);
            this.on(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
            this.on(EmbedEvent.EmbedIframeCenter, this.embedIframeCenter);
            this.on(EmbedEvent.RequestVisibleEmbedCoordinates, this.requestVisibleEmbedCoordinatesHandler);
        }
    }
    /**
     * Extends the default APP_INIT payload with `embedParams.spotterSidebarConfig`
     * so the conv-assist app can read sidebar configuration on initialisation.
     *
     * Precedence for `enablePastConversationsSidebar`:
     * `spotterSidebarConfig.enablePastConversationsSidebar` wins over the
     * deprecated top-level `enablePastConversationsSidebar` flag; if the former
     * is absent the latter is used as a fallback.
     *
     * An invalid `spotterDocumentationUrl` triggers a validation error and is
     * excluded from the payload rather than forwarded to the app.
     */
    async getAppInitData() {
        const defaultAppInitData = await super.getAppInitData();
        const sidebarInitData = buildSpotterSidebarAppInitData(defaultAppInitData, this.viewConfig, this.handleError.bind(this));
        return buildSpotterVizAppInitData(sidebarInitData, this.viewConfig);
    }
    /**
     * Constructs a map of parameters to be passed on to the
     * embedded Liveboard or visualization.
     */
    getEmbedParams() {
        const { tag, hideTagFilterChips, hideObjects, liveboardV2, showPrimaryNavbar, disableProfileAndHelp, hideHamburger, hideObjectSearch, hideNotification, hideApplicationSwitcher, hideOrgSwitcher, enableSearchAssist, newConnectionsExperience, fullHeight, dataPanelV2 = true, hideLiveboardHeader = false, showLiveboardTitle = true, showLiveboardDescription = true, showMaskedFilterChip = false, isLiveboardMasterpiecesEnabled = false, newChartsLibrary, hideHomepageLeftNav = false, modularHomeExperience = false, isLiveboardHeaderSticky = true, enableAskSage, collapseSearchBarInitially = false, enable2ColumnLayout, enableCustomColumnGroups = false, dataPanelCustomGroupsAccordionInitialState = DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL, collapseSearchBar = true, isLiveboardCompactHeaderEnabled = false, showLiveboardVerifiedBadge = true, showLiveboardReverifyBanner = true, hideIrrelevantChipsInLiveboardTabs = false, isEnhancedFilterInteractivityEnabled = false, homePageSearchBarMode, isUnifiedSearchExperienceEnabled = true, enablePendoHelp = true, discoveryExperience, coverAndFilterOptionInPDF = false, isLiveboardStylingAndGroupingEnabled, isPNGInScheduledEmailsEnabled = false, isLiveboardXLSXCSVDownloadEnabled = false, isGranularXLSXCSVSchedulesEnabled = false, isCentralizedLiveboardFilterUXEnabled = false, isLinkParametersEnabled, updatedSpotterChatPrompt, enableStopAnswerGenerationEmbed, spotterChatConfig, minimumHeight, isThisPeriodInDateFiltersEnabled, enableHomepageAnnouncement = false, isContinuousLiveboardPDFEnabled = false, enableLiveboardDataCache, } = this.viewConfig;
        let params = {};
        params[Param.PrimaryNavHidden] = !showPrimaryNavbar;
        params[Param.HideProfleAndHelp] = !!disableProfileAndHelp;
        params[Param.HideApplicationSwitcher] = !!hideApplicationSwitcher;
        params[Param.HideOrgSwitcher] = !!hideOrgSwitcher;
        params[Param.HideLiveboardHeader] = hideLiveboardHeader;
        params[Param.ShowLiveboardTitle] = showLiveboardTitle;
        params[Param.ShowLiveboardDescription] = !!showLiveboardDescription;
        params[Param.ShowMaskedFilterChip] = showMaskedFilterChip;
        params[Param.IsLiveboardMasterpiecesEnabled] = isLiveboardMasterpiecesEnabled;
        if (newChartsLibrary !== undefined) {
            params[Param.EnableNewChartLibrary] = newChartsLibrary;
        }
        params[Param.LiveboardHeaderSticky] = isLiveboardHeaderSticky;
        params[Param.IsFullAppEmbed] = true;
        params[Param.LiveboardHeaderV2] = isLiveboardCompactHeaderEnabled;
        params[Param.IsEnhancedFilterInteractivityEnabled] = isEnhancedFilterInteractivityEnabled;
        params[Param.ShowLiveboardVerifiedBadge] = showLiveboardVerifiedBadge;
        params[Param.ShowLiveboardReverifyBanner] = showLiveboardReverifyBanner;
        params[Param.HideIrrelevantFiltersInTab] = hideIrrelevantChipsInLiveboardTabs;
        if (isUnifiedSearchExperienceEnabled !== undefined) {
            params[Param.IsUnifiedSearchExperienceEnabled] = isUnifiedSearchExperienceEnabled;
        }
        params[Param.CoverAndFilterOptionInPDF] = !!coverAndFilterOptionInPDF;
        params = this.getBaseQueryParams(params);
        if (!isUndefined(updatedSpotterChatPrompt)) {
            params[Param.UpdatedSpotterChatPrompt] = !!updatedSpotterChatPrompt;
        }
        if (!isUndefined(enableStopAnswerGenerationEmbed)) {
            params[Param.EnableStopAnswerGenerationEmbed] = !!enableStopAnswerGenerationEmbed;
        }
        // Handle spotterChatConfig params
        if (spotterChatConfig) {
            const { hideToolResponseCardBranding, toolResponseCardBrandingLabel, spotterFileUploadEnabled, spotterFileUploadFileTypes, } = spotterChatConfig;
            setParamIfDefined(params, Param.HideToolResponseCardBranding, hideToolResponseCardBranding, true);
            setParamIfDefined(params, Param.ToolResponseCardBrandingLabel, toolResponseCardBrandingLabel);
            if (spotterFileUploadEnabled !== undefined) {
                params[Param.SpotterFileUploadEnabled] = spotterFileUploadEnabled;
            }
            if (spotterFileUploadFileTypes !== undefined) {
                params[Param.SpotterFileUploadFileTypes] = JSON.stringify(spotterFileUploadFileTypes);
            }
        }
        if (hideObjectSearch) {
            params[Param.HideObjectSearch] = !!hideObjectSearch;
        }
        if (hideHamburger) {
            params[Param.HideHamburger] = !!hideHamburger;
        }
        if (hideNotification) {
            params[Param.HideNotification] = !!hideNotification;
        }
        if (fullHeight === true) {
            params[Param.fullHeight] = true;
            if (this.viewConfig.lazyLoadingForFullHeight) {
                params[Param.IsLazyLoadingForEmbedEnabled] = true;
                if (isValidCssMargin(this.viewConfig.lazyLoadingMargin)) {
                    params[Param.RootMarginForLazyLoad] = this.viewConfig.lazyLoadingMargin;
                }
            }
        }
        if (tag) {
            params[Param.Tag] = tag;
        }
        if (hideObjects && hideObjects.length) {
            params[Param.HideObjects] = JSON.stringify(hideObjects);
        }
        if (liveboardV2 !== undefined) {
            params[Param.LiveboardV2Enabled] = liveboardV2;
        }
        if (enableSearchAssist !== undefined) {
            params[Param.EnableSearchAssist] = enableSearchAssist;
        }
        if (newConnectionsExperience !== undefined) {
            params[Param.EnableConnectionNewExperience] = newConnectionsExperience;
        }
        if (enable2ColumnLayout !== undefined) {
            params[Param.Enable2ColumnLayout] = enable2ColumnLayout;
        }
        if (enableAskSage) {
            params[Param.enableAskSage] = enableAskSage;
        }
        if (homePageSearchBarMode) {
            params[Param.HomePageSearchBarMode] = homePageSearchBarMode;
        }
        if (enablePendoHelp !== undefined) {
            params[Param.EnablePendoHelp] = enablePendoHelp;
        }
        if (isLiveboardStylingAndGroupingEnabled !== undefined) {
            params[Param.IsLiveboardStylingAndGroupingEnabled] = isLiveboardStylingAndGroupingEnabled;
        }
        if (isPNGInScheduledEmailsEnabled !== undefined) {
            params[Param.isPNGInScheduledEmailsEnabled] = isPNGInScheduledEmailsEnabled;
        }
        if (isLiveboardXLSXCSVDownloadEnabled !== undefined) {
            params[Param.isLiveboardXLSXCSVDownloadEnabled] = isLiveboardXLSXCSVDownloadEnabled;
        }
        if (isGranularXLSXCSVSchedulesEnabled !== undefined) {
            params[Param.isGranularXLSXCSVSchedulesEnabled] = isGranularXLSXCSVSchedulesEnabled;
        }
        if (hideTagFilterChips !== undefined) {
            params[Param.HideTagFilterChips] = hideTagFilterChips;
        }
        if (isLinkParametersEnabled !== undefined) {
            params[Param.isLinkParametersEnabled] = isLinkParametersEnabled;
        }
        if (isCentralizedLiveboardFilterUXEnabled != undefined) {
            params[Param.isCentralizedLiveboardFilterUXEnabled] = isCentralizedLiveboardFilterUXEnabled;
        }
        if (isThisPeriodInDateFiltersEnabled !== undefined) {
            params[Param.IsThisPeriodInDateFiltersEnabled] = isThisPeriodInDateFiltersEnabled;
        }
        if (enableHomepageAnnouncement !== undefined) {
            params[Param.EnableHomepageAnnouncement] = enableHomepageAnnouncement;
        }
        if (isContinuousLiveboardPDFEnabled !== undefined) {
            params[Param.IsWYSIWYGLiveboardPDFEnabled] = isContinuousLiveboardPDFEnabled;
        }
        this.defaultHeight = minimumHeight || this.defaultHeight;
        if (enableLiveboardDataCache !== undefined) {
            params[Param.EnableLiveboardDataCache] = enableLiveboardDataCache;
        }
        params[Param.DataPanelV2Enabled] = dataPanelV2;
        params[Param.HideHomepageLeftNav] = hideHomepageLeftNav;
        params[Param.ModularHomeExperienceEnabled] = modularHomeExperience;
        params[Param.CollapseSearchBarInitially] = collapseSearchBarInitially || collapseSearchBar;
        params[Param.EnableCustomColumnGroups] = enableCustomColumnGroups;
        if (dataPanelCustomGroupsAccordionInitialState
            === DataPanelCustomColumnGroupsAccordionState.COLLAPSE_ALL
            || dataPanelCustomGroupsAccordionInitialState
                === DataPanelCustomColumnGroupsAccordionState.EXPAND_FIRST) {
            params[Param.DataPanelCustomGroupsAccordionInitialState] = dataPanelCustomGroupsAccordionInitialState;
        }
        else {
            params[Param.DataPanelCustomGroupsAccordionInitialState] = DataPanelCustomColumnGroupsAccordionState.EXPAND_ALL;
        }
        if (modularHomeExperience !== undefined) {
            params[Param.ModularHomeExperienceEnabled] = modularHomeExperience;
        }
        // Set navigation to v2 by default to avoid problems like the app
        // switcher (9-dot menu) not showing when v3 navigation is turned on
        // at the cluster level.
        // To use v3 navigation, we must manually set the discoveryExperience
        // settings.
        params[Param.NavigationVersion] = 'v2';
        // Set homePageVersion to v2 by default to reset the LD flag value
        // for the homepageVersion.
        params[Param.HomepageVersion] = 'v2';
        if (discoveryExperience) {
            // primaryNavbarVersion v3 will enabled the new left navigation
            if (discoveryExperience.primaryNavbarVersion === PrimaryNavbarVersion.Sliding) {
                params[Param.NavigationVersion] = discoveryExperience.primaryNavbarVersion;
                // Enable the modularHomeExperience when Sliding is enabled.
                params[Param.ModularHomeExperienceEnabled] = true;
            }
            // homePage v2 will enable the modular home page
            // and it will override the modularHomeExperience value
            if (discoveryExperience.homePage === HomePage.Modular) {
                params[Param.ModularHomeExperienceEnabled] = true;
            }
            // ModularWithStylingChanges (v3) introduces the styling changes
            // to the Modular Homepage.
            // v3 will be the base version of homePageVersion.
            if (discoveryExperience.homePage === HomePage.ModularWithStylingChanges) {
                params[Param.HomepageVersion] = HomePage.ModularWithStylingChanges;
            }
            // listPageVersion can be changed to v2 or v3
            if (discoveryExperience.listPageVersion !== undefined) {
                params[Param.ListPageVersion] = discoveryExperience.listPageVersion;
            }
            if (discoveryExperience.homePage === HomePage.Focused) {
                params[Param.HomepageVersion] = HomePage.Focused;
            }
        }
        const queryParams = getQueryParamString(params, true);
        return queryParams;
    }
    /**
     * Constructs the URL of the ThoughtSpot app page to be rendered.
     * @param pageId The ID of the page to be embedded.
     */
    getIFrameSrc() {
        const { pageId, path, modularHomeExperience } = this.viewConfig;
        const pageRoute = this.formatPath(path) || this.getPageRoute(pageId, modularHomeExperience);
        let url = `${this.getRootIframeSrc()}/${pageRoute}`;
        const tsPostHashParams = this.getThoughtSpotPostUrlParams();
        url = `${url}${tsPostHashParams}`;
        return url;
    }
    /**
     * Gets the ThoughtSpot route of the page for a particular page ID.
     * @param pageId The identifier for a page in the ThoughtSpot app.
     * @param modularHomeExperience
     */
    getPageRoute(pageId, modularHomeExperience = false) {
        switch (pageId) {
            case Page.Search:
                return 'answer';
            case Page.Answers:
                return modularHomeExperience ? 'home/answers' : 'answers';
            case Page.Liveboards:
                return modularHomeExperience ? 'home/liveboards' : 'pinboards';
            case Page.Pinboards:
                return modularHomeExperience ? 'home/liveboards' : 'pinboards';
            case Page.Data:
                return 'data/tables';
            case Page.SpotIQ:
                return modularHomeExperience ? 'home/spotiq-analysis' : 'insights/results';
            case Page.Monitor:
                return modularHomeExperience ? 'home/monitor-alerts' : 'insights/monitor-alerts';
            case Page.Home:
            default:
                return 'home';
        }
    }
    /**
     * Formats the path provided by the user.
     * @param path The URL path.
     * @returns The URL path that the embedded app understands.
     */
    formatPath(path) {
        if (!path) {
            return null;
        }
        // remove leading slash
        if (path.indexOf('/') === 0) {
            return path.substring(1);
        }
        return path;
    }
    /**
     * Navigate to particular page for app embed. eg:answers/pinboards/home
     * This is used for embedding answers, pinboards, visualizations and full application
     * only.
     * @param path string | number The string, set to iframe src and navigate to new page
     * eg: appEmbed.navigateToPage('pinboards')
     * When used with `noReload` (default: true) this can also be a number
     * like 1/-1 to go forward/back.
     * @param noReload boolean Trigger the navigation without reloading the page
     * @version SDK: 1.12.0 | ThoughtSpot: 8.4.0.cl, 8.4.1-sw
     */
    navigateToPage(path, noReload = false) {
        if (!this.iFrame) {
            logger$3.log('Please call render before invoking this method');
            return;
        }
        if (noReload) {
            this.trigger(HostEvent.Navigate, path);
        }
        else {
            if (typeof path !== 'string') {
                logger$3.warn('Path can only by a string when triggered without noReload');
                return;
            }
            const iframeSrc = this.iFrame.src;
            const embedPath = '#/embed';
            const currentPath = iframeSrc.includes(embedPath) ? embedPath : '#';
            this.iFrame.src = `${iframeSrc.split(currentPath)[0]}${currentPath}/${path.replace(/^\/?#?\//, '')}`;
        }
    }
    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    destroy() {
        super.destroy();
        this.unregisterLazyLoadEvents();
    }
    postRender() {
        this.registerLazyLoadEvents();
    }
    registerLazyLoadEvents() {
        if (this.viewConfig.fullHeight && this.viewConfig.lazyLoadingForFullHeight) {
            // TODO: Use passive: true, install modernizr to check for passive
            window.addEventListener('resize', this.sendFullHeightLazyLoadData);
            window.addEventListener('scroll', this.sendFullHeightLazyLoadData, true);
        }
    }
    unregisterLazyLoadEvents() {
        if (this.viewConfig.fullHeight && this.viewConfig.lazyLoadingForFullHeight) {
            window.removeEventListener('resize', this.sendFullHeightLazyLoadData);
            window.removeEventListener('scroll', this.sendFullHeightLazyLoadData);
        }
    }
    /**
     * Renders the embedded application pages in the ThoughtSpot app.
     * @param renderOptions An object containing the page ID
     * to be embedded.
     */
    async render() {
        await super.render();
        const src = this.getIFrameSrc();
        await this.renderV1Embed(src);
        this.postRender();
        return this;
    }
};

const getPreviewQuery = `
query GetEurekaVizSnapshots(
    $vizId: String!, $liveboardId: String!) {
    getEurekaVizSnapshot(
      id: $vizId
      reportBookId: $liveboardId
      reportBookType: "PINBOARD_ANSWER_BOOK"
      version: 9999999
    ) {
      id
      vizContent
      snapshotType
      createdMs
    }
  } 
`;
/**
 *
 * @param thoughtSpotHost
 * @param vizId
 * @param liveboardId
 */
async function getPreview(thoughtSpotHost, vizId, liveboardId) {
    return graphqlQuery({
        query: getPreviewQuery,
        variables: { vizId, liveboardId },
        thoughtSpotHost,
    });
}

const addPreviewStylesIfNotPresent = () => {
    const styleEl = document.getElementById('ts-preview-style');
    if (styleEl) {
        return;
    }
    const previewStyles = `
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@32.0.2/styles/ag-grid.min.css" integrity="sha384-PvEsKa6emq5KYa9mf+Q7eYF5C2OCacYzZ+hBngp21NA4o1A9iU9smnytEmqUFbEZ" crossorigin="anonymous">
        <style id="ts-preview-style">
           .ts-viz-preview-loader {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: linear-gradient(-45deg, #eee 40%, #fafafa 50%, #eee 60%);
                background-size: 300%;
                background-position-x: 100%;
                animation: shimmer 1s infinite linear;
                z-index: 999;
                filter: grayscale(0.2);
           }

           @keyframes shimmer {
                to {
                    background-position-x: 0%
                }
           }

           .ts-viz-preview-loader .table-module__fullContainer {
                width: 100%;
                height: 100%;
           }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', previewStyles);
};

/**
 * Copyright (c) 2022
 *
 * Embed a ThoughtSpot Liveboard or visualization
 * https://developers.thoughtspot.com/docs/embed-liveboard
 * https://developers.thoughtspot.com/docs/embed-a-viz
 * @summary Liveboard & visualization embed
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */
/**
 * Embed a ThoughtSpot Liveboard or visualization. When rendered it already
 * waits for the authentication to complete, so you need not wait for
 * `AuthStatus.SUCCESS`.
 * @group Embed components
 * @example
 * ```js
 * import { .. } from '@thoughtspot/visual-embed-sdk';
 * init({ ... });
 * const embed = new LiveboardEmbed("#container", {
 *   liveboardId: <your-id-here>,
 * // .. other params here.
 * })
 * ```
 */
let LiveboardEmbed$1 = class LiveboardEmbed extends V1Embed {
    constructor(domSelector, viewConfig) {
        viewConfig.embedComponentType = 'LiveboardEmbed';
        super(domSelector, viewConfig);
        this.defaultHeight = 500;
        this.sendFullHeightLazyLoadData = () => {
            const data = calculateVisibleElementData(this.iFrame);
            // this should be fired only if the lazyLoadingForFullHeight and fullHeight are true
            if (this.viewConfig.lazyLoadingForFullHeight && this.viewConfig.fullHeight) {
                this.trigger(HostEvent.VisibleEmbedCoordinates, data);
            }
        };
        /**
         * This is a handler for the RequestVisibleEmbedCoordinates event.
         * It is used to send the visible coordinates data to the host application.
         * @param data The event payload
         * @param responder The responder function
         */
        this.requestVisibleEmbedCoordinatesHandler = (data, responder) => {
            logger$3.info('Sending RequestVisibleEmbedCoordinates', data);
            const visibleCoordinatesData = calculateVisibleElementData(this.iFrame);
            responder({ type: EmbedEvent.RequestVisibleEmbedCoordinates, data: visibleCoordinatesData });
        };
        /**
         * Set the iframe height as per the computed height received
         * from the ThoughtSpot app.
         * @param data The event payload
         */
        this.updateIFrameHeight = (data) => {
            this.setIFrameHeight(Math.max(data.data, this.defaultHeight));
            this.sendFullHeightLazyLoadData();
        };
        this.embedIframeCenter = (data, responder) => {
            const obj = this.getIframeCenter();
            responder({ type: EmbedEvent.EmbedIframeCenter, data: obj });
        };
        this.setIframeHeightForNonEmbedLiveboard = (data) => {
            const { height: frameHeight } = this.viewConfig.frameParams || {};
            const liveboardRelatedRoutes = [
                '/pinboard/',
                '/insights/pinboard/',
                '/schedules/',
                '/embed/viz/',
                '/embed/insights/viz/',
                '/liveboard/',
                '/insights/liveboard/',
                '/tsl-editor/PINBOARD_ANSWER_BOOK/',
                '/import-tsl/PINBOARD_ANSWER_BOOK/',
            ];
            if (liveboardRelatedRoutes.some((path) => data.data.currentPath.startsWith(path))) {
                // Ignore the height reset of the frame, if the navigation is
                // only within the liveboard page.
                return;
            }
            this.setIFrameHeight(frameHeight || this.defaultHeight);
        };
        /**
         * @hidden
         * Internal state to track the current liveboard id.
         * This is used to navigate to the correct liveboard when the prerender is visible.
         */
        this.currentLiveboardState = {
            liveboardId: this.viewConfig.liveboardId,
            vizId: this.viewConfig.vizId,
            activeTabId: this.viewConfig.activeTabId,
            personalizedViewId: this.viewConfig.personalizedViewId,
        };
        if (this.viewConfig.fullHeight === true) {
            if (this.viewConfig.vizId) {
                logger$3.warn('Full height is currently only supported for Liveboard embeds.' +
                    'Using full height with vizId might lead to unexpected behavior.');
            }
            this.on(EmbedEvent.RouteChange, this.setIframeHeightForNonEmbedLiveboard);
            this.on(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
            this.on(EmbedEvent.EmbedIframeCenter, this.embedIframeCenter);
            this.on(EmbedEvent.RequestVisibleEmbedCoordinates, this.requestVisibleEmbedCoordinatesHandler);
        }
    }
    async getAppInitData() {
        const defaultAppInitData = await super.getAppInitData();
        return buildSpotterVizAppInitData(defaultAppInitData, this.viewConfig);
    }
    /**
     * Construct a map of params to be passed on to the
     * embedded Liveboard or visualization.
     */
    getEmbedParams() {
        const params = this.getEmbedParamsObject();
        const queryParams = getQueryParamString(params, true);
        return queryParams;
    }
    getEmbedParamsObject() {
        let params = {};
        params = this.getBaseQueryParams(params);
        const { enableVizTransformations, fullHeight, defaultHeight, minimumHeight, visibleVizs, liveboardV2, vizId, hideTabPanel, activeTabId, hideLiveboardHeader, showLiveboardDescription, showLiveboardTitle, isLiveboardHeaderSticky = true, isLiveboardCompactHeaderEnabled = false, showLiveboardVerifiedBadge = true, showLiveboardReverifyBanner = true, hideIrrelevantChipsInLiveboardTabs = false, showMaskedFilterChip = false, isLiveboardMasterpiecesEnabled = false, newChartsLibrary, isEnhancedFilterInteractivityEnabled = false, enableAskSage, enable2ColumnLayout, dataPanelV2 = true, enableCustomColumnGroups = false, oAuthPollingInterval, isForceRedirect, dataSourceId, coverAndFilterOptionInPDF = false, isLiveboardStylingAndGroupingEnabled, isPNGInScheduledEmailsEnabled = false, isLiveboardXLSXCSVDownloadEnabled = false, isGranularXLSXCSVSchedulesEnabled = false, showSpotterLimitations, isCentralizedLiveboardFilterUXEnabled = false, isLinkParametersEnabled, updatedSpotterChatPrompt, enableStopAnswerGenerationEmbed, spotterChatConfig, isThisPeriodInDateFiltersEnabled, isContinuousLiveboardPDFEnabled = false, enableLiveboardDataCache, } = this.viewConfig;
        const preventLiveboardFilterRemoval = this.viewConfig.preventLiveboardFilterRemoval
            || this.viewConfig.preventPinboardFilterRemoval;
        if (fullHeight === true) {
            params[Param.fullHeight] = true;
            if (this.viewConfig.lazyLoadingForFullHeight) {
                params[Param.IsLazyLoadingForEmbedEnabled] = true;
                if (isValidCssMargin(this.viewConfig.lazyLoadingMargin)) {
                    params[Param.RootMarginForLazyLoad] = this.viewConfig.lazyLoadingMargin;
                }
            }
        }
        this.defaultHeight = minimumHeight || defaultHeight || this.defaultHeight;
        if (enableVizTransformations !== undefined) {
            params[Param.EnableVizTransformations] = enableVizTransformations.toString();
        }
        if (preventLiveboardFilterRemoval) {
            params[Param.preventLiveboardFilterRemoval] = true;
        }
        if (!isUndefined(updatedSpotterChatPrompt)) {
            params[Param.UpdatedSpotterChatPrompt] = !!updatedSpotterChatPrompt;
        }
        if (!isUndefined(enableStopAnswerGenerationEmbed)) {
            params[Param.EnableStopAnswerGenerationEmbed] = !!enableStopAnswerGenerationEmbed;
        }
        if (visibleVizs) {
            params[Param.visibleVizs] = visibleVizs;
        }
        params[Param.livedBoardEmbed] = true;
        if (vizId) {
            params[Param.vizEmbed] = true;
        }
        if (liveboardV2 !== undefined) {
            params[Param.LiveboardV2Enabled] = liveboardV2;
        }
        if (enable2ColumnLayout !== undefined) {
            params[Param.Enable2ColumnLayout] = enable2ColumnLayout;
        }
        if (hideTabPanel) {
            params[Param.HideTabPanel] = hideTabPanel;
        }
        if (hideLiveboardHeader) {
            params[Param.HideLiveboardHeader] = hideLiveboardHeader;
        }
        if (showLiveboardDescription) {
            params[Param.ShowLiveboardDescription] = showLiveboardDescription;
        }
        if (showLiveboardTitle) {
            params[Param.ShowLiveboardTitle] = showLiveboardTitle;
        }
        if (enableAskSage) {
            params[Param.enableAskSage] = enableAskSage;
        }
        if (oAuthPollingInterval !== undefined) {
            params[Param.OauthPollingInterval] = oAuthPollingInterval;
        }
        if (isForceRedirect) {
            params[Param.IsForceRedirect] = isForceRedirect;
        }
        if (dataSourceId !== undefined) {
            params[Param.DataSourceId] = dataSourceId;
        }
        if (isLiveboardStylingAndGroupingEnabled !== undefined) {
            params[Param.IsLiveboardStylingAndGroupingEnabled] = isLiveboardStylingAndGroupingEnabled;
        }
        if (isPNGInScheduledEmailsEnabled !== undefined) {
            params[Param.isPNGInScheduledEmailsEnabled] = isPNGInScheduledEmailsEnabled;
        }
        if (isLiveboardXLSXCSVDownloadEnabled !== undefined) {
            params[Param.isLiveboardXLSXCSVDownloadEnabled] = isLiveboardXLSXCSVDownloadEnabled;
        }
        if (isGranularXLSXCSVSchedulesEnabled !== undefined) {
            params[Param.isGranularXLSXCSVSchedulesEnabled] = isGranularXLSXCSVSchedulesEnabled;
        }
        if (showSpotterLimitations !== undefined) {
            params[Param.ShowSpotterLimitations] = showSpotterLimitations;
        }
        // Handle spotterChatConfig params
        if (spotterChatConfig) {
            const { hideToolResponseCardBranding, toolResponseCardBrandingLabel, spotterFileUploadEnabled, spotterFileUploadFileTypes, } = spotterChatConfig;
            setParamIfDefined(params, Param.HideToolResponseCardBranding, hideToolResponseCardBranding, true);
            setParamIfDefined(params, Param.ToolResponseCardBrandingLabel, toolResponseCardBrandingLabel);
            if (spotterFileUploadEnabled !== undefined) {
                params[Param.SpotterFileUploadEnabled] = spotterFileUploadEnabled;
            }
            if (spotterFileUploadFileTypes !== undefined) {
                params[Param.SpotterFileUploadFileTypes] = JSON.stringify(spotterFileUploadFileTypes);
            }
        }
        if (isLinkParametersEnabled !== undefined) {
            params[Param.isLinkParametersEnabled] = isLinkParametersEnabled;
        }
        if (isCentralizedLiveboardFilterUXEnabled !== undefined) {
            params[Param.isCentralizedLiveboardFilterUXEnabled] = isCentralizedLiveboardFilterUXEnabled;
        }
        if (isThisPeriodInDateFiltersEnabled !== undefined) {
            params[Param.IsThisPeriodInDateFiltersEnabled] = isThisPeriodInDateFiltersEnabled;
        }
        if (isContinuousLiveboardPDFEnabled !== undefined) {
            params[Param.IsWYSIWYGLiveboardPDFEnabled] = isContinuousLiveboardPDFEnabled;
        }
        if (enableLiveboardDataCache !== undefined) {
            params[Param.EnableLiveboardDataCache] = enableLiveboardDataCache;
        }
        if (newChartsLibrary !== undefined) {
            params[Param.EnableNewChartLibrary] = newChartsLibrary;
        }
        params[Param.LiveboardHeaderSticky] = isLiveboardHeaderSticky;
        params[Param.LiveboardHeaderV2] = isLiveboardCompactHeaderEnabled;
        params[Param.ShowLiveboardVerifiedBadge] = showLiveboardVerifiedBadge;
        params[Param.ShowLiveboardReverifyBanner] = showLiveboardReverifyBanner;
        params[Param.HideIrrelevantFiltersInTab] = hideIrrelevantChipsInLiveboardTabs;
        params[Param.ShowMaskedFilterChip] = showMaskedFilterChip;
        params[Param.IsLiveboardMasterpiecesEnabled] = isLiveboardMasterpiecesEnabled;
        params[Param.IsEnhancedFilterInteractivityEnabled] = isEnhancedFilterInteractivityEnabled;
        params[Param.DataPanelV2Enabled] = dataPanelV2;
        params[Param.EnableCustomColumnGroups] = enableCustomColumnGroups;
        params[Param.CoverAndFilterOptionInPDF] = coverAndFilterOptionInPDF;
        getQueryParamString(params, true);
        return params;
    }
    getIframeSuffixSrc(liveboardId, vizId, activeTabId, personalizedViewId) {
        // Extract view from liveboardId if passed along with it (legacy
        // approach)
        // View must be appended as query param at the end, not
        // embedded in path
        let liveboardGuid = liveboardId;
        let legacyViewId;
        if (liveboardId === null || liveboardId === void 0 ? void 0 : liveboardId.includes('?')) {
            const [id, query] = liveboardId.split('?');
            liveboardGuid = id;
            const params = new URLSearchParams(query);
            legacyViewId = params.get('view') || undefined;
        }
        // personalizedViewId takes precedence over legacyViewId (when passed
        // as part of liveboardId)
        const effectiveViewId = personalizedViewId || legacyViewId;
        let suffix = `/embed/viz/${liveboardGuid}`;
        if (activeTabId) {
            suffix = `${suffix}/tab/${activeTabId}`;
        }
        if (vizId) {
            suffix = `${suffix}/${vizId}`;
        }
        const additionalParams = {};
        if (effectiveViewId) {
            additionalParams.view = effectiveViewId;
        }
        const tsPostHashParams = this.getThoughtSpotPostUrlParams(additionalParams);
        suffix = `${suffix}${tsPostHashParams}`;
        return suffix;
    }
    /**
     * Construct the URL of the embedded ThoughtSpot Liveboard or visualization
     * to be loaded within the iFrame.
     */
    getIFrameSrc() {
        var _a;
        const { vizId, activeTabId, personalizedViewId } = this.viewConfig;
        const liveboardId = (_a = this.viewConfig.liveboardId) !== null && _a !== void 0 ? _a : this.viewConfig.pinboardId;
        if (!liveboardId) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.LIVEBOARD_VIZ_ID_VALIDATION,
                code: EmbedErrorCodes.LIVEBOARD_ID_MISSING,
                error: ERROR_MESSAGE.LIVEBOARD_VIZ_ID_VALIDATION,
            });
        }
        return `${this.getRootIframeSrc()}${this.getIframeSuffixSrc(liveboardId, vizId, activeTabId, personalizedViewId)}`;
    }
    setActiveTab(data) {
        if (!this.viewConfig.vizId) {
            const prefixPath = this.iFrame.src.split('#/')[1].split('/tab')[0];
            const path = `${prefixPath}/tab/${data.tabId}`;
            super.trigger(HostEvent.Navigate, path);
        }
    }
    async showPreviewLoader() {
        if (!this.viewConfig.showPreviewLoader || !this.viewConfig.vizId) {
            return;
        }
        try {
            const preview = await getPreview(this.thoughtSpotHost, this.viewConfig.vizId, this.viewConfig.liveboardId);
            if (!preview.vizContent) {
                return;
            }
            addPreviewStylesIfNotPresent();
            const div = document.createElement('div');
            div.innerHTML = `
                <div class=ts-viz-preview-loader>
                    ${preview.vizContent}
                </div>
                `;
            const previewDiv = div.firstElementChild;
            this.hostElement.appendChild(previewDiv);
            this.hostElement.style.position = 'relative';
            this.on(EmbedEvent.Data, () => {
                previewDiv.remove();
            });
        }
        catch (error) {
            console.error('Error fetching preview', error);
        }
    }
    beforePrerenderVisible() {
        super.beforePrerenderVisible();
        const embedObj = this.getPreRenderObj();
        this.executeAfterEmbedContainerLoaded(() => {
            this.navigateToLiveboard(this.viewConfig.liveboardId, this.viewConfig.vizId, this.viewConfig.activeTabId, this.viewConfig.personalizedViewId);
            if (embedObj) {
                embedObj.currentLiveboardState = {
                    liveboardId: this.viewConfig.liveboardId,
                    vizId: this.viewConfig.vizId,
                    activeTabId: this.viewConfig.activeTabId,
                    personalizedViewId: this.viewConfig.personalizedViewId,
                };
            }
        });
    }
    async handleRenderForPrerender() {
        if (isUndefined(this.viewConfig.liveboardId)) {
            return this.prerenderGeneric();
        }
        return super.handleRenderForPrerender();
    }
    /**
     * Triggers an event to the embedded app
     * @param {HostEvent} messageType The event type
     * @param {any} data The payload to send with the message
     * @returns A promise that resolves with the response from the embedded app
     */
    trigger(messageType, data = {}, context) {
        const dataWithVizId = data;
        if (messageType === HostEvent.SetActiveTab) {
            this.setActiveTab(data);
            return Promise.resolve(null);
        }
        if (typeof dataWithVizId === 'object' && this.viewConfig.vizId) {
            dataWithVizId.vizId = this.viewConfig.vizId;
        }
        return super.trigger(messageType, dataWithVizId, context);
    }
    /**
     * Destroys the ThoughtSpot embed, and remove any nodes from the DOM.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
    destroy() {
        super.destroy();
        this.unregisterLazyLoadEvents();
    }
    postRender() {
        this.registerLazyLoadEvents();
    }
    registerLazyLoadEvents() {
        if (this.viewConfig.fullHeight && this.viewConfig.lazyLoadingForFullHeight) {
            // TODO: Use passive: true, install modernizr to check for passive
            window.addEventListener('resize', this.sendFullHeightLazyLoadData);
            window.addEventListener('scroll', this.sendFullHeightLazyLoadData, true);
        }
    }
    unregisterLazyLoadEvents() {
        if (this.viewConfig.fullHeight && this.viewConfig.lazyLoadingForFullHeight) {
            window.removeEventListener('resize', this.sendFullHeightLazyLoadData);
            window.removeEventListener('scroll', this.sendFullHeightLazyLoadData);
        }
    }
    /**
     * Render an embedded ThoughtSpot Liveboard or visualization
     * @param renderOptions An object specifying the Liveboard ID,
     * visualization ID and the runtime filters.
     */
    async render() {
        await super.render();
        const src = this.getIFrameSrc();
        await this.renderV1Embed(src);
        this.showPreviewLoader();
        this.postRender();
        return this;
    }
    navigateToLiveboard(liveboardId, vizId, activeTabId, personalizedViewId) {
        const path = this.getIframeSuffixSrc(liveboardId, vizId, activeTabId, personalizedViewId);
        this.viewConfig.liveboardId = liveboardId;
        this.viewConfig.activeTabId = activeTabId;
        this.viewConfig.vizId = vizId;
        this.viewConfig.personalizedViewId = personalizedViewId;
        if (this.isRendered) {
            this.trigger(HostEvent.Navigate, path.substring(1));
        }
        else if (this.viewConfig.preRenderId) {
            this.preRender(true);
        }
        else {
            this.render();
        }
    }
    /**
     * Returns the full url of the Liveboard/visualization which can be used to open
     * this Liveboard inside the full ThoughtSpot application in a new tab.
     * @returns url string
     */
    getLiveboardUrl() {
        let url = `${this.thoughtSpotHost}/#/pinboard/${this.viewConfig.liveboardId}`;
        if (this.viewConfig.activeTabId) {
            url = `${url}/tab/${this.viewConfig.activeTabId}`;
        }
        if (this.viewConfig.vizId) {
            url = `${url}/${this.viewConfig.vizId}`;
        }
        if (this.viewConfig.personalizedViewId) {
            url = `${url}?view=${this.viewConfig.personalizedViewId}`;
        }
        return url;
    }
};

const createConversation = `
mutation CreateConversation($params: Input_convassist_CreateConversationRequest) {
  ConvAssist__createConversation(request: $params) {
    convId
    initialCtx {
      type
      tsAnsCtx {
        sessionId
        genNo
        stateKey {
          transactionId
          generationNumber
        }
        worksheet {
          worksheetId
          worksheetName
        }
      }
    }
  }
}
`;
const sendMessage = `
query SendMessage($params: Input_convassist_SendMessageRequest) {
  ConvAssist__sendMessage(request: $params) {
    responses {
      timestamp
      msgId
      data {
        asstRespData {
          tool
          asstRespText
          nlsAnsData {
            sageQuerySuggestions {
              sageQueryTokens {
                additions {
                  phrase {
                    isCompletePhrase
                    numTokens
                    phraseType
                    startIndex
                    __typename
                  }
                  tokens {
                    token
                    dataType
                    typeEnum
                    guid
                    tokenMetadata {
                      name
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                phrases {
                  isCompletePhrase
                  numTokens
                  phraseType
                  startIndex
                  __typename
                }
                removals {
                  phrase {
                    isCompletePhrase
                    numTokens
                    phraseType
                    startIndex
                    __typename
                  }
                  tokens {
                    token
                    dataType
                    typeEnum
                    guid
                    tokenMetadata {
                      name
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                tokens {
                  token
                  dataType
                  typeEnum
                  guid
                  tokenMetadata {
                    name
                    __typename
                  }
                  __typename
                }
                __typename
              }
              llmReasoning {
                assumptions
                clarifications
                interpretation
                __typename
              }
              tokens
              tmlTokens
              worksheetId
              tokens
              description
              title
              tmlTokens
              cached
              sqlQuery
              sessionId
              genNo
              formulaInfo {
                name
                expression
                __typename
              }
              tmlPhrases
              ambiguousPhrases {
                alternativePhrases {
                  phraseType
                  token {
                    token
                    dataType
                    typeEnum
                    guid
                    tokenMetadata {
                      name
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                ambiguityType
                token {
                  token
                  dataType
                  typeEnum
                  guid
                  tokenMetadata {
                    name
                    __typename
                  }
                  __typename
                }
                __typename
              }
              ambiguousTokens {
                alternativeTokens {
                  token
                  dataType
                  typeEnum
                  guid
                  tokenMetadata {
                    name
                    deprecatedTableGuid
                    deprecatedTableName
                    isFormula
                    rootTables {
                      created
                      description
                      guid
                      indexVersion
                      modified
                      name
                      __typename
                    }
                    schemaTableUserDefinedName
                    table {
                      created
                      description
                      guid
                      indexVersion
                      modified
                      name
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                ambiguityType
                token {
                  token
                  dataType
                  typeEnum
                  guid
                  tokenMetadata {
                    name
                    __typename
                  }
                  __typename
                }
                __typename
              }
              stateKey {
                transactionId
                generationNumber
                transactionId
                __typename
              }
              subQueries {
                tokens
                cohortConfig {
                  anchorColumnId
                  cohortAnswerGuid
                  cohortGroupingType
                  cohortGuid
                  cohortType
                  combineNonGroupValues
                  description
                  groupExcludedQueryValues
                  hideExcludedQueryValues
                  isEditable
                  name
                  nullOutputValue
                  returnColumnId
                  __typename
                }
                formulas {
                  name
                  expression
                  __typename
                }
                __typename
              }
              visualizationSuggestion {
                chartType
                displayMode
                axisConfigs {
                  category
                  color
                  hidden
                  size
                  sort
                  x
                  y
                  __typename
                }
                usersVizIntentApplied
                customChartConfigs {
                  dimensions {
                    columns
                    key
                    __typename
                  }
                  key
                  __typename
                }
                customChartGuid
                __typename
              }
              tableData {
                columnDataLite {
                  columnId
                  columnDataType
                  dataValue
                  columnName
                  __typename
                }
                __typename
              }
              warningType
              cached
              __typename
            }
            debugInfo {
              fewShotExamples {
                chartType
                id
                mappingId
                nlQuery
                nlQueryConcepts
                sageQuery
                scope
                sql
                tml
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        errorData {
          tool
          errCode
          errTxt
          toolErrCode
          __typename
        }
        __typename
      }
      type
      __typename
    }
    prevCtx {
      genNo
      sessionId
      __typename
    }
    __typename
  }
}
`;

class Conversation {
    constructor(thoughtSpotHost, worksheetId) {
        this.thoughtSpotHost = thoughtSpotHost;
        this.worksheetId = worksheetId;
        this.inProgress = null;
        this.inProgress = this.init();
    }
    async init() {
        const { convId } = await this.createConversation();
        this.conversationId = convId;
    }
    createConversation() {
        return this.executeQuery(createConversation, {
            params: {
                initialCtx: {
                    tsWorksheetCtx: {
                        worksheet: {
                            worksheetId: this.worksheetId,
                        },
                    },
                    type: 'TS_WORKSHEET',
                },
                userInfo: {
                    tenantUrl: `${this.thoughtSpotHost}/prism`,
                },
            },
        });
    }
    async sendMessage(userMessage) {
        await this.inProgress;
        try {
            const { responses } = await this.executeQuery(sendMessage, {
                params: {
                    convId: this.conversationId,
                    headers: [],
                    msg: {
                        data: {
                            userCmdData: {
                                cmdText: userMessage,
                                nlsData: {
                                    worksheetId: this.worksheetId,
                                    questionType: 'ANSWER_SPEC_GENERATION',
                                },
                            },
                        },
                        msgId: crypto.randomUUID(),
                        type: 'USER_COMMAND',
                    },
                },
            });
            const data = responses[0].data;
            return {
                convId: this.conversationId,
                messageId: responses[0].msgId,
                data: {
                    ...data.asstRespData.nlsAnsData.sageQuerySuggestions[0],
                    convId: this.conversationId,
                    messageId: responses[0].msgId,
                },
                error: null,
            };
        }
        catch (error) {
            return { error };
        }
    }
    async executeQuery(query, variables) {
        return graphqlQuery({
            query,
            variables,
            thoughtSpotHost: this.thoughtSpotHost,
            isCompositeQuery: false,
        });
    }
}

let ConversationMessage$1 = class ConversationMessage extends TsEmbed {
    constructor(container, viewConfig) {
        viewConfig.embedComponentType = 'bodyless-conversation';
        super(container, viewConfig);
        this.viewConfig = viewConfig;
    }
    getEmbedParamsObject() {
        var _a;
        const queryParams = this.getBaseQueryParams();
        queryParams[Param.HideActions] = [...((_a = queryParams[Param.HideActions]) !== null && _a !== void 0 ? _a : [])];
        queryParams[Param.isSpotterAgentEmbed] = true;
        return queryParams;
    }
    getIframeSrc() {
        const { sessionId, genNo, acSessionId, acGenNo, convId, messageId, } = this.viewConfig;
        const path = 'conv-assist-answer';
        const queryParams = this.getEmbedParamsObject();
        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }
        const tsPostHashParams = this.getThoughtSpotPostUrlParams({
            sessionId,
            genNo,
            acSessionId,
            acGenNo,
            convId,
            messageId,
        });
        return `${this.getEmbedBasePath(query)}/embed/${path}${tsPostHashParams}`;
    }
    async render() {
        await super.render();
        const src = this.getIframeSrc();
        await this.renderIFrame(src);
        return this;
    }
};
/**
 * Create a conversation embed, which can be integrated inside
 * chatbots or other conversational interfaces.
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 * @group Embed components
 * @example
 * ```js
 * import { SpotterAgentEmbed } from '@thoughtspot/visual-embed-sdk';
 *
 * const conversation = new SpotterAgentEmbed({
 *  worksheetId: 'worksheetId',
 * });
 *
 * const { container, error } = await conversation.sendMessage('show me sales by region');
 *
 * // append the container to the DOM
 * document.body.appendChild(container); // or to any other element
 * ```
 */
class SpotterAgentEmbed {
    constructor(viewConfig) {
        this.viewConfig = viewConfig;
        const embedConfig = getEmbedConfig();
        this.conversationService = new Conversation(embedConfig.thoughtSpotHost, viewConfig.worksheetId);
    }
    async sendMessage(userMessage) {
        const { data, error } = await this.conversationService.sendMessage(userMessage);
        if (error) {
            return { error };
        }
        const container = document.createElement('div');
        const embed = new ConversationMessage$1(container, {
            ...this.viewConfig,
            convId: data.convId,
            messageId: data.messageId,
            sessionId: data.sessionId,
            genNo: data.genNo,
            acSessionId: data.stateKey.transactionId,
            acGenNo: data.stateKey.generationNumber,
        });
        await embed.render();
        return { container, viz: embed };
    }
    /**
     * Send a message to the conversation service and return only the data.
     * @param userMessage - The message to send to the conversation service.
     * @returns The data from the conversation service.
     */
    async sendMessageData(userMessage) {
        try {
            const { data, error } = await this.conversationService.sendMessage(userMessage);
            if (error) {
                return { error };
            }
            return { data: {
                    convId: data.convId,
                    messageId: data.messageId,
                    sessionId: data.sessionId,
                    genNo: data.genNo,
                    acSessionId: data.stateKey.transactionId,
                    acGenNo: data.stateKey.generationNumber,
                } };
        }
        catch (error) {
            return { error: error };
        }
    }
}

/**
 *
 * @param props
 */
function getViewPropsAndListeners(props) {
    return Object.keys(props).reduce((accu, key) => {
        if (key.startsWith('on')) {
            const eventName = key.substr(2);
            accu.listeners[EmbedEvent[eventName]] = props[key];
        }
        else {
            accu.viewConfig[key] = props[key];
        }
        return accu;
    }, {
        viewConfig: {},
        listeners: {},
    });
}

/**
 * Embed ThoughtSpot AI Conversation.
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 * @group Embed components
 * @example
 * ```js
 * const conversation = new SpotterEmbed('#tsEmbed', {
 *   worksheetId: 'worksheetId',
 *   searchOptions: {
 *     searchQuery: 'searchQuery',
 *   },
 * });
 * conversation.render();
 * ```
 */
let SpotterEmbed$1 = class SpotterEmbed extends TsEmbed {
    constructor(container, viewConfig) {
        viewConfig = {
            embedComponentType: 'conversation',
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        };
        super(container, viewConfig);
        this.viewConfig = viewConfig;
    }
    /**
     * Extends the default APP_INIT payload with `embedParams.spotterSidebarConfig`
     * so the conv-assist app can read sidebar configuration on initialisation.
     *
     * Precedence for `enablePastConversationsSidebar`:
     * `spotterSidebarConfig.enablePastConversationsSidebar` wins over the
     * deprecated top-level `enablePastConversationsSidebar` flag; if the former
     * is absent the latter is used as a fallback.
     *
     * An invalid `spotterDocumentationUrl` triggers a validation error and is
     * excluded from the payload rather than forwarded to the app.
     */
    async getAppInitData() {
        const defaultAppInitData = await super.getAppInitData();
        return buildSpotterSidebarAppInitData(defaultAppInitData, this.viewConfig, this.handleError.bind(this));
    }
    getEmbedParamsObject() {
        const { worksheetId, searchOptions, disableSourceSelection, hideSourceSelection, dataPanelV2, showSpotterLimitations, hideSampleQuestions, runtimeFilters, excludeRuntimeFiltersfromURL, runtimeParameters, excludeRuntimeParametersfromURL, updatedSpotterChatPrompt, enableStopAnswerGenerationEmbed, spotterChatConfig, } = this.viewConfig;
        if (!worksheetId) {
            this.handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND,
                code: EmbedErrorCodes.WORKSHEET_ID_NOT_FOUND,
                error: ERROR_MESSAGE.SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND,
            });
        }
        const queryParams = this.getBaseQueryParams();
        queryParams[Param.SpotterEnabled] = true;
        // Boolean params
        setParamIfDefined(queryParams, Param.DisableSourceSelection, disableSourceSelection, true);
        setParamIfDefined(queryParams, Param.HideSourceSelection, hideSourceSelection, true);
        setParamIfDefined(queryParams, Param.DataPanelV2Enabled, dataPanelV2, true);
        setParamIfDefined(queryParams, Param.ShowSpotterLimitations, showSpotterLimitations, true);
        setParamIfDefined(queryParams, Param.HideSampleQuestions, hideSampleQuestions, true);
        setParamIfDefined(queryParams, Param.UpdatedSpotterChatPrompt, updatedSpotterChatPrompt, true);
        setParamIfDefined(queryParams, Param.EnableStopAnswerGenerationEmbed, enableStopAnswerGenerationEmbed, true);
        // Handle spotterChatConfig params
        if (spotterChatConfig) {
            const { hideToolResponseCardBranding, toolResponseCardBrandingLabel, spotterFileUploadEnabled, spotterFileUploadFileTypes, } = spotterChatConfig;
            setParamIfDefined(queryParams, Param.HideToolResponseCardBranding, hideToolResponseCardBranding, true);
            setParamIfDefined(queryParams, Param.ToolResponseCardBrandingLabel, toolResponseCardBrandingLabel);
            setParamIfDefined(queryParams, Param.SpotterFileUploadEnabled, spotterFileUploadEnabled, true);
            if (spotterFileUploadFileTypes !== undefined) {
                queryParams[Param.SpotterFileUploadFileTypes] = JSON.stringify(spotterFileUploadFileTypes);
            }
        }
        return queryParams;
    }
    getIframeSrc() {
        const { worksheetId, searchOptions, runtimeFilters, excludeRuntimeFiltersfromURL, runtimeParameters, excludeRuntimeParametersfromURL, } = this.viewConfig;
        const path = 'insights/conv-assist';
        const queryParams = this.getEmbedParamsObject();
        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
        }
        const filterQuery = getFilterQuery(runtimeFilters || []);
        if (filterQuery && !excludeRuntimeFiltersfromURL) {
            query += `&${filterQuery}`;
        }
        const parameterQuery = getRuntimeParameters(runtimeParameters || []);
        if (parameterQuery && !excludeRuntimeParametersfromURL) {
            query += `&${parameterQuery}`;
        }
        const tsPostHashParams = this.getThoughtSpotPostUrlParams({
            worksheet: worksheetId,
            query: (searchOptions === null || searchOptions === void 0 ? void 0 : searchOptions.searchQuery) || '',
        });
        return `${this.getEmbedBasePath(query)}/embed/${path}${tsPostHashParams}`;
    }
    async render() {
        await super.render();
        const src = this.getIframeSrc();
        await this.renderIFrame(src);
        return this;
    }
};
/**
 * Embed ThoughtSpot AI Conversation.
 * Use {@link SpotterEmbed} instead
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * @group Embed components
 * @example
 * ```js
 * const conversation = new SpotterEmbed('#tsEmbed', {
 *   worksheetId: 'worksheetId',
 *   searchOptions: {
 *     searchQuery: 'searchQuery',
 *   },
 * });
 * conversation.render();
 * ```
 */
let ConversationEmbed$1 = class ConversationEmbed extends SpotterEmbed$1 {
    constructor(container, viewConfig) {
        viewConfig = {
            embedComponentType: 'conversation',
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        };
        super(container, viewConfig);
        this.viewConfig = viewConfig;
    }
};

const componentFactory = (EmbedConstructor, 
// isPreRenderedComponent: Specifies whether the component being returned is
// intended for preRendering. If set to true, the component will call the
// Embed.preRender() method instead of the usual render method, and it will
// not be destroyed when the component is unmounted.
isPreRenderedComponent = false) => {
    const Component = React__default.forwardRef((props, forwardedRef) => {
        const ref = React__default.useRef(null);
        const { className, style, ...embedProps } = props;
        const { viewConfig, listeners } = getViewPropsAndListeners(embedProps);
        const handleDestroy = (tsEmbed) => {
            // do not destroy if it is a preRender component
            if (isPreRenderedComponent)
                return;
            // if component is connected to a preRendered component
            if (props.preRenderId) {
                tsEmbed.hidePreRender();
                return;
            }
            tsEmbed.destroy();
        };
        const handlePreRenderRendering = (tsEmbed) => {
            tsEmbed.preRender();
        };
        const handleDefaultRendering = (tsEmbed) => {
            // if component is connected to a preRendered component
            if (props.preRenderId) {
                tsEmbed.showPreRender();
                return;
            }
            tsEmbed.render();
        };
        const handleRendering = (tsEmbed) => {
            if (isPreRenderedComponent) {
                handlePreRenderRendering(tsEmbed);
                return;
            }
            handleDefaultRendering(tsEmbed);
        };
        useDeepCompareEffect(() => {
            const tsEmbed = new EmbedConstructor(ref.current, deepMerge({
                insertAsSibling: viewConfig.insertAsSibling,
                frameParams: {
                    class: viewConfig.insertAsSibling ? className || '' : '',
                },
            }, viewConfig));
            Object.keys(listeners).forEach((eventName) => {
                tsEmbed.on(eventName, listeners[eventName]);
            });
            handleRendering(tsEmbed);
            if (forwardedRef) {
                forwardedRef.current = tsEmbed;
            }
            return () => {
                handleDestroy(tsEmbed);
            };
        }, [viewConfig, listeners]);
        const preRenderStyles = isPreRenderedComponent ? { display: 'none' } : {};
        // We dont add any component for preRenderedComponent
        if (isPreRenderedComponent)
            return React__default.createElement(React__default.Fragment, null);
        return viewConfig.insertAsSibling ? (React__default.createElement("span", { "data-testid": "tsEmbed", ref: ref, style: { position: 'absolute', ...preRenderStyles } })) : (React__default.createElement("div", { "data-testid": "tsEmbed", ref: ref, style: { ...style, ...preRenderStyles }, className: `ts-embed-container ${className}` }));
    });
    Component.displayName = EmbedConstructor.name || 'EmbedComponent';
    return Component;
};
/**
 * React component for Search Embed.
 * @example
 * ```tsx
 * function Search() {
 *  return <SearchEmbed
 *      dataSource="dataSourceId"
 *      searchOptions={{ searchTokenString: "[revenue]" }}
 *  />
 * }
 * ```
 */
const SearchEmbed = componentFactory(SearchEmbed$1);
const PreRenderedSearchEmbed = componentFactory(SearchEmbed$1, true);
/**
 * React component for Full app Embed.
 * @example
 * ```tsx
 * function App() {
 *  return <AppEmbed
 *      showPrimaryNavbar={false}
 *      pageId={Page.Liveboards}
 *      onError={(error) => console.error(error)}
 *  />
 * }
 * ```
 */
const AppEmbed = componentFactory(AppEmbed$1);
/**
 * React component for PreRendered App embed.
 *
 * PreRenderedAppEmbed will preRender the AppEmbed and will be hidden by
 * default.
 *
 * AppEmbed with preRenderId passed will call showPreRender on the embed.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedAppEmbed preRenderId="someId" showPrimaryNavbar={false} />
 * }
 * ```
 * function MyComponent() {
 *  return <AppEmbed preRenderId="someId" showPrimaryNavbar={false} />
 * }
 * ```
 */
const PreRenderedAppEmbed = componentFactory(AppEmbed$1, true);
/**
 * React component for Liveboard embed.
 * @example
 * ```tsx
 * function Liveboard() {
 *  return <LiveboardEmbed
 *      liveboardId="liveboardId"
 *      fullHeight={true} {/* default false *\/}
 *      onLiveboardRendered={() => console.log('Liveboard rendered')}
 *      vizId="vizId" {/* if doing viz embed *\/}
 *  />
 * }
 * ```
 */
const LiveboardEmbed = componentFactory(LiveboardEmbed$1);
const PinboardEmbed = LiveboardEmbed;
/**
 * React component for PreRendered Liveboard embed.
 *
 * PreRenderedLiveboardEmbed will preRender the liveboard and will be hidden by default.
 *
 * LiveboardEmbed with preRenderId passed will call showPreRender on the embed.
 *
 * If LiveboardEmbed is rendered before PreRenderedLiveboardEmbed is rendered it
 * tries to preRender the LiveboardEmbed, so it is recommended to pass the
 * liveboardId to both the components.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedLiveboardEmbed preRenderId="someId" liveboardId="libId" />
 * }
 * ```
 * function MyComponent() {
 *  return <LiveboardEmbed preRenderId="someId" liveboardId="libId" />
 * }
 * ```
 */
const PreRenderedLiveboardEmbed = componentFactory(LiveboardEmbed$1, true);
const PreRenderedPinboardEmbed = PreRenderedLiveboardEmbed;
/**
 * React component for Search bar embed.
 * @example
 * ```tsx
 * function SearchBar() {
 *  return <SearchBarEmbed
 *      dataSource="dataSourceId"
 *      searchOptions={{ searchTokenString: "[revenue]" }}
 *  />
 * }
 * ```
 */
const SearchBarEmbed = componentFactory(SearchBarEmbed$1);
/**
 * React component for PreRendered SearchBar embed.
 *
 * PreRenderedSearchBarEmbed will preRender the SearchBarEmbed and will be hidden by
 * default.
 *
 * SearchBarEmbed with preRenderId passed will call showPreRender on the embed.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedSearchBarEmbed preRenderId="someId"  dataSource="dataSourceId" />
 * }
 * ```
 * function MyComponent() {
 *  return <SearchBarEmbed preRenderId="someId"  dataSource="dataSourceId" />
 * }
 * ```
 */
const PreRenderedSearchBarEmbed = componentFactory(SearchBarEmbed$1, true);
/**
 * React component for LLM based conversation BI.
 * @example
 * ```tsx
 * function Sage() {
 *  return <SpotterEmbed
 *      worksheetId="<worksheet-id-here>"
 *      searchOptions={{
 *          searchQuery: "<search query to start with>"
 *      }}
 *      ... other view config props or event listeners.
 *  />
 * }
 * ```
 */
const SpotterEmbed = componentFactory(SpotterEmbed$1);
/**
 * React component for LLM based conversation BI.
 * Use {@link SpotterEmbed} instead
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * @example
 * ```tsx
 * function Sage() {
 *  return <ConversationEmbed
 *      worksheetId="<worksheet-id-here>"
 *      searchOptions={{
 *          searchQuery: "<search query to start with>"
 *      }}
 *      ... other view config props or event listeners.
 *  />
 * }
 * ```
 */
const ConversationEmbed = componentFactory(ConversationEmbed$1);
const ConversationMessage = componentFactory(ConversationMessage$1);
/**
 * React component for displaying individual conversation messages from SpotterAgent.
 *
 * This component renders a single message response from your ThoughtSpot conversation,
 * showing charts, visualizations, or text responses based on the user's query.
 *
 * @version SDK: 1.39.0 | ThoughtSpot: 10.11.0.cl
 * @example
 * ```tsx
 * const { sendMessage } = useSpotterAgent({ worksheetId: 'worksheetId' });
 * const result = await sendMessage('show me sales by region');
 *
 * if (!result.error) {
 *   // Simple usage - just pass the message data
 *   <SpotterMessage message={result.message} />
 *
 *   // With optional query for context
 *   <SpotterMessage
 *     message={result.message}
 *     query={result.query}
 *   />
 * }
 * ```
 */
const SpotterMessage = React__default.forwardRef((props, ref) => {
    const { message, query: _, ...otherProps } = props;
    return (React__default.createElement(ConversationMessage, { ref: ref, ...message, ...otherProps }));
});
SpotterMessage.displayName = 'SpotterMessage';
/**
 * React component for PreRendered Conversation embed.
 *
 * PreRenderedConversationEmbed will preRender the SpotterEmbed and will be hidden by
 * default.
 *
 * SpotterEmbed with preRenderId passed will call showPreRender on the embed.
 * @example
 * ```tsx
 * function LandingPageComponent() {
 *  return <PreRenderedConversationEmbed preRenderId="someId" worksheetId={"id-"} />
 * }
 * ```
 * function MyComponent() {
 *  return <SpotterEmbed preRenderId="someId" worksheetId="id" />
 * }
 * ```
 */
const PreRenderedConversationEmbed = componentFactory(SpotterEmbed$1, true);
/**
 * Get a reference to the embed component to trigger events on the component.
 * @example
 * ```
 * function Component() {
 * const ref = useEmbedRef();
 * useEffect(() => {
 * ref.current.trigger(
 *  EmbedEvent.UpdateRuntimeFilter,
 *  [{ columnName: 'name', operator: 'EQ', values: ['value']}]);
 * }, [])
 * return <LiveboardEmbed ref={ref} liveboardId={<id>} />
 * }
 * ```
 * @returns {React.MutableRefObject<T extends TsEmbed>} ref
 */
function useEmbedRef() {
    return React__default.useRef(null);
}
/**
 *
 * @version SDK: 1.36.2 | ThoughtSpot: *
 * @param config - EmbedConfig
 * @returns AuthEventEmitter
 * @example
 * ```
 * function Component() {
 *  const authEE = useInit({ ...initConfig });
 *  return <LiveboardEmbed ref={ref} liveboardId={<id>} />
 * }
 * ```
 */
function useInit(config) {
    const ref = useRef(null);
    useDeepCompareEffect(() => {
        const authEE = init(config);
        ref.current = authEE;
    }, [config]);
    return ref;
}
/**
 * React hook for interacting with SpotterAgent AI conversations.
 *
 * This hook provides a sendMessage function that allows you to send natural language
 * queries to your data and get back AI-generated responses with visualizations.
 *
 * @version SDK: 1.39.0 | ThoughtSpot: 10.11.0.cl
 * @param config - Configuration object containing worksheetId and other options
 * @returns Object with sendMessage function that returns conversation results
 * @example
 * ```tsx
 * const { sendMessage } = useSpotterAgent({ worksheetId: 'worksheetId' });
 *
 * const handleQuery = async () => {
 *   const result = await sendMessage('show me sales by region');
 *
 *   if (!result.error) {
 *     // Display the message response
 *     <SpotterMessage message={result.message} />
 *   } else {
 *     console.error('Error:', result.error);
 *   }
 * };
 * ```
 */
function useSpotterAgent(config) {
    const serviceRef = useRef(null);
    useDeepCompareEffect(() => {
        if (serviceRef.current) {
            serviceRef.current = null;
        }
        serviceRef.current = new SpotterAgentEmbed(config);
        return () => {
            serviceRef.current = null;
        };
    }, [config]);
    const sendMessage = useCallback(async (query) => {
        if (!serviceRef.current) {
            return { error: new Error(ERROR_MESSAGE.SPOTTER_AGENT_NOT_INITIALIZED) };
        }
        const result = await serviceRef.current.sendMessageData(query);
        if (result.error) {
            return { error: result.error };
        }
        return {
            query: query,
            message: {
                ...result.data,
                worksheetId: config.worksheetId,
            },
        };
    }, [config.worksheetId]);
    return {
        sendMessage,
    };
}

export { Action, AppEmbed, ConversationEmbed, ConversationMessage, CustomActionsPosition, EmbedEvent, HomeLeftNavItem, HomepageModule, HostEvent, ListPageColumns, LiveboardEmbed, LogLevel, Page, PinboardEmbed, PreRenderedAppEmbed, PreRenderedConversationEmbed, PreRenderedLiveboardEmbed, PreRenderedPinboardEmbed, PreRenderedSearchBarEmbed, PreRenderedSearchEmbed, RuntimeFilterOp, SearchBarEmbed, SearchEmbed, SpotterEmbed, SpotterMessage, getSessionInfo, useEmbedRef, useInit, useSpotterAgent };
