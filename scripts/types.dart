import 'package:json_annotation/json_annotation.dart';
part 'types.g.dart';
  
/**
 * The authentication mechanism for allowing access to the
 * the embedded app
 * @group Authentication / Init
 */
@JsonEnum(valueField: 'value')
enum AuthType {
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
  None("None"), 
    /**
     * Passthrough SSO to the embedded application within the iframe. Requires least
     * configuration, but may not be supported by all IDPs. This will behave like `None`
     * if SSO is not configured on ThoughtSpot.
     *
     * To use this:
     * Your SAML or OpenID provider must allow iframe redirects.
     * For example, if you are using Okta as IdP, you can enable iframe embedding.
     * @example
     * ```js
     * init({
     *   // ...
     *   authType: AuthType.EmbeddedSSO,
     *  });
     * ```
     * @version: SDK: 1.15.0 | ThoughtSpot: 8.8.0.cl
     */
  EmbeddedSSO("EmbeddedSSO"), 
    /**
     * SSO using SAML
     * @deprecated Use {@link SAMLRedirect} instead
     * @hidden
     */
  SSO("SSO_SAML"), 
    /**
     * SSO using SAML
     * @deprecated Use {@link SAMLRedirect} instead
     * @hidden
     */
  SAML("SSO_SAML"), 
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
     *   authTriggerContainer: '#embed-container',
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
  SAMLRedirect("SSO_SAML"), 
    /**
     * SSO using OIDC
     * @hidden
     * @deprecated Use {@link OIDCRedirect} instead
     */
  OIDC("SSO_OIDC"), 
    /**
     * SSO using OIDC
     * Will make the host application redirect to the OIDC IdP.
     * See code samples in {@link SAMLRedirect}.
     */
  OIDCRedirect("SSO_OIDC"), 
    /**
     * Trusted authentication server
     * @hidden
     * @deprecated Use {@link TrustedAuth} instead
     */
  AuthServer("AuthServer"), 
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
  TrustedAuthToken("AuthServer"), 
    /**
     * Trusted authentication server Cookieless, Use your own authentication
     * server which returns a bearer token, generated using the `secret_key`
     * obtained from ThoughtSpot. This uses a cookieless authentication
     * approach, recommended to bypass the third-party cookie-blocking restriction
     * implemented by some browsers.
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
     * ```
     * @version SDK: 1.22.0| ThoughtSpot: 9.3.0.cl, 9.5.1.sw
     */
  TrustedAuthTokenCookieless("AuthServerCookieless"), 
    /**
     * Use the ThoughtSpot login API to authenticate to the cluster directly.
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
  Basic("Basic");

  final String value;
  const AuthType(this.value);
}
/**
 *
 * This option does not apply to the classic homepage experience.
 * To access the updated modular homepage,
 * set `modularHomeExperience` to `true`
 * (available as Early Access feature in 9.12.5.cl).
 *
 */
@JsonEnum(valueField: 'value')
enum HomeLeftNavItem {
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
  SearchData("search-data"), 
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
  Home("insights-home"), 
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
  Liveboards("liveboards"), 
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
  Answers("answers"), 
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
  MonitorSubscription("monitor-alerts"), 
    /**
     * @version SDK: 1.28.0| ThoughtSpot: 9.12.5.cl
     */
  SpotIQAnalysis("spotiq-analysis"), 
    /**
     * @version SDK: 1.34.0| ThoughtSpot: 10.3.0.cl
     */
  LiveboardSchedules("liveboard-schedules"), 
    /**
     * Create new options in the insights left navigation,
     * available when new navigation V3 is enabled.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
  Create("create"), 
    /**
     * Spotter option in the insights left navigation,
     * available when new navigation V3 is enabled.
     * @version SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
     */
  Spotter("spotter");

  final String value;
  const HomeLeftNavItem(this.value);
}
/**
 * A map of the supported runtime filter operations
 */
@JsonEnum(valueField: 'value')
enum RuntimeFilterOp {
    /**
     * Equals
     */
  EQ("EQ"), 
    /**
     * Does not equal
     */
  NE("NE"), 
    /**
     * Less than
     */
  LT("LT"), 
    /**
     * Less than or equal to
     */
  LE("LE"), 
    /**
     * Greater than
     */
  GT("GT"), 
    /**
     * Greater than or equal to
     */
  GE("GE"), 
    /**
     * Contains
     */
  CONTAINS("CONTAINS"), 
    /**
     * Begins with
     */
  BEGINS_WITH("BEGINS_WITH"), 
    /**
     * Ends with
     */
  ENDS_WITH("ENDS_WITH"), 
    /**
     * Between, inclusive of higher value
     */
  BW_INC_MAX("BW_INC_MAX"), 
    /**
     * Between, inclusive of lower value
     */
  BW_INC_MIN("BW_INC_MIN"), 
    /**
     * Between, inclusive of both higher and lower value
     */
  BW_INC("BW_INC"), 
    /**
     * Between, non-inclusive
     */
  BW("BW"), 
    /**
     * Is included in this list of values
     */
  IN("IN"), 
    /**
     * Is not included in this list of values
     */
  NOT_IN("NOT_IN");

  final String value;
  const RuntimeFilterOp(this.value);
}
/**
 * Home page module that can be hidden.
 * **Note**: This option does not apply to the classic homepage.
 * To access the updated modular homepage, set
 * `modularHomeExperience` to `true` (available as Early Access feature in 9.12.5.cl).
 * @version SDK: 1.28.0 | ThoughtSpot: 9.12.5.cl, 10.1.0.sw
 */
@JsonEnum(valueField: 'value')
enum HomepageModule {
    /**
     * Search bar
     */
  Search("SEARCH"), 
    /**
     * kPI watchlist module
     */
  Watchlist("WATCHLIST"), 
    /**
     * favorite objects
     */
  Favorite("FAVORITE"), 
    /**
     * List of answers and Liveboards
     */
  MyLibrary("MY_LIBRARY"), 
    /**
     * Trending list
     */
  Trending("TRENDING"), 
    /**
     * Learning videos
     */
  Learning("LEARNING");

  final String value;
  const HomepageModule(this.value);
}
/**
 * List page columns that can be hidden.
 * **Note**: This option is applicable to full app embedding only.
 * @version SDK: 1.38.0 | ThoughtSpot: 10.9.0.cl
 */
@JsonEnum(valueField: 'value')
enum ListPageColumns {
    /**
     * Favourite
     */
  Favourite("FAVOURITE"), 
    /**
     * Tags
     */
  Tags("TAGS"), 
    /**
     * Author
     */
  Author("AUTHOR"), 
    /**
     * Last viewed/Last modified
     */
  DateSort("DATE_SORT"), 
    /**
     * Share
     */
  Share("SHARE");

