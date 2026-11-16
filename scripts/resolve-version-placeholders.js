/**
 * Resolves `%NEXT_SDK_VERSION%` placeholders in `@version` JSDoc tags to the
 * real SDK release version.
 *
 * Contributors cannot know which SDK version their PR will ship in — the next
 * published version is only decided when the bump-version-and-pr workflow runs.
 * So they write the placeholder for the SDK half, and the real ThoughtSpot
 * release they are building against for the other:
 *
 *     @version SDK: %NEXT_SDK_VERSION% | ThoughtSpot: 26.10.0.cl
 *
 * and this script rewrites it during the release bump, before `npm run docgen`
 * generates the typedoc JSON the docs site is built from:
 *
 *     @version SDK: 1.53.0 | ThoughtSpot: 26.10.0.cl
 *
 * The token is deliberately one nobody would type by accident, and is matched
 * exactly (case-sensitive), so the release bump never rewrites anything it was
 * not meant to. It used to be `<TBD>`; that spelling is now rejected with a
 * pointer to the new one.
 *
 * ONLY the SDK half may be the placeholder. The ThoughtSpot release is not
 * derivable from this repo, so nothing downstream can fill it in — the author
 * must state it. `--lint` enforces that at PR time.
 *
 * Only lines containing `@version` are touched. Within such a line, the segment
 * before the first `|` is the SDK version and anything after it is the
 * ThoughtSpot release.
 *
 * Usage:
 *   node scripts/resolve-version-placeholders.js [--dry-run]   # release bump
 *   node scripts/resolve-version-placeholders.js --lint        # PR check
 *   node scripts/resolve-version-placeholders.js --check       # pre-publish gate
 */
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'src');
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];
const VERSION_TAG = '@version';
const PLACEHOLDER_TOKEN = '%NEXT_SDK_VERSION%';
// Matched as a plain string (exact, case-sensitive) on purpose: a near miss
// must fail, not resolve.
// The old placeholder spelling. Never resolved, only reported, so a PR written
// against the old convention fails loudly instead of slipping through.
const LEGACY_PLACEHOLDER = /<TBD>/i;
const SEGMENT_SEPARATOR = '|';

const PROBLEM = {
    // Placeholder left in the SDK half. Expected on a feature branch, resolved
    // by the release bump, and a hard failure by the time we publish.
    UNRESOLVED_SDK: 'UNRESOLVED_SDK',
    // Placeholder in the ThoughtSpot half. Never valid: no automation can resolve it.
    PLACEHOLDER_THOUGHTSPOT: 'PLACEHOLDER_THOUGHTSPOT',
    // A new annotation that names no ThoughtSpot release at all, or leaves it
    // blank (`| ` or `| ThoughtSpot Cloud:` with no version after it).
    MISSING_THOUGHTSPOT: 'MISSING_THOUGHTSPOT',
    // An SDK half that is neither a version nor the placeholder, e.g. a typo
    // such as `%NEXT_SDK_VERSON%`. Checked on every `@version` line: nothing
    // else would catch it, and it would otherwise ship to the docs verbatim.
    MALFORMED_SDK: 'MALFORMED_SDK',
    // `<TBD>` anywhere on the line: the placeholder before it was renamed.
    LEGACY_PLACEHOLDER: 'LEGACY_PLACEHOLDER',
};

// A well-formed SDK half: `@version SDK: 1.53.0` or the placeholder.
// The token is escaped so changing it can never break the pattern.
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SDK_SEGMENT = new RegExp(
    `@version\\s+SDK:\\s*(?:${escapeRegExp(PLACEHOLDER_TOKEN)}|\\d+\\.\\d+\\.\\d+)\\s*$`,
);
// A ThoughtSpot half names a release when it carries a version or `*`.
const THOUGHTSPOT_RELEASE = /\*|\d+\.\d+\.\d+/;

// Problems that make a tree unfit to merge, and so unfit to release from.
const BLOCKING = [
    PROBLEM.PLACEHOLDER_THOUGHTSPOT,
    PROBLEM.MISSING_THOUGHTSPOT,
    PROBLEM.MALFORMED_SDK,
    PROBLEM.LEGACY_PLACEHOLDER,
];

