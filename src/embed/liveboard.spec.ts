import { LiveboardViewConfig, LiveboardEmbed } from './liveboard';
import { init } from '../index';
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

    test('should not apply runtime filters if excludeRuntimeFiltersfromURL is true', async () => {
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
            excludeRuntimeFiltersfromURL: true,
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParamsVizEmbed}#/embed/viz/${liveboardId}/${vizId}`,
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
        const result = await liveboardEmbed.trigger(HostEvent.Pin);
        expect(mockProcessTrigger).toBeCalled();
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
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&preventPinboardFilterRemoval=true&isLiveboardEmbed=true&isPinboardV2Enabled=true#/embed/viz/${liveboardId}/tab/${activeTabId}`,
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
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&isContextMenuEnabledOnLeftClick=true&isLiveboardEmbed=true&isPinboardV2Enabled=true#/embed/viz/${liveboardId}/tab/${activeTabId}`,
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

    test('navigateToLiveboard should trigger the navigate event with the correct path', (done) => {
        mockMessageChannel();
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
        } as LiveboardViewConfig);
        const onSpy = jest.spyOn(liveboardEmbed, 'trigger');
        liveboardEmbed.prerenderGeneric();
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
        liveboardEmbed.render();
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
        liveboardEmbed.render();
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
        test('it should preRender generic with liveboard id is not passed', (done) => {
            const consoleSpy = jest.spyOn(console, 'error');
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: 'testPreRender',
            });
            const prerenderGenericSpy = jest.spyOn(libEmbed, 'prerenderGeneric');
            libEmbed.preRender();
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

        test('it should navigateToLiveboard with liveboard id is not passed', async (done) => {
            mockMessageChannel();
            const consoleSpy = jest.spyOn(console, 'error');
            const testPreRenderId = 'testPreRender';
            const libEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
            });

            let resizeObserverCb: any;
            (window as any).ResizeObserver = window.ResizeObserver
            || jest.fn().mockImplementation((resizeObserverCbParam) => {
                resizeObserverCb = resizeObserverCbParam;
                return ({
                    disconnect: jest.fn(),
                    observe: jest.fn(),
                    unobserve: jest.fn(),
                });
            });

            libEmbed.preRender();

            await waitFor(() => !!getIFrameEl());

            const ts = '__tsEmbed';
            expect(document.getElementById(libEmbed.getPreRenderIds().wrapper)[ts])
                .toEqual(libEmbed);

            const testLiveboardId = 'testLiveboardId';
            const newLibEmbed = new LiveboardEmbed(getRootEl(), {
                preRenderId: testPreRenderId,
                liveboardId: testLiveboardId,
            });
            const navigateToLiveboardSpy = jest.spyOn(newLibEmbed, 'navigateToLiveboard');
            newLibEmbed.showPreRender();

            executeAfterWait(() => {
                const iFrame = document.getElementById(
                    libEmbed.getPreRenderIds().child,
                ) as HTMLIFrameElement;

                // should render the generic link
                expect(navigateToLiveboardSpy).toHaveBeenCalledWith(testLiveboardId);
                expect(iFrame.src).toMatch(/http:\/\/tshost\/.*&isLiveboardEmbed=true.*#$/);

                expect(consoleSpy).toHaveBeenCalledTimes(0);

                done();
            });
        });
    });
});
