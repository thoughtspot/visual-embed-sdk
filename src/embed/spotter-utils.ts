import { DefaultAppInitData, ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { validateHttpUrl } from '../utils';
import { ERROR_MESSAGE } from '../errors';
import type { SpotterSidebarViewConfig } from './conversation';

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

export function buildSpotterSidebarAppInitData<T extends DefaultAppInitData>(
    defaultAppInitData: T,
    viewConfig: {
        spotterSidebarConfig?: SpotterSidebarViewConfig;
        enablePastConversationsSidebar?: boolean;
    },
    handleError: (err: any) => void,
): T & { embedParams?: { spotterSidebarConfig?: SpotterSidebarViewConfig } } {
    const { spotterSidebarConfig, enablePastConversationsSidebar } = viewConfig;

    const resolvedEnablePastConversations = resolveEnablePastConversationsSidebar({
        spotterSidebarConfigValue: spotterSidebarConfig?.enablePastConversationsSidebar,
        standaloneValue: enablePastConversationsSidebar,
    });

    const hasConfig = spotterSidebarConfig || resolvedEnablePastConversations !== undefined;
    if (!hasConfig) return defaultAppInitData;

    const resolvedSidebarConfig: SpotterSidebarViewConfig = {
        ...spotterSidebarConfig,
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
        ...defaultAppInitData,
        embedParams: {
            ...((defaultAppInitData as any).embedParams || {}),
            spotterSidebarConfig: resolvedSidebarConfig,
        },
    };
}
