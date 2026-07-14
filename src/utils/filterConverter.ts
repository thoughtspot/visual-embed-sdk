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

export interface LiveboardFilterContentValue {
    key?: string | number | boolean;
}

export interface LiveboardFilterContent {
    filterType?: string;
    negate?: boolean;
    value?: LiveboardFilterContentValue[];
}

export interface LiveboardDateFilterValue {
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

export interface LiveboardDateFilterContent {
    negate?: boolean;
    dateFilter?: LiveboardDateFilterValue;
}

export interface LiveboardFilter {
    filterContent?: LiveboardFilterContent[];
    dateFilterContent?: LiveboardDateFilterContent[];
}

export interface LiveboardFilterGroup {
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

// Date filter types with no `values` (e.g. TODAY needs no operand).
const PERIOD_ONLY_DATE_FILTER_TYPES = new Set([
    'THIS_PERIOD', 'PERIOD_TO_DATE', 'TODAY', 'YESTERDAY', 'TOMORROW',
]);

function convertDateFilterToParam(
    columnName: string,
    dateFilterContent: LiveboardDateFilterContent,
): UpdateFiltersFilterParam | null {
    const dateFilter = dateFilterContent?.dateFilter;
    if (!dateFilter?.type) return null;

    let values: (string | number)[];
    const getValues = DATE_FILTER_VALUE_EXTRACTORS[dateFilter.type];
    if (getValues) {
        values = getValues(dateFilter);
        // Required fields (e.g. epoch, yearName) are missing - the source data
        // can't be reconstructed faithfully, so skip rather than emit a filter
        // that would clear/corrupt this column when re-applied.
        if (values.length === 0) return null;
    } else if (PERIOD_ONLY_DATE_FILTER_TYPES.has(dateFilter.type)) {
        values = [];
    } else {
        // Unrecognized date filter type - skip rather than guess.
        return null;
    }

    const param: UpdateFiltersFilterParam = {
        columnName,
        operator: dateFilter.op ?? RuntimeFilterOp.EQ,
        values,
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

function convertFilterToParams(columnName: string, filter: LiveboardFilter): UpdateFiltersFilterParam[] {
    const dateParams = (filter?.dateFilterContent ?? [])
        .map((dateFilterContent) => convertDateFilterToParam(columnName, dateFilterContent));
    const contentParams = (filter?.filterContent ?? [])
        .map((filterContent) => convertFilterContentToParam(columnName, filterContent));

    return [...dateParams, ...contentParams]
        .filter((param): param is UpdateFiltersFilterParam => param !== null);
}

function convertFilterGroupToParams(filterGroup: LiveboardFilterGroup): UpdateFiltersFilterParam[] {
    const columnName = filterGroup?.columnInfo?.name;
    if (!columnName) return [];

    return (filterGroup.filters ?? []).flatMap((filter) => convertFilterToParams(columnName, filter));
}

/**
 * Converts the payload emitted by {@link EmbedEvent.FilterChanged} into the
 * payload shape expected by {@link HostEvent.UpdateFilters}, so the same
 * filter state can be captured and re-applied later, for example on a
 * subsequent page load.
 *
 * Both the Liveboard filters and the runtime filters present in the
 * `FilterChanged` payload are included in the returned `filters` array.
 *
 * Note: a column with multiple date-filter conditions (e.g. an OR of two
 * date ranges) is not guaranteed to round-trip losslessly - `HostEvent.UpdateFilters`
 * treats date filters as replace-not-merge per column, so only the last
 * converted entry for such a column will apply.
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
