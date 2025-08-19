import { SpotterEmbed, SpotterEmbedViewConfig, ConversationEmbed } from './conversation';
import { TsEmbed } from './ts-embed';
import * as authInstance from '../auth';
import { Action, init } from '../index';
import { AuthType, Param, RuntimeFilterOp } from '../types';
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

describe('ConversationEmbed', () => {
    it('should render the conversation embed', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with worksheets disabled', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            disableSourceSelection: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&disableSourceSelection=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with spotter limitations text if flag is set', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            showSpotterLimitations: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&showSpotterLimitations=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with sample questions hidden', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            hideSampleQuestions: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&hideSampleQuestions=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with worksheets hidden', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            hideSourceSelection: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&hideSourceSelection=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should handle error when worksheetId is not provided', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: '',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        (conversationEmbed as any).handleError = jest.fn();
        await conversationEmbed.render();
        expect((conversationEmbed as any).handleError).toHaveBeenCalledWith(
            ERROR_MESSAGE.SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND,
        );
    });

    it('should render the conversation embed if data panel v2 flag is true', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            dataPanelV2: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&enableDataPanelV2=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with hidden actions of InConversationTraining if set', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            dataPanelV2: true,
            hiddenActions: [Action.InConversationTraining]
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&hideAction=[%22${Action.ReportError}%22,%22${Action.InConversationTraining}%22]&isSpotterExperienceEnabled=true&enableDataPanelV2=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with disabled actions of InConversationTraining if set', async () => {
        const disabledReason = 'testing disabled reason';
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            dataPanelV2: true,
            disabledActions: [Action.InConversationTraining],
            disabledActionReason: disabledReason,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&${Param.DisableActions}=[%22${Action.InConversationTraining}%22]&${Param.DisableActionReason}=${disabledReason}&isSpotterExperienceEnabled=true&enableDataPanelV2=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with runtime filters', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            runtimeFilters: [
                {
                    columnName: 'revenue',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&col1=revenue&op1=EQ&val1=1000#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with runtime parameters', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            runtimeParameters: [
                {
                    name: 'Date Range',
                    value: '30',
                },
            ],
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&param1=Date%20Range&paramVal1=30#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with runtime parameters excluded from URL', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            runtimeParameters: [
                {
                    name: 'Date Range',
                    value: '30',
                },
                {
                    name: 'Region',
                    value: 'North America',
                },
            ],
            excludeRuntimeParametersfromURL: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with both runtime filters and parameters', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            runtimeParameters: [
                {
                    name: 'Date Range',
                    value: '30',
                },
            ],
            runtimeFilters: [
                {
                    columnName: 'revenue',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
            excludeRuntimeParametersfromURL: false,
            excludeRuntimeFiltersfromURL: false,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&col1=revenue&op1=EQ&val1=1000&param1=Date%20Range&paramVal1=30#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should ensure deprecated ConversationEmbed class maintains same functionality as SpotterEmbed', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            runtimeParameters: [
                {
                    name: 'Date Range',
                    value: '30',
                },
            ],
        };

        // Test with deprecated class
        const conversationEmbed = new ConversationEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();

        // Verify it generates the same URL structure as SpotterEmbed
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&param1=Date%20Range&paramVal1=30#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });
});
