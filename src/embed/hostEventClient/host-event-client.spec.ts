import { getIFrameEl, getRootEl } from '../../test/test-utils';
import { AuthType, HostEvent } from '../../types';
import { processTrigger } from '../../utils/processTrigger';
import * as EmbedConfigService from '../embedConfig';
import {
    UIPassthroughEvent,
    UIPassthroughRequest,
    UIPassthroughArrayResponse,
    HostEventRequest,
} from './contracts';
import { HostEventClient } from './host-event-client';

jest.mock('../../utils/processTrigger');

const mockProcessTrigger = processTrigger as jest.Mock;

const createHostEventClient = () => {
    const mockIframe = document.createElement('iframe');
    const client = new HostEventClient(mockIframe);
    return { client, mockIframe };
};

describe('HostEventClient', () => {
    const mockThoughtSpotHost = 'http://localhost';
    beforeEach(() => {
        jest.spyOn(EmbedConfigService, 'getEmbedConfig').mockReturnValue({ thoughtSpotHost: mockThoughtSpotHost, authType: AuthType.None } as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executeUIPassthroughApi', () => {
        it('should call processTrigger with correct parameters and return response', async () => {
            const { client, mockIframe } = createHostEventClient();

            const apiName = UIPassthroughEvent.PinAnswerToLiveboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse = Promise.resolve([
                { value: { pinboardId: 'testPinboard', tabId: 'testTab', vizId: 'testVizId' } },
            ]);

            mockProcessTrigger.mockResolvedValue(triggerResponse);

            const result = await client.triggerUIPassthroughApi(apiName, parameters);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                {
                    type: apiName,
                    parameters,
                },
                undefined,
            );
            expect(result).toEqual(await triggerResponse);
        });
    });

    describe('handleUIPassthroughForHostEvent', () => {
        it('should return the value from the first valid response', async () => {
            const { client } = createHostEventClient();
            const apiName = UIPassthroughEvent.PinAnswerToLiveboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse = Promise.resolve([
                { value: { pinboardId: 'testPinboard', tabId: 'testTab', vizId: 'testVizId' } },
            ]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            const result = await client.handleHostEventWithParam(apiName, parameters);

            expect(result).toEqual({
                pinboardId: 'testPinboard',
                tabId: 'testTab',
                vizId: 'testVizId',
            });
        });

        it('should throw an error if no valid response is found', async () => {
            const { client } = createHostEventClient();
            const apiName = UIPassthroughEvent.PinAnswerToLiveboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse: UIPassthroughArrayResponse<typeof apiName> = [];
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleHostEventWithParam(apiName, parameters))
                .rejects.toEqual({ error: 'No answer found.' });
        });

        it('should throw an error if no valid response is found for vizId', async () => {
            const { client } = createHostEventClient();
            const apiName = UIPassthroughEvent.PinAnswerToLiveboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
                vizId: 'testVizId',
            };
            const triggerResponse: UIPassthroughArrayResponse<typeof apiName> = [];
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleHostEventWithParam(apiName, parameters))
                .rejects.toEqual({ error: 'No answer found for vizId: testVizId.' });
        });

        it('should throw an error if the response contains errors', async () => {
            const { client } = createHostEventClient();
            const apiName = UIPassthroughEvent.PinAnswerToLiveboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse: UIPassthroughArrayResponse<typeof apiName> = [
                { error: 'Some error' },
            ];
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleHostEventWithParam(apiName, parameters))
                .rejects.toEqual({ error: 'Some error' });
        });
    });

    describe('executeHostEvent', () => {
        const mockGetAvailablePassthroughs = () => [{ value: { keys: Object.values(UIPassthroughEvent) } }];

        it('should call handleUIPassthroughForHostEvent for Pin event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const hostEvent = HostEvent.Pin;
            const payload: HostEventRequest<typeof hostEvent> = {
                newVizName: 'testViz',
            };
            const mockResponse = {
                value: {
                    pinboardId: 'testPinboard',
                    liveboardId: 'testPinboard',
                    tabId: 'testTab',
                    vizId: 'testVizId',
                },
            };

            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([mockResponse]);

            const result = await client.triggerHostEvent(hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                'http://localhost',
                { parameters: payload, type: UIPassthroughEvent.PinAnswerToLiveboard },
                undefined,
            );
            expect(result).toEqual(mockResponse.value);
        });

        it('should call handleUIPassthroughForHostEvent for SaveAnswer event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const hostEvent = HostEvent.SaveAnswer;
            const payload: HostEventRequest<typeof hostEvent> = {
                name: 'Test Answer',
                description: 'Test Description',
                vizId: 'testVizId',
            };
            const mockResponse = [{
                value: {
                    saveResponse: {
                        data: {
                            Answer__save: {
                                answer: {
                                    id: 'newAnswer',
                                },
                            },
                        },
                    },
                },
                refId: 'testVizId',
            }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);
            const result = await client.triggerHostEvent(hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                {
                    parameters: payload,
                    type: 'saveAnswer',
                },
                undefined,
            );
            expect(result).toEqual({ answerId: 'newAnswer', ...mockResponse[0].value });
        });

        it('should call handleHostEventWithParam for UpdateFilters event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const hostEvent = HostEvent.UpdateFilters;
            const payload: HostEventRequest<typeof hostEvent> = {
                vizId: 'viz-123',
                filter: {
                    column: 'region',
                    oper: 'EQ',
                    values: ['North'],
                },
            } as any;
            const mockResponse = [{ value: { success: true } }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);

            const result = await client.triggerHostEvent(hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                {
                    type: UIPassthroughEvent.UpdateFilters,
                    parameters: payload,
                },
                undefined,
            );
            expect(result).toEqual({ success: true });
        });

        it('should call handleHostEventWithParam for DrillDown event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const hostEvent = HostEvent.DrillDown;
            const payload: HostEventRequest<typeof hostEvent> = {
                points: { clickedPoint: 'point-1', selectedPoints: ['sel-1'] },
                autoDrillDown: true,
            } as any;
            const mockResponse = [{ value: { drillDownApplied: true } }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);

            const result = await client.triggerHostEvent(hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                {
                    type: UIPassthroughEvent.Drilldown,
                    parameters: payload,
                },
                undefined,
            );
            expect(result).toEqual({ drillDownApplied: true });
        });

        it('should accept UpdateFilters with filters array', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = {
                filters: [
                    { column: '(Sample) Retail - Apparel::city', oper: 'IN', values: ['atlanta'] },
                    { column: '(Sample) Retail - Apparel::Region', oper: 'IN', values: ['West', 'Midwest'] },
                ],
            } as any;
            const mockResponse = [{ value: { success: true } }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);

            const result = await client.triggerHostEvent(HostEvent.UpdateFilters, payload);

            expect(mockProcessTrigger).toHaveBeenNthCalledWith(
                2,
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                { type: UIPassthroughEvent.UpdateFilters, parameters: payload },
                undefined,
            );
            expect(result).toEqual({ success: true });
        });

        it('should throw when UpdateFilters payload has no valid filter', async () => {
            const { client } = createHostEventClient();
            const invalidPayload = {} as any;
            mockProcessTrigger.mockResolvedValueOnce(mockGetAvailablePassthroughs());

            await expect(client.triggerHostEvent(HostEvent.UpdateFilters, invalidPayload))
                .rejects.toThrow('UpdateFilters requires a valid filter or filters array');
            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
        });

        it('should pass context to UpdateFilters event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = { vizId: 'viz-1', filter: { column: 'x', oper: 'EQ', values: ['a'] } } as any;
            const context = { answerId: 'ans-1' } as any;
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([{ value: {} }]);

            await client.triggerHostEvent(HostEvent.UpdateFilters, payload, context);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                { type: UIPassthroughEvent.UpdateFilters, parameters: payload },
                context,
            );
        });

        it('should dispatch UpdateParameters over the legacy channel', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = [
                { name: 'param1', value: 10, applicability: { level: 'TAB', targetId: 'tab-guid-1' } },
            ] as any;
            mockProcessTrigger.mockResolvedValueOnce({ success: true });

            const result = await client.triggerHostEvent(HostEvent.UpdateParameters, payload);

            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UpdateParameters,
                mockThoughtSpotHost,
                payload,
                undefined,
            );
            expect(result).toEqual({ success: true });
        });

        it('should forward UpdateParameters with null applicability', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = [{ name: 'param1', value: 10, applicability: null }] as any;
            mockProcessTrigger.mockResolvedValueOnce({ success: true });

            await client.triggerHostEvent(HostEvent.UpdateParameters, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UpdateParameters,
                mockThoughtSpotHost,
                payload,
                undefined,
            );
        });

        it('should throw when UpdateParameters entry has invalid applicability', async () => {
            const { client } = createHostEventClient();
            const invalidPayload = [
                { name: 'param1', value: 10, applicability: { level: 'TAB' } }, // missing targetId
            ] as any;

            await expect(client.triggerHostEvent(HostEvent.UpdateParameters, invalidPayload))
                .rejects.toThrow('UpdateParameters received an invalid applicability');
            expect(mockProcessTrigger).not.toHaveBeenCalled();
        });

        it('should pass context to UpdateParameters event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = [{ name: 'param1', value: 10 }] as any;
            const context = { vizId: 'viz-1' } as any;
            mockProcessTrigger.mockResolvedValueOnce({ success: true });

            await client.triggerHostEvent(HostEvent.UpdateParameters, payload, context);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UpdateParameters,
                mockThoughtSpotHost,
                payload,
                context,
            );
        });

        it('should dispatch OpenFilter over the legacy channel', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = {
                column: { columnId: 'col-1' },
                applicability: { level: 'TAB', targetId: 'tab-guid-1' },
            } as any;
            mockProcessTrigger.mockResolvedValueOnce({ success: true });

            const result = await client.triggerHostEvent(HostEvent.OpenFilter, payload);

            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.OpenFilter,
                mockThoughtSpotHost,
                payload,
                undefined,
            );
            expect(result).toEqual({ success: true });
        });

        it('should dispatch OpenFilter without applicability', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = { column: { columnId: 'col-1' } } as any;
            mockProcessTrigger.mockResolvedValueOnce({ success: true });

            await client.triggerHostEvent(HostEvent.OpenFilter, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.OpenFilter,
                mockThoughtSpotHost,
                payload,
                undefined,
            );
        });

        it('should throw when OpenFilter has invalid applicability', async () => {
            const { client } = createHostEventClient();
            const invalidPayload = {
                column: { columnId: 'col-1' },
                applicability: { level: 'TAB' }, // missing targetId
            } as any;

            await expect(client.triggerHostEvent(HostEvent.OpenFilter, invalidPayload))
                .rejects.toThrow('OpenFilter received an invalid applicability');
            expect(mockProcessTrigger).not.toHaveBeenCalled();
        });

        it('should pass context to OpenFilter event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = { column: { columnId: 'col-1' } } as any;
            const context = { liveboardId: 'lb-1' } as any;
            mockProcessTrigger.mockResolvedValueOnce({ success: true });

            await client.triggerHostEvent(HostEvent.OpenFilter, payload, context);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.OpenFilter,
                mockThoughtSpotHost,
                payload,
                context,
            );
        });

        it('should dispatch OpenParameter over the legacy channel', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = {
                parameter: { parameterId: 'p-1' },
                applicability: { level: 'GROUP', targetId: 'group-guid-1' },
            } as any;
            mockProcessTrigger.mockResolvedValueOnce({ success: true });

            const result = await client.triggerHostEvent(HostEvent.OpenParameter, payload);

            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.OpenParameter,
                mockThoughtSpotHost,
                payload,
                undefined,
            );
            expect(result).toEqual({ success: true });
        });

        it('should throw when OpenParameter has invalid applicability', async () => {
            const { client } = createHostEventClient();
            const invalidPayload = {
                parameter: { parameterId: 'p-1' },
                applicability: { level: 'GROUP' }, // missing targetId
            } as any;

            await expect(client.triggerHostEvent(HostEvent.OpenParameter, invalidPayload))
                .rejects.toThrow('OpenParameter received an invalid applicability');
            expect(mockProcessTrigger).not.toHaveBeenCalled();
        });

        it('should route GetGroups through passthrough and return data', async () => {
            const { client } = createHostEventClient();
            const mockResponse = [{ value: { orderedGroupIds: ['g1', 'g2'], numberOfGroups: 2, Groups: [] as any[] } }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);

            const result = await client.triggerHostEvent(HostEvent.GetGroups, {});

            expect(result).toEqual({ orderedGroupIds: ['g1', 'g2'], numberOfGroups: 2, Groups: [] });
        });

        it('should throw when DrillDown payload has no valid points', async () => {
            const { client } = createHostEventClient();
            const invalidPayload = {} as any;
            mockProcessTrigger.mockResolvedValueOnce(mockGetAvailablePassthroughs());

            await expect(client.triggerHostEvent(HostEvent.DrillDown, invalidPayload))
                .rejects.toThrow('DrillDown requires a valid points object');
            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
        });

        it('should pass context to DrillDown event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = { points: { clickedPoint: 'point-1' }, vizId: 'viz-2' } as any;
            const context = { liveboardId: 'lb-1' } as any;
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([{ value: {} }]);

            await client.triggerHostEvent(HostEvent.DrillDown, payload, context);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                { type: UIPassthroughEvent.Drilldown, parameters: payload },
                context,
            );
        });

        it('should skip to fallback when passthrough is not in available keys', async () => {
            const { client, mockIframe } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce([{ value: { keys: ['getFilters'] } }])
                .mockResolvedValueOnce({ session: 'legacySession' });

            const result = await client.triggerHostEvent(HostEvent.GetAnswerSession, { vizId: '123' });

            expect(mockProcessTrigger).toHaveBeenCalledTimes(2);
            expect(mockProcessTrigger).toHaveBeenNthCalledWith(
                2,
                mockIframe,
                HostEvent.GetAnswerSession,
                mockThoughtSpotHost,
                { vizId: '123' },
                undefined,
            );
            expect(result).toEqual({ session: 'legacySession' });
        });

        it('should call hostEventFallback for unmapped events', async () => {
            const { client } = createHostEventClient();
            const hostEvent = 'testEvent' as HostEvent;
            const payload = { data: 'testData' };
            const mockResponse = { fallbackResponse: 'data' };
            jest.spyOn(client, 'hostEventFallback').mockResolvedValue(mockResponse);

            const result = await client.triggerHostEvent(hostEvent, payload);

            expect(client.hostEventFallback).toHaveBeenCalledWith(hostEvent, payload, undefined);
            expect(result).toEqual(mockResponse);
        });

        it('should route GetAnswerSession through passthrough and return data', async () => {
            const { client, mockIframe } = createHostEventClient();
            const mockResponse = [{ value: { session: 'testSession', embedAnswerData: { id: '1' } } }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);

            const result = await client.triggerHostEvent(HostEvent.GetAnswerSession, { vizId: '123' });

            expect(mockProcessTrigger).toHaveBeenNthCalledWith(
                2,
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                { type: UIPassthroughEvent.GetAnswerSession, parameters: { vizId: '123' } },
                undefined,
            );
            expect(result).toEqual({ session: 'testSession', embedAnswerData: { id: '1' } });
        });

        it('should fall back to legacy host event when passthrough returns no data for GetAnswerSession', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce({ session: 'fallbackSession' });

            const result = await client.triggerHostEvent(HostEvent.GetAnswerSession, { vizId: '123' });

            expect(mockProcessTrigger).toHaveBeenCalledTimes(3);
            expect(mockProcessTrigger).toHaveBeenNthCalledWith(
                3,
                expect.anything(),
                HostEvent.GetAnswerSession,
                mockThoughtSpotHost,
                { vizId: '123' },
                undefined,
            );
            expect(result).toEqual({ session: 'fallbackSession' });
        });

        it('should throw real errors from passthrough without falling back', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([{ error: 'Permission denied' }]);

            await expect(client.triggerHostEvent(HostEvent.GetAnswerSession, {}))
                .rejects.toThrow('Permission denied');
            expect(mockProcessTrigger).toHaveBeenCalledTimes(2);
        });

        it('should route GetFilters through passthrough and return data', async () => {
            const { client, mockIframe } = createHostEventClient();
            const mockResponse = [{ value: { liveboardFilters: [{ id: 'f1' }], runtimeFilters: [] as any[] } }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);

            const result = await client.triggerHostEvent(HostEvent.GetFilters, {});

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                { type: UIPassthroughEvent.GetFilters, parameters: {} },
                undefined,
            );
            expect(result).toEqual({ liveboardFilters: [{ id: 'f1' }], runtimeFilters: [] });
        });

        it('should route GetTabs through passthrough and return data', async () => {
            const { client } = createHostEventClient();
            const mockResponse = [{ value: { orderedTabIds: ['t1', 't2'], numberOfTabs: 2, Tabs: [] as any[] } }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);

            const result = await client.triggerHostEvent(HostEvent.GetTabs, {});

            expect(result).toEqual({ orderedTabIds: ['t1', 't2'], numberOfTabs: 2, Tabs: [] });
        });

        it('should route GetTML through passthrough and return data', async () => {
            const { client } = createHostEventClient();
            const tmlData = { answer: { search_query: 'revenue by region' } };
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([{ value: tmlData }]);

            const result = await client.triggerHostEvent(HostEvent.GetTML, {});

            expect(result).toEqual(tmlData);
        });

        it('should route GetIframeUrl through passthrough and return data', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([{ value: { iframeUrl: 'https://ts.example.com/embed' } }]);

            const result = await client.triggerHostEvent(HostEvent.GetIframeUrl, {});

            expect(result).toEqual({ iframeUrl: 'https://ts.example.com/embed' });
        });

        it('should route GetParameters through passthrough and return data', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([{ value: { parameters: [{ name: 'p1' }] } }]);

            const result = await client.triggerHostEvent(HostEvent.GetParameters, {});

            expect(result).toEqual({ parameters: [{ name: 'p1' }] });
        });

        it('should route getExportRequestForCurrentPinboard through passthrough and return data', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([{ value: { data: { v2Content: 'exportData' }, type: 'getExportRequestForCurrentPinboard' } }]);

            const result = await client.triggerHostEvent(HostEvent.getExportRequestForCurrentPinboard, {});

            expect(result).toEqual({ data: { v2Content: 'exportData' }, type: 'getExportRequestForCurrentPinboard' });
        });

        it('should fall back to legacy for GetFilters when passthrough returns null', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ liveboardFilters: [], runtimeFilters: [] });

            const result = await client.triggerHostEvent(HostEvent.GetFilters, {});

            expect(mockProcessTrigger).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ liveboardFilters: [], runtimeFilters: [] });
        });

        it('should call fallback  for Pin event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const hostEvent = HostEvent.Pin;
            const payload: HostEventRequest<typeof hostEvent> = {} as any;
            const mockResponse = {
                value: {
                    pinboardId: 'testPinboard',
                    tabId: 'testTab',
                    vizId: 'testVizId',
                },
            };

            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([mockResponse]);

            const result = await client.triggerHostEvent(hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.Pin,
                mockThoughtSpotHost,
                {},
                undefined,
            );
            expect(result).toEqual([mockResponse]);
        });

        it('should call fallback for SaveAnswer event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const hostEvent = HostEvent.SaveAnswer;
            const payload: HostEventRequest<typeof hostEvent> = {} as any;
            const mockResponse = {
                value: {
                    pinboardId: 'testPinboard',
                    tabId: 'testTab',
                    vizId: 'testVizId',
                },
            };

            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce([mockResponse]);

            const result = await client.triggerHostEvent(hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.Save,
                mockThoughtSpotHost,
                {},
                undefined,
            );
            expect(result).toEqual([mockResponse]);
        });

        it('Pin response support pinboardId as well', async () => {
            const { client, mockIframe } = createHostEventClient();
            const hostEvent = HostEvent.Pin;
            const payload: HostEventRequest<typeof hostEvent> = {
                newVizDescription: 'Test Description',
                vizId: 'testVizId',
                newVizName: 'Test Answer',
                newLiveboardName: 'testLiveboard',
            } as any;
            const mockResponse = [{
                value: {
                    pinboardId: 'testLiveboard',
                    liveboardId: 'testPinboard',
                    tabId: 'testTab',
                    vizId: 'testVizId',
                },
                refId: 'testVizId',
            }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);
            const result = await client.triggerHostEvent(hostEvent, payload);
            expect(result.liveboardId).toBe('testLiveboard');
        });

        it('should request liveboardId as well', async () => {
            const { client, mockIframe } = createHostEventClient();
            const hostEvent = HostEvent.Pin;
            const payload: HostEventRequest<typeof hostEvent> = {
                liveboardId: 'test',
                newVizName: 'Test Answer',
                newPinboardName: 'testLiveboard1',
                newLiveboardName: 'testLiveboard',
            } as any;
            const mockResponse = [{
                value: {
                    pinboardId: 'testLiveboard',
                    tabId: 'testTab',
                    vizId: 'testVizId',
                },
                refId: 'testVizId',
            }];
            mockProcessTrigger
                .mockResolvedValueOnce(mockGetAvailablePassthroughs())
                .mockResolvedValueOnce(mockResponse);
            const result = await client.triggerHostEvent(hostEvent, payload);
            expect(result.liveboardId).toBe('testLiveboard');
            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                {
                    parameters: { ...payload, pinboardId: 'test', newPinboardName: 'testLiveboard' },
                    type: 'addVizToPinboard',
                },
                undefined,
            );
            expect(result).toEqual({
                pinboardId: 'testLiveboard',
                tabId: 'testTab',
                vizId: 'testVizId',
                liveboardId: 'testLiveboard',
            });
        });
    });

    describe('getDataWithPassthroughFallback', () => {
        const callMethod = (client: HostEventClient, ...args: any[]) => (client as any).getDataWithPassthroughFallback(...args);

        it('should return unwrapped value when passthrough succeeds', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger.mockResolvedValue([{ value: { session: 's1', embedAnswerData: { id: 'a1' } } }]);

            const result = await callMethod(
                client, UIPassthroughEvent.GetAnswerSession, HostEvent.GetAnswerSession, { vizId: '1' },
            );

            expect(result).toEqual({ session: 's1', embedAnswerData: { id: 'a1' } });
            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
        });

        it('should fall back to legacy when passthrough returns empty array', async () => {
            const { client } = createHostEventClient();
            const legacyResponse = { session: 'legacy' };
            mockProcessTrigger
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce(legacyResponse);

            const result = await callMethod(
                client, UIPassthroughEvent.GetAnswerSession, HostEvent.GetAnswerSession, { vizId: '1' },
            );

            expect(mockProcessTrigger).toHaveBeenCalledTimes(2);
            expect(result).toEqual(legacyResponse);
        });

        it('should fall back to legacy when passthrough returns null', async () => {
            const { client } = createHostEventClient();
            const legacyResponse = { parameters: [] as any[] };
            mockProcessTrigger
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(legacyResponse);

            const result = await callMethod(
                client, UIPassthroughEvent.GetParameters, HostEvent.GetParameters, {},
            );

            expect(mockProcessTrigger).toHaveBeenCalledTimes(2);
            expect(result).toEqual(legacyResponse);
        });

        it('should fall back to legacy when passthrough returns undefined', async () => {
            const { client } = createHostEventClient();
            const legacyResponse = { iframeUrl: 'https://ts.example.com' };
            mockProcessTrigger
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(legacyResponse);

            const result = await callMethod(
                client, UIPassthroughEvent.GetIframeUrl, HostEvent.GetIframeUrl, {},
            );

            expect(mockProcessTrigger).toHaveBeenCalledTimes(2);
            expect(result).toEqual(legacyResponse);
        });

        it('should fall back when response array has no matching entries', async () => {
            const { client } = createHostEventClient();
            const legacyResponse = { v2Content: 'data' };
            mockProcessTrigger
                .mockResolvedValueOnce([{ refId: 'r1' }])
                .mockResolvedValueOnce(legacyResponse);

            const result = await callMethod(
                client, UIPassthroughEvent.GetExportRequestForCurrentPinboard,
                HostEvent.getExportRequestForCurrentPinboard, {},
            );

            expect(mockProcessTrigger).toHaveBeenCalledTimes(2);
            expect(result).toEqual(legacyResponse);
        });

        it('should throw when response has error field', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger.mockResolvedValue([{ error: 'Permission denied' }]);

            await expect(callMethod(
                client, UIPassthroughEvent.GetFilters, HostEvent.GetFilters, {},
            )).rejects.toThrow('Permission denied');
            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
        });

        it('should throw when response value contains errors field', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger.mockResolvedValue([{ value: { errors: 'Invalid vizId' } }]);

            await expect(callMethod(
                client, UIPassthroughEvent.GetTML, HostEvent.GetTML, { vizId: 'bad' },
            )).rejects.toThrow('Invalid vizId');
            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
        });

        it('should throw when response value contains error field', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger.mockResolvedValue([{ value: { error: 'Not found' } }]);

            await expect(callMethod(
                client, UIPassthroughEvent.GetTabs, HostEvent.GetTabs, {},
            )).rejects.toThrow('Not found');
            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
        });

        it('should stringify object errors instead of producing [object Object]', async () => {
            const { client } = createHostEventClient();
            const errorObj = { code: 403, reason: 'Forbidden' };
            mockProcessTrigger.mockResolvedValue([{ error: errorObj }]);

            await expect(callMethod(
                client, UIPassthroughEvent.GetFilters, HostEvent.GetFilters, {},
            )).rejects.toThrow(JSON.stringify(errorObj));
            expect(mockProcessTrigger).toHaveBeenCalledTimes(1);
        });

        it('should default payload to empty object when null', async () => {
            const { client, mockIframe } = createHostEventClient();
            mockProcessTrigger.mockResolvedValue([{ value: { iframeUrl: 'https://ts.example.com' } }]);

            await callMethod(
                client, UIPassthroughEvent.GetIframeUrl, HostEvent.GetIframeUrl, null,
            );

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                { type: UIPassthroughEvent.GetIframeUrl, parameters: {} },
                undefined,
            );
        });
    });

    describe('UI passthrough available keys tests', () => {
        const mockKeys = () => [{ value: { keys: Object.values(UIPassthroughEvent) } }];

        it('triggerHostEvent Pin returns passthrough response', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(mockKeys())
                .mockResolvedValueOnce([{ value: { pinboardId: 'lb1', tabId: 't1', vizId: 'v1' } }]);

            const result = await client.triggerHostEvent(HostEvent.Pin, { newVizName: 'Viz' });

            expect(result).toMatchObject({ pinboardId: 'lb1', liveboardId: 'lb1' });
        });

        it('triggerHostEvent GetAnswerSession returns session', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(mockKeys())
                .mockResolvedValueOnce([{ value: { session: 's1' } }]);

            const result = await client.triggerHostEvent(HostEvent.GetAnswerSession, {});

            expect(result).toEqual({ session: 's1' });
        });

        it('triggerHostEvent unmapped event uses fallback', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger.mockResolvedValue({ data: 'legacy' });

            const result = await client.triggerHostEvent('unknownEvent' as HostEvent, {});

            expect(mockProcessTrigger).toHaveBeenCalledWith(expect.anything(), 'unknownEvent', mockThoughtSpotHost, {}, undefined);
            expect(result).toEqual({ data: 'legacy' });
        });

        it('hostEventFallback delegates to processTrigger', async () => {
            const { client, mockIframe } = createHostEventClient();
            mockProcessTrigger.mockResolvedValue({ ok: true });

            const result = await client.hostEventFallback(HostEvent.Save, { x: 1 });

            expect(mockProcessTrigger).toHaveBeenCalledWith(mockIframe, HostEvent.Save, mockThoughtSpotHost, { x: 1 }, undefined);
            expect(result).toEqual({ ok: true });
        });
    });

    describe('availablePassthroughKeysCache reuse', () => {
        const allKeys = () => [{ value: { keys: Object.values(UIPassthroughEvent) } }];

        it('GetFilters: second call reuses cache — GetAvailableUIPassthroughs called only once', async () => {
            const { client } = createHostEventClient();
            const filterResponse = [{ value: { liveboardFilters: [] as any[], runtimeFilters: [] as any[] } }];
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce(filterResponse)
                .mockResolvedValueOnce(filterResponse);

            await client.triggerHostEvent(HostEvent.GetFilters, {});
            await client.triggerHostEvent(HostEvent.GetFilters, {});

            // 3 calls total: 1 GetAvailableUIPassthroughs + 2 GetFilters
            expect(mockProcessTrigger).toHaveBeenCalledTimes(3);
            expect(mockProcessTrigger).not.toHaveBeenNthCalledWith(
                3,
                expect.anything(),
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                expect.objectContaining({ type: UIPassthroughEvent.GetAvailableUIPassthroughs }),
                undefined,
            );
        });

        it('GetTabs: second call reuses cache — GetAvailableUIPassthroughs called only once', async () => {
            const { client } = createHostEventClient();
            const tabResponse = [{ value: { orderedTabIds: [] as any[], numberOfTabs: 0, Tabs: [] as any[] } }];
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce(tabResponse)
                .mockResolvedValueOnce(tabResponse);

            await client.triggerHostEvent(HostEvent.GetTabs, {});
            await client.triggerHostEvent(HostEvent.GetTabs, {});

            expect(mockProcessTrigger).toHaveBeenCalledTimes(3);
        });

        it('GetParameters: second call reuses cache — GetAvailableUIPassthroughs called only once', async () => {
            const { client } = createHostEventClient();
            const paramResponse = [{ value: { parameters: [] as any[] } }];
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce(paramResponse)
                .mockResolvedValueOnce(paramResponse);

            await client.triggerHostEvent(HostEvent.GetParameters, {});
            await client.triggerHostEvent(HostEvent.GetParameters, {});

            expect(mockProcessTrigger).toHaveBeenCalledTimes(3);
        });

        it('GetAnswerSession: second call reuses cache — GetAvailableUIPassthroughs called only once', async () => {
            const { client } = createHostEventClient();
            const sessionResponse = [{ value: { session: 's1' } }];
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce(sessionResponse)
                .mockResolvedValueOnce(sessionResponse);

            await client.triggerHostEvent(HostEvent.GetAnswerSession, {});
            await client.triggerHostEvent(HostEvent.GetAnswerSession, {});

            expect(mockProcessTrigger).toHaveBeenCalledTimes(3);
        });

        it('UIPassthrough direct trigger does not populate the cache', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger.mockResolvedValue([{ value: { result: 'ok' } }]);

            await client.triggerHostEvent(HostEvent.UIPassthrough, {});
            // Cache not populated — next GetFilters call must still fetch keys
            mockProcessTrigger.mockResolvedValueOnce(allKeys());
            mockProcessTrigger.mockResolvedValueOnce([{ value: { liveboardFilters: [], runtimeFilters: [] as any[] } }]);
            await client.triggerHostEvent(HostEvent.GetFilters, {});

            // UIPassthrough call + GetAvailableUIPassthroughs + GetFilters = 3
            expect(mockProcessTrigger).toHaveBeenCalledTimes(3);
        });

        it('GetAnswerSession: catch in getAvailableUIPassthroughKeys does not cache, so next call retries GetAvailableUIPassthroughs', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger.mockReset();

            // Flow per triggerHostEvent call when GetAvailableUIPassthroughs rejects:
            //   1. getAvailableUIPassthroughKeys → processTrigger(UIPassthrough, GetAvailableUIPassthroughs) → rejects → returns []
            //   2. keys=[] so getDataWithPassthroughFallback is called →
            //      triggerUIPassthroughApi(GetAnswerSession) → processTrigger(UIPassthrough) → null → hostEventFallback called
            //   3. hostEventFallback → processTrigger(GetAnswerSession) → legacy result

            // First triggerHostEvent: 3 calls
            mockProcessTrigger.mockRejectedValueOnce(new Error('network error')); // call 1
            mockProcessTrigger.mockResolvedValueOnce(null);                       // call 2
            mockProcessTrigger.mockResolvedValueOnce({ session: 'leg1' });        // call 3

            await client.triggerHostEvent(HostEvent.GetAnswerSession, { vizId: '1' });

            // Second triggerHostEvent: cache was NOT set, so GetAvailableUIPassthroughs is retried: 3 more calls
            mockProcessTrigger.mockRejectedValueOnce(new Error('network error')); // call 4
            mockProcessTrigger.mockResolvedValueOnce(null);                       // call 5
            mockProcessTrigger.mockResolvedValueOnce({ session: 'leg2' });        // call 6

            await client.triggerHostEvent(HostEvent.GetAnswerSession, { vizId: '2' });

            // 6 total calls: GetAvailableUIPassthroughs was called TWICE (cache not set after catch)
            expect(mockProcessTrigger).toHaveBeenCalledTimes(6);
            const availableCallsCount = mockProcessTrigger.mock.calls.filter(
                (call) => call[3]?.type === UIPassthroughEvent.GetAvailableUIPassthroughs,
            ).length;
            expect(availableCallsCount).toBe(2);
        });
    });

    describe('GetTML edge cases', () => {
        const allKeys = () => [{ value: { keys: Object.values(UIPassthroughEvent) } }];

        it('includeNonExecutedSearchTokens flag is forwarded in UIPassthrough parameters', async () => {
            const { client, mockIframe } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce([{ value: { tml: 'data' } }]);

            await client.triggerHostEvent(HostEvent.GetTML, { includeNonExecutedSearchTokens: true } as any);

            expect(mockProcessTrigger).toHaveBeenNthCalledWith(
                2,
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                {
                    type: UIPassthroughEvent.GetTML,
                    parameters: { includeNonExecutedSearchTokens: true },
                },
                undefined,
            );
        });

        it('value.error (singular) throws — distinct from value.errors', async () => {
            const { client } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce([{ value: { error: 'TML fetch failed' } }]);

            await expect(client.triggerHostEvent(HostEvent.GetTML, {}))
                .rejects.toThrow('TML fetch failed');
        });

        it('GetTML key absent from non-empty keys array falls back to legacy hostEventFallback', async () => {
            const { client, mockIframe } = createHostEventClient();
            // Return keys that do NOT include GetTML
            mockProcessTrigger
                .mockResolvedValueOnce([{ value: { keys: [UIPassthroughEvent.GetFilters] } }])
                .mockResolvedValueOnce({ answer: { search_query: 'revenue' } });

            const result = await client.triggerHostEvent(HostEvent.GetTML, {});

            expect(mockProcessTrigger).toHaveBeenNthCalledWith(
                2,
                mockIframe,
                HostEvent.GetTML,
                mockThoughtSpotHost,
                {},
                undefined,
            );
            expect(result).toEqual({ answer: { search_query: 'revenue' } });
        });
    });

    describe('SaveAnswer key-presence edge cases', () => {
        const allKeys = () => [{ value: { keys: Object.values(UIPassthroughEvent) } }];
        const saveResponse = [{
            value: {
                saveResponse: {
                    data: {
                        Answer__save: {
                            answer: { id: 'ans123' },
                        },
                    },
                },
            },
            refId: 'viz1',
        }];

        it('name+description both empty string route through passthrough, not Save fallback', async () => {
            const { client, mockIframe } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce(saveResponse);

            await client.triggerHostEvent(HostEvent.SaveAnswer, { name: '', description: '' } as any);

            expect(mockProcessTrigger).toHaveBeenNthCalledWith(
                2,
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                { type: UIPassthroughEvent.SaveAnswer, parameters: { name: '', description: '' } },
                undefined,
            );
        });

        it('description: undefined (key present) routes through passthrough, not Save fallback', async () => {
            const { client, mockIframe } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce(saveResponse);

            await client.triggerHostEvent(HostEvent.SaveAnswer, { name: 'Test', description: undefined } as any);

            expect(mockProcessTrigger).toHaveBeenNthCalledWith(
                2,
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                { type: UIPassthroughEvent.SaveAnswer, parameters: { name: 'Test', description: undefined } },
                undefined,
            );
        });

        it('name key absent falls back to HostEvent.Save', async () => {
            const { client, mockIframe } = createHostEventClient();
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce([saveResponse[0].value]);

            await client.triggerHostEvent(HostEvent.SaveAnswer, { description: 'desc only' } as any);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.Save,
                mockThoughtSpotHost,
                { description: 'desc only' },
                undefined,
            );
        });

        it('answerId is undefined when saveResponse.data.Answer__save.answer.id is missing', async () => {
            const { client } = createHostEventClient();
            const noIdSaveResponse = [{
                value: {
                    saveResponse: {
                        data: {
                            Answer__save: {
                                answer: {},
                            },
                        },
                    },
                },
                refId: 'viz1',
            }];
            mockProcessTrigger
                .mockResolvedValueOnce(allKeys())
                .mockResolvedValueOnce(noIdSaveResponse);

            const result = await client.triggerHostEvent(HostEvent.SaveAnswer, { name: 'Test', description: 'Desc' } as any);

            expect(result.answerId).toBeUndefined();
        });
    });
});
