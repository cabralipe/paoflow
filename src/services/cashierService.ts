import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CashSession } from '../types';
import { authService } from './authService';

const SESSION_SELECT = `
  *,
  opener:profiles!cash_sessions_opened_by_fkey(name),
  closer:profiles!cash_sessions_closed_by_fkey(name)
`;

const normalizeSession = (session: any): CashSession => ({
  ...session,
  opened_by_name: session.opener?.name || 'Desconhecido',
  closed_by_name: session.closer?.name || null,
});

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

const getBakeryIdOrNull = () => {
  const user = authService.getCurrentUser();
  if (!isSupabaseConfigured || !user?.bakery_id) {
    return null;
  }
  return user.bakery_id;
};

export const cashierService = {
  getCurrentSession: async (): Promise<CashSession | null> => {
    const bakeryId = getBakeryIdOrNull();
    if (!bakeryId) {
      return null;
    }

    const { data, error } = await supabase
      .from('cash_sessions')
      .select(SESSION_SELECT)
      .eq('bakery_id', bakeryId)
      .eq('status', 'open')
      .limit(1);

    if (error) {
      console.error('Erro ao buscar sessao no Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return normalizeSession(data[0]);
  },

  getSessionById: async (sessionId: string): Promise<CashSession | null> => {
    const bakeryId = getBakeryIdOrNull();
    if (!bakeryId) return null;

    const { data, error } = await supabase
      .from('cash_sessions')
      .select(SESSION_SELECT)
      .eq('bakery_id', bakeryId)
      .eq('id', sessionId)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return normalizeSession(data[0]);
  },

  getLastClosedSession: async (): Promise<CashSession | null> => {
    const bakeryId = getBakeryIdOrNull();
    if (!bakeryId) return null;

    const { data, error } = await supabase
      .from('cash_sessions')
      .select(SESSION_SELECT)
      .eq('bakery_id', bakeryId)
      .eq('status', 'closed')
      .order('closed_at', { ascending: false, nullsFirst: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return normalizeSession(data[0]);
  },

  openSession: async (userId: string, quantity: number, notes?: string): Promise<CashSession> => {
    const bakeryId = ensureBakeryId();

    const { data: openSessions, error: openErr } = await supabase
      .from('cash_sessions')
      .select('id')
      .eq('bakery_id', bakeryId)
      .eq('status', 'open');

    if (openErr) throw openErr;

    if (openSessions && openSessions.length > 0) {
      for (const openSess of openSessions) {
        const { error: closeErr } = await supabase
          .from('cash_sessions')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: userId,
          })
          .eq('id', openSess.id);
        if (closeErr) throw closeErr;
      }
    }

    const { data, error } = await supabase
      .from('cash_sessions')
      .insert({
        bakery_id: bakeryId,
        opened_by: userId,
        opening_bread_quantity: quantity,
        status: 'open',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  closeSession: async (userId: string, quantityRemaining: number, notes?: string): Promise<CashSession> => {
    const session = await cashierService.getCurrentSession();
    if (!session) throw new Error('Nao ha uma sessao de caixa aberta atualmente.');

    const { data, error } = await supabase
      .from('cash_sessions')
      .update({
        status: 'closed',
        closed_by: userId,
        closed_at: new Date().toISOString(),
        closing_bread_quantity: quantityRemaining,
        notes: notes || session.notes,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) throw error;
    const closedSession = await cashierService.getSessionById(data.id);
    return closedSession || data;
  },
};
