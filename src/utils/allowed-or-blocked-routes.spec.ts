import { NavigationPath } from '../types';
import {
    getBlockedAndAllowedRoutes,
    generateAutoAllowedRoutes,
    RouteGenerationConfig,
} from './allowed-or-blocked-routes';

describe('generateAutoAllowedRoutes', () => {
    describe('LiveboardEmbed', () => {
        it('should generate routes for liveboard with vizId', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '123-abc-456',
                vizId: '789-def-012',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toContain('/embed/viz/123-abc-456/789-def-012');
            expect(result).toContain('/embed/viz/123-abc-456');
            expect(result).toContain('/insights/pinboard/123-abc-456');
        });

        it('should generate routes for liveboard with activeTabId', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '123-abc-456',
                activeTabId: 'tab-1',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toContain('/embed/viz/123-abc-456/tab/tab-1');
            expect(result).toContain('/embed/viz/123-abc-456');
        });

        it('should return empty array when no liveboardId is provided', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toEqual([]);
        });
    });

    describe('AppEmbed', () => {
        it('should generate routes for app with specific path', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
                path: 'pinboard/123-abc-456',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toContain('/pinboard/123-abc-456');
            expect(result).toContain('/pinboard/123-abc-456/*');
        });

        it('should handle path with leading slash', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
                path: '/pinboard/123-abc-456',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toContain('/pinboard/123-abc-456');
            expect(result).toContain('/pinboard/123-abc-456/*');
        });

        it('should generate routes for home page', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
                pageId: 'home',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toContain('/home');
        });

        it('should generate routes for search page', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
                pageId: 'search',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toContain('/insights/answer');
        });
    });

    describe('Other embed types', () => {
        it('should return generic paths for SageEmbed', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'SageEmbed',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toContain('/embed/eureka');
            expect(result).toContain('/eureka');
        });

        it('should return generic paths for SearchEmbed', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'SearchEmbed',
            };

            const result = generateAutoAllowedRoutes(config);

            expect(result).toContain('/embed/answer');
            expect(result).toContain('/insights/answer');
        });
    });
});

