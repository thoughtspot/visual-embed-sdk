import { getAnswerServiceInstance } from './answerService';

describe('Unit test for getAnswerServiceInstance', () => {
    const session = {
        sessionId: '',
        genNo: 2,
        acSession: { sessionId: '', genNo: 1 },
    };
    const query = '';
    const thoughtSpotHost = 'http://10.79.135.124:3000';

    test('fetchData, when api giving answer data', async () => {
        const mockAnswerResponse = { data: {} };
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => mockAnswerResponse,
            }),
        );
        const answerService = getAnswerServiceInstance(
            session,
            query,
            'GetTableWithHeadlineData',
            thoughtSpotHost,
        );
        const answerData = await answerService.fetchData(1, 500);
        expect(answerData).toStrictEqual(mockAnswerResponse.data);
        expect(answerData).not.toBeInstanceOf(Error);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('fetchData, when api giving error', async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error('failure')));
        const answerService = getAnswerServiceInstance(
            session,
            query,
            'GetChartWithData',
            thoughtSpotHost,
        );
        const answerData = await answerService.fetchData(1, 500);
        expect(answerData).toBeInstanceOf(Error);
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
