import { useEffect, useState } from 'react';
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
      console.error('Erro ao buscar sessão em useCurrentCashSession:', err);
      setError(err.message || 'Erro ao carregar sessão de caixa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Ouvi atualizações nos dados de caixa
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'pf_cash_sessions' || customEvent.detail?.key === 'pf_sales') {
        fetchSession();
      }
    };

    window.addEventListener('paoflow_db_update', handleUpdate);
    return () => {
      window.removeEventListener('paoflow_db_update', handleUpdate);
    };
  }, []);

  return { currentSession, loading, error, refetch: fetchSession };
}
