const fs = require('fs');
const os = require('os');
const path = require('path');

const {
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
} = require('./check-theme-builder-sync');

const sdkSource = (names) => `
export interface CustomCssVariables {
${names.map((name) => `    /** Doc for ${name}, see --ts-var-in-a-comment. */\n    '${name}'?: string;`).join('\n')}
}
`;

const tbSource = (
    names,
) => `import type { CustomCssVariables } from '@thoughtspot/visual-embed-sdk';

export const allSDKEnabledVars: CustomCssVariables = {
  // comment mentioning '--ts-var-not-an-entry'
${names.map((name) => `  '${name}': 'var(--ts-var-root-color)',`).join('\n')}
};
`;

const TB_PR = 'https://github.com/thoughtspot/Thoughtspot-theme-builder/pull/42';
const BOT = { login: 'github-actions[bot]', type: 'Bot' };
const AUTHOR = { login: 'author' };

/** A fake fetch serving canned GitHub API responses; records every call. */
const fakeGitHub = (routes) => {
    const calls = [];
    const fetchImpl = jest.fn(async (url, options) => {
        const route = url.replace('https://api.github.com', '');
        calls.push({ route, method: options.method, body: options.body });
        // Keys are "METHOD /path" or "/path" (any method); the path is a prefix.
        const key = Object.keys(routes).find((pattern) => {
            const [method, routePath] = pattern.includes(' ')
                ? pattern.split(' ')
                : [null, pattern];
            return (!method || method === options.method) && route.startsWith(routePath);
        });
        const handler = key && routes[key];
        if (!handler) return { ok: false, status: 404 };
        if (handler.status) return { ok: false, status: handler.status };
        return { ok: true, status: 200, json: async () => handler, text: async () => handler };
    });
    return { fetchImpl, calls };
};

describe('parseSdkVariableNames', () => {
    test('returns sorted property names and ignores names in comments', () => {
        expect(parseSdkVariableNames(sdkSource(['--ts-var-b', '--ts-var-a']))).toEqual([
            '--ts-var-a',
            '--ts-var-b',
        ]);
    });

    test('reads double-quoted names', () => {
        const source = 'export interface CustomCssVariables { "--ts-var-a"?: string; }';
        expect(parseSdkVariableNames(source)).toEqual(['--ts-var-a']);
    });

    test('throws when the interface is missing', () => {
        expect(() => parseSdkVariableNames('export interface Other {}')).toThrow(/not found/);
    });

    test('throws when the interface extends another type', () => {
        const source = "export interface CustomCssVariables extends B { '--ts-var-a'?: string; }";
        expect(() => parseSdkVariableNames(source)).toThrow(/extends another type/);
    });

    test('throws on members it cannot read', () => {
        const source = 'export interface CustomCssVariables { [key: string]: string; }';
        expect(() => parseSdkVariableNames(source)).toThrow(/unsupported member/);
    });

    test('throws on names that are not --ts-var-*', () => {
        const source = "export interface CustomCssVariables { '--other'?: string; }";
        expect(() => parseSdkVariableNames(source)).toThrow(/unexpected property names/);
    });
});

describe('parseThemeBuilderVariableNames', () => {
    test('returns the keys of allSDKEnabledVars and ignores comments', () => {
        expect(parseThemeBuilderVariableNames(tbSource(['--ts-var-b', '--ts-var-a']))).toEqual([
            '--ts-var-a',
            '--ts-var-b',
        ]);
    });

    test('throws when allSDKEnabledVars is missing', () => {
        expect(() => parseThemeBuilderVariableNames('export const x = {};')).toThrow(/not found/);
    });

    test('throws on spreads it cannot follow', () => {
        const source = 'export const allSDKEnabledVars = { ...others };';
        expect(() => parseThemeBuilderVariableNames(source)).toThrow(/unsupported entry/);
    });
});

