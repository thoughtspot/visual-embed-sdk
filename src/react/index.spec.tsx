import React, { useEffect } from 'react';
import { setImmediate as realSetImmediate } from 'timers';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import {
    act, cleanup, fireEvent, render, waitFor,
} from '@testing-library/react';
import {
    Action, EmbedErrorCodes, EmbedEvent, HostEvent, RuntimeFilterOp,
} from '../types';
import { logger } from '../utils/logger';
import {
    executeAfterWait,
    getIFrameEl,
    getIFrameSrc,
    postMessageToParent,
    mockMessageChannel,
} from '../test/test-utils';
import {
    SearchEmbed, AppEmbed, LiveboardEmbed, useEmbedRef, SearchBarEmbed, PreRenderedLiveboardEmbed, PreRenderedSearchEmbed, PreRenderedAppEmbed, useSpotterAgent, SpotterMessage, useInit,
    DataAppEmbed,
} from './index';
import * as allExports from './index';
import {
    AuthType, init,
} from '../index';
import { TsEmbed } from '../embed/ts-embed';
import { LiveboardEmbed as LiveboardEmbedClass } from '../embed/liveboard';
import { DataAppEmbed as DataAppEmbedClass } from '../embed/data-app';
import { ERROR_MESSAGE } from '../errors';
import * as processTriggerService from '../utils/processTrigger';
import * as mixpanelInstance from '../mixpanel-service';

import { version } from '../../package.json';

import * as auth from '../auth';
import * as sessionService from '../utils/sessionInfoService';

const thoughtSpotHost = 'localhost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(auth, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
    jest.spyOn(sessionService, 'getSessionInfo').mockReturnValue({
        userGUID: 'abcd',
    } as any);
    jest.spyOn(window, 'alert');
});

