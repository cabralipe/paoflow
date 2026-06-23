import React from 'react';
import { PaymentMethod } from '../types';
import { QrCode, Coins, CreditCard, Notebook } from 'lucide-react';

interface PaymentButtonsProps {
  selectedMethod: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentButtons({ selectedMethod, onChange }: PaymentButtonsProps) {
  const methods = [
    {
      id: 'pix' as PaymentMethod,
      label: 'PIX',
      activeColor: 'bg-cyan-500 text-white',
      icon: QrCode,
      description: 'PIX IMEDIATO'
    },
    {
      id: 'cash' as PaymentMethod,
      label: 'DINHEIRO',
      activeColor: 'bg-emerald-500 text-white',
      icon: Coins,
      description: 'TROCO NO CAIXA'
    },
    {
      id: 'card' as PaymentMethod,
      label: 'CARTÃO',
      activeColor: 'bg-blue-500 text-white',
      icon: CreditCard,
      description: 'DÉBITO / CRÉDITO'
    },
    {
      id: 'credit' as PaymentMethod,
      label: 'FIADO',
      activeColor: 'bg-brand-orange text-white',
      icon: Notebook,
      description: 'CADERNETA DIGITAL'
    }
  ];

  return (
    <div className="flex flex-col gap-3" id="pao-payment-selector">
      <span className="text-xs uppercase tracking-[0.2em] text-brand-dark/70 font-black block mb-1">
        FORMA DE PAGAMENTO INFORMADA
      </span>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`p-4 rounded-none border-4 border-brand-dark transition-all flex flex-col items-center text-center justify-center gap-2 cursor-pointer ${
                isSelected
                  ? `${method.activeColor} shadow-[4px_4px_0px_rgba(26,26,26,1)] -translate-y-0.5`
                  : 'bg-white text-brand-dark hover:bg-slate-50 shadow-[2px_2px_0px_rgba(26,26,26,1)]'
              }`}
            >
              <div className={`p-2 border-2 border-brand-dark ${isSelected ? 'bg-brand-dark text-white' : 'bg-brand-cream text-brand-dark'}`}>
                <Icon className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-sm block leading-none tracking-wider uppercase font-sans">
                  {method.label}
                </span>
                <span className={`text-[9px] font-bold block mt-1 tracking-wide ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {method.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