describe('getBlockedAndAllowedRoutes', () => {
    describe('when both blockedRoutes and allowedRoutes are provided', () => {
        it('should return an error', () => {
            const routeBlocking = {
                blockedRoutes: [NavigationPath.AdminPage],
                allowedRoutes: [NavigationPath.Home],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result).toEqual({
                allowedRoutes: [],
                blockedRoutes: [],
                error: true,
                message:
                    'You cannot have both blockedRoutes and allowedRoutes set at the same time',
            });
        });
    });

    describe('when only allowedRoutes is provided', () => {
        it('should return auto-generated routes merged with user allowedRoutes', () => {
            const routeBlocking = {
                allowedRoutes: [NavigationPath.Home, NavigationPath.Answers],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '123-abc-456',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toContain(NavigationPath.Home);
            expect(result.allowedRoutes).toContain(NavigationPath.Answers);
            expect(result.allowedRoutes).toContain('/embed/viz/123-abc-456');
            expect(result.allowedRoutes).toContain('/insights/pinboard/123-abc-456');
            expect(result.allowedRoutes).toContain(NavigationPath.Login);
            expect(result.blockedRoutes).toEqual([]);
            expect(result.error).toBe(false);
            expect(result.message).toBe('');
        });

        it('should handle single allowedRoute with auto-generation', () => {
            const routeBlocking = {
                allowedRoutes: [NavigationPath.Copilot],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
                pageId: 'home',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toContain(NavigationPath.Copilot);
            expect(result.allowedRoutes).toContain('/home');
            expect(result.allowedRoutes).toContain(NavigationPath.Login);
            expect(result.blockedRoutes).toEqual([]);
            expect(result.error).toBe(false);
        });

        it('should only use user allowedRoutes when no auto-routes are generated', () => {
            const routeBlocking = {
                allowedRoutes: [NavigationPath.Home, NavigationPath.Answers],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toEqual([
                NavigationPath.Home,
                NavigationPath.Answers,
                NavigationPath.Login,
                NavigationPath.EmbedAccessDeniedPage,
            ]);
            expect(result.blockedRoutes).toEqual([]);
            expect(result.error).toBe(false);
        });

        it('should handle accessDeniedMessage with allowedRoutes', () => {
            const routeBlocking = {
                allowedRoutes: [NavigationPath.Home],
                accessDeniedMessage: 'Custom access denied message',
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.message).toBe('Custom access denied message');
            expect(result.error).toBe(false);
        });
    });

    describe('when only blockedRoutes is provided', () => {
        it('should return empty allowedRoutes and blockedRoutes as-is when no conflicts', () => {
            const routeBlocking = {
                blockedRoutes: [NavigationPath.AdminPage],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '123-abc-456',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toEqual([]);
            expect(result.blockedRoutes).toEqual([NavigationPath.AdminPage]);
            expect(result.error).toBe(false);
            expect(result.message).toBe('');
        });

        it('should handle single blockedRoute', () => {
            const routeBlocking = {
                blockedRoutes: [NavigationPath.AdminPage],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toEqual([]);
            expect(result.blockedRoutes).toEqual([NavigationPath.AdminPage]);
            expect(result.error).toBe(false);
        });

        it('should handle multiple blockedRoutes', () => {
            const routeBlocking = {
                blockedRoutes: [
                    NavigationPath.AdminPage,
                    NavigationPath.ResetPassword,
                    NavigationPath.DataModelPage,
                ],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '123-abc-456',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toEqual([]);
            expect(result.blockedRoutes).toEqual(routeBlocking.blockedRoutes);
            expect(result.error).toBe(false);
        });

        it('should handle accessDeniedMessage with blockedRoutes', () => {
            const routeBlocking = {
                blockedRoutes: [NavigationPath.AdminPage],
                accessDeniedMessage: 'You do not have access to this route',
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.message).toBe('You do not have access to this route');
            expect(result.error).toBe(false);
        });

        describe('conflict detection with AppEmbed path', () => {
            it('should return error when blockedRoute exactly matches auto-generated route', () => {
                const routeBlocking = {
                    blockedRoutes: ['/pinboard/123-abc-456'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    path: 'pinboard/123-abc-456',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
                expect(result.message).toBe(
                    'You cannot block a route that is being embedded. The path specified in AppEmbed configuration conflicts with blockedRoutes.',
                );
                expect(result.allowedRoutes).toEqual([]);
                expect(result.blockedRoutes).toEqual([]);
            });

            it('should return error when blockedRoute matches wildcard auto-generated route', () => {
                const routeBlocking = {
                    blockedRoutes: ['/pinboard/123-abc-456/*'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    path: 'pinboard/123-abc-456',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
                expect(result.message).toBe(
                    'You cannot block a route that is being embedded. The path specified in AppEmbed configuration conflicts with blockedRoutes.',
                );
            });

            it('should NOT return error when blockedRoute does not conflict with path', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.AdminPage, '/different/route'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    path: 'pinboard/123-abc-456',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(false);
                expect(result.blockedRoutes).toEqual(routeBlocking.blockedRoutes);
                expect(result.allowedRoutes).toEqual([]);
            });
        });

        describe('conflict detection with AppEmbed pageId', () => {
            it('should return error when blockedRoute conflicts with pageId home', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.Home],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    pageId: 'home',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
                expect(result.message).toBe(
                    'You cannot block a route that is being embedded. The path specified in AppEmbed configuration conflicts with blockedRoutes.',
                );
            });

            it('should return error when blockedRoute conflicts with pageId answers', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.Answers],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    pageId: 'answers',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
            });

            it('should return error when blockedRoute conflicts with any of multiple pageId routes', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.HomeAnswers],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    pageId: 'answers',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
            });

            it('should NOT return error when blockedRoute does not conflict with pageId', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.AdminPage, NavigationPath.DataModelPage],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    pageId: 'home',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(false);
                expect(result.blockedRoutes).toEqual(routeBlocking.blockedRoutes);
            });
        });

        describe('conflict detection with AppEmbed without config', () => {
            it('should NOT return error when AppEmbed has no path or pageId', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.AdminPage, NavigationPath.Home],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(false);
                expect(result.blockedRoutes).toEqual(routeBlocking.blockedRoutes);
                expect(result.allowedRoutes).toEqual([]);
            });
        });

        describe('conflict detection with LiveboardEmbed', () => {
            it('should return error when blockedRoute matches liveboard route', () => {
                const routeBlocking = {
                    blockedRoutes: ['/embed/viz/123-abc-456'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'LiveboardEmbed',
                    liveboardId: '123-abc-456',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
                expect(result.message).toBe(
                    'You cannot block a route that is being embedded. The path specified in AppEmbed configuration conflicts with blockedRoutes.',
                );
            });

            it('should return error when blockedRoute matches pinboard route', () => {
                const routeBlocking = {
                    blockedRoutes: ['/insights/pinboard/123-abc-456'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'LiveboardEmbed',
                    liveboardId: '123-abc-456',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
            });

            it('should return error when blockedRoute matches viz with activeTabId', () => {
                const routeBlocking = {
                    blockedRoutes: ['/embed/viz/123-abc-456/tab/tab-1'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'LiveboardEmbed',
                    liveboardId: '123-abc-456',
                    activeTabId: 'tab-1',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
            });

            it('should return error when blockedRoute matches specific vizId route', () => {
                const routeBlocking = {
                    blockedRoutes: ['/embed/viz/123-abc-456/789-def-012'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'LiveboardEmbed',
                    liveboardId: '123-abc-456',
                    vizId: '789-def-012',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
            });

            it('should NOT return error when blockedRoute does not conflict with liveboard', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.AdminPage, '/embed/viz/different-id'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'LiveboardEmbed',
                    liveboardId: '123-abc-456',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(false);
                expect(result.blockedRoutes).toEqual(routeBlocking.blockedRoutes);
            });

            it('should NOT return error when LiveboardEmbed has no liveboardId', () => {
                const routeBlocking = {
                    blockedRoutes: ['/embed/viz/123-abc-456'],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'LiveboardEmbed',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(false);
                expect(result.blockedRoutes).toEqual(routeBlocking.blockedRoutes);
            });
        });

        describe('conflict detection with other embed types', () => {
            it('should NOT return error for SageEmbed with blockedRoutes', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.AdminPage],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'SageEmbed',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(false);
                expect(result.blockedRoutes).toEqual(routeBlocking.blockedRoutes);
            });

            it('should NOT return error for SearchEmbed with blockedRoutes', () => {
                const routeBlocking = {
                    blockedRoutes: [NavigationPath.AdminPage],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'SearchEmbed',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(false);
                expect(result.blockedRoutes).toEqual(routeBlocking.blockedRoutes);
            });
        });

        describe('conflict detection edge cases', () => {
            it('should handle multiple blockedRoutes where only one conflicts', () => {
                const routeBlocking = {
                    blockedRoutes: [
                        NavigationPath.AdminPage,
                        '/pinboard/123-abc-456',
                        NavigationPath.Login,
                    ],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    path: 'pinboard/123-abc-456',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(true);
            });

            it('should handle empty blockedRoutes array', () => {
                const routeBlocking = {
                    blockedRoutes: [] as string[],
                };
                const config: RouteGenerationConfig = {
                    embedComponentType: 'AppEmbed',
                    path: 'pinboard/123',
                };

                const result = getBlockedAndAllowedRoutes(routeBlocking, config);

                expect(result.error).toBe(false);
                expect(result.blockedRoutes).toEqual([]);
            });
        });
    });

    describe('when neither blockedRoutes nor allowedRoutes is provided', () => {
        it('should return empty arrays', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '123-abc-456',
            };

            const result = getBlockedAndAllowedRoutes(undefined, config);

            expect(result.allowedRoutes).toEqual([]);
            expect(result.blockedRoutes).toEqual([]);
            expect(result.error).toBe(false);
            expect(result.message).toBe('');
        });

        it('should return empty arrays when routeBlocking is empty object', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
                pageId: 'home',
            };

            const result = getBlockedAndAllowedRoutes({}, config);

            expect(result.allowedRoutes).toEqual([]);
            expect(result.blockedRoutes).toEqual([]);
            expect(result.error).toBe(false);
            expect(result.message).toBe('');
        });

        it('should return empty arrays for AppEmbed without config', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
            };

            const result = getBlockedAndAllowedRoutes(undefined, config);

            expect(result.allowedRoutes).toEqual([]);
            expect(result.blockedRoutes).toEqual([]);
            expect(result.error).toBe(false);
        });

        it('should handle only accessDeniedMessage without routes', () => {
            const routeBlocking = {
                accessDeniedMessage: 'Access denied',
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toEqual([]);
            expect(result.blockedRoutes).toEqual([]);
            expect(result.error).toBe(false);
            expect(result.message).toBe('Access denied');
        });
    });

    describe('real-world usage scenarios', () => {
        it('should handle LiveboardEmbed with user-provided allowedRoutes', () => {
            const routeBlocking = {
                allowedRoutes: ['/custom/route'],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '33248a57-cc70-4e39-9199-fb5092283381',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes[0]).toBe('/embed/viz/33248a57-cc70-4e39-9199-fb5092283381');
            expect(result.allowedRoutes).toContain('/custom/route');
            expect(result.allowedRoutes).toContain(NavigationPath.Login);
            expect(result.error).toBe(false);
        });

        it('should handle viz embed with specific vizId', () => {
            const routeBlocking = {
                allowedRoutes: ['/custom/page'],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '33248a57-cc70-4e39-9199-fb5092283381',
                vizId: '730496d6-6903-4601-937e-2c691821af3c',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toContain(
                '/embed/viz/33248a57-cc70-4e39-9199-fb5092283381/730496d6-6903-4601-937e-2c691821af3c',
            );
            expect(result.allowedRoutes).toContain('/custom/page');
            expect(result.allowedRoutes).toContain(NavigationPath.Login);
        });

        it('should handle AppEmbed with pageId', () => {
            const routeBlocking = {
                allowedRoutes: [NavigationPath.Copilot],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'AppEmbed',
                pageId: 'home',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.allowedRoutes).toContain('/home');
            expect(result.allowedRoutes).toContain(NavigationPath.Copilot);
            expect(result.allowedRoutes).toContain(NavigationPath.Login);
        });

        it('should test auto-route generation is working but not used without user routes', () => {
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
                liveboardId: '123-abc',
            };

            const autoRoutes = generateAutoAllowedRoutes(config);
            expect(autoRoutes.length).toBeGreaterThan(0);

            const result = getBlockedAndAllowedRoutes(undefined, config);
            expect(result.allowedRoutes).toEqual([]);
        });
    });

    describe('error cases', () => {
        it('should return error when blockedRoutes is having login or embed access denied page', () => {
            const routeBlocking = {
                blockedRoutes: [NavigationPath.Login, NavigationPath.EmbedAccessDeniedPage],
            };
            const config: RouteGenerationConfig = {
                embedComponentType: 'LiveboardEmbed',
            };

            const result = getBlockedAndAllowedRoutes(routeBlocking, config);

            expect(result.error).toBe(true);
            expect(result.message).toBe('You cannot block the login or embed access denied page');
            expect(result.allowedRoutes).toEqual([]);
            expect(result.blockedRoutes).toEqual([]);
        });
    });
});
