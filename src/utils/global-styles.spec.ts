import { addPreviewStylesIfNotPresent } from './global-styles';

describe('addPreviewStylesIfNotPresent', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
    });

    test('should add styles if not present', () => {
        addPreviewStylesIfNotPresent();
        const styleEl = document.getElementById('ts-preview-style');
        expect(styleEl).not.toBeNull();
        expect(styleEl.tagName).toBe('STYLE');
        expect(styleEl.innerHTML).toContain('.ts-viz-preview-loader');
    });

    test('should not add styles if already present', () => {
        document.head.innerHTML = `
            <style id="ts-preview-style">
                /* some existing styles */
            </style>
        `;

        addPreviewStylesIfNotPresent();
        const styleElements = document.querySelectorAll('style');
        expect(styleElements.length).toBe(1);
    });

    test('should add the correct styles', () => {
        addPreviewStylesIfNotPresent();
        const styleEl = document.getElementById('ts-preview-style');
        expect(styleEl).not.toBeNull();
        expect(styleEl.innerHTML).toMatch(/\.ts-viz-preview-loader\s*\{/);
    });
});
