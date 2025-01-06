import { getIFrameEl } from '../../test/test-utils';
import { HostEvent } from '../../types';
import { processTrigger } from '../../utils/processTrigger';
import {
    UiPassthroughEvent,
    UiPassthroughRequest,
    UiPassthroughArrayResponse,
    HostEventRequest,
} from './contracts';
import { HostEventClient } from './host-event-client';

jest.mock('../../utils/processTrigger');

const mockProcessTrigger = processTrigger as jest.Mock;

const createHostEventClient = () => {
    const mockIframe = getIFrameEl();
    const mockThoughtSpotHost = 'http://localhost';
    const client = new HostEventClient(mockIframe, mockThoughtSpotHost);
    return { client, mockIframe, mockThoughtSpotHost };
};

describe('HostEventClient', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executeUiPassthroughApi', () => {
        it('should call processTrigger with correct parameters and return response', async () => {
            const { client, mockIframe, mockThoughtSpotHost } = createHostEventClient();

            const apiName = UiPassthroughEvent.addVizToPinboard;
            const parameters: UiPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse = Promise.resolve([
                { value: { pinboardId: 'testPinboard', tabId: 'testTab', vizId: 'testVizId' } },
            ]);

            mockProcessTrigger.mockResolvedValue(triggerResponse);

            const result = await client.executeUiPassthroughApi(getIFrameEl(), apiName, parameters);

            expect(mockProcessTrigger).toHaveBeenCalledWith(
                mockIframe,
                HostEvent.UiPassthrough,
                mockThoughtSpotHost,
                {
                    type: apiName,
                    parameters,
                },
            );
            expect(result).toEqual(await triggerResponse);
        });
    });

    describe('handleUiPassthroughForHostEvent', () => {
        it('should return the value from the first valid response', async () => {
            const { client } = createHostEventClient();
            const apiName = UiPassthroughEvent.addVizToPinboard;
            const parameters: UiPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse = Promise.resolve([
                { value: { pinboardId: 'testPinboard', tabId: 'testTab', vizId: 'testVizId' } },
            ]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            const result = await client.handleUiPassthroughForHostEvent(getIFrameEl(),
                apiName, parameters);

            expect(result).toEqual({
                pinboardId: 'testPinboard',
                tabId: 'testTab',
                vizId: 'testVizId',
            });
        });

        it('should throw an error if no valid response is found', async () => {
            const { client } = createHostEventClient();
            const apiName = UiPassthroughEvent.addVizToPinboard;
            const parameters: UiPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse: UiPassthroughArrayResponse<typeof apiName> = Promise.resolve([]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleUiPassthroughForHostEvent(getIFrameEl(), apiName, parameters))
                .rejects.toEqual({ error: 'No answer found.' });
        });

        it('should throw an error if no valid response is found for vizId', async () => {
            const { client } = createHostEventClient();
            const apiName = UiPassthroughEvent.addVizToPinboard;
            const parameters: UiPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
                vizId: 'testVizId',
            };
            const triggerResponse: UiPassthroughArrayResponse<typeof apiName> = Promise.resolve([]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleUiPassthroughForHostEvent(getIFrameEl(), apiName, parameters))
                .rejects.toEqual({ error: 'No answer found for vizId: testVizId.' });
        });

        it('should throw an error if the response contains errors', async () => {
            const { client } = createHostEventClient();
            const apiName = UiPassthroughEvent.addVizToPinboard;
            const parameters: UiPassthroughRequest<typeof apiName> = {
                newVizName: 'testViz',
            };
            const triggerResponse: UiPassthroughArrayResponse<typeof apiName> = Promise.resolve([
                { error: 'Some error' },
            ]);
            mockProcessTrigger.mockResolvedValue(triggerResponse);

            await expect(client.handleUiPassthroughForHostEvent(getIFrameEl(), apiName, parameters))
                .rejects.toEqual({ error: 'Some error' });
        });
    });

    describe('executeHostEvent', () => {
        it('should call handleUiPassthroughForHostEvent for Pin event', async () => {
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
                HostEvent.UiPassthrough,
                'http://localhost',
                { parameters: payload, type: UiPassthroughEvent.addVizToPinboard },
            );
            expect(result).toEqual(mockResponse.value);
        });

        it('should call handleUiPassthroughForHostEvent for SaveAnswer event', async () => {
            const { client } = createHostEventClient();
            const hostEvent = HostEvent.SaveAnswer;
            const payload: HostEventRequest<typeof hostEvent> = {
                name: 'Test Answer',
                description: 'Test Description',
                vizId: 'testVizId',
            };
            const mockResponse = { answerId: 'testAnswerId' };
            jest.spyOn(client, 'handleUiPassthroughForHostEvent').mockResolvedValue(mockResponse);

            const result = await client.executeHostEvent(getIFrameEl(), hostEvent, payload);

            expect(client.handleUiPassthroughForHostEvent).toHaveBeenCalledWith(
                null,
                UiPassthroughEvent.saveAnswer,
                payload,
            );
            expect(result).toEqual(mockResponse);
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
