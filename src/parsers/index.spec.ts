import { convertFiltersToRuntimeFilters } from './index';

describe('index.ts exports', () => {
    test('should export convertFiltersToRuntimeFilters', () => {
        expect(convertFiltersToRuntimeFilters).toBeDefined();
    });
});
