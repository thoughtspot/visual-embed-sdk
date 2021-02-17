import { AppEmbed, AppViewConfig, Page } from './app';
import { init } from '../index';
import { Action, AuthType, RuntimeFilterOp } from '../types';
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

const cleanUp = () => {
    document.body.innerHTML = getDocumentBody();
};

describe('App embed tests', () => {
    beforeEach(() => {
        cleanUp();
    });

    test('should render home page by default', () => {
        const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
        appEmbed.render({});
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true#/home`,
        );
    });

    test('should hide the primary nav bar', () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hidePrimaryNavbar: false,
        } as AppViewConfig);
        appEmbed.render({});
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false#/home`,
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

        const pageIds = Object.keys(pageRouteMap);
        pageIds.forEach((pageId) => {
            const route = pageRouteMap[pageId];
            const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
            appEmbed.render({
                pageId: pageId as Page,
            });
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true#/${route}`,
            );
            cleanUp();
        });
    });

    test('should apply runtime filters', () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hidePrimaryNavbar: false,
        } as AppViewConfig);
        appEmbed.render({
            runtimeFilters: [
                {
                    columnName: 'sales',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&**col1=sales&op1=EQ&val1=1000**#/home`,
        );
    });

    test('should disable and hide actions', () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            hidePrimaryNavbar: false,
            disabledActions: [Action.Save, Action.Update],
            disabledActionReason: 'Access denied',
            hiddenActions: [Action.Download],
        } as AppViewConfig);
        appEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false#/home?disableAction=save,update&disableHint=Access%20denied&hideAction=download`,
        );
    });
});
