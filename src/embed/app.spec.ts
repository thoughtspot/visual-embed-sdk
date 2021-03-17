import { AppEmbed, AppViewConfig, Page } from './app';
import { init } from '../index';
import { Action, AuthType, RuntimeFilterOp } from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
} from '../test/test-utils';

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

    test('should render home page by default', async () => {
        const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true#/home`,
            );
        });
    });

    test('should hide the primary nav bar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false#/home`,
            );
        });
    });

    describe('should render the correct routes for pages', () => {
        /* eslint-disable no-loop-func */
        const pageRouteMap = {
            [Page.Search]: 'answer',
            [Page.Answers]: 'answers',
            [Page.Pinboards]: 'pinboards',
            [Page.Data]: 'data/tables',
            [Page.Home]: 'home',
        };

        const pageIds = Object.keys(pageRouteMap);
        for (let i = 0; i < pageIds.length; i++) {
            const pageId = pageIds[i];

            test(`${pageId}`, async () => {
                const route = pageRouteMap[pageId];
                const appEmbed = new AppEmbed(getRootEl(), {
                    ...defaultViewConfig,
                    pageId: pageId as Page,
                } as AppViewConfig);
                appEmbed.render();

                await executeAfterWait(() => {
                    expect(getIFrameSrc()).toBe(
                        `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true#/${route}`,
                    );
                    cleanUp();
                });
            });
        }
    });

    test('should navigate to a path', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            path: 'foo/bar',
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true#/foo/bar`,
            );
        });
    });

    test('should apply runtime filters', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
            runtimeFilters: [
                {
                    columnName: 'sales',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&col1=sales&op1=EQ&val1=1000#/home`,
            );
        });
    });

    test('should disable and hide actions', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
            disabledActions: [Action.Save, Action.Update],
            disabledActionReason: 'Access denied',
            hiddenActions: [Action.Download],
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false#/home?disableAction=save,update&disableHint=Access%20denied&hideAction=download`,
            );
        });
    });
});
