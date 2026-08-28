import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      complexity: ['warn', 10],
      'max-lines-per-function': ['warn', 75],
      'max-lines': ['warn', 300],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
);
