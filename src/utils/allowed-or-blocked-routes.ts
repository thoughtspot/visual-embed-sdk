import { ERROR_MESSAGE } from '../errors';
import { NavigationPath, RouteBlocking } from '../types';

/**
 * Configuration for generating component-specific routes
 */
export interface EmbedRouteConfig {
    embedComponentType: string;
    liveboardId?: string;
    vizId?: string;
    activeTabId?: string;
    pageId?: string;
    path?: string;
}

/**
 * Result of route validation and processing
 */
export interface RouteValidationResult {
    allowedRoutes: (NavigationPath | string)[];
    blockedRoutes: (NavigationPath | string)[];
    hasError: boolean;
    errorMessage: string;
}

/**
 * Default routes for each embed component type
 * AppEmbed and LiveboardEmbed have dynamic routes, so they're empty here
 */
const COMPONENT_DEFAULT_ROUTES: Record<string, string[]> = {
    AppEmbed: [], // Matches all paths - routes generated dynamically
    'bodyless-conversation': ['/embed/conv-assist-answer', '/conv-assist-answer'],
    conversation: ['/embed/insights/conv-assist', '/insights/conv-assist'],
    LiveboardEmbed: [], // Routes generated dynamically based on liveboard configuration
    SageEmbed: ['/embed/eureka', '/eureka'],
    SearchBarEmbed: ['/embed/search-bar-embed', '/search-bar-embed'],
    SearchEmbed: ['/embed/answer', '/insights/answer'],
};

/**
 * Maps page IDs to their corresponding navigation paths
 */
const PAGE_ID_TO_ROUTES: Record<string, NavigationPath[]> = {
    answers: [NavigationPath.Answers, NavigationPath.HomeAnswers],
    data: [NavigationPath.DataModelPage],
    home: [NavigationPath.Home, NavigationPath.RootPage, NavigationPath.HomePage],
    liveboards: [NavigationPath.HomeLiveboards],
    monitor: [NavigationPath.HomeMonitorAlerts],
    pinboards: [NavigationPath.HomeLiveboards],
    search: [NavigationPath.Answer],
    spotiq: [NavigationPath.HomeSpotIQAnalysis, NavigationPath.Insights],
};

/**
 * Routes that must never be blocked for embed functionality to work
 */
const PROTECTED_ROUTES = [NavigationPath.Login, NavigationPath.EmbedAccessDeniedPage];

/**
 * Generates LiveboardEmbed-specific routes based on configuration
 */
const generateLiveboardRoutes = (config: EmbedRouteConfig): string[] => {
    const { liveboardId, vizId, activeTabId } = config;
    const routes: string[] = [];

    if (!liveboardId) {
        return routes;
    }

    // Base liveboard routes
    routes.push(`/embed/viz/${liveboardId}`);
    routes.push(`/insights/pinboard/${liveboardId}`);
    routes.push(`/embed/insights/viz/${liveboardId}`);

    // Visualization-specific routes
    if (vizId) {
        const vizRoute = activeTabId
            ? `/embed/viz/${liveboardId}/tab/${activeTabId}/${vizId}`
            : `/embed/viz/${liveboardId}/${vizId}`;
        routes.push(vizRoute);
    } else if (activeTabId) {
        // Tab route without specific visualization
        routes.push(`/embed/viz/${liveboardId}/tab/${activeTabId}`);
    }

    return routes;
};

/**
 * Generates AppEmbed-specific routes based on configuration
 */
const generateAppEmbedRoutes = (config: EmbedRouteConfig): string[] => {
    const { path, pageId } = config;
    const routes: string[] = [];

    if (path) {
        const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
        routes.push(`/${normalizedPath}`);
        routes.push(`/${normalizedPath}/*`);
    } else if (pageId) {
        const pageRoutes = getRoutesByPageId(pageId);
        routes.push(...pageRoutes);
    }

    return routes;
};

/**
 * Retrieves navigation routes for a specific page ID
 */
const getRoutesByPageId = (pageId: string): string[] => {
    return PAGE_ID_TO_ROUTES[pageId] || [];
};

/**
 * Normalizes a route by removing trailing wildcard
 */
