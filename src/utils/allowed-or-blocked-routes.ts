import { NavigationPath } from 'src/types';

const EMBED_COMPONENT_PATHS: Record<string, string[]> = {
    AppEmbed: [], // app embed - matches all paths
    'bodyless-conversation': ['/embed/conv-assist-answer', '/conv-assist-answer'], // bodyless conversation embed
    conversation: ['/embed/insights/conv-assist', '/insights/conv-assist'], // spotter embed
    LiveboardEmbed: ['/embed/viz/*', '/insights/pinboard/*'], // liveboard embed - matches all paths
    SageEmbed: ['/embed/eureka', '/eureka'], // sage embed
    SearchBarEmbed: ['/embed/search-bar-embed', '/search-bar-embed'], // search bar embed
    SearchEmbed: ['/embed/answer', '/insights/answer'], // search embed
};

export const getBlockedAndAllowedRoutes = (
    blockedRoutes: (NavigationPath | string)[],
    allowedRoutes: (NavigationPath | string)[],
    embedComponentType: string,
): {
    allowedRoutes: (NavigationPath | string)[];
    blockedRoutes: (NavigationPath | string)[];
    error: boolean;
    message: string;
} => {
    const embedComponentPath = EMBED_COMPONENT_PATHS[embedComponentType];
    const embedAllowedRoutes: string[] = embedComponentPath ? embedComponentPath : [];

    if (blockedRoutes && allowedRoutes) {
        return {
            allowedRoutes: [],
            blockedRoutes: [],
            error: true,
            message: 'You cannot have both blockedRoutes and allowedRoutes set at the same time',
        };
    }
    if (allowedRoutes) {
        return {
            allowedRoutes: [...embedAllowedRoutes, ...allowedRoutes],
            blockedRoutes: [],
            error: false,
            message: '',
        };
    }
    if (blockedRoutes) {
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
