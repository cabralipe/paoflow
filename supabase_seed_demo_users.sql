-- ==========================================
-- PaoFlow - seed de usuarios para demonstracao
-- Execute depois de rodar supabase_schema.sql.
--
-- Importante: em projetos Supabase hospedados, o SQL Editor pode nao ter
-- permissao para criar/atualizar usuarios diretamente em auth.users.
-- Antes de rodar este seed, crie estes usuarios em Authentication > Users
-- com a senha abaixo. Depois execute este arquivo para criar padarias,
-- configuracoes e perfis operacionais vinculados aos usuarios Auth.
--
-- Login de todos os usuarios:
--   senha: PaoFlow@123
--
-- Contas criadas:
--   superadmin@paoflow.demo  -> superadmin, sem padaria
--   admin@paoflow.demo       -> admin da PaoFlow Matriz
--   caixa@paoflow.demo       -> cashier da PaoFlow Matriz
--   atendente@paoflow.demo   -> attendant da PaoFlow Matriz
--   admin.filial@paoflow.demo
--   caixa.filial@paoflow.demo
--   atendente.filial@paoflow.demo
-- ==========================================

begin;

insert into public.bakeries (id, name, slug, active, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'PaoFlow Matriz', 'paoflow-matriz', true, now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'PaoFlow Filial Centro', 'paoflow-filial-centro', true, now(), now())
on conflict (slug) do update
set name = excluded.name,
    active = true,
    updated_at = now();

update public.bread_settings
set active = false,
    updated_at = now()
where active = true
  and bakery_id in (
    select id
    from public.bakeries
    where slug in ('paoflow-matriz', 'paoflow-filial-centro')
  )
  and id not in (
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002'
  );

insert into public.bread_settings (id, bakery_id, bread_name, unit_price, quick_quantities, active, created_at, updated_at)
values
  (
    '20000000-0000-4000-8000-000000000001',
    (select id from public.bakeries where slug = 'paoflow-matriz'),
    'Pao frances',
    0.90,
    array[1,2,3,4,5,6,8,10,12,15,20],
    true,
    now(),
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    (select id from public.bakeries where slug = 'paoflow-filial-centro'),
    'Pao frances',
    0.85,
    array[1,2,3,4,5,6,8,10,12,15,20],
    true,
    now(),
    now()
  )
on conflict (id) do update
set bread_name = excluded.bread_name,
    unit_price = excluded.unit_price,
    quick_quantities = excluded.quick_quantities,
    active = true,
    updated_at = now();

do $$
declare
  missing_emails text;
begin
  with demo_users (email) as (
    values
      ('superadmin@paoflow.demo'),
      ('admin@paoflow.demo'),
      ('caixa@paoflow.demo'),
      ('atendente@paoflow.demo'),
      ('admin.filial@paoflow.demo'),
      ('caixa.filial@paoflow.demo'),
      ('atendente.filial@paoflow.demo')
  )
  select string_agg(du.email, ', ' order by du.email)
    into missing_emails
  from demo_users du
  left join auth.users au on lower(au.email) = du.email
  where au.id is null;

  if missing_emails is not null then
    raise exception
      'Crie primeiro estes usuarios em Authentication > Users, todos com senha PaoFlow@123: %',
      missing_emails;
  end if;
end $$;

with demo_users (email, name, role, bakery_slug) as (
  values
    ('superadmin@paoflow.demo', 'Superadmin Demo', 'superadmin', null),
    ('admin@paoflow.demo', 'Admin Matriz', 'admin', 'paoflow-matriz'),
    ('caixa@paoflow.demo', 'Caixa Matriz', 'cashier', 'paoflow-matriz'),
    ('atendente@paoflow.demo', 'Atendente Matriz', 'attendant', 'paoflow-matriz'),
    ('admin.filial@paoflow.demo', 'Admin Filial', 'admin', 'paoflow-filial-centro'),
    ('caixa.filial@paoflow.demo', 'Caixa Filial', 'cashier', 'paoflow-filial-centro'),
    ('atendente.filial@paoflow.demo', 'Atendente Filial', 'attendant', 'paoflow-filial-centro')
),
resolved_users as (
  select au.id, du.name, du.role, b.id as bakery_id
  from demo_users du
  join auth.users au on lower(au.email) = du.email
  left join public.bakeries b on b.slug = du.bakery_slug
)
insert into public.profiles (id, bakery_id, name, role, active, created_at, updated_at)
select id, bakery_id, name, role, true, now(), now()
from resolved_users
on conflict (id) do update
set bakery_id = excluded.bakery_id,
    name = excluded.name,
    role = excluded.role,
    active = true,
    updated_at = now();

commit;

select
  u.email,
  p.name,
  p.role,
  coalesce(b.name, 'Todas as padarias') as bakery,
  'PaoFlow@123' as password
from public.profiles p
join auth.users u on u.id = p.id
left join public.bakeries b on b.id = p.bakery_id
where u.email like '%@paoflow.demo'
order by
  case p.role
    when 'superadmin' then 1
    when 'admin' then 2
    when 'cashier' then 3
    when 'attendant' then 4
    else 5
  end,
  u.email;