const PROBLEM_HINT = {
    [PROBLEM.MALFORMED_SDK]:
        `the SDK version must be a released version (e.g. 1.53.0) or exactly ${PLACEHOLDER_TOKEN} `
        + '— check for a typo',
    [PROBLEM.PLACEHOLDER_THOUGHTSPOT]:
        `the ThoughtSpot release cannot be auto-resolved — replace ${PLACEHOLDER_TOKEN} with the `
        + "release you are building against (e.g. 26.10.0.cl), or '*' if the member is not gated "
        + 'on a cluster version',
    [PROBLEM.MISSING_THOUGHTSPOT]:
        'name the ThoughtSpot release this ships in, e.g. '
        + `\`@version SDK: ${PLACEHOLDER_TOKEN} | ThoughtSpot Cloud: 26.10.0.cl\` `
        + "(use '*' if it is not gated on a cluster version)",
    [PROBLEM.LEGACY_PLACEHOLDER]:
        `the <TBD> placeholder was renamed — write ${PLACEHOLDER_TOKEN} for the SDK version, and a `
        + "real ThoughtSpot release (or '*') for the ThoughtSpot half",
};

// SDK minor and ThoughtSpot Cloud minor advance in lockstep: SDK 1.N.x ships
// with Cloud 26.(N - CLOUD_MINOR_OFFSET).0.cl. See CLAUDE.md.
const CLOUD_MINOR_OFFSET = 43;
const CLOUD_VERSION = /\b(\d+\.\d+\.\d+)\.cl\b/;

/**
 * The ThoughtSpot Cloud release that a given SDK version ships alongside, or
 * null when the lockstep rule does not apply (major versions other than 1, or
 * an SDK minor from before the Cloud sequence started).
 */
function expectedCloudVersion(sdkVersion) {
    const [major, minor] = sdkVersion.split('.').map(Number);
    if (major !== 1 || !Number.isInteger(minor) || minor <= CLOUD_MINOR_OFFSET) {
        return null;
    }
    return `26.${minor - CLOUD_MINOR_OFFSET}.0.cl`;
}

/**
 * Flags an author-supplied Cloud version that contradicts the lockstep rule.
 * Only knowable at release time, since it depends on the SDK version being cut,
 * and only ever a warning — `*`, `.sw` releases and deliberate back-dating to an
 * earlier Cloud release are all legitimate.
 */
function cloudVersionWarning(line, sdkVersion) {
    const expected = expectedCloudVersion(sdkVersion);
    const [, actual] = line.match(CLOUD_VERSION) || [];
    if (!expected || !actual || `${actual}.cl` === expected) {
        return null;
    }
    return `ThoughtSpot Cloud ${actual}.cl does not match SDK ${sdkVersion} (expected ${expected}) — confirm this is deliberate`;
}

function parseArgs(argv) {
    return {
        check: argv.includes('--check'),
        lint: argv.includes('--lint'),
        dryRun: argv.includes('--dry-run'),
    };
}

function collectSourceFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return collectSourceFiles(entryPath);
        }
        return SOURCE_EXTENSIONS.includes(path.extname(entry.name)) ? [entryPath] : [];
    });
}

function hasPlaceholder(text) {
    return text.includes(PLACEHOLDER_TOKEN);
}

/**
 * Splits an `@version` line into its SDK segment and its ThoughtSpot segment(s).
 */
function splitVersionLine(line) {
    const [sdkSegment, ...thoughtSpotSegments] = line.split(SEGMENT_SEPARATOR);
    return { sdkSegment, thoughtSpotSegments };
}

/**
 * Resolves the SDK placeholder only. A placeholder after the `|` is deliberately
 * left alone so `--lint` / `--check` can report it instead of silently
 * inventing a ThoughtSpot release.
 */
function resolveVersionLine(line, sdkVersion) {
    const { sdkSegment, thoughtSpotSegments } = splitVersionLine(line);
    return [sdkSegment.replaceAll(PLACEHOLDER_TOKEN, sdkVersion), ...thoughtSpotSegments].join(
        SEGMENT_SEPARATOR,
    );
}

