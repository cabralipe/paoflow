import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { simulatedDb } from '../lib/simulatedDb';
import { BreadSettings } from '../types';

export const settingsService = {
  getSettings: async (): Promise<BreadSettings> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.getSettings();
    }

    const { data, error } = await supabase
      .from('bread_settings')
      .select('*')
      .eq('active', true)
      .limit(1);

    if (error) {
      console.error('Erro ao buscar configurações no Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      // Se não houver configuração, insere uma padrão
      const defaultSettings: Omit<BreadSettings, 'id'> = {
        bread_name: 'Pão francês',
        unit_price: 0.80,
        quick_quantities: [5, 10, 12, 20],
        active: true
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
    if (!isSupabaseConfigured) {
      return simulatedDb.saveSettings(settings);
    }

    const { data, error } = await supabase
      .from('bread_settings')
      .upsert({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
