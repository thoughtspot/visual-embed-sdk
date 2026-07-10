import { logger } from '../utils/logger';
import {
    init,
    AuthType,
    Action,
    EmbedEvent,
    SearchEmbed,
    PinboardEmbed,
    LiveboardEmbed,
    AppEmbed,
    HostEvent,
} from '../index';
import {
    EVENT_WAIT_TIME,
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
    getRootEl2,
    mockMessageChannel,
    postMessageToParent,
} from '../test/test-utils';
import { LiveboardViewConfig } from './liveboard';
import * as authInstance from '../auth';

const thoughtSpotHost = 'tshost';
const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const PAYLOAD = 'Sample payload';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(window, 'alert');
    jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
});

describe('test communication between host app and ThoughtSpot', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should capture event from ThoughtSpot app', (done) => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed
            .on(EmbedEvent.CustomAction, (data) => {
                expect(data.data).toBe(PAYLOAD);
                done();
            })
            .render();

        executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
        });
    });

    // TODO: enable test once we are actually able to load stuff in the iframe
    xtest('should trigger iframe load event', async () => {
        const onLoadSpy = jest.fn();

        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.on(EmbedEvent.Load, onLoadSpy).render();
        await executeAfterWait(() => {
            expect(onLoadSpy).toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('should trigger event to ThoughtSpot app', (done) => {
        mockMessageChannel();
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.render();
        setTimeout(() => {
            searchEmbed.trigger(HostEvent.Search, {
                body: PAYLOAD,
            });
        }, EVENT_WAIT_TIME);
        executeAfterWait(() => {
            const iframe = getIFrameEl();

            iframe.contentWindow.addEventListener('message', (e) => {
                expect(e.data.type).toBe(HostEvent.Search);
                expect(e.data.data.body).toBe(PAYLOAD);
                done();
            });
        });
    });

    test('should execute multiple event handlers if registered', async () => {
        const handlerOne = jest.fn();
        const handlerTwo = jest.fn();

        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed
            .on(EmbedEvent.CustomAction, handlerOne)
            .on(EmbedEvent.CustomAction, handlerTwo)
            .render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handlerOne).toHaveBeenCalled();
            expect(handlerTwo).toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('should capture event from correct iframe', async () => {
        const spyOne = jest.fn();
        const embedOne = new SearchEmbed(getRootEl(), defaultViewConfig);
        embedOne.on(EmbedEvent.CustomAction, spyOne).render();

        const spyTwo = jest.fn();
        const embedTwo = new PinboardEmbed(getRootEl2(), {
            ...defaultViewConfig,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        const spyThree = jest.fn();
        const embedThree = new LiveboardEmbed(getRootEl2(), {
            ...defaultViewConfig,
            liveboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        embedTwo.on(EmbedEvent.CustomAction, spyTwo).render();
        embedThree.on(EmbedEvent.CustomAction, spyThree).render();

        await executeAfterWait(() => {
            const iframeOne = getIFrameEl();
            postMessageToParent(iframeOne.contentWindow, {
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(spyOne).toHaveBeenCalled();
            expect(spyTwo).not.toHaveBeenCalled();
            expect(spyThree).not.toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('send getIframeCenter Event without eventPort', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        const spy1 = jest.spyOn(logger, 'log');

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.EmbedIframeCenter,
                data: PAYLOAD,
            });
        });
        expect(spy1).toHaveBeenCalledWith('Event Port is not defined');
    });
    test('send getIframeCenter Event without eventPort - pinboard', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        const spy1 = jest.spyOn(logger, 'log');

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.EmbedIframeCenter,
                data: PAYLOAD,
            });
        });
        expect(spy1).toHaveBeenCalledWith('Event Port is not defined');
    });

    test('send getIframeCenter Event with eventPort - pinboard', async () => {
        const pinboardEmbed = new PinboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        pinboardEmbed.render();
        const mockPort: any = {
            postMessage: jest.fn(),
        };
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(
                iframe.contentWindow,
                {
                    type: EmbedEvent.EmbedIframeCenter,
                    data: PAYLOAD,
                },
                mockPort,
            );
        });
        const heightObj = {
            data: {
                iframeCenter: 0,
                iframeHeight: 0,
                iframeScrolled: 0,
                iframeVisibleViewPort: 0,
                viewPortHeight: 768,
            },
            type: EmbedEvent.EmbedIframeCenter,
        };
        expect(mockPort.postMessage).toHaveBeenCalledWith(heightObj);
    });
    test('send getIframeCenter Event with eventPort', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            fullHeight: true,
            pinboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        liveboardEmbed.render();
        const mockPort: any = {
            postMessage: jest.fn(),
        };
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(
                iframe.contentWindow,
                {
                    type: EmbedEvent.EmbedIframeCenter,
                    data: PAYLOAD,
                },
                mockPort,
            );
        });
        const heightObj = {
            data: {
                iframeCenter: 0,
                iframeHeight: 0,
                iframeScrolled: 0,
                iframeVisibleViewPort: 0,
                viewPortHeight: 768,
            },
            type: EmbedEvent.EmbedIframeCenter,
        };
        expect(mockPort.postMessage).toHaveBeenCalledWith(heightObj);
    });
    test('should handle UpdatePersonalizedView as alias for UpdatePersonalisedView', async () => {
        const handler = jest.fn();

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        liveboardEmbed.on(EmbedEvent.UpdatePersonalizedView, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.UpdatePersonalisedView,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data).toBe(PAYLOAD);
        }, EVENT_WAIT_TIME);
    });

    test('should handle SavePersonalizedView as alias for SavePersonalisedView', async () => {
        const handler = jest.fn();

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        liveboardEmbed.on(EmbedEvent.SavePersonalizedView, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.SavePersonalisedView,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data).toBe(PAYLOAD);
        }, EVENT_WAIT_TIME);
    });

    test('should handle DeletePersonalizedView as alias for DeletePersonalisedView', async () => {
        const handler = jest.fn();

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
            ...defaultViewConfig,
            liveboardId: 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0',
        } as LiveboardViewConfig);
        liveboardEmbed.on(EmbedEvent.DeletePersonalizedView, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.DeletePersonalisedView,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data).toBe(PAYLOAD);
        }, EVENT_WAIT_TIME);
    });

    test('should fire QueryChanged handler when {type:queryChanged} postMessage arrives from iframe', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.QueryChanged, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.QueryChanged,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data).toBe(PAYLOAD);
        }, EVENT_WAIT_TIME);
    });

    test('should not fire QueryChanged handler for postMessage from non-iframe source', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.QueryChanged, handler).render();

        await executeAfterWait(() => {
            postMessageToParent(window, {
                type: EmbedEvent.QueryChanged,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handler).not.toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('ALL event listener should fire for all events with the event type set correctly', async () => {
        const embed = new AppEmbed(getRootEl(), defaultViewConfig);
        const spy = jest.fn();
        embed.on(EmbedEvent.ALL, spy);
        embed.render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.DialogOpen,
            });
        });

        await executeAfterWait(() => {
            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy.mock.calls[0][0]).toMatchObject({
                type: EmbedEvent.Init,
            });
            expect(spy.mock.calls[1][0]).toMatchObject({
                type: EmbedEvent.CustomAction,
                data: PAYLOAD,
            });
            expect(spy.mock.calls[2][0]).toMatchObject({
                type: EmbedEvent.DialogOpen,
            });
        }, EVENT_WAIT_TIME);
    });
});

