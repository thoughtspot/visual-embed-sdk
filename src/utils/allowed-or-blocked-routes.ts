import { NavigationPath } from "src/types";

export const getBlockedAndAllowedRoutes = (
    blockedRoutes: NavigationPath[],
    allowedRoutes: NavigationPath[],
): { allowedRoutes: NavigationPath[]; blockedRoutes: NavigationPath[]; error: boolean; message: string } => {
    if (blockedRoutes && allowedRoutes) {
        return {
            allowedRoutes: [],
            blockedRoutes: [],
            error: true,
            message: 'You cannot have both blockedRoutes and allowedRoutes set at the same time',
        };
    }
    if(allowedRoutes){
        return {
            allowedRoutes: allowedRoutes,
            blockedRoutes: [],
            error: false,
            message: '',
        };
    }
    if(blockedRoutes){
        return {
            allowedRoutes: [],
            blockedRoutes: blockedRoutes,
            error: false,
            message: '',
        };
    }
    return {
        allowedRoutes: [],
        blockedRoutes: [],
        error: false,
        message: '',
    };
};