import {
    DefaultAppInitData,
    ErrorDetailsTypes,
    EmbedErrorCodes,
    SpotterQuotaPeriod,
    SpotterQuotaScope,
} from '../types';
import type { SpotterQuotaConfig } from '../types';
import { validateHttpUrl } from '../utils';
import { ERROR_MESSAGE } from '../errors';
import type { SpotterSidebarViewConfig, SpotterShareConversationConfig } from './conversation';
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
 * The flattened per-group allowance the embedded app reads from
 * `embedParams.spotterUsageLimits`.
 * @internal
 */
export interface SpotterUsageLimitEmbedParams {
    groupId: string;
    enabled?: boolean;
    usageLimit?: number;
    almostReachedThreshold?: number;
    upgradePlanUrl?: string;
}

/**
 * The quota payload handed to the embedded app.
 * @internal
 */
export interface SpotterQuotaEmbedParams {
    spotterQuota: SpotterQuotaConfig;
    noOfAllowedMessages?: number;
    almostReachedThreshold?: number;
    spotterUsageMonthlyReset?: boolean;
    spotterUsageLimits?: SpotterUsageLimitEmbedParams[];
    gatedSpotterContent?: string;
}

/**
 * Translates the public {@link SpotterQuotaConfig} into the flat
 * `embedParams` keys the embedded Spotter app consumes.
 *
 * Kept as a pure function so the mapping — which is the contract between the
 * SDK's public API and the app's internal param names — is unit-testable
 * without constructing an embed.
 * @internal
 */
export const mapSpotterQuotaToEmbedParams = (
    quota: SpotterQuotaConfig,
): SpotterQuotaEmbedParams => {
    const isGroupScoped = quota.scope === SpotterQuotaScope.Group;

    // Only forward group allowances when the host actually asked for group
    // scope; a stale groupLimits array left on a user-scoped config would
    // otherwise silently override the top-level limit inside the app.
    const groupLimits = isGroupScoped ? quota.groupLimits ?? [] : [];

    return {
        spotterQuota: quota,
        ...(quota.limit !== undefined && { noOfAllowedMessages: quota.limit }),
        ...(quota.warningThreshold !== undefined && {
            almostReachedThreshold: quota.warningThreshold,
        }),
        // Absent quotaPeriod means Total (never resets), so send the flag only
        // when the host explicitly opted into monthly resets.
        ...(quota.quotaPeriod !== undefined && {
            spotterUsageMonthlyReset: quota.quotaPeriod === SpotterQuotaPeriod.Monthly,
        }),
        ...(groupLimits.length > 0 && {
            spotterUsageLimits: groupLimits.map((group) => ({
                groupId: group.groupId,
                // The app treats `enabled` as a hard filter, so default an
                // omitted flag to true rather than letting it read as falsy.
                enabled: group.enabled ?? true,
                ...(group.limit !== undefined && { usageLimit: group.limit }),
                ...(group.warningThreshold !== undefined && {
                    almostReachedThreshold: group.warningThreshold,
                }),
                ...(group.upgradeUrl !== undefined && { upgradePlanUrl: group.upgradeUrl }),
            })),
        }),
        ...(quota.upgradeContent !== undefined && {
            gatedSpotterContent: quota.upgradeContent,
        }),
    };
};

/**
 * Extends the APP_INIT payload with the resolved question-gating params.
 *
 * A quota that is absent or explicitly disabled contributes nothing to the
 * payload, so an embed without gating is byte-for-byte unchanged.
 */
export function buildSpotterQuotaAppInitData<T extends DefaultAppInitData>(
    initData: T,
    viewConfig: { spotterQuota?: SpotterQuotaConfig },
): T & { embedParams?: SpotterQuotaEmbedParams } {
    const { spotterQuota } = viewConfig;
    if (!spotterQuota?.enabled) return initData;

    return {
        ...initData,
        embedParams: {
            ...((initData as T & { embedParams?: Record<string, unknown> }).embedParams || {}),
            ...mapSpotterQuotaToEmbedParams(spotterQuota),
        },
    };
}
