import { Param } from '../types';

/**
 * Query parameters the application shell needs before it can receive a
 * postMessage at all: the embed marker, the host application URL used to
 * validate the message origin, the SDK version, the flags that pick the
 * authentication flow, and the boot-time settings (viewport, log level,
 * locale, formatting, org and appearance).
 * @internal
 */
export const BOOT_URL_PARAMS: readonly string[] = [
    Param.EmbedApp,
    Param.HostAppUrl,
    Param.Version,
    Param.AuthType,
    Param.AutoLogin,
    Param.DisableLoginRedirect,
    Param.ForceSAMLAutoRedirect,
    Param.cookieless,
    Param.preAuthCache,
    Param.blockNonEmbedFullAppAccess,
    Param.OverrideOrgId,
    Param.ViewPortHeight,
    Param.ViewPortWidth,
    Param.ClientLogLevel,
    Param.OverrideNativeConsole,
    Param.PendoTrackingKey,
    Param.NumberFormatLocale,
    Param.DateFormatLocale,
    Param.CurrencyFormat,
    Param.Locale,
    Param.IsDarkMode,
    Param.RadiantThemeEnabled,
    Param.searchEmbed,
    Param.livedBoardEmbed,
    Param.isSpotterAgentEmbed,
    Param.SpotterEnabled,
    Param.IsFullAppEmbed,
    Param.IsOnBeforeGetVizDataInterceptEnabled,
    Param.LinkOverride,
    Param.EnableLinkOverridesV2,
    Param.DisableRedirectionLinksInNewTab,
    Param.OverrideHistoryState,
    Param.ForceTable,
    Param.StringIDsUrl,
    Param.DataSources,
    Param.ExposeTranslationIDs,
    Param.IconSpriteUrl,
    Param.Tag,
    Param.vizEmbed,
    Param.UseLastSelectedDataSource,
    Param.DefaultQueryMode,
];

/**
 * Query parameters that stay on the iframe `src` when the embed sets the
 * `excludeConfigFromURL` additional flag: {@link BOOT_URL_PARAMS}. The rest
 * go in the APP_INIT payload, which the app applies before its first render,
 * and again over `HostEvent.UpdateEmbedParams`.
 * @internal
 */
export const BOOTSTRAP_URL_PARAMS: ReadonlySet<string> = new Set<string>(BOOT_URL_PARAMS);
