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

    test('should render home page by default', () => {
        const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
        appEmbed.render({});
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true#/answer`,
        );
    });

    test('should render the correct routes for pages', () => {
        const pageRouteMap = {
            [Page.Search]: 'answer',
            [Page.Answers]: 'answers',
            [Page.Pinboards]: 'pinboards',
            [Page.Data]: 'data/tables',
            [Page.Home]: 'home',
        };

        for (let page in pageRouteMap) {
            const route = pageRouteMap[page];
            const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
            appEmbed.render({
                pageId: page as Page,
            });
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true#/${route}`,
            );
        }
    });
});
