# Commit Hooks

- Husky pre-commit запускает `lint-staged`.
- lint-staged форматирует **только staged** файлы через Prettier.
- Конфиг в root `package.json` → `"lint-staged": { … }`.
- Обойти hook: `git commit --no-verify` (не рекомендуется).
