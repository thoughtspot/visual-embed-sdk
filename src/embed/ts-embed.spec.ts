/* eslint-disable dot-notation */
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
import { Action } from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getIFrameSrc,
    getRootEl,
    postMessageToParent,
    defaultParamsForPinboardEmbed,
    waitFor,
} from '../test/test-utils';
import * as config from '../config';
import * as tsEmbedInstance from './ts-embed';
import * as mixpanelInstance from '../mixpanel-service';
import * as baseInstance from './base';
import { MIXPANEL_EVENT } from '../mixpanel-service';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const pinboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const liveboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const thoughtSpotHost = 'tshost';
const defaultParamsPost = '';

beforeAll(() => {
    spyOn(window, 'alert');
});

const customisations = {
    style: {
        customCSS: {},
        customCSSUrl: 'http://localhost:3000',
    },
    content: {},
};

const customisationsView = {
    style: {
        customCSS: {},
        customCSSUrl: 'http://localhost:8000',
    },
    content: {
        strings: {
            DATA: 'data',
        },
    },
};

describe('Unit test case for ts embed', () => {
    const mockMixPanelEvent = jest.spyOn(
        mixpanelInstance,
        'uploadMixpanelEvent',
    );
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Called Embed event status for start and end', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
                customizations: customisations,
                customCssUrl: 'http://localhost:5000',
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
                postMessageToParent(
                    iframe.contentWindow,
                    mockEmbedEventPayload,
                    mockPort,
                );
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: { customisations },
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
                postMessageToParent(
                    iframe.contentWindow,
                    mockEmbedEventPayload,
                    mockPort,
                );
            });
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: { customisations: customisationsView },
            });
            expect(getIFrameSrc()).toContain(
                `customCssUrl=${customisationsView.style.customCSSUrl}`,
            );
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
                postMessageToParent(
                    iframe.contentWindow,
                    mockEmbedEventPayload,
                );
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
                    console.log('non callable');
                })
                .render();

            executeAfterWait(() => {
                const iframe = getIFrameEl();
                iframe.contentWindow.postMessage = jest.fn();
                postMessageToParent(
                    iframe.contentWindow,
                    mockEmbedEventPayload,
                );
                expect(iframe.contentWindow.postMessage).toHaveBeenCalledTimes(
                    0,
                );
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
                postMessageToParent(
                    iframe.contentWindow,
                    mockEmbedEventPayload,
                );
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
                        console.log('non callable');
                    },
                    { start: true },
                )
                .render();

            executeAfterWait(() => {
                const iframe = getIFrameEl();
                iframe.contentWindow.postMessage = jest.fn();
                postMessageToParent(
                    iframe.contentWindow,
                    mockEmbedEventPayload,
                );
                expect(iframe.contentWindow.postMessage).toHaveBeenCalledTimes(
                    0,
                );
            }, 1000);
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
            jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValueOnce(
                isLoggedIn,
            );
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
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_START,
            );
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_COMPLETE,
            );
        });

        test('Should remove prefetch iframe', async () => {
            await setup(true);
            const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>(
                '.prefetchIframe',
            );
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
            jest.spyOn(baseInstance, 'getAuthPromise').mockRejectedValueOnce(
                false,
            );
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            const iFrame: any = document.createElement('div');
            iFrame.contentWindow = null;
            jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);
            tsEmbed.render();
        });

        test('mixpanel should call with VISUAL_SDK_RENDER_FAILED', () => {
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_START,
            );
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_FAILED,
            );
        });
    });

    describe('when visible actions are set', () => {
        test('should throw error when there are both visible and hidden actions - pinboard', async () => {
            spyOn(console, 'error');
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                hiddenActions: [Action.DownloadAsCsv],
                visibleActions: [Action.DownloadAsCsv],
                ...defaultViewConfig,
                pinboardId,
            } as LiveboardViewConfig);
            await pinboardEmbed.render();
            expect(pinboardEmbed['isError']).toBe(true);
            expect(console.error).toHaveBeenCalledWith(
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

        async function testActionsForLiveboards(
            hiddenActions: Array<Action>,
            visibleActions: Array<Action>,
        ) {
            spyOn(console, 'error');
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                hiddenActions,
                visibleActions,
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            await liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(true);
            expect(console.error).toHaveBeenCalledWith(
                'You cannot have both hidden actions and visible actions',
            );
        }
        test('should throw error when there are both visible and hidden action arrays', async () => {
            await testActionsForLiveboards(
                [Action.DownloadAsCsv],
                [Action.DownloadAsCsv],
            );
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

    describe('when thoughtSpotHost is empty', () => {
        beforeAll(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => '',
            );
            init({
                thoughtSpotHost: '',
                authType: AuthType.None,
            });
        });

        test('Error should be true', async () => {
            spyOn(console, 'error');
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            tsEmbed.render();
            expect(tsEmbed['isError']).toBe(true);
            expect(console.error).toHaveBeenCalledWith(
                'You need to init the ThoughtSpot SDK module first',
            );
        });
    });

    describe('V1Embed ', () => {
        test('when isRendered is true than isError will be true', () => {
            spyOn(console, 'error');
            const viEmbedIns = new tsEmbedInstance.V1Embed(
                getRootEl(),
                defaultViewConfig,
            );
            expect(viEmbedIns['isError']).toBe(false);
            viEmbedIns.render();
            viEmbedIns.on(EmbedEvent.CustomAction, jest.fn()).render();
            expect(viEmbedIns['isError']).toBe(true);
            expect(console.error).toHaveBeenCalledWith(
                'Please register event handlers before calling render',
            );
        });
    });

    describe('Navigate to Page API', () => {
        const path = 'viz/e0836cad-4fdf-42d4-bd97-567a6b2a6058';

        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => 'http://tshost',
            );
        });

        test('when app is PinboardEmbed after navigateToPage function call, new path should be set to iframe', async () => {
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                pinboardId: 'e0836cad-4fdf-42d4-bd97-567a6b2a6058',
            });
            await pinboardEmbed.render();
            // pinboardEmbed.navigateToPage(path);
            expect(getIFrameSrc()).toBe(
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
            appEmbed.navigateToPage(path);
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}${defaultParamsPost}#/${path}`,
            );
        });

        test('navigateToPage function use before render', async () => {
            spyOn(console, 'log');
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            appEmbed.navigateToPage(path);
            await appEmbed.render();
            expect(console.log).toHaveBeenCalledWith(
                'Please call render before invoking this method',
            );
        });
    });
    describe('Navigate to Page API - Pinboard', () => {
        const path = 'pinboard/e0836cad-4fdf-42d4-bd97-567a6b2a6058';

        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => 'http://tshost',
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
            appEmbed.navigateToPage(path);
            expect(getIFrameSrc()).toBe(
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
            waitFor(() => {
                return !!getIFrameEl();
            }).then(() => {
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
            waitFor(() => {
                return !!getIFrameEl();
            }).then(() => {
                expect(getIFrameSrc()).toContain('?base64UrlEncodedFlags');
            });
        });
    });
    describe('Iframe flags', () => {
        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => 'http://tshost',
            );
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
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}` +
                    `&foo=bar&baz=1&bool=true${defaultParamsPost}#/home`,
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
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}` +
                    `&showAlerts=true${defaultParamsPost}#/home`,
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
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}` +
                    `&locale=ja-JP${defaultParamsPost}#/home`,
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
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}` +
                    `&iconSprite=iconSprite.com${defaultParamsPost}#/home`,
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
            waitFor(() => {
                return !!getIFrameEl();
            }).then(() => {
                expect(getIFrameSrc()).toContain('authType=EmbeddedSSO');
                expect(getIFrameSrc()).toContain('forceSAMLAutoRedirect=true');
                done();
            });
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
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => 'http://tshost',
            );
        });

        afterAll((): void => {
            window.location = location;
        });

        it('get url params for TS', () => {
            const tsEmbed = new tsEmbedInstance.TsEmbed(
                getRootEl(),
                defaultViewConfig,
            );
            const urlHash =
                '#/analyze?ts-app=thoughtspot&ts-id=123&title=embed-sdk';
            window.location.hash = urlHash;
            const postHashParams = '?ts-app=thoughtspot&ts-id=123';
            expect(tsEmbed.getThoughtSpotPostUrlParams()).toBe(postHashParams);
        });

        it('validate query params and postHash params for TS', () => {
            const tsEmbed = new tsEmbedInstance.TsEmbed(
                getRootEl(),
                defaultViewConfig,
            );
            const urlHash =
                '#/analyze?ts-app=thoughtspot&ts-id=123&title=embed-sdk';
            window.location.hash = urlHash;
            const urlSearch = '?ts-type=subscribe&search-title=abc';
            window.location.search = urlSearch;
            const postHashParams =
                '?ts-type=subscribe&ts-app=thoughtspot&ts-id=123';
            expect(tsEmbed.getThoughtSpotPostUrlParams()).toBe(postHashParams);
        });
    });
});
