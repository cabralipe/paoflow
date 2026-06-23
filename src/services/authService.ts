import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Bakery, Profile, UserRole } from '../types';

interface CreateProfileInput {
  email: string;
  password: string;
  name: string;
  role: Exclude<UserRole, 'superadmin'>;
  bakery_id: string;
}

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

const storeCurrentUser = (profile: Profile | null) => {
  if (profile) {
    localStorage.setItem('pf_current_user', JSON.stringify(profile));
  } else {
    localStorage.removeItem('pf_current_user');
  }
  window.dispatchEvent(new CustomEvent('auth_state_change', { detail: { user: profile } }));
};

export const authService = {
  getCurrentUser: (): Profile | null => {
    const saved = localStorage.getItem('pf_current_user');
    return saved ? JSON.parse(saved) : null;
  },

  login: async (email: string, password: string): Promise<Profile> => {
    ensureSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sem resposta valida do usuario do login.');

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*, bakery:bakeries(name, slug)')
      .eq('id', data.user.id)
      .single();

    if (profileErr) {
      await supabase.auth.signOut();
      throw new Error('Login autenticado, mas o perfil operacional nao foi encontrado.');
    }

    if (!profile.active) {
      await supabase.auth.signOut();
      throw new Error('Usuario inativo. Procure o administrador da padaria.');
    }

    if (profile.role !== 'superadmin' && !profile.bakery_id) {
      await supabase.auth.signOut();
      throw new Error('Usuario sem padaria vinculada. Procure o superadmin.');
    }

    storeCurrentUser(profile);
    return profile;
  },

  logout: async (): Promise<void> => {
    storeCurrentUser(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  refreshCurrentProfile: async (): Promise<Profile | null> => {
    ensureSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      storeCurrentUser(null);
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, bakery:bakeries(name, slug)')
      .eq('id', userId)
      .single();

    if (error || !profile?.active) {
      storeCurrentUser(null);
      return null;
    }

    storeCurrentUser(profile);
    return profile;
  },

  getProfiles: async (): Promise<Profile[]> => {
    ensureSupabase();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*, bakery:bakeries(name, slug)')
      .order('name');
    if (error) throw error;
    return profiles;
  },

  createProfile: async (profile: CreateProfileInput): Promise<Profile> => {
    ensureSupabase();
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: profile,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.profile;
  },

  saveProfile: async (profile: Profile): Promise<Profile> => {
    ensureSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select('*, bakery:bakeries(name, slug)')
      .single();
    if (error) throw error;
    return data;
  },

  getBakeriesForCurrentUser: async (): Promise<Bakery[]> => {
    ensureSupabase();
    const { data, error } = await supabase
      .from('bakeries')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    return data;
  },
};
