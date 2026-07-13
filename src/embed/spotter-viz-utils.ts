import { DefaultAppInitData } from '../types';

/**
 * Defines starter prompts displayed in the SpotterViz interface.
 * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
 * @group Embed components
 */
export interface SpotterVizStarterPrompt {
    /** Identifier for the prompt. */
    id: string;
    /** Short label shown to the user as a clickable suggestion. */
    displayText: string;
    /** Full prompt text sent to Spotter when the user clicks the suggestion. */
    fullPrompt: string;
}

/**
 * Configuration for the SpotterViz interface shown on the Liveboard.
 * Supported embed types: `AppEmbed`, `LiveboardEmbed`
 * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
 * @group Embed components
 * @example
 * ```js
 * const embed = new AppEmbed('#embed-container', {
 *    ... // other options,
 *    spotterViz: {
 *        brandName: 'MyBrand',
 *        brandHeadline: 'Hi, there! I\'m',
 *        description: 'Ask questions about your data',
 *        inputChatPlaceholder: 'Ask a question...',
 *        hideStarterPrompts: false,
 *        customStarterPrompts: [
 *            { id: '1', displayText: 'Top products', fullPrompt: 'What are the top products by revenue?' }
 *        ],
 *        // loaderHeadline and loaderTips require SDK: 1.51.0 | ThoughtSpot Cloud: 26.8.0.cl
 *        loaderHeadline: 'Crunching the numbers...',
 *        loaderTips: [
 *            { label: 'Tip', text: 'try asking about revenue by region' },
 *            { label: 'Tip', text: 'use natural language' },
 *        ],
 *        // liveboardBrandName, spotterBrandName, insightTileBrandName, insightTileViewPlanLabel and insightTileLoaderText require SDK: 1.52.0 | ThoughtSpot Cloud: 26.9.0.cl
 *        liveboardBrandName: 'Reports',
 *        spotterBrandName: 'Analyst',
 *        insightTileBrandName: 'Insight card',
 *        insightTileViewPlanLabel: 'View plan',
 *        insightTileLoaderText: 'Generating insight',
 *    },
 * })
 * ```
 */
export interface SpotterVizConfig {
    /**
     * Rename the default "SpotterViz" label shown in the SpotterViz interface with a custom brand name.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @default ''
     */
    brandName?: string;
    /**
     * Custom headline text shown before the brand name in the SpotterViz interface.
     * Replaces the default greeting prefix (e.g. "Hi, there! I'm").
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @default ''
     */
    brandHeadline?: string;
    /**
     * Hides the starter prompts section entirely in the SpotterViz interface.
     * When set to `true`, the starter prompts are not displayed.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @default false
     */
    hideStarterPrompts?: boolean;
    /**
     * Overrides the starter prompts with a custom list.
     * Each entry must match the {@link SpotterVizStarterPrompt} shape.
     * Has no effect when `hideStarterPrompts` is `true`.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    customStarterPrompts?: SpotterVizStarterPrompt[];
    /**
     * Custom description text shown in the SpotterViz interface.
     * Replaces the default SpotterViz description.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    description?: string;
    /**
     * Custom placeholder text for the chat input in the SpotterViz interface.
     * Replaces the default chat input placeholder text.
     * @version SDK: 1.50.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    inputChatPlaceholder?: string;
    /**
     * Custom headline text shown in the SpotterViz loading state.
     * Replaces the default loading headline.
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.8.0.cl
     */
    loaderHeadline?: string;
    /**
     * Custom tips shown in the SpotterViz loading state.
     * Replaces the default loading tips with the provided list.
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.8.0.cl
     */
    loaderTips?: SpotterVizLoaderTip[];
    /**
     * Custom term used to replace "Liveboard" in the agent's responses.
     * @version SDK: 1.52.0 | ThoughtSpot Cloud: 26.9.0.cl
     * @default ''
     */
    liveboardBrandName?: string;
    /**
     * Custom term used to replace "Spotter" in the agent's responses.
     * @version SDK: 1.52.0 | ThoughtSpot Cloud: 26.9.0.cl
     * @default ''
     */
    spotterBrandName?: string;
    /**
     * Custom term used to replace "Insight tile" in the UI and in the agent's responses.
     * @version SDK: 1.52.0 | ThoughtSpot Cloud: 26.9.0.cl
     * @default ''
     */
    insightTileBrandName?: string;
    /**
     * Custom term used to replace "View plan" in the insight tile menu.
     * @version SDK: 1.52.0 | ThoughtSpot Cloud: 26.9.0.cl
     */
    insightTileViewPlanLabel?: string;
    /**
     * Custom loader text shown on the insight tile.
     * @version SDK: 1.52.0 | ThoughtSpot Cloud: 26.9.0.cl
     */
    insightTileLoaderText?: string;
}

/**
 * A single tip shown in the SpotterViz loading state.
 * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.8.0.cl
 * @group Embed components
 */
export interface SpotterVizLoaderTip {
    /** Short label rendered alongside the tip (e.g. "Tip"). */
    label: string;
    /** Tip body text. */
    text: string;
}

export function buildSpotterVizAppInitData<T extends DefaultAppInitData>(
    initData: T,
    viewConfig: { spotterViz?: SpotterVizConfig },
): T & { embedParams?: { spotterVizConfig?: SpotterVizConfig } } {
    const { spotterViz } = viewConfig;
    if (!spotterViz) return initData;
    return {
        ...initData,
        embedParams: {
            ...((initData as T & { embedParams?: Record<string, unknown> }).embedParams || {}),
            spotterVizConfig: spotterViz,
        },
    };
}
