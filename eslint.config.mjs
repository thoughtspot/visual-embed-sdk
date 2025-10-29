import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import eslintPluginCommentLength from "eslint-plugin-comment-length";

export default defineConfig([
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    eslintPluginCommentLength.configs["flat/recommended"],
    { 
        files: ['**/*.{js,ts,jsx,tsx}'],
        extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
        rules: {
			'no-tabs': ['error', { allowIndentationTabs: true }],
            'jsx-quotes': [2, 'prefer-double'],
            '@typescript-eslint/explicit-function-return-type': [0],
            '@typescript-eslint/no-explicit-any': [0],
            '@typescript-eslint/no-unused-vars': [0],
            'import/prefer-default-export': 0,
            'no-use-before-define': 'off',
            '@typescript-eslint/no-use-before-define': ['off'],
            'import/extensions': [0],
            'import/no-absolute-path': [0],
            'import/no-unresolved': 0,
            'no-plusplus': 0,
            'prefer-destructuring': 0,
            'no-continue': 0,
            'max-classes-per-file': 0,
            'class-methods-use-this': 0,
                'no-shadow': 'off',
            '@typescript-eslint/no-shadow': ['error'],
            'no-param-reassign': 0,
            'jsdoc/check-tag-names': 0,
            'import/namespace': 0,
            '@typescript-eslint/no-duplicate-enum-values': "warn",
            "react/display-name": "warn",
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: ['**/*.spec.{ts,tsx}'],
                },
            ],
            'comment-length/limit-multi-line-comments': [
                'warn',
                {
                    maxLength: 90,
                    ignoreUrls: true,
                },
            ],
            'import/no-cycle': "error"
        },
    },
]);