import { DataAppEmbed, DataAppEmbedViewConfig } from './data-app';
import { DataAppControlError } from './data-app-control-error';
import { AppEmbed, AppViewConfig } from './app';
import { TsEmbed } from './ts-embed';
import { getEmbedConfig } from './embedConfig';
import type { LiveboardViewConfig } from './liveboard';
import * as authInstance from '../auth';
import * as mixpanelInstance from '../mixpanel-service';
import { init } from '../index';
import {
    AuthType,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    EmbedEvent,
    ErrorDetailsTypes,
    HostEvent,
    RuntimeFilterOp,
} from '../types';
import { logger } from '../utils/logger';
import { getHostEventTelemetryProps } from '../utils/hostEventTelemetry';
import * as processTriggerService from '../utils/processTrigger';
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
    waitFor,
} from '../test/test-utils';
import { DATA_APP_CONTROL_ERROR_MESSAGE, ERROR_MESSAGE } from '../errors';

const thoughtSpotHost = 'tshost';

const appId = 'a1b2';
const depotFilter = [{ columnName: 'Depot', operator: RuntimeFilterOp.EQ, values: ['Austin'] }];
const speedParam = [{ name: 'Speed Limit', value: 70 }];
const liveboardOverride = {
    dataSourceOverride: [{
        dataSourceIdentifier: 'model-guid',
        filterQuery: [{ filterQueryToken: 'depot = Austin' }],
    }],
};
const liveboardOverrides = { 'liveboard-guid': liveboardOverride };

const refusal = (option: string) => ({
    errorType: ErrorDetailsTypes.VALIDATION_ERROR,
    message: ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED,
    code: EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
    severity: EmbedErrorSeverity.SEV1,
    option,
    error: ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED,
});

// Every embed a test creates; the file's afterEach destroys them.
const embeds: TsEmbed[] = [];
const track = <T extends TsEmbed>(embed: T): T => {
    embeds.push(embed);
    return embed;
};
const newDataApp = (config: DataAppEmbedViewConfig) => track(new DataAppEmbed(getRootEl(), config));
const newAppEmbed = (config: AppViewConfig) => track(new AppEmbed(getRootEl(), config));

// A config a JavaScript caller could pass, past the type.
const createDataApp = (config: object) => {
    const embed = newDataApp(config as DataAppEmbedViewConfig);
    const errors: unknown[] = [];
    embed.on(EmbedEvent.Error, (error) => errors.push(error));
    return { embed, errors };
};

const renderDataApp = async (config: object) => {
    const created = createDataApp(config);
    await created.embed.render();
    return created;
};

const resolveAfter = (ms: number) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

const mockResizeObserver = () => {
    (window as any).ResizeObserver = window.ResizeObserver
        || jest.fn().mockImplementation(() => ({
            disconnect: jest.fn(),
            observe: jest.fn(),
            unobserve: jest.fn(),
        }));
};

// Each refused source, as a host could set it.
const refusedSources: [string, object][] = [
    ['runtimeFilters', { runtimeFilters: depotFilter }],
    ['runtimeParameters', { runtimeParameters: speedParam }],
    ['liveboardOverride', { liveboardOverride }],
    ['liveboardOverrides', { liveboardOverrides }],
    ['additionalFlags', { additionalFlags: { col1: 'Depot', op1: 'EQ', val1: 'Austin' } }],
];

let preRenderSeq = 0;
const nextPreRenderId = () => {
    preRenderSeq += 1;
    return `pre-render-${preRenderSeq}`;
};

const errorKeys = (errors: unknown[]) => errors.map(
    (error: any) => [error.code, error.option ?? error.message],
);

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

// So an online event in one test reloads no embed from another.
afterEach(() => {
    embeds.splice(0).forEach((embed) => {
        // destroy() posts DestroyEmbed, which no test here is about.
        jest.spyOn(embed, 'trigger').mockResolvedValue(undefined);
        embed.destroy();
    });
});

