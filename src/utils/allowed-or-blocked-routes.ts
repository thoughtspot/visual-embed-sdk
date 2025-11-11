import { NavigationPath, RouteBlocking } from '../types';

export interface RouteGenerationConfig {
    embedComponentType: string;
    liveboardId?: string;
    vizId?: string;
    activeTabId?: string;
    pageId?: string;
    path?: string;
}

const EMBED_COMPONENT_GENERIC_PATHS: Record<string, string[]> = {
    AppEmbed: [], // app embed - matches all paths
    'bodyless-conversation': ['/embed/conv-assist-answer', '/conv-assist-answer'],
    conversation: ['/embed/insights/conv-assist', '/insights/conv-assist'],
    LiveboardEmbed: [], // will be dynamically generated
    SageEmbed: ['/embed/eureka', '/eureka'],
    SearchBarEmbed: ['/embed/search-bar-embed', '/search-bar-embed'],
    SearchEmbed: ['/embed/answer', '/insights/answer'],
};

/**
 * Generate specific allowed routes based on the embed configuration
 */
export const generateAutoAllowedRoutes = (config: RouteGenerationConfig): string[] => {
    const { embedComponentType, liveboardId, vizId, activeTabId, pageId, path } = config;

    switch (embedComponentType) {
        case 'LiveboardEmbed': {
            const routes: string[] = [];

            if (liveboardId) {
                routes.push(`/embed/viz/${liveboardId}`);
                routes.push(`/insights/pinboard/${liveboardId}`);
                routes.push(`/embed/insights/viz/${liveboardId}`);

                if (vizId) {
                    if (activeTabId) {
                        routes.push(`/embed/viz/${liveboardId}/tab/${activeTabId}/${vizId}`);
                    } else {
                        routes.push(`/embed/viz/${liveboardId}/${vizId}`);
                    }
                }
                if (activeTabId && !vizId) {
                    routes.push(`/embed/viz/${liveboardId}/tab/${activeTabId}`);
                }
            }
            return routes;
        }

        case 'AppEmbed': {
            const routes: string[] = [];

            if (path) {
                const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                routes.push(`/${cleanPath}`);
                routes.push(`/${cleanPath}/*`);
            } else if (pageId) {
                const pageRoutes = defaultWhiteListedPaths(pageId);
                routes.push(...pageRoutes);
            }
            return routes;
        }

        default: {
            return EMBED_COMPONENT_GENERIC_PATHS[embedComponentType] || [];
        }
    }
};

/**
 * Get routes for a specific page ID
 */
const defaultWhiteListedPaths = (pageId: string): string[] => {
    const pageRouteMap: Record<string, string[]> = {
        answers: [NavigationPath.Answers, NavigationPath.HomeAnswers],
        data: [NavigationPath.DataModelPage],
        home: [NavigationPath.Home, NavigationPath.RootPage, NavigationPath.HomePage],
        liveboards: [NavigationPath.HomeLiveboards],
        monitor: [NavigationPath.HomeMonitorAlerts],
        pinboards: [NavigationPath.HomeLiveboards],
        search: [NavigationPath.Answer],
        spotiq: [NavigationPath.HomeSpotIQAnalysis, NavigationPath.Insights],
    };

    return pageRouteMap[pageId] || [];
};

/**
 * Check if a blocked route conflicts with the auto-generated routes for AppEmbed
 */
const hasConflictingBlockedRoute = (
    blockedRoutes: (NavigationPath | string)[],
    autoAllowedRoutes: string[],
): boolean => {
    return blockedRoutes.some((blockedRoute) => {
        const cleanBlocked = blockedRoute.replace(/\/\*$/, '');
        return autoAllowedRoutes.some((autoRoute) => {
            const cleanAuto = autoRoute.replace(/\/\*$/, '');
            return (
                cleanAuto === cleanBlocked ||
                cleanAuto.startsWith(cleanBlocked + '/') ||
                cleanBlocked.startsWith(cleanAuto + '/')
            );
        });
    });
};

/**
 * Get blocked and allowed routes
 */
export const getBlockedAndAllowedRoutes = (
    routeBlocking?: RouteBlocking,
    config?: RouteGenerationConfig,
): {
    allowedRoutes: (NavigationPath | string)[];
    blockedRoutes: (NavigationPath | string)[];
    error: boolean;
    message: string;
} => {
    const blockedRoutes = routeBlocking?.blockedRoutes;
    const allowedRoutes = routeBlocking?.allowedRoutes;
    const accessDeniedMessage = routeBlocking?.accessDeniedMessage || '';
    if (blockedRoutes && allowedRoutes) {
        return {
            allowedRoutes: [],
            blockedRoutes: [],
            error: true,
            message: 'You cannot have both blockedRoutes and allowedRoutes set at the same time',
        };
    }
    const autoAllowedRoutes = generateAutoAllowedRoutes(config);
    if (allowedRoutes) {
        const filteredAllowedRoutes = allowedRoutes.filter(
            (route) => route !== undefined && route !== null,
        );
        return {
            allowedRoutes: [
                ...autoAllowedRoutes,
                ...filteredAllowedRoutes,
                NavigationPath.Login,
                NavigationPath.EmbedAccessDeniedPage,
            ],
            blockedRoutes: [],
            error: false,
            message: accessDeniedMessage,
        };
    }
    if (blockedRoutes) {
        const filteredBlockedRoutes = blockedRoutes.filter(
            (route) => route !== undefined && route !== null,
        );
        if (
            hasConflictingBlockedRoute(filteredBlockedRoutes, [
                NavigationPath.Login,
                NavigationPath.EmbedAccessDeniedPage,
            ])
        ) {
            return {
                allowedRoutes: [],
                blockedRoutes: [],
                error: true,
                message: 'You cannot block the login or embed access denied page',
            };
        }
        const autoAllowedRoutesForBlockedRoutes = generateAutoAllowedRoutes(config);
        if (hasConflictingBlockedRoute(filteredBlockedRoutes, autoAllowedRoutesForBlockedRoutes)) {
            return {
                allowedRoutes: [],
                blockedRoutes: [],
                error: true,
                message:
                    'You cannot block a route that is being embedded. The path specified in AppEmbed configuration conflicts with blockedRoutes.',
            };
        }
        return {
            allowedRoutes: [],
            blockedRoutes: filteredBlockedRoutes,
            error: false,
            message: accessDeniedMessage,
        };
    }
    return {
        allowedRoutes: [],
        blockedRoutes: [],
        error: false,
        message: accessDeniedMessage,
    };
};
