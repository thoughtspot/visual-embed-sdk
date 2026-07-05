import { buildEmbedParamsPayload } from './embedParams-builder';
import { ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { ERROR_MESSAGE } from '../errors';

describe('buildEmbedParamsPayload', () => {
    const noopError = jest.fn();

    it('returns undefined when nothing applies', () => {
        expect(buildEmbedParamsPayload({}, noopError)).toBeUndefined();
    });

    describe('spotterViz', () => {
        it('maps spotterViz to spotterVizConfig', () => {
            const spotterViz = { brandName: 'MyBrand', description: 'Desc', inputChatPlaceholder: 'Ask...' };
            const result = buildEmbedParamsPayload({ spotterViz }, noopError);
            expect(result?.spotterVizConfig).toEqual(spotterViz);
        });

        it('omits spotterVizConfig when spotterViz is absent', () => {
            const result = buildEmbedParamsPayload({ visualOverrides: { chart: {} } }, noopError);
            expect(result?.spotterVizConfig).toBeUndefined();
        });
    });

    describe('visualOverrides', () => {
        it('maps visualOverrides to visualOverridesParams', () => {
            const visualOverrides = { chart: { legend: { show: true, position: 'bottom' as const } } };
            const result = buildEmbedParamsPayload({ visualOverrides }, noopError);
            expect(result?.visualOverridesParams).toEqual(visualOverrides);
        });

        it('omits visualOverridesParams when visualOverrides is absent', () => {
            const result = buildEmbedParamsPayload({ spotterViz: { brandName: 'X' } }, noopError);
            expect(result?.visualOverridesParams).toBeUndefined();
        });
    });

    describe('spotterSidebarConfig', () => {
        it('returns empty/undefined when no sidebar config or standalone flag', () => {
            expect(buildEmbedParamsPayload({}, noopError)).toBeUndefined();
        });

        it('passes spotterSidebarConfig through', () => {
            const result = buildEmbedParamsPayload({
                spotterSidebarConfig: { enablePastConversationsSidebar: true, spotterSidebarTitle: 'Chats' },
            }, noopError);
            expect(result?.spotterSidebarConfig).toEqual({
                enablePastConversationsSidebar: true,
                spotterSidebarTitle: 'Chats',
            });
        });

        it('promotes the standalone enablePastConversationsSidebar flag into spotterSidebarConfig', () => {
            const result = buildEmbedParamsPayload({ enablePastConversationsSidebar: true }, noopError);
            expect(result?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
        });

        it('lets spotterSidebarConfig value take precedence over the standalone flag', () => {
            const result = buildEmbedParamsPayload({
                enablePastConversationsSidebar: false,
                spotterSidebarConfig: { enablePastConversationsSidebar: true },
            }, noopError);
            expect(result?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
        });

        it('calls handleError and strips spotterDocumentationUrl when invalid', () => {
            const handleError = jest.fn();
            const result = buildEmbedParamsPayload({
                spotterSidebarConfig: { spotterDocumentationUrl: 'not-a-url' },
            }, handleError);
            expect(handleError).toHaveBeenCalledWith(expect.objectContaining({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                code: EmbedErrorCodes.INVALID_URL,
            }));
            expect(result?.spotterSidebarConfig?.spotterDocumentationUrl).toBeUndefined();
        });

        it('keeps a valid spotterDocumentationUrl', () => {
            const handleError = jest.fn();
            const result = buildEmbedParamsPayload({
                spotterSidebarConfig: { spotterDocumentationUrl: 'https://docs.example.com' },
            }, handleError);
            expect(handleError).not.toHaveBeenCalled();
            expect(result?.spotterSidebarConfig?.spotterDocumentationUrl).toBe('https://docs.example.com');
        });
    });

    describe('merging multiple fields', () => {
        it('merges sidebar, viz and visualOverrides into one payload', () => {
            const visualOverrides = { table: { display: { tableTheme: 'ZEBRA' } } };
            const spotterViz = { brandName: 'MyBrand' };
            const result = buildEmbedParamsPayload({
                spotterSidebarConfig: { enablePastConversationsSidebar: true },
                spotterViz,
                visualOverrides,
            }, noopError);
            expect(result?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
            expect(result?.spotterVizConfig).toEqual(spotterViz);
            expect(result?.visualOverridesParams).toEqual(visualOverrides);
        });
    });
});
