import { AutoMCPFrameRendererViewConfig, Param } from "../types";
import { TsEmbed } from "./ts-embed";
import { getQueryParamString } from "../utils";
import { tokenizedFetch } from "../tokenizedFetch";
import { logger } from "../utils/logger";

/**
 * Route the ThoughtSpot application uses to render a single conversational
 * answer. Used when a replayed frame carries no route of its own.
 */
const CONV_ASSIST_ANSWER_ROUTE = '/embed/conv-assist-answer';

const DEFAULT_STALE_ANSWER_NOTICE =
    'This data may have changed since the last time you had a chat.';

/**
 * Hash parameters that locate a specific answer generation. These expire with
 * the answer object (roughly 8 hours), which is why a host app replaying a
 * stored conversation must not persist them - it stores the conversation
 * identifier instead and lets the renderer resolve these afresh.
 */
interface AnswerSessionParams {
    sessionId: string;
    genNo: string;
    acSessionId: string;
    acGenNo: string;
}


/**
 * Starts an automatic renderer that watches the DOM for iframes containing
 * the `tsmcp=true` query parameter and replaces them with fully configured
 * ThoughtSpot embed iframes. The query parameter is automatically added by
 * the ThoughtSpot MCP server.
 *
 * A {@link MutationObserver} is set up on `document.body` to detect both
 * directly added iframes and iframes nested within added container elements.
 * Each matching iframe is replaced in-place with a new ThoughtSpot embed
 * iframe that merges the original iframe's query parameters with the SDK
 * embed parameters.
 *
 * Call {@link MutationObserver.disconnect | observer.disconnect()} on the
 * returned observer to stop monitoring the DOM.
 *
 * @param viewConfig - Optional configuration for the auto-rendered embeds.
 *   Accepts all properties from {@link AutoMCPFrameRendererViewConfig}.
 *   Defaults to an empty config.
 * @returns A {@link MutationObserver} instance that is actively observing
 *   `document.body`. Disconnect it when monitoring is no longer needed.
 *
 * @example
 * ```js
 * import { startAutoMCPFrameRenderer } from '@thoughtspot/visual-embed-sdk';
 *
 * // Start watching the DOM for tsmcp iframes
 * const observer = startAutoMCPFrameRenderer({
 *   // optional view config overrides
 * });
 *
 * // Later, stop watching
 * observer.disconnect();
 * ```
 * 
 * @example
 * Detailed example of how to use the auto-frame renderer:
 * [Python React Agent Simple UI](https://github.com/thoughtspot/developer-examples/tree/main/mcp/python-react-agent-simple-ui)
 */
