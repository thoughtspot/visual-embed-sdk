import type { DefaultAppInitData } from '../types';

/**
 * A filter to apply to a Liveboard when it loads.
 * @version SDK: 1.54.0 | ThoughtSpot Cloud: 26.11.0.cl
 * @group Embed components
 */
export interface LiveboardFilterQuery {
    /** Name of the Liveboard tab the filter applies to. */
    tabName?: string;
    /** Name of the group within the tab that the filter applies to. */
    groupName?: string;
    /**
     * The filter condition, in search sentence form. For example, `color = red`.
     */
    filterQueryToken: string;
}

/**
 * A Parameter value to apply to a Liveboard when it loads.
 * @version SDK: 1.54.0 | ThoughtSpot Cloud: 26.11.0.cl
 * @group Embed components
 */
export interface LiveboardParameterQuery {
    /** Name of the Liveboard tab the Parameter applies to. */
    tabName?: string;
    /** Name of the group within the tab that the Parameter applies to. */
    groupName?: string;
    /** The Parameter assignment. */
    parameterQueryToken: string;
}

/**
 * Filter and Parameter overrides for one data source on the Liveboard.
 * @version SDK: 1.54.0 | ThoughtSpot Cloud: 26.11.0.cl
 * @group Embed components
 */
export interface LiveboardDataSourceOverride {
    /** The data source (Model) the overrides apply to. */
    dataSourceIdentifier?: string;
    /** Filters to apply for this data source. */
    filterQuery?: LiveboardFilterQuery[];
    /** Parameter values to apply for this data source. */
    parameterQuery?: LiveboardParameterQuery[];
}

/**
 * Filter and Parameter overrides applied to a Liveboard when it loads.
 * @version SDK: 1.54.0 | ThoughtSpot Cloud: 26.11.0.cl
 * @group Embed components
 */
export interface LiveboardOverride {
    /** One entry per data source to override. */
    dataSourceOverride: LiveboardDataSourceOverride[];
}

/**
 * Filter and Parameter overrides for multiple Liveboards, keyed by Liveboard
 * GUID.
 * @version SDK: 1.54.0 | ThoughtSpot Cloud: 26.11.0.cl
 * @group Embed components
 */
export type LiveboardOverrides = { [liveboardId: string]: LiveboardOverride };

export function buildLiveboardOverrideAppInitData<T extends DefaultAppInitData>(
    initData: T,
    viewConfig: { liveboardOverride?: LiveboardOverride },
): T & { embedParams?: { liveboardOverride?: LiveboardOverride } } {
    const { liveboardOverride } = viewConfig;
    // ThoughtSpot ignores an override with no data source entries; skip it.
    if (!liveboardOverride?.dataSourceOverride?.length) return initData;
    return {
        ...initData,
        embedParams: {
            ...((initData as T & { embedParams?: Record<string, unknown> }).embedParams || {}),
            liveboardOverride,
        },
    };
}

export function buildLiveboardOverridesAppInitData<T extends DefaultAppInitData>(
    initData: T,
    liveboardOverrides?: LiveboardOverrides,
): T & { embedParams?: { liveboardOverrides?: LiveboardOverrides } } {
    // ThoughtSpot ignores an override with no data source entries; drop them.
    // Never send an empty map: ThoughtSpot reads one as "no override for any
    // Liveboard", which would also hide the single liveboardOverride.
    const entries = Object.entries(liveboardOverrides || {})
        .filter(([, override]) => override?.dataSourceOverride?.length);
    if (!entries.length) return initData;
    return {
        ...initData,
        embedParams: {
            ...((initData as T & { embedParams?: Record<string, unknown> }).embedParams || {}),
            liveboardOverrides: Object.fromEntries(entries),
        },
    };
}
