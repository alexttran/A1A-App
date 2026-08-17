// ESLint flat config.
//
// Division of labour with Prettier: ESLint owns correctness and code-health
// rules, Prettier owns formatting. `eslint-config-prettier` is applied LAST so
// it can switch off every stylistic rule that would otherwise fight the
// formatter. There is deliberately no `eslint-plugin-prettier` — running
// Prettier through ESLint makes lint slow and turns formatting drift into
// error-level noise. Run `npm run format` instead.

const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'ios/**',
      'android/**',
      'expo-env.d.ts',
      'src/lib/database.types.ts', // generated from the Supabase schema
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Unused vars are an error, but an underscore prefix marks a deliberate
      // discard (destructuring rest, unused callback params).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Type-only imports get erased at build time; being explicit keeps the
      // bundle from accidentally retaining a module for its types alone.
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // console.log left in a release build leaks data to device logs. Warn on
      // it; console.warn/error are legitimate.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  // Applied last: disables everything Prettier already handles.
  prettierConfig,
]);
