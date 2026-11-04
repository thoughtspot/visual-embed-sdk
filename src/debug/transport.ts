/**
 * Batches diagnostics events and sends them to the debug-session ingest
 * endpoint. Uses the page's original `fetch` (captured before the collector
 * wraps it) so uploads never show up as captured network calls.
 */
import { DebugEvent } from './types';

const FLUSH_INTERVAL_MS = 2000;
const MAX_BATCH = 100;
const MAX_QUEUED = 2000;

export interface TransportOptions {
    endpoint: string;
    sessionId: string;
    meta: Record<string, unknown>;
    fetchImpl?: typeof fetch;
}

export class DiagnosticsTransport {
    private queue: DebugEvent[] = [];

    private timer: ReturnType<typeof setInterval> | null = null;

    private inFlight = false;

    private readonly url: string;

    private readonly fetchImpl: typeof fetch;

    private sentMeta = false;

    private readonly onPageHide = () => this.flushWithBeacon();

    constructor(private readonly options: TransportOptions) {
        this.url = `${options.endpoint.replace(/\/$/, '')}/debug-session/ingest`;
        this.fetchImpl = options.fetchImpl || window.fetch.bind(window);
    }

    start(): void {
        this.timer = setInterval(() => {
            this.flush();
        }, FLUSH_INTERVAL_MS);
        window.addEventListener('pagehide', this.onPageHide);
    }

    enqueue(event: DebugEvent): void {
        this.queue.push(event);
        if (this.queue.length > MAX_QUEUED) this.queue.splice(0, this.queue.length - MAX_QUEUED);
        if (this.queue.length >= MAX_BATCH) this.flush();
    }

    private body(events: DebugEvent[], status: 'active' | 'ended'): string {
        const payload: Record<string, unknown> = {
            sessionId: this.options.sessionId,
            status,
            events,
        };
        if (!this.sentMeta) payload.meta = this.options.meta;
        return JSON.stringify(payload);
    }

    async flush(status: 'active' | 'ended' = 'active'): Promise<void> {
        if (this.inFlight || (!this.queue.length && status === 'active' && this.sentMeta)) return;
        const events = this.queue.splice(0, MAX_BATCH);
        this.inFlight = true;
        try {
            const response = await this.fetchImpl(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: this.body(events, status),
                keepalive: true,
                credentials: 'omit',
            });
            if (!response.ok) throw new Error(`ingest responded ${response.status}`);
            this.sentMeta = true;
        } catch (e) {
            // Put the batch back; the next tick retries.
            this.queue.unshift(...events);
        } finally {
            this.inFlight = false;
        }
    }

    private flushWithBeacon(): void {
        if (!this.queue.length || typeof navigator === 'undefined' || !navigator.sendBeacon) return;
        const events = this.queue.splice(0, MAX_BATCH);
        navigator.sendBeacon(this.url, new Blob([this.body(events, 'active')], { type: 'text/plain' }));
    }

    async stop(): Promise<void> {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        window.removeEventListener('pagehide', this.onPageHide);
        await this.flush('ended');
    }
}
