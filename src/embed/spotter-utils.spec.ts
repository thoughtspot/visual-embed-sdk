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
    const noopError = jest.fn();

    it('returns an empty fragment when no sidebar config or standalone flag', () => {
        expect(buildSpotterSidebarAppInitData({}, noopError)).toEqual({});
    });

    it('adds spotterSidebarConfig to the payload', () => {
        const result = buildSpotterSidebarAppInitData({
            spotterSidebarConfig: { enablePastConversationsSidebar: true, spotterSidebarTitle: 'Chats' },
        }, noopError);
        expect(result.spotterSidebarConfig).toEqual({
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
        const result = buildSpotterSidebarAppInitData({
            spotterSidebarConfig: {
                enablePastConversationsSidebar: true,
                spotterChatPinConfig,
            },
        }, noopError);
        expect(result.spotterSidebarConfig?.spotterChatPinConfig)
            .toEqual(spotterChatPinConfig);
    });

    it('promotes standalone flag into spotterSidebarConfig.enablePastConversationsSidebar', () => {
        const result = buildSpotterSidebarAppInitData({ enablePastConversationsSidebar: true }, noopError);
        expect(result.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
    });

    it('calls handleError and strips spotterDocumentationUrl when invalid', () => {
        const handleError = jest.fn();
        const result = buildSpotterSidebarAppInitData({
            spotterSidebarConfig: { spotterDocumentationUrl: 'not-a-url' },
        }, handleError);
        expect(handleError).toHaveBeenCalledWith(expect.objectContaining({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
            code: EmbedErrorCodes.INVALID_URL,
        }));
        expect(result.spotterSidebarConfig?.spotterDocumentationUrl).toBeUndefined();
    });

    it('contributes only visualOverridesParams when only visualOverrides is provided', () => {
        const visualOverrides = {
            chart: {
                legend: { show: true, position: 'bottom' as const },
            },
        };
        const result = buildSpotterSidebarAppInitData({
            visualOverrides,
        }, noopError);
        expect(result).toEqual({ visualOverridesParams: visualOverrides });
    });

    it('includes visualOverridesParams with spotterSidebarConfig', () => {
        const visualOverrides = {
            table: {
                display: { tableTheme: 'ZEBRA' },
            },
        };
        const result = buildSpotterSidebarAppInitData({
            spotterSidebarConfig: { enablePastConversationsSidebar: true },
            visualOverrides,
        }, noopError);
        expect(result.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
        expect(result.visualOverridesParams).toEqual(visualOverrides);
    });

    it('includes visualOverridesParams with standalone enablePastConversationsSidebar flag', () => {
        const visualOverrides = {
            chart: {
                legend: { show: false },
            },
        };
        const result = buildSpotterSidebarAppInitData({
            enablePastConversationsSidebar: true,
            visualOverrides,
        }, noopError);
        expect(result.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
        expect(result.visualOverridesParams).toEqual(visualOverrides);
    });

    it('does not include visualOverridesParams when it is undefined', () => {
        const result = buildSpotterSidebarAppInitData({
            spotterSidebarConfig: { enablePastConversationsSidebar: true },
            visualOverrides: undefined,
        }, noopError);
        expect(result.visualOverridesParams).toBeUndefined();
        expect(result.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
    });
});

describe('buildSpotterShareConversationAppInitData', () => {
    it('returns an empty fragment when no spotterShareConversationConfig', () => {
        expect(buildSpotterShareConversationAppInitData({})).toEqual({});
    });

    it('adds spotterShareConversationConfig to the payload', () => {
        const result = buildSpotterShareConversationAppInitData({
            spotterShareConversationConfig: { enableShareConversation: true },
        });
        expect(result.spotterShareConversationConfig).toEqual({
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
        const result = buildSpotterShareConversationAppInitData({
            spotterShareConversationConfig,
        });
        expect(result.spotterShareConversationConfig).toEqual(spotterShareConversationConfig);
    });

    it('contributes only the share config, flat and with no embedParams nesting', () => {
        const spotterShareConversationConfig = { enableShareConversation: true };
        expect(buildSpotterShareConversationAppInitData({ spotterShareConversationConfig }))
            .toEqual({ spotterShareConversationConfig });
    });
});

describe('buildStarterPromptsAppInitData', () => {
    it('returns an empty fragment when starterPrompts is absent', () => {
        expect(buildStarterPromptsAppInitData({})).toEqual({});
        expect(buildStarterPromptsAppInitData({ spotterChatConfig: {} })).toEqual({});
    });

    it('adds starterPrompts to the payload', () => {
        const result = buildStarterPromptsAppInitData({
            spotterChatConfig: { starterPrompts: { quick: { label: 'Quick' } } },
        });
        expect(result.starterPrompts).toEqual({ quick: { label: 'Quick' } });
    });

    it('forwards the enable feature flag', () => {
        const enabled = buildStarterPromptsAppInitData({
            spotterChatConfig: { starterPrompts: { enable: true, quick: { label: 'Quick' } } },
        });
        expect(enabled.starterPrompts).toEqual({ enable: true, quick: { label: 'Quick' } });

        const disabled = buildStarterPromptsAppInitData({
            spotterChatConfig: { starterPrompts: { enable: false } },
        });
        expect(disabled.starterPrompts).toEqual({ enable: false });
    });

    it('contributes only starterPrompts, flat and with no embedParams nesting', () => {
        const starterPrompts = { quick: { label: 'Quick' } };
        expect(buildStarterPromptsAppInitData({ spotterChatConfig: { starterPrompts } }))
            .toEqual({ starterPrompts });
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
        const result = buildStarterPromptsAppInitData({
            spotterChatConfig: { starterPrompts },
        });
        expect(result.starterPrompts).toEqual(starterPrompts);
    });

    it('forwards the liveboard questions on their own', () => {
        const liveboard = [{ label: 'Top products', prompt: 'What are the top products by revenue?' }];
        const result = buildStarterPromptsAppInitData({
            spotterChatConfig: { starterPrompts: { enable: true, liveboard } },
        });
        expect(result.starterPrompts).toEqual({ enable: true, liveboard });
    });
});
