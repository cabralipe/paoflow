import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityButtonsProps {
  quantity: number;
  onChange: (qty: number) => void;
  quickQuantities: number[];
}

export default function QuantityButtons({ quantity, onChange, quickQuantities }: QuantityButtonsProps) {
  const handleIncrement = () => onChange(quantity + 1);
  const handleDecrement = () => {
    if (quantity > 0) onChange(quantity - 1);
  };

  // Botões de outras quantidades para cobrir o menu completo
  const extraQuantities = [1, 2, 3, 4, 6, 8, 15];

  return (
    <div className="flex flex-col gap-6" id="pao-quantity-selector">
      {/* Seletor com Botões Gigantes +/- */}
      <div className="bg-white border-4 text-center border-brand-dark p-6 flex flex-col items-center justify-center shadow-[5px_5px_0px_rgba(26,26,26,1)]">
        <span className="text-xs uppercase tracking-[0.2em] text-brand-dark/60 font-black block mb-2">
          QUANTIDADE SELECIONADA
        </span>
        
        <div className="flex items-center gap-6 md:gap-8 justify-center mt-2">
          {/* Botão Menos */}
          <button
            type="button"
            onClick={handleDecrement}
            className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-brand-cream border-4 border-brand-dark hover:bg-brand-gray transition-all font-black hover:-translate-y-0.5 active:translate-y-0.5 shadow-[4px_4px_0px_rgba(26,26,26,1)] active:shadow-[1px_1px_0px_rgba(26,26,26,1)] select-none text-brand-dark cursor-pointer"
          >
            <Minus className="w-8 h-8 pointer-events-none stroke-[3px]" />
          </button>

          {/* Valor Principal */}
          <div className="flex flex-col items-center min-w-[130px]">
            <span className="text-6xl md:text-7xl font-black text-brand-dark tracking-tight font-sans">
              {quantity}
            </span>
            <span className="text-xs font-black uppercase tracking-[0.25em] text-brand-orange mt-1">
               {quantity === 1 ? 'PÃO' : 'PÃES'}
            </span>
          </div>

          {/* Botão Mais */}
          <button
            type="button"
            onClick={handleIncrement}
            className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-brand-cream border-4 border-brand-dark hover:bg-brand-gray transition-all font-black hover:-translate-y-0.5 active:translate-y-0.5 shadow-[4px_4px_0px_rgba(26,26,26,1)] active:shadow-[1px_1px_0px_rgba(26,26,26,1)] select-none text-brand-dark cursor-pointer"
          >
            <Plus className="w-8 h-8 pointer-events-none stroke-[3px]" />
          </button>
        </div>
      </div>

      {/* Botões Rápidos Principais (Grandes) */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-brand-dark/70 font-black block mb-3">
          QUANTIDADES RÁPIDAS DO DIA (AJUSTÁVEIS)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickQuantities.map((qty) => (
            <button
              key={`quick-${qty}`}
              type="button"
              onClick={() => onChange(qty)}
              className={`py-4 border-4 transition-all flex flex-col items-center justify-center cursor-pointer ${
                quantity === qty
                  ? 'bg-brand-orange border-brand-dark text-white font-black shadow-[4px_4px_0px_rgba(26,26,26,1)] -translate-y-0.5'
                  : 'bg-white border-brand-dark hover:bg-brand-gray text-brand-dark font-black shadow-[2px_2px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-y-0.5'
              }`}
            >
              <span className="text-2xl font-black leading-none">{qty}</span>
              <span className="text-[10px] uppercase tracking-wider leading-none mt-1 font-black">
                {qty === 1 ? 'PÃO' : 'PÃES'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Outras Quantidades Comuns */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-brand-dark/70 font-black block mb-2.5">
          OUTRAS QUANTIDADES COMUNS
        </span>
        <div className="flex flex-wrap gap-2">
          {extraQuantities.map((qty) => (
            <button
              key={`extra-${qty}`}
              type="button"
              onClick={() => onChange(qty)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-3 transition-all cursor-pointer ${
                quantity === qty
                  ? 'bg-brand-dark border-brand-dark text-brand-yellow shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                  : 'bg-white border-brand-dark text-brand-dark hover:bg-brand-gray shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none'
              }`}
            >
              {qty} {qty === 1 ? 'pão' : 'pães'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
