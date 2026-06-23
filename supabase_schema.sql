-- ==========================================
-- PaoFlow - schema Supabase multi-tenant
-- Copie e cole no SQL Editor do Supabase.
-- ==========================================

create extension if not exists "pgcrypto";

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- ==========================================
-- Tabelas
-- ==========================================

create table if not exists public.bakeries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  bakery_id uuid references public.bakeries(id) on delete restrict,
  name text not null,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bread_settings (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid references public.bakeries(id) on delete cascade,
  bread_name text not null default 'Pao frances',
  unit_price numeric(10,2) not null,
  quick_quantities integer[] not null default array[1,2,3,4,5,6,8,10,12,15,20],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid references public.bakeries(id) on delete cascade,
  opened_by uuid references public.profiles(id),
  closed_by uuid references public.profiles(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_bread_quantity integer not null default 0,
  closing_bread_quantity integer,
  status text not null default 'open',
  notes text
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid references public.bakeries(id) on delete cascade,
  sale_number bigint generated always as identity,
  cash_session_id uuid references public.cash_sessions(id) on delete restrict not null,
  attendant_id uuid references public.profiles(id) not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total numeric(10,2) not null check (total >= 0),
  payment_method text not null,
  status text not null default 'waiting_payment',
  paid_at timestamptz,
  cancelled_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migra tabelas antigas single-tenant para uma padaria legada, se houver dados.
insert into public.bakeries (name, slug)
values ('Padaria Principal', 'padaria-principal')
on conflict (slug) do nothing;

update public.profiles
set bakery_id = (select id from public.bakeries where slug = 'padaria-principal')
where bakery_id is null and role <> 'superadmin';

update public.bread_settings
set bakery_id = (select id from public.bakeries where slug = 'padaria-principal')
where bakery_id is null;

update public.cash_sessions
set bakery_id = (select id from public.bakeries where slug = 'padaria-principal')
where bakery_id is null;

update public.sales
set bakery_id = (select id from public.bakeries where slug = 'padaria-principal')
where bakery_id is null;

-- Constraints idempotentes.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
  alter table public.profiles
    add constraint profiles_role_check check (role in ('attendant', 'cashier', 'admin', 'superadmin'));

  if exists (select 1 from pg_constraint where conname = 'profiles_bakery_role_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles drop constraint profiles_bakery_role_check;
  end if;
  alter table public.profiles
    add constraint profiles_bakery_role_check check (
      (role = 'superadmin' and bakery_id is null)
      or
      (role <> 'superadmin' and bakery_id is not null)
    );

  if exists (select 1 from pg_constraint where conname = 'cash_sessions_status_check' and conrelid = 'public.cash_sessions'::regclass) then
    alter table public.cash_sessions drop constraint cash_sessions_status_check;
  end if;
  alter table public.cash_sessions
    add constraint cash_sessions_status_check check (status in ('open', 'closed'));

  if exists (select 1 from pg_constraint where conname = 'sales_payment_method_check' and conrelid = 'public.sales'::regclass) then
    alter table public.sales drop constraint sales_payment_method_check;
  end if;
  alter table public.sales
    add constraint sales_payment_method_check check (payment_method in ('pix', 'cash', 'card', 'credit'));

  if exists (select 1 from pg_constraint where conname = 'sales_status_check' and conrelid = 'public.sales'::regclass) then
    alter table public.sales drop constraint sales_status_check;
  end if;
  alter table public.sales
    add constraint sales_status_check check (status in ('waiting_payment', 'paid', 'cancelled'));
end $$;

alter table public.bread_settings alter column bakery_id set not null;
alter table public.cash_sessions alter column bakery_id set not null;
alter table public.sales alter column bakery_id set not null;

create unique index if not exists uq_bread_settings_active_per_bakery
  on public.bread_settings(bakery_id)
  where active;

create unique index if not exists uq_cash_sessions_one_open_per_bakery
  on public.cash_sessions(bakery_id)
  where status = 'open';

create index if not exists idx_profiles_bakery_id on public.profiles(bakery_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_bread_settings_bakery_id on public.bread_settings(bakery_id);
create index if not exists idx_cash_sessions_bakery_id on public.cash_sessions(bakery_id);
create index if not exists idx_sales_bakery_id on public.sales(bakery_id);
create index if not exists idx_sales_cash_session_id on public.sales(cash_session_id);
create index if not exists idx_sales_status on public.sales(status);
create index if not exists idx_sales_created_at on public.sales(created_at desc);
create index if not exists idx_sales_attendant_id on public.sales(attendant_id);
create index if not exists idx_sales_payment_method on public.sales(payment_method);

-- Permissoes para o Data API. RLS continua sendo a barreira de linhas.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.bakeries to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.bread_settings to authenticated;
grant select, insert, update, delete on public.cash_sessions to authenticated;
grant select, insert, update, delete on public.sales to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ==========================================
-- Helpers privados para RLS
-- ==========================================

create or replace function app_private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
$$;

create or replace function app_private.current_bakery_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.bakery_id
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
$$;

create or replace function app_private.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.current_profile_role() = 'superadmin', false)
$$;

create or replace function app_private.can_access_bakery(target_bakery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.is_superadmin()
    or target_bakery_id = app_private.current_bakery_id()
$$;

grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

-- ==========================================
-- RLS
-- ==========================================

alter table public.bakeries enable row level security;
alter table public.profiles enable row level security;
alter table public.bread_settings enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.sales enable row level security;

drop policy if exists "Usuarios podem ler o proprio perfil" on public.profiles;
drop policy if exists "Admins podem ler todos os perfis" on public.profiles;
drop policy if exists "Admins podem inserir ou atualizar perfis" on public.profiles;
drop policy if exists "Todos autenticados podem ler configuracao ativa" on public.bread_settings;
drop policy if exists "Apenas admin pode gerenciar configuracoes" on public.bread_settings;
drop policy if exists "Todos autenticados podem ver as sessoes de caixa" on public.cash_sessions;
drop policy if exists "Apenas caixa e admin podem abrir ou fechar sessao" on public.cash_sessions;
drop policy if exists "Atendentes podem criar vendas para si" on public.sales;
drop policy if exists "Atendentes podem ver suas proprias vendas" on public.sales;
drop policy if exists "Caixa e Admin podem atualizar status de vendas" on public.sales;
drop policy if exists "Ninguem pode deletar vendas" on public.sales;

drop policy if exists "bakeries_select_by_scope" on public.bakeries;
drop policy if exists "bakeries_insert_superadmin" on public.bakeries;
drop policy if exists "bakeries_update_superadmin" on public.bakeries;
drop policy if exists "profiles_select_by_scope" on public.profiles;
drop policy if exists "profiles_insert_by_scope" on public.profiles;
drop policy if exists "profiles_update_by_scope" on public.profiles;
drop policy if exists "bread_settings_select_by_bakery" on public.bread_settings;
drop policy if exists "bread_settings_write_by_admin" on public.bread_settings;
drop policy if exists "cash_sessions_select_by_bakery" on public.cash_sessions;
drop policy if exists "cash_sessions_write_by_cashier_admin" on public.cash_sessions;
drop policy if exists "sales_insert_by_attendant_bakery" on public.sales;
drop policy if exists "sales_select_by_bakery" on public.sales;
drop policy if exists "sales_update_by_cashier_admin" on public.sales;
drop policy if exists "sales_delete_denied" on public.sales;

create policy "bakeries_select_by_scope"
  on public.bakeries for select
  using (app_private.can_access_bakery(id));

create policy "bakeries_insert_superadmin"
  on public.bakeries for insert
  with check (app_private.is_superadmin());

create policy "bakeries_update_superadmin"
  on public.bakeries for update
  using (app_private.is_superadmin())
  with check (app_private.is_superadmin());

create policy "profiles_select_by_scope"
  on public.profiles for select
  using (
    id = auth.uid()
    or app_private.is_superadmin()
    or bakery_id = app_private.current_bakery_id()
  );

create policy "profiles_insert_by_scope"
  on public.profiles for insert
  with check (
    app_private.is_superadmin()
    or (
      app_private.current_profile_role() = 'admin'
      and bakery_id = app_private.current_bakery_id()
      and role in ('attendant', 'cashier')
    )
  );

create policy "profiles_update_by_scope"
  on public.profiles for update
  using (
    app_private.is_superadmin()
    or (
      app_private.current_profile_role() = 'admin'
      and bakery_id = app_private.current_bakery_id()
      and role in ('attendant', 'cashier')
    )
  )
  with check (
    app_private.is_superadmin()
    or (
      app_private.current_profile_role() = 'admin'
      and bakery_id = app_private.current_bakery_id()
      and role in ('attendant', 'cashier')
    )
  );

create policy "bread_settings_select_by_bakery"
  on public.bread_settings for select
  using (app_private.can_access_bakery(bakery_id));

create policy "bread_settings_write_by_admin"
  on public.bread_settings for all
  using (
    app_private.is_superadmin()
    or (
      app_private.current_profile_role() = 'admin'
      and bakery_id = app_private.current_bakery_id()
    )
  )
  with check (
    app_private.is_superadmin()
    or (
      app_private.current_profile_role() = 'admin'
      and bakery_id = app_private.current_bakery_id()
    )
  );

create policy "cash_sessions_select_by_bakery"
  on public.cash_sessions for select
  using (app_private.can_access_bakery(bakery_id));

create policy "cash_sessions_write_by_cashier_admin"
  on public.cash_sessions for all
  using (
    app_private.is_superadmin()
    or (
      app_private.current_profile_role() in ('cashier', 'admin')
      and bakery_id = app_private.current_bakery_id()
    )
  )
  with check (
    app_private.is_superadmin()
    or (
      app_private.current_profile_role() in ('cashier', 'admin')
      and bakery_id = app_private.current_bakery_id()
    )
  );

create policy "sales_insert_by_attendant_bakery"
  on public.sales for insert
  with check (
    attendant_id = auth.uid()
    and bakery_id = app_private.current_bakery_id()
    and exists (
      select 1
      from public.cash_sessions cs
      where cs.id = cash_session_id
        and cs.bakery_id = sales.bakery_id
        and cs.status = 'open'
    )
  );

create policy "sales_select_by_bakery"
  on public.sales for select
  using (app_private.can_access_bakery(bakery_id));

create policy "sales_update_by_cashier_admin"
  on public.sales for update
  using (
    app_private.current_profile_role() in ('cashier', 'admin')
    and bakery_id = app_private.current_bakery_id()
  )
  with check (
    app_private.current_profile_role() in ('cashier', 'admin')
    and bakery_id = app_private.current_bakery_id()
  );

create policy "sales_delete_denied"
  on public.sales for delete
  using (false);

-- ==========================================
-- Resumo diario com invoker security (respeita RLS)
-- ==========================================

create or replace function public.get_session_summary(p_session_id uuid)
returns json
language plpgsql
stable
as $$
declare
  v_result json;
  v_opening_bread int;
  v_closing_bread int;
begin
  select opening_bread_quantity, closing_bread_quantity
  into v_opening_bread, v_closing_bread
  from public.cash_sessions
  where id = p_session_id;

  select json_build_object(
    'opening_bread_quantity', coalesce(v_opening_bread, 0),
    'closing_bread_quantity', v_closing_bread,
    'total_sales_paid', coalesce(count(s.id) filter (where s.status = 'paid'), 0),
    'total_sales_pending', coalesce(count(s.id) filter (where s.status = 'waiting_payment'), 0),
    'total_sales_cancelled', coalesce(count(s.id) filter (where s.status = 'cancelled'), 0),
    'total_breads_paid', coalesce(sum(s.quantity) filter (where s.status = 'paid'), 0),
    'total_breads_pending', coalesce(sum(s.quantity) filter (where s.status = 'waiting_payment'), 0),
    'total_breads_cancelled', coalesce(sum(s.quantity) filter (where s.status = 'cancelled'), 0),
    'total_value_paid', coalesce(sum(s.total) filter (where s.status = 'paid'), 0.00),
    'total_value_pending', coalesce(sum(s.total) filter (where s.status = 'waiting_payment'), 0.00),
    'total_pix', coalesce(sum(s.total) filter (where s.status = 'paid' and s.payment_method = 'pix'), 0.00),
    'total_cash', coalesce(sum(s.total) filter (where s.status = 'paid' and s.payment_method = 'cash'), 0.00),
    'total_card', coalesce(sum(s.total) filter (where s.status = 'paid' and s.payment_method = 'card'), 0.00),
    'total_credit', coalesce(sum(s.total) filter (where s.status = 'paid' and s.payment_method = 'credit'), 0.00)
  ) into v_result
  from public.sales s
  where s.cash_session_id = p_session_id;

  return v_result;
end;
$$;

-- Realtime: habilite tambem pelo painel se sua publicacao ainda nao incluir estas tabelas.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.sales;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.cash_sessions;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- ==========================================
-- Criacao do primeiro superadmin
-- ==========================================
-- 1. Crie o usuario em Authentication > Users no painel do Supabase.
-- 2. Troque o e-mail abaixo e execute este bloco.
--
-- do $$
-- declare
--   v_email text := 'superadmin@seudominio.com';
--   v_user_id uuid;
-- begin
--   select id into v_user_id from auth.users where email = v_email;
--   if v_user_id is null then
--     raise exception 'Usuario Auth com e-mail % nao encontrado', v_email;
--   end if;
--
--   insert into public.profiles (id, bakery_id, name, role, active)
--   values (v_user_id, null, 'Superadmin', 'superadmin', true)
--   on conflict (id) do update
--   set bakery_id = null,
--       name = excluded.name,
--       role = 'superadmin',
--       active = true,
--       updated_at = now();
-- end $$;
