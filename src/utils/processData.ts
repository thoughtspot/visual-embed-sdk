import { Action, OperationType } from '../types';
import { getAnswerServiceInstance } from './answerService';

export function processCustomAction(_data: any, thoughtSpotHost: string) {
    const data = _data;
    if (
        [
            OperationType.GetChartWithData,
            OperationType.GetTableWithHeadlineData,
        ].includes(data.data?.operation)
    ) {
        const { session, query, operation } = data.data;
        const answerService = getAnswerServiceInstance(
            session,
            query,
            operation,
            thoughtSpotHost,
        );
        data.answerService = answerService;
    }
    return data;
}

export function processData(data: any, thoughtSpotHost: string) {
    switch (data.type) {
        case Action.CustomAction:
            return processCustomAction(data, thoughtSpotHost);
        default:
    }
    return data;
}
