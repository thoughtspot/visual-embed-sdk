import * as Exports from './index';
import { SpotterExperience } from './embed/spotter-utils';

describe('SDK root exports', () => {
    it('re-exports SpotterExperience', () => {
        expect(Exports.SpotterExperience).toBe(SpotterExperience);
    });
});
