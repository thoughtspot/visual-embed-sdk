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
        if (typeof columnName !== 'string') {
            throw new ValidationError('Column name is missing or invalid');
        }

        const filters = filterData?.filters;
        if (!Array.isArray(filters) || filters.length === 0) {
            throw new ValidationError('Filters must be a non-empty array');
        }

        filters.forEach((filter: any) => {
            const filterContent = filter?.filterContent;
            if (!Array.isArray(filterContent) || filterContent.length === 0) {
                throw new ValidationError('Filter content must be a non-empty array');
            }

            filterContent.forEach((content: any) => {
                const operator = content?.filterType;
                if (!Object.values(RuntimeFilterOp).includes(operator)) {
                    throw new ValidationError(`Invalid operator: ${operator}`);
                }

                const values = content?.value;
                if (!Array.isArray(values)) {
                    throw new ValidationError('Values must be an array');
                }

                values.forEach((val: any) => {
                    if (typeof val !== 'object' || val === null) {
                        throw new ValidationError(
                            'Value must be an object and not null',
                        );
                    }
                    if (!('key' in val)) {
                        throw new ValidationError('Value object must contain a key property');
                    }
                    if (Object.keys(val).length > 1) {
                        throw new ValidationError('Value contains additional properties');
                    }
                });

                result.push({
                    columnName,
                    operator: operator as RuntimeFilterOp,
                    values: values.map((val: any) => val.key),
                });
            });
        });
    });

    return result;
};
