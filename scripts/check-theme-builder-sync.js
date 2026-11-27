/**
 * Theme Builder sync check (SCAL-266165). Non-blocking PR check.
 *
 * When an SDK PR adds or removes properties of `CustomCssVariables` in
 * `src/css-variables.ts`, the author links a Theme Builder PR
 * (github.com/thoughtspot/Thoughtspot-theme-builder) that mirrors the change in
 * `src/data/sdkVariable.ts`. This script verifies that linked PR:
 *
 *   - every variable this SDK PR adds is present in the Theme Builder PR's
 *     `sdkVariable.ts`, and
 *   - every variable this SDK PR removes is gone from it.
 *
 * It then posts (or updates) one comment on the SDK PR with the result.
 *
 * Both files are read with the TypeScript parser, not text search, so names in
 * comments or values are never mistaken for properties. Only this PR's own
 * additions and removals are compared, so variables that were already missing
 * from the Theme Builder before this PR are ignored.
 *
 * The check never fails the build: every outcome, including errors, exits 0
 * and is reported in the comment and the job summary.
 *
 * Environment (set by .github/workflows/theme-builder-sync-check.yml):
 *   GITHUB_TOKEN               token for this repo (read the PR, write the comment)
 *   THEME_BUILDER_READ_TOKEN   read-only token for the Theme Builder repo
 *   REPO                       owner/name of this repo
 *   PR_NUMBER, BASE_SHA, HEAD_SHA
 *   IS_FORK                    'true' for PRs from forks (no secrets available)
 *   GITHUB_STEP_SUMMARY        optional, job summary file
 *
 * Usage:
 *   node scripts/check-theme-builder-sync.js
 */
const fs = require('fs');
const { execFileSync } = require('child_process');

const SDK_FILE = 'src/css-variables.ts';
const SDK_INTERFACE = 'CustomCssVariables';
const THEME_BUILDER_REPO = 'thoughtspot/Thoughtspot-theme-builder';
const THEME_BUILDER_FILE = 'src/data/sdkVariable.ts';
const THEME_BUILDER_EXPORT = 'allSDKEnabledVars';
const GITHUB_API = 'https://api.github.com';
const COMMENT_MARKER = '<!-- theme-builder-sync-check -->';
const BOT_LOGIN = 'github-actions[bot]';
// Who may link the Theme Builder PR. Links from anyone else are ignored, so an
// outsider cannot point the check at an unrelated private PR.
const TRUSTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR'];
const REQUEST_TIMEOUT_MS = 30000;
const THEME_BUILDER_PR_LINK =
    /https:\/\/github\.com\/thoughtspot\/Thoughtspot-theme-builder\/pull\/(\d+)/gi;
const VARIABLE_NAME = /^--ts-var-[A-Za-z0-9_-]+$/;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

// Loaded lazily: when this PR does not touch the SDK file the workflow skips
// `npm ci`, and the check must still run without typescript installed.
let ts;
const loadTypeScript = () => {
    if (!ts) ts = require('typescript');
    return ts;
};

const parse = (source, fileName) =>
    loadTypeScript().createSourceFile(
        fileName,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );

const findNode = (root, predicate) => {
    let found = null;
    const visit = (node) => {
        if (found) return;
        if (predicate(node)) {
            found = node;
            return;
        }
        ts.forEachChild(node, visit);
    };
    visit(root);
    return found;
};

const propertyName = (name) => {
    if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) return name.text;
    if (ts.isIdentifier(name)) return name.text;
    return null;
};

const checkNames = (names, where) => {
    const invalid = names.filter((name) => !VARIABLE_NAME.test(name));
    if (invalid.length > 0) {
        throw new Error(`${where}: unexpected property names: ${invalid.join(', ')}`);
    }
    return [...new Set(names)].sort();
};

/**
 * Property names of `CustomCssVariables` in the SDK's css-variables.ts.
 * Throws on any shape it cannot read exactly, rather than guessing.
 */
const parseSdkVariableNames = (source) => {
    const file = parse(source, 'css-variables.ts');
    const declaration = findNode(
        file,
        (node) => ts.isInterfaceDeclaration(node) && node.name.text === SDK_INTERFACE,
    );
    if (!declaration) {
        throw new Error(`${SDK_FILE}: interface ${SDK_INTERFACE} not found`);
    }
    if (declaration.heritageClauses && declaration.heritageClauses.length > 0) {
        throw new Error(`${SDK_FILE}: ${SDK_INTERFACE} extends another type`);
    }
    const names = declaration.members.map((member) => {
        const name = ts.isPropertySignature(member) ? propertyName(member.name) : null;
        if (name === null) {
            throw new Error(`${SDK_FILE}: unsupported member: ${member.getText(file)}`);
        }
        return name;
    });
    return checkNames(names, SDK_FILE);
};

