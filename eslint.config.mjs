import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import nodePlugin from 'eslint-plugin-node'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'

export default [
  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    ignores: ['node_modules/', 'dist/', 'coverage/'],
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier,
      import: importPlugin,
      node: nodePlugin,
    },
    extends: ['eslint:recommended'],
    rules: {
      'prettier/prettier': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-console': 'warn',
      curly: 'off',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'node/no-missing-import': 'off',
    },
  },
]
