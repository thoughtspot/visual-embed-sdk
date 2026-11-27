/**
 * Shared types for full page diagnostics.
 *
 * Every captured signal is normalised to a single `DebugEvent` shape on one
 * clock (`performance.timeOrigin + performance.now()`), so the server can
 * merge host page, SDK and embed events into one ordered timeline.
 */

/** Where an event came from. */
export type DebugLayer = 'sdk' | 'embed' | 'host' | 'browser' | 'snapshot';

export type DebugLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DebugEvent {
    /** Epoch milliseconds, derived from the page's monotonic clock. */
    ts: number;
    layer: DebugLayer;
    type: string;
    level: DebugLevel;
    data: Record<string, unknown>;
}

/** Why a diagnostics session was requested. */
export type DiagnosticsTrigger =
    | 'manual'
    | 'on-init'
    | 'embed-load-timeout'
    | 'auth-failure'
    | 'embed-error';
