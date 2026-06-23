import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { salesService } from '../services/salesService';
import { Sale } from '../types';

export function useRealtimeSales(sessionId: string | undefined) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    if (!sessionId) {
      setSales([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await salesService.getSalesBySession(sessionId);
      setSales(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar vendas em useRealtimeSales:', err);
      setError(err.message || 'Erro ao carregar vendas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    if (!sessionId) return;

    if (isSupabaseConfigured) {
      // Configuração de real-time do Supabase para escutar inserções e atualizações na tabela sales
      const channel = supabase
        .channel(`realtime-sales-sess-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sales',
            filter: `cash_session_id=eq.${sessionId}`
          },
          () => {
            // Recarrega as vendas para garantir que os dados complementares de join (como perfis de atendentes) venham corretos
            fetchSales();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Para o modo de simulação, ouvimos eventos customizados do LocalStorage
      const handleSimulatedUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.key === 'pf_sales') {
          fetchSales();
        }
      };

      window.addEventListener('paoflow_db_update', handleSimulatedUpdate);
      return () => {
        window.removeEventListener('paoflow_db_update', handleSimulatedUpdate);
      };
    }
  }, [sessionId]);

  return { sales, loading, error, refetch: fetchSales };
}
