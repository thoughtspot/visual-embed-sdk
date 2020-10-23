const path = require('path');

module.exports = {
    entry: './src/index.ts',
    output: {
        library: 'tsembed',
        libraryTarget: 'umd',
        filename: 'tsembed.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [{ test: /\.ts$/, loader: 'ts-loader' }],
    },
};
