import { AutoMCPFrameRendererViewConfig, Param } from "../types";
import { TsEmbed } from "./ts-embed";
import { getQueryParamString } from "../utils";


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

function isTSMCPIframe(iframe: HTMLIFrameElement) {
    const src = iframe.src;
    return src.includes(`${Param.Tsmcp}=true`);
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
    private getMCPIframeSrc(sourceSrc: string) {
        const queryParams = this.getEmbedParamsObject();
        const sourceURL = new URL(sourceSrc);
        const existingQueryParams = sourceURL.searchParams;
        const existingQueryParamsObject = Object.fromEntries(existingQueryParams);
        delete existingQueryParamsObject[Param.Tsmcp];

        const mergedQueryParams = { ...queryParams, ...existingQueryParamsObject };
        const mergedQueryParamsString = getQueryParamString(mergedQueryParams);
        const frameSrc = `${sourceURL.origin}${sourceURL.pathname}?${mergedQueryParamsString}/${sourceURL.hash}`;
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
        const src = this.getMCPIframeSrc(iframe.src);
        await this.renderIFrame(src);
    }
}

