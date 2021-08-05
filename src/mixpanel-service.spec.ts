import * as mixpanel from 'mixpanel-browser';
import { initMixpanel, uploadMixpanelEvent } from './mixpanel-service';
import { AuthType } from './types';

const config = {
    thoughtSpotHost: 'https://10.87.89.232',
    authType: AuthType.None,
};

const MIXPANEL_EVENT = {
    VISUAL_SDK_CALLED_INIT: 'visual-sdk-called-init',
};

jest.mock('mixpanel-browser', () => ({
    __esModule: true,
    init: jest.fn(),
    identify: jest.fn(),
    track: jest.fn(),
}));

describe('Unit test for mixpanel', () => {
    test('initMixpanel and test upload event', () => {
        const sessionInfo = {
            mixpanelToken: 'abc123',
            userGUID: '12345',
            isPublicUser: false,
        };
        initMixpanel(sessionInfo);
        expect(mixpanel.init).toHaveBeenCalledWith(sessionInfo.mixpanelToken);
        expect(mixpanel.identify).toHaveBeenCalledWith(sessionInfo.userGUID);

        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_CALLED_INIT, {
            authType: config.authType,
            host: config.thoughtSpotHost,
        });
        expect(mixpanel.track).toHaveBeenCalled();
    });

    test('initMixpanel on public cluster', () => {
        const sessionInfo = {
            mixpanelToken: 'newToken',
            isPublicUser: true,
            userGUID: 'newUser',
        };
        initMixpanel(sessionInfo);

        expect(mixpanel.init).toHaveBeenCalledWith(sessionInfo.mixpanelToken);
        expect(mixpanel.identify).not.toHaveBeenCalledWith(
            sessionInfo.userGUID,
        );
    });
});
