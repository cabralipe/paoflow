import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';
import { Coffee, Shield, Key, Mail, LogIn, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await authService.login(email, password);
      redirectUser(user.role);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na autenticacao. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role: string) => {
    if (role === 'attendant') {
      navigate('/venda');
    } else if (role === 'cashier') {
      navigate('/caixa');
    } else if (role === 'superadmin') {
      navigate('/configuracoes');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col justify-center items-center p-4 font-sans" id="login-container">
      <div className="w-full max-w-md bg-white border-4 border-brand-dark shadow-[6px_6px_0px_rgba(26,26,26,1)] p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="bg-brand-orange text-white p-4 border-4 border-brand-dark flex items-center justify-center shadow-[4px_4px_0px_rgba(26,26,26,1)]">
            <Coffee className="w-7 h-7 text-white stroke-[2.5]" />
          </div>
          <div className="mt-3">
            <h1 className="text-4xl font-black text-brand-dark tracking-tighter uppercase font-sans block leading-none">
              Pao<span className="text-brand-orange">Flow</span>
            </h1>
            <p className="text-brand-dark/60 text-[10px] font-black tracking-[0.2em] uppercase mt-2">
              venda rapida de paes em tempo real
            </p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="bg-[#FEF3C7] text-brand-dark p-4 border-3 border-brand-dark font-black text-xs leading-relaxed flex items-center gap-2 shadow-[2px_2px_0px_rgba(26,26,26,1)] uppercase">
            <AlertTriangle className="w-4 h-4 text-brand-orange shrink-0 stroke-[2.5]" />
            <span>Supabase nao configurado. Defina as variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500 text-white p-4 border-3 border-brand-dark font-black text-xs leading-relaxed flex items-center gap-2 shadow-[2px_2px_0px_rgba(26,26,26,1)]">
            <Shield className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
              E-mail corporativo
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-brand-dark/75 stroke-[2.5]" />
              <input
                type="email"
                placeholder="Ex: ana@padaria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange pl-11 pr-4 py-3 text-sm font-bold transition-all outline-hidden text-brand-dark focus:ring-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
              Senha de acesso
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-brand-dark/75 stroke-[2.5]" />
              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange pl-11 pr-4 py-3 text-sm font-bold transition-all outline-hidden text-brand-dark focus:ring-0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full py-3.5 mt-2 bg-brand-orange text-white font-black border-4 border-brand-dark cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0.5 shadow-[4px_4px_0px_rgba(26,26,26,1)] active:shadow-[1px_1px_0px_rgba(26,26,26,1)] uppercase text-xs tracking-wider transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            {loading ? 'Carregando...' : 'Entrar no Caixa'}
          </button>
        </form>
      </div>
    </div>
  );
}
