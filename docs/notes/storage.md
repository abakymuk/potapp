# Storage Buckets

## Обзор

Storage buckets для multi-tenant архитектуры с RLS политиками и конвенцией путей.

## Бакеты

### site-assets (public)

- **Назначение**: Публичные файлы сайтов (изображения меню, логотипы)
- **Доступ**: Публичное чтение через CDN, запись ограничена RLS
- **Использование**: Изображения меню, статические ресурсы

### backoffice (private)

- **Назначение**: Приватные файлы (отчеты, документы)
- **Доступ**: Только для аутентифицированных пользователей
- **Использование**: Отчеты, внутренние документы

## Схема путей

### Конвенция путей

Все пути должны начинаться с `tenant_id` для RLS изоляции:

```
{tenant_id}/{category}/{subcategory}/{filename}
```

### Примеры путей

#### site-assets (public)

```
/${tenant_id}/menus/${menu_id}/${fileName}
```

**Примеры:**

- `b8a1f3d7-c04a-4f97-b605-cbcf8fcbce17/menus/7b2e8f1a-1234-5678-9abc-def012345678/margherita.jpg`
- `b8a1f3d7-c04a-4f97-b605-cbcf8fcbce17/sites/logo/restaurant-logo.png`
- `b8a1f3d7-c04a-4f97-b605-cbcf8fcbce17/menus/hero/hero-image.jpg`

#### backoffice (private)

```
/${tenant_id}/reports/${yyyy}/${mm}/${fileName}.csv
```

**Примеры:**

- `b8a1f3d7-c04a-4f97-b605-cbcf8fcbce17/reports/2024/12/sales-report.csv`
- `b8a1f3d7-c04a-4f97-b605-cbcf8fcbce17/documents/invoices/invoice-001.pdf`

## RLS Политики

### site-assets (public)

- **SELECT**: Публичное чтение (все)
- **INSERT**: Только `owner/admin/manager` в своем tenant
- **UPDATE**: Только `owner/admin/manager` в своем tenant
- **DELETE**: Только `owner/admin/manager` в своем tenant

### backoffice (private)

- **SELECT**: Только члены tenant (`viewer+`)
- **INSERT**: Только `owner/admin/manager` в своем tenant
- **UPDATE**: Только `owner/admin/manager` в своем tenant
- **DELETE**: Только `owner/admin/manager` в своем tenant

## Helper функции

### app.path_tenant(object_name)

```sql
-- Извлекает tenant_id из пути объекта
select app.path_tenant('b8a1f3d7-c04a-4f97-b605-cbcf8fcbce17/menus/123/image.jpg');
-- Результат: b8a1f3d7-c04a-4f97-b605-cbcf8fcbce17

select app.path_tenant('invalid-path/menus/123/image.jpg');
-- Результат: null
```

## Примеры использования

### Загрузка файла (Client SDK)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

// Получаем tenant_id из сессии
const {
  data: { user },
} = await supabase.auth.getUser()
const tenantId = getCurrentTenantId() // из вашего контекста

// Загружаем изображение меню
const { data, error } = await supabase.storage
  .from('site-assets')
  .upload(`${tenantId}/menus/${menuId}/${fileName}`, file, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
  })

if (error) {
  console.error('Ошибка загрузки:', error.message)
} else {
  console.log('Файл загружен:', data.path)
}
```

### Получение публичного URL

```javascript
// Получаем публичный URL для site-assets
const { data } = supabase.storage
  .from('site-assets')
  .getPublicUrl(`${tenantId}/menus/${menuId}/${fileName}`)

console.log('Публичный URL:', data.publicUrl)
```

### Загрузка приватного файла

```javascript
// Загружаем отчет в backoffice
const { data, error } = await supabase.storage
  .from('backoffice')
  .upload(`${tenantId}/reports/${year}/${month}/report.csv`, csvFile, {
    contentType: 'text/csv',
  })
```

### Список файлов

```javascript
// Получаем список файлов в папке
const { data, error } = await supabase.storage
  .from('site-assets')
  .list(`${tenantId}/menus/${menuId}`)

if (data) {
  data.forEach((file) => {
    console.log('Файл:', file.name)
  })
}
```

## Безопасность

### Важные принципы

1. **Никогда не принимайте путь из пользовательского ввода** без проверки
2. **tenant_id всегда берется из сессии** пользователя
3. **Проверяйте права доступа** перед операциями
4. **Используйте helper функции** для извлечения tenant_id

### Валидация на клиенте

```javascript
// ✅ Правильно - tenant_id из сессии
const path = `${currentTenantId}/menus/${menuId}/${fileName}`

// ❌ Неправильно - путь из пользовательского ввода
const path = userInputPath // ОПАСНО!
```

### Обработка ошибок

```javascript
const { data, error } = await supabase.storage.from('site-assets').upload(path, file)

if (error) {
  if (error.message.includes('new row violates row-level security policy')) {
    console.error('Доступ запрещен: неверный tenant_id или недостаточно прав')
  } else {
    console.error('Ошибка загрузки:', error.message)
  }
}
```

## Smoke тесты

### Запуск проверки

```bash
# Установить переменные окружения
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE="..."

# Запустить проверку
node scripts/check-storage-smoke.mjs
```

### Что проверяется

1. **Бакеты созданы**: site-assets и backoffice
2. **Функция app.path_tenant()**: корректно извлекает tenant_id
3. **Deny-by-default**: анонимные загрузки отклоняются
4. **Политики**: все политики storage.objects созданы

## Следующие шаги

1. **S-01.5** — Realtime публикации
2. **S-01.6** — Демо-данные и полные тесты
3. **Подписанные URL**: для приватного доступа к backoffice
4. **CDN кэширование**: для оптимизации site-assets
5. **Валидация файлов**: MIME типы, размеры, форматы

## Troubleshooting

### Проблема: "new row violates row-level security policy"

**Решение**: Проверьте tenant_id в пути и права пользователя

### Проблема: "bucket not found"

**Решение**: Убедитесь, что бакеты созданы через миграцию

### Проблема: "function app.path_tenant() does not exist"

**Решение**: Убедитесь, что миграция Storage применена

### Проблема: "permission denied for bucket"

**Решение**: Проверьте, что RLS политики созданы и пользователь аутентифицирован
