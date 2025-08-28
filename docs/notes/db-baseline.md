# DB Baseline Schema

## Обзор

Базовая схема БД для PotLucky с multi-tenant архитектурой и полным циклом заказов.

## Миграция

- **Файл**: `supabase/migrations/20250828230329_baseline_schema.sql`
- **Статус**: ✅ Создана и применена успешно
- **Проверка**: ✅ Все 9 таблиц созданы и доступны

## Ключевые принципы

### Денежные значения

- Все цены в **центах** (integer)
- Check constraints: `>= 0`
- Currency: USD по умолчанию

### Временные метки

- `created_at`, `updated_at` — `timestamptz`
- `updated_at` — автоматически обновляется триггером `set_updated_at()`

### Multi-tenancy

- Все таблицы (кроме `memberships`) содержат `tenant_id`
- RLS политики будут настроены в S-01.3 (deny-by-default)

### Индексы

- `tenant_id` — на всех таблицах для RLS
- `status` — на orders для фильтрации
- `created_at` — на orders для сортировки
- `is_active` — на items для фильтрации

## Команды применения

### Локально (через Supabase CLI)

```bash
# Применить новую миграцию
supabase db push

# Или сбросить локальную БД (если можно)
supabase db reset
```

### Проверки

```sql
-- Расширения и типы
select extname from pg_extension where extname in ('vector');
select typname from pg_type where typname in ('membership_role_enum','order_status_enum');

-- Схема таблиц
\d public.tenants
\d public.users
\d public.memberships
\d public.sites
\d public.menus
\d public.items
\d public.orders
\d public.order_items
\d public.events
```

## Таблицы

### Core

- **tenants** — организации/клиенты
- **users** — глобальные пользователи (связь с auth.users)
- **memberships** — роли пользователей в тенантах

### Business

- **sites** — витрины/сайты
- **menus** — меню сайтов
- **items** — позиции меню
- **orders** — заказы
- **order_items** — строки заказов

### System

- **events** — outbox/аудит (CloudEvents)

## Следующие шаги

- **S-01.3** — RLS политики (deny-by-default)
- **S-01.4** — Storage buckets
- **S-01.5** — Realtime публикации
- **S-01.6** — Демо-данные (сиды)

## ERD

См. `/packages/contracts/erd.md` для полной ER-диаграммы.
