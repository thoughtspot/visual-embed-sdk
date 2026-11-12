/**
 * The diagnostics event bus.
 *
 * The SDK core writes integration events (init, render, trigger, embed
 * events) here at near-zero cost. Events stay in a small in-memory ring
 * buffer that never leaves the page unless a user consents to a full page
 * diagnostics session, at which point the buffer is drained to the server.
 * That is what lets a session include what happened before the click.
 */
import { DebugEvent, DebugLayer, DebugLevel } from './types';
import { redactText, redactUrl } from './redact';

const MAX_BUFFERED = 400;

type Listener = (event: DebugEvent) => void;

const buffer: DebugEvent[] = [];
const listeners = new Set<Listener>();

const nowMs = (): number => {
    if (typeof performance !== 'undefined' && performance.timeOrigin) {
        return Math.round(performance.timeOrigin + performance.now());
    }
    return Date.now();
};

/**
 * Records one event. Never throws: diagnostics must not break the embed.
 * @param layer
 * @param type
 * @param level
 * @param data
 */
export function emit(
    layer: DebugLayer,
    type: string,
    level: DebugLevel,
    data: Record<string, unknown>,
): void {
    try {
        const event: DebugEvent = {
            ts: nowMs(), layer, type, level, data,
        };
        buffer.push(event);
        if (buffer.length > MAX_BUFFERED) buffer.shift();
        listeners.forEach((listener) => {
            try {
                listener(event);
            } catch (e) {
                // A broken listener must not affect the others or the SDK.
            }
        });
    } catch (e) {
        // Swallow: diagnostics are best-effort.
    }
}

/**
 * Subscribes to new events. Returns an unsubscribe function.
 * @param listener
 */
export function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Returns a copy of the buffered events (oldest first). */
export function getBufferedEvents(): DebugEvent[] {
    return buffer.slice();
}

/** Test helper: clears buffer and listeners. */
export function resetBus(): void {
    buffer.length = 0;
    listeners.clear();
}

/**
 * Captures the stack at an SDK entry point. The server picks the first frame
 * that is not SDK code, which is the customer's call site.
 */
export function captureCallSite(error: Error = new Error()): string[] {
    const stack = error.stack || '';
    return stack
        .split('\n')
        .slice(1)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('Error'))
        .slice(0, 10)
        .map((line) => redactText(line));
}

let embedSequence = 0;
const embedIds = new WeakMap<object, string>();

/**
 * Stable id for an embed instance, so the timeline can tell a second
 * render of one instance from a new instance.
 * @param instance
 */
export function embedIdOf(instance: object): string {
    let id = embedIds.get(instance);
    if (!id) {
        embedSequence += 1;
        id = `embed-${embedSequence}`;
        embedIds.set(instance, id);
    }
    return id;
}

/**
 * Records an SDK API call with its call site.
 * @param type
 * @param data
 */
export function recordSdkCall(type: string, data: Record<string, unknown>): void {
    // V8 formats `error.stack` lazily. Formatting it (and source-mapping it,
    // in dev tooling) is the expensive part, so it only happens when the
    // event is serialised for a consented session, never on the SDK call.
    const error = new Error();
    let callSite: string[] | undefined;
    const payload = { ...data };
    Object.defineProperty(payload, 'callSite', {
        enumerable: true,
        get: () => {
            if (!callSite) callSite = captureCallSite(error);
            return callSite;
        },
    });
    emit('sdk', type, 'info', payload);
}

/**
 * Describes a DOM element compactly: `div#app.main.panel`.
 * @param el
 */
export function describeElement(el: Element | null | undefined): string | null {
    if (!el || !el.tagName) return null;
    const id = el.id ? `#${el.id}` : '';
    const classes = typeof el.className === 'string' && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).slice(0, 4).join('.')}`
        : '';
    return `${el.tagName.toLowerCase()}${id}${classes}`;
}

let earlyBufferInstalled = false;

/**
 * Installs the small, always-on error hooks: uncaught errors, unhandled
 * rejections and CSP violations. They only write to the local buffer; no
 * data leaves the page without consent.
 */
export function installEarlyErrorBuffer(): void {
    if (earlyBufferInstalled || typeof window === 'undefined') return;
    earlyBufferInstalled = true;
    try {
        window.addEventListener('error', (event: ErrorEvent) => {
            const target = event.target as Element | null;
            if (target && target !== (window as unknown as Element) && target.tagName) {
                // Resource load failure (script, img, link).
                const src = (target as HTMLScriptElement).src || (target as HTMLLinkElement).href || '';
                emit('browser', 'resource-error', 'error', {
                    element: describeElement(target),
                    url: src ? redactUrl(src) : null,
                });
                return;
            }
            emit('host', 'uncaught-error', 'error', {
                message: redactText(String(event.message || '')),
                source: event.filename ? redactUrl(event.filename) : null,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack ? redactText(String(event.error.stack)).slice(0, 4000) : null,
            });
        }, true);
        window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            const reason = event.reason as { message?: string; stack?: string } | string;
            emit('host', 'unhandled-rejection', 'error', {
                message: redactText(typeof reason === 'string' ? reason : String(reason?.message ?? reason)),
                stack: typeof reason === 'object' && reason?.stack
                    ? redactText(String(reason.stack)).slice(0, 4000)
                    : null,
            });
        });
        document.addEventListener('securitypolicyviolation', (event: SecurityPolicyViolationEvent) => {
            emit('browser', 'csp-violation', 'error', {
                directive: event.effectiveDirective || event.violatedDirective,
                blockedURI: event.blockedURI ? redactUrl(event.blockedURI) : null,
                sourceFile: event.sourceFile ? redactUrl(event.sourceFile) : null,
                disposition: event.disposition,
            });
        });
    } catch (e) {
        // Environments without these APIs simply get no early buffer.
    }
}