  final String value;
  const ListPageColumns(this.value);
}
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
@JsonEnum(valueField: 'value')
enum EmbedEvent {
    /**
     * Rendering has initialized.
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Init, showLoader)
     *  //show a loader
     * function showLoader() {
     * document.getElementById("loader");
     * }
     *```
     * @returns timestamp - The timestamp when the event was generated.
     */
  Init("init"), 
    /**
     * Authentication has either succeeded or failed.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.AuthInit, payload => {
     *    console.log('AuthInit', payload);
     * })
     *```
     * @returns isLoggedIn - A Boolean specifying whether authentication was successful.
     */
  AuthInit("authInit"), 
    /**
     * The embed object container has loaded.
     * @returns timestamp - The timestamp when the event was generated.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Load, hideLoader)
     *    //hide loader
     * function hideLoader() {
     *   document.getElementById("loader");
     * }
     *```
     */
  Load("load"), 
    /**
     * Data pertaining to an Answer or Liveboard is received.
     * The event payload includes the raw data of the object.
     * @return data -  Answer of Liveboard data
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Data, payload => {
     *    console.log('data', payload);
     * })
     *```
     * @important
     */
  Data("data"), 
    /**
     * Search query has been updated by the user.
     * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 8.4.1.sw
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.QueryChanged, payload => console.log('data', payload))
     *```
     */
  QueryChanged("queryChanged"), 
    /**
     * A drill-down operation has been performed.
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @returns additionalFilters - Any additional filters applied
     * @returns drillDownColumns - The columns on which drill down was performed
     * @returns nonFilteredColumns - The columns that were not filtered
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.DrillDown, {
     *    points: {
     *        clickedPoint,
     *        selectedPoints: selectedPoint
     *    },
     *    autoDrillDown: true,
     * })
     *```
     * In this example, `VizPointDoubleClick` event is used for
     * triggering the `DrillDown` event when an area or specific
     * data point on a table or chart is double-clicked.
     * @example
     *```js
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
     *```
     */
  Drilldown("drillDown"), 
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
  DataSourceSelected("dataSourceSelected"), 
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
  AddRemoveColumns("addRemoveColumns"), 
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
  CustomAction("customAction"), 
    /**
     * Listen to double click actions on a visualization.
     * @return ContextMenuInputPoints - Data point that is double-clicked
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     * @example
     * ```js
     * livebaordEmbed.on(EmbedEvent.VizPointDoubleClick, payload => {
     *      console.log('VizPointDoubleClick', payload);
     * })
     * ```
     */
  VizPointDoubleClick("vizPointDoubleClick"), 
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
  VizPointClick("vizPointClick"), 
    /**
     * An error has occurred. This event is fired for the following error types:
     *
     * `API` - API call failure error.
     * `FULLSCREEN` - Error when presenting a Liveboard or visualization in full screen
     * mode. `SINGLE_VALUE_FILTER` - Error due to multiple values in the single value
     * filter. `NON_EXIST_FILTER` - Error due to a non-existent filter.
     * `INVALID_DATE_VALUE` - Invalid date value error.
     * `INVALID_OPERATOR` - Use of invalid operator during filter application.
     *
     * For more information, see https://developers.thoughtspot.com/docs/events-app-integration#errorType
     * @returns error - An error object or message
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * // API error
     * SearchEmbed.on(EmbedEvent.Error, (error) => {
     *   console.log(error);
     *  // { type: "Error", data: { errorType: "API", error: { message: '...', error: '...' } } }
     * });
     * ```
     * @example
     * ```js
     * // Fullscreen error (Errors during presenting of a liveboard)
     * LiveboardEmbed.on(EmbedEvent.Error, (error) => {
     *   console.log(error);
     *   // { type: "Error", data: { errorType: "FULLSCREEN", error: {
     *   //   message: "Fullscreen API is not enabled",
     *   //   stack: "..."
     *   // } }}
     * })
     * ```
     */
  Error("Error"), 
    /**
     * The embedded object has sent an alert.
     * @returns alert - An alert object
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 8.4.1.sw
     * @example
     * ```js
     * searchEmbed.on(EmbedEvent.Alert)
     * ```
     */
  Alert("alert"), 
    /**
     * The ThoughtSpot authentication session has expired.
     * @version SDK: 1.4.0 | ThoughtSpot: ts7.sep.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.AuthExpire, showAuthExpired)
     * //show auth expired banner
     * function showAuthExpired() {
     *    document.getElementById("authExpiredBanner");
     * }
     *```
     */
  AuthExpire("ThoughtspotAuthExpired"), 
    /**
     * ThoughtSpot failed to validate the auth session.
     * @hidden
     */
  AuthFailure("ThoughtspotAuthFailure"), 
    /**
     * ThoughtSpot failed to re validate the auth session.
     * @hidden
     */
  IdleSessionTimeout("IdleSessionTimeout"), 
    /**
     * ThoughtSpot failed to validate the auth session.
     * @hidden
     */
  AuthLogout("ThoughtspotAuthLogout"), 
    /**
     * The height of the embedded Liveboard or visualization has been computed.
     * @returns data - The height of the embedded Liveboard or visualization
     * @hidden
     */
  EmbedHeight("EMBED_HEIGHT"), 
    /**
     * The center of visible iframe viewport is calculated.
     * @returns data - The center of the visible Iframe viewport.
     * @hidden
     */
  EmbedIframeCenter("EmbedIframeCenter"), 
    /**
     * Emitted when the **Get Data** action is initiated.
     * Applicable to `SearchBarEmbed` only.
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     * @example
     *```js
     * searchbarEmbed.on(EmbedEvent.GetDataClick)
     *  .then(data => {
     *  console.log('Answer Data:', data);
     * })
     *```
     */
  GetDataClick("getDataClick"), 
    /**
     * Detects the route change.
     * @version SDK: 1.7.0 | ThoughtSpot: 8.0.0.cl, 8.4.1.sw
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.RouteChange, payload =>
     *    console.log('data', payload))
     *```
     */
  RouteChange("ROUTE_CHANGE"), 
    /**
     * The v1 event type for Data
     * @hidden
     */
  V1Data("exportVizDataToParent"), 
    /**
     * Emitted when the embed does not have cookie access. This happens
     * when Safari and other Web browsers block third-party cookies
     * are blocked by default. `NoCookieAccess` can trigger.
     * @example
     *```js
     * appEmbed.on(EmbedEvent.NoCookieAccess)
     *```
     * @version SDK: 1.1.0 | ThoughtSpot: ts7.may.cl, 7.2.1.sw
     */
  NoCookieAccess("noCookieAccess"), 
    /**
     * Emitted when SAML is complete
     * @private
     * @hidden
     */
  SAMLComplete("samlComplete"), 
    /**
     * Emitted when any modal is opened in the app
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.DialogOpen, payload => {
     *    console.log('dialog open', payload);
     *  })
     *```
     */
  DialogOpen("dialog-open"), 
    /**
     * Emitted when any modal is closed in the app
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.DialogClose, payload => {
     *     console.log('dialog close', payload);
     * })
     *```
     */
  DialogClose("dialog-close"), 
    /**
     * Emitted when the Liveboard shell loads.
     * You can use this event as a hook to trigger
     * other events on the rendered Liveboard.
     * @version SDK: 1.9.1 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.LiveboardRendered, payload => {
           console.log('Liveboard is rendered', payload);
       })
     *```
     * The following example shows how to trigger
     * `SetVisibleVizs` event using LiveboardRendered embed event:
     * @example
     *```js
     * const embedRef = useEmbedRef();
     * const onLiveboardRendered = () => {
     * embed.trigger(HostEvent.SetVisibleVizs, ['viz1', 'viz2']);
     * };
     *```
     */
  LiveboardRendered("PinboardRendered"), 
    /**
     * Emits all events.
     * @Version SDK: 1.10.0 | ThoughtSpot: 8.2.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.ALL, payload => {
     *  console.log('Embed Events', payload)
     * })
     *```
     */
  ALL("*"), 
    /**
     * Emitted when an Answer is saved in the app
     * @Version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
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
     *```
     */
  Save("save"), 
    /**
     * Emitted when the download action is triggered on an Answer.
     *
     * **Note**: This event is deprecated in v1.21.0.
     * To fire an event when a download action is initiated on a chart or table,
     * use `EmbedEvent.DownloadAsPng`, `EmbedEvent.DownloadAsPDF`,
     * `EmbedEvent.DownloadAsCSV`, or `EmbedEvent.DownloadAsXLSX`
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Download, {
     * vizId: '730496d6-6903-4601-937e-2c691821af3c'
     * })
     *```
     */
  Download("download"), 
    /**
     * Emitted when the download action is triggered on an Answer.
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.0.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsPng, payload => {
     *   console.log('download PNG', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsPng, payload => {
     *   console.log('download PNG', payload)})
     *```
     */
  DownloadAsPng("downloadAsPng"), 
    /**
     * Emitted when the Download as PDF action is triggered on an Answer
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsPdf, payload => {
     *   console.log('download PDF', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsPdf, payload => {
     *   console.log('download PDF', payload)})
     *```
     */
  DownloadAsPdf("downloadAsPdf"), 
    /**
     * Emitted when the Download as CSV action is triggered on an Answer.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsCSV, payload => {
     *   console.log('download CSV', payload)}, {start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsCSV, payload => {
     *    console.log('download CSV', payload)})
     *```
     */
  DownloadAsCsv("downloadAsCsv"), 
    /**
     * Emitted when the Download as XLSX action is triggered on an Answer.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.DownloadAsXlsx, payload => {
     *   console.log('download Xlsx', payload)}, { start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.DownloadAsXlsx, payload => {
     *   console.log('download Xlsx', payload)})
     *```
     */
  DownloadAsXlsx("downloadAsXlsx"), 
    /**
     * Emitted when an Answer is deleted in the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * appEmbed.on(EmbedEvent.AnswerDelete, payload => {
     *    console.log('delete answer', payload)}, {start: true })
     * //trigger when action is completed
     * appEmbed.on(EmbedEvent.AnswerDelete, payload => {
     *    console.log('delete answer', payload)})
     *```
     */
  AnswerDelete("answerDelete"), 
    /**
     * Emitted when a user initiates the Pin action to
     *  add an Answer to a Liveboard.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
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
     *```
     */
  Pin("pin"), 
    /**
     * Emitted when SpotIQ analysis is triggered
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
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
     *```
     */
  SpotIQAnalyze("spotIQAnalyze"), 
    /**
     * Emitted when a user shares an object with another user or group
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
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
     *```
     */
  Share("share"), 
    /**
     * Emitted when a user clicks the **Include** action to include a specific value or
     * data on a chart or table.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.DrillInclude, payload => {
     *    console.log('Drill include', payload);
     * })
     *```
     */
  DrillInclude("context-menu-item-include"), 
    /**
     * Emitted when a user clicks the **Exclude** action to exclude a specific value or
     * data on a chart or table
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.DrillExclude, payload => {
     *     console.log('Drill exclude', payload);
     * })
     *```
     */
  DrillExclude("context-menu-item-exclude"), 
    /**
     * Emitted when a column value is copied in the embedded app.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * seachEmbed.on(EmbedEvent.CopyToClipboard, payload => {
     *    console.log('copy to clipboard', payload);
     * })
     *```
     */
  CopyToClipboard("context-menu-item-copy-to-clipboard"), 
    /**
     * Emitted when a user clicks the **Update TML** action on
     * embedded Liveboard.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.UpdateTML)
     * })
     *```
     */
  UpdateTML("updateTSL"), 
    /**
     * Emitted when a user clicks the **Edit TML** action
     * on an embedded Liveboard.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.EditTML, payload => {
     *    console.log('Edit TML', payload);
     * })
     *```
     */
  EditTML("editTSL"), 
    /**
     * Emitted when the **Export TML** action is triggered on an
     * an embedded object in the app
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * searchEmbed.on(EmbedEvent.ExportTML, payload => {
     *     console.log('Export TML', payload)}, { start: true })
     * //emit when action ends
     * searchEmbed.on(EmbedEvent.ExportTML, payload => {
     *     console.log('Export TML', payload)})
     *```
     */
  ExportTML("exportTSL"), 
    /**
     * Emitted when an Answer is saved as a View.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * appEmbed.on(EmbedEvent.SaveAsView, payload => {
     *    console.log('View', payload);
     * })
     *```
     */
  SaveAsView("saveAsView"), 
    /**
     * Emitted when the user creates a copy of an Answer.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * //emit when action starts
     * appEmbed.on(EmbedEvent.CopyAEdit, payload => {
     *    console.log('Copy and edit', payload)}, {start: true })
     * //emit when action ends
     * appEmbed.on(EmbedEvent.CopyAEdit, payload => {
     *    console.log('Copy and edit', payload)})
     *```
     */
  CopyAEdit("copyAEdit"), 
    /**
     * Emitted when a user clicks *Show underlying data* on an Answer.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.ShowUnderlyingData, payload => {
     *    console.log('show data', payload);
     * })
     *```
     */
  ShowUnderlyingData("showUnderlyingData"), 
    /**
     * Emitted when an Answer is switched to a chart or table view.
     * @version SDK: 1.11.0 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     * @example
     *```js
     * searchEmbed.on(EmbedEvent.AnswerChartSwitcher, payload => {
     *    console.log('switch view', payload);
     * })
     *```
     */
  AnswerChartSwitcher("answerChartSwitcher"), 
    /**
     * Internal event to communicate the initial settings back to the ThoughtSpot app
     * @hidden
     */
  APP_INIT("appInit"), 
    /**
     * Emitted when a user clicks **Show Liveboard details** on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.AnswerChartSwitcher, payload => {
     *    console.log('Liveboard details', payload);
     * })
     *```
     */
  LiveboardInfo("pinboardInfo"), 
    /**
     * Emitted when a user clicks on the Favorite icon on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.AddToFavorites, payload => {
     *    console.log('favorites', payload);
     * })
     *```
     */
  AddToFavorites("addToFavorites"), 
    /**
     * Emitted when a user clicks **Schedule** on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Schedule, payload => {
     *    console.log(`Liveboard schedule', payload);
     * })
     *```
     */
  Schedule("subscription"), 
    /**
     * Emitted when a user clicks **Edit** on a Liveboard or visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Edit, payload => {
     *    console.log(`Liveboard edit', payload);
     * })
     *```
     */
  Edit("edit"), 
    /**
     * Emitted when a user clicks *Make a copy* on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.MakeACopy, payload => {
     *    console.log(`Copy', payload);
     * })
     *```
     */
  MakeACopy("makeACopy"), 
    /**
     * Emitted when a user clicks **Present** on a Liveboard or visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Present)
     *```
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Present, {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * })
     *```
     */
  Present("present"), 
    /**
     * Emitted when a user clicks **Delete** on a visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Delete,
     *   {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
  Delete("delete"), 
    /**
     * Emitted when a user clicks Manage schedules on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.SchedulesList)
     *```
     */
  SchedulesList("schedule-list"), 
    /**
     * Emitted when a user clicks **Cancel** in edit mode on a Liveboard
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Cancel)
     *```
     */
  Cancel("cancel"), 
    /**
     * Emitted when a user clicks **Explore** on a visualization
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.Explore,  {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
  Explore("explore"), 
    /**
     * Emitted when a user clicks **Copy link** action on a visualization.
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.CopyLink, {
     *   vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
  CopyLink("embedDocument"), 
    /**
     * Emitted when a user interacts with cross filters on a
     * visualization or Liveboard.
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     *```js
     * liveboardEmbed.on(EmbedEvent.CrossFilterChanged, {
     *    vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     *```
     */
  CrossFilterChanged("cross-filter-changed"), 
    /**
     * Emitted when a user right clicks on a visualization (chart or table)
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.0.sw
     * @example
     *```js
     * LiveboardEmbed.on(EmbedEvent.VizPointRightClick, payload => {
     *    console.log('VizPointClick', payload)
     * })
     *```
     */
  VizPointRightClick("vizPointRightClick"), 
    /**
     * Emitted when a user clicks **Insert to slide** on a visualization
     * @hidden
     */
  InsertIntoSlide("insertInToSlide"), 
    /**
     * Emitted when a user changes any filter on a Liveboard.
     * Returns filter type and name, column name and ID, and runtime
     * filter details.
     * @example
     *
     *```js
     * LiveboardEmbed.on(EmbedEvent.FilterChanged, (payload) => {
     *    console.log('payload', payload);
     * })
     *
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl, 9.5.0.sw
     */
  FilterChanged("filterChanged"), 
    /**
     *  Emitted when a user clicks the **Go** button to initiate
     *  a Natural Language Search query
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  SageEmbedQuery("sageEmbedQuery"), 
    /**
     * Emitted when a user selects a data source on the embedded
     * Natural Language Search interface.
     *
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  SageWorksheetUpdated("sageWorksheetUpdated"), 
    /**
     * Emitted when a user updates a connection on the **Data** page
     * @version SDK : 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
  UpdateConnection("updateConnection"), 
    /**
     * Emitted when a user updates a connection on the **Data** page
     * @version SDK : 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
  CreateConnection("createConnection"), 
    /**
     * Emitted when name, status (private or public) or filter values of a
     * Personalised view is updated.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  UpdatePersonalisedView("updatePersonalisedView"), 
    /**
     * Emitted when a Personalised view is saved.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  SavePersonalisedView("savePersonalisedView"), 
    /**
     * Emitted when a Liveboard is reset.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  ResetLiveboard("resetLiveboard"), 
    /**
     * Emitted when a PersonalisedView is deleted.
     * @returns views: string[]
     * @returns liveboardId: string
     * @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  DeletePersonalisedView("deletePersonalisedView"), 
    /**
     * Emitted when a user creates a Worksheet.
     * @version SDK : 1.27.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
  CreateWorksheet("createWorksheet"), 
    /**
     * Emitted when the *Ask Sage* is initialized.
     * @returns viewName: string
     * @returns viewId: string
     * @returns liveboardId: string
     * @returns isPublic: boolean
     * @version SDK : 1.29.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
  AskSageInit("AskSageInit"), 
    /**
     * Emitted when a Liveboard or visualization is renamed.
     * @version SDK : 1.28.0 | ThoughtSpot: 9.10.5.cl, 10.1.0.sw
     */
  Rename("rename"), 
    /**
     *
     * This event can be emitted to intercept search execution initiated by
     * the users and implement the logic to allow or restrict search execution.
     * You can can also show custom error text if the search query must be
     * restricted due to your application or business requirements.

     * Prerequisite: Set `isOnBeforeGetVizDataInterceptEnabled` to `true`
     * for this embed event to get emitted.
     * @param: payload
     * @param: responder
     * Contains elements that lets developers define whether ThoughtSpot
     * should run the search, and if not, what error message
     * should be shown to the user.
     *
     * execute: When execute returns `true`, the search will be run.
     * When execute returns `false`, the search will not be executed.
     *
     * error: Developers can customize the error message text when `execute`
     * returns `false` using the error parameter in responder.
     * @version SDK : 1.29.0 | ThoughtSpot : 10.3.0.cl
     * @example
     *```js
     * .on(EmbedEvent.OnBeforeGetVizDataIntercept,
     * (payload, responder) => {
     *  responder({
     *      data: {
     *          execute:false,
     *          error: {
     *          //Provide a custom error message to explain to your end user
     *          //why their search did not run
     *          errorText: "This search query cannot be run.
     *          Please contact your administrator for more details."
     *          }
     *  }})
     * })
     * ```
     *
     *```js
     * .on(EmbedEvent.OnBeforeGetVizDataIntercept,
     * (payload, responder) => {
     * const query = payload.data.data.answer.search_query
     * responder({
     *  data: {
     *      // returns true as long as the query does not include
     *      // both the 'sales' AND the 'county' column
     *      execute: !(query.includes("sales")&&query.includes("county")),
     *      error: {
     *      //Provide a custom error message to explain to your end user
     *      // why their search did not run, and which searches are accepted by your custom logic.
     *      errorText: "You can't use this query :" + query + ".
     *      The 'sales' measures can never be used at the 'county' level.
     *      Please try another measure, or remove 'county' from your search."
     *      }
     *  }})
     * })
     *```
     */
  OnBeforeGetVizDataIntercept("onBeforeGetVizDataIntercept"), 
    /**
     * Emitted when parameter changes in an Answer
     * or Liveboard.
     * ```js
     * liveboardEmbed.on(EmbedEvent.ParameterChanged, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK : 1.29.0 | ThoughtSpot : 10.3.0.cl
     */
  ParameterChanged("parameterChanged"), 
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
     * Worksheet or Model, exercise caution when changing column
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
  TableVizRendered("TableVizRendered"), 
    /**
     * Emitted when the liveboard is created from pin modal or Liveboard list page.
     * You can use this event as a hook to trigger
     * other events on liveboard creation.
     *
     * ```js
     * liveboardEmbed.on(EmbedEvent.CreateLiveboard, (payload) => {
     *     console.log('payload', payload);
     * })
     *```
     * @version SDK : 1.37.0 | ThoughtSpot : 10.8.0.cl
     */
  CreateLiveboard("createLiveboard"), 
    /**
     * Emitted when a user creates a Model.
     * @version SDK : 1.37.0 | ThoughtSpot : 10.8.0.cl
     */
  CreateModel("createModel");

