import { decideIsEnabled } from './decide'
import type { FFContext, FFResult } from './types'
import { webIsEnabled } from './web'

export async function isEnabled(ctx: FFContext, key: string): Promise<FFResult> {
  if (ctx.kind === 'web') {
    return webIsEnabled(key, ctx.distinctId)
  }
  const host = ctx.host || process.env.POSTHOG_HOST || 'https://us.i.posthog.com'
  const apiKey = ctx.apiKey || process.env.POSTHOG_PROJECT_API_KEY!
  return decideIsEnabled(host, apiKey, ctx.distinctId, key, ctx.personProps, ctx.groups)
}
