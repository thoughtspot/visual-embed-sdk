module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    collectCoverageFrom: ['src/**'],
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text', 'cobertura'],
    coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
    testPathIgnorePatterns: ['/lib/'],
    globals: {
        window: {
            location: {
                protocol: 'https:',
            },
        },
    },
};
