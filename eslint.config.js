import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', '.firebase/'] },
  js.configs.recommended,
  {
    files: ['public/js/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['test/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
];
