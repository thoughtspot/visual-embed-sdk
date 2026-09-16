import {
    resolveEnablePastConversationsSidebar,
    buildSpotterSidebarAppInitData,
    buildSpotterShareConversationAppInitData,
    buildStarterPromptsAppInitData,
} from './spotter-utils';
import { ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { ERROR_MESSAGE } from '../errors';

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

    it('forwards a nested spotterChatPinConfig object through untouched', () => {
        const spotterChatPinConfig = {
            enabled: true,
            pinLabel: 'Pin to top',
            unpinLabel: 'Unpin',
        };
        const result = buildSpotterSidebarAppInitData(base, {
            spotterSidebarConfig: {
                enablePastConversationsSidebar: true,
                spotterChatPinConfig,
            },
        }, noopError);
        expect(result.embedParams?.spotterSidebarConfig?.spotterChatPinConfig)
            .toEqual(spotterChatPinConfig);
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

describe('buildSpotterShareConversationAppInitData', () => {
    const base = { type: 'APP_INIT' } as any;

    it('returns base unchanged when no spotterShareConversationConfig', () => {
        const result = buildSpotterShareConversationAppInitData(base, {});
        expect(result).toBe(base);
    });

    it('nests spotterShareConversationConfig under embedParams', () => {
        const result = buildSpotterShareConversationAppInitData(base, {
            spotterShareConversationConfig: { enableShareConversation: true },
        });
        expect(result.embedParams?.spotterShareConversationConfig).toEqual({
            enableShareConversation: true,
        });
    });

    it('passes label override fields through untouched', () => {
        const spotterShareConversationConfig = {
            enableShareConversation: true,
            spotterShareLabel: 'Share',
            spotterShareModalTitle: 'Share conversation',
            spotterShareConfirmLabel: 'Share',
            spotterShareCancelLabel: 'Cancel',
            spotterShareAddUsersLabel: 'Add users or groups',
            spotterShareEmptyTitle: 'No users added yet',
            spotterShareEmptySubtitle: 'Not shared with any user',
            spotterShareIncludeNewMessagesLabel: 'Include new messages',
            spotterShareUpToCurrentLabel: 'Share up to current moment',
            spotterShareStaleInfoLabel: 'This snapshot may be stale',
        };
        const result = buildSpotterShareConversationAppInitData(base, {
            spotterShareConversationConfig,
        });
        expect(result.embedParams?.spotterShareConversationConfig).toEqual(spotterShareConversationConfig);
    });

    it('preserves existing embedParams when nesting the share config', () => {
        const withParams = { type: 'APP_INIT', embedParams: { existing: 'keep' } } as any;
        const result = buildSpotterShareConversationAppInitData(withParams, {
            spotterShareConversationConfig: { enableShareConversation: true },
        });
        expect(result.embedParams?.existing).toBe('keep');
        expect(result.embedParams?.spotterShareConversationConfig?.enableShareConversation).toBe(true);
    });
});

describe('buildStarterPromptsAppInitData', () => {
    const base = { type: 'APP_INIT' } as any;

    it('returns the payload unchanged when starterPrompts is absent', () => {
        expect(buildStarterPromptsAppInitData(base, {})).toBe(base);
        expect(buildStarterPromptsAppInitData(base, { spotterChatConfig: {} })).toBe(base);
    });

    it('nests starterPrompts under embedParams', () => {
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: { starterPrompts: { quick: { label: 'Quick' } } },
        });
        expect(result.embedParams?.starterPrompts).toEqual({ quick: { label: 'Quick' } });
    });

    it('forwards the enable feature flag', () => {
        const enabled = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: { starterPrompts: { enable: true, quick: { label: 'Quick' } } },
        });
        expect(enabled.embedParams?.starterPrompts).toEqual({ enable: true, quick: { label: 'Quick' } });

        const disabled = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: { starterPrompts: { enable: false } },
        });
        expect(disabled.embedParams?.starterPrompts).toEqual({ enable: false });
    });

    it('preserves existing embedParams keys', () => {
        const withExisting = {
            ...base,
            embedParams: { spotterSidebarConfig: { enablePastConversationsSidebar: true } },
        } as any;
        const result = buildStarterPromptsAppInitData(withExisting, {
            spotterChatConfig: { starterPrompts: { quick: { label: 'Quick' } } },
        });
        expect(result.embedParams?.spotterSidebarConfig).toEqual({ enablePastConversationsSidebar: true });
        expect(result.embedParams?.starterPrompts).toEqual({ quick: { label: 'Quick' } });
    });

    it('forwards every category as configured', () => {
        const starterPrompts = {
            enable: true,
            quick: {
                label: 'Quick',
                questions: Array.from({ length: 6 }, (_, i) => ({
                    label: `q${i}`,
                    prompt: `prompt ${i}`,
                })),
            },
            research: { label: 'Research', questions: [{ prompt: 'Why did revenue drop?' }] },
            previewData: { label: 'Explore' },
            liveboard: [
                { label: 'Top products', prompt: 'What are the top products by revenue?' },
                { prompt: 'How did revenue trend last quarter?' },
            ],
        };
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: { starterPrompts },
        });
        expect(result.embedParams?.starterPrompts).toEqual(starterPrompts);
    });

    it('forwards the liveboard questions on their own', () => {
        const liveboard = [{ label: 'Top products', prompt: 'What are the top products by revenue?' }];
        const result = buildStarterPromptsAppInitData(base, {
            spotterChatConfig: { starterPrompts: { enable: true, liveboard } },
        });
        expect(result.embedParams?.starterPrompts).toEqual({ enable: true, liveboard });
    });
});
