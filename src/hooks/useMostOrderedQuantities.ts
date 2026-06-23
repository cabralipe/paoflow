import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { reportsService } from '../services/reportsService';
import { MostOrderedQuantity } from '../types';

export function useMostOrderedQuantities(sessionId: string | undefined) {
  const [mostOrdered, setMostOrdered] = useState<MostOrderedQuantity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMostOrdered = useCallback(async () => {
    if (!sessionId) {
      setMostOrdered([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await reportsService.getMostOrderedQuantities(sessionId);
      setMostOrdered(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar quantidades mais vendidas:', err);
      setError(err.message || 'Erro ao carregar quantidades mais vendidas.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMostOrdered();

    if (!sessionId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`most-ordered-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `cash_session_id=eq.${sessionId}`,
        },
        () => fetchMostOrdered()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchMostOrdered]);

  return { mostOrdered, loading, error, refetch: fetchMostOrdered };
}
