import { useEffect, useState, useCallback } from 'react';
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
      console.error('Erro ao buscar resumo diário:', err);
      setError(err.message || 'Erro ao carregar resumo diário.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSummary();

    if (!sessionId) return;

    // Atualiza automaticamente quando houver mudanças no banco ou nas vendas
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail?.key === 'pf_sales' ||
        customEvent.detail?.key === 'pf_cash_sessions'
      ) {
        fetchSummary();
      }
    };

    window.addEventListener('paoflow_db_update', handleUpdate);
    return () => {
      window.removeEventListener('paoflow_db_update', handleUpdate);
    };
  }, [sessionId, fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
