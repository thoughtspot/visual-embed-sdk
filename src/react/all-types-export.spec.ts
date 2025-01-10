import * as Exports from './all-types-export';

describe.skip('Exports', () => {
    it('should have exports', () => {
        expect(typeof Exports).toBe('object');
    });

    it('should not have undefined exports', () => {
        Object.keys(Exports).forEach((exportKey) => expect(Boolean(Exports[exportKey])).toBe(true));
    });
});
