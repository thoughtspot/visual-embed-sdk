import { SearchEmbed } from './search';
import { init } from '../index';
import { Action, AuthType } from '../types';
import * as utils from '../utils';
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
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSourceMode=expand`,
        );
    });

    test('should pass in data sources', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        const dataSources = ['data-source-1'];
        searchEmbed.render({
            dataSources,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&dataSourceMode=expand`,
        );
    });

    test('should pass in search query', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        const dataSources = ['data-source-1'];
        searchEmbed.render({
            dataSources,
            searchQuery: '[commit date][revenue]',
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=expand`,
        );
    });

    test('should collapse data sources', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            collapseDataSources: true,
        });
        const dataSources = ['data-source-1'];
        searchEmbed.render({
            dataSources,
            searchQuery: '[commit date][revenue]',
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=collapse`,
        );
    });

    test('should hide data sources', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideDataSources: true,
        });
        const dataSources = ['data-source-1'];
        searchEmbed.render({
            dataSources,
            searchQuery: '[commit date][revenue]',
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=hide`,
        );
    });

    test('should disable actions', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            disabledActions: [Action.Download, Action.Edit],
            disabledActionReason: 'Permission denied',
        });
        const dataSources = ['data-source-1'];
        searchEmbed.render({
            dataSources,
            searchQuery: '[commit date][revenue]',
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&disableAction=download,edit&disableHint=Permission%20denied&dataSourceMode=expand`,
        );
    });

    test('should enable search assist', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            enableSearchAssist: true,
        });
        searchEmbed.render({});
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/answer?enableSearchAssist=true&dataSourceMode=expand`,
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
        });
        searchEmbed.render({
            answerId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/saved-answer/${answerId}?hideAction=downloadAsCSV,downloadAsPdf,downloadAsXLSX&dataSourceMode=expand`,
        );
    });

    test('should disable and hide actions', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            disabledActions: [Action.DownloadAsXlsx],
            hiddenActions: [Action.DownloadAsCsv],
            disabledActionReason: 'Access denied',
            ...defaultViewConfig,
        });
        searchEmbed.render({
            answerId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/saved-answer/${answerId}?disableAction=downloadAsXLSX&disableHint=Access%20denied&hideAction=downloadAsCSV&dataSourceMode=expand`,
        );
    });

    test('should load saved answer', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.render({
            answerId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/saved-answer/${answerId}?dataSourceMode=expand`,
        );
    });
});
