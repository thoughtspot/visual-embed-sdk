import { CustomAction, CustomActionsPosition, CustomActionTarget } from './types';
import { arrayIncludesString } from './utils';

export interface CustomActionsValidationResult {
    actions: CustomAction[];
    errors: string[];
}

type CustomActionValidation = {
    isValid: boolean;
    reason: string;
};

/**
 * This class encapsulates the logic for validating custom actions.
 * It provides a clean interface for validating custom actions with proper error handling
 * and validation rules.
 * 
 * @hidden
 */
export class CustomActions {
    private static customActionValidationConfig: Record<string, {
        positions: string[];
        allowedMetadataIds: string[];
        allowedDataModelIds: string[];
        allowedFields: string[];
    }> = {
        LIVEBOARD: {
            positions: [CustomActionsPosition.PRIMARY, CustomActionsPosition.MENU],
            allowedMetadataIds: ['liveboardIds'],
            allowedDataModelIds: [],
            allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds'],
        },
        VIZ: {
            positions: [CustomActionsPosition.MENU, CustomActionsPosition.PRIMARY, CustomActionsPosition.CONTEXTMENU],
            allowedMetadataIds: ['liveboardIds', 'vizIds', 'answerIds'],
            allowedDataModelIds: ['modelIds', 'modelColumnNames'],
            allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds', 'dataModelIds'],
        },
        ANSWER: {
            positions: [CustomActionsPosition.MENU, CustomActionsPosition.PRIMARY, CustomActionsPosition.CONTEXTMENU],
            allowedMetadataIds: ['answerIds'],
            allowedDataModelIds: ['modelIds', 'modelColumnNames'],
            allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds', 'dataModelIds'],
        },
        SPOTTER: {
            positions: [CustomActionsPosition.MENU, CustomActionsPosition.PRIMARY, CustomActionsPosition.CONTEXTMENU],
            allowedMetadataIds: [],
            allowedDataModelIds: ['modelIds'],
            allowedFields: ['name', 'id', 'position', 'target', 'orgIds', 'groupIds', 'dataModelIds'],
        },
    };

