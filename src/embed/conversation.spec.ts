import { SpotterEmbed, SpotterEmbedViewConfig, ConversationEmbed } from './conversation';
import { TsEmbed } from './ts-embed';
import * as authInstance from '../auth';
import { Action, init } from '../index';
import { AuthType, Param, RuntimeFilterOp, ErrorDetailsTypes, EmbedErrorCodes  } from '../types';
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
    jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
    jest.spyOn(window, 'alert');
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
            {
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND,
                code: EmbedErrorCodes.WORKSHEET_ID_NOT_FOUND,
                error: ERROR_MESSAGE.SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND,
            },
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
            hiddenActions: [Action.InConversationTraining],
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
            excludeRuntimeFiltersfromURL: false,
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
            excludeRuntimeParametersfromURL: false,
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

    it('should render the conversation embed with past conversations sidebar enabled', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            enablePastConversationsSidebar: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&enablePastConversationsSidebar=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with past conversations sidebar disabled', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            enablePastConversationsSidebar: false,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&enablePastConversationsSidebar=false#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with all boolean flags set', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            disableSourceSelection: true,
            hideSourceSelection: true,
            dataPanelV2: true,
            showSpotterLimitations: true,
            hideSampleQuestions: true,
            enablePastConversationsSidebar: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&disableSourceSelection=true&hideSourceSelection=true&enableDataPanelV2=true&showSpotterLimitations=true&hideSampleQuestions=true&enablePastConversationsSidebar=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
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
            excludeRuntimeParametersfromURL: false,
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

    it('should render the conversation embed with updated spotter chat prompt', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            updatedSpotterChatPrompt: true,
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&updatedSpotterChatPrompt=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with updated spotter chat prompt disabled', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            updatedSpotterChatPrompt: false,
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&updatedSpotterChatPrompt=false#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render with spotterSidebarTitle', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterSidebarTitle: 'My Conversations',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterSidebarTitle=My%20Conversations#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with spotterSidebarDefaultExpanded set to true', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterSidebarDefaultExpanded: true,
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterSidebarDefaultExpanded=true#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with spotterChatRenameLabel', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterChatRenameLabel: 'Edit Name',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterChatRenameLabel=Edit%20Name#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with spotterChatDeleteLabel', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterChatDeleteLabel: 'Remove',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterChatDeleteLabel=Remove#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with spotterDeleteConversationModalTitle', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterDeleteConversationModalTitle: 'Remove Conversation',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterDeleteConversationModalTitle=Remove%20Conversation#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with spotterPastConversationAlertMessage', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterPastConversationAlertMessage: 'Viewing past conversation',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterPastConversationAlertMessage=Viewing%20past%20conversation#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with spotterBestPracticesLabel', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterBestPracticesLabel: 'Help Tips',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterBestPracticesLabel=Help%20Tips#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with spotterConversationsBatchSize', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterConversationsBatchSize: 50,
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterConversationsBatchSize=50#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with spotterNewChatButtonTitle', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterNewChatButtonTitle: 'Start New Conversation',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterNewChatButtonTitle=Start%20New%20Conversation#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should render with valid spotterDocumentationUrl', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterDocumentationUrl: 'https://docs.example.com/spotter',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterDocumentationUrl=https%3A%2F%2Fdocs.example.com%2Fspotter#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });

    it('should handle error for invalid spotterDocumentationUrl', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterDocumentationUrl: 'invalid-url',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        (conversationEmbed as any).handleError = jest.fn();
        await conversationEmbed.render();
        expect((conversationEmbed as any).handleError).toHaveBeenCalledWith(
            expect.objectContaining({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                code: EmbedErrorCodes.INVALID_URL,
            }),
        );
    });

    it('should handle error for spotterDocumentationUrl with invalid protocol', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterDocumentationUrl: 'ftp://docs.example.com/spotter',
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        (conversationEmbed as any).handleError = jest.fn();
        await conversationEmbed.render();
        expect((conversationEmbed as any).handleError).toHaveBeenCalledWith(
            expect.objectContaining({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                code: EmbedErrorCodes.INVALID_URL,
            }),
        );
    });

    it('should render with multiple sidebar config options', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            spotterSidebarTitle: 'Chats',
            spotterSidebarDefaultExpanded: true,
            spotterNewChatButtonTitle: 'New',
            spotterConversationsBatchSize: 25,
        };
        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterSidebarDefaultExpanded=true&spotterSidebarTitle=Chats&spotterConversationsBatchSize=25&spotterNewChatButtonTitle=New#/embed/insights/conv-assist?worksheet=worksheetId&query=`,
        );
    });
});
