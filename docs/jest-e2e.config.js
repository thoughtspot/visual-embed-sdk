module.exports = {
    preset: 'jest-puppeteer',
    globals: { URL: 'http://localhost:9545/en/' },
    testMatch: ['**/docs/test/**/*.spec.ts'],
    verbose: true,
};
