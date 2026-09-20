/**
 * Floating debug-agent widget for the local embed test harness. Injects a
 * chat panel directly onto the page that has the real ThoughtSpot embed,
 * talking to the real /agent/embed-assistant API (ask-docs, same as
 * production), with extensionSessionId wired through so the agent can use
 * the browser extension's chrome.debugger tools against THIS page and its
 * embedded iframe — not a separate test tab.
 *
 * Local-testing scaffolding for the embed-ai repo's debug-agent plan
 * (an eventual `init()` flag would show something like this conditionally in
 * production) — not itself part of the SDK's public API.
 */

const AGENT_API_ORIGIN = 'http://localhost:8000';
const SESSION_STORAGE_KEY = 'spottercode-extension-session-id';

function getStoredSessionId(): string | null {
	try {
		return localStorage.getItem(SESSION_STORAGE_KEY);
	} catch {
		return null;
	}
}

function setStoredSessionId(id: string) {
	try {
		localStorage.setItem(SESSION_STORAGE_KEY, id);
	} catch {
		// ignore — worst case the user re-pastes it next reload
	}
}

function toSseEvents(buffer: string): { events: unknown[]; rest: string } {
	const parts = buffer.split('\n\n');
	const rest = parts.pop() ?? '';
	const events = parts
		.filter((p) => p.startsWith('data: '))
		.map((p) => JSON.parse(p.slice(6)));
	return { events, rest };
}

export function mountAgentWidget() {
	const root = document.createElement('div');
	root.id = 'spottercode-agent-widget';
	root.innerHTML = `
		<style>
			#spottercode-agent-widget {
				position: fixed;
				bottom: 16px;
				right: 16px;
				width: 360px;
				height: 480px;
				background: #0d1117;
				color: #e6edf3;
				border: 1px solid #30363d;
				border-radius: 10px;
				display: flex;
				flex-direction: column;
				font-family: -apple-system, BlinkMacSystemFont, sans-serif;
				font-size: 13px;
				box-shadow: 0 8px 24px rgba(0,0,0,0.4);
				z-index: 999999;
			}
			#spottercode-agent-widget .header {
				padding: 10px 12px;
				border-bottom: 1px solid #30363d;
				font-weight: 600;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			#spottercode-agent-widget .session-row {
				padding: 6px 12px;
				border-bottom: 1px solid #30363d;
				display: flex;
				gap: 6px;
			}
			#spottercode-agent-widget .session-row input {
				flex: 1;
				background: #161b22;
				color: #e6edf3;
				border: 1px solid #30363d;
				border-radius: 4px;
				padding: 4px 6px;
				font-size: 11px;
			}
			#spottercode-agent-widget .messages {
				flex: 1;
				overflow-y: auto;
				padding: 10px;
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			#spottercode-agent-widget .msg { padding: 6px 8px; border-radius: 6px; white-space: pre-wrap; }
			#spottercode-agent-widget .msg.user { background: #1f6feb33; align-self: flex-end; max-width: 85%; }
			#spottercode-agent-widget .msg.assistant { background: #21262d; align-self: flex-start; max-width: 90%; }
			#spottercode-agent-widget .tool { font-size: 11px; font-family: monospace; color: #d29922; align-self: flex-start; }
			#spottercode-agent-widget form { display: flex; gap: 6px; padding: 8px; border-top: 1px solid #30363d; }
			#spottercode-agent-widget textarea {
				flex: 1;
				resize: none;
				background: #161b22;
				color: #e6edf3;
				border: 1px solid #30363d;
				border-radius: 6px;
				padding: 6px 8px;
				font-family: inherit;
				font-size: 12px;
			}
			#spottercode-agent-widget button {
				background: #238636;
				color: white;
				border: none;
				border-radius: 6px;
				padding: 0 12px;
				cursor: pointer;
			}
		</style>
		<div class="header">
			<span>SpotterCode Debug Agent</span>
		</div>
		<div class="session-row">
			<input id="sc-session-id" placeholder="Extension session ID (from popup)" />
		</div>
		<div class="messages" id="sc-messages"></div>
		<form id="sc-form">
			<textarea id="sc-input" rows="2" placeholder="Ask about this embed..."></textarea>
			<button type="submit">Send</button>
		</form>
	`;
	document.body.appendChild(root);

	const messagesEl = root.querySelector('#sc-messages') as HTMLDivElement;
	const form = root.querySelector('#sc-form') as HTMLFormElement;
	const input = root.querySelector('#sc-input') as HTMLTextAreaElement;
	const sessionInput = root.querySelector('#sc-session-id') as HTMLInputElement;

	const storedId = getStoredSessionId();
	if (storedId) sessionInput.value = storedId;
	sessionInput.addEventListener('change', () => setStoredSessionId(sessionInput.value.trim()));

	const history: { role: 'user' | 'assistant'; content: string }[] = [];

	function addBubble(role: 'user' | 'assistant', text: string) {
		const el = document.createElement('div');
		el.className = `msg ${role}`;
		el.textContent = text;
		messagesEl.appendChild(el);
		messagesEl.scrollTop = messagesEl.scrollHeight;
		return el;
	}

	function addToolLine(toolName: string) {
		const el = document.createElement('div');
		el.className = 'tool';
		el.textContent = `🔧 ${toolName}`;
		messagesEl.appendChild(el);
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const text = input.value.trim();
		if (!text) return;
		input.value = '';
		addBubble('user', text);
		history.push({ role: 'user', content: text });

		let assistantEl: HTMLDivElement | null = null;
		let assistantText = '';

		try {
			const response = await fetch(`${AGENT_API_ORIGIN}/agent/embed-assistant`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					agentType: 'ask-docs',
					messages: history,
					extensionSessionId: sessionInput.value.trim() || undefined,
				}),
			});
			const reader = response.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const { events, rest } = toSseEvents(buffer);
				buffer = rest;
				for (const event of events as Array<Record<string, unknown>>) {
					if (event.type === 'text') {
						if (!assistantEl) assistantEl = addBubble('assistant', '');
						assistantText += event.content as string;
						assistantEl.textContent = assistantText;
						messagesEl.scrollTop = messagesEl.scrollHeight;
					} else if (event.type === 'tool-start') {
						addToolLine(event.toolName as string);
					}
				}
			}
			if (assistantText) history.push({ role: 'assistant', content: assistantText });
		} catch (err) {
			addBubble('assistant', `Request failed: ${(err as Error).message}`);
		}
	});
}
