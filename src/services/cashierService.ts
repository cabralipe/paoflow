import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { simulatedDb } from '../lib/simulatedDb';
import { CashSession } from '../types';

export const cashierService = {
  getCurrentSession: async (): Promise<CashSession | null> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.getCurrentSession();
    }

    const { data, error } = await supabase
      .from('cash_sessions')
      .select(`
        *,
        opener:profiles!cash_sessions_opened_by_fkey(name),
        closer:profiles!cash_sessions_closed_by_fkey(name)
      `)
      .eq('status', 'open')
      .limit(1);

    if (error) {
      console.error('Erro ao buscar sessão no Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const session = data[0];
    return {
      ...session,
      opened_by_name: session.opener?.name || 'Desconhecido',
      closed_by_name: session.closer?.name || null
    };
  },

  openSession: async (userId: string, quantity: number, notes?: string): Promise<CashSession> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.openSession(userId, quantity, notes);
    }

    // Primeiro, fecha qualquer sessão que tenha ficado aberta por segurança
    const { data: openSessions } = await supabase
      .from('cash_sessions')
      .select('id')
      .eq('status', 'open');

    if (openSessions && openSessions.length > 0) {
      for (const openSess of openSessions) {
        await supabase
          .from('cash_sessions')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: userId
          })
          .eq('id', openSess.id);
      }
    }

    const { data, error } = await supabase
      .from('cash_sessions')
      .insert({
        opened_by: userId,
        opening_bread_quantity: quantity,
        status: 'open',
        notes: notes || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  closeSession: async (userId: string, quantityRemaining: number, notes?: string): Promise<CashSession> => {
    const session = await cashierService.getCurrentSession();
    if (!session) throw new Error('Não há uma sessão de caixa aberta atualmente.');

    if (!isSupabaseConfigured) {
      return simulatedDb.closeSession(userId, quantityRemaining, notes);
    }

    const { data, error } = await supabase
      .from('cash_sessions')
      .update({
        status: 'closed',
        closed_by: userId,
        closed_at: new Date().toISOString(),
        closing_bread_quantity: quantityRemaining,
        notes: notes || session.notes
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
