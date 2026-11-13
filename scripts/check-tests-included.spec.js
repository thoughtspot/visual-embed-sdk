jest.mock('child_process');
const { execSync } = require('child_process');
const { check, getChangedFiles, main } = require('./check-tests-included');

describe('check-tests-included', () => {
    test('passes when no source files changed', () => {
        expect(check(['README.md', '.github/workflows/main.yml']).ok).toBe(true);
    });

    test('fails when source changed without tests', () => {
        const result = check(['src/embed/liveboard.ts']);
        expect(result.ok).toBe(false);
        expect(result.src).toEqual(['src/embed/liveboard.ts']);
    });

    test('passes when source and spec changed', () => {
        expect(check(['src/embed/liveboard.ts', 'src/embed/liveboard.spec.ts']).ok).toBe(true);
    });

    test('fails when the only spec changed is outside src/', () => {
        const result = check(['src/embed/liveboard.ts', 'scripts/check-tests-included.spec.js']);
        expect(result.ok).toBe(false);
        expect(result.src).toEqual(['src/embed/liveboard.ts']);
    });

    test('ignores .d.ts-only changes', () => {
        expect(check(['src/types.d.ts']).ok).toBe(true);
    });

    test('getChangedFiles diffs against the base branch and parses output', () => {
        execSync.mockReturnValue('src/a.ts\nsrc/a.spec.ts\n');
        expect(getChangedFiles('release')).toEqual(['src/a.ts', 'src/a.spec.ts']);
        expect(execSync).toHaveBeenCalledWith(
            'git diff --name-only --diff-filter=d origin/release...HEAD',
            { encoding: 'utf8' },
        );
    });

    test('main returns 1 when tests are missing and 0 when present', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        execSync.mockReturnValue('src/a.ts\n');
        expect(main()).toBe(1);
        execSync.mockReturnValue('src/a.ts\nsrc/a.spec.ts\n');
        expect(main()).toBe(0);
    });
});
