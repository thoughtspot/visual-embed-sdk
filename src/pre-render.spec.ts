import {
    PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY,
    PreRenderController,
    PreRenderEmbedHost,
} from './pre-render';
import { AuthType, PreRenderConfig } from './types';
import { ERROR_MESSAGE } from './errors';
import { logger } from './utils/logger';
import { init, LiveboardEmbed } from './index';
import * as authInstance from './auth';
import { waitFor } from './test/test-utils';

type ObserverMock = {
    observe: jest.Mock;
    disconnect: jest.Mock;
    unobserve: jest.Mock;
    callback?: ResizeObserverCallback;
};

describe('PreRenderController', () => {
    let config: PreRenderConfig;
    let hostElement: HTMLElement;
    let placeholder: HTMLElement | undefined;
    let owner: PreRenderController | undefined;
    let isFullHeight: boolean;
    let host: PreRenderEmbedHost;
    let observers: ObserverMock[];

    const originalResizeObserver = (window as any).ResizeObserver;

    const createController = () => {
        let wrapper: HTMLElement | undefined;
        let child: HTMLElement | undefined;
        host = {
            getConfig: () => config,
            getHostElement: () => hostElement,
            getFrameParams: () => ({ width: 400, height: 300 }),
            isFullHeight: () => isFullHeight,
            getPlaceholder: () => placeholder,
            getOwner: () => owner,
            syncStyle: jest.fn(),
            getWrapper: () => wrapper,
            setWrapper: (next) => {
                wrapper = next;
            },
            getChild: () => child,
            setChild: (next) => {
                child = next;
            },
        };
        return new PreRenderController(host);
    };

    /**
     * Mounts a wrapper the way the embed does: child, wrapper, container.
     */
    const mount = (controller: PreRenderController) => {
        const wrapper = controller.createWrapper();
        const child = controller.createChild(document.createElement('iframe'));
        wrapper.appendChild(child);
        controller.wrapper = wrapper;
        controller.child = child;
        controller.attachToContainer();
    };

    /**
     * Shows a mounted pre-render the way the embed does.
     */
    const show = (controller: PreRenderController) => {
        placeholder = controller.insertPlaceholder();
        controller.trackPlaceholder();
        controller.reveal();
    };

    const addContainer = (id: string, position = '') => {
        const container = document.createElement('div');
        container.id = id;
        container.style.position = position;
        document.body.appendChild(container);
        return container;
    };

    beforeEach(() => {
        document.body.innerHTML = '';
        config = { id: 'unit' };
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);
        placeholder = undefined;
        owner = undefined;
        isFullHeight = false;
        observers = [];
        (window as any).ResizeObserver = jest.fn().mockImplementation((callback) => {
            const observer = {
                observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn(), callback,
            };
            observers.push(observer);
            return observer;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(() => {
        (window as any).ResizeObserver = originalResizeObserver;
    });

    describe('ids and element creation', () => {
        it('derives every element id from the pre-render id', () => {
            expect(createController().getIds()).toEqual({
                wrapper: 'tsEmbed-pre-render-wrapper-unit',
                child: 'tsEmbed-pre-render-child-unit',
                placeHolder: 'tsEmbed-pre-render-placeholder-unit',
            });
        });

        it('reads the config lazily, so a later config change is picked up', () => {
            const controller = createController();
            config = { id: 'changed' };
            expect(controller.getIds().wrapper).toBe('tsEmbed-pre-render-wrapper-changed');
        });

        it('replaces a wrapper left over under the same id', () => {
            const leftover = document.createElement('div');
            leftover.id = 'tsEmbed-pre-render-wrapper-unit';
            document.body.appendChild(leftover);

            const wrapper = createController().createWrapper();

            expect(leftover.isConnected).toBe(false);
            expect(wrapper.id).toBe('tsEmbed-pre-render-wrapper-unit');
        });

        it('wraps string content in a full-size div carrying the child id', () => {
            const child = createController().createChild('<p>login failed</p>');
            expect(child.id).toBe('tsEmbed-pre-render-child-unit');
            expect(child.innerHTML).toBe('<p>login failed</p>');
            expect(child.style.width).toBe('100%');
        });

        it('tags an element child in place instead of wrapping it', () => {
            const iframe = document.createElement('iframe');
            expect(createController().createChild(iframe)).toBe(iframe);
            expect(iframe.id).toBe('tsEmbed-pre-render-child-unit');
        });
    });

    describe('connect', () => {
        it('returns false when nothing was pre-rendered under the id', () => {
            const controller = createController();
            expect(controller.connect()).toBe(false);
            expect(controller.isPreRendered).toBe(false);
        });

        it('adopts a wrapper and child already in the DOM', () => {
            mount(createController());
            const controller = createController();

            expect(controller.connect()).toBe(true);
            expect(controller.isPreRendered).toBe(true);
            expect(controller.wrapper.id).toBe('tsEmbed-pre-render-wrapper-unit');
        });

        it("inherits the owner's container and warns when its own differs", () => {
            const ownerContainer = addContainer('owner-container');
            addContainer('other-container');
            config = { id: 'unit', containerSelector: '#owner-container' };
            const ownerController = createController();
            mount(ownerController);

            config = { id: 'unit', containerSelector: '#other-container' };
            owner = ownerController;
            const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
            const controller = createController();
            controller.connect();

            expect(controller.container).toBe(ownerContainer);
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('preRenderContainer is applied only'),
            );
        });

        it('keeps document.body when the wrapper has no owner', () => {
            mount(createController());
            const controller = createController();
            controller.connect();
            expect(controller.container).toBe(document.body);
        });
    });

    describe('container', () => {
        it('mounts into document.body by default', () => {
            const controller = createController();
            mount(controller);
            expect(controller.wrapper.parentElement).toBe(document.body);
        });

        it("defaults to the host's nearest scrolling ancestor", () => {
            const scroller = addContainer('inner-scroller');
            scroller.style.overflowY = 'auto';
            scroller.appendChild(hostElement);
            const controller = createController();
            mount(controller);

            expect(controller.container).toBe(scroller);
            expect(controller.wrapper.parentElement).toBe(scroller);
        });

        it('mounts into document.body when there is no host element', () => {
            hostElement = undefined;
            const controller = createController();
            mount(controller);
            expect(controller.container).toBe(document.body);
        });

        it('falls back to document.body and logs on an invalid selector', () => {
            config = { id: 'unit', containerSelector: '##not-a-selector' };
            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            const controller = createController();
            mount(controller);

            expect(controller.container).toBe(document.body);
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invalid CSS selector'),
                expect.anything(),
            );
        });

        it('makes a static container relative, then restores it on destroy', () => {
            const container = addContainer('static-container', 'static');
            config = { id: 'unit', containerSelector: container };
            const controller = createController();
            mount(controller);

            expect(container.style.position).toBe('relative');
            expect(container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY]).toBe('static');

            controller.destroy();

            expect(container.style.position).toBe('static');
            expect(container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY]).toBeUndefined();
            expect(controller.container).toBe(document.body);
        });

        it('keeps the override while another wrapper still shares the container', () => {
            const container = addContainer('shared-container', 'static');
            config = { id: 'first', containerSelector: container };
            const first = createController();
            mount(first);
            config = { id: 'second', containerSelector: container };
            mount(createController());

            first.destroy();

            expect(container.style.position).toBe('relative');
        });
    });

    describe('show and hide', () => {
        it('does not insert a placeholder without a host element', () => {
            hostElement = undefined;
            const controller = createController();
            mount(controller);
            expect(controller.insertPlaceholder()).toBeUndefined();
        });

        it('sizes the placeholder from the frame params', () => {
            const controller = createController();
            mount(controller);
            const inserted = controller.insertPlaceholder();

            expect(inserted.parentElement).toBe(hostElement);
            expect(inserted.style.width).toBe('400px');
            expect(inserted.style.height).toBe('300px');
        });

        it('seeds the placeholder height from the wrapper in full-height mode', () => {
            isFullHeight = true;
            const controller = createController();
            mount(controller);
            controller.wrapper.style.height = '1234px';

            expect(controller.insertPlaceholder().style.height).toBe('1234px');
        });

        it('removes a stale placeholder nested below the host element', () => {
            const controller = createController();
            mount(controller);
            const intermediate = document.createElement('div');
            const stale = document.createElement('div');
            stale.id = 'tsEmbed-pre-render-placeholder-unit';
            intermediate.appendChild(stale);
            hostElement.appendChild(intermediate);

            controller.insertPlaceholder();

            expect(stale.isConnected).toBe(false);
        });

        it('syncs through the host so a subclass override of syncPreRenderStyle runs', () => {
            const controller = createController();
            mount(controller);
            show(controller);
            (host.syncStyle as jest.Mock).mockClear();

            observers[0].callback([], observers[0] as unknown as ResizeObserver);

            expect(host.syncStyle).toHaveBeenCalledTimes(1);
        });

        it('does not observe resizes when doNotTrackSize is set', () => {
            config = { id: 'unit', doNotTrackSize: true };
            const controller = createController();
            mount(controller);
            show(controller);
            expect(observers).toHaveLength(0);
        });

        it('replaces the resize observer when shown twice without a hide', () => {
            const controller = createController();
            mount(controller);
            show(controller);
            show(controller);

            expect(observers).toHaveLength(2);
            expect(observers[0].disconnect).toHaveBeenCalled();
            expect(observers[1].disconnect).not.toHaveBeenCalled();
        });

        it('hides behind the page using the configured z-index', () => {
            config = { id: 'unit', zIndex: 5 };
            const controller = createController();
            mount(controller);
            show(controller);
            controller.conceal();

            expect(controller.wrapper.style.zIndex).toBe('5');
            expect(controller.wrapper.style.opacity).toBe('0');
            expect(controller.wrapper.style.pointerEvents).toBe('none');
            expect(placeholder.isConnected).toBe(false);
            expect(observers[0].disconnect).toHaveBeenCalled();
        });

        it('can be hidden twice in a row without throwing', () => {
            const controller = createController();
            mount(controller);
            show(controller);
            controller.conceal();

            expect(() => controller.conceal()).not.toThrow();
        });

        it('parks the hidden frame outside every scroll container', () => {
            const controller = createController();
            mount(controller);
            show(controller);
            controller.conceal();

            expect(controller.wrapper.style.position).toBe('fixed');
            expect(controller.wrapper.style.transform).toBe('translateY(-100%)');
        });

        it('never resyncs on container scroll, since the browser moves the wrapper', () => {
            const container = addContainer('scroll-container', 'relative');
            config = { id: 'unit', containerSelector: container };
            const addSpy = jest.spyOn(container, 'addEventListener');
            const controller = createController();
            mount(controller);
            show(controller);
            (host.syncStyle as jest.Mock).mockClear();

            container.dispatchEvent(new Event('scroll'));

            expect(addSpy.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(0);
            expect(host.syncStyle).not.toHaveBeenCalled();
        });
    });

    describe('syncStyle', () => {
        it('logs an error when called before a placeholder exists', () => {
            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            createController().syncStyle();
            expect(errorSpy).toHaveBeenCalledWith(ERROR_MESSAGE.SYNC_STYLE_CALLED_BEFORE_RENDER);
        });

        it('positions the wrapper over the placeholder, relative to a scrolled container', () => {
            const container = addContainer('sync-container', 'relative');
            config = { id: 'unit', containerSelector: container };
            const controller = createController();
            mount(controller);
            placeholder = controller.insertPlaceholder();
            jest.spyOn(placeholder, 'getBoundingClientRect').mockReturnValue({
                x: 120, y: 90, width: 400, height: 300,
            } as DOMRect);
            jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
                x: 20, y: 40,
            } as DOMRect);
            container.scrollTop = 15;

            controller.syncStyle();

            expect(controller.wrapper.style.left).toBe('100px');
            expect(controller.wrapper.style.top).toBe('65px');
            expect(controller.wrapper.style.width).toBe('400px');
            expect(controller.wrapper.style.height).toBe('300px');
        });
    });

    describe('destroy', () => {
        it('removes the wrapper and detaches every listener and observer', () => {
            const container = addContainer('destroy-container', 'relative');
            config = { id: 'unit', containerSelector: container };
            const controller = createController();
            mount(controller);
            show(controller);
            const { wrapper } = controller;
            (host.syncStyle as jest.Mock).mockClear();

            controller.destroy();
            container.dispatchEvent(new Event('scroll'));

            expect(wrapper.isConnected).toBe(false);
            expect(observers[0].disconnect).toHaveBeenCalled();
            expect(host.syncStyle).not.toHaveBeenCalled();
        });
    });

    describe('additional coverage', () => {
        /**
         * Fires the observer's callback the way the browser would.
         */
        const fireResize = (observer: ObserverMock, target: Element) => {
            observer.callback(
                [{ target } as unknown as ResizeObserverEntry],
                observer as unknown as ResizeObserver,
            );
        };

        it('starts on document.body before anything is mounted', () => {
            const controller = createController();
            expect(controller.container).toBe(document.body);
            expect(controller.isConnected()).toBe(false);
        });

        it('appends a non-element node inside a full-size div', () => {
            const text = document.createTextNode('pre-rendered text');
            const child = createController().createChild(text);

            expect(child).toBeInstanceOf(HTMLDivElement);
            expect(child.id).toBe('tsEmbed-pre-render-child-unit');
            expect(child.firstChild).toBe(text);
            expect(child.style.height).toBe('100%');
        });

        it('keeps a wrapper it already holds instead of re-querying the DOM', () => {
            const controller = createController();
            const ownWrapper = document.createElement('div');
            const ownChild = document.createElement('div');
            controller.wrapper = ownWrapper;
            controller.child = ownChild;
            mount(createController());

            expect(controller.connect()).toBe(true);
            expect(controller.wrapper).toBe(ownWrapper);
            expect(controller.child).toBe(ownChild);
        });

        it('keeps its own container when it is its own owner', () => {
            const ownContainer = addContainer('self-owned', 'relative');
            config = { id: 'unit', containerSelector: ownContainer };
            const controller = createController();
            mount(controller);
            owner = controller;

            controller.connect();

            expect(controller.container).toBe(ownContainer);
        });

        it('does not warn when the connecting embed asks for the owner container', () => {
            const ownerContainer = addContainer('same-owner-container', 'relative');
            config = { id: 'unit', containerSelector: '#same-owner-container' };
            const ownerController = createController();
            mount(ownerController);
            owner = ownerController;
            const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

            const controller = createController();
            controller.connect();

            expect(controller.container).toBe(ownerContainer);
            expect(warnSpy).not.toHaveBeenCalled();
        });

        it('does not warn when the connecting embed sets no container', () => {
            const ownerContainer = addContainer('owner-only-container', 'relative');
            config = { id: 'unit', containerSelector: ownerContainer };
            const ownerController = createController();
            mount(ownerController);
            owner = ownerController;
            config = { id: 'unit' };
            const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

            const controller = createController();
            controller.connect();

            expect(controller.container).toBe(ownerContainer);
            expect(warnSpy).not.toHaveBeenCalled();
        });

        it('makes the inherited container relative when it is static', () => {
            const ownerContainer = addContainer('inherited-static', 'relative');
            config = { id: 'unit', containerSelector: ownerContainer };
            const ownerController = createController();
            mount(ownerController);
            ownerContainer.style.position = 'static';
            owner = ownerController;
            config = { id: 'unit' };

            createController().connect();

            expect(ownerContainer.style.position).toBe('relative');
            expect(ownerContainer.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY])
                .toBe('static');
        });

        it('leaves an already-positioned container untouched, including on destroy', () => {
            const container = addContainer('positioned-container', 'absolute');
            config = { id: 'unit', containerSelector: container };
            const controller = createController();
            mount(controller);

            expect(container.style.position).toBe('absolute');
            expect(container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY]).toBeUndefined();

            controller.destroy();

            expect(container.style.position).toBe('absolute');
            expect(controller.container).toBe(document.body);
        });

        it('keeps the original position already stashed on a container', () => {
            const container = addContainer('pre-stashed-container', 'static');
            container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY] = 'sticky';
            config = { id: 'unit', containerSelector: container };
            const controller = createController();
            mount(controller);

            expect(container.dataset[PRERENDER_CONTAINER_ORIGINAL_POSITION_KEY]).toBe('sticky');

            controller.destroy();

            expect(container.style.position).toBe('sticky');
        });

        it('treats an owner with no resolved container as document.body', () => {
            const ownerController = createController();
            mount(ownerController);
            (ownerController as any).containerEl = undefined;
            owner = ownerController;

            const controller = createController();
            controller.connect();

            expect(controller.container).toBe(document.body);
        });

        it('replaces a child left over under the same id', () => {
            const leftover = document.createElement('div');
            leftover.id = 'tsEmbed-pre-render-child-unit';
            document.body.appendChild(leftover);

            createController().createChild(document.createElement('iframe'));

            expect(leftover.isConnected).toBe(false);
        });

        it('keeps the frame height in full-height mode until the wrapper is sized', () => {
            isFullHeight = true;
            const controller = createController();
            mount(controller);
            controller.wrapper.style.height = '';

            expect(controller.insertPlaceholder().style.height).toBe('300px');
        });

        it('does not treat the unmeasured wrapper height as a full-height measurement', () => {
            isFullHeight = true;
            const controller = createController();
            mount(controller);

            expect(controller.wrapper.style.height).toBe('100vh');
            expect(controller.insertPlaceholder().style.height).toBe('300px');
        });

        it('falls back to document.body when the selector matches nothing', () => {
            config = { id: 'unit', containerSelector: '#does-not-exist' };
            const controller = createController();
            mount(controller);

            expect(controller.container).toBe(document.body);
            expect(controller.wrapper.parentElement).toBe(document.body);
        });

        it('resyncs when the observed placeholder resizes', () => {
            const controller = createController();
            mount(controller);
            show(controller);
            (host.syncStyle as jest.Mock).mockClear();

            fireResize(observers[0], placeholder);

            expect(host.syncStyle).toHaveBeenCalledTimes(1);
            expect(observers[0].observe).toHaveBeenCalledWith(placeholder);
        });

        it('does not observe anything when the embed has no placeholder', () => {
            const controller = createController();
            mount(controller);

            controller.trackPlaceholder();

            expect(observers).toHaveLength(0);
        });

        it('does not observe resizes where ResizeObserver is unavailable', () => {
            (window as any).ResizeObserver = undefined;
            const controller = createController();
            mount(controller);

            expect(() => show(controller)).not.toThrow();
            expect(host.syncStyle).toHaveBeenCalled();
        });

        it('reveal clears the styles conceal set', () => {
            const controller = createController();
            mount(controller);
            controller.conceal();
            expect(controller.wrapper.style.zIndex).toBe('-1000');

            controller.reveal();

            expect(controller.wrapper.style.zIndex).toBe('');
            expect(controller.wrapper.style.opacity).toBe('');
            expect(controller.wrapper.style.overflow).toBe('');
            expect(controller.wrapper.style.transform).toBe('');
        });

        it('reveal re-enables input even under a pointer-events: none container', () => {
            const container = addContainer('inert-container', 'relative');
            container.style.pointerEvents = 'none';
            config = { id: 'unit', containerSelector: container };
            const controller = createController();
            mount(controller);
            controller.conceal();

            controller.reveal();

            expect(controller.wrapper.style.pointerEvents).toBe('auto');
        });

        it('can be hidden before it was ever shown', () => {
            const controller = createController();
            mount(controller);

            expect(() => controller.conceal()).not.toThrow();
            expect(controller.wrapper.style.opacity).toBe('0');
        });

        it('can be destroyed before anything was mounted', () => {
            const controller = createController();
            expect(() => controller.destroy()).not.toThrow();
        });

        it('logs an error when the wrapper exists but no placeholder does', () => {
            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            const controller = createController();
            mount(controller);

            controller.syncStyle();

            expect(errorSpy).toHaveBeenCalledWith(ERROR_MESSAGE.SYNC_STYLE_CALLED_BEFORE_RENDER);
        });

        it('skips syncing while the placeholder is detached', () => {
            const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => undefined);
            const controller = createController();
            mount(controller);
            placeholder = document.createElement('div');
            const before = controller.wrapper.getAttribute('style');

            controller.syncStyle();

            expect(debugSpy).toHaveBeenCalledWith(
                'syncPreRenderStyle skipped: placeholder is detached',
            );
            expect(controller.wrapper.getAttribute('style')).toBe(before);
        });

        it('positions against the page scroll when mounted in document.body', () => {
            const controller = createController();
            mount(controller);
            placeholder = controller.insertPlaceholder();
            jest.spyOn(placeholder, 'getBoundingClientRect').mockReturnValue({
                x: 10, y: 20, width: 200, height: 100,
            } as DOMRect);
            Object.defineProperty(window, 'scrollX', { value: 5, configurable: true });
            Object.defineProperty(window, 'scrollY', { value: 50, configurable: true });

            controller.syncStyle();

            expect(controller.wrapper.style.left).toBe('15px');
            expect(controller.wrapper.style.top).toBe('70px');
            Object.defineProperty(window, 'scrollX', { value: 0, configurable: true });
            Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
        });

        describe('container remount', () => {
            const replaceContainer = (old: HTMLElement) => {
                const fresh = document.createElement('div');
                fresh.id = old.id;
                // jsdom reports '' rather than 'static' for an unstyled div.
                fresh.style.position = 'static';
                old.replaceWith(fresh);
                return fresh;
            };

            it('moves the wrapper to a remounted selector container', () => {
                const original = addContainer('remount-container', 'static');
                config = { id: 'unit', containerSelector: '#remount-container' };
                const controller = createController();
                mount(controller);
                show(controller);
                const fresh = replaceContainer(original);

                controller.syncStyle();

                expect(controller.container).toBe(fresh);
                expect(controller.wrapper.parentElement).toBe(fresh);
                expect(fresh.style.position).toBe('relative');
            });

            it('falls back to document.body when the remounted container is gone', () => {
                const original = addContainer('vanishing-container', 'relative');
                config = { id: 'unit', containerSelector: '#vanishing-container' };
                const controller = createController();
                mount(controller);
                show(controller);
                original.remove();

                controller.syncStyle();

                expect(controller.container).toBe(document.body);
                expect(controller.wrapper.parentElement).toBe(document.body);
            });

            it('leaves a detached element container alone, since it cannot be re-resolved', () => {
                const detached = addContainer('detached-element', 'relative');
                config = { id: 'unit', containerSelector: detached };
                const controller = createController();
                mount(controller);
                placeholder = controller.insertPlaceholder();
                detached.remove();

                controller.syncStyle();

                expect(controller.container).toBe(detached);
                expect(controller.wrapper.parentElement).toBe(detached);
            });

            it('re-attaches the wrapper when it was moved out of a live container', () => {
                const container = addContainer('live-container', 'relative');
                config = { id: 'unit', containerSelector: container };
                const controller = createController();
                mount(controller);
                placeholder = controller.insertPlaceholder();
                document.body.appendChild(controller.wrapper);

                controller.syncStyle();

                expect(controller.wrapper.parentElement).toBe(container);
            });

            it('picks the container back up when it is mounted again', () => {
                const original = addContainer('returning-container', 'relative');
                config = { id: 'unit', containerSelector: '#returning-container' };
                const controller = createController();
                mount(controller);
                show(controller);
                original.remove();
                controller.syncStyle();
                expect(controller.container).toBe(document.body);

                const returned = addContainer('returning-container', 'relative');
                controller.wrapper.remove();
                controller.syncStyle();

                expect(controller.container).toBe(returned);
                expect(controller.wrapper.parentElement).toBe(returned);
            });

            it('does not re-append a wrapper already inside the remounted container', () => {
                const original = addContainer('preplaced-container', 'relative');
                config = { id: 'unit', containerSelector: '#preplaced-container' };
                const controller = createController();
                mount(controller);
                placeholder = controller.insertPlaceholder();
                const fresh = replaceContainer(original);
                fresh.appendChild(controller.wrapper);
                const appendSpy = jest.spyOn(fresh, 'appendChild');

                controller.syncStyle();

                expect(controller.container).toBe(fresh);
                expect(appendSpy).not.toHaveBeenCalled();
            });

            it('can be hidden after falling back to document.body', () => {
                const original = addContainer('fallback-hide-container', 'relative');
                config = { id: 'unit', containerSelector: '#fallback-hide-container' };
                const controller = createController();
                mount(controller);
                show(controller);
                original.remove();
                controller.syncStyle();

                expect(() => controller.conceal()).not.toThrow();
                expect(observers[0].disconnect).toHaveBeenCalled();
            });

            it('has nothing to reconcile before a wrapper exists', () => {
                const controller = createController();
                expect(() => (controller as any).reconcileContainer()).not.toThrow();
                expect(controller.container).toBe(document.body);
            });
        });
    });
});

