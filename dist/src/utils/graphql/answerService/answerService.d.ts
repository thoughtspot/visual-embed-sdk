import type { RuntimeFilter, RuntimeFilterOp, VizPoint } from '../../../types';
export interface SessionInterface {
    sessionId: string;
    genNo: number;
    acSession: {
        sessionId: string;
        genNo: number;
    };
}
export declare enum OperationType {
    GetChartWithData = "GetChartWithData",
    GetTableWithHeadlineData = "GetTableWithHeadlineData"
}
export interface UnderlyingDataPoint {
    columnId: string;
    dataValue: any;
}
export declare const DATA_TYPES: string[];
/**
 * AnswerService provides a simple way to work with ThoughtSpot Answers.
 *
 * This service allows you to interact with ThoughtSpot Answers programmatically,
 * making it easy to customize visualizations, filter data, and extract insights
 * directly from your application.
 *
 * You can use this service to:
 *
 * - Add or remove columns from Answers (`addColumns`, `removeColumns`,
 * `addColumnsByName`)
 * - Apply filters to Answers (`addFilter`)
 * - Get data from Answers in different formats (JSON, CSV, PNG) (`fetchData`,
 * `fetchCSVBlob`, `fetchPNGBlob`)
 * - Get data for specific points in visualizations
 * (`getUnderlyingDataForPoint`)
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
 * @version SDK: 1.25.0 | ThoughtSpot: 9.10.0.cl
 * @group Events
 */
export declare class AnswerService {
    private session;
    private thoughtSpotHost;
    private selectedPoints?;
    private answer;
    private tmlOverride;
    /**
     * Should not need to be called directly.
     * @param session
     * @param answer
     * @param thoughtSpotHost
     * @param selectedPoints
     */
    constructor(session: SessionInterface, answer: any, thoughtSpotHost: string, selectedPoints?: VizPoint[]);
    /**
     * Get the details about the source used in the answer.
     * This can be used to get the list of all columns in the data source for example.
     */
    getSourceDetail(): Promise<any>;
    /**
     * Remove columnIds and return updated answer session.
     * @param columnIds
     * @returns
     */
    removeColumns(columnIds: string[]): Promise<any>;
    /**
     * Add columnIds and return updated answer session.
     * @param columnIds
     * @returns
     */
    addColumns(columnIds: string[]): Promise<any>;
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
     * ```
     */
    addColumnsByName(columnNames: string[]): Promise<any>;
    /**
     * Add a filter to the answer.
     * @param columnName
     * @param operator
     * @param values
     * @returns
     */
    addFilter(columnName: string, operator: RuntimeFilterOp, values: RuntimeFilter['values']): Promise<any>;
    updateDisplayMode(displayMode?: string): Promise<any>;
    getSQLQuery(fetchSQLWithAllColumns?: boolean): Promise<string>;
    /**
     * Fetch data from the answer.
     * @param offset
     * @param size
     * @returns
     */
    fetchData(offset?: number, size?: number): Promise<{
        columns: any;
        data: any;
    }>;
    /**
     * Fetch the data for the answer as a CSV blob. This might be
     * quicker for larger data.
     * @param userLocale
     * @param includeInfo Include the CSV header in the output
     * @returns Response
     */
    fetchCSVBlob(userLocale?: string, includeInfo?: boolean): Promise<Response>;
    /**
     * Fetch the data for the answer as a PNG blob. This might be
     * quicker for larger data.
     * @param userLocale
     * @param includeInfo
     * @param omitBackground Omit the background in the PNG
     * @param deviceScaleFactor The scale factor for the PNG
     * @return Response
     */
    fetchPNGBlob(userLocale?: string, omitBackground?: boolean, deviceScaleFactor?: number): Promise<Response>;
    /**
     * Just get the internal URL for this answer's data
     * as a CSV blob.
     * @param userLocale
     * @param includeInfo
     * @returns
     */
    getFetchCSVBlobUrl(userLocale?: string, includeInfo?: boolean): string;
    /**
     * Just get the internal URL for this answer's data
     * as a PNG blob.
     * @param userLocale
     * @param omitBackground
     * @param deviceScaleFactor
     */
    getFetchPNGBlobUrl(userLocale?: string, omitBackground?: boolean, deviceScaleFactor?: number): string;
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
     * @version SDK: 1.25.0 | ThoughtSpot: 9.10.0.cl
     */
    getUnderlyingDataForPoint(outputColumnNames: string[], selectedPoints?: UnderlyingDataPoint[]): Promise<AnswerService>;
    /**
     * Execute a custom graphql query in the context of the answer.
     * @param query graphql query
     * @param variables graphql variables
     * @returns
     */
    executeQuery(query: string, variables: any): Promise<any>;
    /**
     * Get the internal session details for the answer.
     * @returns
     */
    getSession(): SessionInterface;
    getAnswer(): Promise<any>;
    getTML(): Promise<any>;
    addDisplayedVizToLiveboard(liveboardId: string): Promise<any>;
    setTMLOverride(override: any): void;
}
//# sourceMappingURL=answerService.d.ts.map