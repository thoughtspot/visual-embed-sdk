/**
 * Copyright (c) 2026
 *
 * Utility to convert the payload emitted by `EmbedEvent.FilterChanged`
 * into the payload shape expected by `HostEvent.UpdateFilters`, so that
 * the current filter state of a Liveboard can be captured and re-applied
 * later without having to hand-parse the event payload.
 * @summary Filter payload converter
 */

import isNil from 'lodash/isNil';
import { RuntimeFilter, RuntimeFilterOp } from '../types';

export interface FilterChangedFilterContentValue {
    key?: string | number | boolean | null;
}

export interface FilterChangedFilterContent {
    filterType?: string;
    negate?: boolean;
    value?: FilterChangedFilterContentValue[];
}

export interface FilterChangedDateFilterValue {
    type?: string;
    op?: string;
    // The payload is JSON from the embedded app, so absent fields can arrive
    // as `null` rather than being omitted.
    epoch?: string | number | null;
    dateRange?: {
        lowEpoch?: string | number | null;
        highEpoch?: string | number | null;
    };
    monthName?: string;
    quarterName?: string;
    yearName?: string;
    number?: number | null;
    datePeriod?: string;
    includeCurrentPeriod?: boolean | null;
}

export interface FilterChangedDateFilterContent {
    negate?: boolean;
    dateFilter?: FilterChangedDateFilterValue;
}

export interface FilterChangedFilter {
    filterContent?: FilterChangedFilterContent[];
    dateFilterContent?: FilterChangedDateFilterContent[];
}

export interface FilterChangedFilterGroup {
    columnInfo?: {
        name?: string;
    };
    filters?: FilterChangedFilter[];
}

/**
 * Shape of the payload received via `LiveboardEmbed.on(EmbedEvent.FilterChanged, ...)`.
 */
export interface FilterChangedPayload {
    liveboardFilters?: FilterChangedFilterGroup[];
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

type DateFilterValueExtractor = (dateFilter: FilterChangedDateFilterValue) => (string | number)[];

/**
 * Coerces an epoch/count field to a number, returning `null` when the value is
 * absent or not a finite number. The payload arrives as JSON from the iframe,
 * so a missing field can be `null` as well as `undefined`, and `Number(null)`
 * or `Number('')` would otherwise silently become a valid-looking `0`
 * (i.e. the Unix epoch, or a zero-length period).
 * @param value Raw value from the date filter payload.
 */
function toFiniteNumber(value: string | number | undefined | null): number | null {
    if (isNil(value) || value === '') return null;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
}

const DATE_FILTER_VALUE_EXTRACTORS: Record<string, DateFilterValueExtractor> = {
    EXACT_DATE: (dateFilter) => {
        const epoch = toFiniteNumber(dateFilter.epoch);
        return epoch === null ? [] : [epoch];
    },
    EXACT_DATE_RANGE: (dateFilter) => {
        const { lowEpoch, highEpoch } = dateFilter.dateRange ?? {};
        const low = toFiniteNumber(lowEpoch);
        const high = toFiniteNumber(highEpoch);
        return low === null || high === null ? [] : [low, high];
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
    LAST_N_PERIOD: (dateFilter) => {
        const count = toFiniteNumber(dateFilter.number);
        return count === null ? [] : [count];
    },
    NEXT_N_PERIOD: (dateFilter) => {
        const count = toFiniteNumber(dateFilter.number);
        return count === null ? [] : [count];
    },
};

// Date filter types with no `values` (e.g. TODAY needs no operand).
const PERIOD_ONLY_DATE_FILTER_TYPES = new Set([
    'THIS_PERIOD', 'PERIOD_TO_DATE', 'TODAY', 'YESTERDAY', 'TOMORROW',
]);

function convertDateFilterToParam(
    columnName: string,
    dateFilterContent: FilterChangedDateFilterContent,
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
    if (!isNil(dateFilter.includeCurrentPeriod)) {
        param.includeCurrentPeriod = dateFilter.includeCurrentPeriod;
    }
    if (dateFilterContent.negate) {
        param.negate = true;
    }

    return param;
}

function convertFilterContentToParam(
    columnName: string,
    filterContent: FilterChangedFilterContent,
): UpdateFiltersFilterParam | null {
    if (!filterContent?.filterType) return null;

    const values = (filterContent.value ?? [])
        .map((value) => value?.key)
        .filter((value): value is string | number | boolean => !isNil(value));

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

function convertFilterToParams(columnName: string, filter: FilterChangedFilter): UpdateFiltersFilterParam[] {
    const dateParams = (filter?.dateFilterContent ?? [])
        .map((dateFilterContent) => convertDateFilterToParam(columnName, dateFilterContent));
    const contentParams = (filter?.filterContent ?? [])
        .map((filterContent) => convertFilterContentToParam(columnName, filterContent));

    return [...dateParams, ...contentParams]
        .filter((param): param is UpdateFiltersFilterParam => param !== null);
}

function convertFilterGroupToParams(filterGroup: FilterChangedFilterGroup): UpdateFiltersFilterParam[] {
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
