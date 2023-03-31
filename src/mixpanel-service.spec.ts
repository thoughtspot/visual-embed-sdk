import * as mixpanel from 'mixpanel-browser';
import {
    initMixpanel,
    uploadMixpanelEvent,
    MIXPANEL_EVENT,
    testResetMixpanel,
} from './mixpanel-service';
import { AuthType } from './types';

const config = {
    thoughtSpotHost: 'https://10.87.89.232',
    authType: AuthType.None,
};

jest.mock('mixpanel-browser', () => ({
    __esModule: true,
    init: jest.fn(),
    identify: jest.fn(),
    track: jest.fn(),
}));

describe('Unit test for mixpanel', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
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
        expect(mixpanel.identify).not.toHaveBeenCalledWith(sessionInfo.userGUID);
    });

    test('when not init, should queue events and flush on init', () => {
        testResetMixpanel();
        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_CALLED_INIT, {
            authType: config.authType,
            host: config.thoughtSpotHost,
        });
        uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_TRIGGER);
        expect(mixpanel.track).not.toHaveBeenCalled();
        const sessionInfo = {
            mixpanelToken: 'abc123',
            userGUID: '12345',
            isPublicUser: false,
        };
        initMixpanel(sessionInfo);
        expect(mixpanel.track).toHaveBeenCalledTimes(2);
    });
});
