import React from 'react';
import { SaleStatus } from '../types';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: SaleStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    waiting_payment: {
      label: 'FILA (AGUARDANDO)',
      style: 'bg-brand-yellow text-brand-dark border-2 border-brand-dark',
      icon: Clock
    },
    paid: {
      label: 'PAGO (CONFIRMADO)',
      style: 'bg-emerald-500 text-white border-2 border-brand-dark',
      icon: CheckCircle
    },
    cancelled: {
      label: 'CANCELADO',
      style: 'bg-rose-500 text-white border-2 border-brand-dark',
      icon: XCircle
    }
  };

  const config = configs[status] || configs.waiting_payment;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider ${config.style}`}>
      <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
      {config.label}
    </span>
  );
}
