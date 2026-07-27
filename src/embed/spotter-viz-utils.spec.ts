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

    it('passes brandHeadline through spotterVizConfig', () => {
        const spotterViz = { brandName: 'MyBrand', brandHeadline: "Hi, there! I'm" };
        const result = buildSpotterVizAppInitData(base, { spotterViz });
        expect(result.embedParams?.spotterVizConfig?.brandHeadline).toBe("Hi, there! I'm");
    });

    it('passes liveboardBrandName, spotterBrandName, insightTileBrandName, insightTileViewPlanLabel and insightTileLoaderText through spotterVizConfig', () => {
        const spotterViz = {
            brandName: 'MyBrand',
            liveboardBrandName: 'Reports',
            spotterBrandName: 'Analyst',
            insightTileBrandName: 'Insight card',
            insightTileViewPlanLabel: 'View plan',
            insightTileLoaderText: 'Generating insight',
        };
        const result = buildSpotterVizAppInitData(base, { spotterViz });
        expect(result.embedParams?.spotterVizConfig?.liveboardBrandName).toBe('Reports');
        expect(result.embedParams?.spotterVizConfig?.spotterBrandName).toBe('Analyst');
        expect(result.embedParams?.spotterVizConfig?.insightTileBrandName).toBe('Insight card');
        expect(result.embedParams?.spotterVizConfig?.insightTileViewPlanLabel).toBe('View plan');
        expect(result.embedParams?.spotterVizConfig?.insightTileLoaderText).toBe('Generating insight');
    });

    it('preserves existing embedParams when adding spotterVizConfig', () => {
        const existing = { ...base, embedParams: { spotterSidebarConfig: { enablePastConversationsSidebar: true } } };
        const spotterViz = { brandName: 'MyBrand' };
        const result = buildSpotterVizAppInitData(existing, { spotterViz });
        expect(result.embedParams?.spotterVizConfig).toEqual(spotterViz);
        expect(result.embedParams?.spotterSidebarConfig?.enablePastConversationsSidebar).toBe(true);
    });
});
