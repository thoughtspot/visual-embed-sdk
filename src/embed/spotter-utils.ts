import isEmpty from 'lodash/isEmpty';
import { DefaultAppInitData, ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { validateHttpUrl } from '../utils';
import { ERROR_MESSAGE } from '../errors';
import type {
    SpotterSidebarViewConfig,
    SpotterShareConversationConfig,
    SpotterChatViewConfig,
    StarterPromptsConfig,
    SpotterAnalystConfig,
    SpotterUsageLimitConfig,
} from './conversation';
import type { VisualizationOverrides } from '../types';

/**
 * Resolves enablePastConversationsSidebar with
 * spotterSidebarConfig taking precedence over the
 * standalone flag.
 */
export const resolveEnablePastConversationsSidebar = (params: {
    spotterSidebarConfigValue?: boolean;
    standaloneValue?: boolean;
}): boolean | undefined => (
    params.spotterSidebarConfigValue !== undefined
        ? params.spotterSidebarConfigValue
        : params.standaloneValue
);

// Omits the key when empty, keeping APP_INIT as-is for embeds that set none.
export function withEmbedParams<T extends DefaultAppInitData, P extends Record<string, unknown>>(
    initData: T,
    embedParams: P,
): T & { embedParams?: P } {
    if (isEmpty(embedParams)) return initData;
    return {
        ...initData,
        embedParams: {
            ...((initData as T & { embedParams?: Record<string, unknown> }).embedParams || {}),
            ...embedParams,
        },
    };
}

export function buildSpotterSidebarAppInitData(
    viewConfig: {
        spotterSidebarConfig?: SpotterSidebarViewConfig;
        enablePastConversationsSidebar?: boolean;
        visualOverrides?: VisualizationOverrides;
    },
    handleError: (err: any) => void,
): {
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    visualOverridesParams?: VisualizationOverrides | null;
    enableSpotterInstructionAndMoreSettings?: boolean;
} {
    const { spotterSidebarConfig, enablePastConversationsSidebar, visualOverrides } = viewConfig;

    const resolvedEnablePastConversations = resolveEnablePastConversationsSidebar({
        spotterSidebarConfigValue: spotterSidebarConfig?.enablePastConversationsSidebar,
        standaloneValue: enablePastConversationsSidebar,
    });

    const visualOverridesParams = visualOverrides !== undefined
        ? { visualOverridesParams: visualOverrides }
        : {};

    const hasConfig = spotterSidebarConfig || resolvedEnablePastConversations !== undefined;
    if (!hasConfig) return visualOverridesParams;

    // The app reads enableSpotterInstructionAndMoreSettings from the top level
    // of embedParams, so lift it out of the sidebar config.
    const {
        enableSpotterInstructionAndMoreSettings,
        ...sidebarConfigRest
    } = spotterSidebarConfig || {};

    const resolvedSidebarConfig: SpotterSidebarViewConfig = {
        ...sidebarConfigRest,
        ...(resolvedEnablePastConversations !== undefined && {
            enablePastConversationsSidebar: resolvedEnablePastConversations,
        }),
    };

    if (resolvedSidebarConfig.spotterDocumentationUrl !== undefined) {
        const [isValid, validationError] = validateHttpUrl(resolvedSidebarConfig.spotterDocumentationUrl);
        if (!isValid) {
            handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                code: EmbedErrorCodes.INVALID_URL,
                error: validationError?.message || ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
            });
            delete resolvedSidebarConfig.spotterDocumentationUrl;
        }
    }

    return {
        spotterSidebarConfig: resolvedSidebarConfig,
        ...(enableSpotterInstructionAndMoreSettings !== undefined
            ? { enableSpotterInstructionAndMoreSettings }
            : {}),
        ...visualOverridesParams,
    };
}

export function buildSpotterShareConversationAppInitData(
    viewConfig: { spotterShareConversationConfig?: SpotterShareConversationConfig },
): { spotterShareConversationConfig?: SpotterShareConversationConfig } {
    const { spotterShareConversationConfig } = viewConfig;
    return spotterShareConversationConfig ? { spotterShareConversationConfig } : {};
}

export function buildStarterPromptsAppInitData(
    viewConfig: { spotterChatConfig?: SpotterChatViewConfig },
): { starterPrompts?: StarterPromptsConfig } {
    const starterPrompts = viewConfig.spotterChatConfig?.starterPrompts;
    return starterPrompts ? { starterPrompts } : {};
}

export function buildSpotterAnalystAppInitData(
    viewConfig: { spotterAnalystConfig?: SpotterAnalystConfig },
): { spotterAnalystConfig?: SpotterAnalystConfig } {
    const { spotterAnalystConfig } = viewConfig;
    return spotterAnalystConfig?.analystId ? { spotterAnalystConfig } : {};
}

export function buildSpotterUsageLimitAppInitData(
    viewConfig: { spotterUsageLimitConfig?: SpotterUsageLimitConfig },
): { spotterUsageLimitConfig?: SpotterUsageLimitConfig } {
    const { spotterUsageLimitConfig } = viewConfig;
    return isEmpty(spotterUsageLimitConfig) ? {} : { spotterUsageLimitConfig };
}

/**
 * The Spotter experience version to load in the embedded view.
 * @version SDK: 1.53.0 | ThoughtSpot Cloud: 26.11.0.cl
 * @group Embed components
 */
export enum SpotterExperienceVersion {
    /**
     * The Spotter experience version introduced in ThoughtSpot 26.11.
     */
    SPOTTER_2026_11 = 'spotter_2026_11',
}
