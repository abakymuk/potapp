# Realtime Channels

## Обзор

Realtime подписка на изменения заказов с изоляцией по tenant_id.

## Архитектура

### Каналы

- **Формат**: `orders:tenant:<uuid>`
- **Пример**: `orders:tenant:671d5ced-eb31-4f63-8c64-5590f1db78a1`
- **Фильтрация**: `tenant_id=eq.<uuid>`

### События

- **INSERT**: создание нового заказа
- **UPDATE**: изменение существующего заказа
- **DELETE**: удаление заказа

## Настройка

### База данных

#### Публикация

```sql
-- Добавить таблицу в публикацию (идемпотентно)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname='public' and tablename='orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
```

#### Replica Identity

```sql
-- Для корректной передачи old/new значений при UPDATE
alter table public.orders replica identity full;
```

#### Индекс

```sql
-- Для оптимизации фильтрации по tenant_id
create index if not exists idx_orders_tenant on public.orders(tenant_id);
```

### Клиентская сторона

#### Переменные окружения

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Утилита подписки

```typescript
import { subscribeOrders } from '@lib/realtime/orders'

const unsubscribe = subscribeOrders(tenantId, (change) => {
  console.log('Order changed:', change)
  // change.type: 'INSERT' | 'UPDATE' | 'DELETE'
  // change.new: новая запись
  // change.old: старая запись (для UPDATE/DELETE)
})

// Отписаться
unsubscribe()
```

## Использование

### Подписка на заказы tenant

```typescript
import { subscribeOrders } from '@lib/realtime/orders'

function OrderTracker({ tenantId }: { tenantId: string }) {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const unsubscribe = subscribeOrders(tenantId, (change) => {
      switch (change.type) {
        case 'INSERT':
          setOrders(prev => [...prev, change.new])
          break
        case 'UPDATE':
          setOrders(prev => prev.map(order =>
            order.id === change.new.id ? change.new : order
          ))
          break
        case 'DELETE':
          setOrders(prev => prev.filter(order => order.id !== change.old.id))
          break
      }
    })

    return unsubscribe
  }, [tenantId])

  return <div>Orders: {orders.length}</div>
}
```

### Демо-страница

Откройте `/realtime-demo` для тестирования:

1. Введите tenant ID
2. Создайте заказ через SQL или seed скрипт
3. Наблюдайте за событиями в реальном времени

## Безопасность

### RLS интеграция

- **Автоматическая фильтрация**: Realtime учитывает RLS политики
- **Изоляция**: пользователи видят только свои tenant данные
- **Аутентификация**: требуется валидный JWT токен

### Проверки

```sql
-- Проверить публикацию
select * from pg_publication_tables
where pubname='supabase_realtime' and tablename='orders';

-- Проверить replica identity
select schemaname, tablename, replica_identity
from pg_tables
where tablename='orders';

-- Проверить индекс
select indexname, indexdef
from pg_indexes
where tablename='orders' and indexname='idx_orders_tenant';
```

## Troubleshooting

### Проблема: "No events received"

**Возможные причины:**

1. Таблица не добавлена в публикацию
2. Неправильный tenant_id
3. RLS блокирует доступ
4. Проблемы с аутентификацией

**Решение:**

```sql
-- Проверить публикацию
select * from pg_publication_tables where tablename='orders';

-- Проверить RLS
select schemaname, tablename, rowsecurity
from pg_tables where tablename='orders';
```

### Проблема: "Empty old/new values"

**Причина:** Не установлен `REPLICA IDENTITY FULL`
**Решение:**

```sql
alter table public.orders replica identity full;
```

### Проблема: "Connection failed"

**Возможные причины:**

1. Неправильные ENV переменные
2. Проблемы с сетью
3. Supabase недоступен

**Решение:**

```bash
# Проверить переменные
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Проверить подключение
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/orders?select=id&limit=1"
```

## Тестирование

### Создание тестового заказа

```sql
-- Вставка заказа для тестирования
insert into public.orders (
  tenant_id,
  site_id,
  status,
  subtotal_cents,
  total_cents,
  currency
) values (
  '671d5ced-eb31-4f63-8c64-5590f1db78a1',  -- ваш tenant_id
  '189cf4c3-6e3e-44ed-a8ed-f465159c35e3',  -- существующий site_id
  'pending',
  1200,
  1200,
  'USD'
);
```

### Проверка изоляции

1. Подпишитесь на tenant A
2. Создайте заказ в tenant B
3. Убедитесь, что событие не пришло

### Проверка всех событий

```typescript
// Подписка на все события (для отладки)
const supabase = createSupabaseAnon()
const channel = supabase
  .channel('debug')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) =>
    console.log('All orders:', payload),
  )
  .subscribe()
```

## Производительность

### Рекомендации

- **Фильтрация**: всегда используйте `filter: tenant_id=eq.<uuid>`
- **Отписка**: не забывайте отписываться при размонтировании компонента
- **Ограничения**: не подписывайтесь на слишком много каналов одновременно

### Мониторинг

```typescript
// Логирование статуса подключения
.subscribe((status) => {
  console.log(`Channel ${channelName}: ${status}`)
  // 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR'
})
```

## Следующие шаги

1. **Fallback механизмы**: SSE → polling
2. **UI интеграция**: дашборды, уведомления
3. **Дополнительные таблицы**: users, items, etc.
4. **Оптимизация**: batch updates, debouncing
