-- S-01.3 RLS Policies Migration
-- Created: 2025-08-28 23:17:34

-- S-01.3.a — Enable RLS & revoke defaults
-- Включаем RLS на всех целевых таблицах
alter table public.tenants       enable row level security;
alter table public.users         enable row level security;
alter table public.memberships   enable row level security;
alter table public.sites         enable row level security;
alter table public.menus         enable row level security;
alter table public.items         enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.events        enable row level security;

-- Запретить прямые права ролям API (deny-by-default)
revoke all on all tables in schema public from anon, authenticated;

-- S-01.3.b — Служебные функции в схеме app
create schema if not exists app;

-- Возвращает public.users.id текущего auth-пользователя
create or replace function app.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1
$$;

-- Роль участника в tenant (или NULL)
create or replace function app.member_role(tid uuid)
returns membership_role_enum
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.memberships m
  join public.users u on u.id = m.user_id
  where m.tenant_id = tid and u.auth_user_id = auth.uid()
  limit 1
$$;

-- Признак членства
create or replace function app.is_member(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.memberships m
    join public.users u on u.id = m.user_id
    where m.tenant_id = tid and u.auth_user_id = auth.uid()
  )
$$;

-- Компетенции по ролям
create or replace function app.can_admin(tid uuid)
returns boolean 
language sql 
stable 
security definer 
set search_path = public 
as $$
  select coalesce(app.member_role(tid) in ('owner','admin'), false)
$$;

create or replace function app.can_write(tid uuid)
returns boolean 
language sql 
stable 
security definer 
set search_path = public 
as $$
  select coalesce(app.member_role(tid) in ('owner','admin','manager'), false)
$$;

-- Для заказов staff тоже может писать
create or replace function app.can_order_write(tid uuid)
returns boolean 
language sql 
stable 
security definer 
set search_path = public 
as $$
  select coalesce(app.member_role(tid) in ('owner','admin','manager','staff'), false)
$$;

-- S-01.3.c — Политики: tenants
-- Чтение: только участники
create policy tenants_read on public.tenants
for select using (app.is_member(id));

-- Изменение: owner/admin
create policy tenants_update on public.tenants
for update using (app.can_admin(id)) with check (app.can_admin(id));

-- Удаление: owner/admin
create policy tenants_delete on public.tenants
for delete using (app.can_admin(id));

-- Вставка: разрешить любому аутентифицированному → onboarding создаст membership
create policy tenants_insert on public.tenants
for insert with check (auth.uid() is not null);

-- S-01.3.d — Политики: users
-- SELECT: видны пользователи, которые состоят хотя бы в одном общем tenant с текущим пользователем
create policy users_select on public.users
for select using (
  exists (
    select 1
    from public.memberships m1
    join public.memberships m2 on m2.user_id = users.id and m2.tenant_id = m1.tenant_id
    join public.users u on u.id = m1.user_id
    where u.auth_user_id = auth.uid()
  )
  or users.auth_user_id = auth.uid() -- всегда видим себя
);

-- UPDATE: только сам пользователь
create policy users_update_self on public.users
for update using (users.auth_user_id = auth.uid())
with check (users.auth_user_id = auth.uid());

-- S-01.3.e — Политики: memberships
-- SELECT: члены tenant видят свои membership'ы
create policy memberships_select on public.memberships
for select using (
  app.is_member(tenant_id)
);

-- INSERT/UPDATE/DELETE: управляют owner/admin соответствующего tenant
create policy memberships_insert on public.memberships
for insert with check (app.can_admin(tenant_id));

create policy memberships_update on public.memberships
for update using (app.can_admin(tenant_id)) with check (app.can_admin(tenant_id));

create policy memberships_delete on public.memberships
for delete using (app.can_admin(tenant_id));

-- S-01.3.f — Политики контента: sites, menus, items
-- SELECT всем членам tenant
create policy sites_select on public.sites
for select using (app.is_member(tenant_id));

create policy menus_select on public.menus
for select using (app.is_member(tenant_id));

create policy items_select on public.items
for select using (app.is_member(tenant_id));

-- INSERT/UPDATE для owner/admin/manager
create policy sites_write on public.sites
for all using (app.can_write(tenant_id)) with check (app.can_write(tenant_id));

create policy menus_write on public.menus
for all using (app.can_write(tenant_id)) with check (app.can_write(tenant_id));

create policy items_write on public.items
for all using (app.can_write(tenant_id)) with check (app.can_write(tenant_id));

-- S-01.3.g — Политики заказов: orders, order_items
-- SELECT всем членам tenant
create policy orders_select on public.orders
for select using (app.is_member(tenant_id));

create policy order_items_select on public.order_items
for select using (app.is_member(tenant_id));

-- INSERT/UPDATE: staff тоже может
create policy orders_write on public.orders
for insert with check (app.can_order_write(tenant_id));

create policy orders_update on public.orders
for update using (app.can_order_write(tenant_id)) with check (app.can_order_write(tenant_id));

create policy order_items_write on public.order_items
for insert with check (app.can_order_write(tenant_id));

create policy order_items_update on public.order_items
for update using (app.can_order_write(tenant_id)) with check (app.can_order_write(tenant_id));

-- DELETE: только owner/admin
create policy orders_delete on public.orders
for delete using (app.can_admin(tenant_id));

create policy order_items_delete on public.order_items
for delete using (app.can_admin(tenant_id));

-- S-01.3.h — Политики events (outbox/аудит)
-- SELECT: члены tenant
create policy events_select on public.events
for select using (app.is_member(tenant_id));

-- INSERT: любой член tenant (пишут продьюсеры под user-контекстом/сервисом)
create policy events_insert on public.events
for insert with check (app.is_member(tenant_id));

-- UPDATE/DELETE запрещаем (иммутабельность) — политики не создаём
