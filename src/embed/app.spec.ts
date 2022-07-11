import { AppEmbed, AppViewConfig, Page } from './app';
import { init } from '../index';
import { Action, AuthType, HostEvent, RuntimeFilterOp } from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
    getIFrameEl,
    mockMessageChannel,
} from '../test/test-utils';
import { version } from '../../package.json';
import * as config from '../config';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const thoughtSpotHost = 'tshost';
const defaultParamsWithoutHiddenActions = `&hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}`;
const defaultParams = `${defaultParamsWithoutHiddenActions}&hideAction=[%22${Action.ReportError}%22]`;
const defaultParamsForPinboardEmbed = `hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&hideAction=[%22${Action.ReportError}%22]`;
const defaultParamsPost = '&isPinboardV2Enabled=false';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

const cleanUp = () => {
    document.body.innerHTML = getDocumentBody();
};

describe('App embed tests', () => {
    beforeEach(() => {
        cleanUp();
    });

    test('should render home page by default', async () => {
        const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should hide the primary nav bar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should hide the help and profile buttons from nav bar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            disableProfileAndHelp: true,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    describe('should render the correct routes for pages', () => {
        /* eslint-disable no-loop-func */
        const pageRouteMap = {
            [Page.Search]: 'answer',
            [Page.Answers]: 'answers',
            [Page.Pinboards]: 'pinboards',
            [Page.Liveboards]: 'pinboards',
            [Page.Data]: 'data/tables',
            [Page.Home]: 'home',
            [Page.SpotIQ]: 'insights/results',
        };

        const pageIds = Object.keys(pageRouteMap);
        for (let i = 0; i < pageIds.length; i++) {
            const pageId = pageIds[i];

            test(`${pageId}`, async () => {
                const route = pageRouteMap[pageId];
                const appEmbed = new AppEmbed(getRootEl(), {
                    ...defaultViewConfig,
                    pageId: pageId as Page,
                } as AppViewConfig);
                appEmbed.render();

                await executeAfterWait(() => {
                    expect(getIFrameSrc()).toBe(
                        `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}#/${route}`,
                    );
                    cleanUp();
                });
            });
        }
    });

    test('should navigate to a path', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            path: 'foo/bar',
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}#/foo/bar`,
            );
        });
    });

    test('should apply runtime filters', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
            runtimeFilters: [
                {
                    columnName: 'sales',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false&col1=sales&op1=EQ&val1=1000${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should disable and hide actions', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
            disabledActions: [Action.Save, Action.Update],
            disabledActionReason: 'Access denied',
            hiddenActions: [Action.Download],
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false${defaultParamsWithoutHiddenActions}&disableAction=[%22save%22,%22update%22]&disableHint=Access%20denied&hideAction=[%22${Action.ReportError}%22,%22download%22]${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add the tag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: false,
            tag: 'Finance',
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}&tag=Finance${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add enableSearchAssist flagto the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            enableSearchAssist: true,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&enableSearchAssist=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    describe('Navigate to Page API', () => {
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

        test('navigateToPage with noReload should trigger the appropriate event', async () => {
            mockMessageChannel();
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await appEmbed.render();

            const iframe = getIFrameEl();
            iframe.contentWindow.postMessage = jest.fn();
            appEmbed.navigateToPage(path, true);

            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: HostEvent.Navigate,
                    data: path,
                }),
                `http://${thoughtSpotHost}`,
                expect.anything(),
            );

            appEmbed.navigateToPage(-1, true);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: HostEvent.Navigate,
                    data: -1,
                }),
                `http://${thoughtSpotHost}`,
                expect.anything(),
            );
        });

        test('Do not allow number path without noReload in navigateToPage', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await appEmbed.render();
            spyOn(console, 'warn');
            appEmbed.navigateToPage(-1);
            expect(console.warn).toHaveBeenCalledWith(
                'Path can only by a string when triggered without noReload',
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
});
