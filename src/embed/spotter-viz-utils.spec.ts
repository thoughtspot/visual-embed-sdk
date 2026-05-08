import { buildSpotterVizAppInitData } from './spotter-viz-utils';

describe('buildSpotterVizAppInitData', () => {
    const base = { type: 'APP_INIT' } as any;

    it('returns initData unchanged when spotterViz is not provided', () => {
        const result = buildSpotterVizAppInitData(base, {});
        expect(result).toBe(base);
    });

    it('nests spotterViz under embedParams.spotterVizConfig', () => {
        const spotterViz = { brandName: 'MyBrand', description: 'Desc', inputChatPlaceholder: 'Ask...' };
        const result = buildSpotterVizAppInitData(base, { spotterViz });
        expect(result.embedParams?.spotterVizConfig).toEqual(spotterViz);
    });

    it('preserves existing embedParams when adding spotterVizConfig', () => {
        const existing = { ...base, embedParams: { spotterSidebarConfig: { enablePastConversationsSidebar: true } } };
        const spotterViz = { brandName: 'MyBrand' };
        const result = buildSpotterVizAppInitData(existing, { spotterViz });
        expect(result.embedParams?.spotterVizConfig).toEqual(spotterViz);
        expect(result.embedParams?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
    });
});
