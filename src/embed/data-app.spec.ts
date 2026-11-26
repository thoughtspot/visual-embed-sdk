import { DataAppEmbed } from './data-app';
import * as authInstance from '../auth';
import { init } from '../index';
import {
    Action,
    AuthType,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    EmbedEvent,
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
    expectUrlToHaveParamsWithValues,
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

    describe('App header', () => {
        it.each([
            [true, 'true'],
            [false, 'false'],
        ])('puts hideDataAppHeader=%p in the frame URL', async (value, text) => {
            const embed = new DataAppEmbed(getRootEl(), {
                dataAppId: 'app-1',
                hideDataAppHeader: value,
            });
            await embed.render();
            expect(new URL(getIFrameSrc()).searchParams.get('hideDataAppHeader')).toBe(text);
        });

        it('leaves hideDataAppHeader out of the URL when unset', async () => {
            const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
            await embed.render();
            expect(new URL(getIFrameSrc()).searchParams.has('hideDataAppHeader')).toBe(false);
        });

        // The payload also spreads the view config; a non-boolean value
        // shows that the param handling, which sends a boolean, ran.
        it.each([
            ['yes', true],
            [false, false],
            [undefined, undefined],
        ])('sends hideDataAppHeader=%p in UpdateEmbedParams as %p', async (value, expected) => {
            const embed = new DataAppEmbed(getRootEl(), {
                dataAppId: 'app-1',
                ...(value === undefined ? {} : { hideDataAppHeader: value as any }),
            });

            const params = await (embed as any).getUpdateEmbedParamsObject();

            expect(params.hideDataAppHeader).toBe(expected);
            expect('hideDataAppHeader' in params).toBe(expected !== undefined);
        });

        it.each([
            [
                'hidden and disabled',
                {
                    hiddenActions: [Action.Remove, Action.MakeACopy],
                    disabledActions: [Action.Share],
                    disabledActionReason: 'Not here',
                },
                {
                    hideAction: JSON.stringify([Action.ReportError, Action.Remove, Action.MakeACopy]),
                    disableAction: JSON.stringify([Action.Share]),
                    disableHint: 'Not here',
                },
            ],
            [
                'visible',
                { visibleActions: [Action.Share, Action.Present] },
                { visibleAction: JSON.stringify([Action.Share, Action.Present]) },
            ],
        ])('sends the %s header actions to the App page as JSON', async (_, options, expected) => {
            const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1', ...options });
            await embed.render();
            expectUrlToHaveParamsWithValues(getIFrameSrc(), expected);
        });

        it('raises CONFLICTING_ACTIONS_CONFIG and loads no App with hidden and visible actions', async () => {
            const loggerError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            const onError = jest.fn();
            const embed = new DataAppEmbed(getRootEl(), {
                dataAppId: 'app-1',
                hiddenActions: [Action.Remove],
                visibleActions: [Action.Share],
            });
            embed.on(EmbedEvent.Error, onError);

            try {
                await embed.render();

                expect(onError).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                        code: EmbedErrorCodes.CONFLICTING_ACTIONS_CONFIG,
                    }),
                    expect.anything(),
                );
                expect(getIFrameEl()).toBeNull();
            } finally {
                loggerError.mockRestore();
            }
        });

        it('passes a rejected UpdateDataAppName on as Error', () => {
            const onError = jest.fn();
            const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
            embed.on(EmbedEvent.Error, onError);

            (embed as any).executeCallbacks(EmbedEvent.Error, {
                type: EmbedEvent.Error,
                data: {
                    errorType: 'VALIDATION_ERROR',
                    code: 'HOST_EVENT_VALIDATION',
                    message: 'UpdateDataAppName needs a name that is not empty.',
                },
            });

            expect(onError).toHaveBeenCalledTimes(1);
        });

        it('sends UpdateDataAppName with the name only, and no App id', async () => {
            const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
            await embed.render();
            const send = jest
                .spyOn((embed as any).hostEventClient, 'triggerHostEvent')
                .mockResolvedValue(undefined);

            await embed.trigger(HostEvent.UpdateDataAppName, { name: 'Regional sales' });

            expect(send).toHaveBeenCalledWith(
                HostEvent.UpdateDataAppName,
                { name: 'Regional sales' },
                undefined,
            );
        });
    });
});
