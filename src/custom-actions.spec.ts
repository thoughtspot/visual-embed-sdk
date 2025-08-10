import { CustomActions } from './custom-actions';
import { CustomAction, CustomActionsPosition, CustomActionTarget } from './types';
import { logger } from './utils/logger';

// Mock logger
jest.mock('./utils/logger', () => ({
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('CustomActions class', () => {
    describe('Static getCustomActions method', () => {
        test('should return empty result for empty array', () => {
            const result = CustomActions.getCustomActions([]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toEqual([]);
        });

        test('should return empty result for null/undefined input', () => {
            const result1 = CustomActions.getCustomActions(null as any);
            expect(result1.actions).toEqual([]);
            expect(result1.errors).toEqual([]);

            const result2 = CustomActions.getCustomActions(undefined as any);
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
            const result = CustomActions.getCustomActions(actions);
            
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
            const result = CustomActions.getCustomActions(actions);
            
            expect(result.actions).toEqual([actions[0]]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Spotter-level custom actions cannot have position 'PRIMARY'");
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
            const result = CustomActions.getCustomActions(actions);
            
            expect(result.actions).toHaveLength(2);
            expect(result.actions[0].name).toBe('Alpha Action');
            expect(result.actions[1].name).toBe('Zebra Action');
        });
    });

    describe('Input Validation', () => {
        test('should return false for null action', () => {
            const result = CustomActions.getCustomActions([null as any]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
        });

        test('should return false for undefined action', () => {
            const result = CustomActions.getCustomActions([undefined as any]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
        });

        test('should return false for non-object action', () => {
            const result = CustomActions.getCustomActions(['string' as any]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
        });
    });

    describe('Required Fields Validation', () => {
        test('should return false when id is missing', () => {
            const action: Partial<CustomAction> = {
                name: 'Test Action',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const result = CustomActions.getCustomActions([action as CustomAction]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Missing required fields: id");
        });

        test('should return false when target is missing', () => {
            const action: Partial<CustomAction> = {
                name: 'Test Action',
                id: 'test-id',
                position: CustomActionsPosition.PRIMARY,
            };
            const result = CustomActions.getCustomActions([action as CustomAction]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Missing required fields: target");
        });

        test('should return false when position is missing', () => {
            const action: Partial<CustomAction> = {
                name: 'Test Action',
                id: 'test-id',
                target: CustomActionTarget.LIVEBOARD,
            };
            const result = CustomActions.getCustomActions([action as CustomAction]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Missing required fields: position");
        });

        test('should return false when multiple required fields are missing', () => {
            const action: Partial<CustomAction> = {
                name: 'Test Action',
            };
            const result = CustomActions.getCustomActions([action as CustomAction]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Missing required fields: id, target, position");
        });
    });

    describe('Target Type Validation', () => {
        test('should return false for unsupported target type', () => {
            const action: CustomAction = {
                name: 'Test Action',
                id: 'test-id',
                target: 'UNSUPPORTED' as CustomActionTarget,
                position: CustomActionsPosition.PRIMARY,
            };
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Target type 'UNSUPPORTED' is not supported");
        });
    });

    describe('Position Validation', () => {
        test('should return false for invalid position for VIZ target', () => {
            const action: CustomAction = {
                name: 'Test Action',
                id: 'test-id',
                target: CustomActionTarget.VIZ,
                position: 'INVALID_POSITION' as CustomActionsPosition,
            };
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Position 'INVALID_POSITION' is not supported for viz-level custom actions");
        });
    });

    describe('Field Validation', () => {
        test('should return false for unsupported top-level field for LIVEBOARD target', () => {
            const action: CustomAction = {
                name: 'Test Action',
                id: 'test-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                dataModelIds: { modelIds: ['model1'] }, // Not allowed for LIVEBOARD
            } as CustomAction;
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Invalid fields for liveboard-level custom actions: dataModelIds");
        });

        test('should return false for unsupported metadataIds field for ANSWER target', () => {
            const action: CustomAction = {
                name: 'Test Action',
                id: 'test-id',
                target: CustomActionTarget.ANSWER,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    liveboardIds: ['lb1'], // Not allowed for ANSWER
                },
            };
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Invalid metadata IDs for answer-level custom actions: liveboardIds");
        });

        test('should return false for unsupported dataModelIds field for SPOTTER target', () => {
            const action: CustomAction = {
                name: 'Test Action',
                id: 'test-id',
                target: CustomActionTarget.SPOTTER,
                position: CustomActionsPosition.MENU,
                dataModelIds: {
                    modelColumnNames: ['col1'], // Not allowed for SPOTTER
                },
            };
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Invalid data model IDs for spotter-level custom actions: modelColumnNames");
        });
    });

    describe('Valid Custom Actions', () => {
        test('should return true for valid LIVEBOARD custom action', () => {
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
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });

        test('should return true for valid VIZ custom action', () => {
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
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });

        test('should return true for valid ANSWER custom action', () => {
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
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });

        test('should return true for valid SPOTTER custom action', () => {
            const action: CustomAction = {
                name: 'Test Spotter Action',
                id: 'test-spotter-id',
                target: CustomActionTarget.SPOTTER,
                position: CustomActionsPosition.MENU,
                dataModelIds: {
                    modelIds: ['model1'],
                },
                orgIds: ['org1'],
                groupIds: ['group1'],
            };
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });
    });

    describe('Mixed Valid and Invalid Actions', () => {
        test('should filter out invalid actions and return only valid ones', () => {
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

            const result = CustomActions.getCustomActions([validAction, invalidAction]);
            expect(result.actions).toEqual([validAction]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Liveboard-level custom actions cannot have position 'CONTEXTMENU'");
        });
    });

    describe('Duplicate ID Validation', () => {
        test('should handle duplicate IDs by keeping first action', () => {
            const action1: CustomAction = {
                name: 'CA1',
                id: 'duplicate-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const action2: CustomAction = {
                name: 'CA2',
                id: 'duplicate-id',
                target: CustomActionTarget.VIZ,
                position: CustomActionsPosition.MENU,
            };

            const result = CustomActions.getCustomActions([action1, action2]);
            expect(result.actions).toHaveLength(1);
            expect(result.actions[0]).toEqual(action1);
        });
    });

    describe('Primary Action Validation', () => {
        test('should allow first primary action for a target', () => {
            const action: CustomAction = {
                name: 'First Primary Action',
                id: 'first-primary-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
                metadataIds: {
                    liveboardIds: ['lb1'],
                },
            };
            const result = CustomActions.getCustomActions([action]);
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });

        test('should reject second primary action for the same target', () => {
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
            const result = CustomActions.getCustomActions([firstAction, secondAction]);
            expect(result.actions).toEqual([firstAction]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toBe("Multiple primary actions found for liveboard-level custom actions: 'First Primary Action' and 'Second Primary Action'. Only the first action will be shown.");
        });

        test('should allow primary actions for different targets', () => {
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
            const result = CustomActions.getCustomActions([liveboardAction, vizAction]);
            expect(result.actions).toEqual([liveboardAction, vizAction]);
            expect(result.errors).toEqual([]);
        });
    });

    describe('SPOTTER with PRIMARY position validation', () => {
        test('should reject SPOTTER target with PRIMARY position', () => {
            const action: CustomAction = {
                name: 'Test Spotter Action',
                id: 'test-spotter-id',
                target: CustomActionTarget.SPOTTER,
                position: CustomActionsPosition.PRIMARY,
            };
            const result = CustomActions.getCustomActions([action]);
            
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Spotter-level custom actions cannot have position 'PRIMARY'");
        });

        test('should accept SPOTTER target with MENU position', () => {
            const action: CustomAction = {
                name: 'Test Spotter Action',
                id: 'test-spotter-id',
                target: CustomActionTarget.SPOTTER,
                position: CustomActionsPosition.MENU,
            };
            const result = CustomActions.getCustomActions([action]);
            
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });
    });

    describe('LIVEBOARD with CONTEXTMENU position validation', () => {
        test('should reject LIVEBOARD target with CONTEXTMENU position', () => {
            const action: CustomAction = {
                name: 'Test Liveboard Action',
                id: 'test-liveboard-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.CONTEXTMENU,
            };
            const result = CustomActions.getCustomActions([action]);
            
            expect(result.actions).toEqual([]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Liveboard-level custom actions cannot have position 'CONTEXTMENU'");
        });

        test('should accept LIVEBOARD target with PRIMARY position', () => {
            const action: CustomAction = {
                name: 'Test Liveboard Action',
                id: 'test-liveboard-id',
                target: CustomActionTarget.LIVEBOARD,
                position: CustomActionsPosition.PRIMARY,
            };
            const result = CustomActions.getCustomActions([action]);
            
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
        });
    });
}); 