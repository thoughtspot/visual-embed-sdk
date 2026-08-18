/**
 * Parity gate: every symbol exported from `src/index.ts` must also be exported
 * from `src/react/all-types-export.ts`.
 *
 * `package.json` `exports` restricts consumers to two entry points — `.` and
 * `./react` — and the React surface is a HAND-MAINTAINED duplicate export list,
 * not a `export * from '../index'`. So a symbol added only to `src/index.ts` is
 * invisible to every React consumer.
 *
 * The sibling `all-types-export.spec.ts` cannot catch this: it inspects the
 * module at runtime, and type-only exports (interfaces, type aliases) are
 * erased by the compiler. This spec therefore compares the two files as TEXT.
 */
import * as fs from 'fs';
import * as path from 'path';

const INDEX_PATH = path.join(__dirname, '..', 'index.ts');
const REACT_EXPORT_PATH = path.join(__dirname, 'all-types-export.ts');

/**
 * Symbols intentionally absent from the React surface.
 * Add here only with a reason — every entry is a thing React users cannot use.
 */
const REACT_EXEMPT = new Set<string>([
    // React has its own component wrappers for these; the raw classes are not
    // part of the /react surface.
    'SearchEmbed',
    'SearchBarEmbed',
    'LiveboardEmbed',
    'AppEmbed',
    'SpotterEmbed',
    'SpotterAgentEmbed',
    'ConversationEmbed',
    'BodylessConversation',
    'PreRenderedSearchEmbed',
    'PreRenderedSearchBarEmbed',
    'PreRenderedLiveboardEmbed',
    'PreRenderedAppEmbed',
    'PreRenderedConversationEmbed',
    'PinboardEmbed',
    'TsEmbed',
    'V1Embed',
]);

/**
 * PRE-EXISTING gaps, discovered when this spec was introduced. These are
 * symbols React consumers cannot import today — most look like oversights
 * rather than deliberate omissions (e.g. `ContextType`, `CustomActionPayload`,
 * `VizPoint`, the Spotter view configs).
 *
 * This list may only ever SHRINK. Do not add to it — a new entry means a
 * symbol was added to `src/index.ts` without adding it to the React surface,
 * which is exactly what this spec exists to prevent. Removing entries (by
 * exporting them from `all-types-export.ts`) is a welcome follow-up; it is
 * deliberately out of scope for the change that introduced this gate.
 */
const KNOWN_REACT_GAPS = new Set<string>([
    'AnswerService',
    'AutoMCPFrameRendererViewConfig',
    'BackgroundFormatType',
    'BodylessConversationViewConfig',
    'ConditionalFormattingComparisonType',
    'ConditionalFormattingOperator',
    'ContextMenuTriggerOptions',
    'ContextType',
    'ConversationViewConfig',
    'CustomActionPayload',
    'DataLabelFilterOperator',
    'EmbedErrorCodes',
    'EmbedErrorDetailsEvent',
    'ErrorDetailsTypes',
    'HomeLeftNavItem',
    'HomePage',
    'HomePageSearchBarMode',
    'HomepageModule',
    'LegendPosition',
    'ListPage',
    'ListPageColumns',
    'LogLevel',
    'MIXPANEL_EVENT',
    'PrimaryNavbarVersion',
    'SessionInterface',
    'SpotterAgentEmbedViewConfig',
    'SpotterChatViewConfig',
    'SpotterEmbedViewConfig',
    'SpotterQueryMode',
    'SpotterShareConversationConfig',
    'SpotterSidebarViewConfig',
    'SpotterVizConfig',
    'SpotterVizLoaderTip',
    'SpotterVizStarterPrompt',
    'TableContentDensity',
    'TableTheme',
    'UnderlyingDataPoint',
    'VisualizationOverrides',
    'VizPoint',
    // Standalone helpers re-exported from src/index.ts outside the main block.
    'createLiveboardWithAnswers',
    'executeTML',
    'executeTMLInput',
    'exportTML',
    'exportTMLInput',
    'getAnswerFromQuery',
    'startAutoMCPFrameRenderer',
    'tokenizedFetch',
]);

