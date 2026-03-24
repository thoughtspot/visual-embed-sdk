import { resolveEnablePastConversationsSidebar, buildSpotterSidebarAppInitData } from './spotter-utils';
import { ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { ERROR_MESSAGE } from '../errors';

describe('resolveEnablePastConversationsSidebar', () => {
    it('prefers spotterSidebarConfig value over standalone', () => {
        expect(resolveEnablePastConversationsSidebar({ spotterSidebarConfigValue: true, standaloneValue: false })).toBe(true);
        expect(resolveEnablePastConversationsSidebar({ spotterSidebarConfigValue: false, standaloneValue: true })).toBe(false);
    });

    it('falls back to standalone when spotterSidebarConfig value is absent', () => {
        expect(resolveEnablePastConversationsSidebar({ standaloneValue: true })).toBe(true);
    });

    it('returns undefined when both are absent', () => {
        expect(resolveEnablePastConversationsSidebar({})).toBeUndefined();
    });
});

describe('buildSpotterSidebarAppInitData', () => {
    const base = { type: 'APP_INIT' } as any;
    const noopError = jest.fn();

    it('returns base unchanged when no sidebar config or standalone flag', () => {
        const result = buildSpotterSidebarAppInitData(base, {}, noopError);
        expect(result).toBe(base);
    });

    it('nests spotterSidebarConfig under embedParams', () => {
        const result = buildSpotterSidebarAppInitData(base, {
            spotterSidebarConfig: { enablePastConversationsSidebar: true, spotterSidebarTitle: 'Chats' },
        }, noopError);
        expect(result.embedParams?.spotterSidebarConfig).toEqual({
            enablePastConversationsSidebar: true,
            spotterSidebarTitle: 'Chats',
        });
    });

    it('promotes standalone flag into spotterSidebarConfig.enablePastConversationsSidebar', () => {
        const result = buildSpotterSidebarAppInitData(base, { enablePastConversationsSidebar: true }, noopError);
        expect(result.embedParams?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
    });

    it('calls handleError and strips spotterDocumentationUrl when invalid', () => {
        const handleError = jest.fn();
        const result = buildSpotterSidebarAppInitData(base, {
            spotterSidebarConfig: { spotterDocumentationUrl: 'not-a-url' },
        }, handleError);
        expect(handleError).toHaveBeenCalledWith(expect.objectContaining({
            errorType: ErrorDetailsTypes.VALIDATION_ERROR,
            message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
            code: EmbedErrorCodes.INVALID_URL,
        }));
        expect(result.embedParams?.spotterSidebarConfig?.spotterDocumentationUrl).toBeUndefined();
    });
});
