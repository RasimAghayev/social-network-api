'use strict';

// Lint rules for the application code and the test suite.
//
// The rule set is deliberately small: it covers the mistakes that change the
// behaviour of the program, not the formatting. The formatter is not part of
// the toolchain, so the layout of the files is left to the author.

const nodeGlobals = {
  Buffer: 'readonly',
  URL: 'readonly',
  __dirname: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  exports: 'writable',
  fetch: 'readonly',
  module: 'writable',
  process: 'readonly',
  require: 'readonly',
  setTimeout: 'readonly',
};

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: nodeGlobals,
    },
    rules: {
      eqeqeq: ['error', 'smart'],
      'no-console': 'off',
      'no-duplicate-case': 'error',
      'no-undef': 'error',
      'no-unused-vars': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
