import { SageEmbed, SageViewConfig } from './sage';
import { init } from '../index';
import { AuthType } from '../types';
import {
    executeAfterWait,
    expectUrlMatch,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
} from '../test/test-utils';

import * as authInstance from '../auth';

const defaultConfig: SageViewConfig = {
    disableWorksheetChange: false,
    hideWorksheetSelector: false,
    hideSageAnswerHeader: false,
    hideAutocompleteSuggestions: false,
    hideSampleQuestions: false,
    isProductTour: false,
    dataPanelV2: true,
};

const thoughtSpotHost = 'tshost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(window, 'alert');
    jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve(true as any));
});

describe('Sage  embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render sage', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), defaultConfig);
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });

    test('should render sage with product tour flag set', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), { ...defaultConfig, isProductTour: true });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=true&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });

    test('should render sage with disable worksheet change flag', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            disableWorksheetChange: true,
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=true&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });

    test('should render sage with hide worksheet selector flag', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            hideWorksheetSelector: true,
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=true&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });

    test('should render sage with hide Sage Answer Header flag', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            hideSageAnswerHeader: true,
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=true&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });

    test('should render sage with hide Autocomplete suggestions flag', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            hideAutocompleteSuggestions: true,
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=true&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });

    test('should render sage with deprecated showObjectSuggestions flag', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            showObjectSuggestions: true,
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=false&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });

    test('embed url include pre-seed dataSource without populating searchOptions', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            dataSource: 'worksheet-id',
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka?worksheet=worksheet-id`,
            );
        });
    });

    test('embed url include pre-seed dataSource and query', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            dataSource: 'worksheet-id',
            searchOptions: {
                searchQuery: 'test query', // also tests for query with spaces
            },
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka?worksheet=worksheet-id&query=test%20query`,
            );
        });
    });

    test('embed url include pre-seed execute flag with query', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            searchOptions: {
                searchQuery: 'test-query',
                executeSearch: true,
            },
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&hideAction=%5B%22reportError%22%5D#/embed/eureka?executeSearch=true&query=test-query`,
            );
        });
    });

    test('should set enableDataPanelV2 to true if data panel v2 flag is true', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            dataPanelV2: true,
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=true&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });

    test('should set enableDataPanelV2 to false if data panel v2 flag is false', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), {
            ...defaultConfig,
            dataPanelV2: false,
        });
        await sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&enableDataPanelV2=false&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=false&hideEurekaSuggestions=false&isProductTour=false&hideSageAnswerHeader=false&hideAction=%5B%22reportError%22%5D#/embed/eureka`,
            );
        });
    });
});
