import { ContextType, HostEvent } from '../types';
/**
 * Reloads the ThoughtSpot iframe.
 * @param iFrame
 */
export declare const reload: (iFrame: HTMLIFrameElement) => void;
export declare const TRIGGER_TIMEOUT = 30000;
/**
 *
 * @param iFrame
 * @param messageType
 * @param thoughtSpotHost
 * @param data
 * @param context
 */
export declare function processTrigger(iFrame: HTMLIFrameElement, messageType: HostEvent, thoughtSpotHost: string, data: any, context?: ContextType): Promise<any>;
//# sourceMappingURL=processTrigger.d.ts.map