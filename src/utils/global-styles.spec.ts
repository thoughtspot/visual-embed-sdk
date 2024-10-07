import { getDocumentBody } from '../test/test-utils';
import { addPreviewStylesIfNotPresent } from './global-styles';

describe('addPreviewStylesIfNotPresent', () => {
    afterEach(() => {
        document.body.innerHTML = getDocumentBody();
    });
    it('should not add preview styles if present', () => {
        document.body.innerHTML = '<div id="ts-preview-style">test</div>';
        addPreviewStylesIfNotPresent();
        const styleEl = document.getElementById('ts-preview-style');
        expect(styleEl.innerHTML).toBe('test');
    });

    it('should add preview styles if not present', () => {
        addPreviewStylesIfNotPresent();
        const styleEl = document.getElementById('ts-preview-style');
        expect(styleEl).not.toBeNull();
    });
});
