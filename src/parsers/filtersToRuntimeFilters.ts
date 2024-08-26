import { RuntimeFilter, RuntimeFilterOp } from '../types';

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export const convertFiltersToRuntimeFilters = (liveboardFiltersData: any): RuntimeFilter[] => {
    const result: RuntimeFilter[] = [];

    if (!Array.isArray(liveboardFiltersData?.liveboardFilters)) {
        throw new ValidationError('Expected liveboardFilters to be an array');
    }

    liveboardFiltersData.liveboardFilters.forEach((filterData: any) => {
        const columnName = filterData?.columnInfo?.name;
        if (!columnName) {
            throw new ValidationError('Column name is missing or invalid');
        }

        const operator = filterData?.filters?.[0]?.filterContent?.[0]?.filterType;
        if (!Object.values(RuntimeFilterOp).includes(operator)) {
            throw new ValidationError(`Invalid operator: ${operator}`);
        }

        const filterContent = filterData?.filters?.[0]?.filterContent?.[0];
        if (!filterContent || !Array.isArray(filterContent.value)) {
            throw new ValidationError('Filter content or values are missing or invalid');
        }

        const values = filterContent.value.map((val: any) => {
            if (val == null || typeof val.key === 'undefined') {
                throw new ValidationError('Value key is missing or invalid');
            }
            return val.key;
        });

        result.push({
            columnName,
            operator: operator as RuntimeFilterOp,
            values,
        });
    });

    return result;
};
