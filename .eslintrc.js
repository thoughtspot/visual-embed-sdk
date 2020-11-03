/**
 * Copyright (c) 2020
 *
 * ESLint configuration for linting ThoughtSpot Embed UI SDK
 * source code.
 *
 * @summary ESLint config
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

module.exports = {
    env: {
        browser: true,
        es6: true,
    },
    ignorePatterns: ['*.scss', '*.md'],
    extends: [
        'airbnb-base',
        'plugin:prettier/recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    settings: {
        'import/extensions': ['.js', '.ts'],
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts'],
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
            },
            node: {
                extensions: ['.js', '.ts'],
            },
        },
    },
    rules: {
        indent: 0, // Conflict with Prettier
        '@typescript-eslint/explicit-function-return-type': [0],
        '@typescript-eslint/no-explicit-any': [0],
        '@typescript-eslint/no-unused-vars': [0],
        'import/prefer-default-export': 0,
        // do not complain when importing js related files without extension,
        // Typescript should handle this.
        'import/extensions': [0],
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: ['**/*.spec.ts'],
            },
        ],
        'import/no-absolute-path': [0],
        // Disable until this is fixed https://github.com/dividab/tsconfig-paths/issues/128
        'import/no-unresolved': 0,
        'no-plusplus': 0,
        'prefer-destructuring': 0,
        'no-continue': 0,
        'max-classes-per-file': 0,
        'class-methods-use-this': 0,
    },
};
