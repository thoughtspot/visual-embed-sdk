import { FullHeightController, FullHeightEmbedHost } from './full-height';
import {
    EmbedEvent, FullHeightViewConfig, HostEvent, MessageCallback, Param,
} from './types';
import { logger } from './utils/logger';
import { DEFAULT_LAZY_LOADING_MARGIN } from './config';

describe('FullHeightController', () => {
    let iFrame: HTMLIFrameElement;
    let host: FullHeightEmbedHost;
    let handlers: Map<EmbedEvent, MessageCallback>;

    const createControllerFor = (viewConfig: FullHeightViewConfig) => createController(viewConfig);

    const createController = (viewConfig: FullHeightViewConfig) => {
        handlers = new Map();
        iFrame = document.createElement('iframe');
        document.body.appendChild(iFrame);
        host = {
            getIframe: () => iFrame,
            setFrameHeight: jest.fn(),
            on: (eventType, callback) => {
                handlers.set(eventType, callback);
            },
            trigger: jest.fn(),
        };
        const controller = new FullHeightController(viewConfig, host);
        controller.registerEventHandlers();
        return controller;
    };

    afterEach(() => {
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    describe('registerEventHandlers', () => {
        it('registers every full-height handler when fullHeight is enabled', () => {
            createController({ fullHeight: true });
            expect([...handlers.keys()]).toEqual([
                EmbedEvent.RouteChange,
                EmbedEvent.EmbedHeight,
                EmbedEvent.EmbedIframeCenter,
                EmbedEvent.RequestVisibleEmbedCoordinates,
            ]);
        });

        it('registers nothing when fullHeight is not enabled', () => {
            createController({});
            expect(handlers.size).toBe(0);
        });
    });

    describe('lazy loading defaults', () => {
        it('turns lazy loading on for a full-height embed', () => {
            const viewConfig: FullHeightViewConfig = { fullHeight: true };
            createControllerFor(viewConfig);
            expect(viewConfig.lazyLoadingForFullHeight).toBe(true);
            expect(viewConfig.enableScrollableContainerLazyLoading).toBe(true);
            expect(viewConfig.lazyLoadingMargin).toBe(DEFAULT_LAZY_LOADING_MARGIN);
        });

        it('leaves an explicit opt-out alone', () => {
            const viewConfig: FullHeightViewConfig = {
                fullHeight: true,
                lazyLoadingForFullHeight: false,
                enableScrollableContainerLazyLoading: false,
                lazyLoadingMargin: '0px',
            };
            createControllerFor(viewConfig);
            expect(viewConfig.lazyLoadingForFullHeight).toBe(false);
            expect(viewConfig.enableScrollableContainerLazyLoading).toBe(false);
            expect(viewConfig.lazyLoadingMargin).toBe('0px');
        });

        it('defaults nothing when fullHeight is not enabled', () => {
            const viewConfig: FullHeightViewConfig = {};
            createControllerFor(viewConfig);
            expect(viewConfig.lazyLoadingForFullHeight).toBeUndefined();
            expect(viewConfig.enableScrollableContainerLazyLoading).toBeUndefined();
            expect(viewConfig.lazyLoadingMargin).toBeUndefined();
        });
    });

    describe('minimumHeight', () => {
        it('falls back to 500 when neither height is configured', () => {
            expect(createController({ fullHeight: true }).minimumHeight).toBe(500);
        });

        it('prefers minimumHeight over the deprecated defaultHeight', () => {
            const controller = createController({
                fullHeight: true,
                defaultHeight: 700,
                minimumHeight: 800,
            });
            expect(controller.minimumHeight).toBe(800);
        });

        it('honours the deprecated defaultHeight when minimumHeight is absent', () => {
            const controller = createController({ fullHeight: true, defaultHeight: 700 });
            expect(controller.minimumHeight).toBe(700);
        });
    });

    describe('addQueryParams', () => {
        it('adds no params when fullHeight is not enabled', () => {
            const params: any = {};
            createController({ lazyLoadingForFullHeight: true }).addQueryParams(params);
            expect(params).toEqual({});
        });

        it('adds only the full height param when lazy loading is off', () => {
            const params: any = {};
            createController({
                fullHeight: true,
                lazyLoadingForFullHeight: false,
            }).addQueryParams(params);
            expect(params).toEqual({ [Param.fullHeight]: true });
        });

        it('adds the lazy loading params, including a valid margin', () => {
            const params: any = {};
            createController({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '100px 0px',
            }).addQueryParams(params);
            expect(params).toEqual({
                [Param.fullHeight]: true,
                [Param.IsLazyLoadingForEmbedEnabled]: true,
                [Param.RootMarginForLazyLoad]: '100px 0px',
            });
        });

        it('drops an invalid lazy loading margin', () => {
            // An invalid margin is reported to the developer, not sent on.
            const loggerError = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const params: any = {};
            createController({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: 'not-a-margin',
            }).addQueryParams(params);
            expect(params[Param.RootMarginForLazyLoad]).toBeUndefined();
            expect(loggerError).toHaveBeenCalled();
        });
    });

    describe('EmbedHeight', () => {
        it('never sizes the frame below the configured minimum', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.EmbedHeight)({ data: 300 } as any);
            expect(host.setFrameHeight).toHaveBeenCalledWith(800);
        });

        it('uses the height reported by the app when it clears the minimum', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.EmbedHeight)({ data: 1200 } as any);
            expect(host.setFrameHeight).toHaveBeenCalledWith(1200);
        });

        it('pushes the visible coordinates only when lazy loading is on', () => {
            createController({ fullHeight: true, lazyLoadingForFullHeight: false });
            handlers.get(EmbedEvent.EmbedHeight)({ data: 1200 } as any);
            expect(host.trigger).not.toHaveBeenCalled();

            createController({ fullHeight: true, lazyLoadingForFullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)({ data: 1200 } as any);
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );
        });
    });

    describe('RouteChange', () => {
        const routeChange = (currentPath: string) => ({ data: { currentPath } } as any);

        it('leaves the height alone while navigating within a Liveboard', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/embed/viz/abc'));
            expect(host.setFrameHeight).not.toHaveBeenCalled();
        });

        it('resets to frameParams.height when leaving the Liveboard routes', () => {
            createController({ fullHeight: true, frameParams: { height: 640 } });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/some/other/path/'));
            expect(host.setFrameHeight).toHaveBeenCalledWith(640);
        });

        it('resets to the minimum height when frameParams has no height', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/some/other/path/'));
            expect(host.setFrameHeight).toHaveBeenCalledWith(800);
        });
    });

    describe('coordinate requests', () => {
        it('responds to RequestVisibleEmbedCoordinates with the visible region', () => {
            createController({ fullHeight: true });
            const responder = jest.fn();
            handlers.get(EmbedEvent.RequestVisibleEmbedCoordinates)({} as any, responder);
            expect(responder).toHaveBeenCalledWith({
                type: EmbedEvent.RequestVisibleEmbedCoordinates,
                data: expect.objectContaining({ top: expect.any(Number) }),
            });
        });

        it('responds to EmbedIframeCenter with the center of the visible region', () => {
            createController({ fullHeight: true });
            const responder = jest.fn();
            handlers.get(EmbedEvent.EmbedIframeCenter)({} as any, responder);
            expect(responder).toHaveBeenCalledWith({
                type: EmbedEvent.EmbedIframeCenter,
                data: expect.objectContaining({ iframeCenter: expect.any(Number) }),
            });
        });
    });

    describe('lazy load listeners', () => {
        it('attaches window listeners on render and removes them on destroy', () => {
            const add = jest.spyOn(window, 'addEventListener');
            const remove = jest.spyOn(window, 'removeEventListener');
            const controller = createController({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
            });

            controller.onRender();
            expect(add).toHaveBeenCalledWith('resize', expect.any(Function));
            expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), true);

            controller.destroy();
            expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
            expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), true);
        });

        it('attaches nothing when lazy loading is off', () => {
            const add = jest.spyOn(window, 'addEventListener');
            createController({
                fullHeight: true,
                lazyLoadingForFullHeight: false,
            }).onRender();
            expect(add).not.toHaveBeenCalled();
        });

        it('observes the scrollable ancestors when container lazy loading is on', () => {
            const observe = jest.fn();
            const disconnect = jest.fn();
            (window as any).ResizeObserver = jest.fn(() => ({ observe, disconnect }));

            const scrollContainer = document.createElement('div');
            scrollContainer.style.overflow = 'auto';
            const addContainerListener = jest.spyOn(scrollContainer, 'addEventListener');
            const removeContainerListener = jest.spyOn(scrollContainer, 'removeEventListener');

            const controller = createController({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                enableScrollableContainerLazyLoading: true,
            });
            scrollContainer.appendChild(iFrame);
            document.body.appendChild(scrollContainer);

            controller.onRender();
            expect(addContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(observe).toHaveBeenCalled();

            controller.destroy();
            expect(removeContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(disconnect).toHaveBeenCalled();
        });
    });
});
