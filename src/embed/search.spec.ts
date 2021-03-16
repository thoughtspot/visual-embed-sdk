import { SearchEmbed } from './search';
import { init } from '../index';
import { Action, AuthType } from '../types';
import { getDocumentBody, getIFrameSrc, getRootEl } from '../test/test-utils';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const answerId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const thoughtSpotHost = 'tshost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('Search embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {});
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSourceMode=expand&useLastSelectedSources=false`,
        );
    });

    test('should pass in data sources', () => {
        const dataSources = ['data-source-1'];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            dataSources,
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&dataSourceMode=expand&useLastSelectedSources=false`,
        );
    });

    test('should pass in search query', () => {
        const dataSources = ['data-source-1'];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            dataSources,
            searchQuery: '[commit date][revenue]',
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=expand&useLastSelectedSources=false`,
        );
    });

    test('should collapse data sources', () => {
        const dataSources = ['data-source-1'];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            collapseDataSources: true,
            dataSources,
            searchQuery: '[commit date][revenue]',
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=collapse&useLastSelectedSources=false`,
        );
    });

    test('should hide data sources', () => {
        const dataSources = ['data-source-1'];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
            dataSources,
            searchQuery: '[commit date][revenue]',
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=hide&useLastSelectedSources=false`,
        );
    });

    test('should disable actions', () => {
        const dataSources = ['data-source-1'];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            disabledActions: [Action.Download, Action.Edit],
            disabledActionReason: 'Permission denied',
            dataSources,
            searchQuery: '[commit date][revenue]',
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&disableAction=[%22download%22,%22edit%22]&disableHint=Permission%20denied&dataSourceMode=expand&useLastSelectedSources=false`,
        );
    });

    test('should enable search assist', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            enableSearchAssist: true,
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?enableSearchAssist=true&dataSourceMode=expand&useLastSelectedSources=false`,
        );
    });

    test('should hide actions', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            hiddenActions: [
                Action.DownloadAsCsv,
                Action.DownloadAsPdf,
                Action.DownloadAsXlsx,
            ],
            ...defaultViewConfig,
            answerId,
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/saved-answer/${answerId}?hideAction=[%22downloadAsCSV%22,%22downloadAsPdf%22,%22downloadAsXLSX%22]&dataSourceMode=expand&useLastSelectedSources=false`,
        );
    });

    test('should disable and hide actions', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            disabledActions: [Action.DownloadAsXlsx],
            hiddenActions: [Action.DownloadAsCsv],
            disabledActionReason: 'Access denied',
            ...defaultViewConfig,
            answerId,
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/saved-answer/${answerId}?disableAction=[%22downloadAsXLSX%22]&disableHint=Access%20denied&hideAction=[%22downloadAsCSV%22]&dataSourceMode=expand&useLastSelectedSources=false`,
        );
    });

    test('should load saved answer', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            answerId,
        });
        searchEmbed.render();
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/saved-answer/${answerId}?dataSourceMode=expand&useLastSelectedSources=false`,
        );
    });
});
