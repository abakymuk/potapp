-- S-01.2 Baseline Schema Migration
-- Created: 2025-08-28 23:03:29

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS citext;

-- ENUMS
do $$ begin
  create type membership_role_enum as enum ('owner','admin','manager','staff','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status_enum as enum ('pending','paid','cancelled','fulfilling','done','refunded');
exception when duplicate_object then null; end $$;

-- UPDATED_AT trigger helper
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- TENANTS
create table if not exists public.tenants (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,                 -- для поддоменов/URL
  name          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_tenants_updated before update on public.tenants
  for each row execute function set_updated_at();

-- USERS (глобальные пользователи, связка с auth.users через user_id)
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique,                -- references auth.users(id) — FK не ставим (разные схемы)
  email         citext not null unique,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_users_updated before update on public.users
  for each row execute function set_updated_at();

-- MEMBERSHIPS (много-ко-многим users↔tenants)
create table if not exists public.memberships (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  role          membership_role_enum not null default 'viewer',
  created_at    timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists idx_memberships_tenant on public.memberships(tenant_id);
create index if not exists idx_memberships_user on public.memberships(user_id);

-- SITES (вебсайты/витрины конкретного тенанта)
create table if not exists public.sites (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  domain        text,                                 -- кастомный домен (nullable на старте)
  name          text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, name)
);
create index if not exists idx_sites_tenant on public.sites(tenant_id);
create trigger trg_sites_updated before update on public.sites
  for each row execute function set_updated_at();

-- MENUS (каталоги/меню для сайта)
create table if not exists public.menus (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  site_id       uuid not null references public.sites(id) on delete cascade,
  title         text not null,
  currency      text not null default 'USD',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (site_id, title)
);
create index if not exists idx_menus_tenant on public.menus(tenant_id);
create index if not exists idx_menus_site on public.menus(site_id);
create trigger trg_menus_updated before update on public.menus
  for each row execute function set_updated_at();

-- ITEMS (позиции меню)
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  menu_id       uuid not null references public.menus(id) on delete cascade,
  sku           text,                                  -- артикул/код
  name          text not null,
  description   text,
  price_cents   integer not null check (price_cents >= 0),
  is_active     boolean not null default true,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (menu_id, name)
);
create index if not exists idx_items_tenant on public.items(tenant_id);
create index if not exists idx_items_menu on public.items(menu_id);
create index if not exists idx_items_active on public.items(is_active);
create trigger trg_items_updated before update on public.items
  for each row execute function set_updated_at();

-- ORDERS
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  site_id       uuid not null references public.sites(id) on delete restrict,
  user_id       uuid references public.users(id) on delete set null, -- покупатель (если есть)
  status        order_status_enum not null default 'pending',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents    integer not null default 0 check (total_cents >= 0),
  currency      text not null default 'USD',
  external_ref  text,                                -- номер в POS/платёжке
  notes         text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_orders_tenant on public.orders(tenant_id);
create index if not exists idx_orders_site on public.orders(site_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at);
create trigger trg_orders_updated before update on public.orders
  for each row execute function set_updated_at();

-- ORDER_ITEMS
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  order_id      uuid not null references public.orders(id) on delete cascade,
  item_id       uuid not null references public.items(id) on delete restrict,
  name_snapshot text not null,                        -- денормализованное имя
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity      integer not null check (quantity > 0),
  total_cents   integer generated always as (unit_price_cents * quantity) stored,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_tenant on public.order_items(tenant_id);

-- EVENTS (CloudEvents-подобная outbox-таблица)
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(), -- DB id
  tenant_id     uuid references public.tenants(id) on delete set null,
  event_id      text not null unique,                        -- внешняя идемпотентность
  type          text not null,                               -- e.g. "order.paid"
  source        text not null,                               -- producer service
  subject       text,
  time          timestamptz not null default now(),          -- событие произошло
  data          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_events_tenant_time on public.events(tenant_id, time desc);
create index if not exists idx_events_type_time on public.events(type, time desc);
