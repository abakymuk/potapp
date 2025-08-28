S-00.7 — Project Polish & Hardening (финальный «гигиена»-проход по S-тикетам)

Goal: отполировать репозиторий после S-00.1…S-00.6: единые скрипты, env-аудит, редакторные настройки, документация, минимальные проверки безопасности и RLS-смоки.
Scope:
• In: root-скрипты check:_/polish:_, .gitattributes, VSCode настройки, README/Docs-index, env-аудит, RLS-смоки, форматирование, актуализация PR-шаблона.
• Out: релизный процесс, автодеплой, full security pipeline (CodeQL, gitleaks) — отдельно.

AC (Gherkin)
• Given свежий клон репозитория
When я выполняю pnpm check:all
Then проходят format:check, lint, typecheck, build, env-аудит и RLS-смоки (exit code 0).
• Given заполнен .env.example
When запускаю pnpm check:env
Then отчёт показывает, что все используемые в коде process.env._/import.meta.env._ ключи присутствуют.
• Given открыт PR → main
When CI зелёный, есть 1+ approve от CODEOWNERS
Then Merge становится доступен; без ревью — недоступен.

DoD
• Добавлены root-скрипты check:_/polish:_ и документация
• .gitattributes, .vscode/{extensions,settings}.json добавлены
• README.md и /docs/README.md с индексом заметок
• .env.example синхронизирован (Vercel/CF/Supabase/PostHog/Sentry и пр.)
• Пройден pnpm check:all локально и в CI
• Смоки RLS доказали изоляцию по tenant
• PR-шаблон дополнён чек-листом «polish done»

⸻

Микротикеты (атомарные шаги)

S-00.7.a — Root scripts «check» и «polish»

В package.json (root) добавь:

{
"scripts": {
"check:fast": "pnpm format:check && pnpm lint && pnpm typecheck",
"check:build": "pnpm build",
"check:env": "node scripts/check-env.mjs",
"check:rls": "node scripts/check-rls.mjs",
"check:all": "pnpm check:fast && pnpm check:build && pnpm check:env && pnpm check:rls",
"polish:write": "pnpm format && pnpm lint --fix || true"
}
}

Создай scripts/ каталог.

⸻

S-00.7.b — Env-аудит (минимальный)

scripts/check-env.mjs:

import fs from 'node:fs'
const EXAMPLE = '.env.example'
const required = new Set([
// Web (public)
'NEXT_PUBLIC_POSTHOG_KEY','NEXT_PUBLIC_POSTHOG_HOST',
// Server/worker
'POSTHOG_PROJECT_API_KEY','POSTHOG_HOST',
'SENTRY_DSN','SENTRY_ENV',
'SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE',
// CF/Workers
'CF_ACCOUNT_ID','CF_PROJECT_NAME'
])
const example = fs.readFileSync(EXAMPLE,'utf8')
const declared = new Set([...example.matchAll(/^([A-Z0-9_]+)=/gm)].map(m=>m[1]))
const missing = [...required].filter(k=>!declared.has(k))
if (missing.length) {
console.error('❌ Missing in .env.example:\n- ' + missing.join('\n- '))
process.exit(1)
}
console.log('✅ .env.example OK')

Обнови .env.example (добавь недостающие ключи).

⸻

S-00.7.c — Смоки RLS (кросс-тенант доступ запрещён)

scripts/check-rls.mjs (псевдо-проверка через REST, адаптируй под твой клиент):

import fetch from 'node-fetch'
const url = process.env.SUPABASE_URL + '/rest/v1/orders?select=id,tenant_id'
const anon = process.env.SUPABASE_ANON_KEY
const t1 = process.env.TEST_TENANT1_TOKEN
const t2 = process.env.TEST_TENANT2_TOKEN
async function q(token){ return fetch(url,{headers:{apikey:anon, Authorization:`Bearer ${token}`}}).then(r=>r.json()) }
const [a,b]=await Promise.all([q(t1),q(t2)])
const ids1=new Set(a.map(x=>x.tenant_id)); const ids2=new Set(b.map(x=>x.tenant_id))
const cross = [...ids1].some(id=>ids2.has(id))
if(cross){ console.error('❌ RLS breach: cross-tenant rows visible'); process.exit(1) }
console.log('✅ RLS isolation OK')

Для смока нужны два тест-пользователя разных тенантов (access token’ы) — добавь временно в локальный .env как TEST_TENANT\*\_TOKEN.

⸻

S-00.7.d — .gitattributes (нормализация EOL/диффы)

.gitattributes:

- text=auto eol=lf
  _.md linguist-language=Markdown
  _.sql diff=sql
  \*.lock -text

⸻

S-00.7.e — VSCode рекомендации

.vscode/extensions.json:

{ "recommendations": ["dbaeumer.vscode-eslint","esbenp.prettier-vscode","streetsidesoftware.code-spell-checker"] }

.vscode/settings.json:

{
"editor.formatOnSave": true,
"editor.defaultFormatter": "esbenp.prettier-vscode",
"files.eol": "\n",
"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }
}

⸻

S-00.7.f — README и Docs-index

README.md (root) — кратко: стек, как запустить, команды check:\*.
/docs/README.md — индекс заметок:

- notes/monorepo.md
- notes/linting.md
- notes/ci.md
- notes/commit-hooks.md
- notes/feature-flags.md
- runbooks/incidents.md
- runbooks/queues.md

⸻

S-00.7.g — Обновить PR-шаблон чек-листами polish

Дополнить .github/pull_request_template.md блоком:

## Polish checklist

- [ ] `pnpm check:all` зелёный
- [ ] .env.example обновлён, секреты не в диффе
- [ ] Документация/скрины обновлены

⸻

S-00.7.h — Пакетные алиасы «удобства»

В package.json (root) добавь:

{
"scripts": {
"clean:all": "turbo run clean && rimraf .turbo",
"fix": "pnpm polish:write && pnpm lint && pnpm typecheck"
},
"devDependencies": { "rimraf": "^6.0.1" }
}

⸻

S-00.7.i — Синхронизация env c Vercel/CF (мануальный чек)
• Сравни .env.example с Vercel → Project → Settings → Environment Variables (dev/preview/prod).
• Сравни wrangler.toml [vars]/[env] со списком из .env.example.
• Зафиксируй отличия в /docs/notes/env-matrix.md.

⸻

S-00.7.j — Мини-аудит зависимостей (информативно)

Добавь скрипт (не падает билд, только логирует):

{ "scripts": { "audit:info": "pnpm audit || true" } }

Запусти и приложи вывод к PR (при необходимости — тикет на обновление).

⸻

S-00.7.k — Полный формат проекта

Выполни:

pnpm format
pnpm lint --fix || true
pnpm check:all

Приложи скрин/лог в PR.

⸻

Документация

/docs/notes/polish.md — коротко опиши, что делает S-00.7, как запускать check:all, как готовить тест-токены для check:rls, и где хранится env-matrix.md.

⸻

Зависимости
• Требует выполненных S-00.1…S-00.6.
• CI из S-00.3 должен дергать хотя бы pnpm check:fast; можно расширить до check:all позже.

Готов к исполнению.
