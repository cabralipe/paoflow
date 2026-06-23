import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useCurrentCashSession } from '../hooks/useCurrentCashSession';
import { authService } from '../services/authService';
import { bakeryService } from '../services/bakeryService';
import { settingsService } from '../services/settingsService';
import { cashierService } from '../services/cashierService';
import { formatCurrency } from '../utils/currency';
import { Bakery, BreadSettings, Profile, UserRole } from '../types';
import {
  AlertCircle,
  Building2,
  Check,
  Coins,
  Save,
  ShieldAlert,
  Sliders,
  Unlock,
  UserPlus,
  Users,
} from 'lucide-react';

type StaffRole = Exclude<UserRole, 'superadmin'>;

const staffRoleLabel = (role: UserRole) => {
  if (role === 'superadmin') return 'Superadmin';
  if (role === 'admin') return 'Administrador';
  if (role === 'cashier') return 'Operador Caixa';
  return 'Atendente Balcao';
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user] = useState<Profile | null>(authService.getCurrentUser());
  const { currentSession, refetch: refetchSession, loading: loadingSession } = useCurrentCashSession();

  const [settings, setSettings] = useState<BreadSettings | null>(null);
  const [breadName, setBreadName] = useState('Pao frances');
  const [unitPrice, setUnitPrice] = useState('0.80');
  const [quickQuantitiesStr, setQuickQuantitiesStr] = useState('5, 10, 12, 20');
  const [openingBreads, setOpeningBreads] = useState('1000');
  const [openingNotes, setOpeningNotes] = useState('');

  const [bakeries, setBakeries] = useState<Bakery[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newBakeryName, setNewBakeryName] = useState('');
  const [newBakerySlug, setNewBakerySlug] = useState('');

  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [newProfileRole, setNewProfileRole] = useState<StaffRole>('attendant');
  const [newProfileBakeryId, setNewProfileBakeryId] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'superadmin';
  const isBakeryAdmin = user?.role === 'admin';
  const canManage = isSuperAdmin || isBakeryAdmin;

  const profileRoleOptions = useMemo<StaffRole[]>(() => {
    return isSuperAdmin ? ['admin', 'cashier', 'attendant'] : ['cashier', 'attendant'];
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const [team, bakeryRows] = await Promise.all([
          authService.getProfiles(),
          authService.getBakeriesForCurrentUser(),
        ]);
        setProfiles(team);
        setBakeries(bakeryRows);

        const defaultBakeryId = user.bakery_id || bakeryRows[0]?.id || '';
        setNewProfileBakeryId(defaultBakeryId);

        if (isBakeryAdmin) {
          const config = await settingsService.getSettings();
          setSettings(config);
          setBreadName(config.bread_name);
          setUnitPrice(Number(config.unit_price).toFixed(2));
          setQuickQuantitiesStr(config.quick_quantities.join(', '));
        }
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e.message || 'Erro ao carregar dados do banco.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate, isBakeryAdmin]);

  const resetFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCreateBakery = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (!newBakeryName.trim()) {
      setErrorMsg('Informe o nome da padaria.');
      return;
    }

    try {
      setLoading(true);
      const created = await bakeryService.create({ name: newBakeryName, slug: newBakerySlug });
      setBakeries((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewProfileBakeryId(created.id);
      setNewBakeryName('');
      setNewBakerySlug('');
      setSuccessMsg(`Padaria "${created.name}" cadastrada com sucesso.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar padaria.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    const targetBakeryId = isBakeryAdmin ? user?.bakery_id : newProfileBakeryId;
    if (!targetBakeryId) {
      setErrorMsg('Selecione uma padaria para vincular este usuario.');
      return;
    }

    if (!newProfileName.trim() || !newProfileEmail.trim() || !newProfilePassword.trim()) {
      setErrorMsg('Preencha nome, e-mail e senha inicial.');
      return;
    }

    if (newProfilePassword.length < 6) {
      setErrorMsg('A senha inicial precisa ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const added = await authService.createProfile({
        name: newProfileName.trim(),
        email: newProfileEmail.trim(),
        password: newProfilePassword,
        role: newProfileRole,
        bakery_id: targetBakeryId,
      });

      setProfiles((prev) => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)));
      setSuccessMsg(`Usuario "${added.name}" cadastrado com login real.`);
      setNewProfileName('');
      setNewProfileEmail('');
      setNewProfilePassword('');
      setNewProfileRole(profileRoleOptions[0]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    resetFeedback();

    const price = parseFloat(unitPrice);
    if (Number.isNaN(price) || price <= 0) {
      setErrorMsg('Valor unitario deve ser maior que zero.');
      return;
    }

    const quickQuantities = quickQuantitiesStr
      .split(',')
      .map((part) => parseInt(part.trim(), 10))
      .filter((num) => !Number.isNaN(num) && num > 0);

    if (quickQuantities.length === 0) {
      setErrorMsg('Informe ao menos uma quantidade rapida.');
      return;
    }

    try {
      setLoading(true);
      const updated = await settingsService.saveSettings({
        ...settings,
        bread_name: breadName,
        unit_price: price,
        quick_quantities: quickQuantities,
      });
      setSettings(updated);
      setSuccessMsg(`Parametros atualizados. Preco atual: ${formatCurrency(price)}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao gravar parametros.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    resetFeedback();

    const breadsCount = parseInt(openingBreads, 10);
    if (Number.isNaN(breadsCount) || breadsCount < 0) {
      setErrorMsg('A quantidade inicial nao pode ser negativa.');
      return;
    }

    try {
      setLoading(true);
      await cashierService.openSession(user.id, breadsCount, openingNotes);
      await refetchSession();
      setSuccessMsg(`Caixa aberto com carga inicial de ${breadsCount} paes.`);
      setOpeningNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Problema ao registrar abertura no caixa.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="flex flex-col gap-5" id="pao-settings-view">
        <Header
          title={isSuperAdmin ? 'Gestao Global de Padarias' : 'Supervisao e Ajustes'}
          subtitle={isSuperAdmin ? 'Cadastre padarias e vincule administradores a cada operacao isolada.' : 'Ajuste parametros da sua padaria, abra caixa e gerencie operadores.'}
          session={currentSession}
          loadingSession={loadingSession}
        />

        {!canManage && (
          <div className="bg-rose-500/10 border-4 border-brand-dark p-5 text-sm font-black text-rose-900 flex flex-col gap-2 shadow-[4px_4px_0px_rgba(26,26,26,1)] uppercase tracking-wide">
            <div className="flex items-center gap-2 text-rose-950">
              <ShieldAlert className="w-5 h-5 text-rose-650 shrink-0 stroke-[2.5]" />
              <span>Acesso restrito</span>
            </div>
            <p className="text-slate-700 font-bold text-xs leading-relaxed uppercase tracking-wide">
              Somente administradores da padaria ou superadmin podem acessar esta tela.
            </p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500 text-white border-4 border-brand-dark p-4 font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_rgba(26,26,26,1)] flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500 text-white border-4 border-brand-dark p-4 font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
            <AlertCircle className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuperAdmin && (
          <section className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
            <h3 className="text-base font-black text-brand-dark uppercase flex items-center gap-2.5 mb-4 border-b-4 border-brand-dark/10 pb-3">
              <Building2 className="w-5 h-5 text-brand-orange stroke-[2.5]" />
              Padarias cadastradas
            </h3>

            <form onSubmit={handleCreateBakery} className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 mb-5">
              <input
                type="text"
                placeholder="Nome da padaria"
                value={newBakeryName}
                onChange={(e) => setNewBakeryName(e.target.value)}
                className="bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark"
              />
              <input
                type="text"
                placeholder="slug opcional"
                value={newBakerySlug}
                onChange={(e) => setNewBakerySlug(e.target.value)}
                className="bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark"
              />
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-5 bg-brand-orange text-white font-black border-3 border-brand-dark shadow-[3px_3px_0px_rgba(26,26,26,1)] text-xs uppercase tracking-wider disabled:opacity-60"
              >
                Cadastrar
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {bakeries.map((bakery) => (
                <div key={bakery.id} className="p-4 bg-brand-cream border-3 border-brand-dark shadow-[2px_2px_0px_rgba(26,26,26,1)]">
                  <span className="block text-sm font-black uppercase text-brand-dark">{bakery.name}</span>
                  <span className="block text-[10px] font-mono uppercase text-brand-dark/60 mt-1">{bakery.slug}</span>
                  <span className={`inline-block mt-3 text-[9px] font-black uppercase tracking-wider border-2 border-brand-dark px-2.5 py-1 ${bakery.active ? 'bg-emerald-500/20 text-emerald-800' : 'bg-rose-500/20 text-rose-800'}`}>
                    {bakery.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className={`grid grid-cols-1 ${isSuperAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6 items-start`}>
          {!isSuperAdmin && (
            <div className="flex flex-col gap-6">
              <section className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
                <h3 className="text-base font-black text-brand-dark uppercase flex items-center gap-2.5 mb-4 border-b-4 border-brand-dark/10 pb-3">
                  <Unlock className="w-5 h-5 text-brand-orange stroke-[2.5]" />
                  Abertura de Caixa do Dia
                </h3>

                {currentSession ? (
                  <div className="bg-[#FEF3C7] border-3 border-brand-dark p-4 text-xs font-black text-brand-dark leading-relaxed uppercase shadow-[2px_2px_0px_rgba(26,26,26,1)]">
                    O caixa diario da sua padaria esta aberto. Feche o caixa atual antes de iniciar uma nova carga.
                  </div>
                ) : (
                  <form onSubmit={handleOpenCashier} className="flex flex-col gap-4">
                    <input
                      type="number"
                      min="0"
                      value={openingBreads}
                      onChange={(e) => setOpeningBreads(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark"
                    />
                    <textarea
                      placeholder="Observacoes iniciais"
                      value={openingNotes}
                      onChange={(e) => setOpeningNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3.5 text-sm font-black outline-hidden text-brand-dark"
                    />
                    <button type="submit" disabled={loading} className="w-full py-4 font-black text-white bg-emerald-500 hover:bg-emerald-600 border-4 border-brand-dark shadow-[4px_4px_0px_rgba(26,26,26,1)] uppercase tracking-wide text-xs disabled:opacity-60">
                      Confirmar abertura do caixa
                    </button>
                  </form>
                )}
              </section>

              <section className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
                <h3 className="text-base font-black text-brand-dark uppercase flex items-center gap-2.5 mb-4 border-b-4 border-brand-dark/10 pb-3">
                  <Sliders className="w-5 h-5 text-brand-orange stroke-[2.5]" />
                  Parametros e Preco do Pao
                </h3>

                <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
                  <input
                    type="text"
                    value={breadName}
                    onChange={(e) => setBreadName(e.target.value)}
                    required
                    className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark uppercase"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark font-mono"
                    />
                    <input
                      type="text"
                      value={quickQuantitiesStr}
                      onChange={(e) => setQuickQuantitiesStr(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2.5 px-3.5 text-sm font-black outline-hidden text-brand-dark"
                    />
                  </div>
                  <button type="submit" disabled={loading || !settings} className="w-full py-4 font-black text-white bg-brand-orange hover:bg-orange-600 border-4 border-brand-dark shadow-[4px_4px_0px_rgba(26,26,26,1)] uppercase tracking-wide text-xs disabled:opacity-60">
                    <Save className="inline w-4 h-4 mr-2 stroke-[2.5]" />
                    Gravar parametros
                  </button>
                </form>
              </section>
            </div>
          )}

          <section className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
            <h3 className="text-base font-black text-brand-dark uppercase flex items-center gap-2.5 mb-4 border-b-4 border-brand-dark/10 pb-3">
              <Users className="w-5 h-5 text-brand-orange stroke-[2.5]" />
              Gestao de usuarios
            </h3>

            <form onSubmit={handleCreateProfile} className="flex flex-col gap-3 py-4 px-4 bg-brand-cream border-3 border-brand-dark shadow-[3px_3px_0px_rgba(26,26,26,1)]">
              <span className="text-xs font-extrabold text-[#78350F] uppercase tracking-wider block mb-1">Cadastrar usuario com login</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Nome" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} className="bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3 text-xs font-black uppercase outline-hidden" />
                <input type="email" placeholder="E-mail" value={newProfileEmail} onChange={(e) => setNewProfileEmail(e.target.value)} className="bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3 text-xs font-black outline-hidden" />
                <input type="password" placeholder="Senha inicial" value={newProfilePassword} onChange={(e) => setNewProfilePassword(e.target.value)} className="bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3 text-xs font-black outline-hidden" />
                <select value={newProfileRole} onChange={(e) => setNewProfileRole(e.target.value as StaffRole)} className="bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3 text-xs font-black uppercase outline-hidden cursor-pointer">
                  {profileRoleOptions.map((role) => (
                    <option key={role} value={role}>{staffRoleLabel(role)}</option>
                  ))}
                </select>
                {isSuperAdmin && (
                  <select value={newProfileBakeryId} onChange={(e) => setNewProfileBakeryId(e.target.value)} className="md:col-span-2 bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3 text-xs font-black uppercase outline-hidden cursor-pointer">
                    <option value="">Selecione a padaria</option>
                    {bakeries.map((bakery) => (
                      <option key={bakery.id} value={bakery.id}>{bakery.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <button type="submit" disabled={loading} className="py-3 bg-brand-orange text-white font-black border-3 border-brand-dark shadow-[3px_3px_0px_rgba(26,26,26,1)] text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:opacity-60">
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                Cadastrar usuario
              </button>
            </form>

            <div className="py-4 mt-4">
              <span className="text-brand-dark text-xs font-black uppercase tracking-wider block mb-3 pb-1.5 border-b-4 border-brand-cream">Usuarios ativos</span>
              <div className="flex flex-col gap-3">
                {profiles.map((profile) => (
                  <div key={profile.id} className="p-3 bg-brand-cream border-3 border-brand-dark flex items-center justify-between gap-3 text-xs shadow-[2px_2px_0px_rgba(26,26,26,1)] font-black uppercase">
                    <div>
                      <span className="font-extrabold text-brand-dark block truncate leading-none">{profile.name}</span>
                      <span className="text-[9px] uppercase tracking-widest text-[#A39E93] font-mono mt-1.5 block leading-none">
                        {staffRoleLabel(profile.role)}
                        {profile.bakery?.name ? ` - ${profile.bakery.name}` : ''}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider border-2 border-brand-dark px-2.5 py-1 ${profile.active ? 'text-emerald-800 bg-emerald-500/20' : 'text-rose-800 bg-rose-500/20'}`}>
                      {profile.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {!isSuperAdmin && (
          <div className="bg-white border-4 border-brand-dark p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] text-xs font-black text-brand-dark uppercase flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand-orange" />
            Os dados desta tela sao filtrados por padaria via RLS e tambem gravados com bakery_id.
          </div>
        )}
      </div>
    </Layout>
  );
}
