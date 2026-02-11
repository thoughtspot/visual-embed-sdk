import { LiveboardViewConfig, LiveboardEmbed } from './liveboard';
import { init, UIPassthroughEvent } from '../index';
import {
    Action,
    AuthType,
    ContextMenuTriggerOptions,
    EmbedEvent,
    HostEvent,
    RuntimeFilterOp,
} from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
    defaultParams,
    defaultParamsWithoutHiddenActions,
    expectUrlMatchesWithParams,
    expectUrlToHaveParamsWithValues,
    postMessageToParent,
    getIFrameEl,
    mockMessageChannel,
    waitFor,
} from '../test/test-utils';
import * as tsEmbed from './ts-embed';
import * as processTriggerInstance from '../utils/processTrigger';
import * as auth from '../auth';
import * as previewService from '../utils/graphql/preview-service';
import * as SessionInfoService from '../utils/sessionInfoService';
import { logger } from '../utils/logger';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const liveboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const activeTabId = '502693ba-9818-4e71-8ecd-d1a194e46861';
const newActiveTabId = '910e2398-eed9-443c-a975-355976629d27';
const vizId = '6e73f724-660e-11eb-ae93-0242ac130002';
const thoughtSpotHost = 'tshost';
const prefixParams = '&isLiveboardEmbed=true';
const prefixParamsVizEmbed = '&isLiveboardEmbed=true&isVizEmbed=true';

const mockGetSessionInfo = (mockSessionInfo?: any) => {
    jest.spyOn(SessionInfoService, 'getSessionInfo').mockResolvedValue(mockSessionInfo || {
        releaseVersion: '1.0.0',
        userGUID: '1234567890',
        currentOrgId: 1,
        privileges: [],
        mixpanelToken: '1234567890',
    })
};

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
});

