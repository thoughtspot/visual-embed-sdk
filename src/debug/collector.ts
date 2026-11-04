/**
 * Full page collector. Loaded lazily (dynamic import) only after the user
 * allows a diagnostics session, so it costs nothing until then.
 *
 * Everything here uses plain web APIs available to any script on the page:
 * no DevTools protocol, no extension. Each hook is wrapped so a failure only
 * disables that hook. `stop()` restores every patched global it still owns.
 */
import { emit, describeElement } from './bus';
import { redactText, redactUrl, serializeArgs } from './redact';

export interface CollectorOptions {
    thoughtSpotHost: string;
    consoleLevels: Array<'log' | 'info' | 'warn' | 'error' | 'debug'>;
}

type Teardown = () => void;

const ANCESTOR_STYLE_PROPS = [
    'display', 'visibility', 'position', 'overflow', 'overflowY', 'transform', 'filter', 'zIndex',
    'opacity', 'height', 'width', 'minHeight', 'maxHeight', 'contain', 'pointerEvents',
] as const;

const PAGE_STYLE_PROPS = [
    'fontFamily', 'fontSize', 'color', 'backgroundColor', 'lineHeight',
] as const;

const isNative = (fn: unknown): boolean => {
    try {
        return typeof fn === 'function' && Function.prototype.toString.call(fn).includes('[native code]');
    } catch (e) {
        return false;
    }
};

const safely = (teardowns: Teardown[], name: string, install: () => Teardown | void): void => {
    try {
        const teardown = install();
        if (teardown) teardowns.push(teardown);
    } catch (e) {
        emit('snapshot', 'collector-hook-failed', 'warn', { hook: name, message: String((e as Error)?.message || e) });
    }
};

const pickStyles = <K extends string>(el: Element, props: readonly K[]): Record<K, string> => {
    const computed = window.getComputedStyle(el) as unknown as Record<string, string>;
    const out = {} as Record<K, string>;
    props.forEach((prop) => {
        out[prop] = computed[prop];
    });
    return out;
};

/**
 * Finds ThoughtSpot iframes on the page by their origin.
 * @param host
 */
export function findEmbedFrames(host: string): HTMLIFrameElement[] {
    let origin = '';
    try {
        origin = new URL(host).origin;
    } catch (e) {
        return [];
    }
    return Array.from(document.querySelectorAll('iframe')).filter((frame) => {
        try {
            return new URL(frame.src, window.location.href).origin === origin;
        } catch (e) {
            return false;
        }
    });
}

/**
 * Snapshot of an embed iframe, its container chain up to <body>, and the
 * element actually painted at its centre (to catch overlays).
 * @param frame
 */
export function snapshotEmbedNeighbourhood(frame: HTMLIFrameElement): Record<string, unknown> {
    const rect = frame.getBoundingClientRect();
    const ancestors: Array<Record<string, unknown>> = [];
    let el: Element | null = frame.parentElement;
    while (el && el !== document.documentElement && ancestors.length < 25) {
        const r = el.getBoundingClientRect();
        ancestors.push({
            element: describeElement(el),
            rect: {
                x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height),
            },
            styles: pickStyles(el, ANCESTOR_STYLE_PROPS),
        });
        el = el.parentElement;
    }
    let topElement: string | null = null;
    if (rect.width > 0 && rect.height > 0 && typeof document.elementFromPoint === 'function') {
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        topElement = hit === frame ? 'iframe' : describeElement(hit);
    }
    return {
        iframe: describeElement(frame),
        src: redactUrl(frame.src),
        rect: {
            x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height),
        },
        styles: pickStyles(frame, ANCESTOR_STYLE_PROPS),
        topElementAtCentre: topElement,
        ancestors,
    };
}

