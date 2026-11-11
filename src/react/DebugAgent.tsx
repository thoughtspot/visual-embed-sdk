import React, {
    useEffect, useRef, useState,
} from 'react';
import { getEmbedConfig } from '../embed/embedConfig';
import { installRadianceRenderer } from './radiance-renderer';

/**
 * Floating chat-style debugging assistant, in the shape of a modern AI
 * assistant panel (à la Claude/ChatGPT/a docs bot) rather than a raw DevTools
 * inspector. Renders only when `init()` was called with
 * `enableDebugAgent: true` — host apps can unconditionally mount
 * `<DebugAgent />` and it no-ops otherwise, matching how the flag itself
 * works.
 *
 * Talks to the embed-assistant agent backend (`POST {agentApiUrl}/agent/embed-assistant`,
 * SSE-streamed). "Pick element" is one control covering both surfaces, since
 * which side of the iframe boundary an element sits on is the panel's problem
 * to solve, not the developer's:
 *
 * - On the host page it highlights locally and the click attaches a
 *   computed-style snapshot as chat context. No extension needed, since this
 *   is all same-origin DOM.
 * - Clicking the embed hands off to the extension, which picks inside the
 *   ThoughtSpot iframe — unreadable from the host page, being a separate
 *   origin. It calls `start_element_picker` over `chrome.debugger` (CDP),
 *   injecting a picker into the iframe's own frame; the highlight is drawn in
 *   there so it tracks the cursor at native speed, where routing each
 *   mousemove over the relay could not. Without an extension session that
 *   handoff is impossible, and the click reports that instead.
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
    /**
     * Distance in pixels from the top of the viewport to the top of the
     * pane, so it can sit under a fixed app header instead of over it.
     * @default 0
     */
    topOffset?: number;
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

/**
 * Copy control that confirms in place, used on code blocks and under a reply.
 * An icon-only 24px button, as in the Operator pane; the result ("Copied")
 * appears beside the icon for a moment rather than in a toast.
 */
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
            data-ts-dbg-ghost
            onClick={async () => setState((await copyText(text)) ? 'copied' : 'failed')}
            style={{ ...styles.iconAct, ...overrideStyle }}
            title="Copy to clipboard"
            aria-label={label ? `Copy ${label}` : 'Copy'}
        >
            <Icon name={state === 'copied' ? 'check' : 'copy'} size={14} />
            {state !== 'idle' ? (
                <span style={styles.copyNote}>{state === 'copied' ? 'Copied' : 'Copy failed'}</span>
            ) : null}
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

/** Code longer than this folds behind a chevron, as in the Operator pane. */
const CODE_FOLD_LINES = 8;

/**
 * Renders the block with `div`s rather than `pre`/`code`.
 *
 * A host page styling `code, pre { background: #161b22 !important }` — normal
 * in a dark theme — beats any inline style React can emit, which left syntax
 * tokens on a near-black background inside an otherwise light panel. Nothing
 * here depends on `pre` semantics: `whiteSpace: 'pre'` preserves the
 * formatting, and the tag itself was the only thing host CSS could target.
 *
 * Shaped like the Operator pane's code block: a sunken well with a
 * "ts · 3 lines" header, copy and, past eight lines, a fold toggle.
 */
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
    const { c, styles } = useTheme();
    const lineCount = code.split('\n').length;
    const foldable = lineCount > CODE_FOLD_LINES;
    const [folded, setFolded] = useState(true);
    return (
        <div style={styles.codeBlock}>
            <div style={styles.codeBlockHeader}>
                <span style={styles.codeBlockIco}><Icon name="code" size={14} /></span>
                <span style={styles.codeBlockLang}>
                    <span>{language || 'code'}</span>
                    {` · ${lineCount} line${lineCount === 1 ? '' : 's'}`}
                </span>
                <span style={styles.codeActs}>
                    <CopyButton text={code} label="code" style={styles.codeAct} />
                    {foldable ? (
                        <button
                            type="button"
                            data-ts-dbg-ghost
                            onClick={() => setFolded((f) => !f)}
                            aria-label={folded ? 'Expand code' : 'Collapse code'}
                            title={folded ? 'Show all of it' : 'Fold it'}
                            style={{ ...styles.iconAct, ...styles.codeAct }}
                        >
                            <Icon
                                name="chevron"
                                size={16}
                                style={{ transform: folded ? 'rotate(-90deg)' : 'none' }}
                            />
                        </button>
                    ) : null}
                </span>
            </div>
            <div style={{ ...styles.codeBlockPre, ...(foldable && folded ? styles.codeBlockFolded : null) }}>
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

/** Pane width, as in the Operator design: 400 by default, 300–680 by drag. */
const PANEL_WIDTH = 400;
const PANEL_MIN_WIDTH = 300;
const PANEL_MAX_WIDTH = 680;
/** How long the pane takes to slide in and out. */
const SLIDE_MS = 340;
/** How long after a turn settles the background wash starts to leave. */
const WASH_GONE_DELAY_MS = 530;
/** The prompt grows with its text up to this height, then scrolls. */
const PROMPT_MAX_HEIGHT = 184;
const SESSION_STORAGE_KEY = 'ts-debug-agent-extension-session-id';
const WIDTH_STORAGE_KEY = 'ts-debug-agent-pane-width';

/** Widest the pane can be: its maximum, or the viewport, whichever is less. */
const maxPanelWidth = () => Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, window.innerWidth));

/**
 * The pane is docked to the right edge at full height, so only its width is
 * adjustable: dragging the inner (left) edge resizes it, and the result is
 * remembered per origin.
 */
