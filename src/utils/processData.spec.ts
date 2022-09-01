import * as processDataInstance from './processData';
import * as answerServiceInstance from './answerService';
import * as auth from '../auth';
import * as base from '../embed/base';
import { EmbedEvent, OperationType, AuthType } from '../types';

describe('Unit test for process data', () => {
    beforeAll(() => {
        base.init({
            thoughtSpotHost: '',
            authType: AuthType.None,
        });
    });
    afterEach(() => {
        jest.resetAllMocks();
    });

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
            processDataInstance.processEventData(
                EmbedEvent.CustomAction,
                processedData,
                thoughtSpotHost,
                null,
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
        processDataInstance.processEventData(
            EmbedEvent.Data,
            processedData,
            thoughtSpotHost,
            null,
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
        jest.spyOn(base, 'notifyAuthSuccess');
        expect(
            processDataInstance.processEventData(e.type, e, '', null),
        ).toEqual({
            type: e.type,
            data: {
                userGUID: sessionInfo.userGUID,
            },
        });
        expect(auth.initSession).toBeCalledWith(sessionInfo);
        expect(base.notifyAuthSuccess).toBeCalled();
    });

    test('AuthExpire autoLogin false', () => {
        const e = { type: EmbedEvent.AuthExpire };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(base, 'handleAuth');
        jest.spyOn(base, 'getEmbedConfig').mockReturnValue({
            autoLogin: false,
        });
        expect(
            processDataInstance.processEventData(e.type, e, '', null),
        ).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toBeCalledWith(
            auth.AuthFailureType.EXPIRY,
        );
        expect(base.handleAuth).not.toHaveBeenCalled();
    });

    test('AuthExpire autoLogin true', () => {
        const e = { type: EmbedEvent.AuthExpire };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(base, 'handleAuth').mockResolvedValue(true);
        jest.spyOn(base, 'getEmbedConfig').mockReturnValue({
            autoLogin: true,
        });
        expect(
            processDataInstance.processEventData(e.type, e, '', null),
        ).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toBeCalledWith(
            auth.AuthFailureType.EXPIRY,
        );
        expect(base.handleAuth).toBeCalled();
    });

    test('NoCookieAccess no suppress alert', () => {
        const e = { type: EmbedEvent.NoCookieAccess };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(base, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            suppressNoCookieAccessAlert: false,
        });
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual(
            {
                type: e.type,
            },
        );
        expect(base.notifyAuthFailure).toBeCalledWith(
            auth.AuthFailureType.NO_COOKIE_ACCESS,
        );
        expect(window.alert).toBeCalled();
        expect(el.innerHTML).toBe('Hello');
    });

    test('NoCookieAccess suppressAlert=true', () => {
        const e = { type: EmbedEvent.NoCookieAccess };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(base, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            suppressNoCookieAccessAlert: true,
        });
        jest.spyOn(window, 'alert').mockReset();
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual(
            {
                type: e.type,
            },
        );
        expect(base.notifyAuthFailure).toBeCalledWith(
            auth.AuthFailureType.NO_COOKIE_ACCESS,
        );
        expect(window.alert).not.toBeCalled();
        expect(el.innerHTML).toBe('Hello');
    });

    test('process authFailure', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(base, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
        });
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual(
            {
                type: e.type,
            },
        );
        expect(base.notifyAuthFailure).toBeCalledWith(
            auth.AuthFailureType.OTHER,
        );
        expect(el.innerHTML).toBe('Hello');
    });

    test('process authFailure AuthType=None', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(base, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.None,
        });
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual(
            {
                type: e.type,
            },
        );
        expect(base.notifyAuthFailure).not.toBeCalled();
        expect(el.innerHTML).not.toBe('Hello');
    });

    test('process authLogout', () => {
        base.init({
            loginFailedMessage: 'Hello',
            autoLogin: true,
            thoughtSpotHost: '',
            authType: AuthType.None,
        });
        jest.spyOn(base, 'getEmbedConfig').mockRestore();
        const e = { type: EmbedEvent.AuthLogout };
        jest.spyOn(base, 'notifyLogout');
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual(
            {
                type: e.type,
            },
        );
        expect(base.notifyLogout).toBeCalled();
        expect(el.innerHTML).toBe('Hello');
        expect(base.getEmbedConfig().autoLogin).toBe(false);
    });
});
