import React from 'react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import {
    getIFrameEl,
    getIFrameSrc,
    postMessageToParent,
} from '../test/test-utils';
import { SearchEmbed, AppEmbed, PinboardEmbed } from './index';
import { AuthType, init } from '../index';
import { EmbedEvent } from '../types';
import { version } from '../../package.json';

const thoughtSpotHost = 'localhost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('React Components', () => {
    describe('SearchEmbed', () => {
        it('Should Render the Iframe with props', async () => {
            const { container } = render(
                <SearchEmbed hideDataSources={true} />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(getIFrameSrc(container)).toBe(
                `http://${thoughtSpotHost}/?hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&dataSourceMode=hide&useLastSelectedSources=false#/embed/answer`,
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

    describe('PinboardEmbed', () => {
        //
    });
});
