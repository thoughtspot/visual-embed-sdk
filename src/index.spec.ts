import * as Exports from './index';
import { SpotterUI } from './embed/spotter-utils';

describe('SDK root exports', () => {
    it('re-exports SpotterUI', () => {
        expect(Exports.SpotterUI).toBe(SpotterUI);
    });
});
