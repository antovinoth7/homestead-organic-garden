const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const rnPlugin = require('eslint-plugin-react-native');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'assets/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'UI/**',
      'eslint.config.cjs',
      'app.config.js',
      'metro.config.js',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-native': rnPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      'prefer-const': 'warn',
      'no-case-declarations': 'warn',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'react-native/no-color-literals': 'error',
      'react-native/no-inline-styles': 'error',
      'react-native/no-raw-text': ['error', { skip: ['Text'] }],

      // eslint-config-expo 57 pulled in eslint-plugin-react-hooks v7, whose
      // React-Compiler-era rules flagged 214 pre-existing call sites. All six
      // were demoted to warnings during the upgrade; five have since been
      // triaged to zero and are back at "error", so a regression fails the
      // build. The handful of legitimate exceptions carry inline disables with
      // a note explaining why. Do not demote these again -- fix the call site.
      'react-hooks/refs': 'error',
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/globals': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/purity': 'error',

      // Still a warning. The 11 genuine findings (cascading renders from state
      // written back by an effect) are fixed; the 54 that remain are benign --
      // prop-to-state sync on a sheet opening, and async loaders whose only
      // synchronous write is a setLoading(true) the hook already initialises to
      // true. Clearing them means restructuring those sheets around a `key`
      // reset, which is its own piece of work.
      // Baseline: 0 errors, 54 warnings. A new warning is a regression.
      // See docs/IMPLEMENTATION_ROADMAP.md section 9, Post-Upgrade Backlog.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Node CLI scripts (codemap, deps check) — CommonJS, no return-type annotations
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  prettier,
]);
