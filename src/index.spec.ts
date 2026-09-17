import * as Exports from './index';
import { SpotterExperienceVersion } from './embed/spotter-utils';

describe('SDK root exports', () => {
    it('re-exports SpotterExperienceVersion', () => {
        expect(Exports.SpotterExperienceVersion).toBe(SpotterExperienceVersion);
    });
});
