import * as authToken from '../authToken';
import { resetAllServices } from './resetServices';
import * as sessionInfoService from './sessionInfoService';

describe('resetAllServices', () => {
    it('should reset all services', () => {
        const resetCachedAuthTokenSpy = jest.spyOn(authToken, 'resetCachedAuthToken');
        const resetCachedSessionInfoSpy = jest.spyOn(sessionInfoService, 'resetCachedSessionInfo');
        resetAllServices();
        expect(resetCachedAuthTokenSpy).toHaveBeenCalled();
        expect(resetCachedSessionInfoSpy).toHaveBeenCalled();
    });
});