// Lifecycle fixes, pinned through the public embed API so they hold
// regardless of how the embed delegates to the controller.
describe('pre-render lifecycle through the embed', () => {
    let observers: ObserverMock[];
    const originalResizeObserver = (window as any).ResizeObserver;

    const preRenderAndShow = async (id: string) => {
        // A host of its own rather than wiping the body: the previous test's
        // iframe can still have a postMessage in flight.
        const hostElement = document.createElement('div');
        hostElement.id = `${id}-host`;
        document.body.appendChild(hostElement);
        const embed = new LiveboardEmbed(`#${id}-host`, {
            preRenderId: id,
            liveboardId: 'lb-id',
        });
        await embed.preRender();
        await waitFor(() => !!document.getElementById(`tsEmbed-pre-render-child-${id}`));
        await embed.showPreRender();
        // destroy() removes the wrapper before posting DestroyEmbed, and
        // jsdom throws on a post to a detached iframe where a browser drops
        // it. These tests are about layout cleanup, not the post.
        jest.spyOn(embed, 'trigger').mockResolvedValue(undefined);
        return embed;
    };

    beforeAll(() => {
        jest.spyOn(authInstance, 'postLoginService').mockResolvedValue(undefined);
        init({ thoughtSpotHost: 'tshost', authType: AuthType.None });
    });

    beforeEach(() => {
        observers = [];
        (window as any).ResizeObserver = jest.fn().mockImplementation(() => {
            const observer = { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
            observers.push(observer);
            return observer;
        });
    });

    afterAll(() => {
        (window as any).ResizeObserver = originalResizeObserver;
        jest.restoreAllMocks();
    });

    it('hidePreRender can be called twice after a show', async () => {
        const embed = await preRenderAndShow('lifecycle-double-hide');
        embed.hidePreRender();

        expect(() => embed.hidePreRender()).not.toThrow();
        embed.destroy();
    });

    it('destroy disconnects the resize observer a show created', async () => {
        const embed = await preRenderAndShow('lifecycle-destroy-observer');
        expect(observers).toHaveLength(1);

        embed.destroy();

        expect(observers[0].disconnect).toHaveBeenCalled();
    });
});
