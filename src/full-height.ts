// Communicate with the embed 
// 

import { BaseViewConfig, EmbedEvent, FullHeightViewConfig, HostEvent, MessageCallback, MessagePayload, Param } from "./types";
import { calculateElementCenter, calculateVisibleElementData, getCssDimension } from "./utils";
import { logger } from "./utils/logger";

interface FullHeightConfig {
  getIframe: () => HTMLIFrameElement;
  onEmbedEvent: (event: EmbedEvent, callback: MessageCallback) => void;
  getViewConfig: () => FullHeightViewConfig & BaseViewConfig;
  triggerHostEvent: (event: HostEvent, data: any) => Promise<any>;
}


export class FullHeight {

  private onEmbedMessage: FullHeightConfig['onEmbedEvent'];
  private getViewConfig: FullHeightConfig['getViewConfig'];
  private triggerHostEvent: FullHeightConfig['triggerHostEvent'];
  private getIframe: FullHeightConfig['getIframe'];
  private defaultHeight: string | number = '100%';

  constructor(fullHeightConfig: FullHeightConfig) {
    this.getIframe = fullHeightConfig.getIframe;
    this.onEmbedMessage = fullHeightConfig.onEmbedEvent;
    this.getViewConfig = fullHeightConfig.getViewConfig;
    this.triggerHostEvent = fullHeightConfig.triggerHostEvent;
    this.defaultHeight = this.getViewConfig().defaultHeight || this.defaultHeight;
  }
  /**
  * Sets the height of the iframe
  * @param height The height in pixels
  */
  protected setIFrameHeight(height: number | string): void {
    this.getIframe().style.height = getCssDimension(height);
  }
  /**
 * Set the iframe height as per the computed height received
 * from the ThoughtSpot app.
 * @param data The event payload
 */
  private updateIFrameHeight = (data: MessagePayload) => {
    const viewConfig = this.getViewConfig();
    this.setIFrameHeight(Math.max(data.data, viewConfig.defaultHeight));
    this.sendFullHeightLazyLoadData();
  };

  private sendFullHeightLazyLoadData = () => {
    const data = calculateVisibleElementData(this.getIframe());
    this.triggerHostEvent(HostEvent.VisibleEmbedCoordinates, data);
  }
  private setIframeHeightForNonEmbedLiveboard = (data: MessagePayload) => {
    const viewConfig = this.getViewConfig();
    const { height: frameHeight } = viewConfig.frameParams || {};

    const liveboardRelatedRoutes = [
      '/pinboard/',
      '/insights/pinboard/',
      '/schedules/',
      '/embed/viz/',
      '/embed/insights/viz/',
      '/liveboard/',
      '/insights/liveboard/',
      '/tsl-editor/PINBOARD_ANSWER_BOOK/',
      '/import-tsl/PINBOARD_ANSWER_BOOK/',
    ];

    if (liveboardRelatedRoutes.some((path) => data.data.currentPath.startsWith(path))) {
      // Ignore the height reset of the frame, if the navigation is
      // only within the liveboard page.
      return;
    }
    this.setIFrameHeight(frameHeight || viewConfig.defaultHeight);
  };


  private embedIframeCenter = (data: MessagePayload, responder: any) => {
    const obj = calculateElementCenter(this.getIframe());
    responder({ type: EmbedEvent.EmbedIframeCenter, data: obj });
  };


  /**
   * This is a handler for the RequestVisibleEmbedCoordinates event.
   * It is used to send the visible coordinates data to the host application.
   * @param data The event payload
   * @param responder The responder function
   */
  private requestVisibleEmbedCoordinatesHandler = (data: MessagePayload, responder: any) => {
    logger.info('Sending RequestVisibleEmbedCoordinates', data);
    const visibleCoordinatesData = calculateVisibleElementData(this.getIframe());
    responder({ type: EmbedEvent.RequestVisibleEmbedCoordinates, data: visibleCoordinatesData });
  }
  private registerLazyLoadEvents() {
    const viewConfig = this.getViewConfig();
    if (viewConfig.fullHeight && viewConfig.lazyLoadingForFullHeight) {
      // TODO: Use passive: true, install modernizr to check for passive
      window.addEventListener('resize', this.sendFullHeightLazyLoadData);
      window.addEventListener('scroll', this.sendFullHeightLazyLoadData, true);
    }
  }

  private unregisterLazyLoadEvents() {
    const viewConfig = this.getViewConfig();
    if (viewConfig.fullHeight && viewConfig.lazyLoadingForFullHeight) {
      window.removeEventListener('resize', this.sendFullHeightLazyLoadData);
      window.removeEventListener('scroll', this.sendFullHeightLazyLoadData);
    }
  }


  init() {
    this.registerLazyLoadEvents();
    this.onEmbedMessage(EmbedEvent.RouteChange, this.setIframeHeightForNonEmbedLiveboard);
    this.onEmbedMessage(EmbedEvent.EmbedHeight, this.updateIFrameHeight);
    this.onEmbedMessage(EmbedEvent.EmbedIframeCenter, this.embedIframeCenter);
    this.onEmbedMessage(EmbedEvent.RequestVisibleEmbedCoordinates, this.requestVisibleEmbedCoordinatesHandler);
  }

  setParams(params: any) {
    const viewConfig = this.getViewConfig();
    const { lazyLoadingForFullHeight, lazyLoadingMargin } = viewConfig;
    params[Param.fullHeight] = true;

    if (lazyLoadingForFullHeight) {
      params[Param.IsLazyLoadingForEmbedEnabled] = true;
      params[Param.RootMarginForLazyLoad] = viewConfig.lazyLoadingMargin;
    }
  }

  cleanup() {
    this.unregisterLazyLoadEvents();
  }

}