import { SearchEmbed, HiddenActionItemByDefaultForSearchEmbed } from './search';
import * as authInstance from '../auth';
import { init } from '../index';
import { Action, AuthType } from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
    fixedEncodeURI,
} from '../test/test-utils';
import { version } from '../../package.json';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const answerId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const thoughtSpotHost = 'tshost';
const defaultParams = `hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}`;
const hideBydefault = `&hideAction=${fixedEncodeURI(
    JSON.stringify([
        Action.ReportError,
        ...HiddenActionItemByDefaultForSearchEmbed,
    ]),
)}`;
const defaultParamsWithHiddenActions = defaultParams + hideBydefault;
const prefixParams = '&isSearchEmbed=true';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    spyOn(window, 'alert');
});

describe('Search embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
        jest.spyOn(authInstance, 'getReleaseVersion').mockReturnValue(
            '7.4.0.sw',
        );
    });

    test('should render', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should pass in data sources', async () => {
        const dataSources = ['data-source-1'];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            dataSources,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should pass in search query', async () => {
        const dataSources = ['data-source-1'];
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            dataSources,
            searchOptions,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should pass the search token string and executeSearch if present', async () => {
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };

        let searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            searchOptions,
        });

        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });

        searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            searchOptions: {
                ...searchOptions,
                executeSearch: true,
            },
        });

        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&executeSearch=true&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should collapse data sources', async () => {
        const dataSources = ['data-source-1'];
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            collapseDataSources: true,
            dataSources,
            searchOptions,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=collapse&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should hide data sources', async () => {
        const dataSources = ['data-source-1'];
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
            dataSources,
            searchOptions,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=hide&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should disable actions', async () => {
        const dataSources = ['data-source-1'];
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            disabledActions: [Action.Download, Action.Edit],
            disabledActionReason: 'Permission denied',
            dataSources,
            searchOptions,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParams}&disableAction=[%22download%22,%22edit%22]&disableHint=Permission%20denied${hideBydefault}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should enable search assist', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            enableSearchAssist: true,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&enableSearchAssist=true&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should hide actions', async () => {
        const hiddenActionsForSearch = [
            Action.DownloadAsCsv,
            Action.DownloadAsPdf,
            Action.DownloadAsXlsx,
        ];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            hiddenActions: hiddenActionsForSearch,
            ...defaultViewConfig,
            answerId,
        });
        searchEmbed.render();
        const hideActionUrl = fixedEncodeURI(
            JSON.stringify([
                Action.ReportError,
                ...hiddenActionsForSearch,
                ...HiddenActionItemByDefaultForSearchEmbed,
            ]),
        );
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParams}&hideAction=${hideActionUrl}&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });

    test('should disable and hide actions', async () => {
        const hiddenActionsForSearch = [Action.DownloadAsCsv];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            disabledActions: [Action.DownloadAsXlsx],
            hiddenActions: hiddenActionsForSearch,
            disabledActionReason: 'Access denied',
            ...defaultViewConfig,
            answerId,
        });
        searchEmbed.render();
        const hideActionUrl = fixedEncodeURI(
            JSON.stringify([
                Action.ReportError,
                ...hiddenActionsForSearch,
                ...HiddenActionItemByDefaultForSearchEmbed,
            ]),
        );
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParams}&disableAction=[%22downloadAsXLSX%22]&disableHint=Access%20denied&hideAction=${hideActionUrl}&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });

    test('should load saved answer', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            answerId,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });
});
