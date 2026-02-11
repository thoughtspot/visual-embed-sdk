// import YAML from 'yaml';
import { tokenizedFetch } from '../../../tokenizedFetch';
import type {
    ColumnValue, RuntimeFilter, RuntimeFilterOp, VizPoint,
} from '../../../types';
import { deepMerge, getTypeFromValue, removeTypename } from '../../../utils';
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

export interface UnderlyingDataPoint {
    columnId: string;
    dataValue: any;
}

/**
 * AnswerService provides a simple way to work with ThoughtSpot Answers.
 *
 * This service allows you to interact with ThoughtSpot Answers programmatically,
 * making it easy to customize visualizations, filter data, and extract insights
 * directly from your application.
 *
 * You can use this service to:
 *
 * - Add or remove columns from Answers (`addColumns`, `removeColumns`, `addColumnsByName`)
 * - Apply filters to Answers (`addFilter`)
 * - Get data from Answers in different formats (JSON, CSV, PNG) (`fetchData`, `fetchCSVBlob`, `fetchPNGBlob`)
 * - Get data for specific points in visualizations (`getUnderlyingDataForPoint`)
 * - Run custom queries (`executeQuery`)
 * - Add visualizations to Liveboards (`addDisplayedVizToLiveboard`)
 *
 * @example
 * ```js
 * // Get the answer service
 * embed.on(EmbedEvent.Data, async (e) => {
 *     const service = await embed.getAnswerService();
 *     
 *     // Add columns to the answer
 *     await service.addColumnsByName(["Sales", "Region"]);
 *     
 *     // Get the data
 *     const data = await service.fetchData();
 *     console.log(data);
 * });
 * ```
 * 
 * @example
 * ```js
 * // Get data for a point in a visualization
 * embed.on(EmbedEvent.CustomAction, async (e) => {
 *     const underlying = await e.answerService.getUnderlyingDataForPoint([
 *       'Product Name',
 *       'Sales Amount'
 *     ]);
 *     
 *     const data = await underlying.fetchData(0, 100);
 *     console.log(data);
 * });
 * ```
 * 
 * @version SDK: 1.25.0| ThoughtSpot: 9.10.0.cl
 * @group Events
 */
export class AnswerService {
    private answer: Promise<any>;

    private tmlOverride = {};

    /**
     * Should not need to be called directly.
     * @param session
     * @param answer
     * @param thoughtSpotHost
     * @param selectedPoints
     */
    constructor(
        private session: SessionInterface,
        answer: any,
        private thoughtSpotHost: string,
        private selectedPoints?: VizPoint[],
    ) {
        this.session = removeTypename(session);
        this.answer = answer;
    }

    /**
     * Get the details about the source used in the answer.
     * This can be used to get the list of all columns in the data source for example.
     */
    public async getSourceDetail() {
        const sourceId = (await this.getAnswer()).sources[0].header.guid;
        return getSourceDetail(
            this.thoughtSpotHost,
            sourceId,
        );
    }

    /**
     * Remove columnIds and return updated answer session.
     * @param columnIds
     * @returns
     */
    public async removeColumns(columnIds: string[]) {
        return this.executeQuery(
            queries.removeColumns,
            {
                logicalColumnIds: columnIds,
            },
        );
    }

    /**
     * Add columnIds and return updated answer session.
     * @param columnIds
     * @returns
     */
    public async addColumns(columnIds: string[]) {
        return this.executeQuery(
            queries.addColumns,
            {
                columns: columnIds.map((colId) => ({ logicalColumnId: colId })),
            },
        );
    }

    /**
     * Add columns by names and return updated answer session.
     * @param columnNames
     * @returns
     * @example
     * ```js
     * embed.on(EmbedEvent.Data, async (e) => {
     *    const service = await embed.getAnswerService();
     *    await service.addColumnsByName([
     *      "col name 1",
     *      "col name 2"
     *    ]);
     *    console.log(await service.fetchData());
     * });
     */
    public async addColumnsByName(columnNames: string[]) {
        const sourceDetail = await this.getSourceDetail();
        const columnGuids = getGuidsFromColumnNames(sourceDetail, columnNames);
        return this.addColumns([...columnGuids]);
    }

    /**
     * Add a filter to the answer.
     * @param columnName
     * @param operator
     * @param values
     * @returns
     */
    public async addFilter(columnName: string, operator: RuntimeFilterOp, values: RuntimeFilter['values']) {
        const sourceDetail = await this.getSourceDetail();
        const columnGuids = getGuidsFromColumnNames(sourceDetail, [columnName]);
        return this.executeQuery(
            queries.addFilter,
            {
                params: {
                    filterContent: [{
                        filterType: operator,
                        value: values.map(
                            (v) => {
                                const [type, prefix] = getTypeFromValue(v);
                                return {
                                    type: type.toUpperCase(),
                                    [`${prefix}Value`]: v,
                                };
                            },
                        ),
                    }],
                    filterGroupId: {
                        logicalColumnId: columnGuids.values().next().value,
                    },
                },
            },
        );
    }

