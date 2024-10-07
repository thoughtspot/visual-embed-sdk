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

export interface ConversationViewConfig extends ViewConfig {
    /**
     * The ID of the worksheet to use for the conversation.
     */
    worksheetId: string;
    /**
     * Ability to pass a starting search query to the conversation.
     */
    searchOptions?: SearchOptions;
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
        super(container, viewConfig);
    }

    public getIframeSrc() {
        const {
            worksheetId,
            searchOptions,
        } = this.viewConfig;
        const path = 'insights/conv-assist';
        const queryParams = this.getBaseQueryParams();
        queryParams[Param.SpotterEnabled] = true;

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
