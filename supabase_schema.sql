-- ==========================================
-- PãoFlow - SCHEMA COMPLETO PARA SUPABASE
-- Copie e cole no Editor SQL do Supabase
-- ==========================================

-- 1. Habilitar extensões necessárias
create extension if not exists "uuid-ossp";

-- 2. Tabela: profiles (Perfis de Usuários)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('attendant', 'cashier', 'admin')),
  active boolean default true,
  created_at timestamptz default now()
);

-- Habilitar RLS em profiles
alter table public.profiles enable row level security;

-- 3. Tabela: bread_settings (Configuração de Preço e Botões de Quantidade)
create table if not exists public.bread_settings (
  id uuid primary key default gen_random_uuid(),
  bread_name text not null default 'Pão francês',
  unit_price numeric(10,2) not null,
  quick_quantities integer[] not null default array[1,2,3,4,5,6,8,10,12,15,20],
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS em bread_settings
alter table public.bread_settings enable row level security;

-- 4. Tabela: cash_sessions (Sessão diária de caixa)
create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid references public.profiles(id),
  closed_by uuid references public.profiles(id),
  opened_at timestamptz default now(),
  closed_at timestamptz,
  opening_bread_quantity integer not null default 0,
  closing_bread_quantity integer,
  status text not null default 'open' check (status in ('open', 'closed')),
  notes text
);

-- Habilitar RLS em cash_sessions
alter table public.cash_sessions enable row level security;

-- 5. Tabela: sales (Principal de vendas)
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number bigint generated always as identity,
  cash_session_id uuid references public.cash_sessions(id) on delete restrict not null,
  attendant_id uuid references public.profiles(id) not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total numeric(10,2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('pix','cash','card','credit')),
  status text not null default 'waiting_payment' check (status in ('waiting_payment','paid','cancelled')),
  paid_at timestamptz,
  cancelled_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS em sales
alter table public.sales enable row level security;

-- ==========================================
-- 6. ÍNDICES DE DESEMPENHO
-- ==========================================
create index if not exists idx_sales_cash_session_id on public.sales(cash_session_id);
create index if not exists idx_sales_status on public.sales(status);
create index if not exists idx_sales_created_at on public.sales(created_at desc);
create index if not exists idx_sales_attendant_id on public.sales(attendant_id);
create index if not exists idx_sales_payment_method on public.sales(payment_method);

-- ==========================================
-- 7. SEGURANÇA - POLÍTICAS RLS
-- ==========================================

-- Políticas para profiles
create policy "Usuários podem ler o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins podem ler todos os perfis"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins podem inserir ou atualizar perfis"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Políticas para bread_settings
create policy "Todos autenticados podem ler configuração ativa"
  on public.bread_settings for select
  using (auth.role() = 'authenticated');

create policy "Apenas admin pode gerenciar configurações"
  on public.bread_settings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Políticas para cash_sessions
create policy "Todos autenticados podem ver as sessões de caixa"
  on public.cash_sessions for select
  using (auth.role() = 'authenticated');

create policy "Apenas caixa e admin podem abrir ou fechar sessão"
  on public.cash_sessions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cashier', 'admin')
    )
  );

-- Políticas para sales
create policy "Atendentes podem criar vendas para si"
  on public.sales for insert
  with check (
    auth.uid() = attendant_id
  );

create policy "Atendentes podem ver suas próprias vendas"
  on public.sales for select
  using (
    auth.uid() = attendant_id or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cashier', 'admin')
    )
  );

create policy "Caixa e Admin podem atualizar status de vendas"
  on public.sales for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cashier', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('cashier', 'admin')
    )
  );

-- Garantir que vendas nunca sejam deletadas por RLS
create policy "Ninguém pode deletar vendas"
  on public.sales for delete
  using (false);

-- ==========================================
-- 8. TRIGGER PARA PROFILE AUTOMÁTICO (OPCIONAL)
-- ==========================================
-- Cria um perfil básico após sign up para facilitar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuário Novo'),
    coalesce(new.raw_user_meta_data->>'role', 'attendant'),
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 9. VISÕES E FUNÇÕES ÚTEIS
-- ==========================================

-- Função para obter resumo diário de uma sessão
create or replace function public.get_session_summary(p_session_id uuid)
returns json as $$
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
    'opening_bread_quantity', v_opening_bread,
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
$$ language plpgsql security definer;

-- Habilitar canal de Realtime para a tabela sales
alter publish replication_group_unlocked_replicate_all_tables; -- (se necessário na sua instalação)
-- No dashboard do Supabase: Vá em Database -> Replication e ative de forma gráfica para a tabela Sales!
