import { DefaultAppInitData } from '../types';
import type { SpotterSidebarViewConfig } from './conversation';
import type { VisualizationOverrides } from '../types';
/**
 * Resolves enablePastConversationsSidebar with
 * spotterSidebarConfig taking precedence over the
 * standalone flag.
 */
export declare const resolveEnablePastConversationsSidebar: (params: {
    spotterSidebarConfigValue?: boolean;
    standaloneValue?: boolean;
}) => boolean | undefined;
export declare function buildSpotterSidebarAppInitData<T extends DefaultAppInitData>(defaultAppInitData: T, viewConfig: {
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    enablePastConversationsSidebar?: boolean;
    visualOverrides?: VisualizationOverrides;
}, handleError: (err: any) => void): T & {
    embedParams?: {
        spotterSidebarConfig?: SpotterSidebarViewConfig;
        visualOverridesParams?: VisualizationOverrides | null;
    };
};
//# sourceMappingURL=spotter-utils.d.ts.map