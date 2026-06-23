import React from 'react';
import { DailySummary as IDailySummary } from '../types';
import { formatCurrency } from '../utils/currency';
import { 
  TrendingUp, 
  Clock, 
  XOctagon, 
  ShoppingBag, 
  CheckCircle,
  QrCode, 
  Coins, 
  CreditCard, 
  Notebook,
  Activity,
  Package
} from 'lucide-react';

interface DailySummaryProps {
  summary: IDailySummary | null;
  loading?: boolean;
}

export default function DailySummary({ summary, loading }: DailySummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="pao-summary-shimmer">
        <div className="h-28 bg-white border-4 border-brand-dark animate-pulse"></div>
        <div className="h-28 bg-white border-4 border-brand-dark animate-pulse"></div>
        <div className="h-28 bg-white border-4 border-brand-dark animate-pulse"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white border-4 border-brand-dark p-8 text-center text-brand-dark font-black uppercase tracking-wider shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="pao-summary-empty">
        Nenhum resumo disponível para esta sessão.
      </div>
    );
  }

  const paymentDetails = [
    { label: 'PIX', value: summary.total_pix, color: 'bg-cyan-500 text-white', icon: QrCode },
    { label: 'DINHEIRO', value: summary.total_cash, color: 'bg-emerald-500 text-white', icon: Coins },
    { label: 'CARTÃO', value: summary.total_card, color: 'bg-blue-500 text-white', icon: CreditCard },
    { label: 'FIADO', value: summary.total_credit, color: 'bg-brand-orange text-white', icon: Notebook }
  ];

  return (
    <div className="flex flex-col gap-6" id="pao-summary-dashboard">
      {/* 1. Indicadores Financeiros Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Recebido */}
        <div className="bg-emerald-500 text-white border-4 border-brand-dark p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex items-center justify-between">
          <div>
            <span className="text-white font-black uppercase tracking-[0.15em] text-[10px] block leading-none">
              VALOR TOTAL RECEBIDO (PAGO)
            </span>
            <span className="text-3xl font-black block mt-3 font-mono leading-none">
              {formatCurrency(summary.total_value_paid)}
            </span>
            <span className="text-[10px] text-white bg-brand-dark/20 border border-white/30 px-2 py-1 mt-3.5 inline-block font-black uppercase tracking-wider">
              {summary.total_sales_paid} vendas pagas
            </span>
          </div>
          <div className="bg-brand-dark text-white p-3 border-2 border-brand-dark shrink-0">
            <CheckCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>

        {/* Valor Aguardando Pagamento */}
        <div className="bg-brand-orange text-white border-4 border-brand-dark p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex items-center justify-between">
          <div>
            <span className="text-white font-black uppercase tracking-[0.15em] text-[10px] block leading-none">
              VALOR PENDENTE
            </span>
            <span className="text-3xl font-black block mt-3 font-mono leading-none">
              {formatCurrency(summary.total_value_pending)}
            </span>
            <span className="text-[10px] text-white bg-brand-dark/20 border border-white/30 px-2 py-1 mt-3.5 inline-block font-black uppercase tracking-wider">
              {summary.total_sales_pending} vendas na fila
            </span>
          </div>
          <div className="bg-brand-dark text-white p-3 border-2 border-brand-dark shrink-0">
            <Clock className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>

        {/* Total Estimado de Pães Vendidos */}
        <div className="bg-brand-dark text-[#FEF3C7] border-4 border-brand-dark p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex items-center justify-between">
          <div>
            <span className="text-[#A39E93] font-black uppercase tracking-[0.15em] text-[10px] block leading-none">
              PÃES PAGOS HOJE
            </span>
            <span className="text-3xl font-black block mt-3 font-mono leading-none text-[#FEF3C7]">
              {summary.total_breads_paid} pães
            </span>
            <span className="text-[10px] text-[#FEF3C7]/90 bg-white/10 px-2 py-1 mt-3.5 inline-block font-black uppercase tracking-wider">
              {summary.total_breads_pending} pães em fila
            </span>
          </div>
          <div className="bg-[#FEF3C7] text-brand-dark p-3 border-2 border-brand-dark shrink-0">
            <ShoppingBag className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 2. Resumo da Carga de Pães (Estoque) */}
      <div className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
        <h3 className="text-base font-black text-brand-dark uppercase tracking-tight flex items-center gap-2 mb-4 border-b-4 border-brand-dark/5 pb-3">
          <Package className="w-4 h-4 text-brand-orange stroke-[2.5]" />
          Controle de Carga de Pão Francês (Estoque Estimado)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border-3 border-brand-dark p-3.5 bg-white shadow-[2px_2px_0px_rgba(26,26,26,1)]">
            <span className="text-brand-dark/70 text-[10px] font-black uppercase tracking-wide block">Carga Inicial</span>
            <span className="text-2xl font-black block mt-1.5 text-brand-dark font-mono uppercase">{summary.opening_bread_quantity} PÃES</span>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase mt-1 block">pães abertos</span>
          </div>

          <div className="border-3 border-brand-dark p-3.5 bg-emerald-500/10 shadow-[2px_2px_0px_rgba(26,26,26,1)]">
            <span className="text-emerald-800 text-[10px] font-black uppercase tracking-wide block">Vendidos (PAGOS)</span>
            <span className="text-2xl font-black block mt-1.5 text-emerald-850 font-mono uppercase">{summary.total_breads_paid} PÃES</span>
            <span className="text-[9px] text-emerald-600 font-extrabold uppercase mt-1 block">saída confirmada</span>
          </div>

          <div className="border-3 border-brand-dark p-3.5 bg-rose-500/10 shadow-[2px_2px_0px_rgba(26,26,26,1)]">
            <span className="text-rose-800 text-[10px] font-black uppercase tracking-wide block">Cancelados</span>
            <span className="text-2xl font-black block mt-1.5 text-rose-900 font-mono uppercase">{summary.total_breads_cancelled} PÃES</span>
            <span className="text-[9px] text-rose-600 font-extrabold uppercase mt-1 block">perda registrada</span>
          </div>

          <div className="border-3 border-brand-dark p-3.5 bg-brand-yellow/30 shadow-[2px_2px_0px_rgba(26,26,26,1)]">
            <span className="text-amber-900 text-[10px] font-black uppercase tracking-wide block">Estoque Estimado</span>
            <span className="text-2xl font-black block mt-1.5 text-[#78350F] font-mono uppercase">{summary.quantity_remaining_estimated} PÃES</span>
            <span className="text-[9px] text-amber-800 font-extrabold uppercase mt-1 block">balcão disponível</span>
          </div>
        </div>
      </div>

      {/* 3. Receita Detalhada por Forma de Pagamento */}
      <div className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
        <h3 className="text-base font-black text-brand-dark uppercase tracking-tight flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-brand-orange stroke-[2.5]" />
          Faturamento por Meio de Recebimento (PAGOS)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentDetails.map((pay) => {
            const Icon = pay.icon;
            return (
              <div key={pay.label} className={`border-3 border-brand-dark p-4 flex items-center gap-3.5 shadow-[2px_2px_0px_rgba(26,26,26,1)] ${pay.color}`}>
                <div className="p-2 bg-[#FEF3C7] text-brand-dark border-2 border-brand-dark shrink-0">
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/90 block">{pay.label}</span>
                  <span className="text-xl font-black block mt-1 font-mono tracking-tight text-white">
                    {formatCurrency(pay.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
