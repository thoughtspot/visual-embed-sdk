import { resetValueFromWindow } from '../utils';
import { ERROR_MESSAGE } from '../errors';
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
    AppViewConfig,
    SageEmbed,
    SageViewConfig,
    SearchViewConfig,
    AnswerService,
    SpotterEmbed,
    SpotterEmbedViewConfig,
} from '../index';
import {
    Action,
    HomeLeftNavItem,
    RuntimeFilter,
    RuntimeFilterOp,
    HomepageModule,
    HostEvent,
    RuntimeParameter,
    Param,
    ContextMenuTriggerOptions,
    CustomActionTarget,
    CustomActionsPosition,
    DefaultAppInitData,
    ErrorDetailsTypes,
    EmbedErrorCodes,
    ContextObject,
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
    expectUrlMatch,
    fixedEncodeURI,
} from '../test/test-utils';
import * as config from '../config';
import * as embedConfig from './embedConfig';
import * as tsEmbedInstance from './ts-embed';
import * as mixpanelInstance from '../mixpanel-service';
import * as authInstance from '../auth';
import * as baseInstance from './base';
import { MIXPANEL_EVENT } from '../mixpanel-service';
import * as authService from '../utils/authService';
import { logger } from '../utils/logger';
import { version } from '../../package.json';
import { HiddenActionItemByDefaultForSearchEmbed } from './search';
import { processTrigger } from '../utils/processTrigger';
import { UIPassthroughEvent } from './hostEventClient/contracts';
import * as sessionInfoService from '../utils/sessionInfoService';
import * as authToken from '../authToken';
import * as apiIntercept from '../api-intercept';
import * as processData from '../utils/processData';

jest.mock('../utils/processTrigger');

const mockProcessTrigger = processTrigger as jest.Mock;
const mockHandleInterceptEvent = jest.spyOn(apiIntercept, 'handleInterceptEvent');
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
export const defaultParamsWithoutHiddenActions = `hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=${AuthType.None}&blockNonEmbedFullAppAccess=true`;
export const defaultParams = `&${defaultParamsWithoutHiddenActions}&hideAction=[%22${Action.ReportError}%22]`;
const hideBydefault = `&hideAction=${fixedEncodeURI(
    JSON.stringify([Action.ReportError, ...HiddenActionItemByDefaultForSearchEmbed]),
)}`;
const defaultParamsWithHiddenActions = defaultParamsWithoutHiddenActions + hideBydefault;

