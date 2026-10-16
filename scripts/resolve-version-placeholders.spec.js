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

    test('recognises each mode flag', () => {
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

    const sourcePath = () => path.join(tempDir, 'index.ts');
    const write = (contents) => fs.writeFileSync(sourcePath(), contents, 'utf8');
    const read = () => fs.readFileSync(sourcePath(), 'utf8');

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

    test('--check exits non-zero when a placeholder is unresolved', () => {
        write(' * @version SDK: <TBD> | ThoughtSpot: *');

        main(['--check'], tempDir);

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('1 unresolved'));
    });

    test('--check passes once everything is resolved', () => {
        write(' * @version SDK: 1.28.0 | ThoughtSpot: *');

        main(['--check'], tempDir);

        expect(exitSpy).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No unresolved'));
    });
});
