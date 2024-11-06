/* eslint-disable dot-notation */
import { resetCachedAuthToken } from '../authToken';
import {
    AuthType,
    init,
    EmbedEvent,
    SearchEmbed,
    PinboardEmbed,
    LiveboardViewConfig,
    AppEmbed,
    LiveboardEmbed,
} from '../index';
import {
    Action, HomeLeftNavItem, RuntimeFilter, RuntimeFilterOp, HomepageModule, HostEvent,
    RuntimeParameter,
    Param,
} from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getIFrameSrc,
    getRootEl,
    postMessageToParent,
    defaultParamsForPinboardEmbed,
    waitFor,
    expectUrlMatchesWithParams,
    expectUrlToHaveParamsWithValues,
    mockMessageChannel,
    createRootEleForEmbed,
} from '../test/test-utils';
import * as config from '../config';
import * as embedConfig from './embedConfig';
import * as tsEmbedInstance from './ts-embed';
import * as mixpanelInstance from '../mixpanel-service';
import * as authInstance from '../auth';
import * as baseInstance from './base';
import { MIXPANEL_EVENT } from '../mixpanel-service';
import * as authService from '../utils/authService/authService';
import { logger } from '../utils/logger';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const pinboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const liveboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const tabId1 = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const tabId2 = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const thoughtSpotHost = 'tshost';
const defaultParamsPost = '';

beforeAll(() => {
    spyOn(window, 'alert');
});

const customisations = {
    style: {
        customCSS: {},
    },
    content: {},
};

const customisationsView = {
    style: {
        customCSS: {},
    },
    content: {
        strings: {
            DATA: 'data',
        },
    },
};

