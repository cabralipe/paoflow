export type UserRole = 'attendant' | 'cashier' | 'admin';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at?: string;
}

export interface BreadSettings {
  id: string;
  bread_name: string;
  unit_price: number;
  quick_quantities: number[];
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CashSessionStatus = 'open' | 'closed';

export interface CashSession {
  id: string;
  opened_by: string;
  closed_by?: string | null;
  opened_at: string;
  closed_at?: string | null;
  opening_bread_quantity: number;
  closing_bread_quantity?: number | null;
  status: CashSessionStatus;
  notes?: string | null;
  // Join properties or names for UI display
  opened_by_name?: string;
  closed_by_name?: string;
}

export type PaymentMethod = 'pix' | 'cash' | 'card' | 'credit';

export type SaleStatus = 'waiting_payment' | 'paid' | 'cancelled';

export interface Sale {
  id: string;
  sale_number: number;
  cash_session_id: string;
  attendant_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  paid_at?: string | null;
  cancelled_at?: string | null;
  confirmed_by?: string | null;
  cancelled_by?: string | null;
  created_at: string;
  updated_at?: string;
  // Expanded visual labels
  attendant_name?: string;
  confirmed_by_name?: string;
  cancelled_by_name?: string;
}

export interface DailySummary {
  opening_bread_quantity: number;
  closing_bread_quantity: number | null;
  total_sales_paid: number;
  total_sales_pending: number;
  total_sales_cancelled: number;
  total_breads_paid: number;
  total_breads_pending: number;
  total_breads_cancelled: number;
  total_value_paid: number;
  total_value_pending: number;
  total_pix: number;
  total_cash: number;
  total_card: number;
  total_credit: number;
  quantity_remaining_estimated: number;
}

export interface MostOrderedQuantity {
  quantity: number;
  times_ordered: number;
}
