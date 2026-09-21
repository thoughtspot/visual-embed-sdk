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
    start_debug_session: { running: 'Starting the recording', done: 'Recording' },
    stop_debug_session: { running: 'Stopping the recording', done: 'Stopped the recording' },
    get_debug_session: { running: 'Reading the recording', done: 'Read the recording' },
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
/** `[label](https://…)` — only http(s), so a `javascript:` URL cannot ride in. */
const MD_LINK = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/;

function renderInline(text: string, keyPrefix: string, styles: Record<string, React.CSSProperties>): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g);
    parts.forEach((part, i) => {
        if (!part) return;
        const link = MD_LINK.exec(part);
        if (link) {
            // The agent cites docs pages constantly; as raw markdown those were
            // unreadable and unclickable. `noreferrer` keeps the host page's
            // URL out of the referer sent to the docs site.
            nodes.push(
                <a
                    key={`${keyPrefix}-${i}`}
                    href={link[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                >
                    {link[1]}
                </a>,
            );
        } else if (part.startsWith('**') && part.endsWith('**')) {
            nodes.push(<strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>);
        } else if (part.startsWith('`') && part.endsWith('`')) {
            // A span, not `code`: a host page's `code { ... !important }` rule
            // would override the inline style and render this unreadable.
            nodes.push(
                <span key={`${keyPrefix}-${i}`} style={styles.inlineCode}>
                    {part.slice(1, -1)}
                </span>,
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

function renderProse(content: string, styles: Record<string, React.CSSProperties>): React.ReactNode {
    const lines = content.replace(/^\n+|\n+$/g, '').split('\n');
    return lines.map((line, i) => {
        const trimmed = line.trimStart();
        // A thematic break, which the agent uses before its AI disclaimer.
        // Drawn as a rule rather than left as literal dashes.
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            return <div key={i} style={styles.rule} />;
        }
        const bullet = /^[-*]\s+/.test(trimmed);
        const heading = /^#{1,4}\s+/.exec(trimmed);
        const body = bullet ? trimmed.replace(/^[-*]\s+/, '') : (heading ? trimmed.slice(heading[0].length) : line);
        const rendered = renderInline(body, `l${i}`, styles);
        return (
            <React.Fragment key={i}>
                {bullet ? <span style={{ opacity: 0.55 }}>{'•  '}</span> : null}
                {heading ? <strong>{rendered}</strong> : rendered}
                {i < lines.length - 1 ? <br /> : null}
            </React.Fragment>
        );
    });
}

function renderContent(content: string, styles: Record<string, React.CSSProperties>): React.ReactNode {
    return splitContentSegments(content).map((seg, i) => (seg.type === 'code' ? (
        <CodeBlock key={`c${i}`} code={seg.text} language={seg.language} />
    ) : (
        <div key={`p${i}`}>{renderProse(seg.text, styles)}</div>
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
    const { styles } = useTheme();
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
 * Renders the block with `div`s rather than `pre`/`code`.
 *
 * A host page styling `code, pre { background: #161b22 !important }` — normal
 * in a dark theme — beats any inline style React can emit, which left syntax
 * tokens on a near-black background inside an otherwise light panel. Nothing
 * here depends on `pre` semantics: `whiteSpace: 'pre'` preserves the
 * formatting, and the tag itself was the only thing host CSS could target.
 */
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
    const { c, styles } = useTheme();
    return (
        <div style={styles.codeBlock}>
            <div style={styles.codeBlockHeader}>
                <span style={styles.codeBlockLang}>{language || 'code'}</span>
                <CopyButton text={code} label="code" />
            </div>
            <div style={styles.codeBlockPre}>
                {tokenizeCode(code, language).map((token, i) => (
                    <span
                        key={i}
                        style={token.type === 'plain' ? undefined : { color: c.token[token.type] }}
                    >
                        {token.text}
                    </span>
                ))}
            </div>
        </div>
    );
};

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
    const prefersDark = usePrefersDark();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [picking, setPicking] = useState(false);
    const [pickingEmbed, setPickingEmbed] = useState(false);
    // Debug-session recording. `recording` drives the button's state; the tab
    // id is kept so stopping targets the same tab that started, even if the
    // developer switched tabs mid-reproduction.
    const [recording, setRecording] = useState(false);
    const [recordingBusy, setRecordingBusy] = useState(false);
    const recordingTabRef = useRef<number | undefined>(undefined);
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

    // Before the early return, so the hook order never changes with `enabled`.
    const theme = React.useMemo<Theme>(() => {
        const c = prefersDark ? DARK : LIGHT;
        return { c, styles: makeStyles(c) };
    }, [prefersDark]);
    const { c, styles } = theme;

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

    /**
     * Starts or stops a debug-session recording in the extension.
     *
     * Recording is deliberately an explicit button rather than something the
     * agent starts on its own: a session captures network traffic, console
     * output and clicks continuously until stopped, and it produces an
     * artifact meant to be shared. That needs a visible, user-owned on/off
     * switch — the same reasoning that keeps the pickers on buttons.
     *
     * Like the pickers, this calls the extension directly instead of asking
     * the model to. Start and stop are mechanical, and the agent's value is
     * in reading the recording afterwards, not in sequencing it.
     */
    async function toggleRecording() {
        if (!activeSessionId || recordingBusy) return;
        setRecordingBusy(true);

        const statusId = nextId();
        const startedAt = Date.now();
        const toolName = recording ? 'stop_debug_session' : 'start_debug_session';
        setItems((prev) => [...prev, {
            id: statusId,
            kind: 'activity',
            steps: [{
                id: nextId(),
                toolName,
                label: recording ? 'Stopping the recording' : 'Starting the recording',
                status: 'running',
                startedAt,
            }],
        }]);

        const settle = (status: 'done' | 'failed', label: string) => setItems(
            (prev) => prev.map((it) => (isActivity(it) && it.id === statusId
                ? {
                    ...it,
                    done: true,
                    steps: it.steps.map((st) => ({
                        ...st, status, label, durationMs: Date.now() - st.startedAt,
                    })),
                }
                : it)),
        );

        try {
            if (!recording) {
                // Only the tab is needed to start — recording spans the host
                // page and every frame in it, so there is no frame to resolve.
                const { tabId } = await findEmbedFrame(agentApiUrl, activeSessionId);
                const started = (await callExtensionTool(
                    agentApiUrl, activeSessionId, 'start_debug_session', { tabId },
                )) as { started: boolean; reason?: string };
                if (!started.started) {
                    settle('failed', 'Could not start recording');
                    setItems((prev) => [...prev, {
                        id: nextId(),
                        kind: 'notice',
                        content: started.reason ?? 'A recording is already running.',
                    }]);
                    return;
                }
                recordingTabRef.current = tabId;
                setRecording(true);
                settle('done', 'Recording');
                setItems((prev) => [...prev, {
                    id: nextId(),
                    kind: 'notice',
                    content: 'Recording. Reproduce the problem, then click Stop & analyse.',
                }]);
                return;
            }

            const summary = (await callExtensionTool(
                agentApiUrl, activeSessionId, 'stop_debug_session', {},
            )) as {
                entryCount?: number; durationMs?: number; truncated?: boolean;
                countsByType?: Record<string, number>; reason?: string;
            };
            setRecording(false);
            recordingTabRef.current = undefined;

            if (summary.entryCount === undefined) {
                settle('failed', 'No recording to stop');
                setItems((prev) => [...prev, {
                    id: nextId(),
                    kind: 'notice',
                    content: summary.reason ?? 'No recording was running.',
                }]);
                return;
            }
            settle('done', 'Stopped the recording');

            const counts = summary.countsByType ?? {};
            const failures = (counts['network-failed'] ?? 0) + (counts.exception ?? 0);
            const seconds = Math.round((summary.durationMs ?? 0) / 1000);
            setItems((prev) => [...prev, {
                id: nextId(),
                kind: 'notice',
                content: `Captured ${summary.entryCount} events over ${seconds}s`
                    + (failures ? ` — including ${failures} failure${failures === 1 ? '' : 's'}.` : '.')
                    + (summary.truncated ? ' The recording hit its limit, so later events were dropped.' : ''),
            }]);

            // Hand the recording to the agent. The developer gets the analysis
            // without having to ask for it — stopping IS the request.
            void sendText('Analyse the debug session I just recorded. Read it with '
                + 'get_debug_session, build a timeline of what happened, and tell me '
                + 'the likely root cause, separating the evidence you captured from '
                + 'your own analysis.');
        } catch (err) {
            settle('failed', recording ? 'Could not stop recording' : 'Could not start recording');
            setItems((prev) => [...prev, {
                id: nextId(),
                role: 'assistant' as const,
                content: `\u26a0\ufe0f ${(err as Error).message}`,
            }]);
        } finally {
            setRecordingBusy(false);
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
        <ThemeContext.Provider value={theme}>
            {/* One stylesheet for the whole panel: several spinners on screen
                used to inject the same @keyframes several times over. */}
            <style>{KEYFRAMES}</style>
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
                    aria-label={`Open ${PRODUCT_NAME}`}
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
                            <AgentGlyph size={20} />
                            <span>
                                <div style={styles.headerName}>{PRODUCT_NAME}</div>
                                <div style={styles.headerSubtitle}>
                                    <span style={styles.headerTagline}>{PRODUCT_TAGLINE}</span>
                                    <span aria-hidden style={styles.headerDivider}>{'·'}</span>
                                    <span
                                        data-ts-dbg-anim
                                        style={{
                                            ...styles.statusDot,
                                            background: busy ? c.warning : c.success,
                                            // Pulses while working.
                                            animation: busy
                                                ? 'ts-dbg-pulse 1.4s ease-in-out infinite'
                                                : undefined,
                                        }}
                                    />
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
                        {/* Picked elements live in the tray above the input,
                            not the transcript, so attaching one must not count
                            as a conversation and hide the openers. */}
                        {!items.some((it) => !isElement(it)) ? (
                            <WelcomeState
                                onPick={() => setPicking(true)}
                                onPrompt={(text) => sendText(text, buildContextPreamble())}
                                extensionConnected={!!activeSessionId}
                            />
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
                                            {renderContent(msg.content, styles)}
                                            {/* Live caret: the answer is
                                                still arriving. */}
                                            {msg.role === 'assistant' && busy
                                                && msg.id === streamingIdRef.current ? (
                                                    <span data-ts-dbg-anim style={styles.caret} />
                                                ) : null}
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
                        {activeSessionId ? (
                            <button
                                type="button"
                                onClick={toggleRecording}
                                disabled={recordingBusy}
                                style={recording ? styles.toolBtnRecording : styles.toolBtn}
                                title={recording
                                    ? 'Stop recording and have the agent analyse what was captured'
                                    : 'Record console, network and your actions across the page and the embed while you reproduce a problem'}
                            >
                                {recording ? `\u23f9 ${recordingBusy ? 'Stopping\u2026' : 'Stop & analyse'}`
                                    : `\u23fa ${recordingBusy ? 'Starting\u2026' : 'Record issue'}`}
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
        </ThemeContext.Provider>
    );
};

/**
 * The product mark. A gradient-filled rounded square with the spark glyph —
 * the one deliberately branded element, so it keeps its own colours in both
 * themes rather than following the palette.
 */
const AgentGlyph: React.FC<{ size: number }> = ({ size }) => (
    <div
        style={{
            width: size,
            height: size,
            borderRadius: size / 3.2,
            flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #d946ef 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.58,
            lineHeight: 1,
            color: '#ffffff',
            boxShadow: `0 ${size / 12}px ${size / 3}px rgba(99, 102, 241, 0.35)`,
        }}
        aria-hidden
    >
        {'✦'}
    </div>
);

const TypingDots: React.FC = () => {
    const { c } = useTheme();
    return (
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '2px 0' }}>
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: c.textMuted,
                        animation: 'ts-dbg-blink 1.1s infinite ease-in-out',
                        animationDelay: `${i * 0.15}s`,
                    }}
                />
            ))}
        </span>
    );
};

/**
 * Openers offered on the empty state. Each is a question the agent handles
 * well with the tools it has, so a first-time user gets a useful answer
 * instead of having to guess what the panel can do. The `send` text is what
 * is actually asked; the label stays short enough to read at a glance.
 */
const STARTER_PROMPTS: Array<{ icon: string; label: string; send: string }> = [
    {
        icon: '🩺',
        label: 'Diagnose this embed',
        send: 'Check the console and network for errors in this embed and tell me what is wrong.',
    },
    {
        icon: '🎨',
        label: 'Match my app theme',
        send: 'Give me the customCSS variables to make this embed match my host page theme.',
    },
    {
        icon: '🙈',
        label: 'Hide an action',
        send: 'How do I hide a specific action from the embed menus?',
    },
];

const WelcomeState: React.FC<{
    onPick: () => void;
    onPrompt: (text: string) => void;
    extensionConnected?: boolean;
}> = ({ onPick, onPrompt, extensionConnected }) => {
    const { c, styles } = useTheme();
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <div style={styles.welcome}>
            <AgentGlyph size={36} />
            <div style={styles.welcomeTitle}>{`How can I help with this embed?`}</div>
            <div style={styles.welcomeBody}>
                Ask about console errors, failed requests, or configuration — or pick an
                element to get style help for it.
                {extensionConnected ? ' The connected extension lets that work inside the ThoughtSpot iframe too.' : ''}
            </div>

            {/* Clickable openers: the empty state was a large blank area, and a
                first-time user had no idea what this panel could answer. */}
            <div style={styles.starterList}>
                {STARTER_PROMPTS.map((p) => (
                    <button
                        key={p.label}
                        type="button"
                        onClick={() => onPrompt(p.send)}
                        onMouseEnter={() => setHovered(p.label)}
                        onMouseLeave={() => setHovered(null)}
                        title={p.send}
                        style={{
                            ...styles.starterBtn,
                            ...(hovered === p.label
                                ? { borderColor: c.accent, background: c.accentSoft, color: c.accent }
                                : null),
                        }}
                    >
                        <span aria-hidden style={styles.starterIcon}>{p.icon}</span>
                        <span style={styles.starterLabel}>{p.label}</span>
                        <span aria-hidden style={styles.starterArrow}>{'→'}</span>
                    </button>
                ))}
            </div>

            <button type="button" onClick={onPick} style={styles.welcomeBtn}>
                {'⌖'}
                {'  Pick an element instead'}
            </button>
        </div>
    );
};

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
    const { c, styles } = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [hover, setHover] = useState(false);
    const running = group.steps.find((s) => s.status === 'running');
    const failed = group.steps.some((s) => s.status === 'failed');
    const totalMs = group.steps.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);

    // While running, the caption is the live step. Once the turn is over the
    // card is the only way back to the steps, so it names the action instead
    // of just counting: "Show steps" reads as a control, "2 steps" did not.
    const stepCount = `${group.steps.length} step${group.steps.length === 1 ? '' : 's'}`;
    const caption = running ? `${running.label}…` : stepCount;

    return (
        <div style={{ ...styles.activityCard, ...(hover && !running ? styles.activityCardHover : null) }}>
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={styles.activityHeader}
                aria-expanded={expanded}
                title={expanded ? 'Hide the steps taken' : 'Show the steps taken'}
            >
                {running ? <Spinner /> : <span style={styles.activityIcon}>{failed ? '⚠' : '✓'}</span>}
                <span style={styles.activityCaption}>{caption}</span>
                {totalMs && !running ? <span style={styles.activityDuration}>{formatDuration(totalMs)}</span> : null}
                {/* An explicit label, not just a chevron: after the answer
                    lands this is the only route back to the steps, and a bare
                    glyph on a pale card did not read as clickable. */}
                <span style={styles.activityToggle}>
                    {expanded ? 'Hide' : 'Show'} steps
                    <span style={{ ...styles.activityChevron, transform: expanded ? 'rotate(180deg)' : 'none' }}>
                        {'⌄'}
                    </span>
                </span>
            </button>
            {expanded ? (
                <div style={styles.activitySteps}>
                    {group.steps.map((step, idx) => (
                        <div
                            key={step.id}
                            data-ts-dbg-anim
                            style={{ ...styles.activityStep, animationDelay: `${idx * 45}ms` }}
                        >
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

const Spinner: React.FC = () => {
    const { c } = useTheme();
    return (
        <span
            style={{
                width: 10,
                height: 10,
                flexShrink: 0,
                borderRadius: '50%',
                border: `1.5px solid ${c.accentBorder}`,
                borderTopColor: c.accent,
                display: 'inline-block',
                animation: 'ts-dbg-spin 0.7s linear infinite',
            }}
            aria-hidden
        >
        </span>
    );
};

/**
 * One attached element, shown in the tray above the input. The selector is
 * clipped rather than wrapped so a deep one cannot squeeze out the badge or
 * the remove button, and the full value stays available on hover.
 */
const ElementChip: React.FC<{ item: PickedElementContext; onRemove: () => void }> = ({ item, onRemove }) => {
    const { styles } = useTheme();
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
    const { c } = useTheme();
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

/** The panel's display name, shown in the header and the launcher label. */
const PRODUCT_NAME = 'EmbedX';
const PRODUCT_TAGLINE = 'Embed assistant';

/**
 * The active palette and its built style set. A context rather than props so
 * the ~70 `styles.x` references in the subcomponents stay as they were; the
 * default is the light set, which is also what a subcomponent rendered outside
 * the panel (in a test, say) gets.
 */
interface Theme {
    c: Palette;
    styles: Record<string, React.CSSProperties>;
}

const ThemeContext = React.createContext<Theme | null>(null);

/** The active theme. Falls back to light when used outside the provider. */
function useTheme(): Theme {
    const ctx = React.useContext(ThemeContext);
    // Lazily built, and only on the fallback path.
    return ctx ?? { c: LIGHT, styles: makeStyles(LIGHT) };
}

/**
 * The panel renders inside the host page's DOM, so the host's own CSS cascades
 * into it: a dark-theme host sets `color` on descendants and backgrounds on
 * `pre`/`code`, which previously left inline code as unreadable light-on-light
 * boxes and put light syntax tokens on a dark block.
 *
 * So every surface states BOTH its background and its text colour — never one
 * without the other, and never relying on inheritance.
 */
interface Palette {
    surface: string;
    surfaceMuted: string;
    surfaceRaised: string;
    codeSurface: string;
    codeHeader: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    textFaint: string;
    accent: string;
    accentHover: string;
    accentSoft: string;
    accentBorder: string;
    onAccent: string;
    inlineCodeText: string;
    success: string;
    warning: string;
    /** Recording/destructive state — the only red in the panel. */
    danger: string;
    shadow: string;
    /** Syntax-token colours, tuned per theme for contrast on `codeSurface`. */
    token: Record<Exclude<TokenType, 'plain'>, string>;
}

const LIGHT: Palette = {
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    surfaceRaised: '#f1f5f9',
    codeSurface: '#f6f8fa',
    codeHeader: '#eef2f7',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#64748b',
    textFaint: '#94a3b8',
    accent: '#4f46e5',
    accentHover: '#4338ca',
    accentSoft: '#eef2ff',
    accentBorder: '#c7d2fe',
    onAccent: '#ffffff',
    inlineCodeText: '#b91c4e',
    success: '#1a7f37',
    warning: '#9a6700',
    danger: '#d1242f',
    shadow: '0 20px 48px rgba(15, 23, 42, 0.18)',
    token: {
        comment: '#6a737d',
        string: '#0a6640',
        keyword: '#c2185b',
        number: '#005cc5',
        tag: '#22863a',
        attr: '#6f42c1',
        punct: '#586069',
    },
};

/**
 * Dark palette. Slate-based rather than pure black so it reads as a panel
 * floating above a dark app rather than a hole in it, and the syntax tokens
 * are lightened to stay legible on `codeSurface`.
 */
const DARK: Palette = {
    surface: '#161b22',
    surfaceMuted: '#1c222b',
    surfaceRaised: '#232a35',
    codeSurface: '#0f141a',
    codeHeader: '#1c222b',
    border: '#2d3542',
    borderStrong: '#3d4757',
    text: '#e6edf3',
    textMuted: '#9aa6b5',
    textFaint: '#6e7a8a',
    accent: '#818cf8',
    accentHover: '#a5b4fc',
    accentSoft: '#1e2438',
    accentBorder: '#3730a3',
    onAccent: '#0f1117',
    inlineCodeText: '#ff7b9c',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f85149',
    shadow: '0 20px 48px rgba(0, 0, 0, 0.55)',
    token: {
        comment: '#7d8896',
        string: '#7ee787',
        keyword: '#ff7b9c',
        number: '#79c0ff',
        tag: '#7ee787',
        attr: '#d2a8ff',
        punct: '#9aa6b5',
    },
};

/**
 * Tracks the OS colour-scheme preference, so the panel suits a light and a
 * dark host without the host having to configure anything. `matchMedia` is
 * missing in some embedded webviews and throws under some test setups, hence
 * the guards; light is the fallback.
 */
function usePrefersDark(): boolean {
    const [dark, setDark] = useState(() => {
        try {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        let mq: MediaQueryList;
        try {
            mq = window.matchMedia('(prefers-color-scheme: dark)');
        } catch {
            return undefined;
        }
        const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
        // Safari < 14 only has the deprecated addListener.
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
        };
    }, []);

    return dark;
}

/**
 * Every keyframe the panel uses, injected once from the panel root rather
 * than per component — three copies of the same `@keyframes` used to ship
 * whenever several spinners were on screen.
 *
 * `prefers-reduced-motion` turns the decorative ones off: a debugging tool
 * should not fight a user who has asked the OS for less movement.
 */
const KEYFRAMES = `
@keyframes ts-dbg-blink {0%,80%,100%{opacity:.25} 40%{opacity:1}}
@keyframes ts-dbg-spin {to{transform:rotate(360deg)}}
@keyframes ts-dbg-in {from{opacity:0;transform:translateY(8px) scale(.98)} to{opacity:1;transform:none}}
@keyframes ts-dbg-rise {from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none}}
@keyframes ts-dbg-pop {from{opacity:0;transform:scale(.9)} to{opacity:1;transform:none}}
@keyframes ts-dbg-expand {from{opacity:0;max-height:0} to{opacity:1;max-height:420px}}
@keyframes ts-dbg-pulse {0%,100%{opacity:1} 50%{opacity:.45}}
@keyframes ts-dbg-sheen {0%{background-position:-180% 0} 100%{background-position:180% 0}}
@media (prefers-reduced-motion: reduce) {
  [data-ts-dbg-anim] { animation: none !important; transition: none !important; }
}
`;

/**
 * Built per palette rather than as a constant, so the same rules serve light
 * and dark. Components read the active set from `ThemeContext` via
 * `useTheme()`, which keeps every `styles.x` call site unchanged.
 */
const makeStyles = (C: Palette): Record<string, React.CSSProperties> => ({
    launcher: {
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: C.surface,
        color: C.text,
        border: `1px solid ${C.border}`,
        boxShadow: C.shadow,
        cursor: 'pointer',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'ts-dbg-pop 260ms cubic-bezier(.2,.8,.2,1)',
        transition: 'transform 140ms ease, box-shadow 140ms ease',
    },
    // Width and height come from the resize state; the panel stays pinned to
    // the bottom-right so a drag from its top-left corner grows it inward.
    panel: {
        position: 'fixed',
        bottom: PANEL_MARGIN,
        right: PANEL_MARGIN,
        background: C.surface,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        fontSize: 13,
        lineHeight: 1.55,
        boxShadow: C.shadow,
        zIndex: 2147483647,
        overflow: 'hidden',
        animation: 'ts-dbg-in 220ms cubic-bezier(.2,.8,.2,1)',
        // Re-assert the inheritable properties a host page may have set on
        // body or on a wrapper, so the panel looks the same on every host.
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing: 'normal',
        textTransform: 'none',
        textAlign: 'left',
        textShadow: 'none',
        whiteSpace: 'normal',
        direction: 'ltr',
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
        background: `linear-gradient(135deg, ${C.borderStrong} 0 2px, transparent 2px)`,
    },
    header: {
        flex: '0 0 auto',
        padding: '11px 12px 11px 14px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: C.surface,
        color: C.text,
    },
    headerTitle: { display: 'flex', alignItems: 'center', gap: 10 },
    headerName: {
        fontWeight: 650, fontSize: 14, letterSpacing: -0.1, color: C.text,
    },
    headerSubtitle: {
        fontSize: 10.5, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 5, marginTop: 1,
    },
    headerTagline: { color: C.textFaint },
    headerDivider: { color: C.textFaint, opacity: 0.7 },
    caret: {
        display: 'inline-block',
        width: 2,
        height: '0.95em',
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        background: C.accent,
        animation: 'ts-dbg-blink 1s step-end infinite',
    },
    statusDot: {
        width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
    },
    headerActions: { display: 'flex', alignItems: 'center', gap: 2 },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        color: C.textMuted,
        cursor: 'pointer',
        fontSize: 14,
        lineHeight: 1,
        padding: '5px 6px',
        borderRadius: 6,
        transition: 'background 120ms ease, color 120ms ease',
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
        padding: '24px 12px',
        color: C.textMuted,
        margin: 'auto',
        animation: 'ts-dbg-rise 300ms cubic-bezier(.2,.8,.2,1)',
    },
    welcomeTitle: {
        color: C.text, fontWeight: 650, fontSize: 15.5, letterSpacing: -0.2, marginTop: 2,
    },
    welcomeBody: { fontSize: 12.5, maxWidth: 270, color: C.textMuted },
    welcomeBtn: {
        marginTop: 2,
        background: 'transparent',
        color: C.textMuted,
        border: 'none',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        fontFamily: FONT,
        fontSize: 11.5,
        transition: 'color 120ms ease',
    },
    starterList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: '100%',
        maxWidth: 290,
        marginTop: 4,
    },
    starterBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        width: '100%',
        boxSizing: 'border-box',
        padding: '9px 11px',
        background: C.surfaceMuted,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        fontFamily: FONT,
        fontSize: 12.5,
        textAlign: 'left',
        transition: 'background 130ms ease, border-color 130ms ease, color 130ms ease, transform 130ms ease',
    },
    starterIcon: { fontSize: 13, flexShrink: 0, lineHeight: 1 },
    starterLabel: {
        flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    starterArrow: { flexShrink: 0, fontSize: 12, opacity: 0.55 },
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
        background: C.accent,
        color: C.onAccent,
        maxWidth: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
    },
    assistantBubble: {
        padding: '9px 12px',
        borderRadius: '14px 14px 14px 3px',
        background: C.surfaceMuted,
        // Explicit, so a dark host page cannot wash out the reply text.
        color: C.text,
        border: `1px solid ${C.border}`,
        maxWidth: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
    },
    inlineCode: {
        background: C.codeHeader,
        // Explicit: a dark host page would otherwise leave this light on light.
        color: C.inlineCodeText,
        border: `1px solid ${C.border}`,
        borderRadius: 3,
        padding: '1px 4px',
        fontFamily: MONO,
        fontSize: '0.92em',
        // A long token (a CSS variable, a selector) must not run off the panel.
        overflowWrap: 'anywhere',
    },
    activityCard: {
        alignSelf: 'stretch',
        background: C.surfaceMuted,
        color: C.textMuted,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 120ms ease, background 120ms ease',
        animation: 'ts-dbg-rise 240ms cubic-bezier(.2,.8,.2,1)',
    },
    // Hover makes the finished card read as a control rather than a caption.
    activityCardHover: {
        background: C.surfaceRaised,
        borderColor: C.borderStrong,
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
        color: C.textMuted,
        // The whole row is the hit target, not just the chevron.
        appearance: 'none',
        margin: 0,
    },
    activityIcon: { color: C.success, fontSize: 11, flexShrink: 0 },
    activityCaption: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: C.text,
        fontWeight: 500,
    },
    activityDuration: {
        color: C.textFaint, fontSize: 10.5, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
    },
    // The visible affordance: accent-coloured, so it reads as interactive.
    activityToggle: {
        marginLeft: 'auto',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        color: C.accent,
        fontSize: 10.5,
        fontWeight: 500,
    },
    activityChevron: {
        fontSize: 10,
        flexShrink: 0,
        display: 'inline-block',
        transition: 'transform 140ms ease',
        lineHeight: 1,
    },
    activitySteps: {
        borderTop: `1px solid ${C.border}`,
        animation: 'ts-dbg-expand 200ms cubic-bezier(.2,.8,.2,1)',
        overflow: 'hidden',
        padding: '6px 10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
    },
    activityStep: {
        display: 'flex',
        gap: 7,
        alignItems: 'flex-start',
        animation: 'ts-dbg-rise 220ms ease both',
    },
    activityStepIcon: {
        color: C.textFaint, fontSize: 10, lineHeight: '16px', flexShrink: 0, width: 10,
    },
    activityStepBody: { minWidth: 0, flex: 1 },
    activityStepTitle: {
        display: 'flex', gap: 8, alignItems: 'baseline', color: C.text, fontSize: 11.5,
    },
    activityStepTime: { color: C.textFaint, fontSize: 10, marginLeft: 'auto', flexShrink: 0 },
    activityStepTool: { fontFamily: MONO, fontSize: 10, color: C.textMuted },
    activityStepArgs: {
        fontFamily: MONO,
        fontSize: 10,
        color: C.textFaint,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    notice: {
        animation: 'ts-dbg-rise 220ms ease',
        alignSelf: 'center', fontSize: 11, color: C.textFaint, padding: '2px 0',
    },
    rule: {
        height: 1, background: C.border, margin: '8px 0',
    },
    link: {
        // Colour and underline stated, so a host page's `a { }` rules cannot
        // restyle these into invisibility the way they did with inline code.
        color: C.accent,
        textDecoration: 'underline',
        overflowWrap: 'anywhere',
    },
    contextTray: {
        flex: '0 0 auto',
        padding: '8px 12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    contextTrayLabel: { fontSize: 10, color: C.textFaint, textTransform: 'uppercase', letterSpacing: 0.3 },
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
        color: C.textMuted,
        cursor: 'pointer',
        fontFamily: FONT,
        fontSize: 10.5,
        padding: '2px 4px',
        borderRadius: 4,
        flexShrink: 0,
    },
    codeBlock: {
        animation: 'ts-dbg-rise 220ms ease',
        margin: '6px 0',
        background: C.codeSurface,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        // Clips the corners only; the `pre` inside owns the horizontal scroll.
        overflow: 'hidden',
        // Without these the block sizes itself to its widest line and pushes
        // the bubble out, so the `pre` never overflows and never scrolls —
        // which is why copy returned lines the panel would not show.
        maxWidth: '100%',
        minWidth: 0,
        // The block is a flex child of the message column.
        flexShrink: 1,
        alignSelf: 'stretch',
    },
    codeBlockHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '3px 6px 3px 10px',
        borderBottom: `1px solid ${C.border}`,
        background: C.codeHeader,
    },
    codeBlockLang: {
        fontFamily: MONO, fontSize: 10, color: C.textMuted, textTransform: 'lowercase',
    },
    // A div, so host `pre`/`code` rules cannot reach it. That means the
    // formatting `pre` gave for free has to be stated here.
    codeBlockPre: {
        display: 'block',
        margin: 0,
        padding: '8px 10px',
        // The scroll container for long lines.
        overflowX: 'auto',
        overflowY: 'hidden',
        fontFamily: MONO,
        fontSize: 11.5,
        lineHeight: 1.5,
        color: C.text,
        background: C.codeSurface,
        // Replaces what `pre` provided: keep newlines and runs of spaces, and
        // do not wrap — long lines scroll instead.
        whiteSpace: 'pre',
        textAlign: 'left',
        textIndent: 0,
        tabSize: 4,
        // Scrolling beats wrapping for code, but a single enormous token must
        // not be able to stretch the panel itself.
        maxWidth: '100%',
        boxSizing: 'border-box',
    },
    elementChip: {
        animation: 'ts-dbg-pop 200ms cubic-bezier(.2,.8,.2,1)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        background: C.accentSoft,
        border: `1px solid ${C.accentBorder}`,
        borderRadius: 8,
        padding: '4px 6px 4px 8px',
        maxWidth: '100%',
        minWidth: 0,
    },
    elementChipIcon: { color: C.accent, flexShrink: 0 },
    elementChipTag: {
        fontFamily: MONO,
        color: C.accent,
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
        color: C.accent,
        background: C.accentSoft,
        borderRadius: 4,
        padding: '1px 4px',
    },
    elementChipRemove: {
        background: 'transparent',
        border: 'none',
        color: C.textMuted,
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
        background: C.surfaceMuted,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '6px 10px',
        fontFamily: MONO,
        fontSize: 11,
        outline: 'none',
    },
    toolBtn: {
        background: C.surfaceMuted,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '5px 10px',
        fontSize: 11.5,
        cursor: 'pointer',
        fontFamily: FONT,
    },
    toolBtnActive: {
        background: C.accent,
        color: C.onAccent,
        border: `1px solid ${C.accent}`,
        borderRadius: 8,
        padding: '5px 10px',
        fontSize: 11.5,
        cursor: 'pointer',
        fontFamily: FONT,
    },
    /**
     * Recording is the one state in the panel worth colouring red: it is
     * ongoing, invisible on the page itself, and capturing data until stopped.
     */
    toolBtnRecording: {
        background: C.danger,
        color: '#ffffff',
        border: `1px solid ${C.danger}`,
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
        background: C.surfaceMuted,
        color: C.text,
        border: `1px solid ${C.border}`,
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
        background: C.accent,
        color: C.onAccent,
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
        background: C.surface,
        color: C.text,
        border: `1px solid ${C.borderStrong}`,
        fontSize: 10,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
