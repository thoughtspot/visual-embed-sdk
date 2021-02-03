import { AppEmbed, Page } from './app';
import { init } from '../index';
import { Action, AuthType } from '../types';
import { getDocumentBody, getIFrameSrc, getRootEl } from '../test/test-utils';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const thoughtSpotHost = 'tshost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('App embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render', () => {
        const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
        appEmbed.render({
            pageId: Page.Search,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/answer`,
        );
    });
});
