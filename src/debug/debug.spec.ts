import {
    redactText, redactUrl, shapeOf, redactValue, serializeArgs, REDACTED,
} from './redact';
import {
    emit, subscribe, getBufferedEvents, resetBus, embedIdOf, recordSdkCall, describeElement,
    installEarlyErrorBuffer,
} from './bus';
import { startCollector, findEmbedFrames, outlineDom } from './collector';
import { showConsentPrompt, showSessionBanner } from './consent';
import { DiagnosticsTransport } from './transport';
import {
    setupFullPageDiagnostics, requestFullPageDiagnostics, endFullPageDiagnostics,
    resetFullPageDiagnostics, createSessionId, getFullPageDiagnosticsSessionId,
} from './index';

const HOST = 'https://cluster.example.com';
const flush = () => new Promise((r) => setTimeout(r, 0));
const clickConsent = (action: 'allow' | 'deny') => {
    const root = document.getElementById('ts-diagnostics-consent')?.shadowRoot;
    (root?.querySelector(`[data-action="${action}"]`) as HTMLElement).click();
};

describe('redact', () => {
    test('removes bearer tokens, JWTs, emails and assigned secrets', () => {
        const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcDEF123_-';
        const out = redactText(`Bearer abc.def ${jwt} me@corp.com token=abcdefghijklmnop`);
        expect(out).not.toContain(jwt);
        expect(out).not.toContain('me@corp.com');
        expect(out).toContain(`token=${REDACTED}`);
    });
    test('redacts sensitive query params and hash', () => {
        const out = redactUrl('https://a.com/x?token=secret&ok=1#frag');
        expect(out).toContain('ok=1');
        expect(out).not.toContain('secret');
        expect(out).toContain('#');
    });
    test('shapeOf keeps structure only', () => {
        expect(shapeOf({ a: 'x', b: [1, 2], c: null })).toEqual({ a: 'string', b: ['number', '…2'], c: 'null' });
    });
    test('redactValue strips secrets and functions', () => {
        const out = redactValue({ password: 'p', getAuthToken: () => 'x', host: 'h' }) as any;
        expect(out).toEqual({ password: REDACTED, getAuthToken: 'ƒ', host: 'h' });
    });
    test('serializeArgs handles errors and objects', () => {
        expect(serializeArgs(['a', new Error('boom'), { authorization: 'x' }])).toContain('Error: boom');
        expect(serializeArgs([{ authorization: 'x' }])).toContain(REDACTED);
    });
});

describe('bus', () => {
    beforeEach(() => resetBus());
    test('buffers events and notifies subscribers', () => {
        const seen: string[] = [];
        const off = subscribe((e) => seen.push(e.type));
        emit('host', 'one', 'info', {});
        off();
        emit('host', 'two', 'info', {});
        expect(seen).toEqual(['one']);
        expect(getBufferedEvents().map((e) => e.type)).toEqual(['one', 'two']);
    });
    test('embedIdOf is stable per instance', () => {
        const a = {};
        expect(embedIdOf(a)).toBe(embedIdOf(a));
        expect(embedIdOf({})).not.toBe(embedIdOf(a));
    });
    test('recordSdkCall attaches a call site', () => {
        recordSdkCall('embed.render', { embedId: 'x' });
        expect(Array.isArray(getBufferedEvents()[0].data.callSite)).toBe(true);
    });
    test('describeElement', () => {
        const div = document.createElement('div');
        div.id = 'app';
        div.className = 'a b';
        expect(describeElement(div)).toBe('div#app.a.b');
        expect(describeElement(null)).toBeNull();
    });
    test('early buffer records uncaught errors locally', () => {
        installEarlyErrorBuffer();
        window.dispatchEvent(new ErrorEvent('error', { message: 'kaboom token=abcdefghijklmnop' }));
        const event = getBufferedEvents().find((e) => e.type === 'uncaught-error');
        expect(event?.data.message).toContain(REDACTED);
    });
});

