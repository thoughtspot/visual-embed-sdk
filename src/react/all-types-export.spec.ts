import * as Exports from './all-types-export';

describe('Exports', () => {
    it('should have exports', () => {
        expect(typeof Exports).toBe('object');
    });

    it('should not have undefined exports', () => {
        Object.entries(Exports).forEach(([, exportValue]) => {expect(Boolean(exportValue)).toBe(true);});
    });
});