describe('diffNames', () => {
    test('lists added and removed names', () => {
        expect(diffNames(['a', 'b'], ['b', 'c'])).toEqual({ added: ['c'], removed: ['a'] });
    });
});

describe('comment helpers', () => {
    test('isOwnComment needs both the Actions bot and the marker', () => {
        expect(isOwnComment({ user: BOT, body: `${COMMENT_MARKER} x` })).toBe(true);
        expect(isOwnComment({ user: AUTHOR, body: `${COMMENT_MARKER} spoofed` })).toBe(false);
        expect(isOwnComment({ user: BOT, body: 'another bot comment' })).toBe(false);
        expect(isOwnComment({ body: COMMENT_MARKER })).toBe(false);
    });

    test('isTrustedComment accepts the PR author and repo members only', () => {
        expect(isTrustedComment({ user: AUTHOR, author_association: 'NONE' }, 'author')).toBe(true);
        expect(isTrustedComment({ user: { login: 'm' }, author_association: 'MEMBER' }, 'a')).toBe(
            true,
        );
        expect(
            isTrustedComment({ user: { login: 'x' }, author_association: 'CONTRIBUTOR' }, 'a'),
        ).toBe(false);
        expect(isTrustedComment({ author_association: 'OWNER' }, 'a')).toBe(false);
    });
});

describe('findThemeBuilderPrNumbers', () => {
    test('finds links in order and moves repeated links to the end', () => {
        const texts = [
            `See ${TB_PR}`,
            'Updated: https://github.com/thoughtspot/Thoughtspot-theme-builder/pull/43',
            `Back to ${TB_PR}`,
        ];
        expect(findThemeBuilderPrNumbers(texts)).toEqual([43, 42]);
    });

    test('ignores links to other repos and empty texts', () => {
        const texts = [null, '', 'https://github.com/thoughtspot/visual-embed-sdk/pull/7'];
        expect(findThemeBuilderPrNumbers(texts)).toEqual([]);
    });
});

describe('compareChanges', () => {
    test('passes when every addition and removal is mirrored', () => {
        const result = compareChanges({
            sdkAdded: ['--ts-var-new'],
            sdkRemoved: ['--ts-var-gone'],
            tbAfter: ['--ts-var-a', '--ts-var-new'],
        });
        expect(result).toEqual({ ok: true, missing: [], notRemoved: [] });
    });

    test('reports missing additions and kept removals, and nothing else', () => {
        const result = compareChanges({
            sdkAdded: ['--ts-var-new'],
            sdkRemoved: ['--ts-var-gone'],
            tbAfter: ['--ts-var-gone', '--ts-var-private-unreleased'],
        });
        expect(result).toEqual({
            ok: false,
            missing: ['--ts-var-new'],
            notRemoved: ['--ts-var-gone'],
        });
    });
});

describe('buildReport', () => {
    const changes = { sdkAdded: ['--ts-var-new'], sdkRemoved: ['--ts-var-gone'] };

    test('every report starts with the marker', () => {
        expect(buildReport({ status: 'no-changes' }).startsWith(COMMENT_MARKER)).toBe(true);
    });

    test('no-changes says there is nothing to check', () => {
        expect(buildReport({ status: 'no-changes' })).toMatch(/Nothing to check/);
    });

    test('no-link explains how and by whom the PR can be linked', () => {
        const report = buildReport({ status: 'no-link', ...changes });
        expect(report).toMatch(/No Theme Builder PR linked/);
        expect(report).toMatch(/PR author or repo members/);
    });

    test('error text is shown as one short code span', () => {
        const error = `@team see [x](https://evil) \`tick\`\n${'a'.repeat(400)}`;
        const report = buildReport({ status: 'error', ...changes, prUrl: TB_PR, error });
        const line = report.split('\n').find((l) => l.startsWith('⚠️'));
        expect(line).toMatch(/: `@team see \[x\]\(https:\/\/evil\) tick a+…`$/);
    });

    test('ok shows a pass and the PR state when not open', () => {
        const report = buildReport({ status: 'ok', ...changes, prUrl: TB_PR, prState: 'merged' });
        expect(report).toMatch(/✅/);
        expect(report).toMatch(/Theme Builder PR is merged/);
    });

    test('mismatch lists what is missing and what was not removed', () => {
        const result = { ok: false, missing: ['--ts-var-new'], notRemoved: ['--ts-var-gone'] };
        const report = buildReport({
            status: 'mismatch',
            ...changes,
            prUrl: TB_PR,
            prState: 'open',
            result,
        });
        expect(report).toMatch(/🔴 \*\*MUST:\*\*/);
        expect(report).toMatch(/missing from `src\/data\/sdkVariable.ts`:\*\*\n- `--ts-var-new`/);
        expect(report).toMatch(/still in `src\/data\/sdkVariable.ts`:\*\*\n- `--ts-var-gone`/);
        expect(report).not.toMatch(/Theme Builder PR is open/);
    });
});

