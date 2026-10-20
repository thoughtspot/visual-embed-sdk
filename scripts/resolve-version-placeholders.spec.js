const fs = require('fs');
const os = require('os');
const path = require('path');

const {
    PROBLEM,
    cloudVersionWarning,
    collectSourceFiles,
    expectedCloudVersion,
    inspectVersionLine,
    main,
    parseArgs,
    processFile,
    resolveVersionLine,
} = require('./resolve-version-placeholders');

const SDK_VERSION = '1.53.0';

describe('parseArgs', () => {
    test('defaults to resolve mode', () => {
        expect(parseArgs([])).toEqual({ check: false, lint: false, dryRun: false });
    });

    test('recognizes each mode flag', () => {
        expect(parseArgs(['--check'])).toMatchObject({ check: true });
        expect(parseArgs(['--lint'])).toMatchObject({ lint: true });
        expect(parseArgs(['--dry-run'])).toMatchObject({ dryRun: true });
    });
});

describe('resolveVersionLine', () => {
    test('resolves the SDK half and leaves the ThoughtSpot half alone', () => {
        expect(
            resolveVersionLine(' * @version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl', SDK_VERSION),
        ).toBe(` * @version SDK: ${SDK_VERSION} | ThoughtSpot Cloud: 26.10.0.cl`);
    });

    test('never invents a ThoughtSpot release', () => {
        // The SDK half resolves; the ThoughtSpot <TBD> is deliberately left for
        // --lint / --check to report rather than being silently filled in.
        expect(resolveVersionLine(' * @version SDK: <TBD> | ThoughtSpot: <TBD>', SDK_VERSION)).toBe(
            ` * @version SDK: ${SDK_VERSION} | ThoughtSpot: <TBD>`,
        );
    });

    test('leaves an already released annotation untouched', () => {
        const released = ' * @version SDK: 1.28.0 | ThoughtSpot: *';
        expect(resolveVersionLine(released, SDK_VERSION)).toBe(released);
    });

    test('is case insensitive on the placeholder', () => {
        expect(resolveVersionLine(' * @version SDK: <tbd> | ThoughtSpot: *', SDK_VERSION)).toBe(
            ` * @version SDK: ${SDK_VERSION} | ThoughtSpot: *`,
        );
    });
});

describe('inspectVersionLine', () => {
    test('accepts a placeholder in the SDK half with a real ThoughtSpot release', () => {
        expect(inspectVersionLine(' * @version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl')).toEqual(
            [PROBLEM.UNRESOLVED_SDK],
        );
    });

    test('rejects a placeholder in the ThoughtSpot half', () => {
        expect(inspectVersionLine(' * @version SDK: <TBD> | ThoughtSpot: <TBD>')).toContain(
            PROBLEM.TBD_THOUGHTSPOT,
        );
    });

    test('rejects a new annotation that names no ThoughtSpot release', () => {
        expect(inspectVersionLine(' * @version SDK: <TBD>')).toContain(PROBLEM.MISSING_THOUGHTSPOT);
    });

    test('leaves legacy SDK-only annotations alone', () => {
        // ~The repo has many `@version SDK: 1.19.0` lines with no ThoughtSpot
        // segment. The rule is only enforced on lines still carrying <TBD>.
        expect(inspectVersionLine(' * @version SDK: 1.19.0')).toEqual([]);
    });

    test.each([
        ['an empty ThoughtSpot half', ' * @version SDK: <TBD> | '],
        ['a ThoughtSpot label with no version', ' * @version SDK: <TBD> | ThoughtSpot Cloud:'],
        ['a ThoughtSpot half with no version in it', ' * @version SDK: <TBD> | ThoughtSpot: TODO'],
    ])('rejects %s on a <TBD> line', (_, line) => {
        expect(inspectVersionLine(line)).toEqual([PROBLEM.UNRESOLVED_SDK, PROBLEM.MISSING_THOUGHTSPOT]);
    });

    test('reports a <TBD> ThoughtSpot half once, not also as missing', () => {
        expect(inspectVersionLine(' * @version SDK: <TBD> | ThoughtSpot: <TBD>')).toEqual([
            PROBLEM.TBD_THOUGHTSPOT,
            PROBLEM.UNRESOLVED_SDK,
        ]);
    });

    test.each([
        ['a wildcard', ' * @version SDK: <TBD> | ThoughtSpot: *'],
        ['a software release', ' * @version SDK: <TBD> | ThoughtSpot: 10.1.0.sw'],
        ['a Cloud and a software release', ' * @version SDK: <TBD> | ThoughtSpot: 26.10.0.cl, 10.13.0.sw'],
    ])('accepts %s as the ThoughtSpot release', (_, line) => {
        expect(inspectVersionLine(line)).toEqual([PROBLEM.UNRESOLVED_SDK]);
    });

    test.each([
        ['a misspelled placeholder', ' * @version SDK: <TDB> | ThoughtSpot Cloud: 26.10.0.cl'],
        ['a bare TBD', ' * @version SDK: TBD | ThoughtSpot Cloud: 26.10.0.cl'],
        ['a two-part version', ' * @version SDK: 1.53 | ThoughtSpot Cloud: 26.10.0.cl'],
        ['no version at all', ' * @version SDK: | ThoughtSpot Cloud: 26.10.0.cl'],
    ])('flags %s in the SDK half', (_, line) => {
        expect(inspectVersionLine(line)).toEqual([PROBLEM.MALFORMED_SDK]);
    });

    test('accepts a well-formed SDK half with trailing whitespace or CRLF', () => {
        expect(inspectVersionLine(' * @version SDK: 1.53.0 \r')).toEqual([]);
    });
});

