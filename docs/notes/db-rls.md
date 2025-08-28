# Database RLS Policies

## Обзор

Row Level Security (RLS) политики для multi-tenant архитектуры с deny-by-default подходом.

## Принципы

### Deny-by-Default

- **Все таблицы**: RLS включен
- **Права по умолчанию**: `REVOKE ALL` от `anon`, `authenticated`
- **Доступ**: только через политики

### Multi-Tenant Изоляция

- **Все таблицы** (кроме `memberships`) содержат `tenant_id`
- **Изоляция**: пользователи видят только данные своего тенанта
- **Пересечения**: пользователи могут быть в нескольких тенантах

## Служебные функции (app.\*)

### app.current_user_id()

```sql
-- Возвращает public.users.id текущего auth-пользователя
select app.current_user_id();
```

### app.member_role(tenant_id)

```sql
-- Возвращает роль пользователя в тенанте
select app.member_role('tenant-uuid');
-- Результат: 'owner', 'admin', 'manager', 'staff', 'viewer' или NULL
```

### app.is_member(tenant_id)

```sql
-- Проверяет членство в тенанте
select app.is_member('tenant-uuid');
-- Результат: true/false
```

### app.can_admin(tenant_id)

```sql
-- Проверяет права администратора (owner/admin)
select app.can_admin('tenant-uuid');
-- Результат: true для owner/admin, false для остальных
```

### app.can_write(tenant_id)

```sql
-- Проверяет права записи (owner/admin/manager)
select app.can_write('tenant-uuid');
-- Результат: true для owner/admin/manager, false для staff/viewer
```

### app.can_order_write(tenant_id)

```sql
-- Проверяет права записи заказов (включая staff)
select app.can_order_write('tenant-uuid');
-- Результат: true для owner/admin/manager/staff, false для viewer
```

## Роль-матрица

| Роль                           | SELECT (в своём tenant) | INSERT | UPDATE | DELETE |
| ------------------------------ | ----------------------- | ------ | ------ | ------ |
| **owner**                      | ✅                      | ✅     | ✅     | ✅     |
| **admin**                      | ✅                      | ✅     | ✅     | ✅     |
| **manager**                    | ✅                      | ✅     | ✅     | ⛔     |
| **staff**                      | ✅                      | ⛔     | ⛔     | ⛔     |
| **staff** (orders/order_items) | ✅                      | ✅     | ✅     | ⛔     |
| **viewer**                     | ✅                      | ⛔     | ⛔     | ⛔     |

## Политики по таблицам

### tenants

- **SELECT**: только участники (`app.is_member(id)`)
- **INSERT**: любой аутентифицированный (`auth.uid() is not null`)
- **UPDATE/DELETE**: только owner/admin (`app.can_admin(id)`)

### users

- **SELECT**: пользователи в общих тенантах + всегда себя
- **UPDATE**: только себя (`users.auth_user_id = auth.uid()`)
- **INSERT/DELETE**: не разрешены (через сервис-роль)

### memberships

- **SELECT**: члены тенанта (`app.is_member(tenant_id)`)
- **INSERT/UPDATE/DELETE**: только owner/admin (`app.can_admin(tenant_id)`)

### sites, menus, items

- **SELECT**: все члены тенанта (`app.is_member(tenant_id)`)
- **INSERT/UPDATE**: owner/admin/manager (`app.can_write(tenant_id)`)
- **DELETE**: не разрешен (только owner/admin через отдельную политику)

### orders, order_items

- **SELECT**: все члены тенанта (`app.is_member(tenant_id)`)
- **INSERT/UPDATE**: owner/admin/manager/staff (`app.can_order_write(tenant_id)`)
- **DELETE**: только owner/admin (`app.can_admin(tenant_id)`)

### events

- **SELECT**: члены тенанта (`app.is_member(tenant_id)`)
- **INSERT**: члены тенанта (`app.is_member(tenant_id)`)
- **UPDATE/DELETE**: запрещены (иммутабельность)

## Примеры запросов

### Проверка изоляции

```sql
-- Пользователь в tenant T1 не должен видеть данные tenant T2
select count(*) from public.orders where tenant_id = 'T2-UUID';
-- Результат: 0 (если пользователь не в T2)
```

### Проверка ролей

```sql
-- Staff может обновить заказ
update public.orders set status = 'paid' where id = 'order-uuid';
-- ✅ Успешно (если пользователь staff в этом tenant)

-- Staff не может обновить меню
update public.menus set title = 'New Title' where id = 'menu-uuid';
-- ❌ Ошибка RLS (если пользователь только staff)
```

## Smoke тесты

### Запуск проверки

```bash
# Установить переменные окружения
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE="..."

# Запустить проверку
node scripts/check-rls-smoke.mjs
```

### Что проверяется

1. **RLS статус**: все таблицы имеют RLS включен
2. **Политики**: все политики созданы
3. **Deny-by-default**: анонимные запросы отклоняются
4. **Функции**: все app.\* функции доступны

## Безопасность

### SERVICE_ROLE

- **Обходит RLS**: используйте осторожно
- **Применение**: воркеры, очереди, админ-скрипты
- **Рекомендация**: всегда указывайте `tenant_id` явно

### Валидация

- **Клиентская**: для UX
- **Серверная**: для безопасности
- **RLS**: последняя линия защиты

## Следующие шаги

1. **S-01.4** — Storage buckets с RLS
2. **S-01.5** — Realtime публикации
3. **S-01.6** — Демо-данные и полные тесты

## Troubleshooting

### Проблема: "new row violates row-level security policy"

**Решение**: Проверьте `tenant_id` и роль пользователя

### Проблема: "function app.current_user_id() does not exist"

**Решение**: Убедитесь, что миграция RLS применена

### Проблема: "permission denied for table"

**Решение**: Проверьте, что RLS включен и политики созданы