describe('readSdkChanges', () => {
    test('diffs the head against the merge base', () => {
        const files = {
            base: sdkSource(['--ts-var-a', '--ts-var-gone']),
            head: sdkSource(['--ts-var-a', '--ts-var-new']),
        };
        const base = jest.fn(() => 'base');
        const result = readSdkChanges({
            baseSha: 'main-sha',
            headSha: 'head',
            base,
            show: (ref) => files[ref] || null,
        });
        expect(base).toHaveBeenCalledWith('main-sha', 'head');
        expect(result).toEqual({ added: ['--ts-var-new'], removed: ['--ts-var-gone'] });
    });

    test('treats a missing base file as empty', () => {
        const result = readSdkChanges({
            baseSha: 'x',
            headSha: 'head',
            base: () => 'base',
            show: (ref) => (ref === 'head' ? sdkSource(['--ts-var-a']) : null),
        });
        expect(result).toEqual({ added: ['--ts-var-a'], removed: [] });
    });

    test('throws when the head file is missing', () => {
        expect(() =>
            readSdkChanges({ baseSha: 'x', headSha: 'head', base: () => 'b', show: () => null }),
        ).toThrow(/not found/);
    });
});

const TB_API = '/repos/thoughtspot/Thoughtspot-theme-builder';
const tbRoutes = ({ merged = false, state = 'open', after } = {}) => ({
    [`${TB_API}/pulls/42`]: {
        html_url: TB_PR,
        state,
        merged,
        head: { sha: 'tb-head' },
    },
    [`${TB_API}/contents/src/data/sdkVariable.ts?ref=tb-head`]:
        after || tbSource(['--ts-var-a', '--ts-var-new']),
});

describe('readThemeBuilderPr', () => {
    test('reads sdkVariable.ts at the PR head', async () => {
        const { fetchImpl } = fakeGitHub(tbRoutes());
        await expect(readThemeBuilderPr(fetchImpl, 'tb-token', 42)).resolves.toEqual({
            url: TB_PR,
            state: 'open',
            after: ['--ts-var-a', '--ts-var-new'],
        });
        expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer tb-token');
        expect(fetchImpl.mock.calls[0][1].signal).toBeDefined();
    });

    test('labels merged and closed PRs', async () => {
        const merged = await readThemeBuilderPr(
            fakeGitHub(tbRoutes({ merged: true, state: 'closed' })).fetchImpl,
            't',
            42,
        );
        const closed = await readThemeBuilderPr(
            fakeGitHub(tbRoutes({ state: 'closed' })).fetchImpl,
            't',
            42,
        );
        expect(merged.state).toBe('merged');
        expect(closed.state).toBe('closed without merging');
    });

    test('explains a 404 as missing access', async () => {
        const { fetchImpl } = fakeGitHub({});
        await expect(readThemeBuilderPr(fetchImpl, 't', 42)).rejects.toThrow(/cannot read it/);
    });

    test('reports other HTTP errors by status', async () => {
        const { fetchImpl } = fakeGitHub({ [`${TB_API}/pulls/42`]: { status: 500 } });
        await expect(readThemeBuilderPr(fetchImpl, 't', 42)).rejects.toThrow(/HTTP 500/);
    });
});

