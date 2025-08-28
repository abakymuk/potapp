const decideCache = new Map<string, { until: number; value: boolean; variant?: string | null }>()

const now = () => Date.now()
const ttl = Number(process.env['FF_DECIDE_TTL_MS'] || 60000)

type DecideResp = { featureFlags?: Record<string, boolean | string>; }

export async function decideIsEnabled(
  host: string,
  apiKey: string,
  distinctId: string,
  key: string,
  personProps?: Record<string, unknown>,
  groups?: Record<string, string>
) {
  const ck = `${host}:${key}:${distinctId}`
  const hit = decideCache.get(ck)
  if (hit && hit.until > now()) return { key, enabled: !!hit.value, variant: hit.variant ?? null, source: 'cache' as const }

  const url = `${host.replace(/\/$/, '')}/decide/`
  const body = {
    token: apiKey, // project API key
    distinct_id: distinctId,
    groups,
    person_properties: personProps,
    // Примечание: можно добавить 'v' для версии флагов/вариантов.
  }
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error(`Decide ${res.status}`)
    const json = (await res.json()) as DecideResp
    const value = json.featureFlags?.[key]
    const enabled = typeof value === 'string' ? true : !!value
    const variant = typeof value === 'string' ? value : null
    decideCache.set(ck, { until: now() + ttl, value: enabled, variant })
    return { key, enabled, variant, source: 'posthog' as const }
  } catch {
    return { key, enabled: false, variant: null, source: 'fallback' as const }
  }
}