function readStoredWidth(): number | null {
    try {
        const raw = window.localStorage.getItem(WIDTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function storeWidth(width: number): void {
    try {
        window.localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
    } catch {
        // Ignore — the width just will not persist across reloads.
    }
}

/** Keeps a stored or dragged width inside what the current viewport allows. */
function clampWidth(width: number): number {
    return Math.min(Math.max(width, PANEL_MIN_WIDTH), maxPanelWidth());
}

/**
 * Whether the OS asks for less motion. The pane then skips its slide, the
 * prompt's wiggle and the background drift. Guarded like `osPrefersDark`.
 */
function prefersReducedMotion(): boolean {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
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
    topOffset = 0,
}) => {
    const enabled = !!getEmbedConfig()?.enableDebugAgent;
    const hostDark = useHostDark();
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
    // Drives the composer's focus ring: the whole surface reacts, not just
    // the textarea inside it.
    const [composerFocused, setComposerFocused] = useState(false);
    const recordingTabRef = useRef<number | undefined>(undefined);
    const [hovered, setHovered] = useState<Element | null>(null);
    const [sessionInput, setSessionInput] = useState(() => extensionSessionId ?? readStoredSessionId());
    const [showSessionField, setShowSessionField] = useState(false);
    // 400px by default; a remembered drag wins over it.
    const [width, setWidth] = useState<number>(() => clampWidth(readStoredWidth() ?? PANEL_WIDTH));
    const [resizing, setResizing] = useState(false);
    // Set while the pane slides out, so it can animate before it unmounts.
    const [closing, setClosing] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    // An empty send shakes the prompt instead of sending.
    const [wiggle, setWiggle] = useState(false);
    /**
     * The Radiance background's state: `idle` while waiting for a prompt,
     * `working` while the agent reads, writes or waits, and `gone` once an
     * answer has settled — the wash lifts away until a new chat starts.
     */
    const [wash, setWash] = useState<'idle' | 'working' | 'gone'>('idle');
    // Whether the canvas renderer runs; without it the static artwork shows.
    const [rendererOn, setRendererOn] = useState(false);

    // The prop wins when given; otherwise whatever was pasted into the panel.
    const activeSessionId = (extensionSessionId ?? sessionInput).trim() || undefined;

    const historyRef = useRef<Array<{ role: Role; content: string }>>([]);
    const messagesRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
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

    // A window the pane no longer fits in has to pull it back in.
    useEffect(() => {
        const onResize = () => setWidth((prev) => clampWidth(prev));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // The Radiance renderer starts with the pane, not with the import.
    useEffect(() => {
        if (!open) return;
        installRadianceRenderer();
        setRendererOn(!!(window as any).RadianceLanguageRenderer);
    }, [open]);

    /**
     * Drives the background: `working` for the whole turn, then `gone` a beat
     * after the answer settles. With nothing in the transcript (a new chat)
     * the wash comes back.
     */
    const transcriptStarted = items.some((it) => !isElement(it));
    useEffect(() => {
        if (busy) {
            setWash('working');
            return undefined;
        }
        if (!transcriptStarted) {
            setWash('idle');
            return undefined;
        }
        const id = window.setTimeout(() => setWash('gone'), WASH_GONE_DELAY_MS);
        return () => window.clearTimeout(id);
    }, [busy, transcriptStarted]);

    // The renderer reads its attributes every frame; refresh registers a
    // freshly mounted surface straight away.
    useEffect(() => {
        (window as any).RadianceLanguageRenderer?.refresh?.();
    }, [open, wash, hostDark]);

    // The prompt grows with its text up to 184px, then scrolls.
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, PROMPT_MAX_HEIGHT)}px`;
    }, [input, open]);

    // The chat menu closes on a click outside it or on Escape.
    useEffect(() => {
        if (!menuOpen) return undefined;
        const onDown = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [menuOpen]);

    /** Slides the pane out, then unmounts it; the conversation is kept. */
    const closePane = () => {
        setMenuOpen(false);
        if (prefersReducedMotion()) {
            setOpen(false);
            return;
        }
        setClosing(true);
        window.setTimeout(() => {
            setClosing(false);
            setOpen(false);
        }, SLIDE_MS);
    };

    /**
     * Resizes from the inner (left) edge: the pane is docked right, so
     * dragging left grows it. The listeners live on the document for the
     * duration of the drag, so the pointer leaving the handle does not strand
     * it mid-resize.
     */
    const startResize = (e: React.MouseEvent) => {
        e.preventDefault();
        const originX = e.clientX;
        const startWidth = width;
        // Without this a drag selects the page text it passes over.
        const prevUserSelect = document.body.style.userSelect;
        setResizing(true);

        const onMove = (ev: MouseEvent) => setWidth(clampWidth(startWidth + (originX - ev.clientX)));
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.userSelect = prevUserSelect;
            setResizing(false);
            setWidth((final) => {
                storeWidth(final);
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
            // The other half of this control is still armed inside the embed;
            // the developer has made their choice on this side.
            if (pickingEmbed) void cancelEmbedPicker();

            // The iframe element itself is pickable here, but nothing inside
            // it is: that is a separate origin. When the extension is
            // connected its own picker is already armed inside the frame and
            // will handle clicks in there, so reaching this branch means the
            // click landed on the frame's own box (its border or a gap) —
            // worth saying, rather than attaching a snapshot of an empty box.
            if (target.tagName === 'IFRAME') {
                setItems((prev) => [...prev, {
                    id: nextId(),
                    kind: 'notice',
                    content: activeSessionId
                        ? 'That is the embed’s frame. Click inside it to pick the element you mean.'
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
            // Escape inside the embed is handled by the injected picker
            // itself; this covers Escape pressed on the host page.
            if (pickingEmbed) void cancelEmbedPicker();
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
    }, [picking, activeSessionId, pickingEmbed]);

    // Before the early return, so the hook order never changes with `enabled`.
    const theme = React.useMemo<Theme>(() => {
        const c = hostDark ? DARK : LIGHT;
        return { c, styles: makeStyles(c) };
    }, [hostDark]);
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
        if (busy) return;
        if (!text) {
            // Answered with a shake rather than silently ignored.
            if (!prefersReducedMotion()) setWiggle(true);
            return;
        }
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
     * The one picker control, covering the host page and the embed at once.
     *
     * A click on a cross-origin iframe is delivered to that iframe's own
     * document and never surfaces in this one, so the host page cannot detect
     * a click on the embed and hand off to the extension after the fact. Both
     * pickers are therefore armed together: the local one for host markup, and
     * the extension's in-iframe one for anything inside the embed. Whichever
     * side the developer clicks resolves first, and disarms the other.
     */
    function togglePicking() {
        if (picking || pickingEmbed) {
            setPicking(false);
            setHovered(null);
            if (pickingEmbed) void cancelEmbedPicker();
            return;
        }
        setPicking(true);
        if (activeSessionId) void pickInsideEmbed();
    }

    /**
     * Tears down the picker running inside the embed, for when the developer
     * picked on the host page instead or disarmed the control. Without this
     * the in-iframe overlay stays up, swallowing the app's own clicks until
     * it times out.
     */
    async function cancelEmbedPicker() {
        if (!activeSessionId) return;
        try {
            const { tabId, frameSessionId } = await findEmbedFrame(agentApiUrl, activeSessionId);
            await callExtensionTool(agentApiUrl, activeSessionId, 'evaluate_script', {
                tabId,
                frameSessionId,
                expression: '(() => { if (window.__tsPickerCleanup) window.__tsPickerCleanup(); })()',
            });
        } catch {
            // Best effort: the picker times out on its own, and failing to
            // cancel it must not break the pick that just succeeded.
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
        // Whatever this returns — a pick, a cancel, a timeout — the gesture is
        // over on both sides, so the host picker comes down with it.
        const disarmHost = () => {
            setPicking(false);
            setHovered(null);
        };
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
            disarmHost();
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

    // A conversation has started: the transcript holds more than attachments.
    const hasConversation = transcriptStarted;
    // The opener before any step arrives. Once a step is in, the live
    // reasoning block says "Working" itself, so this would only repeat it.
    const showWorking = busy
        && !items.some((it) => isActivity(it) && !it.done)
        && !items.some((it) => isMessage(it) && it.id === streamingIdRef.current);
    const prominentWash = wash === 'working';

    return (
        <ThemeContext.Provider value={theme}>
            {/* One stylesheet for the whole pane: keyframes, plus the few
                states inline styles cannot express (hover, placeholder). */}
            <style>{paneSheet(c)}</style>
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
                    title={`Open ${PRODUCT_NAME}`}
                    data-ts-dbg-fab
                    data-ts-dbg-anim
                    style={styles.launcher}
                >
                    <Icon name="spark" size={28} />
                </button>
            ) : (
                <aside
                    ref={panelRef}
                    data-ts-dbg-pane
                    data-ts-dbg-anim
                    aria-label={PRODUCT_NAME}
                    style={{
                        ...styles.panel,
                        top: topOffset,
                        width,
                        transform: closing ? 'translateX(100%)' : undefined,
                        // A live drag must not animate, or it lags.
                        transition: resizing ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(.2,.8,.2,1)`,
                    }}
                >
                    {/* The Radiance glow: the Home pages' renderer, drawn
                        behind everything and steered by the agent's state. */}
                    <div
                        aria-hidden
                        data-ts-dbg-anim
                        style={{
                            ...(rendererOn ? styles.radiance : styles.radianceStatic),
                            ...(wash === 'gone' ? styles.radianceGone : null),
                        }}
                    >
                        <div
                            className="radiance-local"
                            data-radiance-appearance={hostDark ? 'dark' : 'light'}
                            data-radiance-layout="top-wash"
                            data-radiance-variant={prominentWash ? 'dynamic-prominent' : 'dynamic-subtle'}
                            data-radiance-intensity={prominentWash ? 'prominent' : 'subtle'}
                            data-radiance-dark-glow={prominentWash ? 'prominent' : 'subtle'}
                            data-radiance-speed={prominentWash
                                ? (hostDark ? '1.58' : '1.72')
                                : (hostDark ? '1.72' : '1.86')}
                            style={styles.radianceLocal}
                        />
                    </div>

                    <div
                        onMouseDown={startResize}
                        style={styles.resizeHandle}
                        title="Drag to resize"
                        aria-hidden
                    />

                    <header style={styles.header}>
                        <div ref={menuRef} style={styles.headerMenuHost}>
                            <button
                                type="button"
                                onClick={() => setMenuOpen((m) => !m)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                title="Chat menu"
                                style={styles.headerTitleBtn}
                            >
                                <span>{PRODUCT_NAME}</span>
                                <span
                                    style={{
                                        ...styles.headerChevron,
                                        ...(menuOpen ? { background: c.ghostHover } : null),
                                    }}
                                >
                                    <Icon name="chevron" size={16} />
                                </span>
                            </button>
                            {menuOpen ? (
                                <div role="menu" data-ts-dbg-anim style={styles.menu}>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        data-ts-dbg-ghost
                                        onClick={() => {
                                            setMenuOpen(false);
                                            resetConversation();
                                        }}
                                        disabled={!items.length && !busy}
                                        style={{
                                            ...styles.menuItem,
                                            ...(!items.length && !busy
                                                ? { opacity: 0.5, cursor: 'not-allowed' }
                                                : null),
                                        }}
                                    >
                                        <Icon name="newChat" size={16} />
                                        <span>New chat</span>
                                    </button>
                                </div>
                            ) : null}
                        </div>
                        <span style={styles.grow} />
                        {/* Screen readers still hear the agent's state, which
                            the header no longer prints. */}
                        <span aria-live="polite" style={styles.srOnly}>{busy ? 'Working' : 'Ready'}</span>
                        <button
                            type="button"
                            data-ts-dbg-ghost
                            onClick={closePane}
                            aria-label="Collapse"
                            title="Collapse"
                            style={styles.iconBtn}
                        >
                            <Icon name="collapse" size={16} />
                        </button>
                    </header>

                    <div ref={messagesRef} data-ts-dbg-scroll style={styles.messages}>
                        {/* Picked elements live in the tray above the input,
                            not the transcript, so attaching one must not count
                            as a conversation and hide the openers. */}
                        {!hasConversation ? (
                            <WelcomeState
                                onPrompt={(text) => {
                                    // Fills the prompt rather than sending, so
                                    // it can be edited first.
                                    setInput(text);
                                    textareaRef.current?.focus();
                                }}
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
                            const streaming = busy && msg.id === streamingIdRef.current;
                            if (msg.role === 'user') {
                                return (
                                    <div key={msg.id} style={styles.userRow}>
                                        <div style={styles.userBubble}>{renderContent(msg.content, styles)}</div>
                                    </div>
                                );
                            }
                            return (
                                <div key={msg.id} style={styles.assistantRow}>
                                    <div style={styles.agentMsg}>
                                        {renderContent(msg.content, styles)}
                                        {/* Live caret: the answer is still arriving. */}
                                        {streaming ? <span data-ts-dbg-anim style={styles.caret} /> : null}
                                    </div>
                                    {/* Only a settled reply gets a copy button: copying a
                                        half-streamed answer hands over a truncated one. */}
                                    {!streaming ? (
                                        <div style={styles.fb}>
                                            <CopyButton text={msg.content} label="response" style={styles.fbBtn} />
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                        {showWorking ? (
                            <div style={styles.work}>
                                <span className="ts-dbg-shimmer" style={styles.workTrig}>Working</span>
                            </div>
                        ) : null}
                    </div>

                    <div style={{ ...styles.dock, background: hasConversation ? c.surface : 'transparent' }}>
                        {/* One prompt box: the attached context, the input and
                            every control live inside a single bordered surface. */}
                        <form
                            onSubmit={sendMessage}
                            onAnimationEnd={() => setWiggle(false)}
                            style={{
                                ...styles.prompt,
                                ...(composerFocused ? styles.promptFocused : null),
                                ...(wiggle ? styles.promptWiggle : null),
                            }}
                        >
                            {pickedElements.length ? (
                                <div style={styles.contextTray}>
                                    {pickedElements.map((el) => (
                                        <ElementChip key={el.id} item={el} onRemove={() => removeContext(el.id)} />
                                    ))}
                                </div>
                            ) : null}

                            {showSessionField && !extensionSessionId ? (
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
                            ) : null}

                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onFocus={() => setComposerFocused(true)}
                                onBlur={() => setComposerFocused(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e);
                                    }
                                }}
                                rows={1}
                                placeholder={PROMPT_PLACEHOLDER}
                                style={styles.textarea}
                            />

                            {/* Tools on the left, send on the right. */}
                            <div style={styles.composerActions}>
                                <div style={styles.composerTools}>
                                    <IconButton
                                        onClick={togglePicking}
                                        active={picking || pickingEmbed}
                                        icon="target"
                                        label={picking || pickingEmbed ? 'Picking…' : 'Pick'}
                                        title={activeSessionId
                                            ? 'Pick an element to attach as context — on the host page or inside the ThoughtSpot embed'
                                            : 'Pick an element on the host page to attach as context'}
                                    />
                                    {activeSessionId ? (
                                        <IconButton
                                            onClick={toggleRecording}
                                            disabled={recordingBusy}
                                            danger={recording}
                                            icon={recording ? 'stopSquare' : 'record'}
                                            label={recording
                                                ? (recordingBusy ? 'Stopping…' : 'Stop & analyse')
                                                : (recordingBusy ? 'Starting…' : 'Record')}
                                            title={recording
                                                ? 'Stop recording and have the agent analyse what was captured'
                                                : 'Record console, network and your actions while you reproduce a problem'}
                                        />
                                    ) : null}
                                    {!extensionSessionId ? (
                                        <IconButton
                                            onClick={() => setShowSessionField((f) => !f)}
                                            active={showSessionField}
                                            icon={activeSessionId ? 'link' : 'plug'}
                                            label={activeSessionId ? 'Extension' : 'Connect'}
                                            title={activeSessionId
                                                ? 'Browser extension connected — click to change or clear the session id'
                                                : 'Paste the session id from the extension popup to inspect inside the embed'}
                                        />
                                    ) : null}
                                </div>

                                {busy ? (
                                    <button
                                        type="button"
                                        data-ts-dbg-send
                                        onClick={stopStreaming}
                                        aria-label="Stop"
                                        title="Stop the agent"
                                        style={styles.sendBtn}
                                    >
                                        <span style={styles.stopGlyph} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        data-ts-dbg-send
                                        aria-label="Send"
                                        title="Send (Enter)"
                                        // Never disabled: an empty send wiggles
                                        // the prompt, so the click is answered.
                                        style={{ ...styles.sendBtn, ...(input.trim() ? null : styles.sendBtnIdle) }}
                                    >
                                        <Icon name="send" size={16} />
                                    </button>
                                )}
                            </div>
                        </form>
                        <p style={styles.disclaimer}>{`${PRODUCT_NAME} responses should be reviewed.`}</p>
                    </div>
                </aside>
            )}
        </ThemeContext.Provider>
    );
};

/**
 * Inline SVG icons, replacing the unicode glyphs (`⌖ ⏺ ⚭ ↑ ✕ ↻`) the panel
 * used to draw with. Those render at wildly different weights and baselines
 * across platforms — several are emoji-presentation on Windows — which is
 * what made the controls look unfinished. These inherit `currentColor`, so a
 * button's hover and active states colour its icon for free.
 */
type IconName = 'target' | 'record' | 'stopSquare' | 'link' | 'plug' | 'send'
| 'close' | 'chevron' | 'copy' | 'check' | 'warn' | 'spark' | 'collapse'
| 'newChat' | 'search' | 'memory' | 'terminal' | 'code';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
    // A crosshair: picking an element on the page.
    target: (
        <>
            <circle cx="8" cy="8" r="4.2" />
            <path d="M8 .9v2.6M8 12.5v2.6M.9 8h2.6M12.5 8h2.6" />
        </>
    ),
    record: <circle cx="8" cy="8" r="4.2" fill="currentColor" stroke="none" />,
    stopSquare: <rect x="4.2" y="4.2" width="7.6" height="7.6" rx="1.4" fill="currentColor" stroke="none" />,
    link: <path d="M6.4 9.6a2.6 2.6 0 0 1 0-3.7l1.8-1.8a2.6 2.6 0 0 1 3.7 3.7l-.9.9M9.6 6.4a2.6 2.6 0 0 1 0 3.7l-1.8 1.8a2.6 2.6 0 0 1-3.7-3.7l.9-.9" />,
    plug: <path d="M6 2.2v3.4M10 2.2v3.4M4.4 5.6h7.2v2.2a3.6 3.6 0 0 1-3.6 3.6A3.6 3.6 0 0 1 4.4 7.8zM8 11.4v2.4" />,
    send: <path d="M8 13.2V3.4M3.9 7.5 8 3.2l4.1 4.3" />,
    close: <path d="M4.3 4.3l7.4 7.4M11.7 4.3l-7.4 7.4" />,
    chevron: <path d="M4.2 6.4 8 10.1l3.8-3.7" />,
    copy: (
        <>
            <rect x="5.6" y="5.6" width="7.2" height="7.2" rx="1.6" />
            <path d="M10.4 5.6V4.8a1.6 1.6 0 0 0-1.6-1.6H4.8a1.6 1.6 0 0 0-1.6 1.6v4a1.6 1.6 0 0 0 1.6 1.6h.8" />
        </>
    ),
    check: <path d="M3.4 8.4l3.1 3.1 6.1-6.6" />,
    warn: <path d="M8 3.1 14 13H2zM8 6.9v2.6M8 11.1v.1" />,
    spark: <path d="M8 2.2l1.5 4.3L13.8 8l-4.3 1.5L8 13.8l-1.5-4.3L2.2 8l4.3-1.5z" fill="currentColor" stroke="none" />,
    // » — collapses the pane to the right.
    collapse: <path d="M3.6 4.4 7.2 8l-3.6 3.6M8.8 4.4 12.4 8l-3.6 3.6" />,
    newChat: <path d="M13 8.8V12a1.4 1.4 0 0 1-1.4 1.4H4A1.4 1.4 0 0 1 2.6 12V4.4A1.4 1.4 0 0 1 4 3h3.2M11.4 2.2l2.4 2.4-5.4 5.4H6V7.6z" />,
    // The three reasoning-step kinds in the Operator pane.
    search: (
        <>
            <circle cx="7" cy="7" r="4.2" />
            <path d="m10.2 10.2 3.4 3.4" />
        </>
    ),
    memory: (
        <>
            <rect x="3.2" y="2.4" width="9.6" height="11.2" rx="1.6" />
            <path d="M5.8 5.6h4.4M5.8 8h4.4M5.8 10.4h2.6" />
        </>
    ),
    terminal: (
        <>
            <rect x="1.8" y="3" width="12.4" height="10" rx="1.6" />
            <path d="m4.6 6.4 2 1.6-2 1.6M8.4 9.8h3" />
        </>
    ),
    code: <path d="M5.6 4.6 2.4 8l3.2 3.4M10.4 4.6 13.6 8l-3.2 3.4" />,
};

