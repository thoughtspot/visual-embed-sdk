import { SpotterEmbed, SpotterEmbedViewConfig, ConversationEmbed } from './conversation';
import { TsEmbed } from './ts-embed';
import * as authInstance from '../auth';
import { Action, init } from '../index';
import { AuthType, Param, RuntimeFilterOp, ErrorDetailsTypes, EmbedErrorCodes, EmbedEvent } from '../types';
import {
    getDocumentBody,
    getIFrameSrc,
    getIFrameEl,
    getRootEl,
    defaultParamsWithoutHiddenActions as defaultParams,
    expectUrlMatchesWithParams,
    expectUrlToHaveParamsWithValues,
    postMessageToParent,
    executeAfterWait,
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
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&disableSourceSelection=true&hideSourceSelection=true&enableDataPanelV2=true&showSpotterLimitations=true&hideSampleQuestions=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with tool response card branding hidden', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            spotterChatConfig: {
                hideToolResponseCardBranding: true,
            },
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&hideToolResponseCardBranding=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with custom tool response card branding label', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            spotterChatConfig: {
                toolResponseCardBrandingLabel: 'MyBrand',
            },
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&toolResponseCardBrandingLabel=MyBrand#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with spotterFileUploadEnabled', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            spotterFileUploadEnabled: true,
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&spotterFileUploadEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with spotterFileUploadFileTypes', async () => {
        const viewConfig: SpotterEmbedViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            spotterFileUploadFileTypes: { types: ['image/png', 'application/pdf'] },
        };

        const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlToHaveParamsWithValues(getIFrameSrc(), {
            spotterFileUploadFileTypes: JSON.stringify({ types: ['image/png', 'application/pdf'] }),
        });
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

    describe('spotter chat hiddenActions', () => {
        it.each([
            ['SpotterChatConnectorResources', Action.SpotterChatConnectorResources],
            ['SpotterChatConnectors', Action.SpotterChatConnectors],
            ['SpotterChatModeSwitcher', Action.SpotterChatModeSwitcher],
        ])('should render with hiddenActions for %s', async (_, action) => {
            const viewConfig: SpotterEmbedViewConfig = {
                worksheetId: 'worksheetId',
                searchOptions: { searchQuery: 'searchQuery' },
                hiddenActions: [action],
            };
            const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
            await conversationEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParams}&hideAction=[%22${Action.ReportError}%22,%22${action}%22]&isSpotterExperienceEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
            );
        });

        it('should render with multiple spotter chat actions hidden together', async () => {
            const viewConfig: SpotterEmbedViewConfig = {
                worksheetId: 'worksheetId',
                searchOptions: { searchQuery: 'searchQuery' },
                hiddenActions: [
                    Action.SpotterChatConnectorResources,
                    Action.SpotterChatConnectors,
                    Action.SpotterChatModeSwitcher,
                ],
            };
            const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
            await conversationEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParams}&hideAction=[%22${Action.ReportError}%22,%22${Action.SpotterChatConnectorResources}%22,%22${Action.SpotterChatConnectors}%22,%22${Action.SpotterChatModeSwitcher}%22]&isSpotterExperienceEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
            );
        });
    });

    describe('spotter chat disabledActions', () => {
        it.each([
            ['SpotterChatConnectorResources', Action.SpotterChatConnectorResources],
            ['SpotterChatConnectors', Action.SpotterChatConnectors],
            ['SpotterChatModeSwitcher', Action.SpotterChatModeSwitcher],
        ])('should render with disabledActions for %s', async (_, action) => {
            const disabledReason = 'testing disabled reason';
            const viewConfig: SpotterEmbedViewConfig = {
                worksheetId: 'worksheetId',
                searchOptions: { searchQuery: 'searchQuery' },
                disabledActions: [action],
                disabledActionReason: disabledReason,
            };
            const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
            await conversationEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParams}&${Param.DisableActions}=[%22${action}%22]&${Param.DisableActionReason}=${disabledReason}&isSpotterExperienceEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
            );
        });

        it('should render with multiple spotter chat actions disabled together', async () => {
            const disabledReason = 'not available';
            const viewConfig: SpotterEmbedViewConfig = {
                worksheetId: 'worksheetId',
                searchOptions: { searchQuery: 'searchQuery' },
                disabledActions: [
                    Action.SpotterChatConnectorResources,
                    Action.SpotterChatConnectors,
                    Action.SpotterChatModeSwitcher,
                ],
                disabledActionReason: disabledReason,
            };
            const conversationEmbed = new SpotterEmbed(getRootEl(), viewConfig);
            await conversationEmbed.render();
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParams}&${Param.DisableActions}=[%22${Action.SpotterChatConnectorResources}%22,%22${Action.SpotterChatConnectors}%22,%22${Action.SpotterChatModeSwitcher}%22]&${Param.DisableActionReason}=${disabledReason}&isSpotterExperienceEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
            );
        });
    });

});

