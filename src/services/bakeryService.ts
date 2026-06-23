import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Bakery } from '../types';

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const bakeryService = {
  list: async (): Promise<Bakery[]> => {
    ensureSupabase();
    const { data, error } = await supabase
      .from('bakeries')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  create: async (input: { name: string; slug?: string }): Promise<Bakery> => {
    ensureSupabase();
    const payload = {
      name: input.name.trim(),
      slug: slugify(input.slug || input.name),
      active: true,
    };

    const { data, error } = await supabase
      .from('bakeries')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateActive: async (id: string, active: boolean): Promise<Bakery> => {
    ensureSupabase();
    const { data, error } = await supabase
      .from('bakeries')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
