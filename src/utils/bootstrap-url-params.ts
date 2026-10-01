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
 * Layout and chrome flags the app picks its first render from: navigation,
 * page versions, the Liveboard header and grid, the search bar and initial
 * query, and the Spotter experience. These would work over
 * `HostEvent.UpdateEmbedParams`, but arriving a frame late paints the default
 * layout first and then swaps it, so the embed flickers.
 * @internal
 */
export const FIRST_RENDER_URL_PARAMS: readonly string[] = [
    Param.IsDarkMode,
    Param.RadiantThemeEnabled,
    // App shell navigation.
    Param.PrimaryNavHidden,
    Param.NavigationVersion,
    Param.HideHamburger,
    Param.HideProfleAndHelp,
    Param.HideApplicationSwitcher,
    Param.HideOrgSwitcher,
    Param.HideNotification,
    Param.HideObjectSearch,
    Param.HideHomepageLeftNav,
    Param.HideObjects,
    Param.HideTagFilterChips,
    Param.EnableHomepageAnnouncement,
    // Page versions.
    Param.ModularHomeExperienceEnabled,
    Param.HomepageVersion,
    Param.ListPageVersion,
    Param.HomePageSearchBarMode,
    Param.IsUnifiedSearchExperienceEnabled,
    Param.DataPanelV2Enabled,
    Param.EnableConnectionNewExperience,
    // Liveboard layout.
    Param.LiveboardV2Enabled,
    Param.LiveboardHeaderV2,
    Param.HideLiveboardHeader,
    Param.LiveboardHeaderSticky,
    Param.ShowLiveboardTitle,
    Param.ShowLiveboardDescription,
    Param.HideTabPanel,
    Param.Enable2ColumnLayout,
    Param.IsLiveboardAlwaysOn12ColLayout,
    Param.LiveboardGutter,
    Param.IsLiveboardMasterpiecesEnabled,
    Param.IsLiveboardStylingAndGroupingEnabled,
    Param.EnableNewChartLibrary,
    Param.visibleVizs,
    Param.ShowLiveboardVerifiedBadge,
    Param.ShowLiveboardReverifyBanner,
    Param.ShowMaskedFilterChip,
    Param.HideIrrelevantFiltersInTab,
    Param.isCentralizedLiveboardFilterUXEnabled,
    Param.OpenSpotterOnLiveboardByDefault,
    // Search layout and the initial query.
    Param.HideSearchBar,
    Param.HideResult,
    Param.CollapseSearchBarInitially,
    Param.FocusSearchBarOnRender,
    Param.ShowAnswerEditPanel,
    Param.EnableSearchAssist,
    Param.DataSourceMode,
    Param.searchTokenString,
    Param.executeSearch,
    Param.EnableCustomColumnGroups,
    Param.DataPanelCustomGroupsAccordionInitialState,
    // Spotter experience and its empty state.
    Param.UpdatedSpotterExperience,
    Param.SpotterExperienceVersion,
    Param.UpdatedSpotterChatPrompt,
    Param.ShowSpotterRadiance,
    Param.ShowSpotterLimitations,
    Param.HideSampleQuestions,
    Param.HideSourceSelection,
    Param.DisableSourceSelection,
    Param.IsStarterPromptsEnabled,
];

/**
 * Query parameters that stay on the iframe `src` when the embed sets the
 * `excludeConfigFromURL` additional flag: {@link BOOT_URL_PARAMS} and
 * {@link FIRST_RENDER_URL_PARAMS}. Everything else is delivered over
 * `HostEvent.UpdateEmbedParams`.
 * @internal
 */
export const BOOTSTRAP_URL_PARAMS: ReadonlySet<string> = new Set<string>([
    ...BOOT_URL_PARAMS,
    ...FIRST_RENDER_URL_PARAMS,
]);
