import { getIFrameEl } from '../../test/test-utils';
import { HostEvent } from '../../types';
import { processTrigger } from '../../utils/processTrigger';
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
    const mockIframe = getIFrameEl();
    const mockThoughtSpotHost = 'http://localhost';
    const client = new HostEventClient(mockThoughtSpotHost);
    return { client, mockIframe, mockThoughtSpotHost };
};

describe('HostEventClient', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executeUIPassthroughApi', () => {
        it('should call processTrigger with correct parameters and return response', async () => {
            const { client, mockIframe, mockThoughtSpotHost } = createHostEventClient();

            const apiName = UIPassthroughEvent.addVizToPinboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse = Promise.resolve([
                { value: { pinboardId: 'testPinboard', tabId: 'testTab', vizId: 'testVizId' } },
            ]);

            mockProcessTrigger.mockResolvedValue(triggerResponse);

            const result = await client.executeUIPassthroughApi(getIFrameEl(), apiName, parameters);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UIPassthrough,
                mockThoughtSpotHost,
                {
                    type: apiName,
                    parameters,
                },
            );
            expect(result).toEqual(await triggerResponse);
        });
    });

    describe('handleUIPassthroughForHostEvent', () => {
        it('should return the value from the first valid response', async () => {
            const { client } = createHostEventClient();
            const apiName = UIPassthroughEvent.addVizToPinboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse = Promise.resolve([
                { value: { pinboardId: 'testPinboard', tabId: 'testTab', vizId: 'testVizId' } },
            ]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            const result = await client.handleUIPassthroughForHostEvent(getIFrameEl(),
                apiName, parameters);

            expect(result).toEqual({
                pinboardId: 'testPinboard',
                tabId: 'testTab',
                vizId: 'testVizId',
            });
        });

        it('should throw an error if no valid response is found', async () => {
            const { client } = createHostEventClient();
            const apiName = UIPassthroughEvent.addVizToPinboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse: UIPassthroughArrayResponse<typeof apiName> = Promise.resolve([]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleUIPassthroughForHostEvent(getIFrameEl(), apiName, parameters))
                .rejects.toEqual({ error: 'No answer found.' });
        });

        it('should throw an error if no valid response is found for vizId', async () => {
            const { client } = createHostEventClient();
            const apiName = UIPassthroughEvent.addVizToPinboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
                vizId: 'testVizId',
            };
            const triggerResponse: UIPassthroughArrayResponse<typeof apiName> = Promise.resolve([]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleUIPassthroughForHostEvent(getIFrameEl(), apiName, parameters))
                .rejects.toEqual({ error: 'No answer found for vizId: testVizId.' });
        });

        it('should throw an error if the response contains errors', async () => {
            const { client } = createHostEventClient();
            const apiName = UIPassthroughEvent.addVizToPinboard;
            const parameters: UIPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse: UIPassthroughArrayResponse<typeof apiName> = Promise.resolve([
                { error: 'Some error' },
            ]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleUIPassthroughForHostEvent(getIFrameEl(), apiName, parameters))
                .rejects.toEqual({ error: 'Some error' });
        });
    });

    describe('executeHostEvent', () => {
        it('should call handleUIPassthroughForHostEvent for Pin event', async () => {
            const { client } = createHostEventClient();
            const hostEvent = HostEvent.Pin;
            const payload: HostEventRequest<typeof hostEvent> = {
                newVizName: 'testViz',
            };
            const mockResponse = {
                value: {
                    pinboardId: 'testPinboard',
                    tabId: 'testTab',
                    vizId: 'testVizId',
                },
            };

            mockProcessTrigger.mockResolvedValue([mockResponse]);

            const result = await client.executeHostEvent(getIFrameEl(), hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                getIFrameEl(),
                HostEvent.UIPassthrough,
                'http://localhost',
                { parameters: payload, type: UIPassthroughEvent.addVizToPinboard },
            );
            expect(result).toEqual(mockResponse.value);
        });

        it('should call handleUIPassthroughForHostEvent for SaveAnswer event', async () => {
            const { client } = createHostEventClient();
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
            const result = await client.executeHostEvent(getIFrameEl(), hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                null,
                'UIPassthrough',
                'http://localhost',
                {
                    parameters: payload,
                    type: 'saveAnswer',
                },
            );
            expect(result).toEqual({ answerId: 'newAnswer', ...mockResponse[0].value });
        });

        it('should call hostEventFallback for unmapped events', async () => {
            const { client } = createHostEventClient();
            const hostEvent = 'testEvent' as HostEvent;
            const payload = { data: 'testData' };
            const mockResponse = { fallbackResponse: 'data' };
            jest.spyOn(client, 'hostEventFallback').mockResolvedValue(mockResponse);

            const result = await client.executeHostEvent(getIFrameEl(), hostEvent, payload);

            expect(client.hostEventFallback).toHaveBeenCalledWith(null, hostEvent, payload);
            expect(result).toEqual(mockResponse);
        });

        it('should call fallback  for Pin event', async () => {
            const { client } = createHostEventClient();
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

            const result = await client.executeHostEvent(getIFrameEl(), hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                getIFrameEl(),
                HostEvent.Pin,
                'http://localhost',
                {},
            );
            expect(result).toEqual([mockResponse]);
        });

        it('should call fallback for SaveAnswer event', async () => {
            const { client } = createHostEventClient();
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

            const result = await client.executeHostEvent(getIFrameEl(), hostEvent, payload);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                getIFrameEl(),
                HostEvent.Save,
                'http://localhost',
                {},
            );
            expect(result).toEqual([mockResponse]);
        });
    });
});