describe('Unit test case for ts embed', () => {
    const mockMixPanelEvent = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    afterEach(() => {
        jest.clearAllMocks();
        resetCachedAuthToken();
    });

    beforeAll(() => {
        jest.spyOn(authInstance, 'postLoginService').mockResolvedValue(true);
    });

    describe('Vaidate iframe properties', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
        });

        test.only('should set proper allow policies', async () => {
            // we dont have origin specific policies so just checking if
            // policies are ending with ;
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                const policiesAdded = iframe.allow.split(' ');
                policiesAdded.forEach((policy) => {
                    expect(policy.endsWith(';')).toBe(true);
                });
            });
        });
    });

    describe('AuthExpire embedEvent in cookieless authentication authType', () => {
        beforeAll(() => {
            jest.spyOn(authInstance, 'doCookielessTokenAuth').mockResolvedValueOnce(true);
            jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthTokenCookieless,
                getAuthToken: () => Promise.resolve('test_auth_token2'),
            });
        });

        test('check for new authToken based on getAuthToken function', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.AuthExpire,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            jest.spyOn(baseInstance, 'notifyAuthFailure');
            jest.spyOn(baseInstance, 'handleAuth');

            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(baseInstance.notifyAuthFailure).toBeCalledWith(
                    authInstance.AuthFailureType.EXPIRY,
                );
                expect(baseInstance.handleAuth).not.toHaveBeenCalled();
                expect(mockPort.postMessage).toHaveBeenCalledWith({
                    type: EmbedEvent.AuthExpire,
                    data: { authToken: 'test_auth_token2' },
                });
            });
        });
    });
    describe('Called Embed event status for start and end', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                customizations: customisations,
            });
        });

        test('verify Customisations', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations,
                    authToken: '',
                    runtimeFilterParams: null,
                    runtimeParameterParams: null,
                    hiddenHomeLeftNavItems: [],
                    hiddenHomepageModules: [],
                    hostConfig: undefined,
                    reorderedHomepageModules: [],
                },
            });
        });

        test('verify Customisations from viewConfig', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), {
                ...defaultViewConfig,
                customizations: customisationsView,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations: customisationsView,
                    authToken: '',
                    runtimeFilterParams: null,
                    runtimeParameterParams: null,
                    hiddenHomeLeftNavItems: [],
                    hiddenHomepageModules: [],
                    hostConfig: undefined,
                    reorderedHomepageModules: [],
                },
            });
        });

        test('hide home page modules from view Config should be part of app_init payload', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const mockedHiddenHomepageModules: HomepageModule[] = [
                HomepageModule.MyLibrary,
                HomepageModule.Learning,
            ];

            const searchEmbed = new AppEmbed(getRootEl(), {
                ...defaultViewConfig,
                hiddenHomepageModules: mockedHiddenHomepageModules,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations,
                    authToken: '',
                    hostConfig: undefined,
                    runtimeFilterParams: null,
                    runtimeParameterParams: null,
                    hiddenHomeLeftNavItems: [],
                    hiddenHomepageModules: [HomepageModule.MyLibrary, HomepageModule.Learning],
                    reorderedHomepageModules: [],
                },
            });
        });

        test('Reordering the home page modules from view Config should be part of app_init payload', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const mockedReorderedHomepageModules: HomepageModule[] = [
                HomepageModule.MyLibrary,
                HomepageModule.Watchlist,
            ];

            const searchEmbed = new AppEmbed(getRootEl(), {
                ...defaultViewConfig,
                reorderedHomepageModules: mockedReorderedHomepageModules,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations,
                    authToken: '',
                    hostConfig: undefined,
                    runtimeFilterParams: null,
                    runtimeParameterParams: null,
                    hiddenHomeLeftNavItems: [],
                    hiddenHomepageModules: [],
                    reorderedHomepageModules: [HomepageModule.MyLibrary, HomepageModule.Watchlist],
                },
            });
        });

        test('Runtime parameters from view Config should be part of app_init payload when excludeRuntimeParametsfromURL is true', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const mockRuntimeParameters: RuntimeParameter[] = [
                {
                    name: 'color',
                    value: 'blue',
                },
            ];

            const searchEmbed = new SearchEmbed(getRootEl(), {
                ...defaultViewConfig,
                excludeRuntimeParametersfromURL: true,
                runtimeParameters: mockRuntimeParameters,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations,
                    authToken: '',
                    runtimeFilterParams: null,
                    runtimeParameterParams: 'param1=color&paramVal1=blue',
                    hiddenHomeLeftNavItems: [],
                    hiddenHomepageModules: [],
                    hostConfig: undefined,
                    reorderedHomepageModules: [],
                },
            });
        });

        test('Runtime filters from view Config should be part of app_init payload when excludeRuntimeFiltersfromURL is true', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const mockRuntimeFilters: RuntimeFilter[] = [
                {
                    columnName: 'color',
                    operator: RuntimeFilterOp.EQ,
                    values: ['blue'],
                },
            ];

            const searchEmbed = new SearchEmbed(getRootEl(), {
                ...defaultViewConfig,
                excludeRuntimeFiltersfromURL: true,
                runtimeFilters: mockRuntimeFilters,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations,
                    authToken: '',
                    runtimeFilterParams: 'col1=color&op1=EQ&val1=blue',
                    runtimeParameterParams: null,
                    hiddenHomeLeftNavItems: [],
                    hiddenHomepageModules: [],
                    hostConfig: undefined,
                    reorderedHomepageModules: [],
                },
            });
        });

        test('Runtime filters from view Config should be not part of app_init payload when excludeRuntimeFiltersfromURL is undefined', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const mockRuntimeFilters: RuntimeFilter[] = [
                {
                    columnName: 'color',
                    operator: RuntimeFilterOp.EQ,
                    values: ['blue'],
                },
            ];

            const searchEmbed = new SearchEmbed(getRootEl(), {
                ...defaultViewConfig,
                runtimeFilters: mockRuntimeFilters,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations,
                    authToken: '',
                    runtimeFilterParams: null,
                    runtimeParameterParams: null,
                    hiddenHomeLeftNavItems: [],
                    hiddenHomepageModules: [],
                    hostConfig: undefined,
                    reorderedHomepageModules: [],
                },
            });
        });

        test('Runtime filters from view Config should not be part of app_init payload when excludeRuntimeFiltersfromURL is false', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const mockRuntimeFilters: RuntimeFilter[] = [
                {
                    columnName: 'color',
                    operator: RuntimeFilterOp.EQ,
                    values: ['blue'],
                },
            ];

            const searchEmbed = new SearchEmbed(getRootEl(), {
                ...defaultViewConfig,
                excludeRuntimeFiltersfromURL: false,
                runtimeFilters: mockRuntimeFilters,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations,
                    authToken: '',
                    runtimeFilterParams: null,
                    runtimeParameterParams: null,
                    hiddenHomeLeftNavItems: [],
                    hiddenHomepageModules: [],
                    hostConfig: undefined,
                    reorderedHomepageModules: [],
                },
            });
        });

        test('homeLeftNav from view Config should be part of app_init payload', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const mockedHiddenHomeLeftNavItems: HomeLeftNavItem[] = [
                HomeLeftNavItem.Home,
                HomeLeftNavItem.MonitorSubscription,
            ];

            const searchEmbed = new AppEmbed(getRootEl(), {
                ...defaultViewConfig,
                hiddenHomeLeftNavItems: mockedHiddenHomeLeftNavItems,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: {
                    customisations,
                    authToken: '',
                    hostConfig: undefined,
                    runtimeFilterParams: null,
                    runtimeParameterParams: null,
                    hiddenHomeLeftNavItems:
                        [HomeLeftNavItem.Home, HomeLeftNavItem.MonitorSubscription],
                    hiddenHomepageModules: [],
                    reorderedHomepageModules: [],
                },
            });
        });

        test('when Embed event status have start status', (done) => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.Save,
                data: { answerId: '123' },
                status: 'start',
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed
                .on(
                    EmbedEvent.Save,
                    (payload) => {
                        expect(payload).toEqual(mockEmbedEventPayload);
                        done();
                    },
                    { start: true },
                )
                .render();

            executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload);
            });
        });

        test('should not called post message, when Embed event status have start and start option as false', () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.Save,
                data: { answerId: '123' },
                status: 'start',
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed
                .on(EmbedEvent.Save, () => {
                    logger.log('non callable');
                })
                .render();

            executeAfterWait(() => {
                const iframe = getIFrameEl();
                iframe.contentWindow.postMessage = jest.fn();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload);
                expect(iframe.contentWindow.postMessage).toHaveBeenCalledTimes(0);
            });
        });

        test('when Embed event status have end status', (done) => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.Save,
                data: { answerId: '123' },
                status: 'end',
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed
                .on(EmbedEvent.Save, (payload) => {
                    expect(payload).toEqual(mockEmbedEventPayload);
                    done();
                })
                .render();

            executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload);
            }, 1000);
        });

        test('should not called post message, when Embed event status have end status and start is true', () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.Save,
                data: { answerId: '123' },
                status: 'end',
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed
                .on(
                    EmbedEvent.Save,
                    () => {
                        logger.log('non callable');
                    },
                    { start: true },
                )
                .render();

            executeAfterWait(() => {
                const iframe = getIFrameEl();
                iframe.contentWindow.postMessage = jest.fn();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload);
                expect(iframe.contentWindow.postMessage).toHaveBeenCalledTimes(0);
            }, 1000);
        });

        test('should remove event listener when called off method', async (done) => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.Save,
                data: { answerId: '123' },
                status: 'end',
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            const mockFn = jest.fn();
            searchEmbed.on(EmbedEvent.Save, mockFn).render();

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload);
            });

            searchEmbed.off(EmbedEvent.Save, mockFn);
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload);
            });
            await executeAfterWait(() => {
                expect(mockFn).toHaveBeenCalledTimes(1);
                done();
            }, 100);
        });
    });

    describe('Appinit embedEvent in cookieless authentication authType', () => {
        beforeAll(() => {
            jest.spyOn(authInstance, 'doCookielessTokenAuth').mockResolvedValueOnce(true);
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthTokenCookieless,
                getAuthToken: () => Promise.resolve('test_auth_token1'),
            });
        });

        afterEach(() => {
            baseInstance.reset();
        });

        test('check for authToken based on getAuthToken function', async () => {
            const a = jest.spyOn(authService, 'verifyTokenService');
            a.mockResolvedValue(true);

            // authVerifyMock.mockResolvedValue(true);
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith({
                    type: EmbedEvent.APP_INIT,
                    data: {
                        customisations,
                        authToken: 'test_auth_token1',
                        runtimeFilterParams: null,
                        runtimeParameterParams: null,
                        hiddenHomeLeftNavItems: [],
                        hiddenHomepageModules: [],
                        hostConfig: undefined,
                        reorderedHomepageModules: [],
                    },
                });
            });

            jest.spyOn(authService, 'verifyTokenService').mockClear();
        });
    });

    describe('Token fetch fails in cookieless authentication authType', () => {
        beforeEach(() => {
            jest.spyOn(authInstance, 'doCookielessTokenAuth').mockResolvedValueOnce(true);
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthTokenCookieless,
                getAuthToken: () => Promise.reject(),
            });
        });

        afterEach(() => {
            jest.clearAllMocks();
            baseInstance.reset();
        });

        test('should show login failure message if token failed during app_init', async () => {
            const a = jest.spyOn(authService, 'verifyTokenService');
            a.mockResolvedValue(true);

            // authVerifyMock.mockResolvedValue(true);
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(mockPort.postMessage).not.toHaveBeenCalled();
                expect(getRootEl().innerHTML).toContain('Not logged in');
            });

            jest.spyOn(authService, 'verifyTokenService').mockClear();
        });

        test('should show login failure message if token failed during app_init prerender', async () => {
            const a = jest.spyOn(authService, 'verifyTokenService');
            a.mockResolvedValue(true);

            // authVerifyMock.mockResolvedValue(true);
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), { ...defaultViewConfig, preRenderId: 'test' });
            searchEmbed.preRender();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            const preRenderWrapper = document.getElementById('tsEmbed-pre-render-wrapper-test');
            await executeAfterWait(() => {
                expect(mockPort.postMessage).not.toHaveBeenCalled();
                expect(preRenderWrapper.innerHTML).toContain('Not logged in');
            });

            jest.spyOn(authService, 'verifyTokenService').mockClear();
        });

        test('should show login failure message if update token failed', async () => {
            const a = jest.spyOn(authService, 'verifyTokenService');
            a.mockResolvedValue(true);

            // authVerifyMock.mockResolvedValue(true);
            const mockEmbedEventPayload = {
                type: EmbedEvent.AuthExpire,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            jest.spyOn(baseInstance, 'notifyAuthFailure');
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            const loggerSpy = jest.spyOn(logger, 'error').mockResolvedValueOnce(true);
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(getRootEl().innerHTML).toContain('Not logged in');
                expect(baseInstance.notifyAuthFailure).toBeCalledWith(
                    authInstance.AuthFailureType.EXPIRY,
                );
                expect(loggerSpy).toHaveBeenCalledTimes(1);
            });

            jest.spyOn(authService, 'verifyTokenService').mockClear();
            jest.spyOn(baseInstance, 'notifyAuthFailure').mockClear();
        });

        test('should show login failure message if update token failed prerender', async () => {
            const a = jest.spyOn(authService, 'verifyTokenService');
            a.mockResolvedValue(true);

            // authVerifyMock.mockResolvedValue(true);
            const mockEmbedEventPayload = {
                type: EmbedEvent.AuthExpire,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), { ...defaultViewConfig, preRenderId: 'test' });
            jest.spyOn(baseInstance, 'notifyAuthFailure');
            searchEmbed.preRender();
            const loggerSpy = jest.spyOn(logger, 'error').mockResolvedValueOnce(true);
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            const preRenderWrapper = document.getElementById('tsEmbed-pre-render-wrapper-test');
            await executeAfterWait(() => {
                expect(preRenderWrapper.innerHTML).toContain('Not logged in');
                expect(baseInstance.notifyAuthFailure).toBeCalledWith(
                    authInstance.AuthFailureType.EXPIRY,
                );
                expect(loggerSpy).toHaveBeenCalledTimes(1);
            });

            jest.spyOn(authService, 'verifyTokenService').mockClear();
            jest.spyOn(baseInstance, 'notifyAuthFailure').mockClear();
        });
    });

    xdescribe('AuthExpire embedEvent in TrustedAuthToken authType', () => {
        test('AutoLogin true scenario', async () => {
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthToken,
                username: 'tsadmin',
                getAuthToken: () => Promise.resolve('test_auth_token3'),
                autoLogin: true,
            });
            const mockEmbedEventPayload = {
                type: EmbedEvent.AuthExpire,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            jest.spyOn(baseInstance, 'notifyAuthFailure');
            jest.spyOn(baseInstance, 'handleAuth');
            searchEmbed.render();
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload);
            });
            await executeAfterWait(() => {
                expect(baseInstance.notifyAuthFailure).toBeCalledWith(
                    authInstance.AuthFailureType.EXPIRY,
                );
                expect(baseInstance.handleAuth).toHaveBeenCalled();
            });
        });
        test('AutoLogin false scenario', async () => {
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthToken,
                username: 'tsadmin',
                getAuthToken: () => Promise.resolve('test_auth_token4'),
            });
            const mockEmbedEventPayload = {
                type: EmbedEvent.AuthExpire,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            jest.spyOn(baseInstance, 'notifyAuthFailure');
            jest.spyOn(baseInstance, 'handleAuth');
            searchEmbed.render();
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload);
            });
            await executeAfterWait(() => {
                expect(baseInstance.notifyAuthFailure).toBeCalledWith(
                    authInstance.AuthFailureType.EXPIRY,
                );
                expect(baseInstance.handleAuth).not.toHaveBeenCalled();
            });
        });
    });

    describe('when thoughtSpotHost have value and authPromise return response true/false', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost,
                authType: AuthType.None,
                loginFailedMessage: 'Failed to Login',
            });
        });

        const setup = async (isLoggedIn = false) => {
            jest.spyOn(window, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    handler({
                        data: {
                            type: 'xyz',
                        },
                        ports: [3000],
                        source: null,
                    });
                },
            );
            const iFrame: any = document.createElement('div');
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(isLoggedIn);
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            iFrame.contentWindow = null;
            tsEmbed.on(EmbedEvent.CustomAction, jest.fn());
            jest.spyOn(iFrame, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    handler({});
                },
            );
            jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);
            await tsEmbed.render();
        };

        test('mixpanel should call with VISUAL_SDK_RENDER_COMPLETE', async () => {
            await setup(true);
            expect(mockMixPanelEvent).toBeCalledWith(MIXPANEL_EVENT.VISUAL_SDK_RENDER_START);
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_COMPLETE,
                expect.objectContaining({
                    elWidth: 0,
                    elHeight: 0,
                }),
            );
        });

        test('Should remove prefetch iframe', async () => {
            await setup(true);
            const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>('.prefetchIframe');
            expect(prefetchIframe.length).toBe(0);
        });

        test('Should render failure when login fails', async (done) => {
            setup(false);
            executeAfterWait(() => {
                expect(getRootEl().innerHTML).toContain('Failed to Login');
                done();
            });
        });
    });

    describe('when thoughtSpotHost have value and authPromise return error', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
        });

        beforeEach(() => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockRejectedValueOnce(false);
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            const iFrame: any = document.createElement('div');
            iFrame.contentWindow = null;
            jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);
            spyOn(logger, 'error');
            tsEmbed.render();
        });

        test('mixpanel should call with VISUAL_SDK_RENDER_FAILED', () => {
            expect(mockMixPanelEvent).toBeCalledWith(MIXPANEL_EVENT.VISUAL_SDK_RENDER_START);
            expect(mockMixPanelEvent).toBeCalledWith(MIXPANEL_EVENT.VISUAL_SDK_RENDER_FAILED, {
                error: 'false',
            });
        });
    });

    describe('when visible actions are set', () => {
        test('should throw error when there are both visible and hidden actions - pinboard', async () => {
            spyOn(logger, 'error');
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                hiddenActions: [Action.DownloadAsCsv],
                visibleActions: [Action.DownloadAsCsv],
                ...defaultViewConfig,
                pinboardId,
            } as LiveboardViewConfig);
            await pinboardEmbed.render();
            expect(pinboardEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith(
                'You cannot have both hidden actions and visible actions',
            );
        });
        test('should not throw error when there are only visible or hidden actions - pinboard', async () => {
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                hiddenActions: [Action.DownloadAsCsv],
                ...defaultViewConfig,
                pinboardId,
            } as LiveboardViewConfig);
            pinboardEmbed.render();
            expect(pinboardEmbed['isError']).toBe(false);
        });

        /**
         *
         * @param hiddenActions
         * @param visibleActions
         */
        async function testActionsForLiveboards(
            hiddenActions: Array<Action>,
            visibleActions: Array<Action>,
        ) {
            spyOn(logger, 'error');
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                hiddenActions,
                visibleActions,
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            await liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith(
                'You cannot have both hidden actions and visible actions',
            );
        }
        test('should throw error when there are both visible and hidden action arrays', async () => {
            await testActionsForLiveboards([Action.DownloadAsCsv], [Action.DownloadAsCsv]);
        });
        test('should throw error when there are both visible and hidden actions arrays as empty', async () => {
            await testActionsForLiveboards([], []);
        });
        test('should throw error when there are both visible and hidden actions - one of them is an empty array', async () => {
            await testActionsForLiveboards([], [Action.DownloadAsCsv]);
        });

        test('should not throw error when there are only visible or hidden actions', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                hiddenActions: [Action.DownloadAsCsv],
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(false);
        });
        test('should not throw error when there are only visible or hidden actions', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                visibleActions: [Action.DownloadAsCsv],
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(false);
        });
    });

    describe('when visible Tabs are set', () => {
        test('should throw error when there are both visible and hidden Tabs - pinboard', async () => {
            spyOn(logger, 'error');
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                visibleTabs: [tabId1],
                hiddenTabs: [tabId2],
                ...defaultViewConfig,
                pinboardId,
            } as LiveboardViewConfig);
            await pinboardEmbed.render();
            expect(pinboardEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith(
                'You cannot have both hidden Tabs and visible Tabs',
            );
        });
        test('should not throw error when there are only visible or hidden Tabs - pinboard', async () => {
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                hiddenTabs: [tabId1],
                ...defaultViewConfig,
                pinboardId,
            } as LiveboardViewConfig);
            pinboardEmbed.render();
            expect(pinboardEmbed['isError']).toBe(false);
        });

        /**
         *
         * @param hiddenTabs
         * @param visibleTabs
         */
        async function testTabsForLiveboards(
            hiddenTabs: Array<string>,
            visibleTabs: Array<string>,
        ) {
            spyOn(logger, 'error');
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                hiddenTabs,
                visibleTabs,
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            await liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith(
                'You cannot have both hidden Tabs and visible Tabs',
            );
        }
        test('should throw error when there are both visible and hidden Tab arrays', async () => {
            await testTabsForLiveboards([tabId1], [tabId2]);
        });
        test('should throw error when there are both visible and hidden Tab arrays as empty', async () => {
            await testTabsForLiveboards([], []);
        });
        test('should throw error when there are both visible and hidden Tabs - one of them is an empty array', async () => {
            await testTabsForLiveboards([], [tabId2]);
        });

        test('should not throw error when there are only visible or hidden Tab', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                hiddenTabs: [tabId2],
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(false);
        });
        test('should not throw error when there are only visible or hidden Tabs', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                visibleTabs: [tabId1],
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(false);
        });
    });

    describe('when thoughtSpotHost is empty', () => {
        beforeAll(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(() => '');
            init({
                thoughtSpotHost: '',
                authType: AuthType.None,
            });
        });

        test('Error should be true', async () => {
            spyOn(logger, 'error');
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            tsEmbed.render();
            expect(tsEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith(
                'You need to init the ThoughtSpot SDK module first',
            );
        });
    });

    describe('V1Embed ', () => {
        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(() => 'http://tshost');
        });

        test('when isRendered is true than isError will be true', () => {
            spyOn(logger, 'warn');
            const viEmbedIns = new tsEmbedInstance.V1Embed(getRootEl(), defaultViewConfig);
            expect(viEmbedIns['isError']).toBe(false);
            viEmbedIns.render();
            viEmbedIns.on(EmbedEvent.CustomAction, jest.fn()).render();
            expect(logger.warn).toHaveBeenCalledWith(
                'Please register event handlers before calling render',
            );
        });

        test('Generates the correct url for V1Embed when V2 shell is enabled', async () => {
            const v1Embed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId: '123',
                enableV2Shell_experimental: true,
            });
            await v1Embed.render();
            await executeAfterWait(() => {
                expect(getIFrameSrc()).toContain('/v2/?');
            });
        });
    });

    describe('Navigate to Page API', () => {
        const path = 'viz/e0836cad-4fdf-42d4-bd97-567a6b2a6058';

        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(() => 'http://tshost');
        });

        test('when app is PinboardEmbed after navigateToPage function call, new path should be set to iframe', async () => {
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                pinboardId: 'e0836cad-4fdf-42d4-bd97-567a6b2a6058',
            });
            await pinboardEmbed.render();
            // pinboardEmbed.navigateToPage(path);
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&${defaultParamsForPinboardEmbed}&isLiveboardEmbed=true${defaultParamsPost}#/embed/${path}`,
            );
        });

        test('when app is AppEmbed after navigateToPage function call, new path should be set to iframe', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await appEmbed.render();
            appEmbed.navigateToPage(path, false);
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}${defaultParamsPost}#/${path}`,
            );
        });

        test('navigateToPage function use before render', async () => {
            spyOn(logger, 'log');
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            appEmbed.navigateToPage(path, false);
            await appEmbed.render();
            expect(logger.log).toHaveBeenCalledWith(
                'Please call render before invoking this method',
            );
        });
    });
    describe('Navigate to Page API - Pinboard', () => {
        const path = 'pinboard/e0836cad-4fdf-42d4-bd97-567a6b2a6058';

        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(() => 'http://tshost');
        });

        test('when app is AppEmbed after navigateToPage function call, new path should be set to iframe', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await appEmbed.render();
            appEmbed.navigateToPage(path, false);
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}${defaultParamsPost}#/${path}`,
            );
        });
    });
    describe('get Encoded query param string', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                shouldEncodeUrlQueryParams: true,
            });
        });
        afterAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                shouldEncodeUrlQueryParams: false,
            });
        });
        it('should return the correct encoded query params string', async () => {
            const tsEmbed = new SearchEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            tsEmbed.render();
            await waitFor(() => !!getIFrameEl()).then(() => {
                expect(getIFrameSrc()).toContain('?base64UrlEncodedFlags');
            });
        });
        it('should return the correct encoded query params string when app is embeded', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            appEmbed.render();
            await waitFor(() => !!getIFrameEl()).then(() => {
                expect(getIFrameSrc()).toContain('?base64UrlEncodedFlags');
            });
        });
    });
    describe('Iframe flags', () => {
        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(() => 'http://tshost');
        });

        test('Set Frame params to the iframe as attributes', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                    allowtransparency: true,
                },
            });
            await appEmbed.render();
            const iframe = getIFrameEl();
            expect(iframe.getAttribute('allowtransparency')).toBe('true');
        });

        it('should set the additional flags correctly on the iframe src', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                additionalFlags: {
                    foo: 'bar',
                    baz: 1,
                    bool: true,
                },
            });
            await appEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}`
                + `&foo=bar&baz=1&bool=true${defaultParamsPost}#/home`,
            );
        });

        it('should set the additional flags correctly on the iframe src from init and view config', async () => {
            init({
                thoughtSpotHost: 'http://tshost',
                authType: AuthType.None,
                additionalFlags: {
                    foo: 'bar1',
                    foo2: 'bar2',
                    foo3: false,
                },
            });
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                additionalFlags: {
                    foo: 'bar',
                    baz: 1,
                    bool: true,
                },
            });
            await appEmbed.render();
            console.log('val ', getIFrameSrc());
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}`
                + `&foo=bar&foo2=bar2&foo3=false&baz=1&bool=true${defaultParamsPost}#/home`,
            );
        });

        it('Sets the showAlerts param', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                showAlerts: true,
            });
            await appEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}`
                + `&showAlerts=true${defaultParamsPost}#/home`,
            );
        });
        it('Sets the locale param', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                locale: 'ja-JP',
            });
            await appEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}`
                + `&locale=ja-JP${defaultParamsPost}#/home`,
            );
        });
        it('Sets the iconSprite url', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                customizations: {
                    iconSpriteUrl: 'https://iconSprite.com',
                },
            });
            await appEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}`
                + `&iconSprite=iconSprite.com${defaultParamsPost}#/home`,
            );
        });

        it('inserts as sibling of root node if configured', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                insertAsSibling: true,
            });
            await appEmbed.render();
            expect(getRootEl().nextSibling).toBe(getIFrameEl());
        });
        it('Should remove existing embed when rerendering', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                insertAsSibling: true,
            });
            await appEmbed.render();
            expect(getRootEl().nextSibling).toBe(getIFrameEl());
            await appEmbed.render();
            expect(getRootEl().nextSibling.nextSibling).not.toBe(getIFrameEl());
        });
        it('Should set the pendo tracking key when specified', async () => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValue(true);
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                pendoTrackingKey: '1234',
            });
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await appEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&additionalPendoKey=1234${defaultParamsPost}#/home`,
            );
        });
        xit('Sets the forceSAMLAutoRedirect param', async (done) => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValue(true);
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.EmbeddedSSO,
            });

            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            appEmbed.render();
            await waitFor(() => !!getIFrameEl()).then(() => {
                expect(getIFrameSrc()).toContain('authType=EmbeddedSSO');
                expect(getIFrameSrc()).toContain('forceSAMLAutoRedirect=true');
                done();
            });
        });

        it('Should set the override locale for number/date and currency format', async () => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValue(true);
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                numberFormatLocale: 'en-US',
                dateFormatLocale: 'en-IN',
                currencyFormat: 'USD',
            });
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await appEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&numberFormatLocale=en-US&dateFormatLocale=en-IN&currencyFormat=USD${defaultParamsPost}#/home`,
            );
        });
        it('Sets the overrideOrgId param', async () => {
            const overrideOrgId = 142536;
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                overrideOrgId,
            });
            await appEmbed.render();
            expectUrlToHaveParamsWithValues(getIFrameSrc(), {
                orgId: overrideOrgId,
            });
        });
    });

    describe('When destroyed', () => {
        it('should remove the iframe', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await appEmbed.render();
            expect(getIFrameEl()).toBeTruthy();
            appEmbed.destroy();
            expect(getIFrameEl()).toBeFalsy();
        });

        it('should remove the iframe when insertAsSibling is true', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                insertAsSibling: true,
            });
            await appEmbed.render();
            expect(getIFrameEl()).toBeTruthy();
            appEmbed.destroy();
            expect(getIFrameEl()).toBeFalsy();
        });

        it("Should remove the error message on destroy if it's present", async () => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(false);
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
                insertAsSibling: true,
            });
            await appEmbed.render();
            expect(getRootEl().nextElementSibling.innerHTML).toContain('Not logged in');
            appEmbed.destroy();
            expect(getRootEl().nextElementSibling.innerHTML).toBe('');
        });
    });

    describe('validate getThoughtSpotPostUrlParams', () => {
        const { location } = window;

        beforeAll(() => {
            delete window.location;
            (window as any).location = {
                hash: '',
                search: '',
            };
        });

        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(() => 'http://tshost');
        });

        afterAll((): void => {
            window.location = location;
        });

        it('get url params for TS', () => {
            const tsEmbed = new tsEmbedInstance.TsEmbed(getRootEl(), defaultViewConfig);
            const urlHash = '#/analyze?ts-app=thoughtspot&ts-id=123&title=embed-sdk';
            window.location.hash = urlHash;
            const postHashParams = '?ts-app=thoughtspot&ts-id=123';
            expect(tsEmbed.getThoughtSpotPostUrlParams()).toBe(postHashParams);
        });

        it('validate query params and postHash params for TS', () => {
            const tsEmbed = new tsEmbedInstance.TsEmbed(getRootEl(), defaultViewConfig);
            const urlHash = '#/analyze?ts-app=thoughtspot&ts-id=123&title=embed-sdk';
            window.location.hash = urlHash;
            const urlSearch = '?ts-type=subscribe&search-title=abc';
            window.location.search = urlSearch;
            const postHashParams = '?ts-type=subscribe&ts-app=thoughtspot&ts-id=123';
            expect(tsEmbed.getThoughtSpotPostUrlParams()).toBe(postHashParams);
        });
    });
    describe('Block full app access while naviagting from embed app', () => {
        it('should contain blockNonEmbedFullAppAccess as false in query params', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                blockNonEmbedFullAppAccess: false,
            });
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            appEmbed.render();
            await waitFor(() => !!getIFrameEl()).then(() => {
                expect(getIFrameSrc()).toContain('blockNonEmbedFullAppAccess=false');
            });
        });

        it('should contain blockNonEmbedFullAppAccess as true in query params', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            appEmbed.render();
            await waitFor(() => !!getIFrameEl()).then(() => {
                expect(getIFrameSrc()).toContain('blockNonEmbedFullAppAccess=true');
            });
        });
    });

    describe('validate preRender flow', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
        });

        afterAll(() => {
            const rootEle = document.getElementById('myRoot');
            rootEle.remove();
        });

        it('should preRender and hide the iframe', async () => {
            createRootEleForEmbed();

            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                preRenderId: 'i-am-preRendered',
                liveboardId: 'myLiveboardId',
            });

            libEmbed.preRender();

            await waitFor(() => !!getIFrameEl());

            const preRenderIds = libEmbed.getPreRenderIds();
            const preRenderWrapper = document.getElementById(preRenderIds.wrapper);
            expect(preRenderWrapper.style.opacity).toBe('0');
            expect(preRenderWrapper.style.pointerEvents).toBe('none');
            expect(preRenderWrapper.style.zIndex).toBe('-1000');

            const preRenderChild = document.getElementById(preRenderIds.child) as HTMLIFrameElement;
            expect(preRenderWrapper.children[0]).toEqual(preRenderChild);
            expect(preRenderChild).toBeInstanceOf(HTMLIFrameElement);
            expect(preRenderChild.src).toMatch(/^http:\/\/tshost.*\/myLiveboardId/);

            const tsEmbedDiv = document.getElementById('tsEmbedDiv');
            tsEmbedDiv.style.width = '100px';
            tsEmbedDiv.style.height = '100px';

            let resizeObserverCb: any;
            (window as any).ResizeObserver = window.ResizeObserver
                || jest.fn().mockImplementation((resizeObserverCbParam) => {
                    resizeObserverCb = resizeObserverCbParam;
                    return {
                        disconnect: jest.fn(),
                        observe: jest.fn(),
                        unobserve: jest.fn(),
                    };
                });

            // show preRender
            const warnSpy = spyOn(logger, 'warn');
            libEmbed.showPreRender();
            expect(warnSpy).toHaveBeenCalledTimes(0);

            resizeObserverCb([
                {
                    target: tsEmbedDiv,
                    contentRect: { height: 297, width: 987 },
                },
            ]);

            expect(preRenderWrapper.style.height).toEqual(`${297}px`);
            expect(preRenderWrapper.style.width).toEqual(`${987}px`);

            expect(preRenderWrapper.style.opacity).toBe('');
            expect(preRenderWrapper.style.pointerEvents).toBe('');
            expect(preRenderWrapper.style.zIndex).toBe('');

            libEmbed.hidePreRender();
            expect(preRenderWrapper.style.opacity).toBe('0');
            expect(preRenderWrapper.style.pointerEvents).toBe('none');
            expect(preRenderWrapper.style.zIndex).toBe('-1000');

            libEmbed.destroy();
            expect(document.getElementById(preRenderIds.wrapper)).toBe(null);
        });

        it('preRender called without preRenderId should log error ', () => {
            createRootEleForEmbed();

            spyOn(logger, 'error');
            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                liveboardId: 'myLiveboardId',
            });
            libEmbed.preRender();

            expect(logger.error).toHaveBeenCalledWith('PreRender ID is required for preRender');
        });

        it('showPreRender should preRender if not available', async () => {
            createRootEleForEmbed();

            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                preRenderId: 'i-am-preRendered',
                liveboardId: 'myLiveboardId',
            });
            const preRenderIds = libEmbed.getPreRenderIds();
            libEmbed.showPreRender();
            await waitFor(() => !!getIFrameEl());
            const preRenderWrapper = document.getElementById(preRenderIds.wrapper);

            expect(preRenderWrapper.style.opacity).toBe('');
            expect(preRenderWrapper.style.pointerEvents).toBe('');
            expect(preRenderWrapper.style.zIndex).toBe('');
        });

        it('hidePreRender should not preRender if not available', async () => {
            createRootEleForEmbed();

            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                preRenderId: 'i-am-preRendered',
                liveboardId: 'myLiveboardId',
            });
            spyOn(libEmbed, 'preRender');
            libEmbed.hidePreRender();
            expect(libEmbed.preRender).toHaveBeenCalledTimes(0);
        });

        it('it should connect with another object', async () => {
            createRootEleForEmbed();
            mockMessageChannel();
            (window as any).ResizeObserver = window.ResizeObserver
                || jest.fn().mockImplementation(() => ({
                    disconnect: jest.fn(),
                    observe: jest.fn(),
                    unobserve: jest.fn(),
                }));
            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                preRenderId: 'i-am-preRendered',
                liveboardId: 'myLiveboardId',
            });

            libEmbed.preRender();
            await waitFor(() => !!getIFrameEl());
            const warnSpy = jest.spyOn(logger, 'warn');
            const newEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                preRenderId: 'i-am-preRendered',
                liveboardId: 'awdawda',
                hiddenActions: [Action.AddFilter],
                frameParams: { height: 90 },
            });

            newEmbed.showPreRender();

            expect(warnSpy).toHaveBeenCalledTimes(2);
        });
        it('showPreRender should not preRender if not available', async () => {
            createRootEleForEmbed();

            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                liveboardId: 'myLiveboardId',
            });
            spyOn(libEmbed, 'preRender');
            spyOn(logger, 'error');
            libEmbed.showPreRender();
            expect(libEmbed.preRender).toHaveBeenCalledTimes(0);
            expect(logger.error).toHaveBeenCalledTimes(1);
        });

        it('should get underlying iframe', async () => {
            createRootEleForEmbed();

            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                liveboardId: 'myLiveboardId',
            });
            libEmbed.render();
            await waitFor(() => !!getIFrameEl());

            expect(libEmbed.getUnderlyingFrameElement()).toEqual(getIFrameEl());
        });

        it('should render error message properly', async () => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(false);
            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                liveboardId: 'myLiveboardId',
                preRenderId: 'test',
            });
            await libEmbed.preRender();

            expect(document.getElementById('tsEmbed-pre-render-child-test').innerHTML).toBe(
                'Not logged in',
            );
        });
        it('should log error if sync is called before preRender', async () => {
            jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                liveboardId: 'myLiveboardId',
                preRenderId: 'test',
            });
            await libEmbed.syncPreRenderStyle();
            expect(logger.error).toBeCalledWith(
                'PreRender should be called before using syncPreRenderStyle',
            );
            (logger.error as any).mockClear();
        });
    });
});
