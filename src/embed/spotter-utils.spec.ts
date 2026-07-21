import {
    resolveEnablePastConversationsSidebar,
    buildSpotterSidebarAppInitData,
    buildSpotterShareConversationAppInitData,
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

    it('passes label/icon override fields through untouched', () => {
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
            spotterShareIcon: 'share',
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
