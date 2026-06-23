import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const supabaseUrl = rawSupabaseUrl.trim().replace(/\/$/, '');

const getSupabaseConfigError = () => {
  if (!supabaseUrl || supabaseUrl === 'undefined' || !supabaseAnonKey) {
    return 'Supabase URL ou Anon Key nao configurados. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
  }

  try {
    const url = new URL(supabaseUrl);
    const isDashboardUrl = url.hostname === 'supabase.com' && url.pathname.includes('/dashboard/project/');

    if (isDashboardUrl) {
      return 'VITE_SUPABASE_URL esta com a URL do dashboard. Use a Project URL da API, no formato https://ihzofkeqjvroraxtwxdg.supabase.co.';
    }
  } catch {
    return 'VITE_SUPABASE_URL invalida. Use a Project URL da API do Supabase.';
  }

  return null;
};

export const supabaseConfigError = getSupabaseConfigError();
export const isSupabaseConfigured = !supabaseConfigError;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

if (!isSupabaseConfigured) {
  console.warn(`PaoFlow: ${supabaseConfigError}`);
}
