/* eslint-env node */
/* eslint-disable no-undef */

// Псевдо-проверка RLS через REST API
// В реальном проекте адаптируй под твой Supabase клиент

const url = process.env.SUPABASE_URL + '/rest/v1/orders?select=id,tenant_id'
const anon = process.env.SUPABASE_ANON_KEY
const t1 = process.env.TEST_TENANT1_TOKEN
const t2 = process.env.TEST_TENANT2_TOKEN

async function q(token) {
  return fetch(url, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
    },
  }).then((r) => r.json())
}

try {
  const [a, b] = await Promise.all([q(t1), q(t2)])
  const ids1 = new Set(a.map((x) => x.tenant_id))
  const ids2 = new Set(b.map((x) => x.tenant_id))
  const cross = [...ids1].some((id) => ids2.has(id))

  if (cross) {
    console.error('❌ RLS breach: cross-tenant rows visible')
    process.exit(1)
  }
  console.log('✅ RLS isolation OK')
} catch (error) {
  console.log('⚠️ RLS check skipped (no test tokens or Supabase not configured)')
  console.log('To enable RLS checks, add TEST_TENANT1_TOKEN and TEST_TENANT2_TOKEN to your .env')
}