/** Compact outline of the page structure: tags, ids, classes. No text. */
export function outlineDom(root: Element = document.body, maxNodes = 400, maxDepth = 8): unknown {
    let count = 0;
    const walk = (el: Element, depth: number): unknown => {
        count += 1;
        const node: Record<string, unknown> = { el: describeElement(el) };
        if (el.tagName === 'IFRAME') node.src = redactUrl((el as HTMLIFrameElement).src);
        if (depth < maxDepth && el.children.length) {
            const children: unknown[] = [];
            Array.from(el.children).forEach((child) => {
                if (count >= maxNodes) return;
                if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'].includes(child.tagName)) return;
                children.push(walk(child, depth + 1));
            });
            if (children.length) node.children = children;
            if (count >= maxNodes) node.truncated = true;
        }
        return node;
    };
    return walk(root, 0);
}

/** CSS custom properties declared on :root in same-origin stylesheets. */
export function collectRootCssVariables(limit = 150): Record<string, string> {
    const vars: Record<string, string> = {};
    const rootStyle = window.getComputedStyle(document.documentElement);
    let crossOriginSheets = 0;
    Array.from(document.styleSheets).forEach((sheet) => {
        let rules: CSSRuleList;
        try {
            rules = sheet.cssRules;
        } catch (e) {
            crossOriginSheets += 1;
            return;
        }
        Array.from(rules).forEach((rule) => {
            const styleRule = rule as CSSStyleRule;
            if (!styleRule.selectorText || !/(^|,)\s*(:root|html)\s*(,|$)/.test(styleRule.selectorText)) return;
            Array.from(styleRule.style).forEach((prop) => {
                if (prop.startsWith('--') && Object.keys(vars).length < limit) {
                    vars[prop] = rootStyle.getPropertyValue(prop).trim();
                }
            });
        });
    });
    if (crossOriginSheets) vars['__crossOriginSheetsSkipped'] = String(crossOriginSheets);
    return vars;
}

/**
 * Starts every full-page hook. Returns `stop`.
 * @param options
 */
