module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    collectCoverageFrom: ['src/**'],
    coverageDirectory: 'coverage/sdk/',
    coverageReporters: ['lcov', 'text', 'cobertura'],
    coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
    testPathIgnorePatterns: ['/lib/', '/docs/'],
    testMatch: ['**/src/**/*.spec.(ts|tsx)'],
    globals: {
        window: {
            location: {
                protocol: 'https:',
            },
        },
    },
};