export function startAutoMCPFrameRenderer(viewConfig: AutoMCPFrameRendererViewConfig = {}) {

    const replaceWithMCPIframe = (iframe: HTMLIFrameElement) => {
        const autoMCPFrameRenderer = new AutoFrameRenderer(viewConfig);
        autoMCPFrameRenderer.replaceIframe(iframe);
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.addedNodes)) {
                if (node instanceof HTMLIFrameElement && isTSMCPIframe(node)) {
                    replaceWithMCPIframe(node);
                }
                if (node instanceof HTMLElement) {
                    node.querySelectorAll('iframe').forEach((iframe) => {
                        if (isTSMCPIframe(iframe)) {
                            replaceWithMCPIframe(iframe);
                        }
                    });
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return observer;
}

/**
 * Writes resolved session parameters into the route's hash query string,
 * preserving the route and any other hash params the source URL carried.
 *
 * @param sourceHash - The source URL's hash, with or without a leading `#`.
 *   Falls back to the conversational-answer route when empty, so a host app
 *   replaying a chat need only supply the conversation identifier.
 */
function buildAnswerHash(sourceHash: string, resolved: AnswerSessionParams): string {
    const withoutHash = (sourceHash || '').replace('#', '');
    const [route, existingQuery] = withoutHash.split('?');
    const params = new URLSearchParams(existingQuery || '');
    Object.entries(resolved).forEach(([key, value]) => params.set(key, value));
    return `${route || CONV_ASSIST_ANSWER_ROUTE}?${params.toString()}`;
}

/**
 * Reads {@link Param.TsmcpAnswerIndex} as a whole, non-negative array index.
 *
 * Anything else - absent, malformed, fractional, negative - falls back to the
 * first answer rather than indexing with a value that can never match.
 */
function answerIndexFromParam(raw: string | null): number {
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function isTSMCPIframe(iframe: HTMLIFrameElement) {
    try {
        const url = new URL(iframe.src);
        return url.searchParams.get(Param.Tsmcp) === 'true';
    } catch (e) {
        // The iframe src might not be a valid URL (e.g., 'about:blank').
        return false;
    }
}

/**
 * Embed component that automatically replaces a plain iframe with a
 * ThoughtSpot embed iframe. It merges the SDK's embed parameters with
 * the original iframe's query parameters (stripping the `tsmcp` marker)
 * and swaps the original iframe element in the DOM.
 *
 * This class is used internally by {@link startAutoMCPFrameRenderer} and
 * is not intended to be instantiated directly.
 */
class AutoFrameRenderer extends TsEmbed {
    private frameToReplace: HTMLIFrameElement;

    constructor(protected viewConfig: AutoMCPFrameRendererViewConfig) {
        viewConfig.embedComponentType = 'auto-frame-renderer';
        const container = document.createElement('div');
        super(container, viewConfig);
    }

    /**
     * Builds the final iframe `src` by merging the SDK embed parameters
     * with the query parameters already present on the source iframe URL.
     * The `tsmcp` marker param is removed so it does not propagate to the
     * ThoughtSpot application.
     *
     * @param sourceSrc - The original iframe's `src` URL string.
     * @returns The constructed URL to use for the ThoughtSpot embed iframe.
     */
    private getMCPIframeSrc(sourceSrc: string, resolved?: AnswerSessionParams) {
        const queryParams = this.getEmbedParamsObject();
        const sourceURL = new URL(sourceSrc);
        const existingQueryParams = sourceURL.searchParams;
        const existingQueryParamsObject = Object.fromEntries(existingQueryParams);
        delete existingQueryParamsObject[Param.Tsmcp];
        // Replay markers address the SDK, not the ThoughtSpot application.
        delete existingQueryParamsObject[Param.TsmcpConversationId];
        delete existingQueryParamsObject[Param.TsmcpAnswerIndex];

        const mergedQueryParams = { ...queryParams, ...existingQueryParamsObject };
        const mergedQueryParamsString = getQueryParamString(mergedQueryParams, true);
        const queryString = mergedQueryParamsString ? `?${mergedQueryParamsString}` : '';
        const hash = resolved
            ? buildAnswerHash(sourceURL.hash, resolved)
            : sourceURL.hash.replace('#', '');
        const frameSrc = `${this.getEmbedBasePath(queryString)}${hash}`;
        return frameSrc;
    }

    /**
     * Resolves the current session parameters for an answer stored only as a
     * conversation identifier plus an ordinal position.
     *
     * The answer object behind `sessionId`/`genNo` expires (roughly 8 hours),
     * so a host app replaying a stored chat cannot persist those values. It
     * persists the conversation identifier instead, and this walks the two
     * public APIs to rebuild them:
     *
     * 1. `getConversation` lists the conversation's messages; the non-thinking
     *    `answer` items, in message order, give the answer ids.
     * 2. `loadAnswer` turns the answer id at `answerIndex` into a live
     *    session identifier, generation number and agent-context state.
     *
     * @returns The resolved parameters, or `null` when resolution fails - the
     *   caller then falls back to whatever the source URL already carried.
     */
    private async resolveAnswerSessionParams(
        conversationId: string,
        answerIndex: number,
    ): Promise<AnswerSessionParams | null> {
        const base = `${this.thoughtSpotHost}/api/rest/2.0/ai/agent/conversations/${encodeURIComponent(conversationId)}`;
        try {
            const messagesResponse = await tokenizedFetch(`${base}/messages`, {
                headers: { Accept: 'application/json' },
            });
            if (!messagesResponse.ok) {
                logger.warn(
                    `[AutoFrameRenderer] getConversation failed for ${conversationId}: ${messagesResponse.status}`,
                );
                return null;
            }
            const messagesBody = await messagesResponse.json();
            const messages = messagesBody?.messages;

            // Ordinal match: the host app counts answers the same way, so the
            // Nth non-thinking answer item here is the Nth stored answer.
            const answerIds: string[] = [];
            for (const message of Array.isArray(messages) ? messages : []) {
                for (const item of message?.response_items || []) {
                    if (item?.type === 'answer' && item?.is_thinking === false && item?.answer_id) {
                        answerIds.push(item.answer_id);
                    }
                }
            }

            const answerId = answerIds[answerIndex];
            if (!answerId) {
                logger.warn(
                    `[AutoFrameRenderer] No answer at index ${answerIndex} in conversation ${conversationId} (found ${answerIds.length}).`,
                );
                return null;
            }

            const detailsResponse = await tokenizedFetch(
                `${base}/answers/${encodeURIComponent(answerId)}/details`,
                { headers: { Accept: 'application/json' } },
            );
            if (!detailsResponse.ok) {
                logger.warn(
                    `[AutoFrameRenderer] loadAnswer failed for ${answerId}: ${detailsResponse.status}`,
                );
                return null;
            }
            const detailsBody = await detailsResponse.json();
            const answer = detailsBody?.answer;
            const acState = answer?.ac_state;
            // All four are nullable in the loadAnswer response. A missing
            // generation number is as unusable as a missing session id:
            // stringifying it would put a literal "null" in the hash. Fail
            // the resolve instead and let the caller fall back.
            if (
                !answer?.session_identifier
                || !acState?.transaction_identifier
                || !(Number.isInteger(answer.generation_number) && answer.generation_number > 0)
                || !(Number.isInteger(acState.generation_number) && acState.generation_number > 0)
            ) {
                logger.warn(
                    `[AutoFrameRenderer] loadAnswer returned incomplete session state for ${answerId}.`,
                );
                return null;
            }

            return {
                sessionId: answer.session_identifier,
                genNo: String(answer.generation_number),
                acSessionId: acState.transaction_identifier,
                acGenNo: String(acState.generation_number),
            };
        } catch (e) {
            logger.warn(`[AutoFrameRenderer] Failed to resolve stored answer: ${e}`);
            return null;
        }
    }

    /**
     * Overrides the base insertion behavior so the new embed iframe
     * replaces the original iframe in-place rather than being appended
     * to a container element. Falls back to the default behavior when
     * no iframe has been set for replacement.
     */
    protected handleInsertionIntoDOM(child: string | Node): void {
        if (this.frameToReplace) {
            this.frameToReplace.replaceWith(child);
        } else {
            super.handleInsertionIntoDOM(child);
        }
    }

    /**
     * Replaces the given iframe with a new ThoughtSpot embed iframe.
     *
     * The original iframe's `src` is used to derive the embed URL, and
     * once the new iframe is rendered it takes the original's place in
     * the DOM tree.
     *
     * @param iframe - The existing `<iframe>` element to replace.
     */
    public async replaceIframe(iframe: HTMLIFrameElement): Promise<void> {
        this.frameToReplace = iframe;
        if (this.shouldWaitForRenderPromise) {
            await this.isReadyForRenderPromise;
        }

        // Only frames that ask for it take the replay path. A frame straight
        // from the MCP server carries its own session params and no
        // conversation id, so it renders exactly as it always has.
        const sourceParams = new URL(iframe.src).searchParams;
        const conversationId = sourceParams.get(Param.TsmcpConversationId);
        let resolved: AnswerSessionParams | null = null;
        if (conversationId) {
            resolved = await this.resolveAnswerSessionParams(
                conversationId,
                answerIndexFromParam(sourceParams.get(Param.TsmcpAnswerIndex)),
            );
        }

        const src = this.getMCPIframeSrc(iframe.src, resolved ?? undefined);
        await this.renderIFrame(src);

        // Mark only answers actually re-resolved: their numbers were computed
        // now, not when the conversation happened.
        if (resolved && !this.viewConfig.suppressStaleAnswerNotice) {
            this.markAsStaleAnswer();
        }
        this.isRendered = true;
    }

    /**
     * Adds the "data may have changed" notice to the rendered frame as a
     * native tooltip, so it needs no stylesheet and cannot disturb the host
     * app's layout.
     */
    private markAsStaleAnswer(): void {
        if (!this.iFrame) {
            return;
        }
        this.iFrame.title = this.viewConfig.staleAnswerNoticeText || DEFAULT_STALE_ANSWER_NOTICE;
        // Exposed so a host app can style or replace the native tooltip.
        this.iFrame.dataset.tsStaleAnswer = 'true';
    }
}