describe('Americanized enum alias values', () => {
    test('EmbedEvent aliases should resolve to the same values as their British counterparts', () => {
        expect(EmbedEvent.UpdatePersonalizedView).toBe(EmbedEvent.UpdatePersonalisedView);
        expect(EmbedEvent.SavePersonalizedView).toBe(EmbedEvent.SavePersonalisedView);
        expect(EmbedEvent.DeletePersonalizedView).toBe(EmbedEvent.DeletePersonalisedView);
    });

    test('HostEvent aliases should resolve to the same values as their British counterparts', () => {
        expect(HostEvent.ResetLiveboardPersonalizedView).toBe(HostEvent.ResetLiveboardPersonalisedView);
        expect(HostEvent.UpdatePersonalizedView).toBe(HostEvent.UpdatePersonalisedView);
    });

    test('Action aliases should resolve to the same values as their British counterparts', () => {
        expect(Action.PersonalizedViewsDropdown).toBe(Action.PersonalisedViewsDropdown);
        expect(Action.OrganizeFavorites).toBe(Action.OrganiseFavourites);
    });
});

describe('Action enum values', () => {

    test('RemoveFromFavorites should resolve to its string value', () => {
        expect(Action.RemoveFromFavorites).toBe('removeFromFavorites');
    });
});