const Icon: React.FC<{ name: IconName; size?: number; style?: React.CSSProperties }> = ({
    name, size = 14, style: extra,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        focusable="false"
        style={{ flexShrink: 0, display: 'block', ...extra }}
    >
        {ICON_PATHS[name]}
    </svg>
);

/**
 * A prompt-box tool: a 32px round icon button, like the Operator pane's "+".
 * The label is its accessible name and tooltip rather than visible text, so
 * the prompt keeps the design's single row of round controls.
 */
const IconButton: React.FC<{
    onClick: () => void;
    icon: IconName;
    label: string;
    title: string;
    active?: boolean;
    danger?: boolean;
    disabled?: boolean;
}> = ({
    onClick, icon, label, title, active, danger, disabled,
}) => {
    const { styles } = useTheme();
    return (
        <button
            type="button"
            data-ts-dbg-ghost
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active || danger ? true : undefined}
            title={title}
            style={{
                ...styles.toolBtn,
                ...(active ? styles.toolBtnActive : null),
                ...(danger ? styles.toolBtnDanger : null),
                ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : null),
            }}
        >
            <Icon name={icon} size={16} />
        </button>
    );
};

/**
 * Openers offered on the empty state. Each is a question the agent handles
 * well with the tools it has, so a first-time user gets a useful answer
 * instead of having to guess what the pane can do. Clicking one fills the
 * prompt with it; it is sent like any other message.
 */
