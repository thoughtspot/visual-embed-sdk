import {
    ConversationEmbed,
    ConversationViewConfig,
} from './conversation';
import * as authInstance from '../auth';
import { init } from '../index';
import { Action, AuthType, RuntimeFilterOp } from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
    fixedEncodeURI,
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

describe.skip('ConversationEmbed', () => {
    it('should render the conversation embed', async () => {
        const viewConfig: ConversationViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
        };

        const conversationEmbed = new ConversationEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with worksheets disabled', async () => {
        const viewConfig: ConversationViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            disableSourceSelection: true,
        };

        const conversationEmbed = new ConversationEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&disableSourceSelection=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should render the conversation embed with worksheets hidden', async () => {
        const viewConfig: ConversationViewConfig = {
            worksheetId: 'worksheetId',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
            hideSourceSelection: true,
        };

        const conversationEmbed = new ConversationEmbed(getRootEl(), viewConfig);
        await conversationEmbed.render();
        expectUrlMatchesWithParams(
            getIFrameSrc(),
            `http://${thoughtSpotHost}/v2/?${defaultParams}&isSpotterExperienceEnabled=true&hideSourceSelection=true#/embed/insights/conv-assist?worksheet=worksheetId&query=searchQuery`,
        );
    });

    it('should handle error when worksheetId is not provided', async () => {
        const viewConfig: ConversationViewConfig = {
            worksheetId: '',
            searchOptions: {
                searchQuery: 'searchQuery',
            },
        };
        const conversationEmbed = new ConversationEmbed(getRootEl(), viewConfig);
        (conversationEmbed as any).handleError = jest.fn();
        await conversationEmbed.render();
        expect((conversationEmbed as any).handleError).toHaveBeenCalledWith(
            ERROR_MESSAGE.SPOTTER_EMBED_WORKSHEED_ID_NOT_FOUND,
        );
    });
});
