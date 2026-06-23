# PãoFlow

Sistema web em nuvem para padaria, focado no registro rápido de vendas de pão francês com fila do caixa em tempo real. Frontend em React + Vite + TypeScript, backend em Supabase (Postgres + Auth + Realtime + Edge Functions).

## Rodar localmente

Pré-requisitos: Node.js 18+.

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um arquivo `.env.local` na raiz (baseado em `.env.example`):
   ```bash
   VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
   VITE_SUPABASE_ANON_KEY="sua-chave-anon"
   ```
3. Rode o app:
   ```bash
   npm run dev
   ```

## Backend (Supabase)

1. Rode `supabase_schema.sql` no SQL Editor do Supabase.
2. Crie o primeiro usuário em **Authentication > Users**.
3. No fim do `supabase_schema.sql`, ajuste o e-mail e execute o bloco "Criação do primeiro superadmin".
4. Publique a Edge Function de criação de usuários:
   ```bash
   supabase functions deploy admin-create-user
   ```
   Garanta as secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente da function.

Detalhes em `BACKEND_CHECKLIST.md`. A `SUPABASE_SERVICE_ROLE_KEY` nunca deve ir para o frontend.

## Deploy no Vercel

- Framework: **Vite** (detectado automaticamente). Build: `npm run build`, output: `dist`.
- O `vercel.json` já inclui o rewrite de SPA para o React Router funcionar em qualquer rota.
- Configure as variáveis de ambiente no painel do Vercel (Project Settings > Environment Variables):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
