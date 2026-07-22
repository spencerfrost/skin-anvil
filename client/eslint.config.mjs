import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  { ignores: ['build/', 'node_modules/'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  jsxA11y.flatConfigs.recommended,
  { settings: { react: { version: 'detect' } } },
  {
    files: ['**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'jsx-a11y/heading-has-content': 'off',
      // matches CRA's eslint-config-react-app, which never enforced prop-types
      'react/prop-types': 'off',
    },
  },
  {
    files: ['src/__tests__/**', 'src/setupTests.js'],
    languageOptions: {
      globals: { ...globals.vitest, ...globals.node },
    },
  },
  {
    files: ['tailwind.config.js', 'postcss.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    files: ['vite.config.js', 'eslint.config.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
];
