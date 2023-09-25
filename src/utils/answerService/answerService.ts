import { deepMerge, getOperationNameFromQuery } from "../../utils";


export interface SessionInterface {
    sessionId: string;
    genNo: number;
    acSession: { sessionId: string; genNo: number };
}

import * as queries from './graphql-queries';
// eslint-disable-next-line no-shadow
export enum OperationType {
    GetChartWithData = 'GetChartWithData',
    GetTableWithHeadlineData = 'GetTableWithHeadlineData',
}


export class AnswerService {
    constructor(
        private session: SessionInterface,
        private answer: any,
        private thoughtSpotHost: string) {

    }

    public async getSourceDetail() {
        const details = await graphqlQuery({
            query: queries.getSourceDetail,
            variables: {
                ids: [this.answer.sources[0].header.guid]
            },
            thoughtSpotHost: this.thoughtSpotHost
        });
        return details[0];
    }

    public async removeColumns(columnIds: string[]) {
        return this.executeQuery(
            queries.removeColumns,
            {
                logicalColumnIds: columnIds,
                updateOnlyPhrases: false,
            },
        )
    }

    public async addColumns(columnIds: string[]) {
        return this.executeQuery(
            queries.addColumns,
            {
                columns: columnIds.map(colId => ({ logicalColumnId: colId })),
                updateOnlyPhrases: false,
            },
        )
    }

    public async fetchData(offset: number = 0, size: number = 1000) {
        return this.executeQuery(
            queries.getAnswerData,
            {
                deadline: 0,
                dataPaginationParams: {
                    isClientPaginated: true,
                    offset,
                    size
                }
            }
        )
    }

    public async getUnderlyingDataForPoint(
        selectedPoint: { columnId: string, dataValue: any }[],
        outputColumnNames: string[],
        offset: number,
        size: number
    ) {
        const sourceDetail = await this.getSourceDetail();
        const ouputColumnGuids = getGuidsFromColumnNames(sourceDetail, outputColumnNames);
        const unAggAnswer = await graphqlQuery({
            query: queries.getUnaggregatedAnswerSession,
            variables: {
                session: this.session,
                columns: selectedPoint,
            },
            thoughtSpotHost: this.thoughtSpotHost
        });
        const unaggAnswerSession = new AnswerService(unAggAnswer.id, unAggAnswer.answer, this.thoughtSpotHost);
        const currentColumns: Set<string> = new Set(unAggAnswer.answer.visualizations[0].columns.map((c: any) => c.column.id));

        const columnsToRemove = [...currentColumns].filter(col => !ouputColumnGuids.has(col));
        await unaggAnswerSession.removeColumns(columnsToRemove);

        const columnsToAdd = [...ouputColumnGuids].filter(col => !currentColumns.has(col));
        await unaggAnswerSession.addColumns(columnsToAdd);

        return unaggAnswerSession.fetchData(offset, size);
    }


    public async executeQuery(query: string, variables: any) {
        const data = await graphqlQuery({
            query,
            variables: {
                session: this.session,
                ...variables
            },
            thoughtSpotHost: this.thoughtSpotHost,
            isCompositeQuery: false,
        });
        deepMerge(this.session, data.id);
    }
}

async function graphqlQuery({
    query,
    variables,
    thoughtSpotHost,
    isCompositeQuery = false
}: {
    query: string,
    variables: any,
    thoughtSpotHost: string,
    isCompositeQuery?: boolean
}) {
    const operationName = getOperationNameFromQuery(query);
    try {
        const response = await fetch(`${thoughtSpotHost}/prism/?op=${operationName}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json;charset=UTF-8',
                'x-requested-by': 'ThoughtSpot',
                accept: '*/*',
                'accept-language': 'en-us',
            },
            body: JSON.stringify({
                operationName,
                query,
                variables,
            }),
            credentials: 'include',
        });
        const result = await response.json();
        const dataValues = Object.values(result.data);
        return (isCompositeQuery) ? result.data : dataValues[0];
    } catch (error) {
        return error;
    }
}

function getGuidsFromColumnNames(sourceDetail: any, colNames: string[]) {
    const cols = sourceDetail.columns.reduce((colSet: any, col: any) => {
        colSet[col.name] = col;
        return colSet;
    }, {});

    return new Set(colNames.map(colName => {
        const col = cols[colName];
        return col.id;
    }));
}