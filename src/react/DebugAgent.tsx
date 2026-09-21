import React, {
    useEffect, useRef, useState,
} from 'react';
import { getEmbedConfig } from '../embed/embedConfig';

/**
 * Floating chat-style debugging assistant, in the shape of a modern AI
 * assistant panel (à la Claude/ChatGPT/a docs bot) rather than a raw DevTools
 * inspector. Renders only when `init()` was called with
 * `enableDebugAgent: true` — host apps can unconditionally mount
 * `<DebugAgent />` and it no-ops otherwise, matching how the flag itself
 * works.
 *
 * Talks to the embed-assistant agent backend (`POST {agentApiUrl}/agent/embed-assistant`,
 * SSE-streamed). The one DOM capability the panel has itself — picking an
 * element on the host page and live-editing its styles — is exposed as an
 * in-chat tool the developer (or a future agent tool-call) can invoke; picked
 * elements are attached to the conversation as context.
 *
 * The host page cannot read or write inside the ThoughtSpot iframe directly
 * (it is a separate origin). When `extensionSessionId` is set — a connected
 * browser-extension debugging session with `chrome.debugger` access — picking
 * a point over the iframe instead asks the agent to inspect that point
 * *inside the iframe's own frame*, via the extension's `evaluate_script`
 * relay tool. Without an extension session, picking over the iframe still
 * only sees the `<iframe>` element itself, same as any other host element.
 *
 * Development/debugging tool — not intended for production end-user-facing
 * pages (see the `enableDebugAgent` JSDoc in ../types).
 */

export interface DebugAgentProps {
    /** Base URL of the embed-assistant agent backend. @default 'http://localhost:8000' */
    agentApiUrl?: string;
    /**
     * Session id of a connected browser-extension debugging session, letting
     * the agent route browser tool calls (console/network) through the
     * extension relay. Get this from the extension's own popup UI.
     */
    extensionSessionId?: string;
}

type Role = 'user' | 'assistant';

interface ChatMessage {
    id: string;
    role: Role;
    content: string;
}

interface ToolEvent {
    id: string;
    kind: 'tool';
    toolName: string;
    status: 'running' | 'done';
    detail?: string;
}

interface PickedElementContext {
    id: string;
    kind: 'element';
    selector: string;
    styles: Record<string, string>;
}

type TimelineItem = ChatMessage | ToolEvent | PickedElementContext;

let uid = 0;
const nextId = () => `${Date.now()}-${uid++}`;

function toSseEvents(buffer: string): { events: Array<Record<string, unknown>>; rest: string } {
    const parts = buffer.split('\n\n');
    const rest = parts.pop() ?? '';
    const events = parts
        .filter((p) => p.startsWith('data: '))
        .map((p) => JSON.parse(p.slice(6)) as Record<string, unknown>);
    return { events, rest };
}

