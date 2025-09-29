module.exports = {
    compilationOptions: {
        preferredConfigPath: '../tsconfig.json',
        followSymlinks: false,
    },
    entries: [
        {
            filePath: '../lib/src/index.d.ts',
            outFile: '../visual-embed-sdk.d.ts',
            noCheck: true,
            output: {
                noBanner: false,
                respectPreserveConstEnum: false,
            },
            libraries: {
                inlinedLibraries: ['@babel/types'],
            },
        }
    ],
};