describe('upsertComment', () => {
    const own = { id: 9, user: BOT, body: `${COMMENT_MARKER} old` };

    test('updates the comment this check posted earlier', async () => {
        const { fetchImpl, calls } = fakeGitHub({ 'PATCH /repos/o/r/issues/comments/9': {} });
        await upsertComment(fetchImpl, 't', 'o/r', 5, 'new', [own]);
        expect(calls).toEqual([
            { route: '/repos/o/r/issues/comments/9', method: 'PATCH', body: '{"body":"new"}' },
        ]);
    });

    test('never edits a user comment that copies the marker', async () => {
        const spoof = { id: 1, user: AUTHOR, body: `${COMMENT_MARKER} spoof` };
        const { fetchImpl, calls } = fakeGitHub({ 'POST /repos/o/r/issues/5/comments': {} });
        await upsertComment(fetchImpl, 't', 'o/r', 5, 'new', [spoof]);
        expect(calls).toEqual([
            expect.objectContaining({ route: '/repos/o/r/issues/5/comments', method: 'POST' }),
        ]);
    });

    test('posts a new comment when updating the old one fails', async () => {
        const { fetchImpl, calls } = fakeGitHub({ 'POST /repos/o/r/issues/5/comments': {} });
        await upsertComment(fetchImpl, 't', 'o/r', 5, 'new', [own]);
        expect(calls.map((c) => c.method)).toEqual(['PATCH', 'POST']);
    });
});

