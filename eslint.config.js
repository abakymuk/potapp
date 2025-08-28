// eslint.config.js
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended, // базовые TS-правила без type-aware
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.build/**',
      '.tmp/**',
      '*.test.ts',
      '*.test.tsx',
      '*.spec.ts',
      '*.spec.tsx',
      '**/dist/**',
    ],
    name: 'base',
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        // поддержка ts-paths в монорепо
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.base.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
        },
        // поддержка workspace зависимостей
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // импорт-гигиена
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'warn',
      // базовая строгость
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      // стиль делегируем Prettier
    },
  },
  // всегда последним — отключает конфликты с Prettier
  prettier,
)
