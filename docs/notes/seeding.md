# Database Seeding

## Обзор

Seed скрипт для создания минимальных демо-данных в базе данных.

## Команда

```bash
pnpm db:seed
```

**Требования:**

- `SUPABASE_URL` - URL вашего Supabase проекта
- `SUPABASE_SERVICE_ROLE` - сервисный ключ (обходит RLS)

## Создаваемые данные

### Основные сущности

- **1 tenant**: `demo-tenant` (Demo Tenant)
- **1 user**: owner с ролью owner
- **1 site**: Main Site
- **1 menu**: Main Menu (USD)
- **2 items**: Pizza Margherita ($12.00), Coca-Cola 0.33 ($3.00)
- **1 order**: с 2 позициями (Pizza x1, Cola x2, total $18.00)

### Детали

- **Tenant slug**: `demo-tenant`
- **Owner email**: `owner+demo@potlucky.dev` (или из `DEMO_OWNER_EMAIL`)
- **Owner password**: генерируется автоматически или из `DEMO_OWNER_PASSWORD`
- **Currency**: USD
- **Order status**: pending

## Настройка

### Переменные окружения

```bash
# Обязательные
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key

# Опциональные
DEMO_OWNER_EMAIL=owner+demo@potlucky.dev
DEMO_OWNER_PASSWORD=dev-ChangeMe_123
```

### Пример запуска

```bash
# Локально с переменными окружения
export SUPABASE_URL="https://wnqzzplxfoutblsksvud.supabase.co"
export SUPABASE_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
pnpm db:seed

# Или через dotenv
pnpm db:seed
```

## Идемпотентность

Скрипт идемпотентен - повторный запуск не создает дубликаты:

- **Tenants**: upsert по `slug`
- **Users**: upsert по `email`
- **Memberships**: upsert по `(tenant_id, user_id)`
- **Sites**: upsert по `(tenant_id, name)`
- **Menus**: upsert по `(site_id, title)`
- **Items**: find-first + update или insert
- **Orders**: всегда создаются новые (для демонстрации)

## Проверочные запросы

### SQL проверки

```sql
-- Проверка tenant
select count(*) from public.tenants where slug = 'demo-tenant';

-- Проверка owner membership
select count(*) from public.memberships m
join public.tenants t on t.id=m.tenant_id
where t.slug='demo-tenant' and role='owner';

-- Проверка меню
select count(*) from public.menus m
join public.sites s on s.id=m.site_id
join public.tenants t on t.id=s.tenant_id
where t.slug='demo-tenant';

-- Проверка заказов
select count(*) from public.orders o
join public.tenants t on t.id=o.tenant_id
where t.slug='demo-tenant';

-- Проверка позиций заказа
select count(*) from public.order_items oi
join public.orders o on o.id=oi.order_id;
```

**Ожидаемые результаты:**

- tenant: 1
- membership: 1
- menu: 1
- order: 1
- order_items: 2

### REST API проверки

```bash
# Получить tenant
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/tenants?slug=eq.demo-tenant"

# Получить меню
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/menus?select=*,sites!inner(*),sites.tenants!inner(*)&sites.tenants.slug=eq.demo-tenant"

# Получить заказы
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/orders?select=*,order_items(*)&tenants.slug=eq.demo-tenant"
```

## Безопасность

### Service Role

- **Использует SERVICE_ROLE**: обходит RLS политики
- **Только для локальной разработки**: не запускать в production
- **Защищенные окружения**: используйте Doppler/1Password для секретов

### Рекомендации

- **Локально**: безопасно использовать service role
- **CI/CD**: не запускать автоматически
- **Production**: использовать отдельные seed скрипты

## Troubleshooting

### Проблема: "SUPABASE_URL / SUPABASE_SERVICE_ROLE are required"

**Решение**: Установите переменные окружения

### Проблема: "new row violates row-level security policy"

**Решение**: Убедитесь, что используется SERVICE_ROLE, а не ANON_KEY

### Проблема: "duplicate key value violates unique constraint"

**Решение**: Скрипт должен быть идемпотентным, проверьте логику upsert

### Проблема: "function app.path_tenant() does not exist"

**Решение**: Убедитесь, что миграции S-01.3 и S-01.4 применены

## Пример вывода

```
🌱 Starting database seeding...

🏢 Tenant created: b0a0807b-c04a-4f97-b605-cbcf8fcbce17 (demo-tenant)
👤 Owner auth user: 12345678-1234-1234-1234-123456789012 (owner+demo@potlucky.dev) | password: Seed_aB3cD4eF!
👤 Public user created: 87654321-4321-4321-4321-210987654321
🔗 Membership created: owner role
🌐 Site created: 11111111-1111-1111-1111-111111111111 (Main Site)
📋 Menu created: 22222222-2222-2222-2222-222222222222 (Main Menu)
🍕 Items created: 33333333-3333-3333-3333-333333333333 (Pizza Margherita), 44444444-4444-4444-4444-444444444444 (Coca-Cola 0.33)
🛒 Order created: 55555555-5555-5555-5555-555555555555 (total: $18.00)

🏁 Seed complete!
📊 Summary:
  tenant: b0a0807b-c04a-4f97-b605-cbcf8fcbce17
  site:   11111111-1111-1111-1111-111111111111
  menu:   22222222-2222-2222-2222-222222222222
  items:  33333333-3333-3333-3333-333333333333, 44444444-4444-4444-4444-444444444444
  order:  55555555-5555-5555-5555-555555555555 (total_cents=1800)

🔗 Login credentials:
  email: owner+demo@potlucky.dev
  password: Seed_aB3cD4eF!
```

## Следующие шаги

1. **Тестирование RLS**: войти под созданным пользователем и проверить доступ к данным
2. **Расширенные данные**: создать дополнительные tenants, users, orders
3. **Тестовые фикстуры**: отдельные скрипты для тестов
4. **Production seeding**: адаптировать для production окружения
