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
}
export declare function buildSpotterVizAppInitData<T extends DefaultAppInitData>(initData: T, viewConfig: {
    spotterViz?: SpotterVizConfig;
}): T & {
    embedParams?: {
        spotterVizConfig?: SpotterVizConfig;
    };
};
//# sourceMappingURL=spotter-viz-utils.d.ts.map