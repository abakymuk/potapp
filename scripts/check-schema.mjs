/* eslint-env node */
/* eslint-disable no-undef */

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ SUPABASE_URL и SUPABASE_ANON_KEY должны быть установлены')
  process.exit(1)
}

const supabase = createClient(url, key)

async function checkSchema() {
  console.log('🔍 Проверка схемы БД...\n')

  try {
    // Проверяем расширения
    const { data: extensions, error: extError } = await supabase
      .from('pg_extension')
      .select('extname')
      .in('extname', ['vector', 'citext', 'pg_stat_statements'])

    if (extError) {
      console.log('⚠️ Не удалось проверить расширения:', extError.message)
    } else {
      console.log('✅ Расширения:', extensions.map((e) => e.extname).join(', '))
    }

    // Проверяем типы
    const { data: types, error: typeError } = await supabase
      .from('pg_type')
      .select('typname')
      .in('typname', ['membership_role_enum', 'order_status_enum'])

    if (typeError) {
      console.log('⚠️ Не удалось проверить типы:', typeError.message)
    } else {
      console.log('✅ Типы:', types.map((t) => t.typname).join(', '))
    }

    // Проверяем таблицы
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

    console.log('\n📋 Проверка таблиц:')
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1)

        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }

    console.log('\n🎉 Проверка завершена!')
  } catch (error) {
    console.error('❌ Ошибка проверки:', error.message)
    process.exit(1)
  }
}

checkSchema()
