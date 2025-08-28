# CI Workflow

- Триггеры: PR→main, push→main
- Стадии: install → lint → typecheck → build
- Node 20.x, pnpm 9, кэш pnpm & Turbo
- Статус-чек: "CI (Node 20 / pnpm)" обязателен для мерджа в main
- Команды:
  - Локально повторить: `pnpm i && pnpm lint && pnpm typecheck && pnpm build`
