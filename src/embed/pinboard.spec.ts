import { PinboardEmbed, LiveboardViewConfig } from './liveboard';
import { init } from '../index';
import {
    Action, AuthType, EmbedEvent, RuntimeFilterOp,
} from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
    defaultParams,
    defaultParamsWithoutHiddenActions,
    expectUrlMatchesWithParams,
} from '../test/test-utils';
import { version } from '../../package.json';
import * as auth from '../auth';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const pinboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const vizId = '6e73f724-660e-11eb-ae93-0242ac130002';
const thoughtSpotHost = 'tshost';
const prefixParams = '&isLiveboardEmbed=true';
const prefixParamsVizEmbed = '&isLiveboardEmbed=true&isVizEmbed=true';
beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(auth, 'postLoginService').mockReturnValue(true);
});

describe('Pinboard/viz embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render pinboard', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            pinboardId,
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParams}#/embed/viz/${pinboardId}`,
            );
        });
    });

    test('should set disabled actions', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            disabledActions: [Action.DownloadAsCsv, Action.DownloadAsPdf, Action.DownloadAsXlsx],
            disabledActionReason: 'Action denied',
            ...defaultViewConfig,
            pinboardId,
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&${defaultParamsWithoutHiddenActions}&disableAction=[%22${Action.DownloadAsCsv}%22,%22${Action.DownloadAsPdf}%22,%22${Action.DownloadAsXlsx}%22]&disableHint=Action%20denied&hideAction=[%22${Action.ReportError}%22]${prefixParams}#/embed/viz/${pinboardId}`,
            );
        });
    });

    test('should set hidden actions', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            hiddenActions: [Action.DownloadAsCsv, Action.DownloadAsPdf, Action.DownloadAsXlsx],
            ...defaultViewConfig,
            pinboardId,
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&${defaultParamsWithoutHiddenActions}&hideAction=[%22${Action.ReportError}%22,%22${Action.DownloadAsCsv}%22,%22${Action.DownloadAsPdf}%22,%22${Action.DownloadAsXlsx}%22]${prefixParams}#/embed/viz/${pinboardId}`,
            );
        });
    });

    test('should set visible actions', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            visibleActions: [Action.DownloadAsCsv, Action.DownloadAsPdf, Action.DownloadAsXlsx],
            ...defaultViewConfig,
            pinboardId,
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&visibleAction=[%22${Action.DownloadAsCsv}%22,%22${Action.DownloadAsPdf}%22,%22${Action.DownloadAsXlsx}%22]${prefixParams}#/embed/viz/${pinboardId}`,
            );
        });
    });

    test('should set visible actions as empty array', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            visibleActions: [],
            ...defaultViewConfig,
            pinboardId,
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&visibleAction=[]${prefixParams}#/embed/viz/${pinboardId}`,
            );
        });
    });

    test('should enable viz transformations true', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            enableVizTransformations: true,
            ...defaultViewConfig,
            pinboardId,
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&enableVizTransform=true${prefixParams}#/embed/viz/${pinboardId}`,
            );
        });
    });

    test('should disable viz transformations when enableVizTransformations false', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            enableVizTransformations: false,
            ...defaultViewConfig,
            pinboardId,
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}&enableVizTransform=false${prefixParams}#/embed/viz/${pinboardId}`,
            );
        });
    });

    test('should render viz', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            pinboardId,
            vizId,
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParamsVizEmbed}#/embed/viz/${pinboardId}/${vizId}`,
            );
        });
    });

    test('should apply runtime filters', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            pinboardId,
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
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&col1=sales&op1=EQ&val1=1000${defaultParams}${prefixParamsVizEmbed}#/embed/viz/${pinboardId}/${vizId}`,
            );
        });
    });

    test('should not append runtime filters in URL if excludeRuntimeFiltersfromURL is true', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            pinboardId,
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
        pinboardEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParamsVizEmbed}#/embed/viz/${pinboardId}/${vizId}`,
            );
        });
    });

    test('should append runtime filters in URL if excludeRuntimeFiltersfromURL is undefined', async () => {
        const liveboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            pinboardId,
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
                `http://${thoughtSpotHost}/?embedApp=true${defaultParams}${prefixParamsVizEmbed}&${runtimeFilter}#/embed/viz/${pinboardId}/${vizId}`,
            );
        });
    });

    test('should register event handler to adjust iframe height', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId,
            vizId,
        } as LiveboardViewConfig);

        const onSpy = jest.spyOn(pinboardEmbed, 'on');
        pinboardEmbed.render();

        executeAfterWait(() => {
            expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedHeight, expect.anything());
        });
    });
});
