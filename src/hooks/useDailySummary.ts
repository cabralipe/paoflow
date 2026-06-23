import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { reportsService } from '../services/reportsService';
import { DailySummary } from '../types';

export function useDailySummary(sessionId: string | undefined) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!sessionId) {
      setSummary(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await reportsService.getDailySummary(sessionId);
      setSummary(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar resumo diario:', err);
      setError(err.message || 'Erro ao carregar resumo diario.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSummary();

    const bakeryId = authService.getCurrentUser()?.bakery_id;
    if (!sessionId || !isSupabaseConfigured || !bakeryId) return;

    const channel = supabase
      .channel(`summary-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `cash_session_id=eq.${sessionId}`,
        },
        () => fetchSummary()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_sessions',
          filter: `bakery_id=eq.${bakeryId}`,
        },
        () => fetchSummary()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
