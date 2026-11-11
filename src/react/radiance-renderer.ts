/* eslint-disable */
// @ts-nocheck
/**
 * The Radiance glow renderer, the same one the ThoughtSpot Home pages use
 * (radiance-spotter-home, by Tarun Bhandari). The body below is the shipped
 * `radiance-renderer.js`, verbatim apart from indentation, wrapped so it runs
 * only when the EmbedX pane first opens rather than at import time.
 *
 * It draws into every `.radiance-local` element on the page and is steered by
 * that element's `data-radiance-*` attributes; call
 * `window.RadianceLanguageRenderer.refresh()` after changing them.
 *
 * Kept as third-party code: do not reformat or "fix" it here. Update it by
 * replacing the body with a newer copy of the renderer.
 */

/**
 * Starts the renderer once per page. A no-op when it is already running
 * (this pane, or the host page, loaded it), outside a browser, or under jsdom,
 * which has no canvas.
 */
export function installRadianceRenderer(): void {
    if (typeof window === 'undefined' || (window as any).RadianceLanguageRenderer) return;
    if (/jsdom/i.test(window.navigator?.userAgent ?? '')) return;
    try {
        (() => {
            const DARK_SURFACE = "#1a1b1e";
            const RADIANCE_FILM_GRAIN_SIZE = 1.0;

            const LIGHT_BLOBS = [
                { anchorX: 0.9, anchorY: 0.4, color: [255, 120, 160], radius: 0.4, opacity: 0.6, orbitX: 60, orbitY: 80, freqX: 0.0007, freqY: 0.0005, stretchFreq: 0.001 },
                { anchorX: 0.8, anchorY: 0.6, color: [80, 220, 180], radius: 0.36, opacity: 0.32, orbitX: -70, orbitY: -90, freqX: 0.0008, freqY: 0.0006, stretchFreq: 0.0012 },
                { anchorX: 0.95, anchorY: 0.5, color: [140, 100, 255], radius: 0.45, opacity: 0.6, orbitX: 50, orbitY: 100, freqX: 0.0005, freqY: 0.0009, stretchFreq: 0.0008 },
                { anchorX: 0.75, anchorY: 0.3, color: [255, 180, 100], radius: 0.35, opacity: 0.6, orbitX: -60, orbitY: 120, freqX: 0.0009, freqY: 0.0007, stretchFreq: 0.0015 },
                { anchorX: 0.85, anchorY: 0.7, color: [40, 140, 255], radius: 0.4, opacity: 0.6, orbitX: 90, orbitY: -80, freqX: 0.0008, freqY: 0.0011, stretchFreq: 0.0009 },
                { anchorX: 0.3, anchorY: 0.3, color: [200, 220, 255], radius: 0.7, opacity: 0.15, orbitX: 100, orbitY: 50, freqX: 0.0003, freqY: 0.0004, stretchFreq: 0.0005 },
                { anchorX: 0.2, anchorY: 0.7, color: [255, 200, 220], radius: 0.8, opacity: 0.15, orbitX: -80, orbitY: -100, freqX: 0.0004, freqY: 0.0003, stretchFreq: 0.0006 },
                { anchorX: 0.5, anchorY: 0.6, color: [255, 240, 180], radius: 0.6, opacity: 0.15, orbitX: 120, orbitY: -60, freqX: 0.0005, freqY: 0.0004, stretchFreq: 0.0007 }
            ];

            function scaleBlobSet(blobs, opacityScale, orbitScale) {
                return blobs.map((blob) => ({
                    ...blob,
                    opacity: blob.opacity * opacityScale,
                    orbitX: (blob.orbitX || 0) * orbitScale,
                    orbitY: (blob.orbitY || 0) * orbitScale
                }));
            }

            function mirrorBlobSet(blobs) {
                return blobs.map((blob) => ({
                    ...blob,
                    anchorX: 1 - blob.anchorX,
                    orbitX: -(blob.orbitX || 0)
                }));
            }

            function topBlobSet(blobs) {
                return blobs.map((blob) => ({
                    ...blob,
                    anchorX: clamp(blob.anchorY, 0.08, 0.94),
                    anchorY: clamp(1 - blob.anchorX, -0.04, 0.34),
                    orbitX: (blob.orbitY || 0) * 1.18,
                    orbitY: -(blob.orbitX || 0) * 0.58,
                    radius: blob.radius * 1.06
                }));
            }

            function lockBlobSet(blobs) {
                return blobs.map((blob) => ({
                    ...blob,
                    orbitX: 0,
                    orbitY: 0,
                    freqX: 0,
                    freqY: 0,
                    stretchFreq: 0,
                    locked: true
                }));
            }

            function neutralBlobSet(blobs) {
                return blobs.map((blob) => ({
                    ...blob,
                    surfaceScaled: true
                }));
            }

            function clamp(value, min, max) {
                return Math.min(max, Math.max(min, value));
            }

            function getBlobSurfaceScale(config, width, height) {
                if (!config.surfaceScaled) return { radius: 1, orbitX: 1, orbitY: 1 };

                const minSide = Math.max(1, Math.min(width, height));
                const maxSide = Math.max(width, height);
                const aspect = maxSide / minSide;
                const compactBoost = clamp((480 - minSide) / 280, 0, 1);
                const fieldBoost = clamp((maxSide - 760) / 720, 0, 1);

                return {
                    radius: 1.06 + clamp(aspect - 1, 0, 1.1) * 0.13 + compactBoost * 0.14 + fieldBoost * 0.05,
                    orbitX: clamp(width / 920, 0.28, 1.38),
                    orbitY: clamp(height / 680, 0.28, 1.38)
                };
            }

            const LIGHT_SUBTLE_BLOBS = scaleBlobSet(LIGHT_BLOBS, 0.44, 0.62);

            const STATIC_LIGHT_BLOBS = [
                { anchorX: 1.02, anchorY: 0.14, color: [255, 120, 160], radius: 0.48, opacity: 0.58, locked: true },
                { anchorX: 0.96, anchorY: 0.42, color: [140, 100, 255], radius: 0.54, opacity: 0.6, locked: true },
                { anchorX: 1.02, anchorY: 0.82, color: [40, 140, 255], radius: 0.54, opacity: 0.58, locked: true },
                { anchorX: 0.78, anchorY: 0.28, color: [255, 180, 100], radius: 0.42, opacity: 0.44, locked: true },
                { anchorX: 0.8, anchorY: 0.62, color: [80, 220, 180], radius: 0.38, opacity: 0.1, locked: true },
                { anchorX: 0.34, anchorY: 0.34, color: [200, 220, 255], radius: 0.76, opacity: 0.1, locked: true },
                { anchorX: 0.2, anchorY: 0.74, color: [255, 200, 220], radius: 0.84, opacity: 0.075, locked: true },
                { anchorX: 0.52, anchorY: 0.62, color: [255, 240, 180], radius: 0.62, opacity: 0.075, locked: true }
            ];

            const STATIC_LIGHT_SUBTLE_BLOBS = scaleBlobSet(STATIC_LIGHT_BLOBS, 0.48, 1);

            const NEUTRAL_LIGHT_BLOBS = neutralBlobSet([
                { anchorX: 0.12, anchorY: 0.12, color: [255, 180, 100], radius: 0.39, opacity: 0.34, orbitX: 90, orbitY: 68, freqX: 0.00072, freqY: 0.00056, stretchFreq: 0.00108 },
                { anchorX: 0.28, anchorY: 0.28, color: [255, 120, 160], radius: 0.46, opacity: 0.5, orbitX: -118, orbitY: 84, freqX: 0.00086, freqY: 0.00068, stretchFreq: 0.00118 },
                { anchorX: 0.14, anchorY: 0.78, color: [40, 140, 255], radius: 0.54, opacity: 0.56, orbitX: 126, orbitY: -110, freqX: 0.00074, freqY: 0.00092, stretchFreq: 0.00102 },
                { anchorX: 0.44, anchorY: 0.18, color: [140, 100, 255], radius: 0.45, opacity: 0.48, orbitX: 106, orbitY: 92, freqX: 0.00064, freqY: 0.00086, stretchFreq: 0.00112 },
                { anchorX: 0.68, anchorY: 0.32, color: [40, 140, 255], radius: 0.49, opacity: 0.54, orbitX: 108, orbitY: -92, freqX: 0.00084, freqY: 0.00064, stretchFreq: 0.00114 },
                { anchorX: 0.84, anchorY: 0.18, color: [255, 120, 160], radius: 0.42, opacity: 0.45, orbitX: -98, orbitY: 98, freqX: 0.00078, freqY: 0.00088, stretchFreq: 0.00106 },
                { anchorX: 0.88, anchorY: 0.62, color: [140, 100, 255], radius: 0.56, opacity: 0.58, orbitX: -122, orbitY: -104, freqX: 0.00058, freqY: 0.00094, stretchFreq: 0.00098 },
                { anchorX: 0.68, anchorY: 0.86, color: [40, 140, 255], radius: 0.54, opacity: 0.54, orbitX: 108, orbitY: -110, freqX: 0.0009, freqY: 0.00072, stretchFreq: 0.0012 },
                { anchorX: 0.36, anchorY: 0.84, color: [255, 120, 160], radius: 0.42, opacity: 0.38, orbitX: 98, orbitY: -88, freqX: 0.0007, freqY: 0.00082, stretchFreq: 0.00104 },
                { anchorX: 0.48, anchorY: 0.48, color: [80, 220, 180], radius: 0.3, opacity: 0.04, orbitX: 78, orbitY: -72, freqX: 0.00068, freqY: 0.00072, stretchFreq: 0.00092 }
            ]);

            const NEUTRAL_LIGHT_SUBTLE_BLOBS = scaleBlobSet(NEUTRAL_LIGHT_BLOBS, 0.52, 0.86);
            const STATIC_NEUTRAL_LIGHT_BLOBS = lockBlobSet(NEUTRAL_LIGHT_BLOBS);
            const STATIC_NEUTRAL_LIGHT_SUBTLE_BLOBS = lockBlobSet(NEUTRAL_LIGHT_SUBTLE_BLOBS);

            const DARK_SUBTLE_BLOBS = [
                { anchorX: 0.9, anchorY: 0.4, color: [255, 93, 142], radius: 0.42, opacity: 0.34, orbitX: 60, orbitY: 80, freqX: 0.0007, freqY: 0.0005, stretchFreq: 0.001 },
                { anchorX: 0.8, anchorY: 0.62, color: [45, 220, 177], radius: 0.38, opacity: 0.12, orbitX: -70, orbitY: -90, freqX: 0.0008, freqY: 0.0006, stretchFreq: 0.0012 },
                { anchorX: 0.95, anchorY: 0.5, color: [138, 93, 255], radius: 0.48, opacity: 0.36, orbitX: 50, orbitY: 100, freqX: 0.0005, freqY: 0.0009, stretchFreq: 0.0008 },
                { anchorX: 0.74, anchorY: 0.3, color: [255, 180, 90], radius: 0.34, opacity: 0.2, orbitX: -60, orbitY: 120, freqX: 0.0009, freqY: 0.0007, stretchFreq: 0.0015 },
                { anchorX: 0.86, anchorY: 0.72, color: [39, 140, 255], radius: 0.42, opacity: 0.32, orbitX: 90, orbitY: -80, freqX: 0.0008, freqY: 0.0011, stretchFreq: 0.0009 },
                { anchorX: 0.3, anchorY: 0.3, color: [160, 196, 255], radius: 0.62, opacity: 0.055, orbitX: 100, orbitY: 50, freqX: 0.0003, freqY: 0.0004, stretchFreq: 0.0005 },
                { anchorX: 0.2, anchorY: 0.72, color: [255, 170, 210], radius: 0.66, opacity: 0.055, orbitX: -80, orbitY: -100, freqX: 0.0004, freqY: 0.0003, stretchFreq: 0.0006 },
                { anchorX: 0.5, anchorY: 0.6, color: [255, 232, 150], radius: 0.52, opacity: 0.045, orbitX: 120, orbitY: -60, freqX: 0.0005, freqY: 0.0004, stretchFreq: 0.0007 }
            ];

            const DARK_PROMINENT_BLOBS = [
                { anchorX: 0.9, anchorY: 0.4, color: [255, 93, 142], radius: 0.46, opacity: 0.44, orbitX: 60, orbitY: 80, freqX: 0.0007, freqY: 0.0005, stretchFreq: 0.001 },
                { anchorX: 0.8, anchorY: 0.62, color: [45, 220, 177], radius: 0.42, opacity: 0.18, orbitX: -70, orbitY: -90, freqX: 0.0008, freqY: 0.0006, stretchFreq: 0.0012 },
                { anchorX: 0.95, anchorY: 0.5, color: [138, 93, 255], radius: 0.52, opacity: 0.46, orbitX: 50, orbitY: 100, freqX: 0.0005, freqY: 0.0009, stretchFreq: 0.0008 },
                { anchorX: 0.74, anchorY: 0.3, color: [255, 180, 90], radius: 0.38, opacity: 0.28, orbitX: -60, orbitY: 120, freqX: 0.0009, freqY: 0.0007, stretchFreq: 0.0015 },
                { anchorX: 0.86, anchorY: 0.72, color: [39, 140, 255], radius: 0.46, opacity: 0.42, orbitX: 90, orbitY: -80, freqX: 0.0008, freqY: 0.0011, stretchFreq: 0.0009 },
                { anchorX: 0.3, anchorY: 0.3, color: [160, 196, 255], radius: 0.78, opacity: 0.12, orbitX: 100, orbitY: 50, freqX: 0.0003, freqY: 0.0004, stretchFreq: 0.0005 },
                { anchorX: 0.2, anchorY: 0.72, color: [255, 170, 210], radius: 0.82, opacity: 0.12, orbitX: -80, orbitY: -100, freqX: 0.0004, freqY: 0.0003, stretchFreq: 0.0006 },
                { anchorX: 0.5, anchorY: 0.6, color: [255, 232, 150], radius: 0.64, opacity: 0.1, orbitX: 120, orbitY: -60, freqX: 0.0005, freqY: 0.0004, stretchFreq: 0.0007 }
            ];

            const STATIC_DARK_PROMINENT_BLOBS = [
                { anchorX: 1.02, anchorY: 0.14, color: [255, 93, 142], radius: 0.5, opacity: 0.42, locked: true },
                { anchorX: 0.96, anchorY: 0.44, color: [138, 93, 255], radius: 0.56, opacity: 0.46, locked: true },
                { anchorX: 1.02, anchorY: 0.84, color: [39, 140, 255], radius: 0.56, opacity: 0.42, locked: true },
                { anchorX: 0.76, anchorY: 0.28, color: [255, 180, 90], radius: 0.42, opacity: 0.24, locked: true },
                { anchorX: 0.8, anchorY: 0.64, color: [45, 220, 177], radius: 0.38, opacity: 0.07, locked: true },
                { anchorX: 0.34, anchorY: 0.34, color: [160, 196, 255], radius: 0.76, opacity: 0.08, locked: true },
                { anchorX: 0.2, anchorY: 0.74, color: [255, 170, 210], radius: 0.82, opacity: 0.075, locked: true },
                { anchorX: 0.52, anchorY: 0.62, color: [255, 232, 150], radius: 0.62, opacity: 0.055, locked: true }
            ];

            const STATIC_DARK_SUBTLE_BLOBS = scaleBlobSet(STATIC_DARK_PROMINENT_BLOBS, 0.54, 1);

            const NEUTRAL_DARK_PROMINENT_BLOBS = neutralBlobSet([
                { anchorX: 0.12, anchorY: 0.12, color: [255, 180, 90], radius: 0.39, opacity: 0.22, orbitX: 90, orbitY: 68, freqX: 0.00072, freqY: 0.00056, stretchFreq: 0.00108 },
                { anchorX: 0.28, anchorY: 0.28, color: [255, 93, 142], radius: 0.46, opacity: 0.36, orbitX: -118, orbitY: 84, freqX: 0.00086, freqY: 0.00068, stretchFreq: 0.00118 },
                { anchorX: 0.14, anchorY: 0.78, color: [39, 140, 255], radius: 0.54, opacity: 0.4, orbitX: 126, orbitY: -110, freqX: 0.00074, freqY: 0.00092, stretchFreq: 0.00102 },
                { anchorX: 0.44, anchorY: 0.18, color: [138, 93, 255], radius: 0.45, opacity: 0.36, orbitX: 106, orbitY: 92, freqX: 0.00064, freqY: 0.00086, stretchFreq: 0.00112 },
                { anchorX: 0.68, anchorY: 0.32, color: [39, 140, 255], radius: 0.49, opacity: 0.38, orbitX: 108, orbitY: -92, freqX: 0.00084, freqY: 0.00064, stretchFreq: 0.00114 },
                { anchorX: 0.84, anchorY: 0.18, color: [255, 93, 142], radius: 0.42, opacity: 0.32, orbitX: -98, orbitY: 98, freqX: 0.00078, freqY: 0.00088, stretchFreq: 0.00106 },
                { anchorX: 0.88, anchorY: 0.62, color: [138, 93, 255], radius: 0.56, opacity: 0.42, orbitX: -122, orbitY: -104, freqX: 0.00058, freqY: 0.00094, stretchFreq: 0.00098 },
                { anchorX: 0.68, anchorY: 0.86, color: [39, 140, 255], radius: 0.54, opacity: 0.4, orbitX: 108, orbitY: -110, freqX: 0.0009, freqY: 0.00072, stretchFreq: 0.0012 },
                { anchorX: 0.36, anchorY: 0.84, color: [255, 93, 142], radius: 0.42, opacity: 0.28, orbitX: 98, orbitY: -88, freqX: 0.0007, freqY: 0.00082, stretchFreq: 0.00104 },
                { anchorX: 0.48, anchorY: 0.48, color: [45, 220, 177], radius: 0.3, opacity: 0.024, orbitX: 78, orbitY: -72, freqX: 0.00068, freqY: 0.00072, stretchFreq: 0.00092 }
            ]);

            const NEUTRAL_DARK_SUBTLE_BLOBS = scaleBlobSet(NEUTRAL_DARK_PROMINENT_BLOBS, 0.52, 0.86);
            const STATIC_NEUTRAL_DARK_PROMINENT_BLOBS = lockBlobSet(NEUTRAL_DARK_PROMINENT_BLOBS);
            const STATIC_NEUTRAL_DARK_SUBTLE_BLOBS = lockBlobSet(NEUTRAL_DARK_SUBTLE_BLOBS);

            const NEUTRAL_VEIL_BLOBS = [
                { anchorX: 0.08, anchorY: 0.18, radius: 0.56, opacity: 0.28, orbitX: 52, orbitY: 44, freqX: 0.00048, freqY: 0.0004, phase: 0.32 },
                { anchorX: 0.52, anchorY: 0.08, radius: 0.48, opacity: 0.2, orbitX: -56, orbitY: 38, freqX: 0.00038, freqY: 0.00046, phase: 1.18 },
                { anchorX: 0.94, anchorY: 0.26, radius: 0.54, opacity: 0.24, orbitX: -48, orbitY: 54, freqX: 0.00044, freqY: 0.00036, phase: 2.42 },
                { anchorX: 0.22, anchorY: 0.82, radius: 0.6, opacity: 0.22, orbitX: 62, orbitY: -46, freqX: 0.00034, freqY: 0.00042, phase: 3.36 },
                { anchorX: 0.74, anchorY: 0.78, radius: 0.58, opacity: 0.24, orbitX: -64, orbitY: -52, freqX: 0.00042, freqY: 0.00038, phase: 4.72 },
                { anchorX: 0.48, anchorY: 0.5, radius: 0.72, opacity: 0.16, orbitX: 46, orbitY: -42, freqX: 0.0003, freqY: 0.00034, phase: 5.58 }
            ];

            const surfaces = new Set();
            let raf = 0;

            class RadianceBlob {
                constructor(config) {
                    this.config = config;
                    this.phaseX = Math.random() * Math.PI * 2;
                    this.phaseY = Math.random() * Math.PI * 2;
                    this.phaseStretch = Math.random() * Math.PI * 2;
                    this.phaseDrift = Math.random() * Math.PI * 2;
                    this.x = 0;
                    this.y = 0;
                    this.r = 0;
                    this.stretchX = 1;
                    this.stretchY = 1;
                    this.hasState = false;
                }

                update(t, width, height, mouse) {
                    const config = this.config;
                    const baseX = width * config.anchorX;
                    const baseY = height * config.anchorY;
                    const minSide = Math.min(width, height);
                    const surfaceScale = getBlobSurfaceScale(config, width, height);
                    const baseRadius = minSide * config.radius * surfaceScale.radius;

                    if (config.locked) {
                        this.x = baseX;
                        this.y = baseY;
                        this.r = baseRadius;
                        this.stretchX = 1;
                        this.stretchY = 1;
                        this.opacity = config.opacity;
                        this.hasState = true;
                        return;
                    }

                    const freqX = config.freqX || 0.00022;
                    const freqY = config.freqY || 0.00022;
                    const stretchFreq = config.stretchFreq || 0.00032;
                    let targetX;
                    let targetY;
                    let targetR;
                    let targetStretchX;
                    let targetStretchY;

                    targetX = baseX + Math.sin(t * freqX + this.phaseX) * (config.orbitX || 0) * surfaceScale.orbitX;
                    targetY = baseY + Math.cos(t * freqY + this.phaseY) * (config.orbitY || 0) * surfaceScale.orbitY;
                    targetR = baseRadius + Math.sin(t * 0.001 + this.phaseX) * (baseRadius * 0.15);
                    targetStretchX = 1 + 0.3 * Math.sin(t * stretchFreq + this.phaseX);
                    targetStretchY = 1 + 0.3 * Math.cos(t * stretchFreq + this.phaseY);
                    this.opacity = config.opacity;

                    const ease = 1;
                    this.x += (targetX - this.x) * ease;
                    this.y += (targetY - this.y) * ease;
                    this.r += (targetR - this.r) * ease;
                    this.stretchX += (targetStretchX - this.stretchX) * ease;
                    this.stretchY += (targetStretchY - this.stretchY) * ease;
                    this.hasState = true;
                }

                draw(ctx) {
                    const [r, g, b] = this.config.color;
                    const opacity = this.opacity ?? this.config.opacity;
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.scale(this.stretchX, this.stretchY);
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r);
                    gradient.addColorStop(0, `rgba(${r},${g},${b},${opacity})`);
                    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            class RadianceSurface {
                constructor(element) {
                    this.element = element;
                    this.canvas = document.createElement("canvas");
                    this.ctx = this.canvas.getContext("2d");
                    this.mouse = { x: -9999, y: -9999 };
                    this.width = 0;
                    this.height = 0;
                    this.dpr = 1;
                    this.textureKey = "";
                    this.ready = false;
                    this.blobCanvas = document.createElement("canvas");
                    this.blobCtx = this.blobCanvas.getContext("2d");
                    this.blobs = [];
                    this.lastConfigKey = "";
                    this.element.appendChild(this.canvas);
                    this.element.dataset.radianceReady = "false";
                }

                get appearance() {
                    return this.element.dataset.radianceAppearance === "dark" ? "dark" : "light";
                }

                get speed() {
                    const value = Number(this.element.dataset.radianceSpeed || "1");
                    return Number.isFinite(value) ? value : 1;
                }

                get variant() {
                    return this.element.dataset.radianceVariant || "";
                }

                get layout() {
                    const layout = this.element.dataset.radianceLayout || "right-wash";
                    if (layout === "left" || layout === "left-wash") return "left-wash";
                    if (layout === "top" || layout === "top-wash") return "top-wash";
                    if (layout === "neutral" || layout === "home-corners" || layout === "modal-balanced" || layout === "developer-sides") return "neutral";
                    return "right-wash";
                }

                get isSubtle() {
                    return this.variant.endsWith("subtle") || this.element.dataset.radianceIntensity === "subtle";
                }

                get isDark() {
                    return this.appearance === "dark";
                }

                get isStill() {
                    return this.element.dataset.radianceMotion === "still" || this.variant.startsWith("static");
                }

                isRenderable() {
                    if (document.documentElement.dataset.radiancePaused === "true" || document.body?.classList.contains("is-proof-paused")) return false;
                    const slide = this.element.closest(".slide");
                    if (slide && !slide.classList.contains("is-active")) return false;
                    const proofView = this.element.closest(".proof-view");
                    if (proofView && !proofView.classList.contains("is-active")) return false;
                    const style = window.getComputedStyle(this.element);
                    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
                    const rect = this.element.getBoundingClientRect();
                    return rect.width > 2 && rect.height > 2;
                }

                getConfig() {
                    const layout = this.layout;

                    if (!this.isDark) {
                        if (layout === "neutral") {
                            if (this.variant.startsWith("static")) return this.isSubtle ? STATIC_NEUTRAL_LIGHT_SUBTLE_BLOBS : STATIC_NEUTRAL_LIGHT_BLOBS;
                            return this.isSubtle ? NEUTRAL_LIGHT_SUBTLE_BLOBS : NEUTRAL_LIGHT_BLOBS;
                        }
                        const base = this.variant.startsWith("static")
                            ? (this.isSubtle ? STATIC_LIGHT_SUBTLE_BLOBS : STATIC_LIGHT_BLOBS)
                            : (this.isSubtle ? LIGHT_SUBTLE_BLOBS : LIGHT_BLOBS);
                        if (layout === "top-wash") return topBlobSet(base);
                        return layout === "left-wash" ? mirrorBlobSet(base) : base;
                    }

                    if (layout === "neutral") {
                        if (this.variant.startsWith("static")) return this.isSubtle ? STATIC_NEUTRAL_DARK_SUBTLE_BLOBS : STATIC_NEUTRAL_DARK_PROMINENT_BLOBS;
                        return this.isSubtle ? NEUTRAL_DARK_SUBTLE_BLOBS : NEUTRAL_DARK_PROMINENT_BLOBS;
                    }
                    const base = this.variant.startsWith("static")
                        ? (this.isSubtle ? STATIC_DARK_SUBTLE_BLOBS : STATIC_DARK_PROMINENT_BLOBS)
                        : (this.element.dataset.radianceDarkGlow === "subtle" || this.isSubtle ? DARK_SUBTLE_BLOBS : DARK_PROMINENT_BLOBS);
                    if (layout === "top-wash") return topBlobSet(base);
                    return layout === "left-wash" ? mirrorBlobSet(base) : base;
                }

                ensureSize() {
                    const rect = this.element.getBoundingClientRect();
                    const nextWidth = Math.max(1, Math.round(this.element.clientWidth || rect.width));
                    const nextHeight = Math.max(1, Math.round(this.element.clientHeight || rect.height));
                    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

                    if (nextWidth === this.width && nextHeight === this.height && nextDpr === this.dpr) return;

                    this.width = nextWidth;
                    this.height = nextHeight;
                    this.dpr = nextDpr;
                    this.canvas.width = Math.max(1, Math.floor(this.width * this.dpr));
                    this.canvas.height = Math.max(1, Math.floor(this.height * this.dpr));
                    this.canvas.style.width = `${this.width}px`;
                    this.canvas.style.height = `${this.height}px`;
                    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
                    this.ctx.imageSmoothingEnabled = true;
                    this.ctx.imageSmoothingQuality = "high";
                    this.textureKey = "";
                }

                ensureBlobs() {
                    const configKey = [
                        this.appearance,
                        this.element.dataset.radianceDarkGlow || "subtle",
                        this.element.dataset.radianceLayout || "default",
                        this.element.dataset.radianceIntensity || "default",
                        this.variant || "default",
                        this.element.dataset.radianceMotion || "dynamic"
                    ].join(":");
                    if (configKey === this.lastConfigKey && this.blobs.length) return;
                    this.lastConfigKey = configKey;
                    this.blobs = this.getConfig().map((config) => new RadianceBlob(config));
                }

                createGrain(mode) {
                    const texture = document.createElement("canvas");
                    texture.width = Math.max(1, Math.floor(this.width));
                    texture.height = Math.max(1, Math.floor(this.height));
                    const grainCtx = texture.getContext("2d");
                    const isDark = mode === "dark";

                    const rawTexture = document.createElement("canvas");
                    const rawWidth = Math.max(1, Math.ceil(texture.width / RADIANCE_FILM_GRAIN_SIZE));
                    const rawHeight = Math.max(1, Math.ceil(texture.height / RADIANCE_FILM_GRAIN_SIZE));
                    rawTexture.width = rawWidth;
                    rawTexture.height = rawHeight;
                    const rawCtx = rawTexture.getContext("2d");
                    const image = rawCtx.createImageData(rawWidth, rawHeight);
                    const lightFilmBright = [
                        [232, 248, 252],
                        [244, 229, 253],
                        [253, 228, 240],
                        [253, 244, 212],
                        [235, 241, 248]
                    ];
                    const lightFilmChroma = [
                        [120, 208, 230],
                        [194, 132, 232],
                        [244, 132, 196],
                        [246, 204, 104],
                        [116, 154, 246],
                        [128, 218, 194]
                    ];
                    const lightFilmMid = [
                        [174, 214, 220],
                        [204, 177, 224],
                        [224, 178, 202],
                        [224, 206, 150],
                        [184, 196, 210]
                    ];
                    const lightFilmDark = [
                        [122, 150, 156],
                        [150, 124, 168],
                        [168, 126, 148],
                        [150, 140, 116],
                        [132, 138, 146]
                    ];
                    const darkFilmColors = [
                        [76, 116, 164],
                        [122, 82, 140],
                        [148, 78, 112],
                        [118, 112, 92],
                        [132, 138, 148]
                    ];
                    const darkFilmShadows = [
                        [10, 12, 16],
                        [14, 15, 18],
                        [18, 16, 23],
                        [16, 18, 24]
                    ];

                    const writeFilmGrain = (data, alphaMultiplier) => {
                        for (let i = 0; i < data.length; i += 4) {
                            let color;
                            let alpha;
                            let sharedJitter;
                            let channelJitter;

                            if (isDark) {
                                const toneRoll = Math.random();
                                const useShadowFleck = toneRoll < 0.16;
                                color = useShadowFleck
                                    ? darkFilmShadows[Math.floor(Math.random() * darkFilmShadows.length)]
                                    : darkFilmColors[Math.floor(Math.random() * darkFilmColors.length)];
                                alpha = useShadowFleck
                                    ? 7 + Math.floor(Math.random() * 9)
                                    : 14 + Math.floor(Math.random() * 14);
                                sharedJitter = Math.floor((Math.random() - 0.5) * (useShadowFleck ? 10 : 38));
                                channelJitter = useShadowFleck ? 5 : 12;
                            } else {
                                const toneRoll = Math.random();
                                const palette = toneRoll < 0.68
                                    ? lightFilmBright
                                    : toneRoll < 0.9
                                        ? lightFilmMid
                                        : toneRoll < 0.97
                                            ? lightFilmChroma
                                            : lightFilmDark;
                                color = palette[Math.floor(Math.random() * palette.length)];
                                alpha = toneRoll < 0.68
                                    ? 44 + Math.floor(Math.random() * 28)
                                    : toneRoll < 0.9
                                        ? 28 + Math.floor(Math.random() * 22)
                                        : toneRoll < 0.97
                                            ? 22 + Math.floor(Math.random() * 20)
                                            : 10 + Math.floor(Math.random() * 14);
                                sharedJitter = Math.floor((Math.random() - 0.5) * (toneRoll < 0.9 ? 28 : 16));
                                channelJitter = toneRoll < 0.97 ? 12 : 8;
                            }

                            data[i] = Math.max(0, Math.min(255, color[0] + sharedJitter + Math.floor((Math.random() - 0.5) * channelJitter)));
                            data[i + 1] = Math.max(0, Math.min(255, color[1] + sharedJitter + Math.floor((Math.random() - 0.5) * channelJitter)));
                            data[i + 2] = Math.max(0, Math.min(255, color[2] + sharedJitter + Math.floor((Math.random() - 0.5) * channelJitter)));
                            data[i + 3] = Math.max(0, Math.min(255, Math.round(alpha * alphaMultiplier)));
                        }
                    };

                    writeFilmGrain(image.data, isDark ? 1.18 : 1.16);
                    rawCtx.putImageData(image, 0, 0);

                    grainCtx.save();
                    grainCtx.imageSmoothingEnabled = false;
                    grainCtx.drawImage(rawTexture, 0, 0, texture.width, texture.height);
                    grainCtx.restore();

                    const microTexture = document.createElement("canvas");
                    microTexture.width = texture.width;
                    microTexture.height = texture.height;
                    const microCtx = microTexture.getContext("2d");
                    const microImage = microCtx.createImageData(texture.width, texture.height);
                    writeFilmGrain(microImage.data, isDark ? 0.36 : 0.3);
                    microCtx.putImageData(microImage, 0, 0);
                    grainCtx.drawImage(microTexture, 0, 0);

                    return texture;
                }

                createDarkDither() {
                    const texture = document.createElement("canvas");
                    texture.width = Math.max(1, Math.floor(this.width * this.dpr));
                    texture.height = Math.max(1, Math.floor(this.height * this.dpr));
                    const ditherCtx = texture.getContext("2d");
                    const image = ditherCtx.createImageData(texture.width, texture.height);
                    const data = image.data;

                    for (let i = 0; i < data.length; i += 4) {
                        const isLightSpeck = Math.random() > 0.44;
                        const alpha = isLightSpeck
                            ? 6 + Math.floor(Math.random() * 8)
                            : 4 + Math.floor(Math.random() * 5);

                        data[i] = isLightSpeck ? 255 : 10;
                        data[i + 1] = isLightSpeck ? 255 : 12;
                        data[i + 2] = isLightSpeck ? 255 : 16;
                        data[i + 3] = alpha;
                    }

                    ditherCtx.putImageData(image, 0, 0);
                    return texture;
                }

                drawLightRightEdgeSupport(t) {
                    const ctx = this.ctx;
                    const w = this.width;
                    const h = this.height;
                    ctx.save();
                    ctx.globalCompositeOperation = "source-over";

                    const intensity = this.isSubtle ? 0.58 : 1;
                    const pulse = (0.92 + 0.08 * Math.sin(t * 0.0005)) * intensity;
                    const rightWash = ctx.createLinearGradient(w * 0.36, 0, w, 0);
                    rightWash.addColorStop(0, "rgba(255,255,255,0)");
                    rightWash.addColorStop(0.42, `rgba(200,220,255,${0.045 * pulse})`);
                    rightWash.addColorStop(0.66, `rgba(140,100,255,${0.075 * pulse})`);
                    rightWash.addColorStop(0.84, `rgba(255,120,160,${0.085 * pulse})`);
                    rightWash.addColorStop(1, `rgba(40,140,255,${0.11 * pulse})`);
                    ctx.fillStyle = rightWash;
                    ctx.fillRect(0, 0, w, h);

                    const supportRadius = Math.max(w, h) * 0.42;
                    const supportGlows = [
                        { x: w * 1.02, y: h * 0.12, radius: supportRadius, color: [255, 120, 160], alpha: 0.18 },
                        { x: w * 0.96, y: h * 0.42, radius: supportRadius * 1.05, color: [140, 100, 255], alpha: 0.16 },
                        { x: w * 1.02, y: h * 0.86, radius: supportRadius * 1.08, color: [40, 140, 255], alpha: 0.18 },
                        { x: w * 0.78, y: h * 0.62, radius: supportRadius * 0.9, color: [80, 220, 180], alpha: 0.035 }
                    ];

                    for (const glow of supportGlows) {
                        const [r, g, b] = glow.color;
                        const grd = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius);
                        grd.addColorStop(0, `rgba(${r},${g},${b},${glow.alpha * pulse})`);
                        grd.addColorStop(0.58, `rgba(${r},${g},${b},${glow.alpha * 0.3 * pulse})`);
                        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
                        ctx.fillStyle = grd;
                        ctx.fillRect(0, 0, w, h);
                    }

                    ctx.restore();
                }

                drawDarkRightEdgeSupport(t) {
                    const ctx = this.ctx;
                    const w = this.width;
                    const h = this.height;
                    ctx.save();
                    ctx.globalCompositeOperation = "screen";

                    const intensity = this.isSubtle ? 0.58 : 1;
                    const pulse = (0.86 + 0.14 * Math.sin(t * 0.00062)) * intensity;
                    const rightWash = ctx.createLinearGradient(w * 0.5, 0, w, 0);
                    rightWash.addColorStop(0, "rgba(0,0,0,0)");
                    rightWash.addColorStop(0.56, `rgba(138,93,255,${0.035 * pulse})`);
                    rightWash.addColorStop(0.82, `rgba(39,140,255,${0.05 * pulse})`);
                    rightWash.addColorStop(1, `rgba(255,93,142,${0.055 * pulse})`);
                    ctx.fillStyle = rightWash;
                    ctx.fillRect(0, 0, w, h);

                    const cornerGlowRadius = Math.max(w, h) * 0.44;
                    const cornerGlows = [
                        { x: w * 1.03, y: h * 0.06, radius: cornerGlowRadius, color: [255, 93, 142], alpha: 0.14 },
                        { x: w * 1.04, y: h * 0.92, radius: cornerGlowRadius * 1.05, color: [39, 140, 255], alpha: 0.15 },
                        { x: w * 0.9, y: h * 0.52, radius: cornerGlowRadius * 0.82, color: [45, 220, 177], alpha: 0.03 }
                    ];

                    for (const glow of cornerGlows) {
                        const [r, g, b] = glow.color;
                        const grd = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius);
                        grd.addColorStop(0, `rgba(${r},${g},${b},${glow.alpha * pulse})`);
                        grd.addColorStop(0.58, `rgba(${r},${g},${b},${glow.alpha * 0.28 * pulse})`);
                        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
                        ctx.fillStyle = grd;
                        ctx.fillRect(0, 0, w, h);
                    }

                    ctx.restore();
                }

                drawLightTopSupport(t) {
                    const ctx = this.ctx;
                    const w = this.width;
                    const h = this.height;
                    ctx.save();
                    ctx.globalCompositeOperation = "source-over";

                    const intensity = this.isSubtle ? 0.64 : 1;
                    const pulse = (0.9 + 0.1 * Math.sin(t * 0.0007)) * intensity;
                    const topWash = ctx.createLinearGradient(0, 0, 0, h);
                    topWash.addColorStop(0, `rgba(200,220,255,${0.105 * pulse})`);
                    topWash.addColorStop(0.18, `rgba(140,100,255,${0.062 * pulse})`);
                    topWash.addColorStop(0.34, `rgba(255,120,160,${0.052 * pulse})`);
                    topWash.addColorStop(0.58, `rgba(80,220,180,${0.024 * pulse})`);
                    topWash.addColorStop(1, "rgba(255,255,255,0)");
                    ctx.fillStyle = topWash;
                    ctx.fillRect(0, 0, w, h);

                    const supportRadius = Math.max(w, h) * 0.42;
                    const supportGlows = [
                        { x: w * 0.16, y: h * -0.04, radius: supportRadius, color: [80, 220, 180], alpha: 0.06 },
                        { x: w * 0.36, y: h * -0.05, radius: supportRadius * 1.04, color: [255, 120, 160], alpha: 0.13 },
                        { x: w * 0.64, y: h * -0.02, radius: supportRadius * 1.08, color: [140, 100, 255], alpha: 0.13 },
                        { x: w * 0.86, y: h * 0.02, radius: supportRadius * 1.12, color: [40, 140, 255], alpha: 0.15 }
                    ];

                    for (const glow of supportGlows) {
                        const [r, g, b] = glow.color;
                        const grd = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius);
                        grd.addColorStop(0, `rgba(${r},${g},${b},${glow.alpha * pulse})`);
                        grd.addColorStop(0.52, `rgba(${r},${g},${b},${glow.alpha * 0.28 * pulse})`);
                        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
                        ctx.fillStyle = grd;
                        ctx.fillRect(0, 0, w, h);
                    }

                    ctx.restore();
                }

                drawDarkTopSupport(t) {
                    const ctx = this.ctx;
                    const w = this.width;
                    const h = this.height;
                    ctx.save();
                    ctx.globalCompositeOperation = "screen";

                    const intensity = this.isSubtle ? 0.68 : 1;
                    const pulse = (0.86 + 0.14 * Math.sin(t * 0.00072)) * intensity;
                    const topWash = ctx.createLinearGradient(0, 0, 0, h);
                    topWash.addColorStop(0, `rgba(138,93,255,${0.082 * pulse})`);
                    topWash.addColorStop(0.18, `rgba(39,140,255,${0.058 * pulse})`);
                    topWash.addColorStop(0.34, `rgba(255,93,142,${0.043 * pulse})`);
                    topWash.addColorStop(0.58, `rgba(45,220,177,${0.018 * pulse})`);
                    topWash.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = topWash;
                    ctx.fillRect(0, 0, w, h);

                    const supportRadius = Math.max(w, h) * 0.42;
                    const supportGlows = [
                        { x: w * 0.18, y: h * -0.04, radius: supportRadius, color: [45, 220, 177], alpha: 0.035 },
                        { x: w * 0.34, y: h * -0.05, radius: supportRadius * 1.04, color: [255, 93, 142], alpha: 0.105 },
                        { x: w * 0.62, y: h * -0.02, radius: supportRadius * 1.08, color: [138, 93, 255], alpha: 0.12 },
                        { x: w * 0.86, y: h * 0.02, radius: supportRadius * 1.12, color: [39, 140, 255], alpha: 0.13 }
                    ];

                    for (const glow of supportGlows) {
                        const [r, g, b] = glow.color;
                        const grd = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius);
                        grd.addColorStop(0, `rgba(${r},${g},${b},${glow.alpha * pulse})`);
                        grd.addColorStop(0.54, `rgba(${r},${g},${b},${glow.alpha * 0.3 * pulse})`);
                        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
                        ctx.fillStyle = grd;
                        ctx.fillRect(0, 0, w, h);
                    }

                    ctx.restore();
                }

                drawNeutralSupport(t) {
                    const ctx = this.ctx;
                    const w = this.width;
                    const h = this.height;
                    const cycle = t * 0.00044;
                    const focusX = w * (0.5 + Math.sin(cycle) * 0.04);
                    const focusY = h * (0.48 + Math.cos(cycle * 0.86) * 0.035);
                    const radius = Math.max(w, h) * 0.74;
                    const washAlpha = this.isSubtle ? 1.18 : 0.88;

                    ctx.save();
                    ctx.globalCompositeOperation = "source-over";

                    const centerWash = ctx.createRadialGradient(focusX, focusY, radius * 0.06, focusX, focusY, radius);
                    if (this.isDark) {
                        centerWash.addColorStop(0, `rgba(26,27,30,${0.18 * washAlpha})`);
                        centerWash.addColorStop(0.48, `rgba(26,27,30,${0.08 * washAlpha})`);
                        centerWash.addColorStop(1, "rgba(26,27,30,0)");
                    } else {
                        centerWash.addColorStop(0, `rgba(255,255,255,${0.34 * washAlpha})`);
                        centerWash.addColorStop(0.46, `rgba(255,255,255,${0.18 * washAlpha})`);
                        centerWash.addColorStop(1, "rgba(255,255,255,0)");
                    }
                    ctx.fillStyle = centerWash;
                    ctx.fillRect(0, 0, w, h);

                    const crossWash = ctx.createLinearGradient(0, h * 0.1, w, h * 0.92);
                    if (this.isDark) {
                        crossWash.addColorStop(0, `rgba(26,27,30,${0.08 * washAlpha})`);
                        crossWash.addColorStop(0.52, "rgba(26,27,30,0)");
                        crossWash.addColorStop(1, `rgba(26,27,30,${0.065 * washAlpha})`);
                    } else {
                        crossWash.addColorStop(0, `rgba(255,255,255,${0.08 * washAlpha})`);
                        crossWash.addColorStop(0.5, "rgba(255,255,255,0)");
                        crossWash.addColorStop(1, `rgba(255,255,255,${0.07 * washAlpha})`);
                    }
                    ctx.fillStyle = crossWash;
                    ctx.fillRect(0, 0, w, h);

                    const minSide = Math.min(w, h);
                    const veilAlpha = this.isSubtle ? 1.34 : 0.32;
                    const veilTone = this.isDark ? "26,27,30" : "255,255,255";

                    for (const veil of NEUTRAL_VEIL_BLOBS) {
                        const x = w * veil.anchorX + Math.sin(t * veil.freqX + veil.phase) * veil.orbitX;
                        const y = h * veil.anchorY + Math.cos(t * veil.freqY + veil.phase) * veil.orbitY;
                        const veilRadius = minSide * veil.radius;
                        const alpha = veil.opacity * veilAlpha;
                        const neutralBlob = ctx.createRadialGradient(x, y, veilRadius * 0.06, x, y, veilRadius);
                        neutralBlob.addColorStop(0, `rgba(${veilTone},${alpha})`);
                        neutralBlob.addColorStop(0.54, `rgba(${veilTone},${alpha * 0.42})`);
                        neutralBlob.addColorStop(1, `rgba(${veilTone},0)`);
                        ctx.fillStyle = neutralBlob;
                        ctx.fillRect(0, 0, w, h);
                    }
                    ctx.restore();
                }

                drawSupport(t) {
                    if (this.layout === "neutral") {
                        this.drawNeutralSupport(t);
                        return;
                    }

                    if (this.layout === "top-wash") {
                        if (this.isDark) this.drawDarkTopSupport(t);
                        else this.drawLightTopSupport(t);
                        return;
                    }

                    const draw = () => {
                        if (this.isDark) {
                            this.drawDarkRightEdgeSupport(t);
                        } else {
                            this.drawLightRightEdgeSupport(t);
                        }
                    };

                    if (this.layout === "left-wash") {
                        this.ctx.save();
                        this.ctx.translate(this.width, 0);
                        this.ctx.scale(-1, 1);
                        draw();
                        this.ctx.restore();
                    } else {
                        draw();
                    }
                }

                drawDarkFalloff() {
                    const ctx = this.ctx;
                    if (this.layout === "top-wash") {
                        const topFalloff = ctx.createLinearGradient(0, 0, 0, this.height);
                        topFalloff.addColorStop(0, "rgba(26,27,30,0.26)");
                        topFalloff.addColorStop(0.28, "rgba(26,27,30,0.16)");
                        topFalloff.addColorStop(0.58, "rgba(26,27,30,0.06)");
                        topFalloff.addColorStop(1, "rgba(26,27,30,0)");
                        ctx.fillStyle = topFalloff;
                        ctx.fillRect(0, 0, this.width, this.height);
                        return;
                    }
                    const startX = this.layout === "left-wash" ? this.width : 0;
                    const endX = this.layout === "left-wash" ? 0 : this.width;
                    const falloff = ctx.createLinearGradient(startX, 0, endX, this.height);
                    falloff.addColorStop(0, "rgba(26,27,30,0.38)");
                    falloff.addColorStop(0.42, "rgba(26,27,30,0.2)");
                    falloff.addColorStop(0.78, "rgba(26,27,30,0.04)");
                    falloff.addColorStop(1, "rgba(26,27,30,0)");
                    ctx.fillStyle = falloff;
                    ctx.fillRect(0, 0, this.width, this.height);
                }

                ensureTextures() {
                    const nextKey = `${this.width}x${this.height}@${this.dpr}`;
                    if (nextKey === this.textureKey) return;
                    this.textureKey = nextKey;
                    this.lightGrain = this.createGrain("light");
                    this.darkGrain = this.createGrain("dark");
                    this.darkDither = this.createDarkDither();
                    this.blobCanvas.width = Math.max(1, Math.floor(this.width * this.dpr));
                    this.blobCanvas.height = Math.max(1, Math.floor(this.height * this.dpr));
                    this.blobCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
                }

                markReady() {
                    if (this.ready) return;
                    this.ready = true;
                    this.element.dataset.radianceReady = "true";
                    this.element.dispatchEvent(new CustomEvent("radiance-local-ready", { bubbles: true }));
                }

                render(timestamp) {
                    if (!this.isRenderable()) return;
                    this.ensureSize();
                    this.ensureBlobs();
                    this.ensureTextures();

                    const t = (this.isStill ? 0 : timestamp * this.speed);
                    const ctx = this.ctx;
                    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

                    if (this.isDark) {
                        ctx.fillStyle = DARK_SURFACE;
                    } else {
                        ctx.fillStyle = "#ffffff";
                    }
                    ctx.fillRect(0, 0, this.width, this.height);

                    if (this.isDark) {
                        this.blobCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
                        this.blobCtx.clearRect(0, 0, this.width, this.height);
                        for (const blob of this.blobs) {
                            blob.update(t, this.width, this.height, this.mouse);
                            blob.draw(this.blobCtx);
                        }

                        ctx.save();
                        ctx.filter = `blur(${this.layout === "neutral" ? 40 : 64}px)`;
                        ctx.globalCompositeOperation = "screen";
                        ctx.drawImage(this.blobCanvas, 0, 0, this.width, this.height);
                        ctx.restore();

                        this.drawSupport(t);

                        if ((this.element.dataset.radianceDarkGlow || "subtle") === "subtle") {
                            this.drawDarkFalloff();
                        }

                        ctx.save();
                        ctx.globalAlpha = 0.42;
                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(this.darkDither, 0, 0, this.width, this.height);
                        ctx.restore();
                        ctx.save();
                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(this.darkGrain, 0, 0, this.width, this.height);
                        ctx.restore();
                    } else {
                        ctx.save();
                        ctx.filter = `blur(${this.layout === "neutral" ? 22 : 40}px)`;
                        for (const blob of this.blobs) {
                            blob.update(t, this.width, this.height, this.mouse);
                            blob.draw(ctx);
                        }
                        ctx.restore();
                        this.drawSupport(t);
                        ctx.save();
                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(this.lightGrain, 0, 0, this.width, this.height);
                        ctx.restore();
                    }

                    this.markReady();
                }
            }

            function scan() {
                document.querySelectorAll(".radiance-local").forEach((element) => {
                    if ([...surfaces].some((surface) => surface.element === element)) return;
                    surfaces.add(new RadianceSurface(element));
                });
            }

            function frame(timestamp) {
                scan();
                surfaces.forEach((surface) => surface.render(timestamp));
                raf = window.requestAnimationFrame(frame);
            }

            function renderGrainPreview(canvas, mode = "light") {
                if (!(canvas instanceof HTMLCanvasElement)) return;
                const safeMode = mode === "dark" ? "dark" : "light";
                const rect = canvas.getBoundingClientRect();
                const maxWidth = Number(canvas.dataset.grainPreviewMaxWidth || "0");
                const maxHeight = Number(canvas.dataset.grainPreviewMaxHeight || "0");
                const measuredWidth = Math.max(1, Math.round(rect.width || canvas.clientWidth || canvas.width || 280));
                const measuredHeight = Math.max(1, Math.round(rect.height || canvas.clientHeight || canvas.height || 120));
                const width = maxWidth > 0 ? Math.min(measuredWidth, maxWidth) : measuredWidth;
                const height = maxHeight > 0 ? Math.min(measuredHeight, maxHeight) : measuredHeight;
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                canvas.width = Math.max(1, Math.floor(width * dpr));
                canvas.height = Math.max(1, Math.floor(height * dpr));
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.fillStyle = safeMode === "dark" ? DARK_SURFACE : "#ffffff";
                ctx.fillRect(0, 0, width, height);

                if (safeMode === "dark") {
                    const dither = RadianceSurface.prototype.createDarkDither.call({ width, height, dpr: 1 });
                    ctx.save();
                    ctx.globalAlpha = 0.42;
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(dither, 0, 0, width, height);
                    ctx.restore();
                }

                const grain = RadianceSurface.prototype.createGrain.call({ width, height }, safeMode);
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(grain, 0, 0, width, height);
                ctx.restore();
            }

            window.RadianceLanguageRenderer = {
                refresh: scan,
                renderGrainPreview,
                grainSize: RADIANCE_FILM_GRAIN_SIZE
            };

            scan();
            raf = window.requestAnimationFrame(frame);
            window.addEventListener("beforeunload", () => window.cancelAnimationFrame(raf));
        })();
    } catch (e) {
        // The pane keeps its static fallback when the renderer cannot start.
    }
}
