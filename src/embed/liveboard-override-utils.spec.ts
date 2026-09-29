import { buildLiveboardOverrideAppInitData, LiveboardOverride } from './liveboard-override-utils';

describe('buildLiveboardOverrideAppInitData', () => {
    const base = { type: 'APP_INIT' } as any;
    const liveboardOverride: LiveboardOverride = {
        dataSourceOverride: [{
            dataSourceIdentifier: 'model-guid',
            filterQuery: [{ tabName: 'Sales', groupName: 'Region', filterQueryToken: 'color = red' }],
            parameterQuery: [{ parameterQueryToken: 'discount = 10' }],
        }],
    };

    it('returns initData unchanged when liveboardOverride is not provided', () => {
        const result = buildLiveboardOverrideAppInitData(base, {});
        expect(result).toBe(base);
    });

    it('returns initData unchanged when dataSourceOverride is empty', () => {
        const result = buildLiveboardOverrideAppInitData(base, {
            liveboardOverride: { dataSourceOverride: [] },
        });
        expect(result).toBe(base);
    });

    it('nests liveboardOverride under embedParams.liveboardOverride', () => {
        const result = buildLiveboardOverrideAppInitData(base, { liveboardOverride });
        expect(result.embedParams?.liveboardOverride).toEqual(liveboardOverride);
    });

    it('preserves existing embedParams keys', () => {
        const spotterVizConfig = { brandName: 'MyBrand' };
        const result = buildLiveboardOverrideAppInitData(
            { ...base, embedParams: { spotterVizConfig } },
            { liveboardOverride },
        );
        expect(result.embedParams).toEqual({ spotterVizConfig, liveboardOverride });
    });
});
