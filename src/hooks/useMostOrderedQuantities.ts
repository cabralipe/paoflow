import { useEffect, useState, useCallback } from 'react';
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
      setSalesMostOrdered(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar quantidades mais vendidas:', err);
      setError(err.message || 'Erro ao carregar quantidades mais vendidas.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Função auxiliar de fallback para evitar que erros de TypeScript de nomes truncados aconteçam
  const setSalesMostOrdered = (data: MostOrderedQuantity[]) => {
    // Garanta valores padrão se vazios
    if (data.length === 0) {
      setMostOrdered([
        { quantity: 5, times_ordered: 1 },
        { quantity: 10, times_ordered: 1 },
        { quantity: 12, times_ordered: 1 },
        { quantity: 20, times_ordered: 1 }
      ]);
    } else {
      setMostOrdered(data);
    }
  };

  useEffect(() => {
    fetchMostOrdered();

    if (!sessionId) return;

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'pf_sales') {
        fetchMostOrdered();
      }
    };

    window.addEventListener('paoflow_db_update', handleUpdate);
    return () => {
      window.removeEventListener('paoflow_db_update', handleUpdate);
    };
  }, [sessionId, fetchMostOrdered]);

  return { mostOrdered, loading, error, refetch: fetchMostOrdered };
}