describe('run', () => {
    const sdkFiles = {
        base: sdkSource(['--ts-var-a', '--ts-var-gone']),
        head: sdkSource(['--ts-var-a', '--ts-var-new']),
    };
    const env = (overrides = {}) => ({
        REPO: 'o/r',
        PR_NUMBER: '5',
        BASE_SHA: 'main-sha',
        HEAD_SHA: 'head',
        GITHUB_TOKEN: 'sdk-token',
        THEME_BUILDER_READ_TOKEN: 'tb-token',
        ...overrides,
    });
    const git = (files = sdkFiles) => ({ base: () => 'base', show: (ref) => files[ref] || null });
    const sdkRoutes = ({ body = `Theme Builder: ${TB_PR}`, comments = [] } = {}) => ({
        'GET /repos/o/r/issues/5/comments': comments,
        'GET /repos/o/r/pulls/5': { body, user: AUTHOR },
        'POST /repos/o/r/issues/5/comments': {},
        'PATCH /repos/o/r/issues/comments/': {},
    });
    const log = () => {};
    const posted = (calls) =>
        calls.filter((c) => c.method !== 'GET').map((c) => JSON.parse(c.body).body);

    test('posts a pass when the linked PR matches', async () => {
        const { fetchImpl, calls } = fakeGitHub({ ...sdkRoutes(), ...tbRoutes() });
        const report = await run({ env: env(), fetchImpl, log, ...git() });
        expect(report).toMatch(/✅/);
        expect(posted(calls)).toEqual([report]);
    });

    test('posts a mismatch without naming private Theme Builder variables', async () => {
        const after = tbSource(['--ts-var-a', '--ts-var-gone', '--ts-var-private-unreleased']);
        const { fetchImpl } = fakeGitHub({ ...sdkRoutes(), ...tbRoutes({ after }) });
        const report = await run({ env: env(), fetchImpl, log, ...git() });
        expect(report).toMatch(/does not match/);
        expect(report).toMatch(/--ts-var-new/);
        expect(report).not.toMatch(/private-unreleased/);
    });

    test('uses the latest link from a trusted comment and writes the job summary', async () => {
        const summaryFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tb-')), 'summary.md');
        const comments = [{ id: 1, user: AUTHOR, author_association: 'NONE', body: TB_PR }];
        const routes = {
            ...sdkRoutes({
                body: 'Old: https://github.com/thoughtspot/Thoughtspot-theme-builder/pull/1',
                comments,
            }),
            ...tbRoutes(),
        };
        const report = await run({
            env: env({ GITHUB_STEP_SUMMARY: summaryFile }),
            fetchImpl: fakeGitHub(routes).fetchImpl,
            log,
            ...git(),
        });
        expect(report).toMatch(/✅/);
        expect(fs.readFileSync(summaryFile, 'utf8')).toMatch(/✅/);
    });

    test('ignores links from outsiders and links inside its own comments', async () => {
        const comments = [
            { id: 1, user: { login: 'stranger' }, author_association: 'NONE', body: TB_PR },
            { id: 2, user: BOT, author_association: 'NONE', body: `${COMMENT_MARKER} ${TB_PR}` },
        ];
        const { fetchImpl } = fakeGitHub({
            ...sdkRoutes({ body: 'no link', comments }),
            ...tbRoutes(),
        });
        const report = await run({ env: env(), fetchImpl, log, ...git() });
        expect(report).toMatch(/No Theme Builder PR linked/);
    });

    test('reports an error instead of failing when the PR cannot be read', async () => {
        const { fetchImpl } = fakeGitHub(sdkRoutes());
        const report = await run({ env: env(), fetchImpl, log, ...git() });
        expect(report).toMatch(/⚠️ Could not verify/);
    });

    test('reports an unreadable css-variables.ts as an error comment', async () => {
        const broken = { base: sdkSource(['--ts-var-a']), head: 'export interface Other {}' };
        const { fetchImpl, calls } = fakeGitHub(sdkRoutes());
        const report = await run({ env: env(), fetchImpl, log, ...git(broken) });
        expect(report).toMatch(/could not read this PR's src\/css-variables.ts/);
        expect(posted(calls)).toEqual([report]);
    });

    test('skips without commenting when the token secret is missing', async () => {
        const { fetchImpl, calls } = fakeGitHub(sdkRoutes());
        const report = await run({
            env: env({ THEME_BUILDER_READ_TOKEN: '' }),
            fetchImpl,
            log,
            ...git(),
        });
        expect(report).toBeNull();
        expect(posted(calls)).toEqual([]);
    });

    test('skips fork PRs before any API call', async () => {
        const { fetchImpl } = fakeGitHub({});
        const report = await run({ env: env({ IS_FORK: 'true' }), fetchImpl, log, ...git() });
        expect(report).toBeNull();
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    test('stays silent when the file is untouched and there is no earlier comment', async () => {
        const show = jest.fn();
        const { fetchImpl, calls } = fakeGitHub(sdkRoutes());
        const report = await run({
            env: env({ SDK_FILE_UNCHANGED: 'true' }),
            fetchImpl,
            log,
            show,
            base: show,
        });
        expect(report).toMatch(/Nothing to check/);
        expect(show).not.toHaveBeenCalled();
        expect(posted(calls)).toEqual([]);
    });

    test('updates its earlier comment when the variable changes were reverted', async () => {
        const same = { base: sdkSource(['--ts-var-a']), head: sdkSource(['--ts-var-a']) };
        const comments = [{ id: 3, user: BOT, body: `${COMMENT_MARKER} 🔴 old result` }];
        const { fetchImpl, calls } = fakeGitHub(sdkRoutes({ comments }));
        await run({ env: env(), fetchImpl, log, ...git(same) });
        expect(calls).toContainEqual(
            expect.objectContaining({ route: '/repos/o/r/issues/comments/3', method: 'PATCH' }),
        );
    });
});
