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
 *        // The options below require SDK: 1.51.0
 *        loaderHeadline: 'Crunching the numbers...',
 *        loaderTips: [
 *            { label: 'Tip', text: 'try asking about revenue by region' },
 *            { label: 'Tip', text: 'use natural language' },
 *        ],
 *        liveboardBrandName: 'Reports',
 *        spotterBrandName: 'Analyst',
 *        insightTileBrandName: 'Insight card',
 *        insightTileViewPlanLabel: 'View plan',
 *        insightTileLoaderText: 'Generating insight',
 *        // The option below requires SDK: 1.56.0
 *        terms: {
 *            liveboard: 'Dashboard',
 *            answer: 'Tile',
 *            filter: 'Slicer',
 *            support_contact: 'Acme Support',
 *        },
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
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    loaderHeadline?: string;
    /**
     * Custom tips shown in the SpotterViz loading state.
     * Replaces the default loading tips with the provided list.
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    loaderTips?: SpotterVizLoaderTip[];
    /**
     * Custom term used to replace "Liveboard" in the agent's responses.
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @default ''
     */
    liveboardBrandName?: string;
    /**
     * Custom term used to replace "Spotter" in the agent's responses.
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @default ''
     */
    spotterBrandName?: string;
    /**
     * Custom term used to replace "Insight tile" in the UI and in the agent's responses.
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.7.0.cl
     * @default ''
     */
    insightTileBrandName?: string;
    /**
     * Custom term used to replace "View plan" in the insight tile menu.
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    insightTileViewPlanLabel?: string;
    /**
     * Custom loader text shown on the insight tile.
     * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.7.0.cl
     */
    insightTileLoaderText?: string;
    /**
     * Set to `false` to hide the file upload feature in the SpotterViz chat
     * input on a cluster where the feature is available.
     * @version SDK: 1.54.0 | ThoughtSpot Cloud: 26.11.0.cl
     * @default true
     */
    fileUploadEnabled?: boolean;
    /**
     * Restricts the allowed file types for SpotterViz file upload to a
     * subset of the types SpotterViz supports, e.g. `['csv', 'pdf']`.
     * Entries are file extensions (with or without the leading dot); types
     * SpotterViz does not support are ignored, as are empty lists.
     * @version SDK: 1.54.0 | ThoughtSpot Cloud: 26.11.0.cl
     */
    fileUploadFileTypes?: string[];
    /**
     * Custom names for ThoughtSpot product terms in the SpotterViz interface,
     * the agent's responses, and the SpotterViz progress labels and starter
     * prompts. Each key is a product concept and its value is the name to show
     * instead. See {@link SpotterVizTerms} for the supported keys.
     *
     * Each value must be plain, single-line text of at most 30 characters, without
     * quotes, braces, angle brackets or backslashes. Unsupported keys and invalid
     * values are ignored and do not stop SpotterViz from loading.
     *
     * A key set here takes precedence over `brandName`, `liveboardBrandName`,
     * `spotterBrandName` and `insightTileBrandName` for the same term.
     * @version SDK: 1.56.0 | ThoughtSpot Cloud: 27.1.0.cl
     * @example
     * ```js
     * const embed = new LiveboardEmbed('#embed-container', {
     *    ... // other options,
     *    spotterViz: {
     *        terms: {
     *            thoughtspot: 'Insights & Analytics',
     *            liveboard: 'Dashboard',
     *            answer: 'Tile',
     *            spotter: 'Ask',
     *            spotterviz: 'Build',
     *            data_source: 'data set',
     *            support_contact: 'Acme Support',
     *        },
     *    },
     * })
     * ```
     */
    terms?: SpotterVizTerms;
}

/**
 * Custom names for ThoughtSpot product terms in SpotterViz, keyed by product
 * concept. Every key is optional; a term without a custom name keeps its default.
 * @version SDK: 1.56.0 | ThoughtSpot Cloud: 27.1.0.cl
 * @group Embed components
 */
export interface SpotterVizTerms {
    /** Name for "Liveboard". */
    liveboard?: string;
    /** Name for "Spotter". */
    spotter?: string;
    /** Name for "SpotterViz". */
    spotterviz?: string;
    /** Name for "Insight tile". */
    insight_tile?: string;
    /** Name for "Answer", a chart or table on a Liveboard. */
    answer?: string;
    /** Name used for the product instead of "ThoughtSpot". */
    thoughtspot?: string;
    /** Name for a data source, such as a Model or table. */
    data_source?: string;
    /**
     * Who users are told to contact for access or help, instead of their ThoughtSpot
     * admin.
     */
    support_contact?: string;
    /** Name for "note tile". */
    note_tile?: string;
    /** Name for "filter". */
    filter?: string;
    /** Name for a Liveboard "tab". */
    tab?: string;
    /** Name for a Liveboard "group". */
    group?: string;
    /** Name for a Liveboard "schedule". */
    schedule?: string;
    /** Name for "parameter". */
    parameter?: string;
    /** Name for Liveboard "style", such as its theme and colors. */
    styling?: string;
}

/**
 * A single tip shown in the SpotterViz loading state.
 * @version SDK: 1.51.0 | ThoughtSpot Cloud: 26.7.0.cl
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