/**
 * Extract identifiers from every `export { ... }` / `export type { ... }` block
 * in a source file. Handles `a`, `a as b` (records the exported name `b`),
 * comments and trailing commas.
 *
 * `export * from '...'` cannot be enumerated by name (the names live in another
 * module), so it would silently defeat this parity gate. We refuse to run
 * against it: if either file adopts a star re-export, this throws so the gate
 * is extended deliberately rather than passing blind.
 */
const extractExportedNames = (source: string): Set<string> => {
    if (/export\s*\*/.test(source)) {
        throw new Error(
            'Parity extractor found an `export *` re-export, which it cannot '
            + 'enumerate by name. Extend extractExportedNames to resolve star '
            + 'exports before relying on this gate.',
        );
    }
    const names = new Set<string>();
    // Matches `export { ... }` and `export type { ... }`.
    const blockRe = /export\s*(?:type\s+)?\{([\s\S]*?)\}/g;
    let match = blockRe.exec(source);
    while (match !== null) {
        match[1]
            // strip line and block comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/[^\n]*/g, '')
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
            .forEach((entry) => {
                // `foo as bar` exports the name `bar`
                const parts = entry.split(/\s+as\s+/);
                const exported = (parts[parts.length - 1] || '').trim();
                if (/^[A-Za-z_$][\w$]*$/.test(exported)) {
                    names.add(exported);
                }
            });
        match = blockRe.exec(source);
    }
    return names;
};

describe('react/all-types-export parity with index', () => {
    it('exports every symbol that src/index.ts exports', () => {
        const indexNames = extractExportedNames(fs.readFileSync(INDEX_PATH, 'utf8'));
        const reactNames = extractExportedNames(fs.readFileSync(REACT_EXPORT_PATH, 'utf8'));

        // Sanity: the extractor found something. Guards against a regex that
        // silently matches nothing after a refactor.
        expect(indexNames.size).toBeGreaterThan(50);
        expect(reactNames.size).toBeGreaterThan(50);

        const missing = [...indexNames]
            .filter((name) => !reactNames.has(name))
            .filter((name) => !REACT_EXEMPT.has(name))
            .filter((name) => !KNOWN_REACT_GAPS.has(name))
            .sort();

        if (missing.length > 0) {
            throw new Error(
                'These symbols are exported from src/index.ts but NOT from '
                    + 'src/react/all-types-export.ts, so React consumers cannot '
                    + `import them:\n  ${missing.join('\n  ')}\n\n`
                    + 'Add them to src/react/all-types-export.ts. Do NOT add them '
                    + 'to KNOWN_REACT_GAPS — that list is a shrinking backlog of '
                    + 'pre-existing gaps and must never grow.',
            );
        }
    });

    it('KNOWN_REACT_GAPS only lists symbols that are genuinely still missing', () => {
        // Ratchet: once a gap is fixed, its entry must be deleted, so the list
        // can only shrink.
        const indexNames = extractExportedNames(fs.readFileSync(INDEX_PATH, 'utf8'));
        const reactNames = extractExportedNames(fs.readFileSync(REACT_EXPORT_PATH, 'utf8'));

        const stale = [...KNOWN_REACT_GAPS]
            .filter((name) => reactNames.has(name) || !indexNames.has(name))
            .sort();

        if (stale.length > 0) {
            throw new Error(
                'These entries in KNOWN_REACT_GAPS are no longer gaps (they are '
                    + 'now exported from the React surface, or no longer exported '
                    + `from src/index.ts). Delete them from the list:\n  ${stale.join('\n  ')}`,
            );
        }
    });

    it('exposes the host event contract types on the React surface', () => {
        const reactNames = extractExportedNames(fs.readFileSync(REACT_EXPORT_PATH, 'utf8'));
        [
            'UIPassthroughContractBase',
            'HostEventRequest',
            'HostEventResponse',
            'TriggerPayload',
            'TriggerResponse',
        ].forEach((name) => expect(reactNames.has(name)).toBe(true));
    });
});
