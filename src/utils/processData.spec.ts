import * as processDataInstance from './processData';
import * as answerServiceInstance from './answerService';
import { Action, OperationType } from '../types';

describe('Unit test for process data', () => {
    const thoughtSpotHost = 'http://localhost';
    test('processDataInstance, when operation is GetChartWithData', () => {
        const processChartData = {
            data: {
                session: 'session',
                query: 'query',
                operation: OperationType.GetChartWithData,
            },
        };
        jest.spyOn(
            answerServiceInstance,
            'getAnswerServiceInstance',
        ).mockImplementation(async () => ({}));
        expect(
            processDataInstance.processCustomAction(
                processChartData,
                thoughtSpotHost,
            ),
        ).toStrictEqual(processChartData);
    });

    test('ProcessData, when Action is CustomAction', async () => {
        const processedData = { type: Action.CustomAction };
        jest.spyOn(
            processDataInstance,
            'processCustomAction',
        ).mockImplementation(async () => ({}));
        expect(
            processDataInstance.processData(processedData, thoughtSpotHost),
        ).toStrictEqual(processedData);
    });

    test('ProcessData, when Action is non CustomAction', () => {
        const processedData = { type: 'Action' };
        jest.spyOn(
            processDataInstance,
            'processCustomAction',
        ).mockImplementation(async () => ({}));
        jest.spyOn(
            answerServiceInstance,
            'getAnswerServiceInstance',
        ).mockImplementation(async () => ({}));
        processDataInstance.processData(processedData, thoughtSpotHost);
        expect(processDataInstance.processCustomAction).not.toBeCalled();
    });
});
