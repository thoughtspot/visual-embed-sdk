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
    handlePresentEvent,
    handleExitPresentMode,
    getTypeFromValue,
    arrayIncludesString,
    calculateVisibleElementData,
    formatTemplate,
    isValidCssMargin,
    resetValueFromWindow,
    validateHttpUrl,
    setParamIfDefined,
} from './utils';
import { RuntimeFilterOp } from './types';
import { logger } from './utils/logger';
import { ERROR_MESSAGE } from './errors';

// Mock logger
jest.mock('./utils/logger', () => ({
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

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
        let originalLocation: Location;
        beforeEach(() => {
            originalLocation = window.location;
        });
        afterEach(() => {
            window.location.hash = '';
        });

        test('Should return correct value when path is undefined', () => {
            expect(getRedirectUrl('http://myhost:3000', 'hashFrag')).toBe(
                'http://myhost:3000#?tsSSOMarker=hashFrag',
            );
            expect(getRedirectUrl('http://xyz.com/#foo', 'bar')).toBe('http://xyz.com/#foo?tsSSOMarker=bar');
        });

        test('Should return correct value when path is set', () => {
            expect(getRedirectUrl('http://myhost:3000/', 'hashFrag', '/bar')).toBe(
                'http://localhost/bar#?tsSSOMarker=hashFrag',
            );

            expect(getRedirectUrl('http://myhost:3000/#/foo', 'hashFrag', '#/bar')).toBe(
                'http://localhost/#/bar?tsSSOMarker=hashFrag',
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
        expect(isUndefined(null)).toBe(false);
        expect(isUndefined('')).toBe(false);
        expect(isUndefined(0)).toBe(false);
    });

    test('removeTypename should handle edge cases', () => {
        expect(removeTypename(null)).toBe(null);
        expect(removeTypename(undefined)).toBe(undefined);
        expect(removeTypename('string')).toBe('string');
        expect(removeTypename(123)).toBe(123);
    });

    test('getTypeFromValue should return correct types', () => {
        expect(getTypeFromValue('test')).toEqual(['char', 'string']);
        expect(getTypeFromValue(123)).toEqual(['double', 'double']);
        expect(getTypeFromValue(true)).toEqual(['boolean', 'boolean']);
        expect(getTypeFromValue(false)).toEqual(['boolean', 'boolean']);
        expect(getTypeFromValue(null)).toEqual(['', '']);
        expect(getTypeFromValue(undefined)).toEqual(['', '']);
        expect(getTypeFromValue({})).toEqual(['', '']);
        expect(getTypeFromValue([])).toEqual(['', '']);
    });

    describe('getValueFromWindow and storeValueInWindow', () => {
        test('Store and retrieve', () => {
            storeValueInWindow('test', 'testValue');
            expect(getValueFromWindow('test')).toBe('testValue');
        });

        test('Object should be set if not', () => {

            (window as any)._tsEmbedSDK = null;

            storeValueInWindow('test', 'testValue');
            expect(getValueFromWindow('test')).toBe('testValue');
        });

        test('Return undefined if key is not found', () => {
            expect(getValueFromWindow('notFound')).toBe(undefined);
        });

        test('Store with ignoreIfAlreadyExists option', () => {
            storeValueInWindow('test2', 'firstValue');
            const result = storeValueInWindow('test2', 'secondValue', { ignoreIfAlreadyExists: true });
            expect(result).toBe('firstValue');
            expect(getValueFromWindow('test2')).toBe('firstValue');
        });
    });
});

describe('Fullscreen Utility Functions', () => {
    let originalExitFullscreen: any;
    let mockIframe: HTMLIFrameElement;

    beforeEach(() => {
        jest.clearAllMocks();

        // Store and mock exitFullscreen
        originalExitFullscreen = document.exitFullscreen;
        document.exitFullscreen = jest.fn();

        // Mock iframe
        mockIframe = {
            requestFullscreen: jest.fn(),
        } as any;

        // Mock not in fullscreen initially
        Object.defineProperty(document, 'fullscreenElement', {
            writable: true,
            value: null,
        });
    });

    afterEach(() => {
        // Restore original method
        document.exitFullscreen = originalExitFullscreen;
    });

    describe('handlePresentEvent', () => {
        it('should enter fullscreen when iframe is provided', () => {
            const mockPromise = Promise.resolve();
            (mockIframe.requestFullscreen as jest.Mock).mockReturnValue(mockPromise);

            handlePresentEvent(mockIframe);

            expect(mockIframe.requestFullscreen).toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should log error when fullscreen API is not supported', () => {
            delete (mockIframe as any).requestFullscreen;

            handlePresentEvent(mockIframe);

            expect(logger.error).toHaveBeenCalledWith('Fullscreen API is not supported by this browser.');
        });

        it('should not attempt fullscreen when already in fullscreen mode', () => {
            Object.defineProperty(document, 'fullscreenElement', {
                writable: true,
                value: mockIframe,
            });

            handlePresentEvent(mockIframe);

            expect(mockIframe.requestFullscreen).not.toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    describe('handleExitPresentMode', () => {
        beforeEach(() => {
            // Mock being in fullscreen
            Object.defineProperty(document, 'fullscreenElement', {
                writable: true,
                value: document.createElement('iframe'),
            });
        });

        it('should exit fullscreen when in fullscreen mode', () => {
            const mockPromise = Promise.resolve();
            (document.exitFullscreen as jest.Mock).mockReturnValue(mockPromise);

            handleExitPresentMode();

            expect(document.exitFullscreen).toHaveBeenCalled();
            expect(logger.warn).not.toHaveBeenCalled();
        });

        it('should not attempt to exit when not in fullscreen mode', () => {
            Object.defineProperty(document, 'fullscreenElement', {
                writable: true,
                value: null,
            });

            handleExitPresentMode();

            expect(document.exitFullscreen).not.toHaveBeenCalled();
            expect(logger.warn).not.toHaveBeenCalled();
        });

        it('should log warning when exit fullscreen API is not supported', () => {
            // Mock being in fullscreen but no exit methods available
            document.exitFullscreen = undefined as any;

            handleExitPresentMode();

            expect(logger.warn).toHaveBeenCalledWith('Exit fullscreen API is not supported by this browser.');
        });
    });

    describe('arrayIncludesString', () => {
        it('should return true when string is found in array', () => {
            const arr = ['test', 'example', 'value'];
            expect(arrayIncludesString(arr, 'test')).toBe(true);
            expect(arrayIncludesString(arr, 'example')).toBe(true);
            expect(arrayIncludesString(arr, 'value')).toBe(true);
        });

        it('should return false when string is not found in array', () => {
            const arr = ['test', 'example', 'value'];
            expect(arrayIncludesString(arr, 'notfound')).toBe(false);
            expect(arrayIncludesString(arr, '')).toBe(false);
        });

        it('should handle empty array', () => {
            const arr: readonly unknown[] = [];
            expect(arrayIncludesString(arr, 'test')).toBe(false);
        });

        it('should handle array with non-string values', () => {
            const arr = ['test', 123, true, 'value'];
            expect(arrayIncludesString(arr, 'test')).toBe(true);
            expect(arrayIncludesString(arr, 'value')).toBe(true);
            expect(arrayIncludesString(arr, '123')).toBe(false); // string '123' not found
        });

        it('should be case sensitive', () => {
            const arr = ['Test', 'Example', 'Value'];
            expect(arrayIncludesString(arr, 'test')).toBe(false);
            expect(arrayIncludesString(arr, 'Test')).toBe(true);
        });
    });
});

describe('calculateVisibleElementData', () => {
    let mockElement: HTMLElement;
    let originalInnerHeight: number;
    let originalInnerWidth: number;

    beforeEach(() => {
        // Store original window dimensions
        originalInnerHeight = window.innerHeight;
        originalInnerWidth = window.innerWidth;

        // Mock window dimensions
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 800,
        });
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200,
        });

        // Create mock element
        mockElement = document.createElement('div');
    });

    afterEach(() => {
        // Restore original window dimensions
        Object.defineProperty(window, 'innerHeight', {
            value: originalInnerHeight,
        });
        Object.defineProperty(window, 'innerWidth', {
            value: originalInnerWidth,
        });
    });

    it('should calculate data for fully visible element', () => {
        // Mock getBoundingClientRect for element fully within viewport
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: 100,
            left: 150,
            bottom: 300,
            right: 400,
            width: 250,
            height: 200,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 0, // Not clipped from top
            height: 200, // Full height visible
            left: 0, // Not clipped from left
            width: 250, // Full width visible
        });
    });

    it('should calculate data for element clipped from top', () => {
        // Mock getBoundingClientRect for element partially above viewport
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: -50,
            left: 100,
            bottom: 150,
            right: 400,
            width: 300,
            height: 200,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 50, // Clipped 50px from top
            height: 150, // 150px visible height (0 to 150)
            left: 0, // Not clipped from left
            width: 300, // Full width visible
        });
    });

    it('should calculate data for element clipped from left', () => {
        // Mock getBoundingClientRect for element partially left of viewport
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: 100,
            left: -80,
            bottom: 300,
            right: 200,
            width: 280,
            height: 200,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 0, // Not clipped from top
            height: 200, // Full height visible
            left: 80, // Clipped 80px from left
            width: 200, // 200px visible width (0 to 200)
        });
    });

    it('should calculate data for element clipped from bottom', () => {
        // Mock getBoundingClientRect for element extending below viewport
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: 600,
            left: 100,
            bottom: 950, // Extends beyond window height of 800
            right: 400,
            width: 300,
            height: 350,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 0, // Not clipped from top
            height: 200, // Only 200px visible (600 to 800)
            left: 0, // Not clipped from left
            width: 300, // Full width visible
        });
    });

    it('should calculate data for element clipped from right', () => {
        // Mock getBoundingClientRect for element extending beyond right edge
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: 100,
            left: 1000,
            bottom: 300,
            right: 1400, // Extends beyond window width of 1200
            width: 400,
            height: 200,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 0, // Not clipped from top
            height: 200, // Full height visible
            left: 0, // Not clipped from left
            width: 200, // Only 200px visible width (1000 to 1200)
        });
    });

    it('should calculate data for element clipped from multiple sides', () => {
        // Mock getBoundingClientRect for element clipped from top and left
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: -100,
            left: -50,
            bottom: 200,
            right: 300,
            width: 350,
            height: 300,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 100, // Clipped 100px from top
            height: 200, // 200px visible height (0 to 200)
            left: 50, // Clipped 50px from left
            width: 300, // 300px visible width (0 to 300)
        });
    });

    it('should handle element completely outside viewport (above)', () => {
        // Mock getBoundingClientRect for element completely above viewport
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: -300,
            left: 100,
            bottom: -100,
            right: 400,
            width: 300,
            height: 200,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 300, // Clipped 300px from top
            height: 0, // No visible height (clamped from negative)
            left: 0, // Not clipped from left
            width: 300, // Full width would be visible if in viewport
        });
    });

    it('should handle element completely outside viewport (left)', () => {
        // Mock getBoundingClientRect for element completely left of viewport
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: 100,
            left: -400,
            bottom: 300,
            right: -100,
            width: 300,
            height: 200,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 0, // Not clipped from top
            height: 200, // Full height would be visible if in viewport
            left: 400, // Clipped 400px from left
            width: 0, // No visible width (min(1200, -100) - max(-400, 0) = -100 - 0 = -100, but clamped)
        });
    });

    it('should handle element larger than viewport', () => {
        // Mock getBoundingClientRect for element larger than viewport
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: -200,
            left: -300,
            bottom: 1000,
            right: 1500,
            width: 1800,
            height: 1200,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 200, // Clipped 200px from top
            height: 800, // Visible height equals window height
            left: 300, // Clipped 300px from left
            width: 1200, // Visible width equals window width
        });
    });

    it('should handle element exactly at viewport boundaries', () => {
        // Mock getBoundingClientRect for element at exact viewport boundaries
        jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            bottom: 800,
            right: 1200,
            width: 1200,
            height: 800,
        } as DOMRect);

        const result = calculateVisibleElementData(mockElement);

        expect(result).toEqual({
            top: 0, // Not clipped from top
            height: 800, // Full viewport height
            left: 0, // Not clipped from left
            width: 1200, // Full viewport width
        });
    });
});

