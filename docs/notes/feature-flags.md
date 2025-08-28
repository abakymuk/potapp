# Feature Flags (PostHog)

- Веб: posthog-js, identify(distinctId), reloadFeatureFlagsAsync
- Сервер/Worker: Decide API через fetch, TTL кэш (env FF_DECIDE_TTL_MS)
- Env: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, POSTHOG_PROJECT_API_KEY, POSTHOG_HOST
- Безопасный дефолт: disabled + warning
- Использование:
  import { isEnabled } from '@lib/ff'
  const r = await isEnabled({ kind: 'worker', distinctId }, 'new_checkout_flow')
