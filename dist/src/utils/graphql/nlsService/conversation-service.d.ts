export declare class Conversation {
    private thoughtSpotHost;
    private worksheetId;
    private conversationId;
    private inProgress;
    constructor(thoughtSpotHost: string, worksheetId: string);
    init(): Promise<void>;
    createConversation(): Promise<any>;
    sendMessage(userMessage: string): Promise<any>;
    executeQuery(query: string, variables: any): Promise<any>;
}
//# sourceMappingURL=conversation-service.d.ts.map