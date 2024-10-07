import 'jest-fetch-mock';
import { getAnswerFromQuery } from './nls-answer-service';

describe('getAnswerFromQuery', () => {
    test('should return answer and suggestion', async () => {
        fetchMock.mockResponses(
            JSON.stringify({
                data: {
                    queryRequest: {
                        sageQuerySuggestions: [
                            {
                                sessionId: 'sessionId',
                                genNo: 2,
                                stateKey: {
                                    transactionId: 'transactionId',
                                    generationNumber: 1,
                                },
                            },
                        ],
                    },
                },
            }),
        );
        const query = 'query';
        const worksheetId = 'worksheetId';

        const res = await getAnswerFromQuery(query, worksheetId);

        const session = res.answer.getSession();
        expect(session.sessionId).toEqual('sessionId');
        expect(session.genNo).toEqual(2);
        expect(session.acSession.sessionId).toEqual('transactionId');
        expect(session.acSession.genNo).toEqual(1);
    });
});
