-- S-01.4 Storage Buckets Migration
-- Created: 2025-08-28 23:26:09

-- S-01.4.a — Создать бакеты
-- site-assets — публичный чтением (CDN), запись ограничим RLS
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

-- backoffice — полностью приватный; чтение через signed URLs
insert into storage.buckets (id, name, public)
values ('backoffice', 'backoffice', false)
on conflict (id) do nothing;

-- S-01.4.b — Helper для извлечения tenant из пути
create or replace function app.path_tenant(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  first_seg text := split_part(object_name, '/', 1);
  tid uuid;
begin
  begin
    tid := first_seg::uuid;
  exception when others then
    return null;
  end;
  return tid;
end $$;

-- S-01.4.c — Политики для site-assets (public)
-- Чтение: публичное. Для public bucket это по сути доступ по URL
create policy site_assets_select on storage.objects
for select
using (bucket_id = 'site-assets');

-- Запись: только участники tenant с правом write (owner/admin/manager)
create policy site_assets_insert on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-assets'
  and app.can_write(app.path_tenant(name))
);

-- Обновление: только write
create policy site_assets_update on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-assets'
  and app.can_write(app.path_tenant(name))
)
with check (
  bucket_id = 'site-assets'
  and app.can_write(app.path_tenant(name))
);

-- Удаление: только write
create policy site_assets_delete on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-assets'
  and app.can_write(app.path_tenant(name))
);

-- S-01.4.d — Политики для backoffice (private)
-- Чтение: только члены tenant (viewer+)
create policy backoffice_select on storage.objects
for select
to authenticated
using (
  bucket_id = 'backoffice'
  and app.is_member(app.path_tenant(name))
);

-- Запись: только write (owner/admin/manager)
create policy backoffice_insert on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'backoffice'
  and app.can_write(app.path_tenant(name))
);

-- Обновление: только write
create policy backoffice_update on storage.objects
for update
to authenticated
using (
  bucket_id = 'backoffice'
  and app.can_write(app.path_tenant(name))
)
with check (
  bucket_id = 'backoffice'
  and app.can_write(app.path_tenant(name))
);

-- Удаление: только write
create policy backoffice_delete on storage.objects
for delete
to authenticated
using (
  bucket_id = 'backoffice'
  and app.can_write(app.path_tenant(name))
);