describe('EmbedEvent basic routing', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    const UNCOVERED_EVENTS: Array<[string, EmbedEvent]> = [
        ['Drilldown', EmbedEvent.Drilldown],
        ['DataSourceSelected', EmbedEvent.DataSourceSelected],
        ['AddRemoveColumns', EmbedEvent.AddRemoveColumns],
        ['VizPointDoubleClick', EmbedEvent.VizPointDoubleClick],
        ['VizPointClick', EmbedEvent.VizPointClick],
        ['Alert', EmbedEvent.Alert],
        ['GetDataClick', EmbedEvent.GetDataClick],
        ['DialogClose', EmbedEvent.DialogClose],
        ['Download', EmbedEvent.Download],
        ['DownloadAsPng', EmbedEvent.DownloadAsPng],
        ['DownloadAsPdf', EmbedEvent.DownloadAsPdf],
        ['DownloadAsCsv', EmbedEvent.DownloadAsCsv],
        ['DownloadAsXlsx', EmbedEvent.DownloadAsXlsx],
        ['DownloadLiveboardAsContinuousPDF', EmbedEvent.DownloadLiveboardAsContinuousPDF],
        ['AnswerDelete', EmbedEvent.AnswerDelete],
        ['AIHighlights', EmbedEvent.AIHighlights],
        ['Pin', EmbedEvent.Pin],
        ['SpotIQAnalyze', EmbedEvent.SpotIQAnalyze],
        ['Share', EmbedEvent.Share],
        ['DrillInclude', EmbedEvent.DrillInclude],
        ['DrillExclude', EmbedEvent.DrillExclude],
        ['CopyToClipboard', EmbedEvent.CopyToClipboard],
        ['UpdateTML', EmbedEvent.UpdateTML],
        ['EditTML', EmbedEvent.EditTML],
        ['ExportTML', EmbedEvent.ExportTML],
        ['SaveAsView', EmbedEvent.SaveAsView],
        ['CopyAEdit', EmbedEvent.CopyAEdit],
        ['ShowUnderlyingData', EmbedEvent.ShowUnderlyingData],
        ['AnswerChartSwitcher', EmbedEvent.AnswerChartSwitcher],
        ['LiveboardInfo', EmbedEvent.LiveboardInfo],
        ['AddToFavorites', EmbedEvent.AddToFavorites],
        ['Schedule', EmbedEvent.Schedule],
        ['Edit', EmbedEvent.Edit],
        ['MakeACopy', EmbedEvent.MakeACopy],
        ['Present', EmbedEvent.Present],
        ['Delete', EmbedEvent.Delete],
        ['SchedulesList', EmbedEvent.SchedulesList],
        ['Cancel', EmbedEvent.Cancel],
        ['Explore', EmbedEvent.Explore],
        ['CopyLink', EmbedEvent.CopyLink],
        ['CrossFilterChanged', EmbedEvent.CrossFilterChanged],
        ['VizPointRightClick', EmbedEvent.VizPointRightClick],
        ['InsertIntoSlide', EmbedEvent.InsertIntoSlide],
        ['FilterChanged', EmbedEvent.FilterChanged],
        ['UpdateConnection', EmbedEvent.UpdateConnection],
        ['CreateConnection', EmbedEvent.CreateConnection],
        ['ResetLiveboard', EmbedEvent.ResetLiveboard],
        ['ChangePersonalizedView', EmbedEvent.ChangePersonalizedView],
        ['CreateWorksheet', EmbedEvent.CreateWorksheet],
        ['AskSageInit', EmbedEvent.AskSageInit],
        ['Rename', EmbedEvent.Rename],
        ['ParameterChanged', EmbedEvent.ParameterChanged],
        ['TableVizRendered', EmbedEvent.TableVizRendered],
        ['CreateLiveboard', EmbedEvent.CreateLiveboard],
        ['CreateModel', EmbedEvent.CreateModel],
        ['SpotterData', EmbedEvent.SpotterData],
        ['PreviewSpotterData', EmbedEvent.PreviewSpotterData],
        ['AddToCoaching', EmbedEvent.AddToCoaching],
        ['DataModelInstructions', EmbedEvent.DataModelInstructions],
        ['SpotterQueryTriggered', EmbedEvent.SpotterQueryTriggered],
        ['LastPromptEdited', EmbedEvent.LastPromptEdited],
        ['LastPromptDeleted', EmbedEvent.LastPromptDeleted],
        ['ResetSpotterConversation', EmbedEvent.ResetSpotterConversation],
        ['SpotterInit', EmbedEvent.SpotterInit],
        ['SpotterLoadComplete', EmbedEvent.SpotterLoadComplete],
        ['OrgSwitched', EmbedEvent.OrgSwitched],
        ['SpotterConversationRenamed', EmbedEvent.SpotterConversationRenamed],
        ['SpotterConversationDeleted', EmbedEvent.SpotterConversationDeleted],
        ['SpotterConversationSelected', EmbedEvent.SpotterConversationSelected],
        ['EmbedPageContextChanged', EmbedEvent.EmbedPageContextChanged],
        ['Subscribed', EmbedEvent.Subscribed],
        ['SendTestScheduleEmail', EmbedEvent.SendTestScheduleEmail],
        ['SpotterVizInit', EmbedEvent.SpotterVizInit],
        ['SpotterVizQueryTriggered', EmbedEvent.SpotterVizQueryTriggered],
        ['SpotterVizResponseComplete', EmbedEvent.SpotterVizResponseComplete],
        ['SpotterVizCheckpointCreated', EmbedEvent.SpotterVizCheckpointCreated],
        ['SpotterVizCheckpointRestored', EmbedEvent.SpotterVizCheckpointRestored],
        ['SpotterVizError', EmbedEvent.SpotterVizError],
        ['SpotterVizClosed', EmbedEvent.SpotterVizClosed],
        ['RefreshLiveboardBrowserCache', EmbedEvent.RefreshLiveboardBrowserCache],
        ['V1Data', EmbedEvent.V1Data],
    ];

    test.each(UNCOVERED_EVENTS)(
        '%s handler fires on iframe postMessage',
        async (eventName, embedEvent) => {
            const handler = jest.fn();
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.on(embedEvent, handler).render();

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, {
                    type: embedEvent,
                    data: PAYLOAD,
                });
            });

            await executeAfterWait(() => {
                expect(handler).toHaveBeenCalled();
                expect(handler.mock.calls[0][0].data).toBe(PAYLOAD);
            }, EVENT_WAIT_TIME);
        },
    );
});

