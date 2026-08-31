import { FullHeightController, FullHeightEmbedHost } from './full-height';
import {
    BaseViewConfig,
    EmbedEvent,
    FullHeightViewConfig,
    HostEvent,
    MessageCallback,
    Param,
} from './types';

type ControllerConfig = FullHeightViewConfig & Pick<BaseViewConfig, 'frameParams'>;
import { logger } from './utils/logger';
import { DEFAULT_LAZY_LOADING_MARGIN } from './config';

describe('FullHeightController', () => {
    let iFrame: HTMLIFrameElement;
    let host: FullHeightEmbedHost;
    let handlers: Map<EmbedEvent, MessageCallback>;

    const originalResizeObserver = (window as any).ResizeObserver;

    /**
     * A rect that only carries the edges the visibility maths reads.
     */
    const rectOf = (top: number, bottom: number, left = 0, right = 500) =>
        ({
            top,
            bottom,
            left,
            right,
            width: right - left,
            height: bottom - top,
        }) as DOMRect;

    const createControllerFor = (viewConfig: ControllerConfig) => createController(viewConfig);

    const createController = (
        viewConfig: ControllerConfig,
        options: { iframe?: HTMLIFrameElement } = {},
    ) => {
        handlers = new Map();
        iFrame = document.createElement('iframe');
        document.body.appendChild(iFrame);
        const hostIframe = 'iframe' in options ? options.iframe : iFrame;
        host = {
            getIframe: () => hostIframe,
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
        (window as any).ResizeObserver = originalResizeObserver;
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

        it('registers nothing when fullHeight is explicitly false', () => {
            createController({ fullHeight: false, lazyLoadingForFullHeight: true });
            expect(handlers.size).toBe(0);
        });
    });

    describe('lazy loading defaults', () => {
        it('turns lazy loading on for a full-height embed', () => {
            const viewConfig: ControllerConfig = { fullHeight: true };
            createControllerFor(viewConfig);
            expect(viewConfig.lazyLoadingForFullHeight).toBe(true);
            expect(viewConfig.enableScrollableContainerLazyLoading).toBe(true);
            expect(viewConfig.lazyLoadingMargin).toBe(DEFAULT_LAZY_LOADING_MARGIN);
        });

        it('leaves an explicit opt-out alone', () => {
            const viewConfig: ControllerConfig = {
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

        it('defaults only the values the host app left unset', () => {
            const viewConfig: ControllerConfig = {
                fullHeight: true,
                enableScrollableContainerLazyLoading: false,
                lazyLoadingMargin: '50px',
            };
            createControllerFor(viewConfig);
            expect(viewConfig.lazyLoadingForFullHeight).toBe(true);
            expect(viewConfig.enableScrollableContainerLazyLoading).toBe(false);
            expect(viewConfig.lazyLoadingMargin).toBe('50px');
        });

        it('defaults nothing when fullHeight is not enabled', () => {
            const viewConfig: ControllerConfig = {};
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

        it('treats a zero minimumHeight as unset and honours defaultHeight', () => {
            const controller = createController({
                fullHeight: true,
                minimumHeight: 0,
                defaultHeight: 700,
            });
            expect(controller.minimumHeight).toBe(700);
        });

        it('falls back to 500 when both heights are zero', () => {
            const controller = createController({
                fullHeight: true,
                minimumHeight: 0,
                defaultHeight: 0,
            });
            expect(controller.minimumHeight).toBe(500);
        });

        it('is available even when fullHeight is off', () => {
            expect(createController({ minimumHeight: 800 }).minimumHeight).toBe(800);
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

        it('adds the default margin when the host app does not set one', () => {
            const params: any = {};
            createController({ fullHeight: true }).addQueryParams(params);
            expect(params).toEqual({
                [Param.fullHeight]: true,
                [Param.IsLazyLoadingForEmbedEnabled]: true,
                [Param.RootMarginForLazyLoad]: DEFAULT_LAZY_LOADING_MARGIN,
            });
        });

        it('keeps the params the embed has already collected', () => {
            const params: any = { existing: 'value' };
            createController({ fullHeight: true }).addQueryParams(params);
            expect(params.existing).toBe('value');
        });

        it('drops an invalid lazy loading margin', () => {
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

        it('drops an empty lazy loading margin but keeps the other params', () => {
            const loggerError = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const params: any = {};
            createController({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '',
            }).addQueryParams(params);
            expect(params).toEqual({
                [Param.fullHeight]: true,
                [Param.IsLazyLoadingForEmbedEnabled]: true,
            });
            expect(loggerError).toHaveBeenCalled();
        });

        it('accepts a unitless zero margin', () => {
            const params: any = {};
            createController({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '0',
            }).addQueryParams(params);
            expect(params[Param.RootMarginForLazyLoad]).toBe('0');
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

        it('never sizes the frame below the 500 default floor', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)({ data: 100 } as any);
            expect(host.setFrameHeight).toHaveBeenCalledWith(500);
        });

        it('accepts a numeric height sent as a string', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)({ data: '1200' } as any);
            expect(host.setFrameHeight).toHaveBeenCalledWith(1200);
        });

        it('leaves the height alone when the app reports a non-numeric height', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)({ data: 'tall' } as any);
            expect(host.setFrameHeight).not.toHaveBeenCalled();
        });

        it('leaves the height alone when the payload carries no height', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)({} as any);
            expect(host.setFrameHeight).not.toHaveBeenCalled();
        });

        it('survives a missing payload', () => {
            createController({ fullHeight: true });
            expect(() => handlers.get(EmbedEvent.EmbedHeight)(undefined as any)).not.toThrow();
            expect(host.setFrameHeight).not.toHaveBeenCalled();
        });

        it('still pushes the visible coordinates for an unusable height', () => {
            createController({ fullHeight: true, lazyLoadingForFullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)({ data: 'tall' } as any);
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );
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

        it('pushes null coordinates when the iframe is not there yet', () => {
            createController({ fullHeight: true }, { iframe: null });
            handlers.get(EmbedEvent.EmbedHeight)({ data: 1200 } as any);
            expect(host.trigger).toHaveBeenCalledWith(HostEvent.VisibleEmbedCoordinates, null);
        });
    });

    describe('RouteChange', () => {
        const routeChange = (currentPath: string) => ({ data: { currentPath } }) as any;

        it('leaves the height alone while navigating within a Liveboard', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/embed/viz/abc'));
            expect(host.setFrameHeight).not.toHaveBeenCalled();
        });

        it.each([
            '/pinboard/abc',
            '/insights/pinboard/abc',
            '/schedules/abc',
            '/embed/viz/abc',
            '/embed/insights/viz/abc',
            '/liveboard/abc',
            '/insights/liveboard/abc',
            '/tsl-editor/PINBOARD_ANSWER_BOOK/abc',
            '/import-tsl/PINBOARD_ANSWER_BOOK/abc',
        ])('leaves the height alone on the Liveboard route %s', (currentPath) => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.RouteChange)(routeChange(currentPath));
            expect(host.setFrameHeight).not.toHaveBeenCalled();
        });

        it('resets to frameParams.height when leaving the Liveboard routes', () => {
            createController({ fullHeight: true, frameParams: { height: 640 } });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/some/other/path/'));
            expect(host.setFrameHeight).toHaveBeenCalledWith(640);
        });

        it('passes a non-numeric frameParams.height through unchanged', () => {
            createController({ fullHeight: true, frameParams: { height: '100%' } });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/some/other/path/'));
            expect(host.setFrameHeight).toHaveBeenCalledWith('100%');
        });

        it('resets to the minimum height when frameParams has no height', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/some/other/path/'));
            expect(host.setFrameHeight).toHaveBeenCalledWith(800);
        });

        it('resets when a Liveboard route only appears part way into the path', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/app/embed/viz/abc'));
            expect(host.setFrameHeight).toHaveBeenCalledWith(800);
        });

        it('leaves the height alone when the payload carries no path', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.RouteChange)({ data: {} } as any);
            expect(host.setFrameHeight).not.toHaveBeenCalled();
        });

        it('survives a missing payload', () => {
            createController({ fullHeight: true });
            expect(() => handlers.get(EmbedEvent.RouteChange)(undefined as any)).not.toThrow();
            expect(host.setFrameHeight).not.toHaveBeenCalled();
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

        it('logs the RequestVisibleEmbedCoordinates request', () => {
            const loggerInfo = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            createController({ fullHeight: true });
            const payload = { type: EmbedEvent.RequestVisibleEmbedCoordinates } as any;
            handlers.get(EmbedEvent.RequestVisibleEmbedCoordinates)(payload, jest.fn());
            expect(loggerInfo).toHaveBeenCalledWith(
                'Sending RequestVisibleEmbedCoordinates',
                payload,
            );
        });

        it('responds with null coordinates when the iframe is not there yet', () => {
            createController({ fullHeight: true }, { iframe: null });
            const responder = jest.fn();
            handlers.get(EmbedEvent.RequestVisibleEmbedCoordinates)({} as any, responder);
            expect(responder).toHaveBeenCalledWith({
                type: EmbedEvent.RequestVisibleEmbedCoordinates,
                data: null,
            });
        });

        it('stays silent on EmbedIframeCenter when the iframe is not there yet', () => {
            createController({ fullHeight: true }, { iframe: null });
            const responder = jest.fn();
            handlers.get(EmbedEvent.EmbedIframeCenter)({} as any, responder);
            expect(responder).not.toHaveBeenCalled();
        });

        it('survives an app that asks for coordinates without a responder', () => {
            createController({ fullHeight: true });
            expect(() => {
                handlers.get(EmbedEvent.RequestVisibleEmbedCoordinates)({} as any);
                handlers.get(EmbedEvent.EmbedIframeCenter)({} as any);
            }).not.toThrow();
        });

        it('clips the visible region to the containers when container lazy loading is on', () => {
            const clippingContainer = document.createElement('div');
            clippingContainer.style.overflow = 'hidden';
            const controller = createController({
                fullHeight: true,
                enableScrollableContainerLazyLoading: true,
            });
            clippingContainer.appendChild(iFrame);
            document.body.appendChild(clippingContainer);
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(-100, 400));
            jest.spyOn(clippingContainer, 'getBoundingClientRect').mockReturnValue(rectOf(50, 300));

            const responder = jest.fn();
            handlers.get(EmbedEvent.RequestVisibleEmbedCoordinates)({} as any, responder);
            expect(responder).toHaveBeenCalledWith({
                type: EmbedEvent.RequestVisibleEmbedCoordinates,
                data: {
                    top: 150,
                    height: 250,
                    left: 0,
                    width: 500,
                },
            });
            controller.destroy();
        });

        it('ignores the containers when container lazy loading is off', () => {
            const clippingContainer = document.createElement('div');
            clippingContainer.style.overflow = 'hidden';
            createController({
                fullHeight: true,
                enableScrollableContainerLazyLoading: false,
            });
            clippingContainer.appendChild(iFrame);
            document.body.appendChild(clippingContainer);
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(-100, 400));
            jest.spyOn(clippingContainer, 'getBoundingClientRect').mockReturnValue(rectOf(50, 300));

            const responder = jest.fn();
            handlers.get(EmbedEvent.RequestVisibleEmbedCoordinates)({} as any, responder);
            expect(responder).toHaveBeenCalledWith({
                type: EmbedEvent.RequestVisibleEmbedCoordinates,
                data: {
                    top: 100,
                    height: 400,
                    left: 0,
                    width: 500,
                },
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

        it('attaches nothing when fullHeight is off', () => {
            const add = jest.spyOn(window, 'addEventListener');
            createController({ lazyLoadingForFullHeight: true }).onRender();
            expect(add).not.toHaveBeenCalled();
        });

        it('attaches nothing when the iframe has not rendered yet', () => {
            const add = jest.spyOn(window, 'addEventListener');
            createController({ fullHeight: true }, { iframe: null }).onRender();
            expect(add).not.toHaveBeenCalled();
        });

        it('removes nothing on destroy when lazy loading is off', () => {
            const remove = jest.spyOn(window, 'removeEventListener');
            createController({
                fullHeight: true,
                lazyLoadingForFullHeight: false,
            }).destroy();
            expect(remove).not.toHaveBeenCalled();
        });

        it('pushes the visible coordinates on a window scroll and resize', () => {
            const controller = createController({ fullHeight: true });
            controller.onRender();

            window.dispatchEvent(new Event('scroll'));
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );

            (host.trigger as jest.Mock).mockClear();
            window.dispatchEvent(new Event('resize'));
            expect(host.trigger).toHaveBeenCalledTimes(1);

            controller.destroy();
            (host.trigger as jest.Mock).mockClear();
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));
            expect(host.trigger).not.toHaveBeenCalled();
        });

        it('does not stack duplicate window listeners across renders', () => {
            const add = jest.spyOn(window, 'addEventListener');
            const controller = createController({ fullHeight: true });

            controller.onRender();
            controller.onRender();
            const scrollHandlers = add.mock.calls
                .filter(([eventType]) => eventType === 'scroll')
                .map(([, handler]) => handler);
            expect(scrollHandlers).toHaveLength(2);
            expect(scrollHandlers[0]).toBe(scrollHandlers[1]);

            controller.destroy();
            (host.trigger as jest.Mock).mockClear();
            window.dispatchEvent(new Event('scroll'));
            expect(host.trigger).not.toHaveBeenCalled();
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

        it('pushes the visible coordinates on a container scroll', () => {
            (window as any).ResizeObserver = jest.fn(() => ({
                observe: jest.fn(),
                disconnect: jest.fn(),
            }));
            const scrollContainer = document.createElement('div');
            scrollContainer.style.overflow = 'auto';

            const controller = createController({ fullHeight: true });
            scrollContainer.appendChild(iFrame);
            document.body.appendChild(scrollContainer);
            controller.onRender();

            scrollContainer.dispatchEvent(new Event('scroll'));
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );

            controller.destroy();
            (host.trigger as jest.Mock).mockClear();
            scrollContainer.dispatchEvent(new Event('scroll'));
            expect(host.trigger).not.toHaveBeenCalled();
        });

        it('pushes the visible coordinates when an observed container resizes', () => {
            let resizeCallback: () => void;
            (window as any).ResizeObserver = jest.fn((callback) => {
                resizeCallback = callback;
                return { observe: jest.fn(), disconnect: jest.fn() };
            });
            const scrollContainer = document.createElement('div');
            scrollContainer.style.overflow = 'auto';

            const controller = createController({ fullHeight: true });
            scrollContainer.appendChild(iFrame);
            document.body.appendChild(scrollContainer);
            controller.onRender();

            resizeCallback();
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );
            controller.destroy();
        });

        it('observes the iframe parent even without a scrollable ancestor', () => {
            const observe = jest.fn();
            (window as any).ResizeObserver = jest.fn(() => ({
                observe,
                disconnect: jest.fn(),
            }));

            const controller = createController({ fullHeight: true });
            controller.onRender();
            expect(observe).toHaveBeenCalledWith(iFrame.parentElement);
            controller.destroy();
        });

        it('observes each resize target only once', () => {
            const observe = jest.fn();
            (window as any).ResizeObserver = jest.fn(() => ({
                observe,
                disconnect: jest.fn(),
            }));
            const container = document.createElement('div');
            container.style.overflow = 'auto';

            const controller = createController({ fullHeight: true });
            container.appendChild(iFrame);
            document.body.appendChild(container);
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(-100, 400));
            jest.spyOn(container, 'getBoundingClientRect').mockReturnValue(rectOf(50, 300));

            controller.onRender();
            expect(observe).toHaveBeenCalledTimes(1);
            expect(observe).toHaveBeenCalledWith(container);
            controller.destroy();
        });

        it('does not touch the containers when container lazy loading is off', () => {
            const resizeObserver = jest.fn();
            (window as any).ResizeObserver = resizeObserver;
            const scrollContainer = document.createElement('div');
            scrollContainer.style.overflow = 'auto';
            const addContainerListener = jest.spyOn(scrollContainer, 'addEventListener');

            const controller = createController({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                enableScrollableContainerLazyLoading: false,
            });
            scrollContainer.appendChild(iFrame);
            document.body.appendChild(scrollContainer);

            controller.onRender();
            expect(addContainerListener).not.toHaveBeenCalled();
            expect(resizeObserver).not.toHaveBeenCalled();
        });

        it('still tracks the containers in an environment without ResizeObserver', () => {
            delete (window as any).ResizeObserver;
            const scrollContainer = document.createElement('div');
            scrollContainer.style.overflow = 'auto';
            const addContainerListener = jest.spyOn(scrollContainer, 'addEventListener');

            const controller = createController({ fullHeight: true });
            scrollContainer.appendChild(iFrame);
            document.body.appendChild(scrollContainer);

            expect(() => controller.onRender()).not.toThrow();
            expect(addContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(() => controller.destroy()).not.toThrow();
        });

        it('drops the previous containers when the embed re-renders', () => {
            const disconnect = jest.fn();
            (window as any).ResizeObserver = jest.fn(() => ({
                observe: jest.fn(),
                disconnect,
            }));
            const scrollContainer = document.createElement('div');
            scrollContainer.style.overflow = 'auto';
            const removeContainerListener = jest.spyOn(scrollContainer, 'removeEventListener');

            const controller = createController({ fullHeight: true });
            scrollContainer.appendChild(iFrame);
            document.body.appendChild(scrollContainer);

            controller.onRender();
            controller.onRender();
            expect(removeContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(disconnect).toHaveBeenCalledTimes(1);
            controller.destroy();
        });

        it('is safe to destroy more than once', () => {
            (window as any).ResizeObserver = jest.fn(() => ({
                observe: jest.fn(),
                disconnect: jest.fn(),
            }));
            const controller = createController({ fullHeight: true });
            controller.onRender();
            controller.destroy();
            expect(() => controller.destroy()).not.toThrow();
        });

        it('is safe to destroy before the embed has rendered', () => {
            const controller = createController({ fullHeight: true });
            expect(() => controller.destroy()).not.toThrow();
        });
    });
});
