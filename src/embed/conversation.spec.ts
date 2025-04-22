import {
    SpotterEmbed,
    SpotterViewConfig,
} from './conversation';
import * as authInstance from '../auth';
import { init } from '../index';
import { AuthType } from '../types';
import {
    getDocumentBody,
    getIFrameSrc,
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
    jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve({}));
    spyOn(window, 'alert');
    document.body.innerHTML = getDocumentBody();
});

describe('SpotterEmbed', () => {
    it('should render the conversation embed', async () => {
            const viewConfig: SpotterViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
        };

        const spotterEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await spotterEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with worksheets disabled', async () => {
        const viewConfig: SpotterViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            disableSourceSelection: true,
        };

        const spotterEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await spotterEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&disableSourceSelection=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with spotter limitations text if flag is set', async () => {
        const viewConfig: SpotterViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            showSpotterLimitations: true,
        };

        const spotterEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await spotterEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&showSpotterLimitations=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with sample questions hidden', async () => {
        const viewConfig: SpotterViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            hideSampleQuestions: true,
        };

        const spotterEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await spotterEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&hideSampleQuestions=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with worksheets hidden', async () => {
        const viewConfig: SpotterViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            hideSourceSelection: true,
        };

        const spotterEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await spotterEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&hideSourceSelection=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should handle error when worksheetId is not provided', async () => {
        const viewConfig: SpotterViewConfig = {
            worksheetId: '',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
        };
        const spotterEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        (spotterEmbed as any).handleError = jest.fn();
        await spotterEmbed.render();
        expect((spotterEmbed as any).handleError).toHaveBeenCalledWith(
            ERROR_MESSAGE.SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND,
        );
    });

    it('should render the conversation embed if data panel v2 flag is true', async () => {
        const viewConfig: SpotterViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            dataPanelV2: true,
        };

        const spotterEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await spotterEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&enableDataPanelV2=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });
});
