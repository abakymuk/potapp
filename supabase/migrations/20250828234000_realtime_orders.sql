-- S-01.6 Realtime Orders Migration
-- Created: 2025-08-28 23:40:00

-- S-01.6.a — Для корректной передачи old/new значений при UPDATE
alter table public.orders replica identity full;

-- S-01.6.b — Добавить таблицу в публикацию (идемпотентно)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname='public' and tablename='orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- S-01.6.c — Индекс для оптимизации фильтрации по tenant_id
create index if not exists idx_orders_tenant on public.orders(tenant_id);