const STARTER_PROMPTS: string[] = [
    'Check the console and network for errors in this embed and tell me what is wrong.',
    'Give me the customCSS variables to make this embed match my host page theme.',
    'How do I hide a specific action from the embed menus?',
];

/** "Good morning!" and so on, by the viewer's local time. */
function greetingFor(hour: number): string {
    if (hour < 12) return 'Good morning!';
    if (hour < 18) return 'Good afternoon!';
    return 'Good evening!';
}

/**
 * The empty state: a two-line greeting, the verb phrase in the accent purple,
 * over a stack of starter prompts — the Operator pane's welcome state.
 */
const WelcomeState: React.FC<{ onPrompt: (text: string) => void }> = ({ onPrompt }) => {
    const { styles } = useTheme();
    return (
        <section data-ts-dbg-anim style={styles.welcome}>
            <div style={styles.greet}>
                <p style={styles.greetLine}>{greetingFor(new Date().getHours())}</p>
                <p style={styles.greetLine}>
                    {'What do we '}
                    <span style={styles.greetAccent}>debug today?</span>
                </p>
            </div>
            <div style={styles.starterList}>
                {STARTER_PROMPTS.map((text) => (
                    <button
                        key={text}
                        type="button"
                        data-ts-dbg-chip
                        onClick={() => onPrompt(text)}
                        style={styles.starterBtn}
                    >
                        {text}
                    </button>
                ))}
            </div>
        </section>
    );
};

/** Picks the rail icon for a step: Search, Memory, or Code/console. */
function stepIcon(toolName: string): IconName {
    const name = baseToolName(toolName);
    if (/doc|search|reference/i.test(name)) return 'search';
    if (/memory/i.test(name)) return 'memory';
    return 'terminal';
}

/**
 * One turn's tool calls, as the Operator pane's reasoning block.
 *
 * While the turn runs, the header reads a shimmering "Working" and the steps
 * are listed under it, each captioned in end-user language ("Reading the
 * browser console…"), never by tool name. When the turn ends the block folds
 * to "Show work". Opening it again lists the steps with each one's real tool
 * name, arguments and duration — the detail a developer needs when the plain
 * caption is not enough.
 */
