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

interface CustomActionsConfig {
    customActions: CustomAction[];
}

/**
 * This class encapsulates the logic for validating custom actions.
 * It provides a clean interface for validating custom actions with proper error handling
 * and validation rules.
 * 
 * @hidden
 */
export class CustomActions {
    private customActions: CustomAction[];
    private primaryActionsPerTarget: Map<string, CustomAction>;
    private errors: string[];

    private customActionValidationConfig: Record<string, {
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

    constructor(config: CustomActionsConfig) {
        this.customActions = config.customActions || [];
        this.primaryActionsPerTarget = new Map<string, CustomAction>();
        this.errors = [];
    }

    /**
     * Validates a single custom action based on its target type
     * @param action - The custom action to validate
     * @returns CustomActionValidation with isValid flag and reason string
     */
    private validateCustomAction = (action: CustomAction): CustomActionValidation => {
        const { id: actionId, target: targetType, position, metadataIds, dataModelIds } = action;

        // Check if target type is supported
        if (!this.customActionValidationConfig[targetType]) {
            const errorMessage = `Custom Action Validation Error for '${actionId}': Target type '${targetType}' is not supported`;
            return { isValid: false, reason: errorMessage };
        }

        const config = this.customActionValidationConfig[targetType];
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
            if (this.primaryActionsPerTarget.has(targetType)) {
                const errorMessage = `Custom Action Validation: Multiple primary custom actions found for target '${targetType}'. Action '${actionId}' will be ignored`;
                return { isValid: false, reason: errorMessage };
            }
            this.primaryActionsPerTarget.set(targetType, action);
        }

        // Validate allowed top-level fields
        Object.keys(action).forEach((key: string) => {
            if (!arrayIncludesString(config.allowedFields, key)) {
                errors.push(`Field '${key}' is not supported in ${targetType.toLowerCase()}-level custom actions`);
            }
        });

        // Validate metadataIds
        if (metadataIds && typeof metadataIds === 'object') {
            Object.keys(metadataIds).forEach((key: string) => {
                if (!arrayIncludesString(config.allowedMetadataIds, key)) {
                    errors.push(`Field '${key}' in metadataIds is not supported in ${targetType.toLowerCase()}-level custom actions`);
                }
            });
        }

        // Validate dataModelIds
        if (dataModelIds && typeof dataModelIds === 'object') {
            Object.keys(dataModelIds).forEach((key: string) => {
                if (!arrayIncludesString(config.allowedDataModelIds, key)) {
                    errors.push(`Field '${key}' in dataModelIds is not supported in ${targetType.toLowerCase()}-level custom actions`);
                }
            });
        }

        // If there are errors, return error string
        if (errors.length > 0) {
            const errorMessage = `Custom Action Validation Error for '${actionId}': ${errors.join('; ')}`;
            return { isValid: false, reason: errorMessage };
        }

        return { isValid: true, reason: '' };
    };

    /**
     * Validates basic action structure and required fields
     * @param action - The action to validate
     * @returns boolean indicating if the action has valid structure
     */
    private validateActionStructure = (action: any): boolean => {
        if (!action || typeof action !== 'object') {
            this.errors.push('Custom Action Validation Error: Invalid action object provided');
            return false;
        }

        // Check for all missing required fields
        const missingFields = ['id', 'name', 'target', 'position'].filter(field => !action[field]);
        if (missingFields.length > 0) {
            const errorMessage = `Custom Action Validation Error for '${action.id}': Missing required fields: ${missingFields.join(', ')}`;
            this.errors.push(errorMessage);
            return false;
        }

        return true;
    };

    /**
     * Checks for duplicate IDs among actions
     * @param actions - Array of actions to check
     * @returns Array of actions with unique IDs
     */
    private filterDuplicateIds = (actions: CustomAction[]): CustomAction[] => {
        const idMap = new Map<string, CustomAction[]>();
        actions.forEach((action) => {
            const existing = idMap.get(action.id) || [];
            existing.push(action);
            idMap.set(action.id, existing);
        });

        const actionsWithUniqueIds: CustomAction[] = [];
        idMap.forEach((actionsWithSameId, id) => {
            if (actionsWithSameId.length > 1) {
                const actionNames = actionsWithSameId.map(action => action.name);
                this.errors.push(`Custom actions ${actionNames.join(', ')} share the same ID. Please use a unique ID to identify each custom action.`);
            } else {
                actionsWithUniqueIds.push(actionsWithSameId[0]);
            }
        });

        return actionsWithUniqueIds;
    };

    /**
     * Initializes the validator and performs all validation steps
     */
    init(): void {
        if (!this.customActions || !Array.isArray(this.customActions)) {
            this.customActions = [];
            return;
        }

        // Step 1: Handle invalid actions first (null, undefined, missing
        // required fields)
        const validActions = this.customActions.filter(this.validateActionStructure);

        // Step 2: Check for duplicate IDs among valid actions
        const actionsWithUniqueIds = this.filterDuplicateIds(validActions);

        // Step 3: Validate actions with unique IDs
        const finalValidActions: CustomAction[] = [];
        actionsWithUniqueIds.forEach((action) => {
            const { isValid, reason } = this.validateCustomAction(action);
            if (isValid) {
                finalValidActions.push(action);
            } else {
                this.errors.push(reason);
            }
        });

        // Update the customActions with validated actions
        this.customActions = finalValidActions.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Gets the validation result with valid actions and errors
     * @returns CustomActionsValidationResult containing valid actions and errors
     */
    getValidationResult(): CustomActionsValidationResult {
        return {
            actions: this.customActions,
            errors: this.errors,
        };
    }

    /**
     * Gets only the valid actions
     * @returns Array of valid custom actions
     */
    getValidActions(): CustomAction[] {
        return this.customActions;
    }

    /**
     * Gets only the validation errors
     * @returns Array of error messages
     */
    getErrors(): string[] {
        return this.errors;
    }

    /**
     * Checks if there are any validation errors
     * @returns boolean indicating if there are errors
     */
    hasErrors(): boolean {
        return this.errors.length > 0;
    }

    /**
     * Clears all validation state
     */
    cleanup(): void {
        this.customActions = [];
        this.errors = [];
        this.primaryActionsPerTarget.clear();
    }
}

/**
 * Validates and processes custom actions using the new class-based validator
 * @param customActions - Array of custom actions to validate
 * @returns Object containing valid actions and any validation errors
 */
export const getCustomActions = (customActions: CustomAction[]): CustomActionsValidationResult => {
    const validator = new CustomActions({ customActions });
    validator.init();
    return validator.getValidationResult();
}; 