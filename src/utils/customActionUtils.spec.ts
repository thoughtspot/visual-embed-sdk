import { getCustomActions } from './customActionUtils';
import { CustomAction, CustomActionsPosition, CustomActionTarget } from '../types';
import { logger } from './logger';

// Mock logger
jest.mock('./logger', () => ({
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('Custom Action Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateCustomAction', () => {
        describe('Input Validation', () => {
            it('should return false for null action', () => {
                const result = getCustomActions([null as any]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
            });

            it('should return false for undefined action', () => {
                const result = getCustomActions([undefined as any]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
            });

            it('should return false for non-object action', () => {
                const result = getCustomActions(['string' as any]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain('Custom Action Validation Error: Invalid action object provided');
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
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Missing required fields: id");
            });

            it('should return false when target is missing', () => {
                const action: Partial<CustomAction> = {
                    name: 'Test Action',
                    id: 'test-id',
                    position: CustomActionsPosition.PRIMARY,
                };
                const result = getCustomActions([action as CustomAction]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Missing required fields: target");
            });

            it('should return false when position is missing', () => {
                const action: Partial<CustomAction> = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.LIVEBOARD,
                };
                const result = getCustomActions([action as CustomAction]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Missing required fields: position");
            });

            it('should return false when multiple required fields are missing', () => {
                const action: Partial<CustomAction> = {
                    name: 'Test Action',
                };
                const result = getCustomActions([action as CustomAction]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Missing required fields: id, target, position");
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
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Target type 'UNSUPPORTED' is not supported");
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
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Position 'CONTEXTMENU' is not supported for liveboard-level custom actions");
            });

            it('should return false for invalid position for VIZ target', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.VIZ,
                    position: 'INVALID_POSITION' as CustomActionsPosition,
                };
                const result = getCustomActions([action]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Position 'INVALID_POSITION' is not supported for viz-level custom actions");
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
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Liveboard-level custom actions cannot have position 'CONTEXTMENU'");
            });

            it('should return false when SPOTTER target has PRIMARY position', () => {
                const action: CustomAction = {
                    name: 'Test Action',
                    id: 'test-id',
                    target: CustomActionTarget.SPOTTER,
                    position: CustomActionsPosition.PRIMARY,
                };
                const result = getCustomActions([action]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Spotter-level custom actions cannot have position 'PRIMARY'");
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
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Field 'dataModelIds' is not supported in liveboard-level custom actions");
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
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Field 'liveboardIds' in metadataIds is not supported in answer-level custom actions");
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
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Field 'modelColumnNames' in dataModelIds is not supported in spotter-level custom actions");
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
                expect(result.actions).toEqual([action]);
                expect(result.errors).toEqual([]);
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
                expect(result.actions).toEqual([action]);
                expect(result.errors).toEqual([]);
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
                expect(result.actions).toEqual([action]);
                expect(result.errors).toEqual([]);
            });

            it('should return true for valid SPOTTER custom action', () => {
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
                const result = getCustomActions([action]);
                expect(result.actions).toEqual([action]);
                expect(result.errors).toEqual([]);
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
                expect(result.actions).toEqual([validAction]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain("Liveboard-level custom actions cannot have position 'CONTEXTMENU'");
            });

            it('should handle empty array', () => {
                const result = getCustomActions([]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toEqual([]);
            });

            it('should handle null/undefined array', () => {
                const result = getCustomActions(null as any);
                expect(result.actions).toEqual([]);
                expect(result.errors).toEqual([]);
            });
        });

        describe('Duplicate ID Validation', () => {
            it('should return error when two custom actions have the same ID and exclude both', () => {
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

                const result = getCustomActions([action1, action2]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toBe('Custom actions CA1, CA2 share the same ID. Please use a unique ID to identify each custom action.');
            });

            it('should return error when three custom actions have the same ID and exclude all three', () => {
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
                const action3: CustomAction = {
                    name: 'CA3',
                    id: 'duplicate-id',
                    target: CustomActionTarget.ANSWER,
                    position: CustomActionsPosition.MENU,
                };

                const result = getCustomActions([action1, action2, action3]);
                expect(result.actions).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toBe('Custom actions CA1, CA2, CA3 share the same ID. Please use a unique ID to identify each custom action.');
            });

            it('should include actions with unique IDs and exclude actions with duplicate IDs', () => {
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
                const action3: CustomAction = {
                    name: 'CA3',
                    id: 'unique-id',
                    target: CustomActionTarget.ANSWER,
                    position: CustomActionsPosition.MENU,
                };

                const result = getCustomActions([action1, action2, action3]);
                expect(result.actions).toHaveLength(1);
                expect(result.actions[0]).toEqual(action3);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toBe('Custom actions CA1, CA2 share the same ID. Please use a unique ID to identify each custom action.');
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
                expect(result.actions).toEqual([action]);
                expect(result.errors).toEqual([]);
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
                expect(result.actions).toEqual([action]);
                expect(result.errors).toEqual([]);
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
                expect(result.actions).toEqual([action]);
                expect(result.errors).toEqual([]);
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
                expect(result.actions).toEqual([action]);
                expect(result.errors).toEqual([]);
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
            expect(result.actions).toEqual([action]);
            expect(result.errors).toEqual([]);
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
            expect(result.actions).toEqual([firstAction]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Custom Action Validation: Multiple primary custom actions found for target 'LIVEBOARD'. Action 'second-primary-id' will be ignored");
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
            expect(result.actions).toEqual([liveboardAction, vizAction]);
            expect(result.errors).toEqual([]);
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
            expect(result.actions).toEqual([menuAction, primaryAction]);
            expect(result.errors).toEqual([]);
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
            expect(result.actions).toEqual([answerAction, liveboardPrimary1, vizPrimary1]);
            expect(result.errors).toHaveLength(2);
            expect(result.errors[0]).toContain("Multiple primary custom actions found for target 'LIVEBOARD'. Action 'lb-primary-2' will be ignored");
            expect(result.errors[1]).toContain("Multiple primary custom actions found for target 'VIZ'. Action 'viz-primary-2' will be ignored");
            
            // Should collect errors for the duplicate primary actions
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
            expect(result.actions).toEqual([action1, action2, primary1]);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Multiple primary custom actions found for target 'LIVEBOARD'. Action 'primary-2' will be ignored");
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
        expect(result.actions).toEqual([actionA, actionB, actionC]);
        expect(result.errors).toEqual([]);
    });
}); 