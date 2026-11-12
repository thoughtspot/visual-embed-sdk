import { DataAppEmbed } from './data-app';
import * as authInstance from '../auth';
import { init } from '../index';
import {
    AuthType,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    EmbedEvent,
    ErrorDetailsTypes,
    RuntimeFilterOp,
} from '../types';
import { logger } from '../utils/logger';
import {
    getDocumentBody,
    getIFrameSrc,
    getIFrameEl,
    getRootEl,
    defaultParamsWithoutHiddenActions as defaultParams,
    expectUrlMatchesWithParams,
    executeAfterWait,
    mockMessageChannel,
    postMessageToParent,
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
    it('loads the App embed route on the v2 shell', async () => {
        const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
        await embed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}#/embed/insights/apps/app-1`,
        );
    });

    it.each([true, false])('sends enableDataApps=%s on the URL', async (enableDataApps) => {
        const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1', enableDataApps });
        await embed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&enableDataApps=${enableDataApps}#/embed/insights/apps/app-1`,
        );
    });

    // The app's route guards read it at boot, before APP_INIT arrives.
    it('keeps enableDataApps on the URL when the config is excluded from it', async () => {
        const embed = new DataAppEmbed(getRootEl(), {
            dataAppId: 'app-1',
            enableDataApps: true,
            additionalFlags: { excludeConfigFromURL: true },
        });
        await embed.render();
        expect(getIFrameSrc()).toContain('enableDataApps=true');
    });

    it.each([true, false])('sends hideDataAppHeader=%s on the URL', async (hideDataAppHeader) => {
        const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1', hideDataAppHeader });
        await embed.render();
        expect(getIFrameSrc()).toContain(`hideDataAppHeader=${hideDataAppHeader}`);
    });

    it('leaves hideDataAppHeader off the URL when it is not set', async () => {
        const embed = new DataAppEmbed(getRootEl(), { dataAppId: 'app-1' });
        await embed.render();
        expect(getIFrameSrc()).not.toContain('hideDataAppHeader');
    });

    // The app reads them from the init payload; the URL never carries them.
    it('sends runtime filters and parameters in APP_INIT, not in the URL', async () => {
        const embed = new DataAppEmbed(getRootEl(), {
            dataAppId: 'app-1',
            runtimeFilters: [{ columnName: 'Region', operator: RuntimeFilterOp.EQ, values: ['West'] }],
            runtimeParameters: [{ name: 'Target', value: 1000 }],
        });
        mockMessageChannel();
        embed.render();
        const mockPort: any = { postMessage: jest.fn() };
        await executeAfterWait(() => {
            postMessageToParent(
                getIFrameEl().contentWindow,
                { type: EmbedEvent.APP_INIT, data: {} },
                mockPort,
            );
        });
        await executeAfterWait(() => {
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: expect.objectContaining({
                    runtimeFilterParams: 'col1=Region&op1=EQ&val1=West',
                    runtimeParameterParams: 'param1=Target&paramVal1=1000',
                }),
            });
        });
        expect(getIFrameSrc()).not.toContain('col1=');
        expect(getIFrameSrc()).not.toContain('param1=');
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
});