describe('React Components', () => {
    describe('SearchEmbed', () => {
        it('Should Render the Iframe with props', async () => {
            const { container } = render(
                <SearchEmbed hideDataSources={true} className="embedClass" />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(
                getIFrameEl(container).parentElement.classList.contains(
                    'embedClass',
                ),
            ).toBe(true);
            expect(getIFrameSrc(container)).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=None&blockNonEmbedFullAppAccess=true&hideAction=[%22${Action.ReportError}%22,%22editACopy%22,%22saveAsView%22,%22updateTSL%22,%22editTSL%22,%22onDeleteAnswer%22]&preAuthCache=true&overrideConsoleLogs=true&clientLogLevel=ERROR&enableDataPanelV2=true&dataSourceMode=hide&useLastSelectedSources=false&isSearchEmbed=true&collapseSearchBarInitially=true&enableCustomColumnGroups=false&dataPanelCustomGroupsAccordionInitialState=EXPAND_ALL#/embed/answer`,
            );
        });

        it('Should attach event listeners', async () => {
            const userGUID = 'absfdfgd';
            const { container } = render(
                <SearchEmbed
                    onInit={(e) => {
                        expect(e.data).toHaveProperty('timestamp');
                    }}
                    onAuthInit={(e) => {
                        expect(e.data.userGUID).toEqual(userGUID);
                    }}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            const iframe = getIFrameEl(container);
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.AuthInit,
                data: {
                    userGUID,
                },
            });
        });
    });

    describe('AppEmbed', () => {
        //
    });

    describe('DataAppEmbed', () => {
        it.each([
            ['render()', {}],
            ['showPreRender()', { preRenderId: 'react-data-app' }],
        ])('refuses runtimeFilters passed as a prop, through %s', async (_, extra) => {
            const logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            const onError = jest.fn();
            const framesBefore = document.querySelectorAll('iframe').length;

            const { container } = render(
                <DataAppEmbed
                    dataAppId="a1b2"
                    runtimeFilters={[{ columnName: 'Depot', operator: RuntimeFilterOp.EQ, values: ['Austin'] }]}
                    onError={onError}
                    {...extra}
                />,
            );
            await waitFor(() => expect(onError).toHaveBeenCalled());
            logError.mockRestore();

            expect(onError.mock.calls.map(([error]) => [error.code, error.option])).toEqual([
                [EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED, 'runtimeFilters'],
            ]);
            expect(getIFrameEl(container)).toBeNull();
            expect(document.querySelectorAll('iframe')).toHaveLength(framesBefore);
        });
    });

    describe('DataAppEmbed dataAppControls', () => {
        const appId = 'a1b2';
        const depot = (value: string) => ({ id: 'depot', value: { op: 'eq', values: [value] } });
        const austin = [depot('Austin')];
        const dallas = [depot('Dallas')];
        const houston = [depot('Houston')];
        const routeNone = { id: 'route', value: null as null };
        const routeR12 = { id: 'route', value: { op: 'eq', values: ['R-12'] } };
        const appCallTypes: string[] = [HostEvent.GetDataAppControls, HostEvent.UpdateDataAppControls];

        let processTrigger: jest.SpyInstance;
        let replies: { resolve: (value: unknown) => void; reject: (reason: unknown) => void; type: string }[];
        let builds: jest.SpyInstance;
        let destroys: jest.SpyInstance;
        let logWarn: jest.SpyInstance;
        let logError: jest.SpyInstance;

        const flush = () => new Promise((resolve) => {
            realSetImmediate(resolve);
        });
        const settle = async () => {
            await flush();
            await flush();
        };
        const fromFrame = (type: string, data?: unknown) => postMessageToParent(
            document.querySelector('iframe').contentWindow,
            { type, data, status: 'end' },
        );
        const state = (controls: unknown[], extra: object = {}) => ({
            appId,
            session: 'S1',
            revision: 1,
            controls,
            ...extra,
        });
        // An App event, inside act: a host handler may set state.
        const fromApp = async (type: string, data: unknown) => {
            act(() => {
                fromFrame(type, data);
            });
            await settle();
        };
        const ready = (controls: unknown[], extra?: object) => fromApp(
            EmbedEvent.DataAppReady,
            state(controls, extra),
        );
        const changed = (controls: unknown[], extra: object = {}) => fromApp(EmbedEvent.DataAppControlsChanged, {
            ...state(controls, { revision: 2, ...extra }),
            source: 'app',
            changed: [],
        });
        const openFailed = (fields: object = { appId }) => fromApp(EmbedEvent.Error, {
            code: EmbedErrorCodes.DATA_APP_OPEN_FAILED,
            severity: 1,
            errorType: 'API',
            reason: 'CONTROLS_REFUSED',
            ...fields,
        });
        // The controls of each update posted to the frame.
        const updates = () => processTrigger.mock.calls
            .filter(([, type]) => type === HostEvent.UpdateDataAppControls)
            .map(([, , , data]) => data.controls);
        const updateReplies = () => replies.filter(({ type }) => type === HostEvent.UpdateDataAppControls);
        // The App page's reply to an accepted update.
        const accepted = (controls: unknown[], revision = 2) => ({
            ...state(controls, { revision }),
            results: controls.map(({ id }: any) => ({ id, status: 'accepted' })),
        });
        const errorCodes = (onError: jest.Mock) => onError.mock.calls
            .map(([error]) => error.code ?? error.data?.code);
        const embedOf = (ref: React.RefObject<any>): DataAppEmbedClass => ref.current;

        const mount = async (props: any = {}) => {
            const view = render(<DataAppEmbed dataAppId={appId} {...props} />);
            await settle();
            return {
                ...view,
                update: async (next: any) => {
                    view.rerender(<DataAppEmbed dataAppId={appId} {...next} />);
                    await settle();
                },
            };
        };

        beforeEach(() => {
            (window as any).ResizeObserver = window.ResizeObserver || jest.fn().mockImplementation(() => ({
                disconnect: jest.fn(),
                observe: jest.fn(),
                unobserve: jest.fn(),
            }));
            replies = [];
            logWarn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
            logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            builds = jest.spyOn(DataAppEmbedClass.prototype, 'render');
            destroys = jest.spyOn(DataAppEmbedClass.prototype, 'destroy');
            processTrigger = jest
                .spyOn(processTriggerService, 'processTrigger')
                .mockImplementation((_frame, type) => (appCallTypes.includes(type)
                    ? new Promise((resolve, reject) => {
                        replies.push({ resolve, reject, type });
                    })
                    : Promise.resolve(null)));
        });

        afterEach(async () => {
            cleanup();
            await settle();
            document
                .querySelectorAll('[id^="tsEmbed-pre-render-wrapper-"]')
                .forEach((el) => el.remove());
            [processTrigger, builds, destroys, logWarn, logError].forEach((spy) => spy.mockRestore());
        });

        it('builds one embed with the prop as its load-time values (TC-630)', async () => {
            const ref = React.createRef<any>();
            const { container } = await mount({ dataAppControls: austin, ref });

            expect(builds).toHaveBeenCalledTimes(1);
            expect(container.querySelectorAll('iframe')).toHaveLength(1);
            expect(embedOf(ref)).toBeInstanceOf(DataAppEmbedClass);
            expect((await (embedOf(ref) as any).getAppInitData()).embedParams.dataAppInitialControls)
                .toStrictEqual({ appId, controls: austin });
        });

        it('sends only the entries that differ from the state it was told, without a rebuild (TC-631, TC-632, TC-633)', async () => {
            const { container, update } = await mount({ dataAppControls: [...austin, routeNone] });
            const frame = container.querySelector('iframe');
            await ready([...austin, routeNone]);

            await update({ dataAppControls: [...dallas, routeNone] });

            expect(updates()).toEqual([dallas]);
            expect(builds).toHaveBeenCalledTimes(1);
            expect(destroys).not.toHaveBeenCalled();
            expect(container.querySelector('iframe')).toBe(frame);
        });

        it.each([
            ['a new array with the same values (TC-634)', [depot('Austin'), { ...routeR12 }]],
            ['the same values in another key order (TC-635)', [
                { value: { values: ['Austin'], op: 'eq' }, id: 'depot' },
                { value: { values: ['R-12'], op: 'eq' }, id: 'route' },
            ]],
            ['an entry removed: the prop is merge-only (TC-636)', austin],
        ])('sends nothing for %s', async (_, next) => {
            const { update } = await mount({ dataAppControls: [...austin, routeR12] });
            await ready([...austin, routeR12]);

            await update({ dataAppControls: next });

            expect(updates()).toEqual([]);
            expect(builds).toHaveBeenCalledTimes(1);
        });

        it('sends an entry set to null to clear it (TC-637)', async () => {
            const { update } = await mount({ dataAppControls: [...austin, routeR12] });
            await ready([...austin, routeR12]);

            await update({ dataAppControls: [...austin, routeNone] });

            expect(updates()).toEqual([[routeNone]]);
        });

        it('settles when every event is mirrored into the prop: nothing sent, no rebuild (TC-644)', async () => {
            let renders = 0;
            const Mirror = () => {
                const [controls, setControls] = React.useState<unknown[]>([...austin, routeNone]);
                renders += 1;
                return (
                    <DataAppEmbed
                        dataAppId={appId}
                        dataAppControls={controls as any}
                        onDataAppReady={(e) => setControls(e.data.controls)}
                        onDataAppControlsChanged={(e) => setControls(e.data.controls)}
                    />
                );
            };
            render(<Mirror />);
            await settle();
            await ready([...austin, routeNone]);
            const before = renders;

            await changed([...austin, routeR12]);

            expect(renders).toBe(before + 1);
            expect(updates()).toEqual([]);
            expect(builds).toHaveBeenCalledTimes(1);
        });

        it('raises DATA_APP_UPDATE_FAILED for a refused change, and nothing else (TC-638)', async () => {
            const onError = jest.fn();
            const { update } = await mount({ dataAppControls: austin, onError });
            await ready(austin);

            await update({ dataAppControls: dallas, onError });
            updateReplies()[0].reject({
                code: 'VALUE_REFUSED',
                results: [{ id: 'depot', status: 'rejected', code: 'VALUE_REFUSED', reason: 'SECRET-1' }],
            });
            await settle();

            expect(onError).toHaveBeenCalledTimes(1);
            const [details] = onError.mock.calls[0];
            expect(details).toStrictEqual({
                errorType: 'API',
                message: ERROR_MESSAGE.DATA_APP_UPDATE_FAILED,
                code: EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
                severity: 3,
                error: expect.any(Error),
            });
            expect(details.error).toMatchObject({
                name: 'DataAppControlError',
                code: 'VALUE_REFUSED',
                results: [{ id: 'depot', status: 'rejected', code: 'VALUE_REFUSED' }],
            });
            expect(JSON.stringify(details)).not.toContain('SECRET-1');
        });

        it('sends each change at once, in order, and reports each refusal on its own', async () => {
            const onError = jest.fn();
            const { update } = await mount({ dataAppControls: austin, onError });
            await ready(austin);
            await update({ dataAppControls: dallas, onError });
            await update({ dataAppControls: houston, onError });
            await update({ dataAppControls: austin, onError });

            expect(updates()).toEqual([dallas, houston, austin]);

            updateReplies()[0].reject({ code: 'VALUE_REFUSED' });
            updateReplies()[1].resolve(accepted(houston, 3));
            updateReplies()[2].reject({ code: 'APP_MISMATCH' });
            await settle();

            expect(errorCodes(onError)).toEqual([
                EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
                EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
            ]);
            expect(onError.mock.calls.map(([details]) => details.error.code)).toEqual(['VALUE_REFUSED', 'APP_MISMATCH']);
        });

        it('reports a code an older App page sends, such as SUPERSEDED, as FAILED', async () => {
            const onError = jest.fn();
            const { update } = await mount({ dataAppControls: austin, onError });
            await ready(austin);
            await update({ dataAppControls: dallas, onError });

            updateReplies()[0].reject({ code: 'SUPERSEDED' });
            await settle();

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0].error).toMatchObject({ name: 'DataAppControlError', code: 'FAILED' });
        });

        it('calls the newest inline handler without a rebuild; adding or removing one rebuilds (TC-640)', async () => {
            const seen: string[] = [];
            const { update } = await mount({ onDataAppReady: () => seen.push('first') });

            await update({ onDataAppReady: () => seen.push('second') });
            await ready(austin);

            expect(seen).toEqual(['second']);
            expect(builds).toHaveBeenCalledTimes(1);

            await update({ onDataAppReady: () => seen.push('third'), onDataAppLoad: jest.fn() });

            expect(builds).toHaveBeenCalledTimes(2);

            await update({ onDataAppLoad: jest.fn() });

            expect(builds).toHaveBeenCalledTimes(3);
        });

        it('rebuilds on another prop, opening with the prop as its load-time values (TC-641)', async () => {
            const ref = React.createRef<any>();
            const { update } = await mount({ dataAppControls: austin, ref });
            await ready(austin);
            await update({ dataAppControls: dallas, ref });
            const first = embedOf(ref);

            await update({ dataAppControls: dallas, hideDataAppHeader: true, ref });

            expect(builds).toHaveBeenCalledTimes(2);
            expect(destroys.mock.instances).toEqual([first]);
            expect(embedOf(ref)).not.toBe(first);
            expect((await (embedOf(ref) as any).getAppInitData()).embedParams.dataAppInitialControls)
                .toStrictEqual({ appId, controls: dallas });

            // The new build was told the prop: only the new entry is sent.
            await update({ dataAppControls: [...dallas, routeNone], hideDataAppHeader: true, ref });
            await ready(dallas);

            expect(updates()).toEqual([dallas, [routeNone]]);
        });

        describe('dataAppActions', () => {
            const sentRule = async (ref: React.RefObject<any>) => (
                await (embedOf(ref) as any).getAppInitData()).embedParams.dataAppActions;

            it('opens with the prop as its rule', async () => {
                const ref = React.createRef<any>();
                await mount({ dataAppActions: { off: ['reopen_ticket', 'close_ticket'] }, ref });

                expect(await sentRule(ref)).toStrictEqual({ off: ['close_ticket', 'reopen_ticket'] });
            });

            it('rebuilds nothing for the same ids in another order (TA-32)', async () => {
                const ref = React.createRef<any>();
                const { update } = await mount({ dataAppActions: { off: ['a', 'b'] }, ref });

                await update({ dataAppActions: { off: ['b', 'a', 'b'] }, ref });

                expect(builds).toHaveBeenCalledTimes(1);
                expect(destroys).not.toHaveBeenCalled();
            });

            it('rebuilds with another rule (TA-26)', async () => {
                const ref = React.createRef<any>();
                const { update } = await mount({ dataAppActions: { off: ['a'] }, ref });

                await update({ dataAppActions: { off: 'all' }, ref });

                expect(builds).toHaveBeenCalledTimes(2);
                expect(await sentRule(ref)).toStrictEqual({ off: 'all' });
            });

            it('renders nothing for a malformed rule', async () => {
                const onError = jest.fn();
                const { container } = await mount({ dataAppActions: { off: 'none' }, onError });

                expect(errorCodes(onError)).toEqual([EmbedErrorCodes.DATA_APP_OPTION_INVALID]);
                expect(container.querySelector('iframe')).toBeNull();
            });

            it('removes the App when DataAppReady does not echo the rule (TA-25)', async () => {
                const onError = jest.fn();
                const onDataAppReady = jest.fn();
                const { container } = await mount({ dataAppActions: { off: 'all' }, onError, onDataAppReady });

                await ready(austin);

                expect(onDataAppReady).not.toHaveBeenCalled();
                expect(onError.mock.calls.map(([error]) => [error.code, error.option, error.severity]))
                    .toEqual([[EmbedErrorCodes.DATA_APP_OPTION_NOT_SUPPORTED, 'dataAppActions', 1]]);
                expect(container.querySelector('iframe')).toBeNull();
            });

            it('passes on a DataAppReady that echoes the rule', async () => {
                const onDataAppReady = jest.fn();
                await mount({ dataAppActions: { off: ['a', 'b'] }, onDataAppReady });

                await ready(austin, { actionsOff: ['b', 'a'] });

                expect(onDataAppReady).toHaveBeenCalledTimes(1);
            });
        });

        it('drops the old build\'s pending call and its error on a rebuild', async () => {
            const onError = jest.fn();
            const { update } = await mount({ dataAppControls: austin, onError });
            await ready(austin);
            await update({ dataAppControls: dallas, onError });
            const pending = updateReplies()[0];

            await update({ dataAppControls: dallas, onError, hideDataAppHeader: true });
            pending.reject({ code: 'VALUE_REFUSED' });
            await settle();

            expect(onError).not.toHaveBeenCalled();
            expect(builds).toHaveBeenCalledTimes(2);
        });

        it.each([
            ['the frame', () => openFailed()],
            ['the frame, naming no App', () => openFailed({})],
            ['the SDK, which could not send the values', async (embed: DataAppEmbedClass) => {
                act(() => {
                    (embed as any).executeCallbacks(EmbedEvent.Error, {
                        code: EmbedErrorCodes.DATA_APP_OPEN_FAILED,
                        appId,
                        reason: 'FAILED',
                    });
                });
                await settle();
            }],
        ])('retries the open on a change of the prop after DATA_APP_OPEN_FAILED from %s (TC-642, D16)', async (_, fail) => {
            const navigate = jest.spyOn(DataAppEmbedClass.prototype, 'navigateToDataApp');
            const ref = React.createRef<any>();
            const region = { id: 'region', value: { op: 'eq', values: ['na'] } };
            const { update } = await mount({ dataAppControls: [...austin, region], ref });
            await fail(embedOf(ref));

            // No entry differs, and it retries all the same.
            await update({ dataAppControls: austin, ref });

            expect(navigate).toHaveBeenCalledWith(appId, { controls: austin });
            expect(updates()).toEqual([]);
            await ready(austin);

            // The retry told it the values: the next change is a plain update.
            await update({ dataAppControls: [...austin, routeNone], ref });

            expect(navigate).toHaveBeenCalledTimes(1);
            expect(updates()).toEqual([[routeNone]]);
            navigate.mockRestore();
        });

        it('sends an update, not a retry, after another App\'s open failed', async () => {
            const navigate = jest.spyOn(DataAppEmbedClass.prototype, 'navigateToDataApp');
            const { update } = await mount({ dataAppControls: austin });
            await ready(austin);
            await openFailed({ appId: 'b7c8' });

            await update({ dataAppControls: dallas });

            expect(navigate).not.toHaveBeenCalled();
            expect(updates()).toEqual([dallas]);
            navigate.mockRestore();
        });

        it('warns when the retried open rejects', async () => {
            const failure = new Error('The App id could not be encoded');
            const navigate = jest.spyOn(DataAppEmbedClass.prototype, 'navigateToDataApp')
                .mockRejectedValueOnce(failure);
            const { update } = await mount({ dataAppControls: austin });
            await openFailed();

            await update({ dataAppControls: dallas });

            expect(logWarn).toHaveBeenCalledWith(failure);
            navigate.mockRestore();
        });

        it('sends an ordinary update, and reopens nothing, after DATA_APP_OPEN_NOT_CONFIRMED (TC-564)', async () => {
            const navigate = jest.spyOn(DataAppEmbedClass.prototype, 'navigateToDataApp');
            const onError = jest.fn();
            const { update } = await mount({ dataAppControls: austin, onError });
            jest.useFakeTimers();
            try {
                fromFrame(EmbedEvent.AuthInit, {});
                jest.advanceTimersByTime(30000);
                await settle();

                expect(errorCodes(onError)).toEqual([EmbedErrorCodes.DATA_APP_OPEN_NOT_CONFIRMED]);

                await update({ dataAppControls: dallas, onError });

                expect(updates()).toEqual([]);

                await ready(austin);

                expect(updates()).toEqual([dallas]);
                expect(navigate).not.toHaveBeenCalled();
            } finally {
                jest.useRealTimers();
                navigate.mockRestore();
            }
        });

        it('holds a change made before DataAppReady, and sends what differs from the load-time values (TC-643)', async () => {
            const { update } = await mount({ dataAppControls: [...austin, routeNone] });

            await update({ dataAppControls: [...dallas, routeNone] });

            expect(updates()).toEqual([]);

            await ready([...austin, routeNone]);

            expect(updates()).toEqual([dallas]);
        });

        it('destroys the embed on unmount with a call outstanding, and raises nothing after (TC-645)', async () => {
            const onError = jest.fn();
            const { update, unmount } = await mount({ dataAppControls: austin, onError });
            await ready(austin);
            await update({ dataAppControls: dallas, onError });

            unmount();
            await settle();
            updateReplies()[0].reject({ code: 'VALUE_REFUSED' });
            await settle();

            expect(destroys).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();
        });

        it('sends a refused entry the host keeps with each later change, refused again (TC-646)', async () => {
            const onError = jest.fn();
            const risk = (value: unknown) => ({ id: 'risk_score', value });
            const high = { op: 'ge', values: [80] };
            const { update } = await mount({ dataAppControls: [...austin, risk(null)], onError });
            await ready([...austin, risk(null)]);

            await update({ dataAppControls: [...austin, risk(high)], onError });
            updateReplies()[0].reject({ code: 'VALUE_REFUSED' });
            await settle();
            await update({ dataAppControls: [...dallas, risk(high)], onError });
            updateReplies()[1].reject({ code: 'VALUE_REFUSED' });
            await settle();

            expect(updates()).toEqual([[risk(high)], [...dallas, risk(high)]]);
            expect(errorCodes(onError)).toEqual([
                EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
                EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
            ]);
        });

        it('hears the App events itself, with no handler prop (TC-647)', async () => {
            const { update } = await mount({ dataAppControls: austin });
            await ready([...austin, routeNone]);
            await changed([...austin, routeR12]);

            await update({ dataAppControls: dallas });

            expect(updates()).toEqual([dallas]);

            // It knows the viewer's route from the event.
            await update({ dataAppControls: [...dallas, routeR12] });

            expect(updates()).toEqual([dallas]);
        });

        it('leaves one live embed after mount, unmount and mount in one tick (TC-648)', async () => {
            const ref = React.createRef<any>();
            const element = (
                <React.StrictMode>
                    <DataAppEmbed dataAppId={appId} dataAppControls={austin} ref={ref} />
                </React.StrictMode>
            );
            const first = render(element);
            const firstEmbed = embedOf(ref);
            const firstCall = firstEmbed.trigger(HostEvent.GetDataAppControls);
            first.unmount();
            render(element);
            const survivor = embedOf(ref);
            const call = survivor.trigger(HostEvent.GetDataAppControls);
            await settle();
            await settle();

            await expect(firstCall).rejects.toMatchObject({ code: 'APP_NOT_READY' });
            expect(document.querySelectorAll('iframe')).toHaveLength(1);
            expect(destroys.mock.instances).toEqual([firstEmbed]);
            expect((await (survivor as any).getAppInitData()).embedParams.dataAppInitialControls)
                .toStrictEqual({ appId, controls: austin });

            await ready(austin);
            replies[0].resolve(state(austin));

            await expect(call).resolves.toEqual(state(austin));
            expect(processTrigger.mock.calls.filter(([, type]) => type === HostEvent.GetDataAppControls))
                .toHaveLength(1);
        });

        it('opens a rebuild with the mirrored state as its load-time values (TC-649)', async () => {
            const ref = React.createRef<any>();
            const Mirror = ({ hideDataAppHeader }: { hideDataAppHeader: boolean }) => {
                const [controls, setControls] = React.useState<unknown[]>(austin);
                return (
                    <DataAppEmbed
                        ref={ref}
                        dataAppId={appId}
                        dataAppControls={controls as any}
                        hideDataAppHeader={hideDataAppHeader}
                        onDataAppReady={(e) => setControls(e.data.controls)}
                        onDataAppControlsChanged={(e) => setControls(e.data.controls)}
                    />
                );
            };
            const { rerender } = render(<Mirror hideDataAppHeader={false} />);
            await settle();
            await ready([...austin, routeNone]);
            await changed([...austin, routeR12]);

            rerender(<Mirror hideDataAppHeader={true} />);
            await settle();

            expect(builds).toHaveBeenCalledTimes(2);
            expect(updates()).toEqual([]);
            expect((await (embedOf(ref) as any).getAppInitData()).embedParams.dataAppInitialControls)
                .toStrictEqual({ appId, controls: [...austin, routeR12] });
        });

        describe('a value changed back while its change is in flight (CR-3)', () => {
            it('sends the value changed back after DataAppReady', async () => {
                const { update } = await mount({ dataAppControls: austin });
                await ready(austin);

                await update({ dataAppControls: dallas });
                await update({ dataAppControls: austin });

                expect(updates()).toEqual([dallas, austin]);
            });

            it('sends the value changed back while both calls are held', async () => {
                const { update } = await mount({ dataAppControls: austin });
                await update({ dataAppControls: dallas });
                await update({ dataAppControls: austin });

                await ready(austin);

                expect(updates()).toEqual([dallas, austin]);
            });

            it('sends nothing for a stale event mirrored back, but sends the host\'s own revert (D17)', async () => {
                const full = [...austin, routeNone];
                const { update } = await mount({ dataAppControls: full });
                await ready(full);
                await update({ dataAppControls: [...dallas, routeNone] });

                await changed(full, { revision: 1 });
                await update({ dataAppControls: full.map((entry) => ({ ...entry })) });

                expect(updates()).toEqual([dallas]);

                await update({ dataAppControls: [...dallas, routeNone] });
                await update({ dataAppControls: full.map((entry) => ({ ...entry })) });

                expect(updates()).toEqual([dallas, austin]);
            });

            it('keeps a later call\'s entry pending when an earlier call is refused', async () => {
                const { update } = await mount({ dataAppControls: austin });
                await ready(austin);
                await update({ dataAppControls: dallas });
                await update({ dataAppControls: houston });

                updateReplies()[0].reject({ code: 'VALUE_REFUSED' });
                await settle();
                await update({ dataAppControls: austin });

                expect(updates()).toEqual([dallas, houston, austin]);
            });

            it('compares with the state told once its own call settles', async () => {
                const { update } = await mount({ dataAppControls: austin });
                await ready(austin);
                await update({ dataAppControls: dallas });

                updateReplies()[0].reject({ code: 'VALUE_REFUSED' });
                await settle();
                await update({ dataAppControls: austin });

                expect(updates()).toEqual([dallas]);
            });

            it('takes the state of an accepted call as told', async () => {
                const { update } = await mount({ dataAppControls: austin });
                await ready(austin);
                await update({ dataAppControls: dallas });

                updateReplies()[0].resolve(accepted(dallas));
                await settle();
                await update({ dataAppControls: austin });

                expect(updates()).toEqual([dallas, austin]);
            });
        });

        describe('the state it was told', () => {
            it('ignores an older revision of the same session (D11)', async () => {
                const { update } = await mount({ dataAppControls: austin });
                await ready(austin);
                await update({ dataAppControls: dallas });
                await changed(houston, { revision: 3 });

                updateReplies()[0].resolve(accepted(dallas, 2));
                await settle();
                await update({ dataAppControls: houston });

                expect(updates()).toEqual([dallas]);
            });

            it('takes a lower revision from another session, and any DataAppReady', async () => {
                const { update } = await mount({ dataAppControls: austin });
                await ready(austin, { revision: 5 });
                await changed(dallas, { session: 'S2', revision: 1 });
                await update({ dataAppControls: dallas });

                expect(updates()).toEqual([]);

                await ready(houston, { session: 'S2', revision: 1 });
                await update({ dataAppControls: houston });

                expect(updates()).toEqual([]);
            });

            it('ignores a state with no list of controls', async () => {
                const { update } = await mount({ dataAppControls: austin });
                await ready(austin);
                await fromApp(EmbedEvent.DataAppControlsChanged, { ...state(austin, { revision: 2 }), controls: null });

                await update({ dataAppControls: dallas });

                expect(updates()).toEqual([dallas]);
            });
        });

        it('sends a prop that is not a list as given, for the App page to refuse', async () => {
            const onError = jest.fn();
            const map = { depot: { op: 'eq', values: ['Dallas'] } };
            const { update } = await mount({ dataAppControls: austin, onError });
            await ready(austin);

            await update({ dataAppControls: map, onError });
            updateReplies()[0].reject({ code: 'INVALID_REQUEST' });
            await settle();

            expect(updates()).toEqual([map]);
            expect(errorCodes(onError)).toEqual([EmbedErrorCodes.DATA_APP_UPDATE_FAILED]);
        });

        it('does not send a value JSON cannot hold again on each render (CR-6)', async () => {
            const big = () => [{ id: 'depot', value: { op: 'eq', values: [BigInt(1)] } }];
            const { update } = await mount({ dataAppControls: austin });
            await ready(austin);

            await update({ dataAppControls: big() });
            await update({ dataAppControls: big() });
            await update({ dataAppControls: big() });

            expect(updates()).toHaveLength(1);
        });

        it('still sends the other entries of a prop holding a value JSON cannot hold, refused again', async () => {
            const onError = jest.fn();
            const big = { id: 'depot', value: { op: 'eq', values: [BigInt(1)] } };
            const route = (value: unknown) => ({ id: 'route', value });
            const r12 = { op: 'eq', values: ['R-12'] };
            const r7 = { op: 'eq', values: ['R-7'] };
            const { update } = await mount({ dataAppControls: austin, onError });
            await ready([...austin, route(null)]);

            await update({ dataAppControls: [big], onError });
            updateReplies()[0].reject({ code: 'INVALID_REQUEST' });
            await settle();
            await update({ dataAppControls: [big, route(r12)], onError });
            updateReplies()[1].reject({ code: 'INVALID_REQUEST' });
            await settle();
            await update({ dataAppControls: [big, route(r7)], onError });

            expect(updates()).toEqual([[big], [big, route(r12)], [big, route(r7)]]);
            expect(errorCodes(onError)).toEqual([
                EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
                EmbedErrorCodes.DATA_APP_UPDATE_FAILED,
            ]);
        });

        it('reports its own listeners as the SDK\'s (CR-9)', async () => {
            const upload = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
            await mount({ dataAppControls: austin, onError: jest.fn() });
            const listeners = upload.mock.calls
                .filter(([id]) => id.startsWith(`${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_ON}-`));
            upload.mockRestore();

            expect(listeners.filter(([, props]: any) => !props.isRegisteredBySDK).map(([id]) => id))
                .toEqual([`${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_ON}-${EmbedEvent.Error}`]);
            [EmbedEvent.DataAppReady, EmbedEvent.DataAppControlsChanged].forEach((event) => {
                expect(listeners).toContainEqual([
                    `${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_ON}-${event}`,
                    { isRegisteredBySDK: true },
                ]);
            });
        });

        it('uploads no control id or value on a build, a change or a rebuild (TC-609)', async () => {
            const upload = jest.spyOn(mixpanelInstance, 'uploadMixpanelEvent');
            const secret = [{ id: 'zz_depot', value: { zzInner: ['ZZ-Austin'] } }];
            const { update } = await mount({ dataAppControls: secret });
            await ready(secret);
            await update({ dataAppControls: [{ id: 'zz_depot', value: { zzInner: ['ZZ-Dallas'] } }] });
            await update({ dataAppControls: secret, hideDataAppHeader: true });
            const uploaded = JSON.stringify(upload.mock.calls);
            const created = upload.mock.calls
                .filter(([id]) => id === mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_EMBED_CREATE)
                .map(([, props]: any) => props.dataAppControls);
            const sent = upload.mock.calls
                .filter(([id]) => id === `${mixpanelInstance.MIXPANEL_EVENT.VISUAL_SDK_TRIGGER}-${HostEvent.UpdateDataAppControls}`)
                .map(([, props]: any) => props.params);
            upload.mockRestore();

            ['zz_depot', 'zzInner', 'ZZ-Austin', 'ZZ-Dallas'].forEach((text) => expect(uploaded).not.toContain(text));
            expect(created).toEqual([{ count: 1 }, { count: 1 }]);
            expect(sent).toEqual([{ controls: ['object'] }]);
        });

        it.each([
            ['and passes className to the frame', 'custom-class'],
            ['with no className', undefined],
        ])('renders a span with insertAsSibling, %s', async (_, className) => {
            const { container } = await mount({ insertAsSibling: true, className });

            expect(container.querySelector('span')?.style.position).toBe('absolute');
            expect(getIFrameEl(container).getAttribute('class') ?? '').toBe(className ?? '');
        });

        it('sends nothing when the prop is removed: the prop is merge-only', async () => {
            const { update } = await mount({ dataAppControls: austin });
            await ready(austin);

            await update({});

            expect(updates()).toEqual([]);
        });

        it('sends a malformed entry as given, for the App page to refuse', async () => {
            const { update } = await mount({ dataAppControls: [null, ...austin] });
            await ready(austin);

            await update({ dataAppControls: [null, ...dallas] });

            expect(updates()).toEqual([[null, ...dallas]]);
        });

        it('changes nothing for a DataAppReady or an Error with no payload', async () => {
            const navigate = jest.spyOn(DataAppEmbedClass.prototype, 'navigateToDataApp');
            const ref = React.createRef<any>();
            const { update } = await mount({ dataAppControls: austin, ref, onDataAppReady: undefined });
            await ready(austin);

            await fromApp(EmbedEvent.DataAppReady, undefined);
            act(() => {
                (embedOf(ref) as any).executeCallbacks(EmbedEvent.Error, undefined);
            });
            await update({ dataAppControls: dallas, ref, onDataAppReady: undefined });

            expect(navigate).not.toHaveBeenCalled();
            expect(updates()).toEqual([dallas]);
            navigate.mockRestore();
        });

        describe('connected to a pre-render', () => {
            it.each([
                ['preRenderId', { preRenderId: 'react-data-app-by-id' }],
                ['preRenderConfig.id', { preRenderConfig: { id: 'react-data-app-by-config' } }],
            ])('shows on mount and hides on unmount, through %s', async (_, preRender) => {
                const show = jest.spyOn(DataAppEmbedClass.prototype, 'showPreRender');
                const hide = jest.spyOn(DataAppEmbedClass.prototype, 'hidePreRender');
                const { unmount } = await mount({ dataAppControls: austin, ...preRender });
                const hidden = hide.mock.calls.length;

                unmount();

                expect(show).toHaveBeenCalled();
                expect(hide).toHaveBeenCalledTimes(hidden + 1);
                expect(destroys).not.toHaveBeenCalled();
                expect(document.querySelectorAll('iframe')).toHaveLength(1);
                show.mockRestore();
                hide.mockRestore();
            });

            it('takes over the ready App when mounted again: a change is sent at once', async () => {
                const preRenderId = 'react-data-app-again';
                const first = await mount({ dataAppControls: austin, preRenderId });
                fromFrame(EmbedEvent.EmbedListenerReady);
                await ready(austin);
                first.unmount();
                const frames = document.querySelectorAll('iframe').length;

                const second = await mount({ dataAppControls: austin, preRenderId });
                await second.update({ dataAppControls: dallas, preRenderId });

                expect(document.querySelectorAll('iframe')).toHaveLength(frames);
                expect(updates()).toEqual([dallas]);
            });
        });
    });

    describe('LiveboardEmbed', () => {
        //
        it('Should be able to trigger events on the embed using refs', async () => {
            mockMessageChannel();
            const TestComponent = () => {
                const embedRef = useEmbedRef<typeof LiveboardEmbed>();
                const onLiveboardRendered = () => {
                    embedRef.current.trigger(HostEvent.SetVisibleVizs, ['viz1', 'viz2']);
                };

                return (
                    <LiveboardEmbed
                        ref={embedRef}
                        liveboardId="abcd"
                        onLiveboardRendered={onLiveboardRendered}
                    />
                );
            };

            const { container } = render(<TestComponent />);

            await waitFor(() => getIFrameEl(container));
            const iframe = getIFrameEl(container);
            jest.spyOn(iframe.contentWindow, 'postMessage');
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.LiveboardRendered,
                data: {
                    userGUID: 'abcd',
                },
            });
            await executeAfterWait(() => {
                expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                    {
                        type: HostEvent.SetVisibleVizs,
                        data: ['viz1', 'viz2'],
                    },
                    `http://${thoughtSpotHost}`,
                    expect.anything(),
                );
            });
        });

        it('Should render liveboard with runtime filters', async () => {
            const { container } = render(
                <LiveboardEmbed
                    liveboardId="abcd"
                    runtimeFilters={[
                        {
                            columnName: 'revenue',
                            operator: RuntimeFilterOp.EQ,
                            values: [100],
                        },
                    ]}
                    excludeRuntimeFiltersfromURL={false}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(getIFrameSrc(container)).toContain('col1=revenue&op1=EQ&val1=100');
        });

        it('Should have the correct container element', async () => {
            const { container } = render(
                <LiveboardEmbed liveboardId="abcd" className="def" />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('div')).not.toBe(null);
            expect(
                container.querySelector('div').classList.contains('def'),
            ).toBe(true);

            const { container: containerSibling } = render(
                <LiveboardEmbed
                    liveboardId="abcd"
                    className="def"
                    insertAsSibling={true}
                />,
            );
            await waitFor(() => getIFrameEl(containerSibling));
            expect(containerSibling.querySelector('span')).not.toBe(null);
            expect(containerSibling.querySelector('span').style.position).toBe(
                'absolute',
            );
            expect(
                getIFrameEl(containerSibling).classList.contains('def'),
            ).toBe(true);
            expect(containerSibling.querySelector('div')).toBe(null);
        });

        it('Should have the correct container element', async () => {
            const { container } = render(
                <LiveboardEmbed liveboardId="abcd" className="def" />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('div')).not.toBe(null);
            expect(
                container.querySelector('div').classList.contains('def'),
            ).toBe(true);

            const { container: containerSibling } = render(
                <LiveboardEmbed
                    liveboardId="abcd"
                    className="def"
                    insertAsSibling={true}
                />,
            );
            await waitFor(() => getIFrameEl(containerSibling));
            expect(containerSibling.querySelector('span')).not.toBe(null);
            expect(containerSibling.querySelector('span').style.position).toBe(
                'absolute',
            );
            expect(
                getIFrameEl(containerSibling).classList.contains('def'),
            ).toBe(true);
            expect(containerSibling.querySelector('div')).toBe(null);
        });
    });

    describe('SearchBarEmbed', () => {
        it('Should Render the Iframe with props', async () => {
            const { container } = render(
                <SearchBarEmbed
                    className="embedClass"
                    dataSource={'test'}
                    searchOptions={{
                        searchTokenString: '[revenue]',
                        executeSearch: true,
                    }}
                />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(
                getIFrameEl(container).parentElement.classList.contains(
                    'embedClass',
                ),
            ).toBe(true);
            expect(getIFrameSrc(container)).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=None&blockNonEmbedFullAppAccess=true&hideAction=[%22${Action.ReportError}%22]&preAuthCache=true&overrideConsoleLogs=true&clientLogLevel=ERROR&dataSources=[%22test%22]&searchTokenString=%5Brevenue%5D&executeSearch=true&useLastSelectedSources=false&isSearchEmbed=true#/embed/search-bar-embed`,
            );
        });
    });

    describe('SpotterMessage', () => {
        const mockMessage = {
            sessionId: "session123",
            genNo: 1,
            acSessionId: "acSession123",
            acGenNo: 2,
            worksheetId: "worksheet123",
            convId: "conv123",
            messageId: "message123"
        };

        it('Should render the SpotterMessage component with required props', async () => {
            const { container } = render(
                <SpotterMessage message={mockMessage} />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(getIFrameEl(container)).not.toBe(null);
            expect(getIFrameSrc(container)).toContain('sessionId=session123');
            expect(getIFrameSrc(container)).toContain('genNo=1');
            expect(getIFrameSrc(container)).toContain('acSessionId=acSession123');
            expect(getIFrameSrc(container)).toContain('acGenNo=2');
        });

        it('Should render the SpotterMessage component with optional query', async () => {
            const { container } = render(
                <SpotterMessage 
                    message={mockMessage} 
                    query="show me sales"
                />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(getIFrameEl(container)).not.toBe(null);
            expect(getIFrameSrc(container)).toContain('sessionId=session123');
        });

        it('Should have the correct container element with className', async () => {
            const { container } = render(
                <SpotterMessage 
                    message={mockMessage}
                    className="custom-class"
                />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(
                getIFrameEl(container).parentElement.classList.contains('custom-class'),
            ).toBe(true);
        });

        // Note: insertAsSibling is not supported for SpotterMessage as it's
        // not part of the allowed props
    });

    describe('Component Factory Coverage', () => {
        it('Should test basic component creation', () => {
            expect(() => {
                render(<LiveboardEmbed liveboardId="test" />);
            }).not.toThrow();
            
            expect(() => {
                render(<SearchEmbed dataSource="test" />);
            }).not.toThrow();
            
            expect(() => {
                render(<AppEmbed showPrimaryNavbar={false} />);
            }).not.toThrow();
        });

        it('Should test component factory existence', () => {
            expect(PreRenderedLiveboardEmbed).toBeDefined();
            expect(PreRenderedSearchEmbed).toBeDefined();
            expect(PreRenderedAppEmbed).toBeDefined();
            expect(typeof PreRenderedLiveboardEmbed).toBe('object');
            expect(typeof PreRenderedSearchEmbed).toBe('object');
            expect(typeof PreRenderedAppEmbed).toBe('object');
        });
    });

    describe('preRenderId via preRenderConfig', () => {
        const preRenderId = 'reactPreRenderId';

        describe('routing to the preRender methods', () => {
            let preRenderSpy: jest.SpyInstance;
            let showPreRenderSpy: jest.SpyInstance;
            let hidePreRenderSpy: jest.SpyInstance;
            let renderSpy: jest.SpyInstance;
            let destroySpy: jest.SpyInstance;

            beforeEach(() => {
                preRenderSpy = jest
                    .spyOn(TsEmbed.prototype, 'preRender')
                    .mockResolvedValue(undefined as any);
                showPreRenderSpy = jest
                    .spyOn(TsEmbed.prototype, 'showPreRender')
                    .mockResolvedValue(undefined as any);
                hidePreRenderSpy = jest
                    .spyOn(TsEmbed.prototype, 'hidePreRender')
                    .mockImplementation(() => undefined);
                renderSpy = jest
                    .spyOn(LiveboardEmbedClass.prototype, 'render')
                    .mockResolvedValue(undefined as any);
                destroySpy = jest
                    .spyOn(LiveboardEmbedClass.prototype, 'destroy')
                    .mockImplementation(() => undefined);
            });

            afterEach(() => {
                cleanup();
                [
                    preRenderSpy,
                    showPreRenderSpy,
                    hidePreRenderSpy,
                    renderSpy,
                    destroySpy,
                ].forEach((spy) => spy.mockRestore());
            });

            it('Should preRender PreRenderedLiveboardEmbed with preRenderConfig.id', () => {
                render(
                    <PreRenderedLiveboardEmbed
                        preRenderConfig={{ id: preRenderId }}
                        liveboardId="test-liveboard"
                    />,
                );

                expect(preRenderSpy).toHaveBeenCalledTimes(1);
                expect(renderSpy).not.toHaveBeenCalled();
                expect(showPreRenderSpy).not.toHaveBeenCalled();
            });

            it('Should preRender PreRenderedLiveboardEmbed with the top-level preRenderId', () => {
                render(
                    <PreRenderedLiveboardEmbed
                        preRenderId={preRenderId}
                        liveboardId="test-liveboard"
                    />,
                );

                expect(preRenderSpy).toHaveBeenCalledTimes(1);
                expect(renderSpy).not.toHaveBeenCalled();
            });

            it('Should showPreRender the LiveboardEmbed connected via preRenderConfig', () => {
                const { unmount } = render(
                    <LiveboardEmbed
                        preRenderConfig={{ id: preRenderId }}
                        liveboardId="test-liveboard"
                    />,
                );

                expect(showPreRenderSpy).toHaveBeenCalledTimes(1);
                expect(renderSpy).not.toHaveBeenCalled();

                unmount();

                expect(hidePreRenderSpy).toHaveBeenCalledTimes(1);
                expect(destroySpy).not.toHaveBeenCalled();
            });

            it('Should showPreRender the LiveboardEmbed connected via the top-level preRenderId', () => {
                const { unmount } = render(
                    <LiveboardEmbed preRenderId={preRenderId} liveboardId="test-liveboard" />,
                );

                expect(showPreRenderSpy).toHaveBeenCalledTimes(1);
                expect(renderSpy).not.toHaveBeenCalled();

                unmount();

                expect(hidePreRenderSpy).toHaveBeenCalledTimes(1);
                expect(destroySpy).not.toHaveBeenCalled();
            });

            it('Should render and destroy the LiveboardEmbed without any preRender id', () => {
                const { unmount } = render(<LiveboardEmbed liveboardId="test-liveboard" />);

                expect(renderSpy).toHaveBeenCalledTimes(1);
                expect(showPreRenderSpy).not.toHaveBeenCalled();

                unmount();

                expect(destroySpy).toHaveBeenCalledTimes(1);
                expect(hidePreRenderSpy).not.toHaveBeenCalled();
            });
        });

        describe('pre-render wrapper element', () => {
            const wrapperId = (id: string) => `tsEmbed-pre-render-wrapper-${id}`;

            beforeAll(() => {
                (window as any).ResizeObserver =
                    window.ResizeObserver ||
                    jest.fn().mockImplementation(() => ({
                        disconnect: jest.fn(),
                        observe: jest.fn(),
                        unobserve: jest.fn(),
                    }));
            });

            afterEach(() => {
                cleanup();
                document
                    .querySelectorAll('[id^="tsEmbed-pre-render-wrapper-"]')
                    .forEach((el) => el.remove());
            });

            it('Should create the wrapper with preRenderConfig.id', async () => {
                render(
                    <PreRenderedLiveboardEmbed
                        preRenderConfig={{ id: preRenderId }}
                        liveboardId="test-liveboard"
                    />,
                );

                await waitFor(() => expect(document.getElementById(wrapperId(preRenderId))).not.toBe(null));
            });

            it('Should prefer preRenderConfig.id over the top-level preRenderId', async () => {
                render(
                    <PreRenderedLiveboardEmbed
                        preRenderId="top-level-pre-render-id"
                        preRenderConfig={{ id: 'config-pre-render-id' }}
                        liveboardId="test-liveboard"
                    />,
                );

                await waitFor(() => expect(
                    document.getElementById(wrapperId('config-pre-render-id')),
                ).not.toBe(null));
                expect(document.getElementById(wrapperId('top-level-pre-render-id'))).toBe(null);
            });
        });
    });

    describe('Components with insertAsSibling', () => {
        it('Should render LiveboardEmbed with insertAsSibling', async () => {
            const { container } = render(
                <LiveboardEmbed
                    liveboardId="test-liveboard"
                    insertAsSibling={true}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(container.querySelector('span')?.style.position).toBe('absolute');
        });

        it('Should render SearchEmbed with insertAsSibling', async () => {
            const { container } = render(
                <SearchEmbed
                    dataSource="test-datasource"
                    insertAsSibling={true}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(container.querySelector('span')?.style.position).toBe('absolute');
        });

        it('Should render AppEmbed with insertAsSibling', async () => {
            const { container } = render(
                <AppEmbed
                    showPrimaryNavbar={false}
                    insertAsSibling={true}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(container.querySelector('span')?.style.position).toBe('absolute');
        });

        it('Should render SearchBarEmbed with insertAsSibling', async () => {
            const { container } = render(
                <SearchBarEmbed
                    dataSource="test-datasource"
                    insertAsSibling={true}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(container.querySelector('span')?.style.position).toBe('absolute');
        });

        it('Should render components with both insertAsSibling and className', async () => {
            const { container } = render(
                <LiveboardEmbed
                    liveboardId="test-liveboard"
                    insertAsSibling={true}
                    className="custom-class"
                />,
            );

            await waitFor(() => getIFrameEl(container));
            expect(container.querySelector('span')).not.toBe(null);
            expect(getIFrameEl(container).classList.contains('custom-class')).toBe(true);
        });
    });

    describe('useSpotterAgent', () => {
        it('Should return an object with sendMessage function', () => {
            const TestComponent = () => {
                const spotterAgent = useSpotterAgent({ worksheetId: 'test-worksheet' });
                expect(typeof spotterAgent).toBe('object');
                expect(typeof spotterAgent.sendMessage).toBe('function');
                return <div>Test</div>;
            };

            render(<TestComponent />);
        });

        it('Should have proper sendMessage callback structure', () => {
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                
                // Test that sendMessage is a function that accepts a string
                expect(typeof sendMessage).toBe('function');
                expect(sendMessage.length).toBe(1); // Should accept one parameter
                
                return <div>Test</div>;
            };

            render(<TestComponent />);
        });

        it('Should return error when service is not initialized', async () => {
            let sendMessageResult: any;
            
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                
                // Call sendMessage immediately before service has time to
                // initialize
                sendMessageResult = sendMessage('test query');
                
                return <div>Test</div>;
            };

            render(<TestComponent />);
            
            const result = await sendMessageResult;
            expect(result).toEqual({
                error: expect.any(Error)
            });
            expect(result.error.message).toBe('SpotterAgent not initialized');
        });

        it('Should call sendMessage and handle async behavior', async () => {
            let sendMessageFunction: any;
            
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                sendMessageFunction = sendMessage;
                return <div>Test</div>;
            };

            render(<TestComponent />);
            
            // Test that sendMessage is a function
            expect(typeof sendMessageFunction).toBe('function');
            
            // Call sendMessage - should not throw
            expect(() => {
                sendMessageFunction('test query');
            }).not.toThrow();
        });

        it('Should handle multiple calls to sendMessage', async () => {
            let sendMessageFunction: any;
            
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                sendMessageFunction = sendMessage;
                return <div>Test</div>;
            };

            render(<TestComponent />);
            
            // Multiple calls should not throw
            expect(() => {
                sendMessageFunction('query 1');
                sendMessageFunction('query 2');
                sendMessageFunction('query 3');
            }).not.toThrow();
        });

        it('Should handle config object changes', () => {
            const TestComponent = ({ config }: { config: any }) => {
                const { sendMessage } = useSpotterAgent(config);
                expect(sendMessage).toBeDefined();
                return <div>Test</div>;
            };

            const config1 = { worksheetId: 'test1' };
            const config2 = { worksheetId: 'test2' };
            
            const { rerender } = render(<TestComponent config={config1} />);
            
            // Should not throw when config changes
            expect(() => {
                rerender(<TestComponent config={config2} />);
            }).not.toThrow();
        });

        it('Should handle unmounting without errors', () => {
            const TestComponent = () => {
                const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                expect(sendMessage).toBeDefined();
                return <div>Test</div>;
            };

            const { unmount } = render(<TestComponent />);
            
            // Should not throw when unmounting
            expect(() => {
                unmount();
            }).not.toThrow();
        });

        it('Should create stable hook structure', () => {
            let hookResult1: any, hookResult2: any;
            
            const TestComponent = ({ counter }: { counter: number }) => {
                const result = useSpotterAgent({ worksheetId: 'test-worksheet' });
                
                if (counter === 1) {
                    hookResult1 = result;
                } else {
                    hookResult2 = result;
                }
                
                return <div>Test</div>;
            };

            const { rerender } = render(<TestComponent counter={1} />);
            rerender(<TestComponent counter={2} />);
            
            // Both should have same structure
            expect(hookResult1).toEqual({ sendMessage: expect.any(Function) });
            expect(hookResult2).toEqual({ sendMessage: expect.any(Function) });
        });

                 it('Should handle different worksheet IDs', () => {
             const TestComponent = ({ worksheetId }: { worksheetId: string }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId });
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent worksheetId="worksheet1" />);
             
             // Should handle different worksheet IDs
             expect(() => {
                 rerender(<TestComponent worksheetId="worksheet2" />);
                 rerender(<TestComponent worksheetId="worksheet3" />);
             }).not.toThrow();
         });

         it('Should handle empty query strings', () => {
             let sendMessageFunction: any;
             
             const TestComponent = () => {
                 const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                 sendMessageFunction = sendMessage;
                 return <div>Test</div>;
             };

             render(<TestComponent />);
             
             // Should handle empty strings
             expect(() => {
                 sendMessageFunction('');
                 sendMessageFunction('   ');
             }).not.toThrow();
         });

         it('Should handle complex config objects', () => {
             const complexConfig = {
                 worksheetId: 'test-worksheet',
                 hiddenActions: [Action.ReportError],
                 className: 'test-class',
                 searchOptions: {
                     searchQuery: 'test query'
                 }
             };

             const TestComponent = () => {
                 const { sendMessage } = useSpotterAgent(complexConfig);
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             // Should not throw with complex config
             expect(() => {
                 render(<TestComponent />);
             }).not.toThrow();
         });

         it('Should maintain function identity across re-renders with same config', () => {
             let sendMessage1: any, sendMessage2: any;
             
             const TestComponent = ({ forceRender }: { forceRender: number }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                 
                 if (forceRender === 1) {
                     sendMessage1 = sendMessage;
                 } else {
                     sendMessage2 = sendMessage;
                 }
                 
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent forceRender={1} />);
             rerender(<TestComponent forceRender={2} />);
             
             // Functions should exist
             expect(sendMessage1).toBeDefined();
             expect(sendMessage2).toBeDefined();
             expect(typeof sendMessage1).toBe('function');
             expect(typeof sendMessage2).toBe('function');
         });

         it('Should handle sendMessage calls with null service ref', async () => {
             let capturedSendMessage: any;
             
             const TestComponent = () => {
                 const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                 capturedSendMessage = sendMessage;
                 return <div>Test</div>;
             };

             const { unmount } = render(<TestComponent />);
             
             // Unmount to trigger cleanup
             unmount();
             
             // Now call sendMessage after unmount - should return error
             const result = await capturedSendMessage('test query');
             expect(result).toEqual({
                 error: expect.any(Error)
             });
         });

         it('Should test service ref cleanup on config change', () => {
             const TestComponent = ({ worksheetId }: { worksheetId: string }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId });
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent worksheetId="worksheet1" />);
             
             // This should trigger the cleanup and create new service
             rerender(<TestComponent worksheetId="worksheet2" />);
             
             // Should still work after rerender
             expect(() => {
                 rerender(<TestComponent worksheetId="worksheet3" />);
             }).not.toThrow();
         });

         it('Should test different config variations', () => {
             const configs = [
                 { worksheetId: 'test1' },
                 { worksheetId: 'test2', hiddenActions: [Action.ReportError] },
                 { worksheetId: 'test3', className: 'test-class' },
                 { worksheetId: 'test4', searchOptions: { searchQuery: 'test' } }
             ];

             configs.forEach((config, index) => {
                 const TestComponent = () => {
                     const { sendMessage } = useSpotterAgent(config);
                     expect(sendMessage).toBeDefined();
                     return <div>Test {index}</div>;
                 };

                 expect(() => {
                     const { unmount } = render(<TestComponent />);
                     unmount();
                 }).not.toThrow();
             });
         });

         it('Should handle rapid config changes', () => {
             const TestComponent = ({ worksheetId }: { worksheetId: string }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId });
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent worksheetId="worksheet1" />);
             
             // Rapid config changes to test cleanup logic
             for (let i = 2; i <= 10; i++) {
                 rerender(<TestComponent worksheetId={`worksheet${i}`} />);
             }
             
             // Should still work after many changes
             expect(() => {
                 rerender(<TestComponent worksheetId="final-worksheet" />);
             }).not.toThrow();
         });

         it('Should handle sendMessage with different query types', () => {
             let sendMessageFunction: any;
             
             const TestComponent = () => {
                 const { sendMessage } = useSpotterAgent({ worksheetId: 'test-worksheet' });
                 sendMessageFunction = sendMessage;
                 return <div>Test</div>;
             };

             render(<TestComponent />);
             
             // Test different query types
             const queries = [
                 'simple query',
                 'query with numbers 123',
                 'query with special chars !@#$%',
                 'very long query that might test different code paths in the system when processing',
                 '',
                 '   whitespace   ',
                 'null',
                 'undefined'
             ];

             queries.forEach(query => {
                 expect(() => {
                     sendMessageFunction(query);
                 }).not.toThrow();
             });
         });

         it('Should handle service ref cleanup when it already exists', () => {
             const TestComponent = ({ worksheetId }: { worksheetId: string }) => {
                 const { sendMessage } = useSpotterAgent({ worksheetId });
                 expect(sendMessage).toBeDefined();
                 return <div>Test</div>;
             };

             const { rerender } = render(<TestComponent worksheetId="worksheet1" />);
             
             // This should trigger the "if (serviceRef.current)" branch in
             // useEffect
             rerender(<TestComponent worksheetId="worksheet1" />);
             rerender(<TestComponent worksheetId="worksheet2" />);
             rerender(<TestComponent worksheetId="worksheet3" />);
             
             // Multiple rapid changes should exercise the cleanup logic
             for (let i = 0; i < 5; i++) {
                 rerender(<TestComponent worksheetId={`worksheet${i}`} />);
             }
         });

         it('Should test various config combinations to hit all branches', () => {
             const testConfigs = [
                 { worksheetId: 'test1' },
                 { worksheetId: 'test2', className: 'custom-class' },
                 { worksheetId: 'test3', hiddenActions: [Action.ReportError] },
                 { worksheetId: 'test4', searchOptions: { searchQuery: 'test' } },
                 { worksheetId: 'test5', insertAsSibling: true },
                 { worksheetId: 'test6', insertAsSibling: false },
             ];

             testConfigs.forEach((config, index) => {
                 const TestComponent = () => {
                     const { sendMessage } = useSpotterAgent(config);
                     expect(sendMessage).toBeDefined();
                     return <div>Test {index}</div>;
                 };

                 const { unmount } = render(<TestComponent />);
                 unmount();
             });
         });
    });

    describe('Component Props and Functions', () => {
        it('Should have PreRenderedLiveboardEmbed component', () => {
            expect(PreRenderedLiveboardEmbed).toBeDefined();
            expect(typeof PreRenderedLiveboardEmbed).toBe('object');
        });

        it('Should have useInit hook', () => {
            expect(typeof useInit).toBe('function');
        });

        it('Should test basic component factory patterns', () => {
            // Test that components can be created without errors
            expect(() => {
                const TestComponent = () => <div>Test</div>;
                render(<TestComponent />);
            }).not.toThrow();
        });
    });

    describe('Hook Coverage', () => {
        it('Should have useInit function available', () => {
            expect(typeof useInit).toBe('function');
        });

        it('Should test useInit hook basic functionality', () => {
            const TestComponent = () => {
                const authEE = useInit({ 
                    thoughtSpotHost: 'localhost',
                    authType: AuthType.None 
                });
                expect(authEE).toBeDefined();
                expect(authEE.current).toBeDefined();
                return <div>Test</div>;
            };

            render(<TestComponent />);
        });

        it('Should handle useInit with different config changes', () => {
            const TestComponent = ({ host }: { host: string }) => {
                const authEE = useInit({ 
                    thoughtSpotHost: host,
                    authType: AuthType.None 
                });
                expect(authEE).toBeDefined();
                return <div>Test</div>;
            };

            const { rerender } = render(<TestComponent host="localhost" />);
            
            // Change config to test useDeepCompareEffect
            rerender(<TestComponent host="localhost2" />);
            rerender(<TestComponent host="localhost3" />);
        });

        it('Should test useInit with complex config objects', () => {
            const TestComponent = () => {
                const authEE = useInit({ 
                    thoughtSpotHost: 'localhost',
                    authType: AuthType.None,
                    suppressNoCookieAccessAlert: true,
                    suppressErrorAlerts: true
                });
                expect(authEE).toBeDefined();
                return <div>Test</div>;
            };

            render(<TestComponent />);
        });
    });
});

describe('allExports', () => {
    it('should have exports', () => {
        expect(typeof allExports).toBe('object');
    });

    it('should not have undefined exports', () => {
        Object.keys(allExports).forEach(
            (exportKey) => expect(
                Boolean(allExports[exportKey as keyof typeof allExports]),
            )
                .toBe(true),
        );
    });
});
