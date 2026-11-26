import { buildSpotterVizAppInitData } from './spotter-viz-utils';

describe('buildSpotterVizAppInitData', () => {
    it('returns no fragment when spotterViz is not provided', () => {
        const result = buildSpotterVizAppInitData({});
        expect(result).toEqual({});
    });

    it('returns spotterViz as spotterVizConfig', () => {
        const spotterViz = { brandName: 'MyBrand', description: 'Desc', inputChatPlaceholder: 'Ask...' };
        const result = buildSpotterVizAppInitData({ spotterViz });
        expect(result.spotterVizConfig).toEqual(spotterViz);
    });

    it('passes brandHeadline through spotterVizConfig', () => {
        const spotterViz = { brandName: 'MyBrand', brandHeadline: "Hi, there! I'm" };
        const result = buildSpotterVizAppInitData({ spotterViz });
        expect(result.spotterVizConfig?.brandHeadline).toBe("Hi, there! I'm");
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
        const result = buildSpotterVizAppInitData({ spotterViz });
        expect(result.spotterVizConfig?.liveboardBrandName).toBe('Reports');
        expect(result.spotterVizConfig?.spotterBrandName).toBe('Analyst');
        expect(result.spotterVizConfig?.insightTileBrandName).toBe('Insight card');
        expect(result.spotterVizConfig?.insightTileViewPlanLabel).toBe('View plan');
        expect(result.spotterVizConfig?.insightTileLoaderText).toBe('Generating insight');
    });

    it('passes fileUploadEnabled and fileUploadFileTypes through spotterVizConfig', () => {
        const spotterViz = {
            brandName: 'MyBrand',
            fileUploadEnabled: false,
            fileUploadFileTypes: ['csv', '.pdf'],
        };
        const result = buildSpotterVizAppInitData({ spotterViz });
        expect(result.spotterVizConfig?.fileUploadEnabled).toBe(false);
        expect(result.spotterVizConfig?.fileUploadFileTypes).toEqual(['csv', '.pdf']);
    });
});
