import { DefaultAppInitData, ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { validateHttpUrl } from '../utils';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
import type { SpotterSidebarViewConfig, SpotterShareConversationConfig, SpotterEmbedViewConfig } from './conversation';
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

export function buildSpotterSidebarAppInitData<T extends DefaultAppInitData>(
    defaultAppInitData: T,
    viewConfig: {
        spotterSidebarConfig?: SpotterSidebarViewConfig;
        enablePastConversationsSidebar?: boolean;
        visualOverrides?: VisualizationOverrides;
    },
    handleError: (err: any) => void,
): T & {
    embedParams?: {
        spotterSidebarConfig?: SpotterSidebarViewConfig;
        visualOverridesParams?: VisualizationOverrides | null;
    };
} {
    const { spotterSidebarConfig, enablePastConversationsSidebar, visualOverrides } = viewConfig;

    const resolvedEnablePastConversations = resolveEnablePastConversationsSidebar({
        spotterSidebarConfigValue: spotterSidebarConfig?.enablePastConversationsSidebar,
        standaloneValue: enablePastConversationsSidebar,
    });

    const hasConfig = spotterSidebarConfig || resolvedEnablePastConversations !== undefined;
    if (!hasConfig) {
        if (visualOverrides === undefined) {
            return defaultAppInitData;
        }
        return {
            ...defaultAppInitData,
            embedParams: { visualOverridesParams: visualOverrides },
        };
    }

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
            ...(visualOverrides !== undefined ? { visualOverridesParams: visualOverrides } : {}),
        },
    };
}

export function buildSpotterShareConversationAppInitData<T extends DefaultAppInitData>(
    initData: T,
    viewConfig: { spotterShareConversationConfig?: SpotterShareConversationConfig },
): T & { embedParams?: { spotterShareConversationConfig?: SpotterShareConversationConfig } } {
    const { spotterShareConversationConfig } = viewConfig;
    if (!spotterShareConversationConfig) return initData;
    return {
        ...initData,
        embedParams: {
            ...((initData as T & { embedParams?: Record<string, unknown> }).embedParams || {}),
            spotterShareConversationConfig,
        },
    };
}

/**
 * Whether a `SpotterEmbedViewConfig` option behaves the same way across
 * Spotter versions. `Spotter3` is the baseline and is always `'supported'`
 * for every option, so it isn't tracked here.
 * - `supported`: confirmed to work the same on non-Spotter3 versions.
 * - `unsupported`: confirmed to NOT work (or work differently) on
 *   non-Spotter3 versions.
 * - `unconfirmed`: not yet verified against non-Spotter3 versions.
 */
export type SpotterOptionSupportStatus = 'supported' | 'unsupported' | 'unconfirmed';

/**
 * Central capability matrix for `SpotterEmbedViewConfig` options against
 * non-Spotter3 `spotterVersion` values (`SpotterX`, `Latest`).
 *
 * Every option currently ships as `'unconfirmed'` — SpotterX capability
 * parity with Spotter3 has not been confirmed yet. Flip individual entries
 * to `'supported'`/`'unsupported'` as parity is confirmed; no other code
 * needs to change when this map is updated.
 *
 * Keys are `SpotterEmbedViewConfig` field names, or a dot-path for fields
 * nested inside a config object (e.g. `spotterChatConfig.enableStarterPrompts`).
 */
export const SPOTTER_OPTION_VERSION_SUPPORT: Record<string, SpotterOptionSupportStatus> = {
    disableSourceSelection: 'unconfirmed',
    hideSourceSelection: 'unconfirmed',
    showSpotterLimitations: 'unconfirmed',
    hideSampleQuestions: 'unconfirmed',
    runtimeFilters: 'unconfirmed',
    runtimeParameters: 'unconfirmed',
    updatedSpotterChatPrompt: 'unconfirmed',
    defaultQueryMode: 'unconfirmed',
    enableStopAnswerGenerationEmbed: 'unconfirmed',
    spotterSidebarConfig: 'unconfirmed',
    'spotterChatConfig.hideToolResponseCardBranding': 'unconfirmed',
    'spotterChatConfig.toolResponseCardBrandingLabel': 'unconfirmed',
    'spotterChatConfig.spotterFileUploadEnabled': 'unconfirmed',
    'spotterChatConfig.spotterFileUploadFileTypes': 'unconfirmed',
    'spotterChatConfig.enableStarterPrompts': 'unconfirmed',
    spotterShareConversationConfig: 'unconfirmed',
    sharedConversationId: 'unconfirmed',
};

const getByPath = (obj: Record<string, unknown>, path: string): unknown => path
    .split('.')
    .reduce<unknown>(
        (value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined),
        obj,
    );

/**
 * Logs a non-fatal warning for every `SpotterEmbedViewConfig` option that is
 * set and marked `'unsupported'` for the embed's chosen `spotterVersion`.
 * No-op for `Spotter3` (the baseline) and for options marked `'supported'`
 * or `'unconfirmed'` — this only flags known-bad combinations, so it never
 * spams users about options that simply haven't been verified yet.
 *
 * Advisory only: never throws and never changes the resolved config or the
 * generated iframe URL.
 */
export function warnUnsupportedSpotterVersionOptions(viewConfig: SpotterEmbedViewConfig): void {
    const { spotterVersion } = viewConfig;
    // Compares against the literal 'spotter3' (SpotterVersion.Spotter3's value)
    // rather than importing the enum, to avoid a circular import with
    // conversation.ts (which imports this file).
    if (!spotterVersion || spotterVersion === 'spotter3') return;

    Object.entries(SPOTTER_OPTION_VERSION_SUPPORT).forEach(([path, status]) => {
        if (status !== 'unsupported') return;
        const value = getByPath(viewConfig as unknown as Record<string, unknown>, path);
        if (value !== undefined) {
            logger.warn(
                `SpotterEmbed: option "${path}" is not supported for spotterVersion `
                + `"${spotterVersion}". It may be ignored or behave unexpectedly.`,
            );
        }
    });
}
