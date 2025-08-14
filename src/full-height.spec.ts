import { FullHeight } from './full-height';
import { AppEmbed, AppViewConfig } from './embed/app';
import { LiveboardEmbed, LiveboardViewConfig } from './embed/liveboard';
import { init } from './index';
import { AuthType, EmbedEvent, HostEvent } from './types';
import {
  executeAfterWait,
  getDocumentBody,
  getIFrameSrc,
  getRootEl,
  defaultParams,
} from './test/test-utils';
import { TsEmbed } from './embed/ts-embed';
import * as auth from './auth';

const thoughtSpotHost = 'tshost';
const liveboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const vizId = '6e73f724-660e-11eb-ae93-0242ac130002';

const defaultViewConfig = {
  frameParams: {
    width: 1280,
    height: 720,
  },
};

beforeAll(() => {
  init({
    thoughtSpotHost,
    authType: AuthType.None,
  });
  jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve({}));
});

describe('FullHeight functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = getDocumentBody();
  });

  describe('Event registration and height management', () => {
    test('should register event handler to adjust iframe height for LiveboardEmbed', async () => {
      const onSpy = jest.spyOn(LiveboardEmbed.prototype, 'on');
      const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
        ...defaultViewConfig,
        fullHeight: true,
        liveboardId,
        vizId,
      } as LiveboardViewConfig);

      liveboardEmbed.render();

      executeAfterWait(() => {
        expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedHeight, expect.anything());
      });
    });

    test('should register event handler to adjust iframe height for AppEmbed', async () => {
      const onSpy = jest.spyOn(AppEmbed.prototype, 'on');
      const appEmbed = new AppEmbed(getRootEl(), {
        ...defaultViewConfig,
        fullHeight: true,
        lazyLoadingForFullHeight: true,
      } as AppViewConfig);

      await appEmbed.render();

      // Verify event handlers were registered
      await executeAfterWait(() => {
        expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedHeight, expect.anything());
        expect(onSpy).toHaveBeenCalledWith(EmbedEvent.RouteChange, expect.anything());
        expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedIframeCenter, expect.anything());
        expect(onSpy).toHaveBeenCalledWith(EmbedEvent.RequestVisibleEmbedCoordinates, expect.anything());
      }, 100);
    });
  });

  describe('IFrame height management for different paths', () => {
    test('should not call setIFrameHeight if currentPath starts with "/embed/viz/" (LiveboardEmbed)', () => {
      const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
        ...defaultViewConfig,
        fullHeight: true,
        liveboardId,
      } as LiveboardViewConfig);

      liveboardEmbed.render();

      // Access the fullHeightClient and spy on its setIFrameHeight method
      const fullHeightClient = (liveboardEmbed as any).fullHeightClient;
      const spySetIFrameHeight = jest.spyOn(fullHeightClient, 'setIFrameHeight' as any);

      // Simulate the route change event handler
      fullHeightClient.setIframeHeightForNonEmbedLiveboard({
        data: { currentPath: '/embed/viz/' },
        type: 'Route',
      });

      expect(spySetIFrameHeight).not.toHaveBeenCalled();
    });

    test('should not call setIFrameHeight if currentPath starts with "/embed/insights/viz/" (LiveboardEmbed)', () => {
      const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
        ...defaultViewConfig,
        fullHeight: true,
        liveboardId,
      } as LiveboardViewConfig);

      liveboardEmbed.render();

      // Access the fullHeightClient and spy on its setIFrameHeight method
      const fullHeightClient = (liveboardEmbed as any).fullHeightClient;
      const spySetIFrameHeight = jest.spyOn(fullHeightClient, 'setIFrameHeight' as any);

      // Simulate the route change event handler
      fullHeightClient.setIframeHeightForNonEmbedLiveboard({
        data: { currentPath: '/embed/insights/viz/' },
        type: 'Route',
      });

      expect(spySetIFrameHeight).not.toHaveBeenCalled();
    });

    test('should call setIFrameHeight if currentPath starts with "/some/other/path/" (LiveboardEmbed)', () => {
      const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
        ...defaultViewConfig,
        fullHeight: true,
        liveboardId,
      } as LiveboardViewConfig);

      liveboardEmbed.render();

      // Set up the iframe
      const mockIFrame = document.createElement('iframe');
      (liveboardEmbed as any).iFrame = mockIFrame;

      // Access the fullHeightClient and spy on its setIFrameHeight method
      const fullHeightClient = (liveboardEmbed as any).fullHeightClient;
      const spySetIFrameHeight = jest.spyOn(fullHeightClient, 'setIFrameHeight' as any);

      // Simulate the route change event handler
      fullHeightClient.setIframeHeightForNonEmbedLiveboard({
        data: { currentPath: '/some/other/path/' },
        type: 'Route',
      });

      expect(spySetIFrameHeight).toHaveBeenCalled();
    });

    test('should not call setIFrameHeight if currentPath starts with "/embed/viz/" (AppEmbed)', () => {
      const appEmbed = new AppEmbed(getRootEl(), {
        ...defaultViewConfig,
        fullHeight: true,
      } as AppViewConfig);

      appEmbed.render();

      // Access the fullHeightClient and spy on its setIFrameHeight method
      const fullHeightClient = (appEmbed as any).fullHeightClient;
      const spySetIFrameHeight = jest.spyOn(fullHeightClient, 'setIFrameHeight' as any);

      // Simulate the route change event handler
      fullHeightClient.setIframeHeightForNonEmbedLiveboard({
        data: { currentPath: '/embed/viz/' },
        type: 'Route',
      });

      expect(spySetIFrameHeight).not.toHaveBeenCalled();
    });

    test('should not call setIFrameHeight if currentPath starts with "/embed/insights/viz/" (AppEmbed)', () => {
      const appEmbed = new AppEmbed(getRootEl(), {
        ...defaultViewConfig,
        fullHeight: true,
      } as AppViewConfig);

      appEmbed.render();

      // Access the fullHeightClient and spy on its setIFrameHeight method
      const fullHeightClient = (appEmbed as any).fullHeightClient;
      const spySetIFrameHeight = jest.spyOn(fullHeightClient, 'setIFrameHeight' as any);

      // Simulate the route change event handler
      fullHeightClient.setIframeHeightForNonEmbedLiveboard({
        data: { currentPath: '/embed/insights/viz/' },
        type: 'Route',
      });

      expect(spySetIFrameHeight).not.toHaveBeenCalled();
    });

    test('should call setIFrameHeight if currentPath starts with "/some/other/path/" (AppEmbed)', () => {
      const appEmbed = new AppEmbed(getRootEl(), {
        ...defaultViewConfig,
        fullHeight: true,
      } as AppViewConfig);

      appEmbed.render();

      // Set up the iframe
      const mockIFrame = document.createElement('iframe');
      (appEmbed as any).iFrame = mockIFrame;

      // Access the fullHeightClient and spy on its setIFrameHeight method
      const fullHeightClient = (appEmbed as any).fullHeightClient;
      const spySetIFrameHeight = jest.spyOn(fullHeightClient, 'setIFrameHeight' as any);

      // Simulate the route change event handler
      fullHeightClient.setIframeHeightForNonEmbedLiveboard({
        data: { currentPath: '/some/other/path/' },
        type: 'Route',
      });

      expect(spySetIFrameHeight).toHaveBeenCalled();
    });
  });

  describe('LazyLoadingForFullHeight functionality', () => {
    let mockIFrame: HTMLIFrameElement;

    beforeEach(() => {
      mockIFrame = document.createElement('iframe');
      mockIFrame.getBoundingClientRect = jest.fn().mockReturnValue({
        top: 100,
        left: 150,
        bottom: 600,
        right: 800,
        width: 650,
        height: 500,
      });
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'iframe') {
          return mockIFrame;
        }
        return document.createElement(tagName);
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('LiveboardEmbed lazy loading', () => {
      test('should set lazyLoadingMargin parameter when provided', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
          lazyLoadingMargin: '100px 0px',
        } as LiveboardViewConfig);

        await liveboardEmbed.render();

        await executeAfterWait(() => {
          const iframeSrc = getIFrameSrc();
          expect(iframeSrc).toContain('isLazyLoadingForEmbedEnabled=true');
          expect(iframeSrc).toContain('isFullHeightPinboard=true');
          expect(iframeSrc).toContain('rootMarginForLazyLoad=100px%200px');
        }, 100);
      });

      test('should set isLazyLoadingForEmbedEnabled=true when both fullHeight and lazyLoadingForFullHeight are enabled', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as LiveboardViewConfig);

        await liveboardEmbed.render();

        await executeAfterWait(() => {
          const iframeSrc = getIFrameSrc();
          expect(iframeSrc).toContain('isLazyLoadingForEmbedEnabled=true');
          expect(iframeSrc).toContain('isFullHeightPinboard=true');
        }, 100);
      });

      test('should not set lazyLoadingForEmbed when lazyLoadingForFullHeight is enabled but fullHeight is false', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: false,
          lazyLoadingForFullHeight: true,
        } as LiveboardViewConfig);

        await liveboardEmbed.render();

        await executeAfterWait(() => {
          const iframeSrc = getIFrameSrc();
          expect(iframeSrc).not.toContain('isLazyLoadingForEmbedEnabled=true');
          expect(iframeSrc).not.toContain('isFullHeightPinboard=true');
        }, 100);
      });

      test('should not set isLazyLoadingForEmbedEnabled when fullHeight is true but lazyLoadingForFullHeight is false', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: false,
        } as LiveboardViewConfig);

        await liveboardEmbed.render();

        await executeAfterWait(() => {
          const iframeSrc = getIFrameSrc();
          expect(iframeSrc).not.toContain('isLazyLoadingForEmbedEnabled=true');
          expect(iframeSrc).toContain('isFullHeightPinboard=true');
        }, 100);
      });

      test('should register event handlers to adjust iframe height', async () => {
        const onSpy = jest.spyOn(LiveboardEmbed.prototype, 'on');

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as LiveboardViewConfig);

        await liveboardEmbed.render();

        await executeAfterWait(() => {
          expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedHeight, expect.anything());
          expect(onSpy).toHaveBeenCalledWith(EmbedEvent.RouteChange, expect.anything());
          expect(onSpy).toHaveBeenCalledWith(EmbedEvent.EmbedIframeCenter, expect.anything());
          expect(onSpy).toHaveBeenCalledWith(EmbedEvent.RequestVisibleEmbedCoordinates, expect.anything());
        }, 100);
      });

      test('should send correct visible data when RequestVisibleEmbedCoordinates is triggered', async () => {
        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as LiveboardViewConfig);

        const mockTrigger = jest.spyOn(liveboardEmbed, 'trigger');

        await liveboardEmbed.render();

        // Access the fullHeightClient and call the method
        const fullHeightClient = (liveboardEmbed as any).fullHeightClient;
        fullHeightClient.sendFullHeightLazyLoadData();

        expect(mockTrigger).toHaveBeenCalledWith(HostEvent.VisibleEmbedCoordinates, {
          top: 0,
          height: 500,
          left: 0,
          width: 650,
        });
      });

      test('should calculate correct visible data for partially visible full height element', async () => {
        mockIFrame.getBoundingClientRect = jest.fn().mockReturnValue({
          top: -50,
          left: -30,
          bottom: 700,
          right: 1024,
          width: 1054,
          height: 750,
        });

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as LiveboardViewConfig);

        const mockTrigger = jest.spyOn(liveboardEmbed, 'trigger');

        await liveboardEmbed.render();

        // Access the fullHeightClient and call the method
        const fullHeightClient = (liveboardEmbed as any).fullHeightClient;
        fullHeightClient.sendFullHeightLazyLoadData();

        expect(mockTrigger).toHaveBeenCalledWith(HostEvent.VisibleEmbedCoordinates, {
          top: 50,
          height: 700,
          left: 30,
          width: 1024,
        });
      });

      test('should add window event listeners for resize and scroll when fullHeight and lazyLoadingForFullHeight are enabled', async () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as LiveboardViewConfig);

        await liveboardEmbed.render();

        // Wait for the post-render events to be registered
        await executeAfterWait(() => {
          expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.anything());
          expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.anything(), true);
        }, 100);

        addEventListenerSpy.mockRestore();
      });

      test('should remove window event listeners on destroy when fullHeight and lazyLoadingForFullHeight are enabled', async () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as LiveboardViewConfig);

        await liveboardEmbed.render();
        liveboardEmbed.destroy();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.anything());
        expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.anything());

        removeEventListenerSpy.mockRestore();
      });

      test('should handle RequestVisibleEmbedCoordinates event and respond with correct data', async () => {
        // Mock the iframe element
        mockIFrame.getBoundingClientRect = jest.fn().mockReturnValue({
          top: 100,
          left: 150,
          bottom: 600,
          right: 800,
          width: 650,
          height: 500,
        });
        Object.defineProperty(mockIFrame, 'scrollHeight', { value: 500 });

        const liveboardEmbed = new LiveboardEmbed(getRootEl(), {
          ...defaultViewConfig,
          liveboardId,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as LiveboardViewConfig);

        // Set the iframe before render
        (liveboardEmbed as any).iFrame = mockIFrame;

        await liveboardEmbed.render();

        // Create a mock responder function
        const mockResponder = jest.fn();

        // Access the fullHeightClient and call the handler directly
        const fullHeightClient = (liveboardEmbed as any).fullHeightClient;
        fullHeightClient.requestVisibleEmbedCoordinatesHandler({}, mockResponder);

        // Verify the responder was called with the correct data
        expect(mockResponder).toHaveBeenCalledWith({
          type: EmbedEvent.RequestVisibleEmbedCoordinates,
          data: {
            top: 0,
            height: 500,
            left: 0,
            width: 650,
          },
        });
      });
    });

    describe('AppEmbed lazy loading', () => {
      test('should set lazyLoadingMargin parameter when provided', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
          lazyLoadingMargin: '100px 0px',
        } as AppViewConfig);

        await appEmbed.render();

        await executeAfterWait(() => {
          const iframeSrc = getIFrameSrc();
          expect(iframeSrc).toContain('isLazyLoadingForEmbedEnabled=true');
          expect(iframeSrc).toContain('isFullHeightPinboard=true');
          expect(iframeSrc).toContain('rootMarginForLazyLoad=100px%200px');
        }, 100);
      });

      test('should set isLazyLoadingForEmbedEnabled=true when both fullHeight and lazyLoadingForFullHeight are enabled', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as AppViewConfig);

        await appEmbed.render();

        // Wait for iframe initialization and URL parameters to be set
        await executeAfterWait(() => {
          const iframeSrc = appEmbed.getIFrameSrc();
          expect(iframeSrc).toContain('isLazyLoadingForEmbedEnabled=true');
          expect(iframeSrc).toContain('isFullHeightPinboard=true');
        }, 100);
      });

      test('should not set lazyLoadingForEmbed when lazyLoadingForFullHeight is enabled but fullHeight is false', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: false,
          lazyLoadingForFullHeight: true,
        } as AppViewConfig);

        // Wait for render to complete
        await appEmbed.render();

        // Wait for iframe initialization and URL parameters to be set
        await executeAfterWait(() => {
          const iframeSrc = getIFrameSrc();
          expect(iframeSrc).not.toContain('isLazyLoadingForEmbedEnabled=true');
          expect(iframeSrc).not.toContain('isFullHeightPinboard=true');
        }, 100);
      });

      test('should not set isLazyLoadingForEmbedEnabled when fullHeight is true but lazyLoadingForFullHeight is false', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
          lazyLoadingForFullHeight: false,
        } as AppViewConfig);

        // Wait for render to complete
        await appEmbed.render();

        // Wait for iframe initialization and URL parameters to be set
        await executeAfterWait(() => {
          const iframeSrc = getIFrameSrc();
          expect(iframeSrc).not.toContain('isLazyLoadingForEmbedEnabled=true');
          expect(iframeSrc).toContain('isFullHeightPinboard=true');
        }, 100);
      });

      test('should register RequestFullHeightLazyLoadData event handler when fullHeight is enabled', async () => {
        const onSpy = jest.spyOn(AppEmbed.prototype, 'on');

        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
        } as AppViewConfig);

        await appEmbed.render();

        expect(onSpy).toHaveBeenCalledWith(EmbedEvent.RequestVisibleEmbedCoordinates, expect.any(Function));

        onSpy.mockRestore();
      });

      test('should send correct visible data when RequestFullHeightLazyLoadData is triggered', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as AppViewConfig);

        const mockTrigger = jest.spyOn(appEmbed, 'trigger');

        await appEmbed.render();

        // Access the fullHeightClient and call the method
        const fullHeightClient = (appEmbed as any).fullHeightClient;
        fullHeightClient.sendFullHeightLazyLoadData();

        expect(mockTrigger).toHaveBeenCalledWith(HostEvent.VisibleEmbedCoordinates, {
          top: 0,
          height: 500,
          left: 0,
          width: 650,
        });
      });

      test('should calculate correct visible data for partially visible full height element', async () => {
        // Mock iframe partially clipped from top and left
        mockIFrame.getBoundingClientRect = jest.fn().mockReturnValue({
          top: -50,
          left: -30,
          bottom: 700,
          right: 1024,
          width: 1054,
          height: 750,
        });

        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as AppViewConfig);

        const mockTrigger = jest.spyOn(appEmbed, 'trigger');

        await appEmbed.render();

        // Access the fullHeightClient and call the method
        const fullHeightClient = (appEmbed as any).fullHeightClient;
        fullHeightClient.sendFullHeightLazyLoadData();

        expect(mockTrigger).toHaveBeenCalledWith(HostEvent.VisibleEmbedCoordinates, {
          top: 50,   // 50px clipped from top
          height: 700, // visible height (from 0 to 700)
          left: 30,  // 30px clipped from left
          width: 1024, // visible width (from 0 to 1024)
        });
      });

      test('should add window event listeners for resize and scroll when fullHeight and lazyLoadingForFullHeight are enabled', async () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as AppViewConfig);

        await appEmbed.render();

        // Wait for the post-render events to be registered
        await executeAfterWait(() => {
          expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
          expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
        }, 100);

        addEventListenerSpy.mockRestore();
      });

      test('should remove window event listeners on destroy when fullHeight and lazyLoadingForFullHeight are enabled', async () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as AppViewConfig);

        await appEmbed.render();
        appEmbed.destroy();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

        removeEventListenerSpy.mockRestore();
      });

      test('should handle RequestVisibleEmbedCoordinates event and respond with correct data', async () => {
        // Mock the iframe element
        mockIFrame.getBoundingClientRect = jest.fn().mockReturnValue({
          top: 100,
          left: 150,
          bottom: 600,
          right: 800,
          width: 650,
          height: 500,
        });
        Object.defineProperty(mockIFrame, 'scrollHeight', { value: 500 });

        const appEmbed = new AppEmbed(getRootEl(), {
          ...defaultViewConfig,
          fullHeight: true,
          lazyLoadingForFullHeight: true,
        } as AppViewConfig);

        // Set the iframe before render
        (appEmbed as any).iFrame = mockIFrame;

        await appEmbed.render();

        // Create a mock responder function
        const mockResponder = jest.fn();

        // Access the fullHeightClient and call the handler directly
        const fullHeightClient = (appEmbed as any).fullHeightClient;
        fullHeightClient.requestVisibleEmbedCoordinatesHandler({}, mockResponder);

        // Verify the responder was called with the correct data
        expect(mockResponder).toHaveBeenCalledWith({
          type: EmbedEvent.RequestVisibleEmbedCoordinates,
          data: {
            top: 0,
            height: 500,
            left: 0,
            width: 650,
          },
        });
      });
    });
  });
}); 