describe('DataAppEmbed', () => {
    it('loads the App embed route on the v2 shell, without enableDataApps', async () => {
        const embed = newDataApp({ dataAppId: 'app-1' });
        await embed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}#/embed/insights/apps/app-1`,
        );
    });

    it('URL-encodes the App id in the path', async () => {
        const embed = newDataApp({ dataAppId: 'a/../b' });
        await embed.render();
        expect(getIFrameSrc()).toContain('#/embed/insights/apps/a%2F..%2Fb');
    });

    it('raises a validation error and renders no frame without an App id', async () => {
        const embed = newDataApp({ dataAppId: '' });
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
        const embed = newDataApp({ dataAppId: 'app-1' });
        expect((embed as any).viewConfig).toMatchObject({
            embedComponentType: 'dataApp',
            dataAppId: 'app-1',
            excludeRuntimeFiltersfromURL: true,
            excludeRuntimeParametersfromURL: true,
        });
    });

    it('ignores fullHeight with a warning', () => {
        const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
        const embed = newDataApp({
            dataAppId: 'app-1',
            fullHeight: true,
        } as any);
        expect(warn).toHaveBeenCalledTimes(1);
        expect((embed as any).viewConfig.fullHeight).toBe(false);
        warn.mockRestore();
    });

    describe('navigateToDataApp', () => {
        it('navigates to the App with Navigate only', async () => {
            const embed = newDataApp({ dataAppId: 'app-1' });
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
            const embed = newDataApp({ dataAppId: 'app-2' });
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
            const embed = newDataApp({ dataAppId: 'app-1' });
            await embed.navigateToDataApp('app-2');
            expect(getIFrameSrc()).toContain('#/embed/insights/apps/app-2');
        });

        it('raises a validation error instead of navigating without an App id', async () => {
            const { embed, errors } = createDataApp({ dataAppId: 'app-1' });
            await embed.render();
            const trigger = jest.spyOn(embed as any, 'trigger').mockResolvedValue(undefined);

            await embed.navigateToDataApp('');

            expect(errors).toEqual([
                expect.objectContaining({ code: EmbedErrorCodes.DATA_APP_ID_MISSING }),
            ]);
            expect(trigger).not.toHaveBeenCalled();
            expect((embed as any).viewConfig.dataAppId).toBe('app-1');
        });

        it('raises a validation error and renders no frame without an App id, before render', async () => {
            const { embed, errors } = createDataApp({ dataAppId: 'app-1' });

            await embed.navigateToDataApp('');

            expect(errors).toEqual([
                expect.objectContaining({ code: EmbedErrorCodes.DATA_APP_ID_MISSING }),
            ]);
            expect(getIFrameEl()).toBeNull();
        });

        it('opens the App through the pre-render when the embed has a preRenderId', async () => {
            mockResizeObserver();
            const embed = newDataApp({
                dataAppId: 'app-1',
                preRenderId: 'navigate-pre-render',
            } as DataAppEmbedViewConfig);
            const preRender = jest.spyOn(embed, 'preRender');

            await embed.navigateToDataApp('app-2');
            await waitFor(() => !!getIFrameEl());

            expect(preRender).toHaveBeenCalledWith(true);
            expect(getIFrameSrc()).toContain('#/embed/insights/apps/app-2');
        });
    });

    describe('refused view config options', () => {
        let logError: jest.SpyInstance;

        beforeEach(() => {
            logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
        });

        afterEach(() => {
            logError.mockRestore();
        });

        it.each([
            ['runtimeFilters', depotFilter],
            ['runtimeParameters', speedParam],
            ['liveboardOverride', liveboardOverride],
            ['liveboardOverrides', liveboardOverrides],
        ])('refuses %s with one SEV1 error and renders no frame', async (option, value) => {
            const { embed, errors } = await renderDataApp({ dataAppId: appId, [option]: value });

            expect(errors).toEqual([refusal(option)]);
            expect(getIFrameEl()).toBeNull();
            expect((embed as any).isRendered).toBeFalsy();
        });

        it('refuses runtimeFilters spread in from a Liveboard view config', async () => {
            const liveboardViewConfig: LiveboardViewConfig = {
                liveboardId: 'liveboard-guid',
                runtimeFilters: depotFilter,
                visibleVizs: ['viz-guid'],
            };
            // Compiles: a variable gets no excess property check.
            const config = { ...liveboardViewConfig, dataAppId: appId };
            const embed = newDataApp(config);
            const errors: unknown[] = [];
            embed.on(EmbedEvent.Error, (error) => errors.push(error));

            await embed.render();

            expect(errors).toEqual([refusal('runtimeFilters')]);
            expect(getIFrameEl()).toBeNull();
        });

        it('raises one error per option in a fixed order, whatever the key order', async () => {
            const { embed, errors } = await renderDataApp({
                liveboardOverrides,
                liveboardOverride,
                runtimeParameters: speedParam,
                dataAppId: appId,
                runtimeFilters: depotFilter,
            });

            expect(errors).toEqual([
                refusal('runtimeFilters'),
                refusal('runtimeParameters'),
                refusal('liveboardOverride'),
                refusal('liveboardOverrides'),
            ]);
            expect(getIFrameEl()).toBeNull();
            expect((embed as any).isRendered).toBeFalsy();
        });

        it('renders empty option arrays as if they were absent', async () => {
            await renderDataApp({ dataAppId: appId });
            const plainSrc = getIFrameSrc();
            document.body.innerHTML = getDocumentBody();

            const { errors } = await renderDataApp({
                dataAppId: appId,
                runtimeFilters: [],
                runtimeParameters: [],
            });

            expect(errors).toEqual([]);
            expect(getIFrameSrc()).toBe(plainSrc);
        });

        it.each([
            [null],
            [undefined],
            [false],
            [[]],
            [{}],
        ])('renders when every option is %p', async (value) => {
            const { errors } = await renderDataApp({
                dataAppId: appId,
                runtimeFilters: value,
                runtimeParameters: value,
                liveboardOverride: value,
                liveboardOverrides: value,
            });

            expect(errors).toEqual([]);
            expect(getIFrameSrc()).toContain(`#/embed/insights/apps/${appId}`);
        });

        // Fail closed: any other value counts as set.
        it.each([
            ['runtimeFilters', ''],
            ['runtimeParameters', 0],
            ['liveboardOverride', true],
            ['liveboardOverride', { dataSourceOverride: [] }],
            ['liveboardOverrides', [liveboardOverride]],
        ])('refuses %s set to %p', async (option, value) => {
            const { errors } = await renderDataApp({ dataAppId: appId, [option]: value });

            expect(errors).toEqual([refusal(option)]);
            expect(getIFrameEl()).toBeNull();
        });

        it('raises only the refusals when the App id is also missing', async () => {
            const { errors } = await renderDataApp({ dataAppId: '', runtimeFilters: depotFilter });

            expect(errors).toEqual([refusal('runtimeFilters')]);
            expect(getIFrameEl()).toBeNull();
        });

        it('keeps refusing when navigateToDataApp is called after a refusal', async () => {
            const { embed, errors } = await renderDataApp({
                dataAppId: appId,
                runtimeParameters: speedParam,
            });

            await embed.navigateToDataApp('b7c8');

            expect(errors).toEqual([refusal('runtimeParameters'), refusal('runtimeParameters')]);
            expect(getIFrameEl()).toBeNull();
        });

        it('sends no runtime filter or parameter in the URL or APP_INIT', async () => {
            mockMessageChannel();
            const { errors } = await renderDataApp({ dataAppId: appId });
            expect(errors).toEqual([]);
            expect(getIFrameSrc()).not.toMatch(/(col|op|val|param|paramVal)1=/);

            const port: any = { postMessage: jest.fn() };
            await executeAfterWait(() => {
                postMessageToParent(
                    getIFrameEl().contentWindow,
                    { type: EmbedEvent.APP_INIT, data: {} },
                    port,
                );
            });
            let appInit: any;
            await executeAfterWait(() => {
                appInit = port.postMessage.mock.calls[0][0];
            });

            expect(appInit.type).toBe(EmbedEvent.APP_INIT);
            // The keys are always sent; they carry no value.
            expect(appInit.data.runtimeFilterParams).toBeNull();
            expect(appInit.data.runtimeParameterParams).toBeNull();
            expect(JSON.stringify(appInit.data)).not.toMatch(/(col|param)1=/);
        });

        describe('no filter value reaches the App', () => {
            const filterValue = /Austin|Speed(%20| )Limit/;
            let posted: unknown[];
            let processTrigger: jest.SpyInstance;

            // Frame URLs, APP_INIT answers and posted events, as one string.
            const sentToApp = async () => {
                const frames = Array.from(document.querySelectorAll('iframe'));
                const ports = frames.map((frame) => {
                    const port = { postMessage: jest.fn() };
                    postMessageToParent(
                        frame.contentWindow,
                        { type: EmbedEvent.APP_INIT, data: {} },
                        port,
                    );
                    return port;
                });
                await resolveAfter(10);
                const answers = ports.map((port) => port.postMessage.mock.calls);
                return JSON.stringify([frames.map((frame) => frame.src), answers, posted]);
            };

            beforeEach(() => {
                mockMessageChannel();
                mockResizeObserver();
                posted = [];
                processTrigger = jest
                    .spyOn(processTriggerService, 'processTrigger')
                    .mockImplementation((_, type, __, data) => {
                        posted.push([type, data]);
                        return Promise.resolve(null);
                    });
            });

            afterEach(() => {
                processTrigger.mockRestore();
            });

            it('sees a filter value where one is sent (AppEmbed control)', async () => {
                const appEmbed = newAppEmbed({ runtimeFilters: depotFilter });
                await appEmbed.render();

                expect(await sentToApp()).toMatch(filterValue);
            });

            const entries: [string, object, (embed: DataAppEmbed) => Promise<unknown>][] = [
                ['render()', {}, (embed) => embed.render()],
                ['prerenderGeneric() and a navigate', {}, async (embed) => {
                    await embed.prerenderGeneric();
                    await embed.navigateToDataApp(appId);
                }],
                // A shown pre-render sends the config in UpdateEmbedParams.
                ['preRender(true) and the frame loading', { preRenderId: 'value-check' }, async (embed) => {
                    await embed.preRender(true);
                    embed.isEmbedContainerLoaded = true;
                    (embed as any).executeEmbedContainerReadyCallbacks();
                    await resolveAfter(10);
                }],
            ];
            // Liveboard overrides reach the App only in UpdateEmbedParams.
            const onlyInUpdateEmbedParams = ['liveboardOverride', 'liveboardOverrides'];

            describe.each(refusedSources)('with %s set', (option, source) => {
                it.each(entries.filter(([name]) => !onlyInUpdateEmbedParams.includes(option)
                    || name.startsWith('preRender')))('sends it nowhere after %s', async (__, extra, enter) => {
                    const { embed } = createDataApp({ dataAppId: appId, ...source, ...extra });

                    await enter(embed);

                    expect(await sentToApp()).not.toMatch(filterValue);
                });
            });
        });

        it('takes none of the refused options or enableDataApps in its type', () => {
            const configs: DataAppEmbedViewConfig[] = [
                // @ts-expect-error not a DataAppEmbed option
                { dataAppId: appId, runtimeFilters: [] },
                // @ts-expect-error not a DataAppEmbed option
                { dataAppId: appId, runtimeParameters: [] },
                // @ts-expect-error not a DataAppEmbed option
                { dataAppId: appId, liveboardOverride: {} },
                // @ts-expect-error not a DataAppEmbed option
                { dataAppId: appId, liveboardOverrides: {} },
                // @ts-expect-error not a DataAppEmbed option
                { dataAppId: appId, enableDataApps: true },
            ];
            expect(configs).toHaveLength(5);
        });

        it('uses the sentence without dataAppControls until that option ships', () => {
            expect(ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED).toBe(
                'This option does not apply to DataAppEmbed. '
                + 'To restrict what a viewer can see, use row-level security.',
            );
        });
    });

    describe('runtime filter keys in additionalFlags', () => {
        let logError: jest.SpyInstance;

        beforeEach(() => {
            logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
        });

        afterEach(() => {
            logError.mockRestore();
            delete getEmbedConfig().additionalFlags;
        });

        it.each([
            'col1', 'Col1', 'OP1', 'val1', 'val12', 'param1', 'paramVal1', 'PARAMVAL1', 'paramval2',
        ])('refuses %s in the view config, once', async (key) => {
            const { embed, errors } = await renderDataApp({
                dataAppId: appId,
                additionalFlags: { [key]: 'Depot' },
            });

            expect(errors).toEqual([refusal('additionalFlags')]);
            expect(getIFrameEl()).toBeNull();
            expect((embed as any).isRendered).toBeFalsy();
        });

        it.each(['col1', 'Col1', 'PARAMVAL1'])('refuses %s in the init config, once', async (key) => {
            getEmbedConfig().additionalFlags = { [key]: 'Depot' };

            const { embed, errors } = await renderDataApp({ dataAppId: appId });

            expect(errors).toEqual([refusal('additionalFlags')]);
            expect(getIFrameEl()).toBeNull();
            expect((embed as any).isRendered).toBeFalsy();
        });

        it('raises one error for several keys, after the refused options', async () => {
            getEmbedConfig().additionalFlags = { PARAM1: 'Speed Limit' };

            const { errors } = await renderDataApp({
                dataAppId: appId,
                runtimeParameters: speedParam,
                additionalFlags: { col1: 'Depot', op1: 'EQ', val1: 'Austin' },
            });

            expect(errors).toEqual([refusal('runtimeParameters'), refusal('additionalFlags')]);
        });

        it.each([
            ['the view config', 'color1'],
            ['the view config', 'option'],
            ['the view config', 'column1'],
            ['the view config', 'valx'],
            ['the view config', 'paramValue1'],
            ['the view config', 'xcol1'],
            ['the init config', 'Color1'],
        ])('renders with a key in %s that only looks like one: %s', async (where, key) => {
            const flags = { [key]: 'Depot' };
            if (where === 'the init config') getEmbedConfig().additionalFlags = flags;
            const config = where === 'the view config' ? { additionalFlags: flags } : {};

            const { errors } = await renderDataApp({ dataAppId: appId, ...config });

            expect(errors).toEqual([]);
            expect(getIFrameSrc()).toContain(`#/embed/insights/apps/${appId}`);
        });

        it('refuses once, with no frame, when the init flags change while render() runs', async () => {
            const { embed, errors } = createDataApp({ dataAppId: appId });

            const rendering = embed.render();
            getEmbedConfig().additionalFlags = { col1: 'Depot' };
            await rendering;

            expect(errors).toEqual([refusal('additionalFlags')]);
            expect(getIFrameEl()).toBeNull();
            expect((embed as any).isRendered).toBe(false);
        });

        it('keeps a shown frame as it was when a later render() is refused late', async () => {
            const { embed, errors } = await renderDataApp({ dataAppId: appId });
            const frame = getIFrameEl();
            const { src } = frame;

            const rendering = embed.render();
            getEmbedConfig().additionalFlags = { col1: 'Depot' };
            await rendering;

            expect(errors).toEqual([refusal('additionalFlags')]);
            expect(getIFrameEl()).toBe(frame);
            expect(frame.src).toBe(src);
            expect((embed as any).isRendered).toBe(true);
        });
    });

    describe('a missing App id', () => {
        let logError: jest.SpyInstance;
        let logWarn: jest.SpyInstance;

        const missingId = (severity: EmbedErrorSeverity, message: string) => ({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message,
            code: EmbedErrorCodes.DATA_APP_ID_MISSING,
            severity,
            error: message,
        });

        beforeEach(() => {
            mockResizeObserver();
            logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            logWarn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
        });

        afterEach(() => {
            logError.mockRestore();
            logWarn.mockRestore();
        });

        it('reports an empty navigate argument as SEV3 with a warning, and a later valid call renders', async () => {
            const { embed, errors } = createDataApp({ dataAppId: appId });
            const expected = missingId(EmbedErrorSeverity.SEV3, ERROR_MESSAGE.DATA_APP_ID_MISSING);

            await embed.navigateToDataApp('');

            expect(errors).toEqual([expected]);
            expect(logWarn).toHaveBeenCalledWith(expected);
            expect(logError).not.toHaveBeenCalled();
            expect(getIFrameEl()).toBeNull();

            await embed.navigateToDataApp('b7c8');

            expect(errors).toHaveLength(1);
            expect((embed as any).isRendered).toBe(true);
            expect(getIFrameSrc()).toContain('#/embed/insights/apps/b7c8');
        });

        it('navigates a rendered embed after an empty navigate argument', async () => {
            const { embed, errors } = await renderDataApp({ dataAppId: appId });
            const triggerHostEvent = jest
                .spyOn((embed as any).hostEventClient, 'triggerHostEvent')
                .mockResolvedValue(null);

            await embed.navigateToDataApp('');
            await embed.navigateToDataApp('b7c8');

            expect(errors).toHaveLength(1);
            expect(triggerHostEvent).toHaveBeenCalledTimes(1);
            expect(triggerHostEvent).toHaveBeenCalledWith(
                HostEvent.Navigate,
                'embed/insights/apps/b7c8',
                undefined,
            );
        });

        it.each([
            ['render()', false, (embed: DataAppEmbed) => embed.render()],
            ['navigateToDataApp()', false, (embed: DataAppEmbed) => embed.navigateToDataApp('b7c8')],
            ['prerenderGeneric()', false, (embed: DataAppEmbed) => embed.prerenderGeneric()],
            ['preRender()', true, (embed: DataAppEmbed) => embed.preRender()],
            ['showPreRender()', true, (embed: DataAppEmbed) => embed.showPreRender()],
            ['navigateToDataApp() with a preRenderId', true, (embed: DataAppEmbed) => embed.navigateToDataApp('b7c8')],
        ])('stops an embed rendered with no App id: a later %s asks for a new embed', async (_, withPreRender, enter) => {
            const { embed, errors } = createDataApp(
                withPreRender ? { preRenderId: nextPreRenderId() } : {},
            );
            await embed.render();

            await enter(embed);

            expect(errors).toEqual([
                missingId(EmbedErrorSeverity.SEV1, ERROR_MESSAGE.DATA_APP_ID_MISSING),
                missingId(EmbedErrorSeverity.SEV1, ERROR_MESSAGE.DATA_APP_EMBED_STOPPED),
            ]);
            expect(getIFrameEl()).toBeNull();
            expect((embed as any).isRendered).toBeFalsy();
        });
    });

    describe('every entry point with a refused config', () => {
        let logError: jest.SpyInstance;
        let processTrigger: jest.SpyInstance;

        const entryPoints: [string, boolean, (embed: DataAppEmbed) => Promise<unknown>][] = [
            ['render()', false, (embed) => embed.render()],
            ['prerenderGeneric()', false, (embed) => embed.prerenderGeneric()],
            ['preRender()', true, (embed) => embed.preRender()],
            ['preRender(true)', true, (embed) => embed.preRender(true)],
            ['showPreRender()', true, (embed) => embed.showPreRender()],
            ['navigateToDataApp()', false, (embed) => embed.navigateToDataApp('b7c8')],
            ['navigateToDataApp() with a preRenderId', true, (embed) => embed.navigateToDataApp('b7c8')],
        ];

        beforeEach(() => {
            mockResizeObserver();
            logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            processTrigger = jest.spyOn(processTriggerService, 'processTrigger');
        });

        afterEach(() => {
            logError.mockRestore();
            processTrigger.mockRestore();
        });

        describe.each(refusedSources)('with %s set', (option, source) => {
            it.each(entryPoints)('%s refuses once, and so does a navigate after it', async (_, withPreRender, enter) => {
                const { embed, errors } = createDataApp({
                    dataAppId: appId,
                    ...source,
                    ...(withPreRender ? { preRenderId: nextPreRenderId() } : {}),
                });
                const triggerHostEvent = jest.spyOn((embed as any).hostEventClient, 'triggerHostEvent');

                await enter(embed);

                expect(errors).toEqual([refusal(option)]);
                expect(getIFrameEl()).toBeNull();
                expect((embed as any).isRendered).toBeFalsy();

                await embed.navigateToDataApp('c9d0');

                expect(errors).toEqual([refusal(option), refusal(option)]);
                expect(getIFrameEl()).toBeNull();
                expect((embed as any).isRendered).toBeFalsy();
                expect(embed.getUnderlyingFrameElement()).toBeFalsy();
                expect(triggerHostEvent).not.toHaveBeenCalled();
                expect(processTrigger).not.toHaveBeenCalled();
            });
        });

        it('refuses every set source, each once and in order, from one call', async () => {
            const { embed, errors } = createDataApp({
                dataAppId: appId,
                ...Object.assign({}, ...refusedSources.map(([, source]) => source)),
            });

            await embed.prerenderGeneric();

            expect(errors).toEqual(refusedSources.map(([option]) => refusal(option)));
            expect(getIFrameEl()).toBeNull();
        });
    });

    describe('a refused embed and a pre-render that already exists', () => {
        let logError: jest.SpyInstance;
        let processTrigger: jest.SpyInstance;
        let posted: [HostEvent, unknown][];

        beforeEach(() => {
            mockResizeObserver();
            logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            posted = [];
            processTrigger = jest
                .spyOn(processTriggerService, 'processTrigger')
                .mockImplementation((_, type, __, data) => {
                    posted.push([type, data]);
                    return Promise.resolve(null);
                });
        });

        afterEach(() => {
            logError.mockRestore();
            processTrigger.mockRestore();
        });

        it.each([
            ['hidden', false],
            ['shown', true],
        ])('does not adopt a %s pre-render, or navigate it', async (_, shown) => {
            const preRenderId = nextPreRenderId();
            const owner = newDataApp({
                dataAppId: appId,
                preRenderId,
            } as DataAppEmbedViewConfig);
            await owner.preRender();
            await waitFor(() => !!getIFrameEl());
            if (shown) await owner.showPreRender();
            const frame = getIFrameEl();
            const wrapper = document.getElementById(owner.getPreRenderIds().wrapper);
            const { src } = frame;
            const { opacity } = wrapper.style;
            posted = [];

            const { embed, errors } = createDataApp({
                dataAppId: 'secret',
                preRenderId,
                runtimeFilters: depotFilter,
            });
            await embed.preRender();
            await embed.navigateToDataApp('secret');
            const direct = await embed.trigger(HostEvent.Navigate, 'embed/insights/apps/secret');

            expect(errorKeys(errors)).toEqual([
                [EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED, 'runtimeFilters'],
                [EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED, 'runtimeFilters'],
                [EmbedErrorCodes.RENDER_NOT_CALLED, ERROR_MESSAGE.RENDER_BEFORE_EVENTS_REQUIRED],
            ]);
            expect(direct).toBeNull();
            expect((embed as any).isRendered).toBeFalsy();
            expect(embed.getUnderlyingFrameElement()).toBeFalsy();
            expect(posted).toEqual([]);
            expect(document.querySelectorAll('iframe')).toHaveLength(1);
            expect(frame.src).toBe(src);
            expect(wrapper.style.opacity).toBe(opacity);
            expect(wrapper.style.opacity).toBe(shown ? '' : '0');
        });
    });

    describe('showPreRender with a refused option', () => {
        let logError: jest.SpyInstance;
        let baseShowPreRender: jest.SpyInstance;

        beforeEach(() => {
            mockResizeObserver();
            logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            baseShowPreRender = jest.spyOn(TsEmbed.prototype, 'showPreRender');
        });

        afterEach(() => {
            logError.mockRestore();
            baseShowPreRender.mockRestore();
        });

        it('does not show a connected pre-render', async () => {
            const owner = newDataApp({
                dataAppId: appId,
                preRenderId: 'refused-connected',
            } as DataAppEmbedViewConfig);
            await owner.preRender();
            await waitFor(() => !!getIFrameEl());
            const wrapper = document.getElementById(owner.getPreRenderIds().wrapper);
            expect(wrapper.style.opacity).toBe('0');

            const { embed, errors } = createDataApp({
                dataAppId: appId,
                preRenderId: 'refused-connected',
                runtimeParameters: speedParam,
            });
            await embed.showPreRender();

            expect(errors).toEqual([refusal('runtimeParameters')]);
            expect(baseShowPreRender).not.toHaveBeenCalled();
            expect(wrapper.style.opacity).toBe('0');
            expect(wrapper.style.pointerEvents).toBe('none');
            expect((embed as any).isRendered).toBeFalsy();
        });

        it('creates no frame for a pre-render that is not there yet', async () => {
            const { embed, errors } = createDataApp({
                dataAppId: appId,
                preRenderId: 'refused-unconnected',
                liveboardOverride,
            });

            await embed.showPreRender();

            expect(errors).toEqual([refusal('liveboardOverride')]);
            expect(baseShowPreRender).not.toHaveBeenCalled();
            expect(getIFrameEl()).toBeNull();
        });

        it('shows the pre-render when no option is refused', async () => {
            const { embed, errors } = createDataApp({
                dataAppId: appId,
                preRenderId: 'nothing-refused',
            });

            embed.showPreRender();
            await waitFor(() => !!getIFrameEl());

            expect(errors).toEqual([]);
            expect(baseShowPreRender).toHaveBeenCalled();
            expect(getIFrameSrc()).toContain(`#/embed/insights/apps/${appId}`);
        });
    });

    describe('Liveboard host events', () => {
        const refusedEvents: [HostEvent, unknown][] = [
            [HostEvent.UpdateRuntimeFilters, depotFilter],
            [HostEvent.UpdateParameters, speedParam],
            [HostEvent.UpdateFilters, { filter: { column: 'Depot', oper: 'EQ', values: ['Austin'] } }],
            [HostEvent.GetFilters, undefined],
            [HostEvent.GetParameters, undefined],
        ];
        let processTrigger: jest.SpyInstance;

        const postedTypes = () => processTrigger.mock.calls.map(([, type]) => type);

        const expectRefused = async (result: Promise<unknown>) => {
            const error = await result.then(() => 'resolved', (rejection) => rejection);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(DataAppControlError);
            expect(error).toMatchObject({
                name: 'DataAppControlError',
                code: 'NOT_SUPPORTED_IN_DATA_APP',
                message: DATA_APP_CONTROL_ERROR_MESSAGE.NOT_SUPPORTED_IN_DATA_APP,
            });
        };

        beforeEach(() => {
            processTrigger = jest.spyOn(processTriggerService, 'processTrigger');
        });

        afterEach(() => {
            processTrigger.mockRestore();
        });

        it.each(refusedEvents)('rejects %s on a rendered App and posts nothing', async (event, payload) => {
            const embed = newDataApp({ dataAppId: appId });
            await embed.render();
            const triggerHostEvent = jest.spyOn((embed as any).hostEventClient, 'triggerHostEvent');
            const handleError = jest.spyOn(embed as any, 'handleError');

            await expectRefused(embed.trigger(event, payload as any));

            expect(triggerHostEvent).not.toHaveBeenCalled();
            expect(postedTypes()).not.toContain(event);
            expect(handleError).not.toHaveBeenCalled();
        });

        it.each(refusedEvents)('rejects %s before render, with no render error', async (event, payload) => {
            const embed = newDataApp({ dataAppId: appId });
            const handleError = jest.spyOn(embed as any, 'handleError');

            await expectRefused(embed.trigger(event, payload as any));

            expect(handleError).not.toHaveBeenCalled();
            expect(processTrigger).not.toHaveBeenCalled();
        });

        it('uses the fixed sentence for a refused host event', () => {
            expect(DATA_APP_CONTROL_ERROR_MESSAGE.NOT_SUPPORTED_IN_DATA_APP).toBe(
                'This host event does not apply to DataAppEmbed.',
            );
        });

        it.each(refusedEvents)('reports a refused %s to telemetry, with no payload value', async (event, payload) => {
            const upload = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
            const embed = newDataApp({ dataAppId: appId });
            const eventId = `${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${event}`;

            await expectRefused(embed.trigger(event, payload as any));

            const reported = upload.mock.calls.filter(([id]) => id === eventId);
            upload.mockRestore();
            expect(reported).toEqual([[eventId, getHostEventTelemetryProps({
                hostEvent: event,
                payload: payload ?? {},
                context: undefined,
                embedComponentType: 'dataApp',
            })]]);
            expect(JSON.stringify(reported)).not.toMatch(/Austin|Depot|Speed Limit/);
        });

        it('rejects as a promise and never throws', async () => {
            const embed = newDataApp({ dataAppId: appId });
            let result: Promise<unknown>;

            expect(() => {
                result = embed.trigger(HostEvent.GetFilters);
            }).not.toThrow();

            expect(result).toBeInstanceOf(Promise);
            await expect(result).rejects.toBeInstanceOf(DataAppControlError);
        });

        it('turns a throw while pointing the frame at the App into a rejection', async () => {
            const embed = newDataApp({ dataAppId: appId });
            await embed.render();
            (embed as any).viewConfig.dataAppId = '\uD800';
            let result: Promise<unknown>;

            expect(() => {
                result = embed.trigger(HostEvent.Reload);
            }).not.toThrow();

            await expect(result).rejects.toBeInstanceOf(URIError);
            expect(processTrigger).not.toHaveBeenCalled();
        });

        it('leaves the App id unchanged when the new one cannot be encoded', async () => {
            const embed = newDataApp({ dataAppId: appId });
            await embed.render();

            await expect(embed.navigateToDataApp('\uD800')).rejects.toBeInstanceOf(URIError);

            expect((embed as any).viewConfig.dataAppId).toBe(appId);
        });

        it('builds the error class from a code that has a sentence', () => {
            const error = new DataAppControlError('NOT_SUPPORTED_IN_DATA_APP');
            // Compile-time check; ts-jest fails the file if it compiles.
            // @ts-expect-error a code with no sentence is not accepted
            const withoutSentence = () => new DataAppControlError('UNKNOWN_CONTROL');

            expect(error).toBeInstanceOf(Error);
            expect(error).toMatchObject({
                name: 'DataAppControlError',
                code: 'NOT_SUPPORTED_IN_DATA_APP',
                message: DATA_APP_CONTROL_ERROR_MESSAGE.NOT_SUPPORTED_IN_DATA_APP,
            });
        });

        it.each(refusedEvents)('still posts %s from an AppEmbed', async (event, payload) => {
            const appEmbed = newAppEmbed({});
            await appEmbed.render();
            const triggerHostEvent = jest
                .spyOn((appEmbed as any).hostEventClient, 'triggerHostEvent')
                .mockResolvedValue(null);

            await appEmbed.trigger(event, payload as any);

            expect(triggerHostEvent).toHaveBeenCalledWith(event, payload ?? {}, undefined);
        });

        it.each([
            [HostEvent.Reload, {}],
            [HostEvent.UpdateEmbedParams, { dataAppId: appId }],
            [HostEvent.Navigate, 'embed/insights/apps/b7c8'],
        ])('passes %s through to the App', async (event, payload) => {
            const embed = newDataApp({ dataAppId: appId });
            await embed.render();
            const triggerHostEvent = jest
                .spyOn((embed as any).hostEventClient, 'triggerHostEvent')
                .mockResolvedValue('done');

            await expect(embed.trigger(event, payload as any)).resolves.toBe('done');

            expect(triggerHostEvent).toHaveBeenCalledWith(event, payload, undefined);
        });
    });

    describe('Reload', () => {
        const realProcessTrigger = processTriggerService.processTrigger;
        let processTrigger: jest.SpyInstance;
        // The frame URL each Reload of this test's frame reads.
        let reloadedSrc: string[];

        beforeEach(() => {
            reloadedSrc = [];
            processTrigger = jest
                .spyOn(processTriggerService, 'processTrigger')
                .mockImplementation((iFrame, type, ...rest) => {
                    if (type !== HostEvent.Reload) return Promise.resolve(null);
                    if (iFrame === getIFrameEl()) reloadedSrc.push(iFrame.src);
                    return realProcessTrigger(iFrame, type, ...rest);
                });
        });

        afterEach(() => {
            processTrigger.mockRestore();
            window.history.pushState({}, '', '/');
        });

        it('reopens the App opened with navigateToDataApp, keeping the query and ts- params', async () => {
            window.history.pushState({}, '', '/host?ts-foo=bar#/page?ts-baz=1');
            const embed = newDataApp({ dataAppId: 'app-1' });
            await embed.render();
            const firstSrc = getIFrameSrc();
            expect(firstSrc).toContain('#/embed/insights/apps/app-1?ts-foo=bar&ts-baz=1');

            await embed.navigateToDataApp('app-2');
            await embed.trigger(HostEvent.Reload);
            await resolveAfter(150);

            const expectedSrc = firstSrc.replace('/apps/app-1?', '/apps/app-2?');
            expect(reloadedSrc).toEqual([expectedSrc]);
            expect(getIFrameSrc()).toBe(expectedSrc);
        });

        it('reopens an App whose id needs encoding', async () => {
            const embed = newDataApp({ dataAppId: 'app-1' });
            await embed.render();
            const firstSrc = getIFrameSrc();

            await embed.navigateToDataApp('b/7');
            await embed.trigger(HostEvent.Reload);

            expect(reloadedSrc).toEqual([firstSrc.replace('/apps/app-1', '/apps/b%2F7')]);
        });

        it('reopens the first App unchanged when no other was opened', async () => {
            const embed = newDataApp({ dataAppId: 'app-1' });
            await embed.render();
            const firstSrc = getIFrameSrc();

            await embed.trigger(HostEvent.Reload);

            expect(reloadedSrc).toEqual([firstSrc]);
        });

        it('reopens the App open now when the browser comes back online', async () => {
            const embed = newDataApp({ dataAppId: 'app-1' });
            await embed.render();
            const firstSrc = getIFrameSrc();
            await embed.navigateToDataApp('app-2');

            window.dispatchEvent(new Event('online'));
            await executeAfterWait(() => undefined);

            expect(reloadedSrc).toEqual([firstSrc.replace('/apps/app-1', '/apps/app-2')]);
        });

        it.each([
            ['trigger(HostEvent.Reload)', (embed: DataAppEmbed) => embed.trigger(HostEvent.Reload)],
            ['the browser coming back online', async () => {
                window.dispatchEvent(new Event('online'));
                await executeAfterWait(() => undefined);
            }],
        ])('reopens the App opened on a generic pre-render, on %s', async (_, reload) => {
            const embed = newDataApp({ dataAppId: 'app-1' });
            await embed.prerenderGeneric();
            const genericSrc = getIFrameSrc();
            expect(genericSrc).toMatch(/#$/);

            await embed.navigateToDataApp('b7c8');
            await reload(embed);

            expect(reloadedSrc).toEqual([`${genericSrc}/embed/insights/apps/b7c8`]);
        });

        it('reopens the App of the embed that showed a shared pre-render, keeping ts- params', async () => {
            mockResizeObserver();
            window.history.pushState({}, '', '/host?ts-foo=bar');
            const preRenderId = nextPreRenderId();
            const owner = newDataApp({
                dataAppId: 'app-a',
                preRenderId,
            } as DataAppEmbedViewConfig);
            await owner.preRender();
            await waitFor(() => !!getIFrameEl());
            const ownerSrc = getIFrameSrc();
            expect(ownerSrc).toContain('#/embed/insights/apps/app-a?ts-foo=bar');

            const embed = newDataApp({
                dataAppId: 'app-b',
                preRenderId,
            } as DataAppEmbedViewConfig);
            await embed.showPreRender();
            await embed.trigger(HostEvent.Reload);

            expect(reloadedSrc).toEqual([ownerSrc.replace('/apps/app-a', '/apps/app-b')]);
        });

        it('does not rewrite a frame URL that has no route', async () => {
            const embed = newDataApp({ dataAppId: 'app-1' });
            await embed.render();
            await embed.navigateToDataApp('app-2');
            getIFrameEl().src = `http://${thoughtSpotHost}/v2/?a=b`;

            await embed.trigger(HostEvent.Reload);

            expect(reloadedSrc).toEqual([`http://${thoughtSpotHost}/v2/?a=b`]);
        });

        it('raises the render error as before when the embed is not rendered', async () => {
            const embed = newDataApp({ dataAppId: 'app-1' });
            const handleError = jest.spyOn(embed as any, 'handleError').mockImplementation(() => undefined);

            await expect(embed.trigger(HostEvent.Reload)).resolves.toBeNull();

            expect(handleError).toHaveBeenCalledWith(
                expect.objectContaining({ code: EmbedErrorCodes.RENDER_NOT_CALLED }),
            );
            expect(processTrigger).not.toHaveBeenCalled();
        });
    });
});
