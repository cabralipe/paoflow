import React from 'react';
import { CashSession } from '../types';
import { Shield, Sparkles, Calendar, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeaderProps {
  title: string;
  subtitle?: string;
  session: CashSession | null;
  loadingSession?: boolean;
}

export default function Header({ title, subtitle, session, loadingSession }: HeaderProps) {
  const currentDate = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="bg-brand-dark text-white border-b-8 border-brand-orange p-6 md:p-7 mb-6 shadow-[5px_5px_0px_rgba(0,0,0,0.15)] flex flex-col md:flex-row md:items-center md:justify-between gap-5" id="pao-page-header">
      <div>
        <div className="flex items-center gap-2 text-xs text-brand-orange font-black uppercase tracking-[0.2em] font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{currentDate}</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tighter uppercase mt-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-300 text-xs md:text-sm mt-1.5 font-bold tracking-wide">
            {subtitle}
          </p>
        )}
      </div>

      {/* Seção do Caixa Diário Status com estilo brutalista */}
      <div className="flex items-center gap-3 shrink-0" id="cashier-session-badge">
        {loadingSession ? (
          <div className="h-12 w-48 bg-slate-800 animate-pulse border-2 border-brand-orange"></div>
        ) : session ? (
          <div className="flex items-center gap-2.5 bg-emerald-500 text-white border-3 border-brand-dark px-4.5 py-2.5 shadow-[3px_3px_0px_#000]">
            <Unlock className="w-4 h-4 text-white shrink-0 animate-bounce" />
            <div>
              <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest block leading-none">
                SESSÃO DO DIA ATIVA
              </span>
              <span className="text-xs font-black tracking-tight block mt-1 uppercase font-mono">
                CAIXA ABERTO • {format(new Date(session.opened_at), 'HH:mm')}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-rose-500 text-white border-3 border-brand-dark px-4.5 py-2.5 shadow-[3px_3px_0px_#000]">
            <Lock className="w-4 h-4 text-white shrink-0" />
            <div>
              <span className="text-[9px] font-black text-rose-105 uppercase tracking-widest block leading-none">
                SEM CAIXA ABERTO
              </span>
              <span className="text-xs font-black tracking-tight block mt-1 uppercase font-mono">
                CAIXA FECHADO
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
