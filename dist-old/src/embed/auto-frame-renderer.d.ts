import { AutoMCPFrameRendererViewConfig } from "../types";
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
export declare function startAutoMCPFrameRenderer(viewConfig?: AutoMCPFrameRendererViewConfig): MutationObserver;
//# sourceMappingURL=auto-frame-renderer.d.ts.map