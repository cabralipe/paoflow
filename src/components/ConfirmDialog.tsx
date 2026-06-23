import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'success';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  onConfirm,
  onCancel,
  variant = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const themes = {
    danger: {
      iconColor: 'text-white bg-rose-500',
      btnStyle: 'bg-rose-500 hover:bg-rose-600 text-white border-3 border-brand-dark shadow-[3px_3px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-none'
    },
    warning: {
      iconColor: 'text-white bg-brand-orange',
      btnStyle: 'bg-brand-orange hover:bg-orange-600 text-white border-3 border-brand-dark shadow-[3px_3px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-none'
    },
    success: {
      iconColor: 'text-white bg-emerald-500',
      btnStyle: 'bg-emerald-500 hover:bg-emerald-600 text-white border-3 border-brand-dark shadow-[3px_3px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-none'
    }
  };

  const selectedTheme = themes[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/65 backdrop-blur-xs transition-opacity animate-fade-in" id="confirm-modal-portal">
      <div 
        className="bg-white border-4 border-brand-dark max-w-md w-full p-6 shadow-[6px_6px_0px_#1A1A1A] flex flex-col gap-4 transform transition-all scale-100 animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex gap-4 items-start">
          <div className={`p-3 border-3 border-brand-dark shrink-0 ${selectedTheme.iconColor} shadow-[2px_2px_0px_rgba(26,26,26,1)]`}>
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black text-brand-dark uppercase tracking-tight">
              {title}
            </h3>
            <p className="text-slate-600 text-[11px] font-bold mt-2.5 leading-relaxed uppercase tracking-wide">
              {message}
            </p>
          </div>
        </div>

        {/* Botões do rodapé */}
        <div className="flex gap-2.5 mt-2 border-t-3 border-brand-dark/10 pt-4 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border-3 border-brand-dark bg-white hover:bg-brand-cream text-brand-dark font-black text-xs uppercase shadow-[3px_3px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 font-black text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer ${selectedTheme.btnStyle}`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
