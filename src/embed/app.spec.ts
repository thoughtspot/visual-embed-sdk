import {
    AppEmbed,
    AppViewConfig,
    DataPanelCustomColumnGroupsAccordionState,
    Page,
    HomePageSearchBarMode,
} from './app';
import { init } from '../index';
import {
    Action, AuthType, EmbedEvent, HostEvent, RuntimeFilterOp,
} from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
    getIFrameEl,
    mockMessageChannel,
    defaultParams,
    defaultParamsForPinboardEmbed,
    defaultParamsWithoutHiddenActions,
    expectUrlMatchesWithParams,
} from '../test/test-utils';
import { version } from '../../package.json';
import * as config from '../config';
import { TsEmbed, V1Embed } from './ts-embed';
import { logger } from '../utils/logger';
import * as auth from '../auth';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const thoughtSpotHost = 'tshost';
const defaultParamsPost = '';

const originalResizeObserver = window.ResizeObserver;
beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve({}));
    (window as any).ResizeObserver = window.ResizeObserver
            || jest.fn().mockImplementation(() => ({
                disconnect: jest.fn(),
                observe: jest.fn(),
                unobserve: jest.fn(),
            }));
});

const cleanUp = () => {
    document.body.innerHTML = getDocumentBody();
    window.ResizeObserver = originalResizeObserver;
};

