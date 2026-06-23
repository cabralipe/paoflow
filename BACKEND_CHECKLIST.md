# Backend necessario para producao

## Ja preparado neste repo

- `supabase_schema.sql` cria o backend multi-tenant:
  - `bakeries`
  - `profiles.bakery_id`
  - `bread_settings.bakery_id`
  - `cash_sessions.bakery_id`
  - `sales.bakery_id`
  - RLS por padaria
  - papel `superadmin`
- `supabase/functions/admin-create-user/index.ts` cria usuarios reais no Supabase Auth e grava o perfil operacional.
- Frontend nao usa mais dados mockados de LocalStorage.

## Ainda precisa executar/configurar no Supabase

1. Rodar `supabase_schema.sql` no SQL Editor do Supabase.
2. Criar manualmente o primeiro usuario em `Authentication > Users`.
3. No final do `supabase_schema.sql`, editar o e-mail do bloco `Criacao do primeiro superadmin` e executar o bloco para promover esse usuario.
4. Publicar a Edge Function:

```bash
supabase functions deploy admin-create-user
```

5. Garantir que a function tenha acesso a:

```bash
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

6. Configurar no frontend:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Fronteira de seguranca

O frontend nunca deve receber `SUPABASE_SERVICE_ROLE_KEY`. Criacao de usuarios Auth precisa ficar na Edge Function ou em outro backend privado equivalente.
