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
    getCustomisationsMobileEmbed,
} from './utils';
import { CustomisationsInterface, RuntimeFilterOp } from './types';
import { WebViewConfig } from './native/types';

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
});

describe('getCustomisationsMobileEmbed', () => {
    it('should return empty style and content if no customizations are defined', () => {
      const embedConfig: Partial<WebViewConfig> = {};

      const result = getCustomisationsMobileEmbed(embedConfig as WebViewConfig);
      expect(result).toEqual({
        style: {
          customCSS: {},
          customCSSUrl: undefined,
        },
        content: {},
      });
    });

    it('should use embedConfig.customizations when present', () => {
      const embedConfig: Partial<WebViewConfig> = {
        customizations: {
          style: {
            customCSS: { 
                rules_UNSTABLE: {
                    '.title': { fontSize: '20px' },
                }
             },
            customCSSUrl: 'http://example.com/styles.css',
          },
          content: {
            headerText: 'Hello World',
          },
        },
      };

      const result = getCustomisationsMobileEmbed(embedConfig as WebViewConfig);
      expect(result).toEqual({
        style: {
          customCSS: { 
            rules_UNSTABLE: {
                '.title': { fontSize: '20px' },
            }
           },
          customCSSUrl: 'http://example.com/styles.css',
        },
        content: {
          headerText: 'Hello World',
        },
      });
    });

    it('should fallback to embedConfig.customisations if customizations is undefined', () => {
      const embedConfig: Partial<WebViewConfig> = {
        customizations: {
          style: {
            backgroundColor: 'green',
            customCSS: { '.anotherClass': { color: 'white' } },
          },
          content: {
            footerText: 'Footer content',
          },
        } as CustomisationsInterface,
      };

      const result = getCustomisationsMobileEmbed(embedConfig as WebViewConfig);
      expect(result).toEqual({
        style: {
          backgroundColor: 'green',
          customCSS: { '.anotherClass': { color: 'white' } },
          customCSSUrl: undefined,
        },
        content: {
          footerText: 'Footer content',
        },
      });
    });

    it('should merge style objects correctly (customCSS stays as an object)', () => {
      const embedConfig: Partial<WebViewConfig> = {
        customizations: {
          style: {
            customCSS: {
                rules_UNSTABLE: {
                    '.title': { fontSize: '20px' },
                }
            },
            customCSSUrl: 'http://example.com/old-styles.css',
          },
        },
      };

      const result = getCustomisationsMobileEmbed(embedConfig as WebViewConfig);
      expect(result).toEqual({
        style: {
          customCSS: {
            rules_UNSTABLE: {
                '.title': { fontSize: '20px' },
            }
          },
          customCSSUrl: 'http://example.com/old-styles.css',
        },
        content: {},
      });
    });

    it('should handle missing style or content keys gracefully', () => {
      const embedConfig: Partial<WebViewConfig> = {
        customizations: {
          style: undefined, // style is missing
          content: undefined, // content is missing
        },
      };

      const result = getCustomisationsMobileEmbed(embedConfig as WebViewConfig);
      expect(result).toEqual({
        style: {
          customCSS: {},
          customCSSUrl: undefined,
        },
        content: {},
      });
    });

    it('should override customCSSUrl with embedConfig.customizations.style.customCSSUrl if defined', () => {
      const embedConfig: Partial<WebViewConfig> = {
        customizations: {
          style: {
            customCSSUrl: 'http://example.com/custom.css',
            customCSS: { 
                rules_UNSTABLE: {
                    '.title': { fontSize: '20px' },
                }
             },
          },
        },
      };

      const result = getCustomisationsMobileEmbed(embedConfig as WebViewConfig);
      expect(result.style?.customCSSUrl).toBe('http://example.com/custom.css');
      expect(result.style?.customCSS).toEqual({ 
        rules_UNSTABLE: {
            '.title': { fontSize: '20px' },
        }
       });
    });
  });

