import { SearchEmbed } from './search';
import * as baseInstance from './base';
import * as authService from '../utils/authService';
import * as authInstance from '../auth';
import * as config from '../config';

import { init } from '../index';
import { AuthType } from '../types';
import { getDocumentBody, getRootEl } from '../test/test-utils';
import { mockSessionInfo } from '../auth.spec';
import { ERROR_MESSAGE } from '../errors';

const thoughtSpotHost = 'tshost';
init({
    thoughtSpotHost,
    authType: AuthType.Basic,
    username: 'tsadmin',
    password: 'admin',
});

describe('Search embed tests when authType is Basic', () => {
    function setupVersion(version: string) {
        jest.spyOn(window, 'addEventListener').mockImplementationOnce(
            (event, handler, options) => {
                handler({
                    data: {
                        type: 'xyz',
                    },
                    ports: [3000],
                    source: null,
                });
            },
        );
        jest.spyOn(authService, 'fetchSessionInfoService').mockImplementation(
            async () => ({
                json: () => ({
                    ...mockSessionInfo,
                    releaseVersion: version,
                }),
                status: 200,
            }),
        );
        jest.spyOn(authInstance, 'getReleaseVersion').mockReturnValue(version);
    }
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
        jest.spyOn(baseInstance, 'getAuthPromise').mockResolvedValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('when releaseVersion is empty', async () => {
        setupVersion('');
        const mockAlert = spyOn(window, 'alert');
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        await searchEmbed.render();
        expect(mockAlert).not.toBeCalled();
    });

    test("when releaseVersion is '7.0.1.cl' ", async () => {
        setupVersion('7.0.1.cl');
        const mockAlert = jest.spyOn(window, 'alert');
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        await searchEmbed.render();
        expect(mockAlert).not.toBeCalled();
    });
    test('when releaseVersion is above 8.4.0.sw', async () => {
        setupVersion('8.4.0.sw');
        const mockAlert = jest.spyOn(window, 'alert');
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        await searchEmbed.render();
        expect(mockAlert).not.toBeCalled();
    });

    test('releaseVersion is above 8.4.0.sw', async () => {
        setupVersion('8.8.0.sw');
        jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
            () => 'http://tshost',
        );
        const mockAlert = jest.spyOn(window, 'alert');
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        await searchEmbed.render();
        expect(mockAlert).not.toBeCalled();
    });

    test('Alert should not appear when suppressSearchEmbedBetaWarning is true and releaseVersion is ts7.dec.cl', async () => {
        setupVersion('ts7.dec.cl');
        jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
            () => 'http://tshost',
        );
        jest.spyOn(baseInstance, 'getEmbedConfig').mockReturnValue({
            suppressSearchEmbedBetaWarning: true,
        });
        const mockAlert = jest.spyOn(window, 'alert');
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        await searchEmbed.render();
        expect(mockAlert).not.toBeCalled();
    });

    test('Alert should not appear when suppressSearchEmbedBetaWarning is true and releaseVersion is 8.4.0.sw', async () => {
        setupVersion('8.4.0.sw');
        jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
            () => 'http://tshost',
        );
        jest.spyOn(baseInstance, 'getEmbedConfig').mockReturnValue({
            suppressSearchEmbedBetaWarning: true,
        });
        const mockAlert = jest.spyOn(window, 'alert');
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        await searchEmbed.render();
        expect(mockAlert).not.toBeCalled();
    });
});
