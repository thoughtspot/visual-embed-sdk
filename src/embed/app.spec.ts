import {
    AppEmbed,
    AppViewConfig,
    DataPanelCustomColumnGroupsAccordionState,
    Page,
    HomePageSearchBarMode,
    PrimaryNavbarVersion,
    HomePage,
    ListPage,
} from './app';
import { init } from '../index';
import { Action, AuthType, EmbedEvent, HostEvent, RuntimeFilterOp } from '../types';
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
    (window as any).ResizeObserver =
        window.ResizeObserver ||
        jest.fn().mockImplementation(() => ({
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
                const route = pageRouteMap[pageId as keyof typeof pageRouteMap];
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
                const route = pageRouteMapForModularHome[pageIdsForModularHome as keyof typeof pageRouteMapForModularHome];
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

    test('should set coverAndFilterOptionInPDF to false in url', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            coverAndFilterOptionInPDF: false,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&profileAndHelpInNavBarHidden=false&arePdfCoverFilterPageCheckboxesEnabled=false${defaultParamsPost}#/home`,
            );
        });
    });

    test('should set isLiveboardStylingAndGroupingEnabled to true in url', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            isLiveboardStylingAndGroupingEnabled: true,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&profileAndHelpInNavBarHidden=false&isLiveboardStylingAndGroupingEnabled=true${defaultParamsPost}#/home`,
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

    test('Should add hideHamburger, hideObjectSearch, hideNotification flags to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideHamburger: true,
            hideObjectSearch: true,
            hideNotification: true,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&hideHamburger=true&hideObjectSearch=true&hideNotification=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should not add when hideHamburger, hideObjectSearch, hideNotification values are not true to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideHamburger: false,
            hideObjectSearch: undefined,
            hideNotification: null,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add navigationVersion=v3 when primaryNavbarVersion is Sliding to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            discoveryExperience: {
                primaryNavbarVersion: PrimaryNavbarVersion.Sliding,
                homePage: HomePage.Modular,
            },
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=true&navigationVersion=v3${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should not add navigationVersion=v3 when primaryNavbarVersion is not added to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            discoveryExperience: {
                homePage: HomePage.Modular,
            },
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=true${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add navigationVersion=v3 & modularHomeExperience=true when primaryNavbarVersion is Sliding to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            // Not included the homePage v2 config under discoveryExperience.
            discoveryExperience: {
                primaryNavbarVersion: PrimaryNavbarVersion.Sliding,
            },
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=true&navigationVersion=v3${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add homepageVersion=v3 & navigationVersion=v3 & modularHomeExperience=true when Sliding and ModularWithStylingChanges configured in the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            discoveryExperience: {
                primaryNavbarVersion: PrimaryNavbarVersion.Sliding,
                homePage: HomePage.ModularWithStylingChanges,
            },
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=true&navigationVersion=v3&homepageVersion=v3${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add homepageVersion=v3 & navigationVersion=v3 & modularHomeExperience=true when homePage is ModularWithStylingChanges to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            // primaryNavbarVersion is not included under discoveryExperience,
            // then it set navigationVersion=v2 and modularHomeExperience=false.
            discoveryExperience: {
                homePage: HomePage.ModularWithStylingChanges,
            },
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&navigationVersion=v2&homepageVersion=v3${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add navigationVersion=v2 when primaryNavbarVersion is not added to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&navigationVersion=v2${defaultParams}${defaultParamsPost}#/home`,
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

    test('Should add listpageVersion=v3 when listPageVersion is ListWithUXChanges to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            discoveryExperience: {
                listPageVersion: ListPage.ListWithUXChanges,
            },
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&listpageVersion=v3${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });


    test('Should add listpageVersion=v2 by default when no discoveryExperience is provided', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&navigationVersion=v2&listpageVersion=v2${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add listpageVersion=v2 by default when discoveryExperience is provided but listPageVersion is not specified', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            discoveryExperience: {
                primaryNavbarVersion: PrimaryNavbarVersion.Sliding,
                homePage: HomePage.Modular,
            },
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=true&navigationVersion=v3&listpageVersion=v2${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });


    test('Should add listpageVersion=v3 combined with other discoveryExperience options to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            discoveryExperience: {
                primaryNavbarVersion: PrimaryNavbarVersion.Sliding,
                homePage: HomePage.Modular,
                listPageVersion: ListPage.ListWithUXChanges,
            },
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=true&navigationVersion=v3&listpageVersion=v3${defaultParams}${defaultParamsPost}#/home`,
            );
        });
    });

    test('Should add enablePendoHelp flag to the iframe src conditional on navbar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?enablePendoHelp=true&embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false${defaultParams}${defaultParamsPost}#/home`,
            );
        });

        const noNavEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            enablePendoHelp: false,
        } as AppViewConfig);

        noNavEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?enablePendoHelp=false&embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false${defaultParams}${defaultParamsPost}#/home`,
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

            dataPanelCustomGroupsAccordionInitialState:
                DataPanelCustomColumnGroupsAccordionState.EXPAND_FIRST,
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&modularHomeExperience=false&dataPanelCustomGroupsAccordionInitialState=EXPAND_FIRST${defaultParams}${defaultParamsPost}#/home`,
            );
        });
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