describe('EmbedEvent start/end status', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    const START_END_EVENTS: Array<[string, EmbedEvent]> = [
        ['DownloadAsPng', EmbedEvent.DownloadAsPng],
        ['DownloadAsPdf', EmbedEvent.DownloadAsPdf],
        ['DownloadAsCsv', EmbedEvent.DownloadAsCsv],
        ['DownloadAsXlsx', EmbedEvent.DownloadAsXlsx],
        ['AnswerDelete', EmbedEvent.AnswerDelete],
        ['Pin', EmbedEvent.Pin],
        ['SpotIQAnalyze', EmbedEvent.SpotIQAnalyze],
        ['Share', EmbedEvent.Share],
        ['ExportTML', EmbedEvent.ExportTML],
        ['CopyAEdit', EmbedEvent.CopyAEdit],
    ];

    test.each(START_END_EVENTS)(
        '%s start handler fires on START, not END',
        async (eventName, embedEvent) => {
            const startHandler = jest.fn();
            const endHandler = jest.fn();
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed
                .on(embedEvent, startHandler, { start: true })
                .on(embedEvent, endHandler)
                .render();

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, {
                    type: embedEvent,
                    data: PAYLOAD,
                    status: 'start',
                });
            });

            await executeAfterWait(() => {
                expect(startHandler).toHaveBeenCalled();
                expect(endHandler).not.toHaveBeenCalled();
            }, EVENT_WAIT_TIME);
        },
    );

    test.each(START_END_EVENTS)(
        '%s end handler fires on END, not START',
        async (eventName, embedEvent) => {
            const startHandler = jest.fn();
            const endHandler = jest.fn();
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed
                .on(embedEvent, startHandler, { start: true })
                .on(embedEvent, endHandler)
                .render();

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, {
                    type: embedEvent,
                    data: PAYLOAD,
                    status: 'end',
                });
            });

            await executeAfterWait(() => {
                expect(endHandler).toHaveBeenCalled();
                expect(startHandler).not.toHaveBeenCalled();
            }, EVENT_WAIT_TIME);
        },
    );

    const END_ONLY_EVENTS: Array<[string, EmbedEvent]> = [
        ['Download', EmbedEvent.Download],
        ['DownloadLiveboardAsContinuousPDF', EmbedEvent.DownloadLiveboardAsContinuousPDF],
    ];

    test.each(END_ONLY_EVENTS)(
        '%s ignores start handler (end-only event)',
        async (eventName, embedEvent) => {
            const startHandler = jest.fn();
            const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
            searchEmbed.on(embedEvent, startHandler, { start: true }).render();

            await executeAfterWait(() => {
                const iframe = getIFrameEl();
                postMessageToParent(iframe.contentWindow, {
                    type: embedEvent,
                    data: PAYLOAD,
                });
            });

            await executeAfterWait(() => {
                expect(startHandler).not.toHaveBeenCalled();
            }, EVENT_WAIT_TIME);
        },
    );
});

