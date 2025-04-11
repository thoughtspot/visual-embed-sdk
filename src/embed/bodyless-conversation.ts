import { ViewConfig, Param } from '../types';
import { TsEmbed } from './ts-embed';
import { Conversation as ConversationService } from '../utils/graphql/nlsService/conversation-service';
import { getEmbedConfig } from './embedConfig';
import { getQueryParamString } from '../utils';

/**
 * Configuration for bodyless conversation options.
 * @group Embed components
 */
export interface BodylessConversationViewConfig extends ViewConfig {
    /**
     * The ID of the worksheet to use for the conversation.
     */
    worksheetId: string;
}

interface ConversationMessageViewConfig extends BodylessConversationViewConfig {
    sessionId: string;
    genNo: number;
    acSessionId: string;
    acGenNo: number;
}

class ConversationMessage extends TsEmbed {
    constructor(container: HTMLElement, protected viewConfig: ConversationMessageViewConfig) {
        viewConfig.embedComponentType = 'bodyless-conversation';
        super(container, viewConfig);
    }

    public getIframeSrc() {
        const {
            sessionId,
            genNo,
            acSessionId,
            acGenNo,
        } = this.viewConfig;
        const path = 'conv-assist-answer';
        const queryParams = this.getBaseQueryParams();

        queryParams[Param.HideActions] = [...(queryParams[Param.HideActions] ?? [])];
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
        });

        return `${this.getEmbedBasePath(query)}/embed/${path}${tsPostHashParams}`;
    }

    public async render(): Promise<ConversationMessage> {
        await super.render();

        const src = this.getIframeSrc();
        await this.renderIFrame(src);
        return this;
    }
}

/**
 * Create a conversation embed, which can be integrated inside
 * chatbots or other conversational interfaces.
 * @example
 * ```js
 * import { BodylessConversation } from '@thoughtspot/visual-embed-sdk';
 *
 * const conversation = new BodylessConversation({
 *  worksheetId: 'worksheetId',
 * });
 *
 * const { container, error } = await conversation.sendMessage('show me sales by region');
 *
 * // append the container to the DOM
 * document.body.appendChild(container); // or to any other element
 * ```
 * @group Embed components
 * @version SDK: 1.33.1 | ThoughtSpot: 10.5.0.cl
 */
export class BodylessConversation {
    private conversationService: ConversationService;

    constructor(private viewConfig: BodylessConversationViewConfig) {
        const embedConfig = getEmbedConfig();

        this.conversationService = new ConversationService(
            embedConfig.thoughtSpotHost,
            viewConfig.worksheetId,
        );
    }

    public async sendMessage(userMessage: string) {
        const { data, error } = await this.conversationService.sendMessage(userMessage);
        if (error) {
            return { error };
        }

        const container = document.createElement('div');
        const embed = new ConversationMessage(container, {
            ...this.viewConfig,
            sessionId: data.sessionId,
            genNo: data.genNo,
            acSessionId: data.stateKey.transactionId,
            acGenNo: data.stateKey.generationNumber,
        });
        await embed.render();
        return { container, viz: embed };
    }
}
