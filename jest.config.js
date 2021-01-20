module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['src/**'],
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text', 'cobertura'],
    globals: {
        window: {
            location: {
                protocol: 'https:',
            },
        },
    },
};