export function startCollector(options: CollectorOptions): () => void {
    const teardowns: Teardown[] = [];
    const clusterOrigin = (() => {
        try {
            return new URL(options.thoughtSpotHost).origin;
        } catch (e) {
            return '';
        }
    })();
    const isClusterUrl = (url: string) => !!clusterOrigin && url.startsWith(clusterOrigin);

    // Patched-globals check runs first, before we patch anything ourselves.
    safely(teardowns, 'globals', () => {
        const w = window as unknown as Record<string, unknown>;
        const checks: Record<string, unknown> = {
            'window.postMessage': window.postMessage,
            'EventTarget.prototype.addEventListener': EventTarget.prototype.addEventListener,
            'EventTarget.prototype.removeEventListener': EventTarget.prototype.removeEventListener,
            'window.fetch': window.fetch,
            'XMLHttpRequest.prototype.open': XMLHttpRequest.prototype.open,
            'XMLHttpRequest.prototype.send': XMLHttpRequest.prototype.send,
            Promise: w.Promise,
            MutationObserver: w.MutationObserver,
            'history.pushState': history.pushState,
            'console.error': console.error,
        };
        const patched = Object.keys(checks).filter((name) => !isNative(checks[name]));
        emit('snapshot', 'globals', patched.length ? 'warn' : 'info', {
            patched,
            zoneJs: !!w.Zone,
            frameworks: {
                react: !!document.querySelector('[data-reactroot]') || !!w.__REACT_DEVTOOLS_GLOBAL_HOOK__,
                angular: !!w.ng || !!document.querySelector('[ng-version]'),
                vue: !!w.__VUE__,
            },
        });
    });

    safely(teardowns, 'context', () => {
        const sw = navigator.serviceWorker?.controller;
        emit('snapshot', 'context', 'info', {
            url: redactUrl(window.location.href),
            referrerPolicy: document.referrer ? 'set' : 'none',
            userAgent: navigator.userAgent,
            language: navigator.language,
            viewport: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio },
            serviceWorker: sw ? { scriptURL: redactUrl(sw.scriptURL), state: sw.state } : null,
            cookiesEnabled: navigator.cookieEnabled,
            visibility: document.visibilityState,
        });
    });

    safely(teardowns, 'page-styles', () => {
        emit('snapshot', 'page-styles', 'info', {
            body: pickStyles(document.body, PAGE_STYLE_PROPS),
            rootVariables: collectRootCssVariables(),
        });
    });

    safely(teardowns, 'dom-outline', () => {
        emit('snapshot', 'dom-outline', 'info', { outline: outlineDom() });
    });

    const snapshotFrames = (reason: string) => {
        findEmbedFrames(options.thoughtSpotHost).forEach((frame) => {
            emit('snapshot', 'embed-neighbourhood', 'info', { reason, ...snapshotEmbedNeighbourhood(frame) });
        });
    };
    safely(teardowns, 'embed-neighbourhood', () => snapshotFrames('session-start'));

    // Console.
    safely(teardowns, 'console', () => {
        const restores: Teardown[] = [];
        options.consoleLevels.forEach((level) => {
            const original = console[level];
            const wrapped = function wrappedConsole(this: unknown, ...args: unknown[]) {
                try {
                    emit('host', 'console', level === 'log' ? 'info' : level, { method: level, message: serializeArgs(args) });
                } catch (e) {
                    // ignore
                }
                return original.apply(this, args);
            };
            console[level] = wrapped as typeof console.log;
            restores.push(() => {
                if (console[level] === (wrapped as unknown)) console[level] = original;
            });
        });
        return () => restores.forEach((restore) => restore());
    });

    // fetch.
    safely(teardowns, 'fetch', () => {
        const original = window.fetch;
        if (typeof original !== 'function') return undefined;
        const wrapped = function wrappedFetch(this: unknown, input: RequestInfo | URL, init?: RequestInit) {
            const started = performance.now();
            const url = typeof input === 'string' ? input : (input as Request).url || String(input);
            const method = (init?.method || (input as Request)?.method || 'GET').toUpperCase();
            const record = (status: number, error?: string) => {
                const absolute = new URL(url, window.location.href).toString();
                emit('host', 'network', status === 0 || status >= 400 ? 'warn' : 'debug', {
                    initiator: 'fetch',
                    method,
                    url: redactUrl(absolute),
                    status,
                    durationMs: Math.round(performance.now() - started),
                    toCluster: isClusterUrl(absolute),
                    error: error ? redactText(error) : undefined,
                });
            };
            return original.call(this, input as RequestInfo, init).then(
                (response: Response) => {
                    try {
                        record(response.status);
                    } catch (e) {
                        // ignore
                    }
                    return response;
                },
                (err: Error) => {
                    try {
                        record(0, String(err?.message || err));
                    } catch (e) {
                        // ignore
                    }
                    throw err;
                },
            );
        };
        window.fetch = wrapped as typeof fetch;
        return () => {
            if (window.fetch === (wrapped as unknown)) window.fetch = original;
        };
    });

    // XHR.
    safely(teardowns, 'xhr', () => {
        const proto = XMLHttpRequest.prototype;
        const originalOpen = proto.open;
        const originalSend = proto.send;
        const meta = new WeakMap<XMLHttpRequest, { method: string; url: string; started?: number }>();
        const open = function wrappedOpen(this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
            meta.set(this, { method: String(method).toUpperCase(), url: String(url) });
            return (originalOpen as (...a: unknown[]) => void).call(this, method, url, ...rest);
        };
        const send = function wrappedSend(this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
            const info = meta.get(this);
            if (info) {
                info.started = performance.now();
                this.addEventListener('loadend', () => {
                    try {
                        const absolute = new URL(info.url, window.location.href).toString();
                        emit('host', 'network', this.status === 0 || this.status >= 400 ? 'warn' : 'debug', {
                            initiator: 'xhr',
                            method: info.method,
                            url: redactUrl(absolute),
                            status: this.status,
                            durationMs: Math.round(performance.now() - (info.started || 0)),
                            toCluster: isClusterUrl(absolute),
                        });
                    } catch (e) {
                        // ignore
                    }
                });
            }
            return originalSend.call(this, body);
        };
        proto.open = open as typeof proto.open;
        proto.send = send;
        return () => {
            if (proto.open === (open as unknown)) proto.open = originalOpen;
            if (proto.send === send) proto.send = originalSend;
        };
    });

    // Browser reports (deprecations, interventions).
    safely(teardowns, 'reporting', () => {
        const RO = (window as unknown as { ReportingObserver?: any }).ReportingObserver;
        if (!RO) return undefined;
        const observer = new RO((reports: Array<{ type: string; url: string; body?: any }>) => {
            reports.forEach((report) => {
                emit('browser', `report:${report.type}`, 'warn', {
                    url: redactUrl(report.url),
                    message: report.body?.message ? redactText(String(report.body.message)) : undefined,
                    id: report.body?.id,
                    sourceFile: report.body?.sourceFile ? redactUrl(report.body.sourceFile) : undefined,
                });
            });
        }, { buffered: true });
        observer.observe();
        return () => observer.disconnect();
    });

    // Main-thread blocking: Long Animation Frames, falling back to long tasks.
    safely(teardowns, 'performance', () => {
        if (typeof PerformanceObserver === 'undefined') return undefined;
        const supported: readonly string[] = (PerformanceObserver as any).supportedEntryTypes || [];
        const observers: PerformanceObserver[] = [];
        if (supported.includes('long-animation-frame')) {
            const loaf = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: any) => {
                    if (entry.duration < 150) return;
                    emit('browser', 'long-animation-frame', 'warn', {
                        durationMs: Math.round(entry.duration),
                        blockingMs: Math.round(entry.blockingDuration || 0),
                        scripts: (entry.scripts || []).slice(0, 5).map((s: any) => ({
                            source: s.sourceURL ? redactUrl(s.sourceURL) : null,
                            function: s.sourceFunctionName || null,
                            invoker: s.invoker ? redactText(String(s.invoker)).slice(0, 200) : null,
                            durationMs: Math.round(s.duration),
                            forcedLayoutMs: Math.round(s.forcedStyleAndLayoutDuration || 0),
                        })),
                    });
                });
            });
            loaf.observe({ type: 'long-animation-frame', buffered: true } as PerformanceObserverInit);
            observers.push(loaf);
        } else if (supported.includes('longtask')) {
            const lt = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    emit('browser', 'long-task', 'warn', { durationMs: Math.round(entry.duration) });
                });
            });
            lt.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit);
            observers.push(lt);
        }
        if (supported.includes('resource')) {
            const res = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: any) => {
                    const toCluster = isClusterUrl(entry.name);
                    const failed = typeof entry.responseStatus === 'number' && (entry.responseStatus === 0 || entry.responseStatus >= 400);
                    if (!toCluster && !failed && entry.duration < 2000) return;
                    emit('browser', 'resource', failed ? 'warn' : 'debug', {
                        url: redactUrl(entry.name),
                        initiator: entry.initiatorType,
                        durationMs: Math.round(entry.duration),
                        status: entry.responseStatus,
                        transferSize: entry.transferSize,
                        toCluster,
                    });
                });
            });
            res.observe({ type: 'resource', buffered: true } as PerformanceObserverInit);
            observers.push(res);
        }
        return () => observers.forEach((o) => o.disconnect());
    });

    // SPA navigation.
    safely(teardowns, 'history', () => {
        const originalPush = history.pushState;
        const originalReplace = history.replaceState;
        const record = (kind: string) => emit('host', 'navigation', 'info', { kind, url: redactUrl(window.location.href) });
        const push = function wrappedPush(this: History, ...args: Parameters<History['pushState']>) {
            const result = originalPush.apply(this, args);
            record('pushState');
            return result;
        };
        const replace = function wrappedReplace(this: History, ...args: Parameters<History['replaceState']>) {
            const result = originalReplace.apply(this, args);
            record('replaceState');
            return result;
        };
        const onPop = () => record('popstate');
        history.pushState = push;
        history.replaceState = replace;
        window.addEventListener('popstate', onPop);
        return () => {
            if (history.pushState === push) history.pushState = originalPush;
            if (history.replaceState === replace) history.replaceState = originalReplace;
            window.removeEventListener('popstate', onPop);
        };
    });

    // Embed iframes added, removed or moved; size and visibility changes.
    safely(teardowns, 'embed-lifecycle', () => {
        const tracked = new Set<HTMLIFrameElement>();
        const lastLayout = new WeakMap<HTMLIFrameElement, string>();
        const resize = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver((entries) => {
                entries.forEach((entry) => {
                    const frame = entry.target as HTMLIFrameElement;
                    const { width, height } = entry.contentRect;
                    const state = width < 2 || height < 2 ? 'collapsed' : 'sized';
                    if (lastLayout.get(frame) === state) return;
                    lastLayout.set(frame, state);
                    emit('host', 'embed-layout', state === 'collapsed' ? 'warn' : 'info', {
                        iframe: describeElement(frame),
                        state,
                        width: Math.round(width),
                        height: Math.round(height),
                    });
                });
            })
            : null;
        const visibility = typeof IntersectionObserver !== 'undefined'
            ? new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    emit('host', 'embed-visibility', 'info', {
                        iframe: describeElement(entry.target),
                        visible: entry.isIntersecting,
                        ratio: Math.round(entry.intersectionRatio * 100) / 100,
                    });
                });
            })
            : null;
        const track = (frame: HTMLIFrameElement) => {
            if (tracked.has(frame)) return;
            tracked.add(frame);
            resize?.observe(frame);
            visibility?.observe(frame);
        };
        findEmbedFrames(options.thoughtSpotHost).forEach(track);
        const mutation = new MutationObserver((records) => {
            records.forEach((record) => {
                record.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    const frames = node.tagName === 'IFRAME' ? [node as HTMLIFrameElement] : Array.from(node.querySelectorAll('iframe'));
                    frames.filter((f) => findEmbedFrames(options.thoughtSpotHost).includes(f)).forEach((frame) => {
                        const known = tracked.has(frame);
                        track(frame);
                        emit('host', known ? 'embed-moved' : 'embed-iframe-added', known ? 'warn' : 'info', {
                            iframe: describeElement(frame),
                            parent: describeElement(frame.parentElement),
                        });
                        emit('snapshot', 'embed-neighbourhood', 'info', { reason: 'iframe-added', ...snapshotEmbedNeighbourhood(frame) });
                    });
                });
                record.removedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    tracked.forEach((frame) => {
                        if (node === frame || node.contains(frame)) {
                            emit('host', 'embed-removed', 'warn', {
                                iframe: describeElement(frame),
                                removedNode: describeElement(node),
                                removedFrom: describeElement(record.target as Element),
                                stillInDocument: document.contains(frame),
                            });
                            if (!document.contains(frame)) {
                                tracked.delete(frame);
                                resize?.unobserve(frame);
                                visibility?.unobserve(frame);
                            }
                        }
                    });
                });
            });
        });
        mutation.observe(document.body, { childList: true, subtree: true });
        return () => {
            mutation.disconnect();
            resize?.disconnect();
            visibility?.disconnect();
        };
    });

    // Message channel interference: who else listens to 'message'.
    safely(teardowns, 'message-listeners', () => {
        const original = window.addEventListener;
        let count = 0;
        const wrapped = function wrappedAdd(this: Window, type: string, ...rest: unknown[]) {
            if (type === 'message' && this === window) {
                count += 1;
                emit('host', 'message-listener-added', 'debug', { total: count });
            }
            return (original as (...a: unknown[]) => void).call(this, type, ...rest);
        };
        window.addEventListener = wrapped as typeof window.addEventListener;
        return () => {
            if (window.addEventListener === (wrapped as unknown)) window.addEventListener = original;
        };
    });

    return () => {
        teardowns.reverse().forEach((teardown) => {
            try {
                teardown();
            } catch (e) {
                // ignore
            }
        });
    };
}
