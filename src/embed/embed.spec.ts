import { logger } from '../utils/logger';
import {
    init, AuthType, SearchEmbed, EmbedEvent,
    RuntimeFilterOp,
    Action,
} from '../index';
import {
    EVENT_WAIT_TIME,
    executeAfterWait,
    expectUrlToHaveParamsWithValues,
    getDocumentBody,
    getIFrameEl,
    getIFrameSrc,
    getRootEl,
    postMessageToParent,
} from '../test/test-utils';
import * as authInstance from '../auth';

const thoughtSpotHost = 'tshost';
const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
    jest.spyOn(window, 'alert');
    jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
});

describe('test view config', () => {
    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
    });

    test('should apply width and height to the iframe', async () => {
        const width = 800;
        const height = 600;

        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            frameParams: {
                width,
                height,
            },
        });
        searchEmbed.render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            expect(iframe.style.width).toBe(`${width}px`);
            expect(iframe.style.height).toBe(`${height}px`);
        });
    });
    
    test('should pass hideResults parameter when configured', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideResults: true,
        });
        searchEmbed.render();

        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expectUrlToHaveParamsWithValues(iframeSrc, {
                hideResult: true,
            });
        });
    });

    test('should pass forceTable parameter when configured', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            forceTable: true,
        });
        searchEmbed.render();

        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expectUrlToHaveParamsWithValues(iframeSrc, {
                forceTable: true,
            });
        });
    });

    test('should pass enableSearchAssist parameter when configured', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            enableSearchAssist: true,
        });
        searchEmbed.render();

        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expectUrlToHaveParamsWithValues(iframeSrc, {
                enableSearchAssist: true,
            });
        });
    });

    test('should pass hideSearchBar parameter when configured', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            hideSearchBar: true,
        });
        searchEmbed.render();

        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expectUrlToHaveParamsWithValues(iframeSrc, {
                hideSearchBar: true,
            });
        });
    });

    test('should register and trigger event listeners', async () => {
        const searchEmbed = new SearchEmbed(getRootEl(), defaultViewConfig);
        const mockCallback = jest.fn();

        searchEmbed.on(EmbedEvent.Load, mockCallback);
        await searchEmbed.render();

        await executeAfterWait(() => {
            const iframe = getIFrameEl();
            postMessageToParent(iframe.contentWindow, {
                type: EmbedEvent.Load,
            });
        });

        await executeAfterWait(() => {
            expect(mockCallback).toHaveBeenCalled();
        }, EVENT_WAIT_TIME);
    });

    test('should pass disabledActions parameter when configured', async () => {
        const disabledActions = [Action.Download, Action.Share];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            disabledActions,
        });
        searchEmbed.render();

        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expect(iframeSrc).toContain('disableAction');
        });
    });

    test('should pass runtime filters when configured', async () => {
        const runtimeFilters = [
            {
                columnName: 'revenue',
                operator: RuntimeFilterOp.GT,
                values: [1000],
            },
        ];
        const searchEmbed = new SearchEmbed(getRootEl(), {
            ...defaultViewConfig,
            runtimeFilters,
            excludeRuntimeFiltersfromURL: false,
        });
        searchEmbed.render();

        await executeAfterWait(() => {
            const iframeSrc = getIFrameSrc();
            expect(iframeSrc).toContain('col1=revenue');
            expect(iframeSrc).toContain('op1=GT');
            expect(iframeSrc).toContain('val1=1000');
        });
    });
});
