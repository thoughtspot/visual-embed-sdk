import {
    resolveEnablePastConversationsSidebar,
    buildSpotterSidebarAppInitData,
    buildSpotterShareConversationAppInitData,
    buildSpotterQuotaAppInitData,
    mapSpotterQuotaToEmbedParams,
} from './spotter-utils';
import { SpotterQuotaPeriod, SpotterQuotaScope } from '../types';
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

describe('mapSpotterQuotaToEmbedParams', () => {
    it('maps the public names onto the app embedParam names', () => {
        expect(
            mapSpotterQuotaToEmbedParams({
                enabled: true,
                limit: 20,
                warningThreshold: 15,
                upgradeContent: '<p>Upgrade</p>',
            }),
        ).toEqual({
            spotterQuota: {
                enabled: true,
                limit: 20,
                warningThreshold: 15,
                upgradeContent: '<p>Upgrade</p>',
            },
            noOfAllowedMessages: 20,
            almostReachedThreshold: 15,
            gatedSpotterContent: '<p>Upgrade</p>',
        });
    });

    it('omits keys the host did not set rather than sending undefined', () => {
        const result = mapSpotterQuotaToEmbedParams({ enabled: true, limit: 5 });
        expect(result.noOfAllowedMessages).toBe(5);
        expect('almostReachedThreshold' in result).toBe(false);
        expect('spotterUsageMonthlyReset' in result).toBe(false);
        expect('gatedSpotterContent' in result).toBe(false);
        expect('spotterUsageLimits' in result).toBe(false);
    });

    it('sends the monthly-reset flag only when a period is chosen', () => {
        expect(
            mapSpotterQuotaToEmbedParams({
                enabled: true,
                quotaPeriod: SpotterQuotaPeriod.Monthly,
            }).spotterUsageMonthlyReset,
        ).toBe(true);
        expect(
            mapSpotterQuotaToEmbedParams({
                enabled: true,
                quotaPeriod: SpotterQuotaPeriod.Total,
            }).spotterUsageMonthlyReset,
        ).toBe(false);
        expect(
            'spotterUsageMonthlyReset' in mapSpotterQuotaToEmbedParams({ enabled: true }),
        ).toBe(false);
    });

    it('flattens group limits and defaults an omitted enabled flag to true', () => {
        expect(
            mapSpotterQuotaToEmbedParams({
                enabled: true,
                scope: SpotterQuotaScope.Group,
                groupLimits: [
                    { groupId: 'free', limit: 3, warningThreshold: 2, upgradeUrl: 'https://x.test' },
                    { groupId: 'pro', limit: 100, enabled: false },
                ],
            }).spotterUsageLimits,
        ).toEqual([
            {
                groupId: 'free',
                enabled: true,
                usageLimit: 3,
                almostReachedThreshold: 2,
                upgradePlanUrl: 'https://x.test',
            },
            { groupId: 'pro', enabled: false, usageLimit: 100 },
        ]);
    });

    it('ignores group limits when the scope is not group', () => {
        const result = mapSpotterQuotaToEmbedParams({
            enabled: true,
            scope: SpotterQuotaScope.User,
            limit: 10,
            groupLimits: [{ groupId: 'stale', limit: 1 }],
        });
        expect('spotterUsageLimits' in result).toBe(false);
        expect(result.noOfAllowedMessages).toBe(10);
    });
});

describe('buildSpotterQuotaAppInitData', () => {
    const base = { authToken: 'token' } as any;

    it('returns the payload untouched when no quota is configured', () => {
        expect(buildSpotterQuotaAppInitData(base, {})).toBe(base);
    });

    it('returns the payload untouched when the quota is explicitly disabled', () => {
        expect(
            buildSpotterQuotaAppInitData(base, { spotterQuota: { enabled: false, limit: 20 } }),
        ).toBe(base);
    });

    it('merges quota params alongside existing embedParams', () => {
        const withSidebar = {
            ...base,
            embedParams: { spotterSidebarConfig: { enablePastConversationsSidebar: true } },
        } as any;
        const result = buildSpotterQuotaAppInitData(withSidebar, {
            spotterQuota: { enabled: true, limit: 20, warningThreshold: 15 },
        });
        expect(result.embedParams).toEqual({
            spotterSidebarConfig: { enablePastConversationsSidebar: true },
            spotterQuota: { enabled: true, limit: 20, warningThreshold: 15 },
            noOfAllowedMessages: 20,
            almostReachedThreshold: 15,
        });
    });
});
