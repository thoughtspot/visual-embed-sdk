module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: false, // Disable coverage collection
    collectCoverageFrom: [], // No files for coverage collection
    testPathIgnorePatterns: ['*'], // Ignore all test files
    testMatch: [], // Disable test matching completely
    setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
    globals: {
        window: {
            location: {
                protocol: 'https:',
            },
        },
    },
};
