import { CustomAction, CustomActionsPosition, CustomActionTarget } from '../types';

export interface CustomActionsValidationResult {
    actions: CustomAction[];
    errors: string[];
}

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

function arrayIncludesString(arr: readonly unknown[], key: string): boolean {
    return (arr as string[]).includes(key);
}

/**
 * Validates a custom action based on its target type
 * @param action - The custom action to validate
 * @param primaryActionsPerTarget - Map to track primary actions per target
 * @returns null if valid, or error string if invalid
 */
const validateCustomAction = (action: CustomAction, primaryActionsPerTarget: Map<string, CustomAction>): string | null => {
    const { id: actionId, target: targetType, position, metadataIds, dataModelIds } = action;

    // Check if target type is supported
    if (!customActionValidationConfig[targetType]) {
        const errorMessage = `Custom Action Validation Error for '${actionId}': Target type '${targetType}' is not supported`;
        return errorMessage;
    }

    const config = customActionValidationConfig[targetType];
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
        if (primaryActionsPerTarget.has(targetType)) {
            const errorMessage = `Custom Action Validation: Multiple primary custom actions found for target '${targetType}'. Action '${actionId}' will be ignored`;
            return errorMessage;
        }
        primaryActionsPerTarget.set(targetType, action);
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
        return errorMessage;
    }

    return null;
};

/**
 * Validates and processes custom actions
 * @param customActions - Array of custom actions to validate
 * @returns Object containing valid actions and any validation errors
 */
export const getCustomActions = (customActions: CustomAction[]): CustomActionsValidationResult => {
    if (!customActions || !Array.isArray(customActions)) {
        return { actions: [], errors: [] };
    }

    const errors: string[] = [];
    
    // Map to track primary actions per target for this validation call
    const primaryActionsPerTarget = new Map<string, CustomAction>();
    
    // Step 1: Handle invalid actions first (null, undefined, missing required fields)
    const validActions = customActions.filter((action) => {
        if (!action || typeof action !== 'object') {
            const errorMessage = 'Custom Action Validation Error: Invalid action object provided';
            errors.push(errorMessage);
            return false;
        }
        // Check for all missing required fields
        const missingFields = ['id', 'name', 'target', 'position'].filter(field => !(action as any)[field]);
        if (missingFields.length > 0) {
            const errorMessage = `Custom Action Validation Error for '${action.id}': Missing required fields: ${missingFields.join(', ')}`;
            errors.push(errorMessage);
            return false;
        }
        return true;
    });

    // Step 2: Check for duplicate IDs among valid actions
    const idMap = new Map<string, CustomAction[]>();
    validActions.forEach((action) => {
        const existing = idMap.get(action.id) || [];
        existing.push(action);
        idMap.set(action.id, existing);
    });

    const actionsWithUniqueIds: CustomAction[] = [];
    idMap.forEach((actionsWithSameId, id) => {
        if (actionsWithSameId.length > 1) {
            const actionNames = actionsWithSameId.map(action => action.name);
            errors.push(`Custom actions ${actionNames.join(', ')} share the same ID. Please use a unique ID to identify each custom action.`);
        } else {
            actionsWithUniqueIds.push(actionsWithSameId[0]);
        }
    });

    // Step 3: Validate actions with unique IDs
    const finalValidActions: CustomAction[] = [];
    actionsWithUniqueIds.forEach((action) => {
        const error = validateCustomAction(action, primaryActionsPerTarget);
        if (!error) {
            finalValidActions.push(action);
        } else {
            errors.push(error);
        }
    });

    return {
        actions: finalValidActions.sort((a, b) => a.name.localeCompare(b.name)),
        errors,
    };
}; 