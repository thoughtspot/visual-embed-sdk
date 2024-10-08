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
});
