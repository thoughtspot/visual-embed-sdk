import { disable } from 'mixpanel-browser';
import * as processDataInstance from './processData';
import * as answerServiceInstance from './graphql/answerService/answerService';
import * as auth from '../auth';
import * as base from '../embed/base';
import * as embedConfigInstance from '../embed/embedConfig';
import { EmbedEvent, AuthType } from '../types';
import * as sessionInfoService from './sessionInfoService';

describe('Unit test for process data', () => {
    beforeAll(() => {
        jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve({}));
        base.init({
            thoughtSpotHost: 'https://tshost',
            authType: AuthType.None,
        });
    });
    afterEach(() => {
        jest.resetAllMocks();
    });

    const thoughtSpotHost = 'http://localhost';

    test('ProcessData, when Action is CustomAction', async () => {
        const processedData = {
            type: EmbedEvent.CustomAction,
            data: {},
        };
        jest.spyOn(processDataInstance, 'processCustomAction').mockImplementation(async () => ({}));
        expect(
            processDataInstance.processEventData(
                EmbedEvent.CustomAction,
                processedData,
                thoughtSpotHost,
                null,
            ),
        ).toEqual(
            expect.objectContaining({
                ...processedData,
                answerService: {
                    answer: {},
                    selectedPoints: undefined,
                    session: undefined,
                    thoughtSpotHost: 'http://localhost',
                    tmlOverride: {},
                },
            }),
        );
    });

    test('ProcessData, when Action is CustomAction with contextMenuPoints', async () => {
        const processedData = {
            type: EmbedEvent.CustomAction,
            data: {
                contextMenuPoints: {
                    selectedPoints: [{ x: 1, y: 2 }],
                },
            },
        };
        jest.spyOn(processDataInstance, 'processCustomAction').mockImplementation(async () => ({}));
        expect(
            processDataInstance.processEventData(
                EmbedEvent.CustomAction,
                processedData,
                thoughtSpotHost,
                null,
            ),
        ).toEqual(
            expect.objectContaining({
                ...processedData,
                answerService: {
                    answer: {},
                    selectedPoints: [{ x: 1, y: 2 }],
                    session: undefined,
                    thoughtSpotHost: 'http://localhost',
                    tmlOverride: {},
                },
            }),
        );
    });

    test('ProcessData, when Action is non CustomAction', () => {
        const processedData = { type: EmbedEvent.Data };
        jest.spyOn(processDataInstance, 'processCustomAction').mockImplementation(async () => ({}));
        processDataInstance.processEventData(EmbedEvent.Data, processedData, thoughtSpotHost, null);
        expect(processDataInstance.processCustomAction).not.toBeCalled();
    });

    test('AuthInit', () => {
        const sessionInfo = {
            userGUID: '1234',
            mixpanelToken: 'abc123',
            isPublicUser: false,
        };
        const e = { type: EmbedEvent.AuthInit, data: sessionInfo };
        jest.spyOn(base, 'notifyAuthSuccess');
        jest.spyOn(sessionInfoService, 'getSessionInfo').mockReturnValue(sessionInfo);
        expect(processDataInstance.processEventData(e.type, e, '', null)).toEqual({
            type: e.type,
            data: {
                userGUID: sessionInfo.userGUID,
            },
        });
        expect(base.notifyAuthSuccess).toBeCalled();
    });

    test('NoCookieAccess no suppress alert', () => {
        const e = { type: EmbedEvent.NoCookieAccess };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            suppressNoCookieAccessAlert: false,
        });
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toBeCalledWith(auth.AuthFailureType.NO_COOKIE_ACCESS);
        expect(window.alert).toBeCalled();
        expect(el.innerHTML).toBe('Hello');
    });

    test('NoCookieAccess suppressAlert=true', () => {
        const e = { type: EmbedEvent.NoCookieAccess };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            suppressNoCookieAccessAlert: true,
        });
        jest.spyOn(window, 'alert').mockReset();
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toBeCalledWith(auth.AuthFailureType.NO_COOKIE_ACCESS);
        expect(window.alert).not.toBeCalled();
        expect(el.innerHTML).toBe('Hello');
    });

    test('NoCookieAccess ignoreNoCookieAccess=true', () => {
        const e = { type: EmbedEvent.NoCookieAccess };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            ignoreNoCookieAccess: true,
        });
        jest.spyOn(window, 'alert').mockReset();
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toBeCalledWith(auth.AuthFailureType.NO_COOKIE_ACCESS);
        expect(window.alert).not.toBeCalled();
        expect(el.innerHTML).not.toBe('Hello');
    });

    test('process authFailure', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
        });
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toBeCalledWith(auth.AuthFailureType.OTHER);
        expect(el.innerHTML).toBe('Hello');
    });

    test('process authFailure AuthType=None', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.None,
        });
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).not.toBeCalled();
        expect(el.innerHTML).not.toBe('Hello');
    });

    test('process authLogout', () => {
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockRestore();
        base.init({
            loginFailedMessage: 'Hello',
            autoLogin: true,
            thoughtSpotHost: 'https://tshost',
            authType: AuthType.None,
        });
        const e = { type: EmbedEvent.AuthLogout };
        jest.spyOn(base, 'notifyLogout');
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyLogout).toBeCalled();
        expect(el.innerHTML).toBe('Hello');
        expect(embedConfigInstance.getEmbedConfig().autoLogin).toBe(false);
    });

    test('process authFailure AuthType=None', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.EmbeddedSSO,
            disableLoginFailurePage: true,
        });
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).not.toBeCalled();
        expect(el.innerHTML).not.toBe('Hello');
    });

    test('process authFailure AuthType=TrustedAuthToken and autoLogin true', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.TrustedAuthToken,
            autoLogin: true,
        });
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toBeCalledWith(auth.AuthFailureType.IDLE_SESSION_TIMEOUT);
        expect(el.innerHTML).toBe('Hello');
    });

    test('process authFailure with TrustedAuthTokenCookieless and autoLogin', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.TrustedAuthTokenCookieless,
            autoLogin: true,
        });
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toBeCalledWith(auth.AuthFailureType.IDLE_SESSION_TIMEOUT);
        expect(el.innerHTML).toBe('Hello');
    });
});
