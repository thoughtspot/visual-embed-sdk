import { BaseViewConfig, RuntimeFilter, RuntimeParameter, DefaultAppInitData, VisualizationOverrides, SpotterFileUploadFileTypes } from '../types';
import { TsEmbed } from './ts-embed';
/**
 * Configuration for search options
 */
export interface SearchOptions {
    /**
     * The query string to pass to start the Conversation.
     */
    searchQuery: string;
}
/**
 * Configuration for the Spotter sidebar.
 * Can be used in SpotterEmbed and AppEmbed.
 * @group Embed components
 * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
 */
export interface SpotterSidebarViewConfig {
    /**
     * Controls the visibility of the past conversations sidebar.
     * @default false
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    enablePastConversationsSidebar?: boolean;
    /**
     * Custom title text for the sidebar header.
     * Defaults to translated "Spotter" text.
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterSidebarTitle?: string;
    /**
     * Boolean to set the default expanded state of the sidebar.
     * @default false
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterSidebarDefaultExpanded?: boolean;
    /**
     * Custom label text for the rename action in the conversation edit menu.
     * Defaults to translated "Rename" text.
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterChatRenameLabel?: string;
    /**
     * Custom label text for the delete action in the conversation edit menu.
     * Defaults to translated "DELETE" text.
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterChatDeleteLabel?: string;
    /**
     * Custom title text for the delete conversation confirmation modal.
     * Defaults to translated "Delete chat" text.
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterDeleteConversationModalTitle?: string;
    /**
     * Custom message text for the past conversation banner alert.
     * Defaults to translated alert message.
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterPastConversationAlertMessage?: string;
    /**
     * Custom URL for the documentation/best practices link.
     * Defaults to ThoughtSpot docs URL based on release version.
     * Note: URL must include the protocol (e.g., `https://www.example.com`).
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterDocumentationUrl?: string;
    /**
     * Custom label text for the best practices button in the footer.
     * Defaults to translated "Best Practices" text.
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterBestPracticesLabel?: string;
    /**
     * Number of conversations to fetch per batch when loading conversation history.
     * @default 30
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterConversationsBatchSize?: number;
    /**
     * Custom title text for the "New Chat" button in the sidebar.
     * Defaults to translated "New Chat" text.
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterNewChatButtonTitle?: string;
}
/**
 * Configuration for customizing Spotter chat UI branding.
 * @version SDK: 1.46.0 | ThoughtSpot: 26.4.0.cl
 * @group Embed components
 */
export interface SpotterChatViewConfig {
    /**
     * Hides the ThoughtSpot logo/icon in tool response
     * cards. The branding label prefix is controlled
     * separately via `toolResponseCardBrandingLabel`.
     * External MCP tool branding is not affected.
     * @default false
     */
    hideToolResponseCardBranding?: boolean;
    /**
     * Custom label to replace the "ThoughtSpot" prefix
     * in tool response cards. Set to an empty string
     * `''` to hide the prefix entirely. Works
     * independently of `hideToolResponseCardBranding`.
     * External MCP tool branding is not affected.
     */
    toolResponseCardBrandingLabel?: string;
    /**
     * Enables file upload in the Spotter chat interface.
     *
     * Supported embed types: `SpotterEmbed`, `LiveboardEmbed`, `AppEmbed`
     * @version SDK: 1.49.0 | ThoughtSpot: 26.6.0.cl
     * @default false
     */
    spotterFileUploadEnabled?: boolean;
    /**
     * Restricts the allowed file types for Spotter file upload.
     *
     * Supported embed types: `SpotterEmbed`, `LiveboardEmbed`, `AppEmbed`
     * @version SDK: 1.49.0 | ThoughtSpot: 26.6.0.cl
     */
    spotterFileUploadFileTypes?: SpotterFileUploadFileTypes;
}
/**
 * The configuration for the embedded spotterEmbed options.
 * @group Embed components
 */
export interface SpotterEmbedViewConfig extends Omit<BaseViewConfig, 'primaryAction'> {
    /**
     * The ID of the data source object. For example, Model, View, or Table. Spotter uses
     * this object to query data and generate Answers.
     */
    worksheetId: string;
    /**
     * Ability to pass a starting search query to the conversation.
     */
    searchOptions?: SearchOptions;
    /**
     * disableSourceSelection : Disables data source selection
     * but still display the selected data source.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    disableSourceSelection : true,
     * })
     * ```
     */
    disableSourceSelection?: boolean;
    /**
     * hideSourceSelection : Hide data source selection
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    hideSourceSelection : true,
     * })
     * ```
     */
    hideSourceSelection?: boolean;
    /**
     * Flag to control Data panel experience
     *
     * Supported embed types: `SageEmbed`, `AppEmbed`, `SearchBarEmbed`, `LiveboardEmbed`, `SearchEmbed`
     * @deprecated from SDK: 1.46.0 | ThoughtSpot Cloud: 26.3.0.cl
     * @default true
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, AppEmbed, or SearchBarEmbed
     * const embed = new <EmbedComponent>('#tsEmbed', {
     *    ... // other embed view config
     *    dataPanelV2: true,
     * })
     * ```
     */
    dataPanelV2?: boolean;
    /**
     * showSpotterLimitations : show limitation text
     * of the spotter underneath the chat input.
     * default is false.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.36.0 | ThoughtSpot: 10.5.0.cl
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    showSpotterLimitations : true,
     * })
     * ```
     */
    showSpotterLimitations?: boolean;
    /**
     * hideSampleQuestions : Hide sample questions on
     * the initial screen of the conversation.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    hideSampleQuestions : true,
     * })
     * ```
     */
    hideSampleQuestions?: boolean;
    /**
     * The list of runtime filters to apply to a search Answer,
     * visualization, or Liveboard.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    // other embed view config
     *    runtimeFilters: [
     *           {
     *             columnName: 'color',
     *             operator: RuntimeFilterOp.EQ,
     *             values: ['red'],
     *           },
     *       ],
     * })
     * ```
     */
    runtimeFilters?: RuntimeFilter[];
    /**
     * Flag to control whether runtime filters should be included in the URL.
     * If true, filters will be passed via app initialization payload
     * (default behavior from SDK 1.45.0).
     * If false/undefined, filters are appended to the iframe URL instead.
     * (default behavior before SDK 1.45.0).
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
     * @default true
     */
    excludeRuntimeFiltersfromURL?: boolean;
    /**
     * The list of runtime parameters to apply to the conversation.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    // other embed view config
     *    runtimeParameters: [
     *           {
     *             name: 'Integer Param',
     *             value: 10,
     *           },
     *       ],
     * })
     * ```
     */
    runtimeParameters?: RuntimeParameter[];
    /**
     * Flag to control whether runtime parameters should be included in the URL.
     * If true, parameters will be passed via app
     * initialization payload (default behavior from SDK 1.45.0).
     * If false/undefined, parameters are appended to
     * the iframe URL instead (default behavior before SDK 1.45.0).
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
     * @default true
     */
    excludeRuntimeParametersfromURL?: boolean;
    /**
     * updatedSpotterChatPrompt : Controls the updated spotter chat prompt.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     * @default false
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    updatedSpotterChatPrompt : true,
     * })
     * ```
     */
    updatedSpotterChatPrompt?: boolean;
    /**
     * Enables the stop answer generation button in the Spotter embed UI,
     * allowing users to interrupt an ongoing answer generation.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.48.0 | ThoughtSpot: 26.5.0.cl
     * @default false
     */
    enableStopAnswerGenerationEmbed?: boolean;
    /**
     * Controls the visibility of the past conversations sidebar.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     * @deprecated from SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     * Use `spotterSidebarConfig.enablePastConversationsSidebar`.
     * @default false
     */
    enablePastConversationsSidebar?: boolean;
    /**
     * Configuration for the Spotter sidebar UI customization.
     *
     * Supported embed types: `SpotterEmbed`, `AppEmbed`
     * @version SDK: 1.47.0 | ThoughtSpot: 26.4.0.cl
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    worksheetId: 'worksheet-id',
     *    // Deprecated standalone flag (backward compatibility)
     *    enablePastConversationsSidebar: false,
     *    // Recommended config; this value takes precedence
     *    spotterSidebarConfig: {
     *        enablePastConversationsSidebar: true,
     *        spotterSidebarTitle: 'My Conversations',
     *        spotterSidebarDefaultExpanded: true,
     *    },
     * })
     * ```
     */
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    /**
     * Configuration for customizing Spotter chat UI
     * branding in tool response cards.
     *
     * Supported embed types: `SpotterEmbed`
     * @version SDK: 1.46.0 | ThoughtSpot: 26.4.0.cl
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    spotterChatConfig: {
     *        hideToolResponseCardBranding: true,
     *        toolResponseCardBrandingLabel: 'MyBrand',
     *    },
     * })
     * ```
     */
    spotterChatConfig?: SpotterChatViewConfig;
}
/**
 * The configuration for the embedded spotterEmbed options.
 * Use {@link SpotterEmbedViewConfig} instead
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * @group Embed components
 */
export interface ConversationViewConfig extends SpotterEmbedViewConfig {
}
/**
 * APP_INIT data shape for SpotterEmbed.
 * @internal
 */
export interface SpotterAppInitData extends DefaultAppInitData {
    embedParams?: {
        spotterSidebarConfig?: SpotterSidebarViewConfig;
        visualOverridesParams?: VisualizationOverrides | null;
    };
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
export declare class SpotterEmbed extends TsEmbed {
    protected viewConfig: SpotterEmbedViewConfig;
    constructor(container: HTMLElement, viewConfig: SpotterEmbedViewConfig);
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
    protected getAppInitData(): Promise<SpotterAppInitData>;
    protected getEmbedParamsObject(): Record<any, any>;
    getIframeSrc(): string;
    render(): Promise<SpotterEmbed>;
}
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
export declare class ConversationEmbed extends SpotterEmbed {
    protected viewConfig: ConversationViewConfig;
    constructor(container: HTMLElement, viewConfig: ConversationViewConfig);
}
//# sourceMappingURL=conversation.d.ts.map