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

            mockProcessTrigger.mockResolvedValue([mockResponse]);

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
            mockProcessTrigger.mockResolvedValue(mockResponse);
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

            mockProcessTrigger.mockResolvedValue([mockResponse]);

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

            mockProcessTrigger.mockResolvedValue([mockResponse]);

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
            mockProcessTrigger.mockResolvedValue(mockResponse);
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
            mockProcessTrigger.mockResolvedValue(mockResponse);
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
});