describe('expectedCloudVersion', () => {
    test.each([
        ['1.48.0', '26.5.0.cl'],
        ['1.52.0', '26.9.0.cl'],
        ['1.53.0', '26.10.0.cl'],
    ])('maps SDK %s to Cloud %s', (sdk, cloud) => {
        expect(expectedCloudVersion(sdk)).toBe(cloud);
    });

    test('does not apply below the start of the lockstep sequence', () => {
        expect(expectedCloudVersion('1.28.0')).toBeNull();
    });

    test('does not apply outside the 1.x line', () => {
        expect(expectedCloudVersion('2.0.0')).toBeNull();
    });
});

describe('cloudVersionWarning', () => {
    test('warns when the Cloud version contradicts the lockstep rule', () => {
        expect(
            cloudVersionWarning(' * @version SDK: 1.53.0 | ThoughtSpot Cloud: 26.4.0.cl', SDK_VERSION),
        ).toContain('expected 26.10.0.cl');
    });

    test('stays silent when the Cloud version matches', () => {
        expect(
            cloudVersionWarning(' * @version SDK: 1.53.0 | ThoughtSpot Cloud: 26.10.0.cl', SDK_VERSION),
        ).toBeNull();
    });

    test('stays silent for wildcard and software releases', () => {
        expect(cloudVersionWarning(' * @version SDK: 1.53.0 | ThoughtSpot: *', SDK_VERSION)).toBeNull();
        expect(
            cloudVersionWarning(' * @version SDK: 1.53.0 | ThoughtSpot: 10.1.0.sw', SDK_VERSION),
        ).toBeNull();
    });
});

describe('processFile', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tbd-'));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    const writeSource = (name, contents) => {
        const filePath = path.join(tempDir, name);
        fs.writeFileSync(filePath, contents, 'utf8');
        return filePath;
    };

    test('only rewrites lines carrying the @version tag', () => {
        const filePath = writeSource(
            'a.ts',
            [
                '/**',
                ' * A <TBD> in prose stays put.',
                ' * @version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl',
                ' */',
            ].join('\n'),
        );

        const { hits, updated, changed } = processFile(filePath, SDK_VERSION);

        expect(changed).toBe(true);
        expect(hits).toHaveLength(1);
        expect(hits[0].line).toBe(3);
        expect(updated).toContain(' * A <TBD> in prose stays put.');
        expect(updated).toContain(` * @version SDK: ${SDK_VERSION} | ThoughtSpot Cloud: 26.10.0.cl`);
    });

    test('reports no change for a file with nothing to resolve', () => {
        const filePath = writeSource('b.ts', ' * @version SDK: 1.28.0 | ThoughtSpot: *');

        expect(processFile(filePath, SDK_VERSION)).toMatchObject({ changed: false, hits: [] });
    });

    test('resolves every placeholder in a file with several annotations', () => {
        const filePath = writeSource(
            'c.ts',
            [
                ' * @version SDK: <TBD> | ThoughtSpot: *',
                'export const a = 1;',
                ' * @version SDK: <TBD> | ThoughtSpot: *',
            ].join('\n'),
        );

        expect(processFile(filePath, SDK_VERSION).hits).toHaveLength(2);
    });

    test('preserves CRLF line endings', () => {
        const filePath = writeSource('d.ts', '/**\r\n * @version SDK: <TBD> | ThoughtSpot: *\r\n */\r\n');

        expect(processFile(filePath, SDK_VERSION).updated).toBe(
            `/**\r\n * @version SDK: ${SDK_VERSION} | ThoughtSpot: *\r\n */\r\n`,
        );
    });
});

describe('collectSourceFiles', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tbd-walk-'));
        fs.mkdirSync(path.join(tempDir, 'nested'));
        fs.writeFileSync(path.join(tempDir, 'a.ts'), '', 'utf8');
        fs.writeFileSync(path.join(tempDir, 'nested', 'b.tsx'), '', 'utf8');
        fs.writeFileSync(path.join(tempDir, 'c.md'), '', 'utf8');
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('walks nested directories and keeps only TypeScript sources', () => {
        const found = collectSourceFiles(tempDir).map((file) => path.basename(file)).sort();
        expect(found).toEqual(['a.ts', 'b.tsx']);
    });
});

