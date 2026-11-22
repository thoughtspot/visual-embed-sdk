import { setImmediate as realSetImmediate } from 'timers';
import { types as utilTypes } from 'util';
import { MessageChannel as NodeMessageChannel } from 'worker_threads';
import { DATA_APP_CALL_BUDGET_MS, DataAppEmbed, DataAppEmbedViewConfig } from './data-app';
import { DataAppControlError } from './data-app-control-error';
import { AppEmbed, AppViewConfig } from './app';
import { TsEmbed } from './ts-embed';
import { getEmbedConfig } from './embedConfig';
import { LiveboardEmbed, LiveboardViewConfig } from './liveboard';
import { SearchEmbed } from './search';
import * as authInstance from '../auth';
import * as mixpanelInstance from '../mixpanel-service';
import { init } from '../index';
import {
    Action,
    AuthType,
    ContextType,
    EmbedErrorCodes,
    EmbedErrorSeverity,
    EmbedEvent,
    ErrorDetailsTypes,
    HostEvent,
    RuntimeFilterOp,
} from '../types';
import { getValueFromWindow } from '../utils';
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

const refusal = (option: string) => {
    const message = option === 'dataAppControls'
        ? ERROR_MESSAGE.DATA_APP_CONTROLS_NOT_SUPPORTED
        : ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED;
    return {
        errorType: ErrorDetailsTypes.VALIDATION_ERROR,
        message,
        code: EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
        severity: EmbedErrorSeverity.SEV1,
        option,
        error: message,
    };
};
const depotControls = [{ id: 'depot', value: { op: 'eq', values: ['Austin'] } }];

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
    // Interim: refused until the SDK packs host-set values.
    ['dataAppControls', { dataAppControls: depotControls }],
];

let preRenderSeq = 0;
const nextPreRenderId = () => {
    preRenderSeq += 1;
    return `pre-render-${preRenderSeq}`;
};

const errorKeys = (errors: unknown[]) => errors.map(
    (error: any) => [error.code, error.option ?? error.message],
);

// Resolves once pending promise callbacks ran; works with fake timers.
const flush = () => new Promise((resolve) => {
    realSetImmediate(resolve);
});

// What an App call settled with, readable without awaiting it.
interface CallOutcome {
    settled: boolean;
    value?: unknown;
    error?: any;
}
const watch = (call: Promise<unknown>): CallOutcome => {
    const outcome: CallOutcome = { settled: false };
    call.then(
        (value) => {
            Object.assign(outcome, { settled: true, value });
        },
        (error) => {
            Object.assign(outcome, { settled: true, error });
        },
    );
    return outcome;
};

// Keys that hold null or undefined (TC-608 allows none).
const emptyKeys = (value: object) => Object.entries(value)
    .filter(([, entry]) => entry === null || entry === undefined)
    .map(([key]) => key);

const expectControlError = (outcome: CallOutcome, code: string, results?: unknown[]) => {
    expect(outcome.settled).toBe(true);
    const { error } = outcome;
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DataAppControlError);
    expect(error).toMatchObject({
        name: 'DataAppControlError',
        code,
        message: (DATA_APP_CONTROL_ERROR_MESSAGE as Record<string, string>)[code],
    });
    if (results) {
        expect(error.results).toStrictEqual(results);
    } else {
        expect('results' in error).toBe(false);
    }
    expect(emptyKeys(error)).toEqual([]);
};

// The state an Apps page reports for an App.
const appState = (id = appId) => ({
    appId: id,
    session: 'S1',
    revision: 1,
    valueFormat: 2,
    controls: depotControls,
});

