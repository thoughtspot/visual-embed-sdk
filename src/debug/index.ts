/**
 * Full page diagnostics: entry point kept in the main bundle (small).
 *
 * Flow:
 * 1. `setupFullPageDiagnostics` runs from `init()` when enabled. It only
 *    watches the SDK event bus for failure signals; nothing is sent.
 * 2. On a failure (or a manual request) the user sees a consent prompt.
 * 3. On Allow, the collector chunk is loaded, the local buffer is drained,
 *    and events stream to the debug-session endpoint until the session ends.
 */
import { FullPageDiagnosticsConfig } from '../types';
import { version as sdkVersion } from '../utils/sdk-version';
import { logger } from '../utils/logger';
import {
    emit, getBufferedEvents, subscribe,
} from './bus';
import { showConsentPrompt, showSessionBanner } from './consent';
import { DiagnosticsTransport } from './transport';
import { DebugEvent, DiagnosticsTrigger } from './types';

const DEFAULT_DURATION_MS = 30 * 60 * 1000;
const DEFAULT_LOAD_TIMEOUT_MS = 15000;

type State = 'off' | 'watching' | 'prompting' | 'streaming';

interface Runtime {
    config: FullPageDiagnosticsConfig;
    thoughtSpotHost: string;
    state: State;
    sessionId?: string;
    stopSession?: () => Promise<void>;
    unwatch?: () => void;
    declined: boolean;
}

let runtime: Runtime | null = null;

/** `ABCD-1234` style code, easy to read out or paste into a ticket. */
export function createSessionId(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        bytes.forEach((_, i) => {
            bytes[i] = Math.floor(Math.random() * 256);
        });
    }
    const chars = Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join('');
    return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

const watchForFailures = (rt: Runtime): (() => void) => {
    const timeoutMs = rt.config.loadTimeoutMs ?? DEFAULT_LOAD_TIMEOUT_MS;
    const pendingLoads = new Map<string, ReturnType<typeof setTimeout>>();
    const unsubscribe = subscribe((event: DebugEvent) => {
        const embedId = event.data.embedId as string | undefined;
        if (event.type === 'embed.render' && embedId) {
            clearTimeout(pendingLoads.get(embedId));
            pendingLoads.set(embedId, setTimeout(() => {
                pendingLoads.delete(embedId);
                emit('sdk', 'embed.load-timeout', 'error', { embedId, timeoutMs });
                requestFullPageDiagnostics('embed-load-timeout');
            }, timeoutMs));
        }
        if (event.type === 'embed.event' && embedId) {
            const name = event.data.event;
            if (name === 'load' && pendingLoads.has(embedId)) {
                clearTimeout(pendingLoads.get(embedId));
                pendingLoads.delete(embedId);
            }
            if (name === 'ThoughtspotAuthFailure' || name === 'noCookieAccess') {
                requestFullPageDiagnostics('auth-failure');
            }
            if (name === 'Error') requestFullPageDiagnostics('embed-error');
        }
        if (event.type === 'embed.destroy' && embedId) {
            clearTimeout(pendingLoads.get(embedId));
            pendingLoads.delete(embedId);
        }
    });
    return () => {
        unsubscribe();
        pendingLoads.forEach((timer) => clearTimeout(timer));
        pendingLoads.clear();
    };
};

/**
 * Called from `init()`. Arms failure detection; sends nothing.
 * @param config
 * @param thoughtSpotHost
 */
export function setupFullPageDiagnostics(
    config: FullPageDiagnosticsConfig,
    thoughtSpotHost: string,
): void {
    if (!config?.enabled || typeof window === 'undefined') return;
    if (!config.endpoint) {
        logger.error('fullPageDiagnostics.endpoint is required when fullPageDiagnostics.enabled is true.');
        return;
    }
    if (runtime) runtime.unwatch?.();
    runtime = {
        config, thoughtSpotHost, state: 'watching', declined: false,
    };
    if (config.prompt !== 'manual') runtime.unwatch = watchForFailures(runtime);
    if (config.prompt === 'on-init') {
        setTimeout(() => requestFullPageDiagnostics('on-init'), 0);
    }
}

/**
 * Asks the user to share page diagnostics and, on Allow, starts a session.
 * Resolves to the session id, or null when declined or not enabled.
 * @param trigger
 */
export async function requestFullPageDiagnostics(
    trigger: DiagnosticsTrigger = 'manual',
): Promise<string | null> {
    const rt = runtime;
    if (!rt) {
        logger.warn('Full page diagnostics are not enabled. Set fullPageDiagnostics in init().');
        return null;
    }
    if (rt.state === 'streaming') return rt.sessionId || null;
    if (rt.state === 'prompting') return null;
    // Automatic triggers ask once per page; a manual request can always ask.
    if (rt.declined && trigger !== 'manual') return null;

    rt.state = 'prompting';
    const allowed = await showConsentPrompt(trigger);
    if (!allowed) {
        rt.state = 'watching';
        rt.declined = true;
        emit('sdk', 'diagnostics.declined', 'info', { trigger });
        return null;
    }

    const sessionId = createSessionId();
    const durationMs = rt.config.sessionDurationMs ?? DEFAULT_DURATION_MS;
    const expiresAt = Date.now() + durationMs;
    const transport = new DiagnosticsTransport({
        endpoint: rt.config.endpoint,
        sessionId,
        meta: {
            trigger,
            sdkVersion,
            thoughtSpotHost: rt.thoughtSpotHost,
            pageOrigin: window.location.origin,
            startedAt: Date.now(),
            expiresAt,
        },
    });

    // Drain what happened before the click, then stream new events.
    getBufferedEvents().forEach((event) => transport.enqueue(event));
    const unsubscribe = subscribe((event) => transport.enqueue(event));
    transport.start();

    let stopCollector: () => void = () => undefined;
    try {
        const { startCollector } = await import('./collector');
        stopCollector = startCollector({
            thoughtSpotHost: rt.thoughtSpotHost,
            consoleLevels: rt.config.consoleLevels ?? ['log', 'info', 'warn', 'error'],
        });
    } catch (e) {
        emit('sdk', 'diagnostics.collector-failed', 'error', { message: String((e as Error)?.message || e) });
    }
    emit('sdk', 'diagnostics.started', 'info', { trigger, sessionId, expiresAt });

    let removeBanner: () => void = () => undefined;
    let ended = false;
    const stop = async () => {
        if (ended) return;
        ended = true;
        clearTimeout(expiry);
        emit('sdk', 'diagnostics.ended', 'info', { sessionId });
        stopCollector();
        unsubscribe();
        removeBanner();
        await transport.stop();
        if (runtime === rt) {
            rt.state = 'watching';
            rt.sessionId = undefined;
            rt.stopSession = undefined;
        }
    };
    const expiry = setTimeout(() => {
        stop();
    }, durationMs);
    removeBanner = showSessionBanner(sessionId, expiresAt, () => {
        stop();
    });

    rt.state = 'streaming';
    rt.sessionId = sessionId;
    rt.stopSession = stop;
    logger.info(`Full page diagnostics session started: ${sessionId}`);
    return sessionId;
}

/** Ends the current diagnostics session, if any. */
export async function endFullPageDiagnostics(): Promise<void> {
    await runtime?.stopSession?.();
}

/** The active session id, or null. */
export function getFullPageDiagnosticsSessionId(): string | null {
    return runtime?.sessionId ?? null;
}

/** Test helper. */
export function resetFullPageDiagnostics(): void {
    runtime?.unwatch?.();
    runtime = null;
}
