import { getViewPropsAndListeners } from './util';
import { EmbedEvent, MessageCallback } from '../types';

describe('React util functions', () => {
    describe('getViewPropsAndListeners', () => {
        test('should return empty viewConfig and listeners for empty props', () => {
            const props = {};
            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({});
            expect(result.listeners).toEqual({});
        });

        test('should separate view config properties from props', () => {
            const props = {
                frameParams: { width: 100, height: 200 },
                showLiveboardTitle: true,
                liveboardId: 'test-liveboard-id',
                vizId: 'test-viz-id',
                className: 'test-class',
                style: { color: 'red' },
            };

            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({
                frameParams: { width: 100, height: 200 },
                showLiveboardTitle: true,
                liveboardId: 'test-liveboard-id',
                vizId: 'test-viz-id',
                className: 'test-class',
                style: { color: 'red' },
            });
            expect(result.listeners).toEqual({});
        });

        test('should separate event handlers from props', () => {
            const onInit: MessageCallback = jest.fn();
            const onLoad: MessageCallback = jest.fn();
            const onData: MessageCallback = jest.fn();

            const props = {
                onInit,
                onLoad,
                onData,
            };

            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({});
            expect(result.listeners).toEqual({
                [EmbedEvent.Init]: onInit,
                [EmbedEvent.Load]: onLoad,
                [EmbedEvent.Data]: onData,
            });
        });

        test('should handle both view config and event handlers', () => {
            const onInit: MessageCallback = jest.fn();
            const onAuthInit: MessageCallback = jest.fn();
            const onQueryChanged: MessageCallback = jest.fn();

            const props = {
                liveboardId: 'test-liveboard-id',
                showLiveboardTitle: false,
                frameParams: { height: 500 },
                onInit,
                onAuthInit,
                onQueryChanged,
                className: 'embed-container',
            };

            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({
                liveboardId: 'test-liveboard-id',
                showLiveboardTitle: false,
                frameParams: { height: 500 },
                className: 'embed-container',
            });
            expect(result.listeners).toEqual({
                [EmbedEvent.Init]: onInit,
                [EmbedEvent.AuthInit]: onAuthInit,
                [EmbedEvent.QueryChanged]: onQueryChanged,
            });
        });
    });
});