// An embed event from the embed's own frame.
const fromFrame = (type: string, data?: unknown) => postMessageToParent(
    getIFrameEl().contentWindow,
    { type, data, status: 'end' },
);
const appReady = (id = appId) => fromFrame(EmbedEvent.DataAppReady, appState(id));
// The frame's error when the App could not be opened.
const appOpenFailed = (fields: object = { appId }) => fromFrame(EmbedEvent.Error, {
    code: EmbedErrorCodes.DATA_APP_OPEN_FAILED,
    severity: EmbedErrorSeverity.SEV1,
    errorType: ErrorDetailsTypes.API,
    reason: 'FAILED',
    message: 'The App could not be opened.',
    ...fields,
});

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
            ['dataAppControls', [{ id: 'depot', value: null }]],
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
                dataAppControls: value,
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
            ['dataAppControls', { depot: { op: 'eq', values: ['Austin'] } }],
            ['dataAppControls', 'depot'],
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
            // These reach the App only in UpdateEmbedParams.
            const onlyInUpdateEmbedParams = ['liveboardOverride', 'liveboardOverrides', 'dataAppControls'];

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

        it('does not show a connected pre-render with dataAppControls', async () => {
            const preRenderId = nextPreRenderId();
            const owner = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
            await owner.preRender();
            await waitFor(() => !!getIFrameEl());
            const wrapper = document.getElementById(owner.getPreRenderIds().wrapper);

            const { embed, errors } = createDataApp({
                dataAppId: appId,
                preRenderId,
                dataAppControls: depotControls,
            });
            await embed.showPreRender();

            expect(errors).toEqual([refusal('dataAppControls')]);
            expect(baseShowPreRender).not.toHaveBeenCalled();
            expect(wrapper.style.opacity).toBe('0');
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

    describe('App calls', () => {
        const budget = 30000;
        const realProcessTrigger = processTriggerService.processTrigger;
        let processTrigger: jest.SpyInstance;
        // One per posted App call, in post order.
        let replies: { resolve: (value: unknown) => void; reject: (reason: unknown) => void }[];

        // Each App call posted to the frame, as [type, data, context].
        const appCalls = () => processTrigger.mock.calls
            .filter(([, type]) => type === HostEvent.GetDataAppControls)
            .map(([, type, , data, context]) => [type, data, context]);
        const sentAs = (data: unknown) => [HostEvent.GetDataAppControls, data, ContextType.DataApp];

        const getControls = (embed: TsEmbed, data?: unknown, context?: ContextType) => watch(
            embed.trigger(HostEvent.GetDataAppControls, data as any, context),
        );

        const renderedApp = async (config: object = { dataAppId: appId }) => {
            const created = createDataApp(config);
            await created.embed.render();
            await flush();
            return created;
        };

        const readyApp = async (config?: object) => {
            const created = await renderedApp(config);
            appReady();
            await flush();
            return created;
        };

        beforeEach(() => {
            mockResizeObserver();
            replies = [];
            processTrigger = jest
                .spyOn(processTriggerService, 'processTrigger')
                .mockImplementation((_, type) => (type === HostEvent.GetDataAppControls
                    ? new Promise((resolve, reject) => {
                        replies.push({ resolve, reject });
                    })
                    : Promise.resolve(null)));
        });

        afterEach(() => {
            jest.useRealTimers();
            processTrigger.mockRestore();
        });

        it('has a 30 second budget', () => {
            expect(DATA_APP_CALL_BUDGET_MS).toBe(budget);
        });

        describe('waiting for DataAppReady', () => {
            it('holds a call until DataAppReady, then posts it as a plain host event in the dataApp context', async () => {
                const { embed } = await renderedApp();
                const passthrough = jest.spyOn((embed as any).hostEventClient, 'triggerUIPassthroughApi');
                const state = appState();

                const call = getControls(embed);
                await flush();

                expect(call.settled).toBe(false);
                expect(processTrigger).not.toHaveBeenCalled();

                appReady();
                await flush();

                expect(processTrigger).toHaveBeenCalledTimes(1);
                expect(processTrigger).toHaveBeenCalledWith(
                    getIFrameEl(),
                    HostEvent.GetDataAppControls,
                    expect.anything(),
                    { appId },
                    ContextType.DataApp,
                );
                expect(passthrough).not.toHaveBeenCalled();

                replies[0].resolve(state);
                await flush();

                expect(call.value).toBe(state);
            });

            it('posts a call at once when the App is ready', async () => {
                const { embed } = await readyApp();

                getControls(embed);
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);
            });

            const entryPoints: [string, boolean, (embed: DataAppEmbed) => Promise<unknown>][] = [
                ['render()', false, (embed) => embed.render()],
                ['preRender()', true, (embed) => embed.preRender()],
                ['showPreRender()', true, (embed) => embed.showPreRender()],
                ['navigateToDataApp()', false, (embed) => embed.navigateToDataApp(appId)],
                ['navigateToDataApp() with a preRenderId', true, (embed) => embed.navigateToDataApp(appId)],
            ];

            it.each(entryPoints)('holds a call made in the tick of init() and %s, before init settles', async (_, withPreRender, enter) => {
                // The SDK's init flags, as before init()'s promise settles.
                const initFlags = getValueFromWindow('initFlagKey');
                initFlags.isInitCompleted = false;
                let embed: DataAppEmbed;
                let entering: Promise<unknown>;
                let call: CallOutcome;
                try {
                    init({ thoughtSpotHost, authType: AuthType.None });
                    embed = newDataApp({
                        dataAppId: appId,
                        ...(withPreRender ? { preRenderId: nextPreRenderId() } : {}),
                    } as DataAppEmbedViewConfig);
                    entering = enter(embed);
                    call = getControls(embed);
                    expect((embed as any).isRendered).toBeFalsy();
                } finally {
                    initFlags.isInitCompleted = true;
                }
                await entering;
                await flush();

                expect(call.settled).toBe(false);
                expect(appCalls()).toEqual([]);

                appReady();
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);
                replies[0].resolve(appState());
                await flush();
                expect(call.value).toEqual(appState());
            });

            it('rejects a call held for 30 s with APP_NOT_READY, and posts nothing (TC-302)', async () => {
                const { embed } = await renderedApp();
                jest.useFakeTimers();

                const call = getControls(embed);
                jest.advanceTimersByTime(budget - 1);
                await flush();

                expect(call.settled).toBe(false);

                jest.advanceTimersByTime(1);
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(appCalls()).toEqual([]);
            });

            it('counts the wait in the call\'s one budget: TIMEOUT 30 s after trigger(), not 42 s (TC-436)', async () => {
                const { embed } = await renderedApp();
                jest.useFakeTimers();

                const call = getControls(embed);
                jest.advanceTimersByTime(12000);
                appReady();
                await flush();

                expect(appCalls()).toHaveLength(1);

                jest.advanceTimersByTime(budget - 12000 - 1);
                await flush();

                expect(call.settled).toBe(false);

                jest.advanceTimersByTime(1);
                await flush();

                expectControlError(call, 'TIMEOUT');
            });

            it('posts a call released late in its budget, and resolves it with a reply in time', async () => {
                const { embed } = await renderedApp();
                jest.useFakeTimers();

                const call = getControls(embed);
                jest.advanceTimersByTime(budget - 100);
                appReady();
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);

                jest.advanceTimersByTime(99);
                replies[0].resolve(appState());
                await flush();

                expect(call.value).toEqual(appState());
            });

            it('ends a call released late in its budget with TIMEOUT at 30 s when no reply comes', async () => {
                const { embed } = await renderedApp();
                jest.useFakeTimers();

                const call = getControls(embed);
                jest.advanceTimersByTime(budget - 100);
                appReady();
                await flush();
                jest.advanceTimersByTime(99);
                await flush();

                expect(appCalls()).toHaveLength(1);
                expect(call.settled).toBe(false);

                jest.advanceTimersByTime(1);
                await flush();

                expectControlError(call, 'TIMEOUT');
            });

            it('posts held calls in the order they were made (TC-435)', async () => {
                const { embed } = await renderedApp();
                const tags = ['first', 'second', 'third'];

                const calls = tags.map((tag) => getControls(embed, { tag }));
                await flush();
                appReady();
                await flush();

                expect(appCalls()).toEqual(tags.map((tag) => sentAs({ tag, appId })));

                replies.forEach((reply) => reply.resolve(appState()));
                await flush();

                expect(calls.map((outcome) => outcome.settled && !('error' in outcome))).toEqual([true, true, true]);
            });

            it.each([
                ['another App', () => appReady('b7c8')],
                // Compared as given: the Apps page echoes the route's id.
                ['the App id in another case', () => appReady(appId.toUpperCase())],
                ['no App id', () => fromFrame(EmbedEvent.DataAppReady, { ...appState(), appId: undefined })],
                ['no payload', () => fromFrame(EmbedEvent.DataAppReady)],
            ])('keeps a call held on a DataAppReady with %s', async (_, announce) => {
                const { embed } = await renderedApp();
                const call = getControls(embed);

                announce();
                await flush();

                expect(call.settled).toBe(false);
                expect(appCalls()).toEqual([]);

                appReady();
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);
            });
        });

        describe('calls that cannot wait', () => {
            let logError: jest.SpyInstance;

            beforeEach(() => {
                logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            });

            afterEach(() => {
                logError.mockRestore();
                delete getEmbedConfig().additionalFlags;
            });

            it('rejects at once on an embed never rendered, raising no Error, and the embed still renders (TC-303)', async () => {
                const { embed, errors } = createDataApp({ dataAppId: appId });
                let result: Promise<unknown>;

                expect(() => {
                    result = embed.trigger(HostEvent.GetDataAppControls);
                }).not.toThrow();
                const call = watch(result);
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(errors).toEqual([]);
                expect((embed as any).isError).toBe(false);
                expect(processTrigger).not.toHaveBeenCalled();

                await embed.render();

                expect(getIFrameEl()).not.toBeNull();
            });

            it('rejects at once after a refused render', async () => {
                const { embed, errors } = await renderDataApp({ dataAppId: appId, runtimeFilters: depotFilter });

                const call = getControls(embed);
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(errors).toEqual([refusal('runtimeFilters')]);
                expect(appCalls()).toEqual([]);
            });

            it('rejects a call held by a render that a late refusal stops, at once', async () => {
                const { embed, errors } = createDataApp({ dataAppId: appId });

                const rendering = embed.render();
                const call = getControls(embed);
                getEmbedConfig().additionalFlags = { col1: 'Depot' };
                await rendering;
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(errors).toEqual([refusal('additionalFlags')]);
                expect(getIFrameEl()).toBeNull();

                const later = getControls(embed);
                await flush();

                expectControlError(later, 'APP_NOT_READY');
            });
        });

        describe('the payload and the context', () => {
            it.each([
                ['no payload', undefined, { appId }],
                ['an empty object', {}, { appId }],
                ['appId: undefined', { appId: undefined }, { appId }],
                ['another field', { include: 'definitions' }, { include: 'definitions', appId }],
            ])('fills appId with the ready App when the payload has %s (TC-417)', async (_, data, expected) => {
                const { embed } = await readyApp();
                const before = data && { ...data };

                getControls(embed, data);
                await flush();

                expect(appCalls()).toEqual([sentAs(expected)]);
                // The host's object is not changed.
                expect(data).toStrictEqual(before);
            });

            it.each([
                ['the open App', { appId }],
                ['another App', { appId: 'b7c8' }],
                ['appId: null', { appId: null }],
                ['null', null],
                ['a string', 'controls'],
                ['an array', [{ appId }]],
                ['a number', 7],
                ['a class instance', new (class ControlsQuery {})()],
            ])('posts a payload with %s as given (TC-417)', async (_, data) => {
                const { embed } = await readyApp();

                getControls(embed, data);
                await flush();

                expect(appCalls()).toHaveLength(1);
                expect(appCalls()[0][1]).toBe(data);
            });

            it.each([
                [undefined],
                [ContextType.Liveboard],
                [ContextType.Search],
            ])('sends the call in the dataApp context when the host passes %p', async (context) => {
                const { embed } = await readyApp();

                getControls(embed, {}, context);
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);
            });

            it('posts the App read itself, never through TsEmbed.trigger', async () => {
                const baseTrigger = jest.spyOn(TsEmbed.prototype, 'trigger');
                try {
                    const { embed } = await readyApp();

                    const call = getControls(embed);
                    await flush();
                    replies[0].resolve(appState());
                    await flush();

                    expect(call.value).toEqual(appState());
                    expect(baseTrigger.mock.calls.filter(([type]) => type === HostEvent.GetDataAppControls))
                        .toEqual([]);
                } finally {
                    baseTrigger.mockRestore();
                }
            });

            it('refuses an App read routed to TsEmbed.trigger, posting nothing', async () => {
                const { embed } = await readyApp();

                const call = watch(TsEmbed.prototype.trigger.call(embed, HostEvent.GetDataAppControls, {}));
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(appCalls()).toEqual([]);
            });

            it.each([
                ['posted', true],
                ['refused before it is posted', false],
            ])('reports a call %s once, in the dataApp context, with types only', async (_, rendered) => {
                const upload = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
                const embed = rendered
                    ? (await readyApp()).embed
                    : createDataApp({ dataAppId: appId }).embed;
                const eventId = `${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.GetDataAppControls}`;
                const payload = { appId: 'b7c8' };

                getControls(embed, payload, ContextType.Liveboard);
                await flush();

                const reported = upload.mock.calls.filter(([id]) => id === eventId);
                upload.mockRestore();
                expect(reported).toEqual([[eventId, getHostEventTelemetryProps({
                    hostEvent: HostEvent.GetDataAppControls,
                    payload,
                    context: ContextType.DataApp,
                    embedComponentType: 'dataApp',
                })]]);
                expect(JSON.stringify(reported)).not.toContain('b7c8');
            });
        });

        describe('resets', () => {
            it.each([
                ['navigateToDataApp() to another App', 'b7c8', (embed: DataAppEmbed) => embed.navigateToDataApp('b7c8')],
                ['HostEvent.Reload', appId, (embed: DataAppEmbed) => embed.trigger(HostEvent.Reload)],
                ['a failed open', appId, async () => appOpenFailed()],
            ])('rejects a held call at once on %s, and does not replay it (TC-437)', async (_, nextApp, reset) => {
                const { embed } = await renderedApp();
                const call = getControls(embed);
                await flush();

                await reset(embed);
                await flush();

                expectControlError(call, 'APP_NOT_READY');

                appReady(nextApp);
                await flush();

                expect(appCalls()).toEqual([]);
            });

            it('ignores a late DataAppReady from the App it left, and posts with the new App', async () => {
                const { embed } = await readyApp();
                await embed.navigateToDataApp('b7c8');
                const call = getControls(embed);

                appReady(appId);
                await flush();

                expect(call.settled).toBe(false);
                expect(appCalls()).toEqual([]);

                appReady('b7c8');
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId: 'b7c8' })]);
            });

            it('leaves a call sent before an App switch to the Apps page\'s answer', async () => {
                const { embed } = await readyApp();
                const call = getControls(embed);
                await flush();

                await embed.navigateToDataApp('b7c8');
                await flush();

                expect(call.settled).toBe(false);

                replies[0].reject({ code: 'APP_MISMATCH' });
                await flush();

                expectControlError(call, 'APP_MISMATCH');
            });

            it('posts a released call with the App that released it, even if the host switches App in that tick', async () => {
                const { embed } = createDataApp({ dataAppId: appId });
                embed.on(EmbedEvent.DataAppReady, () => {
                    embed.navigateToDataApp('b7c8');
                });
                await embed.render();
                await flush();
                const call = getControls(embed);

                appReady();
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);
                expect(call.settled).toBe(false);
            });

            it('rejects a sent call SESSION_LOST at once on HostEvent.Reload; a late reply changes nothing', async () => {
                const { embed } = await readyApp();
                jest.useFakeTimers();
                const sent = getControls(embed);
                await flush();

                expect(appCalls()).toHaveLength(1);

                await embed.trigger(HostEvent.Reload);
                await flush();

                expectControlError(sent, 'SESSION_LOST');

                replies[0].resolve(appState());
                await flush();

                expect(sent.error.code).toBe('SESSION_LOST');

                const next = getControls(embed);
                await flush();

                expect(next.settled).toBe(false);
                expect(appCalls()).toHaveLength(1);

                appReady();
                await flush();

                expect(appCalls()).toHaveLength(2);
                replies[1].resolve(appState());
                await flush();
                expect(next.value).toEqual(appState());
            });

            it('ends App calls when the browser comes back online: sent SESSION_LOST, held APP_NOT_READY', async () => {
                const { embed } = await readyApp();
                const sent = getControls(embed);
                await flush();
                await embed.navigateToDataApp('b7c8');
                const held = getControls(embed);
                await flush();

                window.dispatchEvent(new Event('online'));
                await flush();

                expectControlError(sent, 'SESSION_LOST');
                expectControlError(held, 'APP_NOT_READY');
            });

            it('rejects a held call APP_NOT_READY and a sent one SESSION_LOST at once on destroy() (TC-419)', async () => {
                const { embed } = createDataApp({ dataAppId: appId });
                const onReady = jest.fn();
                embed.on(EmbedEvent.DataAppReady, onReady);
                await embed.render();
                await flush();
                appReady();
                await flush();
                const sent = getControls(embed);
                await flush();
                await embed.navigateToDataApp('b7c8');
                const held = getControls(embed);
                await flush();
                const frameWindow = getIFrameEl().contentWindow;
                jest.useFakeTimers();

                embed.destroy();
                await flush();

                expectControlError(held, 'APP_NOT_READY');
                expectControlError(sent, 'SESSION_LOST');

                replies[0].resolve(appState());
                postMessageToParent(frameWindow, { type: EmbedEvent.DataAppReady, data: appState('b7c8') });
                const later = getControls(embed);
                await flush();

                expect(sent.error.code).toBe('SESSION_LOST');
                expectControlError(later, 'APP_NOT_READY');
                expect(onReady).toHaveBeenCalledTimes(1);
                expect(appCalls()).toHaveLength(1);
            });

            it('does not post a call released in the tick that destroy() runs in', async () => {
                const { embed } = createDataApp({ dataAppId: appId });
                embed.on(EmbedEvent.DataAppReady, () => embed.destroy());
                await embed.render();
                await flush();
                const call = getControls(embed);
                await flush();

                appReady();
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(appCalls()).toEqual([]);
            });

            it('does not post a call released in the tick of a failed open', async () => {
                const { embed } = await renderedApp();
                const call = getControls(embed);
                await flush();

                appReady();
                appOpenFailed();
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(appCalls()).toEqual([]);
            });
        });

        describe('a failed open', () => {
            it.each([
                ['naming the App', { appId }],
                ['naming no App', {}],
            ])('makes new calls reject at once, after a DATA_APP_OPEN_FAILED %s (TC-296)', async (_, fields) => {
                const { embed } = await renderedApp();
                appOpenFailed(fields);
                await flush();

                const call = getControls(embed);
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(appCalls()).toEqual([]);
            });

            it.each([
                ['for another App', () => appOpenFailed({ appId: 'b7c8' })],
                ['with another code', () => appOpenFailed({ code: EmbedErrorCodes.DATA_APP_SESSION_LOST })],
                ['raised by the SDK itself', (embed: DataAppEmbed) => (embed as any).executeCallbacks(EmbedEvent.Error, {
                    code: EmbedErrorCodes.DATA_APP_OPEN_FAILED,
                    severity: EmbedErrorSeverity.SEV1,
                    errorType: ErrorDetailsTypes.API,
                    message: 'The App could not be opened.',
                    appId,
                })],
                ['with no payload', (embed: DataAppEmbed) => (embed as any).executeCallbacks(EmbedEvent.Error, undefined)],
            ])('keeps calls waiting after an Error %s', async (_, raise) => {
                const { embed } = await renderedApp();
                const held = getControls(embed);

                raise(embed);
                await flush();
                const later = getControls(embed);
                await flush();

                expect(held.settled).toBe(false);
                expect(later.settled).toBe(false);

                appReady();
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId }), sentAs({ appId })]);
            });

            it('keeps rejecting at once after a navigateToDataApp() to the App already open', async () => {
                const { embed } = await renderedApp();
                appOpenFailed();
                await flush();

                await embed.navigateToDataApp(appId);
                const call = getControls(embed);
                await flush();

                expectControlError(call, 'APP_NOT_READY');
            });

            it.each([
                ['HostEvent.Reload', appId, (embed: DataAppEmbed) => embed.trigger(HostEvent.Reload)],
                ['navigateToDataApp() to another App', 'b7c8', (embed: DataAppEmbed) => embed.navigateToDataApp('b7c8')],
                ['a DataAppReady, as after the viewer\'s Retry', appId, async () => appReady()],
            ])('lets calls through again after %s', async (_, nextApp, retry) => {
                const { embed } = await renderedApp();
                appOpenFailed();
                await flush();

                await retry(embed);
                await flush();
                const call = getControls(embed);
                await flush();

                expect(call.settled).toBe(false);

                appReady(nextApp);
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId: nextApp })]);
                replies[0].resolve(appState(nextApp));
                await flush();
                expect(call.value).toEqual(appState(nextApp));
            });
        });

        describe('a pre-render', () => {
            it('does not restart a held call\'s budget when hidden and shown: APP_NOT_READY at 30 s (TC-568)', async () => {
                const embed = newDataApp({ dataAppId: appId, preRenderId: nextPreRenderId() } as DataAppEmbedViewConfig);
                await embed.preRender();
                await flush();
                jest.useFakeTimers();

                const call = getControls(embed);
                jest.advanceTimersByTime(10000);
                embed.hidePreRender();
                jest.advanceTimersByTime(10000);
                await embed.showPreRender();
                jest.advanceTimersByTime(budget - 20000 - 1);
                await flush();

                expect(call.settled).toBe(false);

                jest.advanceTimersByTime(1);
                await flush();

                expectControlError(call, 'APP_NOT_READY');
                expect(appCalls()).toEqual([]);
            });

            it('takes the ready App from the pre-render\'s owner when it shows the same App', async () => {
                const preRenderId = nextPreRenderId();
                const owner = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                await owner.preRender();
                await flush();
                appReady();
                await flush();

                const embed = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                await embed.showPreRender();
                getControls(embed);
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);
            });

            it('holds a call when it shows another App than the owner\'s', async () => {
                const preRenderId = nextPreRenderId();
                const owner = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                await owner.preRender();
                await flush();
                appReady();
                await flush();

                const embed = newDataApp({ dataAppId: 'b7c8', preRenderId } as DataAppEmbedViewConfig);
                await embed.showPreRender();
                const call = getControls(embed);
                await flush();

                expect(call.settled).toBe(false);
                expect(appCalls()).toEqual([]);

                appReady('b7c8');
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId: 'b7c8' })]);
            });

            it('rejects at once when the owner\'s open of the same App failed', async () => {
                const preRenderId = nextPreRenderId();
                const owner = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                await owner.preRender();
                await flush();
                appOpenFailed();
                await flush();

                const embed = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                await embed.showPreRender();
                const call = getControls(embed);
                await flush();

                expectControlError(call, 'APP_NOT_READY');
            });

            it.each([
                ['a DataAppEmbed on another App', (preRenderId: string) => newDataApp({
                    dataAppId: 'b7c8',
                    preRenderId,
                } as DataAppEmbedViewConfig)],
                ['an AppEmbed', (preRenderId: string) => newAppEmbed({ preRenderId } as AppViewConfig)],
            ])('holds again when re-shown after %s showed the frame', async (_, createOther) => {
                const preRenderId = nextPreRenderId();
                const embed = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                await embed.showPreRender();
                await flush();
                appReady();
                await flush();
                const other: TsEmbed = createOther(preRenderId);
                await other.showPreRender();

                await embed.showPreRender();
                const call = getControls(embed);
                await flush();

                expect(call.settled).toBe(false);
                expect(appCalls()).toEqual([]);

                appReady();
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);
            });

            it('treats a pre-render owner whose App it cannot read as another App', async () => {
                const embed = newDataApp({ dataAppId: appId, preRenderId: nextPreRenderId() } as DataAppEmbedViewConfig);
                await embed.showPreRender();
                await flush();
                appReady();
                await flush();
                jest.spyOn(embed as any, 'getPreRenderObj').mockReturnValue({});

                await embed.showPreRender();
                const call = getControls(embed);
                await flush();

                expect(call.settled).toBe(false);
                expect(appCalls()).toEqual([]);
            });

            // Known limit (CR-8b): a hidden instance misses DataAppReady.
            it('misses a DataAppReady that came while it was hidden: calls wait 30 s, until a Reload', async () => {
                const embed = newDataApp({ dataAppId: appId, preRenderId: nextPreRenderId() } as DataAppEmbedViewConfig);
                await embed.showPreRender();
                await flush();
                embed.hidePreRender();
                appReady();
                await flush();
                await embed.showPreRender();
                jest.useFakeTimers();

                const call = getControls(embed);
                jest.advanceTimersByTime(budget - 1);
                await flush();

                expect(call.settled).toBe(false);

                jest.advanceTimersByTime(1);
                await flush();

                expectControlError(call, 'APP_NOT_READY');

                await embed.trigger(HostEvent.Reload);
                const retried = getControls(embed);
                appReady();
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);
                expect(retried.settled).toBe(false);
            });
        });

        describe('on other embed types', () => {
            let baseTrigger: jest.SpyInstance;

            beforeEach(() => {
                baseTrigger = jest.spyOn(TsEmbed.prototype, 'trigger');
            });

            afterEach(() => {
                baseTrigger.mockRestore();
            });

            it.each([
                ['LiveboardEmbed', () => track(new LiveboardEmbed(getRootEl(), { liveboardId: 'lb-1' }))],
                ['LiveboardEmbed with a vizId', () => track(new LiveboardEmbed(getRootEl(), { liveboardId: 'lb-1', vizId: 'viz-1' }))],
                ['AppEmbed', () => newAppEmbed({})],
                ['SearchEmbed', () => track(new SearchEmbed(getRootEl(), {}))],
            ])('%s rejects the App read at once, before and after render, and posts nothing (TC-511)', async (_, create) => {
                const embed: TsEmbed = create();
                const errors: unknown[] = [];
                embed.on(EmbedEvent.Error, (error) => errors.push(error));

                const before = getControls(embed);
                await flush();
                await embed.render();
                const after = getControls(embed);
                await flush();

                expectControlError(before, 'APP_NOT_READY');
                expectControlError(after, 'APP_NOT_READY');
                expect(appCalls()).toEqual([]);
                expect(errors).toEqual([]);
                expect((embed as any).isError).toBe(false);
                expect(getIFrameEl()).not.toBeNull();
                expect(baseTrigger.mock.calls.filter(([type]) => type === HostEvent.GetDataAppControls))
                    .toHaveLength(2);
            });
        });

        describe('failures', () => {
            const appsPageCodes = [
                'INVALID_REQUEST',
                'LIMIT_EXCEEDED',
                'UNSUPPORTED_FIELD',
                'APP_MISMATCH',
                'CONTROLS_NOT_SUPPORTED',
                'APP_NOT_READY',
                'NOT_SIGNED_IN',
                'VALUE_REFUSED',
                'SUPERSEDED',
                'RATE_LIMITED',
                'SESSION_LOST',
                'TIMEOUT',
                'FAILED',
            ];

            const sentCall = async () => {
                const { embed } = await readyApp();
                const call = getControls(embed);
                await flush();
                return call;
            };

            it.each(appsPageCodes)('keeps the Apps page code %s, with the SDK\'s sentence', async (code) => {
                const call = await sentCall();

                replies[0].reject({ code, message: 'A sentence from the reply' });
                await flush();

                expectControlError(call, code);
            });

            it.each([
                ['the shell\'s own validation reply (TC-573)', {
                    errorType: 'VALIDATION_ERROR',
                    message: 'No handler is registered for GetDataAppControls',
                    code: 'HOST_EVENT_VALIDATION',
                }],
                ['a string', 'Invalid payload'],
                ['NOT_SUPPORTED_IN_DATA_APP from the wire', { code: 'NOT_SUPPORTED_IN_DATA_APP' }],
                ['a per-entry code', { code: 'UNKNOWN_CONTROL' }],
                ['the code toString', { code: 'toString' }],
                ['the code hasOwnProperty', { code: 'hasOwnProperty' }],
                ['the code __proto__', { code: '__proto__' }],
                ['an object with no code', {}],
                ['an Error', new Error('The handler threw')],
                ['a number', 7],
                ['null', null],
                ['undefined', undefined],
            ])('turns %s into FAILED', async (_, reason) => {
                const call = await sentCall();

                replies[0].reject(reason);
                await flush();

                expectControlError(call, 'FAILED');
            });

            it('turns the transport\'s own timeout into TIMEOUT', async () => {
                const call = await sentCall();

                replies[0].resolve(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT));
                await flush();

                expectControlError(call, 'TIMEOUT');
            });

            it('turns a payload the browser cannot copy into INVALID_REQUEST (TC-363)', async () => {
                const call = await sentCall();

                replies[0].reject(new DOMException('#<Object> could not be cloned.', 'DataCloneError'));
                await flush();

                expectControlError(call, 'INVALID_REQUEST');
            });

            it('keeps only id, status and code of each result, with no empty key (TC-574, TC-608)', async () => {
                const call = await sentCall();

                replies[0].reject({
                    code: 'VALUE_REFUSED',
                    message: 'aurora said: SECRET-123',
                    results: [
                        { id: 'depot', status: 'rejected', code: 'INVALID_VALUE', reason: 'SECRET-123', message: 'x' },
                        { id: 'route', status: 'skipped' },
                        null,
                        { id: 'a' },
                        { id: 'b', status: 'rejected', code: null, reason: 'x' },
                        { status: 'accepted', value: { op: 'eq' } },
                    ],
                });
                await flush();

                expectControlError(call, 'VALUE_REFUSED', [
                    { id: 'depot', status: 'rejected', code: 'INVALID_VALUE' },
                    { id: 'route', status: 'skipped' },
                    {},
                    { id: 'a' },
                    { id: 'b', status: 'rejected' },
                    { status: 'accepted' },
                ]);
                expect(JSON.stringify(call.error)).not.toContain('SECRET-123');
            });

            it.each([
                ['an empty array', []],
                ['an object', { depot: 'rejected' }],
                ['a string', 'rejected'],
            ])('leaves out results that are %s', async (_, results) => {
                const call = await sentCall();

                replies[0].reject({ code: 'INVALID_REQUEST', results });
                await flush();

                expectControlError(call, 'INVALID_REQUEST');
            });

            it('resolves a reply with fields this version does not know, as given (TC-544)', async () => {
                const call = await sentCall();
                const newer = { ...appState(), revision: 3, hostSettable: ['depot'], results: [] as unknown[] };

                replies[0].resolve(newer);
                await flush();

                expect(call.value).toBe(newer);
            });

            it('words the read\'s TIMEOUT and INVALID_REQUEST for any call, not a change', () => {
                expect(DATA_APP_CONTROL_ERROR_MESSAGE.TIMEOUT).not.toMatch(/change was sent/i);
                expect(DATA_APP_CONTROL_ERROR_MESSAGE.INVALID_REQUEST).not.toMatch(/could not be set/i);
            });
        });

        describe('on the wire', () => {
            let restoreChannel: () => void;
            // What reached the frame, and a reply on that message's port.
            let toFrame: { message: any; reply: (data: unknown) => void }[];

            // A browser copies a posted message, or throws DataCloneError.
            const browserCopy = (message: unknown) => {
                const { port1, port2 } = new NodeMessageChannel();
                try {
                    port1.postMessage(message);
                } finally {
                    port1.close();
                    port2.close();
                }
            };

            const readyFrame = async () => {
                const { embed } = await readyApp();
                jest.spyOn(getIFrameEl().contentWindow, 'postMessage').mockImplementation(
                    ((message: any, _origin: string, transfer: any[]) => {
                        browserCopy(message);
                        toFrame.push({ message, reply: (data) => transfer[0].postMessage(data) });
                    }) as any,
                );
                return embed;
            };

            beforeEach(() => {
                toFrame = [];
                processTrigger.mockImplementation(realProcessTrigger);
                const original = window.MessageChannel;
                // The transport's channel: a reply on port2 reaches port1.
                window.MessageChannel = function ChannelStub() {
                    const port1: any = { close: jest.fn() };
                    const port2 = { postMessage: (data: unknown) => port1.onmessage?.({ data }) };
                    return { port1, port2 };
                } as any;
                restoreChannel = () => {
                    window.MessageChannel = original;
                };
            });

            afterEach(() => {
                restoreChannel();
            });

            it('posts { type, data, context: dataApp } and resolves with the reply as given', async () => {
                const embed = await readyFrame();
                const state = appState();

                const call = getControls(embed, {}, ContextType.Liveboard);
                await flush();

                expect(toFrame.map(({ message }) => message)).toEqual([{
                    type: HostEvent.GetDataAppControls,
                    data: { appId },
                    context: ContextType.DataApp,
                }]);

                toFrame[0].reply(state);
                await flush();

                expect(call.value).toBe(state);
            });

            it.each([
                ['an Apps page refusal', { error: { code: 'APP_MISMATCH', message: 'stray', results: [{ id: 'x', status: 'skipped', note: 1 }] } }, 'APP_MISMATCH', [{ id: 'x', status: 'skipped' }]],
                ['the Apps page with no state yet (TC-583)', { error: { code: 'APP_NOT_READY' } }, 'APP_NOT_READY', undefined],
                ['the shell\'s validation reply (TC-573)', { error: { errorType: 'VALIDATION_ERROR', message: 'No handler', code: 'HOST_EVENT_VALIDATION' } }, 'FAILED', undefined],
                ['the shell\'s contract check', { error: 'Invalid payload for GetDataAppControls' }, 'FAILED', undefined],
                ['a handler that threw', { error: 'boom', context: 'dataApp', requiredParams: [] }, 'FAILED', undefined],
                ['an error nested in data', { data: { error: { code: 'SESSION_LOST' } } }, 'SESSION_LOST', undefined],
            ])('rejects on %s', async (_, replyData, code, results) => {
                const embed = await readyFrame();

                const call = getControls(embed);
                await flush();
                toFrame[0].reply(replyData);
                await flush();

                expectControlError(call, code, results);
            });

            it.each([
                ['a function', { f: () => 1 }],
                ['a Symbol', { s: Symbol('depot') }],
                ['a nested Proxy', { nested: new Proxy({}, {}) }],
                ['a Proxy that names the App', new Proxy({ appId }, {})],
            ])('rejects INVALID_REQUEST for a payload with %s; nothing reaches the frame (TC-363)', async (_, data) => {
                const embed = await readyFrame();
                jest.useFakeTimers();
                let result: Promise<unknown>;

                expect(() => {
                    result = embed.trigger(HostEvent.GetDataAppControls, data as any);
                }).not.toThrow();
                const call = watch(result);
                await flush();

                expectControlError(call, 'INVALID_REQUEST');
                expect(toFrame).toEqual([]);
            });

            it('posts a Proxy with no appId as a plain copy', async () => {
                const embed = await readyFrame();

                getControls(embed, new Proxy({}, {}));
                await flush();

                expect(toFrame).toHaveLength(1);
                expect(utilTypes.isProxy(toFrame[0].message.data)).toBe(false);
                expect(toFrame[0].message.data).toEqual({ appId });
                toFrame[0].reply(appState());
            });
        });

        describe('App events', () => {
            it.each([
                ['the host page', () => window],
                ['another frame', () => {
                    const frame = document.createElement('iframe');
                    document.body.appendChild(frame);
                    return frame.contentWindow;
                }],
            ])('ignores App events posted from %s (TC-603)', async (_, sourceOf) => {
                const { embed } = createDataApp({ dataAppId: appId });
                const onReady = jest.fn();
                const onChanged = jest.fn();
                embed.on(EmbedEvent.DataAppReady, onReady);
                embed.on(EmbedEvent.DataAppControlsChanged, onChanged);
                await embed.render();
                await flush();
                const call = getControls(embed);
                const source = sourceOf();
                const changed = { ...appState(), revision: 2, source: 'app', changed: depotControls };

                postMessageToParent(source, { type: EmbedEvent.DataAppReady, data: appState(), status: 'end' });
                postMessageToParent(source, { type: EmbedEvent.DataAppControlsChanged, data: changed, status: 'end' });
                await flush();

                expect(onReady).not.toHaveBeenCalled();
                expect(onChanged).not.toHaveBeenCalled();
                expect(call.settled).toBe(false);
                expect(appCalls()).toEqual([]);

                fromFrame(EmbedEvent.DataAppControlsChanged, changed);

                expect(onChanged).toHaveBeenCalledWith(
                    expect.objectContaining({ type: EmbedEvent.DataAppControlsChanged, data: changed }),
                    expect.anything(),
                );
            });

            it('ignores App events from its own frame\'s window on another origin (TC-603)', async () => {
                const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
                const { embed } = createDataApp({ dataAppId: appId });
                const onReady = jest.fn();
                embed.on(EmbedEvent.DataAppReady, onReady);
                await embed.render();
                await flush();
                const call = getControls(embed);

                window.dispatchEvent(new MessageEvent('message', {
                    data: { type: EmbedEvent.DataAppReady, data: appState(), status: 'end' },
                    source: getIFrameEl().contentWindow,
                    origin: 'https://apps.example.com',
                }));
                await flush();
                const dropped = warn.mock.calls.map(([message]) => message);
                warn.mockRestore();

                expect(dropped).toEqual([expect.stringContaining('unexpected origin')]);
                expect(onReady).not.toHaveBeenCalled();
                expect(call.settled).toBe(false);
                expect(appCalls()).toEqual([]);
            });

            it('ignores an App event type it does not know (TC-540)', async () => {
                const { embed } = createDataApp({ dataAppId: appId });
                const onReady = jest.fn();
                embed.on(EmbedEvent.DataAppReady, onReady);
                await embed.render();
                await flush();
                const call = getControls(embed);

                expect(() => fromFrame('DataAppAddedLater', { appId })).not.toThrow();
                appReady();
                await flush();

                expect(onReady).toHaveBeenCalledTimes(1);
                expect(appCalls()).toEqual([sentAs({ appId })]);
                expect(call.settled).toBe(false);
            });

            it('still raises Init, Load and AuthInit for an App (TC-664)', async () => {
                // AuthInit reads the session; this harness serves none.
                const logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
                const { embed } = createDataApp({ dataAppId: appId });
                const seen: string[] = [];
                [EmbedEvent.Init, EmbedEvent.Load, EmbedEvent.AuthInit, EmbedEvent.DataAppReady]
                    .forEach((event) => embed.on(event, (payload: any) => seen.push(payload.type)));

                await embed.render();
                getIFrameEl().dispatchEvent(new Event('load'));
                fromFrame(EmbedEvent.AuthInit, {});
                appReady();
                await resolveAfter(20);
                logError.mockRestore();

                expect(seen).toEqual([
                    EmbedEvent.Init,
                    EmbedEvent.Load,
                    EmbedEvent.AuthInit,
                    EmbedEvent.DataAppReady,
                ]);
            });

            it('has no tile events in this release (TC-665)', () => {
                ['TileClick', 'TileLoad', 'TileError'].forEach((name) => {
                    expect(Object.keys(EmbedEvent)).not.toContain(name);
                    expect(Object.values(EmbedEvent)).not.toContain(name);
                });
            });
        });

        describe('calls the SDK makes on its own', () => {
            let warn: jest.SpyInstance;

            beforeEach(() => {
                warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
            });

            afterEach(() => {
                warn.mockRestore();
            });

            it.each([
                ['a DataAppEmbed', async () => (await renderedApp()).embed],
                ['an AppEmbed', async () => {
                    const appEmbed = newAppEmbed({});
                    await appEmbed.render();
                    return appEmbed;
                }],
            ])('warns when the Reload of %s on the online event rejects', async (_, create) => {
                const embed: TsEmbed = await create();
                const failure = new Error('The frame went away');
                jest.spyOn(embed, 'trigger').mockRejectedValueOnce(failure);

                window.dispatchEvent(new Event('online'));
                await flush();

                expect(warn).toHaveBeenCalledWith(failure);
            });

            it('does not throw on the online event when trigger returns no promise', async () => {
                const { embed } = await renderedApp();
                jest.spyOn(embed, 'trigger').mockReturnValueOnce(undefined);

                expect(() => window.dispatchEvent(new Event('online'))).not.toThrow();
                await flush();

                expect(warn).not.toHaveBeenCalled();
            });

            it('warns when the frame rejects the Navigate of navigateToDataApp()', async () => {
                const { embed } = await renderedApp();
                const failure = { error: 'No DATA_APP contract for Navigate' };
                processTrigger.mockImplementation((_, type) => (type === HostEvent.Navigate
                    ? Promise.reject(failure)
                    : Promise.resolve(null)));

                await embed.navigateToDataApp('b7c8');
                await flush();

                expect(warn).toHaveBeenCalledWith(failure);
            });

            it('warns when the navigate of a shown pre-render rejects', async () => {
                const embed = newDataApp({ dataAppId: 'app-2' });
                jest.spyOn(embed as any, 'trigger').mockResolvedValue(undefined);
                const failure = new Error('Navigate failed');
                jest.spyOn(embed, 'navigateToDataApp').mockRejectedValue(failure);

                embed.isEmbedContainerLoaded = false;
                (embed as any).beforePrerenderVisible();
                embed.isEmbedContainerLoaded = true;
                (embed as any).executeEmbedContainerReadyCallbacks();
                await resolveAfter(300);

                expect(warn).toHaveBeenCalledWith(failure);
            });
        });

        describe('navigateToDataApp() with controls', () => {
            let warn: jest.SpyInstance;
            const controlsRefusal = {
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.DATA_APP_CONTROLS_NOT_SUPPORTED,
                code: EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
                severity: EmbedErrorSeverity.SEV3,
                option: 'controls',
                error: ERROR_MESSAGE.DATA_APP_CONTROLS_NOT_SUPPORTED,
            };
            const navigated = () => processTrigger.mock.calls
                .filter(([, type]) => type === HostEvent.Navigate)
                .map(([, , , path]) => path);

            beforeEach(() => {
                warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
            });

            afterEach(() => {
                warn.mockRestore();
            });

            it.each([
                ['an array', depotControls],
                ['a map', { depot: { op: 'eq', values: ['Austin'] } }],
            ])('warns SEV3 for controls as %s, and changes nothing', async (_, controls) => {
                const { embed, errors } = await renderedApp();
                const held = getControls(embed);

                await (embed as any).navigateToDataApp('b7c8', { controls });
                await flush();

                expect(errors).toStrictEqual([controlsRefusal]);
                expect(warn).toHaveBeenCalledTimes(1);
                expect(warn).toHaveBeenCalledWith(controlsRefusal);
                expect((embed as any).viewConfig.dataAppId).toBe(appId);
                expect(navigated()).toEqual([]);
                expect(held.settled).toBe(false);
                expect((embed as any).isError).toBe(false);

                appReady();
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId })]);

                await embed.navigateToDataApp('b7c8');

                expect(navigated()).toEqual(['embed/insights/apps/b7c8']);
            });

            it('renders nothing for a navigateToDataApp() with controls before render', async () => {
                const { embed, errors } = createDataApp({ dataAppId: appId });

                await (embed as any).navigateToDataApp('b7c8', { controls: depotControls });

                expect(errors).toStrictEqual([controlsRefusal]);
                expect(getIFrameEl()).toBeNull();
                expect((embed as any).isRendered).toBeFalsy();
            });

            it.each([
                [{ controls: [] }],
                [{ controls: null }],
                [{}],
            ])('navigates with %p', async (options) => {
                const { embed, errors } = await renderedApp();

                await (embed as any).navigateToDataApp('b7c8', options);

                expect(errors).toEqual([]);
                expect(navigated()).toEqual(['embed/insights/apps/b7c8']);
            });
        });
    });

    describe('inherited options an App ignores', () => {
        let warn: jest.SpyInstance;

        const ignored = (option: string) => ({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.DATA_APP_OPTION_IGNORED,
            code: EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED,
            severity: EmbedErrorSeverity.SEV3,
            option,
            error: ERROR_MESSAGE.DATA_APP_OPTION_IGNORED,
        });
        const warnings = () => warn.mock.calls
            .filter(([details]) => details?.code === EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED);

        beforeEach(() => {
            warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
        });

        afterEach(() => {
            warn.mockRestore();
        });

        it.each([
            ['customActions (TC-525)', { customActions: [{ id: 'ca-1', name: 'Open ticket' }] }, ['customActions']],
            ['linkOverride (TC-526)', { linkOverride: true }, ['linkOverride']],
            ['enableLinkOverridesV2', { enableLinkOverridesV2: true }, ['enableLinkOverridesV2']],
            ['hiddenActions: [Save] (TC-527)', { hiddenActions: [Action.Save] }, ['hiddenActions']],
            ['disabledActions (TC-528)', { disabledActions: [Action.Edit] }, ['disabledActions']],
            ['visibleActions (TC-529)', { visibleActions: [Action.Save] }, ['visibleActions']],
            ['hiddenActions: [QueryDetailsButtons] (TC-530)', { hiddenActions: [Action.QueryDetailsButtons] }, []],
            ['hiddenActions: [QueryDetailsButtons, Save] (TC-531)', { hiddenActions: [Action.QueryDetailsButtons, Action.Save] }, ['hiddenActions']],
            ['hiddenActions: [Edit, Share, QueryDetailsButtons] (TC-531)', { hiddenActions: [Action.Edit, Action.Share, Action.QueryDetailsButtons] }, ['hiddenActions']],
            ['an App action in disabledActions (TC-523)', { disabledActions: ['close_ticket'] }, ['disabledActions']],
            ['an App action in hiddenActions (TC-523)', { hiddenActions: ['close_ticket'] }, ['hiddenActions']],
            ['a hiddenActions that is not an array', { hiddenActions: 'save' }, ['hiddenActions']],
            ['QueryDetailsButtons as a bare string', { hiddenActions: Action.QueryDetailsButtons }, []],
            ['empty and false values', { customActions: [], linkOverride: false, disabledActions: [], hiddenActions: [] }, []],
        ])('%s: one SEV3 warning per ignored option, and the App renders', async (_, options, expected: string[]) => {
            const { embed, errors } = await renderDataApp({ dataAppId: appId, ...options });

            expect(errors).toStrictEqual(expected.map(ignored));
            expect(warnings()).toStrictEqual(expected.map((option) => [ignored(option)]));
            expect(getIFrameEl()).not.toBeNull();
            expect((embed as any).isRendered).toBe(true);
        });

        it.each([
            ['hiddenActions', { hiddenActions: [Action.Save] }],
            ['visibleActions', { visibleActions: [Action.Save] }],
        ])('raises every warning in list order, with %s', async (last, actions) => {
            const { errors } = await renderDataApp({
                ...actions,
                disabledActions: [Action.Edit],
                enableLinkOverridesV2: true,
                linkOverride: true,
                customActions: [{ id: 'ca-1', name: 'Open ticket' }],
                dataAppId: appId,
            });

            expect(errors).toStrictEqual(
                ['customActions', 'linkOverride', 'enableLinkOverridesV2', 'disabledActions', last].map(ignored),
            );
            expect(getIFrameEl()).not.toBeNull();
        });
    });

    describe('hideDataAppHeader', () => {
        it.each([
            [true, 'true'],
            [false, 'false'],
        ])('puts hideDataAppHeader=%p in the frame URL', async (value, text) => {
            await renderDataApp({ dataAppId: appId, hideDataAppHeader: value });

            expect(new URL(getIFrameSrc()).searchParams.get('hideDataAppHeader')).toBe(text);
        });

        it('leaves it out of the URL when unset', async () => {
            await renderDataApp({ dataAppId: appId });

            expect(new URL(getIFrameSrc()).searchParams.has('hideDataAppHeader')).toBe(false);
        });

        it('sends it in UpdateEmbedParams on a pre-render show only when set', async () => {
            const set = newDataApp({ dataAppId: appId, hideDataAppHeader: true });
            const unset = newDataApp({ dataAppId: appId });

            const params = await (set as any).getUpdateEmbedParamsObject();
            const unsetParams = await (unset as any).getUpdateEmbedParamsObject();

            expect(params.hideDataAppHeader).toBe(true);
            expect('hideDataAppHeader' in unsetParams).toBe(false);
        });
    });

    describe('input error payloads', () => {
        let logError: jest.SpyInstance;
        let logWarn: jest.SpyInstance;

        beforeEach(() => {
            mockResizeObserver();
            logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            logWarn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
        });

        afterEach(() => {
            logError.mockRestore();
            logWarn.mockRestore();
        });

        const inputError = (code: EmbedErrorCodes, message: string, severity: EmbedErrorSeverity) => ({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message,
            code,
            severity,
            error: message,
        });

        it.each([
            ['a missing App id', {}, (embed: DataAppEmbed) => embed.render(), [
                inputError(EmbedErrorCodes.DATA_APP_ID_MISSING, ERROR_MESSAGE.DATA_APP_ID_MISSING, EmbedErrorSeverity.SEV1),
            ]],
            ['a stopped embed', {}, async (embed: DataAppEmbed) => {
                await embed.render();
                await embed.render();
            }, [
                inputError(EmbedErrorCodes.DATA_APP_ID_MISSING, ERROR_MESSAGE.DATA_APP_ID_MISSING, EmbedErrorSeverity.SEV1),
                inputError(EmbedErrorCodes.DATA_APP_ID_MISSING, ERROR_MESSAGE.DATA_APP_EMBED_STOPPED, EmbedErrorSeverity.SEV1),
            ]],
            ['an empty navigate id', { dataAppId: appId }, (embed: DataAppEmbed) => embed.navigateToDataApp(''), [
                inputError(EmbedErrorCodes.DATA_APP_ID_MISSING, ERROR_MESSAGE.DATA_APP_ID_MISSING, EmbedErrorSeverity.SEV3),
            ]],
            ['a refused option', { dataAppId: appId, runtimeFilters: depotFilter }, (embed: DataAppEmbed) => embed.render(), [
                refusal('runtimeFilters'),
            ]],
        ])('raises %s with its exact keys, and option only where one applies', async (_, config, enter, expected) => {
            const { embed, errors } = createDataApp(config);

            await enter(embed);

            expect(errors).toStrictEqual(expected);
            errors.forEach((error: object) => expect(emptyKeys(error)).toEqual([]));
        });
    });
});
