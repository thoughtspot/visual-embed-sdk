import { CustomAction } from '../types';
export interface CustomActionsValidationResult {
    actions: CustomAction[];
    errors: string[];
}
/**
 * Validates and processes custom actions
 * @param customActions - Array of custom actions to validate
 * @returns Object containing valid actions and any validation errors
 */
export declare const getCustomActions: (customActions: CustomAction[]) => CustomActionsValidationResult;
//# sourceMappingURL=custom-actions.d.ts.map