/**
 * Keys of the `allSDKEnabledVars` object in the Theme Builder's sdkVariable.ts.
 * Throws on any shape it cannot read exactly, rather than guessing.
 */
const parseThemeBuilderVariableNames = (source) => {
    const file = parse(source, 'sdkVariable.ts');
    const declaration = findNode(
        file,
        (node) =>
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === THEME_BUILDER_EXPORT,
    );
    if (
        !declaration ||
        !declaration.initializer ||
        !ts.isObjectLiteralExpression(declaration.initializer)
    ) {
        throw new Error(`${THEME_BUILDER_FILE}: object ${THEME_BUILDER_EXPORT} not found`);
    }
    const names = declaration.initializer.properties.map((property) => {
        const name = ts.isPropertyAssignment(property) ? propertyName(property.name) : null;
        if (name === null) {
            throw new Error(`${THEME_BUILDER_FILE}: unsupported entry: ${property.getText(file)}`);
        }
        return name;
    });
    return checkNames(names, THEME_BUILDER_FILE);
};

const diffNames = (before, after) => {
    const beforeSet = new Set(before);
    const afterSet = new Set(after);
    return {
        added: after.filter((name) => !beforeSet.has(name)),
        removed: before.filter((name) => !afterSet.has(name)),
    };
};

// ---------------------------------------------------------------------------
// Finding and comparing the linked Theme Builder PR
// ---------------------------------------------------------------------------

/** True for a comment this check posted (by the Actions bot, with the marker). */
const isOwnComment = (comment) =>
    Boolean(comment.user && comment.user.login === BOT_LOGIN) &&
    (comment.body || '').includes(COMMENT_MARKER);

/** True for a comment by the PR author or a repo owner, member or collaborator. */
const isTrustedComment = (comment, prAuthor) =>
    Boolean(comment.user) &&
    (comment.user.login === prAuthor || TRUSTED_ASSOCIATIONS.includes(comment.author_association));

/**
 * Theme Builder PR numbers linked in the given texts, in order. A number
 * mentioned again moves to the end, so the last entry is the latest link.
 *
 * @param {string[]} texts - PR description first, then trusted comments, oldest first.
 * @returns {number[]}
 */
const findThemeBuilderPrNumbers = (texts) => {
    const numbers = [];
    texts
        .filter((text) => text)
        .forEach((text) => {
            [...text.matchAll(THEME_BUILDER_PR_LINK)].forEach((match) => {
                const number = Number(match[1]);
                const existing = numbers.indexOf(number);
                if (existing !== -1) numbers.splice(existing, 1);
                numbers.push(number);
            });
        });
    return numbers;
};

/**
 * Compares this SDK PR's changes with the linked Theme Builder PR.
 *
 * @param {object} args
 * @param {string[]} args.sdkAdded / args.sdkRemoved - this SDK PR's changes.
 * @param {string[]} args.tbAfter - sdkVariable.ts names at the Theme Builder PR head.
 */
const compareChanges = ({ sdkAdded, sdkRemoved, tbAfter }) => {
    // Only names from this (public) SDK PR are ever reported, never other
    // contents of the private Theme Builder repo.
    const after = new Set(tbAfter);
    const missing = sdkAdded.filter((name) => !after.has(name));
    const notRemoved = sdkRemoved.filter((name) => after.has(name));
    return { ok: missing.length === 0 && notRemoved.length === 0, missing, notRemoved };
};

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const codeList = (names) => names.map((name) => `- \`${name}\``).join('\n');

