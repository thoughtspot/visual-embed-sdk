import React from 'react';
import '@testing-library/jest-dom';
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';
import {
    act, cleanup, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { DebugAgent, splitContentSegments, tokenizeCode } from './DebugAgent';
import * as embedConfig from '../embed/embedConfig';

// jsdom ships neither, and the panel decodes the SSE stream with TextDecoder.
(global as any).TextEncoder = (global as any).TextEncoder ?? NodeTextEncoder;
(global as any).TextDecoder = (global as any).TextDecoder ?? NodeTextDecoder;

/**
 * Builds a fake `fetch` that streams the given SSE events and then parks,
 * resolving its stream only once `finish()` is called — so a test can assert
 * on what the panel renders mid-stream (Stop button, spinning activity card)
 * before the turn ends. Aborting rejects the parked read the way a real
 * `fetch` rejects an aborted body.
 */
function mockAgentStream(events: Array<Record<string, unknown>>) {
    let release: () => void = () => undefined;
    const queue = events.map((e) => `data: ${JSON.stringify(e)}\n\n`);
    let i = 0;

    const fetchMock = jest.fn().mockImplementation((_url: string, init: RequestInit) => Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        body: {
            getReader: () => ({
                read: () => {
                    if (i < queue.length) {
                        const chunk = queue[i];
                        i += 1;
                        return Promise.resolve({ done: false, value: new TextEncoder().encode(chunk) });
                    }
                    return new Promise((resolve, reject) => {
                        release = () => resolve({ done: true, value: undefined });
                        init.signal?.addEventListener('abort', () => {
                            const err = new Error('The operation was aborted.');
                            err.name = 'AbortError';
                            reject(err);
                        });
                    });
                },
            }),
        },
    }));

    return { fetchMock, finish: async () => { await act(async () => { release(); }); } };
}

const openPanel = async () => act(async () => {
    fireEvent.click(screen.getByLabelText('Open EmbedX'));
});

/**
 * Sends a question and lets the already-queued SSE chunks drain, so the
 * assertions that follow see the mid-stream UI without tripping the repo's
 * console.error-throws-on-act-warning setup.
 */
const ask = async (text = 'why is my embed blank?') => {
    await act(async () => {
        fireEvent.change(screen.getByPlaceholderText(/Ask about this embed/), { target: { value: text } });
        fireEvent.submit(screen.getByPlaceholderText(/Ask about this embed/).closest('form')!);
    });
};

/** The code block's scroll container: a div styled `white-space: pre`. */
/** The light palette's string-token colour (see LIGHT.token.string). */
const LIGHT_STRING = '#0a6640';

const codeScroller = (): HTMLElement => {
    const el = [...document.querySelectorAll<HTMLElement>('div[style*="pre"]')]
        .find((d) => d.style.whiteSpace === 'pre');
    if (!el) throw new Error('no code scroller found');
    return el;
};