beforeAll(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
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

const customVariablesForThirdPartyTools = {
    key1: '!@#',
    key2: '*%^',
};

const getMockAppInitPayload = (data: any) => {
    const defaultData: DefaultAppInitData = {
        customisations,
        authToken: '',
        hostConfig: undefined,
        runtimeFilterParams: null,
        runtimeParameterParams: null,
        hiddenHomeLeftNavItems: [],
        hiddenHomepageModules: [],
        hiddenListColumns: [],
        customActions: [],
        reorderedHomepageModules: [],
        customVariablesForThirdPartyTools,
        interceptTimeout: undefined,
        interceptUrls: [],
    };
    return {
        type: EmbedEvent.APP_INIT,
        data: {
            ...defaultData,
            ...data,
        },
    };
}

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
        jest.spyOn(authInstance, 'postLoginService').mockResolvedValue(undefined);
    });

    describe('Vaidate iframe properties', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
        });

        test('should set proper allow policies', async () => {
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

        test('should get answer service', async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();
            mockProcessTrigger.mockResolvedValue({ session: 'test' });
            await executeAfterWait(async () => {
                expect(await searchEmbed.getAnswerService()).toBeInstanceOf(AnswerService);
            });
        });

        test('triggerUIPassThrough with params', async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();
            mockProcessTrigger.mockResolvedValue({ session: 'test' });
            await executeAfterWait(async () => {
                const payload = { newVizName: 'test' };
                await searchEmbed.triggerUIPassThrough(
                    UIPassthroughEvent.PinAnswerToLiveboard,
                    payload,
                );
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    getIFrameEl(),
                    HostEvent.UIPassthrough,
                    'http://tshost',
                    {
                        parameters: payload,
                        type: UIPassthroughEvent.PinAnswerToLiveboard,
                    },
                    undefined,
                );
            });
        });

        test('Host event with empty param', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId: '123',
                ...defaultViewConfig,
            });
            liveboardEmbed.render();
            mockProcessTrigger.mockResolvedValue({ session: 'test' });
            await executeAfterWait(async () => {
                await liveboardEmbed.trigger(
                    HostEvent.Save,
                );
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    getIFrameEl(),
                    HostEvent.Save,
                    'http://tshost',
                    {},
                    undefined,
                );
            });
        });

        test('Host event with falsy param', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId: '123',
                ...defaultViewConfig,
            });
            liveboardEmbed.render();
            mockProcessTrigger.mockResolvedValue({ session: 'test' });
            await executeAfterWait(async () => {
                await liveboardEmbed.trigger(
                    HostEvent.Save,
                    false,
                );
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    getIFrameEl(),
                    HostEvent.Save,
                    'http://tshost',
                    false,
                    undefined,
                );
            });
        });

        test('should set proper height, width and min-height to iframe', async () => {
            // we dont have origin specific policies so just checking if
            // policies are ending with ;
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                expect(iframe.style.width).toBe(`${defaultViewConfig.frameParams.width}px`);
                expect(iframe.style.height).toBe(`${defaultViewConfig.frameParams.height}px`);
                expect(iframe.style.minHeight).toBe(`${defaultViewConfig.frameParams.height}px`);
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
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
                    authInstance.AuthFailureType.EXPIRY,
                );
                expect(baseInstance.handleAuth).not.toHaveBeenCalled();
                expect(mockPort.postMessage).toHaveBeenCalledWith({
                    type: EmbedEvent.AuthExpire,
                    data: { authToken: 'test_auth_token2' },
                });
            });
        });

        test('check for new authToken based on getAuthToken function', async () => {
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthToken,
                getAuthToken: () => Promise.resolve('test_auth_token2'),
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
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
                    authInstance.AuthFailureType.EXPIRY,
                );
                expect(mockPort.postMessage).not.toHaveBeenCalledWith({
                    type: EmbedEvent.AuthExpire,
                    data: { authToken: 'test_auth_token2' },
                });
                expect(baseInstance.handleAuth).toHaveBeenCalled();
            });
        });
    });

    describe('Called Embed event status for start and end', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                customizations: customisations,
                customVariablesForThirdPartyTools,
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
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({}));
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
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    customisations: customisationsView,
                }));
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
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    hiddenHomepageModules: [HomepageModule.MyLibrary, HomepageModule.Learning],
                }));
            });
        });

        test('customVariablesForThirdPartyTools should be part of the app_init payload', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };

            const searchEmbed = new AppEmbed(getRootEl(), {
                ...defaultViewConfig,
            });
            searchEmbed.render();

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({}));
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
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    reorderedHomepageModules:
                        [HomepageModule.MyLibrary, HomepageModule.Watchlist],
                }));
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
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    runtimeParameterParams: 'param1=color&paramVal1=blue',
                }));
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
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    runtimeFilterParams: 'col1=color&op1=EQ&val1=blue',
                }));
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
                excludeRuntimeFiltersfromURL: undefined,
            });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({}));
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
            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({}));
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

            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    hiddenHomeLeftNavItems:
                        [HomeLeftNavItem.Home, HomeLeftNavItem.MonitorSubscription],
                }));
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

        test('should remove event listener when called off method', async () => {
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
            expect(mockFn).toHaveBeenCalledTimes(1);
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
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    authToken: 'test_auth_token1',
                    customVariablesForThirdPartyTools: {},
                }));
            });

            jest.spyOn(authService, 'verifyTokenService').mockClear();
        });
    });

    describe('StringIDs and StringIDsUrl in customisations', () => {
        const customisationWithStringIds = {
            style: {
                customCSS: {},
            },
            content: {
                strings: {
                    Liveboard: 'Dashboard',
                },
                stringIDsUrl: 'https://sample-string-ids-url.com',
                stringIDs: {
                    'liveboard.header.title': 'Dashboard name',
                },
            },
        };
        beforeEach(() => {
            jest.spyOn(authInstance, 'doCookielessTokenAuth').mockResolvedValueOnce(true);
            jest.spyOn(authService, 'verifyTokenService').mockResolvedValue(true);
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisationWithStringIds,
                authType: AuthType.TrustedAuthTokenCookieless,
                getAuthToken: () => Promise.resolve('test_auth_token1'),
            });
        });

        afterEach(() => {
            baseInstance.reset();
            jest.clearAllMocks();
        });

        test('should pass stringIDsUrl and stringIDs in customisations during APP_INIT', async () => {
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
                expect(iframe.src).toContain('overrideStringIDsUrl=https://sample-string-ids-url.com');
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });

            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    customisations: {
                        content: {
                            strings: {
                                Liveboard: 'Dashboard',
                            },
                            stringIDsUrl: 'https://sample-string-ids-url.com',
                            stringIDs: {
                                'liveboard.header.title': 'Dashboard name',
                            },
                        },
                        style: {
                            customCSS: {},
                            customCSSUrl: undefined,
                        },
                    },
                    authToken: 'test_auth_token1',
                    customVariablesForThirdPartyTools: {},
                }));
                const customisationContent = mockPort.postMessage.mock.calls[0][0].data.customisations.content;
                expect(customisationContent.stringIDsUrl)
                    .toBe('https://sample-string-ids-url.com');
                expect(customisationContent.stringIDs)
                    .toEqual({
                        'liveboard.header.title': 'Dashboard name',
                    });
            });
        });

        test('should allow passing exposeTranslationIDs in viewConfig', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), { ...defaultViewConfig, exposeTranslationIDs: true });
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                expect(iframe.src).toContain('exposeTranslationIDs=true');
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
        });
    });

    describe('getDefaultAppInitData with CustomActionsValidationResult', () => {
        beforeEach(() => {
            jest.spyOn(authInstance, 'doCookielessTokenAuth').mockResolvedValueOnce(true);
            jest.spyOn(authService, 'verifyTokenService').mockResolvedValue(true);
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.TrustedAuthTokenCookieless,
                getAuthToken: () => Promise.resolve('test_auth_token1'),
            });
        });

        afterEach(() => {
            baseInstance.reset();
            jest.clearAllMocks();
        });

        test('should handle valid custom actions and sort them by name in getDefaultAppInitData', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.APP_INIT,
                data: {},
            };

            // Create a SearchEmbed with valid custom actions to test
            // CustomActionsValidationResult
            const searchEmbed = new SearchEmbed(getRootEl(), {
                ...defaultViewConfig,
                customActions: [
                    {
                        id: 'action1',
                        name: 'Valid Action',
                        target: CustomActionTarget.LIVEBOARD,
                        position: CustomActionsPosition.PRIMARY,
                        metadataIds: { liveboardIds: ['lb123'] }
                    },
                    {
                        id: 'action2',
                        name: 'Another Valid Action',
                        target: CustomActionTarget.VIZ,
                        position: CustomActionsPosition.MENU,
                        metadataIds: { vizIds: ['viz456'] }
                    }
                ]
            });

            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });

            await executeAfterWait(() => {
                expect(mockPort.postMessage).toHaveBeenCalledWith(getMockAppInitPayload({
                    customisations: {
                        content: {},
                        style: {
                            customCSS: {},
                            customCSSUrl: undefined,
                        },
                    },
                    authToken: 'test_auth_token1',
                    customActions: [
                        {
                            id: 'action2',
                            name: 'Another Valid Action',
                            target: CustomActionTarget.VIZ,
                            position: CustomActionsPosition.MENU,
                            metadataIds: { vizIds: ['viz456'] }
                        },
                        {
                            id: 'action1',
                            name: 'Valid Action',
                            target: CustomActionTarget.LIVEBOARD,
                            position: CustomActionsPosition.PRIMARY,
                            metadataIds: { liveboardIds: ['lb123'] }
                        }
                    ], // Actions should be sorted by name
                    customVariablesForThirdPartyTools: {},
                }));

                // Verify that CustomActionsValidationResult structure is
                // correct
                const appInitData = mockPort.postMessage.mock.calls[0][0].data;
                expect(appInitData.customActions).toHaveLength(2);
                expect(appInitData.customActions).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: 'action1',
                            name: 'Valid Action',
                            target: CustomActionTarget.LIVEBOARD,
                            position: CustomActionsPosition.PRIMARY
                        }),
                        expect.objectContaining({
                            id: 'action2',
                            name: 'Another Valid Action',
                            target: CustomActionTarget.VIZ,
                            position: CustomActionsPosition.MENU
                        })
                    ])
                );

                // Verify actions are sorted by name (alphabetically)
                expect(appInitData.customActions[0].name).toBe('Another Valid Action');
                expect(appInitData.customActions[1].name).toBe('Valid Action');
            });
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
            jest.spyOn(logger, 'error').mockImplementation(() => {});
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
            const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(getRootEl().innerHTML).toContain('Not logged in');
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
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
            const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
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
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
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
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
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
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
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
                    (handler as EventListener)({
                        data: { type: 'xyz' },
                        ports: [3000],
                        source: null,
                    } as any);
                },
            );
            const iFrame: any = document.createElement('div');
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(isLoggedIn);
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            iFrame.contentWindow = null;
            tsEmbed.on(EmbedEvent.CustomAction, jest.fn());
            jest.spyOn(iFrame, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    (handler as EventListener)({} as Event);
                },
            );
            jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);
            await tsEmbed.render();
        };

        test('mixpanel should call with VISUAL_SDK_RENDER_COMPLETE', async () => {
            await setup(true);
            expect(mockMixPanelEvent).toHaveBeenCalledWith(MIXPANEL_EVENT.VISUAL_SDK_RENDER_START);
            expect(mockMixPanelEvent).toHaveBeenCalledWith(
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

        test('Should render failure when login fails', async () => {
            await setup(false);
            expect(getRootEl().innerHTML).toContain('Failed to Login');
        });
    });

    describe('Trigger infoSuccess event on iframe load', () => {
        beforeAll(() => {
            jest.clearAllMocks();
            init({
                thoughtSpotHost,
                authType: AuthType.None,
                loginFailedMessage: 'Failed to Login',
            });
        });

        const setup = async (isLoggedIn = false, overrideOrgId: number | undefined = undefined) => {
            jest.spyOn(window, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    (handler as EventListener)({
                        data: { type: 'xyz' },
                        ports: [3000],
                        source: null,
                    } as any);
                },
            );
            mockProcessTrigger.mockResolvedValueOnce({ session: 'test' });
            // resetCachedPreauthInfo();
            let mockGetPreauthInfo = null;

            if (overrideOrgId) {
                mockGetPreauthInfo = jest.spyOn(sessionInfoService, 'getPreauthInfo').mockImplementation(jest.fn());
            }

            const mockPreauthInfoFetch = jest.spyOn(authService, 'fetchPreauthInfoService').mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }), // Mock headers correctly
                json: async () => ({
                    info: {
                        configInfo: {
                            mixpanelConfig: {
                                devSdkKey: 'devSdkKey',
                            },
                        },
                        userGUID: 'userGUID',
                    },
                }), // Mock JSON response
            });
            const iFrame: any = document.createElement('div');
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(isLoggedIn);
            const tsEmbed = new SearchEmbed(getRootEl(), {
                overrideOrgId,
            });
            iFrame.contentWindow = {
                postMessage: jest.fn(),
            };
            tsEmbed.on(EmbedEvent.CustomAction, jest.fn());
            jest.spyOn(iFrame, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    (handler as EventListener)({} as Event);
                },
            );
            jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);
            await tsEmbed.render();

            return {
                mockPreauthInfoFetch,
                mockGetPreauthInfo,
                iFrame,
            };
        };

        test('should call InfoSuccess Event on preauth call success', async () => {
            const {
                mockPreauthInfoFetch,
                iFrame,
            } = await setup(true);
            expect(mockPreauthInfoFetch).toHaveBeenCalledTimes(1);

            await executeAfterWait(() => {
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    iFrame,
                    HostEvent.InfoSuccess,
                    'http://tshost',
                    expect.objectContaining({ info: expect.any(Object) }),
                    undefined,
                );
            });
        });

        test('should not call InfoSuccess Event if overrideOrgId is true', async () => {
            const {
                mockGetPreauthInfo,
            } = await setup(true, 123);
            expect(mockGetPreauthInfo).toHaveBeenCalledTimes(0);
        });
    });

    describe('Preauth Cache for FullAppEmbed with PrimaryNavBar', () => {
        beforeAll(() => {
            jest.clearAllMocks();
            init({
                thoughtSpotHost,
                authType: AuthType.None,
            });
        });
        afterEach(() => {
            jest.clearAllMocks();
        });

        afterAll(() => {
            jest.clearAllMocks();
        });

        const setupPreauthTest = async (
            embedType: 'AppEmbed' | 'SearchEmbed',
            showPrimaryNavbar?: boolean,
            overrideOrgId?: number,
            disablePreauthCache?: boolean
        ) => {
            jest.spyOn(window, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    (handler as EventListener)({
                        data: { type: 'xyz' },
                        ports: [3000],
                        source: null,
                    } as any);
                },
            );
            mockProcessTrigger.mockResolvedValueOnce({ session: 'test' });
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(true);

            let mockGetPreauthInfo = null;

            // Determine if preauth cache should be enabled
            const isAppEmbedWithPrimaryNavbar = embedType === 'AppEmbed' && showPrimaryNavbar === true;
            const shouldDisableCache = overrideOrgId || disablePreauthCache || isAppEmbedWithPrimaryNavbar;

            if (shouldDisableCache) {
                mockGetPreauthInfo = jest.spyOn(sessionInfoService, 'getPreauthInfo')
                    .mockImplementation(jest.fn());
            } else {
                mockGetPreauthInfo = jest.spyOn(sessionInfoService, 'getPreauthInfo')
                 .mockResolvedValue({ info: { test: 'data' } } as any);
            }

            const mockPreauthInfoFetch = jest.spyOn(authService, 'fetchPreauthInfoService')
                .mockResolvedValueOnce({
                    ok: true,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    json: async () => ({
                        info: { test: 'data' },
                    }),
                } as any);

            const viewConfig: any = {
                frameParams: { width: 1280, height: 720 },
            };

            if (showPrimaryNavbar !== undefined) {
                viewConfig.showPrimaryNavbar = showPrimaryNavbar;
            }
            if (overrideOrgId !== undefined) {
                viewConfig.overrideOrgId = overrideOrgId;
            }

            // Mock getEmbedConfig for disablePreauthCache
            if (disablePreauthCache !== undefined) {
                jest.spyOn(embedConfig, 'getEmbedConfig').mockReturnValueOnce({
                    thoughtSpotHost,
                    authType: AuthType.None,
                    disablePreauthCache,
                });
            }

            let embed;
            if (embedType === 'AppEmbed') {
                embed = new AppEmbed(getRootEl(), viewConfig);
            } else {
                embed = new SearchEmbed(getRootEl(), viewConfig);
            }

            const iFrame: any = document.createElement('div');
            iFrame.contentWindow = {
                postMessage: jest.fn(),
            };
            jest.spyOn(iFrame, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    (handler as EventListener)({} as Event);
                },
            );
            jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);

            await embed.render();

            return {
                embed,
                mockGetPreauthInfo,
                mockPreauthInfoFetch,
                iFrame,
            };
        };

        test('should disable preauth cache for FullAppEmbed with showPrimaryNavbar = true (default)', async () => {
            const { mockGetPreauthInfo } = await setupPreauthTest('AppEmbed', true);

            // Wait for any async operations
            await executeAfterWait(() => {
                expect(mockGetPreauthInfo).toHaveBeenCalledTimes(0);
            });
        });

        test('should enable preauth cache for FullAppEmbed with showPrimaryNavbar = undefined (no longer defaults to true)', async () => {
            const { mockGetPreauthInfo } = await setupPreauthTest('AppEmbed', undefined);

            await executeAfterWait(() => {
                expect(mockGetPreauthInfo).toHaveBeenCalledTimes(1);
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    expect.any(Object),
                    HostEvent.InfoSuccess,
                    'http://tshost',
                    expect.objectContaining({ info: expect.any(Object) }),
                    undefined,
                );
            });
        });

        test('should enable preauth cache for FullAppEmbed with showPrimaryNavbar = false', async () => {
            const { mockGetPreauthInfo } = await setupPreauthTest('AppEmbed', false);

            await executeAfterWait(() => {
                expect(mockGetPreauthInfo).toHaveBeenCalledTimes(1);
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    expect.any(Object),
                    HostEvent.InfoSuccess,
                    'http://tshost',
                    expect.objectContaining({ info: expect.any(Object) }),
                    undefined,
                );
            });
        });

        test('should enable preauth cache for SearchEmbed regardless of showPrimaryNavbar', async () => {
            const { mockGetPreauthInfo } = await setupPreauthTest('SearchEmbed', true);

            await executeAfterWait(() => {
                expect(mockGetPreauthInfo).toHaveBeenCalledTimes(1);
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    expect.any(Object),
                    HostEvent.InfoSuccess,
                    'http://tshost',
                    expect.objectContaining({ info: expect.any(Object) }),
                    undefined,
                );
            });
        });

        test('should enable preauth cache for SearchEmbed (verifies fix for embed type regression)', async () => {
            const { mockGetPreauthInfo } = await setupPreauthTest('SearchEmbed', false);

            await executeAfterWait(() => {
                expect(mockGetPreauthInfo).toHaveBeenCalledTimes(1);
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    expect.any(Object),
                    HostEvent.InfoSuccess,
                    'http://tshost',
                    expect.objectContaining({ info: expect.any(Object) }),
                    undefined,
                );
            });
        });

        test('should disable preauth cache for FullAppEmbed with overrideOrgId (combined condition)', async () => {
            const { mockGetPreauthInfo } = await setupPreauthTest('AppEmbed', false, 123);

            await executeAfterWait(() => {
                expect(mockGetPreauthInfo).toHaveBeenCalledTimes(0);
            });
        });

        test('should disable preauth cache for FullAppEmbed with disablePreauthCache = true', async () => {
            const { mockGetPreauthInfo } = await setupPreauthTest('AppEmbed', false, undefined, true);

            await executeAfterWait(() => {
                expect(mockGetPreauthInfo).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('isFullAppEmbedWithVisiblePrimaryNavbar helper method', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost,
                authType: AuthType.None,
            });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test('should return true for AppEmbed with showPrimaryNavbar = true', () => {
            const appEmbed = new AppEmbed(getRootEl(), { showPrimaryNavbar: true });
            expect(appEmbed['isFullAppEmbedWithVisiblePrimaryNavbar']()).toBe(true);
        });

        test('should return false for AppEmbed with showPrimaryNavbar = undefined (no longer defaults to true)', () => {
            const appEmbed = new AppEmbed(getRootEl(), {});
            expect(appEmbed['isFullAppEmbedWithVisiblePrimaryNavbar']()).toBe(false);
        });

        test('should return false for AppEmbed with showPrimaryNavbar = false', () => {
            const appEmbed = new AppEmbed(getRootEl(), { showPrimaryNavbar: false });
            expect(appEmbed['isFullAppEmbedWithVisiblePrimaryNavbar']()).toBe(false);
        });

        test('should return false for SearchEmbed (not FullAppEmbed)', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), {});
            expect(searchEmbed['isFullAppEmbedWithVisiblePrimaryNavbar']()).toBe(false);
        });

        test('should return false for LiveboardEmbed (not FullAppEmbed)', () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), { liveboardId: 'test-id' });
            expect(liveboardEmbed['isFullAppEmbedWithVisiblePrimaryNavbar']()).toBe(false);
        });
    });

    describe('when thoughtSpotHost have value and authPromise return error', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
        });

        beforeEach(async () => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockRejectedValueOnce(false);
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            const iFrame: any = document.createElement('div');
            iFrame.contentWindow = null;
            jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);
            jest.spyOn(logger, 'error');
            await tsEmbed.render();
        });

        test('mixpanel should call with VISUAL_SDK_RENDER_FAILED', () => {
            expect(mockMixPanelEvent).toHaveBeenCalledWith(MIXPANEL_EVENT.VISUAL_SDK_RENDER_START);
            expect(mockMixPanelEvent).toHaveBeenCalledWith(MIXPANEL_EVENT.VISUAL_SDK_RENDER_FAILED, {
                error: 'false',
            });
        });
    });

    describe('when visible actions are set', () => {
        test('should throw error when there are both visible and hidden actions - pinboard', async () => {
            jest.spyOn(logger, 'error');
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                hiddenActions: [Action.DownloadAsCsv],
                visibleActions: [Action.DownloadAsCsv],
                ...defaultViewConfig,
                pinboardId,
            } as LiveboardViewConfig);
            await pinboardEmbed.render();
            expect(pinboardEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.CONFLICTING_ACTIONS_CONFIG,
                code: EmbedErrorCodes.CONFLICTING_ACTIONS_CONFIG,
                error: ERROR_MESSAGE.CONFLICTING_ACTIONS_CONFIG,
            });
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
            jest.spyOn(logger, 'error');
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                hiddenActions,
                visibleActions,
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            await liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.CONFLICTING_ACTIONS_CONFIG,
                code: EmbedErrorCodes.CONFLICTING_ACTIONS_CONFIG,
                error: ERROR_MESSAGE.CONFLICTING_ACTIONS_CONFIG,
            });
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
            jest.spyOn(logger, 'error');
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                visibleTabs: [tabId1],
                hiddenTabs: [tabId2],
                ...defaultViewConfig,
                pinboardId,
            } as LiveboardViewConfig);
            await pinboardEmbed.render();
            expect(pinboardEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.CONFLICTING_TABS_CONFIG,
                code: EmbedErrorCodes.CONFLICTING_TABS_CONFIG,
                error: ERROR_MESSAGE.CONFLICTING_TABS_CONFIG,
            });
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
            jest.spyOn(logger, 'error');
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                hiddenTabs,
                visibleTabs,
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            await liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.CONFLICTING_TABS_CONFIG,
                code: EmbedErrorCodes.CONFLICTING_TABS_CONFIG,
                error: ERROR_MESSAGE.CONFLICTING_TABS_CONFIG,
            });
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
            jest.spyOn(logger, 'error');
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            await tsEmbed.render();
            expect(tsEmbed['isError']).toBe(true);
            expect(logger.error).toHaveBeenCalledWith({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.INIT_SDK_REQUIRED,
                code: EmbedErrorCodes.INIT_ERROR,
                error: ERROR_MESSAGE.INIT_SDK_REQUIRED,
            });
        });
    });

    describe('V1Embed ', () => {
        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(() => 'http://tshost');
        });

        test('when isRendered is true than isError will be true', async () => {
            jest.spyOn(logger, 'warn');
            const viEmbedIns = new tsEmbedInstance.V1Embed(getRootEl(), defaultViewConfig);
            expect(viEmbedIns['isError']).toBe(false);
            await viEmbedIns.render();
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
            jest.spyOn(logger, 'log');
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
        xit('Sets the forceSAMLAutoRedirect param', async () => {
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
            expect(getIFrameSrc()).toContain('authType=EmbeddedSSO');
            expect(getIFrameSrc()).toContain('forceSAMLAutoRedirect=true');
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

        it('Should not add contextMenuEnabledOnWhichClick flag to the iframe src when it is not passed', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);

            liveboardEmbed.render();
            await executeAfterWait(() => {
                expectUrlMatchesWithParams(
                    getIFrameSrc(),
                    `http://${thoughtSpotHost}/?embedApp=true${defaultParams}#/embed/viz/${liveboardId}`,
                );
            });

            const defaultConfig: SageViewConfig = {
                disableWorksheetChange: false,
                hideWorksheetSelector: false,
                hideSageAnswerHeader: false,
                hideAutocompleteSuggestions: false,
                hideSampleQuestions: false,
                isProductTour: false,
                dataPanelV2: false,
            };

            const sageEmbed = new SageEmbed(getRootEl(), {
                ...defaultConfig,
            } as SageViewConfig);

            sageEmbed.render();
            await executeAfterWait(() => {
                expectUrlMatch(
                    getIFrameSrc(),
                    `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=false&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
                );
            });
        });

        it('Should add contextMenuEnabledOnWhichClick flag to the iframe with left value', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                contextMenuTrigger: ContextMenuTriggerOptions.LEFT_CLICK,
            } as LiveboardViewConfig);

            liveboardEmbed.render();
            await executeAfterWait(() => {
                expectUrlMatchesWithParams(
                    getIFrameSrc(),
                    `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&contextMenuEnabledOnWhichClick=left#/embed/viz/${liveboardId}`,
                );
            });

            const defaultConfig: SageViewConfig = {
                disableWorksheetChange: false,
                hideWorksheetSelector: false,
                hideSageAnswerHeader: false,
                hideAutocompleteSuggestions: false,
                hideSampleQuestions: false,
                isProductTour: false,
                dataPanelV2: false,
            };

            const sageEmbed = new SageEmbed(getRootEl(), {
                ...defaultConfig,
                contextMenuTrigger: ContextMenuTriggerOptions.LEFT_CLICK,
            } as SageViewConfig);

            sageEmbed.render();
            await executeAfterWait(() => {
                expectUrlMatch(
                    getIFrameSrc(),
                    `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=false&contextMenuEnabledOnWhichClick=left&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
                );
            });
        });

        it('Should add contextMenuEnabledOnWhichClick flag to the iframe with right value', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                contextMenuTrigger: ContextMenuTriggerOptions.RIGHT_CLICK,
            } as LiveboardViewConfig);

            liveboardEmbed.render();
            await executeAfterWait(() => {
                expectUrlMatchesWithParams(
                    getIFrameSrc(),
                    `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&contextMenuEnabledOnWhichClick=right#/embed/viz/${liveboardId}`,
                );
            });
            const defaultConfig: SageViewConfig = {
                disableWorksheetChange: false,
                hideWorksheetSelector: false,
                hideSageAnswerHeader: false,
                hideAutocompleteSuggestions: false,
                hideSampleQuestions: false,
                isProductTour: false,
                dataPanelV2: false,
            };

            const sageEmbed = new SageEmbed(getRootEl(), {
                ...defaultConfig,
                contextMenuTrigger: ContextMenuTriggerOptions.RIGHT_CLICK,
            } as SageViewConfig);

            sageEmbed.render();
            await executeAfterWait(() => {
                expectUrlMatch(
                    getIFrameSrc(),
                    `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=false&contextMenuEnabledOnWhichClick=right&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
                );
            });
        });

        it('Should add contextMenuEnabledOnWhichClick flag to the iframe with both value', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                contextMenuTrigger: ContextMenuTriggerOptions.BOTH_CLICKS,
            } as LiveboardViewConfig);

            liveboardEmbed.render();
            await executeAfterWait(() => {
                expectUrlMatchesWithParams(
                    getIFrameSrc(),
                    `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&contextMenuEnabledOnWhichClick=both#/embed/viz/${liveboardId}`,
                );
            });
            const defaultConfig: SageViewConfig = {
                disableWorksheetChange: false,
                hideWorksheetSelector: false,
                hideSageAnswerHeader: false,
                hideAutocompleteSuggestions: false,
                hideSampleQuestions: false,
                isProductTour: false,
                dataPanelV2: false,
            };

            const sageEmbed = new SageEmbed(getRootEl(), {
                ...defaultConfig,
                contextMenuTrigger: ContextMenuTriggerOptions.BOTH_CLICKS,
            } as SageViewConfig);

            sageEmbed.render();
            await executeAfterWait(() => {
                expectUrlMatch(
                    getIFrameSrc(),
                    `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=false&contextMenuEnabledOnWhichClick=both&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
                );
            });
        });
    });

    describe('validate getThoughtSpotPostUrlParams', () => {
        const { location } = window;

        beforeAll(() => {
            delete window.location;
            (window as any).location = {
                assign: jest.fn(),
            };
        });

        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(() => 'http://tshost');
        });

        afterAll((): void => {
            (window.location as any) = location;
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
            rootEle?.remove();
            jest.clearAllMocks();
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
            const warnSpy = jest.spyOn(logger, 'warn');
            libEmbed.showPreRender();
            expect(warnSpy).toHaveBeenCalledTimes(1);

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

            jest.spyOn(logger, 'error');
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
            jest.spyOn(libEmbed, 'preRender');
            libEmbed.hidePreRender();
            expect(libEmbed.preRender).toHaveBeenCalledTimes(0);
        });

        it('should set overflow:hidden when hidePreRender and remove when showPreRender', async () => {
            createRootEleForEmbed();

            (window as any).ResizeObserver = window.ResizeObserver
                || jest.fn().mockImplementation(() => ({
                    disconnect: jest.fn(),
                    observe: jest.fn(),
                    unobserve: jest.fn(),
                }));

            const libEmbed = new LiveboardEmbed('#tsEmbedDiv', {
                preRenderId: 'overflow-test',
                liveboardId: 'myLiveboardId',
            });

            await libEmbed.preRender();
            await waitFor(() => !!getIFrameEl());

            const preRenderIds = libEmbed.getPreRenderIds();
            const preRenderWrapper = document.getElementById(preRenderIds.wrapper);

            // After preRender (calls hidePreRender by default)
            // should have overflow:hidden
            expect(preRenderWrapper.style.overflow).toBe('hidden');
            expect(preRenderWrapper.style.opacity).toBe('0');

            // After showPreRender, overflow should be removed
            // to inherit from CSS
            libEmbed.showPreRender();
            expect(preRenderWrapper.style.overflow).toBe('');
            expect(preRenderWrapper.style.opacity).toBe('');

            // After hidePreRender again, overflow should be hidden
            libEmbed.hidePreRender();
            expect(preRenderWrapper.style.overflow).toBe('hidden');
            expect(preRenderWrapper.style.opacity).toBe('0');
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
            jest.spyOn(libEmbed, 'preRender');
            jest.spyOn(logger, 'error');
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
            expect(logger.error).toHaveBeenCalledWith(
                'PreRender should be called before using syncPreRenderStyle',
            );
            (logger.error as any).mockClear();
        });
    });

    describe('IdleSessionTimeout embedEvent for TrustedAuthTokenCookieless authType with autoLogin true', () => {
        beforeAll(() => {
            jest.spyOn(authInstance, 'doCookielessTokenAuth').mockResolvedValueOnce(true);
            jest.spyOn(authService, 'verifyTokenService').mockResolvedValueOnce(true);
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthTokenCookieless,
                getAuthToken: () => Promise.resolve('test_auth_token2'),
                autoLogin: true,
            });
        });

        test('should handle idle session timeout and send updated auth token', async () => {
            const mockEmbedEventPayload = {
                type: EmbedEvent.IdleSessionTimeout,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            jest.spyOn(baseInstance, 'handleAuth');
            jest.spyOn(baseInstance, 'notifyAuthFailure');

            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
                    authInstance.AuthFailureType.IDLE_SESSION_TIMEOUT,
                );
                expect(baseInstance.handleAuth).toHaveBeenCalled();
                expect(mockPort.postMessage).toHaveBeenCalledWith({
                    type: EmbedEvent.IdleSessionTimeout,
                    data: { authToken: 'test_auth_token2' },
                });
            });
        });

        test('should handle idle session timeout and show login failure message if token fetch fails', async () => {
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthTokenCookieless,
                getAuthToken: () => Promise.reject(),
                autoLogin: true,
            });

            const mockEmbedEventPayload = {
                type: EmbedEvent.IdleSessionTimeout,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            jest.spyOn(baseInstance, 'notifyAuthFailure');
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(getRootEl().innerHTML).toContain('Not logged in');
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
                    authInstance.AuthFailureType.IDLE_SESSION_TIMEOUT,
                );
                expect(loggerSpy).toHaveBeenCalledTimes(1);
            });

            jest.spyOn(authService, 'verifyTokenService').mockClear();
            jest.spyOn(baseInstance, 'notifyAuthFailure').mockClear();
        });

        test('should handle idle session timeout and show login failure message if handleAuth fails', async () => {
            init({
                thoughtSpotHost: 'tshost',
                customizations: customisations,
                authType: AuthType.TrustedAuthTokenCookieless,
                getAuthToken: () => Promise.resolve('test_auth_token2'),
                autoLogin: true,
            });

            const mockEmbedEventPayload = {
                type: EmbedEvent.IdleSessionTimeout,
                data: {},
            };
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            jest.spyOn(baseInstance, 'notifyAuthFailure');
            jest.spyOn(authInstance, 'authenticate').mockResolvedValue(false);
            searchEmbed.render();
            const mockPort: any = {
                postMessage: jest.fn(),
            };
            const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
            await executeAfterWait(() => {
                expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
                    authInstance.AuthFailureType.IDLE_SESSION_TIMEOUT,
                );
                expect(loggerSpy).toHaveBeenCalledTimes(0);
            });

            jest.spyOn(authService, 'verifyTokenService').mockClear();
            jest.spyOn(baseInstance, 'notifyAuthFailure').mockClear();
        });
    });

    describe('Renders should wait for init to completed', () => {
        const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
        beforeEach(() => {
            errorSpy.mockClear();
            resetValueFromWindow('initFlagKey');
            baseInstance.createAndSetInitPromise();
            document.body.innerHTML = getDocumentBody();
        });
        test('Pre-render should wait for init to complete', async () => {
            const lib = new LiveboardEmbed(getRootEl(), { preRenderId: 'test', liveboardId: 'test' });
            lib.preRender();
            await executeAfterWait(() => {
                expect(errorSpy).toHaveBeenCalledWith(ERROR_MESSAGE.RENDER_CALLED_BEFORE_INIT);
                expect(getRootEl().innerHTML).toContain('');
            });

            const iframeBeforeInit = getIFrameEl();
            expect(iframeBeforeInit).toBe(null);

            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });

            await waitFor(() => !!getIFrameEl());
            const preRenderId = lib.getPreRenderIds().wrapper;
            expect(document.getElementById(preRenderId)).not.toBe(null);
            const iframeAfterInit = getIFrameEl();
            expect(iframeAfterInit).not.toBe(null);
        });

        test('Render should wait for init to complete', async () => {
            const lib = new LiveboardEmbed(getRootEl(), { liveboardId: 'test' });
            lib.render();
            await executeAfterWait(() => {
                expect(errorSpy).toHaveBeenCalledWith(ERROR_MESSAGE.RENDER_CALLED_BEFORE_INIT);
                expect(getRootEl().innerHTML).toContain('');
            });

            const iframeBeforeInit = getIFrameEl();
            expect(iframeBeforeInit).toBe(null);

            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });

            await waitFor(() => !!getIFrameEl());
            expect(getRootEl()).not.toBe(null);
            const iframeAfterInit = getIFrameEl();
            expect(iframeAfterInit).not.toBe(null);
        });

        test('Pre Render Generic should wait for init to complete', async () => {
            const lib = new LiveboardEmbed(getRootEl(), {});
            lib.prerenderGeneric();
            await executeAfterWait(() => {
                expect(errorSpy).toHaveBeenCalledWith(ERROR_MESSAGE.RENDER_CALLED_BEFORE_INIT);
                expect(getRootEl().innerHTML).toContain('');
            });

            const iframeBeforeInit = getIFrameEl();
            expect(iframeBeforeInit).toBe(null);

            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });

            await waitFor(() => !!getIFrameEl());
            expect(getRootEl()).not.toBe(null);
            const iframeAfterInit = getIFrameEl();
            expect(iframeAfterInit).not.toBe(null);
        });
    });

    describe('AutoLogin behavior in updateAuthToken', () => {
        const mockPort = { postMessage: jest.fn() };
        const mockEmbedEventPayload = { type: EmbedEvent.AuthExpire, data: {} };

        beforeEach(() => {
            jest.clearAllMocks();
            document.body.innerHTML = getDocumentBody();
            mockPort.postMessage.mockClear();
            jest.spyOn(authToken, 'getAuthenticationToken').mockResolvedValue('mock-test-token-placeholder');

            jest.spyOn(baseInstance, 'handleAuth').mockImplementation(() => Promise.resolve(true));
            jest.spyOn(baseInstance, 'notifyAuthFailure').mockImplementation(() => { });
        });

        const renderAndTriggerAuthExpire = async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            await searchEmbed.render();
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
        };

        test('Cookieless with autoLogin undefined should default to true', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.TrustedAuthTokenCookieless,
                // autoLogin undefined
            });

            await renderAndTriggerAuthExpire();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).toHaveBeenCalled();
                expect(baseInstance.handleAuth).toHaveBeenCalledTimes(1);
                expect(mockPort.postMessage).toHaveBeenCalledWith({
                    type: EmbedEvent.AuthExpire,
                    data: { authToken: 'mock-test-token-placeholder' },
                });
            });
        });

        test('Cookieless with autoLogin false should not get auth token', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.TrustedAuthTokenCookieless,
                autoLogin: false,
            });

            await renderAndTriggerAuthExpire();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).not.toHaveBeenCalled();
                expect(baseInstance.handleAuth).toHaveBeenCalledTimes(1);
                expect(mockPort.postMessage).not.toHaveBeenCalled();
            });
        });

        test('Cookieless with autoLogin true should get auth token', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.TrustedAuthTokenCookieless,
                autoLogin: true,
            });

            await renderAndTriggerAuthExpire();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).toHaveBeenCalled();
                expect(baseInstance.handleAuth).toHaveBeenCalledTimes(1);
                expect(mockPort.postMessage).toHaveBeenCalledWith({
                    type: EmbedEvent.AuthExpire,
                    data: { authToken: 'mock-test-token-placeholder' },
                });
            });
        });

        test('Other authType with autoLogin undefined should default to false', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                // autoLogin undefined
            });

            await renderAndTriggerAuthExpire();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).not.toHaveBeenCalled();
                expect(baseInstance.handleAuth).toHaveBeenCalledTimes(1);
            });
        });

        test('Other authType with autoLogin true should call handleAuth', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                autoLogin: true,
            });

            await renderAndTriggerAuthExpire();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).not.toHaveBeenCalled();
                expect(baseInstance.handleAuth).toHaveBeenCalledTimes(2);
            });
        });

        test('Other authType with autoLogin false should not call handleAuth', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                autoLogin: false,
            });

            await renderAndTriggerAuthExpire();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).not.toHaveBeenCalled();
                expect(baseInstance.handleAuth).toHaveBeenCalledTimes(1);
            });
        });

        afterEach(() => {
            expect(baseInstance.notifyAuthFailure).toHaveBeenCalledWith(
                authInstance.AuthFailureType.EXPIRY
            );
        });
    });

    describe('AutoLogin behavior in tokenRefresh', () => {
        const mockPort = { postMessage: jest.fn() };
        const mockEmbedEventPayload = { type: EmbedEvent.RefreshAuthToken, data: {} };

        beforeEach(() => {
            jest.clearAllMocks();
            document.body.innerHTML = getDocumentBody();
            mockPort.postMessage.mockClear();
            jest.spyOn(authToken, 'getAuthenticationToken').mockResolvedValue('mock-test-token-placeholder');
            jest.spyOn(processData, 'processAuthFailure').mockImplementation(() => ({} as any));
            jest.spyOn(logger, 'error').mockImplementation(() => {});
        });

        const renderAndTriggerRefreshAuthToken = async () => {
            const spotterEmbed = new SpotterEmbed(getRootEl(), {
                worksheetId: 'test-worksheet',
                searchOptions: {
                    searchQuery: 'test query',
                },
            } as SpotterEmbedViewConfig);
            await spotterEmbed.render();
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
            });
        };

        test('Cookieless with autoLogin undefined should default to true and refresh token', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.TrustedAuthTokenCookieless,
                // autoLogin undefined
            });

            await renderAndTriggerRefreshAuthToken();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).toHaveBeenCalledWith(
                    expect.any(Object),
                    true
                );
            });
        });

        test('Cookieless with autoLogin true should refresh token', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.TrustedAuthTokenCookieless,
                autoLogin: true,
            });

            await renderAndTriggerRefreshAuthToken();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).toHaveBeenCalledWith(
                    expect.any(Object),
                    true
                );
            });
        });

        test('Cookieless with autoLogin false should not refresh token', async () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.TrustedAuthTokenCookieless,
                autoLogin: false,
            });

            await renderAndTriggerRefreshAuthToken();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).not.toHaveBeenCalled();
                expect(mockPort.postMessage).not.toHaveBeenCalled();
            });
        });

        test('Should handle error when getAuthenticationToken fails', async () => {
            const error = new Error('Token fetch failed');
            jest.spyOn(authToken, 'getAuthenticationToken').mockRejectedValue(error);

            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.TrustedAuthTokenCookieless,
                autoLogin: true,
            });

            await renderAndTriggerRefreshAuthToken();

            await executeAfterWait(() => {
                expect(authToken.getAuthenticationToken).toHaveBeenCalledWith(
                    expect.any(Object),
                    true
                );
                // Check that logger.error was called with the token refresh error
                const errorCalls = (logger.error as jest.Mock).mock.calls.filter(
                    (call) => call[0]?.includes(ERROR_MESSAGE.INVALID_TOKEN_ERROR) && call[0]?.includes('Token fetch failed')
                );
                expect(errorCalls.length).toBeGreaterThan(0);
                expect(processData.processAuthFailure).toHaveBeenCalledWith(
                    error,
                    expect.any(Element)
                );
                expect(mockPort.postMessage).not.toHaveBeenCalled();
            });
        });
    });

    describe('Fullscreen Change Handler', () => {
        beforeEach(() => {
            document.body.innerHTML = getDocumentBody();
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                disableFullscreenPresentation: false,
            });
        });

        test('should have setupFullscreenChangeHandler method', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            expect(typeof searchEmbed['setupFullscreenChangeHandler']).toBe('function');
        });

        test('should have removeFullscreenChangeHandler method', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            expect(typeof searchEmbed['removeFullscreenChangeHandler']).toBe('function');
        });

        test('should call setupFullscreenChangeHandler without errors', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            expect(() => {
                searchEmbed['setupFullscreenChangeHandler']();
            }).not.toThrow();
        });

        test('should call removeFullscreenChangeHandler without errors', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            expect(() => {
                searchEmbed['removeFullscreenChangeHandler']();
            }).not.toThrow();
        });

        test('should handle fullscreen change when feature flag is disabled', () => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                disableFullscreenPresentation: true,
            });

            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            expect(() => {
                searchEmbed['setupFullscreenChangeHandler']();
            }).not.toThrow();
        });
    });

    describe('Embed Container Loading', () => {
        beforeEach(() => {
            document.body.innerHTML = getDocumentBody();
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
            jest.spyOn(sessionInfoService, 'getSessionInfo').mockResolvedValue({
                releaseVersion: '1.0.0',
                userGUID: '1234567890',
                currentOrgId: 1,
                privileges: [],
                mixpanelToken: '1234567890',
                isPublicUser: false,
                clusterId: 'cluster1',
                clusterName: 'Test Cluster',
            });
        });

        test('should initialize with isEmbedContainerLoaded as false', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            expect(searchEmbed.isEmbedContainerLoaded).toBe(false);
        });

        test('should have empty embedContainerReadyCallbacks array initially', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            expect(searchEmbed['embedContainerReadyCallbacks']).toEqual([]);
        });

        test('should execute callback immediately if embed container is already loaded', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.isEmbedContainerLoaded = true;

            const callback = jest.fn();
            searchEmbed['executeAfterEmbedContainerLoaded'](callback);

            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('should queue callback if embed container is not loaded', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.isEmbedContainerLoaded = false;

            const callback = jest.fn();
            searchEmbed['executeAfterEmbedContainerLoaded'](callback);

            expect(callback).not.toHaveBeenCalled();
            expect(searchEmbed['embedContainerReadyCallbacks']).toContain(callback);
        });

        test('should execute all queued callbacks when embed container becomes ready', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.isEmbedContainerLoaded = false;

            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const callback3 = jest.fn();

            searchEmbed['executeAfterEmbedContainerLoaded'](callback1);
            searchEmbed['executeAfterEmbedContainerLoaded'](callback2);
            searchEmbed['executeAfterEmbedContainerLoaded'](callback3);

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
            expect(callback3).not.toHaveBeenCalled();

            // Simulate embed container becoming ready
            searchEmbed['executeEmbedContainerReadyCallbacks']();

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
            expect(callback3).toHaveBeenCalledTimes(1);
        });

        test('should handle AuthInit event and set embed container as loaded after timeout', async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                expect(iframe).toBeTruthy();
            });

            const iframe = getIFrameEl();
            const callback = jest.fn();
            searchEmbed['executeAfterEmbedContainerLoaded'](callback);

            // Simulate AuthInit event
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.AuthInit,
            });

            expect(callback).not.toHaveBeenCalled();
            expect(searchEmbed.isEmbedContainerLoaded).toBe(false);

            // Wait for the 1-second timeout
            await executeAfterWait(() => {
                expect(searchEmbed.isEmbedContainerLoaded).toBe(true);
                expect(callback).toHaveBeenCalledTimes(1);
            }, 1100);
        });

        test('should handle EmbedListenerReady event and set embed container as loaded immediately', async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.render();

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                expect(iframe).toBeTruthy();
            });

            const iframe = getIFrameEl();
            const callback = jest.fn();
            searchEmbed['executeAfterEmbedContainerLoaded'](callback);

            // Simulate EmbedListenerReady event
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.EmbedListenerReady,
            });

            await executeAfterWait(() => {
                expect(searchEmbed.isEmbedContainerLoaded).toBe(true);
                expect(callback).toHaveBeenCalledTimes(1);
            });
        });

        test('should check prerendered object for embed container loaded state', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);

            // Mock a prerendered object with loaded state
            const mockPreRenderObj = {
                isEmbedContainerLoaded: true,
            };

            jest.spyOn(searchEmbed as any, 'getPreRenderObj').mockReturnValue(mockPreRenderObj as any);

            const result = searchEmbed['checkEmbedContainerLoaded']();

            expect(result).toBe(true);
            expect(searchEmbed.isEmbedContainerLoaded).toBe(true);
        });

        test('should return getPreRenderObj and log if same object', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            const loggerSpy = jest.spyOn(logger, 'info');

            // Mock insertedDomEl to have the embed object
            (searchEmbed as any).insertedDomEl = {
                [searchEmbed['embedNodeKey']]: searchEmbed,
            };

            const result = searchEmbed['getPreRenderObj']();

            expect(result).toBe(searchEmbed);
            expect(loggerSpy).toHaveBeenCalledWith('embedObj is same as this');
        });

        test('should handle null/undefined callbacks gracefully', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);

            expect(() => {
                searchEmbed['executeAfterEmbedContainerLoaded'](null);
                searchEmbed['executeAfterEmbedContainerLoaded'](undefined);
            }).not.toThrow();
        });

        test('should handle multiple callback executions correctly', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);

            const callback1 = jest.fn();
            const callback2 = jest.fn();

            // Add callbacks when container is not loaded
            searchEmbed['executeAfterEmbedContainerLoaded'](callback1);
            searchEmbed['executeAfterEmbedContainerLoaded'](callback2);

            // Execute callbacks
            searchEmbed['executeEmbedContainerReadyCallbacks']();

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);

            // Add another callback after container is loaded
            searchEmbed.isEmbedContainerLoaded = true;
            const callback3 = jest.fn();
            searchEmbed['executeAfterEmbedContainerLoaded'](callback3);

            expect(callback3).toHaveBeenCalledTimes(1);
        });

        describe('getCurrentContext', () => {
            const mockContext: ContextObject = {
                stack: [
                    {
                        name: 'Liveboard',
                        type: 'Liveboard' as any,
                        objectIds: { liveboardId: 'lb-123' },
                    },
                ],
                currentContext: {
                    name: 'Liveboard',
                    type: 'Liveboard' as any,
                    objectIds: { liveboardId: 'lb-123' },
                },
            };

            test('should return context when embed container is already loaded', async () => {
                const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
                searchEmbed.isEmbedContainerLoaded = true;

                const triggerSpy = jest.spyOn(searchEmbed, 'trigger')
                    .mockResolvedValue(mockContext);

                const context = await searchEmbed.getCurrentContext();

                expect(context).toEqual(mockContext);
                expect(triggerSpy).toHaveBeenCalledWith(HostEvent.GetPageContext, {});
            });

            test('should wait for embed container to load before returning context', async () => {
                const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
                searchEmbed.isEmbedContainerLoaded = false;

                const triggerSpy = jest.spyOn(searchEmbed, 'trigger')
                    .mockResolvedValue(mockContext);

                const contextPromise = searchEmbed.getCurrentContext();

                // Context should not be resolved yet
                await executeAfterWait(() => {
                    expect(triggerSpy).not.toHaveBeenCalled();
                }, 10);

                // Simulate embed container becoming ready
                searchEmbed['executeEmbedContainerReadyCallbacks']();

                const context = await contextPromise;

                expect(context).toEqual(mockContext);
                expect(triggerSpy).toHaveBeenCalledWith(HostEvent.GetPageContext, {});
            });
        });

        test('should register embed container event handlers during construction', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);

            // Check that the event handlers are registered
            const eventHandlerMap = searchEmbed['eventHandlerMap'];
            expect(eventHandlerMap.has(EmbedEvent.AuthInit)).toBe(true);
            expect(eventHandlerMap.has(EmbedEvent.EmbedListenerReady)).toBe(true);
        });

        test('should handle handleEmbedContainerLoaded with AuthInit source', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            jest.useFakeTimers();

            const handler = searchEmbed['createEmbedContainerHandler'](EmbedEvent.AuthInit);

            expect(searchEmbed.isEmbedContainerLoaded).toBe(false);

            handler();

            expect(searchEmbed.isEmbedContainerLoaded).toBe(false);

            // Fast-forward time
            jest.advanceTimersByTime(1000);

            expect(searchEmbed.isEmbedContainerLoaded).toBe(true);

            jest.useRealTimers();
        });

        test('should handle handleEmbedContainerLoaded with EmbedListenerReady source', () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);

            const handler = searchEmbed['createEmbedContainerHandler'](EmbedEvent.EmbedListenerReady);

            expect(searchEmbed.isEmbedContainerLoaded).toBe(false);

            handler();

            expect(searchEmbed.isEmbedContainerLoaded).toBe(true);
        });
    });

    describe('Online event listener registration after auth failure', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                loginFailedMessage: 'Not logged in',
            });
        });

        test('should register online event listener when authentication fails', async () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            jest.spyOn(baseInstance, 'getAuthPromise').mockRejectedValueOnce(
                new Error('Auth failed'),
            );
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            addEventListenerSpy.mockClear();
            await searchEmbed.render();
            await executeAfterWait(() => {
                expect(getRootEl().innerHTML).toContain('Not logged in');
                const onlineListenerCalls = addEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === 'online',
                );
                expect(onlineListenerCalls).toHaveLength(1);
                const offlineListenerCalls = addEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === 'offline',
                );
                expect(offlineListenerCalls).toHaveLength(1);
                const messageListenerCalls = addEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === 'message',
                );
                expect(messageListenerCalls).toHaveLength(0);
            });

            addEventListenerSpy.mockRestore();
        });

        test('should attempt to trigger reload when online event occurs after auth failure', async () => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockRejectedValueOnce(
                new Error('Auth failed'),
            );
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            const triggerSpy = jest.spyOn(searchEmbed, 'trigger').mockResolvedValue(null);
            await searchEmbed.render();

            await executeAfterWait(() => {
                expect(getRootEl().innerHTML).toContain('Not logged in');
                triggerSpy.mockClear();
                const onlineEvent = new Event('online');
                window.dispatchEvent(onlineEvent);
                expect(triggerSpy).toHaveBeenCalledWith(HostEvent.Reload);
            });

            triggerSpy.mockReset();
        });

        test('should handle online event gracefully when no iframe exists', async () => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockRejectedValueOnce(
                new Error('Auth failed'),
            );
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            await searchEmbed.render();
            await executeAfterWait(() => {
                expect(getRootEl().innerHTML).toContain('Not logged in');
                const onlineEvent = new Event('online');
                expect(() => {
                    window.dispatchEvent(onlineEvent);
                }).not.toThrow();
            });

            errorSpy.mockReset();
        });

        test('should register all event listeners when authentication succeeds', async () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(true);
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            addEventListenerSpy.mockClear();
            await searchEmbed.render();
            await executeAfterWait(() => {
                const onlineListenerCalls = addEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === 'online',
                );
                expect(onlineListenerCalls).toHaveLength(1);
                const offlineListenerCalls = addEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === 'offline',
                );
                expect(offlineListenerCalls).toHaveLength(1);
                const messageListenerCalls = addEventListenerSpy.mock.calls.filter(
                    (call) => call[0] === 'message',
                );
                expect(messageListenerCalls).toHaveLength(1);
            });

            addEventListenerSpy.mockRestore();
        });
        test('should successfully trigger reload when online event occurs after auth success', async () => {
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(true);
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            const triggerSpy = jest.spyOn(searchEmbed, 'trigger').mockResolvedValue({} as any);
            await searchEmbed.render();
            await executeAfterWait(() => {
                triggerSpy.mockClear();
                const onlineEvent = new Event('online');
                window.dispatchEvent(onlineEvent);
                expect(triggerSpy).toHaveBeenCalledWith(HostEvent.Reload);
            });
            triggerSpy.mockReset();
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

        describe('with waitForCleanupOnDestroy configuration', () => {
            let originalEmbedConfig: any;

            beforeEach(() => {
                originalEmbedConfig = embedConfig.getEmbedConfig();
            });

            afterEach(() => {
                embedConfig.setEmbedConfig(originalEmbedConfig);
            });

            it('should trigger DestroyEmbed event immediately when waitForCleanupOnDestroy is false', async () => {
                embedConfig.setEmbedConfig({
                    ...originalEmbedConfig,
                    waitForCleanupOnDestroy: false,
                });

                const appEmbed = new AppEmbed(getRootEl(), {
                    frameParams: {
                        width: '100%',
                        height: '100%',
                    },
                });
                await appEmbed.render();

                const triggerSpy = jest.spyOn(appEmbed, 'trigger').mockResolvedValue(null);
                const removeChildSpy = jest.spyOn(Node.prototype, 'removeChild').mockImplementation(() => getRootEl());

                appEmbed.destroy();

                expect(triggerSpy).toHaveBeenCalledWith(HostEvent.DestroyEmbed);
                expect(removeChildSpy).toHaveBeenCalled();
            });

            it('should trigger DestroyEmbed event and wait for cleanup when waitForCleanupOnDestroy is true', async () => {
                embedConfig.setEmbedConfig({
                    ...originalEmbedConfig,
                    waitForCleanupOnDestroy: true,
                    cleanupTimeout: 1000,
                });

                const appEmbed = new AppEmbed(getRootEl(), {
                    frameParams: {
                        width: '100%',
                        height: '100%',
                    },
                });
                await appEmbed.render();

                const triggerSpy = jest.spyOn(appEmbed, 'trigger').mockResolvedValue(null);
                const removeChildSpy = jest.spyOn(Node.prototype, 'removeChild').mockImplementation(() => getRootEl());

                appEmbed.destroy();

                // Should be called immediately when config is enabled
                expect(triggerSpy).toHaveBeenCalledWith(HostEvent.DestroyEmbed);

                // Wait for the timeout to complete
                await new Promise(resolve => setTimeout(resolve, 1100));

                expect(removeChildSpy).toHaveBeenCalled();
            });

            it('should handle Promise.race with successful cleanup completion', async () => {
                embedConfig.setEmbedConfig({
                    ...originalEmbedConfig,
                    waitForCleanupOnDestroy: true,
                    cleanupTimeout: 2000,
                });

                const appEmbed = new AppEmbed(getRootEl(), {
                    frameParams: {
                        width: '100%',
                        height: '100%',
                    },
                });
                await appEmbed.render();

                // Mock trigger to resolve quickly (before timeout)
                const triggerSpy = jest.spyOn(appEmbed, 'trigger').mockImplementation(() =>
                    new Promise(resolve => setTimeout(() => resolve(null), 100))
                );
                const removeChildSpy = jest.spyOn(Node.prototype, 'removeChild').mockImplementation(() => getRootEl());

                appEmbed.destroy();

                // Wait for the trigger to complete
                await new Promise(resolve => setTimeout(resolve, 200));

                expect(triggerSpy).toHaveBeenCalledWith(HostEvent.DestroyEmbed);
                expect(removeChildSpy).toHaveBeenCalled();
            });

            it('should handle Promise.race with timeout when cleanup takes too long', async () => {
                embedConfig.setEmbedConfig({
                    ...originalEmbedConfig,
                    waitForCleanupOnDestroy: true,
                    cleanupTimeout: 100,
                });

                const appEmbed = new AppEmbed(getRootEl(), {
                    frameParams: {
                        width: '100%',
                        height: '100%',
                    },
                });
                await appEmbed.render();

                // Mock trigger to take longer than timeout
                const triggerSpy = jest.spyOn(appEmbed, 'trigger').mockImplementation(() =>
                    new Promise(resolve => setTimeout(() => resolve(null), 500))
                );
                const removeChildSpy = jest.spyOn(Node.prototype, 'removeChild').mockImplementation(() => getRootEl());

                appEmbed.destroy();

                // Wait for the timeout to complete
                await new Promise(resolve => setTimeout(resolve, 200));

                expect(triggerSpy).toHaveBeenCalledWith(HostEvent.DestroyEmbed);
                expect(removeChildSpy).toHaveBeenCalled();
            });
        });
    });

    describe('handleApiInterceptEvent', () => {
        beforeEach(() => {
            document.body.innerHTML = getDocumentBody();
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
            jest.clearAllMocks();
            mockHandleInterceptEvent.mockClear();
        });

        test('should call handleInterceptEvent with correct parameters', async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            await searchEmbed.render();

            const mockEventData = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=GetChartWithData',
                    init: {
                        method: 'POST',
                        body: JSON.stringify({
                            variables: {
                                session: { sessionId: 'session-123' },
                                contextBookId: 'viz-456'
                            }
                        })
                    }
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(() => {
                expect(mockHandleInterceptEvent).toHaveBeenCalledTimes(1);
                const call = mockHandleInterceptEvent.mock.calls[0][0];
                expect(call.eventData).toEqual(mockEventData);
                expect(call.executeEvent).toBeInstanceOf(Function);
                expect(call.getUnsavedAnswerTml).toBeInstanceOf(Function);
                expect(call.viewConfig).toMatchObject(defaultViewConfig);
            });
        });

        test('should execute callbacks through executeEvent function', async () => {
            let capturedExecuteEvent: any;
            mockHandleInterceptEvent.mockImplementation(async (params) => {
                capturedExecuteEvent = params.executeEvent;
            });

            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            const mockCallback = jest.fn();
            searchEmbed.on(EmbedEvent.CustomAction, mockCallback);
            await searchEmbed.render();

            const mockEventData = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=GetChartWithData',
                    init: {}
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(() => {
                expect(capturedExecuteEvent).toBeDefined();

                // Simulate executeEvent being called by handleInterceptEvent
                const testData = { test: 'data' };
                capturedExecuteEvent(EmbedEvent.CustomAction, testData);

                // executeEvent passes data as first param to callback
                expect(mockCallback).toHaveBeenCalled();
                expect(mockCallback.mock.calls[0][0]).toEqual(testData);
            });
        });

        test('should call triggerUIPassThrough through getUnsavedAnswerTml function', async () => {
            let capturedGetUnsavedAnswerTml: any;
            mockHandleInterceptEvent.mockImplementation(async (params) => {
                capturedGetUnsavedAnswerTml = params.getUnsavedAnswerTml;
            });

            const mockTmlResponse = { tml: 'test-tml-content' };
            mockProcessTrigger.mockResolvedValue([{ value: mockTmlResponse }]);

            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            await searchEmbed.render();

            const mockEventData = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=GetChartWithData',
                    init: {}
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(async () => {
                expect(capturedGetUnsavedAnswerTml).toBeDefined();

                // Clear previous calls
                mockProcessTrigger.mockClear();

                // Simulate getUnsavedAnswerTml being called by
                // handleInterceptEvent
                const result = await capturedGetUnsavedAnswerTml({
                    sessionId: 'session-123',
                    vizId: 'viz-456'
                });

                expect(mockProcessTrigger).toHaveBeenCalled();
                const callArgs = mockProcessTrigger.mock.calls[0];
                // Verify UIPassthrough event is triggered with the right params
                expect(callArgs[1]).toBe('UiPassthrough');
                expect(callArgs[3]).toMatchObject({
                    type: 'getUnsavedAnswerTML',
                    parameters: {
                        sessionId: 'session-123',
                        vizId: 'viz-456'
                    }
                });
                expect(result).toEqual(mockTmlResponse);
            });
        });

        test('should pass viewConfig to handleInterceptEvent', async () => {
            const customViewConfig = {
                ...defaultViewConfig,
                interceptUrls: ['/api/test'],
                interceptTimeout: 5000,
            };

            const searchEmbed = new SearchEmbed(getRootEl(), customViewConfig);
            await searchEmbed.render();

            const mockEventData = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/api/test',
                    init: {}
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(() => {
                const call = mockHandleInterceptEvent.mock.calls[0][0];
                expect(call.viewConfig).toMatchObject({
                    interceptUrls: ['/api/test'],
                    interceptTimeout: 5000,
                });
            });
        });

        test('should handle ApiIntercept event with eventPort', async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            await searchEmbed.render();

            const mockEventData = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=GetChartWithData',
                    init: {}
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(() => {
                expect(mockHandleInterceptEvent).toHaveBeenCalled();

                // Verify the executeEvent function uses the port
                const executeEventFn = mockHandleInterceptEvent.mock.calls[0][0].executeEvent;
                expect(executeEventFn).toBeDefined();
            });
        });

        test('should not process non-ApiIntercept events through handleApiInterceptEvent', async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            await searchEmbed.render();

            const mockEventData = {
                type: EmbedEvent.Save,
                data: { answerId: '123' },
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(() => {
                expect(mockHandleInterceptEvent).not.toHaveBeenCalled();
            });
        });

        test('should handle multiple ApiIntercept events', async () => {
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            await searchEmbed.render();

            const mockEventData1 = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=GetChartWithData',
                    init: {}
                })
            };

            const mockEventData2 = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=LoadContextBook',
                    init: {}
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData1, mockPort);
            });

            await executeAfterWait(() => {
                postMessageToParent(getIFrameEl().contentWindow, mockEventData2, mockPort);
            });

            await executeAfterWait(() => {
                expect(mockHandleInterceptEvent).toHaveBeenCalledTimes(2);
            });
        });

        test('should pass eventPort to executeCallbacks', async () => {
            let capturedExecuteEvent: any;
            mockHandleInterceptEvent.mockImplementation(async (params) => {
                capturedExecuteEvent = params.executeEvent;
            });

            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            const mockCallback = jest.fn();
            searchEmbed.on(EmbedEvent.ApiIntercept, mockCallback);
            await searchEmbed.render();

            const mockEventData = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=GetChartWithData',
                    init: {}
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(() => {
                expect(capturedExecuteEvent).toBeDefined();

                // Call executeEvent with a response
                const responseData = { execute: true };
                capturedExecuteEvent(EmbedEvent.ApiIntercept, responseData);

                // Verify the callback was invoked with the data
                expect(mockCallback).toHaveBeenCalled();
                expect(mockCallback.mock.calls[0][0]).toEqual(responseData);
            });
        });

        test('should handle getUnsavedAnswerTml with empty response', async () => {
            let capturedGetUnsavedAnswerTml: any;
            mockHandleInterceptEvent.mockImplementation(async (params) => {
                capturedGetUnsavedAnswerTml = params.getUnsavedAnswerTml;
            });

            mockProcessTrigger.mockResolvedValue([]);

            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            await searchEmbed.render();

            const mockEventData = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=GetChartWithData',
                    init: {}
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(async () => {
                expect(capturedGetUnsavedAnswerTml).toBeDefined();

                const result = await capturedGetUnsavedAnswerTml({
                    sessionId: 'session-123',
                    vizId: 'viz-456'
                });

                expect(result).toBeUndefined();
            });
        });

        test('should work with LiveboardEmbed', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId: 'test-liveboard-id',
            });
            await liveboardEmbed.render();

            const mockEventData = {
                type: EmbedEvent.ApiIntercept,
                data: JSON.stringify({
                    input: '/prism/?op=LoadContextBook',
                    init: {}
                })
            };

            const mockPort: any = {
                postMessage: jest.fn(),
            };

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, mockEventData, mockPort);
            });

            await executeAfterWait(() => {
                expect(mockHandleInterceptEvent).toHaveBeenCalledTimes(1);
                expect(mockHandleInterceptEvent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        eventData: mockEventData,
                    })
                );
            });
        });
    });
});


describe('Additional Coverage Tests', () => {
    beforeAll(() => {
        init({
            thoughtSpotHost: 'tshost',
            authType: AuthType.None,
        });
    });

    test('should handle getAuthTokenForCookielessInit with non-cookieless auth', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        const token = await searchEmbed['getAuthTokenForCookielessInit']();
        expect(token).toBe('');
    });

    test('should call setIFrameHeight', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        await searchEmbed.render();
        await executeAfterWait(() => {
            searchEmbed['setIFrameHeight'](500);
            expect(getIFrameEl().style.height).toBe('500px');
        });
    });

    test('should test getIframeCenter calculation', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        await searchEmbed.render();
        await executeAfterWait(() => {
            const center = searchEmbed['getIframeCenter']();
            expect(center).toHaveProperty('iframeCenter');
            expect(center).toHaveProperty('iframeHeight');
            expect(center).toHaveProperty('viewPortHeight');
        });
    });

    test('should handle preRender with replaceExistingPreRender=true', async () => {
        createRootEleForEmbed();
        const embed1 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId: 'test-replace',
            liveboardId: 'lb1',
        });
        await embed1.preRender();
        const embed2 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId: 'test-replace',
            liveboardId: 'lb2',
        });
        await embed2.preRender(false, true);
        expect(document.getElementById('tsEmbed-pre-render-wrapper-test-replace')).toBeTruthy();
    });

    test('should test getIframeSrc base implementation', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        expect(searchEmbed.getIframeSrc()).toBe('');
    });

    test('should handle createEmbedEventResponder with OnBeforeGetVizDataIntercept', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        const mockPort: any = { postMessage: jest.fn() };
        const responder = searchEmbed['createEmbedEventResponder'](
            mockPort,
            EmbedEvent.OnBeforeGetVizDataIntercept,
        );
        responder({ data: 'test' });
        expect(mockPort.postMessage).toHaveBeenCalled();
    });

    test('should clean up message event listeners', async () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        await searchEmbed.render();
        searchEmbed['unsubscribeToMessageEvents']();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });
});

describe('Trigger method edge cases', () => {
    beforeAll(() => {
        init({
            thoughtSpotHost: 'tshost',
            authType: AuthType.None,
        });
    });

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should handle error when trigger is called with undefined messageType', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        jest.spyOn(logger, 'error');
        await searchEmbed.render();

        await executeAfterWait(async () => {
            const result = await searchEmbed.trigger(undefined as any);
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                    code: EmbedErrorCodes.HOST_EVENT_TYPE_UNDEFINED,
                }),
            );
        });
    });

    test('should return null when trigger is called before iframe is ready', async () => {
        jest.spyOn(baseInstance, 'getAuthPromise').mockRejectedValueOnce(
            new Error('Auth failed'),
        );
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        jest.spyOn(logger, 'debug');
        await searchEmbed.render();

        await executeAfterWait(async () => {
            const result = await searchEmbed.trigger(HostEvent.Reload);
            expect(result).toBeNull();
        });
    });
});

describe('PreRender replaceExistingPreRender scenarios', () => {
    beforeAll(() => {
        init({
            thoughtSpotHost: 'tshost',
            authType: AuthType.None,
        });
    });

    afterEach(() => {
        const rootEle = document.getElementById('myRoot');
        rootEle?.remove();
    });

    test('should skip re-rendering when preRender already exists and replaceExistingPreRender is false', async () => {
        createRootEleForEmbed();
        const embed1 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId: 'no-replace-test',
            liveboardId: 'lb1',
        });
        await embed1.preRender();
        await waitFor(() => !!getIFrameEl());

        const embed2 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId: 'no-replace-test',
            liveboardId: 'lb2',
        });
        
        const result = await embed2.preRender(false, false);
        
        expect(result).toBe(embed2);
        // The original iframe should still have lb1
        const iframe = getIFrameEl();
        expect(iframe.src).toContain('lb1');
    });
});

describe('Destroy error handling', () => {
    beforeAll(() => {
        init({
            thoughtSpotHost: 'tshost',
            authType: AuthType.None,
        });
    });

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should handle error gracefully when destroy fails', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            frameParams: { width: '100%', height: '100%' },
        });
        await appEmbed.render();
        
        const logSpy = jest.spyOn(logger, 'log').mockImplementation(() => {});
        
        jest.spyOn(Node.prototype, 'removeChild').mockImplementationOnce(() => {
            throw new Error('Remove failed');
        });
        
        expect(() => {
            appEmbed.destroy();
        }).not.toThrow();
        
        expect(logSpy).toHaveBeenCalledWith('Error destroying TS Embed', expect.any(Error));
        logSpy.mockReset();
    });
});

describe('Fullscreen change handler behavior', () => {
    beforeAll(() => {
        init({
            thoughtSpotHost: 'tshost',
            authType: AuthType.None,
            disableFullscreenPresentation: false,
        });
    });

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should trigger ExitPresentMode when exiting fullscreen', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId: 'test-lb',
        });
        await liveboardEmbed.render();
        
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            expect(iframe).toBeTruthy();
        });

        mockProcessTrigger.mockResolvedValue({});
        
        liveboardEmbed['setupFullscreenChangeHandler']();
        
        Object.defineProperty(document, 'fullscreenElement', {
            value: null,
            writable: true,
            configurable: true,
        });
        
        const event = new Event('fullscreenchange');
        document.dispatchEvent(event);
        
        await executeAfterWait(() => {
            expect(mockProcessTrigger).toHaveBeenLastCalledWith(
                expect.any(Object),
                HostEvent.ExitPresentMode,
                expect.any(String),
                expect.any(Object),
                undefined,
            );
        });
    });

    test('should not trigger ExitPresentMode when entering fullscreen', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId: 'test-lb-fullscreen',
        });
        await liveboardEmbed.render();
        
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            expect(iframe).toBeTruthy();
        });

        mockProcessTrigger.mockClear();
        mockProcessTrigger.mockResolvedValue({});
        
        liveboardEmbed['setupFullscreenChangeHandler']();
        
        Object.defineProperty(document, 'fullscreenElement', {
            value: getIFrameEl(),
            writable: true,
            configurable: true,
        });
        
        const event = new Event('fullscreenchange');
        document.dispatchEvent(event);
        
        await executeAfterWait(() => {
            expect(mockProcessTrigger).not.toHaveBeenCalledWith(
                expect.any(Object),
                HostEvent.ExitPresentMode,
                expect.any(String),
                expect.any(Object),
            );
        });
    });
});

describe('ShowPreRender with UpdateEmbedParams', () => {
    const setupPreRenderTest = async (preRenderId: string, initialConfig: Partial<LiveboardViewConfig>) => {
        createRootEleForEmbed();
        mockMessageChannel();

        (window as any).ResizeObserver = window.ResizeObserver
            || jest.fn().mockImplementation(() => ({
                disconnect: jest.fn(),
                observe: jest.fn(),
                unobserve: jest.fn(),
            }));

        const embed1 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId,
            ...initialConfig,
        });
        
        await embed1.preRender();
        await waitFor(() => !!getIFrameEl());

        embed1.isEmbedContainerLoaded = true;

        mockProcessTrigger.mockClear();
        mockProcessTrigger.mockResolvedValue({});

        return embed1;
    };

    beforeAll(() => {
        init({
            thoughtSpotHost: 'tshost',
            authType: AuthType.None,
        });
    });

    afterEach(() => {
        const rootEle = document.getElementById('myRoot');
        rootEle?.remove();
    });

    test('should trigger UpdateEmbedParams when showPreRender connects to existing prerendered component', async () => {
        await setupPreRenderTest('update-params-test', { liveboardId: 'original-lb' });

        const embed2 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId: 'update-params-test',
            liveboardId: 'updated-lb',
        });

        embed2.showPreRender();

        await executeAfterWait(() => {
            expect(mockProcessTrigger).toHaveBeenLastCalledWith(
                expect.any(Object),
                HostEvent.UpdateEmbedParams,
                expect.any(String),
                expect.objectContaining({
                    liveboardId: 'updated-lb',
                }),
                undefined,
            );
        });
    });

    test('should trigger UpdateEmbedParams with runtime filters and visible vizs', async () => {
        await setupPreRenderTest('url-param-test', { liveboardId: 'original-lb' });

        const embed2 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId: 'url-param-test',
            liveboardId: 'original-lb',
            visibleVizs: ['viz-1'],
            runtimeFilters: [
                {
                    columnName: 'Color',
                    operator: RuntimeFilterOp.IN,
                    values: ['red', 'blue'],
                },
                {
                    columnName: 'Region',
                    operator: RuntimeFilterOp.EQ,
                    values: ['North'],
                },
            ],
        });

        embed2.showPreRender();

        await executeAfterWait(() => {
            expect(mockProcessTrigger).toHaveBeenLastCalledWith(
                expect.any(Object),
                HostEvent.UpdateEmbedParams,
                expect.any(String),
                expect.objectContaining({
                    liveboardId: 'original-lb',
                    visibleVizs: ['viz-1'],
                    runtimeFilters: [
                        {
                            columnName: 'Color',
                            operator: RuntimeFilterOp.IN,
                            values: ['red', 'blue'],
                        },
                        {
                            columnName: 'Region',
                            operator: RuntimeFilterOp.EQ,
                            values: ['North'],
                        },
                    ],
                }),
                undefined,
            );
        });
    });

    test('should trigger UpdateEmbedParams with updated config', async () => {
        await setupPreRenderTest('preserve-config-test', {
            liveboardId: 'original-lb',
            runtimeFilters: [
                {
                    columnName: 'Color',
                    operator: RuntimeFilterOp.IN,
                    values: ['red', 'blue'],
                },
            ],
        });

        const embed2 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId: 'preserve-config-test',
            liveboardId: 'original-lb',
            visibleVizs: ['viz-1', 'viz-2'],
            runtimeFilters: [
                {
                    columnName: 'Region',
                    operator: RuntimeFilterOp.EQ,
                    values: ['North'],
                },
            ],
        });

        embed2.showPreRender();

        await executeAfterWait(() => {
            expect(mockProcessTrigger).toHaveBeenLastCalledWith(
                expect.any(Object),
                HostEvent.UpdateEmbedParams,
                expect.any(String),
                expect.objectContaining({
                    liveboardId: 'original-lb',
                    visibleVizs: ['viz-1', 'viz-2'],
                    runtimeFilters: [
                        {
                            columnName: 'Region',
                            operator: RuntimeFilterOp.EQ,
                            values: ['North'],
                        },
                    ],
                }),
                undefined,
            );
        });
    });

    test('should handle error when getUpdateEmbedParamsObject fails during showPreRender', async () => {
        await setupPreRenderTest('error-test', { liveboardId: 'original-lb' });

        const handleErrorSpy = jest.spyOn(LiveboardEmbed.prototype as any, 'handleError');

        const embed2 = new LiveboardEmbed('#tsEmbedDiv', {
            preRenderId: 'error-test',
            liveboardId: 'updated-lb',
        });

        const mockError = new Error('Failed to get params');
        jest.spyOn(embed2 as any, 'getUpdateEmbedParamsObject').mockRejectedValue(mockError);

        embed2.showPreRender();

        await executeAfterWait(() => {
            expect(handleErrorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    errorType: ErrorDetailsTypes.API,
                    message: 'Failed to get params',
                    code: EmbedErrorCodes.UPDATE_PARAMS_FAILED,
                    error: 'Failed to get params',
                }),
            );

            expect(mockProcessTrigger).not.toHaveBeenCalledWith(
                expect.any(Object),
                HostEvent.UpdateEmbedParams,
                expect.any(String),
                expect.any(Object),
            );
        });

        handleErrorSpy.mockRestore();
    });
});
