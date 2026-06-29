import { DefaultAppInitData, ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { validateHttpUrl } from '../utils';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';
import type {
    SpotterSidebarViewConfig,
    SpotterChatViewConfig,
    StarterPromptsConfig,
    StarterPromptCategory,
    StarterPromptQuestion,
} from './conversation';
import type { VisualizationOverrides } from '../types';

// Max questions kept per starter-prompt category; over-limit lists are sliced.
export const MAX_STARTER_PROMPT_QUESTIONS = 4;

// Character caps for starter-prompt strings, mirrored by the conv-assist app.
export const MAX_CATEGORY_LABEL = 30;
export const MAX_QUESTION_LABEL = 80;
export const MAX_QUESTION_TEXT = 300;

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

// Truncates to `max` chars (with a dev warning); passes through non-strings and
// values already within the limit.
function clampString(value: string | undefined, max: number, context: string): string | undefined {
    if (typeof value !== 'string' || value.length <= max) {
        return value;
    }
    logger.warn(
        `[starterPrompts] ${context} exceeds ${max} characters and was truncated.`,
    );
    return value.slice(0, max);
}

function clampQuestion(question: StarterPromptQuestion): StarterPromptQuestion {
    return {
        ...question,
        label: clampString(question.label, MAX_QUESTION_LABEL, 'question label') as string,
        prompt: clampString(question.prompt, MAX_QUESTION_TEXT, 'question prompt') as string,
    };
}

// Clamps the category label and caps its questions at MAX_STARTER_PROMPT_QUESTIONS.
function normalizeCategory(category: StarterPromptCategory): StarterPromptCategory {
    const normalized: StarterPromptCategory = { ...category };
    if (normalized.label !== undefined) {
        normalized.label = clampString(normalized.label, MAX_CATEGORY_LABEL, 'category label');
    }
    if (Array.isArray(normalized.questions)) {
        if (normalized.questions.length > MAX_STARTER_PROMPT_QUESTIONS) {
            logger.warn(
                `[starterPrompts] questions exceed ${MAX_STARTER_PROMPT_QUESTIONS} `
                + 'and were truncated to the top 4.',
            );
        }
        normalized.questions = normalized.questions
            .slice(0, MAX_STARTER_PROMPT_QUESTIONS)
            .map(clampQuestion);
    }
    return normalized;
}

/**
 * Adds `embedParams.starterPrompts` to the APP_INIT payload when configured,
 * normalizing each category (string caps + top-4 questions) and preserving any
 * existing `embedParams` keys.
 */
export function buildStarterPromptsAppInitData<T extends DefaultAppInitData>(
    appInitData: T,
    viewConfig: { spotterChatConfig?: SpotterChatViewConfig },
): T & { embedParams?: { starterPrompts?: StarterPromptsConfig } } {
    const starterPrompts = viewConfig.spotterChatConfig?.starterPrompts;
    if (!starterPrompts) {
        return appInitData;
    }

    const normalized: StarterPromptsConfig = { ...starterPrompts };
    if (starterPrompts.quick) {
        normalized.quick = normalizeCategory(starterPrompts.quick);
    }
    if (starterPrompts.research) {
        normalized.research = normalizeCategory(starterPrompts.research);
    }
    if (starterPrompts['preview-data']) {
        const previewData = { ...starterPrompts['preview-data'] };
        if (previewData.label !== undefined) {
            previewData.label = clampString(previewData.label, MAX_CATEGORY_LABEL, 'category label');
        }
        normalized['preview-data'] = previewData;
    }

    return {
        ...appInitData,
        embedParams: {
            ...((appInitData as any).embedParams || {}),
            starterPrompts: normalized,
        },
    };
}
