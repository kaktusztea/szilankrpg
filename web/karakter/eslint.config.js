// ESLint flat config - deliberately narrow ruleset. Layer / tab rules: AGENTS.md "Rétegek és modulhatárok".
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// Layer rule: engine/ is pure domain logic and must not depend on UI code.
const engineNoComponents = {
  patterns: [{ group: ['**/components/**'], message: 'engine/ must not import from components/ (AGENTS.md: Rétegek és modulhatárok).' }],
};

// Tab rule: a tab folder must not import another tab (or the app-level overlays/); shared UI lives in
// components/ root, common/, dobas/, picker/ and shared logic in engine/. Regex on the relative path,
// so "../../engine/harc/…" does not match the "harc" tab.
const TABS = ['aktiv', 'harc', 'harcertekek', 'tavharc', 'tulajdonsagok', 'misztikus', 'fortelyok', 'hatterek'];
const SHARED_UI = ['common', 'dobas', 'picker'];
const noImportOf = (folders, msg) => ({
  patterns: [{ regex: `^(\\.\\./)+(${folders.join('|')})/`, message: msg }],
});
const tabBlocks = TABS.map(tab => ({
  files: [`src/components/${tab}/**/*.{ts,tsx}`],
  ignores: ['**/*.test.ts'],
  rules: {
    'no-restricted-imports': ['error', noImportOf([...TABS.filter(t => t !== tab), 'overlays'],
      `components/${tab}/ must not import another tab; move shared UI to components/common|dobas|picker, shared logic to engine/ (AGENTS.md: Rétegek és modulhatárok).`)],
  },
}));

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin, 'react-hooks': reactHooks },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/**/*.test.ts'],
    rules: { 'no-restricted-imports': ['error', engineNoComponents] },
  },
  ...tabBlocks,
  {
    files: SHARED_UI.map(d => `src/components/${d}/**/*.{ts,tsx}`),
    ignores: ['**/*.test.ts'],
    rules: { 'no-restricted-imports': ['error', noImportOf([...TABS, 'overlays'], 'Shared UI must not import a tab or overlays/ (AGENTS.md: Rétegek és modulhatárok).')] },
  },
);
