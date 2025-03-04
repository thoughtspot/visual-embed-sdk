import { resetCachedAuthToken } from '../authToken';
import { resetCachedPreauthInfo, resetCachedSessionInfo } from './sessionInfoService';

/**
 * This function resets all the services that are cached in the SDK.
 * This is to be called when the user logs out of the application and also
 * when init is called again.
 * @version SDK: 1.30.2 | ThoughtSpot: *
 */
export function resetAllCachedServices(): void {
    resetCachedAuthToken();
    resetCachedSessionInfo();
    resetCachedPreauthInfo();
}