    /**
     * Validates a single custom action based on its target type
     * @param action - The custom action to validate
     * @param primaryActionsPerTarget - Map to track primary actions per target
     * @returns CustomActionValidation with isValid flag and reason string
     */
    private static validateCustomAction = (action: CustomAction, primaryActionsPerTarget: Map<string, CustomAction>): CustomActionValidation => {
        const { id: actionId, target: targetType, position, metadataIds, dataModelIds } = action;

        // Check if target type is supported
        if (!CustomActions.customActionValidationConfig[targetType]) {
            const errorMessage = `Custom Action Validation Error for '${actionId}': Target type '${targetType}' is not supported`;
            return { isValid: false, reason: errorMessage };
        }

        const config = CustomActions.customActionValidationConfig[targetType];
        const errors: string[] = [];

        // Validate position
        if (!arrayIncludesString(config.positions, position)) {
            errors.push(`Position '${position}' is not supported for ${targetType.toLowerCase()}-level custom actions`);
        }

        // Validation for Liveboard level custom actions cannot have CONTEXTMENU
        if (targetType === CustomActionTarget.LIVEBOARD && position === CustomActionsPosition.CONTEXTMENU) {
            errors.push(`Liveboard-level custom actions cannot have position '${CustomActionsPosition.CONTEXTMENU}'`);
        }

        // Validation for Spotter level custom actions cannot have PRIMARY
        if (targetType === CustomActionTarget.SPOTTER && position === CustomActionsPosition.PRIMARY) {
            errors.push(`Spotter-level custom actions cannot have position '${CustomActionsPosition.PRIMARY}'`);
        }

        // Check for primary action conflicts
        if (position === CustomActionsPosition.PRIMARY) {
            const existingPrimaryAction = primaryActionsPerTarget.get(targetType);
            if (existingPrimaryAction) {
                errors.push(`Multiple primary actions found for ${targetType.toLowerCase()}-level custom actions: '${existingPrimaryAction.name}' and '${action.name}'`);
            } else {
                primaryActionsPerTarget.set(targetType, action);
            }
        }

        // Validate metadata IDs
        if (metadataIds) {
            const invalidMetadataIds = Object.keys(metadataIds).filter(
                (key) => !arrayIncludesString(config.allowedMetadataIds, key)
            );
            if (invalidMetadataIds.length > 0) {
                errors.push(`Invalid metadata IDs for ${targetType.toLowerCase()}-level custom actions: ${invalidMetadataIds.join(', ')}`);
            }
        }

        // Validate data model IDs
        if (dataModelIds) {
            const invalidDataModelIds = Object.keys(dataModelIds).filter(
                (key) => !arrayIncludesString(config.allowedDataModelIds, key)
            );
            if (invalidDataModelIds.length > 0) {
                errors.push(`Invalid data model IDs for ${targetType.toLowerCase()}-level custom actions: ${invalidDataModelIds.join(', ')}`);
            }
        }

        // Validate allowed fields
        const actionKeys = Object.keys(action);
        const invalidFields = actionKeys.filter((key) => !arrayIncludesString(config.allowedFields, key));
        if (invalidFields.length > 0) {
            errors.push(`Invalid fields for ${targetType.toLowerCase()}-level custom actions: ${invalidFields.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            reason: errors.length > 0 ? errors.join('; ') : '',
        };
    };

    /**
     * Validates basic action structure and required fields
     * @param action - The action to validate
     * @returns boolean indicating if the action has valid structure
     */
    private static validateActionStructure = (action: any): boolean => {
        if (!action || typeof action !== 'object') {
            return false;
        }

        // Check for all missing required fields
        const missingFields = ['id', 'name', 'target', 'position'].filter(field => !action[field]);
        return missingFields.length === 0;
    };

    /**
     * Checks for duplicate IDs among actions
     * @param actions - Array of actions to check
     * @returns Array of actions with unique IDs
     */
    private static filterDuplicateIds = (actions: CustomAction[]): CustomAction[] => {
        const idMap = new Map<string, CustomAction[]>();
        actions.forEach((action) => {
            const existing = idMap.get(action.id) || [];
            existing.push(action);
            idMap.set(action.id, existing);
        });

        const actionsWithUniqueIds: CustomAction[] = [];
        idMap.forEach((actionsWithSameId, id) => {
            if (actionsWithSameId.length === 1) {
                actionsWithUniqueIds.push(actionsWithSameId[0]);
            } else {
                // Keep the first action and log warning for duplicates
                actionsWithUniqueIds.push(actionsWithSameId[0]);
            }
        });

        return actionsWithUniqueIds;
    };

    /**
     * Validates and processes custom actions
     * @param customActions - Array of custom actions to validate
     * @returns Object containing valid actions and any validation errors
     */
    static getCustomActions(customActions: CustomAction[]): CustomActionsValidationResult {
        const errors: string[] = [];
        const primaryActionsPerTarget = new Map<string, CustomAction>();

        if (!customActions || !Array.isArray(customActions)) {
            return { actions: [], errors: [] };
        }

        // Step 1: Handle invalid actions first (null, undefined, missing required fields)
        const validActions = customActions.filter(action => {
            if (!CustomActions.validateActionStructure(action)) {
                if (!action || typeof action !== 'object') {
                    errors.push('Custom Action Validation Error: Invalid action object provided');
                } else {
                    const missingFields = ['id', 'name', 'target', 'position'].filter(field => !(action as any)[field]);
                    const errorMessage = `Custom Action Validation Error for '${(action as any).id}': Missing required fields: ${missingFields.join(', ')}`;
                    errors.push(errorMessage);
                }
                return false;
            }
            return true;
        });

        // Step 2: Check for duplicate IDs among valid actions
        const actionsWithUniqueIds = CustomActions.filterDuplicateIds(validActions);

        // Step 3: Validate actions with unique IDs
        const finalValidActions: CustomAction[] = [];
        actionsWithUniqueIds.forEach((action) => {
            const { isValid, reason } = CustomActions.validateCustomAction(action, primaryActionsPerTarget);
            if (isValid) {
                finalValidActions.push(action);
            } else {
                errors.push(reason);
            }
        });

        // Sort actions by name
        const sortedActions = finalValidActions.sort((a, b) => a.name.localeCompare(b.name));

        return {
            actions: sortedActions,
            errors: errors,
        };
    }

} 