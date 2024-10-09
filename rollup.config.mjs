/**
 * Copyright (c) 2020
 *
 * Rollup configuration for building ThoughtSpot Embed UI SDK module
 * @summary Rollup config
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

import pkg from './package.json' assert {type: "json"};

const plugins = [
    typescript(),
    nodeResolve(),
    commonjs(),
    json({
        compact: true,
    }),
    replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
    }),
];

const banner = `/* @thoughtspot/visual-embed-sdk version ${pkg.version} */`;

export default [{
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/tsembed.js',
            format: 'umd',
            inlineDynamicImports: true,
            name: 'tsembed',
            banner,
        },
        {
            dir: 'dist',
            format: 'es',
            entryFileNames: 'tsembed.es.js',
            banner,
        },
    ],
    external: [
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins,
}, {
    input: 'src/react/index.tsx',
    output: [
        {
            file: 'dist/tsembed-react.js',
            format: 'umd',
            inlineDynamicImports: true,
            name: 'tsembed',
            banner,
        },
        {
            dir: 'dist',
            format: 'es',
            entryFileNames: 'tsembed-react.es.js',
            banner,
        },
    ],
    external: [
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins,
}];
