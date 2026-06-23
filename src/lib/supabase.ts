import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined');

// Instancia o cliente Supabase apenas se configurado de fato
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

if (!isSupabaseConfigured) {
  console.warn(
    'PãoFlow: Supabase URL ou Anon Key não configurados. Rodando no modo simulação de LocalStorage.'
  );
}