describe('formatTemplate', () => {
    it('should replace placeholders with provided values', () => {
        expect(
            formatTemplate('Hello {name}, you are {age} years old', { name: 'John', age: 30 }),
        ).toBe('Hello John, you are 30 years old');
        expect(
            formatTemplate('Expected {type}, but received {actual}', {
                type: 'string',
                actual: 'number',
            }),
        ).toBe('Expected string, but received number');
        expect(
            formatTemplate('Hello {name}, you are {age} years old', { name: 'John' }),
        ).toBe('Hello John, you are {age} years old');
    });
});

describe('isValidCssMargin', () => {
    it('should return true for valid CSS margin values', () => {
        expect(isValidCssMargin('10px')).toBe(true);
        expect(isValidCssMargin('0px')).toBe(true);
        expect(isValidCssMargin('20%')).toBe(true);
        expect(isValidCssMargin('0')).toBe(true);
    });

    it('should return false for invalid CSS margin values', () => {
        expect(isValidCssMargin('')).toBe(false);
        expect(isValidCssMargin('   ')).toBe(false);
        expect(isValidCssMargin('invalid')).toBe(false);
        expect(isValidCssMargin('10')).toBe(false); // missing unit
    });
});

describe('getValueFromWindow and storeValueInWindow', () => {
    describe('SSR environment handling', () => {
        let originalWindow: typeof globalThis.window;
        beforeEach(() => {
            originalWindow = global.window;
        });

        afterEach(() => {
            global.window = originalWindow;
        });

        test('storeValueInWindow should log error in SSR environment', () => {
            delete global.window;
            
            const result = storeValueInWindow('testKey', 'testValue');
            
            expect(logger.error).toHaveBeenCalledWith(
                ERROR_MESSAGE.SSR_ENVIRONMENT_ERROR
            );
            expect(result).toBe('testValue');
        });

        test('getValueFromWindow should log error in SSR environment', () => {
            delete global.window;
            
            const result = getValueFromWindow('testKey');
            
            expect(logger.error).toHaveBeenCalledWith(
                ERROR_MESSAGE.SSR_ENVIRONMENT_ERROR
            );
            expect(result).toBeUndefined();
        });

        test('resetValueFromWindow should log error in SSR environment', () => {
            delete global.window;
            
            const result = resetValueFromWindow('testKey');
            
            expect(logger.error).toHaveBeenCalledWith(
                ERROR_MESSAGE.SSR_ENVIRONMENT_ERROR
            );
            expect(result).toBe(false);
        });
    });
    describe('resetValueFromWindow', () => {
        beforeEach(() => {
            (window as any)._tsEmbedSDK = {};
        });

        test('should reset existing key and return true', () => {
            storeValueInWindow('keyToReset', 'someValue');
            expect(getValueFromWindow('keyToReset')).toBe('someValue');

            const result = resetValueFromWindow('keyToReset');

            expect(result).toBe(true);
            expect(getValueFromWindow('keyToReset')).toBe(undefined);
        });

        test('should return false when key does not exist', () => {
            const result = resetValueFromWindow('nonExistentKey');
            expect(result).toBe(false);
        });

        test('should only reset the specified key', () => {
            storeValueInWindow('key1', 'value1');
            storeValueInWindow('key2', 'value2');

            resetValueFromWindow('key1');

            expect(getValueFromWindow('key1')).toBe(undefined);
            expect(getValueFromWindow('key2')).toBe('value2');
        });
    });

    describe('validateHttpUrl', () => {
        test.each([
            ['http URL', 'http://example.com'],
            ['https URL', 'https://example.com'],
            ['https URL with path', 'https://docs.example.com/spotter'],
            ['https URL with query params', 'https://example.com/path?foo=bar'],
        ])('should return [true, null] for valid %s', (_, url) => {
            const [isValid, error] = validateHttpUrl(url);
            expect(isValid).toBe(true);
            expect(error).toBeNull();
        });

        test.each([
            ['ftp protocol', 'ftp://example.com', 'ftp:'],
            ['file protocol', 'file:///path/to/file', 'file:'],
            ['javascript protocol', 'javascript:alert(1)', 'javascript:'],
        ])('should return [false, Error] for %s', (_, url, protocol) => {
            const [isValid, error] = validateHttpUrl(url);
            expect(isValid).toBe(false);
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toContain('Invalid protocol');
            expect(error?.message).toContain(protocol);
        });

        test.each([
            ['invalid URL format', 'not-a-valid-url'],
            ['empty string', ''],
            ['URL without protocol', 'example.com'],
        ])('should return [false, Error] for %s', (_, url) => {
            const [isValid, error] = validateHttpUrl(url);
            expect(isValid).toBe(false);
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('setParamIfDefined', () => {
        test.each([
            ['string value', 'testParam', 'testValue', false, 'testValue'],
            ['number value', 'numParam', 42, false, 42],
            ['truthy value as boolean', 'boolParam', 'truthy', true, true],
            ['falsy value as boolean', 'boolParam', 0, true, false],
        ])('should set %s correctly', (_, param, value, asBoolean, expected) => {
            const queryParams: Record<string, unknown> = {};
            setParamIfDefined(queryParams, param, value, asBoolean);
            expect(queryParams[param]).toBe(expected);
        });

        test('should not set param when value is undefined', () => {
            const queryParams: Record<string, unknown> = {};
            setParamIfDefined(queryParams, 'testParam', undefined);
            expect(queryParams.testParam).toBeUndefined();
        });
    });
});
