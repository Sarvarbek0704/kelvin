// @ts-check
/**
 * Kelvin — umumiy ESLint bazasi (TypeScript paketlar uchun).
 *
 * `apps/api` o'zining kengaytmasini (NestJS, pul float taqiqi) qo'shadi.
 * Bu baza faqat umumiy tip-xavfsizlik va aniqlik qoidalarini beradi.
 */
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

/**
 * @param {string} tsconfigRootDir  import.meta.dirname of the consuming package
 * @returns {import('typescript-eslint').ConfigArray}
 */
export function kelvinBaseConfig(tsconfigRootDir) {
  return tseslint.config(
    { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.js', '**/*.mjs'] },
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    prettierConfig,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          { allowExpressions: true, allowTypedFunctionExpressions: true },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        'no-console': ['error', { allow: ['warn', 'error'] }],
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        curly: ['error', 'all'],
      },
    },
  );
}
