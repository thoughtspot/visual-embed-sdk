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

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve({}));
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
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&enableDataPanelV2=false#/embed/viz/${liveboardId}`,
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
        const mockProcessTrigger = spyOn(processTriggerInstance, 'processTrigger');
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            enableVizTransformations: true,
            ...defaultViewConfig,
            vizId: '1234',
            liveboardId,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(async () => {
            await liveboardEmbed.trigger(HostEvent.Pin);
            expect(mockProcessTrigger).toBeCalled();
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

    test('navigateToLiveboard should trigger the navigate event with the correct path', async (done) => {
        mockMessageChannel();
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
        } as LiveboardViewConfig);
        const onSpy = jest.spyOn(liveboardEmbed, 'trigger');
        await liveboardEmbed.prerenderGeneric();
        executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.APP_INIT,
            });
        });
        executeAfterWait(() => {
            liveboardEmbed.navigateToLiveboard('lb1', 'viz1');
            expect(onSpy).toHaveBeenCalledWith(HostEvent.Navigate, 'embed/viz/lb1/viz1');
            done();
        });
    });

    test('navigateToLiveboard with preRender', async (done) => {
        mockMessageChannel();
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            preRenderId: 'test',
        } as LiveboardViewConfig);
        const onSpy = jest.spyOn(liveboardEmbed, 'trigger');
        await liveboardEmbed.prerenderGeneric();
        executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.APP_INIT,
            });
        });
        executeAfterWait(() => {
            liveboardEmbed.navigateToLiveboard('lb1', 'viz1');
            expect(onSpy).toHaveBeenCalledWith(HostEvent.Navigate, 'embed/viz/lb1/viz1');
            done();
        });
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
        } as LiveboardViewConfig);
        await liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}&param1=Integer%20Date%20Range&paramVal1=1#/embed/viz/${liveboardId}`,
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
            expect(mockProcessTrigger).not.toBeCalled();
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
        test('it should preRender generic with liveboard id is not passed', async (done) => {
            const consoleSpy = jest.spyOn(console, 'error');
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: 'testPreRender',
            });
            const prerenderGenericSpy = jest.spyOn(libEmbed, 'prerenderGeneric');
            await libEmbed.preRender();
            executeAfterWait(() => {
                const iFrame = document.getElementById(
                    libEmbed.getPreRenderIds().child,
                ) as HTMLIFrameElement;

                // should render the generic link
                expect(prerenderGenericSpy).toHaveBeenCalledTimes(1);
                expect(iFrame.src).toMatch(/http:\/\/tshost\/.*&isLiveboardEmbed=true.*#$/);

                expect(consoleSpy).toHaveBeenCalledTimes(0);

                done();
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

        test('it should navigateToLiveboard with liveboard id is not passed with EmbedListenerReady event', async (done) => {
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

            executeAfterWait(() => {
                const iFrame = document.getElementById(
                    libEmbed.getPreRenderIds().child,
                ) as HTMLIFrameElement;

                // should render the generic link
                expect(navigateToLiveboardSpy).toHaveBeenCalledWith(testLiveboardId, 'testVizId', 'testActiveTabId');
                expect(iFrame.src).toMatch(/http:\/\/tshost\/.*&isLiveboardEmbed=true.*#$/);

                expect(consoleSpy).toHaveBeenCalledTimes(0);

                done();
            });
        });
       
        test('it should navigateToLiveboard with liveboard id is not passed with AuthInit event', async (done) => {
            mockMessageChannel();
            const consoleSpy = jest.spyOn(console, 'error');
            const testPreRenderId = 'testPreRender';
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
            });

            jest.spyOn(SessionInfoService, 'getSessionInfo').mockResolvedValue({
                releaseVersion: '1.0.0',
                userGUID: '1234567890',
                currentOrgId: 1,
                privileges: [],
                mixpanelToken: '1234567890',
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
                expect(navigateToLiveboardSpy).toHaveBeenCalledWith(testLiveboardId, 'testVizId', 'testActiveTabId');
                expect(iFrame.src).toMatch(/http:\/\/tshost\/.*&isLiveboardEmbed=true.*#$/);
                expect(consoleSpy).toHaveBeenCalledTimes(0);
                done();
            }, 1005);
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
                expect(mockProcessTrigger).toHaveBeenCalledWith(HostEvent.Save, {
                    vizId: 'testViz',
                });
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

            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockResolvedValue(undefined);

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
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(liveboardId, vizId, activeTabId);
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
            jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockResolvedValue(undefined);

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

            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockResolvedValue(undefined);

            // Mock embed container as already loaded
            liveboardEmbed.isEmbedContainerLoaded = true;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // navigateToLiveboard should be called immediately
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(liveboardId, vizId, activeTabId);
        });

        test('should handle beforePrerenderVisible without prerender object', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                vizId,
                activeTabId,
                ...defaultViewConfig,
            });

            jest.spyOn(liveboardEmbed as any, 'getPreRenderObj').mockReturnValue(null);
            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockResolvedValue(undefined);

            // Mock embed container as not loaded initially
            liveboardEmbed.isEmbedContainerLoaded = false;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // Simulate embed container becoming ready
            liveboardEmbed.isEmbedContainerLoaded = true;
            liveboardEmbed['executeEmbedContainerReadyCallbacks']();

            // navigateToLiveboard should still be called
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(liveboardId, vizId, activeTabId);
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

            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockResolvedValue(undefined);

            // Mock embed container as already loaded
            liveboardEmbed.isEmbedContainerLoaded = true;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // Check that all parameters are passed correctly
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(customLiveboardId, customVizId, customActiveTabId);
        });

        test('should work with minimal liveboard parameters', async () => {
            const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
                liveboardId,
                ...defaultViewConfig,
            });

            const navigateToLiveboardSpy = jest.spyOn(liveboardEmbed, 'navigateToLiveboard').mockResolvedValue(undefined);

            // Mock embed container as already loaded
            liveboardEmbed.isEmbedContainerLoaded = true;

            // Call beforePrerenderVisible
            liveboardEmbed['beforePrerenderVisible']();

            // Check that undefined parameters are passed correctly
            expect(navigateToLiveboardSpy).toHaveBeenCalledWith(liveboardId, undefined, undefined);
        });
    });
});