  final String value;
  const EmbedEvent(this.value);
}
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
 *   { columnName: 'state, operator: RuntimeFilterOp.EQ, values: ['california']}
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
 * @group Events
 */
@JsonEnum(valueField: 'value')
enum HostEvent {
    /**
     * Triggers a search operation with the search tokens specified in
     * the search query string.
     * Supported in `AppEmbed` and `SearchEmbed` deployments.
     * Includes the following properties:
     * @param - `searchQuery` - query string with search tokens
     * @param - `dataSources` - Data source GUID to Search on
     *                        - Although an array, only a single source
     *                          is supported.
     * @param - `execute` - executes search and updates the existing query
     * @example
     * ```js
     * searchembed.trigger(HostEvent.Search, {
         searchQuery: "[sales] by [item type]",
         dataSources: ["cd252e5c-b552-49a8-821d-3eadaa049cca"],
         execute: true
       });
     * ```
     */
  Search("search"), 
    /**
     * Triggers a drill on certain points of the specified column
     * Includes the following properties:
     * @param - points - an object containing selectedPoints/clickedPoints
     * to drill to. For example, { selectedPoints: []}
     * @param - columnGuid - Optional. GUID of the column to drill
     * by. If not provided it will auto drill by the configured
     *   column.
     * @param - autoDrillDown - Optional. If true, the drill down will be
     * done automatically on the most popular column.
     * @param - vizId [TS >= 9.8.0] - Optional. The GUID of the visualization to drill
     * in case of a Liveboard.
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
     * @version SDK: 1.5.0 | ThoughtSpot: ts7.oct.cl, 7.2.1
     */
  DrillDown("triggerDrillDown"), 
    /**
     * Apply filters
     * @hidden
     */
  Filter("filter"), 
    /**
     * Reload the Answer or visualization
     * @hidden
     */
  Reload("reload"), 
    /**
     * Get iframe URL for the current embed view on the playground.
     * Developers can use this URL to embed a ThoughtSpot object
     * in apps like Salesforce or Sharepoint.
     * @example
     * ```js
     * const url = embed.trigger(HostEvent.GetIframeUrl);
     * console.log("iFrameURL",url);
     * ```
     * @version SDK: 1.35.0 | ThoughtSpot: 10.4.0.cl
     */
  GetIframeUrl("GetIframeUrl"), 
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
     * @version SDK: 1.6.0 | ThoughtSpot: ts8.nov.cl, 8.4.1.sw
     */
  SetVisibleVizs("SetPinboardVisibleVizs"), 
    /**
     * Set a Liveboard tab as an active tab.
     * @param - tabId - string of id of Tab to show
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.SetActiveTab,{
     *  tabId:'730496d6-6903-4601-937e-2c691821af3c'
     * })
     * ```
     * @version SDK: 1.24.0 | ThoughtSpot: 9.5.0.cl, 9.5.1-sw
     */
  SetActiveTab("SetActiveTab"), 
    /**
     * Updates the runtime filters applied on a Liveboard. The filter
     * attributes passed with this event are appended to the existing runtime
     * filters applied on a Liveboard.
     *
     * **Note**: `HostEvent.UpdateRuntimeFilters` is supported in `LiveboardEmbed`
     * and `AppEmbed` only. In full application embedding, this event updates
     * the runtime filters applied on the Liveboard and saved Answer objects.
     *
     * @param - Pass an array of {@link RuntimeFilter} with the following attributes:
     * `columnName` - _String_. The name of the column to filter on.
     *
     * `operator` - {@link RuntimeFilterOp} to apply. For more information,
     * see link:https://developers.thoughtspot.com/docs/?pageid=runtime-filters#rtOperator[Developer Documentation].
     *
     * `values` - List of operands. Some operators such as EQ and LE allow a
     * single value, whereas BW and IN accept multiple values.
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
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     * @important
     */
  UpdateRuntimeFilters("UpdateRuntimeFilters"), 
    /**
     * Navigate to a specific page in the embedded ThoughtSpot application.
     * This is the same as calling `appEmbed.navigateToPage(path, true)`.
     * @param - `path` - the path to navigate to to go forward or back. The path value can
     * be a number; for example, `1`, `-1`.
     * @example
     * ```js
     * appEmbed.navigateToPage(-1)
     * ```
     * @version SDK: 1.12.0 | ThoughtSpot 8.4.0.cl, 8.4.1.sw
     */
  Navigate("Navigate"), 
    /**
     * Open the filter panel for a particular column.
     * Works with Search and Liveboard embed.
     * @param - { columnId: string,
     *  name: string,
     *  type: INT64/CHAR/DATE,
     *  dataType: ATTRIBUTE/MEASURE }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.OpenFilter,
     *  {column: { columnId: '<column-GUID>', name: 'column name', type: 'INT64', dataType: 'ATTRIBUTE'}})
     * ```
     * @example
     * ```js
     * LiveboardEmbed.trigger(HostEvent.OpenFilter,
     *   { column: {columnId: '<column-GUID>'}})
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
  OpenFilter("openFilter"), 
    /**
     * Add columns to the current search query.
     * @param - { columnIds: string[] }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.AddColumns, { columnIds: ['<column-GUID>','<column-GUID>'] })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
  AddColumns("addColumns"), 
    /**
     * Remove a column from the current search query.
     * @param - { columnId: string }
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.RemoveColumn, { columnId: '<column-Guid>' })
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl
     */
  RemoveColumn("removeColumn"), 
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
  getExportRequestForCurrentPinboard("getExportRequestForCurrentPinboard"), 
    /**
     * Trigger **Pin** action on an embedded object.
     * If no parameters are defined, the pin action is triggered
     * for the Answer that the user is currently on
     * and a modal opens for Liveboard selection.
     * To add an Answer or visualization to a Liveboard programmatically without
     * showing requiring additional user input via *Pin to Liveboard* modal, define
     * the following parameters:
     *
     * @param
     * `vizId`-  GUID of the saved Answer or visualization to pin to a Liveboard.
     *  Optional when pinning a new chart or table generated from a Search query.
     * @param
     * `liveboardID` - GUID of the Liveboard to pin an Answer. If there is no Liveboard,
     *  specify the `newLiveboardName` parameter to create a new Liveboard.
     * @param
     * `tabId` - GUID of the Liveboard tab. Adds the Answer to the Liveboard tab
     *  specified in the code.
     * @param
     * `newVizName` - Name string for the Answer or visualization. If defined,
     *  this parameter adds a new visualization object or creates a copy of the
     *  Answer or visualization specified in `vizId`.
     *  Required attribute.
     * @param
     * `newLiveboardName` - Name string for the Liveboard.
     *  Creates a new Liveboard object with the specified name.
     * @param
     * `newTabName` - Name of the tab. Adds a new tab Liveboard specified
     *  in the code.
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
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  Pin("pin"), 
    /**
     * Trigger the **Show Liveboard details** action
     * on an embedded Liveboard.
     * @example
     *```js
     * liveboardEmbed.trigger(HostEvent.LiveboardInfo)
     *```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  LiveboardInfo("pinboardInfo"), 
    /**
     * Trigger the **Schedule** action on an embedded Liveboard.
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.Schedule)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  Schedule("subscription"), 
    /**
     * Trigger the **Manage schedule** action on an embedded Liveboard
     * @example
     * ```js
     *  liveboardEmbed.trigger(HostEvent.ScheduleList)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  SchedulesList("schedule-list"), 
    /**
     * Trigger the **Export TML** action on an embedded Liveboard or
     * Answer.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ExportTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  ExportTML("exportTSL"), 
    /**
     * Trigger the **Edit TML** action on an embedded Liveboard or
     * saved Answers in the full application embedding.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.EditTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  EditTML("editTSL"), 
    /**
     * Trigger the **Update TML** action on an embedded Liveboard.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateTML)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  UpdateTML("updateTSL"), 
    /**
     * Trigger the **Download PDF** action on an embedded Liveboard,
     * visualization or Answer.
     *
     * **NOTE**: The **Download** > **PDF** action is available on
     * visualizations and Answers if the data is in tabular format.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.DownloadAsPdf)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  DownloadAsPdf("downloadAsPdf"), 
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
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  MakeACopy("makeACopy"), 
    /**
     * Trigger the **Delete** action for a Liveboard.
     * @example
     * ```js
     * appEmbed.trigger(HostEvent.Remove)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     * * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Remove)
     * ```
     * @version SDK: 1.37.0 | ThoughtSpot: 10.8.0.cl, 10.10.0.sw
     */
  Remove("delete"), 
    /**
     * Trigger the **Explore** action on a visualization.
     * @param - an object with `vizId` as a key
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Explore, {vizId: '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  Explore("explore"), 
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
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  CreateMonitor("createMonitor"), 
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
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  ManageMonitor("manageMonitor"), 
    /**
     * Trigger the **Edit** action on a Liveboard or a visualization
     * on a Liveboard.
     *
     * This event is not supported in visualization embed and search embed.
     * @param - object - To trigger the action for a specific visualization
     * in Liveboard embed, pass in `vizId` as a key.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit)
     * ```
     * ```js
     * liveboardEmbed.trigger(HostEvent.Edit, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  Edit("edit"), 
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
     * vizEmbed.trigger((HostEvent.CopyLink)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  CopyLink("embedDocument"), 
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
     * vizEmbed.trigger((HostEvent.Present)
     * ```
     * @version SDK: 1.15.0 | ThoughtSpot: 8.7.0.cl, 8.8.1.sw
     */
  Present("present"), 
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
     * @version SDK: 1.18.0 | ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     * @important
     */
  GetTML("getTML"), 
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  ShowUnderlyingData("showUnderlyingData"), 
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  Delete("onDeleteAnswer"), 
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  SpotIQAnalyze("spotIQAnalyze"), 
    /**
     * Trigger the **Download** action on charts in
     * the embedded view.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Download, {vizId:
     * '730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * ```js
     * embed.trigger(HostEvent.Download)
     * ```
     * @deprecated from SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl ,9.4.1.sw
     * Use {@link DownloadAsPng}
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  Download("downloadAsPng"), 
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
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.4.1.sw
     */
  DownloadAsPng("downloadAsPng"), 
    /**
     * Trigger the **Download** > **CSV**  action on tables in
     * the embedded view.
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  DownloadAsCsv("downloadAsCSV"), 
    /**
     * Trigger the **Download** > **XLSX**  action on tables
     * in the embedded view.
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  DownloadAsXlsx("downloadAsXLSX"), 
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  Share("share"), 
    /**
     * Trigger the **Save**  action on a Liveboard or Answer.
     * Saves the changes.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.Save)
     * ```
     * ```js
     * searchEmbed.trigger(HostEvent.Save)
     * ```
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  Save("save"), 
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  SyncToSheets("sync-to-sheets"), 
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  SyncToOtherApps("sync-to-other-apps"), 
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
     * @version SDK: 1.19.0 | ThoughtSpot: 9.0.0.cl, 9.0.1.sw
     */
  ManagePipelines("manage-pipeline"), 
    /**
     * Reset search operation on the Search or Answer page.
     * @example
     * ```js
     * searchEmbed.trigger(HostEvent.ResetSearch)
     * ```
     * ```js
     * appEmbed.trigger(HostEvent.ResetSearch)
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.0.1.sw
     */
  ResetSearch("resetSearch"), 
    /**
     * Get details of filters applied on the Liveboard.
     * Returns arrays containing Liveboard filter and runtime filter elements.
     * @example
     * ```js
     * const data = await liveboardEmbed.trigger(HostEvent.GetFilters);
     *     console.log('data', data);
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
  GetFilters("getFilters"), 
    /**
     * Update one or several filters applied on a Liveboard.
     * @param - `filter`: a single filter object containing column name,
     * filter operator, and values.
     * @param - `filters`: multiple filter objects with column name, filter operator,
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
     *      types: "EXACT_DATE"
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
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl
     */
  UpdateFilters("updateFilters"), 
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
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl
     */
  GetTabs("getTabs"), 
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
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  SetVisibleTabs("SetPinboardVisibleTabs"), 
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
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  SetHiddenTabs("SetPinboardHiddenTabs"), 
    /**
     * Updates the search query string for Natural Language Search operations.
     * @param - `queryString`: Text string in Natural Language format
     * @param - `executeSearch`: Boolean to execute search and update search query
     * @example
     * ```js
     * sageEmbed.trigger(HostEvent.UpdateSageQuery, {
     *  queryString: 'revenue per year',
     *  executeSearch: true,
     * })
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.8.0.cl, 9.8.0.sw
     */
  UpdateSageQuery("updateSageQuery"), 
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
  GetAnswerSession("getAnswerSession"), 
    /**
     * Trigger the *Ask Sage* action for visualizations
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.AskSage,
     * {vizId:'730496d6-6903-4601-937e-2c691821af3c'})
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 9.12.0.cl
     */
  AskSage("AskSage"), 
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
  UpdateCrossFilter("UpdateCrossFilter"), 
    /**
     * Trigger reset action for a personalized Liveboard view.
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.ResetLiveboardPersonalisedView);
     * ```
     * @version SDK: 1.29.0 | ThoughtSpot Cloud: 10.1.0.cl, 10.1.0.sw
     */
  ResetLiveboardPersonalisedView("ResetLiveboardPersonalisedView"), 
    /**
     * Triggers an action to update Parameter values on embedded
     * Answers and Liveboard.
     *
     * @example
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdateParameters, [{
     * name: "Color",
     * value: "almond"
     * }])
     *
     * @version SDK: 1.29.0 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
  UpdateParameters("UpdateParameters"), 
    /**
     * Triggers GetParameters to fetch the runtime Parameters.
     * ```js
     * liveboardEmbed.trigger(HostEvent.GetParameters).then((parameter) => {
     *  console.log('parameters', parameter);
     * });
     *```
     * @version SDK: 1.29.0 | ThoughtSpot: 10.1.0.cl, 10.1.0.sw
     */
  GetParameters("GetParameters"), 
    /**
     * Triggers an event to update a personalized view of a Liveboard.
     * ```js
     * liveboardEmbed.trigger(HostEvent.UpdatePersonalisedView, {viewId: '1234'})
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
  UpdatePersonalisedView("UpdatePersonalisedView"), 
    /**
     * @hidden
     * Notify when info call is completed successfully
     * ```js
     * liveboardEmbed.trigger(HostEvent.InfoSuccess, data);
     *```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
  InfoSuccess("InfoSuccess"), 
    /**
     * Trigger the save action for an Answer.
     * To programmatically save an answer without opening the
     * *Describe your Answer* modal, define the `name` and `description`
     * properties.
     * If no parameters are specified, the save action is
     * triggered with a modal to prompt users to
     * add a name and description for the Answer.
     * @param - optional attributes to set Answer properties.
     *  `name` - Name string for the Answer.
     *  `description` - Description text for the Answer.
     *
     * @example
     * ```js
     * const saveAnswerResponse = await searchEmbed.trigger(HostEvent.SaveAnswer, {
     *      name: "Sales by states",
     *      description: "Total sales by states in MidWest"
     *   });
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
  SaveAnswer("saveAnswer"), 
    /**
     * EmbedApi
     * @hidden
     */
  UIPassthrough("UiPassthrough"), 
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
  TransformTableVizData("TransformTableVizData");

  final String value;
  const HostEvent(this.value);
}
/**
 * The different visual modes that the data sources panel within
 * search could appear in, such as hidden, collapsed, or expanded.
 */
@JsonEnum(valueField: 'value')
enum DataSourceVisualMode {
    /**
     * The data source panel is hidden.
     */
  Hidden("hide"), 
    /**
     * The data source panel is collapsed, but the user can manually expand it.
     */
  Collapsed("collapse"), 
    /**
     * The data source panel is expanded, but the user can manually collapse it.
     */
  Expanded("expand");

  final String value;
  const DataSourceVisualMode(this.value);
}
/**
 * The query params passed down to the embedded ThoughtSpot app
 * containing configuration and/or visual information.
 */
@JsonEnum(valueField: 'value')
enum Param {
  EmbedApp("embedApp"), 
  DataSources("dataSources"), 
  DataSourceMode("dataSourceMode"), 
  DisableActions("disableAction"), 
  DisableActionReason("disableHint"), 
  ForceTable("forceTable"), 
  preventLiveboardFilterRemoval("preventPinboardFilterRemoval"), 
  SearchQuery("searchQuery"), 
  HideActions("hideAction"), 
  HideObjects("hideObjects"), 
  HostAppUrl("hostAppUrl"), 
  EnableVizTransformations("enableVizTransform"), 
  EnableSearchAssist("enableSearchAssist"), 
  EnablePendoHelp("enablePendoHelp"), 
  HideResult("hideResult"), 
  UseLastSelectedDataSource("useLastSelectedSources"), 
  Tag("tag"), 
  AutoLogin("autoLogin"), 
  searchTokenString("searchTokenString"), 
  executeSearch("executeSearch"), 
  fullHeight("isFullHeightPinboard"), 
  livedBoardEmbed("isLiveboardEmbed"), 
  searchEmbed("isSearchEmbed"), 
  vizEmbed("isVizEmbed"), 
  StringIDsUrl("overrideStringIDsUrl"), 
  Version("sdkVersion"), 
  ViewPortHeight("viewPortHeight"), 
  ViewPortWidth("viewPortWidth"), 
  VisibleActions("visibleAction"), 
  DisableLoginRedirect("disableLoginRedirect"), 
  visibleVizs("pinboardVisibleVizs"), 
  LiveboardV2Enabled("isPinboardV2Enabled"), 
  DataPanelV2Enabled("enableDataPanelV2"), 
  ShowAlerts("showAlerts"), 
  Locale("locale"), 
  CustomStyle("customStyle"), 
  ForceSAMLAutoRedirect("forceSAMLAutoRedirect"), 
  AuthType("authType"), 
  IconSpriteUrl("iconSprite"), 
  cookieless("cookieless"), 
  ContextMenuTrigger("contextMenuEnabledOnWhichClick"), 
  LinkOverride("linkOverride"), 
  blockNonEmbedFullAppAccess("blockNonEmbedFullAppAccess"), 
  ShowInsertToSlide("insertInToSlide"), 
  PrimaryNavHidden("primaryNavHidden"), 
  HideProfleAndHelp("profileAndHelpInNavBarHidden"), 
  NavigationVersion("navigationVersion"), 
  HideHamburger("hideHamburger"), 
  HideObjectSearch("hideObjectSearch"), 
  HideNotification("hideNotification"), 
  HideApplicationSwitcher("applicationSwitcherHidden"), 
  HideOrgSwitcher("orgSwitcherHidden"), 
  IsSageEmbed("isSageEmbed"), 
  HideWorksheetSelector("hideWorksheetSelector"), 
  DisableWorksheetChange("disableWorksheetChange"), 
  HideSourceSelection("hideSourceSelection"), 
  DisableSourceSelection("disableSourceSelection"), 
  HideEurekaResults("hideEurekaResults"), 
  HideEurekaSuggestions("hideEurekaSuggestions"), 
  HideAutocompleteSuggestions("hideAutocompleteSuggestions"), 
  HideLiveboardHeader("hideLiveboardHeader"), 
  ShowLiveboardDescription("showLiveboardDescription"), 
  ShowLiveboardTitle("showLiveboardTitle"), 
  HiddenTabs("hideTabs"), 
  VisibleTabs("visibleTabs"), 
  HideTabPanel("hideTabPanel"), 
  HideSampleQuestions("hideSampleQuestions"), 
  WorksheetId("worksheet"), 
  Query("query"), 
  HideHomepageLeftNav("hideHomepageLeftNav"), 
  ModularHomeExperienceEnabled("modularHomeExperience"), 
  PendoTrackingKey("additionalPendoKey"), 
  LiveboardHeaderSticky("isLiveboardHeaderSticky"), 
  IsProductTour("isProductTour"), 
  HideSearchBarTitle("hideSearchBarTitle"), 
  HideSageAnswerHeader("hideSageAnswerHeader"), 
  HideSearchBar("hideSearchBar"), 
  ClientLogLevel("clientLogLevel"), 
  ExposeTranslationIDs("exposeTranslationIDs"), 
  OverrideNativeConsole("overrideConsoleLogs"), 
  enableAskSage("enableAskSage"), 
  CollapseSearchBarInitially("collapseSearchBarInitially"), 
  DataPanelCustomGroupsAccordionInitialState("dataPanelCustomGroupsAccordionInitialState"), 
  EnableCustomColumnGroups("enableCustomColumnGroups"), 
  DateFormatLocale("dateFormatLocale"), 
  NumberFormatLocale("numberFormatLocale"), 
  CurrencyFormat("currencyFormat"), 
  Enable2ColumnLayout("enable2ColumnLayout"), 
  IsFullAppEmbed("isFullAppEmbed"), 
  IsOnBeforeGetVizDataInterceptEnabled("isOnBeforeGetVizDataInterceptEnabled"), 
  FocusSearchBarOnRender("focusSearchBarOnRender"), 
  DisableRedirectionLinksInNewTab("disableRedirectionLinksInNewTab"), 
  HomePageSearchBarMode("homePageSearchBarMode"), 
  ShowLiveboardVerifiedBadge("showLiveboardVerifiedBadge"), 
  ShowLiveboardReverifyBanner("showLiveboardReverifyBanner"), 
  LiveboardHeaderV2("isLiveboardHeaderV2Enabled"), 
  HideIrrelevantFiltersInTab("hideIrrelevantFiltersAtTabLevel"), 
  SpotterEnabled("isSpotterExperienceEnabled"), 
  IsUnifiedSearchExperienceEnabled("isUnifiedSearchExperienceEnabled"), 
  OverrideOrgId("orgId"), 
  OauthPollingInterval("oAuthPollingInterval"), 
  IsForceRedirect("isForceRedirect"), 
  DataSourceId("dataSourceId"), 
  preAuthCache("preAuthCache"), 
  ShowSpotterLimitations("showSpotterLimitations"), 
  CoverAndFilterOptionInPDF("coverAndFilterOptionInPDF"), 
  PrimaryAction("primaryAction");

  final String value;
  const Param(this.value);
}
/**
 * ThoughtSpot application pages include actions and menu commands
 * for various user-initiated operations. These actions are represented
 * as enumeration members in the SDK. To show, hide, or disable
 * specific actions in the embedded view, define the Action
 * enumeration members in the `disabledActions`, `visibleActions`,
 * or `hiddenActions` array.
 * @example
 * ```js
 * const embed = new LiveboardEmbed('#embed-container', {
 *    ... // other options
 *    visibleActions: [Action.Save, Action.Edit, Action.Present, ActionAction.Explore],
 *    disabledActions: [Action.Download],
 *    //hiddenActions: [], // Set either this or visibleActions
 * })
 * ```
 * @example
 * ```js
 * const embed = new LiveboardEmbed('#embed-container', {
 *    ... // other options
 *    //visibleActions: [],
 *    disabledActions: [Action.Download],
 *    hiddenActions: [Action.Edit, ActionAction.Explore],
 * })
 * ```
 */
@JsonEnum(valueField: 'value')
enum Action {
    /**
     * The **Save** action on an Answer or Liveboard.
     * Allows users to save the changes.
     * @example
     * ```js
     * disabledActions: [Action.Save]
     * ```
     */
  Save("save"), 
    /**
     * @hidden
     */
  Update("update"), 
    /**
     * @hidden
     */
  SaveUntitled("saveUntitled"), 
    /**
     * The **Save as View** action on the Answer
     * page. Saves an Answer as a View object in the full
     * application embedding mode.
     * @example
     * ```js
     * disabledActions: [Action.SaveAsView]
     * ```
     */
  SaveAsView("saveAsView"), 
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
  MakeACopy("makeACopy"), 
    /**
     * The **Copy and Edit** action on a Liveboard.
     * This action is now replaced with `Action.MakeACopy`.
     * @example
     * ```js
     * disabledActions: [Action.EditACopy]
     * ```
     */
  EditACopy("editACopy"), 
    /**
     * The **Copy link** menu action on a Liveboard visualization.
     * Copies the visualization URL
     * @example
     * ```js
     * disabledActions: [Action.CopyLink]
     * ```
     */
  CopyLink("embedDocument"), 
    /**
     * @hidden
     */
  ResetLayout("resetLayout"), 
    /**
     * The **Schedule** menu action on a Liveboard.
     * Allows scheduling a Liveboard job, for example,
     * sending periodic notifications.
     * @example
     * ```js
     * disabledActions: [Action.Schedule]
     * ```
     */
  Schedule("subscription"), 
    /**
     * The **Manage schedules** menu action on a Liveboard.
     * Allows users to manage scheduled Liveboard jobs.
     * @example
     * ```js
     * disabledActions: [Action.SchedulesList]
     * ```
     */
  SchedulesList("schedule-list"), 
    /**
     * The **Share** action on a Liveboard, Answer, or Worksheet.
     * Allows users to share an object with other users and groups.
     * @example
     * ```js
     * disabledActions: [Action.Share]
     * ```
     */
  Share("share"), 
    /**
     * The **Add filter** action on a Liveboard page.
     * Allows adding filters to visualizations on a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.AddFilter]
     * ```
     */
  AddFilter("addFilter"), 
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
  AddDataPanelObjects("addDataPanelObjects"), 
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
  ConfigureFilter("configureFilter"), 
    /**
    * The **Collapse data sources** icon on the Search page.
    * Collapses the panel showing data sources.
    *
    * @example
    * ```js
    * disabledActions: [Action.CollapseDataPanel]
    * ```
    * @version: SDK: 1.1.0 | ThoughtSpot Cloud: ts7.may.cl, 8.4.1.sw
    */
  CollapseDataSources("collapseDataSources"), 
    /**
    * The **Collapse data panel** icon on the Search page.
    * Collapses the data panel view.
    *
    * @version: SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
    *
    * @example
    * ```js
    * disabledActions: [Action.CollapseDataPanel]
    * ```
    */
  CollapseDataPanel("collapseDataPanel"), 
    /**
     * The **Choose sources** button on Search page.
     * Allows selecting data sources for search queries.
     * @example
     * ```js
     * disabledActions: [Action.ChooseDataSources]
     * ```
     */
  ChooseDataSources("chooseDataSources"), 
    /**
     * The **Create formula** action on a Search or Answer page.
     * Allows adding formulas to an Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddFormula]
     * ```
     */
  AddFormula("addFormula"), 
    /**
     * The **Add parameter** action on a Liveboard or Answer.
     * Allows adding Parameters to a Liveboard or Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddParameter]
     * ```
     */
  AddParameter("addParameter"), 
    /**
     * The **Add Column Set** action on a Answer.
     * Allows adding column sets to a Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddColumnSet]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
     */
  AddColumnSet("addSimpleCohort"), 
    /**
     * The **Add Query Set** action on a Answer.
     * Allows adding query sets to a Answer.
     * @example
     * ```js
     * disabledActions: [Action.AddQuerySet]
     * ```
     * @version SDK: 1.32.0 | ThoughtSpot: 10.0.0.cl, 10.1.0.sw
     */
  AddQuerySet("addAdvancedCohort"), 
    /**
     * @hidden
     */
  SearchOnTop("searchOnTop"), 
    /**
     * The **SpotIQ analyze** menu action on a visualization or
     * Answer page.
     * @example
     * ```js
     * disabledActions: [Action.SpotIQAnalyze]
     * ```
     */
  SpotIQAnalyze("spotIQAnalyze"), 
    /**
     * @hidden
     */
  ExplainInsight("explainInsight"), 
    /**
     * @hidden
     */
  SpotIQFollow("spotIQFollow"), 
    /**
     * The Share action for a Liveboard visualization.
     */
  ShareViz("shareViz"), 
    /**
     * @hidden
     */
  ReplaySearch("replaySearch"), 
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
  ShowUnderlyingData("showUnderlyingData"), 
    /**
     * The **Download** menu action on Liveboard
     * visualizations and Answers.
     * Allows downloading a visualization or Answer.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPng]
     * ```
     */
  Download("download"), 
    /**
     * The **Download** > **PNG** menu action for charts on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer as a PNG file.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsPng]
     * ```
     */
  DownloadAsPng("downloadAsPng"), 
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
  DownloadAsPdf("downloadAsPdf"), 
    /**
     * The **Download** > **CSV** menu action for tables on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer in the XLSX format.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsCsv]
     * ```
     */
  DownloadAsCsv("downloadAsCSV"), 
    /**
     * The **Download** > **XLSX** menu action for tables on a Liveboard
     * or Answer page.
     * Downloads a visualization or Answer in the XLSX format.
     * @example
     * ```js
     * disabledActions: [Action.DownloadAsXlsx]
     * ```
     */
  DownloadAsXlsx("downloadAsXLSX"), 
    /**
     * @hidden
     */
  DownloadTrace("downloadTrace"), 
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
  ExportTML("exportTSL"), 
    /**
     * The **Import TML** menu action on the
     * *Data Workspace* > *Utilities* page.
     * Imports TML representation of ThoughtSpot objects.
     * @example
     * ```js
     * disabledActions: [Action.ImportTML]
     * ```
     */
  ImportTML("importTSL"), 
    /**
     * The **Update TML** menu action for Liveboards and Answers.
     * Updates TML representation of ThoughtSpot objects.
     * @example
     * ```js
     * disabledActions: [Action.UpdateTML]
     * ```
     */
  UpdateTML("updateTSL"), 
    /**
     * The **Edit TML** menu action for Liveboards and Answers.
     * Opens the TML editor.
     * @example
     * ```js
     * disabledActions: [Action.EditTML]
     * ```
     */
  EditTML("editTSL"), 
    /**
     * The **Present** menu action for Liveboards and Answers.
     * Allows presenting a Liveboard or visualization in
     * slideshow mode.
     * @example
     * ```js
     * disabledActions: [Action.Present]
     * ```
     */
  Present("present"), 
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
  ToggleSize("toggleSize"), 
    /**
     * The *Edit* action on the Liveboard page and in the
     * visualization menu.
     * Opens a Liveboard or visualization in edit mode.
     * @example
     * ```js
     * disabledActions: [Action.Edit]
     * ```
     */
  Edit("edit"), 
    /**
     * The text edit option for Liveboard and visualization titles.
     * @example
     * ```js
     * disabledActions: [Action.EditTitle]
     * ```
     */
  EditTitle("editTitle"), 
    /**
     * The **Delete** action on a Liveboard, *Liveboards* and
     * *Answers* list pages in full application embedding.
     *
     * @example
     * ```js
     * disabledActions: [Action.Remove]
     * ```
     */
  Remove("delete"), 
    /**
     * @hidden
     */
  Ungroup("ungroup"), 
    /**
     * @hidden
     */
  Describe("describe"), 
    /**
     * @hidden
     */
  Relate("relate"), 
    /**
     * @hidden
     */
  CustomizeHeadlines("customizeHeadlines"), 
    /**
     * @hidden
     */
  PinboardInfo("pinboardInfo"), 
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
  LiveboardInfo("pinboardInfo"), 
    /**
     * @hidden
     */
  SendAnswerFeedback("sendFeedback"), 
    /**
     * @hidden
     */
  DownloadEmbraceQueries("downloadEmbraceQueries"), 
    /**
     * The **Pin** menu action on an Answer or
     * Search results page.
     * @example
     * ```js
     * disabledActions: [Action.Pin]
     * ```
     */
  Pin("pin"), 
    /**
     * @hidden
     */
  AnalysisInfo("analysisInfo"), 
    /**
     * The **Schedule** menu action on a Liveboard.
     * Allows scheduling a Liveboard job.
     * @example
     * ```js
     * disabledActions: [Action.Subscription]
     * ```
     */
  Subscription("subscription"), 
    /**
     * The **Explore** action on Liveboard visualizations
     * @example
     * ```js
     * disabledActions: [Action.Explore]
     * ```
     */
  Explore("explore"), 
    /**
     * The contextual menu action to include a specific data point
     * when drilling down a table or chart on an Answer.
     *
     * @example
     * ```js
     * disabledActions: [Action.DrillInclude]
     * ```
     */
  DrillInclude("context-menu-item-include"), 
    /**
     * The contextual menu action to exclude a specific data point
     * when drilling down a table or chart on an Answer.
     * @example
     * ```js
     * disabledActions: [Action.DrillInclude]
     * ```
     */
  DrillExclude("context-menu-item-exclude"), 
    /**
     * The **Copy to clipboard** menu action on tables in an Answer
     * or Liveboard.
     * Copies the selected data point.
     * @example
     * ```js
     * disabledActions: [Action.CopyToClipboard]
     * ```
     */
  CopyToClipboard("context-menu-item-copy-to-clipboard"), 
  CopyAndEdit("context-menu-item-copy-and-edit"), 
    /**
     * @hidden
     */
  DrillEdit("context-menu-item-edit"), 
  EditMeasure("context-menu-item-edit-measure"), 
  Separator("context-menu-item-separator"), 
    /**
     * The **Drill down** menu action on Answers and Liveboard
     * visualizations.
     * Allows drilling down to a specific data point on a chart or table.
     * @example
     * ```js
     * disabledActions: [Action.DrillDown]
     * ```
     */
  DrillDown("DRILL"), 
    /**
     * The request access action on Liveboards.
     * Allows users with view permissions to request edit access to a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.RequestAccess]
     * ```
     */
  RequestAccess("requestAccess"), 
    /**
     * The **Query visualizer** and **Query SQL** buttons in
     * Query details panel of the Answer page.
     *
     * **Query visualizer** - Displays the tables
     * and filters used in a search query.
     * **Query SQL** - Displays the SQL statements used
     * in a search query to fetch data.
     * @example
     * ```js
     * disabledActions: [Action.QueryDetailsButtons]
     * ```
     */
  QueryDetailsButtons("queryDetailsButtons"), 
    /**
     * The **Delete** action for Answers in the full application
     * embedding mode.
     * @example
     * ```js
     * disabledActions: [Action.AnswerDelete]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
  AnswerDelete("onDeleteAnswer"), 
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
  AnswerChartSwitcher("answerChartSwitcher"), 
    /**
     * The Favorites icon (*) for Answers,
     * Liveboard, and data objects like Worksheet, Model,
     * Tables and Views.
     * Allows adding an object to the user’s favorites list.
     * @example
     * ```js
     * disabledActions: [Action.AddToFavorites]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
  AddToFavorites("addToFavorites"), 
    /**
     * The edit icon on Liveboards (Classic experience).
     * @example
     * ```js
     * disabledActions: [Action.EditDetails]
     * ```
     * @version SDK: 1.9.0 | ThoughtSpot: 8.1.0.cl, 8.4.1.sw
     */
  EditDetails("editDetails"), 
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
  CreateMonitor("createMonitor"), 
    /**
     * @deprecated
     * Reports errors
     * @example
     * ```js
     * disabledActions: [Action.ReportError]
     * ```
     * @version SDK: 1.11.1 | ThoughtSpot: 8.3.0.cl, 8.4.1.sw
     */
  ReportError("reportError"), 
    /**
     * The **Sync to sheets** action on Answers and Liveboard visualizations.
     * Allows sending data to a Google Sheet.
     * @example
     * ```js
     * disabledActions: [Action.SyncToSheets]
     * ```
     * @version SDK: 1.18.0| ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
  SyncToSheets("sync-to-sheets"), 
    /**
     * The **Sync to other apps** action on Answers and Liveboard visualizations.
     * Allows sending data to third-party apps like Slack, Salesforce,
     * Microsoft Teams, and so on.
     * @example
     * ```js
     * disabledActions: [Action.SyncToOtherApps]
     * ```
     * @version SDK: 1.18.0| ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
  SyncToOtherApps("sync-to-other-apps"), 
    /**
     * The **Manage pipelines** action on Answers and Liveboard visualizations.
     * Allows users to manage data sync pipelines to third-party apps.
     * @example
     * ```js
     * disabledActions: [Action.ManagePipelines]
     * ```
     * @version SDK: 1.18.0| ThoughtSpot: 8.10.0.cl, 9.0.1.sw
     */
  ManagePipelines("manage-pipeline"), 
    /**
     * The **Filter** action on Liveboard visualizations.
     * Allows users to apply cross-filters on a Liveboard.
     * @example
     * ```js
     * disabledActions: [Action.CrossFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.8.0.sw
     */
  CrossFilter("context-menu-item-cross-filter"), 
    /**
     * The **Sync to Slack** action on Liveboard visualizations.
     * Allows sending data to third-party apps Slack
     * @example
     * ```js
     * disabledActions: [Action.SyncToSlack]
     * ```
     * @version @version SDK : 1.32.0 | ThoughtSpot Cloud: 10.1.0.cl
     */
  SyncToSlack("syncToSlack"), 
    /**
     * The **Sync to Teams** action on Liveboard visualizations.
     * Allows sending data to third-party apps Team
     * @example
     * ```js
     * disabledActions: [Action.SyncToTeams]
     * ```
     * @version @version SDK : 1.32.0 | ThoughtSpot Cloud: 10.1.0.cl
     */
  SyncToTeams("syncToTeams"), 
    /**
     * The **Remove** action that appears when cross filters are applied
     * on a Liveboard.
     * Removes filters applied o a visualization.
     * @example
     * ```js
     * disabledActions: [Action.RemoveCrossFilter]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
  RemoveCrossFilter("context-menu-item-remove-cross-filter"), 
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
  AxisMenuAggregate("axisMenuAggregate"), 
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
  AxisMenuTimeBucket("axisMenuTimeBucket"), 
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
  AxisMenuFilter("axisMenuFilter"), 
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
  AxisMenuConditionalFormat("axisMenuConditionalFormat"), 
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
  AxisMenuSort("axisMenuSort"), 
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
  AxisMenuGroup("axisMenuGroup"), 
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
  AxisMenuPosition("axisMenuPosition"), 
    /**
     * The **Rename** option in the chart axis or table column customization menu.
     * Renames the axis label on a chart or the column header on a table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuRename]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
  AxisMenuRename("axisMenuRename"), 
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
  AxisMenuEdit("axisMenuEdit"), 
    /**
     * The **Number format** action to customize the format of
     * the data labels on a chart or table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuNumberFormat]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
  AxisMenuNumberFormat("axisMenuNumberFormat"), 
    /**
     * The **Text wrapping** action on a table.
     * Wraps or clips column text on a table.
     * @example
     * ```js
     * disabledActions: [Action.AxisMenuTextWrapping]
     * ```
     * @version SDK: 1.21.0 | ThoughtSpot: 9.2.0.cl, 9.5.1.sw
     */
  AxisMenuTextWrapping("axisMenuTextWrapping"), 
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
  AxisMenuRemove("axisMenuRemove"), 
    /**
     * @hidden
     */
  InsertInToSlide("insertInToSlide"), 
    /**
     * The **Rename** menu action on Liveboards and visualizations.
     * Allows renaming a Liveboard or visualization.
     * @example
     * ```js
     * disabledActions: [Action.RenameModalTitleDescription]
     * ```
     * @version SDK: 1.23.0 | ThoughtSpot: 9.4.0.cl, 9.8.0.sw
     */
  RenameModalTitleDescription("renameModalTitleDescription"), 
    /**
     * The *Request verification* action on a Liveboard.
     * Initiates a request for Liveboard verification.
     * @example
     * ```js
     * disabledActions: [Action.RequestVerification]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl, 10.1.0.sw
     */
  RequestVerification("requestVerification"), 
    /**
     *
     * Allows users to mark a Liveboard as verified.
     * @example
     * ```js
     * disabledActions: [Action.MarkAsVerified]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot: 9.6.0.cl, 10.1.0.sw
     */
  MarkAsVerified("markAsVerified"), 
    /**
     * The **Add Tab** action on a Liveboard.
     * Allows adding a new tab to a Liveboard view.
     * @example
     * ```js
     * disabledActions: [Action.AddTab]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl, 9.8.0.sw
     */
  AddTab("addTab"), 
    /**
     *
     *Initiates contextual change analysis on KPI charts.
     * @example
     * ```js
     * disabledActions: [Action.EnableContextualChangeAnalysis]
     * ```
     * @version SDK: 1.25.0 | ThoughtSpot Cloud: 9.6.0.cl
     */
  EnableContextualChangeAnalysis("enableContextualChangeAnalysis"), 
    /**
     * Action ID to hide or disable Natural Language Search query.
     *
     * @example
     * ```js
     * disabledActions: [Action.ShowSageQuery]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot Cloud: 9.7.0.cl
     */
  ShowSageQuery("showSageQuery"), 
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
  EditSageAnswer("editSageAnswer"), 
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
  SageAnswerFeedback("sageAnswerFeedback"), 
    /**
     *
     * @example
     * ```js
     * disabledActions: [Action.ModifySageAnswer]
     * ```
     * @version SDK: 1.26.0 | ThoughtSpot: 9.7.0.cl
     */
  ModifySageAnswer("modifySageAnswer"), 
    /**
     * The **Move to Tab** menu action on visualizations in Liveboard edit mode.
     * Allows moving a visualization to a different tab.
     * @example
     * ```js
     * disabledActions: [Action.MoveToTab]
     * ```
     */
  MoveToTab("onContainerMove"), 
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
  ManageMonitor("manageMonitor"), 
    /**
     * The Liveboard Personalised Views dropdown.
     * Allows navigating to a personalized Liveboard View.
     *  @example
     * ```js
     * disabledActions: [Action.PersonalisedViewsDropdown]
     * ```
     *  @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
     */
  PersonalisedViewsDropdown("personalisedViewsDropdown"), 
    /**
     * Action ID for show or hide the user details on a
     * Liveboard (Recently visited / social proof)
     *  @example
     * ```js
     * disabledActions: [Action.LiveboardUsers]
     * ```
     *  @version SDK : 1.26.0 | ThoughtSpot: 9.7.0.cl, 10.1.0.sw
     */
  LiveboardUsers("liveboardUsers"), 
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
     * @version SDK : 1.28.3 | ThoughtSpot: 9.12.0.cl, 10.1.0.sw
     */
  TML("tml"), 
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
  CreateLiveboard("createLiveboard"), 
    /**
     * Action ID for to hide or disable the
     * Verified Liveboard banner.
     *  @example
     * ```js
     * hiddenAction: [Action.VerifiedLiveboard]
     * ```
     *  @version SDK: 1.29.0 | ThoughtSpot: 9.10.0.cl, 10.1.0.sw
     */
  VerifiedLiveboard("verifiedLiveboard"), 
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
  AskAi("AskAi"), 
    /**
     * The **Add KPI to Watchlist** action on Home page watchlist.
     * Adds a KPI chart to the watchlist on the Home page.
     * @example
     * ```js
     * disabledActions: [Action.AddToWatchlist]
     * ```
     * @version SDK : 1.27.9 | ThoughtSpot Cloud: 9.12.5.cl
     */
  AddToWatchlist("addToWatchlist"), 
    /**
     * The **Remove from watchlist** menu action on KPI watchlist.
     * Removes a KPI chart from the watchlist on the Home page.
     * @example
     * ```js
     * disabledActions: [Action.RemoveFromWatchlist]
     * ```
     * @version SDK : 1.27.9 | ThoughtSpot: 9.12.5.cl
     */
  RemoveFromWatchlist("removeFromWatchlist"), 
    /**
     * The **Organize Favourites** action on Homepage
     * *Favorites* module.
     *
     * @example
     * ```js
     * disabledActions: [Action.OrganiseFavourites]
     * ```
     * @version SDK : 1.32.0 | ThoughtSpot: 10.0.0.cl
     */
  OrganiseFavourites("organiseFavourites"), 
    /**
     * The **AI Highlights** action on a Liveboard.
     *
     *  @example
     * ```js
     * hiddenAction: [Action.AIHighlights]
     * ```
     *  @version SDK: 1.27.10 | ThoughtSpot Cloud: 9.12.5.cl
     */
  AIHighlights("AIHighlights"), 
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
  EditScheduleHomepage("editScheduleHomepage"), 
    /**
     * The *Pause* action on the *Liveboard Schedules* page
     * Pauses a scheduled Liveboard job.
     * @example
     * ```js
     * disabledActions: [Action.PauseScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
  PauseScheduleHomepage("pauseScheduleHomepage"), 
    /**
     * The **View run history** action **Liveboard Schedules** page.
     * Allows viewing schedule run history.
     * @example
     * ```js
     * disabledActions: [Action.ViewScheduleRunHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
  ViewScheduleRunHomepage("viewScheduleRunHomepage"), 
    /**
     * Action ID to hide or disable the
     * unsubscribe option for Liveboard schedules.
     * @example
     * ```js
     * disabledActions: [Action.UnsubscribeScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
  UnsubscribeScheduleHomepage("unsubscribeScheduleHomepage"), 
    /**
     * The **Manage Tags** action on Homepage Favourite Module.
     * @example
     * ```js
     * disabledActions: [Action.ManageTags]
     * ```
     * @version SDK : 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
  ManageTags("manageTags"), 
    /**
     * The **Delete** action on the **Liveboard Schedules* page.
     * Deletes a Liveboard schedule.
     * @example
     * ```js
     * disabledActions: [Action.DeleteScheduleHomepage]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot: 10.3.0.cl
     */
  DeleteScheduleHomepage("deleteScheduleHomepage"), 
    /**
     * The **Analyze CTA** action on KPI chart.
     * @example
     * ```js
     * disabledActions: [Action.KPIAnalysisCTA]
     * ```
     *  @version SDK: 1.34.0 | ThoughtSpot Cloud: 10.3.0.cl
     */
  KPIAnalysisCTA("kpiAnalysisCTA"), 
    /**
     * Action ID for disabling chip reorder in Answer and Liveboard
     * @example
     * ```js
     * const disabledActions = [Action.DisableChipReorder]
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
  DisableChipReorder("disableChipReorder"), 
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
  ChangeFilterVisibilityInTab("changeFilterVisibilityInTab"), 
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
  PreviewDataSpotter("previewDataSpotter"), 
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
  ResetSpotterChat("resetSpotterChat"), 
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
  SpotterFeedback("spotterFeedback"), 
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
  EditPreviousPrompt("editPreviousPrompt"), 
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
  DeletePreviousPrompt("deletePreviousPrompt"), 
    /**
     * Action ID for hide or disable editing tokens generated from
     * Spotter results.
     *  @example
     * ```js
     * hiddenAction: [Action.EditTokens]
     * ```
     *  @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.6.0.cl
     */
  EditTokens("editTokens"), 
    /**
     * Action ID for hiding rename option for Column rename
     *  @example
     * ```js
     * hiddenAction: [Action.ColumnRename]
     * ```
     *  @version SDK: 1.37.0 | ThoughtSpot Cloud: 10.8.0.cl
     */
  ColumnRename("columnRename"), 
    /**
     * Action ID for hide checkboxes for include or exclude
     * cover and filter pages in the Liveboard PDF
     *  @example
     * ```js
     * hiddenAction: [Action.CoverAndFilterOptionInPDF]
     * ```
     *  @version SDK: 1.37.0 | ThoughtSpot Cloud: 10.8.0.cl
     */
  CoverAndFilterOptionInPDF("coverAndFilterOptionInPDF");

  final String value;
  const Action(this.value);
}
@JsonEnum(valueField: 'value')
enum PrefetchFeatures {
  FullApp("FullApp"), 
  SearchEmbed("SearchEmbed"), 
  LiveboardEmbed("LiveboardEmbed"), 
  VizEmbed("VizEmbed");

  final String value;
  const PrefetchFeatures(this.value);
}
/**
 * Enum for options to change context trigger.
 * The `BOTH_CLICKS` option is available from 10.8.0.cl.
 */
@JsonEnum(valueField: 'value')
enum ContextMenuTriggerOptions {
  LEFT_CLICK("left-click"), 
  RIGHT_CLICK("right-click"), 
  BOTH_CLICKS("both-clicks");

  final String value;
  const ContextMenuTriggerOptions(this.value);
}
/**
 * Enum options to show or suppress Visual Embed SDK and
 * ThoughtSpot application logs in the console output.
 * This attribute doesn't support suppressing
 * browser warnings or errors.
 */
@JsonEnum(valueField: 'value')
enum LogLevel {
    /**
     * No application or SDK-related logs will be logged
     * in the console output.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.SILENT,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
  SILENT("SILENT"), 
    /**
     * Log only errors in the console output.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.ERROR,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
  ERROR("ERROR"), 
    /**
     * Log only warnings and errors in the console output.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.WARN,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
  WARN("WARN"), 
    /**
     * Log only the information alerts, warnings, and errors
     * in the console output.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.INFO,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
  INFO("INFO"), 
    /**
     * Log debug messages, warnings, information alerts,
     * and errors in the console output.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.DEBUG,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
  DEBUG("DEBUG"), 
    /**
     * All logs will be logged in the browser console.
     * @example
     * ```js
     * init({
     *   ... // other options,
     *  logLevel: LogLevel.TRACE,
     * })
     * ```
     * @version SDK: 1.26.7 | ThoughtSpot Cloud: 9.10.0.cl
     */
  TRACE("TRACE");

  final String value;
  const LogLevel(this.value);
}
@JsonEnum(valueField: 'value')
enum OperationType {
  GetChartWithData("GetChartWithData"), 
  GetTableWithHeadlineData("GetTableWithHeadlineData");

  final String value;
  const OperationType(this.value);
}
/**
 * inline customCSS within the {@link CustomisationsInterface}.
 * Use {@link CustomCssVariables} or css rules.
 */

class customCssInterface {
   
  Map<String, dynamic>? variables;
   
  Map<String, dynamic>? rules_UNSTABLE;

  customCssInterface(
    {
    
     this.variables,
    
     this.rules_UNSTABLE
    }
  );
    factory customCssInterface.fromJson(Map<String, dynamic> json) => _$customCssInterfaceFromJson(json);
    Map<String, dynamic> toJson() => _$customCssInterfaceToJson(this);
}
/**
 * Styles within the {@link CustomisationsInterface}.
 */

class CustomStyles {
   
  String? customCSSUrl;
   
  customCssInterface? customCSS;

  CustomStyles(
    {
    
     this.customCSSUrl,
    
     this.customCSS
    }
  );
    factory CustomStyles.fromJson(Map<String, dynamic> json) => _$CustomStylesFromJson(json);
    Map<String, dynamic> toJson() => _$CustomStylesToJson(this);
}
/**
 * Configuration to define the customization on the Embedded
 * ThoughtSpot components.
 * You can customize styles, text strings, and icons.
 * For more information, see https://developers.thoughtspot.com/docs/custom-css.
 * @example
 * ```js
 *  init({
 *    // ...
 *    customizations: {
 *     style: {
 *       customCSS: {
 *         variables: {},
 *         rules_UNSTABLE: {}
 *       }
 *     },
 *     content: {
 *      strings: {
 *        'LIVEBOARDS': 'Dashboards',
 *        'ANSWERS': 'Visualizations',
 *        'Edit': 'Modify',
 *        'Show underlying data': 'Show source data',
 *        'SpotIQ': 'Insights',
 *        'Monitor': 'Alerts',
 *      }
 *     },
 *     iconSpriteUrl: 'https://my-custom-icon-sprite.svg'
 *    }
 *  })
 * ```
 */

class CustomisationsInterface {
   
  CustomStyles? style;
   
  CustomisationsInterface__content? content;
   
  String? iconSpriteUrl;

  CustomisationsInterface(
    {
    
     this.style,
    
     this.content,
    
     this.iconSpriteUrl
    }
  );
    factory CustomisationsInterface.fromJson(Map<String, dynamic> json) => _$CustomisationsInterfaceFromJson(json);
    Map<String, dynamic> toJson() => _$CustomisationsInterfaceToJson(this);
}
/**
 * The configuration object for embedding ThoughtSpot content.
 * It includes the ThoughtSpot hostname or IP address,
 * the type of authentication, and the authentication endpoint
 * if a trusted authentication server is used.
 * @group Authentication / Init
 */

class EmbedConfig {
   
  AuthType authType;
   
  String thoughtSpotHost;
   
  String? authEndpoint;
   @JsonKey(ignore: true)
  EmbedConfig__getAuthToken? getAuthToken;
   
  String? username;
   
  String? password;
   
  bool? noRedirect;
   
  bool? inPopup;
   
  String? redirectPath;
   
  String? basepath;
   
  bool? shouldEncodeUrlQueryParams;
   
  bool? suppressNoCookieAccessAlert;
   
  bool? ignoreNoCookieAccess;
   
  bool? autoLogin;
   
  bool? disableLoginRedirect;
   
  String? loginFailedMessage;
   
  bool? callPrefetch;
   
  bool? queueMultiRenders;
   
  bool? detectCookieAccessSlow;
   
  bool? suppressSearchEmbedBetaWarning;
   
  bool? suppressSageEmbedBetaWarning;
   
  CustomisationsInterface? customizations;
   
  EmbedConfig__authTriggerContainer? authTriggerContainer;
   
  bool? useEventForSAMLPopup;
   
  String? authTriggerText;
   
  bool? blockNonEmbedFullAppAccess;
   
  EmbedConfig__hostConfig? hostConfig;
   
  String? pendoTrackingKey;
   
  bool? suppressErrorAlerts;
   
  LogLevel? logLevel;
   
  bool? disableSDKTracking;
   
  String? dateFormatLocale;
   
  String? numberFormatLocale;
   
  String? currencyFormat;
   
  bool? disableTokenVerification;
   
  bool? disableLoginFailurePage;
   
  Map<String, dynamic>? additionalFlags;
   
  EmbedConfig__customVariablesForThirdPartyTools? customVariablesForThirdPartyTools;
   
  bool? disablePreauthCache;

  EmbedConfig(
    {
    
    required this.authType,
    
    required this.thoughtSpotHost,
    
     this.authEndpoint,
    
     this.getAuthToken,
    
     this.username,
    
     this.password,
    
     this.noRedirect,
    
     this.inPopup,
    
     this.redirectPath,
    
     this.basepath,
    
     this.shouldEncodeUrlQueryParams,
    
     this.suppressNoCookieAccessAlert,
    
     this.ignoreNoCookieAccess,
    
     this.autoLogin,
    
     this.disableLoginRedirect,
    
     this.loginFailedMessage,
    
     this.callPrefetch,
    
     this.queueMultiRenders,
    
     this.detectCookieAccessSlow,
    
     this.suppressSearchEmbedBetaWarning,
    
     this.suppressSageEmbedBetaWarning,
    
     this.customizations,
    
     this.authTriggerContainer,
    
     this.useEventForSAMLPopup,
    
     this.authTriggerText,
    
     this.blockNonEmbedFullAppAccess,
    
     this.hostConfig,
    
     this.pendoTrackingKey,
    
     this.suppressErrorAlerts,
    
     this.logLevel,
    
     this.disableSDKTracking,
    
     this.dateFormatLocale,
    
     this.numberFormatLocale,
    
     this.currencyFormat,
    
     this.disableTokenVerification,
    
     this.disableLoginFailurePage,
    
     this.additionalFlags,
    
     this.customVariablesForThirdPartyTools,
    
     this.disablePreauthCache
    }
  );
    factory EmbedConfig.fromJson(Map<String, dynamic> json) => _$EmbedConfigFromJson(json);
    Map<String, dynamic> toJson() => _$EmbedConfigToJson(this);
}
class LayoutConfig {

  LayoutConfig(
    
  );
    factory LayoutConfig.fromJson(Map<String, dynamic> json) => _$LayoutConfigFromJson(json);
    Map<String, dynamic> toJson() => _$LayoutConfigToJson(this);
}
/**
 * Embedded iframe configuration
 * @group Embed components
 */

class FrameParams {
   
  FrameParams__width? width;
   
  FrameParams__height? height;
   
  FrameParams__loading? loading;

  FrameParams(
    {
    
     this.width,
    
     this.height,
    
     this.loading
    }
  );
    factory FrameParams.fromJson(Map<String, dynamic> json) => _$FrameParamsFromJson(json);
    Map<String, dynamic> toJson() => _$FrameParamsToJson(this);
}
/**
 * The configuration object for an embedded view.
 */

class ViewConfig {
   
  LayoutConfig? layoutConfig;
   
  FrameParams? frameParams;
   
  String? theme;
   
  String? styleSheet__unstable;
   
  List<Action>? disabledActions;
   
  String? primaryAction;
   
  String? disabledActionReason;
   
  List<Action>? hiddenActions;
   
  List<Action>? visibleActions;
   
  bool? showAlerts;
   
  List<RuntimeFilter>? runtimeFilters;
   
  List<RuntimeParameter>? runtimeParameters;
   
  String? locale;
   
  Map<String, dynamic>? additionalFlags;
   
  CustomisationsInterface? customizations;
   
  bool? insertAsSibling;
   
  ContextMenuTriggerOptions? contextMenuTrigger;
   
  bool? linkOverride;
   
  bool? insertInToSlide;
   
  bool? usePrerenderedIfAvailable;
   
  bool? excludeRuntimeFiltersfromURL;
   
  List<String>? hiddenTabs;
   
  List<HomepageModule>? hiddenHomepageModules;
   
  List<HomepageModule>? reorderedHomepageModules;
   
  List<String>? visibleTabs;
   
  List<HomeLeftNavItem>? hiddenHomeLeftNavItems;
   
  String? preRenderId;
   
  bool? doNotTrackPreRenderSize;
   
  String? embedComponentType;
   
  bool? excludeRuntimeParametersfromURL;
   
  bool? enableV2Shell_experimental;
   
  bool? collapseSearchBar;
   
  bool? exposeTranslationIDs;
   
  bool? disableRedirectionLinksInNewTab;
   
  bool? dataPanelV2;
   
  bool? enableCustomColumnGroups;
   
  int? overrideOrgId;
   
  List<ListPageColumns>? hiddenListColumns;

  ViewConfig(
    {
    
     this.layoutConfig,
    
     this.frameParams,
    
     this.theme,
    
     this.styleSheet__unstable,
    
     this.disabledActions,
    
     this.primaryAction,
    
     this.disabledActionReason,
    
     this.hiddenActions,
    
     this.visibleActions,
    
     this.showAlerts,
    
     this.runtimeFilters,
    
     this.runtimeParameters,
    
     this.locale,
    
     this.additionalFlags,
    
     this.customizations,
    
     this.insertAsSibling,
    
     this.contextMenuTrigger,
    
     this.linkOverride,
    
     this.insertInToSlide,
    
     this.usePrerenderedIfAvailable,
    
     this.excludeRuntimeFiltersfromURL,
    
     this.hiddenTabs,
    
     this.hiddenHomepageModules,
    
     this.reorderedHomepageModules,
    
     this.visibleTabs,
    
     this.hiddenHomeLeftNavItems,
    
     this.preRenderId,
    
     this.doNotTrackPreRenderSize,
    
     this.embedComponentType,
    
     this.excludeRuntimeParametersfromURL,
    
     this.enableV2Shell_experimental,
    
     this.collapseSearchBar,
    
     this.exposeTranslationIDs,
    
     this.disableRedirectionLinksInNewTab,
    
     this.dataPanelV2,
    
     this.enableCustomColumnGroups,
    
     this.overrideOrgId,
    
     this.hiddenListColumns
    }
  );
    factory ViewConfig.fromJson(Map<String, dynamic> json) => _$ViewConfigFromJson(json);
    Map<String, dynamic> toJson() => _$ViewConfigToJson(this);
}
/**
 * A filter that can be applied to ThoughtSpot answers, Liveboards, or
 * visualizations at runtime.
 */

class RuntimeFilter {
   
  List<RuntimeFilter__values> values;
   
  RuntimeFilterOp operator;
   
  String columnName;

  RuntimeFilter(
    {
    
    required this.values,
    
    required this.operator,
    
    required this.columnName
    }
  );
    factory RuntimeFilter.fromJson(Map<String, dynamic> json) => _$RuntimeFilterFromJson(json);
    Map<String, dynamic> toJson() => _$RuntimeFilterToJson(this);
}
/**
 * A filter that can be applied to ThoughtSpot Answers, Liveboards, or
 * visualizations at runtime.
 */

class RuntimeParameter {
   
  RuntimeParameter__value value;
   
  String name;

  RuntimeParameter(
    {
    
    required this.value,
    
    required this.name
    }
  );
    factory RuntimeParameter.fromJson(Map<String, dynamic> json) => _$RuntimeParameterFromJson(json);
    Map<String, dynamic> toJson() => _$RuntimeParameterToJson(this);
}
class AnswerServiceType {
   @JsonKey(ignore: true)
  AnswerServiceType__getAnswer? getAnswer;

  AnswerServiceType(
    {
    
     this.getAnswer
    }
  );
    factory AnswerServiceType.fromJson(Map<String, dynamic> json) => _$AnswerServiceTypeFromJson(json);
    Map<String, dynamic> toJson() => _$AnswerServiceTypeToJson(this);
}
class ColumnValue {
   
  ColumnValue__value value;
   
  ColumnValue__column column;

  ColumnValue(
    {
    
    required this.value,
    
    required this.column
    }
  );
    factory ColumnValue.fromJson(Map<String, dynamic> json) => _$ColumnValueFromJson(json);
    Map<String, dynamic> toJson() => _$ColumnValueToJson(this);
}
class VizPoint {
   
  List<ColumnValue> selectedMeasures;
   
  List<ColumnValue> selectedAttributes;

  VizPoint(
    {
    
    required this.selectedMeasures,
    
    required this.selectedAttributes
    }
  );
    factory VizPoint.fromJson(Map<String, dynamic> json) => _$VizPointFromJson(json);
    Map<String, dynamic> toJson() => _$VizPointToJson(this);
}
/**
 * @group Events
 */

class CustomActionPayload {
   
  SessionInterface session;
   
  CustomActionPayload__embedAnswerData embedAnswerData;
   
  CustomActionPayload__contextMenuPoints? contextMenuPoints;
   
  String? vizId;

  CustomActionPayload(
    {
    
    required this.session,
    
    required this.embedAnswerData,
    
     this.contextMenuPoints,
    
     this.vizId
    }
  );
    factory CustomActionPayload.fromJson(Map<String, dynamic> json) => _$CustomActionPayloadFromJson(json);
    Map<String, dynamic> toJson() => _$CustomActionPayloadToJson(this);
}
class DefaultAppInitData {
   
  List<ListPageColumns> hiddenListColumns;
   
  DefaultAppInitData__customVariablesForThirdPartyTools customVariablesForThirdPartyTools;
   
  List<String> hiddenHomeLeftNavItems;
   
  DefaultAppInitData__hostConfig hostConfig;
   
  List<String> reorderedHomepageModules;
   
  List<HomepageModule> hiddenHomepageModules;
   
  String runtimeParameterParams;
   
  String runtimeFilterParams;
   
  String authToken;
   
  CustomisationsInterface customisations;

  DefaultAppInitData(
    {
    
    required this.hiddenListColumns,
    
    required this.customVariablesForThirdPartyTools,
    
    required this.hiddenHomeLeftNavItems,
    
    required this.hostConfig,
    
    required this.reorderedHomepageModules,
    
    required this.hiddenHomepageModules,
    
    required this.runtimeParameterParams,
    
    required this.runtimeFilterParams,
    
    required this.authToken,
    
    required this.customisations
    }
  );
    factory DefaultAppInitData.fromJson(Map<String, dynamic> json) => _$DefaultAppInitDataFromJson(json);
    Map<String, dynamic> toJson() => _$DefaultAppInitDataToJson(this);
}
class SessionInterface {
   
  SessionInterface__acSession acSession;
   
  int genNo;
   
  String sessionId;

  SessionInterface(
    {
    
    required this.acSession,
    
    required this.genNo,
    
    required this.sessionId
    }
  );
    factory SessionInterface.fromJson(Map<String, dynamic> json) => _$SessionInterfaceFromJson(json);
    Map<String, dynamic> toJson() => _$SessionInterfaceToJson(this);
}
class UnderlyingDataPoint {
   
  dynamic dataValue;
   
  String columnId;

  UnderlyingDataPoint(
    {
    
    required this.dataValue,
    
    required this.columnId
    }
  );
    factory UnderlyingDataPoint.fromJson(Map<String, dynamic> json) => _$UnderlyingDataPointFromJson(json);
    Map<String, dynamic> toJson() => _$UnderlyingDataPointToJson(this);
}
class CustomisationsInterface__content__strings {

  CustomisationsInterface__content__strings(
    
  );
    factory CustomisationsInterface__content__strings.fromJson(Map<String, dynamic> json) => _$CustomisationsInterface__content__stringsFromJson(json);
    Map<String, dynamic> toJson() => _$CustomisationsInterface__content__stringsToJson(this);
}
class CustomisationsInterface__content__stringIDs {

  CustomisationsInterface__content__stringIDs(
    
  );
    factory CustomisationsInterface__content__stringIDs.fromJson(Map<String, dynamic> json) => _$CustomisationsInterface__content__stringIDsFromJson(json);
    Map<String, dynamic> toJson() => _$CustomisationsInterface__content__stringIDsToJson(this);
}
class CustomisationsInterface__content {
   
  CustomisationsInterface__content__strings? strings;
   
  CustomisationsInterface__content__stringIDs? stringIDs;
   
  String? stringIDsUrl;

  CustomisationsInterface__content(
    {
    
     this.strings,
    
     this.stringIDs,
    
     this.stringIDsUrl
    }
  );
    factory CustomisationsInterface__content.fromJson(Map<String, dynamic> json) => _$CustomisationsInterface__contentFromJson(json);
    Map<String, dynamic> toJson() => _$CustomisationsInterface__contentToJson(this);
}
class EmbedConfig__hostConfig {
   
  String hostClusterName;
   
  String hostClusterId;
   
  String hostUserGuid;

  EmbedConfig__hostConfig(
    {
    
    required this.hostClusterName,
    
    required this.hostClusterId,
    
    required this.hostUserGuid
    }
  );
    factory EmbedConfig__hostConfig.fromJson(Map<String, dynamic> json) => _$EmbedConfig__hostConfigFromJson(json);
    Map<String, dynamic> toJson() => _$EmbedConfig__hostConfigToJson(this);
}
class EmbedConfig__customVariablesForThirdPartyTools {

  EmbedConfig__customVariablesForThirdPartyTools(
    
  );
    factory EmbedConfig__customVariablesForThirdPartyTools.fromJson(Map<String, dynamic> json) => _$EmbedConfig__customVariablesForThirdPartyToolsFromJson(json);
    Map<String, dynamic> toJson() => _$EmbedConfig__customVariablesForThirdPartyToolsToJson(this);
}
class ColumnValue__value__Type__4__v {
   
  int e;
   
  int s;

  ColumnValue__value__Type__4__v(
    {
    
    required this.e,
    
    required this.s
    }
  );
    factory ColumnValue__value__Type__4__v.fromJson(Map<String, dynamic> json) => _$ColumnValue__value__Type__4__vFromJson(json);
    Map<String, dynamic> toJson() => _$ColumnValue__value__Type__4__vToJson(this);
}
class ColumnValue__value__Type__4 {
   
  ColumnValue__value__Type__4__v v;

  ColumnValue__value__Type__4(
    {
    
    required this.v
    }
  );
    factory ColumnValue__value__Type__4.fromJson(Map<String, dynamic> json) => _$ColumnValue__value__Type__4FromJson(json);
    Map<String, dynamic> toJson() => _$ColumnValue__value__Type__4ToJson(this);
}
class ColumnValue__column {
   
  String dataType;
   
  String name;
   
  String id;

  ColumnValue__column(
    {
    
    required this.dataType,
    
    required this.name,
    
    required this.id
    }
  );
    factory ColumnValue__column.fromJson(Map<String, dynamic> json) => _$ColumnValue__columnFromJson(json);
    Map<String, dynamic> toJson() => _$ColumnValue__columnToJson(this);
}
class CustomActionPayload__embedAnswerData__sources__header {
   
  String guid;

  CustomActionPayload__embedAnswerData__sources__header(
    {
    
    required this.guid
    }
  );
    factory CustomActionPayload__embedAnswerData__sources__header.fromJson(Map<String, dynamic> json) => _$CustomActionPayload__embedAnswerData__sources__headerFromJson(json);
    Map<String, dynamic> toJson() => _$CustomActionPayload__embedAnswerData__sources__headerToJson(this);
}
class CustomActionPayload__embedAnswerData__sources {
   
  CustomActionPayload__embedAnswerData__sources__header header;

  CustomActionPayload__embedAnswerData__sources(
    {
    
    required this.header
    }
  );
    factory CustomActionPayload__embedAnswerData__sources.fromJson(Map<String, dynamic> json) => _$CustomActionPayload__embedAnswerData__sourcesFromJson(json);
    Map<String, dynamic> toJson() => _$CustomActionPayload__embedAnswerData__sourcesToJson(this);
}
class CustomActionPayload__embedAnswerData {
   
  List<dynamic> data;
   
  List<dynamic> columns;
   
  CustomActionPayload__embedAnswerData__sources sources;
   
  String id;
   
  String name;

  CustomActionPayload__embedAnswerData(
    {
    
    required this.data,
    
    required this.columns,
    
    required this.sources,
    
    required this.id,
    
    required this.name
    }
  );
    factory CustomActionPayload__embedAnswerData.fromJson(Map<String, dynamic> json) => _$CustomActionPayload__embedAnswerDataFromJson(json);
    Map<String, dynamic> toJson() => _$CustomActionPayload__embedAnswerDataToJson(this);
}
class CustomActionPayload__contextMenuPoints {
   
  List<VizPoint> selectedPoints;
   
  VizPoint clickedPoint;

  CustomActionPayload__contextMenuPoints(
    {
    
    required this.selectedPoints,
    
    required this.clickedPoint
    }
  );
    factory CustomActionPayload__contextMenuPoints.fromJson(Map<String, dynamic> json) => _$CustomActionPayload__contextMenuPointsFromJson(json);
    Map<String, dynamic> toJson() => _$CustomActionPayload__contextMenuPointsToJson(this);
}
class DefaultAppInitData__customVariablesForThirdPartyTools {

  DefaultAppInitData__customVariablesForThirdPartyTools(
    
  );
    factory DefaultAppInitData__customVariablesForThirdPartyTools.fromJson(Map<String, dynamic> json) => _$DefaultAppInitData__customVariablesForThirdPartyToolsFromJson(json);
    Map<String, dynamic> toJson() => _$DefaultAppInitData__customVariablesForThirdPartyToolsToJson(this);
}
class DefaultAppInitData__hostConfig {

  DefaultAppInitData__hostConfig(
    
  );
    factory DefaultAppInitData__hostConfig.fromJson(Map<String, dynamic> json) => _$DefaultAppInitData__hostConfigFromJson(json);
    Map<String, dynamic> toJson() => _$DefaultAppInitData__hostConfigToJson(this);
}
class SessionInterface__acSession {
   
  int genNo;
   
  String sessionId;

  SessionInterface__acSession(
    {
    
    required this.genNo,
    
    required this.sessionId
    }
  );
    factory SessionInterface__acSession.fromJson(Map<String, dynamic> json) => _$SessionInterface__acSessionFromJson(json);
    Map<String, dynamic> toJson() => _$SessionInterface__acSessionToJson(this);
}
abstract class getGuidsFromColumnNames {
  Set (
    List<String> colNames,
    dynamic sourceDetail
  );
}
abstract class getSelectedPointsForUnderlyingDataQuery {
  UnderlyingDataPoint (
    List<VizPoint> selectedPoints
  );
}
abstract class getDisplayedViz {
  dynamic (
    String displayMode,
    List<dynamic> visualizations
  );
}
abstract class EmbedConfig__getAuthToken {
  Future<dynamic> getAuthToken(
  );
}
abstract class AnswerServiceType__getAnswer {
  dynamic getAnswer(
    int batchSize,
    int offset
  );
}
@JsonSerializable(explicitToJson: true, includeIfNull: false)
class EmbedConfig__authTriggerContainer {
  String value;

  EmbedConfig__authTriggerContainer(this.value);


    factory EmbedConfig__authTriggerContainer.fromJson(Map<String, dynamic> json) => _$EmbedConfig__authTriggerContainerFromJson(json);
    Map<String, dynamic> toJson() => _$EmbedConfig__authTriggerContainerToJson(this);
}
@JsonSerializable(explicitToJson: true, includeIfNull: false)
class FrameParams__width {
  String value;

  FrameParams__width(this.value);


    factory FrameParams__width.fromJson(Map<String, dynamic> json) => _$FrameParams__widthFromJson(json);
    Map<String, dynamic> toJson() => _$FrameParams__widthToJson(this);
}
@JsonSerializable(explicitToJson: true, includeIfNull: false)
class FrameParams__height {
  String value;

  FrameParams__height(this.value);


    factory FrameParams__height.fromJson(Map<String, dynamic> json) => _$FrameParams__heightFromJson(json);
    Map<String, dynamic> toJson() => _$FrameParams__heightToJson(this);
}
@JsonSerializable(explicitToJson: true, includeIfNull: false)
class FrameParams__loading {
  String value;

  FrameParams__loading(this.value);


    factory FrameParams__loading.fromJson(Map<String, dynamic> json) => _$FrameParams__loadingFromJson(json);
    Map<String, dynamic> toJson() => _$FrameParams__loadingToJson(this);
}
@JsonSerializable(explicitToJson: true, includeIfNull: false)
class RuntimeFilter__values {
  String value;

  RuntimeFilter__values(this.value);


    factory RuntimeFilter__values.fromJson(Map<String, dynamic> json) => _$RuntimeFilter__valuesFromJson(json);
    Map<String, dynamic> toJson() => _$RuntimeFilter__valuesToJson(this);
}
@JsonSerializable(explicitToJson: true, includeIfNull: false)
class RuntimeParameter__value {
  String value;

  RuntimeParameter__value(this.value);


    factory RuntimeParameter__value.fromJson(Map<String, dynamic> json) => _$RuntimeParameter__valueFromJson(json);
    Map<String, dynamic> toJson() => _$RuntimeParameter__valueToJson(this);
}
@JsonSerializable(explicitToJson: true, includeIfNull: false)
class ColumnValue__value {
  String value;

  ColumnValue__value(this.value);


    factory ColumnValue__value.fromJson(Map<String, dynamic> json) => _$ColumnValue__valueFromJson(json);
    Map<String, dynamic> toJson() => _$ColumnValue__valueToJson(this);
}