/**
 * Classifies what is wrong with a single `@version` line, if anything.
 */
function inspectVersionLine(line) {
    const { sdkSegment, thoughtSpotSegments } = splitVersionLine(line);
    const problems = [];

    const isLegacy = (segment) => LEGACY_PLACEHOLDER.test(segment);

    // A legacy `<TBD>` SDK half gets the rename hint instead of the generic
    // malformed one, so the author is told exactly what to change.
    if (isLegacy(sdkSegment)) {
        problems.push(PROBLEM.LEGACY_PLACEHOLDER);
    } else if (!SDK_SEGMENT.test(sdkSegment)) {
        problems.push(PROBLEM.MALFORMED_SDK);
    }
    const legacyThoughtSpot = thoughtSpotSegments.some(isLegacy);
    if (legacyThoughtSpot && !problems.includes(PROBLEM.LEGACY_PLACEHOLDER)) {
        problems.push(PROBLEM.LEGACY_PLACEHOLDER);
    }
    const placeholderThoughtSpot = thoughtSpotSegments.some(hasPlaceholder);
    if (placeholderThoughtSpot) {
        problems.push(PROBLEM.PLACEHOLDER_THOUGHTSPOT);
    }
    if (hasPlaceholder(sdkSegment)) {
        problems.push(PROBLEM.UNRESOLVED_SDK);
        // Only enforced on lines that still carry the placeholder, i.e.
        // annotations added since this convention landed. Existing SDK-only
        // lines stay valid. A ThoughtSpot half already reported above is not
        // reported a second time as missing.
        if (
            !placeholderThoughtSpot
            && !legacyThoughtSpot
            && !THOUGHTSPOT_RELEASE.test(thoughtSpotSegments.join(SEGMENT_SEPARATOR))
        ) {
            problems.push(PROBLEM.MISSING_THOUGHTSPOT);
        }
    }
    return problems;
}

function processFile(filePath, sdkVersion) {
    const original = fs.readFileSync(filePath, 'utf8');
    const hits = [];

    const updated = original
        .split('\n')
        .map((line, index) => {
            if (!line.includes(VERSION_TAG)) {
                return line;
            }

            const problems = inspectVersionLine(line);
            if (problems.length === 0) {
                return line;
            }
            const resolved = resolveVersionLine(line, sdkVersion);
            hits.push({
                line: index + 1,
                problems,
                warning: cloudVersionWarning(resolved, sdkVersion),
                before: line.trim(),
                after: resolved.trim(),
            });
            return resolved;
        })
        .join('\n');

    return { hits, updated, changed: updated !== original };
}

function collectHits(sourceDir, sdkVersion) {
    return collectSourceFiles(sourceDir)
        .map((filePath) => ({ filePath, ...processFile(filePath, sdkVersion) }))
        .filter((result) => result.hits.length > 0);
}

function countProblems(results, wanted) {
    return results
        .flatMap(({ hits }) => hits)
        .filter((hit) => hit.problems.some((problem) => wanted.includes(problem))).length;
}

function reportProblems(results, wanted) {
    const reported = results.flatMap(({ filePath, hits }) => hits
        .filter((hit) => hit.problems.some((problem) => wanted.includes(problem)))
        .map((hit) => ({ filePath, ...hit })));

    reported.forEach(({ filePath, line, before, problems }) => {
        const location = `${path.relative(process.cwd(), filePath)}:${line}`;
        console.error(`  ${location}  ${before}`);
        problems
            .filter((problem) => wanted.includes(problem) && PROBLEM_HINT[problem])
            .forEach((problem) => console.error(`      ↳ ${PROBLEM_HINT[problem]}`));
    });

    return reported.length;
}

/**
 * PR-time gate: the placeholder in the SDK half is fine (the release bump resolves it),
 * but an unresolvable ThoughtSpot half or a malformed SDK half is not.
 */
