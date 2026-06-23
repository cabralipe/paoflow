import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PaymentMethod, Sale } from '../types';
import { authService } from './authService';

const ensureBakeryId = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase nao configurado.');
  }
  const user = authService.getCurrentUser();
  if (!user?.bakery_id) {
    throw new Error('Usuario sem padaria vinculada.');
  }
  return user.bakery_id;
};

export const salesService = {
  createSale: async (saleData: {
    cash_session_id: string;
    attendant_id: string;
    quantity: number;
    unit_price: number;
    total: number;
    payment_method: PaymentMethod;
  }): Promise<Sale> => {
    const bakeryId = ensureBakeryId();

    const { data, error } = await supabase
      .from('sales')
      .insert({
        bakery_id: bakeryId,
        cash_session_id: saleData.cash_session_id,
        attendant_id: saleData.attendant_id,
        quantity: saleData.quantity,
        unit_price: saleData.unit_price,
        total: saleData.total,
        payment_method: saleData.payment_method,
        status: 'waiting_payment',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  confirmPayment: async (saleId: string, confirmedByUserId: string): Promise<Sale> => {
    ensureBakeryId();

    const { data, error } = await supabase
      .from('sales')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        confirmed_by: confirmedByUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', saleId)
      .eq('status', 'waiting_payment')
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Esta venda ja foi processada, paga ou cancelada por outro caixa.');
    }
    return data[0];
  },

  cancelSale: async (saleId: string, cancelledByUserId: string): Promise<Sale> => {
    ensureBakeryId();

    const { data, error } = await supabase
      .from('sales')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledByUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', saleId)
      .eq('status', 'waiting_payment')
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Nao foi possivel cancelar: pedido nao esta mais aguardando pagamento.');
    }
    return data[0];
  },

  getSalesBySession: async (sessionId: string): Promise<Sale[]> => {
    const bakeryId = ensureBakeryId();

    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        attendant:profiles!sales_attendant_id_fkey(name),
        confirmed:profiles!sales_confirmed_by_fkey(name),
        cancelled:profiles!sales_cancelled_by_fkey(name)
      `)
      .eq('bakery_id', bakeryId)
      .eq('cash_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return sales.map((s: any) => ({
      ...s,
      attendant_name: s.attendant?.name || 'Desconhecido',
      confirmed_by_name: s.confirmed?.name || undefined,
      cancelled_by_name: s.cancelled?.name || undefined,
    }));
  },

  getSalesByAttendantToday: async (sessionId: string, attendantId: string): Promise<Sale[]> => {
    const bakeryId = ensureBakeryId();

    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('bakery_id', bakeryId)
      .eq('cash_session_id', sessionId)
      .eq('attendant_id', attendantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return sales;
  },
};
