import { DailySummary, MostOrderedQuantity } from '../types';
import { salesService } from './salesService';
import { cashierService } from './cashierService';

export const reportsService = {
  getDailySummary: async (sessionId: string): Promise<DailySummary> => {
    const sales = await salesService.getSalesBySession(sessionId);
    const session = await cashierService.getSessionById(sessionId);
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

    sales.forEach((sale) => {
      if (sale.status === 'paid') {
        total_sales_paid++;
        total_breads_paid += sale.quantity;
        total_value_paid += Number(sale.total || 0);

        if (sale.payment_method === 'pix') total_pix += Number(sale.total || 0);
        else if (sale.payment_method === 'cash') total_cash += Number(sale.total || 0);
        else if (sale.payment_method === 'card') total_card += Number(sale.total || 0);
        else if (sale.payment_method === 'credit') total_credit += Number(sale.total || 0);
      } else if (sale.status === 'waiting_payment') {
        total_sales_pending++;
        total_breads_pending += sale.quantity;
        total_value_pending += Number(sale.total || 0);
      } else if (sale.status === 'cancelled') {
        total_sales_cancelled++;
        total_breads_cancelled += sale.quantity;
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
      quantity_remaining_estimated,
    };
  },

  getMostOrderedQuantities: async (sessionId: string): Promise<MostOrderedQuantity[]> => {
    const sales = await salesService.getSalesBySession(sessionId);
    const activeSales = sales.filter((sale) => sale.status !== 'cancelled');

    const countMap: Record<number, number> = {};
    activeSales.forEach((sale) => {
      countMap[sale.quantity] = (countMap[sale.quantity] || 0) + 1;
    });

    return Object.entries(countMap)
      .map(([quantity, count]) => ({
        quantity: Number(quantity),
        times_ordered: count,
      }))
      .sort((a, b) => b.times_ordered - a.times_ordered)
      .slice(0, 6);
  },
};
