import { CustomAction, CustomActionsPosition, CustomActionTarget } from '../types';
import { arrayIncludesString } from '../utils';

export interface CustomActionsValidationResult {
    actions: CustomAction[];
    errors: string[];
}

type CustomActionValidation = {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};

/**
 * Configuration for custom action validation rules.
 * Defines allowed positions, metadata IDs, data model IDs, and fields for each target
 * type.
 * 
 */
const customActionValidationConfig: Record<string, {
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
 * 
 * @hidden
 */
const validateCustomAction = (action: CustomAction, primaryActionsPerTarget: Map<string, CustomAction>): CustomActionValidation => {
    const { id: actionId, target: targetType, position, metadataIds, dataModelIds } = action;

    // Check if target type is supported
            if (!customActionValidationConfig[targetType]) {
            const errorMessage = `Custom Action Validation Error for '${actionId}': Target type '${targetType}' is not supported`;
            return { isValid: false, errors: [errorMessage], warnings: [] };
        }

    const config = customActionValidationConfig[targetType];
    const errors: string[] = [];
    const warnings: string[] = [];

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

    // Check for primary action conflicts (this is a warning, not a validation
    // failure)
    if (position === CustomActionsPosition.PRIMARY) {
        const existingPrimaryAction = primaryActionsPerTarget.get(targetType);
        if (existingPrimaryAction) {
            warnings.push(`Multiple primary actions found for ${targetType.toLowerCase()}-level custom actions: '${existingPrimaryAction.name}' and '${action.name}'. Only the first action will be shown.`);
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
        errors,
        warnings,
    };
};

/**
 * Validates basic action structure and required fields
 * @param action - The action to validate
 * @returns Object containing validation result and missing fields
 * 
 * @hidden
 */
const validateActionStructure = (action: any): { isValid: boolean; missingFields: string[] } => {
    if (!action || typeof action !== 'object') {
        return { isValid: false, missingFields: [] };
    }

    // Check for all missing required fields
    const missingFields = ['id', 'name', 'target', 'position'].filter(field => !action[field]);
    return { isValid: missingFields.length === 0, missingFields };
};

/**
 * Checks for duplicate IDs among actions
 * @param actions - Array of actions to check
 * @returns Object containing filtered actions and duplicate errors
 * 
 * @hidden
 */
const filterDuplicateIds = (actions: CustomAction[]): { actions: CustomAction[]; errors: string[] } => {
    const idMap = new Map<string, CustomAction[]>();
    actions.forEach((action) => {
        const existing = idMap.get(action.id) || [];
        existing.push(action);
        idMap.set(action.id, existing);
    });

    const actionsWithUniqueIds: CustomAction[] = [];
    const errors: string[] = [];
    
    idMap.forEach((actionsWithSameId, id) => {
        if (actionsWithSameId.length === 1) {
            actionsWithUniqueIds.push(actionsWithSameId[0]);
        } else {
            // Keep the first action and add error for duplicates
            actionsWithUniqueIds.push(actionsWithSameId[0]);
            const duplicateNames = actionsWithSameId.slice(1).map(action => action.name);
            errors.push(`Duplicate custom action ID '${id}' found. Actions with names '${duplicateNames.join("', '")}' will be ignored. Keeping '${actionsWithSameId[0].name}'.`);
        }
    });

    return { actions: actionsWithUniqueIds, errors };
};

/**
 * Validates and processes custom actions
 * @param customActions - Array of custom actions to validate
 * @returns Object containing valid actions and any validation errors
 */
export const getCustomActions = (customActions: CustomAction[]): CustomActionsValidationResult => {
    const errors: string[] = [];
    const primaryActionsPerTarget = new Map<string, CustomAction>();

    if (!customActions || !Array.isArray(customActions)) {
        return { actions: [], errors: [] };
    }

    // Step 1: Handle invalid actions first (null, undefined, missing required
    // fields)
    const validActions = customActions.filter(action => {
        const validation = validateActionStructure(action);
        if (!validation.isValid) {
            if (!action || typeof action !== 'object') {
                errors.push('Custom Action Validation Error: Invalid action object provided');
            } else {
                const errorMessage = `Custom Action Validation Error for '${(action as any).id}': Missing required fields: ${validation.missingFields.join(', ')}`;
                errors.push(errorMessage);
            }
            return false;
        }
        return true;
    });

    // Step 2: Check for duplicate IDs among valid actions
    const { actions: actionsWithUniqueIds, errors: duplicateErrors } = filterDuplicateIds(validActions);
    
    // Add duplicate errors to the errors array
    duplicateErrors.forEach(error => errors.push(error));

    // Step 3: Validate actions with unique IDs
    const finalValidActions: CustomAction[] = [];
    actionsWithUniqueIds.forEach((action) => {
        const { isValid, errors: validationErrors, warnings } = validateCustomAction(action, primaryActionsPerTarget);
        
        // Add warnings to the errors array (they're informational)
        warnings.forEach(warning => errors.push(warning));
        
        if (isValid) {
            finalValidActions.push(action);
        } else {
            // Add validation errors to the errors array
            validationErrors.forEach(error => errors.push(error));
        }
    });

    // Sort actions by name
    const sortedActions = finalValidActions.sort((a, b) => a.name.localeCompare(b.name));

    return {
        actions: sortedActions,
        errors: errors,
    };
};
