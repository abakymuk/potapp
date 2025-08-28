// scripts/seed.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const url = process.env.SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE are required')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

async function upsertTenant(slug: string, name: string) {
  // Сначала пытаемся найти существующий tenant
  const { data: existing, error: findErr } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (findErr) throw findErr

  if (existing) {
    return existing
  }

  // Если не найден, создаем новый
  const { data, error } = await supabase.from('tenants').insert({ slug, name }).select('*').single()
  if (error) throw error
  return data
}

async function ensureAuthUser(email: string, password?: string) {
  // try get by email
  const { data: byEmail } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  const found = byEmail?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (found) return { user: found, password: '(unchanged)' }

  const realPassword = password || `Seed_${randomUUID().slice(0, 8)}aA!`
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: realPassword,
    email_confirm: true,
  })
  if (error) throw error
  return { user: data.user, password: realPassword }
}

async function upsertPublicUser(authUserId: string, email: string, displayName?: string) {
  // users.email уникальный (citext). upsert по email
  const { data, error } = await supabase
    .from('users')
    .upsert({ auth_user_id: authUserId, email, display_name: displayName }, { onConflict: 'email' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function upsertMembership(
  tenantId: string,
  userId: string,
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer',
) {
  const { data, error } = await supabase
    .from('memberships')
    .upsert({ tenant_id: tenantId, user_id: userId, role }, { onConflict: 'tenant_id,user_id' })
    .select('*')
  if (error) throw error
  return data![0]
}

async function upsertSite(tenantId: string, name: string, domain?: string) {
  const { data, error } = await supabase
    .from('sites')
    .upsert({ tenant_id: tenantId, name, domain }, { onConflict: 'tenant_id,name' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function upsertMenu(tenantId: string, siteId: string, title: string, currency = 'USD') {
  const { data, error } = await supabase
    .from('menus')
    .upsert(
      { tenant_id: tenantId, site_id: siteId, title, currency },
      { onConflict: 'site_id,title' },
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function ensureItem(
  tenantId: string,
  menuId: string,
  name: string,
  price_cents: number,
  sku?: string,
) {
  // "unique (menu_id, name)" — можно upsert по паре, но PostgREST onConflict не поддерживает составные напрямую → найдём и вставим/обновим
  const { data: existing, error: findErr } = await supabase
    .from('items')
    .select('id')
    .eq('menu_id', menuId)
    .eq('name', name)
    .maybeSingle()
  if (findErr) throw findErr
  if (existing) {
    const { data, error } = await supabase
      .from('items')
      .update({ price_cents, sku, tenant_id: tenantId })
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('items')
      .insert({ tenant_id: tenantId, menu_id: menuId, name, price_cents, sku, is_active: true })
      .select('*')
      .single()
    if (error) throw error
    return data
  }
}

async function createOrderWithItems(
  tenantId: string,
  siteId: string,
  userId: string | null,
  items: Array<{ item_id: string; name: string; unit_price_cents: number; qty: number }>,
) {
  const subtotal = items.reduce((s, it) => s + it.unit_price_cents * it.qty, 0)
  const discount = 0
  const total = subtotal - discount

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenantId,
      site_id: siteId,
      user_id: userId,
      status: 'pending',
      subtotal_cents: subtotal,
      discount_cents: discount,
      total_cents: total,
      currency: 'USD',
    })
    .select('*')
    .single()
  if (orderErr) throw orderErr

  for (const it of items) {
    const { error } = await supabase.from('order_items').insert({
      tenant_id: tenantId,
      order_id: order.id,
      item_id: it.item_id,
      name_snapshot: it.name,
      unit_price_cents: it.unit_price_cents,
      quantity: it.qty,
      metadata: {},
    })
    if (error) throw error
  }
  return order
}

async function main() {
  console.log('🌱 Starting database seeding...\n')

  const slug = 'demo-tenant'
  const { id: tenantId } = await upsertTenant(slug, 'Demo Tenant')
  console.log(`🏢 Tenant created: ${tenantId} (${slug})`)

  const email = process.env.DEMO_OWNER_EMAIL || `owner+demo@potlucky.dev`
  const { user, password } = await ensureAuthUser(email, process.env.DEMO_OWNER_PASSWORD)
  console.log(
    `👤 Owner auth user: ${user.id} (${email})${password === '(unchanged)' ? '' : ` | password: ${password}`}`,
  )

  const pubUser = await upsertPublicUser(user.id, email, 'Demo Owner')
  console.log(`👤 Public user created: ${pubUser.id}`)

  await upsertMembership(tenantId, pubUser.id, 'owner')
  console.log(`🔗 Membership created: owner role`)

  const site = await upsertSite(tenantId, 'Main Site', undefined)
  console.log(`🌐 Site created: ${site.id} (${site.name})`)

  const menu = await upsertMenu(tenantId, site.id, 'Main Menu', 'USD')
  console.log(`📋 Menu created: ${menu.id} (${menu.title})`)

  const pizza = await ensureItem(tenantId, menu.id, 'Pizza Margherita', 1200, 'PZ-MARGH')
  const cola = await ensureItem(tenantId, menu.id, 'Coca-Cola 0.33', 300, 'DR-COLA-033')
  console.log(`🍕 Items created: ${pizza.id} (${pizza.name}), ${cola.id} (${cola.name})`)

  const order = await createOrderWithItems(tenantId, site.id, pubUser.id, [
    { item_id: pizza.id, name: 'Pizza Margherita', unit_price_cents: 1200, qty: 1 },
    { item_id: cola.id, name: 'Coca-Cola 0.33', unit_price_cents: 300, qty: 2 },
  ])
  console.log(`🛒 Order created: ${order.id} (total: $${(order.total_cents / 100).toFixed(2)})`)

  console.log('\n🏁 Seed complete!')
  console.log('📊 Summary:')
  console.log(`  tenant: ${tenantId}`)
  console.log(`  site:   ${site.id}`)
  console.log(`  menu:   ${menu.id}`)
  console.log(`  items:  ${pizza.id}, ${cola.id}`)
  console.log(`  order:  ${order.id} (total_cents=${order.total_cents})`)
  console.log('\n🔗 Login credentials:')
  console.log(`  email: ${email}`)
  console.log(`  password: ${password}`)
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
