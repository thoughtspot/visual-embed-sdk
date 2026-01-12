import {
    SearchEmbed,
    HiddenActionItemByDefaultForSearchEmbed,
    DataPanelCustomColumnGroupsAccordionState,
    SearchOptions,
} from './search';
import * as authInstance from '../auth';
import { init } from '../index';
import { Action, AuthType, EmbedEvent, RuntimeFilterOp } from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
    fixedEncodeURI,
    defaultParamsWithoutHiddenActions as defaultParams,
    expectUrlMatchesWithParams,
    getIFrameEl,
    postMessageToParent,
} from '../test/test-utils';
import { version } from '../../package.json';
import { SearchBarEmbed } from './search-bar';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const answerId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const thoughtSpotHost = 'tshost';
const hideBydefault = `&hideAction=${fixedEncodeURI(
    JSON.stringify([Action.ReportError, ...HiddenActionItemByDefaultForSearchEmbed]),
)}`;
const defaultParamsWithHiddenActions = defaultParams + hideBydefault;
const prefixParams = '&isSearchEmbed=true';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
    jest.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('Search embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
        jest.spyOn(authInstance, 'getReleaseVersion').mockReturnValue('7.4.0.sw');
    });

    test('should render', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&enableDataPanelV2=true&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/answer`,
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=hide&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should remove focus from search bar', async () => {
        const dataSources = ['data-source-1'];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
            dataSources,
            focusSearchBarOnRender: false,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParams}&dataSources=[%22data-source-1%22]&dataSourceMode=hide&useLastSelectedSources=false&focusSearchBarOnRender=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should add runtime filters', async () => {
        const dataSources = ['data-source-1'];
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
            dataSources,
            searchOptions,
            runtimeFilters: [
                {
                    columnName: 'city',
                    operator: RuntimeFilterOp.EQ,
                    values: ['berkeley'],
                },
            ],
            excludeRuntimeFiltersfromURL: false,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=hide&useLastSelectedSources=false${prefixParams}&col1=city&op1=EQ&val1=berkeley#/embed/answer`,
            );
        });
    });

    test('should not append runtime filters in URL if excludeRuntimeFiltersfromURL is true', async () => {
        const dataSources = ['data-source-1'];
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
            dataSources,
            searchOptions,
            runtimeFilters: [
                {
                    columnName: 'city',
                    operator: RuntimeFilterOp.EQ,
                    values: ['berkeley'],
                },
            ],
            excludeRuntimeFiltersfromURL: true,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=hide&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should not append runtime parameters in URL if excludeRuntimeFiltersfromURL is true', async () => {
        const dataSources = ['data-source-1'];
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
            dataSources,
            searchOptions,
            runtimeParameters: [
                {
                    name: 'city',
                    value: 'berkeley',
                },
            ],
            excludeRuntimeParametersfromURL: true,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=hide&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('should append runtime filters in URL if excludeRuntimeFiltersfromURL is undefined', async () => {
        const dataSources = ['data-source-1'];
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
            dataSources,
            searchOptions,
            runtimeFilters: [
                {
                    columnName: 'city',
                    operator: RuntimeFilterOp.EQ,
                    values: ['berkeley'],
                },
            ],
            excludeRuntimeFiltersfromURL: undefined,
        });
        searchEmbed.render();
        const runtimeFilter = 'col1=city&op1=EQ&val1=berkeley';
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&${runtimeFilter}&dataSources=[%22data-source-1%22]&searchTokenString=%5Bcommit%20date%5D%5Brevenue%5D&dataSourceMode=hide&useLastSelectedSources=false${prefixParams}#/embed/answer`,
            );
        });
    });

    test('Should add dataSource', async () => {
        const dataSource = 'data-source-1';
        const searchOptions = {
            searchTokenString: '[commit date][revenue]',
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
            dataSource,
            searchOptions,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
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
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParams}&disableAction=[%22downloadAsXLSX%22]&disableHint=Access%20denied&hideAction=${hideActionUrl}&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });

    test('should load saved answer', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            answerId,
            collapseSearchBarInitially: true,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&useLastSelectedSources=false&collapseSearchBarInitially=true${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });

    test('should set enableDataPanelV2 to false if data panel v2 flag is false', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            dataPanelV2: false,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&enableDataPanelV2=false&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });
    test('should set useLastSelectedSources to true if useLastSelectedSources flag is true', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            useLastSelectedSources: true,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=true${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });
    test('should set useLastSelectedSources to false if datasource is given irrespective of useLastSelectedSources', async () => {
        const dataSource = 'data-source-1';
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            useLastSelectedSources: true,
            dataSource,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });
    test('should set useLastSelectedSources to false if datasources are given irrespective of useLastSelectedSources', async () => {
        const dataSources = ['data-source-1'];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            useLastSelectedSources: true,
            dataSources,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSources=[%22data-source-1%22]&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });
    test('should set runtime parametere values in url params', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            runtimeParameters: [
                {
                    name: 'Integer Date Range',
                    value: 1,
                },
            ],
            excludeRuntimeParametersfromURL: false,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&useLastSelectedSources=false${prefixParams}&param1=Integer%20Date%20Range&paramVal1=1#/embed/saved-answer/${answerId}`,
            );
        });
    });
    test('should set hideSearchBar to true if hideSearchBar flag is true', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideSearchBar: true,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false&hideSearchBar=true${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });

    test('should set isThisPeriodInDateFiltersEnabled to true in url', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            isThisPeriodInDateFiltersEnabled: true,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false&isThisPeriodInDateFiltersEnabled=true${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });

    test('should set dataPanelCustomGroupsAccordionInitialState to EXPAND_FIRST when passed', async () => {
        const searchEmbed = new SearchBarEmbed(getRootEl() as any, {
            ...defaultViewConfig,
            // eslint-disable-next-line max-len
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParams}&useLastSelectedSources=false${prefixParams}#/embed/search-bar-embed`,
            );
        });
    });

    test('should set dataPanelCustomGroupsAccordionInitialState to EXPAND_FIRST when passed', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            // eslint-disable-next-line max-len
            dataPanelCustomGroupsAccordionInitialState:
                DataPanelCustomColumnGroupsAccordionState.EXPAND_FIRST,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false&dataPanelCustomGroupsAccordionInitialState=EXPAND_FIRST${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });

    test('with excludeSearchTokenStringFromURL, execute as false', async () => {
        const searchOptions: SearchOptions = {
            searchTokenString: '[commit date][revenue]',
            executeSearch: false,
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            searchOptions,
            excludeSearchTokenStringFromURL: true,
        });
        const mockEmbedEventPayload = {
            type: EmbedEvent.APP_INIT,
            data: {},
        };
        searchEmbed.render();

        const mockPort: any = {
            postMessage: jest.fn(),
        };
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
        });

        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });

        expect(getIFrameSrc().includes('searchTokenString')).toBeFalsy();
        expect(getIFrameSrc().includes('executeSearch')).toBeFalsy();

        expect(mockPort.postMessage).toHaveBeenCalledWith({
            type: EmbedEvent.APP_INIT,
            data: expect.objectContaining({
                searchOptions: {
                    searchTokenString: '[commit date][revenue]',
                },
            }),
        });
    });

    test('with excludeSearchTokenStringFromURL with execute true', async () => {
        const searchOptions: SearchOptions = {
            searchTokenString: '[commit date][revenue]',
            executeSearch: true,
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            searchOptions,
            excludeSearchTokenStringFromURL: true,
        });
        const mockEmbedEventPayload = {
            type: EmbedEvent.APP_INIT,
            data: {},
        };
        searchEmbed.render();

        const mockPort: any = {
            postMessage: jest.fn(),
        };
        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
        });

        expect(getIFrameSrc().includes('searchTokenString')).toBeFalsy();

        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&executeSearch=true&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });

        expect(mockPort.postMessage).toHaveBeenCalledWith({
            type: EmbedEvent.APP_INIT,
            data: expect.objectContaining({
                searchOptions: {
                    searchTokenString: '[commit date][revenue]',
                },
            }),
        });
    });

    test('without excludeSearchTokenStringFromURL with execute search as false', async () => {
        const searchOptions: SearchOptions = {
            searchTokenString: '[commit date][revenue]',
            executeSearch: false,
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            searchOptions,
            excludeSearchTokenStringFromURL: false,
        });
        searchEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false&searchTokenString=[commit date][revenue]${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });
    });

    test('without excludeSearchTokenStringFromURL with executeSearch as false', async () => {
        const searchOptions: SearchOptions = {
            searchTokenString: '[commit date][revenue]',
            executeSearch: false,
        };
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            searchOptions,
            excludeSearchTokenStringFromURL: false,
        });
        searchEmbed.render();

        await executeAfterWait(() => {
            expectUrlMatchesWithParams(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/v2/?${defaultParamsWithHiddenActions}&dataSourceMode=expand&enableDataPanelV2=true&useLastSelectedSources=false&searchTokenString=[commit date][revenue]${prefixParams}#/embed/saved-answer/${answerId}`,
            );
        });

        expect(getIFrameSrc().includes('executeSearch')).toBeFalsy();
    });
});

