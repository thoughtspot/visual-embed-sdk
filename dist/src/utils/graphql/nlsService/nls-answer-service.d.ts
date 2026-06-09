import { AnswerService } from '../answerService/answerService';
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
export declare const getAnswerFromQuery: (query: string, worksheetId: string) => Promise<{
    answer: AnswerService;
    suggestion: any;
}>;
//# sourceMappingURL=nls-answer-service.d.ts.map