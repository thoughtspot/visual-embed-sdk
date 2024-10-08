import { graphqlQuery } from '../graphql-request';
import * as queries from './conversation-queries';

export class Conversation {
    private conversationId: string;

    private inProgress: Promise<any> | null = null;

    constructor(private thoughtSpotHost: string, private worksheetId: string) {
        this.inProgress = this.init();
    }

    async init() {
        const { convId } = await this.createConversation();
        this.conversationId = convId;
    }

    createConversation(): Promise<any> {
        return this.executeQuery(
            queries.createConversation,
            {
                params: {
                    initialCtx: {
                        tsWorksheetCtx: {
                            worksheet: {
                                worksheetId: this.worksheetId,
                            },
                        },
                        type: 'TS_WORKSHEET',
                    },
                    userInfo: {
                        tenantUrl: `${this.thoughtSpotHost}/prism`,
                    },
                },
            },
        );
    }

    public async sendMessage(userMessage: string): Promise<any> {
        await this.inProgress;

        try {
            const { responses } = await this.executeQuery(
                queries.sendMessage,
                {
                    params: {
                        convId: this.conversationId,
                        msg: {
                            data: {
                                userCmdData: {
                                    cmdText: userMessage,
                                    nlsData: {
                                        worksheetId: this.worksheetId,
                                    },
                                },
                            },
                            msgId: crypto.randomUUID(),
                            type: 'USER_COMMAND',
                        },
                    },
                },
            );
            const data = responses[0].data;
            return {
                data: data.asstRespData.nlsAnsData.sageQuerySuggestions[0],
                error: null,
            };
        } catch (error) {
            return { error };
        }
    }

    public async executeQuery(query: string, variables: any) {
        return graphqlQuery({
            query,
            variables,
            thoughtSpotHost: this.thoughtSpotHost,
            isCompositeQuery: false,
        });
    }
}
