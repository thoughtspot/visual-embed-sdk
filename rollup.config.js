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

import pkg from './package.json';

export default {
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
    plugins: [
        typescript({
            typescript: require('typescript'),
        }),
        nodeResolve(),
        commonjs(),
    ],
};
