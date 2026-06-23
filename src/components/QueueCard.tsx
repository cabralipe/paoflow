import React from 'react';
import { Sale } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatTime, formatRelativeTime } from '../utils/dates';
import { Check, X, QrCode, Coins, CreditCard, Notebook, User, Clock, ArrowRight } from 'lucide-react';

interface QueueCardProps {
  key?: any;
  sale: Sale;
  onConfirm: (saleId: string) => void;
  onCancel: (saleId: string) => void;
  isProcessing?: boolean;
}

export default function QueueCard({ sale, onConfirm, onCancel, isProcessing }: QueueCardProps) {
  // Config padrão de ícones baseados no método de pagamento
  const getPaymentIndicator = (method: string) => {
    switch (method) {
      case 'pix':
        return { label: 'Pix', color: 'bg-cyan-50 text-cyan-800 border-cyan-150', icon: QrCode };
      case 'cash':
        return { label: 'Dinheiro', color: 'bg-emerald-50 text-emerald-800 border-emerald-150', icon: Coins };
      case 'card':
        return { label: 'Cartão', color: 'bg-blue-50 text-blue-800 border-blue-150', icon: CreditCard };
      case 'credit':
        return { label: 'Fiado', color: 'bg-amber-55/35 text-amber-900 border-amber-150', icon: Notebook };
      default:
        return { label: 'Troco', color: 'bg-slate-50 text-slate-800 border-slate-150', icon: Coins };
    }
  };

  const indicator = getPaymentIndicator(sale.payment_method);
  const Icon = indicator.icon;

  return (
    <div className="bg-white border-4 border-brand-dark p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:shadow-[6px_6px_0px_rgba(26,26,26,1)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4" id={`queue-card-${sale.id}`}>
      {/* Dados do Pedido */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Número do ticket */}
          <span className="text-xs font-black text-white bg-brand-dark border-2 border-brand-dark px-2.5 py-1 uppercase tracking-wider">
            Venda #{String(sale.sale_number).padStart(3, '0')}
          </span>
          {/* Seletor de forma */}
          <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 border-3 border-brand-dark flex items-center gap-1.5 ${indicator.color.replace('border-cyan-150', 'border-brand-dark').replace('border-emerald-150', 'border-brand-dark').replace('border-blue-150', 'border-brand-dark').replace('border-amber-150', 'border-brand-dark')}`}>
            <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
            {indicator.label}
          </span>
          {/* Tempo decorrido */}
          <span className="text-brand-dark/70 text-xs font-mono font-bold flex items-center gap-1 ml-auto md:ml-0 uppercase">
            <Clock className="w-3.5 h-3.5 text-brand-orange" />
            {formatTime(sale.created_at)} ({formatRelativeTime(sale.created_at)})
          </span>
        </div>

        {/* Quantidade & Detalhe */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xl font-black text-brand-dark uppercase tracking-tight">
            {sale.quantity} {sale.quantity === 1 ? 'Pão Francês' : 'Pães Franceses'}
          </span>
          <ArrowRight className="w-4 h-4 text-brand-dark stroke-[2.5]" />
          <span className="text-xl font-black text-brand-orange font-mono">
            {formatCurrency(sale.total)}
          </span>
        </div>

        {/* Atendente que registrou */}
        <div className="flex items-center gap-1.5 text-xs font-bold block">
          <User className="w-3.5 h-3.5 text-brand-dark/60" />
          <span className="text-slate-500 uppercase tracking-wide">Atendente: </span>
          <span className="text-brand-dark font-black uppercase tracking-wide">{sale.attendant_name || 'Ana Silva'}</span>
        </div>
      </div>

      {/* Ações para o operador de caixa */}
      <div className="flex items-center gap-2 shrink-0 md:self-center border-t-2 border-brand-dark/10 pt-4 md:border-none md:pt-0">
        {/* Cancelar pedido */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onCancel(sale.id)}
          className="flex-1 md:flex-initial px-4 py-2 border-3 border-brand-dark text-brand-charcoal hover:bg-rose-100 hover:text-rose-700 font-black text-xs uppercase shadow-[2px_2px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(26,26,26,1)] cursor-pointer flex items-center justify-center gap-1.5"
          title="Cancelar pedido"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
          Cancelar
        </button>

        {/* Confirmar recebimento */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onConfirm(sale.id)}
          className="flex-1 md:flex-initial px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white border-3 border-brand-dark font-black text-xs uppercase shadow-[3px_3px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(26,26,26,1)] cursor-pointer flex items-center justify-center gap-1.5"
          title="Confirmar pagamento recebido"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          Confirmar Pagamento
        </button>
      </div>
    </div>
  );
}
