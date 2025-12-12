import { Param, BaseViewConfig } from '../types';
import { TsEmbed } from './ts-embed';
import { Conversation as ConversationService } from '../utils/graphql/nlsService/conversation-service';
import { getEmbedConfig } from './embedConfig';
import { getQueryParamString } from '../utils';

/**
 * Configuration for bodyless conversation options.
 * @group Embed components
 */
export interface SpotterAgentEmbedViewConfig extends Omit<BaseViewConfig, 'primaryAction'> {
    /**
     * The ID of the Model to use for the conversation.
     */
    worksheetId: string;
}

/**
 * Configuration for conversation options.
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * Use {@link SpotterAgentEmbedViewConfig} instead
 * @group Embed components
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BodylessConversationViewConfig extends SpotterAgentEmbedViewConfig {}

export interface SpotterAgentMessageViewConfig extends SpotterAgentEmbedViewConfig {
    sessionId: string;
    genNo: number;
    acSessionId: string;
    acGenNo: number;
    convId: string;
    messageId: string;
}

export class ConversationMessage extends TsEmbed {
    constructor(container: HTMLElement, protected viewConfig: SpotterAgentMessageViewConfig) {
        viewConfig.embedComponentType = 'bodyless-conversation';
        super(container, viewConfig);
    }

    protected getEmbedParamsObject() {
        const queryParams = this.getBaseQueryParams();
        queryParams[Param.HideActions] = [...(queryParams[Param.HideActions] ?? [])];
        queryParams[Param.isSpotterAgentEmbed] = true;
        return queryParams;
    }

    public getIframeSrc() {
        const {
            sessionId,
            genNo,
            acSessionId,
            acGenNo,
            convId,
            messageId,
        } = this.viewConfig;
        const path = 'conv-assist-answer';
        const queryParams = this.getEmbedParamsObject();

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
            convId,
            messageId,
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
 * import { SpotterAgentEmbed } from '@thoughtspot/visual-embed-sdk';
 *
 * const conversation = new SpotterAgentEmbed({
 *  worksheetId: 'worksheetId',
 * });
 *
 * const { container, error } = await conversation.sendMessage('show me sales by region');
 *
 * // append the container to the DOM
 * document.body.appendChild(container); // or to any other element
 * ```
 * @group Embed components
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 */
export class SpotterAgentEmbed {
    private conversationService: ConversationService;

    constructor(private viewConfig: SpotterAgentEmbedViewConfig) {
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
            convId: data.convId,
            messageId: data.messageId,
            sessionId: data.sessionId,
            genNo: data.genNo,
            acSessionId: data.stateKey.transactionId,
            acGenNo: data.stateKey.generationNumber,
        });
        await embed.render();
        return { container, viz: embed };
    }

    /**
     * Send a message to the conversation service and return only the data.
     * @param userMessage - The message to send to the conversation service.
     * @returns The data from the conversation service.
     */
    public async sendMessageData(userMessage: string) {
        try {
            const { data, error } = await this.conversationService.sendMessage(userMessage);
            if (error) {
                return { error };
            }
            return { data: {
                convId: data.convId,
                messageId: data.messageId,
                sessionId: data.sessionId,
                genNo: data.genNo,
                acSessionId: data.stateKey.transactionId,
                acGenNo: data.stateKey.generationNumber,
            } };
        } catch (error) {
            return { error: error as Error };
        }
    }
}

/**
 * Create a conversation embed, which can be integrated inside
 * chatbots or other conversational interfaces.
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * Use {@link SpotterAgentEmbed} instead
 * @example
 * ```js
 * import { SpotterAgentEmbed } from '@thoughtspot/visual-embed-sdk';
 *
 * const conversation = new SpotterAgentEmbed({
 *  worksheetId: 'worksheetId',
 * });
 *
 * const { container, error } = await conversation.sendMessage('show me sales by region');
 *
 * // append the container to the DOM
 * document.body.appendChild(container); // or to any other element
 * ```
 * @group Embed components
 */
export class BodylessConversation extends SpotterAgentEmbed {
    constructor(viewConfig: BodylessConversationViewConfig) {
        super(viewConfig);
    }
}
