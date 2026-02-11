import isUndefined from 'lodash/isUndefined';
import { ERROR_MESSAGE } from '../errors';
import { Param, BaseViewConfig, RuntimeFilter, RuntimeParameter, ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { TsEmbed } from './ts-embed';
import { getQueryParamString, getFilterQuery, getRuntimeParameters, validateHttpUrl, setParamIfDefined } from '../utils';

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
 * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
 */
export interface SpotterSidebarViewConfig {
    /**
     * Controls the visibility of the past conversations sidebar.
     * @default false
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     */
    enablePastConversationsSidebar?: boolean;
    /**
     * Custom title text for the sidebar header.
     * Defaults to translated "Spotter" text.
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterSidebarTitle?: string;
    /**
     * Boolean to set the default expanded state of the sidebar.
     * @default false
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterSidebarDefaultExpanded?: boolean;
    /**
     * Custom label text for the rename action in the conversation edit menu.
     * Defaults to translated "Rename" text.
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterChatRenameLabel?: string;
    /**
     * Custom label text for the delete action in the conversation edit menu.
     * Defaults to translated "DELETE" text.
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterChatDeleteLabel?: string;
    /**
     * Custom title text for the delete conversation confirmation modal.
     * Defaults to translated "Delete chat" text.
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterDeleteConversationModalTitle?: string;
    /**
     * Custom message text for the past conversation banner alert.
     * Defaults to translated alert message.
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterPastConversationAlertMessage?: string;
    /**
     * Custom URL for the documentation/best practices link.
     * Defaults to ThoughtSpot docs URL based on release version.
     * Note: URL must include the protocol (e.g., `https://www.example.com`).
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterDocumentationUrl?: string;
    /**
     * Custom label text for the best practices button in the footer.
     * Defaults to translated "Best Practices" text.
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterBestPracticesLabel?: string;
    /**
     * Number of conversations to fetch per batch when loading conversation history.
     * @default 30
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterConversationsBatchSize?: number;
    /**
     * Custom title text for the "New Chat" button in the sidebar.
     * Defaults to translated "New Chat" text.
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterNewChatButtonTitle?: string;
}

/**
 * Configuration for customizing Spotter chat UI branding.
 * @group Embed components
 * @version SDK: 1.46.0 | ThoughtSpot: 26.4.0.cl
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
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    disableSourceSelection : true,
     * })
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
    disableSourceSelection?: boolean;
    /**
     * hideSourceSelection : Hide data source selection
     *
     * Supported embed types: `SpotterEmbed`
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    hideSourceSelection : true,
     * })
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
    hideSourceSelection?: boolean;
    /**
     * Flag to control Data panel experience
     *
     * Supported embed types: `SageEmbed`, `AppEmbed`, `SearchBarEmbed`, `LiveboardEmbed`, `SearchEmbed`
     * @default true
     * @version SDK: 1.41.1 | ThoughtSpot Cloud: 10.14.0.cl
     * @example
     * ```js
     * // Replace <EmbedComponent> with embed component name. For example, SageEmbed, AppEmbed, or SearchBarEmbed
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
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    showSpotterLimitations : true,
     * })
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.5.0.cl
     */
    showSpotterLimitations?: boolean;
    /**
     * hideSampleQuestions : Hide sample questions on
     * the initial screen of the conversation.
     *
     * Supported embed types: `SpotterEmbed`
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    hideSampleQuestions : true,
     * })
     * ```
     * @version SDK: 1.36.0 | ThoughtSpot: 10.6.0.cl
     */
    hideSampleQuestions?: boolean;
    /**
     * The list of runtime filters to apply to a search Answer,
     * visualization, or Liveboard.
     *
     * Supported embed types: `SpotterEmbed`
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
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
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
     * @default true
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
     */
    excludeRuntimeFiltersfromURL?: boolean;
    /**
     * The list of runtime parameters to apply to the conversation.
     *
     * Supported embed types: `SpotterEmbed`
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
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
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
     * @default true
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
     */
    excludeRuntimeParametersfromURL?: boolean;
    /**
     * updatedSpotterChatPrompt : Controls the updated spotter chat prompt.
     *
     * Supported embed types: `SpotterEmbed`
     * @default false
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    updatedSpotterChatPrompt : true,
     * })
     * ```
     * @version SDK: 1.45.0 | ThoughtSpot: 26.2.0.cl
     */
    updatedSpotterChatPrompt?: boolean;
    /**
     * Configuration for the Spotter sidebar UI customization.
     *
     * Supported embed types: `SpotterEmbed`, `AppEmbed`
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    spotterSidebarConfig: {
     *        enablePastConversationsSidebar: true,
     *        spotterSidebarTitle: 'My Conversations',
     *        spotterSidebarDefaultExpanded: true,
     *    },
     * })
     * ```
     * @version SDK: 1.46.0 | ThoughtSpot: 26.3.0.cl
     */
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    /**
     * Configuration for customizing Spotter chat UI
     * branding in tool response cards.
     *
     * Supported embed types: `SpotterEmbed`
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
     * @version SDK: 1.46.0 | ThoughtSpot: 26.4.0.cl
     */
    spotterChatConfig?: SpotterChatViewConfig;
}

/**
 * The configuration for the embedded spotterEmbed options.
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * Use {@link SpotterEmbedViewConfig} instead
 * @group Embed components
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConversationViewConfig extends SpotterEmbedViewConfig {}

/**
 * Embed ThoughtSpot AI Conversation.
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
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 */
export class SpotterEmbed extends TsEmbed {
    constructor(container: HTMLElement, protected viewConfig: SpotterEmbedViewConfig) {
        viewConfig = {
            embedComponentType: 'conversation',
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        }
        super(container, viewConfig);
    }

    protected getEmbedParamsObject() {
        const {
            worksheetId,
            searchOptions,
            disableSourceSelection,
            hideSourceSelection,
            dataPanelV2,
            showSpotterLimitations,
            hideSampleQuestions,
            runtimeFilters,
            excludeRuntimeFiltersfromURL,
            runtimeParameters,
            excludeRuntimeParametersfromURL,
            updatedSpotterChatPrompt,
            spotterSidebarConfig,
            spotterChatConfig,
        } = this.viewConfig;

        // Extract sidebar config properties
        const {
            enablePastConversationsSidebar,
            spotterSidebarTitle,
            spotterSidebarDefaultExpanded,
            spotterChatRenameLabel,
            spotterChatDeleteLabel,
            spotterDeleteConversationModalTitle,
            spotterPastConversationAlertMessage,
            spotterDocumentationUrl,
            spotterBestPracticesLabel,
            spotterConversationsBatchSize,
            spotterNewChatButtonTitle,
        } = spotterSidebarConfig || {};

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
        setParamIfDefined(queryParams, Param.SpotterSidebarDefaultExpanded, spotterSidebarDefaultExpanded, true);

        // String params
        setParamIfDefined(queryParams, Param.SpotterSidebarTitle, spotterSidebarTitle);
        setParamIfDefined(queryParams, Param.SpotterChatRenameLabel, spotterChatRenameLabel);
        setParamIfDefined(queryParams, Param.SpotterChatDeleteLabel, spotterChatDeleteLabel);
        setParamIfDefined(queryParams, Param.SpotterDeleteConversationModalTitle, spotterDeleteConversationModalTitle);
        setParamIfDefined(queryParams, Param.SpotterPastConversationAlertMessage, spotterPastConversationAlertMessage);
        setParamIfDefined(queryParams, Param.SpotterBestPracticesLabel, spotterBestPracticesLabel);
        setParamIfDefined(queryParams, Param.SpotterConversationsBatchSize, spotterConversationsBatchSize);
        setParamIfDefined(queryParams, Param.SpotterNewChatButtonTitle, spotterNewChatButtonTitle);

        // URL param with validation
        if (spotterDocumentationUrl !== undefined) {
            const [isValid, validationError] = validateHttpUrl(spotterDocumentationUrl);
            if (isValid) {
                queryParams[Param.SpotterDocumentationUrl] = spotterDocumentationUrl;
            } else {
                this.handleError({
                    errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                    message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                    code: EmbedErrorCodes.INVALID_URL,
                    error: validationError?.message || ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                });
            }
        }

        // Handle spotterChatConfig params
        if (spotterChatConfig) {
            const {
                hideToolResponseCardBranding,
                toolResponseCardBrandingLabel,
            } = spotterChatConfig;

            setParamIfDefined(queryParams, Param.HideToolResponseCardBranding, hideToolResponseCardBranding, true);
            setParamIfDefined(queryParams, Param.ToolResponseCardBrandingLabel, toolResponseCardBrandingLabel);
        }

        return queryParams;
    }

    public getIframeSrc(): string {
        const {
            worksheetId,
            searchOptions,
            runtimeFilters,
            excludeRuntimeFiltersfromURL,
            runtimeParameters,
            excludeRuntimeParametersfromURL,
            spotterSidebarConfig,
        } = this.viewConfig;
        const path = 'insights/conv-assist';
        const queryParams = this.getEmbedParamsObject();

        const enablePastConversationsSidebar = spotterSidebarConfig?.enablePastConversationsSidebar;
        if (!isUndefined(enablePastConversationsSidebar)) {
            queryParams[Param.EnablePastConversationsSidebar] = !!enablePastConversationsSidebar;
        }

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
            query: searchOptions?.searchQuery || '',
        });
        return `${this.getEmbedBasePath(query)}/embed/${path}${tsPostHashParams}`;
    }

    public async render(): Promise<SpotterEmbed> {
        await super.render();

        const src = this.getIframeSrc();
        await this.renderIFrame(src);
        return this;
    }
}

/**
 * Embed ThoughtSpot AI Conversation.
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * Use {@link SpotterEmbed} instead
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
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 */
export class ConversationEmbed extends SpotterEmbed {
    constructor(container: HTMLElement, protected viewConfig: ConversationViewConfig) {
        viewConfig = {
            embedComponentType: 'conversation',
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
            ...viewConfig,
        }
        super(container, viewConfig);
    }
}
