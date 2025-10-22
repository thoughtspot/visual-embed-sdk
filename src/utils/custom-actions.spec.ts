import { getCustomActions } from './custom-actions';
import { CustomAction, CustomActionsPosition, CustomActionTarget } from '../types';
import { logger } from './logger';

// Mock logger
jest.mock('./logger', () => ({
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('getCustomActions function', () => {
    describe('Static getCustomActions method', () => {
        test('should return empty result for empty array', () => {
            const result = getCustomActions([]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toEqual([]);
        });

        test('should return empty result for null/undefined input', () => {
            const result1 = getCustomActions(null as any);
            expect(result1.actions).toEqual([]);
            expect(result1.errors).toEqual([]);

            const result2 = getCustomActions(undefined as any);
            expect(result2.actions).toEqual([]);
            expect(result2.errors).toEqual([]);
        });

        test('should validate and return valid actions', () => {
            const actions: CustomAction[] = [
                {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                },
            ];
            const result = getCustomActions(actions);
            
            expect(result.actions).toEqual(actions);
            expect(result.errors).toEqual([]);
        });

        test('should reject invalid actions and collect errors', () => {
            const actions: CustomAction[] = [
                {
                    name: 'Valid Action',
                    id: 'valid-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                },
                {
                    name: 'Invalid Action',
                    id: 'invalid-id',
                    target: CustomActionTarget.SPOTTER,
                    position: CustomActionsPosition.PRIMARY, // Invalid for SPOTTER
                },
            ];
            const result = getCustomActions(actions);
            
            expect(result.actions).toEqual([actions[0]]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Position 'PRIMARY' is not supported for spotter-level custom actions. Supported positions: MENU, CONTEXTMENU");
        });

        test('should sort actions by name', () => {
            const actions: CustomAction[] = [
                {
                    name: 'Zebra Action',
                    id: 'zebra-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.PRIMARY,
                },
                {
                    name: 'Alpha Action',
                    id: 'alpha-id',
                    target: CustomActionTarget.LIVEBOARD,
                    position: CustomActionsPosition.MENU,
                },
            ];
            const result = getCustomActions(actions);
            
            expect(result.actions).toHaveLength(2);
            expect(result.actions[0].name).toBe('Alpha Action');
            expect(result.actions[1].name).toBe('Zebra Action');
        });
    });

    describe('Input Validation', () => {
        test('should return false for null action', () => {
            const result = getCustomActions([null as any]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
        });

        test('should return false for undefined action', () => {
            const result = getCustomActions([undefined as any]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
        });

        test('should return false for non-object action', () => {
            const result = getCustomActions(['string' as any]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
        });

        test('should return false for action missing id', () => {
            const action = {
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const result = getCustomActions([action as CustomAction]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Missing required fields: id");
        });

        test('should return false for action missing name', () => {
            const action = {
                id: 'test-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const result = getCustomActions([action as CustomAction]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Missing required fields: name");
        });

        test('should return false for action missing target', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                position: CustomActionsPosition.PRIMARY,
            };
            const result = getCustomActions([action as CustomAction]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Missing required fields: target");
        });

        test('should return false for action missing position', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
            };
            const result = getCustomActions([action as CustomAction]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Missing required fields: position");
        });
    });

    describe('Target Type Validation', () => {
        test('should reject unsupported target type', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: 'UNSUPPORTED' as any,
                position: CustomActionsPosition.PRIMARY,
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Target type 'UNSUPPORTED' is not supported");
        });

        test('should accept LIVEBOARD target type', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });

        test('should accept VIZ target type', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.VIZ,
                position: CustomActionsPosition.MENU,
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });

        test('should accept ANSWER target type', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.ANSWER,
                position: CustomActionsPosition.MENU,
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });

        test('should accept SPOTTER target type', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.SPOTTER,
                position: CustomActionsPosition.MENU,
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });
    });

    describe('Position Validation', () => {
        test('should reject invalid position for LIVEBOARD', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.CONTEXTMENU, // Invalid for LIVEBOARD
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors).toContain("Position 'CONTEXTMENU' is not supported for liveboard-level custom actions. Supported positions: PRIMARY, MENU");
        });

        test('should reject invalid position for SPOTTER', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.SPOTTER,
                position: CustomActionsPosition.PRIMARY, // Invalid for SPOTTER
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Position 'PRIMARY' is not supported for spotter-level custom actions. Supported positions: MENU, CONTEXTMENU");
        });

        test('should accept valid positions for LIVEBOARD', () => {
            const primaryAction = {
                id: 'primary-id',
                name: 'Primary Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const menuAction = {
                id: 'menu-id',
                name: 'Menu Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.MENU,
            };
            const result = getCustomActions([primaryAction, menuAction]);
            expect(result.actions).toHaveLength(2);
            expect(result.errors).toEqual([]);
        });
    });

    describe('Metadata IDs Validation', () => {
        test('should reject invalid metadata IDs for LIVEBOARD', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    invalidId: 'some-value',
                },
            } as any;
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Invalid metadata IDs for liveboard-level custom actions: invalidId. Supported metadata IDs: liveboardIds");
        });

        test('should accept valid metadata IDs for LIVEBOARD', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    liveboardIds: ['lb-1', 'lb-2'],
                },
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });
    });

    describe('Data Model IDs Validation', () => {
        test('should reject invalid data model IDs for VIZ', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.VIZ,
                position: CustomActionsPosition.MENU,
                dataModelIds: {
                    invalidId: 'some-value',
                },
            } as any;
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Invalid data model IDs for viz-level custom actions: invalidId. Supported data model IDs: modelIds, modelColumnNames");
        });

        test('should accept valid data model IDs for VIZ', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.VIZ,
                position: CustomActionsPosition.MENU,
                dataModelIds: {
                    modelIds: ['model-1'],
                    modelColumnNames: ['col-1'],
                },
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });
    });

    describe('Field Validation', () => {
        test('should reject invalid fields for LIVEBOARD', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                invalidField: 'some-value',
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Invalid fields for liveboard-level custom actions: invalidField. Supported fields: name, id, position, target, metadataIds, orgIds, groupIds");
        });

        test('should accept valid fields for LIVEBOARD', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                orgIds: ['org-1'],
                groupIds: ['group-1'],
            };
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });
    });

    describe('Duplicate ID Handling', () => {
        test('should keep only the first action when duplicate IDs are found and report duplicate errors', () => {
            const action1 = {
                id: 'duplicate-id',
                name: 'First Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const action2 = {
                id: 'duplicate-id',
                name: 'Second Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.MENU,
            };
            const result = getCustomActions([action1, action2]);
            expect(result.actions).toHaveLength(1);
            expect(result.actions[0]).toEqual(action1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Duplicate custom action ID 'duplicate-id' found");
            expect(result.errors[0]).toContain("Actions with names 'Second Action' will be ignored");
            expect(result.errors[0]).toContain("Keeping 'First Action'");
        });
    });

    describe('Complex Validation Scenarios', () => {
        test('should handle multiple validation errors for a single action', () => {
            const action = {
                id: 'test-id',
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.CONTEXTMENU, // Invalid position
                metadataIds: {
                    invalidId: 'some-value', // Invalid metadata ID
                },
                invalidField: 'some-value', // Invalid field
            } as any;
            const result = getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(3);
            expect(result.errors).toContain("Position 'CONTEXTMENU' is not supported for liveboard-level custom actions. Supported positions: PRIMARY, MENU");
            expect(result.errors).toContain("Invalid metadata IDs for liveboard-level custom actions: invalidId. Supported metadata IDs: liveboardIds");
            expect(result.errors).toContain("Invalid fields for liveboard-level custom actions: invalidField. Supported fields: name, id, position, target, metadataIds, orgIds, groupIds");
        });

        test('should handle mix of valid and invalid actions', () => {
            const validAction = {
                id: 'valid-id',
                name: 'Valid Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const invalidAction = {
                id: 'invalid-id',
                name: 'Invalid Action',
                target: CustomActionTarget.SPOTTER,
                position: CustomActionsPosition.PRIMARY, // Invalid for SPOTTER
            };
            const result = getCustomActions([validAction, invalidAction]);
            expect(result.actions).toEqual([validAction]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Position 'PRIMARY' is not supported for spotter-level custom actions. Supported positions: MENU, CONTEXTMENU");
        });
    });

    describe('Warnings', () => {
        test('should warn when action name length exceeds 30 characters', () => {
            // Arrange
            const longName = 'A'.repeat(31);
            const action: CustomAction = {
                id: 'long-name-id',
                name: longName,
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };

            // Act
            const result = getCustomActions([action]);

            // Assert
            expect(result.actions).toHaveLength(1);
            expect(logger.warn).toHaveBeenCalledWith([
                `Custom action name '${longName}' exceeds 30 characters. This may cause display or truncation issues in the UI.`
            ]);
        });
    });
});
