module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    collectCoverageFrom: ['src/**'],
    coverageDirectory: 'coverage/sdk/',
    // coverageReporters: ['lcov', 'text', 'cobertura'],
    coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
    coverageThreshold: {
        './src/': {
            branches: 86,
            functions: 88,
            lines: 96,
        },
    },
    testPathIgnorePatterns: ['/lib/', '/docs/', '/cjs/'],
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
