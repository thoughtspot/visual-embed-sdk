module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    collectCoverageFrom: ['./**'],
    coverageDirectory: '../coverage/sdk/',
    coverageReporters: ['lcov', 'text', 'cobertura'],
    coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
    testPathIgnorePatterns: ['/lib/', '/docs/'],
    testMatch: ['**/*.spec.ts'],
    globals: {
        window: {
            location: {
                protocol: 'https:',
            },
        },
    },
};
