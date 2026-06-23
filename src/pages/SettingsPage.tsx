import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import BigButton from '../components/BigButton';
import { useCurrentCashSession } from '../hooks/useCurrentCashSession';
import { authService } from '../services/authService';
import { settingsService } from '../services/settingsService';
import { cashierService } from '../services/cashierService';
import { formatCurrency } from '../utils/currency';
import { Profile, BreadSettings, UserRole } from '../types';
import { 
  Settings, 
  Save, 
  Unlock, 
  Users, 
  Plus, 
  Check, 
  UserPlus, 
  Coins, 
  ShieldAlert,
  Sliders,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(authService.getCurrentUser());
  const { currentSession, refetch: refetchSession, loading: loadingSession } = useCurrentCashSession();

  // Estados locais : Configurações de Preço e presets
  const [breadName, setBreadName] = useState('Pão francês');
  const [unitPrice, setUnitPrice] = useState('0.80');
  const [quickQuantitiesStr, setQuickQuantitiesStr] = useState('5, 10, 12, 20');
  const [settings, setSettings] = useState<BreadSettings | null>(null);

  // Estados locais : Abertura de caixa
  const [openingBreads, setOpeningBreads] = useState('1000');
  const [openingNotes, setOpeningNotes] = useState('');

  // Estados locais : Gestão de Equipe (Perfis)
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRole, setNewProfileRole] = useState<UserRole>('attendant');

  // Estados de feedback
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Carregar configurações de preço
    const loadData = async () => {
      try {
        setLoading(true);
        const config = await settingsService.getSettings();
        setSettings(config);
        setBreadName(config.bread_name);
        setUnitPrice(config.unit_price.toFixed(2));
        setQuickQuantitiesStr(config.quick_quantities.join(', '));

        const team = await authService.getProfiles();
        setProfiles(team);
      } catch (e: any) {
        console.error(e);
        setErrorMsg('Erro ao carregar dados do banco.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      setErrorMsg('Valor do preço unitário não pode ser menor que zero.');
      return;
    }

    // Processa botões rápidos
    const qtys = quickQuantitiesStr
      .split(',')
      .map(part => parseInt(part.trim(), 10))
      .filter(num => !isNaN(num) && num > 0);

    if (qtys.length === 0) {
      setErrorMsg('Por favor, informe ao menos uma quantidade rápida separada de botões (Ex: 5, 10, 15).');
      return;
    }

    try {
      setLoading(true);
      const updated = await settingsService.saveSettings({
        ...settings,
        bread_name: breadName,
        unit_price: price,
        quick_quantities: qtys
      });
      setSettings(updated);
      setSuccessMsg('Configurações de preço e painel de botões atualizados com sucesso!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Falha ao gravar no banco.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const breadsCount = parseInt(openingBreads, 10);
    if (isNaN(breadsCount) || breadsCount < 0) {
      setErrorMsg('A quantidade inicial de pães em carga não pode ser negativa.');
      return;
    }

    try {
      setLoading(true);
      await cashierService.openSession(user.id, breadsCount, openingNotes);
      await refetchSession();
      setSuccessMsg(`Caixa do dia foi ABERTO com sucesso! Carga inicial de ${breadsCount} pães franceses registrada.`);
      setOpeningNotes('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Problema ao registrar abertura no caixa.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newProfileName.trim()) {
      setErrorMsg('Por favor, informe o nome do funcionário.');
      return;
    }

    try {
      setLoading(true);
      const newId = 'u-' + Math.random().toString(36).substring(2, 9);
      const added = await authService.saveProfile({
        id: newId,
        name: newProfileName,
        role: newProfileRole,
        active: true
      });

      setProfiles((prev) => [...prev, added]);
      setSuccessMsg(`O funcionário "${newProfileName}" foi adicionado com sucesso!`);
      setNewProfileName('');
    } catch (err: any) {
      setErrorMsg('Erro ao cadastrar funcionário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-5" id="pao-settings-view">
        <Header 
          title="Supervisão e Ajustes" 
          subtitle="Ajuste preços unitários, configure os botões rápidos de venda ou abra o caixa para novos registros de balcão."
          session={currentSession}
          loadingSession={loadingSession}
        />

        {/* Verificação Administrativa */}
        {user && user.role !== 'admin' && (
          <div className="bg-rose-500/10 border-4 border-brand-dark p-5 text-sm font-black text-rose-900 flex flex-col gap-2 shadow-[4px_4px_0px_rgba(26,26,26,1)] uppercase tracking-wide" id="admin-forbidden-alert">
            <div className="flex items-center gap-2 text-rose-950">
              <ShieldAlert className="w-5 h-5 text-rose-650 shrink-0 stroke-[2.5]" />
              <span>Acesso Restrito: Perfil Administrador Requerido</span>
            </div>
            <p className="text-slate-700 font-bold text-xs leading-relaxed uppercase tracking-wide">
              Você está visualizando a tela de supervisão. Somente usuários com privilégios de <strong>Administrador</strong> têm autonomia para abrir o caixa do dia, alterar parâmetros do pão ou gerenciar equipe.
            </p>
          </div>
        )}

        {/* Toasts */}
        {successMsg && (
          <div className="bg-emerald-500 text-white border-4 border-brand-dark p-4 font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="settings-success">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500 text-white border-4 border-brand-dark p-4 font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="settings-error">
            <AlertCircle className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bloqueia alterações se usuário não for admin */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-start ${user?.role !== 'admin' ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          
          {/* Lado Esquerdo - Abertura e Parâmetros */}
          <div className="flex flex-col gap-6">
            
            {/* 1. Formulário Abertura de Caixa */}
            <div className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
              <h3 className="text-base font-black text-brand-dark uppercase flex items-center gap-2.5 mb-4 border-b-4 border-brand-dark/10 pb-3">
                <Unlock className="w-5 h-5 text-brand-orange stroke-[2.5]" />
                Abertura de Caixa do Dia
              </h3>

              {currentSession ? (
                <div className="bg-[#FEF3C7] border-3 border-brand-dark p-4 text-xs font-black text-brand-dark leading-relaxed uppercase shadow-[2px_2px_0px_rgba(26,26,26,1)]">
                  O caixa diário está atualmente <strong>ABERTO</strong>. Uma nova carga de pães não pode ser iniciada até que o caixa ativo da sessão seja encerrado e salvo pelo operador correspondente na tela de balanço.
                </div>
              ) : (
                <form onSubmit={handleOpenCashier} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
                        Carga Inicial de Pães (Estoque)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={openingBreads}
                        onChange={(e) => setOpeningBreads(e.target.value)}
                        required
                        className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark focus:ring-0 uppercase"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
                        Operador Responsável
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user?.name.toUpperCase() || ''}
                        className="w-full bg-brand-cream border-3 border-brand-dark/30 text-brand-dark opacity-65 py-2.5 px-3.5 text-sm font-black outline-hidden uppercase"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">Observações Iniciais</label>
                    <textarea
                      placeholder="Ex: Pães francês de tamanho médio. Turno da manhã."
                      value={openingNotes}
                      onChange={(e) => setOpeningNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3.5 text-sm font-black outline-hidden text-brand-dark focus:ring-0"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 text-center font-black text-white bg-emerald-500 hover:bg-emerald-600 border-4 border-brand-dark shadow-[4px_4px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                  >
                    <Unlock className="w-4 h-4 stroke-[2.5]" />
                    {loading ? 'Gravando abertura...' : 'CONFIRMAR ABERTURA DO CAIXA'}
                  </button>
                </form>
              )}
            </div>

            {/* 2. Formulário Parâmetros do Pão Francês */}
            <div className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
              <h3 className="text-base font-black text-brand-dark uppercase flex items-center gap-2.5 mb-4 border-b-4 border-brand-dark/10 pb-3">
                <Sliders className="w-5 h-5 text-brand-orange stroke-[2.5]" />
                Parâmetros e Preço do Pão
              </h3>

              <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">Identificação</label>
                    <input
                      type="text"
                      value={breadName}
                      onChange={(e) => setBreadName(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark focus:ring-0 uppercase"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">Preço Unitário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark focus:ring-0 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
                    Presets de Quantidades Rápidas (Separados por Vírgula)
                  </label>
                  <input
                    type="text"
                    value={quickQuantitiesStr}
                    onChange={(e) => setQuickQuantitiesStr(e.target.value)}
                    required
                    className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark focus:ring-0"
                  />
                  <p className="text-[10px] text-brand-dark/65 font-bold uppercase tracking-wide">Esses valores serão renderizados em formato de botões grandes na tela de venda do balcão.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-center font-black text-white bg-brand-orange hover:bg-orange-600 border-4 border-brand-dark shadow-[4px_4px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  {loading ? 'Salvando...' : 'GRAVAR PARÂMETROS'}
                </button>
              </form>
            </div>

          </div>

          {/* Lado Direito - Gestão de Colaboradores */}
          <div className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
            <h3 className="text-base font-black text-brand-dark uppercase flex items-center gap-2.5 mb-4 border-b-4 border-brand-dark/10 pb-3">
              <Users className="w-5 h-5 text-brand-orange stroke-[2.5]" />
              Gestão de Colaboradores (Equipe)
            </h3>

            {/* Cadastro de funcionário rápido */}
            <form onSubmit={handleCreateProfile} className="flex flex-col gap-3 py-4 px-4 bg-brand-cream border-3 border-brand-dark shadow-[3px_3px_0px_rgba(26,26,26,1)]">
              <span className="text-xs font-extrabold text-[#78350F] uppercase tracking-wider block mb-1">Cadastrar Novo Operador</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome do funcionário"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3 text-xs font-black block uppercase outline-hidden focus:ring-0"
                />
                <select
                  value={newProfileRole}
                  onChange={(e) => setNewProfileRole(e.target.value as UserRole)}
                  className="bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3 text-xs font-black block uppercase outline-hidden focus:ring-0 cursor-pointer"
                >
                  <option value="attendant">Atendente Balcão</option>
                  <option value="cashier">Operador Caixa</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button
                type="submit"
                className="py-3 bg-brand-orange text-white font-black border-3 border-brand-dark shadow-[3px_3px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-y-0.5 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                Adicionar e Cadastrar Equipe
              </button>
            </form>

            {/* Tabela de equipe cadastrada */}
            <div className="py-4 mt-4">
              <span className="text-brand-dark text-xs font-black uppercase tracking-wider block mb-3 pb-1.5 border-b-4 border-brand-cream">Funcionários Ativos</span>
              <div className="flex flex-col gap-3">
                {profiles.map((profile) => (
                  <div key={profile.id} className="p-3 bg-brand-cream border-3 border-brand-dark flex items-center justify-between gap-3 text-xs shadow-[2px_2px_0px_rgba(26,26,26,1)] font-black uppercase">
                    <div>
                      <span className="font-extrabold text-brand-dark block truncate leading-none">
                        {profile.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-[#A39E93] font-mono mt-1.5 block leading-none">
                        {profile.role === 'admin' ? 'Administrador' : (profile.role === 'cashier' ? 'Operador Caixa' : 'Atendente Balcão')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-500/20 border-2 border-brand-dark px-2.5 py-1">Ativo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
