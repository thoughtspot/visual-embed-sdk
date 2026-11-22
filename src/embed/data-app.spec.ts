import { DataAppEmbed } from './data-app';
import * as authInstance from '../auth';
import { init } from '../index';
import {
    AuthType,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    ErrorDetailsTypes,
    HostEvent,
} from '../types';
import { logger } from '../utils/logger';
import {
    getDocumentBody,
    getIFrameSrc,
    getIFrameEl,
    getRootEl,
    defaultParamsWithoutHiddenActions as defaultParams,
    expectUrlMatchesWithParams,
} from '../test/test-utils';
import { ERROR_MESSAGE } from '../errors';

const thoughtSpotHost = 'tshost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
    jest.spyOn(window, 'alert');
});

beforeEach(() => {
    document.body.innerHTML = getDocumentBody();
});

describe('DataAppEmbed', () => {
    it('loads the App embed route on the v2 shell, without enableDataApps', async () => {
        const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
        await embed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}#/embed/insights/apps/app-1`,
        );
    });

    it('URL-encodes the App id in the path', async () => {
        const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'a/../b' });
        await embed.render();
        expect(getIFrameSrc()).toContain('#/embed/insights/apps/a%2F..%2Fb');
    });

    it('raises a validation error and renders no frame without an App id', async () => {
        const embed = new DataAppEmbed(getRootEl(), { dataAppId: '' });
        const handleError = jest.spyOn(embed as any, 'handleError').mockImplementation(() => undefined);
        await embed.render();
        expect(handleError).toHaveBeenCalledWith({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.DATA_APP_ID_MISSING,
            code: EmbedErrorCodes.DATA_APP_ID_MISSING,
            severity: EmbedErrorSeverity.SEV1,
            error: ERROR_MESSAGE.DATA_APP_ID_MISSING,
        });
        expect(getIFrameEl()).toBeNull();
        expect((embed as any).isRendered).toBeFalsy();
    });

    it('keeps the view config defaults set by the base class', () => {
        const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
        expect((embed as any).viewConfig).toMatchObject({
            embedComponentType: 'dataApp',
            dataAppId: 'app-1',
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
        });
    });

    it('ignores fullHeight with a warning', () => {
        const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
        const embed = new DataAppEmbed(getRootEl(), {
            dataAppId: 'app-1',
            fullHeight: true,
        } as any);
        expect(warn).toHaveBeenCalledTimes(1);
        expect((embed as any).viewConfig.fullHeight).toBe(false);
        warn.mockRestore();
    });

    describe('navigateToDataApp', () => {
        it('navigates to the App with Navigate only', async () => {
            const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
            await embed.render();
            const trigger = jest.spyOn(embed as any, 'trigger').mockResolvedValue(undefined);

            await embed.navigateToDataApp('app/2');

            // Like navigateToLiveboard(): Navigate only, no UpdateEmbedParams.
            expect(trigger).toHaveBeenCalledTimes(1);
            expect(trigger).toHaveBeenCalledWith(
                HostEvent.Navigate,
                'embed/insights/apps/app%2F2',
            );
            expect((embed as any).viewConfig.dataAppId).toBe('app/2');
        });

        // Showing a pre-render posts UpdateEmbedParams, then waits
        // UPDATE_EMBED_PARAMS_SETTLE_MS (200ms) for it to apply.
        it('opens a shown pre-render\'s App once its params apply', async () => {
            const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-2' });
            const trigger = jest.spyOn(embed as any, 'trigger').mockResolvedValue(undefined);
            const navigate = jest.spyOn(embed, 'navigateToDataApp').mockResolvedValue(undefined);

            embed.isEmbedContainerLoaded = false;
            (embed as any).beforePrerenderVisible();
            embed.isEmbedContainerLoaded = true;
            (embed as any).executeEmbedContainerReadyCallbacks();
            expect(navigate).not.toHaveBeenCalled();

            await new Promise((resolve) => {
                setTimeout(resolve, 300);
            });

            expect(trigger).toHaveBeenCalledWith(
                HostEvent.UpdateEmbedParams,
                expect.objectContaining({ dataAppId: 'app-2' }),
            );
            expect(navigate).toHaveBeenCalledWith('app-2');
            expect(trigger.mock.invocationCallOrder[0]).toBeLessThan(
                navigate.mock.invocationCallOrder[0],
            );
        });

        it('renders the App when the embed is not rendered yet', async () => {
            const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
            await embed.navigateToDataApp('app-2');
            expect(getIFrameSrc()).toContain('#/embed/insights/apps/app-2');
        });

        it('raises a validation error instead of navigating without an App id', async () => {
            const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
            await embed.render();
            const handleError = jest.spyOn(embed as any, 'handleError').mockImplementation(() => undefined);
            const trigger = jest.spyOn(embed as any, 'trigger').mockResolvedValue(undefined);

            await embed.navigateToDataApp('');

            expect(handleError).toHaveBeenCalledWith(
                expect.objectContaining({ code: EmbedErrorCodes.DATA_APP_ID_MISSING }),
            );
            expect(trigger).not.toHaveBeenCalled();
            expect((embed as any).viewConfig.dataAppId).toBe('app-1');
        });
    });
});