describe('EmbedEvent payload and routing', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('Drilldown payload includes additionalFilters, drillDownColumns, nonFilteredColumns', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.Drilldown, handler).render();

        const drilldownData = {
            additionalFilters: [{ column: 'region', value: 'west' }],
            drillDownColumns: ['revenue'],
            nonFilteredColumns: ['date'],
        };

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.Drilldown,
                data: drilldownData,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            const received = handler.mock.calls[0][0].data;
            expect(received.additionalFilters).toEqual(drilldownData.additionalFilters);
            expect(received.drillDownColumns).toEqual(drilldownData.drillDownColumns);
            expect(received.nonFilteredColumns).toEqual(drilldownData.nonFilteredColumns);
        }, EVENT_WAIT_TIME);
    });

    test('DataSourceSelected payload contains dataSourceIds array', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.DataSourceSelected, handler).render();

        const dataSourceIds = ['ds-aaa', 'ds-bbb'];

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.DataSourceSelected,
                data: { dataSourceIds },
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data.dataSourceIds).toEqual(dataSourceIds);
        }, EVENT_WAIT_TIME);
    });

    test('V1Data fires via __type field when type is absent', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.V1Data, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                __type: EmbedEvent.V1Data,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('subscribedEvent builds composed key and routes to registered handler', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        const composedEvent = searchEmbed.subscribedEvent(HostEvent.Save);

        expect(composedEvent).toBe(`${HostEvent.Save} ${EmbedEvent.Subscribed}`);

        searchEmbed.on(composedEvent as any, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: composedEvent,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('non-iframe postMessage does not trigger registered handler', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.Drilldown, handler).render();

        await executeAfterWait(() => {
            postMessageToParent(window, {
                type: EmbedEvent.Drilldown,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            expect(handler).not.toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('DataSourceSelected falls back to payload field when data is absent', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.DataSourceSelected, handler).render();

        const dataSourceIds = ['ds-fallback'];

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.DataSourceSelected,
                payload: { dataSourceIds },
                // no data field — formatEventData should copy payload → data
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data.dataSourceIds).toEqual(dataSourceIds);
        }, EVENT_WAIT_TIME);
    });

    test('Alert handler fires independently of window.alert', async () => {
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.Alert, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.Alert,
                data: { message: 'test alert' },
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(alertSpy).not.toHaveBeenCalled();
        }, EVENT_WAIT_TIME);

        alertSpy.mockRestore();
    });

    test('Share reaches EmbedEvent.ALL wildcard handler', async () => {
        const allHandler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.ALL, allHandler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.Share,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            const types = allHandler.mock.calls.map((c) => c[0].type);
            expect(types).toContain(EmbedEvent.Share);
        }, EVENT_WAIT_TIME);
    });

    test('DialogClose reaches EmbedEvent.ALL wildcard handler', async () => {
        const allHandler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.ALL, allHandler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.DialogClose,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            const types = allHandler.mock.calls.map((c) => c[0].type);
            expect(types).toContain(EmbedEvent.DialogClose);
        }, EVENT_WAIT_TIME);
    });

    test('SpotterConversationRenamed payload contains convId, oldTitle, newTitle', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.SpotterConversationRenamed, handler).render();

        const convData = { convId: 'conv-1', oldTitle: 'Old', newTitle: 'New' };

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.SpotterConversationRenamed,
                data: convData,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data).toMatchObject(convData);
        }, EVENT_WAIT_TIME);
    });

    test('SpotterConversationDeleted payload contains convId and title', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.SpotterConversationDeleted, handler).render();

        const convData = { convId: 'conv-2', title: 'My Conversation' };

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.SpotterConversationDeleted,
                data: convData,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data).toMatchObject(convData);
        }, EVENT_WAIT_TIME);
    });

    test('SpotterConversationSelected payload contains convId, title, worksheetId', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.SpotterConversationSelected, handler).render();

        const convData = { convId: 'conv-3', title: 'My Conv', worksheetId: 'ws-1' };

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.SpotterConversationSelected,
                data: convData,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data).toMatchObject(convData);
        }, EVENT_WAIT_TIME);
    });

    test('TableVizRendered payload forwards columnDataLite array intact', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.TableVizRendered, handler).render();

        const columnDataLite = [['col1', 'col2'], ['val1', 'val2']];

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.TableVizRendered,
                data: { data: { columnDataLite } },
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data.data.columnDataLite).toEqual(columnDataLite);
        }, EVENT_WAIT_TIME);
    });

    test('SendTestScheduleEmail payload preserves liveboardId and sendToSelf boolean', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.SendTestScheduleEmail, handler).render();

        const emailData = { liveboardId: 'lb-123', sendToSelf: true };

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.SendTestScheduleEmail,
                data: emailData,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            const received = handler.mock.calls[0][0].data;
            expect(received.liveboardId).toBe('lb-123');
            expect(received.sendToSelf).toBe(true);
            expect(typeof received.sendToSelf).toBe('boolean');
        }, EVENT_WAIT_TIME);
    });

    test('ChangePersonalizedView payload viewId can be null (reset-to-default)', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.ChangePersonalizedView, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.ChangePersonalizedView,
                data: { viewId: null, viewName: 'Original View', liveboardId: 'lb-1', isPublic: false },
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].data.viewId).toBeNull();
            expect(handler.mock.calls[0][0].data.viewName).toBe('Original View');
        }, EVENT_WAIT_TIME);
    });

    test('VizPointDoubleClick payload exposes vizId and clickedPoint.selectedPoints', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.VizPointDoubleClick, handler).render();

        const pointData = {
            vizId: 'viz-1',
            clickedPoint: { selectedPoints: [{ x: 10, y: 20 }] },
        };

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.VizPointDoubleClick,
                data: pointData,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            const { data } = handler.mock.calls[0][0];
            expect(data.vizId).toBe('viz-1');
            expect(data.clickedPoint.selectedPoints).toEqual(pointData.clickedPoint.selectedPoints);
        }, EVENT_WAIT_TIME);
    });

    test('VizPointClick payload exposes vizId, selectedAttributes and selectedMeasures', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.VizPointClick, handler).render();

        const pointData = {
            vizId: 'viz-2',
            clickedPoint: {
                selectedAttributes: [{ value: 'West', column: { name: 'region' } }],
                selectedMeasures: [{ value: 42, column: { name: 'revenue' } }],
            },
        };

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.VizPointClick,
                data: pointData,
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            const { data } = handler.mock.calls[0][0];
            expect(data.vizId).toBe('viz-2');
            expect(data.clickedPoint.selectedAttributes[0].value).toBe('West');
            expect(data.clickedPoint.selectedAttributes[0].column.name).toBe('region');
            expect(data.clickedPoint.selectedMeasures[0].value).toBe(42);
            expect(data.clickedPoint.selectedMeasures[0].column.name).toBe('revenue');
        }, EVENT_WAIT_TIME);
    });

    test('SpotterVizError reaches EmbedEvent.ALL handler', async () => {
        const allHandler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.ALL, allHandler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.SpotterVizError,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            const types = allHandler.mock.calls.map((c) => c[0].type);
            expect(types).toContain(EmbedEvent.SpotterVizError);
        }, EVENT_WAIT_TIME);
    });

    test('SpotterVizClosed reaches EmbedEvent.ALL handler', async () => {
        const allHandler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.ALL, allHandler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.SpotterVizClosed,
                data: PAYLOAD,
            });
        });

        await executeAfterWait(() => {
            const types = allHandler.mock.calls.map((c) => c[0].type);
            expect(types).toContain(EmbedEvent.SpotterVizClosed);
        }, EVENT_WAIT_TIME);
    });

    test('SpotterVizCheckpointRestored payload newGenNumber is a number', async () => {
        const handler = jest.fn();
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.on(EmbedEvent.SpotterVizCheckpointRestored, handler).render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.SpotterVizCheckpointRestored,
                data: { checkpointId: 'cp-1', newGenNumber: 42 },
            });
        });

        await executeAfterWait(() => {
            expect(handler).toHaveBeenCalled();
            const { newGenNumber } = handler.mock.calls[0][0].data;
            expect(newGenNumber).toBe(42);
            expect(typeof newGenNumber).toBe('number');
        }, EVENT_WAIT_TIME);
    });
});
