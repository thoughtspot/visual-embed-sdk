import {
    resolveEnablePastConversationsSidebar,
    buildSpotterSidebarAppInitData,
    buildStarterPromptsAppInitData,
    MAX_STARTER_PROMPT_QUESTIONS,
    MAX_CATEGORY_LABEL,
    MAX_QUESTION_LABEL,
    MAX_QUESTION_TEXT,
} from './spotter-utils';
import { ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { ERROR_MESSAGE } from '../errors';
import { logger } from '../utils/logger';

describe('resolveEnablePastConversationsSidebar', () => {
    it('prefers spotterSidebarConfig value over standalone', () => {
        expect(resolveEnablePastConversationsSidebar({ spotterSidebarConfigValue: true, standaloneValue: false })).toBe(true);
        expect(resolveEnablePastConversationsSidebar({ spotterSidebarConfigValue: false, standaloneValue: true })).toBe(false);
    });

    it('falls back to standalone when spotterSidebarConfig value is absent', () => {
        expect(resolveEnablePastConversationsSidebar({ standaloneValue: true })).toBe(true);
    });

    it('returns undefined when both are absent', () => {
        expect(resolveEnablePastConversationsSidebar({})).toBeUndefined();
    });
});

describe('buildSpotterSidebarAppInitData', () => {
    const base = { type: 'APP_INIT' } as any;
    const noopError = jest.fn();

    it('returns base unchanged when no sidebar config or standalone flag', () => {
        const result = buildSpotterSidebarAppInitData(base, {}, noopError);
        expect(result).toBe(base);
    });

    it('nests spotterSidebarConfig under embedParams', () => {
        const result = buildSpotterSidebarAppInitData(base, {
            spotterSidebarConfig: { enablePastConversationsSidebar: true, spotterSidebarTitle: 'Chats' },
        }, noopError);
        expect(result.embedParams?.spotterSidebarConfig).toEqual({
            enablePastConversationsSidebar: true,
            spotterSidebarTitle: 'Chats',
        });
    });

    it('promotes standalone flag into spotterSidebarConfig.enablePastConversationsSidebar', () => {
        const result = buildSpotterSidebarAppInitData(base, { enablePastConversationsSidebar: true }, noopError);
        expect(result.embedParams?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
    });

    it('calls handleError and strips spotterDocumentationUrl when invalid', () => {
        const handleError = jest.fn();
        const result = buildSpotterSidebarAppInitData(base, {
            spotterSidebarConfig: { spotterDocumentationUrl: 'not-a-url' },
        }, handleError);
        expect(handleError).toHaveBeenCalledWith(expect.objectContaining({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
            code: EmbedErrorCodes.INVALID_URL,
        }));
        expect(result.embedParams?.spotterSidebarConfig?.spotterDocumentationUrl).toBeUndefined();
    });

    it('returns base with visualOverridesParams when only visualOverrides is provided', () => {
        const visualOverrides = {
            chart: {
                legend: { show: true, position: 'bottom' as const },
            },
        };
        const result = buildSpotterSidebarAppInitData(base, {
            visualOverrides,
        }, noopError);
        expect(result).toEqual({
            ...base,
            embedParams: { visualOverridesParams: visualOverrides },
        });
    });

    it('includes visualOverridesParams with spotterSidebarConfig', () => {
        const visualOverrides = {
            table: {
                display: { tableTheme: 'ZEBRA' },
            },
        };
        const result = buildSpotterSidebarAppInitData(base, {
            spotterSidebarConfig: { enablePastConversationsSidebar: true },
            visualOverrides,
        }, noopError);
        expect(result.embedParams?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
        expect(result.embedParams?.visualOverridesParams).toEqual(visualOverrides);
    });

    it('includes visualOverridesParams with standalone enablePastConversationsSidebar flag', () => {
        const visualOverrides = {
            chart: {
                legend: { show: false },
            },
        };
        const result = buildSpotterSidebarAppInitData(base, {
            enablePastConversationsSidebar: true,
            visualOverrides,
        }, noopError);
        expect(result.embedParams?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
        expect(result.embedParams?.visualOverridesParams).toEqual(visualOverrides);
    });

    it('does not include visualOverridesParams when it is undefined', () => {
        const result = buildSpotterSidebarAppInitData(base, {
            spotterSidebarConfig: { enablePastConversationsSidebar: true },
            visualOverrides: undefined,
        }, noopError);
        expect(result.embedParams?.visualOverridesParams).toBeUndefined();
        expect(result.embedParams?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
    });
});

describe('buildStarterPromptsAppInitData', () => {
    const base = { type: 'APP_INIT' } as any;

    beforeEach(() => {
        jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns the payload unchanged when starterPrompts is absent', () => {
        expect(buildStarterPromptsAppInitData(base, {})).toBe(base);
        expect(buildStarterPromptsAppInitData(base, { spotterChatConfig: {} })).toBe(base);
    });

    it('nests starterPrompts under embedParams', () => {
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: { starterPrompts: { quick: { visibility: true } } },
        });
        expect(result.embedParams?.starterPrompts).toEqual({ quick: { visibility: true } });
    });

    it('forwards a content-only config (no enabled toggle)', () => {
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: { starterPrompts: { research: { visibility: false } } },
        });
        expect(result.embedParams?.starterPrompts).toEqual({ research: { visibility: false } });
    });

    it('preserves existing embedParams keys', () => {
        const withExisting = {
            ...base,
            embedParams: { spotterSidebarConfig: { enablePastConversationsSidebar: true } },
        } as any;
        const result = buildStarterPromptsAppInitData(withExisting, {
            spotterChatConfig: { starterPrompts: { quick: { visibility: true } } },
        });
        expect(result.embedParams?.spotterSidebarConfig).toEqual({ enablePastConversationsSidebar: true });
        expect(result.embedParams?.starterPrompts).toEqual({ quick: { visibility: true } });
    });

    it('caps each category questions at the top MAX_STARTER_PROMPT_QUESTIONS', () => {
        const questions = Array.from({ length: 6 }, (_, i) => ({
            label: `q${i}`,
            prompt: `prompt ${i}`,
        }));
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: { starterPrompts: { quick: { questions }, research: { questions } } },
        });
        expect(result.embedParams?.starterPrompts?.quick?.questions).toHaveLength(MAX_STARTER_PROMPT_QUESTIONS);
        expect(result.embedParams?.starterPrompts?.research?.questions).toHaveLength(MAX_STARTER_PROMPT_QUESTIONS);
        expect(result.embedParams?.starterPrompts?.quick?.questions?.[0].label).toBe('q0');
        expect(logger.warn).toHaveBeenCalled();
    });

    it('clamps over-limit category labels, question labels and prompts', () => {
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: {
                starterPrompts: {
                    quick: {
                        label: 'c'.repeat(MAX_CATEGORY_LABEL + 5),
                        questions: [
                            { label: 'l'.repeat(MAX_QUESTION_LABEL + 5), prompt: 'p'.repeat(MAX_QUESTION_TEXT + 5) },
                        ],
                    },
                },
            },
        });
        const quick = result.embedParams?.starterPrompts?.quick;
        expect(quick?.label).toHaveLength(MAX_CATEGORY_LABEL);
        expect(quick?.questions?.[0].label).toHaveLength(MAX_QUESTION_LABEL);
        expect(quick?.questions?.[0].prompt).toHaveLength(MAX_QUESTION_TEXT);
    });

    it('leaves within-limit strings untouched and does not warn', () => {
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: {
                starterPrompts: {
                    quick: { label: 'Quick', questions: [{ label: 'Top products', prompt: 'What are the top products?' }] },
                },
            },
        });
        const quick = result.embedParams?.starterPrompts?.quick;
        expect(quick?.label).toBe('Quick');
        expect(quick?.questions?.[0]).toEqual({ label: 'Top products', prompt: 'What are the top products?' });
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('clamps the preview-data label only and leaves its other fields intact', () => {
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: {
                starterPrompts: {
                    'preview-data': { label: 'd'.repeat(MAX_CATEGORY_LABEL + 5), visibility: false },
                },
            },
        });
        const previewData = result.embedParams?.starterPrompts?.['preview-data'];
        expect(previewData?.label).toHaveLength(MAX_CATEGORY_LABEL);
        expect(previewData?.visibility).toBe(false);
    });

    it('does not mutate the original starterPrompts config', () => {
        const starterPrompts = {
            quick: { questions: Array.from({ length: 6 }, (_, i) => ({ label: `q${i}`, prompt: `p${i}` })) },
        };
        buildStarterPromptsAppInitData(base, { spotterChatConfig: { starterPrompts } });
        expect(starterPrompts.quick.questions).toHaveLength(6);
    });
});
