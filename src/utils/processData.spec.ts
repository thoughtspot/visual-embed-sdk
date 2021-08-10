import * as processDataInstance from './processData';
import * as answerServiceInstance from './answerService';
import * as auth from '../auth';
import { EmbedEvent, OperationType } from '../types';

describe('Unit test for process data', () => {
    const thoughtSpotHost = 'http://localhost';
    test('processDataInstance, when operation is GetChartWithData', () => {
        const answerService = {};
        const processChartData = {
            answerService,
            data: {
                session: 'session',
                query: 'query',
                operation: OperationType.GetChartWithData,
            },
        };
        jest.spyOn(
            answerServiceInstance,
            'getAnswerServiceInstance',
        ).mockReturnValue(answerService);
        expect(
            processDataInstance.processCustomAction(
                processChartData,
                thoughtSpotHost,
            ),
        ).toStrictEqual(processChartData);
    });

    test('ProcessData, when Action is CustomAction', async () => {
        const processedData = { type: EmbedEvent.CustomAction };
        jest.spyOn(
            processDataInstance,
            'processCustomAction',
        ).mockImplementation(async () => ({}));
        expect(
            processDataInstance.getProcessData(
                EmbedEvent.CustomAction,
                processedData,
                thoughtSpotHost,
            ),
        ).toStrictEqual(processedData);
    });

    test('ProcessData, when Action is non CustomAction', () => {
        const processedData = { type: EmbedEvent.Data };
        jest.spyOn(
            processDataInstance,
            'processCustomAction',
        ).mockImplementation(async () => ({}));
        jest.spyOn(
            answerServiceInstance,
            'getAnswerServiceInstance',
        ).mockImplementation(async () => ({}));
        processDataInstance.getProcessData(
            EmbedEvent.Data,
            processedData,
            thoughtSpotHost,
        );
        expect(processDataInstance.processCustomAction).not.toBeCalled();
    });

    test('AuthInit', () => {
        const sessionInfo = {
            userGUID: '1234',
            mixpanelToken: 'abc123',
            isPublicUser: false,
        };
        const e = { type: EmbedEvent.AuthInit, data: sessionInfo };
        jest.spyOn(auth, 'initSession').mockReturnValue(null);
        expect(processDataInstance.getProcessData(e.type, e, '')).toEqual({
            type: e.type,
            data: {
                userGUID: sessionInfo.userGUID,
            },
        });
        expect(auth.initSession).toBeCalledWith(sessionInfo);
    });
});