const ActivityCard: React.FC<{ group: ActivityGroup }> = ({ group }) => {
    const { styles } = useTheme();
    // null follows the turn: open while it runs, folded once it is done.
    const [userOpen, setUserOpen] = useState<boolean | null>(null);
    const live = !group.done;
    const open = userOpen ?? live;
    // Tool names only once the developer has asked for the detail.
    const detailed = userOpen === true;
    const failed = group.steps.some((s) => s.status === 'failed');

    return (
        <div data-ts-dbg-anim style={styles.work}>
            <button
                type="button"
                data-ts-dbg-trig
                onClick={() => setUserOpen(!open)}
                aria-expanded={open}
                title={open ? 'Hide the steps taken' : 'Show the steps taken'}
                style={styles.workTrig}
            >
                {live ? <span className="ts-dbg-shimmer">Working</span> : <span>Show work</span>}
                {failed && !live ? <span style={styles.workFailed}>{'· a step failed'}</span> : null}
                <Icon
                    name="chevron"
                    size={12}
                    style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 200ms ease' }}
                />
            </button>
            {open ? (
                <div style={styles.steps}>
                    {group.steps.map((step, idx) => (
                        <StepRow
                            key={step.id}
                            step={step}
                            last={idx === group.steps.length - 1}
                            detailed={detailed}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
};

/**
 * A reasoning step: a 20px rail (icon over a 1px line to the next step) and
 * the caption. Detailed, it adds a tool card with the raw tool name and input.
 */
const StepRow: React.FC<{ step: ActivityStep; last: boolean; detailed: boolean }> = ({
    step, last, detailed,
}) => {
    const { c, styles } = useTheme();
    const running = step.status === 'running';
    const failed = step.status === 'failed';
    return (
        <div data-ts-dbg-anim style={styles.step}>
            <div style={{ ...styles.stepRail, color: failed ? c.danger : c.textMuted }}>
                <span style={styles.stepIco}>
                    <Icon name={failed ? 'warn' : stepIcon(step.toolName)} size={14} />
                </span>
                {!last ? <span style={styles.stepLine} /> : null}
            </div>
            <div style={styles.stepBody}>
                <div style={{ ...styles.stepHead, color: running ? c.textFaint : c.text }}>
                    <span style={styles.stepLabel}>{running ? `${step.label}…` : step.label}</span>
                    {step.durationMs !== undefined ? (
                        <span style={styles.stepTime}>{formatDuration(step.durationMs)}</span>
                    ) : null}
                </div>
                {detailed ? (
                    <div style={styles.toolCard}>
                        <div style={styles.toolSec}>
                            <span style={styles.toolLbl}>Tool</span>
                            <div style={styles.toolWell}>{step.toolName}</div>
                        </div>
                        {step.args ? (
                            <div style={styles.toolSec}>
                                <span style={styles.toolLbl}>Input</span>
                                <div style={styles.toolWell}>{step.args}</div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

/**
 * One attached element, shown above the input as a file card: a 38px tile,
 * the selector, and where it was picked. The selector is clipped rather than
 * wrapped, and the remove badge appears on hover or focus.
 */
const ElementChip: React.FC<{ item: PickedElementContext; onRemove: () => void }> = ({ item, onRemove }) => {
    const { styles } = useTheme();
    const size = item.styles.width && item.styles.height
        ? `${item.styles.width} × ${item.styles.height}`
        : '';
    const where = item.inEmbed ? 'In the embed' : 'On the page';
    return (
        <div
            data-ts-dbg-file
            style={styles.elementChip}
            title={`${item.selector}${size ? ` — ${size}` : ''}${item.inEmbed ? ' (inside the embed)' : ''}`}
        >
            <span style={styles.elementChipTile}><Icon name="target" size={18} /></span>
            <span style={styles.elementChipText}>
                <span style={styles.elementChipTag}>{item.selector}</span>
                <span style={styles.elementChipMeta}>{size ? `${where} · ${size}` : where}</span>
            </span>
            <button
                type="button"
                data-ts-dbg-file-x
                onClick={onRemove}
                aria-label={`Remove ${item.selector}`}
                style={styles.elementChipRemove}
            >
                <Icon name="close" size={8} />
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
                {iframeInspectable ? ' · click to pick inside the embed' : ''}
            </div>
        </div>
    );
};

const FONT = '"Geist", "Helvetica Neue", Inter, Helvetica, Arial, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

/** The pane's display name, shown in the header and the launcher label. */
const PRODUCT_NAME = 'ThoughtSpot Operator';
const PROMPT_PLACEHOLDER = 'Ask, learn, debug…';

/**
 * The active palette and its built style set. A context rather than props so
 * the `styles.x` references in the subcomponents stay short; the default is
 * the light set, which is also what a subcomponent rendered outside the pane
 * (in a test, say) gets.
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
 * The Operator pane's tokens (Radiant 3.0), light and dark.
 *
 * The pane renders inside the host page's DOM, so the host's own CSS cascades
 * into it: a dark-theme host sets `color` on descendants and backgrounds on
 * `pre`/`code`, which previously left inline code as unreadable light-on-light
 * boxes and put light syntax tokens on a dark block.
 *
 * So every surface states BOTH its background and its text colour — never one
 * without the other, and never relying on inheritance.
 */
interface Palette {
    /** Background/Base: the pane. */
    surface: string;
    /** Background/Raised: the prompt box, menus. */
    raised: string;
    /** Background/Sunken: code wells. */
    sunken: string;
    /** Background/On Base: starter prompts, the user's message. */
    onBase: string;
    /** Background/Secondary action: file tiles. */
    secondaryAction: string;
    /** Background/Ghost hover: icon buttons and menu rows. */
    ghostHover: string;
    chipHover: string;
    chipHoverBorder: string;
    /** Border/Subtle. */
    border: string;
    /** Border/Bold. */
    borderBold: string;
    /** Content/Primary. */
    text: string;
    /** Content/Secondary. */
    textMuted: string;
    /** Content/Tertiary. */
    textFaint: string;
    /** Content/Brand · Background/Brand. */
    brand: string;
    brandHover: string;
    onBrand: string;
    /** Content/Accent/Purple: the verb phrase in the greeting. */
    accent: string;
    inlineCodeText: string;
    success: string;
    warning: string;
    /** Content/Failure: recording and failed steps — the only red in the pane. */
    danger: string;
    /** Background/Failure. */
    dangerSoft: string;
    /** Elevation/Modal: the pane. */
    shadow: string;
    promptShadow: string;
    promptFocusShadow: string;
    menuShadow: string;
    /** Syntax-token colours, tuned per theme for contrast on `sunken`. */
    token: Record<Exclude<TokenType, 'plain'>, string>;
}

const LIGHT: Palette = {
    surface: '#ffffff',
    raised: '#ffffff',
    sunken: '#f5f7fc',
    onBase: '#f6f8fa',
    secondaryAction: '#eef1f8',
    ghostHover: 'rgba(192, 198, 207, 0.16)',
    chipHover: '#eef2f8',
    chipHoverBorder: '#dde2e8',
    border: '#eaedf2',
    borderBold: '#d2d7e6',
    text: '#1d232f',
    textMuted: '#777e8b',
    textFaint: '#a5acb9',
    brand: '#2770ef',
    brandHover: '#1e5fd0',
    onBrand: '#ffffff',
    accent: '#8c62f5',
    inlineCodeText: '#1d232f',
    success: '#1e8a4c',
    warning: '#9a6700',
    danger: '#e22b3d',
    dangerSoft: '#ffebec',
    shadow: '0 24px 32px rgba(25, 35, 49, 0.16), 0 0 4px rgba(25, 35, 49, 0.10)',
    promptShadow: '0 2px 4px rgba(25, 35, 49, 0.04), 0 0 4px rgba(25, 35, 49, 0.10)',
    promptFocusShadow: '0 3px 12px rgba(4, 101, 237, 0.12), 0 4px 24px rgba(56, 125, 222, 0.12)',
    menuShadow: '0 12px 24px rgba(25, 35, 49, 0.12), 0 0 4px rgba(25, 35, 49, 0.08)',
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

/** Dark palette: the Operator pane's dark tokens, with lightened syntax colours. */
const DARK: Palette = {
    surface: '#1b1e24',
    raised: '#23272f',
    sunken: '#16181d',
    onBase: '#23272f',
    secondaryAction: '#2c313a',
    ghostHover: 'rgba(255, 255, 255, 0.06)',
    chipHover: '#2c313a',
    chipHoverBorder: '#3d434e',
    border: '#2c313a',
    borderBold: '#3d434e',
    text: '#e7eaee',
    textMuted: '#9aa2ae',
    textFaint: '#727986',
    brand: '#2770ef',
    brandHover: '#1e5fd0',
    onBrand: '#ffffff',
    accent: '#8c62f5',
    inlineCodeText: '#e7eaee',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f05b69',
    dangerSoft: '#3a1d21',
    shadow: '0 24px 32px rgba(0, 0, 0, 0.4), 0 0 4px rgba(0, 0, 0, 0.3)',
    promptShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 4px rgba(0, 0, 0, 0.3)',
    promptFocusShadow: '0 3px 12px rgba(4, 101, 237, 0.2), 0 4px 24px rgba(56, 125, 222, 0.16)',
    menuShadow: '0 12px 24px rgba(0, 0, 0, 0.35), 0 0 4px rgba(0, 0, 0, 0.2)',
    token: {
        comment: '#7d8896',
        string: '#7ee787',
        keyword: '#ff7b9c',
        number: '#79c0ff',
        tag: '#7ee787',
        attr: '#d2a8ff',
        punct: '#9aa2ae',
    },
};

/**
 * The scheme the host page declares through CSS `color-scheme`, or null when
 * it declares none (`normal`) or both (`light dark`) and so leaves the choice
 * to the OS. Read from the computed style because hosts set it in many ways —
 * a `data-theme` or class toggle, a media query, an inline style. `<body>` is
 * checked first since it can override `<html>`; `<html>` is then checked
 * directly rather than trusting inheritance to have carried it to `<body>`.
 */
function declaredScheme(): 'light' | 'dark' | null {
    const candidates = [document.body, document.documentElement].filter(Boolean);
    for (const el of candidates) {
        const scheme = schemeOf(el);
        if (scheme) return scheme;
    }
    return null;
}

function schemeOf(el: Element): 'light' | 'dark' | null {
    let value: string;
    try {
        value = window.getComputedStyle(el).getPropertyValue('color-scheme');
    } catch {
        return null;
    }
    const tokens = value.trim().split(/\s+/);
    const light = tokens.includes('light');
    const dark = tokens.includes('dark');
    if (dark === light) return null;
    return dark ? 'dark' : 'light';
}

/**
 * Whether the OS asks for a dark scheme. `matchMedia` is missing in some
 * embedded webviews and throws under some test setups, hence the guard;
 * light is the fallback.
 */
function osPrefersDark(): boolean {
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
        return false;
    }
}

function hostIsDark(): boolean {
    const scheme = declaredScheme();
    return scheme ? scheme === 'dark' : osPrefersDark();
}

/**
 * Matches the pane to the host page's theme without the host configuring
 * anything: the page's declared `color-scheme` wins, so an app with its own
 * light/dark toggle gets a pane that follows the toggle rather than the OS.
 * Pages that declare no scheme fall back to the OS preference.
 *
 * Re-checked when `<html>` or `<body>` attributes change (where theme toggles
 * live) and when the OS preference changes (which can flip a media-query-driven
 * `color-scheme`).
 */
function useHostDark(): boolean {
    const [dark, setDark] = useState(hostIsDark);
    const darkRef = useRef(dark);

    useEffect(() => {
        // Most attribute changes (the pane's own body styles, say) leave the
        // theme alone, so only a real flip touches React state.
        const update = () => {
            const next = hostIsDark();
            if (next === darkRef.current) return;
            darkRef.current = next;
            setDark(next);
        };
        const cleanups: Array<() => void> = [];

        try {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            // Safari < 14 only has the deprecated addListener.
            if (mq.addEventListener) {
                mq.addEventListener('change', update);
                cleanups.push(() => mq.removeEventListener('change', update));
            } else {
                mq.addListener(update);
                cleanups.push(() => mq.removeListener(update));
            }
        } catch {
            // No matchMedia: the declared scheme alone decides.
        }

        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(update);
            observer.observe(document.documentElement, { attributes: true });
            if (document.body) observer.observe(document.body, { attributes: true });
            cleanups.push(() => observer.disconnect());
        }

        // The theme may have changed between the first render and this effect.
        update();
        return () => cleanups.forEach((cleanup) => cleanup());
    }, []);

    return dark;
}

/**
 * Static stand-in for the Radiance glow, used when the renderer cannot run
 * (no canvas). The Figma artwork in pane coordinates, from the design's
 * `.op-radiance--static`.
 */
const STATIC_WASH_LIGHT = [
    'radial-gradient(circle 678px at 718px -20px, rgba(40,140,255,.135) 0%, rgba(40,140,255,.0405) 52%, rgba(40,140,255,0) 100%)',
    'radial-gradient(circle 653px at 401px -59px, rgba(140,100,255,.117) 0%, rgba(140,100,255,.0351) 52%, rgba(140,100,255,0) 100%)',
    'radial-gradient(circle 629px at -2px -88px, rgba(255,120,160,.117) 0%, rgba(255,120,160,.0351) 52%, rgba(255,120,160,0) 100%)',
    'linear-gradient(180deg, rgba(200,220,255,.0945) 0%, rgba(140,100,255,.0558) 18%, rgba(255,120,160,.0468) 34%, rgba(80,220,180,.0216) 58%, rgba(255,255,255,0) 100%)',
    'radial-gradient(circle 488px at -116px 172px, rgba(255,180,100,.44) 0%, rgba(255,180,100,0) 100%)',
    'radial-gradient(circle 610px at 660px -60px, rgba(40,140,255,.58) 0%, rgba(40,140,255,0) 100%)',
    'radial-gradient(circle 610px at 84px -2px, rgba(140,100,255,.6) 0%, rgba(140,100,255,0) 100%)',
    'radial-gradient(circle 548px at -318px -60px, rgba(255,120,160,.58) 0%, rgba(255,120,160,0) 100%)',
].join(', ');

const STATIC_WASH_DARK = [
    'radial-gradient(circle 678px at 718px -20px, rgba(39,140,255,.112) 0%, rgba(39,140,255,.034) 54%, rgba(39,140,255,0) 100%)',
    'radial-gradient(circle 653px at 373px -59px, rgba(138,93,255,.103) 0%, rgba(138,93,255,.031) 54%, rgba(138,93,255,0) 100%)',
    'radial-gradient(circle 629px at -30px -88px, rgba(255,93,142,.09) 0%, rgba(255,93,142,.027) 54%, rgba(255,93,142,0) 100%)',
    'linear-gradient(180deg, rgba(138,93,255,.071) 0%, rgba(39,140,255,.05) 18%, rgba(255,93,142,.037) 34%, rgba(45,220,177,.015) 58%, rgba(0,0,0,0) 100%)',
    'radial-gradient(circle 524px at -116px 190px, rgba(255,180,90,.24) 0%, rgba(255,180,90,0) 100%)',
    'radial-gradient(circle 666px at 690px -59px, rgba(39,140,255,.42) 0%, rgba(39,140,255,0) 100%)',
    'radial-gradient(circle 666px at 114px -1px, rgba(138,93,255,.46) 0%, rgba(138,93,255,0) 100%)',
    'radial-gradient(circle 605px at -318px -59px, rgba(255,93,142,.42) 0%, rgba(255,93,142,0) 100%)',
].join(', ');

/** The top-wash mask: the glow fades out by about half the pane's height. */
const WASH_MASK = 'linear-gradient(#000 0%, rgba(0, 0, 0, .92) 22%, rgba(0, 0, 0, .52) 54%, rgba(0, 0, 0, .18) 78%, transparent 100%)';

/**
 * Every keyframe the pane uses, plus the handful of states inline styles
 * cannot express — hover, placeholder colour, the shimmering "Working" label,
 * the launcher's gradient ring. Injected once from the pane root, and scoped
 * to `data-ts-dbg-*` attributes so none of it reaches the host page.
 *
 * `prefers-reduced-motion` turns the decorative motion off: no slide, wiggle,
 * drift, fade or shimmer.
 */
const paneSheet = (C: Palette): string => `
@keyframes ts-dbg-blink {0%,80%,100%{opacity:.25} 40%{opacity:1}}
@keyframes ts-dbg-rise {from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none}}
@keyframes ts-dbg-pop {from{opacity:0;transform:scale(.9)} to{opacity:1;transform:none}}
@keyframes ts-dbg-slide {from{transform:translateX(100%)} to{transform:none}}
@keyframes ts-dbg-menu {from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none}}
@keyframes ts-dbg-shimmer {from{background-position:100% 0} to{background-position:-100% 0}}
@keyframes ts-dbg-wiggle {
  0%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(5px)}
  45%{transform:translateX(-4px)} 60%{transform:translateX(3px)} 75%{transform:translateX(-2px)} 100%{transform:translateX(0)}
}
[data-ts-dbg-pane] *, [data-ts-dbg-pane] *::before, [data-ts-dbg-pane] *::after { box-sizing: border-box; }
[data-ts-dbg-pane] textarea::placeholder, [data-ts-dbg-pane] input::placeholder { color: ${C.textMuted}; opacity: 1; }
[data-ts-dbg-ghost] { background: transparent; }
[data-ts-dbg-ghost]:hover:not(:disabled) { background: ${C.ghostHover}; }
[data-ts-dbg-chip]:hover { background: ${C.chipHover} !important; border-color: ${C.chipHoverBorder} !important; }
[data-ts-dbg-trig]:hover { color: ${C.text} !important; }
[data-ts-dbg-send]:hover { background: ${C.brandHover} !important; }
[data-ts-dbg-file]:hover { background: ${C.onBase} !important; border-color: ${C.borderBold} !important; }
[data-ts-dbg-file-x] { opacity: 0; }
[data-ts-dbg-file]:hover [data-ts-dbg-file-x], [data-ts-dbg-file]:focus-within [data-ts-dbg-file-x] { opacity: 1; }
[data-ts-dbg-scroll] { scrollbar-width: thin; scrollbar-color: ${C.borderBold} transparent; }
.ts-dbg-shimmer {
  background: linear-gradient(100deg, ${C.textMuted} 6%, color-mix(in srgb, ${C.textFaint} 45%, ${C.textMuted}) 28%, ${C.textFaint} 50%, color-mix(in srgb, ${C.textFaint} 45%, ${C.textMuted}) 72%, ${C.textMuted} 94%);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text;
  color: transparent; -webkit-text-fill-color: transparent;
  animation: ts-dbg-shimmer 1.6s linear infinite;
}
[data-ts-dbg-fab]::before {
  content: ""; position: absolute; inset: 0; padding: 2px; border-radius: 50%; pointer-events: none;
  background: linear-gradient(90deg, #8c62f5 2%, #48d1e0 49%, #2770ef 96%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box exclude, linear-gradient(#fff 0 0);
}
[data-ts-dbg-fab]::after {
  content: ""; position: absolute; inset: -2px; z-index: -1; border-radius: 50%; pointer-events: none;
  background: linear-gradient(90deg, #8c62f5, #48d1e0, #2770ef); filter: blur(23px); opacity: .35;
}
[data-ts-dbg-fab]:hover { transform: translateY(-1px); }
@media (prefers-reduced-motion: reduce) {
  [data-ts-dbg-anim] { animation: none !important; transition: none !important; }
  .ts-dbg-shimmer { animation: none; background: none; color: ${C.textMuted}; -webkit-text-fill-color: currentColor; }
}
`;

/**
 * Built per palette rather than as a constant, so the same rules serve light
 * and dark. Components read the active set from `ThemeContext` via
 * `useTheme()`. Values follow the Operator pane spec (README §8): Geist at
 * 400/550, a 4px spacing grid, radii 6/8/10/16/20.
 */
const makeStyles = (C: Palette): Record<string, React.CSSProperties> => ({
    // Shell / Floating button: 58px, gradient ring and halo from the sheet.
    launcher: {
        position: 'fixed',
        right: 24,
        bottom: 24,
        width: 58,
        height: 58,
        padding: 0,
        margin: 0,
        borderRadius: '50%',
        border: 'none',
        background: C.surface,
        color: C.brand,
        boxShadow: '0 0 34px rgba(140, 98, 245, 0.42), 0 0 4px rgba(25, 35, 49, 0.08)',
        cursor: 'pointer',
        zIndex: 2147483647,
        display: 'grid',
        placeItems: 'center',
        animation: 'ts-dbg-pop 260ms cubic-bezier(.2,.8,.2,1)',
        transition: 'transform 140ms ease',
    },
    // Docked to the right edge at full height; `top` and `width` come from
    // props and the resize state.
    panel: {
        position: 'fixed',
        right: 0,
        bottom: 0,
        minWidth: PANEL_MIN_WIDTH,
        maxWidth: PANEL_MAX_WIDTH,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // The glow sits at z-index -1, behind the content but above this
        // background — isolation keeps that stacking inside the pane.
        isolation: 'isolate',
        background: C.surface,
        color: C.text,
        borderLeft: `1px solid ${C.border}`,
        boxShadow: C.shadow,
        zIndex: 2147483647,
        fontFamily: FONT,
        fontSize: 14,
        lineHeight: '20px',
        WebkitFontSmoothing: 'antialiased',
        animation: `ts-dbg-slide ${SLIDE_MS}ms cubic-bezier(.2,.8,.2,1)`,
        // Re-assert the inheritable properties a host page may have set on
        // body or on a wrapper, so the pane looks the same on every host.
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing: 'normal',
        textTransform: 'none',
        textAlign: 'left',
        textShadow: 'none',
        whiteSpace: 'normal',
        direction: 'ltr',
    },
    // The inner edge: drag it to resize.
    resizeHandle: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 6,
        zIndex: 6,
        cursor: 'col-resize',
    },
    // Pane / Radiance glow: the 1440px wash, centre slice behind the pane.
    radiance: {
        position: 'absolute',
        top: -60,
        bottom: 0,
        left: 'calc(50% - 720px)',
        width: 1440,
        zIndex: -1,
        pointerEvents: 'none',
        opacity: C === DARK ? 0.66 : 0.76,
        WebkitMaskImage: WASH_MASK,
        maskImage: WASH_MASK,
        transition: 'opacity 450ms ease, transform 450ms ease',
    },
    // Work done: the wash lifts away over 5s.
    radianceGone: {
        opacity: 0,
        transform: 'translateY(-500px)',
        transition: 'opacity 5000ms cubic-bezier(0, 0, .2, 1), transform 5000ms cubic-bezier(0, 0, .2, 1)',
    },
    radianceLocal: { position: 'absolute', inset: 0 },
    // Without the renderer: the static artwork, already in pane coordinates,
    // so it fills the pane with no 1440px offset and no mask.
    radianceStatic: {
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: C.surface,
        backgroundImage: C === DARK ? STATIC_WASH_DARK : STATIC_WASH_LIGHT,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '116% 112%',
        transition: 'opacity 450ms ease, transform 450ms ease',
    },
    // Pane / Header: 56px, padding 0 12 0 16, transparent over the glow.
    header: {
        position: 'relative',
        zIndex: 3,
        flex: '0 0 auto',
        height: 56,
        padding: '0 12px 0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        color: C.text,
    },
    headerMenuHost: { position: 'relative' },
    headerTitleBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        height: 32,
        padding: 0,
        margin: 0,
        border: 'none',
        background: 'transparent',
        color: C.text,
        cursor: 'pointer',
        fontFamily: FONT,
        fontSize: 14,
        lineHeight: '20px',
        fontWeight: 400,
        whiteSpace: 'nowrap',
    },
    headerChevron: {
        display: 'inline-grid',
        placeItems: 'center',
        width: 32,
        height: 32,
        borderRadius: 16,
        transition: 'background 120ms ease',
    },
    grow: { flex: 1 },
    srOnly: {
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
    },
    iconBtn: {
        display: 'grid',
        placeItems: 'center',
        width: 32,
        height: 32,
        padding: 0,
        margin: 0,
        border: 'none',
        borderRadius: 16,
        color: C.text,
        cursor: 'pointer',
        transition: 'background 120ms ease',
    },
    // Pane / Chat menu: Radiant menu, radius 6, padding 8 0, 28px rows.
    menu: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        zIndex: 30,
        minWidth: 200,
        padding: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        background: C.raised,
        color: C.text,
        borderRadius: 6,
        boxShadow: C.menuShadow,
        animation: 'ts-dbg-menu 180ms cubic-bezier(.2,.8,.2,1)',
    },
    menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        minHeight: 28,
        padding: '4px 16px',
        margin: 0,
        border: 'none',
        color: C.text,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: FONT,
        fontSize: 14,
        lineHeight: '20px',
    },
    // The stream: padding 12 16, 16px between turns.
    messages: {
        position: 'relative',
        zIndex: 1,
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto',
        padding: '12px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        // A host page setting `scroll-behavior: smooth` would fight the
        // stream-following scroll, so it is pinned here.
        scrollBehavior: 'auto',
    },
    // Welcome state: the greeting block centred vertically in the stream.
    welcome: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 'auto',
        marginBottom: 'auto',
        padding: '8px 0 16px',
        animation: 'ts-dbg-rise 300ms cubic-bezier(.2,.8,.2,1)',
    },
    greet: { textAlign: 'center' },
    greetLine: {
        margin: 0,
        fontSize: 24,
        lineHeight: '32px',
        fontWeight: 550,
        color: C.text,
    },
    greetAccent: { color: C.accent },
    starterList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginTop: 32,
    },
    // Starter prompt: full width, padding 12 20, radius 40, On Base.
    starterBtn: {
        display: 'block',
        width: '100%',
        margin: 0,
        padding: '12px 20px',
        background: C.onBase,
        color: C.text,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 40,
        cursor: 'pointer',
        fontFamily: FONT,
        fontSize: 14,
        lineHeight: '20px',
        textAlign: 'left',
        transition: 'background 180ms ease, border-color 180ms ease',
    },
    // minWidth 0 on the rows: without it a long line overflows the pane
    // instead of wrapping.
    userRow: { display: 'flex', justifyContent: 'flex-end', minWidth: 0 },
    // User message: On Base, padding 12 16, radius 16 16 4 16, 16/24.
    userBubble: {
        maxWidth: '92%',
        minWidth: 0,
        padding: '12px 16px',
        borderRadius: '16px 16px 4px 16px',
        background: C.onBase,
        color: C.text,
        fontSize: 16,
        lineHeight: '24px',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
    },
    assistantRow: {
        display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0,
    },
    // Thread block · Agent text: full width, 14/20, no bubble.
    agentMsg: {
        minWidth: 0,
        fontSize: 14,
        lineHeight: '20px',
        // Explicit, so a dark host page cannot wash out the reply text.
        color: C.text,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
    },
    // Feedback row under an answer: 24px icon buttons, gap 8.
    fb: { display: 'flex', alignItems: 'center', gap: 8 },
    fbBtn: { borderRadius: 12, color: C.textMuted },
    iconAct: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: 24,
        height: 24,
        padding: '0 5px',
        margin: 0,
        border: 'none',
        borderRadius: 4,
        color: C.text,
        cursor: 'pointer',
        flexShrink: 0,
        fontFamily: FONT,
        transition: 'background 120ms ease',
    },
    copyNote: { fontSize: 12, lineHeight: '18px', color: C.textFaint },
    caret: {
        display: 'inline-block',
        width: 2,
        height: '0.95em',
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        background: C.brand,
        animation: 'ts-dbg-blink 1s step-end infinite',
    },
    inlineCode: {
        background: C.sunken,
        // Explicit: a dark host page would otherwise leave this light on light.
        color: C.inlineCodeText,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        padding: '0 4px',
        fontFamily: MONO,
        fontSize: '0.9em',
        // A long token (a CSS variable, a selector) must not run off the pane.
        overflowWrap: 'anywhere',
    },
    link: {
        // Colour and underline stated, so a host page's `a { }` rules cannot
        // restyle these into invisibility the way they did with inline code.
        color: C.brand,
        textDecoration: 'underline',
        overflowWrap: 'anywhere',
    },
    rule: { height: 1, background: C.border, margin: '8px 0' },
    notice: {
        animation: 'ts-dbg-rise 220ms ease',
        alignSelf: 'center',
        fontSize: 12,
        lineHeight: '18px',
        color: C.textFaint,
        textAlign: 'center',
    },
    // Pane / Reasoning.
    work: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: 'ts-dbg-rise 240ms cubic-bezier(.2,.8,.2,1)',
    },
    // Header: 16/24 Content/Secondary + 12px chevron, gap 4.
    workTrig: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        padding: 0,
        margin: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: FONT,
        fontSize: 16,
        lineHeight: '24px',
        color: C.textMuted,
    },
    workFailed: { color: C.danger, fontSize: 14 },
    steps: { display: 'flex', flexDirection: 'column' },
    // Step: 20px rail, gap 4, rows at least 36px.
    step: {
        display: 'flex',
        gap: 4,
        minHeight: 36,
        animation: 'ts-dbg-rise 220ms ease both',
    },
    stepRail: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 20px',
    },
    stepIco: {
        display: 'grid', placeItems: 'center', width: 20, height: 20,
    },
    stepLine: { width: 1, height: 16, background: C.border },
    stepBody: { flex: 1, minWidth: 0, paddingBottom: 8 },
    stepHead: {
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, lineHeight: '20px',
    },
    stepLabel: {
        flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    stepTime: {
        flexShrink: 0, fontSize: 12, lineHeight: '18px', color: C.textFaint, fontVariantNumeric: 'tabular-nums',
    },
    // Tool call: radius 12, padding 12, gap 8, Background/Base, Border/Subtle.
    toolCard: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginTop: 8,
        padding: 12,
        background: C.surface,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
    },
    toolSec: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
    toolLbl: { fontSize: 12, lineHeight: '18px', color: C.textMuted },
    toolWell: {
        padding: '8px 12px',
        background: C.sunken,
        color: C.text,
        borderRadius: 8,
        fontFamily: MONO,
        fontSize: 12,
        lineHeight: '20px',
        overflowWrap: 'anywhere',
    },
    // Pane / Code block: radius 8, Background/Sunken.
    codeBlock: {
        animation: 'ts-dbg-rise 220ms ease',
        margin: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        background: C.sunken,
        color: C.text,
        borderRadius: 8,
        // Clips the corners only; the scroller owns the horizontal scroll.
        overflow: 'hidden',
        // Without these the block sizes itself to its widest line and pushes
        // the message out, so the scroller never overflows and never scrolls —
        // which is why copy returned lines the pane would not show.
        maxWidth: '100%',
        minWidth: 0,
        flexShrink: 1,
        alignSelf: 'stretch',
    },
    // Header: padding 8 10 4 16, gap 8 — icon, "ts · 3 lines", actions.
    codeBlockHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px 4px 16px',
    },
    codeBlockIco: { display: 'flex', color: C.textMuted },
    codeBlockLang: {
        flex: 1,
        minWidth: 0,
        fontSize: 12,
        lineHeight: '18px',
        color: C.textMuted,
        textTransform: 'lowercase',
    },
    codeActs: { display: 'flex', alignItems: 'center', gap: 2 },
    codeAct: { color: C.text },
    // A div, so host `pre`/`code` rules cannot reach it. That means the
    // formatting `pre` gave for free has to be stated here.
    codeBlockPre: {
        display: 'block',
        margin: 0,
        padding: '4px 16px 12px',
        // The scroll container for long lines.
        overflowX: 'auto',
        overflowY: 'hidden',
        fontFamily: MONO,
        fontSize: 12,
        lineHeight: '22px',
        color: C.text,
        background: C.sunken,
        // Replaces what `pre` provided: keep newlines and runs of spaces, and
        // do not wrap — long lines scroll instead.
        whiteSpace: 'pre',
        textAlign: 'left',
        textIndent: 0,
        tabSize: 4,
        // Scrolling beats wrapping for code, but a single enormous token must
        // not be able to stretch the pane itself.
        maxWidth: '100%',
    },
    // Past eight lines the block folds, fading out at the bottom.
    codeBlockFolded: {
        maxHeight: 22 * CODE_FOLD_LINES + 16,
        WebkitMaskImage: 'linear-gradient(#000 70%, transparent)',
        maskImage: 'linear-gradient(#000 70%, transparent)',
    },
    // Attached elements sit in a row above the text, two per row at 400px.
    contextTray: {
        display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 108, overflowY: 'auto', padding: '5px 5px 0 0',
    },
    // Pane / File card: 46px, padding 4 8 4 4, gap 8, radius 10.
    elementChip: {
        position: 'relative',
        flex: '1 1 calc(50% - 4px)',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 46,
        padding: '4px 8px 4px 4px',
        background: C.surface,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        animation: 'ts-dbg-pop 200ms cubic-bezier(.2,.8,.2,1)',
        transition: 'background 120ms ease, border-color 120ms ease',
    },
    elementChipTile: {
        flex: '0 0 38px',
        width: 38,
        height: 38,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 6,
        background: C.secondaryAction,
        color: C.textMuted,
    },
    elementChipText: {
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2,
    },
    elementChipTag: {
        fontSize: 14,
        lineHeight: '20px',
        color: C.text,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    elementChipMeta: {
        fontSize: 12,
        lineHeight: '18px',
        color: C.textMuted,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    // The remove badge at the top-right corner, shown on hover or focus.
    elementChipRemove: {
        position: 'absolute',
        top: -5,
        right: -5,
        display: 'grid',
        placeItems: 'center',
        width: 14,
        height: 14,
        padding: 0,
        margin: 0,
        border: 'none',
        borderRadius: '50%',
        background: C.text,
        color: C.surface,
        cursor: 'pointer',
        transition: 'opacity 120ms ease',
    },
    // Radiant TextInput: 32px, radius 6, Border/Bold.
    sessionInput: {
        width: '100%',
        height: 32,
        background: C.surface,
        color: C.text,
        border: `1px solid ${C.borderBold}`,
        borderRadius: 6,
        padding: '0 12px',
        fontFamily: MONO,
        fontSize: 12,
        outline: 'none',
    },
    // Dock: padding 0 16 16, gap 8. Transparent until a chat starts.
    dock: {
        position: 'relative',
        zIndex: 2,
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '0 16px 16px',
    },
    // Prompt box: radius 20, padding 12 16 16, gap 12, Raised, Border/Subtle.
    prompt: {
        position: 'relative',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 16px 16px',
        background: C.raised,
        color: C.text,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 20,
        boxShadow: C.promptShadow,
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    promptFocused: {
        borderColor: C.brand,
        boxShadow: C.promptFocusShadow,
    },
    // An empty send wiggles the box instead of sending.
    promptWiggle: { animation: 'ts-dbg-wiggle 360ms cubic-bezier(.36,.07,.19,.97)' },
    composerActions: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        minHeight: 32,
    },
    composerTools: {
        display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', minWidth: 0,
    },
    // Prompt text: 16/24, grows to 184px and then scrolls.
    textarea: {
        display: 'block',
        width: '100%',
        minHeight: 24,
        maxHeight: PROMPT_MAX_HEIGHT,
        padding: 0,
        margin: 0,
        resize: 'none',
        overflowY: 'auto',
        background: 'transparent',
        color: C.text,
        border: 'none',
        borderRadius: 0,
        outline: 'none',
        boxShadow: 'none',
        fontFamily: FONT,
        fontSize: 16,
        lineHeight: '24px',
    },
    // The 32px round tools, like the design's "+".
    toolBtn: {
        display: 'grid',
        placeItems: 'center',
        width: 32,
        height: 32,
        padding: 0,
        margin: 0,
        border: 'none',
        borderRadius: 16,
        color: C.text,
        cursor: 'pointer',
        transition: 'background 120ms ease, color 120ms ease',
    },
    toolBtnActive: { background: C.ghostHover, color: C.brand },
    /**
     * Recording is the one state in the pane worth colouring red: it is
     * ongoing, invisible on the page itself, and capturing data until stopped.
     */
    toolBtnDanger: { background: C.dangerSoft, color: C.danger },
    // Send: 32px, radius 18, Background/Brand, white arrow.
    sendBtn: {
        display: 'grid',
        placeItems: 'center',
        width: 32,
        height: 32,
        flexShrink: 0,
        padding: 0,
        margin: 0,
        border: 'none',
        borderRadius: 18,
        background: C.brand,
        color: C.onBrand,
        cursor: 'pointer',
        transition: 'background 120ms ease, opacity 120ms ease',
    },
    // At 50% until there is something to send.
    sendBtnIdle: { opacity: 0.5 },
    // Streaming: a 10px rounded stop square in the send disc.
    stopGlyph: {
        display: 'block', width: 10, height: 10, borderRadius: 2, background: 'currentColor',
    },
    disclaimer: {
        margin: 0,
        textAlign: 'center',
        fontSize: 12,
        lineHeight: '18px',
        color: C.textMuted,
    },
});
