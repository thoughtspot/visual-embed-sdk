import 'jest-fetch-mock';
import { AuthType, RuntimeFilterOp, VizPoint } from '../../../types';
import { AnswerService } from './answerService';
import {
    getAnswerData, removeColumns, addFilter, addColumns,
    getSQLQuery,
} from './answer-queries';
import * as queries from './answer-queries';
import * as authTokenInstance from '../../../authToken';
import * as tokenizedFetch from '../../../tokenizedFetch';
import * as embedConfigInstance from '../../../embed/embedConfig';

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

    test('should call executeQuery with correct parameters to add columns', async () => {
        const service = createAnswerService();
        const executeQuerySpy = jest.spyOn(service, 'executeQuery').mockResolvedValue({
            id: { genNo: 2 },

        });

        const columnIds = ['col1', 'col2'];
        const result = await service.addColumns(columnIds);

        expect(executeQuerySpy).toHaveBeenCalledWith(queries.addColumns, {
            columns: columnIds.map((colId) => ({ logicalColumnId: colId })),
        });
        expect(result.id.genNo).toBe(2);
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
        expect(fetchMock).toHaveBeenCalledWith('https://tshost/prism/?op=Bla', expect.objectContaining({
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
                            id: 'vizId',
                        }, {
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

    test('fetchCSVBlob should call the right API', () => {
        fetchMock.once('Bla');
        const answerService = createAnswerService();

        const mockEmbedConfig = {
            thougthspotHost: '/test',
            authType: AuthType.TrustedAuthTokenCookieless,
        };
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValueOnce(mockEmbedConfig as any);
        jest.spyOn(authTokenInstance, 'getAuthenticationToken').mockReturnValueOnce(Promise.resolve('token'));
        const mockTokenizedFetch = jest.spyOn(tokenizedFetch, 'tokenizedFetch');
        answerService.fetchCSVBlob(undefined, true);

        expect(mockTokenizedFetch).toHaveBeenCalledWith(
            `https://tshost/prism/download/answer/csv?sessionId=${defaultSession.sessionId}&genNo=${defaultSession.genNo}&userLocale=en-us&exportFileName=data&hideCsvHeader=false`,
            expect.objectContaining({}),
        );

        answerService.fetchCSVBlob('en-uk', true);
        expect(mockTokenizedFetch).toHaveBeenCalledWith(
            `https://tshost/prism/download/answer/csv?sessionId=${defaultSession.sessionId}&genNo=${defaultSession.genNo}&userLocale=en-uk&exportFileName=data&hideCsvHeader=false`,
            expect.objectContaining({}),
        );

        answerService.fetchCSVBlob(undefined, false);
        expect(mockTokenizedFetch).toHaveBeenCalledWith(
            `https://tshost/prism/download/answer/csv?sessionId=${defaultSession.sessionId}&genNo=${defaultSession.genNo}&userLocale=en-us&exportFileName=data&hideCsvHeader=true`,
            expect.objectContaining({}),
        );
    });

    test('fetchPNGBlob should call the right API', () => {
        const answerService = createAnswerService();

        const mockEmbedConfig = {
            thougthspotHost: '/test',
            authType: AuthType.TrustedAuthTokenCookieless,
        };
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValueOnce(mockEmbedConfig as any);
        jest.spyOn(authTokenInstance, 'getAuthenticationToken').mockReturnValueOnce(Promise.resolve('token'));
        const mockTokenizedFetch = jest.spyOn(tokenizedFetch, 'tokenizedFetch');
        answerService.fetchPNGBlob(undefined, true);

        expect(mockTokenizedFetch).toHaveBeenCalledWith(`https://tshost/prism/download/answer/png?sessionId=${defaultSession.sessionId}&deviceScaleFactor=2&omitBackground=true&genNo=${defaultSession.genNo}&userLocale=en-us&exportFileName=data`, expect.objectContaining({}));

        answerService.fetchPNGBlob('en-uk', true);
        expect(mockTokenizedFetch).toHaveBeenCalledWith(`https://tshost/prism/download/answer/png?sessionId=${defaultSession.sessionId}&deviceScaleFactor=2&omitBackground=true&genNo=${defaultSession.genNo}&userLocale=en-uk&exportFileName=data`, expect.objectContaining({}));

        answerService.fetchPNGBlob(undefined, false);
        expect(mockTokenizedFetch).toHaveBeenCalledWith(`https://tshost/prism/download/answer/png?sessionId=${defaultSession.sessionId}&deviceScaleFactor=2&omitBackground=false&genNo=${defaultSession.genNo}&userLocale=en-us&exportFileName=data`, expect.objectContaining({}));

        answerService.fetchPNGBlob(undefined, true, 3);
        expect(mockTokenizedFetch).toHaveBeenCalledWith(`https://tshost/prism/download/answer/png?sessionId=${defaultSession.sessionId}&deviceScaleFactor=3&omitBackground=true&genNo=${defaultSession.genNo}&userLocale=en-us&exportFileName=data`, expect.objectContaining({}));
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
            }, {
                column: {
                    id: 'oid4',
                    name: 'col4',
                    dataType: 'DATE',
                },
                value: {
                    v: {
                        s: 12345,
                        e: 54321,
                    },
                },
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

    test('getUnderlyingDataForPoint should throw when no point is selected', async () => {
        const answerService = createAnswerService({}, null);
        await expect(answerService.getUnderlyingDataForPoint(['col2'])).rejects.toThrow();
    });

    test('addFilter should call the right API', async () => {
        fetchMock.mockResponses(
            JSON.stringify({
                data: {
                    getSourceDetailById: [{
                        columns: [{
                            id: 'id1',
                            name: 'col1',
                        }],
                    }],
                },
            }),
            JSON.stringify({
                data: {
                    Answer__addUpdateFilter: {
                        id: {
                            genNo: 2,
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
        });
        const session = await answerService.addFilter('col1', RuntimeFilterOp.IN, [2]);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=AddUpdateFilter',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'AddUpdateFilter',
                    query: addFilter,
                    variables: {
                        session: defaultSession,
                        params: {
                            filterContent: [{
                                filterType: 'IN',
                                value: [{
                                    type: 'DOUBLE',
                                    doubleValue: 2,
                                }],
                            }],
                            filterGroupId: {
                                logicalColumnId: 'id1',
                            },
                        },
                    },
                }),
            }),
        );
    });

    test('Should fetch answer if not passed', async () => {
        fetchMock.mockResponses(JSON.stringify({
            data: {
                getAnswer: {
                    id: {},
                    answer: {
                        visualizations: [{
                            columns: [{
                                column: {
                                    id: 'id1',
                                    name: 'col1',
                                },
                            }],
                        }],
                        sources: [{
                            header: {
                                guid: 'source1',
                                displayName: 'source1',
                            },
                        }],
                        filterGroups: [],
                    },
                },
            },
        }));
        const answerService = new AnswerService(defaultSession, null, 'https://tshost');
        const answer = await answerService.getAnswer();
        expect(answer.sources[0].header.guid).toBe('source1');
    });

    test('Add columns by name should call the right API', async () => {
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
                        }],
                    }],
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
        );
        const answerService = createAnswerService({
            sources: [{
                header: {
                    guid: 'source1',
                },
            }],
        });
        const session = await answerService.addColumnsByName(['col1']);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=AddColumns',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'AddColumns',
                    query: addColumns,
                    variables: {
                        session: defaultSession,
                        columns: [{
                            logicalColumnId: 'id1',
                        }],
                    },
                }),
            }),
        );
    });

    test('Get SQL query should call the right API', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            data: {
                Answer__getQuery: {
                    sql: 'SELECT * FROM table',
                },
            },
        }));
        const answerService = createAnswerService();
        const sql = await answerService.getSQLQuery();
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=GetSQLQuery',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'GetSQLQuery',
                    query: getSQLQuery,
                    variables: {
                        session: defaultSession,
                    },
                }),
            }),
        );
        expect(sql).toBe('SELECT * FROM table');
    });

    test('Get SQL query with all columns should update display mode', async () => {
        fetchMock.mockResponses(
            JSON.stringify({
                data: {
                    Answer__updateProperties: {
                        id: {
                            ...defaultSession,
                        },
                        answer: {
                            id: 'answer1',
                            displayMode: 'TABLE_MODE',
                            suggestedDisplayMode: 'CHART_MODE',
                        },
                    },
                },
            }),
            JSON.stringify({
                data: {
                    Answer__getQuery: {
                        sql: 'SELECT * FROM table',
                    },
                },
            }),
        );
        const answerService = createAnswerService();
        const sql = await answerService.getSQLQuery(true);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=UpdateDisplayMode',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'UpdateDisplayMode',
                    query: queries.updateDisplayMode,
                    variables: {
                        session: defaultSession,
                        displayMode: 'TABLE_MODE',
                    },
                }),
            }),
        );
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=GetSQLQuery',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'GetSQLQuery',
                    query: getSQLQuery,
                    variables: {
                        session: defaultSession,
                    },
                }),
            }),
        );
        expect(sql).toBe('SELECT * FROM table');
    });

    test('Update display mode should call the right API', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            data: {
                Answer__updateProperties: {
                    id: {
                        ...defaultSession,
                    },
                    answer: {
                        id: 'answer1',
                        displayMode: 'CHART_MODE',
                        suggestedDisplayMode: 'TABLE_MODE',
                    },
                },
            },
        }));
        const answerService = createAnswerService();
        const response = await answerService.updateDisplayMode('CHART_MODE');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=UpdateDisplayMode',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'UpdateDisplayMode',
                    query: queries.updateDisplayMode,
                    variables: {
                        session: defaultSession,
                        displayMode: 'CHART_MODE',
                    },
                }),
            }),
        );
        expect(response.answer.displayMode).toBe('CHART_MODE');
    });

    test('Add displayed Viz should call the right API', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            data: {
                Answer__addDisplayedViz: {
                    id: {
                        genNo: 2,
                    },
                },
            },
        }));
        const answer = {
            displayMode: 'CHART_MODE',
            visualizations: [{
                id: 'table1',
                __typename: 'TableViz',
            }, {
                id: 'chart1',
                __typename: 'ChartViz',
            }],
        };
        const answerService = createAnswerService(answer);
        await answerService.addDisplayedVizToLiveboard('lbId');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=AddVizToLiveboard',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'AddVizToLiveboard',
                    query: queries.addVizToLiveboard,
                    variables: {
                        session: defaultSession,
                        liveboardId: 'lbId',
                        vizId: 'chart1',
                    },
                }),
            }),
        );

        answer.displayMode = 'TABLE_MODE';
        const answerService2 = createAnswerService(answer);
        await answerService2.addDisplayedVizToLiveboard('lbId');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=AddVizToLiveboard',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'AddVizToLiveboard',
                    query: queries.addVizToLiveboard,
                    variables: {
                        session: defaultSession,
                        liveboardId: 'lbId',
                        vizId: 'table1',
                    },
                }),
            }),
        );
    });

    test('GetTML should call the right API', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            data: {
                UnsavedAnswer_getTML: {
                    object: [{
                        edoc: `answer: 
                            id: bar`,
                    }],
                },
            },
        }));
        const answerService = createAnswerService();
        answerService.setTMLOverride({ name: 'name' });
        const { answer } = await answerService.getTML();
        expect(fetchMock).toHaveBeenCalledWith(
            'https://tshost/prism/?op=GetUnsavedAnswerTML',
            expect.objectContaining({
                body: JSON.stringify({
                    operationName: 'GetUnsavedAnswerTML',
                    query: queries.getAnswerTML,
                    variables: {
                        session: defaultSession,
                    },
                }),
            }),
        );
        expect(answer.name).toBe('name');
        expect(answer.id).toBe('bar');
    });
});
