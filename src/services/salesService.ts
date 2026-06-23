import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { simulatedDb } from '../lib/simulatedDb';
import { Sale, SaleStatus, PaymentMethod } from '../types';

export const salesService = {
  // Criar Venda Rápida
  createSale: async (saleData: {
    cash_session_id: string;
    attendant_id: string;
    quantity: number;
    unit_price: number;
    total: number;
    payment_method: PaymentMethod;
  }): Promise<Sale> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.createSale({
        ...saleData,
        status: 'waiting_payment'
      });
    }

    const { data, error } = await supabase
      .from('sales')
      .insert({
        cash_session_id: saleData.cash_session_id,
        attendant_id: saleData.attendant_id,
        quantity: saleData.quantity,
        unit_price: saleData.unit_price,
        total: saleData.total,
        payment_method: saleData.payment_method,
        status: 'waiting_payment'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir venda no Supabase:', error);
      throw error;
    }
    return data;
  },

  // Confirmar Pagamento com proteção de concorrência
  confirmPayment: async (saleId: string, confirmedByUserId: string): Promise<Sale> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.updateSaleStatus(saleId, 'paid', confirmedByUserId);
    }

    // Só atualiza se o status atual for 'waiting_payment' para evitar pagamento duplo
    const { data, error } = await supabase
      .from('sales')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        confirmed_by: confirmedByUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)
      .eq('status', 'waiting_payment') // Garantia de concorrência solicitada
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Esta venda já foi processada, paga ou cancelada por outro caixa.');
    }
    return data[0];
  },

  // Cancelar Venda
  cancelSale: async (saleId: string, cancelledByUserId: string): Promise<Sale> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.updateSaleStatus(saleId, 'cancelled', cancelledByUserId);
    }

    const { data, error } = await supabase
      .from('sales')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledByUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)
      .eq('status', 'waiting_payment') // Só pode cancelar se estiver aguardando pagamento
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Não foi possível cancelar: pedido não está mais aguardando pagamento.');
    }
    return data[0];
  },

  // Listar todas as vendas do dia/sessão de caixa ativa
  getSalesBySession: async (sessionId: string): Promise<Sale[]> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.getSales().filter(s => s.cash_session_id === sessionId);
    }

    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        attendant:profiles!sales_attendant_id_fkey(name),
        confirmed:profiles!sales_confirmed_by_fkey(name),
        cancelled:profiles!sales_cancelled_by_fkey(name)
      `)
      .eq('cash_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Normaliza os dados para incluir campos planos _name para simplificar componentes React
    return sales.map((s: any) => ({
      ...s,
      attendant_name: s.attendant?.name || 'Desconhecido',
      confirmed_by_name: s.confirmed?.name || undefined,
      cancelled_by_name: s.cancelled?.name || undefined
    }));
  },

  // Vendas do atendente no dia
  getSalesByAttendantToday: async (sessionId: string, attendantId: string): Promise<Sale[]> => {
    if (!isSupabaseConfigured) {
      return simulatedDb.getSales().filter(s => s.cash_session_id === sessionId && s.attendant_id === attendantId);
    }

    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('cash_session_id', sessionId)
      .eq('attendant_id', attendantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return sales;
  }
};