describe('SpotterEmbed APP_INIT embedParams', () => {
    const mockEmbedEventPayload = { type: EmbedEvent.APP_INIT, data: {} };

    async function getAppInitResponse(viewConfig: SpotterEmbedViewConfig) {
        const embed = new SpotterEmbed(getRootEl(), viewConfig);
        embed.render();
        const mockPort: any = { postMessage: jest.fn() };
        await executeAfterWait(() => {
            postMessageToParent(getIFrameEl().contentWindow, mockEmbedEventPayload, mockPort);
        });
        await executeAfterWait(() => {});
        return mockPort.postMessage.mock.calls[0]?.[0];
    }

    it('should include spotterSidebarConfig in embedParams when spotterSidebarConfig is provided', async () => {
        const response = await getAppInitResponse({
            worksheetId: 'ws1',
            spotterSidebarConfig: {
                enablePastConversationsSidebar: true,
                spotterSidebarTitle: 'My Conversations',
                spotterSidebarDefaultExpanded: true,
            },
        });
        expect(response.data.embedParams.spotterSidebarConfig).toEqual({
            enablePastConversationsSidebar: true,
            spotterSidebarTitle: 'My Conversations',
            spotterSidebarDefaultExpanded: true,
        });
    });

    it('should populate enablePastConversationsSidebar from deprecated standalone flag', async () => {
        const response = await getAppInitResponse({
            worksheetId: 'ws1',
            enablePastConversationsSidebar: true,
        });
        expect(response.data.embedParams.spotterSidebarConfig).toEqual({
            enablePastConversationsSidebar: true,
        });
    });

    it('should use spotterSidebarConfig.enablePastConversationsSidebar over deprecated standalone flag', async () => {
        const response = await getAppInitResponse({
            worksheetId: 'ws1',
            enablePastConversationsSidebar: false,
            spotterSidebarConfig: {
                enablePastConversationsSidebar: true,
                spotterSidebarTitle: 'Chats',
            },
        });
        expect(response.data.embedParams.spotterSidebarConfig.enablePastConversationsSidebar).toBe(true);
        expect(response.data.embedParams.spotterSidebarConfig.spotterSidebarTitle).toBe('Chats');
    });

    it('should fall back to deprecated standalone flag when spotterSidebarConfig omits enablePastConversationsSidebar', async () => {
        const response = await getAppInitResponse({
            worksheetId: 'ws1',
            enablePastConversationsSidebar: true,
            spotterSidebarConfig: {
                spotterSidebarTitle: 'My Chats',
            },
        });
        expect(response.data.embedParams.spotterSidebarConfig.enablePastConversationsSidebar).toBe(true);
        expect(response.data.embedParams.spotterSidebarConfig.spotterSidebarTitle).toBe('My Chats');
    });

    it('should not include embedParams when neither spotterSidebarConfig nor standalone flag is set', async () => {
        const response = await getAppInitResponse({ worksheetId: 'ws1' });
        expect(response.data.embedParams).toBeUndefined();
    });

    it('should call handleError and exclude spotterDocumentationUrl from embedParams when URL is invalid', async () => {
        const embed = new SpotterEmbed(getRootEl(), {
            worksheetId: 'ws1',
            spotterSidebarConfig: { spotterDocumentationUrl: 'invalid-url' },
        });
        (embed as any).handleError = jest.fn();
        embed.render();
        const mockPort: any = { postMessage: jest.fn() };
        await executeAfterWait(() => {
            postMessageToParent(getIFrameEl().contentWindow, mockEmbedEventPayload, mockPort);
        });
        await executeAfterWait(() => {});
        expect((embed as any).handleError).toHaveBeenCalledWith(
            expect.objectContaining({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                code: EmbedErrorCodes.INVALID_URL,
            }),
        );
        expect(mockPort.postMessage.mock.calls[0]?.[0].data.embedParams?.spotterSidebarConfig?.spotterDocumentationUrl).toBeUndefined();
    });

});