function runLint(results) {
    const failures = countProblems(results, BLOCKING);

    if (failures === 0) {
        console.log('✓ Every @version annotation is well-formed and names a ThoughtSpot release.');
        return;
    }

    console.error(
        `✖ ${failures} @version annotation(s) are malformed or missing a usable ThoughtSpot release. `
            + `Only the SDK version may be ${PLACEHOLDER_TOKEN}.`,
    );
    reportProblems(results, BLOCKING);
    process.exit(1);
}

/**
 * Pre-publish gate: no placeholder may be left by the time we ship.
 *
 * Pre-releases (`1.53.2-beta.1`) are published from feature branches that
 * legitimately still carry the placeholder — the release bump has not run for them — so
 * there an unresolved SDK half is only a warning. Everything else still fails.
 */
function runCheck(results, sdkVersion) {
    const isPrerelease = sdkVersion.includes('-');
    const wanted = isPrerelease ? BLOCKING : [PROBLEM.UNRESOLVED_SDK, ...BLOCKING];
    const total = countProblems(results, wanted);
    const pending = countProblems(results, [PROBLEM.UNRESOLVED_SDK]);

    if (total === 0) {
        if (pending > 0) {
            console.warn(
                `⚠ ${pending} ${PLACEHOLDER_TOKEN} SDK version placeholder(s) left in pre-release ${sdkVersion}; `
                    + 'allowed for pre-releases, resolved by the next release bump.',
            );
        } else {
            console.log(`✓ No unresolved ${PLACEHOLDER_TOKEN} version placeholders.`);
        }
        return;
    }

    console.error(
        `✖ Found ${total} unresolved or malformed @version annotation(s). `
            + 'Run `npm run resolve-versions` as part of the release bump. If the bump already ran, '
            + `a PR with ${PLACEHOLDER_TOKEN} was merged after it — re-run the bump-version-and-pr workflow.`,
    );
    reportProblems(results, wanted);
    process.exit(1);
}

/**
 * Release-bump rewrite. Validates the whole tree before touching any file, so a
 * failed run leaves `src` exactly as it found it.
 */
function runResolve(results, sdkVersion, dryRun) {
    const blocking = countProblems(results, BLOCKING);
    if (blocking > 0) {
        console.error(
            `✖ ${blocking} @version annotation(s) cannot be resolved automatically. `
                + 'No files were changed.',
        );
        reportProblems(results, BLOCKING);
        process.exit(1);
        return;
    }

    const resolvable = results
        .map((result) => ({
            ...result,
            hits: result.hits.filter((hit) => hit.problems.includes(PROBLEM.UNRESOLVED_SDK)),
        }))
        .filter((result) => result.hits.length > 0);

    const total = resolvable.reduce((count, result) => count + result.hits.length, 0);
    if (total === 0) {
        console.log(`No ${PLACEHOLDER_TOKEN} SDK version placeholders to resolve.`);
    } else {
        console.log(`Resolving ${total} placeholder(s) → SDK: ${sdkVersion}${dryRun ? ' (dry run)' : ''}`);
        resolvable.forEach(({ filePath, updated, hits }) => {
            hits.forEach(({ line, after, warning }) => {
                console.log(`  ${path.relative(process.cwd(), filePath)}:${line}  ${after}`);
                if (warning) {
                    console.log(`      ⚠ ${warning}`);
                }
            });
            if (!dryRun) {
                fs.writeFileSync(filePath, updated, 'utf8');
            }
        });
    }
}

function main(
    argv = process.argv.slice(2),
    sourceDir = SOURCE_DIR,
    sdkVersion = require('../package.json').version,
) {
    const { check, lint, dryRun } = parseArgs(argv);
    const results = collectHits(sourceDir, sdkVersion);

    if (lint) {
        runLint(results);
    } else if (check) {
        runCheck(results, sdkVersion);
    } else {
        runResolve(results, sdkVersion, dryRun);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    PLACEHOLDER_TOKEN,
    PROBLEM,
    cloudVersionWarning,
    collectSourceFiles,
    expectedCloudVersion,
    inspectVersionLine,
    main,
    parseArgs,
    processFile,
    resolveVersionLine,
};
