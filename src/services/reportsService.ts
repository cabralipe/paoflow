import { isSupabaseConfigured } from '../lib/supabase';
import { simulatedDb } from '../lib/simulatedDb';
import { DailySummary, MostOrderedQuantity } from '../types';
import { salesService } from './salesService';
import { cashierService } from './cashierService';

export const reportsService = {
  getDailySummary: async (sessionId: string): Promise<DailySummary> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.getDailySummary(sessionId);
    }

    // Para maior resiliência caso a RPC no Supabase não esteja definida,
    // nós mesmos calculamos os agregados no cliente a partir de todas as vendas!
    const sales = await salesService.getSalesBySession(sessionId);
    const session = await cashierService.getCurrentSession();
    const openingQuantity = session ? session.opening_bread_quantity : 0;
    const closingQuantity = session ? session.closing_bread_quantity || null : null;

    let total_sales_paid = 0;
    let total_sales_pending = 0;
    let total_sales_cancelled = 0;

    let total_breads_paid = 0;
    let total_breads_pending = 0;
    let total_breads_cancelled = 0;

    let total_value_paid = 0;
    let total_value_pending = 0;

    let total_pix = 0;
    let total_cash = 0;
    let total_card = 0;
    let total_credit = 0;

    sales.forEach(s => {
      if (s.status === 'paid') {
        total_sales_paid++;
        total_breads_paid += s.quantity;
        total_value_paid += Number(s.total || 0);

        if (s.payment_method === 'pix') total_pix += Number(s.total || 0);
        else if (s.payment_method === 'cash') total_cash += Number(s.total || 0);
        else if (s.payment_method === 'card') total_card += Number(s.total || 0);
        else if (s.payment_method === 'credit') total_credit += Number(s.total || 0);
      } else if (s.status === 'waiting_payment') {
        total_sales_pending++;
        total_breads_pending += s.quantity;
        total_value_pending += Number(s.total || 0);
      } else if (s.status === 'cancelled') {
        total_sales_cancelled++;
        total_breads_cancelled += s.quantity;
      }
    });

    const quantity_remaining_estimated = Math.max(0, openingQuantity - total_breads_paid - total_breads_pending);

    return {
      opening_bread_quantity: openingQuantity,
      closing_bread_quantity: closingQuantity,
      total_sales_paid,
      total_sales_pending,
      total_sales_cancelled,
      total_breads_paid,
      total_breads_pending,
      total_breads_cancelled,
      total_value_paid,
      total_value_pending,
      total_pix,
      total_cash,
      total_card,
      total_credit,
      quantity_remaining_estimated
    };
  },

  getMostOrderedQuantities: async (sessionId: string): Promise<MostOrderedQuantity[]> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.getMostOrderedQuantities(sessionId);
    }

    const sales = await salesService.getSalesBySession(sessionId);
    const activeSales = sales.filter(s => s.status !== 'cancelled');
    
    const countMap: Record<number, number> = {};
    activeSales.forEach(s => {
      countMap[s.quantity] = (countMap[s.quantity] || 0) + 1;
    });

    const ordered = Object.entries(countMap)
      .map(([qty, count]) => ({
        quantity: Number(qty),
        times_ordered: count
      }))
      .sort((a, b) => b.times_ordered - a.times_ordered)
      .slice(0, 6);

    return ordered;
  }
};
