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
   ```b