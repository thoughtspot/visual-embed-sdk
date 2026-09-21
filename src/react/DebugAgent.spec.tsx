import React from 'react';
import '@testing-library/jest-dom';
import {
    fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { DebugAgent } from './DebugAgent';
import { setEmbedConfig } from '../embed/embedConfig';
import { storeValueInWindow, resetValueFromWindow } from '../utils';

/**
 * Builds a fetch Response-like object whose `body` is a real ReadableStream
 * emitting the given SSE-framed chunks, matching what `DebugAgent` reads via
 * `response.body.getReader()`.
 */
function sseResponse(chunks: string[], opts: { ok?: boolean; status?: number } = {}) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
            controller.close();
        },
    });
    return {
        ok: opts.ok ?? true,
        status: opts.status ?? 200,
        statusText: opts.status === 500 ? 'Internal Server Error' : 'OK',
        body: stream,
    } as unknown as Response;
}

const sse = (event: Record<string, unknown>) => `data: ${JSON.stringify(event)}\n\n`;

describe('DebugAgent', () => {
    beforeEach(() => {
        storeValueInWindow('embedConfig', undefined);
        resetValueFromWindow('embedConfig');
        (global as any).fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders nothing when enableDebugAgent is not set', () => {
        setEmbedConfig({} as any);
        const { container } = render(<DebugAgent />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when enableDebugAgent is explicitly false', () => {
        setEmbedConfig({ enableDebugAgent: false } as any);
        const { container } = render(<DebugAgent />);
        expect(container).toBeEmptyDOMElement();
    });

    describe('when enableDebugAgent is true', () => {
        beforeEach(() => {
            setEmbedConfig({ enableDebugAgent: true } as any);
        });

        it('shows a launcher button and no panel initially', () => {
            render(<DebugAgent />);
            expect(screen.getByLabelText('Open Debug Agent')).toBeInTheDocument();
            expect(screen.queryByText('Debug Agent')).not.toBeInTheDocument();
        });

        it('opens the panel with a welcome state and closes it again', () => {
            render(<DebugAgent />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));

            expect(screen.getByText('Debug Agent')).toBeInTheDocument();
            expect(screen.getByText('How can I help with this embed?')).toBeInTheDocument();
            expect(screen.getByText('Ready')).toBeInTheDocument();

            fireEvent.click(screen.getByLabelText('Close'));
            expect(screen.queryByText('Debug Agent')).not.toBeInTheDocument();
            expect(screen.getByLabelText('Open Debug Agent')).toBeInTheDocument();
        });

        it('sends a message and streams the assistant reply, including tool events', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce(
                sseResponse([
                    sse({ type: 'trace', traceId: 't1' }),
                    sse({
                        type: 'tool-start', toolName: 'inspect_network', toolCallId: 'tc1', input: {},
                    }),
                    sse({ type: 'text', content: 'The ' }),
                    sse({ type: 'text', content: 'request failed with a 403.' }),
                    sse({ type: 'tool-result', toolCallId: 'tc1', output: {} }),
                    sse({ type: 'done' }),
                ]),
            );

            render(<DebugAgent agentApiUrl="https://agent.example.com" />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));

            const textarea = screen.getByPlaceholderText('Ask about this embed, or describe a style change…');
            fireEvent.change(textarea, { target: { value: 'Why did my liveboard fail to load?' } });
            fireEvent.click(screen.getByLabelText('Send'));

            expect(screen.getByText('Why did my liveboard fail to load?')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByText('The request failed with a 403.')).toBeInTheDocument();
            });
            expect(screen.getByText('inspect_network')).toBeInTheDocument();
            expect(screen.getByText('Ready')).toBeInTheDocument();

            expect(global.fetch).toHaveBeenCalledWith(
                'https://agent.example.com/agent/embed-assistant',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }),
            );
            const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(body.agentType).toBe('visual-embed-sdk');
            expect(body.messages[0]).toEqual({
                role: 'user',
                content: 'Why did my liveboard fail to load?',
            });
        });

        it('sends the extensionSessionId when provided', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce(sseResponse([sse({ type: 'done' })]));
            render(<DebugAgent extensionSessionId="ext-123" />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));

            fireEvent.change(
                screen.getByPlaceholderText('Ask about this embed, or describe a style change…'),
                { target: { value: 'hi' } },
            );
            fireEvent.click(screen.getByLabelText('Send'));

            await waitFor(() => expect(global.fetch).toHaveBeenCalled());
            const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(body.extensionSessionId).toBe('ext-123');
        });

        it('shows an error bubble when the response is not ok', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce(
                sseResponse([], { ok: false, status: 500 }),
            );
            render(<DebugAgent />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));

            fireEvent.change(
                screen.getByPlaceholderText('Ask about this embed, or describe a style change…'),
                { target: { value: 'trigger failure' } },
            );
            fireEvent.click(screen.getByLabelText('Send'));

            await waitFor(() => {
                expect(screen.getByText(/Agent request failed: 500/)).toBeInTheDocument();
            });
        });

        it('shows an error bubble when fetch rejects', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));
            render(<DebugAgent />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));

            fireEvent.change(
                screen.getByPlaceholderText('Ask about this embed, or describe a style change…'),
                { target: { value: 'trigger failure' } },
            );
            fireEvent.click(screen.getByLabelText('Send'));

            await waitFor(() => {
                expect(screen.getByText(/Request failed: network down/)).toBeInTheDocument();
            });
        });

        it('renders an inline error event from the stream', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce(
                sseResponse([sse({ type: 'error', content: 'agent exploded' }), sse({ type: 'done' })]),
            );
            render(<DebugAgent />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));

            fireEvent.change(
                screen.getByPlaceholderText('Ask about this embed, or describe a style change…'),
                { target: { value: 'hi' } },
            );
            fireEvent.click(screen.getByLabelText('Send'));

            await waitFor(() => {
                expect(screen.getByText(/agent exploded/)).toBeInTheDocument();
            });
        });

        it('does not send an empty or whitespace-only message', () => {
            render(<DebugAgent />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));
            const sendBtn = screen.getByLabelText('Send');
            expect(sendBtn).toBeDisabled();

            fireEvent.change(
                screen.getByPlaceholderText('Ask about this embed, or describe a style change…'),
                { target: { value: '   ' } },
            );
            expect(screen.getByLabelText('Send')).toBeDisabled();
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('sends the message on Enter and inserts a newline on Shift+Enter', () => {
            (global.fetch as jest.Mock).mockResolvedValue(sseResponse([sse({ type: 'done' })]));
            render(<DebugAgent />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));
            const textarea = screen.getByPlaceholderText('Ask about this embed, or describe a style change…') as HTMLTextAreaElement;

            fireEvent.change(textarea, { target: { value: 'first line' } });
            fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
            expect(global.fetch).not.toHaveBeenCalled();

            fireEvent.change(textarea, { target: { value: 'send me' } });
            fireEvent.keyDown(textarea, { key: 'Enter' });
            expect(global.fetch).toHaveBeenCalled();
        });

        it('lets the developer pick an element and attaches it as chat context, then remove it', async () => {
            render(
                <div>
                    <button type="button" id="target-el" className="my-widget">Target</button>
                    <DebugAgent />
                </div>,
            );
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));
            fireEvent.click(screen.getByText('Pick an element'));
            expect(screen.getByText('Picking…')).toBeInTheDocument();

            const target = document.getElementById('target-el') as HTMLElement;
            jest.spyOn(document, 'elementFromPoint').mockReturnValue(target);

            fireEvent.mouseMove(document, { clientX: 5, clientY: 5 });
            fireEvent.click(document, { clientX: 5, clientY: 5 });

            expect(await screen.findByText(/button#target-el\.my-widget/)).toBeInTheDocument();
            expect(screen.queryByText('Picking…')).not.toBeInTheDocument();

            fireEvent.click(screen.getByLabelText('Remove context'));
            expect(screen.queryByText(/button#target-el\.my-widget/)).not.toBeInTheDocument();
        });

        it('ignores clicks inside its own panel while picking', () => {
            render(<DebugAgent />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));
            fireEvent.click(screen.getByText('Pick an element'));

            const closeBtn = screen.getByLabelText('Close');
            jest.spyOn(document, 'elementFromPoint').mockReturnValue(closeBtn);
            fireEvent.click(document, { clientX: 1, clientY: 1 });

            // Still picking — the click hit the panel itself and was ignored.
            expect(screen.getByText('Picking…')).toBeInTheDocument();
        });

        it('renders markdown-ish content: bold, inline code, and bullet lists', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce(
                sseResponse([
                    sse({ type: 'text', content: '**bold** and `code` and\n- a bullet\n- another' }),
                    sse({ type: 'done' }),
                ]),
            );
            render(<DebugAgent />);
            fireEvent.click(screen.getByLabelText('Open Debug Agent'));
            fireEvent.change(
                screen.getByPlaceholderText('Ask about this embed, or describe a style change…'),
                { target: { value: 'format test' } },
            );
            fireEvent.click(screen.getByLabelText('Send'));

            await waitFor(() => expect(screen.getByText('bold')).toBeInTheDocument());
            expect(screen.getByText('code')).toBeInTheDocument();
            expect(screen.getByText('a bullet', { exact: false })).toBeInTheDocument();
        });
    });
});