    public async updateDisplayMode(displayMode = "TABLE_MODE") {
        return this.executeQuery(
            queries.updateDisplayMode,
            {
                displayMode,
            },
        );
    }

    public async getSQLQuery(fetchSQLWithAllColumns = false): Promise<string> {
        if (fetchSQLWithAllColumns) {
            await this.updateDisplayMode("TABLE_MODE");
        }
        const { sql } = await this.executeQuery(
            queries.getSQLQuery,
            {},
        );
        return sql;
    }

    /**
     * Fetch data from the answer.
     * @param offset
     * @param size
     * @returns
     */
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
        const { columns, data } = answer.visualizations.find(
            (viz: any) => !!viz.data,
        ) || {};
        return {
            columns,
            data,
        };
    }

    /**
     * Fetch the data for the answer as a CSV blob. This might be
     * quicker for larger data.
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

    /**
     * Fetch the data for the answer as a PNG blob. This might be
     * quicker for larger data.
     * @param userLocale
     * @param includeInfo
     * @param omitBackground Omit the background in the PNG
     * @param deviceScaleFactor The scale factor for the PNG
     * @return Response
     */
    public async fetchPNGBlob(userLocale = 'en-us', omitBackground = false, deviceScaleFactor = 2): Promise<Response> {
        const fetchUrl = this.getFetchPNGBlobUrl(
            userLocale,
            omitBackground,
            deviceScaleFactor,
        );
        return tokenizedFetch(fetchUrl, {
            credentials: 'include',
        });
    }

    /**
     * Just get the internal URL for this answer's data
     * as a CSV blob.
     * @param userLocale
     * @param includeInfo
     * @returns
     */
    public getFetchCSVBlobUrl(userLocale = 'en-us', includeInfo = false): string {
        return `${this.thoughtSpotHost}/prism/download/answer/csv?sessionId=${this.session.sessionId}&genNo=${this.session.genNo}&userLocale=${userLocale}&exportFileName=data&hideCsvHeader=${!includeInfo}`;
    }

    /**
     * Just get the internal URL for this answer's data
     * as a PNG blob.
     * @param userLocale
     * @param omitBackground
     * @param deviceScaleFactor
     */
    public getFetchPNGBlobUrl(userLocale = 'en-us', omitBackground = false, deviceScaleFactor = 2): string {
        return `${this.thoughtSpotHost}/prism/download/answer/png?sessionId=${this.session.sessionId}&deviceScaleFactor=${deviceScaleFactor}&omitBackground=${omitBackground}&genNo=${this.session.genNo}&userLocale=${userLocale}&exportFileName=data`;
    }

    /**
     * Get underlying data given a point and the output column names.
     * In case of a context menu action, the selectedPoints are
     * automatically passed.
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

    /**
     * Execute a custom graphql query in the context of the answer.
     * @param query graphql query
     * @param variables graphql variables
     * @returns
     */
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

    /**
     * Get the internal session details for the answer.
     * @returns
     */
    public getSession() {
        return this.session;
    }

    public async getAnswer() {
        if (this.answer) {
            return this.answer;
        }
        this.answer = this.executeQuery(
            queries.getAnswer,
            {},
        ).then((data) => data?.answer);
        return this.answer;
    }

    public async getTML(): Promise<any> {
        const { object } = await this.executeQuery(
            queries.getAnswerTML,
            {},
        );
        const edoc = object[0].edoc;
        const YAML = await import('yaml');
        const parsedDoc = YAML.parse(edoc);
        return {
            answer: {
                ...parsedDoc.answer,
                ...this.tmlOverride,
            },
        };
    }

    public async addDisplayedVizToLiveboard(liveboardId: string) {
        const { displayMode, visualizations } = await this.getAnswer();
        const viz = getDisplayedViz(visualizations, displayMode);
        return this.executeQuery(
            queries.addVizToLiveboard,
            {
                liveboardId,
                vizId: viz.id,
            },
        );
    }

    public setTMLOverride(override: any) {
        this.tmlOverride = override;
    }
}

/**
 *
 * @param sourceDetail
 * @param colNames
 */
function getGuidsFromColumnNames(sourceDetail: any, colNames: string[]) {
    const cols = sourceDetail.columns.reduce((colSet: any, col: any) => {
        colSet[col.name.toLowerCase()] = col;
        return colSet;
    }, {});

    return new Set(colNames.map((colName) => {
        const col = cols[colName.toLowerCase()];
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

/**
 *
 * @param visualizations
 * @param displayMode
 */
function getDisplayedViz(visualizations: any[], displayMode: string) {
    if (displayMode === 'CHART_MODE') {
        return visualizations.find(
            // eslint-disable-next-line no-underscore-dangle
            (viz: any) => viz.__typename === 'ChartViz',
        );
    }
    return visualizations.find(
        // eslint-disable-next-line no-underscore-dangle
        (viz: any) => viz.__typename === 'TableViz',
    );
}
