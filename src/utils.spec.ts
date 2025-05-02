import {
    getQueryParamString,
    getFilterQuery,
    getCssDimension,
    getEncodedQueryParamsString,
    appendToUrlHash,
    getRedirectUrl,
    checkReleaseVersionInBeta,
    getRuntimeParameters,
    removeTypename,
    removeStyleProperties,
    setStyleProperties,
    isUndefined,
    storeValueInWindow,
    getValueFromWindow,
    isBrowser,
    resetValueFromWindow,
} from './utils';
import { RuntimeFilterOp } from './types';

describe('unit test for utils', () => {
    test('getQueryParamString', () => {
        expect(
            getQueryParamString({
                foo: 'bar',
                baz: '42',
            }),
        ).toBe('foo=bar&baz=42');
        expect(getQueryParamString({})).toBe(null);
        // should not add undefined params
        expect(
            getQueryParamString({
                foo: undefined,
                bar: 'baz',
            }),
        ).toBe('bar=baz');
    });

    test('getFilterQuery should encode URL params', () => {
        expect(getFilterQuery([])).toBe(null);

        expect(
            getFilterQuery([
                {
                    columnName: 'foo+foo',
                    operator: RuntimeFilterOp.NE,
                    values: ['bar+'],
                },
            ]),
        ).toBe('col1=foo%2Bfoo&op1=NE&val1=bar%2B');
    });
    test('getFilterQuery', () => {
        expect(getFilterQuery([])).toBe(null);

        expect(
            getFilterQuery([
                {
                    columnName: 'foo',
                    operator: RuntimeFilterOp.NE,
                    values: ['bar'],
                },
            ]),
        ).toBe('col1=foo&op1=NE&val1=bar');

        const filters = [
            {
                columnName: 'foo',
                operator: RuntimeFilterOp.EQ,
                values: [42],
            },
            {
                columnName: 'bar',
                operator: RuntimeFilterOp.BW_INC,
                values: [1, 10],
            },
            {
                columnName: 'baz',
                operator: RuntimeFilterOp.CONTAINS,
                values: ['abc'],
            },
        ];
        expect(getFilterQuery(filters)).toBe(
            'col1=foo&op1=EQ&val1=42&col2=bar&op2=BW_INC&val2=1&val2=10&col3=baz&op3=CONTAINS&val3=abc',
        );
    });
    test('getParameterOverride', () => {
        expect(getRuntimeParameters([])).toBe(null);

        expect(
            getRuntimeParameters([
                {
                    name: 'foo',
                    value: 'bar',
                },
            ]),
        ).toBe('param1=foo&paramVal1=bar');

        const params = [
            {
                name: 'foo',
                value: 42,
            },
            {
                name: 'bar',
                value: 'abc',
            },
            {
                name: 'baz',
                value: true,
            },
        ];
        expect(getRuntimeParameters(params)).toBe(
            'param1=foo&paramVal1=42&param2=bar&paramVal2=abc&param3=baz&paramVal3=true',
        );
    });

    test('getCssDimension', () => {
        expect(getCssDimension(100)).toBe('100px');
        expect(getCssDimension('100%')).toBe('100%');
        expect(getCssDimension('100px')).toBe('100px');
        expect(getCssDimension(null)).toBe(null);
    });

    test('appendToUrlHash', () => {
        expect(appendToUrlHash('http://myhost:3000', 'hashFrag')).toBe(
            'http://myhost:3000#?tsSSOMarker=hashFrag',
        );
        expect(appendToUrlHash('http://xyz.com/#foo', 'bar')).toBe('http://xyz.com/#foo?tsSSOMarker=bar');
    });

    describe('getRedirectURL', () => {
        let windowSpy: any;
        beforeEach(() => {
            windowSpy = jest.spyOn(window, 'window', 'get');
        });
        afterEach(() => {
            windowSpy.mockRestore();
        });

        test('Should return correct value when path is undefined', () => {
            expect(getRedirectUrl('http://myhost:3000', 'hashFrag')).toBe(
                'http://myhost:3000#?tsSSOMarker=hashFrag',
            );
            expect(getRedirectUrl('http://xyz.com/#foo', 'bar')).toBe('http://xyz.com/#foo?tsSSOMarker=bar');
        });

        test('Should return correct value when path is set', () => {
            windowSpy.mockImplementation(() => ({
                location: {
                    origin: 'http://myhost:3000',
                },
            }));

            expect(getRedirectUrl('http://myhost:3000/', 'hashFrag', '/bar')).toBe(
                'http://myhost:3000/bar#?tsSSOMarker=hashFrag',
            );

            expect(getRedirectUrl('http://myhost:3000/#/foo', 'hashFrag', '#/bar')).toBe(
                'http://myhost:3000/#/bar?tsSSOMarker=hashFrag',
            );
        });
    });

    test('getEncodedQueryParamsString', () => {
        expect(getEncodedQueryParamsString('')).toBe('');
        expect(getEncodedQueryParamsString('test')).toBe('dGVzdA');
    });

    test('when ReleaseVersion is empty ', () => {
        expect(checkReleaseVersionInBeta('', false)).toBe(false);
    });

    test('when ReleaseVersion is 7.0.1.cl ', () => {
        expect(checkReleaseVersionInBeta('7.0.1.cl', false)).toBe(false);
    });

    test('when cluster has dev version', () => {
        expect(checkReleaseVersionInBeta('dev', false)).toBe(false);
    });

    test('when cluster is above 8.4.0.cl-11 software version', () => {
        expect(checkReleaseVersionInBeta('8.4.0.cl-117', false)).toBe(false);
    });

    test('when cluster is bellow 8.0.0.sw software version', () => {
        expect(checkReleaseVersionInBeta('7.2.1.sw', false)).toBe(true);
    });

    test('when suppressBetaWarning is true and ReleaseVersion is 7.0.1', () => {
        expect(checkReleaseVersionInBeta('7.0.1', true)).toBe(false);
    });

    test('when suppressBetaWarning is false ReleaseVersion is 7.0.1', () => {
        expect(checkReleaseVersionInBeta('7.0.1', false)).toBe(true);
    });

    test('removeTypename should removed __typename', () => {
        const input = {
            test: 'test',
            __typename: 'should be removed',
            obj: {
                test: 'test',
                __typename: 'should be removed',
            },
        };
        const result = removeTypename(input);
        const expectedResult = {
            test: 'test',
            obj: {
                test: 'test',
            },
        };
        expect(result).toEqual(expectedResult);
    });

    describe('validate removeStyleProperties', () => {
        it('should remove specified style properties from an HTML element', () => {
            const element = document.createElement('div');

            element.style.backgroundColor = 'blue';
            element.style.fontSize = '14px';

            const propertiesToRemove = ['background-color', 'font-size'];

            removeStyleProperties(element, propertiesToRemove);

            expect(element.style.backgroundColor).toBe('');
            expect(element.style.fontSize).toBe('');
        });

        it('should handle undefined param', () => {
            expect(() => {
                removeStyleProperties(undefined, []);
            }).not.toThrow();
        });

        it('should handle removing non-existent style properties', () => {
            const element = document.createElement('div');

            element.style.backgroundColor = 'blue';
            element.style.fontSize = '14px';

            const propertiesToRemove = ['color', 'border'];

            removeStyleProperties(element, propertiesToRemove);

            expect(element.style.backgroundColor).toBe('blue');
            expect(element.style.fontSize).toBe('14px');
        });
    });

    describe('validate setStyleProperties', () => {
        it('should set style properties on an HTML element', () => {
            const element = document.createElement('div');

            const styles = {
                backgroundColor: 'red',
                fontSize: '16px',
            };

            setStyleProperties(element, styles);

            expect(element.style.backgroundColor).toBe('red');
            expect(element.style.fontSize).toBe('16px');
        });

        it('should handle undefined param', () => {
            // should not throw an error
            expect(() => {
                setStyleProperties(undefined, {});
            }).not.toThrow();
        });
    });

    test('isUndefined', () => {
        expect(isUndefined(undefined)).toBe(true);
        expect(isUndefined({})).toBe(false);
    });

    describe('getValueFromWindow and storeValueInWindow', () => {
        test('Store and retrieve', () => {
            storeValueInWindow('test', 'testValue');
            expect(getValueFromWindow('test')).toBe('testValue');
        });

        test('Object should be set if not', () => {
            // eslint-disable-next-line no-underscore-dangle
            (window as any)._tsEmbedSDK = null;

            storeValueInWindow('test', 'testValue');
            expect(getValueFromWindow('test')).toBe('testValue');
        });

        test('Return undefined if key is not found', () => {
            expect(getValueFromWindow('notFound')).toBe(undefined);
        });

        test('storeValueInWindow returns value when not in browser environment', () => {
            const originalWindow = global.window;
            delete global.window;
            
            const testValue = 'test-non-browser';
            const result = storeValueInWindow('testKey', testValue);
            
            expect(result).toBe(testValue);
            
            global.window = originalWindow;
        });

        test('getValueFromWindow returns undefined when not in browser environment', () => {
            const originalWindow = global.window;
            delete global.window;
            
            const result = getValueFromWindow('anyKey');
            
            expect(result).toBeUndefined();
            
            global.window = originalWindow;
        });
    });

    describe('resetValueFromWindow', () => {
        test('returns true when key exists and is reset', () => {
            storeValueInWindow('testResetKey', 'value-to-reset');
            
            const result = resetValueFromWindow('testResetKey');
            
            expect(result).toBe(true);
            expect(getValueFromWindow('testResetKey')).toBeUndefined();
        });
        
        test('returns false when key does not exist', () => {
            const result = resetValueFromWindow('nonExistentKey');
            
            expect(result).toBe(false);
        });
        
        test('returns false when not in browser environment', () => {
            const originalWindow = global.window;
            delete global.window;
            
            const result = resetValueFromWindow('anyKey');
            
            expect(result).toBe(false);
            
            global.window = originalWindow;
        });
    });
});

describe('isBrowser', () => {
    test('returns true when window is defined', () => {
        // In Jest's JSDOM environment, window is defined
        expect(isBrowser()).toBe(true);
    });

    test('returns false when window is undefined', () => {
        const originalWindow = global.window;
        
        // Simulate non-browser environment by setting window to undefined
        delete global.window;
        
        expect(isBrowser()).toBe(false);
        
        global.window = originalWindow;
    });
});
