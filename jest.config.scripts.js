// Release/build tooling under scripts/ is plain CommonJS and must not be pulled
// into the SDK jest project: `files` in package.json ships src/**, and the src
// coverage thresholds are tuned for library code, not build scripts.
module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['scripts/**/*.js'],
    coverageDirectory: 'coverage/scripts/',
    coverageThreshold: {
        './scripts/resolve-version-placeholders.js': {
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
    testMatch: ['**/scripts/**/*.spec.js'],
};
