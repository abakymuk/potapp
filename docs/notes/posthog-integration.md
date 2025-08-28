# PostHog Integration

## Установка и настройка

### Зависимости
- `posthog-js` - клиентская библиотека для браузера
- `posthog-node` - серверная библиотека для Node.js

### Переменные окружения
```env
# Web (клиентская часть)
NEXT_PUBLIC_POSTHOG_KEY=phc_fg3D6jOSQxCrYRLoxoZx2X11FwgKoL5b0RSnJfdEnnV
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Server/Worker
POSTHOG_PROJECT_API_KEY=phc_fg3D6jOSQxCrYRLoxoZx2X11FwgKoL5b0RSnJfdEnnV
POSTHOG_HOST=https://eu.i.posthog.com
```

## Структура файлов

### Клиентская часть (Next.js App Router)
- `apps/web/app/providers.tsx` - PostHog Provider
- `apps/web/instrumentation-client.js` - автоматическая инициализация
- `apps/web/app/layout.tsx` - корневой layout с Provider
- `apps/web/app/page.tsx` - главная страница с демо

### Error Handling
- `apps/web/app/error.tsx` - error boundary для страниц
- `apps/web/app/global-error.tsx` - глобальный error boundary

### Серверная часть
- `apps/web/app/posthog-server.js` - серверный клиент PostHog
- `apps/web/instrumentation.js` - захват серверных ошибок

## Использование

### Клиентские события
```typescript
import { usePostHog } from 'posthog-js/react'

const posthog = usePostHog()
posthog?.capture('event_name', { property: 'value' })
```

### Серверные события
```typescript
import { getPostHogServer } from './app/posthog-server'

const posthog = getPostHogServer()
await posthog.capture('server_event', { property: 'value' })
```

### Feature Flags
```typescript
import { isEnabled } from '@lib/ff'

const result = await isEnabled({ kind: 'web', distinctId: 'user123' }, 'flag_name')
```

## Демо страницы
- `/` - главная страница с PostHog событиями
- `/ff-demo` - демонстрация Feature Flags
