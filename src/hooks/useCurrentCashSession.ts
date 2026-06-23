import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { cashierService } from '../services/cashierService';
import { CashSession } from '../types';

export function useCurrentCashSession() {
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const session = await cashierService.getCurrentSession();
      setCurrentSession(session);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar sessao em useCurrentCashSession:', err);
      setError(err.message || 'Erro ao carregar sessao de caixa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    const bakeryId = authService.getCurrentUser()?.bakery_id;
    if (!isSupabaseConfigured || !bakeryId) return;

    const channel = supabase
      .channel(`cash-session-${bakeryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_sessions',
          filter: `bakery_id=eq.${bakeryId}`,
        },
        () => {
          fetchSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { currentSession, loading, error, refetch: fetchSession };
}
