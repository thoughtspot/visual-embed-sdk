module.exports = {
    compilationOptions: {
        preferredConfigPath: '../tsconfig.json',
        followSymlinks: false,
    },
    entries: [
        {
            filePath: '../lib/src/react/index.d.ts',
            outFile: '../dist/visual-embed-sdk-react.d.ts',
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