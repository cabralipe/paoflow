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
  User,
  Coffee,
  X
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
    // Escuta mudanças de autenticação
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

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-brand-charcoal flex flex-col font-sans selection:bg-brand-yellow selection:text-brand-dark" id="pao-layout-wrapper">
      {/* Banner de Demonstração / Supabase Desconectado */}
      {!isSupabaseConfigured && showWarning && (
        <div id="demo-banner" className="bg-brand-orange text-white px-4 py-2 text-xs md:text-sm font-bold flex items-center justify-between gap-2 shadow-sm uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>MODO DE DEMONSTRAÇÃO (LOCAL):</strong> DADOS SALVOS NO NAVEGADOR. CONECTE O SUPABASE NO ENV PARA PRODUÇÃO.
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

      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-brand-dark text-white border-b-4 border-brand-orange shadow-md" id="pao-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-brand-orange text-white p-2.5 rounded-lg flex items-center justify-center">
                <Coffee className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tighter text-white block uppercase">
                  PÃO<span className="text-brand-orange">FLOW</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-[#A39E93] font-mono block -mt-1 font-bold">
                  pdv rápido padaria
                </span>
              </div>
            </div>

            {/* Menu Principal conforme Perfil */}
            {user && (
              <nav className="hidden md:flex items-center gap-2">
                {/* Atendente ou Admin */}
                {(user.role === 'attendant' || user.role === 'admin') && (
                  <Link
                    to="/venda"
                    className={`px-3.5 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      isActive('/venda')
                        ? 'bg-brand-orange text-white border-brand-dark shadow-[2px_2px_0px_#1A1A1A]'
                        : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Venda Rápida
                  </Link>
                )}

                {/* Caixa ou Admin */}
                {(user.role === 'cashier' || user.role === 'admin') && (
                  <Link
                    to="/caixa"
                    className={`px-3.5 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      isActive('/caixa')
                        ? 'bg-brand-orange text-white border-brand-dark shadow-[2px_2px_0px_#1A1A1A]'
                        : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Fila do Caixa
                  </Link>
                )}

                {/* Qualquer um com sessão ativa pode ver histórico */}
                <Link
                  to="/historico"
                  className={`px-3.5 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    isActive('/historico')
                      ? 'bg-brand-orange text-white border-brand-dark shadow-[2px_2px_0px_#1A1A1A]'
                      : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Histórico
                </Link>

                {/* Admin ou Caixa podem ver Fechamento */}
                {(user.role === 'cashier' || user.role === 'admin') && (
                  <Link
                    to="/fechar-caixa"
                    className={`px-3.5 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      isActive('/fechar-caixa')
                        ? 'bg-brand-orange text-white border-brand-dark shadow-[2px_2px_0px_#1A1A1A]'
                        : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Balanço / Fechar
                  </Link>
                )}

                {/* Apenas Admin */}
                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3.5 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        isActive('/dashboard')
                          ? 'bg-brand-orange text-white border-brand-dark shadow-[2px_2px_0px_#1A1A1A]'
                          : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Painel Geral
                    </Link>
                    <Link
                      to="/configuracoes"
                      className={`px-3.5 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        isActive('/configuracoes')
                          ? 'bg-brand-orange text-white border-brand-dark shadow-[2px_2px_0px_#1A1A1A]'
                          : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Ajustes
                    </Link>
                  </>
                )}
              </nav>
            )}

            {/* Usuário logado e Sair */}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-sm font-black text-white block uppercase tracking-tight">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-[#2d2a26] bg-[#fef3c7] border-2 border-[#1a1a1a] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                    {user.role === 'admin' && 'Administrador'}
                    {user.role === 'cashier' && 'Operador de Caixa'}
                    {user.role === 'attendant' && 'Atendente de Balcão'}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-logout"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-brand-orange hover:bg-slate-800 rounded-lg transition-colors duration-200"
                  title="Sair do PãoFlow"
                >
                  <LogOut className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-400 font-mono">Não Autenticado</div>
            )}
          </div>
        </div>
      </header>

      {/* Menu mobile flutuante inferior para facilitar o uso em telas touch */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-brand-dark flex justify-around items-center py-2 px-3 shadow-[0_-4px_0px_rgba(26,26,26,0.1)] select-none" id="mobile-nav">
          {/* Atendente ou Admin */}
          {(user.role === 'attendant' || user.role === 'admin') && (
            <Link
              to="/venda"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive('/venda') 
                  ? 'text-brand-orange bg-brand-cream/60 font-black' 
                  : 'text-brand-dark font-black hover:text-brand-orange'
              }`}
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Venda</span>
            </Link>
          )}

          {/* Caixa ou Admin */}
          {(user.role === 'cashier' || user.role === 'admin') && (
            <Link
              to="/caixa"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive('/caixa') 
                  ? 'text-brand-orange bg-brand-cream/60 font-black' 
                  : 'text-brand-dark font-black hover:text-brand-orange'
              }`}
            >
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Caixa</span>
            </Link>
          )}

          {/* Qualquer um pode ver histórico */}
          <Link
            to="/historico"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              isActive('/historico') 
                ? 'text-brand-orange bg-brand-cream/60 font-black' 
                : 'text-brand-dark font-black hover:text-brand-orange'
            }`}
          >
            <History className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Histórico</span>
          </Link>

          {/* Admin e Caixa */}
          {(user.role === 'cashier' || user.role === 'admin') && (
            <Link
              to="/fechar-caixa"
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive('/fechar-caixa') 
                  ? 'text-brand-orange bg-brand-cream/60 font-black' 
                  : 'text-brand-dark font-black hover:text-brand-orange'
              }`}
            >
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Balanço</span>
            </Link>
          )}

          {/* Apenas Admin */}
          {user.role === 'admin' && (
            <>
              <Link
                to="/dashboard"
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  isActive('/dashboard') 
                    ? 'text-brand-orange bg-brand-cream/60 font-black' 
                    : 'text-brand-dark font-black hover:text-brand-orange'
                }`}
              >
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Painel</span>
              </Link>
              <Link
                to="/configuracoes"
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  isActive('/configuracoes') 
                    ? 'text-brand-orange bg-brand-cream/60 font-black' 
                    : 'text-brand-dark font-black hover:text-brand-orange'
                }`}
              >
                <Settings className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[10px] uppercase font-mono tracking-tight leading-none">Ajustes</span>
              </Link>
            </>
          )}
        </nav>
      )}

      {/* Área do Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 mb-20 md:mb-8" id="main-content-area">
        {children}
      </main>

      {/* Rodapé simples decorativo com arquitetura limpa */}
      <footer className="bg-brand-dark border-t-4 border-brand-orange py-6 text-center text-xs text-white mt-auto hidden md:block" id="pao-footer-info">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-slate-400 font-mono">
          <span>&copy; {new Date().getFullYear()} PÃOFLOW • OPERAÇÕES DE PADARIA EM NUVEM</span>
          <span className="flex items-center gap-2 text-[10px] text-white font-bold tracking-wider uppercase">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            INTERFACE BOLD TYPOGRAPHY DE ALTA PERFORMANCE
          </span>
        </div>
      </footer>
    </div>
  );
}
