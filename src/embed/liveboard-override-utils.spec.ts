import {
    buildLiveboardOverrideAppInitData,
    buildLiveboardOverridesAppInitData,
    LiveboardOverride,
} from './liveboard-override-utils';

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

describe('buildLiveboardOverridesAppInitData', () => {
    const base = { type: 'APP_INIT' } as any;
    const overrideFor = (dataSourceIdentifier: string): LiveboardOverride => ({
        dataSourceOverride: [{
            dataSourceIdentifier,
            filterQuery: [{ filterQueryToken: 'color = red' }],
        }],
    });

    it('returns initData unchanged when liveboardOverrides is not provided', () => {
        expect(buildLiveboardOverridesAppInitData(base, undefined)).toBe(base);
    });

    it('returns initData unchanged for an empty map', () => {
        expect(buildLiveboardOverridesAppInitData(base, {})).toBe(base);
    });

    it('returns initData unchanged when every entry is empty', () => {
        const result = buildLiveboardOverridesAppInitData(base, {
            'lb-1': { dataSourceOverride: [] },
            'lb-2': {} as LiveboardOverride,
        });
        expect(result).toBe(base);
    });

    it('nests the map under embedParams.liveboardOverrides', () => {
        const liveboardOverrides = { 'lb-1': overrideFor('DS1'), 'lb-2': overrideFor('DS2') };
        const result = buildLiveboardOverridesAppInitData(base, liveboardOverrides);
        expect(result.embedParams?.liveboardOverrides).toEqual(liveboardOverrides);
    });

    it('drops entries with no data source overrides', () => {
        const result = buildLiveboardOverridesAppInitData(base, {
            'lb-1': overrideFor('DS1'),
            'lb-2': { dataSourceOverride: [] },
        });
        expect(result.embedParams?.liveboardOverrides).toEqual({ 'lb-1': overrideFor('DS1') });
    });

    it('preserves existing embedParams keys', () => {
        const liveboardOverride = overrideFor('SINGLE');
        const result = buildLiveboardOverridesAppInitData(
            { ...base, embedParams: { liveboardOverride } },
            { 'lb-1': overrideFor('DS1') },
        );
        expect(result.embedParams).toEqual({
            liveboardOverride,
            liveboardOverrides: { 'lb-1': overrideFor('DS1') },
        });
    });
});
