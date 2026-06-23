import React from 'react';
import { formatCurrency } from '../utils/currency';
import { calculateTotal } from '../utils/calculations';
import { TrendingUp, ShoppingCart } from 'lucide-react';

interface SaleTotalProps {
  quantity: number;
  unitPrice: number;
}

export default function SaleTotal({ quantity, unitPrice }: SaleTotalProps) {
  const total = calculateTotal(quantity, unitPrice);

  return (
    <div className="bg-brand-dark text-white border-4 border-brand-dark p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)] flex items-center justify-between gap-4" id="pao-sale-total">
      <div className="flex items-center gap-3.5">
        <div className="bg-[#FEF3C7] text-brand-dark p-2.5 border-2 border-brand-dark font-black shrink-0">
          <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-brand-orange font-black block leading-none">
            RESUMO DO TICKET
          </span>
          <span className="text-slate-350 text-xs mt-1.5 block font-mono font-bold">
            {quantity} {quantity === 1 ? 'PÃO' : 'PÃES'} &times; {formatCurrency(unitPrice)}
          </span>
        </div>
      </div>

      <div className="text-right">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#A39E93] font-black block leading-none">
          VALOR TOTAL
        </span>
        <span className="text-3xl font-black text-[#FEF3C7] tracking-tight block mt-1 font-mono uppercase">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
