import posthog from 'posthog-js'
import type { FFResult } from './types'

let initialized = false
export function initWebPosthog() {
  if (initialized) return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY!
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  if (!key) return
  posthog.init(key, { api_host: host, autocapture: false })
  initialized = true
}

export async function webIsEnabled(key: string, distinctId: string): Promise<FFResult> {
  initWebPosthog()
  if (!distinctId) return { key, enabled: false, variant: null, source: 'fallback' }
  posthog.identify(distinctId)
  // posthog-js синхронно/асинхронно подтянет флаги; ждём актуализацию:
  await posthog.reloadFeatureFlagsAsync?.()
  const variant = (posthog.getFeatureFlag?.(key) as string | boolean | undefined) ?? false
  const enabled = typeof variant === 'string' ? true : !!variant
  return { key, enabled, variant: typeof variant === 'string' ? variant : null, source: 'client' }
}
