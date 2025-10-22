import { CustomAction, CustomActionsPosition, CustomActionTarget } from '../types';
import { arrayIncludesString } from '../utils';
import sortBy from 'lodash/sortBy';
import { CUSTOM_ACTIONS_ERROR_MESSAGE } from '../errors';
import { logger } from './logger';

export interface CustomActionsValidationResult {
    actions: CustomAction[];
    errors: string[];
}

type CustomActionValidation = {
    isValid: boolean;
    errors: string[];
};

/**
 * Configuration for custom action validation rules.
 * Defines allowed positions, metadata IDs, data model IDs, and fields for each target
 * type.
 * 
 */
const customActionValidationConfig: Record<CustomActionTarget, {
    positions: string[];
    allowedMetadataIds: string[];
    allowedDataModelIds: string[];
    allowedFields: string[];
}> = {
    [CustomActionTarget.LIVEBOARD]: {
        positions: [CustomActionsPosition.PRIMARY, CustomActionsPosition.MENU],
        allowedMetadataIds: ['liveboardIds'],
        allowedDataModelIds: [],
        allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds'],
    },
    [CustomActionTarget.VIZ]: {
        positions: [CustomActionsPosition.MENU, CustomActionsPosition.PRIMARY, CustomActionsPosition.CONTEXTMENU],
        allowedMetadataIds: ['liveboardIds', 'vizIds', 'answerIds'],
        allowedDataModelIds: ['modelIds', 'modelColumnNames'],
        allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds', 'dataModelIds'],
    },
    [CustomActionTarget.ANSWER]: {
        positions: [CustomActionsPosition.MENU, CustomActionsPosition.PRIMARY, CustomActionsPosition.CONTEXTMENU],
        allowedMetadataIds: ['answerIds'],
        allowedDataModelIds: ['modelIds', 'modelColumnNames'],
        allowedFields: ['name', 'id', 'position', 'target', 'metadataIds', 'orgIds', 'groupIds', 'dataModelIds'],
    },
    [CustomActionTarget.SPOTTER]: {
        positions: [CustomActionsPosition.MENU, CustomActionsPosition.CONTEXTMENU],
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
const validateCustomAction = (action: CustomAction, primaryActionsPerTarget: Map<CustomActionTarget, CustomAction>): CustomActionValidation => {
    const { id: actionId, target: targetType, position, metadataIds, dataModelIds } = action;

    // Check if target type is supported
    if (!customActionValidationConfig[targetType]) {
        const errorMessage = CUSTOM_ACTIONS_ERROR_MESSAGE.UNSUPPORTED_TARGET(actionId, targetType);
        return { isValid: false, errors: [errorMessage] };
    }

    const config = customActionValidationConfig[targetType];
    const errors: string[] = [];

    // Validate position
    if (!arrayIncludesString(config.positions, position)) {
        const supportedPositions = config.positions.join(', ');
        errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_POSITION(position, targetType, supportedPositions));
    }

    // Validate metadata IDs
    if (metadataIds) {
        const invalidMetadataIds = Object.keys(metadataIds).filter(
            (key) => !arrayIncludesString(config.allowedMetadataIds, key)
        );
        if (invalidMetadataIds.length > 0) {
            const supportedMetadataIds = config.allowedMetadataIds.length > 0 ? config.allowedMetadataIds.join(', ') : 'none';
            errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_METADATA_IDS(targetType, invalidMetadataIds, supportedMetadataIds));
        }
    }

    // Validate data model IDs
    if (dataModelIds) {
        const invalidDataModelIds = Object.keys(dataModelIds).filter(
            (key) => !arrayIncludesString(config.allowedDataModelIds, key)
        );
        if (invalidDataModelIds.length > 0) {
            const supportedDataModelIds = config.allowedDataModelIds.length > 0 ? config.allowedDataModelIds.join(', ') : 'none';
            errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_DATA_MODEL_IDS(targetType, invalidDataModelIds, supportedDataModelIds));
        }
    }

    // Validate allowed fields
    const actionKeys = Object.keys(action);
    const invalidFields = actionKeys.filter((key) => !arrayIncludesString(config.allowedFields, key));
    if (invalidFields.length > 0) {
        const supportedFields = config.allowedFields.join(', ');
        errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_FIELDS(targetType, invalidFields, supportedFields));
    }

    return {
        isValid: errors.length === 0,
        errors,
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
    const idMap = actions.reduce((map, action) => {
        const list = map.get(action.id) || [];
        list.push(action);
        map.set(action.id, list);
        return map;
    }, new Map<string, CustomAction[]>());

    const { actions: actionsWithUniqueIds, errors } = Array.from(idMap.entries()).reduce(
        (acc, [id, actionsWithSameId]) => {
            if (actionsWithSameId.length === 1) {
                acc.actions.push(actionsWithSameId[0]);
            } else {
                // Keep the first action and add error for duplicates
                acc.actions.push(actionsWithSameId[0]);
                const duplicateNames = actionsWithSameId.slice(1).map(action => action.name);
                acc.errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.DUPLICATE_IDS(id, duplicateNames, actionsWithSameId[0].name));
            }
            return acc;
        },
        { actions: [] as CustomAction[], errors: [] as string[] }
    );

    return { actions: actionsWithUniqueIds, errors };
};

/**
 * Validates and processes custom actions
 * @param customActions - Array of custom actions to validate
 * @returns Object containing valid actions and any validation errors
 */
export const getCustomActions = (customActions: CustomAction[]): CustomActionsValidationResult => {
    const errors: string[] = [];
    const primaryActionsPerTarget = new Map<CustomActionTarget, CustomAction>();

    if (!customActions || !Array.isArray(customActions)) {
        return { actions: [], errors: [] };
    }

    // Step 1: Handle invalid actions first (null, undefined, missing required
    // fields)
    const validActions = customActions.filter(action => {
        const validation = validateActionStructure(action);
        if (!validation.isValid) {
            if (!action || typeof action !== 'object') {
                errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.INVALID_ACTION_OBJECT);
            } else {
                errors.push(CUSTOM_ACTIONS_ERROR_MESSAGE.MISSING_REQUIRED_FIELDS((action as any).id, validation.missingFields));
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
        const { isValid, errors: validationErrors } = validateCustomAction(action, primaryActionsPerTarget);
        validationErrors.forEach(error => errors.push(error));

        if (isValid) {
            finalValidActions.push(action);
        }
    });

    // Step 4: Collect warnings for long custom action names
    const MAX_ACTION_NAME_LENGTH = 30;
    const warnings = finalValidActions
        .filter(action => action.name.length > MAX_ACTION_NAME_LENGTH)
        .map(action => `Custom action name '${action.name}' exceeds ${MAX_ACTION_NAME_LENGTH} characters. This may cause display or truncation issues in the UI.`);

    if (warnings.length > 0) {
        logger.warn(warnings);
    }

    const sortedActions = sortBy(finalValidActions, (a) => a.name.toLocaleLowerCase());

    return {
        actions: sortedActions,
        errors: errors,
    };
};