describe('collector', () => {
    let frame: HTMLIFrameElement;
    beforeEach(() => {
        resetBus();
        document.body.innerHTML = '<div id="container"></div>';
        frame = document.createElement('iframe');
        frame.src = `${HOST}/embed`;
        document.getElementById('container')!.appendChild(frame);
    });
    test('finds embed frames by origin', () => {
        expect(findEmbedFrames(HOST)).toEqual([frame]);
        expect(findEmbedFrames('not a url')).toEqual([]);
    });
    test('captures console, fetch and container removal, then restores globals', async () => {
        const originalLog = console.log;
        const originalFetch = jest.fn().mockResolvedValue({ status: 500 });
        (window as any).fetch = originalFetch;
        const stop = startCollector({ thoughtSpotHost: HOST, consoleLevels: ['log'] });
        console.log('hello', { authorization: 'secret' });
        await window.fetch(`${HOST}/api?token=abc`);
        document.getElementById('container')!.remove();
        await flush();
        const types = getBufferedEvents().map((e) => e.type);
        expect(types).toEqual(expect.arrayContaining(['globals', 'context', 'page-styles', 'dom-outline', 'embed-neighbourhood', 'console', 'network', 'embed-removed']));
        const network = getBufferedEvents().find((e) => e.type === 'network')!;
        expect(network.data).toMatchObject({ status: 500, toCluster: true });
        expect(String(network.data.url)).not.toContain('abc');
        stop();
        expect(console.log).toBe(originalLog);
        expect(window.fetch).toBe(originalFetch);
    });
    test('reports fetch failures with status 0', async () => {
        (window as any).fetch = jest.fn().mockRejectedValue(new Error('net down'));
        const stop = startCollector({ thoughtSpotHost: HOST, consoleLevels: [] });
        await expect(window.fetch('/x')).rejects.toThrow('net down');
        const network = getBufferedEvents().find((e) => e.type === 'network')!;
        expect(network.data).toMatchObject({ status: 0, error: 'net down' });
        stop();
    });
    test('records SPA navigation', () => {
        const stop = startCollector({ thoughtSpotHost: HOST, consoleLevels: [] });
        history.pushState({}, '', '/next');
        expect(getBufferedEvents().some((e) => e.type === 'navigation')).toBe(true);
        stop();
    });
    test('outlineDom omits scripts and caps nodes', () => {
        document.body.innerHTML = '<main><script></script><p>text</p></main>';
        expect(JSON.stringify(outlineDom())).not.toContain('script');
    });
});

describe('consent UI', () => {
    test('resolves true on allow and false on deny', async () => {
        const allowed = showConsentPrompt('manual');
        clickConsent('allow');
        await expect(allowed).resolves.toBe(true);
        const denied = showConsentPrompt('auth-failure');
        clickConsent('deny');
        await expect(denied).resolves.toBe(false);
    });
    test('banner shows the session code and calls onEnd', () => {
        const onEnd = jest.fn();
        const remove = showSessionBanner('ABCD-1234', Date.now() + 60000, onEnd);
        const root = document.getElementById('ts-diagnostics-consent')!.shadowRoot!;
        expect(root.textContent).toContain('ABCD-1234');
        (root.querySelector('[data-action="end"]') as HTMLElement).click();
        expect(onEnd).toHaveBeenCalled();
        remove();
        expect(document.getElementById('ts-diagnostics-consent')).toBeNull();
    });
});

describe('transport', () => {
    test('posts batches with meta once and retries failures', async () => {
        const fetchImpl = jest.fn()
            .mockResolvedValueOnce({ ok: false, status: 500 })
            .mockResolvedValue({ ok: true, status: 200 });
        const t = new DiagnosticsTransport({
            endpoint: 'http://svc/', sessionId: 'S', meta: { a: 1 }, fetchImpl: fetchImpl as any,
        });
        t.enqueue({
            ts: 1, layer: 'host', type: 'x', level: 'info', data: {},
        });
        await t.flush();
        await t.flush();
        expect(fetchImpl).toHaveBeenCalledTimes(2);
        expect(fetchImpl.mock.calls[1][0]).toBe('http://svc/debug-session/ingest');
        const body = JSON.parse(fetchImpl.mock.calls[1][1].body);
        expect(body).toMatchObject({ sessionId: 'S', meta: { a: 1 } });
        expect(body.events).toHaveLength(1);
        await t.stop();
        expect(JSON.parse(fetchImpl.mock.calls[2][1].body)).toMatchObject({ status: 'ended' });
        expect(JSON.parse(fetchImpl.mock.calls[2][1].body).meta).toBeUndefined();
    });
});