describe('App embed tests', () => {
    beforeEach(() => {
        cleanUp();
    });

    test('should render home page by default', async () => {
        const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should hide the primary nav bar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: false,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}#/home`,
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should hide the application switcher button from nav bar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideApplicationSwitcher: true,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&applicationSwitcherHidden=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should hide the org switcher button from nav bar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideOrgSwitcher: true,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&orgSwitcherHidden=true${defaultParams}${defaultParamsPost}#/home`,
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
            [Page.Monitor]: 'insights/monitor-alerts',
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
                    expectUrlMatchesWithParams(
                        getIFrameSrc(),
                        `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}#/${route}`,
                    );
                    cleanUp();
                });
            });
        }

        const pageRouteMapForModularHome = {
            [Page.Search]: 'answer',
            [Page.Answers]: 'home/answers',
            [Page.Pinboards]: 'home/liveboards',
            [Page.Liveboards]: 'home/liveboards',
            [Page.Data]: 'data/tables',
            [Page.Home]: 'home',
            [Page.SpotIQ]: 'home/spotiq-analysis',
            [Page.Monitor]: 'home/monitor-alerts',
        };

        const pageIdsForModularHomes = Object.keys(pageRouteMapForModularHome);
        for (let i = 0; i < pageIdsForModularHomes.length; i++) {
            const pageIdsForModularHome = pageIdsForModularHomes[i];

            test(`${pageIdsForModularHome}`, async () => {
                const route = pageRouteMap[pageIdsForModularHome];
                const appEmbed = new AppEmbed(getRootEl(), {
                    ...defaultViewConfig,
                    modularHomeExperience: true,
                    pageId: pageIdsForModularHome as Page,
                } as AppViewConfig);
                appEmbed.render();

                await executeAfterWait(() => {
                    expectUrlMatchesWithParams(
                        getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            excludeRuntimeFiltersfromURL: false,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false&col1=sales&op1=EQ&val1=1000${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should not append runtime filters in URL if excludeRuntimeFiltersfromURL is true', async () => {
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
            excludeRuntimeFiltersfromURL: true,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should append runtime filters in URL if excludeRuntimeFiltersfromURL is undefined', async () => {
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
        const runtimeFilter = 'col1=sales&op1=EQ&val1=1000';
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false${defaultParams}${defaultParamsPost}&${runtimeFilter}#/home`,
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false&${defaultParamsWithoutHiddenActions}&disableAction=[%22save%22,%22update%22]&disableHint=Access%20denied&hideAction=[%22${Action.ReportError}%22,%22download%22]${defaultParamsPost}#/home`,
            );
        });
    });

    test('should set enable2ColumnLayout to true in url', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            enable2ColumnLayout: true,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&profileAndHelpInNavBarHidden=false&enable2ColumnLayout=true${defaultParamsPost}#/home`,
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&enableSearchAssist=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add enableDataPanelV2 flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            dataPanelV2: true,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&enableDataPanelV2=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add isLiveboardHeaderSticky flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            isLiveboardHeaderSticky: false,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&isLiveboardHeaderSticky=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add isLiveboardCompactHeaderEnabled flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            isLiveboardCompactHeaderEnabled: false,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&isLiveboardHeaderV2Enabled=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add showLiveboardReverifyBanner flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showLiveboardReverifyBanner: false,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&showLiveboardReverifyBanner=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add isUnifiedSearchExperienceEnabled flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            isUnifiedSearchExperienceEnabled: false,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&isUnifiedSearchExperienceEnabled=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add hideIrrelevantFiltersAtTabLevel flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideIrrelevantChipsInLiveboardTabs: false,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&hideIrrelevantFiltersAtTabLevel=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add showLiveboardVerifiedBadge flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showLiveboardVerifiedBadge: false,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&showLiveboardVerifiedBadge=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add default values of flags to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&isLiveboardHeaderSticky=true&hideLiveboardHeader=false&showLiveboardDescription=true&showLiveboardTitle=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add modularHomeExperience flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            modularHomeExperience: true,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add hideHomepageLeftNav flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideHomepageLeftNav: false,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&hideHomepageLeftNav=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add enableAskSage flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            enableAskSage: true,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&enableAskSage=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add HomePageSearchBarMode flag with object search to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            homePageSearchBarMode: HomePageSearchBarMode.OBJECT_SEARCH,
        } as AppViewConfig);

        await appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&homePageSearchBarMode=objectSearch${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add HomePageSearchBarMode flag with ai answer to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            homePageSearchBarMode: HomePageSearchBarMode.AI_ANSWER,
        } as AppViewConfig);

        await appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&homePageSearchBarMode=aiAnswer${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add HomePageSearchBarMode flag with none to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            homePageSearchBarMode: HomePageSearchBarMode.NONE,
        } as AppViewConfig);

        await appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&homePageSearchBarMode=none${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add dataPanelCustomGroupsAccordionInitialState flag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            // eslint-disable-next-line max-len
            dataPanelCustomGroupsAccordionInitialState: DataPanelCustomColumnGroupsAccordionState.EXPAND_FIRST,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&dataPanelCustomGroupsAccordionInitialState=EXPAND_FIRST${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('should register event handlers to adjust iframe height', async () => {
        const onSpy = jest.spyOn(AppEmbed.prototype, 'on')
            .mockImplementation((event, callback) => {
                if (event === EmbedEvent.RouteChange) {
                    callback({ data: { currentPath: '/answers' } }, jest.fn());
                }
                if (event === EmbedEvent.EmbedHeight) {
                    callback({ data: '100%' });
                }
                if (event === EmbedEvent.EmbedIframeCenter) {
                    callback({}, jest.fn());
                }
                return null;
            });
        jest.spyOn(TsEmbed.prototype as any, 'getIframeCenter').mockReturnValue({});
        jest.spyOn(TsEmbed.prototype as any, 'setIFrameHeight').mockReturnValue({});
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
        } as AppViewConfig);

        appEmbed.render();

        await executeAfterWait(() => {
            expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedHeight, expect.anything());
            expect(onSpy).toHaveBeenCalledWith(EmbedEvent.RouteChange, expect.anything());
            expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedIframeCenter, expect.anything());
        });
        jest.clearAllMocks();
    });

    describe('Navigate to Page API', () => {
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
            appEmbed.navigateToPage(path);
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            spyOn(logger, 'warn');
            appEmbed.navigateToPage(-1);
            expect(logger.warn).toHaveBeenCalledWith(
                'Path can only by a string when triggered without noReload',
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
            appEmbed.navigateToPage(path);
            await appEmbed.render();
            expect(logger.log).toHaveBeenCalledWith(
                'Please call render before invoking this method',
            );
        });
    });
});
