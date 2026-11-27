import {
    AllEmbedViewConfig,
    EmbedConfig,
    RuntimeFilter,
    RuntimeFilterOp,
    RuntimeParameter,
} from '../types';
import { ApplicabilityLevel } from '../contracts/ui-passthrough-contracts';
import { getCustomisations } from '../utils';

// Membership is checked, not just the key: a bare key allowlist would upload an
// arbitrary customer string sitting under `operator` verbatim.
const isEnumMember = (enumObject: Record<string, string>, value: unknown): boolean =>
    typeof value === 'string' && Object.values(enumObject).includes(value);

const uniqueEnumMembers = (
    enumObject: Record<string, string>,
    values: unknown[],
): string[] => Array.from(new Set(values.filter((v) => isEnumMember(enumObject, v)))) as string[];

export const describeRuntimeFilters = (
    runtimeFilters: RuntimeFilter[],
): { count: number; operators: string[] } => ({
    count: runtimeFilters.length,
    operators: uniqueEnumMembers(
        RuntimeFilterOp as unknown as Record<string, string>,
        runtimeFilters.map((filter) => filter?.operator),
    ),
});

export const describeRuntimeParameters = (
    runtimeParameters: RuntimeParameter[],
): { count: number; applicabilityLevels: string[] } => ({
    count: runtimeParameters.length,
    applicabilityLevels: uniqueEnumMembers(
        ApplicabilityLevel as unknown as Record<string, string>,
        runtimeParameters.map((parameter) => parameter?.applicability?.level),
    ),
});

// Column names, parameter names and operands are customer data and must never
// reach Mixpanel; an unrecognized shape is dropped rather than forwarded.
export const summarizeRuntimeDataForTelemetry = <T extends Record<string, any>>(
    viewConfig: T,
): Record<string, any> => {
    const { runtimeFilters, runtimeParameters, ...rest } = viewConfig ?? ({} as T);
    const telemetryProps: Record<string, any> = { ...rest };

    if (Array.isArray(runtimeFilters)) {
        telemetryProps.runtimeFilters = describeRuntimeFilters(runtimeFilters);
    }
    if (Array.isArray(runtimeParameters)) {
        telemetryProps.runtimeParameters = describeRuntimeParameters(runtimeParameters);
    }

    return telemetryProps;
};

const withoutQuery = (url: unknown): string | undefined => (
    typeof url === 'string' ? url.split(/[?#]/)[0] : undefined
);

// Keys only, as values are customer data; file URLs drop the query (tokens).
export const summarizeCustomizationsForTelemetry = (
    embedConfig: EmbedConfig,
    viewConfig: AllEmbedViewConfig,
): Record<string, unknown> => {
    const { style, content } = getCustomisations(
        embedConfig ?? ({} as EmbedConfig),
        viewConfig ?? {},
    );
    return {
        cssVariableKeys: Object.keys(style?.customCSS?.variables ?? {}),
        cssRuleKeys: Object.keys(style?.customCSS?.rules_UNSTABLE ?? {}),
        stringKeys: Object.keys(content?.strings ?? {}),
        stringIDKeys: Object.keys(content?.stringIDs ?? {}),
        customCSSUrl: withoutQuery(style?.customCSSUrl),
        stringIDsUrl: withoutQuery(content?.stringIDsUrl),
        iconSpriteUrl: withoutQuery(
            viewConfig?.customizations?.iconSpriteUrl
                || embedConfig?.customizations?.iconSpriteUrl,
        ),
    };
};
