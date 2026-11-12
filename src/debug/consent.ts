/**
 * Consent prompt and session banner for full page diagnostics.
 *
 * Rendered in a shadow root attached to <body>, so the host page's CSS
 * cannot hide or restyle it, and it still works when the embed itself is
 * blank or broken.
 */
import { DiagnosticsTrigger } from './types';

const HOST_ID = 'ts-diagnostics-consent';

const STYLES = `
:host { all: initial; }
.card { position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; width: 360px;
  box-sizing: border-box; padding: 16px; border-radius: 12px; background: #fff; color: #1d232f;
  font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
  box-shadow: 0 8px 28px rgba(0,0,0,.18); border: 1px solid #dde1e7; }
.title { font-weight: 600; font-size: 14px; margin: 0 0 6px; }
.body { margin: 0 0 10px; color: #4a5160; }
ul { margin: 0 0 12px; padding-left: 18px; color: #4a5160; }
.row { display: flex; gap: 8px; justify-content: flex-end; }
button { font: inherit; border-radius: 8px; padding: 6px 14px; cursor: pointer; border: 1px solid #c9ced6;
  background: #fff; color: #1d232f; }
button.primary { background: #2770ef; border-color: #2770ef; color: #fff; }
.banner { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 2147483647;
  display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 999px;
  background: #1d232f; color: #fff; font: 12px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
  box-shadow: 0 6px 20px rgba(0,0,0,.25); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #3ccb7f; }
.code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .5px; }
.banner button { padding: 3px 10px; border-color: #4a5160; background: transparent; color: #fff; }
`;

const REASONS: Record<DiagnosticsTrigger, string> = {
    manual: 'ThoughtSpot Support has asked to look at this page to help fix a problem.',
    'on-init': 'Page diagnostics are enabled for this page.',
    'embed-load-timeout': 'The embedded ThoughtSpot content did not finish loading.',
    'auth-failure': 'The embedded ThoughtSpot content could not sign in.',
    'embed-error': 'The embedded ThoughtSpot content reported an error.',
};

const mountShadow = (): ShadowRoot => {
    let host = document.getElementById(HOST_ID);
    if (!host) {
        host = document.createElement('div');
        host.id = HOST_ID;
        document.body.appendChild(host);
    }
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLES}</style>`;
    return root;
};

const unmount = (): void => {
    document.getElementById(HOST_ID)?.remove();
};

/**
 * Asks the user to share page diagnostics. Resolves true on Allow.
 * @param trigger
 */
export function showConsentPrompt(trigger: DiagnosticsTrigger): Promise<boolean> {
    return new Promise((resolve) => {
        const root = mountShadow();
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-label', 'Share page diagnostics');
        card.innerHTML = `
            <p class="title">Share page diagnostics with ThoughtSpot?</p>
            <p class="body"></p>
            <ul>
              <li>Console messages, errors and network calls on this page</li>
              <li>Page layout and styles around the embedded content</li>
              <li>Secrets, tokens and emails are removed before sending</li>
            </ul>
            <p class="body">Sharing stops after 30 minutes or when you click End.</p>
            <div class="row">
              <button type="button" data-action="deny">Don't share</button>
              <button type="button" class="primary" data-action="allow">Allow</button>
            </div>`;
        (card.querySelector('.body') as HTMLElement).textContent = REASONS[trigger];
        card.addEventListener('click', (event) => {
            const action = (event.target as HTMLElement).getAttribute('data-action');
            if (!action) return;
            unmount();
            resolve(action === 'allow');
        });
        root.appendChild(card);
    });
}

/**
 * Shows the "session active" banner. Returns a function that removes it.
 * @param sessionId
 * @param expiresAt
 * @param onEnd
 */
export function showSessionBanner(
    sessionId: string,
    expiresAt: number,
    onEnd: () => void,
): () => void {
    const root = mountShadow();
    const banner = document.createElement('div');
    banner.className = 'banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `<span class="dot"></span><span>Sharing page diagnostics</span>
        <span class="code"></span><span class="left"></span>
        <button type="button" data-action="end">End</button>`;
    (banner.querySelector('.code') as HTMLElement).textContent = sessionId;
    const left = banner.querySelector('.left') as HTMLElement;
    const tick = () => {
        const minutes = Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));
        left.textContent = `· ${minutes} min left`;
    };
    tick();
    const timer = setInterval(tick, 30000);
    banner.addEventListener('click', (event) => {
        if ((event.target as HTMLElement).getAttribute('data-action') === 'end') onEnd();
    });
    root.appendChild(banner);
    return () => {
        clearInterval(timer);
        unmount();
    };
}
