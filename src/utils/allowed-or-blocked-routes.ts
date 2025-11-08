import { Path } from "src/types";

export const getBlockedAndAllowedRoutes = (
    blockedRoutes: Path[],
    allowedRoutes: Path[],
): { allowedRoutes: Path[]; blockedRoutes: Path[]; error: boolean } => {
    if (blockedRoutes && allowedRoutes) {
        return {
            allowedRoutes: [],
            blockedRoutes: [],
            error: true,
        };
    }
    if(allowedRoutes){
        return {
            allowedRoutes: allowedRoutes,
            blockedRoutes: [],
            error: false,
        };
    }
    if(blockedRoutes){
        return {
            allowedRoutes: [],
            blockedRoutes: blockedRoutes,
            error: false,
        };
    }
    return {
        allowedRoutes: [],
        blockedRoutes: [],
        error: false,
    };
};