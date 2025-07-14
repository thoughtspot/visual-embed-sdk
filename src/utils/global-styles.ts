export const addPreviewStylesIfNotPresent = () => {
    const styleEl = document.getElementById('ts-preview-style');
    if (styleEl) {
        return;
    }

    const previewStyles = `
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@32.0.2/styles/ag-grid.min.css" integrity="sha384-PvEsKa6emq5KYa9mf+Q7eYF5C2OCacYzZ+hBngp21NA4o1A9iU9smnytEmqUFbEZ" crossorigin="anonymous">
        <style id="ts-preview-style">
           .ts-viz-preview-loader {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: linear-gradient(-45deg, #eee 40%, #fafafa 50%, #eee 60%);
                background-size: 300%;
                background-position-x: 100%;
                animation: shimmer 1s infinite linear;
                z-index: 999;
                filter: grayscale(0.2);
           }

           @keyframes shimmer {
                to {
                    background-position-x: 0%
                }
           }

           .ts-viz-preview-loader .table-module__fullContainer {
                width: 100%;
                height: 100%;
           }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', previewStyles);
};
