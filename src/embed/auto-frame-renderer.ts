import { Action, AutoMCPFrameRendererViewConfig, Param } from "../types";
import { TsEmbed } from "./ts-embed";
import { getQueryParamString } from "../utils";

/**
 * Actions hidden by default on Answers rendered by the ThoughtSpot MCP server
 * (iframes carrying the `tsmcp=true` marker). Applied automatically by
 * {@link AutoFrameRenderer} so the auto-rendered answer exposes a curated set of
 * controls: Pin/Save/Download at the top level, Aggregate/Filter/Sort/Position in
 * the column menu, and Exclude/Only include/Drill down/Show underlying data in the
 * axis menu remain visible, while the actions below are removed.
 *
 * This is a denylist merged into {@link Param.HideActions}; anything not listed
 * here stays visible. It is skipped when the caller supplies a `visibleActions`
 * allowlist (see {@link AutoFrameRenderer.getEmbedParamsObject}).
 */
export const HiddenActionItemByDefaultForMCPAnswers = [
    Action.Edit,
    Action.InConversationTraining, // Add to Coaching
    Action.AxisMenuConditionalFormat,
    Action.AxisMenuRename,
    Action.AxisMenuEdit,
    Action.AxisMenuRemove,
];


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
 * Normalizes a `hideAction` value into an array of action ids. The SDK-side value
 * is already an `Action[]`; a value coming off the source iframe URL is a string
 * that may be a JSON array (`["edit","save"]`) or a comma-separated list.
 */
function parseHideActions(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value as string[];
    }
    if (typeof value !== 'string' || value === '') {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.map(String);
        }
    } catch (e) {
        // Not JSON — fall back to a comma-separated list.
    }
    return value.split(',').filter(Boolean);
}

/**
 * Unions two `hideAction` values (SDK-computed and source-iframe) into a single
 * de-duplicated array of action ids.
 */
function unionHideActions(sdkValue: unknown, sourceValue: unknown): string[] {
    return Array.from(
        new Set([...parseHideActions(sdkValue), ...parseHideActions(sourceValue)]),
    );
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
     * Extends the base embed params with the curated MCP-answer denylist
     * ({@link HiddenActionItemByDefaultForMCPAnswers}).
     *
     * Precedence — merge, allowlist wins:
     * - When the caller supplies a `visibleActions` allowlist, the base already
     *   set {@link Param.VisibleActions}; the denylist is skipped so the allowlist
     *   fully controls visibility.
     * - Otherwise the denylist is unioned onto {@link Param.HideActions}, which the
     *   base has already populated with the default hidden actions plus any
     *   caller-supplied `hiddenActions`.
     */
    protected getEmbedParamsObject() {
        const queryParams = super.getEmbedParamsObject();
        if (!queryParams[Param.VisibleActions]) {
            queryParams[Param.HideActions] = [
                ...(queryParams[Param.HideActions] ?? []),
                ...HiddenActionItemByDefaultForMCPAnswers,
            ];
        }
        return queryParams;
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
    private getMCPIframeSrc(sourceSrc: string) {
        const queryParams = this.getEmbedParamsObject();
        const sourceURL = new URL(sourceSrc);
        const existingQueryParams = sourceURL.searchParams;
        const existingQueryParamsObject = Object.fromEntries(existingQueryParams);
        delete existingQueryParamsObject[Param.Tsmcp];

        // Source-iframe params win over SDK params on merge. Hidden actions
        // are the exception: union them so a `hideAction` on the source iframe
        // does not clobber the SDK-computed denylist (and vice versa).
        const mergedHideActions = unionHideActions(
            queryParams[Param.HideActions],
            existingQueryParamsObject[Param.HideActions],
        );
        delete existingQueryParamsObject[Param.HideActions];

        const mergedQueryParams = { ...queryParams, ...existingQueryParamsObject };
        if (mergedHideActions.length) {
            mergedQueryParams[Param.HideActions] = mergedHideActions;
        }
        const mergedQueryParamsString = getQueryParamString(mergedQueryParams, true);
        const queryString = mergedQueryParamsString ? `?${mergedQueryParamsString}` : '';
        const frameSrc = `${this.getEmbedBasePath(queryString)}${sourceURL.hash.replace('#', '')}`;
        return frameSrc;
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
        const src = this.getMCPIframeSrc(iframe.src);
        await this.renderIFrame(src);
        this.isRendered = true;
    }
}