describe('full page diagnostics flow', () => {
    beforeEach(() => {
        resetBus();
        resetFullPageDiagnostics();
        document.body.innerHTML = '';
        (window as any).fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    });
    afterEach(async () => {
        await endFullPageDiagnostics();
    });
    test('session ids look like ABCD-EFGH', () => {
        expect(createSessionId()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });
    test('does nothing when not enabled', async () => {
        await expect(requestFullPageDiagnostics()).resolves.toBeNull();
    });
    test('declined automatic prompt is not repeated', async () => {
        setupFullPageDiagnostics({ enabled: true, endpoint: 'http://svc', prompt: 'manual' }, HOST);
        const first = requestFullPageDiagnostics('auth-failure');
        clickConsent('deny');
        await expect(first).resolves.toBeNull();
        await expect(requestFullPageDiagnostics('auth-failure')).resolves.toBeNull();
    });
    test('allow starts a session that drains the buffer, then end stops it', async () => {
        emit('sdk', 'embed.render', 'info', { embedId: 'embed-1' });
        setupFullPageDiagnostics({ enabled: true, endpoint: 'http://svc', prompt: 'manual' }, HOST);
        const pending = requestFullPageDiagnostics('manual');
        clickConsent('allow');
        const id = await pending;
        expect(id).toMatch(/-/);
        expect(getFullPageDiagnosticsSessionId()).toBe(id);
        await endFullPageDiagnostics();
        expect(getFullPageDiagnosticsSessionId()).toBeNull();
        const bodies = ((window as any).fetch as jest.Mock).mock.calls
            .filter((c) => String(c[0]).endsWith('/debug-session/ingest'))
            .map((c) => JSON.parse(c[1].body));
        const types = bodies.flatMap((b) => b.events.map((e: any) => e.type));
        expect(types).toContain('embed.render');
        expect(bodies[bodies.length - 1].status).toBe('ended');
    });
    test('auth failure event triggers the prompt', async () => {
        setupFullPageDiagnostics({ enabled: true, endpoint: 'http://svc' }, HOST);
        emit('embed', 'embed.event', 'info', { embedId: 'embed-9', event: 'ThoughtspotAuthFailure' });
        await flush();
        expect(document.getElementById('ts-diagnostics-consent')).not.toBeNull();
        clickConsent('deny');
    });
    test('load timeout triggers the prompt', async () => {
        jest.useFakeTimers();
        setupFullPageDiagnostics({
            enabled: true, endpoint: 'http://svc', loadTimeoutMs: 1000,
        }, HOST);
        emit('sdk', 'embed.render', 'info', { embedId: 'embed-2' });
        jest.advanceTimersByTime(1100);
        jest.useRealTimers();
        await flush();
        expect(getBufferedEvents().some((e) => e.type === 'embed.load-timeout')).toBe(true);
        clickConsent('deny');
    });
    test('load event cancels the timeout', () => {
        jest.useFakeTimers();
        setupFullPageDiagnostics({
            enabled: true, endpoint: 'http://svc', loadTimeoutMs: 1000,
        }, HOST);
        emit('sdk', 'embed.render', 'info', { embedId: 'embed-3' });
        emit('embed', 'embed.event', 'info', { embedId: 'embed-3', event: 'load' });
        jest.advanceTimersByTime(1100);
        jest.useRealTimers();
        expect(getBufferedEvents().some((e) => e.type === 'embed.load-timeout')).toBe(false);
    });
});