describe('main', () => {
    let tempDir;
    let logSpy;
    let errorSpy;
    let exitSpy;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tbd-main-'));
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        jest.restoreAllMocks();
    });

    const sourcePath = (name = 'index.ts') => path.join(tempDir, name);
    const write = (contents, name) => fs.writeFileSync(sourcePath(name), contents, 'utf8');
    const read = (name) => fs.readFileSync(sourcePath(name), 'utf8');

    test('writes the resolved SDK version back to disk and is idempotent', () => {
        write(' * @version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl');

        main([], tempDir);
        const afterFirstRun = read();
        expect(afterFirstRun).not.toContain('<TBD>');
        expect(afterFirstRun).toContain('| ThoughtSpot Cloud: 26.10.0.cl');

        main([], tempDir);
        expect(read()).toBe(afterFirstRun);
    });

    test('--dry-run leaves the file untouched', () => {
        const original = ' * @version SDK: <TBD> | ThoughtSpot: *';
        write(original);

        main(['--dry-run'], tempDir);

        expect(read()).toBe(original);
    });

    test('resolving fails when a ThoughtSpot release is still <TBD>', () => {
        write(' * @version SDK: <TBD> | ThoughtSpot: <TBD>');

        main([], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('cannot be resolved automatically'));
    });

    test('a failed resolve leaves every file untouched, including resolvable ones', () => {
        const good = ' * @version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl';
        const bad = ' * @version SDK: <TBD> | ThoughtSpot: <TBD>';
        write(good, 'good.ts');
        write(bad, 'bad.ts');

        main([], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(read('good.ts')).toBe(good);
        expect(read('bad.ts')).toBe(bad);
    });

    test('resolving fails on a misspelled placeholder instead of skipping it', () => {
        const typo = ' * @version SDK: <TDB> | ThoughtSpot Cloud: 26.10.0.cl';
        write(typo);

        main([], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(read()).toBe(typo);
    });

    test('--dry-run still fails on a blocking problem', () => {
        write(' * @version SDK: <TBD> | ');

        main(['--dry-run'], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('--lint passes a PR whose SDK half is the only placeholder', () => {
        write(' * @version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl');

        main(['--lint'], tempDir);

        expect(exitSpy).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('names a ThoughtSpot release'));
    });

    test('--lint fails a PR that leaves the ThoughtSpot release as <TBD>', () => {
        write(' * @version SDK: <TBD> | ThoughtSpot: <TBD>');

        main(['--lint'], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Only the SDK version may be <TBD>'));
    });

    test('--lint fails a PR that names no ThoughtSpot release at all', () => {
        write(' * @version SDK: <TBD>');

        main(['--lint'], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test.each([
        ['an empty ThoughtSpot half', ' * @version SDK: <TBD> | '],
        ['a ThoughtSpot label with no version', ' * @version SDK: <TBD> | ThoughtSpot Cloud:'],
        ['a misspelled placeholder', ' * @version SDK: <TDB> | ThoughtSpot Cloud: 26.10.0.cl'],
    ])('--lint fails a PR with %s', (_, line) => {
        write(line);

        main(['--lint'], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('--lint passes legacy annotations it does not enforce on', () => {
        write([
            ' * @version SDK: 1.19.0',
            ' * @version SDK: 1.25.0 | ThoughtSpot: ts7.may.cl, 9.0.0.sw',
            ' * @version SDK: 1.40.0 | ThoughtSpot: 10.10.0.cl, 10.10.0-sw',
        ].join('\n'));

        main(['--lint'], tempDir);

        expect(exitSpy).not.toHaveBeenCalled();
    });

    test('--check exits non-zero when a placeholder is unresolved', () => {
        write(' * @version SDK: <TBD> | ThoughtSpot: *');

        main(['--check'], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('1 unresolved'));
    });

    test('--check fails a misspelled placeholder, so it can never ship', () => {
        write(' * @version SDK: <TDB> | ThoughtSpot Cloud: 26.10.0.cl');

        main(['--check'], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('--check only warns about <TBD> SDK halves in a pre-release', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        write(' * @version SDK: <TBD> | ThoughtSpot Cloud: 26.10.0.cl');

        main(['--check'], tempDir, '1.53.2-beta.1');

        expect(exitSpy).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('pre-release 1.53.2-beta.1'));
    });

    test('--check still fails a pre-release on anything other than a pending SDK half', () => {
        write(' * @version SDK: <TBD> | ThoughtSpot: <TBD>');

        main(['--check'], tempDir, '1.53.2-beta.1');

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('--check passes once everything is resolved', () => {
        write(' * @version SDK: 1.28.0 | ThoughtSpot: *');

        main(['--check'], tempDir);

        expect(exitSpy).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No unresolved'));
    });
});
