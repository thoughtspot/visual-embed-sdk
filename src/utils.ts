/**
 * Copyright (c) 2020
 *
 * Common utility functions for ThoughtSpot Embed UI SDK
 *
 * @summary Utils
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { QueryParams, RuntimeFilter } from './types';

/**
 * Construct a runtime filters query string from the given filters
 * Refer to the following docs for more details on runtime filter syntax:
 * https://docs.thoughtspot.com/6.2/app-integrate/runtime-filters/apply-runtime-filter.html
 * https://docs.thoughtspot.com/6.2/app-integrate/runtime-filters/runtime-filter-operators.html#
 * @param runtimeFilters
 */
export const getFilterQuery = (runtimeFilters: RuntimeFilter[]): string => {
    if (runtimeFilters && runtimeFilters.length) {
        const filters = runtimeFilters.map((filter, valueIndex) => {
            const index = valueIndex + 1;
            const filterExpr = [];
            filterExpr.push(`col${index}=${filter.columnName}`);
            filterExpr.push(`op${index}=${filter.operator}`);
            filterExpr.push(
                filter.values.map((value) => `val${index}=${value}`).join('&'),
            );

            return filterExpr.join('&');
        });

        return `**${filters.join('&')}**`;
    }

    return null;
};

/**
 * Return a query param string composed from the given params object
 * @param queryParams
 */
export const getQueryParamString = (queryParams: QueryParams): string => {
    const qp: string[] = [];
    const params = Object.keys(queryParams);
    params.forEach((key) => {
        const val = queryParams[key];
        if (val !== undefined) {
            qp.push(`${key}=${val}`);
        }
    });

    if (qp.length) {
        return qp.join('&');
    }

    return null;
};
