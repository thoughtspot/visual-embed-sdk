import { SearchEmbed } from './search';
import { init } from '../index';
import { Action, AuthType } from '../types';
import * as utils from '../utils';
import { getDocumentBody, getIFrameSrc, getRootEl } from '../test/test-utils';

const mockEmbedId = '123';
const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const answerId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const thoughtSpotHost = 'tshost';

jest.spyOn(utils, 'id').mockImplementation(() => mockEmbedId);

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
            `http://${thoughtSpotHost}/v2/#/embed/${mockEmbedId}/answer?dataSourceMode=expand`,
        );
    });

    test('should pass in data sources', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        const dataSources = ['data-source-1'];
        searchEmbed.render({
            dataSources,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/${mockEmbedId}/answer?dataSources=[%22data-source-1%22]&dataSourceMode=expand`,
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
            `http://${thoughtSpotHost}/v2/#/embed/${mockEmbedId}/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=expand`,
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
            `http://${thoughtSpotHost}/v2/#/embed/${mockEmbedId}/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=collapse`,
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
            `http://${thoughtSpotHost}/v2/#/embed/${mockEmbedId}/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=hide`,
        );
    });

    // TODO: enable test after implementation is done
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
            `http://${thoughtSpotHost}/v2/#/embed/${mockEmbedId}/answer?dataSources=[%22data-source-1%22]&searchQuery=[commit%20date][revenue]&dataSourceMode=expand`,
        );
    });

    test('should load saved answer', () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        searchEmbed.render({
            answerId,
        });
        expect(getIFrameSrc()).toBe(
            `http://${thoughtSpotHost}/v2/#/embed/${mockEmbedId}/saved-answer/${answerId}?dataSourceMode=expand`,
        );
    });
});
