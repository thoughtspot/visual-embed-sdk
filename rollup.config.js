/**
 * Copyright (c) 2020
 *
 * Rollup configuration for building ThoughtSpot Embed UI SDK module
 *
 * @summary Rollup config
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

import pkg from './package.json';
const plugins = [
        typescript({
            typescript: require('typescript'),
        }),
        nodeResolve(),
        commonjs(),
        json({
            compact: true
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        })
    ];

export default [{
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/tsembed.js',
            format: 'umd',
            name: 'tsembed',
        },
        {
            file: 'dist/tsembed.es.js',
            format: 'es',
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
            name: 'tsembed',
        },
        {
            file: 'dist/tsembed-react.es.js',
            format: 'es',
        },
    ],
    external: [
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins,
}, {
    input: 'src/parsers/index.ts',
    output: [
        {
            file: 'dist/tsembed-parsers.js',
            format: 'umd',
            name: 'tsembed',
        },
        {
            file: 'dist/tsembed-parsers.es.js',
            format: 'es',
        },
    ],
    external: [
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins,
}];
