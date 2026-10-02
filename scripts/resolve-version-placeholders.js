/**
 * Resolves `<TBD>` placeholders in `@version` JSDoc tags to the real SDK
 * release version.
 *
 * Contributors cannot know which SDK version their PR will ship in — the next
 * published version is only decided when the bump-version-and-pr workflow runs.
 * So they write the placeholder for the SDK half, and the real ThoughtSpot
 * release they are building against for the other:
 *
 *     @version SDK: <TBD> | ThoughtSpot: 26.10.0.cl
 *
 * and this script rewrites it during the release bump, before `npm run docgen`
 * generates the typedoc JSON the docs site is built from:
 *
 *     @version SDK: 1.53.0 | ThoughtSpot: 26.10.0.cl
 *
 * ONLY the SDK half may be `<TBD>`. The ThoughtSpot release is not derivable
 * from this repo, so nothing downstream can fill it in — the author must state
 * it. `--lint` enforces that at PR time.
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
const PLACEHOLDER = /<TBD>/gi;
const SEGMENT_SEPARATOR = '|';

const PROBLEM = {
    // `<TBD>` left in the SDK half. Expected on a feature branch, resolved by
    // the release bump, and a hard failure by the time we publish.
    UNRESOLVED_SDK: 'UNRESOLVED_SDK',
    // `<TBD>` in the ThoughtSpot half. Never valid: no automation can resolve it.
    TBD_THOUGHTSPOT: 'TBD_THOUGHTSPOT',
    // A new annotation that names no ThoughtSpot release at all.
    MISSING_THOUGHTSPOT: 'MISSING_THOUGHTSPOT',
};

const PROBLEM_HINT = {
    [PROBLEM.TBD_THOUGHTSPOT]:
        'the ThoughtSpot release cannot be auto-resolved — replace <TBD> with the release you are '
        + "building against (e.g. 26.10.0.cl), or '*' if the member is not gated on a cluster version",
    [PROBLEM.MISSING_THOUGHTSPOT]:
        'name the ThoughtSpot release this ships in, e.g. '
        + '`@version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl` '
        + "(use '*' if it is not gated on a cluster version)",
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
    PLACEHOLDER.lastIndex = 0;
    return PLACEHOLDER.test(text);
}

/**
 * Splits an `@version` line into its SDK segment and its ThoughtSpot segment(s).
 */
function splitVersionLine(line) {
    const [sdkSegment, ...thoughtSpotSegments] = line.split(SEGMENT_SEPARATOR);
    return { sdkSegment, thoughtSpotSegments };
}

/**
 * Resolves the SDK placeholder only. A `<TBD>` after the `|` is deliberately
 * left alone so `--lint` / `--check` can report it instead of silently
 * inventing a ThoughtSpot release.
 */
function resolveVersionLine(line, sdkVersion) {
    const { sdkSegment, thoughtSpotSegments } = splitVersionLine(line);
    return [sdkSegment.replace(PLACEHOLDER, sdkVersion), ...thoughtSpotSegments].join(
        SEGMENT_SEPARATOR,
    );
}

/**
 * Classifies what is wrong with a single `@version` line, if anything.
 */
function inspectVersionLine(line) {
    const { sdkSegment, thoughtSpotSegments } = splitVersionLine(line);
    const problems = [];

    if (thoughtSpotSegments.some(hasPlaceholder)) {
        problems.push(PROBLEM.TBD_THOUGHTSPOT);
    }
    if (hasPlaceholder(sdkSegment)) {
        problems.push(PROBLEM.UNRESOLVED_SDK);
        // Only enforced on lines that are still `<TBD>`, i.e. annotations added
        // since this convention landed. Existing SDK-only lines stay valid.
        if (thoughtSpotSegments.length === 0) {
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
            if (!line.includes(VERSION_TAG) || !hasPlaceholder(line)) {
                return line;
            }

            const problems = inspectVersionLine(line);
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
 * PR-time gate: `<TBD>` in the SDK half is fine (the release bump resolves it),
 * but an unresolvable ThoughtSpot half is not.
 */
function runLint(results) {
    const wanted = [PROBLEM.TBD_THOUGHTSPOT, PROBLEM.MISSING_THOUGHTSPOT];
    const failures = results.flatMap(({ hits }) => hits).filter((hit) => hit.problems.some((problem) => wanted.includes(problem)));

    if (failures.length === 0) {
        console.log('✓ Every @version annotation names a ThoughtSpot release.');
        return;
    }

    console.error(
        `✖ ${failures.length} @version annotation(s) are missing a usable ThoughtSpot release. `
            + 'Only the SDK version may be <TBD>.',
    );
    reportProblems(results, wanted);
    process.exit(1);
}

/**
 * Pre-publish gate: nothing may still be `<TBD>` by the time we ship.
 */
function runCheck(results) {
    const wanted = [PROBLEM.UNRESOLVED_SDK, PROBLEM.TBD_THOUGHTSPOT, PROBLEM.MISSING_THOUGHTSPOT];
    const total = results.reduce((count, result) => count + result.hits.length, 0);

    if (total === 0) {
        console.log('✓ No unresolved <TBD> version placeholders.');
        return;
    }

    console.error(
        `✖ Found ${total} unresolved <TBD> version placeholder(s). `
            + 'Run `npm run resolve-versions` as part of the release bump.',
    );
    reportProblems(results, wanted);
    process.exit(1);
}

function runResolve(results, sdkVersion, dryRun) {
    const resolvable = results
        .map((result) => ({
            ...result,
            hits: result.hits.filter((hit) => hit.problems.includes(PROBLEM.UNRESOLVED_SDK)),
        }))
        .filter((result) => result.hits.length > 0);

    const total = resolvable.reduce((count, result) => count + result.hits.length, 0);
    if (total === 0) {
        console.log('No <TBD> SDK version placeholders to resolve.');
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

    // A `<TBD>` the release cannot fill in must stop the release, not ship.
    const unresolvable = reportProblems(results, [PROBLEM.TBD_THOUGHTSPOT]);
    if (unresolvable > 0) {
        console.error(
            `✖ ${unresolvable} annotation(s) have a <TBD> ThoughtSpot release, which cannot be resolved automatically.`,
        );
        process.exit(1);
    }
}

function main(argv = process.argv.slice(2), sourceDir = SOURCE_DIR) {
    const { check, lint, dryRun } = parseArgs(argv);
    const { version: sdkVersion } = require('../package.json');
    const results = collectHits(sourceDir, sdkVersion);

    if (lint) {
        runLint(results);
    } else if (check) {
        runCheck(results);
    } else {
        runResolve(results, sdkVersion, dryRun);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
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