const normalizeRoute = (route: string): string => {
    return route.replace(/\/\*$/, '');
};

/**
 * Checks if two routes conflict with each other
 * Routes conflict if one is a prefix of the other or they are identical
 */
const areRoutesConflicting = (route1: string, route2: string): boolean => {
    const normalized1 = normalizeRoute(route1);
    const normalized2 = normalizeRoute(route2);

    return (
        normalized1 === normalized2 ||
        normalized1.startsWith(normalized2 + '/') ||
        normalized2.startsWith(normalized1 + '/')
    );
};

/**
 * Checks if any blocked route conflicts with protected or auto-allowed routes
 */
const hasRouteConflict = (
    blockedRoutes: (NavigationPath | string)[],
    protectedRoutes: string[],
): boolean => {
    return blockedRoutes.some((blockedRoute) =>
        protectedRoutes.some((protectedRoute) =>
            areRoutesConflicting(blockedRoute, protectedRoute),
        ),
    );
};

/**
 * Filters out null and undefined values from route arrays
 */
const sanitizeRoutes = (routes: (NavigationPath | string)[]): (NavigationPath | string)[] => {
    return routes.filter((route) => route !== undefined && route !== null);
};

/**
 * Generate component-specific allowed routes based on embed configuration
 */
export const generateComponentRoutes = (config: EmbedRouteConfig): string[] => {
    const { embedComponentType } = config;

    switch (embedComponentType) {
        case 'LiveboardEmbed':
            return generateLiveboardRoutes(config);

        case 'AppEmbed':
            return generateAppEmbedRoutes(config);

        default:
            return COMPONENT_DEFAULT_ROUTES[embedComponentType] || [];
    }
};

/**
 * Validates and processes route blocking configuration
 * Returns allowed and blocked routes along with any validation errors
 */
export const validateAndProcessRoutes = (
    routeBlocking?: RouteBlocking,
    embedConfig?: EmbedRouteConfig,
): RouteValidationResult => {
    const defaultResult: RouteValidationResult = {
        allowedRoutes: [],
        blockedRoutes: [],
        hasError: false,
        errorMessage: routeBlocking?.accessDeniedMessage || '',
    };

    // No route blocking configured
    if (!routeBlocking) {
        return defaultResult;
    }

    const { blockedRoutes, allowedRoutes, accessDeniedMessage = '' } = routeBlocking;

    // Validation: Cannot have both blocked and allowed routes
    if (blockedRoutes && allowedRoutes) {
        return {
            allowedRoutes: [],
            blockedRoutes: [],
            hasError: true,
            errorMessage: ERROR_MESSAGE.CONFLICTING_ROUTES_CONFIG,
        };
    }

    const componentRoutes = generateComponentRoutes(embedConfig);

    // Process allowed routes
    if (allowedRoutes) {
        const sanitizedAllowedRoutes = sanitizeRoutes(allowedRoutes);
        return {
            allowedRoutes: [...componentRoutes, ...sanitizedAllowedRoutes, ...PROTECTED_ROUTES],
            blockedRoutes: [],
            hasError: false,
            errorMessage: accessDeniedMessage,
        };
    }

    // Process blocked routes
    if (blockedRoutes) {
        const sanitizedBlockedRoutes = sanitizeRoutes(blockedRoutes);

        // Validation: Cannot block protected routes (login, access denied page)
        if (hasRouteConflict(sanitizedBlockedRoutes, PROTECTED_ROUTES)) {
            return {
                allowedRoutes: [],
                blockedRoutes: [],
                hasError: true,
                errorMessage: ERROR_MESSAGE.BLOCKING_PROTECTED_ROUTES,
            };
        }

        // Validation: Cannot block routes required by the embed component
        if (hasRouteConflict(sanitizedBlockedRoutes, componentRoutes)) {
            return {
                allowedRoutes: [],
                blockedRoutes: [],
                hasError: true,
                errorMessage: ERROR_MESSAGE.BLOCKING_COMPONENT_ROUTES,
            };
        }

        return {
            allowedRoutes: [],
            blockedRoutes: sanitizedBlockedRoutes,
            hasError: false,
            errorMessage: accessDeniedMessage,
        };
    }

    return defaultResult;
};
