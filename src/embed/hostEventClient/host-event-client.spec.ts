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
                vizId: 'viz-456',
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

        it('should pass context to DrillDown event', async () => {
            const { client, mockIframe } = createHostEventClient();
            const payload = { vizId: 'viz-2' } as any;
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
                .mockResolvedValueOnce([{ value: { v2Content: 'exportData' } }]);

            const result = await client.triggerHostEvent(HostEvent.getExportRequestForCurrentPinboard, {});

            expect(result).toEqual({ v2Content: 'exportData' });
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
});
