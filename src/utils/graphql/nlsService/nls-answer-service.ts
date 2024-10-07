import { getEmbedConfig } from '../../../embed/embedConfig';
import { SessionInterface, AnswerService } from '../answerService/answerService';
import { graphqlQuery } from '../graphql-request';
import * as queries from './nls-answer-queries';

/**
 * Get answer from natural language query
 * @param query string
 * @param worksheetId string
 * @returns AnswerService and the suggestion response.
 * @version SDK: 1.33.1 | ThoughtSpot: 10.3.0.cl
 * @example
 * ```js
 * const { answer } = await getAnswerFromQuery('revenue', 'worksheetId');
 * ```
 */
export const getAnswerFromQuery = async (
    query: string,
    worksheetId: string,
): Promise<{ answer: AnswerService, suggestion: any }> => {
    const embedConfig = getEmbedConfig();
    const resp = await graphqlQuery({
        query: queries.getAnswerSessionFromQuery,
        variables: {
            params: {
                facetSelections: [],
                filterSelections: [
                    {
                        facetType: 'WORKSHEETS',
                        facetValue: [
                            worksheetId,
                        ],
                    },
                ],
                query,
                worksheetFacetPayload: {
                    worksheetId,
                },
                searchOption: 'AI_ANSWER',
            },
        },
        thoughtSpotHost: embedConfig.thoughtSpotHost,
        isCompositeQuery: false,
    });

    const suggestion = resp.sageQuerySuggestions[0];
    const answerSession: SessionInterface = {
        sessionId: suggestion.sessionId,
        genNo: suggestion.genNo,
        acSession: {
            sessionId: suggestion.stateKey.transactionId,
            genNo: suggestion.stateKey.generationNumber,
        },
    };
    return {
        answer: new AnswerService(
            answerSession,
            null,
            embedConfig.thoughtSpotHost,
        ),
        suggestion,
    };
};