// Add these tests to src/embed/search.spec.ts

// ============================================
// SearchEmbed tests for uncovered lines 427, 430
// ============================================

// TEST 1: hideResults parameter (line 427)
test('should pass hideResult parameter when hideResults is true', async () => {
    const searchEmbed = new SearchEmbed(getRootEl(), {
        ...defaultViewConfig,
        hideResults: true,
    });
    searchEmbed.render();
    await executeAfterWait(() => {
        const iframeSrc = getIFrameSrc();
        expect(iframeSrc).toContain('hideResult=true');
    });
});

// TEST 2: forceTable parameter (line 430)
test('should pass forceTable parameter when forceTable is true', async () => {
    const searchEmbed = new SearchEmbed(getRootEl(), {
        ...defaultViewConfig,
        forceTable: true,
    });
    searchEmbed.render();
    await executeAfterWait(() => {
        const iframeSrc = getIFrameSrc();
        expect(iframeSrc).toContain('forceTable=true');
    });
});

describe('SearchBarEmbed tests', () => {
    test('should pass dataSources parameter when dataSources array is provided', async () => {
        const searchBarEmbed = new SearchBarEmbed(getRootEl() as any, {
            ...defaultViewConfig,
            dataSources: ['source-1', 'source-2'],
        });
        searchBarEmbed.render();
        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expect(iframeSrc).toContain('dataSources');
            expect(iframeSrc).toContain('source-1');
        });
    });

    test('should pass dataSource parameter when single dataSource is provided', async () => {
        const searchBarEmbed = new SearchBarEmbed(getRootEl() as any, {
            ...defaultViewConfig,
            dataSource: 'single-source-id',
        });
        searchBarEmbed.render();
        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expect(iframeSrc).toContain('dataSources');
            expect(iframeSrc).toContain('single-source-id');
        });
    });

    test('should pass searchTokenString and executeSearch when searchOptions provided', async () => {
        const searchBarEmbed = new SearchBarEmbed(getRootEl() as any, {
            ...defaultViewConfig,
            searchOptions: {
                searchTokenString: '[revenue][region]',
                executeSearch: true,
            },
        });
        searchBarEmbed.render();
        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expect(iframeSrc).toContain('searchTokenString');
            expect(iframeSrc).toContain('executeSearch=true');
        });
    });

    test('should set useLastSelectedSources to false when dataSource is provided', async () => {
        const searchBarEmbed = new SearchBarEmbed(getRootEl() as any, {
            ...defaultViewConfig,
            dataSource: 'my-source',
            useLastSelectedSources: true, // This should be overridden to false
        });
        searchBarEmbed.render();
        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expect(iframeSrc).toContain('useLastSelectedSources=false');
        });
    });

    test('should include searchOptions in APP_INIT when excludeSearchTokenStringFromURL is true', async () => {
        const searchOptions = {
            searchTokenString: '[quantity][product]',
            executeSearch: true,
        };
        const searchBarEmbed = new SearchBarEmbed(getRootEl() as any, {
            ...defaultViewConfig,
            searchOptions,
            excludeSearchTokenStringFromURL: true,
        });

        const mockEmbedEventPayload = {
            type: EmbedEvent.APP_INIT,
            data: {},
        };

        searchBarEmbed.render();

        const mockPort: any = {
            postMessage: jest.fn(),
        };

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, mockEmbedEventPayload, mockPort);
        });

        expect(getIFrameSrc().includes('searchTokenString')).toBeFalsy();

        await executeAfterWait(() => {
            expect(mockPort.postMessage).toHaveBeenCalledWith({
                type: EmbedEvent.APP_INIT,
                data: expect.objectContaining({
                    searchOptions: {
                        searchTokenString: '[quantity][product]',
                        executeSearch: true,
                    },
                }),
            });
        });
    });
});
