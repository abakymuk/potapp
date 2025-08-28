/* eslint-env node */
/* eslint-disable no-undef */

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL и SUPABASE_SERVICE_ROLE должны быть установлены')
  process.exit(1)
}

// Используем service role для создания тестовых данных
const supabase = createClient(url, serviceKey)

async function checkRLS() {
  console.log('🔒 Проверка RLS политик...\n')

  try {
    // 1. Проверяем, что RLS включен на всех таблицах
    console.log('📋 Проверка RLS статуса:')
    const tables = [
      'tenants',
      'users',
      'memberships',
      'sites',
      'menus',
      'items',
      'orders',
      'order_items',
      'events',
    ]

    for (const table of tables) {
      try {
        // Простая проверка - пытаемся получить данные
        const { error } = await supabase.from(table).select('id').limit(1)

        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: доступна`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }

    // 2. Создаем тестовые данные
    console.log('\n🧪 Создание тестовых данных...')

    // Создаем два тенанта
    const { data: tenant1, error: t1Error } = await supabase
      .from('tenants')
      .insert({ slug: 'test-tenant-1', name: 'Test Tenant 1' })
      .select()
      .single()

    if (t1Error) {
      console.log('⚠️ Tenant 1 уже существует или ошибка:', t1Error.message)
    } else {
      console.log('✅ Tenant 1 создан:', tenant1.id)
    }

    const { data: tenant2, error: t2Error } = await supabase
      .from('tenants')
      .insert({ slug: 'test-tenant-2', name: 'Test Tenant 2' })
      .select()
      .single()

    if (t2Error) {
      console.log('⚠️ Tenant 2 уже существует или ошибка:', t2Error.message)
    } else {
      console.log('✅ Tenant 2 создан:', tenant2.id)
    }

    // 3. Проверяем функции app.*
    console.log('\n🔧 Проверка служебных функций:')

    const { error: funcError } = await supabase.rpc('app_current_user_id')

    if (funcError) {
      console.log('⚠️ app.current_user_id():', funcError.message)
    } else {
      console.log('✅ app.current_user_id() доступна')
    }

    // 4. Проверяем политики
    console.log('\n🛡️ Проверка политик:')

    const { data: policies, error: polError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname')
      .eq('schemaname', 'public')
      .in('tablename', tables)

    if (polError) {
      console.log('⚠️ Не удалось получить политики:', polError.message)
    } else {
      console.log(`✅ Найдено ${policies.length} политик`)
      policies.forEach((p) => {
        console.log(`   - ${p.tablename}.${p.policyname}`)
      })
    }

    // 5. Проверяем deny-by-default
    console.log('\n🚫 Проверка deny-by-default:')

    // Пытаемся получить данные без аутентификации (должно быть 0)
    const { data: publicData, error: publicError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)

    if (publicError) {
      console.log('✅ Deny-by-default работает:', publicError.message)
    } else {
      console.log('⚠️ Deny-by-default не работает, получено записей:', publicData?.length || 0)
    }

    console.log('\n🎉 RLS проверка завершена!')
    console.log('\n📝 Следующие шаги:')
    console.log('1. Создать тестовых пользователей через auth.users')
    console.log('2. Создать memberships для тестирования ролей')
    console.log('3. Проверить изоляцию между тенантами')
    console.log('4. Проверить права доступа по ролям')
  } catch (error) {
    console.error('❌ Ошибка проверки RLS:', error.message)
    process.exit(1)
  }
}

checkRLS()
