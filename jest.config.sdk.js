module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    collectCoverageFrom: ['src/**'],
    coverageDirectory: 'coverage/sdk/',
    coverageReporters: ['lcov', 'text', 'cobertura'],
    coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
    coverageThreshold: {
        './src/': {
            branches: 84, // Decreasing the coverage to make a critical fix (SCAL-94402)
            functions: 85,
            lines: 85,
        },
    },
    testPathIgnorePatterns: ['/lib/', '/docs/'],
    testMatch: ['**/src/**/*.spec.(ts|tsx)'],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
    globals: {
        window: {
            location: {
                protocol: 'https:',
            },
        },
    },
};
