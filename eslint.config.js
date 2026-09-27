const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // Config plugins run in Node during prebuild.
    files: ['plugins/**/*.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', require: 'readonly', module: 'writable' },
    },
  },
  {
    ignores: ['dist/*', '.expo/*', 'supabase/functions/*', 'src/uniwind-types.d.ts'],
  },
]);
