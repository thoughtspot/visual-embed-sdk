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
 * SSE-streamed). "Pick element" behaves differently depending on whether a
 * browser-extension debugging session is connected:
 *
 * - "Pick element" covers the host page: hover highlights locally and the
 *   click attaches a computed-style snapshot as chat context. No extension
 *   needed, since this is all same-origin DOM.
 * - "Pick in embed" appears once a browser-extension session is connected,
 *   and picks inside the ThoughtSpot iframe — which the host page cannot
 *   read at all, being a separate origin. It calls the extension's
 *   `start_element_picker` over `chrome.debugger` (CDP), which injects a
 *   picker into the iframe's own frame; the highlight is drawn in there so
 *   it tracks the cursor at native speed, where routing each mousemove over
 *   the relay could not.
 *
 * Those extension calls go straight to `POST /extension/tool-call` rather
 * than through the agent. Locating the embed's frame and arming the picker
 * are mechanical, and having the model sequence them made picking
 * unreliable. The agent still receives the picked element to reason about.
 *
 * While the agent works, its steps are grouped into one collapsed activity
 * card per turn, captioned in end-user language ("Reading the developer
 * docs…") rather than with the tool names the backend streams. Expanding the
 * card reveals every underlying step — real tool name, arguments and
 * duration — so the plain caption never costs a developer the detail they
 * came for. See `TOOL_LABELS` and `ActivityCard`.
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

/** One tool call the agent made, as shown in an expanded activity card. */
interface ActivityStep {
    id: string;
    /** Raw backend tool name, e.g. `get-developer-docs-reference`. */
    toolName: string;
    /** End-user phrasing for the collapsed caption. */
    label: string;
    status: 'running' | 'done' | 'failed';
    /** One-line rendering of the tool's arguments, when it had any. */
    args?: string;
    startedAt: number;
    durationMs?: number;
}

/**
 * The agent's steps for one turn, collapsed into a single card. Grouping per
 * turn rather than per call keeps a five-tool turn from burying the answer,
 * which is what a chip per call did.
 */
interface ActivityGroup {
    id: string;
    kind: 'activity';
    steps: ActivityStep[];
    /** Set once the turn ends, so a finished card can caption itself in past tense. */
    done?: boolean;
}

interface PickedElementContext {
    id: string;
    kind: 'element';
    selector: string;
    styles: Record<string, string>;
    /** Picked inside the ThoughtSpot iframe rather than the host page. */
    inEmbed?: boolean;
    outerHTMLPreview?: string;
}

/** A quiet, centred line about the session itself — "Stopped.", not a reply. */
interface Notice {
    id: string;
    kind: 'notice';
    content: string;
}

type TimelineItem = ChatMessage | ActivityGroup | PickedElementContext | Notice;

const isActivity = (it: TimelineItem): it is ActivityGroup => 'kind' in it && it.kind === 'activity';
const isElement = (it: TimelineItem): it is PickedElementContext => 'kind' in it && it.kind === 'element';
const isNotice = (it: TimelineItem): it is Notice => 'kind' in it && it.kind === 'notice';
const isMessage = (it: TimelineItem): it is ChatMessage => !('kind' in it);

let uid = 0;
const nextId = () => `${Date.now()}-${uid++}`;

/**
 * End-user phrasing for each tool the backend can report. The stream only
 * carries raw names (`content` is literally `Calling <toolName>...`), which
 * mean nothing to someone debugging their own embed — so the caption is
 * mapped here and the raw name kept for the expanded view.
 *
 * Unmapped names fall back to a de-slugged form, so a tool added backend-side
 * still reads sensibly without a matching SDK release.
 */
const TOOL_LABELS: Record<string, { running: string; done: string }> = {
    'get-developer-docs-reference': { running: 'Reading the developer docs', done: 'Read the developer docs' },
    'get-rest-api-reference': { running: 'Checking the REST API reference', done: 'Checked the REST API reference' },
    'execute-code': { running: 'Running code', done: 'Ran code' },
    list_pages: { running: 'Looking at your open pages', done: 'Looked at your open pages' },
    list_frames: { running: 'Locating the embed', done: 'Located the embed' },
    list_console_messages: { running: 'Reading the browser console', done: 'Read the browser console' },
    list_network_requests: { running: 'Checking network requests', done: 'Checked network requests' },
    get_network_request: { running: 'Inspecting a network request', done: 'Inspected a network request' },
    evaluate_script: { running: 'Inspecting the page', done: 'Inspected the page' },
    take_screenshot: { running: 'Taking a screenshot', done: 'Took a screenshot' },
    start_element_picker: { running: 'Waiting for you to pick an element', done: 'Picked an element' },
    inspect_element_in_frame: { running: 'Inspecting the element', done: 'Inspected the element' },
};

/**
 * Strips the MCP namespace the backend prefixes onto proxied tools
 * (`mcp__chrome-devtools__list_pages`), so one label serves a tool however it
 * happens to be routed.
 */
function baseToolName(toolName: string): string {
    const parts = toolName.split('__');
    return parts[parts.length - 1] || toolName;
}

function toolLabel(toolName: string, phase: 'running' | 'done'): string {
    const known = TOOL_LABELS[baseToolName(toolName)];
    if (known) return known[phase];
    const words = baseToolName(toolName).replace(/[-_]+/g, ' ').trim();
    return phase === 'running' ? `Working on ${words}` : `Finished ${words}`;
}

/**
 * Condenses a tool's arguments to one line for the expanded view. Long values
 * are clipped rather than wrapped — the card is a summary, and a full payload
 * belongs in the network tab.
 */
function summarizeArgs(input: unknown): string | undefined {
    if (!input || typeof input !== 'object') return undefined;
    const entries = Object.entries(input as Record<string, unknown>)
        .filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (!entries.length) return undefined;
    return entries
        .map(([k, v]) => {
            const raw = typeof v === 'string' ? v : JSON.stringify(v);
            const value = raw.length > 60 ? `${raw.slice(0, 60)}…` : raw;
            return `${k}: ${value}`;
        })
        .join(' · ');
}

function formatDuration(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

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

/** A fenced ``` block, or the prose between two of them. */
interface ContentSegment {
    type: 'prose' | 'code';
    text: string;
    /** Language tag from the opening fence, when it carried one. */
    language?: string;
}

/**
 * Splits an assistant message into prose and fenced code blocks.
 *
 * The final block is emitted even when its closing fence has not streamed in
 * yet, so a snippet renders as code while it is still being written rather
 * than flashing as prose and then reflowing.
 */
export function splitContentSegments(content: string): ContentSegment[] {
    const segments: ContentSegment[] = [];
    const lines = content.split('\n');
    let prose: string[] = [];
    let code: string[] | null = null;
    let language: string | undefined;

    const flushProse = () => {
        if (prose.join('\n').trim()) segments.push({ type: 'prose', text: prose.join('\n') });
        prose = [];
    };

    lines.forEach((line) => {
        const fence = /^\s*```(.*)$/.exec(line);
        if (fence) {
            if (code === null) {
                flushProse();
                code = [];
                language = fence[1].trim() || undefined;
            } else {
                segments.push({ type: 'code', text: code.join('\n'), language });
                code = null;
                language = undefined;
            }
            return;
        }
        if (code === null) prose.push(line);
        else code.push(line);
    });

    if (code !== null) segments.push({ type: 'code', text: code.join('\n'), language });
    else flushProse();
    return segments;
}

function renderProse(content: string): React.ReactNode {
    const lines = content.replace(/^\n+|\n+$/g, '').split('\n');
    return lines.map((line, i) => {
        const trimmed = line.trimStart();
        const bullet = /^[-*]\s+/.test(trimmed);
        const heading = /^#{1,4}\s+/.exec(trimmed);
        const body = bullet ? trimmed.replace(/^[-*]\s+/, '') : (heading ? trimmed.slice(heading[0].length) : line);
        const rendered = renderInline(body, `l${i}`);
        return (
            <React.Fragment key={i}>
                {bullet ? <span style={{ opacity: 0.55 }}>{'•  '}</span> : null}
                {heading ? <strong>{rendered}</strong> : rendered}
                {i < lines.length - 1 ? <br /> : null}
            </React.Fragment>
        );
    });
}

function renderContent(content: string): React.ReactNode {
    return splitContentSegments(content).map((seg, i) => (seg.type === 'code' ? (
        <CodeBlock key={`c${i}`} code={seg.text} language={seg.language} />
    ) : (
        <div key={`p${i}`}>{renderProse(seg.text)}</div>
    )));
}

/**
 * Copies text and reports whether it landed, so the caller can show a result
 * rather than assume one. `navigator.clipboard` needs a secure context and
 * can be denied outright, hence the `execCommand` fallback — a debugging panel
 * is often opened on a plain-http dev host.
 */
async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }
}

/** Copy control that confirms in place, used on code blocks and messages. */
const CopyButton: React.FC<{
    text: string;
    label?: string;
    style?: React.CSSProperties;
}> = ({ text, label, style: overrideStyle }) => {
    const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

    useEffect(() => {
        if (state === 'idle') return undefined;
        const id = window.setTimeout(() => setState('idle'), 1600);
        return () => window.clearTimeout(id);
    }, [state]);

    return (
        <button
            type="button"
            onClick={async () => setState((await copyText(text)) ? 'copied' : 'failed')}
            style={{ ...styles.copyBtn, ...overrideStyle }}
            title="Copy to clipboard"
            aria-label={label ? `Copy ${label}` : 'Copy'}
        >
            {state === 'copied' ? '✓ Copied' : state === 'failed' ? 'Copy failed' : '⧉ Copy'}
        </button>
    );
};

type TokenType = 'comment' | 'string' | 'keyword' | 'number' | 'tag' | 'attr' | 'punct' | 'plain';

interface HighlightRule {
    type: Exclude<TokenType, 'plain'>;
    pattern: RegExp;
}

const JS_KEYWORDS = 'const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|new|class|extends|try|catch|finally|throw|typeof|instanceof|interface|type|enum|implements|public|private|readonly|as|true|false|null|undefined|this|void';

/**
 * Highlighting rules per language family, ordered so the greediest construct
 * wins: a keyword inside a string or comment must stay unhighlighted.
 *
 * Hand-rolled rather than pulled from Prism or highlight.js because
 * `dist/tsembed.es.js` has a 34 kB budget with roughly 1.5 kB spare, and a
 * highlighter is an order of magnitude larger than that — it would also land
 * in `dependencies`, shipping to every customer for a dev-only panel. These
 * rules are deliberately approximate: they make a snippet scannable, and the
 * text itself is always exactly what the agent sent.
 */
const HIGHLIGHT_RULES: Record<string, HighlightRule[]> = {
    js: [
        { type: 'comment', pattern: /\/\/[^\n]*|\/\*[\s\S]*?\*\// },
        { type: 'string', pattern: /`(?:\\[\s\S]|[^\\`])*`|'(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"/ },
        { type: 'keyword', pattern: new RegExp(`\\b(?:${JS_KEYWORDS})\\b`) },
        { type: 'number', pattern: /\b\d+(?:\.\d+)?\b/ },
        { type: 'punct', pattern: /[{}[\]();,.:=><!+\-*/&|?]+/ },
    ],
    json: [
        { type: 'attr', pattern: /"(?:\\.|[^\\"])*"(?=\s*:)/ },
        { type: 'string', pattern: /"(?:\\.|[^\\"])*"/ },
        { type: 'keyword', pattern: /\b(?:true|false|null)\b/ },
        { type: 'number', pattern: /-?\b\d+(?:\.\d+)?\b/ },
        { type: 'punct', pattern: /[{}[\]:,]+/ },
    ],
    css: [
        { type: 'comment', pattern: /\/\*[\s\S]*?\*\// },
        { type: 'string', pattern: /'(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"/ },
        { type: 'attr', pattern: /[-\w]+(?=\s*:)/ },
        { type: 'tag', pattern: /(?:^|[\s,])[.#]?[-\w]+(?=[^:;{}]*\{)/ },
        { type: 'number', pattern: /-?\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b|#[0-9a-fA-F]{3,8}\b/ },
        { type: 'punct', pattern: /[{};:,]+/ },
    ],
    html: [
        { type: 'comment', pattern: /<!--[\s\S]*?-->/ },
        { type: 'string', pattern: /'(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"/ },
        { type: 'tag', pattern: /<\/?[\w-]+|\/?>/ },
        { type: 'attr', pattern: /[-\w]+(?==)/ },
    ],
    shell: [
        { type: 'comment', pattern: /#[^\n]*/ },
        { type: 'string', pattern: /'(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"/ },
        { type: 'keyword', pattern: /^\s*(?:npm|npx|yarn|pnpm|git|cd|curl|node)\b/m },
        { type: 'punct', pattern: /[|&><]+/ },
    ],
};

/** Maps a fence's language tag onto one of the rule sets above. */
function ruleSetFor(language?: string): HighlightRule[] | undefined {
    const tag = (language ?? '').toLowerCase();
    if (/^(js|jsx|javascript|ts|tsx|typescript)$/.test(tag)) return HIGHLIGHT_RULES.js;
    if (/^json5?$/.test(tag)) return HIGHLIGHT_RULES.json;
    if (/^(css|scss|less)$/.test(tag)) return HIGHLIGHT_RULES.css;
    if (/^(html|xml|svg)$/.test(tag)) return HIGHLIGHT_RULES.html;
    if (/^(sh|bash|zsh|shell|console)$/.test(tag)) return HIGHLIGHT_RULES.shell;
    return undefined;
}

/**
 * Tokenizes `code` by repeatedly taking whichever rule matches earliest,
 * emitting the text before it as plain. An untagged or unrecognised fence
 * yields one plain token, so the block still renders — just unhighlighted.
 */
export function tokenizeCode(code: string, language?: string): Array<{ type: TokenType; text: string }> {
    const rules = ruleSetFor(language);
    if (!rules) return code ? [{ type: 'plain', text: code }] : [];

    const tokens: Array<{ type: TokenType; text: string }> = [];
    let rest = code;
    let guard = 0;

    // The guard bounds the loop: a rule that somehow matched empty would
    // otherwise spin, and a runaway loop in a debugging panel is worse than
    // a partly plain snippet.
    while (rest && guard < 20000) {
        guard += 1;
        let best: { index: number; text: string; type: TokenType } | null = null;
        for (const rule of rules) {
            const match = new RegExp(rule.pattern.source, rule.pattern.flags.replace('g', '')).exec(rest);
            if (match && match[0] && (!best || match.index < best.index)) {
                best = { index: match.index, text: match[0], type: rule.type };
            }
            if (best?.index === 0) break;
        }
        // Nothing matches any more: the remainder is flushed below.
        if (!best) break;
        if (best.index > 0) tokens.push({ type: 'plain', text: rest.slice(0, best.index) });
        tokens.push({ type: best.type, text: best.text });
        rest = rest.slice(best.index + best.text.length);
    }
    // Whatever the guard cut short still has to be rendered: a snippet shown
    // shorter than the one the copy button hands over would be worse than an
    // unhighlighted tail.
    if (rest) tokens.push({ type: 'plain', text: rest });
    return tokens;
}

/**
 * Token colours. Chosen against the block's light background and kept close
 * to GitHub's light theme, which is what a developer reading SDK docs on
 * developers.thoughtspot.com has just been looking at.
 */
const TOKEN_COLORS: Record<TokenType, string | undefined> = {
    comment: '#6a737d',
    string: '#032f62',
    keyword: '#d73a49',
    number: '#005cc5',
    tag: '#22863a',
    attr: '#6f42c1',
    punct: '#586069',
    plain: undefined,
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => (
    <div style={styles.codeBlock}>
        <div style={styles.codeBlockHeader}>
            <span style={styles.codeBlockLang}>{language || 'code'}</span>
            <CopyButton text={code} label="code" />
        </div>
        <pre style={styles.codeBlockPre}>
            <code>
                {tokenizeCode(code, language).map((token, i) => (
                    <span key={i} style={TOKEN_COLORS[token.type] ? { color: TOKEN_COLORS[token.type] } : undefined}>
                        {token.text}
                    </span>
                ))}
            </code>
        </pre>
    </div>
);

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

const PANEL_WIDTH = 420;
const PANEL_MIN_WIDTH = 320;
const PANEL_MIN_HEIGHT = 320;
/** Gap left at the top and bottom when the panel runs full height. */
const PANEL_MARGIN = 20;
const SESSION_STORAGE_KEY = 'ts-debug-agent-extension-session-id';
const SIZE_STORAGE_KEY = 'ts-debug-agent-panel-size';

/** Tallest the panel can be while still clearing its margins. */
const maxPanelHeight = () => Math.max(PANEL_MIN_HEIGHT, window.innerHeight - PANEL_MARGIN * 2);
const maxPanelWidth = () => Math.max(PANEL_MIN_WIDTH, window.innerWidth - PANEL_MARGIN * 2);

interface PanelSize {
    width: number;
    height: number;
}

/**
 * The panel opens full height — a debugging transcript with code blocks in it
 * needs the room, and the old 600px box meant constant scrolling. Dragging the
 * top-left corner resizes it, and the result is remembered per origin.
 */
function readStoredSize(): PanelSize | null {
    try {
        const raw = window.localStorage.getItem(SIZE_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<PanelSize>;
        if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') return null;
        return parsed as PanelSize;
    } catch {
        return null;
    }
}

function storeSize(size: PanelSize): void {
    try {
        window.localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(size));
    } catch {
        // Ignore — the size just will not persist across reloads.
    }
}

/** Keeps a stored or dragged size inside what the current viewport allows. */
function clampSize(size: PanelSize): PanelSize {
    return {
        width: Math.min(Math.max(size.width, PANEL_MIN_WIDTH), maxPanelWidth()),
        height: Math.min(Math.max(size.height, PANEL_MIN_HEIGHT), maxPanelHeight()),
    };
}

/**
 * The extension's session id rotates whenever Chrome evicts its service
 * worker, so it is kept in localStorage rather than only in config — the
 * developer can paste a fresh one into the panel without touching code.
 * Storage can throw (private mode, blocked site data), hence the guards.
 */
function readStoredSessionId(): string {
    try {
        return window.localStorage.getItem(SESSION_STORAGE_KEY) ?? '';
    } catch {
        return '';
    }
}

function storeSessionId(value: string): void {
    try {
        if (value) window.localStorage.setItem(SESSION_STORAGE_KEY, value);
        else window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
        // Ignore — the id just will not persist across reloads.
    }
}

interface PickedElement {
    tag: string;
    id: string | null;
    classes: string[];
    selector: string;
    outerHTMLPreview: string;
    rect: { x: number; y: number; width: number; height: number };
    styles: Record<string, string>;
}

/**
 * Calls one browser-extension tool directly, with no agent in the path.
 *
 * Finding the embed's frame and arming the picker in it are mechanical steps;
 * asking the model to sequence them made picking unreliable (wrong frame,
 * missing frameSessionId, or the tool simply not re-run). The agent still
 * gets the *result* to reason about — it just no longer does the plumbing.
 */
async function callExtensionTool(
    agentApiUrl: string,
    sessionId: string,
    toolName: string,
    args: Record<string, unknown>,
): Promise<unknown> {
    const response = await fetch(`${agentApiUrl}/extension/tool-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, toolName, args }),
    });
    const payload = (await response.json()) as { result?: unknown; error?: string };
    if (!response.ok || payload.error) {
        throw new Error(payload.error || `Tool "${toolName}" failed (${response.status})`);
    }
    return payload.result;
}

/**
 * Resolves the tab this page is in and the CDP session of the ThoughtSpot
 * iframe within it. The embed is matched on frame type, never url — an
 * embedded frame often reports an empty url even while loaded and rendering.
 */
async function findEmbedFrame(
    agentApiUrl: string,
    sessionId: string,
): Promise<{ tabId: number; frameSessionId: string }> {
    const pages = (await callExtensionTool(agentApiUrl, sessionId, 'list_pages', {})) as Array<{
        tabId: number; url?: string; attached?: boolean;
    }>;
    // One extension session covers every tab, so the right one has to be
    // identified here. Prefer an exact URL match over a same-origin one —
    // two tabs of the same app would otherwise be indistinguishable — and
    // prefer a tab the developer has actually granted debugger access to,
    // since only those can be inspected at all.
    const candidates = pages.filter((p) => p.url && p.url.startsWith(window.location.origin));
    const here = candidates.find((p) => p.url === window.location.href && p.attached)
        ?? candidates.find((p) => p.url === window.location.href)
        ?? candidates.find((p) => p.attached)
        ?? candidates[0];
    if (!here) {
        throw new Error(
            'This page is not visible to the extension. Open its popup and click "Allow on this tab".',
        );
    }
    if (!here.attached) {
        throw new Error(
            'The extension is not attached to this tab. Open its popup and click "Allow on this tab".',
        );
    }

    const frames = (await callExtensionTool(agentApiUrl, sessionId, 'list_frames', {
        tabId: here.tabId,
    })) as { frames?: Array<{ sessionId: string; type: string }> };
    const embed = (frames.frames ?? []).find((f) => f.type === 'iframe');
    if (!embed) {
        throw new Error('No embedded iframe found in this tab.');
    }
    return { tabId: here.tabId, frameSessionId: embed.sessionId };
}

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
    const [pickingEmbed, setPickingEmbed] = useState(false);
    const [hovered, setHovered] = useState<Element | null>(null);
    const [sessionInput, setSessionInput] = useState(() => extensionSessionId ?? readStoredSessionId());
    const [showSessionField, setShowSessionField] = useState(false);
    // Full height by default; a remembered drag wins over it.
    const [size, setSize] = useState<PanelSize>(() => clampSize(
        readStoredSize() ?? { width: PANEL_WIDTH, height: maxPanelHeight() },
    ));
    const [resizing, setResizing] = useState(false);

    // The prop wins when given; otherwise whatever was pasted into the panel.
    const activeSessionId = (extensionSessionId ?? sessionInput).trim() || undefined;

    const historyRef = useRef<Array<{ role: Role; content: string }>>([]);
    const messagesRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    /** Aborts the in-flight agent stream. Non-null only while one is open. */
    const abortRef = useRef<AbortController | null>(null);
    /** Id of the reply currently streaming, so it renders without a copy button. */
    const streamingIdRef = useRef<string | null>(null);
    /**
     * Identifies the current turn. A reset bumps it, so the aborted turn's own
     * unwinding can tell it has been superseded and leave the fresh state alone.
     */
    const turnRef = useRef(0);

    /**
     * Follows the stream, but only while the developer is already at the
     * bottom — yanking the view down as tokens arrive makes a long answer
     * impossible to read back.
     */
    useEffect(() => {
        const el = messagesRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceFromBottom < 120) el.scrollTop = el.scrollHeight;
    }, [items]);

    // A panel unmounted mid-stream should not leave the request running.
    useEffect(() => () => abortRef.current?.abort(), []);

    // A window the panel no longer fits in has to pull it back in.
    useEffect(() => {
        const onResize = () => setSize((prev) => clampSize(prev));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    /**
     * Resizes from the top-left corner: the panel is pinned bottom-right, so
     * dragging left grows the width and dragging up grows the height. The
     * listeners live on the document for the duration of the drag, so the
     * pointer leaving the handle does not strand it mid-resize.
     */
    const startResize = (e: React.MouseEvent) => {
        e.preventDefault();
        const origin = { x: e.clientX, y: e.clientY };
        const startSize = size;
        // Without this a drag selects the page text it passes over.
        const prevUserSelect = document.body.style.userSelect;
        setResizing(true);

        const onMove = (ev: MouseEvent) => setSize(clampSize({
            width: startSize.width + (origin.x - ev.clientX),
            height: startSize.height + (origin.y - ev.clientY),
        }));
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.userSelect = prevUserSelect;
            setResizing(false);
            setSize((final) => {
                storeSize(final);
                return final;
            });
        };

        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    // Element picking: highlight whatever is under the cursor (ignoring this
    // panel), attach the pick as chat context on click.
    useEffect(() => {
        if (!picking) return undefined;
        const onMove = (e: MouseEvent) => {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (!target || panelRef.current?.contains(target)) return;
            setHovered(target);
        };
        // mousedown, not click: a cross-origin iframe swallows the click
        // entirely, so a picker listening for one stays armed forever over the
        // embed. mousedown still reaches this document first.
        const onPick = (e: MouseEvent) => {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (!target || panelRef.current?.contains(target)) return;
            e.preventDefault();
            e.stopPropagation();
            setPicking(false);
            setHovered(null);

            // The iframe element itself is pickable, but nothing inside it is:
            // that is a separate origin, and only the extension can read it.
            // Say so rather than attaching a snapshot of the empty frame box.
            if (target.tagName === 'IFRAME') {
                setItems((prev) => [...prev, {
                    id: nextId(),
                    kind: 'notice',
                    content: activeSessionId
                        ? 'That is the embed itself — use "Pick in embed" to pick inside it.'
                        : 'That is the embed itself. Connect the browser extension to pick inside it.',
                }]);
                return;
            }

            // Host page element: read it directly. Elements inside the embed
            // are not reachable this way — that path is handled by the
            // extension picker, armed from the Pick element button itself.
            const computed = window.getComputedStyle(target);
            const styleSnapshot: Record<string, string> = {};
            KEY_STYLE_PROPS.forEach((prop) => { styleSnapshot[prop] = String(computed[prop] ?? ''); });
            setItems((prev) => [...prev, {
                id: nextId(), kind: 'element', selector: describeElement(target), styles: styleSnapshot,
            }]);
        };
        // Escape disarms it. Without this, a picker that cannot land a click —
        // over a cross-origin iframe, say — stays armed and keeps swallowing
        // clicks, including the one on the Send button.
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            setPicking(false);
            setHovered(null);
        };
        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mousedown', onPick, true);
        document.addEventListener('keydown', onKeyDown, true);
        const prevCursor = document.body.style.cursor;
        document.body.style.cursor = 'crosshair';
        return () => {
            document.removeEventListener('mousemove', onMove, true);
            document.removeEventListener('mousedown', onPick, true);
            document.removeEventListener('keydown', onKeyDown, true);
            document.body.style.cursor = prevCursor;
        };
    }, [picking, activeSessionId]);

    if (!enabled) return null;

    /** Everything currently attached as context, newest last. */
    const pickedElements = items.filter(isElement);

    const buildContextPreamble = (): string => {
        const elementContexts = pickedElements;
        if (!elementContexts.length) return '';
        const blocks = elementContexts.map((ctx) => {
            const styleLines = Object.entries(ctx.styles).map(([k, v]) => `  ${k}: ${v};`).join('\n');
            // Where the element lives decides how it can be styled at all:
            // host page markup takes ordinary CSS, whereas anything inside the
            // embed has to go through the SDK's customCSS customizations.
            const where = ctx.inEmbed
                ? 'inside the embedded ThoughtSpot iframe'
                : 'in the host page';
            const html = ctx.outerHTMLPreview ? `\n${ctx.outerHTMLPreview}` : '';
            return `Element \`${ctx.selector}\` (${where}):${html}\n${styleLines}`;
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

        const abort = new AbortController();
        abortRef.current = abort;
        turnRef.current += 1;
        const turn = turnRef.current;

        const userMsg: ChatMessage = { id: nextId(), role: 'user', content: text };
        historyRef.current = [...historyRef.current, { role: 'user', content: contextPreamble + text }];
        setItems((prev) => [...prev, userMsg]);

        // One activity group per turn, created lazily so a turn that calls no
        // tools shows no card at all.
        const activityId = nextId();
        const upsertStep = (
            stepId: string,
            update: (prevStep: ActivityStep | undefined) => ActivityStep,
        ) => setItems((prev) => {
            const idx = prev.findIndex((it) => isActivity(it) && it.id === activityId);
            if (idx < 0) {
                return [...prev, { id: activityId, kind: 'activity', steps: [update(undefined)] }];
            }
            const group = prev[idx] as ActivityGroup;
            const stepIdx = group.steps.findIndex((s) => s.id === stepId);
            const steps = stepIdx < 0
                ? [...group.steps, update(undefined)]
                : group.steps.map((s, i) => (i === stepIdx ? update(s) : s));
            const next = [...prev];
            next[idx] = { ...group, steps };
            return next;
        });

        const assistantId = nextId();
        streamingIdRef.current = assistantId;
        let assistantText = '';
        try {
            const response = await fetch(`${agentApiUrl}/agent/embed-assistant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abort.signal,
                body: JSON.stringify({
                    agentType: 'visual-embed-sdk',
                    messages: historyRef.current,
                    extensionSessionId: activeSessionId,
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
                        const toolName = event.toolName as string;
                        const stepId = (event.toolCallId as string) || nextId();
                        upsertStep(stepId, () => ({
                            id: stepId,
                            toolName,
                            label: toolLabel(toolName, 'running'),
                            status: 'running',
                            args: summarizeArgs(event.input),
                            startedAt: Date.now(),
                        }));
                    } else if (event.type === 'tool-result') {
                        const toolName = event.toolName as string;
                        const stepId = event.toolCallId as string;
                        upsertStep(stepId, (prevStep) => ({
                            id: stepId,
                            toolName: prevStep?.toolName ?? toolName,
                            label: toolLabel(prevStep?.toolName ?? toolName, 'done'),
                            status: 'done',
                            args: prevStep?.args,
                            startedAt: prevStep?.startedAt ?? Date.now(),
                            durationMs: Date.now() - (prevStep?.startedAt ?? Date.now()),
                        }));
                    }
                }
            }
            if (assistantText) {
                historyRef.current = [...historyRef.current, { role: 'assistant', content: assistantText }];
            }
        } catch (err) {
            // A reset aborts the stream too, and it unwinds through here. Its
            // turn is gone, so none of the tidying below applies — writing the
            // partial reply back would refill the history the reset just
            // cleared, and the notice would land in an emptied timeline.
            if (turnRef.current !== turn) return;
            // A stop is the developer's own doing, so it reads as a note on the
            // turn rather than as a failure.
            if ((err as Error).name === 'AbortError') {
                if (assistantText) {
                    historyRef.current = [...historyRef.current, { role: 'assistant', content: assistantText }];
                }
                setItems((prev) => [...prev, {
                    id: nextId(), kind: 'notice', content: 'Stopped.',
                }]);
            } else {
                setItems((prev) => [...prev, {
                    id: nextId(), role: 'assistant', content: `⚠️ Request failed: ${(err as Error).message}`,
                }]);
            }
        } finally {
            // Same guard: a superseded turn must not clear the state the new
            // one has already set up.
            if (turnRef.current === turn) {
                abortRef.current = null;
                streamingIdRef.current = null;
                // Close the turn's card and mark any step the stream
                // never resolved, so the turn cannot spin forever.
                setItems((prev) => prev.map((it) => (isActivity(it) && it.id === activityId
                    ? {
                        ...it,
                        done: true,
                        steps: it.steps.map((s) => (s.status === 'running'
                            ? { ...s, status: 'failed' as const, durationMs: Date.now() - s.startedAt }
                            : s)),
                    }
                    : it)));
                setBusy(false);
                textareaRef.current?.focus();
            }
        }
    }

    /**
     * Arms the extension's picker inside the embed. The highlight is drawn by
     * a script running in the iframe's own frame, so it tracks the cursor at
     * native speed; this call simply waits for the user's click and then
     * hands the picked element to the agent.
     */
    async function pickInsideEmbed() {
        if (!activeSessionId || pickingEmbed) return;
        setPickingEmbed(true);
        // Reuses the activity card, so an extension-driven pick reports itself
        // the same way the agent's own steps do.
        const statusId = nextId();
        const startedAt = Date.now();
        setItems((prev) => [...prev, {
            id: statusId,
            kind: 'activity',
            steps: [{
                id: nextId(),
                toolName: 'start_element_picker',
                label: 'Waiting for you to pick an element in the embed',
                status: 'running',
                startedAt,
            }],
        }]);

        try {
            const { tabId, frameSessionId } = await findEmbedFrame(agentApiUrl, activeSessionId);
            const picked = (await callExtensionTool(
                agentApiUrl,
                activeSessionId,
                'start_element_picker',
                { tabId, frameSessionId, timeoutMs: 60_000 },
            )) as { picked: boolean; reason?: string; element?: PickedElement };

            const settle = (status: 'done' | 'failed') => setItems((prev) => prev.map((it) => (isActivity(it) && it.id === statusId
                ? {
                    ...it,
                    done: true,
                    steps: it.steps.map((s) => ({
                        ...s,
                        status,
                        label: status === 'done' ? 'Picked an element in the embed' : 'Did not pick an element',
                        durationMs: Date.now() - s.startedAt,
                    })),
                }
                : it)));

            if (!picked.picked || !picked.element) {
                settle('failed');
                const why = picked.reason === 'cancelled' ? 'Picking cancelled.'
                    : picked.reason === 'timeout' ? 'Picking timed out.'
                        : `Nothing picked (${picked.reason ?? 'unknown'}).`;
                setItems((prev) => [...prev, { id: nextId(), kind: 'notice', content: why }]);
                return;
            }
            settle('done');

            // Attach as context only — the developer asks their own questions
            // about it from here, the same way a host-page pick behaves.
            const el = picked.element;
            setItems((prev) => [...prev, {
                id: nextId(),
                kind: 'element',
                selector: el.selector,
                styles: el.styles,
                inEmbed: true,
                outerHTMLPreview: el.outerHTMLPreview,
            }]);
        } catch (err) {
            setItems((prev) => [
                ...prev.map((it) => (isActivity(it) && it.id === statusId
                    ? {
                        ...it,
                        done: true,
                        steps: it.steps.map((s) => ({
                            ...s, status: 'failed' as const, durationMs: Date.now() - s.startedAt,
                        })),
                    }
                    : it)),
                { id: nextId(), role: 'assistant' as const, content: `⚠️ ${(err as Error).message}` },
            ]);
        } finally {
            setPickingEmbed(false);
        }
    }

    const removeContext = (id: string) => setItems((prev) => prev.filter((it) => !(isElement(it) && it.id === id)));

    /** Aborts the in-flight stream; whatever already streamed in is kept. */
    const stopStreaming = () => abortRef.current?.abort();

    /**
     * Clears the conversation — both the rendered timeline and the history the
     * agent is sent, which would otherwise keep an apparently empty panel
     * answering in the context of the turns before it.
     */
    const resetConversation = () => {
        // Bumped before the abort so the turn being torn down recognises
        // itself as superseded and skips its own cleanup.
        turnRef.current += 1;
        abortRef.current?.abort();
        abortRef.current = null;
        streamingIdRef.current = null;
        historyRef.current = [];
        setItems([]);
        setInput('');
        setPicking(false);
        setBusy(false);
        textareaRef.current?.focus();
    };

    return (
        <>
            {picking && hovered ? (
                <ElementHoverOverlay
                    el={hovered}
                    iframeInspectable={hovered.tagName === 'IFRAME' && !!activeSessionId}
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
                <div
                    ref={panelRef}
                    style={{
                        ...styles.panel,
                        width: size.width,
                        height: size.height,
                        // A live drag must not animate, or it lags.
                        transition: resizing ? 'none' : 'width 120ms ease, height 120ms ease',
                    }}
                >
                    <div
                        onMouseDown={startResize}
                        style={styles.resizeHandle}
                        title="Drag to resize"
                        aria-hidden
                    />
                    <div style={styles.header}>
                        <span style={styles.headerTitle}>
                            <AgentGlyph size={18} />
                            <span>
                                <div style={styles.headerName}>Debug Agent</div>
                                <div style={styles.headerSubtitle}>
                                    <span style={{ ...styles.statusDot, background: busy ? '#d29922' : '#3fb950' }} />
                                    {busy ? 'Working…' : 'Ready'}
                                </div>
                            </span>
                        </span>
                        <span style={styles.headerActions}>
                            <button
                                type="button"
                                onClick={resetConversation}
                                disabled={!items.length && !busy}
                                aria-label="New conversation"
                                title="Clear this conversation and start over"
                                style={{
                                    ...styles.iconBtn,
                                    opacity: !items.length && !busy ? 0.35 : 1,
                                    cursor: !items.length && !busy ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {'↻'}
                            </button>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={styles.iconBtn}>
                                {'✕'}
                            </button>
                        </span>
                    </div>

                    <div ref={messagesRef} style={styles.messages}>
                        {items.length === 0 ? (
                            <WelcomeState onPick={() => setPicking(true)} extensionConnected={!!activeSessionId} />
                        ) : null}
                        {items.map((item) => {
                            if (isActivity(item)) return <ActivityCard key={item.id} group={item} />;
                            // Picked elements are pinned above the
                            // input instead, where they read as attached
                            // context rather than as a past event
                            // scrolling away up the transcript.
                            if (isElement(item)) return null;
                            if (isNotice(item)) {
                                return <div key={item.id} style={styles.notice}>{item.content}</div>;
                            }
                            const msg = item;
                            return (
                                <div key={msg.id} style={msg.role === 'user' ? styles.userRow : styles.assistantRow}>
                                    {msg.role === 'assistant' ? (
                                        <div style={styles.avatar}><AgentGlyph size={14} /></div>
                                    ) : null}
                                    <div style={msg.role === 'user' ? styles.userColumn : styles.assistantColumn}>
                                        <div style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                                            {renderContent(msg.content)}
                                        </div>
                                        {/* Only a settled reply gets a copy button: copying a
                                            half-streamed answer hands over a truncated one. */}
                                        {msg.role === 'assistant' && !(busy && msg.id === streamingIdRef.current) ? (
                                            <CopyButton
                                                text={msg.content}
                                                label="response"
                                                style={styles.messageCopyBtn}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                        {busy && !items.some((it) => isActivity(it) && it.steps.some((s) => s.status === 'running'))
                            && !items.some((it) => isMessage(it) && it.id === streamingIdRef.current) ? (
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
                            title="Pick an element on the host page to attach as context"
                        >
                            {'⌖'} {picking ? 'Picking…' : 'Pick element'}
                        </button>
                        {activeSessionId ? (
                            <button
                                type="button"
                                onClick={pickInsideEmbed}
                                disabled={pickingEmbed}
                                style={pickingEmbed ? styles.toolBtnActive : styles.toolBtn}
                                title="Highlight and pick an element inside the ThoughtSpot embed, via the connected extension"
                            >
                                {'⌖'} {pickingEmbed ? 'Pick in embed…' : 'Pick in embed'}
                            </button>
                        ) : null}
                        {!extensionSessionId ? (
                            <button
                                type="button"
                                onClick={() => setShowSessionField((s) => !s)}
                                style={styles.toolBtn}
                                title={activeSessionId
                                    ? 'Browser extension connected — click to change or clear the session id'
                                    : 'Paste the session id from the extension popup to inspect inside the embed'}
                            >
                                {activeSessionId ? '🔗 Extension' : '⚭ Connect extension'}
                            </button>
                        ) : null}
                    </div>

                    {showSessionField && !extensionSessionId ? (
                        <div style={styles.sessionRow}>
                            <input
                                type="text"
                                value={sessionInput}
                                onChange={(e) => {
                                    setSessionInput(e.target.value);
                                    storeSessionId(e.target.value.trim());
                                }}
                                placeholder="Extension session id (from the extension popup)"
                                style={styles.sessionInput}
                            />
                        </div>
                    ) : null}

                    {/* Attached context, pinned directly above the input so it
                        is visible while the question about it is being typed. */}
                    {pickedElements.length ? (
                        <div style={styles.contextTray}>
                            <div style={styles.contextTrayLabel}>
                                {pickedElements.length === 1
                                    ? '1 element attached'
                                    : `${pickedElements.length} elements attached`}
                            </div>
                            <div style={styles.contextTrayChips}>
                                {pickedElements.map((el) => (
                                    <ElementChip key={el.id} item={el} onRemove={() => removeContext(el.id)} />
                                ))}
                            </div>
                        </div>
                    ) : null}

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
                        {busy ? (
                            <button
                                type="button"
                                onClick={stopStreaming}
                                aria-label="Stop"
                                title="Stop the agent"
                                style={styles.stopBtn}
                            >
                                {'■'}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                aria-label="Send"
                                style={{
                                    ...styles.sendBtn,
                                    opacity: input.trim() ? 1 : 0.4,
                                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {'↑'}
                            </button>
                        )}
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
            {extensionConnected ? ' With the browser extension connected, that works inside the ThoughtSpot iframe too.' : ''}
        </div>
        <button type="button" onClick={onPick} style={styles.welcomeBtn}>
            {'⌖'} Pick an element
        </button>
    </div>
);

/**
 * One turn's tool calls, collapsed to a single status line and expandable to
 * the full step list.
 *
 * Collapsed, the caption is the currently running step's end-user label (or a
 * count once the turn is done), never a tool name. Expanded, each step shows
 * its real tool name, argument summary and duration — the detail a developer
 * needs when the plain caption is not enough.
 */
const ActivityCard: React.FC<{ group: ActivityGroup }> = ({ group }) => {
    const [expanded, setExpanded] = useState(false);
    const running = group.steps.find((s) => s.status === 'running');
    const failed = group.steps.some((s) => s.status === 'failed');
    const totalMs = group.steps.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);

    const caption = running
        ? `${running.label}…`
        : `${group.steps.length} step${group.steps.length === 1 ? '' : 's'}${totalMs ? ` · ${formatDuration(totalMs)}` : ''}`;

    return (
        <div style={styles.activityCard}>
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={styles.activityHeader}
                aria-expanded={expanded}
                title={expanded ? 'Hide the steps taken' : 'Show the steps taken'}
            >
                {running ? <Spinner /> : <span style={styles.activityIcon}>{failed ? '⚠' : '✓'}</span>}
                <span style={styles.activityCaption}>{caption}</span>
                <span style={styles.activityChevron}>{expanded ? '⌃' : '⌄'}</span>
            </button>
            {expanded ? (
                <div style={styles.activitySteps}>
                    {group.steps.map((step) => (
                        <div key={step.id} style={styles.activityStep}>
                            <span style={styles.activityStepIcon}>
                                {step.status === 'running' ? '·' : step.status === 'failed' ? '⚠' : '✓'}
                            </span>
                            <div style={styles.activityStepBody}>
                                <div style={styles.activityStepTitle}>
                                    <span>{step.label}</span>
                                    {step.durationMs !== undefined ? (
                                        <span style={styles.activityStepTime}>{formatDuration(step.durationMs)}</span>
                                    ) : null}
                                </div>
                                <div style={styles.activityStepTool}>{step.toolName}</div>
                                {step.args ? <div style={styles.activityStepArgs}>{step.args}</div> : null}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

const Spinner: React.FC = () => (
    <span
        style={{
            width: 10,
            height: 10,
            flexShrink: 0,
            borderRadius: '50%',
            border: '1.5px solid #c9dcfc',
            borderTopColor: '#1f6feb',
            display: 'inline-block',
            animation: 'ts-debug-agent-spin 0.7s linear infinite',
        }}
        aria-hidden
    >
        <style>{'@keyframes ts-debug-agent-spin {to{transform:rotate(360deg)}}'}</style>
    </span>
);

/**
 * One attached element, shown in the tray above the input. The selector is
 * clipped rather than wrapped so a deep one cannot squeeze out the badge or
 * the remove button, and the full value stays available on hover.
 */
const ElementChip: React.FC<{ item: PickedElementContext; onRemove: () => void }> = ({ item, onRemove }) => {
    const size = item.styles.width && item.styles.height
        ? `${item.styles.width} × ${item.styles.height}`
        : '';
    return (
        <div
            style={styles.elementChip}
            title={`${item.selector}${size ? ` — ${size}` : ''}${item.inEmbed ? ' (inside the embed)' : ''}`}
        >
            <span style={styles.elementChipIcon}>{'⌖'}</span>
            <span style={styles.elementChipTag}>{item.selector}</span>
            {item.inEmbed ? <span style={styles.elementChipBadge}>embed</span> : null}
            <button type="button" onClick={onRemove} aria-label={`Remove ${item.selector}`} style={styles.elementChipRemove}>
                {'✕'}
            </button>
        </div>
    );
};

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
                {iframeInspectable ? ' · use "Pick in embed" to pick inside it' : ''}
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
    // Width and height come from the resize state; the panel stays pinned to
    // the bottom-right so a drag from its top-left corner grows it inward.
    panel: {
        position: 'fixed',
        bottom: PANEL_MARGIN,
        right: PANEL_MARGIN,
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
    resizeHandle: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 18,
        height: 18,
        cursor: 'nwse-resize',
        // Above the header, so the corner grabs before the title does.
        zIndex: 1,
        borderTopLeftRadius: 16,
        // A faint corner mark: discoverable without becoming furniture.
        background: 'linear-gradient(135deg, #cbd5e1 0 2px, transparent 2px)',
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
    headerActions: { display: 'flex', alignItems: 'center', gap: 2 },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        fontSize: 14,
        lineHeight: 1,
        padding: '5px 6px',
        borderRadius: 6,
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
    // minWidth 0 on the row: without it the nested column cannot shrink below
    // its content, so a long line overflows the panel instead of wrapping.
    userRow: {
        display: 'flex', justifyContent: 'flex-end', minWidth: 0,
    },
    assistantRow: {
        display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0,
    },
    avatar: { marginTop: 2, flexShrink: 0 },
    // The bubble fills its column, which is what caps the width — capping in
    // both would compound to roughly 72% of the panel.
    userBubble: {
        padding: '9px 12px',
        borderRadius: '14px 14px 3px 14px',
        background: '#1f6feb',
        color: '#fff',
        maxWidth: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
    },
    assistantBubble: {
        padding: '9px 12px',
        borderRadius: '14px 14px 14px 3px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        maxWidth: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
    },
    inlineCode: {
        background: '#eef2f7',
        border: '1px solid #dde3ea',
        borderRadius: 3,
        padding: '1px 4px',
        fontFamily: MONO,
        fontSize: '0.92em',
    },
    activityCard: {
        alignSelf: 'stretch',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    activityHeader: {
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: FONT,
        fontSize: 11.5,
        color: '#475569',
    },
    activityIcon: { color: '#3fb950', fontSize: 11, flexShrink: 0 },
    activityCaption: {
        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    activityChevron: { color: '#94a3b8', fontSize: 11, flexShrink: 0 },
    activitySteps: {
        borderTop: '1px solid #e2e8f0',
        padding: '6px 10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
    },
    activityStep: { display: 'flex', gap: 7, alignItems: 'flex-start' },
    activityStepIcon: {
        color: '#94a3b8', fontSize: 10, lineHeight: '16px', flexShrink: 0, width: 10,
    },
    activityStepBody: { minWidth: 0, flex: 1 },
    activityStepTitle: {
        display: 'flex', gap: 8, alignItems: 'baseline', color: '#334155', fontSize: 11.5,
    },
    activityStepTime: { color: '#94a3b8', fontSize: 10, marginLeft: 'auto', flexShrink: 0 },
    activityStepTool: { fontFamily: MONO, fontSize: 10, color: '#64748b' },
    activityStepArgs: {
        fontFamily: MONO,
        fontSize: 10,
        color: '#94a3b8',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    notice: {
        alignSelf: 'center', fontSize: 11, color: '#94a3b8', padding: '2px 0',
    },
    contextTray: {
        flex: '0 0 auto',
        padding: '8px 12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    contextTrayLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 },
    contextTrayChips: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        // Several picks must not push the input off the panel.
        maxHeight: 92,
        overflowY: 'auto',
    },
    userColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        maxWidth: '85%',
        minWidth: 0,
        flexShrink: 1,
    },
    assistantColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxWidth: '85%',
        minWidth: 0,
        flexShrink: 1,
    },
    messageCopyBtn: { marginTop: 3, alignSelf: 'flex-start' },
    copyBtn: {
        background: 'transparent',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        fontFamily: FONT,
        fontSize: 10.5,
        padding: '2px 4px',
        borderRadius: 4,
        flexShrink: 0,
    },
    codeBlock: {
        margin: '6px 0',
        background: '#f6f8fa',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    codeBlockHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '3px 6px 3px 10px',
        borderBottom: '1px solid #e2e8f0',
        background: '#eef2f7',
    },
    codeBlockLang: {
        fontFamily: MONO, fontSize: 10, color: '#64748b', textTransform: 'lowercase',
    },
    codeBlockPre: {
        margin: 0,
        padding: '8px 10px',
        overflowX: 'auto',
        fontFamily: MONO,
        fontSize: 11.5,
        lineHeight: 1.5,
        color: '#0f172a',
        whiteSpace: 'pre',
    },
    elementChip: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        background: '#eef4ff',
        border: '1px solid #c9dcfc',
        borderRadius: 8,
        padding: '4px 6px 4px 8px',
        maxWidth: '100%',
        minWidth: 0,
    },
    elementChipIcon: { color: '#1f6feb', flexShrink: 0 },
    elementChipTag: {
        fontFamily: MONO,
        color: '#1f6feb',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
    },
    elementChipBadge: {
        flexShrink: 0,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        color: '#3730a3',
        background: '#e0e7ff',
        borderRadius: 4,
        padding: '1px 4px',
    },
    elementChipRemove: {
        background: 'transparent',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        fontSize: 10,
        padding: '2px 3px',
        flexShrink: 0,
        lineHeight: 1,
    },
    toolbar: {
        flex: '0 0 auto', padding: '8px 12px 0', display: 'flex', gap: 8, flexWrap: 'wrap',
    },
    sessionRow: {
        flex: '0 0 auto', padding: '8px 12px 0',
    },
    sessionInput: {
        width: '100%',
        boxSizing: 'border-box',
        background: '#f8fafc',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '6px 10px',
        fontFamily: MONO,
        fontSize: 11,
        outline: 'none',
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
    stopBtn: {
        width: 34,
        height: 34,
        flexShrink: 0,
        borderRadius: '50%',
        background: '#ffffff',
        color: '#334155',
        border: '1px solid #cbd5e1',
        fontSize: 10,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};
