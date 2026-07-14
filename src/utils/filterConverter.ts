/**
 * Copyright (c) 2026
 *
 * Utility to convert the payload emitted by `EmbedEvent.FilterChanged`
 * into the payload shape expected by `HostEvent.UpdateFilters`, so that
 * the current filter state of a Liveboard can be captured and re-applied
 * later without having to hand-parse the event payload.
 * @summary Filter payload converter
 */

import { RuntimeFilter, RuntimeFilterOp } from '../types';

interface LiveboardFilterContentValue {
    key?: string | number | boolean;
}

interface LiveboardFilterContent {
    filterType?: string;
    negate?: boolean;
    value?: LiveboardFilterContentValue[];
}

interface LiveboardDateFilterValue {
    type?: string;
    op?: string;
    epoch?: string | number;
    dateRange?: {
        lowEpoch?: string | number;
        highEpoch?: string | number;
    };
    monthName?: string;
    quarterName?: string;
    yearName?: string;
    number?: number;
    datePeriod?: string;
    includeCurrentPeriod?: boolean;
}

interface LiveboardDateFilterContent {
    negate?: boolean;
    dateFilter?: LiveboardDateFilterValue;
}

interface LiveboardFilter {
    filterContent?: LiveboardFilterContent[];
    dateFilterContent?: LiveboardDateFilterContent[];
}

interface LiveboardFilterGroup {
    columnInfo?: {
        name?: string;
    };
    filters?: LiveboardFilter[];
}

/**
 * Shape of the payload received via `LiveboardEmbed.on(EmbedEvent.FilterChanged, ...)`.
 */
export interface FilterChangedPayload {
    liveboardFilters?: LiveboardFilterGroup[];
    runtimeFilters?: RuntimeFilter[];
}

export interface UpdateFiltersFilterParam {
    columnName: string;
    operator: string;
    values: (string | number | boolean | bigint)[];
    type?: string;
    datePeriod?: string;
    negate?: boolean;
    includeCurrentPeriod?: boolean;
}

/**
 * Shape expected by `liveboardEmbed.trigger(HostEvent.UpdateFilters, ...)`.
 */
export interface UpdateFiltersPayload {
    filters: UpdateFiltersFilterParam[];
}

type DateFilterValueExtractor = (dateFilter: LiveboardDateFilterValue) => (string | number)[];

const DATE_FILTER_VALUE_EXTRACTORS: Record<string, DateFilterValueExtractor> = {
    EXACT_DATE: (dateFilter) => (
        dateFilter.epoch !== undefined ? [Number(dateFilter.epoch)] : []
    ),
    EXACT_DATE_RANGE: (dateFilter) => {
        const { lowEpoch, highEpoch } = dateFilter.dateRange ?? {};
        return lowEpoch !== undefined && highEpoch !== undefined
            ? [Number(lowEpoch), Number(highEpoch)]
            : [];
    },
    MONTH_YEAR: (dateFilter) => (
        dateFilter.monthName && dateFilter.yearName
            ? [dateFilter.monthName, dateFilter.yearName]
            : []
    ),
    QUARTER_YEAR: (dateFilter) => (
        dateFilter.quarterName && dateFilter.yearName
            ? [dateFilter.quarterName, dateFilter.yearName]
            : []
    ),
    YEAR_ONLY: (dateFilter) => (dateFilter.yearName ? [dateFilter.yearName] : []),
    LAST_N_PERIOD: (dateFilter) => (
        dateFilter.number !== undefined ? [dateFilter.number] : []
    ),
    NEXT_N_PERIOD: (dateFilter) => (
        dateFilter.number !== undefined ? [dateFilter.number] : []
    ),
};

function convertDateFilterToParam(
    columnName: string,
    dateFilterContent: LiveboardDateFilterContent,
): UpdateFiltersFilterParam | null {
    const dateFilter = dateFilterContent?.dateFilter;
    if (!dateFilter?.type) return null;

    const getValues = DATE_FILTER_VALUE_EXTRACTORS[dateFilter.type] ?? (() => []);

    const param: UpdateFiltersFilterParam = {
        columnName,
        operator: dateFilter.op ?? RuntimeFilterOp.EQ,
        values: getValues(dateFilter),
        type: dateFilter.type,
    };
    if (dateFilter.datePeriod) {
        param.datePeriod = dateFilter.datePeriod;
    }
    if (dateFilter.includeCurrentPeriod !== undefined) {
        param.includeCurrentPeriod = dateFilter.includeCurrentPeriod;
    }
    if (dateFilterContent.negate) {
        param.negate = true;
    }

    return param;
}

function convertFilterContentToParam(
    columnName: string,
    filterContent: LiveboardFilterContent,
): UpdateFiltersFilterParam | null {
    if (!filterContent?.filterType) return null;

    const values = (filterContent.value ?? [])
        .map((value) => value?.key)
        .filter((value): value is string | number | boolean => value !== undefined && value !== null);

    const param: UpdateFiltersFilterParam = {
        columnName,
        operator: filterContent.filterType,
        values,
    };
    if (filterContent.negate) {
        param.negate = true;
    }

    return param;
}

function convertFilterGroupToParams(filterGroup: LiveboardFilterGroup): UpdateFiltersFilterParam[] {
    const columnName = filterGroup?.columnInfo?.name;
    if (!columnName) return [];

    return (filterGroup.filters ?? [])
        .map((filter) => {
            const dateFilterContent = filter?.dateFilterContent?.[0];
            if (dateFilterContent) {
                return convertDateFilterToParam(columnName, dateFilterContent);
            }
            const filterContent = filter?.filterContent?.[0];
            return filterContent ? convertFilterContentToParam(columnName, filterContent) : null;
        })
        .filter((param): param is UpdateFiltersFilterParam => param !== null);
}

/**
 * Converts the payload emitted by {@link EmbedEvent.FilterChanged} into the
 * payload shape expected by {@link HostEvent.UpdateFilters}, so the same
 * filter state can be captured and re-applied later, for example on a
 * subsequent page load.
 *
 * Both the Liveboard filters and the runtime filters present in the
 * `FilterChanged` payload are included in the returned `filters` array.
 * @param filterChangedPayload The payload received in the
 * `EmbedEvent.FilterChanged` callback.
 * @example
 * ```js
 * let savedFilters;
 * liveboardEmbed.on(EmbedEvent.FilterChanged, (payload) => {
 *     savedFilters = convertFilterChangedToUpdateFiltersPayload(payload);
 * });
 *
 * // later, e.g. after a fresh page load
 * liveboardEmbed.trigger(HostEvent.UpdateFilters, savedFilters);
 * ```
 */
export function convertFilterChangedToUpdateFiltersPayload(
    filterChangedPayload: FilterChangedPayload,
): UpdateFiltersPayload {
    const liveboardFilterParams = (filterChangedPayload?.liveboardFilters ?? [])
        .flatMap(convertFilterGroupToParams);

    const runtimeFilterParams: UpdateFiltersFilterParam[] = (
        filterChangedPayload?.runtimeFilters ?? []
    ).map((runtimeFilter) => ({
        columnName: runtimeFilter.columnName,
        operator: runtimeFilter.operator,
        values: runtimeFilter.values,
    }));

    return { filters: [...liveboardFilterParams, ...runtimeFilterParams] };
}
