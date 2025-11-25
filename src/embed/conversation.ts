import isUndefined from 'lodash/isUndefined';
import { ERROR_MESSAGE } from '../errors';
import { Param, BaseViewConfig, RuntimeFilter, RuntimeParameter } from '../types';
import { TsEmbed } from './ts-embed';
import { getQueryParamString, getFilterQuery, getRuntimeParameters } from '../utils';

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
     * If true, filters will be passed via app initialization payload instead.
     * If false/undefined, filters will be added to URL (default behavior).
     *
     * Supported embed types: `SpotterEmbed`
     * @default false
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
     * If true, parameters will be passed via app initialization payload instead.
     * If false/undefined, parameters will be added to URL (default behavior).
     *
     * Supported embed types: `SpotterEmbed`
     * @default false
     * @version SDK: 1.41.0 | ThoughtSpot: 10.13.0.cl
     */
    excludeRuntimeParametersfromURL?: boolean;
    /**
     * enablePastConversationsSidebar : Controls the visibility of the past conversations
     * sidebar.
     *
     * Supported embed types: `SpotterEmbed`
     * @default false
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... //other embed view config
     *    enablePastConversationsSidebar : true,
     * })
     * ```
     * @version SDK: 1.43.0 | ThoughtSpot: 26.2.0.cl
     */
    enablePastConversationsSidebar?: boolean;
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
        viewConfig.embedComponentType = 'conversation';
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
            enablePastConversationsSidebar,
            runtimeFilters,
            excludeRuntimeFiltersfromURL,
            runtimeParameters,
            excludeRuntimeParametersfromURL,
        } = this.viewConfig;

        if (!worksheetId) {
            this.handleError(ERROR_MESSAGE.SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND);
        }
        const queryParams = this.getBaseQueryParams();
        queryParams[Param.SpotterEnabled] = true;
        if (!isUndefined(disableSourceSelection)) {
            queryParams[Param.DisableSourceSelection] = !!disableSourceSelection;
        }
        if (!isUndefined(hideSourceSelection)) {
            queryParams[Param.HideSourceSelection] = !!hideSourceSelection;
        }

        if (!isUndefined(dataPanelV2)) {
            queryParams[Param.DataPanelV2Enabled] = !!dataPanelV2;
        }

        if (!isUndefined(showSpotterLimitations)) {
            queryParams[Param.ShowSpotterLimitations] = !!showSpotterLimitations;
        }

        if (!isUndefined(hideSampleQuestions)) {
            queryParams[Param.HideSampleQuestions] = !!hideSampleQuestions;
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
            enablePastConversationsSidebar
        } = this.viewConfig;
        const path = 'insights/conv-assist';
        const queryParams = this.getEmbedParamsObject();

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
        viewConfig.embedComponentType = 'conversation';
        super(container, viewConfig);
    }
}
