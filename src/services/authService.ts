import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { simulatedDb } from '../lib/simulatedDb';
import { Profile, UserRole } from '../types';

export const authService = {
  // Obter usuário atual logado de forma síncrona/rápida para o frontend
  getCurrentUser: (): Profile | null => {
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem('pf_current_user');
      return saved ? JSON.parse(saved) : null;
    }
    
    // Para Supabase: tentamos ler do LocalStorage temporário ou sessão ativa
    const saved = localStorage.getItem('pf_current_user');
    return saved ? JSON.parse(saved) : null;
  },

  // Retorna a lista de perfis mock/disponíveis no ambiente para facilitação de testes
  getAvailableUserProfiles: (): Profile[] => {
    return simulatedDb.getProfiles();
  },

  // Login de simulação rápido
  loginSimulated: (profileId: string): Profile => {
    const profiles = simulatedDb.getProfiles();
    const user = profiles.find(p => p.id === profileId);
    if (!user) throw new Error('Usuário de simulação não encontrado.');
    localStorage.setItem('pf_current_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: { user } }));
    return user;
  },

  // Login real (Supabase Auth)
  login: async (email: string, password: string): Promise<Profile> => {
    if (!isSupabaseConfigured) {
      // Se não houver Supabase, faz login automático baseado no email
      const profiles = simulatedDb.getProfiles();
      let matchedUser = profiles.find(p => email.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()));
      
      if (!matchedUser) {
        if (email.includes('admin') || email.includes('felipe')) {
          matchedUser = profiles.find(p => p.role === 'admin');
        } else if (email.includes('caixa') || email.includes('beatriz')) {
          matchedUser = profiles.find(p => p.role === 'cashier');
        } else {
          matchedUser = profiles.find(p => p.role === 'attendant');
        }
      }

      if (!matchedUser) {
        matchedUser = profiles[0]; // Ana Silva
      }

      localStorage.setItem('pf_current_user', JSON.stringify(matchedUser));
      window.dispatchEvent(new CustomEvent('auth_state_change', { detail: { user: matchedUser } }));
      return matchedUser;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sem resposta válida do usuário do login');

      // Buscar perfil complementar do usuário autenticado nas tabelas public.profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr) {
        // Se falhar, cria um provisório baseado na regra
        const placeholderProfile: Profile = {
          id: data.user.id,
          name: email.split('@')[0],
          role: email.includes('admin') ? 'admin' : (email.includes('caixa') ? 'cashier' : 'attendant'),
          active: true
        };
        localStorage.setItem('pf_current_user', JSON.stringify(placeholderProfile));
        return placeholderProfile;
      }

      localStorage.setItem('pf_current_user', JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('auth_state_change', { detail: { user: profile } }));
      return profile;
    } catch (err: any) {
      console.error('Erro de login no Supabase:', err.message);
      throw err;
    }
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('pf_current_user');
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: { user: null } }));
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  // Administradores gerenciam outros perfis de funcionários
  getProfiles: async (): Promise<Profile[]> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.getProfiles();
    }
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');
    if (error) throw error;
    return profiles;
  },

  saveProfile: async (profile: Profile): Promise<Profile> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.saveProfile(profile);
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
