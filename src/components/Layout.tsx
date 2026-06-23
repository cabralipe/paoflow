import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';
import {
  LogOut,
  ShoppingBag,
  History,
  Settings,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Coffee,
  X,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<Profile | null>(authService.getCurrentUser());
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setUser(customEvent.detail?.user || null);
    };

    window.addEventListener('auth_state_change', handleAuthChange);
    return () => {
      window.removeEventListener('auth_state_change', handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const canSell = user?.role === 'attendant' || user?.role === 'admin';
  const canCashier = user?.role === 'cashier' || user?.role === 'admin';
  const canOperate = user?.role === 'attendant' || user?.role === 'cashier' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  const linkClass = (path: string) =>
    `px-3.5 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
      isActive(path)
        ? 'bg-brand-orange text-white border-brand-dark shadow-[2px_2px_0px_#1A1A1A]'
        : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'
    }`;

  const mobileLinkClass = (path: string) =>
    `flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
      isActive(path)
        ? 'text-brand-orange bg-brand-cream/60 font-black'
        : 'text-brand-dark font-black hover:text-brand-orange'
    }`;

  const roleLabel = () => {
    if (!user) return '';
    if (user.role === 'superadmin') return 'Superadmin';
    if (user.role === 'admin') return 'Administrador';
    if (user.role === 'cashier') return 'Operador de Caixa';
    return 'Atendente de Balcao';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-brand-charcoal flex flex-col font-sans selection:bg-brand-yellow selection:text-brand-dark" id="pao-layout-wrapper">
      {!isSupabaseConfigured && showWarning && (
        <div id="backend-banner" className="bg-brand-orange text-white px-4 py-2 text-xs md:text-sm font-bold flex items-center justify-between gap-2 shadow-sm uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Supabase nao configurado:</strong> defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para operar.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowWarning(false)}
            className="hover:bg-brand-dark p-1 rounded-full transition-colors"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-brand-dark text-white border-b-4 border-brand-orange shadow-md" id="pao-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-orange text-white p-2.5 rounded-lg flex items-center justify-center">
                <Coffee className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tighter text-white block uppercase">
                  PAO<span className="text-brand-orange">FLOW</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-[#A39E93] font-mono block -mt-1 font-bold">
                  pdv rapido padaria
                </span>
              </div>
            </div>

            {user && (
              <nav className="hidden md:flex items-center gap-2">
                {canSell && <Link to="/venda" className={linkClass('/venda')}>Venda Rapida</Link>}
                {canCashier && <Link to="/caixa" className={linkClass('/caixa')}>Fila do Caixa</Link>}
                {canOperate && <Link to="/historico" className={linkClass('/historico')}>Historico</Link>}
                {canCashier && <Link to="/fechar-caixa" className={linkClass('/fechar-caixa')}>Balanco / Fechar</Link>}
                {isAdmin && (
                  <>
                    <Link to="/dashboard" className={linkClass('/dashboard')}>Painel Geral</Link>
                    <Link to="/configuracoes" className={linkClass('/configuracoes')}>Ajustes</Link>
                  </>
                )}
                {isSuperAdmin && <Link to="/configuracoes" className={linkClass('/configuracoes')}>Padarias</Link>}
              </nav>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-sm font-black text-white block uppercase tracking-tight">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-[#2d2a26] bg-[#fef3c7] border-2 border-[#1a1a1a] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                    {roleLabel()}
                  </span>
                  {user.bakery?.name && (
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mt-1">{user.bakery.name}</span>
                  )}
                </div>
                <button
                  type="button"
                  id="btn-logout"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-brand-orange hover:bg-slate-800 rounded-lg transition-colors duration-200"
                  title="Sair do PaoFlow"
                >
                  <LogOut className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-400 font-mono">Nao autenticado</div>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-brand-dark flex justify-around items-center py-2 px-3 shadow-[0_-4px_0px_rgba(26,26,26,0.1)] select-none" id="mobile-nav">
          {canSell && (
            <Link to="/venda" className={mobileLinkClass('/venda')}>
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Venda</span>
            </Link>
          )}
          {canCashier && (
            <Link to="/caixa" className={mobileLinkClass('/caixa')}>
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Caixa</span>
            </Link>
          )}
          {canOperate && (
            <Link to="/historico" className={mobileLinkClass('/historico')}>
              <History className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Historico</span>
            </Link>
          )}
          {canCashier && (
            <Link to="/fechar-caixa" className={mobileLinkClass('/fechar-caixa')}>
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Balanco</span>
            </Link>
          )}
          {isAdmin && (
            <>
              <Link to="/dashboard" className={mobileLinkClass('/dashboard')}>
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Painel</span>
              </Link>
              <Link to="/configuracoes" className={mobileLinkClass('/configuracoes')}>
                <Settings className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Ajustes</span>
              </Link>
            </>
          )}
          {isSuperAdmin && (
            <Link to="/configuracoes" className={mobileLinkClass('/configuracoes')}>
              <Settings className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Padarias</span>
            </Link>
          )}
        </nav>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 mb-20 md:mb-8" id="main-content-area">
        {children}
      </main>

      <footer className="bg-brand-dark border-t-4 border-brand-orange py-6 text-center text-xs text-white mt-auto hidden md:block" id="pao-footer-info">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-slate-400 font-mono">
          <span>&copy; {new Date().getFullYear()} PAOFLOW - OPERACOES DE PADARIA EM NUVEM</span>
          <span className="flex items-center gap-2 text-[10px] text-white font-bold tracking-wider uppercase">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            isolamento multi-tenant ativo
          </span>
        </div>
      </footer>
    </div>
  );
}
