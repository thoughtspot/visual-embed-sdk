import * as authToken from '../authToken';
import { resetAllCachedServices } from './resetServices';
import * as sessionInfoService from './sessionInfoService';

describe('resetAllServices', () => {
    it('should reset all services', () => {
        const resetCachedAuthTokenSpy = jest.spyOn(authToken, 'resetCachedAuthToken');
        const resetCachedSessionInfoSpy = jest.spyOn(sessionInfoService, 'resetCachedSessionInfo');
        const resetCachedPreauthInfoSpy = jest.spyOn(sessionInfoService, 'resetCachedPreauthInfo');
        resetAllCachedServices();
        expect(resetCachedAuthTokenSpy).toHaveBeenCalled();
        expect(resetCachedSessionInfoSpy).toHaveBeenCalled();
        expect(resetCachedPreauthInfoSpy).toHaveBeenCalled();
    });
});
