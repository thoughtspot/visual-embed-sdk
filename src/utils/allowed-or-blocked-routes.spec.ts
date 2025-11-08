import { NavigationPath } from '../types';
import { getBlockedAndAllowedRoutes } from './allowed-or-blocked-routes';

describe('getBlockedAndAllowedRoutes', () => {
    describe('when both blockedRoutes and allowedRoutes are provided', () => {
        it('should return an error', () => {
            const blockedRoutes = [NavigationPath.AdminPage];
            const allowedRoutes = [NavigationPath.Home];

            const result = getBlockedAndAllowedRoutes(blockedRoutes, allowedRoutes);

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
        it('should return allowedRoutes and empty blockedRoutes', () => {
            const allowedRoutes = [NavigationPath.Home, NavigationPath.Answers];

            const result = getBlockedAndAllowedRoutes(undefined as any, allowedRoutes);

            expect(result).toEqual({
                allowedRoutes: [NavigationPath.Home, NavigationPath.Answers],
                blockedRoutes: [],
                error: false,
                message: '',
            });
        });

        it('should handle single allowedRoute', () => {
            const allowedRoutes = [NavigationPath.Copilot];

            const result = getBlockedAndAllowedRoutes(undefined as any, allowedRoutes);

            expect(result).toEqual({
                allowedRoutes: [NavigationPath.Copilot],
                blockedRoutes: [],
                error: false,
                message: '',
            });
        });

        it('should handle multiple allowedRoutes', () => {
            const allowedRoutes = [
                NavigationPath.Home,
                NavigationPath.Answers,
                NavigationPath.Copilot,
                NavigationPath.Documents,
            ];

            const result = getBlockedAndAllowedRoutes(undefined as any, allowedRoutes);

            expect(result).toEqual({
                allowedRoutes: allowedRoutes,
                blockedRoutes: [],
                error: false,
                message: '',
            });
        });
    });

    describe('when only blockedRoutes is provided', () => {
        it('should return blockedRoutes and empty allowedRoutes', () => {
            const blockedRoutes = [NavigationPath.AdminPage, NavigationPath.Login];

            const result = getBlockedAndAllowedRoutes(blockedRoutes, undefined as any);

            expect(result).toEqual({
                allowedRoutes: [],
                blockedRoutes: [NavigationPath.AdminPage, NavigationPath.Login],
                error: false,
                message: '',
            });
        });

        it('should handle single blockedRoute', () => {
            const blockedRoutes = [NavigationPath.AdminPage];

            const result = getBlockedAndAllowedRoutes(blockedRoutes, undefined as any);

            expect(result).toEqual({
                allowedRoutes: [],
                blockedRoutes: [NavigationPath.AdminPage],
                error: false,
                message: '',
            });
        });

        it('should handle multiple blockedRoutes', () => {
            const blockedRoutes = [
                NavigationPath.AdminPage,
                NavigationPath.Login,
                NavigationPath.ResetPassword,
                NavigationPath.DataModelPage,
            ];

            const result = getBlockedAndAllowedRoutes(blockedRoutes, undefined as any);

            expect(result).toEqual({
                allowedRoutes: [],
                blockedRoutes: blockedRoutes,
                error: false,
                message: '',
            });
        });
    });

    describe('when neither blockedRoutes nor allowedRoutes is provided', () => {
        it('should return empty arrays with no error', () => {
            const result = getBlockedAndAllowedRoutes(undefined as any, undefined as any);

            expect(result).toEqual({
                allowedRoutes: [],
                blockedRoutes: [],
                error: false,
                message: '',
            });
        });

        it('should return empty arrays when both are null', () => {
            const result = getBlockedAndAllowedRoutes(null as any, null as any);

            expect(result).toEqual({
                allowedRoutes: [],
                blockedRoutes: [],
                error: false,
                message: '',
            });
        });
    });
});
