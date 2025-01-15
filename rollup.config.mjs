import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

import pkg from './package.json' assert { type: 'json' };

const plugins = (tsconfigOverride) => [
    typescript({
        tsconfigOverride,
        useTsconfigDeclarationDir: true,
    }),
    nodeResolve(),
    commonjs({
        transformMixedEsModules: true,
    }),
    json({
        compact: true,
    }),
    replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
    }),
];

const banner = `/* @thoughtspot/visual-embed-sdk version ${pkg.version} */`;

export default [
    {
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
        external: [...Object.keys(pkg.peerDependencies || {})],
        plugins: plugins({}),
    },
    {
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
        external: [...Object.keys(pkg.peerDependencies || {})],
        plugins: plugins({}),
    },
    {
        input: 'src/index.mobile.ts',
        output: [
            {
                file: 'dist/index.mobile.js',
                format: 'cjs',
                sourcemap: true,
                banner,
            },
            {
                file: 'dist/index.mobile.es.js',
                format: 'es',
                sourcemap: true,
                banner,
            },
        ],
        external: [
            // 'react-native', // Ensure react-native is external
            // 'react-native-url-polyfill', // Ensure the polyfill is external
            ...Object.keys(pkg.peerDependencies || {}).filter(
                (dep) => dep !== 'react-dom' // Exclude react-dom for mobile builds
            ),
        ],
        plugins: plugins({
            compilerOptions: {
                declaration: true,
                declarationMap: true,
                declarationDir: 'dist',
                outDir: 'dist',
            },
            include: ['src/index.mobile.ts'],
        }),
    },
    {
        input: 'src/native/index.ts',
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
        plugins: plugins({}),
    },
];
