import isUndefined from 'lodash/isUndefined';
import { ERROR_MESSAGE } from '../errors';
import { Param, BaseViewConfig } from '../types';
import { TsEmbed } from './ts-embed';
import { getQueryParamString } from '../utils';

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
export interface SpotterEmbedViewConfig extends BaseViewConfig {
    /**
     * The ID of the worksheet to use for the conversation.
     */
    worksheetId: string;
    /**
     * Ability to pass a starting search query to the conversation.
     */
    searchOptions?: SearchOptions;
    /**
     * disableSourceSelection : Disables data source selection
     * but still display the selected data source.
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... // other options
     *    disableSourceSelection : true,
     * })
     * ```
     * @version SDK: 1.36.0 | Thoughtspot: 10.6.0.cl
     */
    disableSourceSelection?: boolean;
    /**
     * hideSourceSelection : Hide data source selection
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... // other options
     *    hideSourceSelection : true,
     * })
     * ```
     * @version SDK: 1.36.0 | Thoughtspot: 10.6.0.cl
     */
    hideSourceSelection?: boolean;
    /**
     * Flag to control Data panel experience
     * @default false
     * @version SDK: 1.36.0 | ThoughtSpot Cloud: 10.4.0.cl
     * @example
     * ```js
     * const embed = new AppEmbed('#tsEmbed', {
     *    ... // other options
     *    dataPanelV2: true,
     * })
     * ```
     */
    dataPanelV2?: boolean;
    /**
     * showSpotterLimitations : show limitation text
     * of the spotter underneath the chat input.
     * default is false.
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... // other options
     *    showSpotterLimitations : true,
     * })
     * ```
     * @version SDK: 1.36.0 | Thoughtspot: 10.5.0.cl
     */
    showSpotterLimitations?: boolean;
    /**
     * hideSampleQuestions : Hide sample questions on
     * the initial screen of the conversation.
     * @example
     * ```js
     * const embed = new SpotterEmbed('#tsEmbed', {
     *    ... // other options
     *    hideSampleQuestions : true,
     * })
     * ```
     * @version SDK: 1.36.0 | Thoughtspot: 10.6.0.cl
     */
    hideSampleQuestions?: boolean;
}

/**
 * The configuration for the embedded spotterEmbed options.
 * @deprecated from SDK: 1.38.0 | ThoughtSpot: 10.10.0.cl
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

    public getIframeSrc(): string {
        const {
            worksheetId,
            searchOptions,
            disableSourceSelection,
            hideSourceSelection,
            dataPanelV2,
            showSpotterLimitations,
            hideSampleQuestions,
        } = this.viewConfig;
        const path = 'insights/conv-assist';
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

        let query = '';
        const queryParamsString = getQueryParamString(queryParams, true);
        if (queryParamsString) {
            query = `?${queryParamsString}`;
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
 * @deprecated from SDK: 1.38.0 | ThoughtSpot: 10.10.0.cl
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
