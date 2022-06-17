import React from 'react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Action, EmbedEvent, HostEvent } from '../types';
import {
    executeAfterWait,
    getIFrameEl,
    getIFrameSrc,
    postMessageToParent,
    mockMessageChannel,
} from '../test/test-utils';
import { SearchEmbed, AppEmbed, LiveboardEmbed, useEmbedRef } from './index';
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
                `http://${thoughtSpotHost}/?hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&hideAction=[%22${Action.ReportError}%22,%22editACopy%22,%22saveAsView%22,%22updateTSL%22,%22editTSL%22,%22onDeleteAnswer%22]&dataSourceMode=hide&useLastSelectedSources=false&isSearchEmbed=true#/embed/answer`,
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
                    embedRef.current.trigger(HostEvent.SetVisibleVizs, [
                        'viz1',
                        'viz2',
                    ]);
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
    });
});
