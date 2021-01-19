import { getQueryParamString } from './utils';

test('getQueryParamString', () => {
    expect(
        getQueryParamString({
            foo: 'bar',
            baz: '42',
        }),
    ).toBe('foo=bar&baz=42');
    expect(getQueryParamString({})).toBe(null);
});
