import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BreadSettings } from '../types';
import { authService } from './authService';

const ensureBakeryId = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase nao configurado.');
  }
  const user = authService.getCurrentUser();
  if (!user?.bakery_id) {
    throw new Error('Usuario sem padaria vinculada.');
  }
  return user.bakery_id;
};

export const settingsService = {
  getSettings: async (): Promise<BreadSettings> => {
    const bakeryId = ensureBakeryId();

    const { data, error } = await supabase
      .from('bread_settings')
      .select('*')
      .eq('bakery_id', bakeryId)
      .eq('active', true)
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      const defaultSettings: Omit<BreadSettings, 'id'> = {
        bakery_id: bakeryId,
        bread_name: 'Pao frances',
        unit_price: 0.8,
        quick_quantities: [5, 10, 12, 20],
        active: true,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('bread_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (insertErr) throw insertErr;
      return inserted;
    }

    return data[0];
  },

  saveSettings: async (settings: BreadSettings): Promise<BreadSettings> => {
    const bakeryId = ensureBakeryId();

    const { data, error } = await supabase
      .from('bread_settings')
      .upsert({
        ...settings,
        bakery_id: bakeryId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
