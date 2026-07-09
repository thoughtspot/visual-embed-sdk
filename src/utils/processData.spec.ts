import * as processDataInstance from './processData';
import * as answerServiceInstance from './graphql/answerService/answerService';
import * as auth from '../auth';
import * as base from '../embed/base';
import * as embedConfigInstance from '../embed/embedConfig';
import { EmbedEvent, AuthType } from '../types';
import * as sessionInfoService from './sessionInfoService';
import * as utilsModule from '../utils';
import { logger } from './logger';

describe('Unit test for process data', () => {
    beforeAll(() => {
        jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
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

    test('ProcessData QueryChanged default branch returns payload unchanged', () => {
        const e = { type: EmbedEvent.QueryChanged, data: { query: 'revenue by region' } };
        expect(processDataInstance.processEventData(EmbedEvent.QueryChanged, e, thoughtSpotHost, null)).toEqual(e);
    });

    test('ProcessData, when Action is non CustomAction', () => {
        const processedData = { type: EmbedEvent.Data };
        jest.spyOn(processDataInstance, 'processCustomAction').mockImplementation(async () => ({}));
        processDataInstance.processEventData(EmbedEvent.Data, processedData, thoughtSpotHost, null);
        expect(processDataInstance.processCustomAction).not.toHaveBeenCalled();
    });

    test('AuthInit', () => {
        const sessionInfo = {
            userGUID: '1234',
            mixpanelToken: 'abc123',
            isPublicUser: false,
        };
        const e = { type: EmbedEvent.AuthInit, data: sessionInfo };
        jest.spyOn(base, 'notifyAuthSuccess');
        jest.spyOn(sessionInfoService, 'getSessionInfo').mockImplementation(() => Promise.resolve(sessionInfo as any));
        expect(processDataInstance.processEventData(e.type, e, '', null)).toEqual({
            type: e.type,
            data: {
                userGUID: sessionInfo.userGUID,
            },
        });
        expect(base.notifyAuthSuccess).toHaveBeenCalled();
    });

    test('NoCookieAccess no suppress alert', () => {
        const e = { type: EmbedEvent.NoCookieAccess };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            suppressNoCookieAccessAlert: false,
        } as any);
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toHaveBeenCalledWith(auth.AuthFailureType.NO_COOKIE_ACCESS);
        expect(window.alert).toHaveBeenCalled();
        expect(el.innerHTML).toBe('Hello');
    });

    test('NoCookieAccess suppressAlert=true', () => {
        const e = { type: EmbedEvent.NoCookieAccess };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            suppressNoCookieAccessAlert: true,
        } as any);
        jest.spyOn(window, 'alert').mockReset();
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toHaveBeenCalledWith(auth.AuthFailureType.NO_COOKIE_ACCESS);
        expect(window.alert).not.toHaveBeenCalled();
        expect(el.innerHTML).toBe('Hello');
    });

    test('NoCookieAccess ignoreNoCookieAccess=true', () => {
        const e = { type: EmbedEvent.NoCookieAccess };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            ignoreNoCookieAccess: true,
        } as any);
        jest.spyOn(window, 'alert').mockReset();
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toHaveBeenCalledWith(auth.AuthFailureType.NO_COOKIE_ACCESS);
        expect(window.alert).not.toHaveBeenCalled();
        expect(el.innerHTML).not.toBe('Hello');
    });

    test('process authFailure', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
        } as any);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toHaveBeenCalledWith(auth.AuthFailureType.OTHER);
        expect(el.innerHTML).toBe('Hello');
    });

    test('process authFailure AuthType=None', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.None,
        } as any);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).not.toHaveBeenCalled();
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
        expect(base.notifyLogout).toHaveBeenCalled();
        expect(el.innerHTML).toBe('Hello');
        expect(embedConfigInstance.getEmbedConfig().autoLogin).toBe(false);
    });

    test('process authFailure AuthType=None', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.EmbeddedSSO,
            disableLoginFailurePage: true,
        } as any);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).not.toHaveBeenCalled();
        expect(el.innerHTML).not.toBe('Hello');
    });

    test('process authFailure AuthType=TrustedAuthToken and autoLogin true', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.TrustedAuthToken,
            autoLogin: true,
        } as any);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toHaveBeenCalledWith(auth.AuthFailureType.IDLE_SESSION_TIMEOUT);
        expect(el.innerHTML).toBe('Hello');
    });

    test('process authFailure with TrustedAuthTokenCookieless and autoLogin', () => {
        const e = { type: EmbedEvent.AuthFailure };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.TrustedAuthTokenCookieless,
            autoLogin: true,
        } as any);
        const el: any = {};
        expect(processDataInstance.processEventData(e.type, e, '', el)).toEqual({
            type: e.type,
        });
        expect(base.notifyAuthFailure).toHaveBeenCalledWith(auth.AuthFailureType.IDLE_SESSION_TIMEOUT);
        expect(el.innerHTML).toBe('Hello');
    });

    test('should handle ExitPresentMode when disableFullscreenPresentation is false (enabled)', () => {
        const mockConfig = {
            disableFullscreenPresentation: false,
        };
        
        const mockHandleExitPresentMode = jest.spyOn(utilsModule, 'handleExitPresentMode').mockImplementation(() => Promise.resolve(undefined));
        
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue(mockConfig as any);

        const processedData = {
            type: EmbedEvent.ExitPresentMode,
            data: {},
        };

        processDataInstance.processEventData(
            EmbedEvent.ExitPresentMode,
            processedData,
            thoughtSpotHost,
            null,
        );

        expect(mockHandleExitPresentMode).toHaveBeenCalled();
        
        mockHandleExitPresentMode.mockReset();
    });

    test('AuthInit with payload.userGUID fallback when data.userGUID is absent', () => {
        const e = {
            type: EmbedEvent.AuthInit,
            payload: { userGUID: 'payloadGUID' },
        };
        jest.spyOn(base, 'notifyAuthSuccess');
        expect(processDataInstance.processEventData(e.type, e, '', null)).toEqual({
            type: e.type,
            payload: { userGUID: 'payloadGUID' },
            data: { userGUID: 'payloadGUID' },
        });
        expect(base.notifyAuthSuccess).toHaveBeenCalled();
    });

    test('process authFailure EmbeddedSSO with UNAUTHENTICATED_FAILURE suppresses login page', () => {
        const e = {
            type: EmbedEvent.AuthFailure,
            data: { type: auth.AuthFailureType.UNAUTHENTICATED_FAILURE },
        };
        jest.spyOn(base, 'notifyAuthFailure');
        jest.spyOn(embedConfigInstance, 'getEmbedConfig').mockReturnValue({
            loginFailedMessage: 'Hello',
            authType: AuthType.EmbeddedSSO,
            disableLoginFailurePage: false,
        } as any);
        const el: any = {};
        processDataInstance.processEventData(e.type, e, '', el);
        // isEmbeddedSSOInfoFailure=true so neither branch fires, innerHTML stays unset
        expect(el.innerHTML).toBeUndefined();
        expect(base.notifyAuthFailure).not.toHaveBeenCalled();
    });

    test('processEventData default branch returns payload unchanged for non-special events', () => {
        const events = [
            EmbedEvent.Drilldown,
            EmbedEvent.DataSourceSelected,
            EmbedEvent.AddRemoveColumns,
            EmbedEvent.VizPointDoubleClick,
            EmbedEvent.VizPointClick,
            EmbedEvent.Alert,
            EmbedEvent.GetDataClick,
            EmbedEvent.DialogClose,
            EmbedEvent.Download,
            EmbedEvent.DownloadAsPng,
            EmbedEvent.DownloadAsPdf,
            EmbedEvent.DownloadAsCsv,
            EmbedEvent.DownloadAsXlsx,
            EmbedEvent.DownloadLiveboardAsContinuousPDF,
            EmbedEvent.AnswerDelete,
            EmbedEvent.AIHighlights,
            EmbedEvent.Pin,
            EmbedEvent.SpotIQAnalyze,
            EmbedEvent.Share,
            EmbedEvent.DrillInclude,
            EmbedEvent.DrillExclude,
            EmbedEvent.CopyToClipboard,
            EmbedEvent.UpdateTML,
            EmbedEvent.EditTML,
            EmbedEvent.ExportTML,
            EmbedEvent.SaveAsView,
            EmbedEvent.CopyAEdit,
            EmbedEvent.ShowUnderlyingData,
            EmbedEvent.AnswerChartSwitcher,
            EmbedEvent.LiveboardInfo,
            EmbedEvent.AddToFavorites,
            EmbedEvent.Schedule,
            EmbedEvent.Edit,
            EmbedEvent.MakeACopy,
            EmbedEvent.Present,
            EmbedEvent.Delete,
            EmbedEvent.SchedulesList,
            EmbedEvent.Cancel,
            EmbedEvent.Explore,
            EmbedEvent.CopyLink,
            EmbedEvent.CrossFilterChanged,
            EmbedEvent.VizPointRightClick,
            EmbedEvent.InsertIntoSlide,
            EmbedEvent.FilterChanged,
            EmbedEvent.UpdateConnection,
            EmbedEvent.CreateConnection,
            EmbedEvent.ResetLiveboard,
            EmbedEvent.ChangePersonalizedView,
            EmbedEvent.CreateWorksheet,
            EmbedEvent.AskSageInit,
            EmbedEvent.Rename,
            EmbedEvent.ParameterChanged,
            EmbedEvent.TableVizRendered,
            EmbedEvent.CreateLiveboard,
            EmbedEvent.CreateModel,
            EmbedEvent.SpotterData,
            EmbedEvent.PreviewSpotterData,
            EmbedEvent.AddToCoaching,
            EmbedEvent.DataModelInstructions,
            EmbedEvent.SpotterQueryTriggered,
            EmbedEvent.LastPromptEdited,
            EmbedEvent.LastPromptDeleted,
            EmbedEvent.ResetSpotterConversation,
            EmbedEvent.SpotterInit,
            EmbedEvent.SpotterLoadComplete,
            EmbedEvent.OrgSwitched,
            EmbedEvent.SpotterConversationRenamed,
            EmbedEvent.SpotterConversationDeleted,
            EmbedEvent.SpotterConversationSelected,
            EmbedEvent.EmbedPageContextChanged,
            EmbedEvent.Subscribed,
            EmbedEvent.SendTestScheduleEmail,
            EmbedEvent.SpotterVizInit,
            EmbedEvent.SpotterVizQueryTriggered,
            EmbedEvent.SpotterVizResponseComplete,
            EmbedEvent.SpotterVizCheckpointCreated,
            EmbedEvent.SpotterVizCheckpointRestored,
            EmbedEvent.SpotterVizError,
            EmbedEvent.SpotterVizClosed,
            EmbedEvent.RefreshLiveboardBrowserCache,
            EmbedEvent.V1Data,
        ];
        events.forEach((eventType) => {
            const e = { type: eventType, data: 'test-payload' };
            expect(
                processDataInstance.processEventData(eventType, e, thoughtSpotHost, null),
            ).toEqual(e);
        });
    });

    test('should handle ClearInfoCache', () => {
        const mockResetCachedPreauthInfo = jest.spyOn(sessionInfoService, 'resetCachedPreauthInfo').mockImplementation(() => {});
        const mockResetCachedSessionInfo = jest.spyOn(sessionInfoService, 'resetCachedSessionInfo').mockImplementation(() => {});
        const processedData = {
            type: EmbedEvent.CLEAR_INFO_CACHE,
            data: {},
        };
        processDataInstance.processEventData(EmbedEvent.CLEAR_INFO_CACHE, processedData, thoughtSpotHost, null);
        expect(mockResetCachedPreauthInfo).toHaveBeenCalled();
        expect(mockResetCachedSessionInfo).toHaveBeenCalled();
    });
});
