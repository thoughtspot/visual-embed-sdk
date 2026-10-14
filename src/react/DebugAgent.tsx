import React, { useEffect, useRef, useState } from 'react';
import { getEmbedConfig } from '../embed/embedConfig';

/**
 * Floating debug-agent chat panel. Renders only when `init()` was called
 * with `enableDebugAgent: true` — host apps can unconditionally mount
 * `<DebugAgent />` and it no-ops otherwise, matching how the flag itself
 * works.
 *
 * Talks to a SpotterCode agent backend (POST {agentApiUrl}/agent/embed-assistant,
 * SSE-streamed), optionally passing an `extensionSessionId` so the agent can
 * use a connected browser extension's chrome.debugger-backed tools against
 * this page and its embedded ThoughtSpot iframe.
 *
 * Development/debugging tool — not intended for production end-user-facing
 * pages (see the `enableDebugAgent` JSDoc in ../types).
 */

export interface DebugAgentProps {
    /** Base URL of the SpotterCode agent backend. @default 'http://localhost:8000' */
    agentApiUrl?: string;
    /**
     * Session id of a connected browser-extension debugging session, letting
     * the agent use chrome.debugger-backed tools against this page. Get this
     * from the extension's own popup UI.
     */
    extensionSessionId?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ToolEvent {
    kind: 'tool';
    toolName: string;
}

type TimelineItem = ChatMessage | ToolEvent;

function toSseEvents(buffer: string): { events: Array<Record<string, unknown>>; rest: string } {
    const parts = buffer.split('\n\n');
    const rest = parts.pop() ?? '';
    const events = parts
        .filter((p) => p.startsWith('data: '))
        .map((p) => JSON.parse(p.slice(6)) as Record<string, unknown>);
    return { events, rest };
}

/**
 * Minimal markdown-ish renderer for **bold**, `code`, and paragraph breaks —
 * enough to make agent responses (which use these) readable without pulling
 * in a full markdown dependency for a dev-only debug widget.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    // Split on **bold** and `code` spans, keeping the delimiters via capture groups.
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    parts.forEach((part, i) => {
        if (!part) return;
        if (part.startsWith('**') && part.endsWith('**')) {
            nodes.push(<strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>);
        } else if (part.startsWith('`') && part.endsWith('`')) {
            nodes.push(
                <code
                    key={`${keyPrefix}-${i}`}
                    style={{
                        background: '#161b22',
                        border: '1px solid #30363d',
                        borderRadius: 3,
                        padding: '1px 4px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: '0.92em',
                    }}
                >
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
                {bullet ? <span style={{ opacity: 0.6 }}>{'• '}</span> : null}
                {rendered}
                {i < lines.length - 1 ? <br /> : null}
            </React.Fragment>
        );
    });
}

const PANEL_WIDTH = 420;
const PANEL_HEIGHT = 560;

export const DebugAgent: React.FC<DebugAgentProps> = ({
    agentApiUrl = 'http://localhost:8000',
    extensionSessionId,
}) => {
    const enabled = !!getEmbedConfig()?.enableDebugAgent;
    const [open, setOpen] = useState(true);
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const historyRef = useRef<ChatMessage[]>([]);
    const messagesRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = messagesRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [items]);

    if (!enabled) return null;

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || busy) return;
        setInput('');
        setBusy(true);

        const userMsg: ChatMessage = { role: 'user', content: text };
        historyRef.current = [...historyRef.current, userMsg];
        setItems((prev) => [...prev, userMsg]);

        let assistantText = '';
        try {
            const response = await fetch(`${agentApiUrl}/agent/embed-assistant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentType: 'ask-docs',
                    messages: historyRef.current,
                    extensionSessionId,
                }),
            });
            if (!response.ok || !response.body) {
                throw new Error(`Agent request failed: ${response.status} ${response.statusText}`);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            // eslint-disable-next-line no-constant-condition
            while (true) {
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
                            const last = next[next.length - 1];
                            if (last && 'role' in last && last.role === 'assistant') {
                                next[next.length - 1] = { role: 'assistant', content: assistantText };
                            } else {
                                next.push({ role: 'assistant', content: assistantText });
                            }
                            return next;
                        });
                    } else if (event.type === 'tool-start') {
                        setItems((prev) => [...prev, { kind: 'tool', toolName: event.toolName as string }]);
                    }
                }
            }
            if (assistantText) {
                historyRef.current = [...historyRef.current, { role: 'assistant', content: assistantText }];
            }
        } catch (err) {
            setItems((prev) => [
                ...prev,
                { role: 'assistant', content: `⚠️ Request failed: ${(err as Error).message}` },
            ]);
        } finally {
            setBusy(false);
            textareaRef.current?.focus();
        }
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open SpotterCode Debug Agent"
                style={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#238636',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                    fontSize: 22,
                    zIndex: 999999,
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                }}
            >
                {'💬'}
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                width: PANEL_WIDTH,
                height: PANEL_HEIGHT,
                maxHeight: 'calc(100vh - 32px)',
                background: '#0d1117',
                color: '#e6edf3',
                border: '1px solid #30363d',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: 13,
                lineHeight: 1.5,
                boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
                zIndex: 999999,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    flex: '0 0 auto',
                    padding: '12px 14px',
                    borderBottom: '1px solid #30363d',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                        aria-hidden
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: busy ? '#d29922' : '#238636',
                            display: 'inline-block',
                        }}
                    />
                    SpotterCode Debug Agent
                </span>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#8b949e',
                        cursor: 'pointer',
                        fontSize: 16,
                        lineHeight: 1,
                        padding: 4,
                    }}
                >
                    {'✕'}
                </button>
            </div>

            {/* min-height: 0 is required on this flex child — without it, a
                flex item with overflow-y:auto can grow past its flex-basis
                instead of scrolling, which pushed content under the header
                and past the panel's bottom edge. */}
            <div
                ref={messagesRef}
                style={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflowY: 'auto',
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                }}
            >
                {items.length === 0 ? (
                    <div style={{ color: '#6e7681', fontSize: 12, padding: '8px 2px' }}>
                        Ask about this embed — console errors, failed requests, or config issues.
                    </div>
                ) : null}
                {items.map((item, i) => ('kind' in item ? (
                    <div
                        key={i}
                        style={{
                            alignSelf: 'flex-start',
                            fontSize: 11,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            color: '#d29922',
                            background: '#3d2b0033',
                            border: '1px solid #9e6a03',
                            borderRadius: 6,
                            padding: '4px 8px',
                        }}
                    >
                        {'🔧'} {item.toolName}
                    </div>
                ) : (
                    <div
                        key={i}
                        style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            wordBreak: 'break-word',
                            background: item.role === 'user' ? '#1f6feb33' : '#21262d',
                            alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '88%',
                        }}
                    >
                        {renderContent(item.content)}
                    </div>
                )))}
            </div>

            <form
                onSubmit={sendMessage}
                style={{
                    flex: '0 0 auto',
                    display: 'flex',
                    gap: 8,
                    padding: 10,
                    borderTop: '1px solid #30363d',
                }}
            >
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
                    rows={2}
                    placeholder="Ask about this embed... (Enter to send)"
                    style={{
                        flex: 1,
                        resize: 'none',
                        background: '#161b22',
                        color: '#e6edf3',
                        border: '1px solid #30363d',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        outline: 'none',
                    }}
                />
                <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    style={{
                        background: busy || !input.trim() ? '#2ea043' : '#238636',
                        opacity: busy || !input.trim() ? 0.5 : 1,
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0 16px',
                        cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                    }}
                >
                    {busy ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
};