/** Error text as a short inline code span, so it cannot render links or mentions. */
const safeText = (text) => {
    const clean = String(text).replace(/`/g, ' ').replace(/\s+/g, ' ').trim();
    return `\`${clean.length > 300 ? `${clean.slice(0, 300)}…` : clean}\``;
};

/**
 * Markdown for the PR comment. `status` is one of:
 *   'ok' | 'mismatch' | 'no-changes' | 'no-link' | 'error'
 */
const buildReport = ({ status, sdkAdded = [], sdkRemoved = [], prUrl, prState, result, error }) => {
    const lines = [COMMENT_MARKER, '### Theme Builder sync check', ''];
    const pr = prUrl ? `[Theme Builder PR](${prUrl})` : 'Theme Builder PR';

    if (status === 'no-changes') {
        lines.push('No `CustomCssVariables` properties added or removed. Nothing to check.');
        return `${lines.join('\n')}\n`;
    }
    if (status === 'no-link') {
        lines.push(
            'No Theme Builder PR linked, so nothing was verified. Link it in the PR',
            `description as \`https://github.com/${THEME_BUILDER_REPO}/pull/<number>\`.`,
            '(Links in comments count only from the PR author or repo members.)',
        );
    } else if (status === 'error') {
        lines.push(`⚠️ Could not verify the ${pr}: ${safeText(error)}`);
    } else if (status === 'ok') {
        lines.push(`✅ The ${pr} matches this PR's CSS variable changes.`);
    } else {
        lines.push(`🔴 **MUST:** the ${pr} does not match this PR's CSS variable changes.`, '');
        if (result.missing.length > 0) {
            lines.push(`**Added here but missing from \`${THEME_BUILDER_FILE}\`:**`);
            lines.push(codeList(result.missing), '');
        }
        if (result.notRemoved.length > 0) {
            lines.push(`**Removed here but still in \`${THEME_BUILDER_FILE}\`:**`);
            lines.push(codeList(result.notRemoved), '');
        }
    }

    if (prState && prState !== 'open') {
        lines.push('', `Note: the Theme Builder PR is ${prState}.`);
    }
    lines.push('', "<details><summary>This PR's CSS variable changes</summary>", '');
    if (sdkAdded.length > 0) lines.push('Added:', codeList(sdkAdded), '');
    if (sdkRemoved.length > 0) lines.push('Removed:', codeList(sdkRemoved), '');
    lines.push('</details>', '', '_Non-blocking check._');
    return `${lines.join('\n')}\n`;
};

// ---------------------------------------------------------------------------
// GitHub and git I/O
// ---------------------------------------------------------------------------

const githubRequest = async (fetchImpl, token, path, { method = 'GET', body, raw } = {}) => {
    const response = await fetchImpl(`${GITHUB_API}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: raw ? 'application/vnd.github.raw' : 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
        const reason =
            response.status === 404
                ? 'not found, or the token cannot read it'
                : `HTTP ${response.status}`;
        throw new Error(`${method} ${path}: ${reason}`);
    }
    return raw ? response.text() : response.json();
};

/** All pages of a list endpoint (max 10 pages of 100). */
const githubList = async (fetchImpl, token, path) => {
    const items = [];
    for (let page = 1; page <= 10; page += 1) {
        const separator = path.includes('?') ? '&' : '?';
        const batch = await githubRequest(
            fetchImpl,
            token,
            `${path}${separator}per_page=100&page=${page}`,
        );
        items.push(...batch);
        if (batch.length < 100) break;
    }
    return items;
};

const gitShow = (ref, file) => {
    try {
        return execFileSync('git', ['show', `${ref}:${file}`], {
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024,
        });
    } catch (error) {
        return null;
    }
};

const mergeBase = (a, b) => execFileSync('git', ['merge-base', a, b], { encoding: 'utf8' }).trim();

/** This SDK PR's added and removed CustomCssVariables properties. */
const readSdkChanges = ({ baseSha, headSha, show = gitShow, base = mergeBase }) => {
    // Compare against the merge base, so commits that landed on main after this
    // branch was cut are not counted as this PR's changes.
    const before = show(base(baseSha, headSha), SDK_FILE);
    const after = show(headSha, SDK_FILE);
    if (after === null) throw new Error(`${SDK_FILE} not found at ${headSha}`);
    return diffNames(
        before === null ? [] : parseSdkVariableNames(before),
        parseSdkVariableNames(after),
    );
};

/** The Theme Builder PR's state and its sdkVariable.ts names at the PR head. */
const readThemeBuilderPr = async (fetchImpl, token, number) => {
    const pr = await githubRequest(
        fetchImpl,
        token,
        `/repos/${THEME_BUILDER_REPO}/pulls/${number}`,
    );
    const after = await githubRequest(
        fetchImpl,
        token,
        `/repos/${THEME_BUILDER_REPO}/contents/${THEME_BUILDER_FILE}?ref=${pr.head.sha}`,
        { raw: true },
    );
    let state = pr.state;
    if (pr.merged) state = 'merged';
    else if (pr.state === 'closed') state = 'closed without merging';
    return { url: pr.html_url, state, after: parseThemeBuilderVariableNames(after) };
};

/** Creates the check's comment, or updates it if one already exists. */
const upsertComment = async (fetchImpl, token, repo, prNumber, body, comments) => {
    const existing = comments.find(isOwnComment);
    if (existing) {
        try {
            await githubRequest(fetchImpl, token, `/repos/${repo}/issues/comments/${existing.id}`, {
                method: 'PATCH',
                body: { body },
            });
            return;
        } catch (error) {
            // e.g. the comment was deleted meanwhile; post a fresh one instead.
        }
    }
    await githubRequest(fetchImpl, token, `/repos/${repo}/issues/${prNumber}/comments`, {
        method: 'POST',
        body: { body },
    });
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Runs the check. Returns the report it posted (or would have posted) and
 * never throws for an expected failure, so the job stays non-blocking.
 */
const run = async ({
    env = process.env,
    fetchImpl = fetch,
    show,
    base,
    log = console.log,
} = {}) => {
    const repo = env.REPO;
    const prNumber = env.PR_NUMBER;
    const summary = (text) => {
        if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${text}\n`);
        log(text);
    };

    if (env.IS_FORK === 'true') {
        summary('Theme Builder sync check skipped: PRs from forks get no secrets.');
        return null;
    }

    const comments = await githubList(
        fetchImpl,
        env.GITHUB_TOKEN,
        `/repos/${repo}/issues/${prNumber}/comments`,
    );
    const hasOwnComment = comments.some(isOwnComment);
    let report;

    // The workflow sets SDK_FILE_UNCHANGED when this PR does not touch the file,
    // so a PR whose variable changes were reverted still clears an old result.
    let sdkAdded = [];
    let sdkRemoved = [];
    if (env.SDK_FILE_UNCHANGED !== 'true') {
        try {
            ({ added: sdkAdded, removed: sdkRemoved } = readSdkChanges({
                baseSha: env.BASE_SHA,
                headSha: env.HEAD_SHA,
                show,
                base,
            }));
        } catch (error) {
            report = buildReport({
                status: 'error',
                error: `could not read this PR's ${SDK_FILE}: ${error.message}`,
            });
            summary(report);
            await upsertComment(fetchImpl, env.GITHUB_TOKEN, repo, prNumber, report, comments);
            return report;
        }
    }

    if (sdkAdded.length === 0 && sdkRemoved.length === 0) {
        report = buildReport({ status: 'no-changes' });
        summary(report);
        // Only touch the PR if an earlier run left a comment that is now stale.
        if (hasOwnComment) {
            await upsertComment(fetchImpl, env.GITHUB_TOKEN, repo, prNumber, report, comments);
        }
        return report;
    }

    const pr = await githubRequest(fetchImpl, env.GITHUB_TOKEN, `/repos/${repo}/pulls/${prNumber}`);
    const prAuthor = pr.user && pr.user.login;
    const linked = findThemeBuilderPrNumbers([
        pr.body,
        ...comments
            .filter((c) => !isOwnComment(c) && isTrustedComment(c, prAuthor))
            .map((c) => c.body),
    ]);
    const tbNumber = linked[linked.length - 1];

    if (tbNumber === undefined) {
        report = buildReport({ status: 'no-link', sdkAdded, sdkRemoved });
    } else if (!env.THEME_BUILDER_READ_TOKEN) {
        // Not a PR problem; keep it out of the PR until the secret exists.
        summary('Theme Builder sync check skipped: THEME_BUILDER_READ_TOKEN secret is not set.');
        return null;
    } else {
        const prUrl = `https://github.com/${THEME_BUILDER_REPO}/pull/${tbNumber}`;
        try {
            const tb = await readThemeBuilderPr(fetchImpl, env.THEME_BUILDER_READ_TOKEN, tbNumber);
            const result = compareChanges({
                sdkAdded,
                sdkRemoved,
                tbAfter: tb.after,
            });
            report = buildReport({
                status: result.ok ? 'ok' : 'mismatch',
                sdkAdded,
                sdkRemoved,
                prUrl: tb.url,
                prState: tb.state,
                result,
            });
        } catch (error) {
            report = buildReport({
                status: 'error',
                sdkAdded,
                sdkRemoved,
                prUrl,
                error: error.message,
            });
        }
    }

    summary(report);
    await upsertComment(fetchImpl, env.GITHUB_TOKEN, repo, prNumber, report, comments);
    return report;
};

if (require.main === module) {
    run().catch((error) => {
        // Non-blocking: report and exit 0.
        console.log(`::warning::Theme Builder sync check could not run: ${error.message}`);
    });
}

module.exports = {
    COMMENT_MARKER,
    isOwnComment,
    isTrustedComment,
    parseSdkVariableNames,
    parseThemeBuilderVariableNames,
    diffNames,
    findThemeBuilderPrNumbers,
    compareChanges,
    buildReport,
    readSdkChanges,
    readThemeBuilderPr,
    upsertComment,
    run,
};
