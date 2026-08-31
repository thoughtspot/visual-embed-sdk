import { FullHeightController, FullHeightEmbedHost } from './full-height';
import {
    BaseViewConfig, EmbedEvent, FullHeightViewConfig, HostEvent, MessageCallback, Param,
} from './types';

type ControllerConfig = FullHeightViewConfig & Pick<BaseViewConfig, 'frameParams'>;
import { logger } from './utils/logger';
import { DEFAULT_LAZY_LOADING_MARGIN } from './config';

describe('FullHeightController', () => {
    let iFrame: HTMLIFrameElement;
    let host: FullHeightEmbedHost;
    let handlers: Map<EmbedEvent, MessageCallback>;

    const originalResizeObserver = (window as any).ResizeObserver;
    const originalScrollY = window.scrollY;
    const originalInnerHeight = window.innerHeight;
    const originalInnerWidth = window.innerWidth;

    /**
     * A rect that only carries the edges the visibility math reads.
     */
    const rectOf = (top: number, bottom: number, left = 0, right = 500) => ({
        top,
        bottom,
        left,
        right,
        width: right - left,
        height: bottom - top,
    } as DOMRect);

    const setViewport = (scrollY: number, innerHeight: number, innerWidth = 1024) => {
        Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: innerWidth, configurable: true });
    };

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

    /**
     * The query params a freshly built controller contributes. The defaults are
     * applied to the controller's private copy of the view config, so the
     * params are how the host app observes them.
     */
    const queryParamsFor = (viewConfig: ControllerConfig) => {
        const params: any = {};
        createController(viewConfig).addQueryParams(params);
        return params;
    };

    /**
     * Puts the embed inside a scrollable container and hands back the spies the
     * container assertions need. The caller drives `onRender`, so tests can
     * assert what happens before it too.
     */
    const mountInScrollContainer = (
        viewConfig: ControllerConfig,
        options: { withResizeObserver?: boolean } = {},
    ) => {
        const observe = jest.fn();
        const disconnect = jest.fn();
        let resizeCallback: () => void;
        const resizeObserverCtor = jest.fn((callback: () => void) => {
            resizeCallback = callback;
            return { observe, disconnect };
        });
        if (options.withResizeObserver === false) {
            delete (window as any).ResizeObserver;
        } else {
            (window as any).ResizeObserver = resizeObserverCtor;
        }

        const scrollContainer = document.createElement('div');
        scrollContainer.style.overflow = 'auto';
        const addContainerListener = jest.spyOn(scrollContainer, 'addEventListener');
        const removeContainerListener = jest.spyOn(scrollContainer, 'removeEventListener');

        const controller = createController(viewConfig);
        scrollContainer.appendChild(iFrame);
        document.body.appendChild(scrollContainer);

        return {
            controller,
            scrollContainer,
            addContainerListener,
            removeContainerListener,
            observe,
            disconnect,
            resizeObserverCtor,
            fireResizeObserver: () => resizeCallback(),
        };
    };

    const visibleCoordinates = () => {
        const responder = jest.fn();
        handlers.get(EmbedEvent.RequestVisibleEmbedCoordinates)({} as any, responder);
        return responder.mock.calls[0][0].data;
    };

    afterEach(() => {
        document.body.innerHTML = '';
        (window as any).ResizeObserver = originalResizeObserver;
        setViewport(originalScrollY, originalInnerHeight, originalInnerWidth);
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
            // Lazy loading on its own must not switch the feature on.
            createController({ fullHeight: false, lazyLoadingForFullHeight: true });
            expect(handlers.size).toBe(0);
        });
    });

    describe('lazy loading defaults', () => {
        it('turns lazy loading on for a full-height embed', () => {
            expect(queryParamsFor({ fullHeight: true })).toEqual({
                [Param.fullHeight]: true,
                [Param.IsLazyLoadingForEmbedEnabled]: true,
                [Param.RootMarginForLazyLoad]: DEFAULT_LAZY_LOADING_MARGIN,
            });
        });

        it('tracks the scrollable containers without the host app opting in', () => {
            const { controller, addContainerListener, observe } = mountInScrollContainer({
                fullHeight: true,
            });
            controller.onRender();
            expect(addContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(observe).toHaveBeenCalled();
            controller.destroy();
        });

        it('leaves the view config the host app passed in untouched', () => {
            // The controller defaults its own copy, so the host app's object
            // never grows keys it did not set.
            const viewConfig: ControllerConfig = { fullHeight: true };
            createControllerFor(viewConfig);
            expect(viewConfig).toEqual({ fullHeight: true });
        });

        it('leaves an explicit opt-out alone', () => {
            expect(queryParamsFor({
                fullHeight: true,
                lazyLoadingForFullHeight: false,
                lazyLoadingMargin: '0px',
            })).toEqual({ [Param.fullHeight]: true });
        });

        it('honours an explicit container opt-out', () => {
            const { controller, addContainerListener, resizeObserverCtor } = mountInScrollContainer(
                { fullHeight: true, enableScrollableContainerLazyLoading: false },
            );
            controller.onRender();
            expect(addContainerListener).not.toHaveBeenCalled();
            expect(resizeObserverCtor).not.toHaveBeenCalled();
        });

        it('defaults only the values the host app left unset', () => {
            // Lazy loading defaults on, while the supplied margin survives.
            const { controller, addContainerListener } = mountInScrollContainer({
                fullHeight: true,
                enableScrollableContainerLazyLoading: false,
                lazyLoadingMargin: '50px',
            });
            const params: any = {};
            controller.addQueryParams(params);
            expect(params).toEqual({
                [Param.fullHeight]: true,
                [Param.IsLazyLoadingForEmbedEnabled]: true,
                [Param.RootMarginForLazyLoad]: '50px',
            });

            controller.onRender();
            expect(addContainerListener).not.toHaveBeenCalled();
        });

        it('defaults nothing when fullHeight is not enabled', () => {
            const viewConfig: ControllerConfig = {};
            const controller = createControllerFor(viewConfig);
            expect(viewConfig).toEqual({});

            const add = jest.spyOn(window, 'addEventListener');
            controller.onRender();
            expect(add).not.toHaveBeenCalled();
        });

        it('ignores changes the host app makes to its config after construction', () => {
            const viewConfig: ControllerConfig = { fullHeight: true, minimumHeight: 800 };
            const controller = createControllerFor(viewConfig);
            viewConfig.minimumHeight = 900;
            viewConfig.fullHeight = false;
            expect(controller.minimumHeight).toBe(800);
            expect(queryParamsFor(viewConfig)[Param.fullHeight]).toBeUndefined();
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
            expect(queryParamsFor({ lazyLoadingForFullHeight: true })).toEqual({});
        });

        it('adds only the full height param when lazy loading is off', () => {
            expect(queryParamsFor({
                fullHeight: true,
                lazyLoadingForFullHeight: false,
            })).toEqual({ [Param.fullHeight]: true });
        });

        it('adds the lazy loading params, including a valid margin', () => {
            expect(queryParamsFor({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '100px 0px',
            })).toEqual({
                [Param.fullHeight]: true,
                [Param.IsLazyLoadingForEmbedEnabled]: true,
                [Param.RootMarginForLazyLoad]: '100px 0px',
            });
        });

        it('accepts a four sided margin', () => {
            expect(queryParamsFor({
                fullHeight: true,
                lazyLoadingMargin: '10px 20px 30px 40px',
            })[Param.RootMarginForLazyLoad]).toBe('10px 20px 30px 40px');
        });

        it('accepts a unitless zero margin', () => {
            expect(queryParamsFor({
                fullHeight: true,
                lazyLoadingMargin: '0',
            })[Param.RootMarginForLazyLoad]).toBe('0');
        });

        it('keeps the params the embed has already collected', () => {
            const params: any = { existing: 'value' };
            createController({ fullHeight: true }).addQueryParams(params);
            expect(params.existing).toBe('value');
        });

        it('produces the same params when called for a second render', () => {
            const controller = createController({ fullHeight: true });
            const first: any = {};
            const second: any = {};
            controller.addQueryParams(first);
            controller.addQueryParams(second);
            expect(second).toEqual(first);
        });

        it('drops an invalid lazy loading margin', () => {
            // An invalid margin is reported to the developer, not sent on.
            const loggerError = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const params = queryParamsFor({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: 'not-a-margin',
            });
            expect(params[Param.RootMarginForLazyLoad]).toBeUndefined();
            expect(loggerError).toHaveBeenCalled();
        });

        it('drops a margin with more than four sides', () => {
            const loggerError = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const params = queryParamsFor({
                fullHeight: true,
                lazyLoadingMargin: '1px 2px 3px 4px 5px',
            });
            expect(params[Param.RootMarginForLazyLoad]).toBeUndefined();
            expect(loggerError).toHaveBeenCalled();
        });

        it('drops a margin that is not a string', () => {
            const loggerError = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const params = queryParamsFor({
                fullHeight: true,
                lazyLoadingMargin: 100 as any,
            });
            expect(params[Param.RootMarginForLazyLoad]).toBeUndefined();
            expect(loggerError).toHaveBeenCalled();
        });

        it('drops an empty lazy loading margin but keeps the other params', () => {
            const loggerError = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const params = queryParamsFor({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                lazyLoadingMargin: '',
            });
            expect(params).toEqual({
                [Param.fullHeight]: true,
                [Param.IsLazyLoadingForEmbedEnabled]: true,
            });
            expect(loggerError).toHaveBeenCalled();
        });
    });

    describe('EmbedHeight', () => {
        const embedHeight = (data: unknown) => ({ data } as any);

        it('never sizes the frame below the configured minimum', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(300));
            expect(host.setFrameHeight).toHaveBeenCalledWith(800);
        });

        it('uses the height reported by the app when it clears the minimum', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(1200));
            expect(host.setFrameHeight).toHaveBeenCalledWith(1200);
        });

        it('never sizes the frame below the 500 default floor', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(100));
            expect(host.setFrameHeight).toHaveBeenCalledWith(500);
        });

        it('clamps a negative height to the minimum', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(-50));
            expect(host.setFrameHeight).toHaveBeenCalledWith(800);
        });

        it('clamps a zero height to the minimum', () => {
            // Zero is a height the app really reported, not a missing one.
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(0));
            expect(host.setFrameHeight).toHaveBeenCalledWith(800);
        });

        it('keeps a fractional height that clears the minimum', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(1200.5));
            expect(host.setFrameHeight).toHaveBeenCalledWith(1200.5);
        });

        it('accepts a numeric height sent as a string', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight('1200'));
            expect(host.setFrameHeight).toHaveBeenCalledWith(1200);
        });

        it('leaves the height alone when the app reports a non-numeric height', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight('tall'));
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
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight('tall'));
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );
        });

        it('pushes the visible coordinates only when lazy loading is on', () => {
            createController({ fullHeight: true, lazyLoadingForFullHeight: false });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(1200));
            expect(host.trigger).not.toHaveBeenCalled();

            createController({ fullHeight: true, lazyLoadingForFullHeight: true });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(1200));
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );
        });

        it('pushes no coordinates when the iframe is not there yet', () => {
            // There is nothing to measure, so the app is left alone.
            createController({ fullHeight: true }, { iframe: null });
            handlers.get(EmbedEvent.EmbedHeight)(embedHeight(1200));
            expect(host.setFrameHeight).toHaveBeenCalledWith(1200);
            expect(host.trigger).not.toHaveBeenCalled();
        });
    });

    describe('RouteChange', () => {
        const routeChange = (currentPath: string) => ({ data: { currentPath } } as any);

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

        it('leaves the height alone on a bare Liveboard route', () => {
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/liveboard/'));
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
            // The routes are matched as prefixes, not as substrings.
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/app/embed/viz/abc'));
            expect(host.setFrameHeight).toHaveBeenCalledWith(800);
        });

        it('resets on a Liveboard route missing its trailing slash', () => {
            createController({ fullHeight: true, minimumHeight: 800 });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/liveboard'));
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

        it('does not push coordinates on a route change', () => {
            // Only a height report and the viewport listeners do that.
            createController({ fullHeight: true });
            handlers.get(EmbedEvent.RouteChange)(routeChange('/some/other/path/'));
            expect(host.trigger).not.toHaveBeenCalled();
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

        it('measures the center against the viewport for an unscrolled page', () => {
            setViewport(0, 768);
            createController({ fullHeight: true });
            Object.defineProperty(iFrame, 'offsetHeight', { value: 1000, configurable: true });
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(100, 1100));

            const responder = jest.fn();
            handlers.get(EmbedEvent.EmbedIframeCenter)({} as any, responder);
            expect(responder.mock.calls[0][0].data).toEqual({
                iframeCenter: 334,
                iframeScrolled: -100,
                iframeHeight: 1000,
                viewPortHeight: 768,
                iframeVisibleViewPort: 668,
            });
        });

        it('measures the center against the viewport for a scrolled page', () => {
            setViewport(500, 600);
            createController({ fullHeight: true });
            Object.defineProperty(iFrame, 'offsetHeight', { value: 2000, configurable: true });
            // The element starts at the page top, so it is 500px scrolled.
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(-500, 1500));

            const responder = jest.fn();
            handlers.get(EmbedEvent.EmbedIframeCenter)({} as any, responder);
            expect(responder.mock.calls[0][0].data).toEqual({
                iframeCenter: 800,
                iframeScrolled: 500,
                iframeHeight: 2000,
                viewPortHeight: 600,
                iframeVisibleViewPort: 600,
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

        it('reports the region left uncovered when the embed is off screen', () => {
            setViewport(0, 768);
            createController({ fullHeight: true });
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(900, 1400));
            expect(visibleCoordinates()).toEqual({
                top: 0, height: 0, left: 0, width: 500,
            });
        });

        it('clips the visible region to the containers when container lazy loading is on', () => {
            setViewport(0, 768);
            const clippingContainer = document.createElement('div');
            clippingContainer.style.overflow = 'hidden';
            createController({
                fullHeight: true,
                enableScrollableContainerLazyLoading: true,
            });
            clippingContainer.appendChild(iFrame);
            document.body.appendChild(clippingContainer);
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(-100, 400));
            jest.spyOn(clippingContainer, 'getBoundingClientRect')
                .mockReturnValue(rectOf(50, 300));

            expect(visibleCoordinates()).toEqual({
                top: 150, height: 250, left: 0, width: 500,
            });
        });

        it('ignores the containers when container lazy loading is off', () => {
            setViewport(0, 768);
            const clippingContainer = document.createElement('div');
            clippingContainer.style.overflow = 'hidden';
            createController({
                fullHeight: true,
                enableScrollableContainerLazyLoading: false,
            });
            clippingContainer.appendChild(iFrame);
            document.body.appendChild(clippingContainer);
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(-100, 400));
            jest.spyOn(clippingContainer, 'getBoundingClientRect')
                .mockReturnValue(rectOf(50, 300));

            expect(visibleCoordinates()).toEqual({
                top: 100, height: 400, left: 0, width: 500,
            });
        });

        it('clips the visible region horizontally too', () => {
            setViewport(0, 768, 1024);
            const clippingContainer = document.createElement('div');
            clippingContainer.style.overflow = 'hidden';
            createController({ fullHeight: true });
            clippingContainer.appendChild(iFrame);
            document.body.appendChild(clippingContainer);
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(0, 400, -60, 600));
            jest.spyOn(clippingContainer, 'getBoundingClientRect')
                .mockReturnValue(rectOf(0, 400, 40, 500));

            expect(visibleCoordinates()).toEqual({
                top: 0, height: 400, left: 100, width: 460,
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

        it('pushes the visible coordinates for a scroll inside a nested element', () => {
            // The window scroll listener is registered in the capture phase, so
            // a scroll on an inner element reaches it too.
            const controller = createController({ fullHeight: true });
            controller.onRender();
            iFrame.dispatchEvent(new Event('scroll', { bubbles: false }));
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );
            controller.destroy();
        });

        it('picks the listeners back up when the embed re-renders after destroy', () => {
            const controller = createController({ fullHeight: true });
            controller.onRender();
            controller.destroy();

            controller.onRender();
            window.dispatchEvent(new Event('scroll'));
            expect(host.trigger).toHaveBeenCalledWith(
                HostEvent.VisibleEmbedCoordinates,
                expect.objectContaining({ top: expect.any(Number) }),
            );
            controller.destroy();
        });

        it('does not stack duplicate window listeners across renders', () => {
            const add = jest.spyOn(window, 'addEventListener');
            const controller = createController({ fullHeight: true });

            controller.onRender();
            controller.onRender();
            const scrollHandlers = add.mock.calls
                .filter(([eventType]) => eventType === 'scroll')
                .map(([, handler]) => handler);
            // The same reference is re-added, so the browser keeps a
            // single listener.
            expect(scrollHandlers).toHaveLength(2);
            expect(scrollHandlers[0]).toBe(scrollHandlers[1]);

            controller.destroy();
            (host.trigger as jest.Mock).mockClear();
            window.dispatchEvent(new Event('scroll'));
            expect(host.trigger).not.toHaveBeenCalled();
        });

        it('observes the scrollable ancestors when container lazy loading is on', () => {
            const {
                controller, addContainerListener, removeContainerListener, observe, disconnect,
            } = mountInScrollContainer({
                fullHeight: true,
                lazyLoadingForFullHeight: true,
                enableScrollableContainerLazyLoading: true,
            });

            controller.onRender();
            expect(addContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(observe).toHaveBeenCalled();

            controller.destroy();
            expect(removeContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(disconnect).toHaveBeenCalled();
        });

        it('pushes the visible coordinates on a container scroll', () => {
            const { controller, scrollContainer } = mountInScrollContainer({ fullHeight: true });
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
            const { controller, fireResizeObserver } = mountInScrollContainer({ fullHeight: true });
            controller.onRender();

            fireResizeObserver();
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
            const { controller, scrollContainer, observe } = mountInScrollContainer({
                fullHeight: true,
            });
            // The parent is also the clipping ancestor, so it must not
            // be observed twice.
            jest.spyOn(iFrame, 'getBoundingClientRect').mockReturnValue(rectOf(-100, 400));
            jest.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(rectOf(50, 300));

            controller.onRender();
            expect(observe).toHaveBeenCalledTimes(1);
            expect(observe).toHaveBeenCalledWith(scrollContainer);
            controller.destroy();
        });

        it('does not touch the containers when container lazy loading is off', () => {
            const { controller, addContainerListener, resizeObserverCtor } = mountInScrollContainer(
                {
                    fullHeight: true,
                    lazyLoadingForFullHeight: true,
                    enableScrollableContainerLazyLoading: false,
                },
            );

            controller.onRender();
            expect(addContainerListener).not.toHaveBeenCalled();
            expect(resizeObserverCtor).not.toHaveBeenCalled();
        });

        it('still tracks the containers in an environment without ResizeObserver', () => {
            const { controller, addContainerListener } = mountInScrollContainer(
                { fullHeight: true },
                { withResizeObserver: false },
            );

            expect(() => controller.onRender()).not.toThrow();
            expect(addContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(() => controller.destroy()).not.toThrow();
        });

        it('drops the previous containers when the embed re-renders', () => {
            const {
                controller, removeContainerListener, disconnect,
            } = mountInScrollContainer({ fullHeight: true });

            controller.onRender();
            controller.onRender();
            expect(removeContainerListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(disconnect).toHaveBeenCalledTimes(1);
            controller.destroy();
        });

        it('is safe to destroy more than once', () => {
            const { controller } = mountInScrollContainer({ fullHeight: true });
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
