import 'jest-fetch-mock';
import { VizPoint } from 'src/types';
import { AnswerService } from './answerService';
import { getAnswerData, removeColumns } from './answer-queries';

const defaultSession = {
    sessionId: 'id',
    genNo: 1,
    acSession: {
        sessionId: 'ac',
        genNo: 0,
    },
};
/**
 *
 * @param answer
 * @param point
 */
function createAnswerService(answer = {}, point?: VizPoint[]) {
    return new AnswerService(
        defaultSession,
        answer,
        'https://tshost',
        point,
    );
}

describe('Answer service tests', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    test('Execute query should execute the supplied graphql on the session', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            data: {
                Bla: {
                    id: {},
                },
            },
        }));
        const answerService = createAnswerService();
        answerService.executeQuery(
            'query Bla {}',
            { a: 1 },
        );
        expect(fetchMock).toBeCalledWith('https://tshost/prism/?op=Bla', expect.objectContaining({
            body: JSON.stringify({
                operationName: 'Bla',
                query: 'query Bla {}',
                variables: {
                    session: defaultSession,
                    a: 1,
                },
            }),
        }));
    });

    test('Should return error when failure', async () => {
        fetchMock.mockRejectOnce(new Error('testError'));
        const answerService = createAnswerService();
        const data = await answerService.executeQuery(
            'query Bla {}',
            { a: 1 },
        );
        expect(data.message).toBe('testError');
    });

    test('fetchData should call the right graphql, and return data', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            data: {
                getAnswer: {
                    id: {},
                    answer: {
                        visualizations: [{
                            columns: [{
                                column: {
                                    id: 'id1',
                                },
                            }],
                            data: {
                                foo: 1,
                            },
                        }],
                    },
                },
            },
        }));
        const answerService = createAnswerService();
        const data = await answerService.fetchData(20, 10);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=GetTableWithHeadlineData',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'GetTableWithHeadlineData',
                    query: getAnswerData,
                    variables: {
                        session: defaultSession,
                        deadline: 0,
                        dataPaginationParams: {
                            isClientPaginated: true,
                            offset: 20,
                            size: 10,
                        },
                    },
                }),
            }),
        );
        expect(data.columns[0].column.id).toBe('id1');
        expect(data.data.foo).toBe(1);
    });

    test('fetchCSVBlob should call the right API', async () => {
        fetchMock.once('Bla');
        const answerService = createAnswerService();
        answerService.fetchCSVBlob(undefined, true);
        expect(fetchMock).toHaveBeenCalledWith(
            `https://tshost/prism/download/answer/csv?sessionId=${defaultSession.sessionId}&genNo=${defaultSession.genNo}&userLocale=en-us&exportFileName=data&omitInfo=true`,
            expect.objectContaining({}),
        );
    });

    test('getUnderlyingDataForPoint should call the right APIs', async () => {
        fetchMock.mockResponses(
            JSON.stringify({
                data: {
                    getSourceDetailById: [{
                        columns: [{
                            id: 'id1',
                            name: 'col1',
                        }, {
                            id: 'id2',
                            name: 'col2',
                        }, {
                            id: 'id3',
                            name: 'col3',
                        }],
                    }],
                },
            }),
            JSON.stringify({
                data: {
                    Answer__getUnaggregatedAnswer: {
                        id: {
                            ...defaultSession,
                        },
                        answer: {
                            visualizations: [{
                                columns: [{
                                    column: {
                                        id: 'oid1',
                                        name: 'col1',
                                        referencedColumns: [{
                                            guid: 'id1',
                                        }],
                                    },
                                }],
                            }],
                        },
                    },
                },
            }),
            JSON.stringify({
                data: {
                    Answer__addColumn: {
                        id: {
                            genNo: 2,
                        },
                    },
                },
            }),
            JSON.stringify({
                data: {
                    Answer__removeColumns: {
                        id: {
                            genNo: 3,
                        },
                    },
                },
            }),
        );
        const answerService = createAnswerService({
            sources: [{
                header: {
                    guid: 'source1',
                },
            }],
        }, [{
            selectedAttributes: [{
                column: {
                    id: 'oid1', // output column id
                    name: 'col1',
                    dataType: 'CHAR',
                },
                value: '1',
            }, {
                column: {
                    id: 'oid3',
                    name: 'col3',
                    dataType: 'DATE',
                },
                value: 12345,
            }],
            selectedMeasures: [],
        }]);
        const underlying = await answerService.getUnderlyingDataForPoint(['col2']);
        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(underlying.getSession().genNo).toBe(3);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=RemoveColumns',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'RemoveColumns',
                    query: removeColumns,
                    variables: {
                        session: {
                            ...defaultSession,
                            genNo: 2,
                        },
                        logicalColumnIds: [
                            'id1',
                        ],
                    },
                }),
            }),
        );
    });
});
