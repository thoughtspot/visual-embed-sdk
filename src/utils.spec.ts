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
    getCustomActions,
    resetPrimaryActionsTracking,
    getTypeFromValue,
    calculateVisibleElementData,
} from './utils';
import { RuntimeFilterOp, CustomAction, CustomActionsPosition, CustomActionTarget } from './types';
import { logger } from './utils/logger';

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
});

describe('Custom Action Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the primary actions tracking Map between tests
        resetPrimaryActionsTracking();
    });

    describe('validateCustomAction', () => {
        describe('Input Validation', () => {
            it('should return false for null action', () => {
                const result = getCustomActions([null as any]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith('Custom Action Validation Error: Invalid action object provided');
            });

            it('should return false for undefined action', () => {
                const result = getCustomActions([undefined as any]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith('Custom Action Validation Error: Invalid action object provided');
            });

            it('should return false for non-object action', () => {
                const result = getCustomActions(['string' as any]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith('Custom Action Validation Error: Invalid action object provided');
            });
        });

        describe('Required Fields Validation', () => {
            it('should return false when id is missing', () => {
                const action: Partial<CustomAction> = {
                    name: 'Test Action',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                };
                const result = getCustomActions([action as CustomAction]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Missing required fields: id")
                );
            });

            it('should return false when target is missing', () => {
                const action: Partial<CustomAction> = {
                    name: 'Test Action',
                    id: 'test-id',
                    position: CustomActionsPosition.PRIMARY,
                };
                const result = getCustomActions([action as CustomAction]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Missing required fields: target")
                );
            });

            it('should return false when position is missing', () => {
                const action: Partial<CustomAction> = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.LIVEBOARD,
                };
                const result = getCustomActions([action as CustomAction]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Missing required fields: position")
                );
            });

            it('should return false when multiple required fields are missing', () => {
                const action: Partial<CustomAction> = {
                    name: 'Test Action',
                };
                const result = getCustomActions([action as CustomAction]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Missing required fields: id, target, position")
                );
            });
        });

        describe('Target Type Validation', () => {
            it('should return false for unsupported target type', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: 'UNSUPPORTED' as CustomActionTarget,
                    position: CustomActionsPosition.PRIMARY,
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Target type 'UNSUPPORTED' is not supported")
                );
            });
        });

        describe('Position Validation', () => {
            it('should return false for invalid position for LIVEBOARD target', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.CONTEXTMENU,
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Position 'CONTEXTMENU' is not supported for liveboard-level custom actions")
                );
            });

            it('should return false for invalid position for VIZ target', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.VIZ,
                    position: 'INVALID_POSITION' as CustomActionsPosition,
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Position 'INVALID_POSITION' is not supported for viz-level custom actions")
                );
            });
        });

        describe('Liveboard CONTEXTMENU Validation', () => {
            it('should return false when LIVEBOARD target has CONTEXTMENU position', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.CONTEXTMENU,
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Liveboard-level custom actions cannot have position 'CONTEXTMENU'")
                );
            });
        });

        describe('Field Validation', () => {
            it('should return false for unsupported top-level field for LIVEBOARD target', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                    dataModelIds: { modelIds: ['model1'] }, // Not allowed for LIVEBOARD
                } as CustomAction;
                const result = getCustomActions([action]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Field 'dataModelIds' is not supported in liveboard-level custom actions")
                );
            });

            it('should return false for unsupported metadataIds field for ANSWER target', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.ANSWER,
                    position: CustomActionsPosition.PRIMARY,
                    metadataIds: {
                        liveboardIds: ['lb1'], // Not allowed for ANSWER
                    },
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Field 'liveboardIds' in metadataIds is not supported in answer-level custom actions")
                );
            });

            it('should return false for unsupported dataModelIds field for SPOTTER target', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.SPOTTER,
                    position: CustomActionsPosition.PRIMARY,
                    dataModelIds: {
                        modelColumnNames: ['col1'], // Not allowed for SPOTTER
                    },
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Field 'modelColumnNames' in dataModelIds is not supported in spotter-level custom actions")
                );
            });
        });

        describe('Valid Custom Actions', () => {
            it('should return true for valid LIVEBOARD custom action', () => {
                const action: CustomAction = {
                    name: 'Test Liveboard Action',
                    id: 'test-liveboard-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                    metadataIds: {
                        liveboardIds: ['lb1', 'lb2'],
                    },
                    orgIds: ['org1'],
                    groupIds: ['group1'],
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([action]);
                expect(logger.error).not.toHaveBeenCalled();
            });

            it('should return true for valid VIZ custom action', () => {
                const action: CustomAction = {
                    name: 'Test Viz Action',
                    id: 'test-viz-id',
                    target: CustomActionTarget.VIZ,
                    position: CustomActionsPosition.CONTEXTMENU,
                    metadataIds: {
                        liveboardIds: ['lb1'],
                        vizIds: ['viz1'],
                        answerIds: ['ans1'],
                    },
                    dataModelIds: {
                        modelIds: ['model1'],
                        modelColumnNames: ['col1'],
                    },
                    orgIds: ['org1'],
                    groupIds: ['group1'],
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([action]);
                expect(logger.error).not.toHaveBeenCalled();
            });

            it('should return true for valid ANSWER custom action', () => {
                const action: CustomAction = {
                    name: 'Test Answer Action',
                    id: 'test-answer-id',
                    target: CustomActionTarget.ANSWER,
                    position: CustomActionsPosition.MENU,
                    metadataIds: {
                        answerIds: ['ans1', 'ans2'],
                    },
                    dataModelIds: {
                        modelIds: ['model1'],
                        modelColumnNames: ['col1'],
                    },
                    orgIds: ['org1'],
                    groupIds: ['group1'],
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([action]);
                expect(logger.error).not.toHaveBeenCalled();
            });

            it('should return true for valid SPOTTER custom action', () => {
                const action: CustomAction = {
                    name: 'Test Spotter Action',
                    id: 'test-spotter-id',
                    target: CustomActionTarget.SPOTTER,
                    position: CustomActionsPosition.PRIMARY,
                    dataModelIds: {
                        modelIds: ['model1'],
                    },
                    orgIds: ['org1'],
                    groupIds: ['group1'],
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([action]);
                expect(logger.error).not.toHaveBeenCalled();
            });
        });

        describe('Mixed Valid and Invalid Actions', () => {
            it('should filter out invalid actions and return only valid ones', () => {
                const validAction: CustomAction = {
                    name: 'Valid Action',
                    id: 'valid-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                };

                const invalidAction: CustomAction = {
                    name: 'Invalid Action',
                    id: 'invalid-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.CONTEXTMENU, // Invalid for LIVEBOARD
                };

                const result = getCustomActions([validAction, invalidAction]);
                expect(result).toEqual([validAction]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("Liveboard-level custom actions cannot have position 'CONTEXTMENU'")
                );
            });

            it('should handle empty array', () => {
                const result = getCustomActions([]);
                expect(result).toEqual([]);
                expect(logger.error).not.toHaveBeenCalled();
            });

            it('should handle null/undefined array', () => {
                const result = getCustomActions(null as any);
                expect(result).toEqual([]);
                expect(logger.error).not.toHaveBeenCalled();
            });
        });

        describe('Edge Cases', () => {
            it('should handle action with empty metadataIds object', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                    metadataIds: {},
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([action]);
                expect(logger.error).not.toHaveBeenCalled();
            });

            it('should handle action with empty dataModelIds object', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.VIZ,
                    position: CustomActionsPosition.PRIMARY,
                    dataModelIds: {},
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([action]);
                expect(logger.error).not.toHaveBeenCalled();
            });

            it('should handle action with null metadataIds', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                    metadataIds: null as any,
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([action]);
                expect(logger.error).not.toHaveBeenCalled();
            });

            it('should handle action with null dataModelIds', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.VIZ,
                    position: CustomActionsPosition.PRIMARY,
                    dataModelIds: null as any,
                };
                const result = getCustomActions([action]);
                expect(result).toEqual([action]);
                expect(logger.error).not.toHaveBeenCalled();
            });
        });
    });

    describe('Primary Action Validation', () => {
        it('should allow first primary action for a target', () => {
            const action: CustomAction = {
                name: 'First Primary Action',
                id: 'first-primary-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    liveboardIds: ['lb1'],
                },
            };
            const result = getCustomActions([action]);
            expect(result).toEqual([action]);
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should reject second primary action for the same target', () => {
            const firstAction: CustomAction = {
                name: 'First Primary Action',
                id: 'first-primary-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    liveboardIds: ['lb1'],
                },
            };
            const secondAction: CustomAction = {
                name: 'Second Primary Action',
                id: 'second-primary-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    liveboardIds: ['lb2'],
                },
            };
            const result = getCustomActions([firstAction, secondAction]);
            expect(result).toEqual([firstAction]);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Multiple primary custom actions found for target 'LIVEBOARD'. Action 'second-primary-id' will be ignored. Only the first primary action 'first-primary-id' will be shown.")
            );
        });

        it('should allow primary actions for different targets', () => {
            const liveboardAction: CustomAction = {
                name: 'Liveboard Primary Action',
                id: 'liveboard-primary-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    liveboardIds: ['lb1'],
                },
            };
            const vizAction: CustomAction = {
                name: 'Viz Primary Action',
                id: 'viz-primary-id',
                target: CustomActionTarget.VIZ,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    vizIds: ['viz1'],
                },
            };
            const result = getCustomActions([liveboardAction, vizAction]);
            expect(result).toEqual([liveboardAction, vizAction]);
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should allow non-primary actions for the same target', () => {
            const primaryAction: CustomAction = {
                name: 'Primary Action',
                id: 'primary-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    liveboardIds: ['lb1'],
                },
            };
            const menuAction: CustomAction = {
                name: 'Menu Action',
                id: 'menu-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.MENU,
                metadataIds: {
                    liveboardIds: ['lb2'],
                },
            };
            const result = getCustomActions([primaryAction, menuAction]);
            // After sorting by name: Menu Action comes before Primary Action
            expect(result).toEqual([menuAction, primaryAction]);
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should handle multiple primary actions for different targets with some duplicates', () => {
            const liveboardPrimary1: CustomAction = {
                name: 'Liveboard Primary 1',
                id: 'lb-primary-1',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: { liveboardIds: ['lb1'] },
            };
            const liveboardPrimary2: CustomAction = {
                name: 'Liveboard Primary 2',
                id: 'lb-primary-2',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: { liveboardIds: ['lb2'] },
            };
            const vizPrimary1: CustomAction = {
                name: 'Viz Primary 1',
                id: 'viz-primary-1',
                target: CustomActionTarget.VIZ,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: { vizIds: ['viz1'] },
            };
            const vizPrimary2: CustomAction = {
                name: 'Viz Primary 2',
                id: 'viz-primary-2',
                target: CustomActionTarget.VIZ,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: { vizIds: ['viz2'] },
            };
            const answerAction: CustomAction = {
                name: 'Answer Action',
                id: 'answer-id',
                target: CustomActionTarget.ANSWER,
                position: CustomActionsPosition.MENU,
                metadataIds: { answerIds: ['answer1'] },
            };

            const result = getCustomActions([
                liveboardPrimary1,
                liveboardPrimary2,
                vizPrimary1,
                vizPrimary2,
                answerAction,
            ]);

            // Should keep first primary action for each target and all non-primary actions, then sort by name
            expect(result).toEqual([answerAction, liveboardPrimary1, vizPrimary1]);
            
            // Should log errors for the duplicate primary actions
            expect(logger.error).toHaveBeenCalledTimes(2);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Multiple primary custom actions found for target 'LIVEBOARD'. Action 'lb-primary-2' will be ignored")
            );
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Multiple primary custom actions found for target 'VIZ'. Action 'viz-primary-2' will be ignored")
            );
        });

        it('should maintain order when filtering out duplicate primary actions', () => {
            const action1: CustomAction = {
                name: 'Action 1',
                id: 'action-1',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.MENU,
                metadataIds: { liveboardIds: ['lb1'] },
            };
            const primary1: CustomAction = {
                name: 'Primary 1',
                id: 'primary-1',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: { liveboardIds: ['lb2'] },
            };
            const action2: CustomAction = {
                name: 'Action 2',
                id: 'action-2',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.MENU,
                metadataIds: { liveboardIds: ['lb3'] },
            };
            const primary2: CustomAction = {
                name: 'Primary 2',
                id: 'primary-2',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: { liveboardIds: ['lb4'] },
            };

            const result = getCustomActions([action1, primary1, action2, primary2]);
            
            // Should maintain order and keep first primary action, then sort by name
            expect(result).toEqual([action1, action2, primary1]);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining("Multiple primary custom actions found for target 'LIVEBOARD'. Action 'primary-2' will be ignored")
            );
        });
    });

    it('should sort custom actions by name after validation', () => {
        const actionC: CustomAction = {
            name: 'Charlie Action',
            id: 'action-c',
            target: CustomActionTarget.LIVEBOARD,
            position: CustomActionsPosition.MENU,
            metadataIds: { liveboardIds: ['lb1'] },
        };
        const actionA: CustomAction = {
            name: 'Alpha Action',
            id: 'action-a',
            target: CustomActionTarget.LIVEBOARD,
            position: CustomActionsPosition.MENU,
            metadataIds: { liveboardIds: ['lb2'] },
        };
        const actionB: CustomAction = {
            name: 'Beta Action',
            id: 'action-b',
            target: CustomActionTarget.LIVEBOARD,
            position: CustomActionsPosition.MENU,
            metadataIds: { liveboardIds: ['lb3'] },
        };

        const result = getCustomActions([actionC, actionA, actionB]);
        expect(result).toEqual([actionA, actionB, actionC]);
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
