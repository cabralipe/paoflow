import React from 'react';
import { MostOrderedQuantity } from '../types';
import { Flame } from 'lucide-react';

interface MostOrderedButtonsProps {
  mostOrdered: MostOrderedQuantity[];
  onSelect: (qty: number) => void;
  currentSelect?: number;
}

export default function MostOrderedButtons({ mostOrdered, onSelect, currentSelect }: MostOrderedButtonsProps) {
  return (
    <div id="pao-most-ordered-panel" className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs text-brand-dark/70 font-black uppercase tracking-[0.15em] mb-2">
        <Flame className="w-4 h-4 text-brand-orange stroke-[2.5]" />
        <span>MAIS PEDIDOS DO BALCAO HOJE</span>
      </div>

      {mostOrdered.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-brand-dark p-4 text-center text-xs font-black uppercase text-brand-dark/60">
          Ainda nao ha historico real de pedidos nesta sessao.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {mostOrdered.map((item) => (
            <button
              key={`most-ordered-${item.quantity}`}
              type="button"
              onClick={() => onSelect(item.quantity)}
              className={`py-4 border-4 font-black transition-all flex flex-col items-center justify-center cursor-pointer ${
                currentSelect === item.quantity
                  ? 'bg-brand-orange border-brand-dark text-white shadow-[4px_4px_0px_rgba(26,26,26,1)] -translate-y-0.5'
                  : 'bg-white border-brand-dark text-brand-dark hover:bg-brand-gray shadow-[2px_2px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-y-0.5'
              }`}
            >
              <span className="text-2xl font-black leading-none">{item.quantity}</span>
              <span className="text-[10px] mt-1 uppercase font-black tracking-widest leading-none">
                {item.quantity === 1 ? 'PAO' : 'PAES'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
