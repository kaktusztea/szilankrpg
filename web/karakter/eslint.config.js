// ESLint flat config - deliberately narrow ruleset (refactor phase 0, DEVSTATE "Webapp teljes refaktor").
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// Layer rule: engine/ is pure domain logic and must not depend on UI code.
const engineNoComponents = {
  patterns: [{ group: ['**/components/**'], message: 'engine/ must not import from components/ (layer rule, DEVSTATE refactor phase 2).' }],
};

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin, 'react-hooks': reactHooks },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/**/*.test.ts'],
    rules: { 'no-restricted-imports': ['error', engineNoComponents] },
  },
);
