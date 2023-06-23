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

const defaultConfig: SageViewConfig = {
    hideEurekaResults: false,
    isSageEmbed: true,
    disableWorksheetChange: false,
    hideWorksheetSelector: true,
    hideEurekaSuggestions: true,
};

const thoughtSpotHost = 'tshost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    spyOn(window, 'alert');
});

describe('Sage  embed tests', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render sage', async () => {
        const sageEmbed = new SageEmbed(getRootEl(), defaultConfig);
        sageEmbed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&hideEurekaResults=false&isSageEmbed=true&disableWorksheetChange=false&hideWorksheetSelector=true&hideEurekaSuggestions=true&hideAction=%5B"save","pin","editACopy","saveAsView","updateTSL","editTSL","onDeleteAnswer","share"%5D#/embed/eureka`,
            );
        });
    });
});