describe('Liveboard/viz embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render liveboard', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should render liveboard with data panel v2 flag set to false by default', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&enableDataPanelV2=true#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set disabled actions', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            disabledActions: [Action.DownloadAsCsv, Action.DownloadAsPdf, Action.DownloadAsXlsx],
            disabledActionReason: 'Action denied',
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&${defaultParamsWithoutHiddenActions}&disableAction=[%22${Action.DownloadAsCsv}%22,%22${Action.DownloadAsPdf}%22,%22${Action.DownloadAsXlsx}%22]&disableHint=Action%20denied&hideAction=[%22${Action.ReportError}%22]${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set hidden actions', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            hiddenActions: [Action.DownloadAsCsv, Action.DownloadAsPdf, Action.DownloadAsXlsx],
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&${defaultParamsWithoutHiddenActions}&hideAction=[%22${Action.ReportError}%22,%22${Action.DownloadAsCsv}%22,%22${Action.DownloadAsPdf}%22,%22${Action.DownloadAsXlsx}%22]${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set visible actions', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            visibleActions: [Action.DownloadAsCsv, Action.DownloadAsPdf, Action.DownloadAsXlsx],
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&visibleAction=[%22${Action.DownloadAsCsv}%22,%22${Action.DownloadAsPdf}%22,%22${Action.DownloadAsXlsx}%22]${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set LiveboardStylePanel in visible actions', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            visibleActions: [Action.LiveboardStylePanel],
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlToHaveParamsWithValues(getIFrameSrc(), {
                visibleAction: JSON.stringify([Action.LiveboardStylePanel]),
            });
        });
    });

    test('should set enable2ColumnLayout to true in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            enable2ColumnLayout: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&enable2ColumnLayout=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isLiveboardStylingAndGroupingEnabled to true in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isLiveboardStylingAndGroupingEnabled: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardStylingAndGroupingEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isThisPeriodInDateFiltersEnabled to true in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            isThisPeriodInDateFiltersEnabled: true,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isThisPeriodInDateFiltersEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isLiveboardPermissionV2Enabled to true in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isEnhancedFilterInteractivityEnabled: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardPermissionV2Enabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isPNGInScheduledEmailsEnabled to true in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isPNGInScheduledEmailsEnabled: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isPNGInScheduledEmailsEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isLiveboardXLSXCSVDownloadEnabled to true in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isLiveboardXLSXCSVDownloadEnabled: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardXLSXCSVDownloadEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isLiveboardXLSXCSVDownloadEnabled to false in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isLiveboardXLSXCSVDownloadEnabled: false,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardXLSXCSVDownloadEnabled=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isGranularXLSXCSVSchedulesEnabled to true in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isGranularXLSXCSVSchedulesEnabled: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isGranularXLSXCSVSchedulesEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isGranularXLSXCSVSchedulesEnabled to false in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isGranularXLSXCSVSchedulesEnabled: false,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isGranularXLSXCSVSchedulesEnabled=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isLinkParametersEnabled to true in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isLinkParametersEnabled: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLinkParametersEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set isLinkParametersEnabled to false in url', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            isLinkParametersEnabled: false,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLinkParametersEnabled=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set visible actions as empty array', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            visibleActions: [],
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&visibleAction=[]${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should enable viz transformations true', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            enableVizTransformations: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&enableVizTransform=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should enable viz oAuthPollingInterval true', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            oAuthPollingInterval: 1000,
            isForceRedirect: true,
            dataSourceId: '12356',
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&oAuthPollingInterval=1000&isForceRedirect=true&dataSourceId=12356${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should disable viz transformations when enableVizTransformations false', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            enableVizTransformations: false,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&enableVizTransform=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should render viz', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            vizId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParamsVizEmbed}#/embed/viz/${liveboardId}/${vizId}`,
            );
        });
    });

    test('should apply runtime filters', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            vizId,
            runtimeFilters: [
                {
                    columnName: 'sales',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
            excludeRuntimeFiltersfromURL: false,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&col1=sales&op1=EQ&val1=1000${defaultParams}${prefixParamsVizEmbed}#/embed/viz/${liveboardId}/${vizId}`,
            );
        });
    });

    test('Should add isLiveboardHeaderSticky flag to the iframe src', async () => {
        const appEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            isLiveboardHeaderSticky: false,
        } as LiveboardViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardHeaderSticky=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('Should add isLiveboardCompactHeaderEnabled flag to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            isLiveboardCompactHeaderEnabled: false,
        } as LiveboardViewConfig);

        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardHeaderV2Enabled=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('Should add showLiveboardReverifyBanner flag to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            showLiveboardReverifyBanner: false,
        } as LiveboardViewConfig);

        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&showLiveboardReverifyBanner=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('Should add showLiveboardVerifiedBadge flag to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            showLiveboardVerifiedBadge: false,
        } as LiveboardViewConfig);

        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&showLiveboardVerifiedBadge=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('Should add showMaskedFilterChip flag set to true to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            showMaskedFilterChip: true,
        } as LiveboardViewConfig);

        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&showMaskedFilterChip=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('Should add showMaskedFilterChip flag set to false to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            showMaskedFilterChip: false,
        } as LiveboardViewConfig);

        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&showMaskedFilterChip=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('Should add isLiveboardMasterpiecesEnabled flag set to true to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            isLiveboardMasterpiecesEnabled: true,
        } as LiveboardViewConfig);

        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardMasterpiecesEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('Should add isLiveboardMasterpiecesEnabled flag set to false to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            isLiveboardMasterpiecesEnabled: false,
        } as LiveboardViewConfig);

        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardMasterpiecesEnabled=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('Should add hideIrrelevantFiltersAtTabLevel flag to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            hideIrrelevantChipsInLiveboardTabs: true,
        } as LiveboardViewConfig);

        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&hideIrrelevantFiltersAtTabLevel=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should add coverAndFilterOptionInPDF flag and set value to true to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            coverAndFilterOptionInPDF: true,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&arePdfCoverFilterPageCheckboxesEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should add coverAndFilterOptionInPDF flag and set value to false to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            coverAndFilterOptionInPDF: false,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&arePdfCoverFilterPageCheckboxesEnabled=false&${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should add isCentralizedLiveboardFilterUXEnabled flag and set value to true to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            isCentralizedLiveboardFilterUXEnabled: true,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isCentralizedLiveboardFilterUXEnabled=true${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should add isCentralizedLiveboardFilterUXEnabled flag and set value to false to the iframe src', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            isCentralizedLiveboardFilterUXEnabled: false,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isCentralizedLiveboardFilterUXEnabled=false${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should not append runtime filters in URL if excludeRuntimeFiltersfromURL is true', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            vizId,
            runtimeFilters: [
                {
                    columnName: 'sales',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParamsVizEmbed}#/embed/viz/${liveboardId}/${vizId}`,
            );
        });
    });

    test('Should not append runtime parameters in URL if excludeRuntimeParametersfromURL is true', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            vizId,
            runtimeParameters: [
                {
                    name: 'sales',
                    value: 1000,
                },
            ],
            excludeRuntimeParametersfromURL: true,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParamsVizEmbed}#/embed/viz/${liveboardId}/${vizId}`,
            );
        });
    });

    test('should append runtime filters in URL if excludeRuntimeFiltersfromURL is undefined', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            vizId,
            runtimeFilters: [
                {
                    columnName: 'sales',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
            excludeRuntimeFiltersfromURL: undefined,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        const runtimeFilter = 'col1=sales&op1=EQ&val1=1000';
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParamsVizEmbed}&${runtimeFilter}#/embed/viz/${liveboardId}/${vizId}`,
            );
        });
    });

    test('should register event handler to adjust iframe height', async () => {
        const onSpy = jest.spyOn(LiveboardEmbed.prototype, 'on');
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            liveboardId,
            vizId,
        } as LiveboardViewConfig);

        liveboardEmbed.render();

        executeAfterWait(() => {
            expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedHeight, expect.anything());
        });
    });

    test('should not call setIFrameHeight if currentPath starts with "/embed/viz/"', () => {
        const myObject = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            liveboardId,
        } as LiveboardViewConfig) as any;
        const spySetIFrameHeight = jest.spyOn(myObject, 'setIFrameHeight');

        myObject.render();
        myObject.setIframeHeightForNonEmbedLiveboard({
            data: { currentPath: '/embed/viz/' },
            type: 'Route',
        });

        // Assert that setIFrameHeight is not called
        expect(spySetIFrameHeight).not.toHaveBeenCalled();
    });

    test('should not call setIFrameHeight if currentPath starts with "/embed/insights/viz/"', () => {
        const myObject = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            liveboardId,
        } as LiveboardViewConfig) as any;
        const spySetIFrameHeight = jest.spyOn(myObject, 'setIFrameHeight');

        myObject.render();
        myObject.setIframeHeightForNonEmbedLiveboard({
            data: { currentPath: '/embed/insights/viz/' },
            type: 'Route',
        });

        // Assert that setIFrameHeight is not called
        expect(spySetIFrameHeight).not.toHaveBeenCalled();
    });

    test('should  call setIFrameHeight if currentPath starts with "/some/other/path/"', () => {
        const myObject = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            liveboardId,
        } as LiveboardViewConfig) as any;
        const spySetIFrameHeight = jest
            .spyOn(myObject, 'setIFrameHeight')
            .mockImplementation(jest.fn());

        myObject.render();
        myObject.setIframeHeightForNonEmbedLiveboard({
            data: { currentPath: '/some/other/path/' },
            type: 'Route',
        });

        // Assert that setIFrameHeight is not called
        expect(spySetIFrameHeight).toHaveBeenCalled();
    });

    test('Should set the visible vizs', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            visibleVizs: ['abcd', 'pqrs'],
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&pinboardVisibleVizs=[%22abcd%22,%22pqrs%22]${prefixParams}#/embed/viz/${liveboardId}`,
            );
        });
    });
    test('should process the trigger, for vizEmbed', async () => {
        const mockProcessTrigger = jest.spyOn(processTriggerInstance, 'processTrigger').mockImplementation(jest.fn());
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            enableVizTransformations: true,
            ...defaultViewConfig,
            vizId: '1234',
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(async () => {
            await liveboardEmbed.trigger(HostEvent.Pin);
            expect(mockProcessTrigger).toHaveBeenCalled();
        });
    });

    test('should render active tab when activeTab present', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            liveboardId,
            activeTabId,
            liveboardV2: true,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isLiveboardEmbed=true&isPinboardV2Enabled=true#/embed/viz/${liveboardId}/tab/${activeTabId}`,
            );
        });
    });
    test('Should set liveboard options', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            liveboardId,
            activeTabId,
            liveboardV2: true,
            defaultHeight: 100,
            preventLiveboardFilterRemoval: true,
            enableAskSage: true,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&preventPinboardFilterRemoval=true&isLiveboardEmbed=true&isPinboardV2Enabled=true&enableAskSage=true#/embed/viz/${liveboardId}/tab/${activeTabId}`,
            );
        });
    });
    test('Should set contextMenuTrigger options', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            liveboardId,
            activeTabId,
            liveboardV2: true,
            contextMenuTrigger: ContextMenuTriggerOptions.LEFT_CLICK,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&contextMenuEnabledOnWhichClick=left&isLiveboardEmbed=true&isPinboardV2Enabled=true#/embed/viz/${liveboardId}/tab/${activeTabId}`,
            );
        });
    });

    test('Should set hideTabPanel option', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            liveboardId,
            activeTabId,
            liveboardV2: true,
            hideTabPanel: true,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&hideTabPanel=true&isLiveboardEmbed=true&isPinboardV2Enabled=true#/embed/viz/${liveboardId}/tab/${activeTabId}`,
            );
        });
    });

    describe('personalizedViewId functionality', () => {
        const personalizedViewId = 'view-456-guid';

        test('should render liveboard with personalizedViewId', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                personalizedViewId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            await executeAfterWait(() => {
                expectUrlToHaveParamsWithValues(getIFrameSrc(), { view: personalizedViewId });
            });
        });

        test('should render liveboard with personalizedViewId and activeTabId together', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                personalizedViewId,
                activeTabId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            await executeAfterWait(() => {
                // URL should be: #/embed/viz/{id}/tab/{tabId}?view={viewId}
                expect(getIFrameSrc()).toMatch(
                    new RegExp(
                        `#/embed/viz/${liveboardId}/tab/${activeTabId}\\?view=${personalizedViewId}`,
                    ),
                );
            });
        });

        test('should render liveboard with personalizedViewId and vizId together', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                personalizedViewId,
                vizId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            await executeAfterWait(() => {
                // URL should be: #/embed/viz/{id}/{vizId}?view={viewId}
                expect(getIFrameSrc()).toMatch(
                    new RegExp(`#/embed/viz/${liveboardId}/${vizId}\\?view=${personalizedViewId}`),
                );
            });
        });

        test('should render liveboard with personalizedViewId, activeTabId, and vizId together', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                personalizedViewId,
                activeTabId,
                vizId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            await executeAfterWait(() => {
                // URL should be: #/embed/viz/{id}/tab/{tabId}/{vizId}?view={viewId}
                expect(getIFrameSrc()).toMatch(
                    new RegExp(
                        `#/embed/viz/${liveboardId}/tab/${activeTabId}/${vizId}\\?view=${personalizedViewId}`,
                    ),
                );
            });
        });

        test('should not include view param when personalizedViewId is not provided', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            await executeAfterWait(() => {
                expect(getIFrameSrc()).not.toContain('view=');
            });
        });

        test('should include personalizedViewId in getLiveboardUrl', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                personalizedViewId,
            } as LiveboardViewConfig);
            await liveboardEmbed.render();
            expect(liveboardEmbed.getLiveboardUrl()).toBe(
                `http://${thoughtSpotHost}/#/pinboard/${liveboardId}?view=${personalizedViewId}`,
            );
        });

        test('should include personalizedViewId with activeTabId in getLiveboardUrl', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                personalizedViewId,
                activeTabId,
            } as LiveboardViewConfig);
            await liveboardEmbed.render();
            expect(liveboardEmbed.getLiveboardUrl()).toBe(
                `http://${thoughtSpotHost}/#/pinboard/${liveboardId}/tab/${activeTabId}?view=${personalizedViewId}`,
            );
        });

        test('personalizedViewId should work with runtime filters', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                personalizedViewId,
                runtimeFilters: [
                    {
                        columnName: 'sales',
                        operator: RuntimeFilterOp.EQ,
                        values: [1000],
                    },
                ],
                excludeRuntimeFiltersfromURL: false,
            } as LiveboardViewConfig);
            liveboardEmbed.render();
            await executeAfterWait(() => {
                expectUrlToHaveParamsWithValues(getIFrameSrc(), {
                    view: personalizedViewId,
                    col1: 'sales',
                    op1: 'EQ',
                    val1: '1000',
                });
            });
        });

        describe('backward compatibility with liveboardId?view= workaround', () => {
            const workaroundViewId = 'workaround-view-id';
            const liveboardIdWithView = `${liveboardId}?view=${workaroundViewId}`;

            test('should extract view from workaround and add at end of URL', async () => {
                const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                    ...defaultViewConfig,
                    liveboardId: liveboardIdWithView,
                } as LiveboardViewConfig);
                liveboardEmbed.render();
                await executeAfterWait(() => {
                    // URL: #/embed/viz/{cleanId}?view={workaroundViewId}
                    expect(getIFrameSrc()).toMatch(
                        new RegExp(`#/embed/viz/${liveboardId}\\?view=${workaroundViewId}`),
                    );
                });
            });

            test('should extract view and place after tab when activeTabId is provided', async () => {
                const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                    ...defaultViewConfig,
                    liveboardId: liveboardIdWithView,
                    activeTabId,
                } as LiveboardViewConfig);
                liveboardEmbed.render();
                await executeAfterWait(() => {
                    // URL: #/embed/viz/{id}/tab/{tabId}?view={viewId} (view at END, not middle)
                    expect(getIFrameSrc()).toMatch(
                        new RegExp(
                            `#/embed/viz/${liveboardId}/tab/${activeTabId}\\?view=${workaroundViewId}`,
                        ),
                    );
                });
            });

            test('should use personalizedViewId over workaround when both provided', async () => {
                const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                    ...defaultViewConfig,
                    liveboardId: liveboardIdWithView,
                    personalizedViewId,
                } as LiveboardViewConfig);
                liveboardEmbed.render();
                await executeAfterWait(() => {
                    // personalizedViewId wins, workaround stripped
                    expect(getIFrameSrc()).toMatch(
                        new RegExp(`#/embed/viz/${liveboardId}\\?view=${personalizedViewId}`),
                    );
                });
            });
        });
    });

    test('navigateToLiveboard should trigger the navigate event with the correct path', async () => {
        mockMessageChannel();
        // mock getSessionInfo

        mockGetSessionInfo();
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
        } as LiveboardViewConfig);
        const onSpy = jest.spyOn(liveboardEmbed, 'trigger');
        await liveboardEmbed.prerenderGeneric();
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.APP_INIT,
            });
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.AuthInit,
            });
            liveboardEmbed.navigateToLiveboard('lb1', 'viz1');
        });

        await executeAfterWait(() => {
            expect(onSpy).toHaveBeenCalledWith(HostEvent.Navigate, 'embed/viz/lb1/viz1');
        }, 1002);
    });

    test('navigateToLiveboard with preRender', async () => {
        mockMessageChannel();

        // mock getSessionInfo
        jest.spyOn(SessionInfoService, 'getSessionInfo').mockResolvedValue({
            releaseVersion: '1.0.0',
            userGUID: '1234567890',
            currentOrgId: 1,
            privileges: [],
            mixpanelToken: '1234567890',
        } as any);
        mockGetSessionInfo();

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            preRenderId: 'test',
        } as LiveboardViewConfig);
        const onSpy = jest.spyOn(liveboardEmbed, 'trigger');
        await liveboardEmbed.prerenderGeneric();
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.APP_INIT,
            });
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.AuthInit,
            });
        });
        await executeAfterWait(() => {
            liveboardEmbed.navigateToLiveboard('lb1', 'viz1');
            expect(onSpy).toHaveBeenCalledWith(HostEvent.Navigate, 'embed/viz/lb1/viz1');
        }, 1002);
    });
    test('should set runtime parametere values in url params', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            runtimeParameters: [
                {
                    name: 'Integer Date Range',
                    value: 1,
                },
            ],
            excludeRuntimeParametersfromURL: undefined,
        } as LiveboardViewConfig);
        await liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&param1=Integer%20Date%20Range&paramVal1=1#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set showSpotterLimitations parameter in url params', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            showSpotterLimitations: true,
        } as LiveboardViewConfig);
        await liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&showSpotterLimitations=true#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should render the liveboard embed with updatedSpotterChatPrompt', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            updatedSpotterChatPrompt: true,
        } as LiveboardViewConfig);
        await liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&updatedSpotterChatPrompt=true#/embed/viz/${liveboardId}`,
            );
        });
    });
    test('should render the liveboard embed with updatedSpotterChatPrompt disabled', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            updatedSpotterChatPrompt: false,
        } as LiveboardViewConfig);
        await liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&updatedSpotterChatPrompt=false#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set hideToolResponseCardBranding parameter in url params via spotterChatConfig', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            spotterChatConfig: {
                hideToolResponseCardBranding: true,
            },
        } as LiveboardViewConfig);
        await liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&hideToolResponseCardBranding=true#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('should set toolResponseCardBrandingLabel parameter in url params via spotterChatConfig', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId,
            spotterChatConfig: {
                toolResponseCardBrandingLabel: 'MyBrand',
            },
        } as LiveboardViewConfig);
        await liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&toolResponseCardBrandingLabel=MyBrand#/embed/viz/${liveboardId}`,
            );
        });
    });

    test('SetActiveTab Hostevent should not trigger the navigate event with the correct path, for vizEmbed', async () => {
        const mockProcessTrigger = jest.spyOn(tsEmbed.TsEmbed.prototype, 'trigger');
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            enableVizTransformations: true,
            ...defaultViewConfig,
            liveboardId,
            vizId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        executeAfterWait(() => {
            const result = liveboardEmbed.trigger(HostEvent.SetActiveTab, {
                tabId: newActiveTabId,
            });
            expect(mockProcessTrigger).not.toHaveBeenCalled();
        });
    });

    test('SetActiveTab Hostevent trigger the navigate event with the correct path, not vizEmbed', async () => {
        const mockProcessTrigger = jest.spyOn(tsEmbed.TsEmbed.prototype, 'trigger');
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            enableVizTransformations: true,
            ...defaultViewConfig,
            liveboardId,
        } as LiveboardViewConfig);
        await liveboardEmbed.render();
        await executeAfterWait(() => {
            const result = liveboardEmbed.trigger(HostEvent.SetActiveTab, {
                tabId: newActiveTabId,
            });
            expect(mockProcessTrigger).toHaveBeenCalledWith(
                HostEvent.Navigate,
                `embed/viz/${liveboardId}/tab/${newActiveTabId}`,
            );
        });
    });

    describe('PreRender flow for liveboard embed', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: "http://tshost",
                authType: AuthType.None,
            });
        });
        test('it should preRender generic with liveboard id is not passed', async () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: 'testPreRender',
            });
            const prerenderGenericSpy = jest.spyOn(libEmbed, 'prerenderGeneric');
            await libEmbed.preRender();
            await executeAfterWait(() => {
                const iFrame = document.getElementById(
                    libEmbed.getPreRenderIds().child,
                ) as HTMLIFrameElement;

                // should render the generic link
                expect(prerenderGenericSpy).toHaveBeenCalledTimes(1);
                expect(iFrame.src).toMatch(/http:\/\/tshost\/.*&isLiveboardEmbed=true.*#$/);

                expect(consoleSpy).toHaveBeenCalledTimes(0);
            });
        });

        test('Show preview loader should not show the loader if not viz embed or showPreviewLoader is false', async () => {
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId: '1234',
            });
            await libEmbed.render();
            await executeAfterWait(() => {
                expect(getRootEl().innerHTML).not.toContain('ts-viz-preview-loader');
            });
        });

        test('get liveboard url value', async () => {
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId: '1234',
            });
            await libEmbed.render();
            await executeAfterWait(() => {
                const url = libEmbed.getLiveboardUrl();
                expect(url).toEqual('http://tshost/#/pinboard/1234');
            });
        });

        test('Show preview loader should show the loader if viz embed and showPreviewLoader is true', async () => {
            jest.spyOn(previewService, 'getPreview').mockResolvedValue({
                vizContent: '<div id=test>test</div>',
            });
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId: '1234',
                vizId: '5678',
                showPreviewLoader: true,
            });
            await libEmbed.render();
            expect(previewService.getPreview).toHaveBeenCalledWith('http://tshost', '5678', '1234');
            await executeAfterWait(() => {
                expect(getRootEl().style.position).toEqual('relative');
                expect(getRootEl().innerHTML).toContain('<div class="ts-viz-preview-loader">');
                expect(getRootEl().innerHTML).toContain('<div id="test">test</div>');
            });

            libEmbed.test__executeCallbacks(EmbedEvent.Data, {});
            await executeAfterWait(() => {
                expect(getRootEl().innerHTML).not.toContain('ts-viz-preview-loader');
            });
        });

        test('it should navigateToLiveboard with liveboard id is not passed with EmbedListenerReady event', async () => {
            mockMessageChannel();
            const consoleSpy = jest.spyOn(console, 'error');
            const testPreRenderId = 'testPreRender';
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
            });

            let resizeObserverCb: any;
            (window as any).ResizeObserver =
                window.ResizeObserver ||
                jest.fn().mockImplementation((resizeObserverCbParam: any) => {
                    resizeObserverCb = resizeObserverCbParam;
                    return {
                        disconnect: jest.fn(),
                        observe: jest.fn(),
                        unobserve: jest.fn(),
                    };
                });

            await libEmbed.preRender();

            await waitFor(() => !!getIFrameEl());

            const ts = '__tsEmbed';
            expect((document.getElementById(libEmbed.getPreRenderIds().wrapper) as any)[ts]).toEqual(
                libEmbed,
            );
            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, {
                    type: EmbedEvent.EmbedListenerReady,
                });
            });

            const testLiveboardId = 'testLiveboardId';
            const newLibEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
                liveboardId: testLiveboardId,
                vizId: 'testVizId',
                activeTabId: 'testActiveTabId',
            });
            const navigateToLiveboardSpy = jest.spyOn(newLibEmbed, 'navigateToLiveboard');
            await newLibEmbed.showPreRender();

            await executeAfterWait(() => {
                const iFrame = document.getElementById(
                    libEmbed.getPreRenderIds().child,
                ) as HTMLIFrameElement;

                // should render the generic link
                expect(navigateToLiveboardSpy).toHaveBeenCalledWith(
                    testLiveboardId,
                    'testVizId',
                    'testActiveTabId',
                    undefined,
                );
                expect(iFrame.src).toMatch(/http:\/\/tshost\/.*&isLiveboardEmbed=true.*#$/);

                expect(consoleSpy).toHaveBeenCalledTimes(0);
            });
        });

        test('it should navigateToLiveboard with liveboard id is not passed with AuthInit event', async () => {
            mockMessageChannel();
            const consoleSpy = jest.spyOn(console, 'error');
            const testPreRenderId = 'testPreRender';
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
            });

            mockGetSessionInfo();
            let resizeObserverCb: any;
            (window as any).ResizeObserver =
                window.ResizeObserver ||
                jest.fn().mockImplementation((resizeObserverCbParam: any) => {
                    resizeObserverCb = resizeObserverCbParam;
                    return {
                        disconnect: jest.fn(),
                        observe: jest.fn(),
                        unobserve: jest.fn(),
                    };
                });
            await libEmbed.preRender();
            await waitFor(() => !!getIFrameEl());
            const ts = '__tsEmbed';
            expect((document.getElementById(libEmbed.getPreRenderIds().wrapper) as any)[ts]).toEqual(
                libEmbed,
            );
            const testLiveboardId = 'testLiveboardId';
            const newLibEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
                liveboardId: testLiveboardId,
                vizId: 'testVizId',
                activeTabId: 'testActiveTabId',
            });
            const navigateToLiveboardSpy = jest.spyOn(newLibEmbed, 'navigateToLiveboard');

            await newLibEmbed.showPreRender();

            await executeAfterWait(() => {
                const iFrame = document.getElementById(
                    newLibEmbed.getPreRenderIds().child,
                ) as HTMLIFrameElement;
                postMessageToParent(iFrame.contentWindow, {
                    type: EmbedEvent.AuthInit,
                });
            });

            await executeAfterWait(() => {
                const iFrame = document.getElementById(
                    libEmbed.getPreRenderIds().child,
                ) as HTMLIFrameElement;
                // should render the generic link
                expect(navigateToLiveboardSpy).toHaveBeenCalledWith(
                    testLiveboardId,
                    'testVizId',
                    'testActiveTabId',
                    undefined,
                );
                expect(iFrame.src).toMatch(/http:\/\/tshost\/.*&isLiveboardEmbed=true.*#$/);
                expect(consoleSpy).toHaveBeenCalledTimes(0);
            }, 1005);
        });


        test('should replace existing preRender when replaceExistingPreRender is true', async () => {
            const testPreRenderId = 'testReplacePreRender';

            // Stub ResizeObserver for JSDOM
            (window as any).ResizeObserver = (window as any).ResizeObserver
                || jest.fn().mockImplementation(() => ({
                    disconnect: jest.fn(),
                    observe: jest.fn(),
                    unobserve: jest.fn(),
                }));

            // Create initial embed and show preRender (this will create the
            // preRender wrapper/child)
            const embedA = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
            });

            await embedA.showPreRender();

            await waitFor(() => !!getIFrameEl());

            const ids = embedA.getPreRenderIds();
            const oldWrapper = document.getElementById(ids.wrapper);
            const oldChild = document.getElementById(ids.child);

            const tsKey = '__tsEmbed';
            expect((oldWrapper as any)[tsKey]).toBe(embedA);

            // Create a new embed instance and preRender with
            // replaceExistingPreRender = true
            const embedB = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
            });
            const prerenderGenericSpy = jest.spyOn(embedB, 'prerenderGeneric');

            await embedB.preRender(false, true);

            await waitFor(() => (document.getElementById(ids.wrapper) as any)?.[tsKey] === embedB);

            const newWrapper = document.getElementById(ids.wrapper);
            const newChild = document.getElementById(ids.child);

            // Should have called prerenderGeneric for the new embed instance
            expect(prerenderGenericSpy).toHaveBeenCalledTimes(1);

            // Wrapper should be replaced (new wrapper element), child iframe
            // may be reused
            expect(newWrapper).not.toBe(oldWrapper);

            // __tsEmbed on wrapper should now point to the new embed instance
            expect((newWrapper as any)[tsKey]).toBe(embedB);
        });
    });

    describe('LazyLoadingForFullHeight functionality', () => {
        let mockIFrame: HTMLIFrameElement;

        beforeEach(() => {
            mockIFrame = document.createElement('iframe');
            mockIFrame.getBoundingClientRect = jest.fn().mockReturnValue({
                top: 100,
                left: 150,
                bottom: 600,
                right: 800,
                width: 650,
                height: 500,
            });
            jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
                if (tagName === 'iframe') {
                    return mockIFrame;
                }
                return document.createElement(tagName);
            });
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('should set lazyLoadingMargin parameter when provided', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '100px 0px',
            } as LiveboardViewConfig);

            await liveboardEmbed.render();

            await executeAfterWait(() => {
                const iframeSrc = getIFrameSrc();
                expect(iframeSrc).toContain('isLazyLoadingForEmbedEnabled=true');
                expect(iframeSrc).toContain('isFullHeightPinboard=true');
                expect(iframeSrc).toContain('rootMarginForLazyLoad=100px%200px');
            }, 100);
        });

        test('should set isLazyLoadingForEmbedEnabled=true when both fullHeight and lazyLoadingForFullHeight are enabled', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '10px',
            } as LiveboardViewConfig);

            await liveboardEmbed.render();

            await executeAfterWait(() => {
                const iframeSrc = getIFrameSrc();
                expect(iframeSrc).toContain('isLazyLoadingForEmbedEnabled=true');
                expect(iframeSrc).toContain('isFullHeightPinboard=true');
            }, 100);
        });

        test('should not set lazyLoadingForEmbed when lazyLoadingForFullHeight is enabled but fullHeight is false', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: false,
                lazyLoadingForFullHeight: true,
            } as LiveboardViewConfig);

            await liveboardEmbed.render();

            await executeAfterWait(() => {
                const iframeSrc = getIFrameSrc();
                expect(iframeSrc).not.toContain('isLazyLoadingForEmbedEnabled=true');
                expect(iframeSrc).not.toContain('isFullHeightPinboard=true');
            }, 100);
        });

        test('should not set isLazyLoadingForEmbedEnabled when fullHeight is true but lazyLoadingForFullHeight is false', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: false,
            } as LiveboardViewConfig);

            await liveboardEmbed.render();

            await executeAfterWait(() => {
                const iframeSrc = getIFrameSrc();
                expect(iframeSrc).not.toContain('isLazyLoadingForEmbedEnabled=true');
                expect(iframeSrc).toContain('isFullHeightPinboard=true');
            }, 100);
        });

        test('should register event handlers to adjust iframe height', async () => {
            const onSpy = jest.spyOn(LiveboardEmbed.prototype, 'on');

            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '10px',
            } as LiveboardViewConfig);

            await liveboardEmbed.render();

            await executeAfterWait(() => {
                expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedHeight, expect.anything());
                expect(onSpy).toHaveBeenCalledWith(EmbedEvent.RouteChange, expect.anything());
                expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedIframeCenter, expect.anything());
                expect(onSpy).toHaveBeenCalledWith(EmbedEvent.RequestVisibleEmbedCoordinates, expect.anything());
            }, 100);
        });

        test('should send correct visible data when RequestVisibleEmbedCoordinates is triggered', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '10px',
            } as LiveboardViewConfig);

            const mockTrigger = jest.spyOn(liveboardEmbed, 'trigger');

            await liveboardEmbed.render();

            // Trigger the lazy load data calculation
            (liveboardEmbed as any).sendFullHeightLazyLoadData();

            expect(mockTrigger).toHaveBeenCalledWith(HostEvent.VisibleEmbedCoordinates, {
                top: 0,
                height: 500,
                left: 0,
                width: 650,
            });
        });

        test('should calculate correct visible data for partially visible full height element', async () => {
            mockIFrame.getBoundingClientRect = jest.fn().mockReturnValue({
                top: -50,
                left: -30,
                bottom: 700,
                right: 1024,
                width: 1054,
                height: 750,
            });

            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '10px',
            } as LiveboardViewConfig);

            const mockTrigger = jest.spyOn(liveboardEmbed, 'trigger');

            await liveboardEmbed.render();

            // Trigger the lazy load data calculation
            (liveboardEmbed as any).sendFullHeightLazyLoadData();

            expect(mockTrigger).toHaveBeenCalledWith(HostEvent.VisibleEmbedCoordinates, {
                top: 50,
                height: 700,
                left: 30,
                width: 1024,
            });
        });

        test('should add window event listeners for resize and scroll when fullHeight and lazyLoadingForFullHeight are enabled', async () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '10px',
            } as LiveboardViewConfig);

            await liveboardEmbed.render();

            // Wait for the post-render events to be registered
            await executeAfterWait(() => {
                expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.anything());
                expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.anything(), true);
            }, 100);

            addEventListenerSpy.mockRestore();
        });

        test('should remove window event listeners on destroy when fullHeight and lazyLoadingForFullHeight are enabled', async () => {
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '10px',
            } as LiveboardViewConfig);

            await liveboardEmbed.render();
            liveboardEmbed.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.anything());
            expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.anything());

            removeEventListenerSpy.mockRestore();
        });

        test('should handle RequestVisibleEmbedCoordinates event and respond with correct data', async () => {
            // Mock the iframe element
            mockIFrame.getBoundingClientRect = jest.fn().mockReturnValue({
                top: 100,
                left: 150,
                bottom: 600,
                right: 800,
                width: 650,
                height: 500,
            });
            Object.defineProperty(mockIFrame, 'scrollHeight', { value: 500 });

            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                ...defaultViewConfig,
                liveboardId,
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '10px',
            } as LiveboardViewConfig);

            // Set the iframe before render
            (liveboardEmbed as any).iFrame = mockIFrame;

            await liveboardEmbed.render();

            // Create a mock responder function
            const mockResponder = jest.fn();

            // Trigger the handler directly
            (liveboardEmbed as any).requestVisibleEmbedCoordinatesHandler({}, mockResponder);

            // Verify the responder was called with the correct data
            expect(mockResponder).toHaveBeenCalledWith({
                type: EmbedEvent.RequestVisibleEmbedCoordinates,
                data: {
                    top: 0,
                    height: 500,
                    left: 0,
                    width: 650,
                },
            });
        });
    });

    describe('Host events for liveborad', () => {
        test('Host event with empty param', async () => {
            const mockProcessTrigger = jest.spyOn(tsEmbed.TsEmbed.prototype, 'trigger');
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId: '123',
                ...defaultViewConfig,
                vizId: 'testViz',
            });
            await liveboardEmbed.render();
            mockProcessTrigger.mockResolvedValue({ session: 'test' });
            await executeAfterWait(async () => {
                await liveboardEmbed.trigger(HostEvent.Save);
                expect(mockProcessTrigger).toHaveBeenCalledWith(
                    HostEvent.Save,
                    {
                        vizId: 'testViz',
                    },
                    undefined,
                );
            });
        });
    });

    describe('Liveboard Embed Container Loading and PreRender', () => {
        beforeEach(() => {
            document.body.innerHTML = getDocumentBody();
        });

        test('should call navigateToLiveboard after embed container is loaded in beforePrerenderVisible', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                vizId,
                activeTabId,
                ...defaultViewConfig,
            });

            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockImplementation(() => Promise.resolve(undefined));

            // Mock embed container as not loaded initially
            liveboardEmbed.isEmbedContainerLoaded = false;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // navigateToLiveboard should not be called immediately
            expect(navigateToLiveboardSpy).not.toHaveBeenCalled();

            // Simulate embed container becoming ready
            liveboardEmbed.isEmbedContainerLoaded = true;
            liveboardEmbed['executeEmbedContainerReadyCallbacks']();

            // Now navigateToLiveboard should be called
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(
                liveboardId,
                vizId,
                activeTabId,
                undefined,
            );
        });

        test('should update currentLiveboardState for prerender object when embed container loads', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                vizId,
                activeTabId,
                ...defaultViewConfig,
            });

            const mockPreRenderObj = {
                currentLiveboardState: {},
            };

            jest.spyOn(liveboardEmbed as any, 'getPreRenderObj').mockReturnValue(mockPreRenderObj as any);
            jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockImplementation(() => Promise.resolve(undefined));

            // Mock embed container as not loaded initially
            liveboardEmbed.isEmbedContainerLoaded = false;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // Simulate embed container becoming ready
            liveboardEmbed.isEmbedContainerLoaded = true;
            liveboardEmbed['executeEmbedContainerReadyCallbacks']();

            // Check that currentLiveboardState was updated
            expect(mockPreRenderObj.currentLiveboardState).toEqual({
                liveboardId,
                vizId,
                activeTabId,
            });
        });

        test('should handle beforePrerenderVisible when embed container is already loaded', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                vizId,
                activeTabId,
                ...defaultViewConfig,
            });

            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockImplementation(() => Promise.resolve(undefined));

            // Mock embed container as already loaded
            liveboardEmbed.isEmbedContainerLoaded = true;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // navigateToLiveboard should be called immediately
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(
                liveboardId,
                vizId,
                activeTabId,
                undefined,
            );
        });

        test('should handle beforePrerenderVisible without prerender object', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                vizId,
                activeTabId,
                ...defaultViewConfig,
            });

            jest.spyOn(liveboardEmbed as any, 'getPreRenderObj').mockReturnValue(null);
            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockImplementation(() => Promise.resolve(undefined));

            // Mock embed container as not loaded initially
            liveboardEmbed.isEmbedContainerLoaded = false;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // Simulate embed container becoming ready
            liveboardEmbed.isEmbedContainerLoaded = true;
            liveboardEmbed['executeEmbedContainerReadyCallbacks']();

            // navigateToLiveboard should still be called
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(
                liveboardId,
                vizId,
                activeTabId,
                undefined,
            );
        });

        test('should work with all liveboard parameters', async () => {
            const customLiveboardId = 'custom-liveboard-id';
            const customVizId = 'custom-viz-id';
            const customActiveTabId = 'custom-active-tab-id';

            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId: customLiveboardId,
                vizId: customVizId,
                activeTabId: customActiveTabId,
                ...defaultViewConfig,
            });

            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockImplementation(() => Promise.resolve(undefined));

            // Mock embed container as already loaded
            liveboardEmbed.isEmbedContainerLoaded = true;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // Check that all parameters are passed correctly
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(
                customLiveboardId,
                customVizId,
                customActiveTabId,
                undefined,
            );
        });

        test('should work with minimal liveboard parameters', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                ...defaultViewConfig,
            });

            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockImplementation(() => Promise.resolve(undefined));

            // Mock embed container as already loaded
            liveboardEmbed.isEmbedContainerLoaded = true;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // Check that undefined parameters are passed correctly
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(
                liveboardId,
                undefined,
                undefined,
                undefined,
            );
        });
    });

    describe('Liveboard Embed Default Height and Minimum Height Handling', () => {
        test('should set default height to 800 when minimum height is provided', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                ...defaultViewConfig,
                fullHeight: true,
                defaultHeight: 700,
                minimumHeight: 800,
            });
            await liveboardEmbed.render();
            expect(liveboardEmbed['defaultHeight']).toBe(800);
        });
        test('should set default height to 700 when default height is provided', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                ...defaultViewConfig,
                fullHeight: true,
                defaultHeight: 700,
            });
            await liveboardEmbed.render();
            expect(liveboardEmbed['defaultHeight']).toBe(700);
        });
        test('should set default height to 800 when minimum height is provided but default height is not', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                ...defaultViewConfig,
                fullHeight: true,
                minimumHeight: 800,
            });
            await liveboardEmbed.render();
            expect(liveboardEmbed['defaultHeight']).toBe(800);
        });
        test('should set default height to 500 when neither default height nor minimum height is provided', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                ...defaultViewConfig,
                fullHeight: true,
            });
            await liveboardEmbed.render();
            expect(liveboardEmbed['defaultHeight']).toBe(500);
        });
    });
});
