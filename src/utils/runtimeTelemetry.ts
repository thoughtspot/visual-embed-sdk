import { RuntimeFilter, RuntimeFilterOp, RuntimeParameter } from '../types';
import { ApplicabilityLevel } from '../contracts/ui-passthrough-contracts';
import { readActionsRule } from './data-app-actions';

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
// App control ids and values likewise: only their count, or the type. App
// action ids too.
export const summarizeRuntimeDataForTelemetry = <T extends Record<string, any>>(
    viewConfig: T,
): Record<string, any> => {
    const {
        runtimeFilters, runtimeParameters, dataAppControls, dataAppActions, ...rest
    } = viewConfig ?? ({} as T);
    const telemetryProps: Record<string, any> = { ...rest };

    if (Array.isArray(runtimeFilters)) {
        telemetryProps.runtimeFilters = describeRuntimeFilters(runtimeFilters);
    }
    if (Array.isArray(runtimeParameters)) {
        telemetryProps.runtimeParameters = describeRuntimeParameters(runtimeParameters);
    }
    if (dataAppControls !== undefined) {
        telemetryProps.dataAppControls = Array.isArray(dataAppControls)
            ? { count: dataAppControls.length }
            : { type: dataAppControls === null ? 'null' : typeof dataAppControls };
    }
    if (dataAppActions !== undefined) {
        // 'all' or the number of ids; null for none, false if malformed.
        const rule = readActionsRule(dataAppActions);
        telemetryProps.dataAppActions = rule
            ? { off: rule.off === 'all' ? rule.off : rule.off.length }
            : rule ?? null;
    }

    return telemetryProps;
};
