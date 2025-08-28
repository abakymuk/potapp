import fs from 'node:fs'

/* eslint-env node */
/* eslint-disable no-undef */
const EXAMPLE = 'env.example'
const required = new Set([
  // Web (public)
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
  // Server/worker
  'POSTHOG_PROJECT_API_KEY',
  'POSTHOG_HOST',
  'SENTRY_DSN',
  'SENTRY_ENV',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE',
])
const example = fs.readFileSync(EXAMPLE, 'utf8')
const declared = new Set([...example.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]))
const missing = [...required].filter((k) => !declared.has(k))
if (missing.length) {
  console.error('❌ Missing in .env.example:\n- ' + missing.join('\n- '))
  process.exit(1)
}
console.log('✅ .env.example OK')
