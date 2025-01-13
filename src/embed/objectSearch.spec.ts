import { ObjectSearchEmbed, ObjectSearchViewConfig } from './objectSearch';
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

const thoughtSpotHost = 'tshost';

describe('Object search embed tests', () => {
    beforeAll(() => {
        init({
            thoughtSpotHost,
            authType: AuthType.None,
        });
        spyOn(window, 'alert');
        jest.spyOn(authInstance, 'postLoginService').mockResolvedValue(true);
    });

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should render object search embed', async () => {
        const embed = new ObjectSearchEmbed(getRootEl(), {});
        await embed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&isObjectSearchEmbed=true&hideAction=%5B%22reportError%22%5D#/embed/insights/eureka`,
            );
        });
    });

    test('should render object search embed with query', async () => {
        const embed = new ObjectSearchEmbed(getRootEl(), {
            searchOptions: {
                searchQuery: 'test-query',
            },
        });
        await embed.render();
        await executeAfterWait(() => {
            expectUrlMatch(
                getIFrameSrc(),
                `http://${thoughtSpotHost}/?embedApp=true&isObjectSearchEmbed=true&hideAction=%5B%22reportError%22%5D#/embed/insights/eureka?query=test-query`,
            );
        });
    });
});
