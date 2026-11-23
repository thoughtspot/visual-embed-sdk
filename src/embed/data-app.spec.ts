import { setImmediate as realSetImmediate } from 'timers';
import { types as utilTypes } from 'util';
import { MessageChannel as NodeMessageChannel } from 'worker_threads';
import {
    DATA_APP_CALL_BUDGET_MS,
    DATA_APP_MIN_UPDATE_BUDGET_MS,
    DATA_APP_OPEN_CONFIRM_TIMEOUT_MS,
    DataAppEmbed,
    DataAppEmbedViewConfig,
} from './data-app';
import { DataAppControlError } from './data-app-control-error';
import { AppEmbed, AppViewConfig } from './app';
import { TsEmbed, UPDATE_EMBED_PARAMS_SETTLE_MS } from './ts-embed';
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
import { describeParams, getHostEventTelemetryProps } from '../utils/hostEventTelemetry';
import { describeRuntimeFilters } from '../utils/runtimeTelemetry';
import { UNSENDABLE_CONTROLS } from '../utils/data-app-controls';
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

// Flushes until the check passes, `tries` times at most.
const until = async (check: () => boolean, tries = 50): Promise<void> => {
    if (check() || tries === 0) return;
    await flush();
    await until(check, tries - 1);
};

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

// The host events that reach the App open in the frame.
const APP_CALL_TYPES = new Set<string>([HostEvent.GetDataAppControls, HostEvent.UpdateDataAppControls]);

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
            const navigate = () => trigger.mock.calls.filter(([type]) => type === HostEvent.Navigate);

            embed.isEmbedContainerLoaded = false;
            (embed as any).beforePrerenderVisible();
            embed.isEmbedContainerLoaded = true;
            (embed as any).executeEmbedContainerReadyCallbacks();
            expect(navigate()).toEqual([]);

            await new Promise((resolve) => {
                setTimeout(resolve, 300);
            });

            expect(trigger.mock.calls.map(([type, data]) => [type, type === HostEvent.Navigate ? data : undefined]))
                .toEqual([
                    [HostEvent.UpdateEmbedParams, undefined],
                    [HostEvent.Navigate, 'embed/insights/apps/app-2'],
                ]);
            expect(trigger).toHaveBeenCalledWith(
                HostEvent.UpdateEmbedParams,
                expect.objectContaining({ dataAppId: 'app-2' }),
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
            // These reach the App only in UpdateEmbedParams.
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

        it('names dataAppControls in the refusal sentence', () => {
            expect(ERROR_MESSAGE.DATA_APP_OPTION_NOT_SUPPORTED).toBe(
                'This option does not apply to DataAppEmbed. '
                + 'To restrict what a viewer can see, use row-level security. '
                + 'To set a starting value the viewer can change, use dataAppControls.',
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

        it('shows a connected pre-render with dataAppControls', async () => {
            const preRenderId = nextPreRenderId();
            const owner = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
            await owner.preRender();
            await waitFor(() => !!getIFrameEl());

            const { embed, errors } = createDataApp({
                dataAppId: appId,
                preRenderId,
                dataAppControls: depotControls,
            });
            await embed.showPreRender();

            expect(errors).toEqual([]);
            expect(baseShowPreRender).toHaveBeenCalled();
            expect((embed as any).isRendered).toBe(true);
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
        let replies: { resolve: (value: unknown) => void; reject: (reason: unknown) => void; type?: string }[];

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
            // As the frame does once loaded: it asks for its init data.
            await (created.embed as any).getAppInitData();
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
                .mockImplementation((_, type) => (APP_CALL_TYPES.has(type)
                    ? new Promise((resolve, reject) => {
                        replies.push({ resolve, reject, type });
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

            it('rejects at once after showPreRender() with no preRenderId', async () => {
                const { embed } = createDataApp({ dataAppId: appId });
                await embed.showPreRender();

                const call = getControls(embed);
                await flush();

                expectControlError(call, 'APP_NOT_READY');
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

            it('does not post a call released in the tick of a HostEvent.Reload', async () => {
                const { embed } = createDataApp({ dataAppId: appId });
                let reloaded = false;
                embed.on(EmbedEvent.DataAppReady, () => {
                    if (reloaded) return;
                    reloaded = true;
                    embed.trigger(HostEvent.Reload);
                });
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

            // Hidden, it heard no DataAppReady: shown, it asks the App page.
            it('takes a reply with its App\'s state as DataAppReady when shown after missing it', async () => {
                const embed = newDataApp({ dataAppId: appId, preRenderId: nextPreRenderId() } as DataAppEmbedViewConfig);
                await embed.showPreRender();
                await flush();
                embed.hidePreRender();
                appReady();
                await flush();
                embed.isEmbedContainerLoaded = true;
                await embed.showPreRender();

                const call = getControls(embed);
                // Asked once the shown config's params apply.
                await waitFor(() => appCalls().length > 0);

                expect(appCalls()).toEqual([sentAs({ appId })]);
                expect(call.settled).toBe(false);

                replies[0].resolve(appState());
                await flush();

                expect(appCalls()).toEqual([sentAs({ appId }), sentAs({ appId })]);
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
                ['SUPERSEDED, a code an older App page sent', { code: 'SUPERSEDED' }],
                ['RATE_LIMITED, a code an older App page sent', { code: 'RATE_LIMITED' }],
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
                const failure = new Error('Navigate failed');
                jest.spyOn(embed as any, 'trigger').mockImplementation((type) => (type === HostEvent.Navigate
                    ? Promise.reject(failure)
                    : Promise.resolve(undefined)));

                embed.isEmbedContainerLoaded = false;
                (embed as any).beforePrerenderVisible();
                embed.isEmbedContainerLoaded = true;
                (embed as any).executeEmbedContainerReadyCallbacks();
                await waitFor(() => warn.mock.calls.length > 0);

                expect(warn).toHaveBeenCalledWith(failure);
            });
        });

        describe('navigateToDataApp() with controls', () => {
            // UpdateEmbedParams (its values) and Navigate (its path), in order.
            const opened = () => processTrigger.mock.calls
                .filter(([, type]) => type === HostEvent.UpdateEmbedParams || type === HostEvent.Navigate)
                .map(([, type, , data]) => [
                    type,
                    type === HostEvent.Navigate ? data : data.dataAppInitialControls,
                ]);

            it.each([
                ['another App', 'b7c8'],
                ['the App open', appId],
            ])('sends the values to %s, then navigates', async (_, target) => {
                const { embed, errors } = await renderedApp();

                await embed.navigateToDataApp(target, { controls: depotControls });

                expect(errors).toEqual([]);
                expect(opened()).toEqual([
                    [HostEvent.UpdateEmbedParams, { appId: target, controls: depotControls }],
                    [HostEvent.Navigate, `embed/insights/apps/${target}`],
                ]);
                expect((embed as any).viewConfig.dataAppId).toBe(target);
            });

            it('renders with the values before render, and keeps them out of the URL', async () => {
                const { embed, errors } = createDataApp({ dataAppId: appId });

                await embed.navigateToDataApp('b7c8', { controls: depotControls });

                expect(errors).toEqual([]);
                expect(getIFrameSrc()).toContain('#/embed/insights/apps/b7c8');
                expect(getIFrameSrc()).not.toMatch(/depot|Austin/);
            });

            it.each([
                [{ controls: [] }],
                [{ controls: null }],
                [{}],
            ])('navigates with %p as with no values', async (options) => {
                const { embed, errors } = await renderedApp();

                await (embed as any).navigateToDataApp('b7c8', options);

                expect(errors).toEqual([]);
                expect(opened()).toEqual([[HostEvent.Navigate, 'embed/insights/apps/b7c8']]);
            });
        });

        describe('host-set values', () => {
            let logError: jest.SpyInstance;
            let logWarn: jest.SpyInstance;

            const otherControls = [{ id: 'depot', value: { op: 'eq', values: ['Dallas'] } }];

            // Posts as a browser does: DataCloneError if it cannot copy.
            const postLikeBrowser = (
                _frame: unknown,
                type: string,
                _host: unknown,
                data: unknown,
                context: unknown,
            ) => {
                try {
                    browserCopy({ type, data, context });
                } catch (error) {
                    return Promise.reject(error);
                }
                return APP_CALL_TYPES.has(type)
                    ? new Promise((resolve, reject) => {
                        replies.push({ resolve, reject, type });
                    })
                    : Promise.resolve(null);
            };

            const updateControls = (embed: TsEmbed, data?: unknown, context?: ContextType) => watch(
                embed.trigger(HostEvent.UpdateDataAppControls, data as any, context),
            );
            // Each update posted to the frame, as [data, context].
            const updateCalls = () => processTrigger.mock.calls
                .filter(([, type]) => type === HostEvent.UpdateDataAppControls)
                .map(([, , , data, context]) => [data, context]);
            const posted = (type: HostEvent) => processTrigger.mock.calls
                .filter(([, sent]) => sent === type)
                .map(([, , , data]) => data);
            const navigated = () => posted(HostEvent.Navigate);
            const sentTypes = () => processTrigger.mock.calls.map(([, type]) => type);
            const notConfirmed = (errors: unknown[]) => errors
                .filter((error: any) => error?.code === EmbedErrorCodes.DATA_APP_OPEN_NOT_CONFIRMED);

            // The App page's reply to an accepted update.
            const updated = (controls: unknown[] = depotControls) => ({
                ...appState(),
                revision: 2,
                controls,
                results: controls.map(({ id }: any) => ({ id, status: 'accepted' })),
            });
            const openRefused = (target = appId) => ({
                errorType: ErrorDetailsTypes.API,
                message: ERROR_MESSAGE.DATA_APP_OPEN_FAILED,
                code: EmbedErrorCodes.DATA_APP_OPEN_FAILED,
                severity: EmbedErrorSeverity.SEV1,
                error: ERROR_MESSAGE.DATA_APP_OPEN_FAILED,
                appId: target,
                reason: 'FAILED',
            });
            const unconfirmed = (target = appId) => ({
                errorType: ErrorDetailsTypes.API,
                message: ERROR_MESSAGE.DATA_APP_OPEN_NOT_CONFIRMED,
                code: EmbedErrorCodes.DATA_APP_OPEN_NOT_CONFIRMED,
                severity: EmbedErrorSeverity.SEV2,
                error: ERROR_MESSAGE.DATA_APP_OPEN_NOT_CONFIRMED,
                appId: target,
            });

            const signIn = async () => {
                fromFrame(EmbedEvent.AuthInit, {});
                await flush();
            };
            const advance = async (ms: number) => {
                jest.advanceTimersByTime(ms);
                await flush();
            };
            // Rendered with values, then signed in on fake timers.
            const opened = async (config: object = { dataAppId: appId, dataAppControls: depotControls }) => {
                const created = await renderedApp(config);
                jest.useFakeTimers();
                await signIn();
                return created;
            };
            // Shown and loaded: params, Navigate and the probe posted.
            const shownPreRender = async (preRenderId: string, values: object = {}) => {
                const created = createDataApp({ dataAppId: appId, preRenderId, ...values });
                await created.embed.showPreRender();
                await flush();
                jest.useFakeTimers();
                fromFrame(EmbedEvent.EmbedListenerReady);
                await flush();
                await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                return created;
            };
            // Shows the frame; it opens once the params settle.
            const showAgain = async (embed: DataAppEmbed) => {
                await embed.showPreRender();
                await flush();
                await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
            };
            // The APP_INIT reply, which the browser must copy.
            const appInitReply = async () => {
                const port = { postMessage: jest.fn((message: unknown) => browserCopy(message)) };
                postMessageToParent(getIFrameEl().contentWindow, { type: EmbedEvent.APP_INIT, data: {} }, port);
                await until(() => port.postMessage.mock.calls.length > 0);
                expect(port.postMessage).toHaveBeenCalledTimes(1);
                return port.postMessage.mock.calls[0][0] as any;
            };
            // A browser's structuredClone: a real copy, or DataCloneError.
            const useBrowserClone = () => {
                (window as any).structuredClone = (value: unknown) => {
                    browserCopy(value);
                    return value;
                };
            };

            beforeEach(() => {
                // AuthInit reads the session; this harness serves none.
                logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
                logWarn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
                processTrigger.mockImplementation(postLikeBrowser as any);
            });

            afterEach(() => {
                delete (window as any).structuredClone;
                logError.mockRestore();
                logWarn.mockRestore();
            });

            describe('load-time values', () => {
                it('sends them in APP_INIT untouched, and never in the URL (TC-250 step 1)', async () => {
                    const controls = [
                        { id: 'depot', value: { op: 'in', values: ['Austin'] } },
                        { id: 'driver', value: { op: 'eq', values: ['D-1042'] } },
                    ];
                    const given = JSON.stringify(controls);
                    const { errors } = await renderedApp({ dataAppId: appId, dataAppControls: controls });

                    const reply = await appInitReply();

                    expect(reply.type).toBe(EmbedEvent.APP_INIT);
                    expect(reply.data.embedParams).toStrictEqual({ dataAppInitialControls: { appId, controls } });
                    expect(JSON.stringify(controls)).toBe(given);
                    const src = decodeURIComponent(getIFrameSrc());
                    ['depot', 'Austin', 'driver', 'D-1042', 'dataAppInitialControls', 'dataAppControls']
                        .forEach((text) => expect(src).not.toContain(text));
                    expect(errors).toEqual([]);
                });

                it('adds them to the embed params APP_INIT already carries', async () => {
                    await renderedApp({
                        dataAppId: appId,
                        dataAppControls: depotControls,
                        hideDataAppHeader: true,
                        additionalFlags: { excludeConfigFromURL: true },
                    });

                    const reply = await appInitReply();

                    expect(reply.data.embedParams).toMatchObject({
                        hideDataAppHeader: true,
                        dataAppInitialControls: { appId, controls: depotControls },
                    });
                    expect(new URL(getIFrameSrc()).searchParams.has('hideDataAppHeader')).toBe(false);
                });

                it.each([
                    ['an empty array (TC-254)', { dataAppControls: [] }],
                    ['null', { dataAppControls: null }],
                    ['undefined', { dataAppControls: undefined }],
                    ['no dataAppControls (TC-253)', {}],
                ])('sends no values for %s, in APP_INIT or UpdateEmbedParams', async (_, values) => {
                    const { embed } = await renderedApp({ dataAppId: appId, ...values });

                    const reply = await appInitReply();
                    const params = await (embed as any).getUpdateEmbedParamsObject();

                    expect(reply.data.embedParams?.dataAppInitialControls).toBeUndefined();
                    ['dataAppInitialControls', 'dataAppControls', 'embedParams']
                        .forEach((key) => expect(key in params).toBe(false));
                });

                it.each([
                    ['a map (TC-291)', { depot: { op: 'eq', values: ['Austin'] } }],
                    ['a string', 'depot'],
                    ['a number', 7],
                ])('sends %s as given, for the App page to refuse', async (_, controls) => {
                    const { embed } = await renderedApp({ dataAppId: appId, dataAppControls: controls });

                    const reply = await appInitReply();
                    const params = await (embed as any).getUpdateEmbedParamsObject();

                    expect(reply.data.embedParams.dataAppInitialControls).toStrictEqual({ appId, controls });
                    expect(params.dataAppInitialControls).toStrictEqual({ appId, controls });
                });

                it('posts them in UpdateEmbedParams once, at the top level, with no nested embedParams', async () => {
                    const { embed } = await renderedApp({
                        dataAppId: appId,
                        dataAppControls: depotControls,
                        additionalFlags: { excludeConfigFromURL: true },
                    });

                    await embed.navigateToDataApp('b7c8', { controls: otherControls });

                    const params = posted(HostEvent.UpdateEmbedParams);
                    expect(params).toHaveLength(1);
                    expect(params[0].dataAppInitialControls).toStrictEqual({ appId: 'b7c8', controls: otherControls });
                    expect(params[0].dataAppId).toBe('b7c8');
                    expect('dataAppControls' in params[0]).toBe(false);
                    expect('embedParams' in params[0]).toBe(false);
                    expect(JSON.stringify(params[0]).match(/Dallas/g)).toHaveLength(1);
                    expect(JSON.stringify(params[0])).not.toContain('Austin');
                });

                it('sends the values of the App open again on Reload, after an update (TC-283, TC-297)', async () => {
                    const north = [{ id: 'depot', value: { op: 'eq', values: ['north'] } }];
                    const { embed } = await readyApp({ dataAppId: appId, dataAppControls: depotControls });
                    await embed.navigateToDataApp('b7c8', { controls: north });
                    appReady('b7c8');
                    await flush();
                    updateControls(embed, { controls: otherControls });
                    await flush();

                    await embed.trigger(HostEvent.Reload);
                    const reply = await appInitReply();

                    expect(reply.data.embedParams.dataAppInitialControls).toStrictEqual({ appId: 'b7c8', controls: north });
                });
            });

            describe('values the browser cannot copy', () => {
                const uncopyable: [string, () => unknown][] = [
                    ['a Proxy', () => new Proxy(depotControls, {})],
                    ['a Proxy inside a value', () => [{ id: 'depot', value: new Proxy({ op: 'eq' }, {}) }]],
                    ['a function inside a value', () => [{ id: 'depot', value: { op: 'eq', format: () => 'Austin' } }]],
                    ['a Symbol inside a value', () => [{ id: 'depot', value: { op: Symbol('eq') } }]],
                ];

                beforeEach(useBrowserClone);

                it.each(uncopyable)('renders with %s as a marker the App page refuses, the rest of APP_INIT intact', async (_, values) => {
                    const { embed, errors } = await renderedApp({ dataAppId: appId, dataAppControls: values() });

                    const reply = await appInitReply();
                    const { embedParams, ...rest } = reply.data;

                    expect(embedParams).toStrictEqual({
                        dataAppInitialControls: { appId, controls: UNSENDABLE_CONTROLS },
                    });
                    expect(Array.isArray(embedParams.dataAppInitialControls.controls)).toBe(false);
                    expect(rest).toEqual(await (embed as any).getDefaultAppInitData());
                    expect(errors).toEqual([]);
                });

                it.each(uncopyable)('sends %s to another App as the marker, so B never opens with no values', async (_, values) => {
                    const { embed, errors } = await readyApp();

                    await embed.navigateToDataApp('b7c8', { controls: values() as any });
                    const call = getControls(embed);
                    appOpenFailed({ appId: 'b7c8', reason: 'CONTROLS_REFUSED' });
                    await flush();

                    expect(posted(HostEvent.UpdateEmbedParams).map((params) => params.dataAppInitialControls))
                        .toEqual([{ appId: 'b7c8', controls: UNSENDABLE_CONTROLS }]);
                    expect(navigated()).toEqual(['embed/insights/apps/b7c8']);
                    expect(errors).toEqual([expect.objectContaining({ type: EmbedEvent.Error })]);
                    expectControlError(call, 'APP_NOT_READY');
                });

                it('sends a Proxy as the marker when a pre-render is shown with it', async () => {
                    const preRenderId = nextPreRenderId();
                    const owner = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                    await owner.preRender();
                    await flush();
                    const { embed, errors } = createDataApp({
                        dataAppId: appId,
                        preRenderId,
                        dataAppControls: new Proxy(depotControls, {}),
                    });
                    embed.isEmbedContainerLoaded = true;

                    await embed.showPreRender();
                    await resolveAfter(UPDATE_EMBED_PARAMS_SETTLE_MS + 100);

                    expect(posted(HostEvent.UpdateEmbedParams).map((params) => params.dataAppInitialControls))
                        .toEqual([{ appId, controls: UNSENDABLE_CONTROLS }]);
                    expect(navigated()).toEqual([`embed/insights/apps/${appId}`]);
                    expect(errors).toEqual([]);
                });
            });

            describe('params that cannot be posted', () => {
                // jsdom has no structuredClone, and the setup's MessageChannel
                // cannot post: the copy check passes and the post fails.
                const proxyValues = { dataAppId: appId, controls: () => new Proxy(depotControls, {}) };
                // A function in the view config fails every post (L9).
                const functionOption = {
                    dataAppId: appId,
                    onLoaded: (): void => undefined,
                    controls: () => depotControls,
                };

                it.each([
                    ['values the copy check missed, to another App', proxyValues, 'b7c8'],
                    ['values the copy check missed, to the App open', proxyValues, appId],
                    ['an option the browser cannot copy, to another App', functionOption, 'b7c8'],
                    ['an option the browser cannot copy, to the App open', functionOption, appId],
                ])('does not open the App when the params with %s cannot be posted', async (_, setup, target) => {
                    const { controls, ...config } = setup;
                    const { embed, errors } = await opened(config);
                    appReady();
                    await flush();

                    const navigating = embed.navigateToDataApp(target, { controls: controls() as any });
                    const call = getControls(embed);
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                    await navigating;
                    const later = getControls(embed);
                    await flush();

                    expect(navigated()).toEqual([]);
                    expect(errors).toStrictEqual([openRefused(target)]);
                    expect(logWarn).toHaveBeenCalledWith(expect.objectContaining({ name: 'DataCloneError' }));
                    expect(logWarn).toHaveBeenCalledWith(openRefused(target));
                    expectControlError(call, 'APP_NOT_READY');
                    expectControlError(later, 'APP_NOT_READY');
                    expect(appCalls()).toEqual([]);
                    expect((embed as any).isError).toBe(false);

                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('opens the App with values that can be posted after a refused open', async () => {
                    const { embed, errors } = await readyApp();
                    await embed.navigateToDataApp('b7c8', { controls: new Proxy(depotControls, {}) });

                    await embed.navigateToDataApp('b7c8', { controls: otherControls });
                    const call = getControls(embed);
                    await flush();

                    expect(errors).toStrictEqual([openRefused('b7c8')]);
                    expect(navigated()).toEqual(['embed/insights/apps/b7c8']);
                    expect(call.settled).toBe(false);

                    appReady('b7c8');
                    await flush();

                    expect(appCalls()).toEqual([sentAs({ appId: 'b7c8' })]);
                });

                it.each([
                    ['values the copy check missed', { dataAppControls: new Proxy(depotControls, {}) }],
                    ['an option the browser cannot copy', { onLoaded: (): void => undefined }],
                ])('does not open the App of a pre-render shown with %s', async (_, extra) => {
                    const preRenderId = nextPreRenderId();
                    const owner = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                    await owner.preRender();
                    await flush();
                    const { embed, errors } = createDataApp({ dataAppId: appId, preRenderId, ...extra });
                    embed.isEmbedContainerLoaded = true;
                    jest.useFakeTimers();

                    await embed.showPreRender();
                    const call = getControls(embed);
                    await signIn();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);

                    expect(navigated()).toEqual([]);
                    expect(errors).toStrictEqual([openRefused()]);
                    expectControlError(call, 'APP_NOT_READY');
                    // No probe either.
                    expect(appCalls()).toEqual([]);

                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it.each([
                    ['a navigate to another App', 'b7c8'],
                    ['a navigate to the App open', appId],
                ])('does not open the App when its params cannot be built, on %s, and stays usable (D15)', async (_, target) => {
                    const { embed, errors } = await readyApp();
                    const failure = new Error('The auth token could not be fetched');
                    jest.spyOn(embed as any, 'getUpdateEmbedParamsObject').mockRejectedValueOnce(failure);

                    await embed.navigateToDataApp(target, { controls: depotControls });

                    expect(sentTypes().filter((type) => type !== HostEvent.GetDataAppControls)).toEqual([]);
                    expect(errors).toStrictEqual([openRefused(target)]);
                    expect(logWarn).toHaveBeenCalledWith(failure);
                    expect(logError).not.toHaveBeenCalledWith(ERROR_MESSAGE.UPDATE_PARAMS_FAILED, failure);
                    expect((embed as any).isError).toBe(false);

                    await embed.navigateToDataApp(target, { controls: otherControls });

                    expect(navigated()).toEqual([`embed/insights/apps/${target}`]);
                });

                it('does not open the App of a pre-render whose params cannot be built (D15)', async () => {
                    const preRenderId = nextPreRenderId();
                    const owner = newDataApp({ dataAppId: appId, preRenderId } as DataAppEmbedViewConfig);
                    await owner.preRender();
                    await flush();
                    const { embed, errors } = createDataApp({ dataAppId: appId, preRenderId });
                    jest.spyOn(embed as any, 'getUpdateEmbedParamsObject').mockRejectedValue(new Error('No token'));
                    embed.isEmbedContainerLoaded = true;

                    await embed.showPreRender();
                    await resolveAfter(UPDATE_EMBED_PARAMS_SETTLE_MS + 100);

                    expect(navigated()).toEqual([]);
                    expect(errors).toStrictEqual([openRefused()]);
                });
            });

            describe('the open watchdog', () => {
                it('waits 30 s for DataAppReady; a held update needs 2 s; params settle in 200 ms', () => {
                    expect(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS).toBe(30000);
                    expect(DATA_APP_MIN_UPDATE_BUDGET_MS).toBe(2000);
                    expect(UPDATE_EMBED_PARAMS_SETTLE_MS).toBe(200);
                });

                it('raises DATA_APP_OPEN_NOT_CONFIRMED once, 30 s after AuthInit, with its exact payload (TC-541, TC-542)', async () => {
                    const { errors } = await opened();

                    await advance(29999);

                    expect(errors).toEqual([]);

                    await advance(1);

                    expect(errors).toStrictEqual([unconfirmed()]);
                    expect(emptyKeys(errors[0] as object)).toEqual([]);
                    expect(logWarn).toHaveBeenCalledWith(unconfirmed());

                    await advance(60000);

                    expect(errors).toHaveLength(1);
                });

                it('ends a held read APP_NOT_READY as it warns, 30 s on, when nothing answers (TC-546)', async () => {
                    const { embed, errors } = await opened();
                    const call = getControls(embed);

                    await advance(29999);

                    expect(call.settled).toBe(false);
                    expect(errors).toEqual([]);

                    await advance(1);

                    expectControlError(call, 'APP_NOT_READY');
                    expect(errors).toStrictEqual([unconfirmed()]);
                });

                it.each([
                    ['no dataAppControls', {}],
                    ['an empty array', { dataAppControls: [] }],
                    ['null', { dataAppControls: null }],
                ])('is not armed for an open with %s (TC-555)', async (_, values) => {
                    const { errors } = await opened({ dataAppId: appId, ...values });

                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('starts its clock at AuthInit, not at EmbedListenerReady (TC-556)', async () => {
                    const { errors } = await renderedApp({ dataAppId: appId, dataAppControls: depotControls });
                    jest.useFakeTimers();
                    fromFrame(EmbedEvent.EmbedListenerReady);
                    await flush();

                    await advance(45000);
                    await signIn();
                    await advance(29999);

                    expect(notConfirmed(errors)).toEqual([]);

                    await advance(1);

                    expect(errors).toStrictEqual([unconfirmed()]);
                });

                it('is quiet when the viewer signs in at 45 s and the App is ready at 50 s (TC-556)', async () => {
                    const { errors } = await renderedApp({ dataAppId: appId, dataAppControls: depotControls });
                    jest.useFakeTimers();
                    fromFrame(EmbedEvent.EmbedListenerReady);
                    await flush();

                    await advance(45000);
                    await signIn();
                    await advance(5000);
                    appReady();
                    await flush();
                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('lets a DataAppReady after the warning stand, and retries, hides or fails nothing (TC-557)', async () => {
                    const { embed, errors } = await opened();
                    const onReady = jest.fn();
                    embed.on(EmbedEvent.DataAppReady, onReady);

                    await advance(35000);
                    const call = getControls(embed);
                    await advance(5000);

                    expect(errors).toStrictEqual([unconfirmed()]);
                    expect(call.settled).toBe(false);

                    appReady();
                    await flush();

                    expect(onReady).toHaveBeenCalledTimes(1);
                    expect(appCalls()).toEqual([sentAs({ appId })]);
                    expect(sentTypes()).not.toContain(HostEvent.Reload);
                    expect(sentTypes()).not.toContain(HostEvent.Navigate);

                    await advance(60000);

                    expect(errors).toStrictEqual([unconfirmed()]);
                });

                it.each([
                    ['DataAppReady for the App (TC-558)', () => appReady()],
                    ['DATA_APP_OPEN_FAILED for the App (TC-559)', () => appOpenFailed()],
                    ['DATA_APP_OPEN_FAILED naming no App', () => appOpenFailed({})],
                    ['DATA_APP_SESSION_LOST naming no App', () => fromFrame(EmbedEvent.Error, {
                        code: EmbedErrorCodes.DATA_APP_SESSION_LOST,
                    })],
                    ['another DATA_APP_ code for the App', () => fromFrame(EmbedEvent.Error, {
                        code: 'DATA_APP_SOMETHING_NEW',
                        appId,
                    })],
                    ['destroy() (TC-560)', (embed: DataAppEmbed) => embed.destroy()],
                ])('is disarmed by %s', async (_, settle) => {
                    const { embed, errors } = await opened();
                    await advance(5000);

                    settle(embed);
                    await flush();
                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it.each([
                    ['DataAppReady for another App', () => appReady('b7c8')],
                    ['DATA_APP_OPEN_FAILED for another App', () => appOpenFailed({ appId: 'b7c8' })],
                    ['a frame Error with a code that is not DATA_APP_', () => fromFrame(EmbedEvent.Error, {
                        code: 'UPDATE_PARAMS_FAILED',
                        appId,
                    })],
                    ['an Error the SDK raised itself', (embed: DataAppEmbed) => (embed as any).executeCallbacks(
                        EmbedEvent.Error,
                        { code: EmbedErrorCodes.DATA_APP_OPEN_FAILED, appId },
                    )],
                ])('still fires at 30 s after %s', async (_, other) => {
                    const { embed, errors } = await opened();
                    await advance(5000);

                    other(embed);
                    await flush();
                    await advance(24999);

                    expect(notConfirmed(errors)).toEqual([]);

                    await advance(1);

                    expect(notConfirmed(errors)).toStrictEqual([unconfirmed()]);
                });

                it('is disarmed when the pre-render is hidden (TC-560)', async () => {
                    const { embed, errors } = await shownPreRender(nextPreRenderId(), { dataAppControls: depotControls });
                    await signIn();
                    await advance(5000);

                    embed.hidePreRender();
                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('starts at the navigate call once signed in, not at Navigate (TC-561)', async () => {
                    const { embed, errors } = await opened({ dataAppId: appId });
                    appReady();
                    await flush();
                    await advance(100000);

                    const navigating = embed.navigateToDataApp('b7c8', { controls: depotControls });
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                    await navigating;

                    expect(navigated()).toEqual(['embed/insights/apps/b7c8']);

                    await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS - UPDATE_EMBED_PARAMS_SETTLE_MS - 1);

                    expect(notConfirmed(errors)).toEqual([]);

                    await advance(1);

                    expect(notConfirmed(errors)).toStrictEqual([unconfirmed('b7c8')]);
                });

                it('waits for the AuthInit after a Reload, then 30 s (TC-562)', async () => {
                    const { embed, errors } = await opened();
                    appReady();
                    await flush();
                    await advance(100000);

                    await embed.trigger(HostEvent.Reload);
                    await advance(3000);
                    await signIn();
                    await advance(29999);

                    expect(notConfirmed(errors)).toEqual([]);

                    await advance(1);

                    expect(notConfirmed(errors)).toStrictEqual([unconfirmed()]);
                });

                it('runs no clock after a Reload until the frame signs in again (TC-562)', async () => {
                    const { embed, errors } = await opened();
                    appReady();
                    await flush();

                    await embed.trigger(HostEvent.Reload);
                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('lets a later DATA_APP_OPEN_FAILED stand: calls reject at once (TC-563)', async () => {
                    const { embed, errors } = await opened();
                    await advance(30000);

                    appOpenFailed();
                    await flush();
                    const call = getControls(embed);
                    await flush();
                    await advance(60000);

                    expectControlError(call, 'APP_NOT_READY');
                    expect(notConfirmed(errors)).toStrictEqual([unconfirmed()]);
                    expect(errors).toHaveLength(2);
                });

                it.each([
                    ['an App opened with no values', { dataAppId: appId }],
                    ['an App opened with values', { dataAppId: appId, dataAppControls: depotControls }],
                ])('is not armed by a navigate without controls from %s (TC-566)', async (_, config) => {
                    const { embed, errors } = await opened(config);
                    appReady();
                    await flush();

                    const navigating = embed.navigateToDataApp('b7c8');
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                    await navigating;
                    await advance(60000);

                    expect(navigated()).toEqual(['embed/insights/apps/b7c8']);
                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('is not armed, and posts no params, for the same values in another key order', async () => {
                    const { embed, errors } = await opened();
                    appReady();
                    await flush();

                    await embed.navigateToDataApp(appId, {
                        controls: [{ value: { values: ['Austin'], op: 'eq' }, id: 'depot' }],
                    });
                    await advance(60000);

                    expect(posted(HostEvent.UpdateEmbedParams)).toEqual([]);
                    expect(navigated()).toEqual([`embed/insights/apps/${appId}`]);
                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('is not armed again by a second render() of the same frame', async () => {
                    const { embed, errors } = await opened();
                    appReady();
                    await flush();

                    await embed.render();
                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('leaves the embed usable after it fires: a navigate still opens', async () => {
                    const { embed, errors } = await opened();
                    await advance(30000);

                    const navigating = embed.navigateToDataApp('b7c8');
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                    await navigating;

                    expect(errors).toStrictEqual([unconfirmed()]);
                    expect(navigated()).toEqual(['embed/insights/apps/b7c8']);
                    expect((embed as any).isError).toBe(false);
                });

                it('leaves a pre-render usable after it fires: it hides, shows and opens again', async () => {
                    const { embed, errors } = await shownPreRender(nextPreRenderId(), { dataAppControls: depotControls });
                    await signIn();
                    await advance(30000);

                    expect(errors).toStrictEqual([unconfirmed()]);

                    embed.hidePreRender();
                    const wrapper = document.getElementById(embed.getPreRenderIds().wrapper);
                    expect(wrapper.style.opacity).toBe('0');
                    await showAgain(embed);

                    expect(wrapper.style.opacity).not.toBe('0');
                    expect(navigated()).toEqual([`embed/insights/apps/${appId}`, `embed/insights/apps/${appId}`]);
                });

                it.each([
                    ['navigateToDataApp() with values', (embed: DataAppEmbed) => embed.navigateToDataApp('b7c8', {
                        controls: otherControls,
                    })],
                    ['HostEvent.Reload, then AuthInit', async (embed: DataAppEmbed) => {
                        await embed.trigger(HostEvent.Reload);
                        // As if a late AuthInit still reached its listener.
                        (embed as any).executeCallbacks(EmbedEvent.AuthInit, {});
                    }],
                ])('never fires after destroy(), on %s (CR-10)', async (_, act) => {
                    const { embed, errors } = await opened({
                        dataAppId: appId,
                        dataAppControls: depotControls,
                        preRenderId: nextPreRenderId(),
                    });
                    embed.destroy();

                    const acting = act(embed);
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                    await acting;
                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                it('keeps rejecting calls at once after destroy(), even after a Reload (R2-7)', async () => {
                    const { embed } = await opened({ dataAppId: appId });
                    appReady();
                    await flush();
                    embed.destroy();

                    await embed.trigger(HostEvent.Reload);
                    const call = getControls(embed);
                    await flush();

                    expectControlError(call, 'APP_NOT_READY');
                });

                it('posts no Navigate when destroy() comes during a show\'s settle (R2-7)', async () => {
                    const { embed } = await shownPreRender(nextPreRenderId(), { dataAppControls: depotControls });
                    embed.hidePreRender();
                    const before = sentTypes().length;

                    await embed.showPreRender();
                    await flush();
                    embed.destroy();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);

                    expect(sentTypes().slice(before)).not.toContain(HostEvent.Navigate);
                    expect(sentTypes().slice(before)).not.toContain(HostEvent.GetDataAppControls);
                });

                it('never fires after destroy(), on showPreRender() (CR-10)', async () => {
                    const { embed, errors } = await opened({
                        dataAppId: appId,
                        dataAppControls: depotControls,
                        preRenderId: nextPreRenderId(),
                    });
                    embed.destroy();

                    await embed.showPreRender();
                    await advance(60000);

                    expect(notConfirmed(errors)).toEqual([]);
                });

                describe('a pre-render', () => {
                    it('has no watchdog while created hidden; shown, it waits 30 s for a confirmation (TC-541, TC-546)', async () => {
                        const preRenderId = nextPreRenderId();
                        const owner = newDataApp({
                            dataAppId: appId,
                            preRenderId,
                            dataAppControls: depotControls,
                        } as DataAppEmbedViewConfig);
                        await owner.preRender();
                        await flush();
                        jest.useFakeTimers();
                        const errors: unknown[] = [];
                        owner.on(EmbedEvent.Error, (error) => errors.push(error));
                        await advance(60000);

                        expect(errors).toEqual([]);

                        await showAgain(owner);
                        await signIn();
                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS - 1);

                        expect(notConfirmed(errors)).toEqual([]);

                        await advance(1);

                        expect(notConfirmed(errors)).toStrictEqual([unconfirmed()]);
                    });

                    it('starts at the show when the frame\'s last owner was another embed type', async () => {
                        const preRenderId = nextPreRenderId();
                        const appEmbed = newAppEmbed({ preRenderId } as AppViewConfig);
                        await appEmbed.preRender();
                        await flush();
                        const { embed, errors } = createDataApp({
                            dataAppId: appId,
                            preRenderId,
                            dataAppControls: depotControls,
                        });
                        jest.useFakeTimers();

                        await embed.showPreRender();
                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS - 1);

                        expect(notConfirmed(errors)).toEqual([]);

                        await advance(1);

                        expect(notConfirmed(errors)).toStrictEqual([unconfirmed()]);
                    });

                    it('neither arms, holds nor probes on a show with values it confirmed, here or in another instance (TC-287)', async () => {
                        const preRenderId = nextPreRenderId();
                        const { embed, errors } = await shownPreRender(preRenderId, { dataAppControls: depotControls });
                        await signIn();
                        appReady();
                        await flush();
                        const before = appCalls().length;
                        embed.hidePreRender();

                        await showAgain(embed);
                        getControls(embed);
                        await flush();

                        expect(appCalls().slice(before)).toEqual([sentAs({ appId })]);

                        embed.hidePreRender();
                        const other = createDataApp({
                            dataAppId: appId,
                            preRenderId,
                            dataAppControls: [{ id: 'depot', value: { values: ['Austin'], op: 'eq' } }],
                        });
                        await showAgain(other.embed);
                        getControls(other.embed);
                        await flush();
                        await advance(60000);

                        expect(appCalls().slice(before)).toEqual([sentAs({ appId }), sentAs({ appId })]);
                        expect(notConfirmed([...errors, ...other.errors])).toEqual([]);
                    });

                    it('arms for a show with values not yet confirmed, and fires at 30 s (TC-566)', async () => {
                        const preRenderId = nextPreRenderId();
                        const { embed } = await shownPreRender(preRenderId);
                        await signIn();
                        appReady();
                        await flush();
                        embed.hidePreRender();
                        const other = createDataApp({ dataAppId: appId, preRenderId, dataAppControls: depotControls });
                        const before = appCalls().length;

                        await other.embed.showPreRender();
                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS - 1);

                        expect(notConfirmed(other.errors)).toEqual([]);
                        // New values: no probe (D8).
                        expect(appCalls().slice(before)).toEqual([]);

                        await advance(1);

                        expect(notConfirmed(other.errors)).toStrictEqual([unconfirmed()]);
                    });

                    it('arms nothing for a navigate while hidden; shown, the probe confirms the values (CR-2)', async () => {
                        const { embed, errors } = await shownPreRender(nextPreRenderId());
                        await signIn();
                        appReady();
                        await flush();
                        embed.hidePreRender();

                        const navigating = embed.navigateToDataApp(appId, { controls: depotControls });
                        await flush();
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await navigating;
                        // The App confirms, unheard.
                        appReady();
                        await advance(60000);

                        expect(notConfirmed(errors)).toEqual([]);

                        const before = appCalls().length;
                        await showAgain(embed);

                        // Values given, unconfirmed: a probe.
                        expect(appCalls().slice(before)).toEqual([sentAs({ appId })]);

                        replies[replies.length - 1].resolve({ ...appState(), revision: 2 });
                        await flush();
                        await advance(60000);

                        expect(notConfirmed(errors)).toEqual([]);
                    });

                    it('fires 30 s after the show when the probe of values the frame has goes unanswered (CR-2)', async () => {
                        const { embed, errors } = await shownPreRender(nextPreRenderId());
                        await signIn();
                        appReady();
                        await flush();
                        embed.hidePreRender();
                        const navigating = embed.navigateToDataApp(appId, { controls: depotControls });
                        await flush();
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await navigating;

                        await embed.showPreRender();
                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS - 1);

                        expect(notConfirmed(errors)).toEqual([]);

                        await advance(1);

                        expect(notConfirmed(errors)).toStrictEqual([unconfirmed()]);
                    });

                    it.each([
                        ['answered with the App\'s state: no warning', true, 0],
                        ['unanswered: it warns at 30 s', false, 1],
                    ])('confirms values given while every instance was hidden only through the probe, %s (L1)', async (_, answer, warnings) => {
                        const preRenderId = nextPreRenderId();
                        const first = await shownPreRender(preRenderId);
                        await signIn();
                        appReady();
                        await flush();
                        first.embed.hidePreRender();
                        const second = createDataApp({ dataAppId: appId, preRenderId, dataAppControls: depotControls });
                        await showAgain(second.embed);
                        second.embed.hidePreRender();
                        // Confirmed while every instance is hidden.
                        appReady();
                        const third = createDataApp({ dataAppId: appId, preRenderId, dataAppControls: depotControls });
                        const before = appCalls().length;

                        await showAgain(third.embed);

                        expect(appCalls().slice(before)).toEqual([sentAs({ appId })]);

                        if (answer) replies[replies.length - 1].resolve({ ...appState(), revision: 2 });
                        await flush();
                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS);

                        expect(notConfirmed(third.errors)).toHaveLength(warnings);
                    });

                    it('confirms nothing with a probe reply that comes after the values changed', async () => {
                        const preRenderId = nextPreRenderId();
                        const { embed, errors } = await shownPreRender(preRenderId);
                        await signIn();
                        appReady();
                        await flush();
                        embed.hidePreRender();
                        const navigating = embed.navigateToDataApp(appId, { controls: depotControls });
                        await flush();
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await navigating;
                        await showAgain(embed);
                        const probe = replies[replies.length - 1];

                        const renavigating = embed.navigateToDataApp(appId, { controls: otherControls });
                        await flush();
                        probe.resolve({ ...appState(), revision: 2 });
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await renavigating;
                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS - UPDATE_EMBED_PARAMS_SETTLE_MS - 1);

                        expect(notConfirmed(errors)).toEqual([]);

                        await advance(1);

                        expect(notConfirmed(errors)).toStrictEqual([unconfirmed()]);
                    });

                    it('lets a failed open stand on a show with the same values: no warning, calls reject (CR-2)', async () => {
                        const { embed, errors } = await shownPreRender(nextPreRenderId(), {
                            dataAppControls: depotControls,
                        });
                        await signIn();
                        appOpenFailed({ appId, reason: 'CONTROLS_REFUSED' });
                        await flush();
                        embed.hidePreRender();
                        const before = appCalls().length;

                        await showAgain(embed);
                        const call = getControls(embed);
                        await flush();
                        await advance(60000);

                        expect(notConfirmed(errors)).toEqual([]);
                        expectControlError(call, 'APP_NOT_READY');
                        expect(appCalls().slice(before)).toEqual([]);
                    });

                    it('retries a failed open on a show with new values: calls wait, and it arms (CR-2)', async () => {
                        const preRenderId = nextPreRenderId();
                        const { embed } = await shownPreRender(preRenderId, { dataAppControls: depotControls });
                        await signIn();
                        appOpenFailed({ appId, reason: 'CONTROLS_REFUSED' });
                        await flush();
                        embed.hidePreRender();
                        const other = createDataApp({ dataAppId: appId, preRenderId, dataAppControls: otherControls });

                        await showAgain(other.embed);
                        const call = getControls(other.embed);
                        await flush();

                        expect(call.settled).toBe(false);
                        expect(posted(HostEvent.UpdateEmbedParams).pop().dataAppInitialControls)
                            .toStrictEqual({ appId, controls: otherControls });

                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS);

                        expect(notConfirmed(other.errors)).toStrictEqual([unconfirmed()]);
                    });

                    it.each([
                        ['the reloaded App confirms: no warning', true, 0],
                        ['only the probe answers: it warns 30 s after AuthInit', false, 1],
                    ])('defers a Reload made while hidden to the next show; %s (R2-2)', async (_, confirm, warnings) => {
                        const { embed, errors } = await shownPreRender(nextPreRenderId(), {
                            dataAppControls: depotControls,
                        });
                        await signIn();
                        appReady();
                        await flush();
                        embed.hidePreRender();
                        const reloads = () => sentTypes().filter((type) => type === HostEvent.Reload);

                        await embed.trigger(HostEvent.Reload);
                        await advance(60000);

                        expect(reloads()).toEqual([]);
                        expect(notConfirmed(errors)).toEqual([]);

                        const before = appCalls().length;
                        await showAgain(embed);

                        expect(reloads()).toEqual([HostEvent.Reload]);
                        // The probe only releases calls: the reloaded frame
                        // has not confirmed the values yet.
                        expect(appCalls().slice(before)).toEqual([sentAs({ appId })]);
                        replies[replies.length - 1].resolve({ ...appState(), session: 'S2' });
                        await flush();
                        // Listening again, it answers the frame's APP_INIT.
                        expect((await (embed as any).getAppInitData()).embedParams.dataAppInitialControls)
                            .toStrictEqual({ appId, controls: depotControls });
                        await signIn();
                        if (confirm) {
                            appReady();
                            await flush();
                        }
                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS);

                        expect(notConfirmed(errors)).toHaveLength(warnings);
                    });

                    it('forgets on a Reload the values the frame had: the same values are sent again (R2-2)', async () => {
                        const { embed } = await opened();
                        appReady();
                        await flush();

                        await embed.trigger(HostEvent.Reload);
                        const navigating = embed.navigateToDataApp(appId, { controls: depotControls });
                        await flush();
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await navigating;

                        expect(posted(HostEvent.UpdateEmbedParams).map((params) => params.dataAppInitialControls))
                            .toEqual([{ appId, controls: depotControls }]);
                    });

                    it('lets a probe reply release calls but not confirm values the show sent (D8)', async () => {
                        const preRenderId = nextPreRenderId();
                        const { embed } = await shownPreRender(preRenderId);
                        await signIn();
                        embed.hidePreRender();
                        const other = createDataApp({ dataAppId: appId, preRenderId, dataAppControls: depotControls });
                        const before = appCalls().length;

                        await showAgain(other.embed);
                        const call = updateControls(other.embed, { controls: otherControls });
                        await flush();

                        expect(appCalls().slice(before)).toEqual([sentAs({ appId })]);

                        replies[replies.length - 1].resolve(appState());
                        await flush();

                        expect(updateCalls()).toHaveLength(1);
                        expect(call.settled).toBe(false);

                        await advance(DATA_APP_OPEN_CONFIRM_TIMEOUT_MS);

                        expect(notConfirmed(other.errors)).toStrictEqual([unconfirmed()]);
                    });

                    it('retries a failed open on a show with no values after values, arming nothing', async () => {
                        const preRenderId = nextPreRenderId();
                        const { embed } = await shownPreRender(preRenderId, { dataAppControls: depotControls });
                        await signIn();
                        appOpenFailed({ appId, reason: 'CONTROLS_REFUSED' });
                        await flush();
                        embed.hidePreRender();
                        const other = createDataApp({ dataAppId: appId, preRenderId });

                        await showAgain(other.embed);
                        const call = getControls(other.embed);
                        await flush();

                        expect(call.settled).toBe(false);
                        expect('dataAppInitialControls' in posted(HostEvent.UpdateEmbedParams).pop()).toBe(false);

                        await advance(60000);

                        expect(notConfirmed(other.errors)).toEqual([]);
                        // Held until its budget ran out, not refused at once.
                        expectControlError(call, 'APP_NOT_READY');
                    });
                });
            });

            describe('the readiness probe', () => {
                // Shown, hidden while its App became ready, then shown again.
                const missedReady = async () => {
                    const created = await shownPreRender(nextPreRenderId());
                    created.embed.hidePreRender();
                    appReady();
                    await flush();
                    return created;
                };

                it('is posted once per show, after the params apply and Navigate, and never reported', async () => {
                    const { embed } = await missedReady();
                    const upload = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
                    const before = processTrigger.mock.calls.length;

                    await embed.showPreRender();
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS - 1);
                    const early = sentTypes().slice(before);
                    await advance(1);
                    const reported = upload.mock.calls.map(([id]) => id);
                    upload.mockRestore();

                    expect(early).toEqual([HostEvent.UpdateEmbedParams]);
                    expect(sentTypes().slice(before)).toEqual([
                        HostEvent.UpdateEmbedParams,
                        HostEvent.Navigate,
                        HostEvent.GetDataAppControls,
                    ]);
                    expect(appCalls().pop()).toEqual(sentAs({ appId }));
                    expect(reported).not.toContain(
                        `${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.GetDataAppControls}`,
                    );
                });

                it('releases held calls on a reply with its App\'s state, and calls no host handler', async () => {
                    const { embed, errors } = await missedReady();
                    const onReady = jest.fn();
                    embed.on(EmbedEvent.DataAppReady, onReady);
                    await showAgain(embed);
                    const call = updateControls(embed, { controls: depotControls });
                    await flush();

                    expect(updateCalls()).toEqual([]);

                    replies[replies.length - 1].resolve(appState());
                    await flush();

                    expect(updateCalls()).toEqual([[
                        { controls: depotControls, appId, budgetMs: DATA_APP_CALL_BUDGET_MS },
                        ContextType.DataApp,
                    ]]);
                    expect(call.settled).toBe(false);
                    expect(onReady).not.toHaveBeenCalled();
                    expect(errors).toEqual([]);
                });

                it.each([
                    ['APP_NOT_READY', (reply: any) => reply.reject({ code: 'APP_NOT_READY' })],
                    ['the transport\'s TIMEOUT', (reply: any) => reply.resolve(new Error(ERROR_MESSAGE.TRIGGER_TIMED_OUT))],
                    ['a rejection', (reply: any) => reply.reject(new Error('The frame went away'))],
                    ['another App\'s state', (reply: any) => reply.resolve(appState('b7c8'))],
                    ['a state naming no App', (reply: any) => reply.resolve({ ...appState(), appId: undefined })],
                    ['nothing', (reply: any) => reply.resolve(undefined)],
                ])('keeps calls held on a reply with %s', async (_, answer) => {
                    const { embed, errors } = await missedReady();
                    await showAgain(embed);
                    const call = getControls(embed);
                    await flush();

                    answer(replies[replies.length - 1]);
                    await flush();

                    expect(call.settled).toBe(false);
                    expect(appCalls().filter(([, data]) => data !== undefined)).toHaveLength(appCalls().length);
                    const probes = appCalls().length;

                    appReady();
                    await flush();

                    expect(appCalls()).toHaveLength(probes + 1);
                    expect(errors).toEqual([]);
                });

                it.each([
                    ['destroy()', (embed: DataAppEmbed) => embed.destroy(), 'APP_NOT_READY'],
                    ['HostEvent.Reload', (embed: DataAppEmbed) => embed.trigger(HostEvent.Reload), undefined],
                    ['a navigate to another App', (embed: DataAppEmbed) => embed.navigateToDataApp('b7c8'), undefined],
                ])('changes nothing with a reply that comes after %s', async (_, act, code) => {
                    const { embed } = await missedReady();
                    await showAgain(embed);
                    const probe = replies[replies.length - 1];
                    const probes = appCalls().length;

                    await act(embed);
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                    const call = getControls(embed);
                    probe.resolve(appState());
                    await flush();

                    expect(appCalls()).toHaveLength(probes);
                    if (code) expectControlError(call, code);
                    else expect(call.settled).toBe(false);
                });

                it('is not sent after a failed open that stands', async () => {
                    const { embed } = await shownPreRender(nextPreRenderId());
                    appOpenFailed();
                    await flush();
                    embed.hidePreRender();
                    const before = appCalls().length;

                    await showAgain(embed);

                    expect(appCalls().slice(before)).toEqual([]);
                });
            });

            describe('UpdateDataAppControls', () => {
                it.each([
                    [undefined],
                    [ContextType.Liveboard],
                    [ContextType.Search],
                    [ContextType.DataApp],
                ])('holds an update until DataAppReady, then posts it with appId and budgetMs, in the dataApp context, given %p (TC-289)', async (context) => {
                    const { embed } = await renderedApp();
                    jest.useFakeTimers();
                    const call = updateControls(embed, { controls: depotControls }, context);
                    await flush();

                    expect(updateCalls()).toEqual([]);

                    appReady();
                    await flush();

                    expect(updateCalls()).toEqual([[
                        { controls: depotControls, appId, budgetMs: DATA_APP_CALL_BUDGET_MS },
                        ContextType.DataApp,
                    ]]);

                    const reply = updated();
                    replies[0].resolve(reply);
                    await flush();

                    expect(call.value).toBe(reply);
                });

                it('holds an update made in the tick of render() until DataAppReady (TC-289)', async () => {
                    const { embed } = createDataApp({ dataAppId: appId });
                    const rendering = embed.render();
                    const call = updateControls(embed, { controls: depotControls });
                    await rendering;
                    await flush();

                    expect(updateCalls()).toEqual([]);

                    appReady();
                    await flush();
                    replies[0].resolve(updated());
                    await flush();

                    expect(updateCalls()).toHaveLength(1);
                    expect(call.value).toEqual(updated());
                });

                it('posts an update at once with the whole budget when the App is ready', async () => {
                    const { embed } = await readyApp();
                    jest.useFakeTimers();

                    updateControls(embed, { controls: depotControls, reset: 'defaults' });
                    await flush();

                    expect(updateCalls()).toEqual([[
                        { controls: depotControls, reset: 'defaults', appId, budgetMs: DATA_APP_CALL_BUDGET_MS },
                        ContextType.DataApp,
                    ]]);
                });

                it.each([
                    [0],
                    [99999],
                    ['soon'],
                    [null],
                    [-1],
                ])('overwrites a budgetMs of %p from the host with its own (TC-378)', async (budgetMs) => {
                    const { embed } = await readyApp();
                    jest.useFakeTimers();
                    const data = { controls: depotControls, budgetMs };
                    const before = { ...data };

                    updateControls(embed, data);
                    await flush();

                    expect(updateCalls()).toEqual([[
                        { controls: depotControls, appId, budgetMs: DATA_APP_CALL_BUDGET_MS },
                        ContextType.DataApp,
                    ]]);
                    expect(data).toStrictEqual(before);
                });

                it.each([
                    ['appId: null', { appId: null, controls: depotControls }, { appId: null, controls: depotControls }],
                    ['another App', { appId: 'b7c8' }, { appId: 'b7c8' }],
                    ['reset only', { reset: 'defaults' }, { reset: 'defaults', appId }],
                    ['no payload', undefined, { appId }],
                ])('posts an update with %s, filling appId only when absent, and always budgetMs', async (_, data, expected) => {
                    const { embed } = await readyApp();
                    jest.useFakeTimers();

                    updateControls(embed, data);
                    await flush();

                    expect(updateCalls()).toEqual([[
                        { ...expected, budgetMs: DATA_APP_CALL_BUDGET_MS },
                        ContextType.DataApp,
                    ]]);
                });

                it.each([
                    ['a string', 'controls'],
                    ['an array', depotControls],
                    ['a class instance', new (class ControlsChange {})()],
                ])('posts an update with %s as given, with no budgetMs', async (_, data) => {
                    const { embed } = await readyApp();

                    updateControls(embed, data);
                    await flush();

                    expect(updateCalls()).toHaveLength(1);
                    expect(updateCalls()[0][0]).toBe(data);
                });

                it('strips a budgetMs the host passed on a read (TC-378)', async () => {
                    const { embed } = await readyApp();

                    getControls(embed, { budgetMs: 5 });
                    getControls(embed, { appId, budgetMs: 5 });
                    await flush();

                    expect(appCalls()).toStrictEqual([sentAs({ appId }), sentAs({ appId })]);
                });

                it('never adds budgetMs to a read, held 29.5 s or not (TC-378, TC-414)', async () => {
                    const { embed } = await renderedApp();
                    jest.useFakeTimers();
                    const call = getControls(embed);

                    await advance(29500);
                    appReady();
                    await flush();
                    getControls(embed);
                    await flush();

                    expect(appCalls()).toEqual([sentAs({ appId }), sentAs({ appId })]);

                    replies[0].resolve(appState());
                    await flush();

                    expect(call.value).toEqual(appState());
                });

                it.each([
                    ['a nested Proxy', { controls: [{ id: 'depot', value: new Proxy({ op: 'eq' }, {}) }] }],
                    ['a function', { controls: [{ id: 'depot', value: { format: (): string => 'x' } }] }],
                    ['a Symbol', { controls: [{ id: 'depot', value: { op: Symbol('eq') } }] }],
                ])('rejects an update holding %s INVALID_REQUEST: the browser posts nothing (TC-363)', async (_, data) => {
                    const { embed } = await readyApp();

                    const call = updateControls(embed, data);
                    await flush();

                    expectControlError(call, 'INVALID_REQUEST');
                    expect(replies).toEqual([]);
                });

                it('copies a top-level Proxy that names the App to add budgetMs, and posts the copy', async () => {
                    const { embed } = await readyApp();
                    const data = new Proxy({ appId, controls: depotControls }, {});

                    updateControls(embed, data);
                    await flush();

                    expect(utilTypes.isProxy(updateCalls()[0][0])).toBe(false);
                    expect(updateCalls()[0][0]).toEqual(expect.objectContaining({ appId, controls: depotControls }));
                    expect(replies).toHaveLength(1);
                });

                it.each([
                    ['12 s (TC-414, TC-436)', 12000, 18000],
                    ['28 s, with exactly 2 s left (TC-380)', 28000, 2000],
                ])('posts an update held %s with what is left of its one budget', async (_, held, budgetMs) => {
                    const { embed } = await renderedApp();
                    jest.useFakeTimers();
                    const call = updateControls(embed, { controls: depotControls });

                    await advance(held);
                    appReady();
                    await flush();

                    expect(updateCalls()).toEqual([[
                        { controls: depotControls, appId, budgetMs },
                        ContextType.DataApp,
                    ]]);

                    await advance(budgetMs - 1);

                    expect(call.settled).toBe(false);

                    await advance(1);

                    expectControlError(call, 'TIMEOUT');
                });

                it.each([
                    ['1 999 ms left (TC-380)', 28001],
                    ['1.5 s left (TC-414)', 28500],
                ])('rejects an update released with %s APP_NOT_READY, posting nothing', async (_, held) => {
                    const { embed } = await renderedApp();
                    jest.useFakeTimers();
                    const call = updateControls(embed, { controls: depotControls });

                    await advance(held);
                    appReady();
                    await flush();

                    expectControlError(call, 'APP_NOT_READY');
                    expect(updateCalls()).toEqual([]);
                });

                it('posts held updates in the order they were made (TC-435)', async () => {
                    const { embed } = await renderedApp();
                    const first = [{ id: 'depot', value: { op: 'eq', values: ['Austin'] } }];
                    const second = [{ id: 'risk_score', value: { op: 'ge', values: [80] } }];
                    updateControls(embed, { controls: first });
                    updateControls(embed, { controls: second });
                    await flush();

                    appReady();
                    await flush();

                    expect(updateCalls().map(([data]: any) => data.controls)).toEqual([first, second]);
                });

                describe('calls made back to back', () => {
                    const depotIs = (depot: string) => [{ id: 'depot', value: { op: 'eq', values: [depot] } }];
                    const depots = ['Austin', 'Dallas', 'Houston', 'El Paso', 'Waco'];

                    it('posts every update at once, in the order made, each with its whole budget and no timer run', async () => {
                        const { embed } = await readyApp();
                        jest.useFakeTimers();

                        const calls = depots.map((depot) => updateControls(embed, { controls: depotIs(depot) }));
                        await flush();

                        expect(updateCalls()).toEqual(depots.map((depot) => [
                            { controls: depotIs(depot), appId, budgetMs: DATA_APP_CALL_BUDGET_MS },
                            ContextType.DataApp,
                        ]));
                        expect(calls.map(({ settled }) => settled)).toEqual(depots.map(() => false));
                    });

                    it('posts the same update made twice twice', async () => {
                        const { embed } = await readyApp();
                        jest.useFakeTimers();

                        updateControls(embed, { controls: depotControls });
                        updateControls(embed, { controls: depotControls });
                        await flush();

                        expect(updateCalls().map(([data]: any) => data.controls)).toEqual([depotControls, depotControls]);
                    });

                    it('answers each call with its own reply, in any order, and drops none', async () => {
                        const { embed } = await readyApp();
                        jest.useFakeTimers();
                        const calls = depots.slice(0, 4).map((depot) => updateControls(embed, { controls: depotIs(depot) }));
                        await flush();
                        const refused = [{ id: 'depot', status: 'rejected', code: 'VALUE_REFUSED' }];
                        const answers = [
                            { ...updated(depotIs('Austin')), revision: 2 },
                            { code: 'VALUE_REFUSED', results: refused },
                            { ...updated(depotIs('Houston')), revision: 3 },
                            { ...updated(depotIs('El Paso')), revision: 4 },
                        ];

                        replies[2].resolve(answers[2]);
                        replies[0].resolve(answers[0]);
                        replies[3].resolve(answers[3]);
                        replies[1].reject(answers[1]);
                        await flush();

                        expect(calls[0].value).toBe(answers[0]);
                        expectControlError(calls[1], 'VALUE_REFUSED', refused);
                        expect(calls[2].value).toBe(answers[2]);
                        expect(calls[3].value).toBe(answers[3]);
                        expect(updateCalls()).toHaveLength(4);
                    });

                    it('ends each unanswered call TIMEOUT on its own budget only', async () => {
                        const { embed } = await readyApp();
                        jest.useFakeTimers();
                        const first = updateControls(embed, { controls: depotIs('Austin') });
                        await advance(10000);
                        const second = updateControls(embed, { controls: depotIs('Dallas') });
                        await flush();

                        expect(updateCalls()).toHaveLength(2);

                        await advance(DATA_APP_CALL_BUDGET_MS - 10000);

                        expectControlError(first, 'TIMEOUT');
                        expect(second.settled).toBe(false);

                        replies[1].resolve(updated(depotIs('Dallas')));
                        await flush();

                        expect(second.value).toEqual(updated(depotIs('Dallas')));
                    });

                    it('keeps reads and updates in the order made', async () => {
                        const { embed } = await readyApp();
                        jest.useFakeTimers();

                        updateControls(embed, { controls: depotIs('Austin') });
                        getControls(embed);
                        updateControls(embed, { controls: depotIs('Dallas') });
                        await flush();

                        expect(sentTypes().filter((type) => APP_CALL_TYPES.has(type))).toEqual([
                            HostEvent.UpdateDataAppControls,
                            HostEvent.GetDataAppControls,
                            HostEvent.UpdateDataAppControls,
                        ]);
                        expect(updateCalls().map(([data]: any) => data.controls))
                            .toEqual([depotIs('Austin'), depotIs('Dallas')]);
                    });

                    it('posts an update made in a DataAppReady handler after the updates held for it', async () => {
                        const { embed } = await renderedApp();
                        updateControls(embed, { controls: depotIs('Austin') });
                        updateControls(embed, { controls: depotIs('Dallas') });
                        await flush();
                        embed.on(EmbedEvent.DataAppReady, () => {
                            updateControls(embed, { controls: depotIs('Houston') });
                        });

                        appReady();
                        await flush();

                        expect(updateCalls().map(([data]: any) => data.controls))
                            .toEqual([depotIs('Austin'), depotIs('Dallas'), depotIs('Houston')]);
                    });

                    it('does not hold back a call behind one that failed before it was posted', async () => {
                        const { embed } = await renderedApp();
                        jest.useFakeTimers();
                        const first = updateControls(embed, { controls: depotIs('Austin') });
                        await advance(28500);
                        const second = updateControls(embed, { controls: depotIs('Dallas') });
                        await flush();

                        appReady();
                        await flush();

                        expectControlError(first, 'APP_NOT_READY');
                        expect(updateCalls().map(([data]: any) => data.controls)).toEqual([depotIs('Dallas')]);
                        expect(second.settled).toBe(false);
                    });

                    it('sends several values in one call as one post, answered once', async () => {
                        const { embed } = await readyApp();
                        const controls = [
                            ...depotIs('Austin'),
                            { id: 'risk_score', value: { op: 'ge', values: [80] } },
                            { id: 'route', value: null as null },
                        ];
                        const call = updateControls(embed, { controls });
                        await flush();

                        expect(updateCalls()).toEqual([[
                            { controls, appId, budgetMs: DATA_APP_CALL_BUDGET_MS },
                            ContextType.DataApp,
                        ]]);

                        replies[0].resolve(updated(controls));
                        await flush();

                        expect(call.value).toEqual(updated(controls));
                        expect(replies).toHaveLength(1);
                    });
                });

                it('resolves with the App page\'s state and results as given', async () => {
                    const { embed } = await readyApp();
                    const call = updateControls(embed, { controls: depotControls });
                    await flush();
                    const reply = { ...updated(), hostSettable: ['depot'] };

                    replies[0].resolve(reply);
                    await flush();

                    expect(call.value).toBe(reply);
                });

                it.each([
                    ['VALUE_REFUSED', [
                        { id: 'depot', status: 'rejected', code: 'VALUE_REFUSED', reason: 'aurora: SECRET-1' },
                        { id: 'route', status: 'skipped', code: undefined },
                    ], [
                        { id: 'depot', status: 'rejected', code: 'VALUE_REFUSED' },
                        { id: 'route', status: 'skipped' },
                    ]],
                    ['INVALID_REQUEST', [{ id: 'Depot', status: 'rejected', code: 'INVALID_VALUE', value: 'x' }], [
                        { id: 'Depot', status: 'rejected', code: 'INVALID_VALUE' },
                    ]],
                    ['CONTROLS_NOT_SUPPORTED', undefined, undefined],
                    ['LIMIT_EXCEEDED', undefined, undefined],
                    ['UNSUPPORTED_FIELD', undefined, undefined],
                    ['APP_MISMATCH', undefined, undefined],
                    ['APP_NOT_READY', undefined, undefined],
                    ['NOT_SIGNED_IN', undefined, undefined],
                    ['SESSION_LOST', undefined, undefined],
                    ['TIMEOUT', undefined, undefined],
                    ['FAILED', undefined, undefined],
                ])('rejects an update with the Apps page code %s and the SDK\'s sentence', async (code, results, kept) => {
                    const { embed } = await readyApp();
                    const call = updateControls(embed, { controls: depotControls });
                    await flush();

                    replies[0].reject({ code, results, message: 'A sentence from the page: SECRET-1' });
                    await flush();

                    expectControlError(call, code, kept);
                    (call.error.results ?? []).forEach((entry: object) => expect(emptyKeys(entry)).toEqual([]));
                    expect(JSON.stringify(call.error)).not.toContain('SECRET-1');
                });

                it.each([
                    ['HostEvent.Reload', (embed: DataAppEmbed) => embed.trigger(HostEvent.Reload)],
                    ['destroy()', (embed: DataAppEmbed) => embed.destroy()],
                ])('ends a sent update SESSION_LOST at once on %s; a late reply changes nothing', async (_, end) => {
                    const { embed } = await readyApp();
                    const call = updateControls(embed, { controls: depotControls });
                    await flush();

                    await end(embed);
                    await flush();

                    expectControlError(call, 'SESSION_LOST');

                    replies[0].resolve(updated());
                    await flush();

                    expect(call.error.code).toBe('SESSION_LOST');
                });

                it('leaves a sent update to the Apps page\'s answer on an App switch', async () => {
                    const { embed } = await readyApp();
                    const call = updateControls(embed, { controls: depotControls });
                    await flush();

                    await embed.navigateToDataApp('b7c8');
                    await flush();

                    expect(call.settled).toBe(false);

                    replies[0].reject({ code: 'SESSION_LOST' });
                    await flush();

                    expectControlError(call, 'SESSION_LOST');
                });

                it.each([
                    ['an update', HostEvent.UpdateDataAppControls],
                    ['a read', HostEvent.GetDataAppControls],
                ])('posts %s made during an in-place restart only after the new values apply (CR-5)', async (_, type) => {
                    const { embed } = await readyApp();
                    jest.useFakeTimers();

                    const navigating = embed.navigateToDataApp(appId, { controls: depotControls });
                    const call = watch(embed.trigger(type, { controls: otherControls } as any));
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS - 1);

                    expect(sentTypes()).toEqual([HostEvent.UpdateEmbedParams]);

                    await advance(1);
                    await navigating;
                    await flush();

                    expect(sentTypes()).toEqual([HostEvent.UpdateEmbedParams, HostEvent.Navigate, type]);
                    expect(call.settled).toBe(false);
                    if (type === HostEvent.UpdateDataAppControls) {
                        expect(updateCalls()[0][0]).toMatchObject({
                            budgetMs: DATA_APP_CALL_BUDGET_MS - UPDATE_EMBED_PARAMS_SETTLE_MS,
                        });
                    }
                });

                it('posts a call after 2 s when an in-place restart\'s params never build, and ends it by 30 s (R2-1)', async () => {
                    const { embed } = await readyApp();
                    jest.spyOn(embed as any, 'getUpdateEmbedParamsObject').mockImplementation(() => new Promise(() => undefined));
                    jest.useFakeTimers();

                    embed.navigateToDataApp(appId, { controls: depotControls });
                    const read = getControls(embed);
                    const update = updateControls(embed, { controls: otherControls });
                    await flush();
                    await advance(DATA_APP_MIN_UPDATE_BUDGET_MS - 1);

                    expect(sentTypes()).toEqual([]);

                    await advance(1);

                    expect(sentTypes()).toEqual([HostEvent.GetDataAppControls, HostEvent.UpdateDataAppControls]);

                    await advance(DATA_APP_CALL_BUDGET_MS - DATA_APP_MIN_UPDATE_BUDGET_MS);

                    expectControlError(read, 'TIMEOUT');
                    expectControlError(update, 'TIMEOUT');
                });

                it('holds a call made while a ready pre-render is shown with new values until its params apply (CR-5)', async () => {
                    const preRenderId = nextPreRenderId();
                    const { embed } = await shownPreRender(preRenderId);
                    appReady();
                    await flush();
                    embed.hidePreRender();
                    const other = createDataApp({ dataAppId: appId, preRenderId, dataAppControls: depotControls });
                    const before = processTrigger.mock.calls.length;

                    await other.embed.showPreRender();
                    updateControls(other.embed, { controls: otherControls });
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS - 1);

                    expect(sentTypes().slice(before)).toEqual([HostEvent.UpdateEmbedParams]);

                    await advance(1);

                    expect(sentTypes().slice(before)).toEqual([
                        HostEvent.UpdateEmbedParams,
                        HostEvent.Navigate,
                        HostEvent.UpdateDataAppControls,
                    ]);
                    // TC-284: the show sends the values before it navigates.
                    expect(posted(HostEvent.UpdateEmbedParams).pop().dataAppInitialControls)
                        .toStrictEqual({ appId, controls: depotControls });
                });

                it('posts that call after 2 s when the shown container never loads (CR-5, D18)', async () => {
                    const preRenderId = nextPreRenderId();
                    const created = createDataApp({ dataAppId: appId, preRenderId });
                    await created.embed.showPreRender();
                    await flush();
                    appReady();
                    await flush();
                    created.embed.hidePreRender();
                    const other = createDataApp({ dataAppId: appId, preRenderId, dataAppControls: depotControls });
                    jest.useFakeTimers();

                    await other.embed.showPreRender();
                    updateControls(other.embed, { controls: otherControls });
                    await flush();
                    await advance(DATA_APP_MIN_UPDATE_BUDGET_MS - 1);

                    expect(updateCalls()).toEqual([]);

                    await advance(1);

                    expect(updateCalls()).toEqual([[
                        { controls: otherControls, appId, budgetMs: DATA_APP_CALL_BUDGET_MS - DATA_APP_MIN_UPDATE_BUDGET_MS },
                        ContextType.DataApp,
                    ]]);
                    expect(sentTypes()).not.toContain(HostEvent.Navigate);
                });

                it('reports an update once, in the dataApp context, with the known keys as types only', async () => {
                    const upload = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
                    const { embed } = await readyApp();
                    const eventId = `${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.UpdateDataAppControls}`;

                    updateControls(embed, {
                        controls: depotControls,
                        reset: 'defaults',
                        appId,
                        budgetMs: 5,
                    }, ContextType.Liveboard);
                    await flush();
                    const reported = upload.mock.calls.filter(([id]) => id === eventId);
                    upload.mockRestore();

                    expect(reported).toHaveLength(1);
                    expect(reported[0][1]).toMatchObject({
                        hostEvent: HostEvent.UpdateDataAppControls,
                        contextType: ContextType.DataApp,
                        embedComponentType: 'dataApp',
                        params: { controls: ['object'], reset: 'string', appId: 'string' },
                        paramKeys: ['controls', 'reset', 'appId'],
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
                        ['AppEmbed', () => newAppEmbed({})],
                        ['SearchEmbed', () => track(new SearchEmbed(getRootEl(), {}))],
                    ])('%s rejects an update at once, before and after render, and posts nothing (TC-511)', async (_, create) => {
                        const embed: TsEmbed = create();
                        const errors: unknown[] = [];
                        embed.on(EmbedEvent.Error, (error) => errors.push(error));

                        const before = updateControls(embed, { controls: depotControls });
                        await flush();
                        await embed.render();
                        const after = updateControls(embed, { controls: depotControls });
                        await flush();

                        expectControlError(before, 'APP_NOT_READY');
                        expectControlError(after, 'APP_NOT_READY');
                        expect(updateCalls()).toEqual([]);
                        expect(errors).toEqual([]);
                        expect((embed as any).isError).toBe(false);
                    });

                    it.each([
                        ['an array', depotControls],
                        ['a map', { zz_depot: { op: 'eq' } }],
                    ])('reports an update with %s at the top level as no params, on a LiveboardEmbed (CR-4)', async (_, data) => {
                        const upload = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
                        const embed = track(new LiveboardEmbed(getRootEl(), { liveboardId: 'lb-1' }));
                        await embed.render();

                        const call = updateControls(embed, data);
                        await flush();
                        const reported = upload.mock.calls
                            .filter(([id]) => id === `${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.UpdateDataAppControls}`)
                            .map(([, props]: any) => props.params);
                        upload.mockRestore();

                        expectControlError(call, 'APP_NOT_READY');
                        expect(reported).toEqual([{}]);
                    });
                });
            });

            describe('navigateToDataApp() options', () => {
                it('posts Navigate 200 ms after the params; the last params before it carry the values (TC-279, TC-284)', async () => {
                    const north = [{ id: 'depot', value: { op: 'eq', values: ['north'] } }];
                    const { embed } = await readyApp({ dataAppId: appId, dataAppControls: depotControls });
                    jest.useFakeTimers();

                    const navigating = embed.navigateToDataApp('b7c8', { controls: north });
                    await flush();
                    await advance(UPDATE_EMBED_PARAMS_SETTLE_MS - 1);

                    expect(sentTypes()).toEqual([HostEvent.UpdateEmbedParams]);

                    await advance(1);
                    await navigating;

                    expect(sentTypes()).toEqual([HostEvent.UpdateEmbedParams, HostEvent.Navigate]);
                    expect(posted(HostEvent.UpdateEmbedParams)[0].dataAppInitialControls)
                        .toStrictEqual({ appId: 'b7c8', controls: north });
                });

                it('holds calls made meanwhile for the App it opens (TC-279)', async () => {
                    const { embed } = await readyApp();
                    const navigating = embed.navigateToDataApp('b7c8', { controls: depotControls });
                    const call = updateControls(embed, { controls: otherControls });
                    await navigating;

                    appReady();
                    await flush();

                    expect(updateCalls()).toEqual([]);

                    appReady('b7c8');
                    await flush();

                    expect(updateCalls()).toEqual([[
                        expect.objectContaining({ controls: otherControls, appId: 'b7c8' }),
                        ContextType.DataApp,
                    ]]);
                    expect(call.settled).toBe(false);
                });

                it.each([
                    ['another App (TC-280)', 'b7c8'],
                    ['the App open (TC-295)', appId],
                ])('drops the values when navigating to %s with no controls', async (_, target) => {
                    const { embed } = await renderedApp({ dataAppId: appId, dataAppControls: depotControls });

                    await embed.navigateToDataApp(target);

                    const params = posted(HostEvent.UpdateEmbedParams);
                    expect(params).toHaveLength(1);
                    expect('dataAppInitialControls' in params[0]).toBe(false);
                    expect(JSON.stringify(params[0])).not.toContain('Austin');
                    expect(navigated()).toEqual([`embed/insights/apps/${target}`]);
                    expect((embed as any).viewConfig.dataAppControls).toBeUndefined();
                });

                it('takes null for none, in the view config and in options (CR-11)', async () => {
                    const embed = newDataApp({ dataAppId: appId, dataAppControls: null });
                    await embed.render();

                    await embed.navigateToDataApp('b7c8', { controls: null });

                    expect(sentTypes()).toEqual([HostEvent.Navigate]);
                });

                it.each([
                    ['could not be built', (embed: DataAppEmbed) => {
                        jest.spyOn(embed as any, 'getUpdateEmbedParamsObject').mockRejectedValueOnce(new Error('token'));
                    }],
                    ['could not be posted', () => {
                        processTrigger.mockImplementationOnce(() => Promise.reject(
                            Object.assign(new Error('could not be cloned'), { name: 'DataCloneError' }),
                        ));
                    }],
                ])('opens the App on a retry with the same values after their params %s (R2-4)', async (_, fail) => {
                    const { embed, errors } = await opened({ dataAppId: appId });
                    appReady();
                    await flush();
                    fail(embed);
                    const navigate = async () => {
                        const navigating = embed.navigateToDataApp(appId, { controls: depotControls });
                        await flush();
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await navigating;
                    };

                    await navigate();

                    expect(errors.map((error: any) => error.code)).toEqual([EmbedErrorCodes.DATA_APP_OPEN_FAILED]);
                    expect(navigated()).toEqual([]);
                    const tried = posted(HostEvent.UpdateEmbedParams).length;

                    await navigate();

                    // The retry sends the values again, then opens the App.
                    expect(posted(HostEvent.UpdateEmbedParams)).toHaveLength(tried + 1);
                    expect(posted(HostEvent.UpdateEmbedParams).pop().dataAppInitialControls)
                        .toStrictEqual({ appId, controls: depotControls });
                    expect(navigated()).toEqual([`embed/insights/apps/${appId}`]);
                });

                describe('after a failed open (D2)', () => {
                    const failed = async (config: object = { dataAppId: appId, dataAppControls: depotControls }) => {
                        const created = await renderedApp(config);
                        appOpenFailed({ appId, reason: 'CONTROLS_REFUSED' });
                        await flush();
                        return created;
                    };

                    it('keeps the failure for the same App with the same values, in any key order', async () => {
                        const { embed } = await failed();

                        await embed.navigateToDataApp(appId, {
                            controls: [{ value: { values: ['Austin'], op: 'eq' }, id: 'depot' }],
                        });
                        const call = updateControls(embed, { controls: otherControls });
                        await flush();

                        expectControlError(call, 'APP_NOT_READY');
                        expect(posted(HostEvent.UpdateEmbedParams)).toEqual([]);
                    });

                    it.each([
                        ['an empty array', []],
                        ['null', null],
                    ])('keeps the failure for an App opened with no values, given %p', async (_, controls) => {
                        const { embed } = await failed({ dataAppId: appId });

                        await embed.navigateToDataApp(appId, { controls });
                        const call = getControls(embed);
                        await flush();

                        expectControlError(call, 'APP_NOT_READY');
                    });

                    it.each([
                        ['other values (TC-281)', otherControls, { appId, controls: otherControls }],
                        ['no values (TC-282)', undefined, undefined],
                    ])('opens the same App again with %s', async (_, controls, packed) => {
                        const { embed } = await failed();

                        await embed.navigateToDataApp(appId, controls && { controls });
                        const call = getControls(embed);
                        await flush();

                        expect(call.settled).toBe(false);
                        expect(posted(HostEvent.UpdateEmbedParams).map((params) => params.dataAppInitialControls))
                            .toEqual([packed]);
                        expect(navigated()).toEqual([`embed/insights/apps/${appId}`]);

                        appReady();
                        await flush();

                        expect(appCalls()).toEqual([sentAs({ appId })]);
                    });
                });

                describe('one navigate during another', () => {
                    it('opens the last App asked for', async () => {
                        const { embed } = await readyApp();
                        jest.useFakeTimers();

                        const first = embed.navigateToDataApp('b7c8', { controls: depotControls });
                        await flush();
                        const second = embed.navigateToDataApp('c9d0', { controls: otherControls });
                        await flush();
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await Promise.all([first, second]);

                        expect(navigated().length).toBeGreaterThan(0);
                        expect(new Set(navigated())).toEqual(new Set(['embed/insights/apps/c9d0']));
                        expect(posted(HostEvent.UpdateEmbedParams).pop().dataAppInitialControls)
                            .toStrictEqual({ appId: 'c9d0', controls: otherControls });
                    });

                    it('neither warns nor calls a handler after destroy() in the settle (CR-10)', async () => {
                        const { embed, errors } = await opened({ dataAppId: appId });
                        appReady();
                        await flush();

                        const navigating = embed.navigateToDataApp('b7c8', { controls: depotControls });
                        await flush();
                        embed.destroy();
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await navigating;
                        await advance(60000);

                        expect(errors).toEqual([]);
                    });

                    it('posts no Navigate after destroy() in the settle', async () => {
                        const { embed } = await readyApp();
                        jest.useFakeTimers();

                        const navigating = embed.navigateToDataApp('b7c8', { controls: depotControls });
                        await flush();
                        embed.destroy();
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await navigating;

                        expect(navigated()).toEqual([]);
                    });

                    it('waits for the AuthInit of a Reload made in the settle', async () => {
                        const { embed, errors } = await opened({ dataAppId: appId });
                        appReady();
                        await flush();

                        const navigating = embed.navigateToDataApp(appId, { controls: depotControls });
                        await flush();
                        await embed.trigger(HostEvent.Reload);
                        await advance(UPDATE_EMBED_PARAMS_SETTLE_MS);
                        await navigating;
                        const call = getControls(embed);
                        await advance(20000);

                        expect(notConfirmed(errors)).toEqual([]);
                        expect(call.settled).toBe(false);

                        await signIn();
                        appReady();
                        await flush();

                        expect(appCalls()).toEqual([sentAs({ appId })]);
                    });
                });
            });

            describe('the interim refusals', () => {
                it('renders, shows and navigates with values, with no refusal', async () => {
                    const { embed, errors } = await renderedApp({ dataAppId: appId, dataAppControls: depotControls });

                    await embed.navigateToDataApp('b7c8', { controls: depotControls });

                    expect(errors).toEqual([]);
                    expect(getIFrameEl()).not.toBeNull();
                    expect((embed as any).isError).toBe(false);
                });

                it('has no sentence or code left for a refused dataAppControls', () => {
                    expect(Object.keys(ERROR_MESSAGE)).not.toContain('DATA_APP_CONTROLS_NOT_SUPPORTED');
                    expect(Object.keys(EmbedErrorCodes)).not.toContain('DATA_APP_CONTROLS_NOT_SUPPORTED');
                    Object.values(ERROR_MESSAGE).forEach((message) => {
                        expect(message).not.toMatch(/cannot set control values/i);
                    });
                });
            });

            describe('a refused change of the React prop', () => {
                it('raises DATA_APP_UPDATE_FAILED with the call\'s error, and a warning', () => {
                    const { embed, errors } = createDataApp({ dataAppId: appId });
                    const error = new DataAppControlError('VALUE_REFUSED', [{ id: 'depot', status: 'rejected' }]);

                    embed.reportUpdateFailed(error);

                    const expected = {
                        errorType: ErrorDetailsTypes.API,
                        message: ERROR_MESSAGE.DATA_APP_UPDATE_FAILED,
                        code: EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
                        severity: EmbedErrorSeverity.SEV3,
                        error,
                    };
                    expect(errors).toStrictEqual([expected]);
                    expect((errors[0] as any).error).toBe(error);
                    expect(logWarn).toHaveBeenCalledWith(expected);
                    expect((embed as any).isError).toBe(false);
                });

                it('leaves the sentence in error when there is no error to pass (CR-12)', () => {
                    const { embed, errors } = createDataApp({ dataAppId: appId });

                    embed.reportUpdateFailed(undefined);

                    expect(errors).toStrictEqual([{
                        errorType: ErrorDetailsTypes.API,
                        message: ERROR_MESSAGE.DATA_APP_UPDATE_FAILED,
                        code: EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
                        severity: EmbedErrorSeverity.SEV3,
                        error: ERROR_MESSAGE.DATA_APP_UPDATE_FAILED,
                    }]);
                });
            });

            describe('telemetry', () => {
                let upload: jest.SpyInstance;

                // None of these may be uploaded.
                const secrets = ['zz_depot', 'ZZ-Austin', 'zzInner', 'zz_route', '"BW"', '"TAB"'];
                const secretControls = [{
                    id: 'zz_depot',
                    value: { zzInner: ['ZZ-Austin'], operator: RuntimeFilterOp.BW, level: 'TAB' },
                }];
                const uploads = () => JSON.stringify(upload.mock.calls);
                const props = (eventId: string) => upload.mock.calls
                    .filter(([id]) => id === eventId)
                    .map(([, eventProps]) => eventProps);
                const trigger = `${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-`;

                beforeEach(() => {
                    upload = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
                });

                afterEach(() => {
                    upload.mockRestore();
                });

                it('uploads no control id, value or inner key on any path (TC-609)', async () => {
                    const preRenderId = nextPreRenderId();
                    const owner = newDataApp({
                        dataAppId: appId,
                        preRenderId,
                        dataAppControls: secretControls,
                    } as DataAppEmbedViewConfig);
                    await owner.preRender();
                    await flush();
                    const embed = newDataApp({
                        dataAppId: appId,
                        preRenderId,
                        dataAppControls: secretControls,
                    } as DataAppEmbedViewConfig);
                    embed.isEmbedContainerLoaded = true;
                    await embed.showPreRender();
                    await resolveAfter(UPDATE_EMBED_PARAMS_SETTLE_MS + 100);
                    await signIn();
                    appReady();
                    await flush();
                    [
                        { controls: secretControls, reset: 'defaults' },
                        secretControls,
                        { zz_depot: secretControls[0].value },
                        { controls: { zz_depot: {} }, reset: { level: 'TAB' }, appId: { zz_route: 1 } },
                    ].forEach((data) => updateControls(embed, data));
                    getControls(embed, { appId, zz_route: secretControls });
                    await embed.navigateToDataApp(appId, {
                        controls: [{ id: 'zz_route', value: { zzInner: 'ZZ-Austin' } }],
                    });
                    await embed.navigateToDataApp('b7c8', { controls: secretControls });
                    await embed.trigger(HostEvent.Reload);
                    await flush();

                    secrets.forEach((secret) => expect(uploads()).not.toContain(secret));
                    expect(props(mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_EMBED_CREATE)
                        .map((created) => created.dataAppControls)).toEqual([{ count: 1 }, { count: 1 }]);
                    expect(props(`${trigger}${HostEvent.UpdateDataAppControls}`).map(({ params }) => params)).toEqual([
                        { controls: ['object'], reset: 'string' },
                        {},
                        {},
                        { controls: 'object', reset: 'object', appId: 'object' },
                    ]);
                    expect(props(`${trigger}${HostEvent.GetDataAppControls}`).map(({ params }) => params))
                        .toEqual([{ appId: 'string' }]);
                    props(`${trigger}${HostEvent.UpdateEmbedParams}`).forEach(({ params }) => {
                        expect('dataAppControls' in params).toBe(false);
                        expect([undefined, { appId: 'string', controls: ['object'] }])
                            .toContainEqual(params.dataAppInitialControls);
                    });
                });

                it('uploads what it did before for other embed types', async () => {
                    const config = { liveboardId: 'lb-1', runtimeFilters: depotFilter };
                    const embed = track(new LiveboardEmbed(getRootEl(), config));
                    await embed.render();
                    const filters = [{ columnName: 'Depot', operator: RuntimeFilterOp.EQ, values: ['Austin'] }];

                    embed.trigger(HostEvent.UpdateRuntimeFilters, filters);
                    await flush();

                    expect(props(mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_EMBED_CREATE)).toEqual([{
                        embedComponentType: 'LiveboardEmbed',
                        liveboardId: 'lb-1',
                        runtimeFilters: describeRuntimeFilters(depotFilter),
                    }]);
                    expect(props(`${trigger}${HostEvent.UpdateRuntimeFilters}`).map(({ params }) => params))
                        .toEqual([describeParams(filters)]);
                });
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
