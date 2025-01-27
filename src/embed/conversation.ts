import isUndefined from 'lodash/isUndefined';
import { ERROR_MESSAGE } from '../errors';
import { ViewConfig, Param } from '../types';
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
 * The configuration for the embedded conversationEmbed options.
 * @group Embed components
 */
export interface ConversationViewConfig extends ViewConfig {
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
     * const embed = new ConversationEmbed('#tsEmbed', {
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
     * const embed = new ConversationEmbed('#tsEmbed', {
     *    ... // other options
     *    hideSourceSelection : true,
     * })
     * ```
     * @version SDK: 1.36.0 | Thoughtspot: 10.6.0.cl
     */
    hideSourceSelection?: boolean;
}

/**
 * Embed ThoughtSpot AI Conversation.
 * @group Embed components
 * @example
 * ```js
 * const conversation = new ConversationEmbed('#tsEmbed', {
 *   worksheetId: 'worksheetId',
 *   searchOptions: {
 *     searchQuery: 'searchQuery',
 *   },
 * });
 * conversation.render();
 * ```
 * @version SDK: 1.33.1 | ThoughtSpot: 10.5.0.cl
 */
export class ConversationEmbed extends TsEmbed {
    constructor(container: HTMLElement, protected viewConfig: ConversationViewConfig) {
        viewConfig.embedComponentType = 'conversation';
        super(container, viewConfig);
    }

    public getIframeSrc() {
        const {
            worksheetId,
            searchOptions,
            disableSourceSelection,
            hideSourceSelection,
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

    public async render(): Promise<ConversationEmbed> {
        super.render();
        const src = this.getIframeSrc();
        await this.renderIFrame(src);
        return this;
    }
}
