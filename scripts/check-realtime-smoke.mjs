/* eslint-env node */
/* eslint-disable no-undef */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL и SUPABASE_SERVICE_ROLE должны быть установлены')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

async function checkRealtime() {
  console.log('🔌 Проверка Realtime конфигурации...\n')

  try {
    // 1. Проверяем, что таблица orders добавлена в публикацию
    console.log('📋 Проверка публикации orders...')
    const { data: pubTables, error: pubError } = await supabase
      .from('pg_publication_tables')
      .select('*')
      .eq('pubname', 'supabase_realtime')
      .eq('tablename', 'orders')

    if (pubError) {
      console.log('⚠️ Не удалось проверить публикацию:', pubError.message)
    } else if (pubTables && pubTables.length > 0) {
      console.log('✅ Таблица orders добавлена в публикацию supabase_realtime')
    } else {
      console.log('❌ Таблица orders НЕ добавлена в публикацию')
    }

    // 2. Проверяем replica identity
    console.log('\n🔄 Проверка replica identity...')
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('replica_identity')
      .eq('tablename', 'orders')
      .eq('schemaname', 'public')

    if (tablesError) {
      console.log('⚠️ Не удалось проверить replica identity:', tablesError.message)
    } else if (tables && tables.length > 0) {
      const replicaIdentity = tables[0].replica_identity
      if (replicaIdentity === 'f') {
        console.log('✅ Replica identity установлен в FULL')
      } else {
        console.log(`⚠️ Replica identity: ${replicaIdentity} (ожидается 'f' для FULL)`)
      }
    } else {
      console.log('❌ Не удалось найти таблицу orders')
    }

    // 3. Проверяем индекс
    console.log('\n📊 Проверка индекса tenant_id...')
    const { data: indexes, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', 'orders')
      .eq('indexname', 'idx_orders_tenant')

    if (indexError) {
      console.log('⚠️ Не удалось проверить индекс:', indexError.message)
    } else if (indexes && indexes.length > 0) {
      console.log('✅ Индекс idx_orders_tenant создан')
    } else {
      console.log('❌ Индекс idx_orders_tenant НЕ найден')
    }

    // 4. Проверяем RLS
    console.log('\n🔒 Проверка RLS...')
    const { data: rlsTables, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'orders')
      .eq('schemaname', 'public')

    if (rlsError) {
      console.log('⚠️ Не удалось проверить RLS:', rlsError.message)
    } else if (rlsTables && rlsTables.length > 0) {
      const rowSecurity = rlsTables[0].rowsecurity
      if (rowSecurity) {
        console.log('✅ RLS включен на таблице orders')
      } else {
        console.log('❌ RLS НЕ включен на таблице orders')
      }
    }

    // 5. Проверяем политики
    console.log('\n🛡️ Проверка политик...')
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'orders')
      .eq('schemaname', 'public')

    if (policyError) {
      console.log('⚠️ Не удалось проверить политики:', policyError.message)
    } else if (policies && policies.length > 0) {
      console.log(`✅ Найдено ${policies.length} политик для orders:`)
      policies.forEach((policy) => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    } else {
      console.log('❌ Политики для orders НЕ найдены')
    }

    // 6. Проверяем доступность таблицы
    console.log('\n🔍 Проверка доступности таблицы...')
    const { error: testError } = await supabase.from('orders').select('id').limit(1)

    if (testError) {
      console.log('❌ Ошибка доступа к таблице orders:', testError.message)
    } else {
      console.log('✅ Таблица orders доступна для чтения')
    }

    console.log('\n🎉 Проверка Realtime завершена!')
    console.log('\n📝 Следующие шаги:')
    console.log('1. Установите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.log('2. Откройте /realtime-demo в браузере')
    console.log('3. Введите tenant ID и создайте заказ для тестирования')
  } catch (error) {
    console.error('❌ Ошибка проверки:', error.message)
    process.exit(1)
  }
}

checkRealtime()
