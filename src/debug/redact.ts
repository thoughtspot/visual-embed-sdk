/**
 * In-browser redaction. Runs before anything is buffered for upload, so
 * secrets never leave the page. Mirrors the server-side redactor in
 * embed-ai (src/browser-debugger/security/redactor.ts).
 */

export const REDACTED = '[REDACTED]';

const SENSITIVE_KEYS = new Set([
    'authorization',
    'proxy-authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'api-key',
    'apikey',
    'x-auth-token',
    'token',
    'authtoken',
    'access-token',
    'access_token',
    'accesstoken',
    'refresh-token',
    'refresh_token',
    'client-secret',
    'client_secret',
    'secret',
    'secret-key',
    'password',
    'username',
]);

const SECRET_PATTERNS: Array<{ pattern: RegExp; keepPrefix?: boolean }> = [
    { pattern: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi },
    { pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
    { pattern: /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
    { pattern: /\bAKIA[0-9A-Z]{16}\b/g },
    {
        pattern: /\b((?:api[_-]?key|secret|token|password|access[_-]?token|refresh[_-]?token)\s*[:=]\s*)["']?([A-Za-z0-9\-._~+/]{12,}=*)["']?/gi,
        keepPrefix: true,
    },
    // Email addresses.
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
];

const SENSITIVE_QUERY_PARAMS = new Set([
    'token',
    'access_token',
    'refresh_token',
    'api_key',
    'apikey',
    'secret',
    'client_secret',
    'password',
    'auth',
    'code',
]);

export const isSensitiveKey = (key: string): boolean => SENSITIVE_KEYS.has(key.toLowerCase());

/**
 * Replaces secret-shaped substrings in free text.
 * @param text
 */
export function redactText(text: string): string {
    let result = text;
    SECRET_PATTERNS.forEach(({ pattern, keepPrefix }) => {
        result = result.replace(pattern, (...args) => (keepPrefix ? `${args[1]}${REDACTED}` : REDACTED));
    });
    return result;
}

/**
 * Redacts sensitive query parameters. Relative URLs fall back to text
 * redaction.
 * @param url
 */
export function redactUrl(url: string): string {
    try {
        const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined);
        Array.from(parsed.searchParams.keys()).forEach((key) => {
            if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
                parsed.searchParams.set(key, REDACTED);
            }
        });
        parsed.hash = parsed.hash ? '#…' : '';
        return redactText(parsed.toString());
    } catch (e) {
        return redactText(url);
    }
}

/**
 * Stands in for a member that could not be read, so one hostile property
 * still leaves the rest of the shape describable.
 */
const UNREADABLE = 'unavailable';

/**
 * Describes a value's shape without its contents: `{ a: 'string', b: [ 'number' ] }`.
 * Used for event payloads, which can carry customer data.
 *
 * Reading a member can throw: a payload may expose a getter that does, and a
 * Proxy can trap `ownKeys`. Callers pass `shapeOf(...)` inline as an argument,
 * so the call is evaluated before the diagnostics bus is entered and its own
 * guard cannot catch it. Describing a payload must never break the SDK call
 * being described, so every read is guarded here instead.
 * @param value
 * @param depth
 */
export function shapeOf(value: unknown, depth = 0): unknown {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
        if (depth > 3) return `array(${value.length})`;
        if (!value.length) return [];
        let first: unknown;
        try {
            first = value[0];
        } catch (e) {
            return [UNREADABLE, `…${value.length}`];
        }
        return [shapeOf(first, depth + 1), `…${value.length}`];
    }
    if (typeof value === 'object') {
        if (depth > 3) return 'object';
        let keys: string[];
        try {
            keys = Object.keys(value as object).slice(0, 40);
        } catch (e) {
            return 'object';
        }
        const out: Record<string, unknown> = {};
        keys.forEach((key) => {
            try {
                out[key] = shapeOf((value as Record<string, unknown>)[key], depth + 1);
            } catch (e) {
                out[key] = UNREADABLE;
            }
        });
        return out;
    }
    return typeof value;
}

/**
 * Keeps values but strips secrets and functions. Used for SDK configuration,
 * which describes the integration rather than customer data.
 * @param value
 * @param depth
 */
export function redactValue(value: unknown, depth = 0): unknown {
    if (typeof value === 'string') return redactText(value).slice(0, 500);
    if (typeof value === 'function') return 'ƒ';
    if (value === null || typeof value !== 'object') return value;
    if (typeof Node !== 'undefined' && value instanceof Node) return `<${(value as Element).tagName?.toLowerCase?.() || 'node'}>`;
    if (depth > 4) return Array.isArray(value) ? `array(${value.length})` : 'object';
    if (Array.isArray(value)) return value.slice(0, 50).map((v) => redactValue(v, depth + 1));
    const out: Record<string, unknown> = {};
    Object.keys(value as object).slice(0, 80).forEach((key) => {
        out[key] = isSensitiveKey(key)
            ? REDACTED
            : redactValue((value as Record<string, unknown>)[key], depth + 1);
    });
    return out;
}

/**
 * Serialises console arguments into one bounded, redacted string.
 * @param args
 */
export function serializeArgs(args: unknown[]): string {
    const parts = args.map((arg) => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        try {
            return JSON.stringify(redactValue(arg));
        } catch (e) {
            return String(arg);
        }
    });
    return redactText(parts.join(' ')).slice(0, 2000);
}
