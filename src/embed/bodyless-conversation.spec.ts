import 'jest-fetch-mock';
import { BodylessConversation, BodylessConversationViewConfig } from './bodyless-conversation';
import * as authInstance from '../auth';
import { init } from '../index';
import { Action, AuthType, RuntimeFilterOp } from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
    fixedEncodeURI,
    defaultParamsWithoutHiddenActions as defaultParams,
    expectUrlMatchesWithParams,
    expectUrlToHaveParamsWithValues,
} from '../test/test-utils';

describe('BodylessConversation', () => {
    const thoughtSpotHost = 'tshost';

    beforeAll(() => {
        init({
            thoughtSpotHost,
            authType: AuthType.None,
        });
        jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve({}));
        spyOn(window, 'alert');
        document.body.innerHTML = getDocumentBody();
    });

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    test('should render the bodyless conversation embed', async () => {
        fetchMock.mockResponses(
            JSON.stringify({
                data: {
                    ConvAssist__createConversation: {
                        convId: 'conversationId',
                        initialCtx: {
                            type: 'TS_ANSWER',
                            tsAnsCtx: {
                                sessionId: 'sessionId',
                                genNo: 1,
                                stateKey: {
                                    transactionId: 'transactionId',
                                    generationNumber: 1,
                                },
                                worksheet: {
                                    worksheetId: 'worksheetId',
                                    worksheetName: 'GTM',
                                },
                            },
                        },
                    },
                },
            }),
            JSON.stringify({
                data: {
                    ConvAssist__sendMessage: {
                        responses: [
                            {
                                msgId: 'msgId',
                                data: {
                                    asstRespData: {
                                        tool: 'TS_NLS',
                                        asstRespText: '',
                                        nlsAnsData: {
                                            sageQuerySuggestions: [
                                                {
                                                    llmReasoning: {
                                                        assumptions: 'You want the total [COL|sales] for [COL|item_type] [VAL|jackets] for [VAL|this year].',
                                                        clarifications: '',
                                                        interpretation: '',
                                                        __typename: 'eureka_SageQuerySuggestion_LLMReasoning',
                                                    },
                                                    tokens: [
                                                        'sum sales',
                                                        "item type = 'jackets'",
                                                        "date = 'this year'",
                                                    ],
                                                    tmlTokens: [
                                                        'sum [sales]',
                                                        "[date] = [date].'this year'",
                                                        "[item type] = [item type].'jackets'",
                                                    ],
                                                    worksheetId: 'worksheetId',
                                                    description: '',
                                                    title: '',
                                                    cached: false,
                                                    sqlQuery: "SELECT SUM(sales) FROM __Sample_Retail_Apparel WHERE item_type = 'jackets' AND date = _this_year();",
                                                    sessionId: 'sessionId',
                                                    genNo: 2,
                                                    formulaInfo: [],
                                                    tmlPhrases: [],
                                                    stateKey: {
                                                        transactionId: 'transactionId',
                                                        generationNumber: 1,
                                                        __typename: 'sage_auto_complete_v2_ACStateKey',
                                                    },
                                                    __typename: 'eureka_SageQuerySuggestion',
                                                },
                                            ],
                                            responseType: 'ANSWER',
                                            __typename: 'convassist_nls_tool_NLSToolAsstRespData',
                                        },
                                        __typename: 'convassist_AsstResponseData',
                                    },
                                    __typename: 'convassist_MessageData',
                                },
                                type: 'ASST_RESPONSE',
                                __typename: 'convassist_MessagePayload',
                            },
                        ],
                        __typename: 'convassist_SendMessageResponse',
                    },
                },
            }),
        );
        const viewConfig: BodylessConversationViewConfig = {
            worksheetId: 'worksheetId',
        };

        const conversationEmbed = new BodylessConversation(viewConfig);
        const result = await conversationEmbed.sendMessage('userMessage');
        console.log(result.container);
        const iframeSrc = getIFrameSrc(result.container);
        expectUrlToHaveParamsWithValues(iframeSrc, {
            sessionId: 'sessionId',
            genNo: 2,
            acSessionId: 'transactionId',
            acGenNo: 1,
        });

        fetchMock.mockRejectOnce(
            new Error('error'),
        );
        const errorResult = await conversationEmbed.sendMessage('userMessage');
        expect(errorResult.error instanceof Error).toBeTruthy();
    });
});
