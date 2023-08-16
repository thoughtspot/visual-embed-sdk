import React from 'react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import {
    cleanup, fireEvent, render, waitFor,
} from '@testing-library/react';
import {
    Action, EmbedEvent, HostEvent, RuntimeFilterOp,
} from '../types';
import {
    executeAfterWait,
    getIFrameEl,
    getIFrameSrc,
    postMessageToParent,
    mockMessageChannel,
} from '../test/test-utils';
import {
    SearchEmbed, AppEmbed, LiveboardEmbed, useEmbedRef, SearchBarEmbed,
} from './index';
import * as allExports from './index';
import { AuthType, init } from '../index';

import { version } from '../../package.json';

const thoughtSpotHost = 'localhost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    spyOn(window, 'alert');
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
                `http://${thoughtSpotHost}/?hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=None&blockNonEmbedFullAppAccess=true&hideAction=[%22${Action.ReportError}%22,%22editACopy%22,%22saveAsView%22,%22updateTSL%22,%22editTSL%22,%22onDeleteAnswer%22]&enableDataPanelV2=false&dataSourceMode=hide&useLastSelectedSources=false&isSearchEmbed=true#/embed/answer`,
            );
        });

        it('Should attach event listeners', async (done) => {
            const userGUID = 'absfdfgd';
            const { container } = render(
                <SearchEmbed
                    onInit={(e) => {
                        expect(e.data).toHaveProperty('timestamp');
                    }}
                    onAuthInit={(e) => {
                        expect(e.data.userGUID).toEqual(userGUID);
                        done();
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

    describe('LiveboardEmbed', () => {
        //
        it('Should be able to trigger events on the embed using refs', async () => {
            mockMessageChannel();
            const TestComponent = () => {
                const embedRef = useEmbedRef();
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
                `http://${thoughtSpotHost}/?hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&authType=None&blockNonEmbedFullAppAccess=true&hideAction=[%22${Action.ReportError}%22]&dataSources=[%22test%22]&searchTokenString=%5Brevenue%5D&executeSearch=true&useLastSelectedSources=false&isSearchEmbed=true#/embed/search-bar-embed`,
            );
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
                Boolean(allExports[exportKey]),
            )
                .toBe(true),
        );
    });
});
