import { RuntimeFilter, RuntimeFilterOp, RuntimeParameter } from '../types';
import { ApplicabilityLevel } from '../contracts/ui-passthrough-contracts';

/**
 * `runtimeFilters` and `runtimeParameters` carry customer data: the column and
 * parameter names come from the customer's worksheet, and the operands are the
 * values being filtered on. None of it may be uploaded to Mixpanel.
 *
 * These helpers replace both arrays with an allowlisted summary. Only fields
 * defined by the SDK survive — a count, and enum members that are checked
 * against the enum before being kept, so an arbitrary string sitting under an
 * enum-valued key is never passed through.
 */

const isEnumMember = (enumObject: Record<string, string>, value: unknown): boolean =>
    typeof value === 'string' && Object.values(enumObject).includes(value);

const uniqueEnumMembers = (
    enumObject: Record<string, string>,
    values: unknown[],
): string[] => Array.from(new Set(values.filter((v) => isEnumMember(enumObject, v)))) as string[];

/**
 * Summarises the runtime filters on a view config for telemetry.
 * @param runtimeFilters The filters as supplied by the host application.
 * @returns How many filters there are and which operators they use.
 */
export const describeRuntimeFilters = (
    runtimeFilters: RuntimeFilter[],
): { count: number; operators: string[] } => ({
    count: runtimeFilters.length,
    operators: uniqueEnumMembers(
        RuntimeFilterOp as unknown as Record<string, string>,
        runtimeFilters.map((filter) => filter?.operator),
    ),
});

/**
 * Summarises the runtime parameters on a view config for telemetry.
 * @param runtimeParameters The parameters as supplied by the host application.
 * @returns How many parameters there are and which applicability levels they use.
 */
export const describeRuntimeParameters = (
    runtimeParameters: RuntimeParameter[],
): { count: number; applicabilityLevels: string[] } => ({
    count: runtimeParameters.length,
    applicabilityLevels: uniqueEnumMembers(
        ApplicabilityLevel as unknown as Record<string, string>,
        runtimeParameters.map((parameter) => parameter?.applicability?.level),
    ),
});

/**
 * Replaces the runtime filters and parameters on a view config with their
 * allowlisted summaries, leaving every other property untouched.
 * @param viewConfig The view config the embed was constructed with.
 * @returns Telemetry properties safe to upload.
 */
export const removeRuntimeDataForTelemetry = <T extends Record<string, any>>(
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
