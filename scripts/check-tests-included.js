#!/usr/bin/env node
/**
 * SCAL-227566: fail a PR that changes SDK source without adding or updating a test.
 * Rule: if any src/**\/*.ts(x) file changed (not a spec, not a .d.ts), at least
 * one *.spec.(ts|tsx|js) file must change too.
 */
const { execSync } = require('child_process');

const SRC_RE = /^src\/.*\.tsx?$/;
const TEST_RE = /\.spec\.(ts|tsx|js)$/;
const DTS_RE = /\.d\.ts$/;

function check(files) {
    const src = files.filter((f) => SRC_RE.test(f) && !TEST_RE.test(f) && !DTS_RE.test(f));
    const tests = files.filter((f) => TEST_RE.test(f));
    if (src.length === 0) return { ok: true, reason: 'No source changes, tests not required.' };
    if (tests.length === 0) return { ok: false, src };
    return { ok: true, reason: `Tests found: ${tests.join(', ')}` };
}

function getChangedFiles(baseRef) {
    const out = execSync(`git diff --name-only origin/${baseRef}...HEAD`, { encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

function main() {
    const result = check(getChangedFiles(process.env.BASE_REF || 'main'));
    if (result.ok) {
        console.log(`✓ ${result.reason}`);
        return 0;
    }
    console.error('✗ This PR changes source code but adds or updates no tests (*.spec.ts):');
    result.src.forEach((f) => console.error(`   - ${f}`));
    console.error("Add tests, or ask a reviewer to add the 'skip-test-check' label.");
    return 1;
}

if (require.main === module) process.exit(main());

module.exports = { check, getChangedFiles, main };