/** Minimal markdown-ish renderer: **bold**, `code`, bullets, paragraph breaks. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    parts.forEach((part, i) => {
        if (!part) return;
        if (part.startsWith('**') && part.endsWith('**')) {
            nodes.push(<strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>);
        } else if (part.startsWith('`') && part.endsWith('`')) {
            nodes.push(
                <code key={`${keyPrefix}-${i}`} style={styles.inlineCode}>
                    {part.slice(1, -1)}
                </code>,
            );
        } else {
            nodes.push(part);
        }
    });
    return nodes;
}

function renderContent(content: string): React.ReactNode {
    const lines = content.split('\n');
    return lines.map((line, i) => {
        const trimmed = line.trimStart();
        const bullet = /^[-*]\s+/.test(trimmed);
        const rendered = renderInline(bullet ? trimmed.replace(/^[-*]\s+/, '') : line, `l${i}`);
        return (
            <React.Fragment key={i}>
                {bullet ? <span style={{ opacity: 0.55 }}>{'•  '}</span> : null}
                {rendered}
                {i < lines.length - 1 ? <br /> : null}
            </React.Fragment>
        );
    });
}

function getRect(el: Element) {
    const r = el.getBoundingClientRect();
    return {
        top: r.top, left: r.left, width: r.width, height: r.height,
    };
}

function describeElement(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = el.classList.length ? `.${Array.from(el.classList).join('.')}` : '';
    return `${tag}${id}${cls}`;
}

const KEY_STYLE_PROPS: Array<keyof CSSStyleDeclaration & string> = [
    'display', 'position', 'width', 'height', 'margin', 'padding',
    'backgroundColor', 'border', 'borderRadius', 'opacity', 'zIndex', 'overflow',
];

const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 600;

export const DebugAgent: React.FC<DebugAgentProps> = ({
    agentApiUrl = 'http://localhost:8000',
    extensionSessionId,
}) => {
    const enabled = !!getEmbedConfig()?.enableDebugAgent;
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [picking, setPicking] = useState(false);
    const [hovered, setHovered] = useState<Element | null>(null);

    const historyRef = useRef<Array<{ role: Role; content: string }>>([]);
    const messagesRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = messagesRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [items]);

    // Element picking: highlight whatever is under the cursor (ignoring this
    // panel), attach the pick as chat context on click.
    useEffect(() => {
        if (!picking) return undefined;
        const onMove = (e: MouseEvent) => {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (!target || panelRef.current?.contains(target)) return;
            setHovered(target);
        };
        const onClick = (e: MouseEvent) => {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (!target || panelRef.current?.contains(target)) return;
            e.preventDefault();
            e.stopPropagation();
            setPicking(false);
            setHovered(null);

            if (target.tagName === 'IFRAME' && extensionSessionId) {
                const rect = target.getBoundingClientRect();
                const xInFrame = Math.round(e.clientX - rect.left);
                const yInFrame = Math.round(e.clientY - rect.top);
                sendText(
                    `Inspect the element at coordinates (${xInFrame}, ${yInFrame}) inside the `
                    + 'embedded ThoughtSpot iframe (use list_frames to find that frame, then '
                    + 'evaluate_script scoped to it — e.g. document.elementFromPoint(x, y) — to '
                    + 'get its tag, classes, computed styles, and bounding box). Summarize what '
                    + 'you find.',
                );
                return;
            }

            const computed = window.getComputedStyle(target);
            const styleSnapshot: Record<string, string> = {};
            KEY_STYLE_PROPS.forEach((prop) => { styleSnapshot[prop] = String(computed[prop] ?? ''); });
            setItems((prev) => [...prev, {
                id: nextId(), kind: 'element', selector: describeElement(target), styles: styleSnapshot,
            }]);
        };
        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('click', onClick, true);
        const prevCursor = document.body.style.cursor;
        document.body.style.cursor = 'crosshair';
        return () => {
            document.removeEventListener('mousemove', onMove, true);
            document.removeEventListener('click', onClick, true);
            document.body.style.cursor = prevCursor;
        };
    }, [picking]);

    if (!enabled) return null;

    const buildContextPreamble = (): string => {
        const elementContexts = items.filter((i): i is PickedElementContext => 'kind' in i && i.kind === 'element');
        if (!elementContexts.length) return '';
        const blocks = elementContexts.map((ctx) => {
            const styleLines = Object.entries(ctx.styles).map(([k, v]) => `  ${k}: ${v};`).join('\n');
            return `Element \`${ctx.selector}\`:\n${styleLines}`;
        });
        return `Picked page elements for context:\n\n${blocks.join('\n\n')}\n\n---\n\n`;
    };

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || busy) return;
        setInput('');
        await sendText(text, buildContextPreamble());
    }

    async function sendText(text: string, contextPreamble = '') {
        if (busy) return;
        setBusy(true);

        const userMsg: ChatMessage = { id: nextId(), role: 'user', content: text };
        historyRef.current = [...historyRef.current, { role: 'user', content: contextPreamble + text }];
        setItems((prev) => [...prev, userMsg]);

        const assistantId = nextId();
        let assistantText = '';
        try {
            const response = await fetch(`${agentApiUrl}/agent/embed-assistant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentType: 'visual-embed-sdk',
                    messages: historyRef.current,
                    extensionSessionId,
                    browserContext: {
                        url: window.location.href,
                        viewport: { width: window.innerWidth, height: window.innerHeight },
                    },
                }),
            });
            if (!response.ok || !response.body) {
                throw new Error(`Agent request failed: ${response.status} ${response.statusText}`);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const { events, rest } = toSseEvents(buffer);
                buffer = rest;
                for (const event of events) {
                    if (event.type === 'text') {
                        assistantText += event.content as string;
                        setItems((prev) => {
                            const next = [...prev];
                            const idx = next.findIndex((it) => 'id' in it && it.id === assistantId);
                            if (idx >= 0) {
                                next[idx] = { id: assistantId, role: 'assistant', content: assistantText };
                            } else {
                                next.push({ id: assistantId, role: 'assistant', content: assistantText });
                            }
                            return next;
                        });
                    } else if (event.type === 'tool-start') {
                        const toolId = (event.toolCallId as string) || nextId();
                        setItems((prev) => [...prev, {
                            id: toolId, kind: 'tool', toolName: event.toolName as string, status: 'running',
                        }]);
                    } else if (event.type === 'tool-result') {
                        const toolId = event.toolCallId as string;
                        setItems((prev) => prev.map((it) => (('kind' in it) && it.kind === 'tool' && it.id === toolId
                            ? { ...it, status: 'done' }
                            : it)));
                    } else if (event.type === 'error') {
                        setItems((prev) => [...prev, {
                            id: nextId(), role: 'assistant', content: `⚠️ ${event.content as string}`,
                        }]);
                    }
                }
            }
            if (assistantText) {
                historyRef.current = [...historyRef.current, { role: 'assistant', content: assistantText }];
            }
        } catch (err) {
            setItems((prev) => [...prev, {
                id: nextId(), role: 'assistant', content: `⚠️ Request failed: ${(err as Error).message}`,
            }]);
        } finally {
            setBusy(false);
            textareaRef.current?.focus();
        }
    }

    const removeContext = (id: string) => setItems((prev) => prev.filter((it) => !('kind' in it && it.kind === 'element' && it.id === id)));

    return (
        <>
            {picking && hovered ? (
                <ElementHoverOverlay
                    el={hovered}
                    iframeInspectable={hovered.tagName === 'IFRAME' && !!extensionSessionId}
                />
            ) : null}

            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Open Debug Agent"
                    style={styles.launcher}
                >
                    <AgentGlyph size={22} />
                </button>
            ) : (
                <div ref={panelRef} style={styles.panel}>
                    <div style={styles.header}>
                        <span style={styles.headerTitle}>
                            <AgentGlyph size={18} />
                            <span>
                                <div style={styles.headerName}>Debug Agent</div>
                                <div style={styles.headerSubtitle}>
                                    <span style={{ ...styles.statusDot, background: busy ? '#d29922' : '#3fb950' }} />
                                    {busy ? 'Thinking…' : 'Ready'}
                                </div>
                            </span>
                        </span>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={styles.closeBtn}>
                            {'✕'}
                        </button>
                    </div>

                    <div ref={messagesRef} style={styles.messages}>
                        {items.length === 0 ? (
                            <WelcomeState onPick={() => setPicking(true)} extensionConnected={!!extensionSessionId} />
                        ) : null}
                        {items.map((item) => {
                            if ('kind' in item && item.kind === 'tool') {
                                return <ToolChip key={item.id} item={item} />;
                            }
                            if ('kind' in item && item.kind === 'element') {
                                return <ElementChip key={item.id} item={item} onRemove={() => removeContext(item.id)} />;
                            }
                            const msg = item as ChatMessage;
                            return (
                                <div key={msg.id} style={msg.role === 'user' ? styles.userRow : styles.assistantRow}>
                                    {msg.role === 'assistant' ? (
                                        <div style={styles.avatar}><AgentGlyph size={14} /></div>
                                    ) : null}
                                    <div style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                                        {renderContent(msg.content)}
                                    </div>
                                </div>
                            );
                        })}
                        {busy && !items.some((it) => 'kind' in it && it.kind === 'tool' && it.status === 'running') ? (
                            <div style={styles.assistantRow}>
                                <div style={styles.avatar}><AgentGlyph size={14} /></div>
                                <div style={styles.assistantBubble}><TypingDots /></div>
                            </div>
                        ) : null}
                    </div>

                    <div style={styles.toolbar}>
                        <button
                            type="button"
                            onClick={() => setPicking((p) => !p)}
                            style={picking ? styles.toolBtnActive : styles.toolBtn}
                            title={extensionSessionId
                                ? 'Pick an element on the page — or click inside the ThoughtSpot iframe to inspect it via the connected extension'
                                : 'Pick an element on the page to attach as context'}
                        >
                            {'⌖'} {picking ? 'Picking…' : 'Pick element'}
                        </button>
                    </div>

                    <form onSubmit={sendMessage} style={styles.inputRow}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(e);
                                }
                            }}
                            rows={1}
                            placeholder="Ask about this embed, or describe a style change…"
                            style={styles.textarea}
                        />
                        <button
                            type="submit"
                            disabled={busy || !input.trim()}
                            aria-label="Send"
                            style={{
                                ...styles.sendBtn,
                                opacity: busy || !input.trim() ? 0.4 : 1,
                                cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {'↑'}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

const AgentGlyph: React.FC<{ size: number }> = ({ size }) => (
    <div
        style={{
            width: size, height: size, borderRadius: size / 3.2, flexShrink: 0,
            background: 'linear-gradient(135deg, #6ea8fe, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.6, lineHeight: 1,
        }}
        aria-hidden
    >
        {'✦'}
    </div>
);

const TypingDots: React.FC = () => (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '2px 0' }}>
        {[0, 1, 2].map((i) => (
            <span
                key={i}
                style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#8b949e',
                    animation: 'ts-debug-agent-blink 1.1s infinite ease-in-out',
                    animationDelay: `${i * 0.15}s`,
                }}
            />
        ))}
        <style>{'@keyframes ts-debug-agent-blink {0%,80%,100%{opacity:.25} 40%{opacity:1}}'}</style>
    </span>
);

const WelcomeState: React.FC<{ onPick: () => void; extensionConnected?: boolean }> = ({ onPick, extensionConnected }) => (
    <div style={styles.welcome}>
        <AgentGlyph size={32} />
        <div style={styles.welcomeTitle}>How can I help with this embed?</div>
        <div style={styles.welcomeBody}>
            Ask about console errors, failed requests, or configuration —
            or pick an element on the page to get style help for it.
            {extensionConnected ? ' With the browser extension connected, you can also click inside the ThoughtSpot iframe itself.' : ''}
        </div>
        <button type="button" onClick={onPick} style={styles.welcomeBtn}>
            {'⌖'} Pick an element
        </button>
    </div>
);

const ToolChip: React.FC<{ item: ToolEvent }> = ({ item }) => (
    <div style={styles.toolChip}>
        <span style={{ opacity: item.status === 'running' ? 1 : 0.6 }}>
            {item.status === 'running' ? '⏳' : '✓'}
        </span>
        <span>{item.toolName}</span>
    </div>
);

const ElementChip: React.FC<{ item: PickedElementContext; onRemove: () => void }> = ({ item, onRemove }) => (
    <div style={styles.elementChip}>
        <span style={styles.elementChipTag}>{'⌖'} {item.selector}</span>
        <span style={styles.elementChipMeta}>
            {item.styles.width} × {item.styles.height} · {item.styles.display}
        </span>
        <button type="button" onClick={onRemove} aria-label="Remove context" style={styles.elementChipRemove}>
            {'✕'}
        </button>
    </div>
);

const ElementHoverOverlay: React.FC<{ el: Element; iframeInspectable?: boolean }> = ({ el, iframeInspectable }) => {
    const [rect, setRect] = useState(() => getRect(el));
    useEffect(() => {
        setRect(getRect(el));
        const tick = () => setRect(getRect(el));
        window.addEventListener('scroll', tick, true);
        window.addEventListener('resize', tick);
        const id = window.setInterval(tick, 200);
        return () => {
            window.removeEventListener('scroll', tick, true);
            window.removeEventListener('resize', tick);
            window.clearInterval(id);
        };
    }, [el]);

    return (
        <div
            style={{
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                background: 'rgba(110, 168, 254, 0.15)',
                border: '2px solid #6ea8fe',
                pointerEvents: 'none',
                zIndex: 2147483646,
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: rect.top < 20 ? 2 : -20,
                    left: 0,
                    background: '#6ea8fe',
                    color: '#0d1117',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 3,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    whiteSpace: 'nowrap',
                }}
            >
                {describeElement(el)}
                {iframeInspectable ? ' · click to inspect inside iframe' : ''}
            </div>
        </div>
    );
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const styles: Record<string, React.CSSProperties> = {
    launcher: {
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
        cursor: 'pointer',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    panel: {
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        maxHeight: 'calc(100vh - 40px)',
        background: '#ffffff',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        fontSize: 13,
        lineHeight: 1.55,
        boxShadow: '0 20px 48px rgba(15, 23, 42, 0.18)',
        zIndex: 2147483647,
        overflow: 'hidden',
    },
    header: {
        flex: '0 0 auto',
        padding: '12px 14px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
    },
    headerTitle: { display: 'flex', alignItems: 'center', gap: 10 },
    headerName: { fontWeight: 600, fontSize: 13.5 },
    headerSubtitle: {
        fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1,
    },
    statusDot: {
        width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
    },
    closeBtn: {
        background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 15, padding: 4,
    },
    messages: {
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    welcome: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
        padding: '28px 12px',
        color: '#64748b',
        margin: 'auto',
    },
    welcomeTitle: { color: '#0f172a', fontWeight: 600, fontSize: 15 },
    welcomeBody: { fontSize: 12.5, maxWidth: 260 },
    welcomeBtn: {
        marginTop: 6,
        background: '#f1f5f9',
        color: '#334155',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '7px 14px',
        cursor: 'pointer',
        fontFamily: FONT,
        fontSize: 12,
    },
    userRow: { display: 'flex', justifyContent: 'flex-end' },
    assistantRow: { display: 'flex', gap: 8, alignItems: 'flex-start' },
    avatar: { marginTop: 2, flexShrink: 0 },
    userBubble: {
        padding: '9px 12px',
        borderRadius: '14px 14px 3px 14px',
        background: '#1f6feb',
        color: '#fff',
        maxWidth: '85%',
        wordBreak: 'break-word',
    },
    assistantBubble: {
        padding: '9px 12px',
        borderRadius: '14px 14px 14px 3px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        maxWidth: '85%',
        wordBreak: 'break-word',
    },
    inlineCode: {
        background: '#eef2f7',
        border: '1px solid #dde3ea',
        borderRadius: 3,
        padding: '1px 4px',
        fontFamily: MONO,
        fontSize: '0.92em',
    },
    toolChip: {
        alignSelf: 'flex-start',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontFamily: MONO,
        color: '#9a6700',
        background: '#fef3e0',
        border: '1px solid #f0c674',
        borderRadius: 6,
        padding: '4px 8px',
    },
    elementChip: {
        alignSelf: 'flex-start',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        background: '#eef4ff',
        border: '1px solid #c9dcfc',
        borderRadius: 8,
        padding: '6px 10px',
        maxWidth: '92%',
    },
    elementChipTag: {
        fontFamily: MONO, color: '#1f6feb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    elementChipMeta: { color: '#64748b', flexShrink: 0 },
    elementChipRemove: {
        background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, marginLeft: 'auto', padding: 0,
    },
    toolbar: {
        flex: '0 0 auto', padding: '8px 12px 0', display: 'flex', gap: 8,
    },
    toolBtn: {
        background: '#f8fafc',
        color: '#334155',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '5px 10px',
        fontSize: 11.5,
        cursor: 'pointer',
        fontFamily: FONT,
    },
    toolBtnActive: {
        background: '#1f6feb',
        color: '#fff',
        border: '1px solid #1f6feb',
        borderRadius: 8,
        padding: '5px 10px',
        fontSize: 11.5,
        cursor: 'pointer',
        fontFamily: FONT,
    },
    inputRow: {
        flex: '0 0 auto',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        padding: 12,
    },
    textarea: {
        flex: 1,
        resize: 'none',
        background: '#f8fafc',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '10px 12px',
        fontFamily: FONT,
        fontSize: 12.5,
        outline: 'none',
        maxHeight: 96,
    },
    sendBtn: {
        width: 34,
        height: 34,
        flexShrink: 0,
        borderRadius: '50%',
        background: '#1f6feb',
        color: '#fff',
        border: 'none',
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};
