import { Profile, BreadSettings, CashSession, Sale, DailySummary } from '../types';

// Dados iniciais de semente (Seeding)
const DEFAULT_PROFILES: Profile[] = [
  { id: 'u-ana', name: 'Ana Silva', role: 'attendant', active: true },
  { id: 'u-carlos', name: 'Carlos Santos', role: 'attendant', active: true },
  { id: 'u-beatriz', name: 'Beatriz Costa', role: 'cashier', active: true },
  { id: 'u-admin', name: 'Felipe Admin', role: 'admin', active: true }
];

const DEFAULT_SETTINGS: BreadSettings = {
  id: 'b-default',
  bread_name: 'Pão francês',
  unit_price: 0.80,
  quick_quantities: [5, 10, 12, 20],
  active: true,
  created_at: new Date().toISOString()
};

// Carrega ou inicializa no LocalStorage
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data) as T;
};

const setStorageItem = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
  // Notifica outras partes da aplicação para simular o Supabase Realtime
  window.dispatchEvent(new CustomEvent('paoflow_db_update', { detail: { key } }));
};

export const simulatedDb = {
  getProfiles: (): Profile[] => {
    return getStorageItem<Profile[]>('pf_profiles', DEFAULT_PROFILES);
  },
  
  saveProfile: (profile: Profile): Profile => {
    const profiles = simulatedDb.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    setStorageItem('pf_profiles', profiles);
    return profile;
  },

  getSettings: (): BreadSettings => {
    return getStorageItem<BreadSettings>('pf_settings', DEFAULT_SETTINGS);
  },

  saveSettings: (settings: BreadSettings): BreadSettings => {
    setStorageItem('pf_settings', settings);
    return settings;
  },

  getCashSessions: (): CashSession[] => {
    return getStorageItem<CashSession[]>('pf_cash_sessions', []);
  },

  getCurrentSession: (): CashSession | null => {
    const sessions = simulatedDb.getCashSessions();
    const openSession = sessions.find(s => s.status === 'open');
    if (openSession) {
      // populate names
      const profiles = simulatedDb.getProfiles();
      const opener = profiles.find(p => p.id === openSession.opened_by);
      openSession.opened_by_name = opener ? opener.name : 'Desconhecido';
      return openSession;
    }
    return null;
  },

  openSession: (userId: string, quantity: number, notes?: string): CashSession => {
    const sessions = simulatedDb.getCashSessions();
    
    // Fecha qualquer uma que estiver aberta por garantia
    sessions.forEach(s => {
      if (s.status === 'open') {
        s.status = 'closed';
        s.closed_at = new Date().toISOString();
        s.closed_by = userId;
      }
    });

    const newSession: CashSession = {
      id: 'sess-' + Math.random().toString(36).substring(2, 9),
      opened_by: userId,
      opened_at: new Date().toISOString(),
      opening_bread_quantity: quantity,
      status: 'open',
      notes: notes || ''
    };

    sessions.push(newSession);
    setStorageItem('pf_cash_sessions', sessions);
    return newSession;
  },

  closeSession: (userId: string, quantityRemaining: number, notes?: string): CashSession => {
    const sessions = simulatedDb.getCashSessions();
    const openIndex = sessions.findIndex(s => s.status === 'open');
    if (openIndex === -1) {
      throw new Error('Não há sessão de caixa aberta para fechar.');
    }

    const session = sessions[openIndex];
    session.status = 'closed';
    session.closed_by = userId;
    session.closed_at = new Date().toISOString();
    session.closing_bread_quantity = quantityRemaining;
    session.notes = notes || session.notes;

    setStorageItem('pf_cash_sessions', sessions);
    return session;
  },

  getSales: (): Sale[] => {
    const sales = getStorageItem<Sale[]>('pf_sales', []);
    const profiles = simulatedDb.getProfiles();
    // Preenche nomes dos atendentes de forma virtual para fins de exibição
    return sales.map(s => {
      const att = profiles.find(p => p.id === s.attendant_id);
      const conf = s.confirmed_by ? profiles.find(p => p.id === s.confirmed_by) : null;
      const canc = s.cancelled_by ? profiles.find(p => p.id === s.cancelled_by) : null;
      return {
        ...s,
        attendant_name: att ? att.name : 'Atendente s/ nome',
        confirmed_by_name: conf ? conf.name : undefined,
        cancelled_by_name: canc ? canc.name : undefined
      };
    });
  },

  createSale: (saleData: Omit<Sale, 'id' | 'sale_number' | 'created_at'>): Sale => {
    const sales = getStorageItem<Sale[]>('pf_sales', []);
    // Calcula próximo número de venda
    const nextNum = sales.length + 1;
    const newSale: Sale = {
      ...saleData,
      id: 'sale-' + Math.random().toString(36).substring(2, 9),
      sale_number: nextNum,
      created_at: new Date().toISOString()
    };
    sales.push(newSale);
    setStorageItem('pf_sales', sales);
    return newSale;
  },

  updateSaleStatus: (saleId: string, status: 'paid' | 'cancelled', userId: string): Sale => {
    const sales = getStorageItem<Sale[]>('pf_sales', []);
    const index = sales.findIndex(s => s.id === saleId);
    if (index === -1) {
      throw new Error('Venda não encontrada');
    }
    
    const sale = sales[index];
    if (sale.status !== 'waiting_payment') {
      throw new Error('Este pedido já foi processado ou cancelado');
    }

    sale.status = status;
    sale.updated_at = new Date().toISOString();
    
    if (status === 'paid') {
      sale.paid_at = new Date().toISOString();
      sale.confirmed_by = userId;
    } else {
      sale.cancelled_at = new Date().toISOString();
      sale.cancelled_by = userId;
    }

    sales[index] = sale;
    setStorageItem('pf_sales', sales);
    return sale;
  },

  getDailySummary: (sessionId: string): DailySummary => {
    const sessions = simulatedDb.getCashSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      return {
        opening_bread_quantity: 0,
        closing_bread_quantity: null,
        total_sales_paid: 0,
        total_sales_pending: 0,
        total_sales_cancelled: 0,
        total_breads_paid: 0,
        total_breads_pending: 0,
        total_breads_cancelled: 0,
        total_value_paid: 0,
        total_value_pending: 0,
        total_pix: 0,
        total_cash: 0,
        total_card: 0,
        total_credit: 0,
        quantity_remaining_estimated: 0
      };
    }

    const sales = simulatedDb.getSales().filter(s => s.cash_session_id === sessionId);
    
    let paidSalesCount = 0;
    let pendingSalesCount = 0;
    let cancelledSalesCount = 0;
    
    let paidBreads = 0;
    let pendingBreads = 0;
    let cancelledBreads = 0;
    
    let paidValue = 0;
    let pendingValue = 0;
    
    let pix = 0;
    let cash = 0;
    let card = 0;
    let credit = 0;

    sales.forEach(s => {
      if (s.status === 'paid') {
        paidSalesCount++;
        paidBreads += s.quantity;
        paidValue += s.total;
        
        if (s.payment_method === 'pix') pix += s.total;
        else if (s.payment_method === 'cash') cash += s.total;
        else if (s.payment_method === 'card') card += s.total;
        else if (s.payment_method === 'credit') credit += s.total;
      } else if (s.status === 'waiting_payment') {
        pendingSalesCount++;
        pendingBreads += s.quantity;
        pendingValue += s.total;
      } else if (s.status === 'cancelled') {
        cancelledSalesCount++;
        cancelledBreads += s.quantity;
      }
    });

    const closingBread = session.closing_bread_quantity !== undefined ? session.closing_bread_quantity : null;
    const estRemaining = Math.max(0, session.opening_bread_quantity - paidBreads - pendingBreads);

    return {
      opening_bread_quantity: session.opening_bread_quantity,
      closing_bread_quantity: closingBread,
      total_sales_paid: paidSalesCount,
      total_sales_pending: pendingSalesCount,
      total_sales_cancelled: cancelledSalesCount,
      total_breads_paid: paidBreads,
      total_breads_pending: pendingBreads,
      total_breads_cancelled: cancelledBreads,
      total_value_paid: paidValue,
      total_value_pending: pendingValue,
      total_pix: pix,
      total_cash: cash,
      total_card: card,
      total_credit: credit,
      quantity_remaining_estimated: estRemaining
    };
  },

  getMostOrderedQuantities: (sessionId: string) => {
    const sales = simulatedDb.getSales().filter(s => s.cash_session_id === sessionId && s.status !== 'cancelled');
    const tally: Record<number, number> = {};
    sales.forEach(s => {
      tally[s.quantity] = (tally[s.quantity] || 0) + 1;
    });

    return Object.entries(tally)
      .map(([qtyStr, count]) => ({
        quantity: parseInt(qtyStr, 10),
        times_ordered: count
      }))
      .sort((a, b) => b.times_ordered - a.times_ordered)
      .slice(0, 6);
  }
};
