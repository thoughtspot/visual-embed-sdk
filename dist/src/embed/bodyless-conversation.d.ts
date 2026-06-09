import { BaseViewConfig } from '../types';
import { TsEmbed } from './ts-embed';
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
 * Use {@link SpotterAgentEmbedViewConfig} instead
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * @group Embed components
 */
export interface BodylessConversationViewConfig extends SpotterAgentEmbedViewConfig {
}
export interface SpotterAgentMessageViewConfig extends SpotterAgentEmbedViewConfig {
    sessionId: string;
    genNo: number;
    acSessionId: string;
    acGenNo: number;
    convId: string;
    messageId: string;
}
export declare class ConversationMessage extends TsEmbed {
    protected viewConfig: SpotterAgentMessageViewConfig;
    constructor(container: HTMLElement, viewConfig: SpotterAgentMessageViewConfig);
    protected getEmbedParamsObject(): Record<any, any>;
    getIframeSrc(): string;
    render(): Promise<ConversationMessage>;
}
/**
 * Create a conversation embed, which can be integrated inside
 * chatbots or other conversational interfaces.
 * @version SDK: 1.37.0 | ThoughtSpot: 10.9.0.cl
 * @group Embed components
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
 */
export declare class SpotterAgentEmbed {
    private viewConfig;
    private conversationService;
    constructor(viewConfig: SpotterAgentEmbedViewConfig);
    sendMessage(userMessage: string): Promise<{
        error: any;
        container?: undefined;
        viz?: undefined;
    } | {
        container: HTMLDivElement;
        viz: ConversationMessage;
        error?: undefined;
    }>;
    /**
     * Send a message to the conversation service and return only the data.
     * @param userMessage - The message to send to the conversation service.
     * @returns The data from the conversation service.
     */
    sendMessageData(userMessage: string): Promise<{
        error: any;
        data?: undefined;
    } | {
        data: {
            convId: any;
            messageId: any;
            sessionId: any;
            genNo: any;
            acSessionId: any;
            acGenNo: any;
        };
        error?: undefined;
    }>;
}
/**
 * Create a conversation embed, which can be integrated inside
 * chatbots or other conversational interfaces.
 * Use {@link SpotterAgentEmbed} instead
 * @deprecated from SDK: 1.39.0 | ThoughtSpot: 10.10.0.cl
 * @group Embed components
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
 */
export declare class BodylessConversation extends SpotterAgentEmbed {
    constructor(viewConfig: BodylessConversationViewConfig);
}
//# sourceMappingURL=bodyless-conversation.d.ts.map