describe('DebugAgent', () => {
    beforeEach(() => {
        jest.spyOn(embedConfig, 'getEmbedConfig').mockReturnValue({ enableDebugAgent: true } as any);
    });

    afterEach(() => {
        cleanup();
        jest.restoreAllMocks();
    });

    it('renders nothing unless enableDebugAgent is set', () => {
        jest.spyOn(embedConfig, 'getEmbedConfig').mockReturnValue({} as any);
        const { container } = render(<DebugAgent />);
        expect(container).toBeEmptyDOMElement();
    });

    describe('splitContentSegments', () => {
        it('separates fenced code from prose and keeps the language tag', () => {
            const segments = splitContentSegments('Try this:\n```ts\ninit({});\n```\nDone.');
            expect(segments).toEqual([
                { type: 'prose', text: 'Try this:' },
                { type: 'code', text: 'init({});', language: 'ts' },
                { type: 'prose', text: 'Done.' },
            ]);
        });

        it('treats an unterminated fence as code, so a streaming snippet does not reflow', () => {
            const segments = splitContentSegments('Here:\n```js\nconst a = 1;');
            expect(segments[1]).toEqual({ type: 'code', text: 'const a = 1;', language: 'js' });
        });

        it('returns prose only when there is no fence', () => {
            expect(splitContentSegments('just text')).toEqual([{ type: 'prose', text: 'just text' }]);
        });
    });

    describe('tokenizeCode', () => {
        /** Rebuilding the source from the tokens must be lossless. */
        const roundTrip = (code: string, lang?: string) => tokenizeCode(code, lang).map((t) => t.text).join('');

        const typesOf = (code: string, lang: string, text: string) => tokenizeCode(code, lang)
            .filter((t) => t.text === text)
            .map((t) => t.type);

        it('never alters the code it highlights', () => {
            const samples: Array<[string, string]> = [
                ['const a = "x"; // note', 'ts'],
                ['{"a": 1, "b": null}', 'json'],
                ['.a { color: #fff; margin: 4px; }', 'css'],
                ['<div class="x">hi</div>', 'html'],
                ['npm run build # go', 'bash'],
            ];
            samples.forEach(([code, lang]) => expect(roundTrip(code, lang)).toBe(code));
        });

        it('tags keywords, strings and numbers in TypeScript', () => {
            expect(typesOf('const n = 42;', 'ts', 'const')).toEqual(['keyword']);
            expect(typesOf('const s = "hi";', 'ts', '"hi"')).toEqual(['string']);
            expect(typesOf('const n = 42;', 'ts', '42')).toEqual(['number']);
        });

        it('leaves a keyword inside a string or comment unhighlighted', () => {
            // The literal must come back as ONE string token: were the keyword
            // inside it highlighted, this would split into three.
            expect(tokenizeCode('"const"', 'ts')).toEqual([{ type: 'string', text: '"const"' }]);
            expect(tokenizeCode('// const a', 'ts')).toEqual([{ type: 'comment', text: '// const a' }]);
            // And only the bare keyword is tagged, not the one in the literal.
            expect(tokenizeCode('const a = "const";', 'ts').filter((t) => t.type === 'keyword'))
                .toEqual([{ type: 'keyword', text: 'const' }]);
        });

        it('distinguishes a JSON key from a JSON string value', () => {
            expect(typesOf('{"a": "b"}', 'json', '"a"')).toEqual(['attr']);
            expect(typesOf('{"a": "b"}', 'json', '"b"')).toEqual(['string']);
        });

        it('returns one plain token for an untagged or unknown language', () => {
            expect(tokenizeCode('some text', undefined)).toEqual([{ type: 'plain', text: 'some text' }]);
            expect(tokenizeCode('some text', 'brainfuck')).toEqual([{ type: 'plain', text: 'some text' }]);
        });

        it('returns nothing for empty code', () => {
            expect(tokenizeCode('', 'ts')).toEqual([]);
        });

        it('keeps every character of a block long enough to exhaust the loop guard', () => {
            // A pasted network or console dump easily needs more tokens than
            // the guard allows; the tail must still render, unhighlighted.
            const code = '{"id":1,"name":"a","ok":true},'.repeat(2000);
            expect(roundTrip(code, 'json')).toBe(code);
        });
    });

    it('renders a code block with a copy button that writes the code to the clipboard', async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

        const { fetchMock, finish } = mockAgentStream([
            { type: 'text', content: 'Use:\n```ts\ninit({ thoughtSpotHost: "x" });\n```' },
        ]);
        global.fetch = fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();

        await waitFor(() => expect(screen.getByText('ts')).toBeInTheDocument());
        // Highlighting splits the snippet across spans, and the block is a
        // div (not `pre`) so host CSS cannot reach it -- assert on the panel.
        expect(document.querySelector('div[style*="2147483647"]'))
            .toHaveTextContent('init({ thoughtSpotHost: "x" });');

        // Highlighted: the string literal is its own coloured span.
        expect(screen.getByText('"x"')).toHaveStyle({ color: LIGHT_STRING });

        await finish();
        await act(async () => {
            fireEvent.click(screen.getByLabelText('Copy code'));
        });
        // Copying hands over the original source, not the highlighted markup.
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('init({ thoughtSpotHost: "x" });'));
        expect(await screen.findByText('✓ Copied')).toBeInTheDocument();
    });

    it('offers a copy button on a settled reply but not on one still streaming', async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

        const { fetchMock, finish } = mockAgentStream([{ type: 'text', content: 'Set `hiddenActions`.' }]);
        global.fetch = fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();

        // Mid-stream: copying now would hand over a truncated answer.
        await waitFor(() => expect(screen.getByLabelText('Stop')).toBeInTheDocument());
        expect(screen.queryByLabelText('Copy response')).not.toBeInTheDocument();

        await finish();
        await waitFor(() => expect(screen.getByLabelText('Copy response')).toBeInTheDocument());

        await act(async () => {
            fireEvent.click(screen.getByLabelText('Copy response'));
        });
        // The raw markdown is copied, not the rendered text.
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('Set `hiddenActions`.'));
    });

    it('captions tool calls in end-user language and hides the tool name until expanded', async () => {
        const { fetchMock, finish } = mockAgentStream([
            {
                type: 'tool-start',
                toolName: 'mcp__chrome-devtools__list_console_messages',
                toolCallId: 'c1',
                input: { pageId: 1 },
            },
        ]);
        global.fetch = fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();

        // Collapsed: the friendly caption only — never the raw tool name.
        await waitFor(() => expect(screen.getByText('Reading the browser console…')).toBeInTheDocument());
        expect(screen.queryByText(/list_console_messages/)).not.toBeInTheDocument();

        // Expanded: the real tool name and its arguments.
        fireEvent.click(screen.getByRole('button', { expanded: false }));
        expect(screen.getByText('mcp__chrome-devtools__list_console_messages')).toBeInTheDocument();
        expect(screen.getByText('pageId: 1')).toBeInTheDocument();
        await finish();
    });

    it('collapses a whole turn into one card and summarises it once the turn ends', async () => {
        const { fetchMock, finish } = mockAgentStream([
            { type: 'tool-start', toolName: 'list_console_messages', toolCallId: 'c1', input: {} },
            { type: 'tool-result', toolName: 'list_console_messages', toolCallId: 'c1', output: {} },
            { type: 'tool-start', toolName: 'get-developer-docs-reference', toolCallId: 'c2', input: { query: 'init' } },
            { type: 'tool-result', toolName: 'get-developer-docs-reference', toolCallId: 'c2', output: {} },
            { type: 'text', content: 'All set.' },
        ]);
        global.fetch = fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();
        await finish();

        // One card for both calls, captioned by count rather than by tool name.
        await waitFor(() => expect(screen.getByText(/^2 steps/)).toBeInTheDocument());
        expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { expanded: false }));
        expect(screen.getByText('Read the browser console')).toBeInTheDocument();
        expect(screen.getByText('Read the developer docs')).toBeInTheDocument();
    });

    it('falls back to a de-slugged label for a tool the SDK does not know', async () => {
        const { fetchMock, finish } = mockAgentStream([
            { type: 'tool-start', toolName: 'some_new_tool', toolCallId: 'c1', input: {} },
        ]);
        global.fetch = fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();

        await waitFor(() => expect(screen.getByText('Working on some new tool…')).toBeInTheDocument());
        await finish();
    });

    it('offers Stop while streaming, and aborts the request when it is clicked', async () => {
        const { fetchMock, finish } = mockAgentStream([{ type: 'text', content: 'Partial answer' }]);
        global.fetch = fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();

        await waitFor(() => expect(screen.getByLabelText('Stop')).toBeInTheDocument());
        expect(screen.queryByLabelText('Send')).not.toBeInTheDocument();

        const { signal } = fetchMock.mock.calls[0][1];
        expect(signal.aborted).toBe(false);

        fireEvent.click(screen.getByLabelText('Stop'));
        expect(signal.aborted).toBe(true);
        await finish();

        // Stopping keeps what already streamed, and says so.
        await waitFor(() => expect(screen.getByLabelText('Send')).toBeInTheDocument());
        expect(screen.getByText('Partial answer')).toBeInTheDocument();
        expect(screen.getByText('Stopped.')).toBeInTheDocument();
    });

    it('resets the conversation, clearing both the timeline and the history sent to the agent', async () => {
        const first = mockAgentStream([{ type: 'text', content: 'First answer' }]);
        global.fetch = first.fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask('first question');
        await first.finish();
        await waitFor(() => expect(screen.getByText('First answer')).toBeInTheDocument());

        fireEvent.click(screen.getByLabelText('New conversation'));
        expect(screen.queryByText('First answer')).not.toBeInTheDocument();
        expect(screen.queryByText('first question')).not.toBeInTheDocument();
        expect(screen.getByText('How can I help with this embed?')).toBeInTheDocument();

        // The next turn must not carry the cleared turns to the agent.
        const second = mockAgentStream([{ type: 'text', content: 'Second answer' }]);
        global.fetch = second.fetchMock as any;
        await ask('second question');
        await second.finish();

        await waitFor(() => expect(second.fetchMock).toHaveBeenCalled());
        const body = JSON.parse(second.fetchMock.mock.calls[0][1].body);
        expect(body.messages).toHaveLength(1);
        expect(body.messages[0].content).toContain('second question');
    });

    it('leaves nothing behind when reset lands mid-stream', async () => {
        const first = mockAgentStream([{ type: 'text', content: 'Partial answer' }]);
        global.fetch = first.fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask('first question');
        await waitFor(() => expect(screen.getByText('Partial answer')).toBeInTheDocument());

        // Reset while the stream is still open: aborting unwinds the turn, and
        // its own cleanup must not write back into the cleared conversation.
        await act(async () => {
            fireEvent.click(screen.getByLabelText('New conversation'));
        });

        expect(screen.queryByText('Partial answer')).not.toBeInTheDocument();
        expect(screen.queryByText('Stopped.')).not.toBeInTheDocument();
        expect(screen.getByText('How can I help with this embed?')).toBeInTheDocument();
        // Reset also settles the panel, rather than leaving Stop showing.
        expect(screen.getByLabelText('Send')).toBeInTheDocument();

        // The aborted turn must not have re-seeded the history either.
        const second = mockAgentStream([{ type: 'text', content: 'Second answer' }]);
        global.fetch = second.fetchMock as any;
        await ask('second question');
        await second.finish();

        const body = JSON.parse(second.fetchMock.mock.calls[0][1].body);
        expect(body.messages).toHaveLength(1);
        expect(body.messages[0]).toMatchObject({ role: 'user' });
    });

    it('marks a step the stream never resolved as failed instead of spinning forever', async () => {
        const { fetchMock, finish } = mockAgentStream([
            { type: 'tool-start', toolName: 'list_console_messages', toolCallId: 'c1', input: {} },
        ]);
        global.fetch = fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();
        await waitFor(() => expect(screen.getByText('Reading the browser console…')).toBeInTheDocument());
        await finish();

        await waitFor(() => expect(screen.getByLabelText('Send')).toBeInTheDocument());
        // No spinner left, and the card reports the turn as having a problem.
        expect(screen.queryByText('Reading the browser console…')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { expanded: false }));
        // Once in the collapsed header, once against the unresolved step.
        expect(screen.getAllByText('⚠')).toHaveLength(2);
    });

    describe('picked-element context', () => {
        /** Picks the first matching element on the host page via the picker. */
        const pickHostElement = async () => {
            const target = document.createElement('div');
            target.id = 'target';
            document.body.appendChild(target);
            // jsdom has no elementFromPoint at all, so it is defined outright
            // rather than spied on.
            Object.defineProperty(document, 'elementFromPoint', {
                value: () => target,
                configurable: true,
                writable: true,
            });

            await act(async () => {
                fireEvent.click(screen.getByTitle(/Pick an element on the host page/));
            });
            await act(async () => {
                // mousedown, since a cross-origin iframe swallows click.
                fireEvent.mouseDown(document.body, { clientX: 5, clientY: 5 });
            });
            return target;
        };

        it('pins a pick above the input rather than dropping it into the transcript', async () => {
            render(<DebugAgent />);
            await openPanel();
            await pickHostElement();

            const chip = await screen.findByText('div#target');
            expect(screen.getByText('1 element attached')).toBeInTheDocument();

            // The chip sits between the message list and the input box.
            const tray = chip.closest('div[style*="column"]')!;
            const form = document.querySelector('form')!;
            expect(tray.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('points at "Pick in embed" instead of attaching the iframe itself', async () => {
            const frame = document.createElement('iframe');
            document.body.appendChild(frame);
            Object.defineProperty(document, 'elementFromPoint', {
                value: () => frame, configurable: true, writable: true,
            });

            render(<DebugAgent />);
            await openPanel();
            await act(async () => {
                fireEvent.click(screen.getByTitle(/Pick an element on the host page/));
            });
            await act(async () => {
                fireEvent.mouseDown(document.body, { clientX: 5, clientY: 5 });
            });

            expect(screen.getByText(/Connect the browser extension to pick inside it/)).toBeInTheDocument();
            expect(screen.queryByText(/element attached/)).not.toBeInTheDocument();
        });

        it('disarms the picker on Escape, so it cannot keep swallowing clicks', async () => {
            render(<DebugAgent />);
            await openPanel();
            await act(async () => {
                fireEvent.click(screen.getByTitle(/Pick an element on the host page/));
            });
            const button = screen.getByTitle(/Pick an element on the host page/);
            expect(button).toHaveTextContent('Picking…');

            await act(async () => {
                fireEvent.keyDown(document, { key: 'Escape' });
            });
            expect(button).toHaveTextContent('Pick element');
            expect(button).not.toHaveTextContent('Picking…');
        });

        it('sends the pinned element as context, and drops it when removed', async () => {
            const { fetchMock, finish } = mockAgentStream([{ type: 'text', content: 'ok' }]);
            global.fetch = fetchMock as any;

            render(<DebugAgent />);
            await openPanel();
            await pickHostElement();
            await screen.findByText('div#target');

            await ask('why is this hidden?');
            await finish();

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.messages[0].content).toContain('div#target');
            expect(body.messages[0].content).toContain('in the host page');
            expect(body.messages[0].content).toContain('why is this hidden?');

            // Removing it clears the tray.
            await act(async () => {
                fireEvent.click(screen.getByLabelText('Remove div#target'));
            });
            expect(screen.queryByText('div#target')).not.toBeInTheDocument();
            expect(screen.queryByText('1 element attached')).not.toBeInTheDocument();
        });
    });

    describe('panel sizing', () => {
        afterEach(() => {
            try {
                window.localStorage.removeItem('ts-debug-agent-panel-size');
            } catch {
                // Storage may be unavailable; nothing to undo.
            }
        });

        const panelOf = () => document.querySelector('div[style*="position: fixed"][style*="flex-direction: column"]') as HTMLElement;

        it('opens full height within its margins', async () => {
            render(<DebugAgent />);
            await openPanel();
            // jsdom reports innerHeight 768, leaving 20px top and bottom.
            expect(panelOf()).toHaveStyle({ height: `${window.innerHeight - 40}px` });
        });

        it('resizes by dragging the corner and remembers the result', async () => {
            render(<DebugAgent />);
            await openPanel();
            const before = panelOf().style.width;

            const handle = screen.getByTitle('Drag to resize');
            await act(async () => {
                fireEvent.mouseDown(handle, { clientX: 500, clientY: 300 });
                // Dragging left and up grows a bottom-right-pinned panel.
                fireEvent.mouseMove(document, { clientX: 440, clientY: 260 });
                fireEvent.mouseUp(document);
            });

            expect(panelOf().style.width).not.toBe(before);
            expect(panelOf()).toHaveStyle({ width: '480px' });
            expect(JSON.parse(window.localStorage.getItem('ts-debug-agent-panel-size')!))
                .toMatchObject({ width: 480 });
        });

        it('never shrinks below its minimum, however far the corner is dragged', async () => {
            render(<DebugAgent />);
            await openPanel();

            await act(async () => {
                fireEvent.mouseDown(screen.getByTitle('Drag to resize'), { clientX: 100, clientY: 100 });
                fireEvent.mouseMove(document, { clientX: 5000, clientY: 5000 });
                fireEvent.mouseUp(document);
            });

            expect(panelOf()).toHaveStyle({ width: '320px', height: '320px' });
        });
    });

    describe('branding and theme', () => {
        /** Stubs matchMedia so the panel sees a chosen colour scheme. */
        const setColorScheme = (dark: boolean) => {
            Object.defineProperty(window, 'matchMedia', {
                configurable: true,
                writable: true,
                value: (q: string) => ({
                    matches: dark && q.includes('dark'),
                    media: q,
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                }),
            });
        };

        const panel = () => document.querySelector('div[style*="2147483647"]') as HTMLElement;

        it('presents itself as EmbedX with its tagline', async () => {
            render(<DebugAgent />);
            expect(screen.getByLabelText('Open EmbedX')).toBeInTheDocument();
            await openPanel();
            expect(screen.getByText('EmbedX')).toBeInTheDocument();
            expect(screen.getByText('Embed assistant')).toBeInTheDocument();
            expect(screen.getByText('Ready')).toBeInTheDocument();
        });

        it('uses the light surface when the OS prefers light', async () => {
            setColorScheme(false);
            render(<DebugAgent />);
            await openPanel();
            expect(panel().style.background).toBe('rgb(255, 255, 255)');
            expect(panel().style.color).toBe('rgb(15, 23, 42)');
        });

        it('uses the dark surface when the OS prefers dark', async () => {
            setColorScheme(true);
            render(<DebugAgent />);
            await openPanel();
            // Dark slate panel with light text, rather than the light default.
            expect(panel().style.background).toBe('rgb(22, 27, 34)');
            expect(panel().style.color).toBe('rgb(230, 237, 243)');
        });

        it('still renders when matchMedia is unavailable', async () => {
            // Some embedded webviews lack it; the panel must not crash.
            Object.defineProperty(window, 'matchMedia', {
                configurable: true,
                writable: true,
                value: undefined,
            });
            render(<DebugAgent />);
            await openPanel();
            expect(screen.getByText('EmbedX')).toBeInTheDocument();
        });
    });

    describe('starter prompts', () => {
        it('offers openers on the empty state and sends the one clicked', async () => {
            const { fetchMock, finish } = mockAgentStream([{ type: 'text', content: 'Looking…' }]);
            global.fetch = fetchMock as any;

            render(<DebugAgent />);
            await openPanel();

            const starter = screen.getByText('Diagnose this embed');
            await act(async () => {
                fireEvent.click(starter);
            });
            await finish();

            // The full question goes to the agent, not the short label.
            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.messages[0].content).toContain('Check the console and network for errors');
            // And the openers give way to the conversation.
            expect(screen.queryByText('Diagnose this embed')).not.toBeInTheDocument();
        });

        it('attaches any picked element to a starter prompt too', async () => {
            const target = document.createElement('div');
            target.id = 'target';
            document.body.appendChild(target);
            Object.defineProperty(document, 'elementFromPoint', {
                value: () => target, configurable: true, writable: true,
            });

            const { fetchMock, finish } = mockAgentStream([{ type: 'text', content: 'ok' }]);
            global.fetch = fetchMock as any;

            render(<DebugAgent />);
            await openPanel();
            await act(async () => {
                fireEvent.click(screen.getByTitle(/Pick an element on the host page/));
            });
            await act(async () => {
                fireEvent.mouseDown(document.body, { clientX: 5, clientY: 5 });
            });
            await act(async () => {
                fireEvent.click(screen.getByText('Match my app theme'));
            });
            await finish();

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.messages[0].content).toContain('div#target');
            expect(body.messages[0].content).toContain('customCSS variables');
        });
    });

    describe('resilience to host page CSS', () => {
        /**
         * The panel renders in the host's DOM, and a dark-theme host commonly
         * ships `code, pre { background: #161b22 !important }`. An inline style
         * loses to `!important`, so the panel must not use those tags at all.
         */
        it('renders code as div/span, so host code and pre rules cannot reach it', async () => {
            const { fetchMock, finish } = mockAgentStream([
                { type: 'text', content: 'Set `hiddenActions`:\n```ts\nconst a = 1;\n```' },
            ]);
            global.fetch = fetchMock as any;

            render(<DebugAgent />);
            await openPanel();
            await ask();
            await finish();

            await waitFor(() => expect(screen.getByText('ts')).toBeInTheDocument());
            const panel = document.querySelector('div[style*="2147483647"]')!;
            expect(panel.querySelectorAll('pre')).toHaveLength(0);
            expect(panel.querySelectorAll('code')).toHaveLength(0);
            // The code is still there, just in tags host CSS does not target.
            expect(panel).toHaveTextContent('const a = 1;');
            expect(panel).toHaveTextContent('hiddenActions');
        });

        it('states both background and colour on every code surface', async () => {
            // A surface that sets only one of the pair inherits the other from
            // the host, which is what left inline code light-on-light.
            const { fetchMock, finish } = mockAgentStream([
                { type: 'text', content: 'Use `init()`:\n```ts\nconst a = 1;\n```' },
            ]);
            global.fetch = fetchMock as any;
            render(<DebugAgent />);
            await openPanel();
            await ask();
            await finish();
            await waitFor(() => expect(screen.getByText('ts')).toBeInTheDocument());

            const inline = screen.getByText('init()');
            const block = codeScroller();
            [inline, block].forEach((el) => {
                expect(el.style.background || el.style.backgroundColor).toBeTruthy();
                expect(el.style.color).toBeTruthy();
            });
        });

        it('lets a long code line scroll instead of clipping it', async () => {
            const { fetchMock, finish } = mockAgentStream([
                { type: 'text', content: '```ts\nconst aVeryLongLine = "..............................................";\n```' },
            ]);
            global.fetch = fetchMock as any;
            render(<DebugAgent />);
            await openPanel();
            await ask();
            await finish();
            await waitFor(() => expect(screen.getByText('ts')).toBeInTheDocument());

            // The scroller must own overflow and must not wrap; otherwise copy
            // returns lines the panel will never show.
            const scroller = codeScroller();
            expect(scroller.style.overflowX).toBe('auto');
            expect(scroller.style.whiteSpace).toBe('pre');
            expect(scroller.style.maxWidth).toBe('100%');
        });
    });

    describe('prose rendering', () => {
        const replyWith = async (content: string) => {
            const { fetchMock, finish } = mockAgentStream([{ type: 'text', content }]);
            global.fetch = fetchMock as any;
            render(<DebugAgent />);
            await openPanel();
            await ask();
            await finish();
        };

        it('renders a markdown link as a real link, not raw markdown', async () => {
            await replyWith('See [Hide actions](https://developers.thoughtspot.com/docs/action-config) for more.');

            const link = await screen.findByRole('link', { name: 'Hide actions' });
            expect(link).toHaveAttribute('href', 'https://developers.thoughtspot.com/docs/action-config');
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
            expect(screen.queryByText(/\[Hide actions\]\(/)).not.toBeInTheDocument();
        });

        it('leaves a non-http link as plain text, so javascript: cannot ride in', async () => {
            await replyWith('Avoid [click me](javascript:alert(1)) here.');

            expect(screen.queryByRole('link')).not.toBeInTheDocument();
            const panel = document.querySelector('div[style*="2147483647"]')!;
            expect(panel).toHaveTextContent('[click me](javascript:alert(1))');
        });

        it('draws a thematic break instead of printing dashes', async () => {
            await replyWith('Answer.\n\n---\n\nDisclaimer.');

            const panel = document.querySelector('div[style*="2147483647"]')!;
            expect(panel).toHaveTextContent('Answer.');
            expect(panel).toHaveTextContent('Disclaimer.');
            expect(panel).not.toHaveTextContent('---');
        });
    });

    it('keeps the expand control visible and labelled once the turn is done', async () => {
        const { fetchMock, finish } = mockAgentStream([
            { type: 'tool-start', toolName: 'list_console_messages', toolCallId: 'c1', input: {} },
            { type: 'tool-result', toolName: 'list_console_messages', toolCallId: 'c1', output: {} },
            { type: 'text', content: 'All clear.' },
        ]);
        global.fetch = fetchMock as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();
        await finish();

        // After the stream, the card must still offer a named way into the
        // steps — a bare chevron did not read as clickable.
        const toggle = await screen.findByRole('button', { expanded: false });
        expect(toggle).toHaveTextContent('Show steps');
        expect(screen.getByText('All clear.')).toBeInTheDocument();

        fireEvent.click(toggle);
        expect(screen.getByRole('button', { expanded: true })).toHaveTextContent('Hide steps');
        expect(screen.getByText('list_console_messages')).toBeInTheDocument();
    });

    describe('debug session recording', () => {
        /**
         * Routes /extension/tool-call by tool name and /agent/embed-assistant
         * to an empty stream, so a test can drive the recording button without
         * the agent turn that stopping kicks off interfering.
         */
        const mockExtension = (results: Record<string, unknown>) => {
            const calls: Array<{ toolName: string; args: Record<string, unknown> }> = [];
            global.fetch = jest.fn().mockImplementation((url: string, init: RequestInit) => {
                if (String(url).includes('/extension/tool-call')) {
                    const body = JSON.parse(String(init.body));
                    calls.push({ toolName: body.toolName, args: body.args });
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ result: results[body.toolName] ?? {} }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    body: { getReader: () => ({ read: () => Promise.resolve({ done: true }) }) },
                });
            }) as any;
            return calls;
        };

        const FRAMES = { frames: [{ sessionId: 'FRAME_A', type: 'iframe' }] };
        const pagesFor = () => [{ tabId: 7, url: window.location.href, attached: true }];
        // Scoped to the button: the notice text also says
        // "Stop & analyse".
        const recordBtn = () => screen.getByRole('button', { name: /Record issue/ });
        const stopBtn = () => screen.getByRole('button', { name: /Stop & analyse/ });

        it('is hidden until an extension session is connected', async () => {
            render(<DebugAgent />);
            await openPanel();
            expect(screen.queryByRole('button', { name: /Record issue/ })).not.toBeInTheDocument();
        });

        it('starts recording on the tab the page is in', async () => {
            const calls = mockExtension({
                list_pages: pagesFor(),
                list_frames: FRAMES,
                start_debug_session: { started: true, sessionId: 'sess-1' },
            });

            render(<DebugAgent extensionSessionId="abc" />);
            await openPanel();
            await act(async () => { fireEvent.click(recordBtn()); });

            const start = calls.find((c) => c.toolName === 'start_debug_session');
            expect(start).toBeDefined();
            expect(start!.args).toEqual({ tabId: 7 });
            // The button flips to the stop affordance, so the developer can
            // see a recording is running.
            await waitFor(() => expect(stopBtn()).toBeInTheDocument());
            expect(screen.getByText(/Reproduce the problem/)).toBeInTheDocument();
        });

        it('reports what was captured when stopped, and asks the agent to analyse it', async () => {
            const calls = mockExtension({
                list_pages: pagesFor(),
                list_frames: FRAMES,
                start_debug_session: { started: true },
                stop_debug_session: {
                    entryCount: 312,
                    durationMs: 47000,
                    truncated: false,
                    countsByType: { 'network-failed': 2, exception: 1 },
                },
            });

            render(<DebugAgent extensionSessionId="abc" />);
            await openPanel();
            await act(async () => { fireEvent.click(recordBtn()); });
            await act(async () => { fireEvent.click(stopBtn()); });

            expect(calls.some((c) => c.toolName === 'stop_debug_session')).toBe(true);
            expect(await screen.findByText(/Captured 312 events over 47s/)).toBeInTheDocument();
            // Failures are called out: they are what the developer came for.
            expect(screen.getByText(/including 3 failures/)).toBeInTheDocument();
            // Stopping IS the request for analysis — no second click needed.
            expect(screen.getByText(/Analyse the debug session/)).toBeInTheDocument();
            expect(recordBtn()).toBeInTheDocument();
        });

        it('says so when a recording was truncated, so a partial session is not read as complete', async () => {
            mockExtension({
                list_pages: pagesFor(),
                list_frames: FRAMES,
                start_debug_session: { started: true },
                stop_debug_session: {
                    entryCount: 5000, durationMs: 120000, truncated: true, countsByType: {},
                },
            });

            render(<DebugAgent extensionSessionId="abc" />);
            await openPanel();
            await act(async () => { fireEvent.click(recordBtn()); });
            await act(async () => { fireEvent.click(stopBtn()); });

            expect(await screen.findByText(/hit its limit/)).toBeInTheDocument();
        });

        it('stays stopped and explains when the extension refuses to start', async () => {
            mockExtension({
                list_pages: pagesFor(),
                list_frames: FRAMES,
                start_debug_session: { started: false, reason: 'A debug session is already recording.' },
            });

            render(<DebugAgent extensionSessionId="abc" />);
            await openPanel();
            await act(async () => { fireEvent.click(recordBtn()); });

            expect(await screen.findByText(/already recording/)).toBeInTheDocument();
            expect(recordBtn()).toBeInTheDocument();
        });

        it('surfaces an unreachable extension rather than appearing to record', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 409,
                json: () => Promise.resolve({ error: 'No extension connected for this session' }),
            }) as any;

            render(<DebugAgent extensionSessionId="abc" />);
            await openPanel();
            await act(async () => { fireEvent.click(recordBtn()); });

            expect(await screen.findByText(/No extension connected/)).toBeInTheDocument();
            expect(recordBtn()).toBeInTheDocument();
        });
    });

    it('surfaces a failed agent request as a message rather than failing silently', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false, status: 500, statusText: 'Server Error', body: null,
        }) as any;

        render(<DebugAgent />);
        await openPanel();
        await ask();

        expect(await screen.findByText(/Agent request failed: 500/)).toBeInTheDocument();
    });
});
