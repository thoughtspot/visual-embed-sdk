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
import { getDocumentBody, getIFrameSrc, getRootEl } from '../test/test-utils';
import * as config from '../config';
import * as tsEmbedInstance from './ts-embed';
import * as mixpanelInstance from '../mixpanel-service';
import * as baseInstance from './base';
import { MIXPANEL_EVENT } from '../mixpanel-service';
import { version } from '../../package.json';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const pinboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const liveboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const thoughtSpotHost = 'tshost';
const defaultParamsForPinboardEmbed = `hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}`;

describe('Unit test case for ts embed', () => {
    const mockMixPanelEvent = jest.spyOn(
        mixpanelInstance,
        'uploadMixpanelEvent',
    );
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });
    describe('when thoughtSpotHost have value and authPromise return success response', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost,
                authType: AuthType.None,
            });
        });

        beforeEach(() => {
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
            jest.spyOn(
                baseInstance,
                'getAuthPromise',
            ).mockResolvedValueOnce(() => Promise.resolve());
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            iFrame.contentWindow = null;
            tsEmbed.on(EmbedEvent.CustomAction, jest.fn());
            jest.spyOn(iFrame, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    handler({});
                },
            );
            jest.spyOn(document, 'createElement').mockReturnValueOnce(iFrame);
            tsEmbed.render();
        });

        test('mixpanel should call with VISUAL_SDK_RENDER_COMPLETE', () => {
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_START,
            );
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_COMPLETE,
            );
        });

        test('Should remove prefetch iframe', async () => {
            const prefetchIframe = document.querySelectorAll<HTMLIFrameElement>(
                '.prefetchIframe',
            );
            expect(prefetchIframe.length).toBe(0);
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
            jest.spyOn(
                baseInstance,
                'getAuthPromise',
            ).mockRejectedValueOnce(() => Promise.reject());
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
            spyOn(console, 'log');
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                hiddenActions: [Action.DownloadAsCsv],
                visibleActions: [Action.DownloadAsCsv],
                ...defaultViewConfig,
                pinboardId,
            } as LiveboardViewConfig);
            await pinboardEmbed.render();
            expect(pinboardEmbed['isError']).toBe(true);
            expect(console.log).toHaveBeenCalledWith(
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
            spyOn(console, 'log');
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                hiddenActions,
                visibleActions,
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            await liveboardEmbed.render();
            expect(liveboardEmbed['isError']).toBe(true);
            expect(console.log).toHaveBeenCalledWith(
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
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            tsEmbed.render();
            expect(tsEmbed['isError']).toBe(true);
        });
    });

    describe('V1Embed ', () => {
        test('when isRendered is true than isError will be true', () => {
            const viEmbedIns = new tsEmbedInstance.V1Embed(
                getRootEl(),
                defaultViewConfig,
            );
            expect(viEmbedIns['isError']).toBe(false);
            viEmbedIns.render();
            viEmbedIns.on(EmbedEvent.CustomAction, jest.fn()).render();
            expect(viEmbedIns['isError']).toBe(true);
        });
    });

    describe('Naviage to Page API', () => {
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
                `http://${thoughtSpotHost}/?embedApp=true&${defaultParamsForPinboardEmbed}&isLiveboardEmbed=true#/embed/${path}`,
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
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}#/${path}`,
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
    describe('Naviage to Page API - Pinboard', () => {
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
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}#/${path}`,
            );
        });
    });

    describe('additionalFlags config', () => {
        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => 'http://tshost',
            );
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
                    '&foo=bar&baz=1&bool=true#/home',
            );
        });
    });
});
