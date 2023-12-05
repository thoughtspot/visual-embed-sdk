import { tokenizedFetch } from '../../../tokenizedFetch';
import type { ColumnValue, VizPoint } from '../../../types';
import { deepMerge, removeTypename } from '../../../utils';
import { graphqlQuery } from '../graphql-request';
import { getSourceDetail } from '../sourceService';
import * as queries from './answer-queries';

export interface SessionInterface {
    sessionId: string;
    genNo: number;
    acSession: { sessionId: string; genNo: number };
}

// eslint-disable-next-line no-shadow
export enum OperationType {
    GetChartWithData = 'GetChartWithData',
    GetTableWithHeadlineData = 'GetTableWithHeadlineData',
}

interface UnderlyingDataPoint {
    columnId: string;
    dataValue: any;
}

/**
 * Class representing the answer service provided with the
 * custom action payload. This service could be used to run
 * graphql queries in the context of the answer on which the
 * custom action was triggered.
 *
 * @example
 * ```js
 *  embed.on(EmbedEvent.CustomAction, e => {
 *     const underlying = await e.answerService.getUnderlyingDataForPoint([
 *       'col name 1'
 *     ]);
 *     const data = await underlying.fetchData(0, 100);
 *  })
 * ```
 * @version SDK: 1.25.0| ThoughtSpot: 9.10.0.cl
 * @group Events
 */
export class AnswerService {
    constructor(
        private session: SessionInterface,
        private answer: any,
        private thoughtSpotHost: string,
        private selectedPoints?: VizPoint[],
    ) {
        this.session = removeTypename(session);
    }

    public async getSourceDetail() {
        const sourceId = this.answer.sources[0].header.guid;
        return getSourceDetail(
            this.thoughtSpotHost,
            sourceId,
        );
    }

    public async removeColumns(columnIds: string[]) {
        return this.executeQuery(
            queries.removeColumns,
            {
                logicalColumnIds: columnIds,
            },
        );
    }

    public async addColumns(columnIds: string[]) {
        return this.executeQuery(
            queries.addColumns,
            {
                columns: columnIds.map((colId) => ({ logicalColumnId: colId })),
            },
        );
    }

    public async fetchData(offset = 0, size = 1000) {
        const { answer } = await this.executeQuery(
            queries.getAnswerData,
            {
                deadline: 0,
                dataPaginationParams: {
                    isClientPaginated: true,
                    offset,
                    size,
                },
            },
        );
        const { columns, data } = answer.visualizations[0];
        return {
            columns,
            data,
        };
    }

    /**
     *
     * @param userLocale
     * @param includeInfo Include the CSV header in the output
     * @returns Response
     */
    public async fetchCSVBlob(userLocale = 'en-us', includeInfo = false): Promise<Response> {
        const fetchUrl = this.getFetchCSVBlobUrl(userLocale, includeInfo);
        return tokenizedFetch(fetchUrl, {
            credentials: 'include',
        });
    }

    public getFetchCSVBlobUrl(userLocale = 'en-us', includeInfo = false): string {
        return `${this.thoughtSpotHost}/prism/download/answer/csv?sessionId=${this.session.sessionId}&genNo=${this.session.genNo}&userLocale=${userLocale}&exportFileName=data&hideCsvHeader=${!includeInfo}`;
    }

    /**
     * Get underlying data given a point and the output column names.
     *
     * @param outputColumnNames
     * @param selectedPoints
     * @example
     * ```js
     *  embed.on(EmbedEvent.CustomAction, e => {
     *     const underlying = await e.answerService.getUnderlyingDataForPoint([
     *       'col name 1' // The column should exist in the data source.
     *     ]);
     *     const data = await underlying.fetchData(0, 100);
     *  })
     * ```
     * @version SDK: 1.25.0| ThoughtSpot: 9.10.0.cl
     */
    public async getUnderlyingDataForPoint(
        outputColumnNames: string[],
        selectedPoints?: UnderlyingDataPoint[],
    ): Promise<AnswerService> {
        if (!selectedPoints && !this.selectedPoints) {
            throw new Error('Needs to be triggered in context of a point');
        }

        if (!selectedPoints) {
            selectedPoints = getSelectedPointsForUnderlyingDataQuery(
                this.selectedPoints,
            );
        }

        const sourceDetail = await this.getSourceDetail();
        const ouputColumnGuids = getGuidsFromColumnNames(sourceDetail, outputColumnNames);
        const unAggAnswer = await graphqlQuery({
            query: queries.getUnaggregatedAnswerSession,
            variables: {
                session: this.session,
                columns: selectedPoints,
            },
            thoughtSpotHost: this.thoughtSpotHost,
        });
        const unaggAnswerSession = new AnswerService(
            unAggAnswer.id,
            unAggAnswer.answer,
            this.thoughtSpotHost,
        );
        const currentColumns: Set<string> = new Set(
            unAggAnswer.answer.visualizations[0].columns
                .map(
                    (c: any) => c.column.referencedColumns[0].guid,
                ),
        );

        const columnsToAdd = [...ouputColumnGuids].filter((col) => !currentColumns.has(col));
        if (columnsToAdd.length) {
            await unaggAnswerSession.addColumns(columnsToAdd);
        }

        const columnsToRemove = [...currentColumns].filter((col) => !ouputColumnGuids.has(col));
        if (columnsToRemove.length) {
            await unaggAnswerSession.removeColumns(columnsToRemove);
        }

        return unaggAnswerSession;
    }

    public async executeQuery(query: string, variables: any): Promise<any> {
        const data = await graphqlQuery({
            query,
            variables: {
                session: this.session,
                ...variables,
            },
            thoughtSpotHost: this.thoughtSpotHost,
            isCompositeQuery: false,
        });

        this.session = deepMerge(this.session, data?.id || {}) as unknown as SessionInterface;
        return data;
    }

    public getSession() {
        return this.session;
    }
}

/**
 *
 * @param sourceDetail
 * @param colNames
 */
function getGuidsFromColumnNames(sourceDetail: any, colNames: string[]) {
    const cols = sourceDetail.columns.reduce((colSet: any, col: any) => {
        colSet[col.name] = col;
        return colSet;
    }, {});

    return new Set(colNames.map((colName) => {
        const col = cols[colName];
        return col.id;
    }));
}

/**
 *
 * @param selectedPoints
 */
function getSelectedPointsForUnderlyingDataQuery(
    selectedPoints: VizPoint[],
): UnderlyingDataPoint[] {
    const underlyingDataPoint: UnderlyingDataPoint[] = [];
    /**
     *
     * @param colVal
     */
    function addPointFromColVal(colVal: ColumnValue) {
        const dataType = colVal.column.dataType;
        const id = colVal.column.id;
        let dataValue;
        if (dataType === 'DATE') {
            if (Number.isFinite(colVal.value)) {
                dataValue = [{
                    epochRange: {
                        startEpoch: colVal.value,
                    },
                }];
                // Case for custom calendar.
            } else if ((colVal.value as any)?.v) {
                dataValue = [{
                    epochRange: {
                        startEpoch: (colVal.value as any).v.s,
                        endEpoch: (colVal.value as any).v.e,
                    },
                }];
            }
        } else {
            dataValue = [{ value: colVal.value }];
        }
        underlyingDataPoint.push({
            columnId: colVal.column.id,
            dataValue,
        });
    }

    selectedPoints.forEach((p) => {
        p.selectedAttributes.forEach(addPointFromColVal);
    });
    return underlyingDataPoint;
}
