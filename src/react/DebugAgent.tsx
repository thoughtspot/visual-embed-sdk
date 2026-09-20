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

export const DebugAgent: React.FC<DebugAgentProps> = ({
    agentApiUrl = 'http://localhost:8000',
    extensionSessionId,
}) => {
    const enabled = !!getEmbedConfig()?.enableDebugAgent;
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const historyRef = useRef<ChatMessage[]>([]);
    const messagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
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
            const reader = response.body!.getReader();
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
                { role: 'assistant', content: `Request failed: ${(err as Error).message}` },
            ]);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                width: 360,
                height: 480,
                background: '#0d1117',
                color: '#e6edf3',
                border: '1px solid #30363d',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: 13,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                zIndex: 999999,
            }}
        >
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #30363d', fontWeight: 600 }}>
                SpotterCode Debug Agent
            </div>
            <div
                ref={messagesRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}
            >
                {items.map((item, i) => ('kind' in item ? (
                    <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: '#d29922' }}>
                        {'🔧'} {item.toolName}
                    </div>
                ) : (
                    <div
                        key={i}
                        style={{
                            padding: '6px 8px',
                            borderRadius: 6,
                            whiteSpace: 'pre-wrap',
                            background: item.role === 'user' ? '#1f6feb33' : '#21262d',
                            alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                        }}
                    >
                        {item.content}
                    </div>
                )))}
            </div>
            <form
                onSubmit={sendMessage}
                style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid #30363d' }}
            >
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={2}
                    placeholder="Ask about this embed..."
                    style={{
                        flex: 1,
                        resize: 'none',
                        background: '#161b22',
                        color: '#e6edf3',
                        border: '1px solid #30363d',
                        borderRadius: 6,
                        padding: '6px 8px',
                        fontFamily: 'inherit',
                        fontSize: 12,
                    }}
                />
                <button
                    type="submit"
                    disabled={busy}
                    style={{
                        background: busy ? '#94d3a2' : '#238636',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '0 12px',
                        cursor: busy ? 'not-allowed' : 'pointer',
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
};
