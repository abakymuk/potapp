# PotLucky

Современный монорепозиторий с TypeScript, Next.js, Cloudflare Workers и PostHog.

## 🚀 Быстрый старт

```bash
# Установка зависимостей
pnpm install

# Разработка
pnpm dev

# Проверки
pnpm check:all
```

## 🛠️ Команды

### Основные

- `pnpm dev` - запуск в режиме разработки
- `pnpm build` - сборка всех пакетов
- `pnpm clean` - очистка сборок

### Проверки

- `pnpm check:fast` - быстрые проверки (format, lint, typecheck)
- `pnpm check:build` - проверка сборки
- `pnpm check:env` - аудит переменных окружения
- `pnpm check:rls` - проверка RLS изоляции
- `pnpm check:all` - все проверки

### Форматирование

- `pnpm format` - форматирование кода
- `pnpm polish:write` - автоматическое исправление
- `pnpm fix` - форматирование + проверки

## 📁 Структура

```
potapp/
├── apps/
│   └── web/          # Next.js приложение
├── packages/
│   ├── contracts/    # Общие типы
│   ├── db/          # База данных
│   ├── lib/         # Общие утилиты
│   └── ui/          # UI компоненты
└── docs/            # Документация
```

## 🔧 Технологии

- **TypeScript** - типизация
- **Turborepo** - монорепозиторий
- **Next.js** - веб-приложение

- **PostHog** - аналитика и feature flags
- **ESLint + Prettier** - качество кода
- **Husky** - Git hooks

## 📚 Документация

См. [docs/README.md](./docs/README.md) для подробной документации.
